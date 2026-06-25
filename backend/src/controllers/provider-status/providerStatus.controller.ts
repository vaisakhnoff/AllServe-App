import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IProviderStatusService } from "../../interfaces/provider-status/IProviderStatusService";
import { toggleOnlineSchema } from "../../dto/provider-status/providerStatus.dto";

export class ProviderStatusController {
  constructor(private readonly service: IProviderStatusService) {}

  async toggleOnline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { onlineStatus } = toggleOnlineSchema.parse(req.body);
      const data = await this.service.toggleOnline(req.user!.id, onlineStatus);
      sendSuccess(res, data, `Provider is now ${onlineStatus}`);
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getStatus(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}
