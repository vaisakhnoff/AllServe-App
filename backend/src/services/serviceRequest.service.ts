import { IServiceRequestRepository } from "../interfaces/service-request/IServiceRequestRepository";
import { IServiceRequestService, ServiceRequestListResult, UserRequestStats } from "../interfaces/service-request/IServiceRequestService";
import { CreateServiceRequestDto } from "../dto/service-request/serviceRequest.dto";
import { IServiceRequest, ServiceRequestStatus } from "../models/serviceRequest.model";
import { NotFoundError, BadRequestError, ForbiddenError } from "../shared/errors/HttpErrors";

export class ServiceRequestService implements IServiceRequestService {
  constructor(private readonly repo: IServiceRequestRepository) {}

  async create(userId: string, dto: CreateServiceRequestDto): Promise<IServiceRequest | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const request = await this.repo.create({
      ...dto,
      userId: userId as unknown as IServiceRequest["userId"],
      categoryId: dto.categoryId as unknown as IServiceRequest["categoryId"],
      status: "open",
      quoteCount: 0,
      expiresAt,
    });
    return this.repo.findById(String(request._id));
  }

  async getById(id: string): Promise<IServiceRequest> {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError("Service request not found");
    return request;
  }

  async getUserRequests(
    userId: string,
    status?: ServiceRequestStatus,
    page?: number,
    limit?: number
  ): Promise<ServiceRequestListResult> {
    return this.repo.findByUser(userId, status, page, limit);
  }

  async getForProviders(filter: {
    categoryId?: string;
    subCategory?: string;
    city?: string;
    coordinates?: [number, number];
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<ServiceRequestListResult> {
    return this.repo.findForProviders(filter);
  }

  async cancel(id: string, userId: string): Promise<IServiceRequest | null> {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError("Service request not found");
    if (String((request.userId as unknown as { _id?: unknown })._id || request.userId) !== userId) {
      throw new ForbiddenError("Unauthorized");
    }
    if (["booking_created", "completed", "cancelled"].includes(request.status)) {
      throw new BadRequestError("Cannot cancel this request");
    }
    return this.repo.updateStatus(id, "cancelled");
  }

  async getUserStats(userId: string): Promise<UserRequestStats> {
    const [total, active, open, completed] = await Promise.all([
      this.repo.countByUser(userId),
      this.repo.countByUser(userId, "receiving_quotes"),
      this.repo.countByUser(userId, "open"),
      this.repo.countByUser(userId, "completed"),
    ]);
    return { total, active: active + open, completed };
  }
}
