import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../../interfaces/admin/IAdminService";
import { sendSuccess } from "../../shared/utils/response";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "blocked", "pending", "approved", "rejected"]).optional(),
});

export class AdminController {
  constructor(private readonly service: IAdminService) {}

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.service.getDashboardStats();
      sendSuccess(res, stats, "Dashboard stats fetched successfully");
    } catch (err) { next(err); }
  }

  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = querySchema.parse(req.query);
      const applications = await this.service.viewApplications(status);
      sendSuccess(res, applications, "Applications fetched successfully");
    } catch (err) { next(err); }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status } = querySchema.parse(req.query);
      const users = await this.service.viewUsers(search, status);
      sendSuccess(res, users, "Users fetched successfully");
    } catch (err) { next(err); }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.blockUser(req.params.id as string);
      sendSuccess(res, user, "User blocked successfully");
    } catch (err) { next(err); }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.unblockUser(req.params.id as string);
      sendSuccess(res, user, "User unblocked successfully");
    } catch (err) { next(err); }
  }

  async blockProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await this.service.blockProvider(req.params.id as string);
      sendSuccess(res, provider, "Provider blocked successfully");
    } catch (err) { next(err); }
  }

  async unblockProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await this.service.unblockProvider(req.params.id as string);
      sendSuccess(res, provider, "Provider unblocked successfully");
    } catch (err) { next(err); }
  }

  async approveProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await this.service.approveProvider(req.params.id as string);
      sendSuccess(res, application, "Provider approved successfully");
    } catch (err) { next(err); }
  }

  async rejectProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { reasonCode, adminRemarks } = req.body;
      const application = await this.service.rejectProvider(req.params.id as string, reasonCode, adminRemarks);
      sendSuccess(res, application, "Provider rejected successfully");
    } catch (err) { next(err); }
  }

  async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status } = querySchema.parse(req.query);
      const providers = await this.service.viewProviders(search, status);
      sendSuccess(res, providers, "Providers fetched successfully");
    } catch (err) { next(err); }
  }
}
