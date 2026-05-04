import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";
import { authorize } from "../../shared/middleware/roleMiddleware";

const router = Router();
const controller = new AdminController();

router.use(authMiddleware);
router.use(authorize(["admin"]));

router.get("/applications", controller.getApplications.bind(controller));
router.put("/approve/:id", controller.approveProvider.bind(controller));

export default router;
