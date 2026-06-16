import { Response, NextFunction } from "express";
import { IUserService } from "../../interfaces/user/IUserService";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { updateProfileSchema, addressSchema, changePasswordSchema } from "../../dto/user/user.dto";
import { uploadImageToCloudinary } from "../../shared/cloudinary";

export class UserController {
  constructor(private readonly service: IUserService) {}

  async   getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await this.service.getProfile(req.user!.id);
      sendSuccess(res, user, Messages.PROFILE_FETCHED);
    } catch (err) { next(err); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateProfileSchema.parse(req.body);
      const user = await this.service.updateProfile(req.user!.id, dto);
      sendSuccess(res, user, Messages.PROFILE_UPDATED);
    } catch (err) { next(err); }
  }

  async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = addressSchema.parse(req.body);
      const addresses = await this.service.addAddress(req.user!.id, dto);
      sendSuccess(res, addresses, Messages.ADDRESS_ADDED);
    } catch (err) { next(err); }
  }

  async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = addressSchema.parse(req.body);
      const addresses = await this.service.updateAddress(req.user!.id, req.params.id as string, dto);
      sendSuccess(res, addresses, Messages.ADDRESS_UPDATED);
    } catch (err) { next(err); }
  }

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await this.service.deleteAddress(req.user!.id, req.params.id as string);
      sendSuccess(res, addresses, Messages.ADDRESS_DELETED);
    } catch (err) { next(err); }
  }

  async setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await this.service.setDefaultAddress(req.user!.id, req.params.id as string);
      sendSuccess(res, addresses, Messages.DEFAULT_ADDRESS_UPDATED);
    } catch (err) { next(err); }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = changePasswordSchema.parse(req.body);
      const result = await this.service.changePassword(req.user!.id, dto);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async sendPhoneOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const result = await this.service.sendPhoneOtp(req.user!.id, phone);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async verifyPhoneOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, otp } = req.body;
      const user = await this.service.verifyPhoneOtp(req.user!.id, phone, otp);
      sendSuccess(res, user, Messages.PHONE_VERIFIED_UPDATED);
    } catch (err) { next(err); }
  }

  async sendPasswordOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await this.service.sendPasswordOtp(req.user!.id);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async verifyPasswordOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { otp, newPassword } = req.body;
      const result = await this.service.verifyPasswordOtp(req.user!.id, otp, newPassword);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async sendEmailOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await this.service.sendEmailOtp(req.user!.id, email);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async verifyEmailOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const user = await this.service.verifyEmailOtp(req.user!.id, email, otp);
      sendSuccess(res, user, Messages.EMAIL_VERIFIED_UPDATED);
    } catch (err) { next(err); }
  }

  async uploadProfileImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return sendSuccess(res, null, Messages.NO_IMAGE_PROVIDED, 400);
      }

      const result = await uploadImageToCloudinary(file, "allserve/profile-images");
      const user = await this.service.updateProfile(req.user!.id, { profileImage: result.secure_url });
      sendSuccess(res, user, Messages.PROFILE_UPDATED);
    } catch (err) { next(err); }
  }
}
