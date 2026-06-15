import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./shared/logger/logger";
import { connectDB } from "./database/db";
import { setupSocket } from "./socket/socket";
import { messagingService, conversationRepository } from "./di";

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    setupSocket(server, messagingService, conversationRepository);

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });

    // ── Global Error Handlers ─────────────────────────────────────────────────

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled Promise Rejection", { reason });
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error("Server failed to start", { error });
    process.exit(1);
  }
};

startServer();
