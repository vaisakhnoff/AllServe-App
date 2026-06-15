import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../../interfaces/auth/IAuthService";
import { signupSchema, loginSchema } from "../../dto/auth/auth.dto";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { env } from "../../config/env";
import { Role } from "../../shared/enums/role.enum";

export class AuthController {
  constructor(private readonly service: IAuthService) {}

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = signupSchema.parse(req.body);
      const result = await this.service.signup(dto);
      sendSuccess(res, result, Messages.USER_CREATED, StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.service.login(dto, false, Role.USER);
      sendSuccess(res, result, Messages.LOGIN_SUCCESS);
    } catch (err) { next(err); }
  }

  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.service.login(dto, false, Role.ADMIN);
      sendSuccess(res, result, Messages.LOGIN_SUCCESS);
    } catch (err) { next(err); }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await this.service.verifyOtp(email, otp);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone } = req.body;
      const result = await this.service.resendOtp(email, phone);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword(email);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await this.service.resetPassword(email, otp, newPassword);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await this.service.refreshToken(token);
      sendSuccess(res, result, Messages.TOKEN_REFRESHED);
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      await this.service.logout(token);
      sendSuccess(res, null, Messages.LOGOUT_SUCCESS);
    } catch (err) { next(err); }
  }

  async googleCallback(req: Request, res: Response, _next: NextFunction) {
    try {
      if (!req.user) {
        return res.redirect(`${env.FRONTEND_URL}/login?oauthError=${Messages.AUTH_FAILED}`);
      }
      const user = req.user as unknown as { email: string };
      const result = await this.service.login({ email: user.email, password: "" }, true, Role.USER);
      res.redirect(`${env.FRONTEND_URL}/google-callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AuthenticationFailed";
      const code = message === Messages.CROSS_PLATFORM_LOGIN_BLOCKED ? Messages.WRONG_PLATFORM : Messages.AUTH_FAILED;
      res.redirect(`${env.FRONTEND_URL}/login?oauthError=${code}`);
    }
  }
}
