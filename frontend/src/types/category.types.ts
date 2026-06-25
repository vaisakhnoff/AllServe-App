import type { ServiceType } from "./service.types";

export interface Subcategory {
  name: string;
  image?: string;
  /** Default service type hint for this subcategory */
  defaultServiceType?: ServiceType;
  typicallyRequiresInspection?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: Subcategory[];
  /** Default service type for new services in this category */
  defaultServiceType?: ServiceType;
  requiresInspection?: boolean;
  commissionRate?: number;
  defaultBufferMinutes?: number;
  typicalDurationRange?: { min: number; max: number };
  createdAt: string;
}

export interface CategoryDto {
  name: string;
  description?: string;
  icon?: string;
  subcategories?: Subcategory[];
  defaultServiceType?: ServiceType;
  requiresInspection?: boolean;
  commissionRate?: number;
  defaultBufferMinutes?: number;
}
