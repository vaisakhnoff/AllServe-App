import { Router, RequestHandler } from "express";
import { ProviderScheduleController } from "../../controllers/provider-schedule/providerSchedule.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createProviderScheduleRouter(controller: ProviderScheduleController): Router {
  const router = Router();

  const approvedGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  // Provider manages their own schedule
  router.get("/", ...approvedGuard, controller.getSchedule.bind(controller));
  router.put("/", ...approvedGuard, controller.upsertSchedule.bind(controller));

  // Public: get available windows for any provider (customers use this)
  router.get("/:id/available-windows", controller.getAvailableWindows.bind(controller));

  return router;
}
