import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";

const service = new AdminService();

export class AdminController {
  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await service.viewApplications();
      res.json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  }

  async approveProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await service.approveProvider(req.params.id as string);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }
}
