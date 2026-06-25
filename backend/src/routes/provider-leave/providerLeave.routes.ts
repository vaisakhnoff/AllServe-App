import { Router, RequestHandler } from "express";
import { ProviderLeaveController } from "../../controllers/provider-leave/providerLeave.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createProviderLeaveRouter(controller: ProviderLeaveController): Router {
  const router = Router();

  const approvedGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  router.get("/", ...approvedGuard, controller.getLeaves.bind(controller));
  router.post("/", ...approvedGuard, controller.addLeave.bind(controller));
  router.delete("/:date", ...approvedGuard, controller.cancelLeave.bind(controller));

  return router;
}
