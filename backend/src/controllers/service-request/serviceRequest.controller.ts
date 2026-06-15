import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IServiceRequestService } from "../../interfaces/service-request/IServiceRequestService";
import { createServiceRequestSchema } from "../../dto/service-request/serviceRequest.dto";
import { StatusCodes } from "../../shared/constants/statusCodes";

export class ServiceRequestController {
  constructor(private service: IServiceRequestService) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createServiceRequestSchema.parse(req.body);
      const data = await this.service.create(req.user!.id, dto);
      sendSuccess(res, data, "Service request created", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const data = await this.service.getUserRequests(
        req.user!.id,
        status as import("../../models/serviceRequest.model").ServiceRequestStatus | undefined,
        Number(page) || 1,
        Number(limit) || 10
      );
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.cancel(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Request cancelled");
    } catch (err) { next(err); }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getUserStats(req.user!.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async browse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { categoryId, subCategory, city, lng, lat, radius, page, limit } = req.query;
      const coordinates = lng && lat ? [Number(lng), Number(lat)] as [number, number] : undefined;
      const data = await this.service.getForProviders({
        categoryId: categoryId as string,
        subCategory: subCategory as string,
        city: city as string,
        coordinates,
        radius: Number(radius) || 15,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}
