import { IServiceRequest, ServiceRequestStatus } from "../../models/serviceRequest.model";
import { CreateServiceRequestDto } from "../../dto/service-request/serviceRequest.dto";

export interface ServiceRequestListResult {
  items: IServiceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface UserRequestStats {
  total: number;
  active: number;
  completed: number;
}

export interface IServiceRequestService {
  create(userId: string, dto: CreateServiceRequestDto): Promise<IServiceRequest | null>;
  getById(id: string): Promise<IServiceRequest>;
  getUserRequests(
    userId: string,
    status?: ServiceRequestStatus,
    page?: number,
    limit?: number
  ): Promise<ServiceRequestListResult>;
  getForProviders(filter: {
    categoryId?: string;
    subCategory?: string;
    city?: string;
    coordinates?: [number, number];
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<ServiceRequestListResult>;
  cancel(id: string, userId: string): Promise<IServiceRequest | null>;
  getUserStats(userId: string): Promise<UserRequestStats>;
}
