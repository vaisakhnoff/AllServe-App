import { Router, RequestHandler } from "express";
import { QuotationController } from "../../controllers/quotation/quotation.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createQuotationRouter(controller: QuotationController): Router {
  const router = Router();

  const userGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.USER) as RequestHandler,
  ];

  const providerGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  const authGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
  ];

  // ── Provider: Submit and revise ─────────────────────────────────────────────
  router.post("/", ...providerGuard, controller.submit.bind(controller));
  router.put("/:id/revise", ...providerGuard, controller.revise.bind(controller));
  router.get("/my", ...providerGuard, controller.getMyQuotations.bind(controller));

  // ── Customer: Accept, reject, request modification ──────────────────────────
  router.patch("/:id/accept", ...userGuard, controller.accept.bind(controller));
  router.patch("/:id/reject", ...userGuard, controller.reject.bind(controller));
  router.patch("/:id/request-modification", ...userGuard, controller.requestModification.bind(controller));

  // ── Shared: Get quotations for an order ─────────────────────────────────────
  router.get("/order/:orderId", ...authGuard, controller.getForOrder.bind(controller));

  return router;
}
