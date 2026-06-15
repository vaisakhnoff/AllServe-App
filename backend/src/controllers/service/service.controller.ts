import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IServiceService } from "../../interfaces/service/IServiceService";
import { IProviderRepository } from "../../interfaces/provider/IProviderRepository";
import {
  serviceSchema,
  updateServiceSchema,
  providerServiceQuerySchema,
  adminServiceQuerySchema,
  publicServiceQuerySchema,
} from "../../dto/service/service.dto";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";

function hasObjectId(value: object): value is { _id: unknown } {
  return "_id" in value;
}

function extractProviderCategoryId(req: AuthRequest & { providerAccount?: { categoryId?: unknown } }): string | null {
  const populated = req.providerAccount?.categoryId;
  if (!populated) return null;
  if (typeof populated === "string") return populated;
  if (typeof populated === "object") {
    if (hasObjectId(populated) && populated._id) return String(populated._id);
    if (populated.toString) return populated.toString();
  }
  return null;
}

export class ServiceController {
  constructor(
    private readonly service: IServiceService,
    private readonly providerRepo?: IProviderRepository
  ) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = serviceSchema.parse(req.body);
      const providerCategoryId = extractProviderCategoryId(req);
      const data = await this.service.createService(req.user!.id, dto, providerCategoryId);
      sendSuccess(res, data, Messages.SERVICE_CREATED, StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = providerServiceQuerySchema.parse(req.query);
      const data = await this.service.getServices(req.user!.id, query);
      sendSuccess(res, data, Messages.SERVICES_FETCHED);
    } catch (err) { next(err); }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getServiceById(req.user!.id, req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_FETCHED);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateServiceSchema.parse(req.body);
      const data = await this.service.updateService(req.user!.id, req.params.id as string, dto as import("../../dto/service/service.dto").UpdateServiceDto);
      sendSuccess(res, data, Messages.SERVICE_UPDATED);
    } catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.service.deleteService(req.user!.id, req.params.id as string);
      sendSuccess(res, null, Messages.SERVICE_DELETED);
    } catch (err) { next(err); }
  }

  async activate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.activateService(req.user!.id, req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_ACTIVATED);
    } catch (err) { next(err); }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.deactivateService(req.user!.id, req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_DEACTIVATED);
    } catch (err) { next(err); }
  }

  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminServiceQuerySchema.parse(req.query);
      const data = await this.service.adminListServices(query);
      sendSuccess(res, data, Messages.SERVICES_FETCHED);
    } catch (err) { next(err); }
  }

  async adminBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.service.adminBlockService(req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_BLOCKED);
    } catch (err) { next(err); }
  }

  async adminUnblock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.service.adminUnblockService(req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_UNBLOCKED);
    } catch (err) { next(err); }
  }

  async publicList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = publicServiceQuerySchema.parse(req.query);
      let nearbyProviderIds: string[] | undefined;

      if (query.latitude && query.longitude && this.providerRepo) {
        const radius = query.radius || 10;
        const nearby = await this.providerRepo.findNearbyProviders(
          query.longitude, query.latitude, radius * 1000,
          query.categoryId, undefined, 200
        );
        nearbyProviderIds = nearby.map((p: unknown) => String((p as { _id: string })._id));
        if (nearbyProviderIds.length === 0) {
          sendSuccess(res, { items: [], total: 0, page: query.page, limit: query.limit }, Messages.SERVICES_FETCHED);
          return;
        }
      }

      const data = await this.service.publicListServices({ ...query, nearbyProviderIds });
      sendSuccess(res, data, Messages.SERVICES_FETCHED);
    } catch (err) { next(err); }
  }

  async publicGetOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.service.publicGetServiceById(req.params.id as string);
      sendSuccess(res, data, Messages.SERVICE_FETCHED);
    } catch (err) { next(err); }
  }
}
