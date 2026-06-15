import { IServiceRequest, ServiceRequestStatus } from "../../models/serviceRequest.model";

export interface ServiceRequestListResult {
  items: IServiceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ProviderServiceRequestFilter {
  categoryId?: string;
  subCategory?: string;
  city?: string;
  coordinates?: [number, number];
  radius?: number;
  status?: ServiceRequestStatus;
  page?: number;
  limit?: number;
}

export interface IServiceRequestRepository {
  create(data: Partial<IServiceRequest>): Promise<IServiceRequest>;
  findById(id: string): Promise<IServiceRequest | null>;
  findByUser(
    userId: string,
    status?: ServiceRequestStatus,
    page?: number,
    limit?: number
  ): Promise<ServiceRequestListResult>;
  findForProviders(filter: ProviderServiceRequestFilter): Promise<ServiceRequestListResult>;
  updateStatus(
    id: string,
    status: ServiceRequestStatus,
    extra?: Partial<IServiceRequest>
  ): Promise<IServiceRequest | null>;
  incrementQuoteCount(id: string): Promise<IServiceRequest | null>;
  decrementQuoteCount(id: string): Promise<IServiceRequest | null>;
  countByUser(userId: string, status?: ServiceRequestStatus): Promise<number>;
}
