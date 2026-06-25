import { Router, RequestHandler } from "express";
import { ProviderStatusController } from "../../controllers/provider-status/providerStatus.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createProviderStatusRouter(controller: ProviderStatusController): Router {
  const router = Router();

  const approvedGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  router.get("/", ...approvedGuard, controller.getStatus.bind(controller));
  router.patch("/online", ...approvedGuard, controller.toggleOnline.bind(controller));

  return router;
}
