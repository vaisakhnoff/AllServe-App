import { Router } from "express";
import { ProviderController } from "./provider.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";

const router = Router();
const controller = new ProviderController();

router.post("/apply", authMiddleware, controller.applyProvider.bind(controller));

export default router;
