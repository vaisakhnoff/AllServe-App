import { BaseRepository } from "./base.repository";
import {
  IServiceRequestRepository,
  ServiceRequestListResult,
  ProviderServiceRequestFilter,
} from "../interfaces/service-request/IServiceRequestRepository";
import { ServiceRequestModel, IServiceRequest, ServiceRequestStatus } from "../models/serviceRequest.model";

export class ServiceRequestRepository
  extends BaseRepository<IServiceRequest>
  implements IServiceRequestRepository
{
  constructor() {
    super(ServiceRequestModel);
  }

  async create(data: Partial<IServiceRequest>): Promise<IServiceRequest> {
    return ServiceRequestModel.create(data) as Promise<IServiceRequest>;
  }

  async findById(id: string): Promise<IServiceRequest | null> {
    return this.model
      .findById(id)
      .populate("categoryId", "name")
      .populate("userId", "name email profileImage")
      .populate("selectedProviderId", "name businessName headshot rating")
      .exec();
  }

  async findByUser(
    userId: string,
    status?: ServiceRequestStatus,
    page = 1,
    limit = 10
  ): Promise<ServiceRequestListResult> {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("categoryId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IServiceRequest[], total, page, limit };
  }

  async findForProviders(filter: ProviderServiceRequestFilter): Promise<ServiceRequestListResult> {
    const query: Record<string, unknown> = {
      status: filter.status || { $in: ["open", "receiving_quotes"] },
    };
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.subCategory) query.subCategory = filter.subCategory;
    if (filter.city) query["address.city"] = { $regex: filter.city, $options: "i" };
    if (filter.coordinates && filter.radius) {
      query.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: filter.coordinates },
          $maxDistance: filter.radius * 1000,
        },
      };
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .populate("categoryId", "name")
        .populate("userId", "name profileImage")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(query),
    ]);
    return { items: items as IServiceRequest[], total, page, limit };
  }

  async updateStatus(
    id: string,
    status: ServiceRequestStatus,
    extra?: Partial<IServiceRequest>
  ): Promise<IServiceRequest | null> {
    return this.model
      .findByIdAndUpdate(id, { status, ...extra }, { returnDocument: 'after' })
      .exec();
  }

  async incrementQuoteCount(id: string): Promise<IServiceRequest | null> {
    return this.model
      .findByIdAndUpdate(id, { $inc: { quoteCount: 1 } }, { returnDocument: 'after' })
      .exec();
  }

  async decrementQuoteCount(id: string): Promise<IServiceRequest | null> {
    return this.model
      .findByIdAndUpdate(id, { $inc: { quoteCount: -1 } }, { returnDocument: 'after' })
      .exec();
  }

  async countByUser(userId: string, status?: ServiceRequestStatus): Promise<number> {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    return this.model.countDocuments(filter);
  }
}
