import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../../interfaces/admin/IAdminService";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { adminQuerySchema, rejectProviderSchema } from "../../dto/admin/admin.dto";

export class AdminController {
  constructor(private readonly service: IAdminService) {}

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.service.getDashboardStats();
      sendSuccess(res, stats, Messages.DASHBOARD_STATS_FETCHED);
    } catch (err) { next(err); }
  }

  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = adminQuerySchema.parse(req.query);
      const applications = await this.service.viewApplications(status);
      sendSuccess(res, applications, Messages.APPLICATIONS_FETCHED);
    } catch (err) { next(err); }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status } = adminQuerySchema.parse(req.query);
      const users = await this.service.viewUsers(search, status);
      sendSuccess(res, users, Messages.USERS_FETCHED);
    } catch (err) { next(err); }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.blockUser(req.params.id as string);
      sendSuccess(res, user, Messages.USER_BLOCKED);
    } catch (err) { next(err); }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.unblockUser(req.params.id as string);
      sendSuccess(res, user, Messages.USER_UNBLOCKED);
    } catch (err) { next(err); }
  }

  async blockProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await this.service.blockProvider(req.params.id as string);
      sendSuccess(res, provider, Messages.PROVIDER_BLOCKED);
    } catch (err) { next(err); }
  }

  async unblockProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await this.service.unblockProvider(req.params.id as string);
      sendSuccess(res, provider, Messages.PROVIDER_UNBLOCKED);
    } catch (err) { next(err); }
  }

  async approveProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await this.service.approveProvider(req.params.id as string);
      sendSuccess(res, application, Messages.PROVIDER_APPROVED);
    } catch (err) { next(err); }
  }

  async rejectProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { reasonCode, adminRemarks } = rejectProviderSchema.parse(req.body);
      const application = await this.service.rejectProvider(req.params.id as string, reasonCode, adminRemarks);
      sendSuccess(res, application, Messages.PROVIDER_REJECTED);
    } catch (err) { next(err); }
  }

  async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status } = adminQuerySchema.parse(req.query);
      const providers = await this.service.viewProviders(search, status);
      sendSuccess(res, providers, Messages.PROVIDERS_FETCHED);
    } catch (err) { next(err); }
  }
}
