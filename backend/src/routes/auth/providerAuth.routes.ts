import { Router } from "express";
import { ProviderAuthController } from "../../controllers/auth/providerAuth.controller";

export function createProviderAuthRouter(controller: ProviderAuthController): Router {
  const router = Router();

  router.post("/signup",          controller.signup.bind(controller));
  router.post("/login",           controller.login.bind(controller));
  router.post("/verify-otp",      controller.verifyOtp.bind(controller));
  router.post("/resend-otp",      controller.resendOtp.bind(controller));
  router.post("/forgot-password", controller.forgotPassword.bind(controller));
  router.post("/reset-password",  controller.resetPassword.bind(controller));
  router.post("/refresh-token",   controller.refreshToken.bind(controller));
  router.post("/logout",          controller.logout.bind(controller));

  return router;
}
