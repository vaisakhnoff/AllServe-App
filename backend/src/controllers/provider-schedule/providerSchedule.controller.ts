import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IProviderScheduleService } from "../../interfaces/provider-schedule/IProviderScheduleService";
import { upsertScheduleSchema, availableWindowsQuerySchema } from "../../dto/provider-schedule/providerSchedule.dto";
import { ServiceModel } from "../../models/service.model";
import { StatusCodes } from "../../shared/constants/statusCodes";

export class ProviderScheduleController {
  constructor(private readonly service: IProviderScheduleService) {}

  async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getSchedule(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async upsertSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = upsertScheduleSchema.parse(req.body);
      const data = await this.service.upsertSchedule(req.user!.id, dto);
      sendSuccess(res, data, "Schedule updated", StatusCodes.OK);
    } catch (err) {
      next(err);
    }
  }

  async getAvailableWindows(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = req.params.id as string;
      const { date, serviceId, duration } = availableWindowsQuerySchema.parse(req.query);

      // Determine duration: from serviceId, from query param, or from provider's default
      let durationMinutes = duration;
      if (!durationMinutes && serviceId) {
        const service = await ServiceModel.findById(serviceId).lean();
        if (service) durationMinutes = service.duration;
      }

      const windows = await this.service.getAvailableWindows(
        providerId,
        date,
        durationMinutes || undefined as unknown as number
      );
      sendSuccess(res, { date, providerId, windows });
    } catch (err) {
      next(err);
    }
  }
}
