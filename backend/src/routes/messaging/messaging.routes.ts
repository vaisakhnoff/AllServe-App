import { Router } from "express";
import { MessagingController } from "../../controllers/messaging/messaging.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";

export function createMessagingRouter(controller: MessagingController): Router {
  const router = Router();

  router.post("/conversations",                   authMiddleware, controller.getOrCreate.bind(controller));
  router.get("/conversations",                    authMiddleware, controller.getConversations.bind(controller));
  router.get("/conversations/:id/messages",       authMiddleware, controller.getMessages.bind(controller));
  router.post("/conversations/:id/messages",      authMiddleware, controller.sendMessage.bind(controller));
  router.patch("/conversations/:id/read",         authMiddleware, controller.markRead.bind(controller));
  router.get("/unread",                           authMiddleware, controller.getUnreadCount.bind(controller));

  return router;
}
