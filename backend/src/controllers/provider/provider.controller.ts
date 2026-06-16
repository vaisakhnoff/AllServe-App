import { Request, Response, NextFunction } from "express";
import { IProviderService } from "../../interfaces/provider/IProviderService";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { applyProviderSchema, updateProviderProfileSchema, providerQuerySchema } from "../../dto/provider/provider.dto";
import { BadRequestError } from "../../shared/errors/HttpErrors";
import { z } from "zod";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export class ProviderController {
  constructor(
    private readonly service: IProviderService
  ) { }

  async getPublicProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const query = providerQuerySchema.parse(req.query);
      const providers = await this.service.getPublicProviders(query);
      sendSuccess(res, providers, Messages.PROVIDERS_FETCHED);
    } catch (err) { next(err); }
  }

  async getPublicProviderById(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await this.service.getPublicProviderById(req.params.id as string);
      sendSuccess(res, provider, Messages.PROVIDER_FETCHED);
    } catch (err) { next(err); }
  }

  async applyProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = applyProviderSchema.parse(req.body);
      const application = await this.service.applyProvider(req.user!.id, dto);
      sendSuccess(res, application, Messages.APPLICATION_SUBMITTED, StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async getApplicationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = await this.service.getApplicationStatus(req.user!.id);
      sendSuccess(res, status, Messages.APPLICATION_STATUS_FETCHED);
    } catch (err) { next(err); }
  }

  async requestStatusOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) throw new BadRequestError("Email is required");
      const result = await this.service.requestApplicationStatusOtp(email);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }

  async verifyStatusOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new BadRequestError("Email and OTP are required");
      const status = await this.service.verifyApplicationStatusOtp(email, otp);
      sendSuccess(res, status, Messages.APPLICATION_STATUS_FETCHED_SUCCESS);
    } catch (err) { next(err); }
  }

  async reapplyProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = applyProviderSchema.parse(req.body);
      const application = await this.service.reapplyProvider(req.user!.id, dto);
      sendSuccess(res, application, Messages.APPLICATION_RESUBMITTED);
    } catch (err) { next(err); }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await this.service.getProfile(req.user!.id);
      sendSuccess(res, profile, Messages.PROVIDER_PROFILE_FETCHED);
    } catch (err) { next(err); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateProviderProfileSchema.parse(req.body);
      const profile = await this.service.updateProfile(req.user!.id, dto);
      sendSuccess(res, profile, Messages.PROVIDER_PROFILE_UPDATED);
    } catch (err) { next(err); }
  }

  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await this.service.getDashboard(req.user!.id);
      sendSuccess(res, dashboard, Messages.PROVIDER_DASHBOARD_FETCHED);
    } catch (err) { next(err); }
  }

  async getLocationSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ((req.query.q as string) || "").trim();
      if (!q) { sendSuccess(res, []); return; }
      const suggestions = await (this.service as unknown as { getLocationSuggestions(q: string): Promise<string[]> }).getLocationSuggestions(q);
      sendSuccess(res, suggestions, Messages.LOCATION_SUGGESTIONS);
    } catch (err) { next(err); }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
      const result = await (this.service as unknown as { changePassword(id: string, old: string, n: string): Promise<{ message: string }> }).changePassword(req.user!.id, oldPassword, newPassword);
      sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  }
}
