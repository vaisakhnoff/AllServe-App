import { Router } from "express";
import { ServiceRequestController } from "../../controllers/service-request/serviceRequest.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { Role } from "../../shared/enums/role.enum";

export function createServiceRequestRouter(controller: ServiceRequestController): Router {
  const router = Router();

  // ── User routes ──────────────────────────────────────────────────────────────
  router.post("/",           authMiddleware, authorize(Role.USER),     controller.create.bind(controller));
  router.get("/my",          authMiddleware, authorize(Role.USER),     controller.getMyRequests.bind(controller));
  router.get("/stats",       authMiddleware, authorize(Role.USER),     controller.getStats.bind(controller));
  router.get("/:id",         authMiddleware,                           controller.getById.bind(controller));
  router.patch("/:id/cancel",authMiddleware, authorize(Role.USER),     controller.cancel.bind(controller));

  // ── Provider routes ──────────────────────────────────────────────────────────
  router.get("/provider/browse", authMiddleware, authorize(Role.PROVIDER), controller.browse.bind(controller));

  return router;
}
