import { Router, RequestHandler } from "express";
import { AdminController } from "../../controllers/admin/admin.controller";
import { ServiceController } from "../../controllers/service/service.controller";
import { BookingController } from "../../controllers/booking/booking.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { Role } from "../../shared/enums/role.enum";

export function createAdminRouter(
  controller: AdminController,
  serviceController: ServiceController,
  bookingController: BookingController
): Router {
  const router = Router();

  // All admin routes require auth + ADMIN role
  router.use(authMiddleware as RequestHandler);
  router.use(authorize(Role.ADMIN) as RequestHandler);

  // ── Dashboard ────────────────────────────────────────────────────────────────
  router.get("/dashboard", controller.getDashboardStats.bind(controller));

  // ── Users ────────────────────────────────────────────────────────────────────
  router.get("/users",                controller.getUsers.bind(controller));
  router.patch("/users/:id/block",    controller.blockUser.bind(controller));
  router.patch("/users/:id/unblock",  controller.unblockUser.bind(controller));

  // ── Providers ────────────────────────────────────────────────────────────────
  router.get("/providers",                    controller.getProviders.bind(controller));
  router.patch("/providers/:id/block",        controller.blockProvider.bind(controller));
  router.patch("/providers/:id/unblock",      controller.unblockProvider.bind(controller));

  // ── Provider Applications ────────────────────────────────────────────────────
  router.get("/provider-applications",                  controller.getApplications.bind(controller));
  router.patch("/provider-applications/:id/approve",    controller.approveProvider.bind(controller));
  router.patch("/provider-applications/:id/reject",     controller.rejectProvider.bind(controller));

  // ── Services ─────────────────────────────────────────────────────────────────
  router.get("/services",                  serviceController.adminList.bind(serviceController));
  router.patch("/services/:id/block",      serviceController.adminBlock.bind(serviceController));
  router.patch("/services/:id/unblock",    serviceController.adminUnblock.bind(serviceController));

  // ── Bookings ─────────────────────────────────────────────────────────────────
  router.get("/bookings", bookingController.adminGetAll.bind(bookingController));

  return router;
}
