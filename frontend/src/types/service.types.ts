export type ServiceStatus = "active" | "inactive";
export type AvailabilityStatus = "available" | "unavailable";

/**
 * Determines the booking flow:
 * - instant: fixed price, pick slot and pay now
 * - visit_first: provider visits to inspect before quoting
 * - custom: user posts a request, providers bid
 */
export type ServiceType = "instant" | "visit_first" | "custom";

/**
 * How the displayed price is interpreted:
 * - fixed: total price (e.g. ₹500)
 * - per_unit: price per unit such as sq.ft (e.g. ₹15/sq.ft)
 * - hourly: price per hour
 * - starting_from: minimum estimate, finalised after inspection
 * - quote_based: no upfront price, determined through bidding
 */
export type PricingModel = "fixed" | "per_unit" | "hourly" | "starting_from" | "quote_based";

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
  /** Booking flow classification */
  serviceType: ServiceType;
  /** How price is calculated / displayed */
  pricingModel: PricingModel;
  price: number;
  /** Unit label for per_unit pricing (e.g. "sq.ft") */
  priceUnit?: string | null;
  duration: number;
  /** For visit_first services – whether the inspection visit is free */
  freeInspection?: boolean;
  /** For visit_first services – fee charged when inspection is not free */
  inspectionFee?: number | null;
  /** For visit_first / custom services – estimated project length in days */
  estimatedProjectDays?: number | null;
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
   */
  categoryId?: string;
  subCategory?: string;
  description: string;
  /** Booking flow classification */
  serviceType: ServiceType;
  /** How price is calculated / displayed */
  pricingModel: PricingModel;
  price: number;
  /** Required when pricingModel is "per_unit" */
  priceUnit?: string;
  duration: number;
  /** For visit_first services */
  freeInspection?: boolean;
  /** For visit_first services when freeInspection is false */
  inspectionFee?: number;
  /** For visit_first / custom services */
  estimatedProjectDays?: number;
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
  /** Filter by booking flow type */
  serviceType?: ServiceType;
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
