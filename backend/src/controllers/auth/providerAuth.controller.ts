import { Request, Response, NextFunction } from "express";
import { IProviderAuthService } from "../../interfaces/auth/IProviderAuthService";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";
import {
  providerSignupSchema,
  providerLoginSchema,
  providerVerifyOtpSchema,
  providerResendOtpSchema,
  providerForgotPasswordSchema,
  providerResetPasswordSchema,
  providerRefreshTokenSchema,
} from "../../dto/provider/providerAuth.dto";

export class ProviderAuthController {
  constructor(private readonly service: IProviderAuthService) {}

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = providerSignupSchema.parse(req.body);
      const result = await this.service.signup(dto);
      sendSuccess(res, result, Messages.PROVIDER_SIGNUP_SUCCESS, StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = providerLoginSchema.parse(req.body);
      const result = await this.service.login(dto);
      sendSuccess(res, result, Messages.PROVIDER_LOGIN_SUCCESS);
    } catch (err) { next(err); }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = providerVerifyOtpSchema.parse(req.body);
      const result = await this.service.verifyOtp(email, otp);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = providerResendOtpSchema.parse(req.body);
      const result = await this.service.resendOtp(email);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = providerForgotPasswordSchema.parse(req.body);
      const result = await this.service.forgotPassword(email);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = providerResetPasswordSchema.parse(req.body);
      const result = await this.service.resetPassword(email, otp, newPassword);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = providerRefreshTokenSchema.parse(req.body);
      const result = await this.service.refreshToken(token);
      sendSuccess(res, result, Messages.TOKEN_REFRESHED);
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = providerRefreshTokenSchema.parse(req.body);
      await this.service.logout(token);
      sendSuccess(res, null, Messages.LOGOUT_SUCCESS);
    } catch (err) { next(err); }
  }
}
