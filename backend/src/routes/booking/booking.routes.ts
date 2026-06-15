import { Router, RequestHandler } from "express";
import { BookingController } from "../../controllers/booking/booking.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createBookingRouter(controller: BookingController): Router {
  const router = Router();

  const approvedProviderGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  // ── User routes ──────────────────────────────────────────────────────────────
  router.post("/",                authMiddleware, authorize(Role.USER), controller.create.bind(controller));
  router.get("/my",               authMiddleware, authorize(Role.USER), controller.getMyBookings.bind(controller));
  router.patch("/:id/reschedule", authMiddleware, authorize(Role.USER), controller.reschedule.bind(controller));
  router.patch("/:id/cancel",     authMiddleware,                       controller.cancel.bind(controller));

  // ── Provider routes ──────────────────────────────────────────────────────────
  router.get("/provider/list", ...approvedProviderGuard, controller.getProviderBookings.bind(controller));
  router.patch("/:id/status",  ...approvedProviderGuard, controller.updateStatus.bind(controller));

  // ── Shared (auth required, any role) — MUST come after specific paths ────────
  router.get("/:id", authMiddleware, controller.getById.bind(controller));

  return router;
}
