import {
  ServiceDto,
  UpdateServiceDto,
  ProviderServiceQuery,
  AdminServiceQuery,
  PublicServiceQuery,
} from "../../dto/service/service.dto";

// Plain response DTO — what mapService() returns
export interface ServiceResponseDto {
  id: unknown;
  providerId: unknown;
  category: unknown;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  images: string[];
  serviceArea?: string | null;
  location?: unknown;
  availabilityStatus: string;
  tags: string[];
  subCategory?: string | null;
  status: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceListResult {
  items: ServiceResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface IServiceService {
  // Provider
  createService(providerId: string, data: ServiceDto, providerCategoryId: string | null | undefined): Promise<ServiceResponseDto>;
  getServices(providerId: string, query?: ProviderServiceQuery): Promise<ServiceResponseDto[]>;
  getServiceById(providerId: string, id: string): Promise<ServiceResponseDto>;
  updateService(providerId: string, id: string, data: UpdateServiceDto): Promise<ServiceResponseDto>;
  deleteService(providerId: string, id: string): Promise<void>;
  activateService(providerId: string, id: string): Promise<ServiceResponseDto>;
  deactivateService(providerId: string, id: string): Promise<ServiceResponseDto>;

  // Public browse
  publicListServices(query: PublicServiceQuery & { nearbyProviderIds?: string[] }): Promise<ServiceListResult>;
  publicGetServiceById(id: string): Promise<ServiceResponseDto>;
  getProviderSubcategories(providerId: string): Promise<string[]>;
  publicListByProvider(providerId: string, subCategory?: string): Promise<ServiceResponseDto[]>;

  // Admin
  adminListServices(query: AdminServiceQuery): Promise<ServiceListResult>;
  adminBlockService(id: string): Promise<ServiceResponseDto>;
  adminUnblockService(id: string): Promise<ServiceResponseDto>;
}
