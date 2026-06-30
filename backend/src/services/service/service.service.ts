import { IServiceRepository } from "../../interfaces/service/IServiceRepository";
import { IServiceService, ServiceListResult } from "../../interfaces/service/IServiceService";
import {
  ServiceDto,
  UpdateServiceDto,
  ProviderServiceQuery,
  AdminServiceQuery,
  PublicServiceQuery,
} from "../../dto/service/service.dto";
import { Messages } from "../../shared/constants/messages";
import { mapService } from "../../mappers/service.mapper";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../shared/errors/HttpErrors";


export class ServiceService implements IServiceService {
  constructor(private readonly repo: IServiceRepository) {}

  async createService(providerId: string, data: ServiceDto, providerCategoryId: string | null | undefined) {
    if (!providerCategoryId) {
      throw new BadRequestError("Your account is missing an approved category.");
    }
    const created = await this.repo.createService(providerId, { ...data, categoryId: providerCategoryId });
    const populated = await this.repo.findByIdForProvider(String(created._id), providerId);
    return mapService(populated!);
  }

  async getServices(providerId: string, query?: ProviderServiceQuery) {
    const services = await this.repo.findByProvider(providerId, query);
    return services.map(mapService);
  }

  async getServiceById(providerId: string, id: string) {
    const service = await this.repo.findByIdForProvider(id, providerId);
    if (!service) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    return mapService(service);
  }

  async updateService(providerId: string, id: string, data: UpdateServiceDto) {
    const existing = await this.repo.findByIdForProvider(id, providerId);
    if (!existing) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    if (existing.isBlocked) throw new ForbiddenError(Messages.SERVICE_BLOCKED_BY_ADMIN);
    const updated = await this.repo.updateService(id, providerId, data);
    if (!updated) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    return mapService(updated);
  }

  async deleteService(providerId: string, id: string): Promise<void> {
    const deleted = await this.repo.softDelete(id, providerId);
    if (!deleted) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
  }

  async activateService(providerId: string, id: string) {
    return this.setProviderStatus(providerId, id, "active");
  }

  async deactivateService(providerId: string, id: string) {
    return this.setProviderStatus(providerId, id, "inactive");
  }

  private async setProviderStatus(providerId: string, id: string, status: "active" | "inactive") {
    const existing = await this.repo.findByIdForProvider(id, providerId);
    if (!existing) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    if (existing.isBlocked) throw new ForbiddenError(Messages.SERVICE_BLOCKED_BY_ADMIN);
    if (existing.status === status) return mapService(existing);
    const updated = await this.repo.updateService(id, providerId, { status });
    return mapService(updated!);
  }

  async adminListServices(query: AdminServiceQuery): Promise<ServiceListResult> {
    const { items, total } = await this.repo.findAllForAdmin(query);
    return { items: items.map(mapService), total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async adminBlockService(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    return mapService((await this.repo.setBlocked(id, true))!);
  }

  async adminUnblockService(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    return mapService((await this.repo.setBlocked(id, false))!);
  }

  async publicListServices(query: PublicServiceQuery & { nearbyProviderIds?: string[] }): Promise<ServiceListResult> {
    const { items, total } = await this.repo.findPublic(query);
    return { items: items.map(mapService), total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async publicGetServiceById(id: string) {
    const service = await this.repo.findPublicById(id);
    if (!service) throw new NotFoundError(Messages.SERVICE_NOT_FOUND);
    return mapService(service);
  }

  async getProviderSubcategories(providerId: string): Promise<string[]> {
    return this.repo.findProviderSubcategories(providerId);
  }

  async publicListByProvider(providerId: string, subCategory?: string) {
    const items = await this.repo.findPublicByProvider(providerId, subCategory);
    return items.map(mapService);
  }
}
