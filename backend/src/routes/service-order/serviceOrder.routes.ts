import { Router, RequestHandler } from "express";
import { ServiceOrderController } from "../../controllers/service-order/serviceOrder.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createServiceOrderRouter(controller: ServiceOrderController): Router {
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

  // ── Customer: Create orders ─────────────────────────────────────────────────
  router.post("/direct/instant", ...userGuard, controller.createDirectInstant.bind(controller));
  router.post("/direct/scheduled", ...userGuard, controller.createDirectScheduled.bind(controller));
  router.post("/inspection", ...userGuard, controller.createInspection.bind(controller));
  router.post("/custom", ...userGuard, controller.createCustom.bind(controller));

  // ── Provider: Accept / Reject ───────────────────────────────────────────────
  router.patch("/:id/accept", ...providerGuard, controller.acceptOrder.bind(controller));
  router.patch("/:id/reject", ...providerGuard, controller.rejectOrder.bind(controller));

  router.patch("/:id/start", ...providerGuard, controller.startWork.bind(controller));
  router.patch("/:id/complete", ...providerGuard, controller.completeWork.bind(controller));

  // ── Inspection Lifecycle (Provider) ─────────────────────────────────────────
  router.patch("/:id/inspection/accept", ...providerGuard, controller.acceptInspection.bind(controller));
  router.patch("/:id/inspection/reject", ...providerGuard, controller.rejectInspection.bind(controller));
  router.patch("/:id/inspection/done", ...providerGuard, controller.markInspectionDone.bind(controller));
  router.patch("/:id/inspection/start", ...providerGuard, controller.inspectionStartWork.bind(controller));
  router.patch("/:id/inspection/complete", ...providerGuard, controller.inspectionCompleteWork.bind(controller));
  router.patch("/:id/drop/provider", ...providerGuard, controller.dropByProvider.bind(controller));

  // ── Inspection Lifecycle (Customer) ─────────────────────────────────────────
  router.patch("/:id/drop/customer", ...userGuard, controller.dropByCustomer.bind(controller));

  // ── Customer: Choice after rejection/timeout ────────────────────────────────
  router.patch("/:id/customer-choice", ...userGuard, controller.customerChoice.bind(controller));

  // ── Customer: My orders ─────────────────────────────────────────────────────
  router.get("/my", ...userGuard, controller.getMyOrders.bind(controller));

  // ── Provider: My orders ─────────────────────────────────────────────────────
  router.get("/provider", ...providerGuard, controller.getProviderOrders.bind(controller));

  // ── Shared: Get by ID / Cancel ──────────────────────────────────────────────
  router.get("/:id", ...authGuard, controller.getOrderById.bind(controller));
  router.patch("/:id/cancel", ...userGuard, controller.cancelOrder.bind(controller));

  // ── Custom Order Lifecycle ───────────────────────────────────────────────────
  router.patch("/:id/custom/accept", ...providerGuard, controller.acceptCustomOrder.bind(controller));
  router.patch("/:id/custom/reject", ...providerGuard, controller.rejectCustomOrder.bind(controller));
  router.patch("/:id/custom/start", ...providerGuard, controller.startWork.bind(controller));
  router.patch("/:id/custom/complete", ...providerGuard, controller.completeWork.bind(controller));
  router.patch("/:id/custom/drop/provider", ...providerGuard, controller.dropCustomByProvider.bind(controller));
  router.patch("/:id/custom/drop/customer", ...userGuard, controller.dropCustomByCustomer.bind(controller));

  return router;
}
