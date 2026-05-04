import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";

const router = Router();
const controller = new UserController();

router.get("/profile", authMiddleware, controller.getProfile.bind(controller));
router.put("/profile", authMiddleware, controller.updateProfile.bind(controller));

export default router;
