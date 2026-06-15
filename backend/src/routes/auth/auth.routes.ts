import { Router } from "express";
import passport from "passport";
import { AuthController } from "../../controllers/auth/auth.controller";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/signup",          controller.signup.bind(controller));
  router.post("/login",           controller.login.bind(controller));
  router.post("/admin/login",     controller.adminLogin.bind(controller));

  router.post("/verify-otp",      controller.verifyOtp.bind(controller));
  router.post("/resend-otp",      controller.resendOtp.bind(controller));
  router.post("/forgot-password", controller.forgotPassword.bind(controller));
  router.post("/reset-password",  controller.resetPassword.bind(controller));

  router.post("/refresh-token",   controller.refreshToken.bind(controller));
  router.post("/logout",          controller.logout.bind(controller));

  router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    controller.googleCallback.bind(controller)
  );

  return router;
}
