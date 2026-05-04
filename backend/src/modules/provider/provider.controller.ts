import { Request, Response, NextFunction } from "express";
import { ProviderService } from "./provider.service";

const service = new ProviderService();

export class ProviderController {
  async applyProvider(req: any, res: Response, next: NextFunction) {
    try {
      const application = await service.applyProvider(req.user.id, req.body);
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }
}
