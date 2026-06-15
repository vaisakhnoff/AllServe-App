import { Router } from "express";
import multer from "multer";
import { UserController } from "../../controllers/user/user.controller";
import { authMiddleware } from "../../shared/middleware/authMiddleware";

const upload = multer({ storage: multer.memoryStorage() });

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  router.get("/profile",                       authMiddleware, controller.getProfile.bind(controller));
  router.put("/profile",                       authMiddleware, controller.updateProfile.bind(controller));

  router.post("/profile/address",              authMiddleware, controller.addAddress.bind(controller));
  router.put("/profile/address/:id",           authMiddleware, controller.updateAddress.bind(controller));
  router.delete("/profile/address/:id",        authMiddleware, controller.deleteAddress.bind(controller));
  router.patch("/profile/address/:id/default", authMiddleware, controller.setDefaultAddress.bind(controller));

  router.post("/profile/password",             authMiddleware, controller.changePassword.bind(controller));
  router.post("/profile/password/send-otp",    authMiddleware, controller.sendPasswordOtp.bind(controller));
  router.post("/profile/password/verify-otp",  authMiddleware, controller.verifyPasswordOtp.bind(controller));

  router.post("/profile/phone/send-otp",       authMiddleware, controller.sendPhoneOtp.bind(controller));
  router.post("/profile/phone/verify-otp",     authMiddleware, controller.verifyPhoneOtp.bind(controller));

  router.post("/profile/email/send-otp",       authMiddleware, controller.sendEmailOtp.bind(controller));
  router.post("/profile/email/verify-otp",     authMiddleware, controller.verifyEmailOtp.bind(controller));
  router.post("/profile/image",                authMiddleware, upload.single("image"), controller.uploadProfileImage.bind(controller));

  return router;
}
