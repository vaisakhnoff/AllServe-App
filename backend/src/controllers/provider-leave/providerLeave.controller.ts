import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IProviderLeaveService } from "../../interfaces/provider-leave/IProviderLeaveService";
import { addLeaveSchema, leaveQuerySchema } from "../../dto/provider-leave/providerLeave.dto";
import { StatusCodes } from "../../shared/constants/statusCodes";

export class ProviderLeaveController {
  constructor(private readonly service: IProviderLeaveService) {}

  async addLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = addLeaveSchema.parse(req.body);
      const data = await this.service.addLeave(req.user!.id, dto);
      sendSuccess(res, data, "Leave added", StatusCodes.CREATED);
    } catch (err) {
      next(err);
    }
  }

  async cancelLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const date = req.params.date as string;
      const data = await this.service.cancelLeave(req.user!.id, date);
      sendSuccess(res, data, "Leave cancelled");
    } catch (err) {
      next(err);
    }
  }

  async getLeaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { month, status } = leaveQuerySchema.parse(req.query);
      const data = await this.service.getLeaves(req.user!.id, month, status);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}
