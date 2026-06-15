import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../shared/enums/role.enum";
import { logger } from "../shared/logger/logger";
import { IMessagingService } from "../interfaces/messaging/IMessagingService";
import { IConversationRepository } from "../interfaces/messaging/IMessagingRepository";
import { SenderRole } from "../dto/messaging/messaging.dto";

type AuthenticatedSocket = Socket & {
  data: {
    userId: string;
    userRole: SenderRole;
  };
};

type AuthTokenPayload = {
  id?: string;
  role?: string;
};

const onlineUsers = new Map<string, Set<string>>(); // userId -> socketIds

function addOnlineSocket(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
  return sockets.size;
}

function removeOnlineSocket(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return 0;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
  return sockets.size;
}

function getUserSockets(userId: string) {
  return onlineUsers.get(userId);
}

function toSenderRole(role?: string): SenderRole | null {
  if (role === Role.PROVIDER) return "provider";
  if (role === Role.USER) return "user";
  return null;
}

export function setupSocket(
  httpServer: HttpServer,
  messagingService: IMessagingService,
  conversationRepo: IConversationRepository
): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL || "http://localhost:3000", ...(env.CORS_ORIGINS?.split(",") ?? [])].filter(Boolean),
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
      const userRole = toSenderRole(decoded.role);
      if (!decoded.id || !userRole) return next(new Error("Invalid token payload"));
      socket.data.userId = decoded.id;
      socket.data.userRole = userRole;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const { userId, userRole } = socket.data;
    const activeSocketCount = addOnlineSocket(userId, socket.id);
    if (activeSocketCount === 1) io.emit("user:online", { userId });

    socket.on("conversation:join", (conversationId: string) => {
      if (!conversationId) return;
      socket.join(`conv:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      if (!conversationId) return;
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("message:send", async (data: { conversationId: string; content: string }) => {
      try {
        if (!data?.conversationId || !data.content?.trim()) {
          socket.emit("message:error", { message: "Conversation and message content are required" });
          return;
        }
        const msg = await messagingService.sendMessage(data.conversationId, userId, userRole, data.content);
        io.to(`conv:${data.conversationId}`).emit("message:new", msg);

        const conv = await conversationRepo.findById(data.conversationId);
        if (conv) {
          const recipientId = userRole === "user" ? String(conv.providerId) : String(conv.userId);
          const recipientSockets = getUserSockets(recipientId);
          if (recipientSockets) {
            for (const recipientSocket of recipientSockets) {
              io.to(recipientSocket).emit("message:notification", { conversationId: data.conversationId, message: msg });
            }
          }
        }
      } catch (error) {
        logger.error("Socket message send failed", { userId, error });
        socket.emit("message:error", { message: "Unable to send message" });
      }
    });

    socket.on("message:read", async (conversationId: string) => {
      try {
        if (!conversationId) return;
        await messagingService.markRead(conversationId, userId, userRole);
        socket.to(`conv:${conversationId}`).emit("message:read", { conversationId, readBy: userId });
      } catch (error) {
        logger.error("Socket mark read failed", { userId, conversationId, error });
        socket.emit("message:error", { message: "Unable to mark messages as read" });
      }
    });

    socket.on("typing:start", (conversationId: string) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId, conversationId });
    });

    socket.on("typing:stop", (conversationId: string) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit("typing:stop", { userId, conversationId });
    });

    socket.on("disconnect", () => {
      const remainingCount = removeOnlineSocket(userId, socket.id);
      if (remainingCount === 0) io.emit("user:offline", { userId });
    });
  });

  return io;
}
