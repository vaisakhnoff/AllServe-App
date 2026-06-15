import { IService } from "../../models/service.model";
import {
  ServiceDto,
  UpdateServiceDto,
  ProviderServiceQuery,
  AdminServiceQuery,
  PublicServiceQuery,
} from "../../dto/service/service.dto";

export interface ServiceListResult {
  items: IService[];
  total: number;
}

export interface IServiceRepository {
  // Provider scope
  createService(providerId: string, data: ServiceDto): Promise<IService>;
  findByProvider(providerId: string, query?: ProviderServiceQuery): Promise<IService[]>;
  findByIdForProvider(id: string, providerId: string): Promise<IService | null>;
  updateService(id: string, providerId: string, data: UpdateServiceDto): Promise<IService | null>;
  softDelete(id: string, providerId: string): Promise<IService | null>;
  countByProvider(providerId: string, status?: "active" | "inactive"): Promise<number>;
  findProviderSubcategories(providerId: string): Promise<string[]>;
  findPublicByProvider(providerId: string, subCategory?: string): Promise<IService[]>;

  // Admin scope
  findAllForAdmin(query: AdminServiceQuery): Promise<ServiceListResult>;
  findById(id: string): Promise<IService | null>;
  setBlocked(id: string, isBlocked: boolean): Promise<IService | null>;

  // Public browse
  findPublic(query: PublicServiceQuery & { nearbyProviderIds?: string[] }): Promise<ServiceListResult>;
  findPublicById(id: string): Promise<IService | null>;
}