import { Router, RequestHandler } from "express";
import { ServiceController } from "../../controllers/service/service.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { createApprovedProviderMiddleware } from "../../shared/middleware/approvedProviderMiddleware";
import { Role } from "../../shared/enums/role.enum";

export function createServiceRouter(controller: ServiceController): Router {
  const router = Router();

  // The approvedProviderMiddleware populates req.providerAccount (needed by controller.create)
  const approvedProviderMiddleware = createApprovedProviderMiddleware();

  // ── Public browse (no auth) ───────────────────────────────────────────────────
  router.get("/public",     controller.publicList.bind(controller));
  router.get("/public/:id", controller.publicGetOne.bind(controller));

  // ── Provider scope (auth + approved) ─────────────────────────────────────────
  router.use(authMiddleware as RequestHandler);
  router.use(authorize(Role.PROVIDER) as RequestHandler);
  router.use(approvedProviderMiddleware as RequestHandler);

  router.post("/",                controller.create.bind(controller));
  router.get("/",                 controller.getAll.bind(controller));
  router.get("/:id",              controller.getOne.bind(controller));
  router.put("/:id",              controller.update.bind(controller));
  router.delete("/:id",           controller.delete.bind(controller));
  router.patch("/:id/activate",   controller.activate.bind(controller));
  router.patch("/:id/deactivate", controller.deactivate.bind(controller));

  return router;
}
