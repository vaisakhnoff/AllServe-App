export type ServiceStatus = "active" | "inactive";
export type AvailabilityStatus = "available" | "unavailable";

export interface ServiceLocation {
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ServiceCategoryRef {
  id: string;
  name?: string;
  icon?: string;
}

export interface ServiceProviderRef {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
}

/**
 * Service entity returned by the standalone /services and /admin/services APIs.
 * `providerId` is enriched (object) for admin responses, plain string for provider scope.
 */
export interface Service {
  id: string;
  providerId: string | ServiceProviderRef;
  category: ServiceCategoryRef | null;
  subCategory: string | null;
  name: string;
  description: string;
  price: number;
  duration: number;
  images: string[];
  serviceArea?: string | null;
  location?: ServiceLocation | null;
  availabilityStatus: AvailabilityStatus;
  tags: string[];
  status: ServiceStatus;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  /**
   * Optional on the wire — the server stamps it from the provider's
   * approved category and ignores any value sent by the client.
   * Kept here for forward-compat with admin/back-office tooling.
   */
  categoryId?: string;
  subCategory?: string;
  description: string;
  price: number;
  duration: number;
  images?: string[];
  serviceArea?: string;
  location?: ServiceLocation;
  availabilityStatus?: AvailabilityStatus;
  tags?: string[];
  status?: ServiceStatus;
}

export type UpdateServiceDto = Partial<CreateServiceDto>;

export interface ProviderServiceListQuery {
  status?: ServiceStatus;
  availabilityStatus?: AvailabilityStatus;
  search?: string;
}

export interface AdminServiceListQuery {
  status?: ServiceStatus;
  isBlocked?: boolean;
  providerId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  limit: number;
}

/** Public-browse query (dashboard drilldown). */
export interface PublicServiceListQuery {
  categoryId?: string;
  subCategory?: string;
  providerId?: string;
  search?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "recent" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}

export interface PublicServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  limit: number;
}
