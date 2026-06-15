import { Router } from "express";
import { ProviderQuoteController } from "../../controllers/provider-quote/providerQuote.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { Role } from "../../shared/enums/role.enum";

export function createProviderQuoteRouter(controller: ProviderQuoteController): Router {
  const router = Router();

  // ── Provider routes ──────────────────────────────────────────────────────────
  router.post("/",              authMiddleware, authorize(Role.PROVIDER), controller.submit.bind(controller));
  router.get("/my",             authMiddleware, authorize(Role.PROVIDER), controller.getMyQuotes.bind(controller));
  router.get("/stats",          authMiddleware, authorize(Role.PROVIDER), controller.getProviderStats.bind(controller));
  router.patch("/:id",          authMiddleware, authorize(Role.PROVIDER), controller.update.bind(controller));
  router.patch("/:id/withdraw", authMiddleware, authorize(Role.PROVIDER), controller.withdraw.bind(controller));

  // ── User routes ──────────────────────────────────────────────────────────────
  router.get("/request/:requestId", authMiddleware, authorize(Role.USER), controller.getForRequest.bind(controller));
  router.patch("/:id/accept",       authMiddleware, authorize(Role.USER), controller.accept.bind(controller));

  return router;
}
