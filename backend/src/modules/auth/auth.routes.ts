import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/signup", controller.signup.bind(controller));
router.post("/login", controller.login.bind(controller));

export default router;