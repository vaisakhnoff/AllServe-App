import { Router, RequestHandler } from "express";
import { ProviderController } from "../../controllers/provider/provider.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createProviderRouter(controller: ProviderController): Router {
  const router = Router();

  // ── Public ──────────────────────────────────────────────────────────────────
  router.get("/", controller.getPublicProviders.bind(controller));
  router.get("/locations/suggestions", controller.getLocationSuggestions.bind(controller));

  // ── Apply / reapply ─────────────────────────────────────────────────────────
  router.post(
    "/apply",
    authMiddleware, authorize(Role.PROVIDER),
    requireProviderStatus(ApplicationStatus.NOT_APPLIED),
    controller.applyProvider.bind(controller)
  );

  router.get(
    "/application-status",
    authMiddleware, authorize(Role.PROVIDER),
    requireProviderStatus(
      ApplicationStatus.NOT_APPLIED, ApplicationStatus.PENDING,
      ApplicationStatus.APPROVED, ApplicationStatus.REJECTED,
      ApplicationStatus.SUSPENDED
    ),
    controller.getApplicationStatus.bind(controller)
  );

  router.put(
    "/reapply",
    authMiddleware, authorize(Role.PROVIDER),
    requireProviderStatus(ApplicationStatus.REJECTED),
    controller.reapplyProvider.bind(controller)
  );

  // ── Approved provider only ───────────────────────────────────────────────────
  const approvedGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  router.get("/profile",          ...approvedGuard, controller.getProfile.bind(controller));
  router.put("/profile",          ...approvedGuard, controller.updateProfile.bind(controller));
  router.post("/profile/password",...approvedGuard, controller.changePassword.bind(controller));
  router.get("/dashboard",        ...approvedGuard, controller.getDashboard.bind(controller));

  // ── Public single provider (MUST be last — catches /:id) ──────────────────
  router.get("/:id", controller.getPublicProviderById.bind(controller));

  return router;
}
