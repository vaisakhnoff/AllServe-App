import { BaseRepository } from "./base.repository";
import { IServiceRepository, ServiceListResult } from "../interfaces/service/IServiceRepository";
import { ServiceModel, IService } from "../models/service.model";
import {
  ServiceDto,
  UpdateServiceDto,
  ProviderServiceQuery,
  AdminServiceQuery,
  PublicServiceQuery,
} from "../dto/service/service.dto";
import { escapeRegex } from "../shared/utils/search";

type ServiceFilter = Record<string, unknown>;
const liveScope = { isDeleted: { $ne: true } } as const;

export class ServiceRepository
  extends BaseRepository<IService>
  implements IServiceRepository
{
  constructor() {
    super(ServiceModel);
  }

  // ── Provider scope ───────────────────────────────────────────────

  async createService(providerId: string, data: ServiceDto): Promise<IService> {
    return ServiceModel.create({ providerId, ...data }) as Promise<IService>;
  }

  async findByProvider(
    providerId: string,
    query: ProviderServiceQuery = {}
  ): Promise<IService[]> {
    const filter: ServiceFilter = { providerId, ...liveScope };
    if (query.status) filter.status = query.status;
    if (query.availabilityStatus) filter.availabilityStatus = query.availabilityStatus;
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }
    return this.model
      .find(filter)
      .populate("categoryId", "name icon")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByIdForProvider(id: string, providerId: string): Promise<IService | null> {
    return this.model
      .findOne({ _id: id, providerId, ...liveScope })
      .populate("categoryId", "name icon")
      .exec();
  }

  async updateService(id: string, providerId: string, data: UpdateServiceDto): Promise<IService | null> {
    return this.model
      .findOneAndUpdate({ _id: id, providerId, ...liveScope }, data, { returnDocument: 'after' })
      .populate("categoryId", "name icon")
      .exec();
  }

  async softDelete(id: string, providerId: string): Promise<IService | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, providerId, ...liveScope },
        { isDeleted: true, deletedAt: new Date() },
        { returnDocument: 'after' }
      )
      .exec();
  }

  async countByProvider(providerId: string, status?: "active" | "inactive"): Promise<number> {
    return this.model.countDocuments({
      providerId,
      ...liveScope,
      ...(status && { status }),
    });
  }

  async findProviderSubcategories(providerId: string): Promise<string[]> {
    const values = await this.model.distinct("subCategory", {
      providerId,
      ...liveScope,
      status: "active",
      availabilityStatus: "available",
      isBlocked: { $ne: true },
      subCategory: { $exists: true, $ne: null },
    });
    return (values as (string | null | undefined)[])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
  }

  async findPublicByProvider(providerId: string, subCategory?: string): Promise<IService[]> {
    const filter: ServiceFilter = {
      providerId,
      ...liveScope,
      status: "active",
      availabilityStatus: "available",
      isBlocked: { $ne: true },
    };
    if (subCategory) filter.subCategory = subCategory;
    return this.model
      .find(filter)
      .populate("categoryId", "name icon")
      .sort({ createdAt: -1 })
      .exec();
  }

  // ── Admin scope ──────────────────────────────────────────────────

  async findAllForAdmin(query: AdminServiceQuery): Promise<ServiceListResult> {
    const filter: ServiceFilter = { ...liveScope };
    if (query.status) filter.status = query.status;
    if (typeof query.isBlocked === "boolean") filter.isBlocked = query.isBlocked;
    if (query.providerId) filter.providerId = query.providerId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("categoryId", "name icon")
        .populate("providerId", "name email phone businessName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IService[], total };
  }

  async findById(id: string): Promise<IService | null> {
    return this.model
      .findOne({ _id: id, ...liveScope })
      .populate("categoryId", "name icon")
      .populate("providerId", "name email phone businessName onlineStatus engagementStatus headshot")
      .exec();
  }

  async setBlocked(id: string, isBlocked: boolean): Promise<IService | null> {
    return this.model
      .findOneAndUpdate({ _id: id, ...liveScope }, { isBlocked }, { returnDocument: 'after' })
      .populate("categoryId", "name icon")
      .populate("providerId", "name email phone businessName")
      .exec();
  }

  // ── Public browse ────────────────────────────────────────────────

  async findPublic(
    query: PublicServiceQuery & { nearbyProviderIds?: string[] }
  ): Promise<ServiceListResult> {
    const filter: ServiceFilter = {
      ...liveScope,
      status: "active",
      availabilityStatus: "available",
      isBlocked: { $ne: true },
    };
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.subCategory) filter.subCategory = query.subCategory;
    if (query.providerId) filter.providerId = query.providerId;
    if (query.nearbyProviderIds?.length) {
      filter.providerId = { $in: query.nearbyProviderIds };
    }
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }
    if (query.city) {
      filter["location.city"] = { $regex: escapeRegex(query.city), $options: "i" };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
      filter.price = priceFilter;
    }

    const sort: Record<string, 1 | -1> =
      query.sortBy === "priceAsc"
        ? { price: 1 }
        : query.sortBy === "priceDesc"
        ? { price: -1 }
        : { createdAt: -1 };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("categoryId", "name icon")
        .populate("providerId", "name businessName headshot rating")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IService[], total };
  }

  async findPublicById(id: string): Promise<IService | null> {
    return this.model
      .findOne({
        _id: id,
        ...liveScope,
        status: "active",
        availabilityStatus: "available",
        isBlocked: { $ne: true },
      })
      .populate("categoryId", "name icon")
      .populate("providerId", "name businessName headshot rating description serviceArea onlineStatus engagementStatus")
      .exec();
  }
}
