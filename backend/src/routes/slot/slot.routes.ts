import { Router, RequestHandler } from "express";
import { SlotController } from "../../controllers/slot/slot.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";
import { requireProviderStatus } from "../../shared/middleware/providerStatusMiddleware";
import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";

export function createSlotRouter(controller: SlotController): Router {
  const router = Router();

  const providerGuard: RequestHandler[] = [
    authMiddleware as RequestHandler,
    authorize(Role.PROVIDER) as RequestHandler,
    requireProviderStatus(ApplicationStatus.APPROVED) as RequestHandler,
  ];

  // ── Public ───────────────────────────────────────────────────────────────────
  router.get("/provider/:providerId/available", controller.getAvailable.bind(controller));

  // ── User: lock / unlock / book ───────────────────────────────────────────────
  router.post("/:id/lock",   authMiddleware, authorize(Role.USER), controller.lock.bind(controller));
  router.post("/:id/unlock", authMiddleware, authorize(Role.USER), controller.unlock.bind(controller));
  router.post("/:id/book",   authMiddleware, authorize(Role.USER), controller.book.bind(controller));

  // ── Provider: CRUD + bulk + recurring + block ────────────────────────────────
  router.post("/",              ...providerGuard, controller.create.bind(controller));
  router.post("/bulk",          ...providerGuard, controller.bulkCreate.bind(controller));
  router.post("/recurring",     ...providerGuard, controller.createRecurring.bind(controller));
  router.post("/block-range",   ...providerGuard, controller.blockRange.bind(controller));
  router.get("/my",             ...providerGuard, controller.getMySlots.bind(controller));
  router.get("/stats",          ...providerGuard, controller.getStats.bind(controller));
  router.put("/:id",            ...providerGuard, controller.update.bind(controller));
  router.delete("/:id",         ...providerGuard, controller.delete.bind(controller));

  return router;
}
