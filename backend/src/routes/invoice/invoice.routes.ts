import { Router, RequestHandler } from "express";
import { InvoiceController } from "../../controllers/invoice/invoice.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createInvoiceRouter(controller: InvoiceController): Router {
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

  // ── Provider: Generate invoice and mark cash ────────────────────────────────
  router.post("/", ...providerGuard, controller.generate.bind(controller));
  router.patch("/:id/mark-cash", ...providerGuard, controller.markCash.bind(controller));

  // ── Customer: Pay online ────────────────────────────────────────────────────
  router.patch("/:id/pay-online", ...userGuard, controller.payOnline.bind(controller));

  // ── Provider: Get pre-fill data from accepted quotation ──────────────────────
  router.get("/prefill/:orderId", ...providerGuard, controller.getPrefill.bind(controller));

  // ── Shared: Get invoice by order ────────────────────────────────────────────
  router.get("/order/:orderId", ...authGuard, controller.getByOrder.bind(controller));

  return router;
}
