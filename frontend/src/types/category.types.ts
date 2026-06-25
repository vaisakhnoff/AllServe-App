import type { DeliveryModel } from "./service.types";

export interface Subcategory {
  name: string;
  image?: string;
  /** Default delivery model hint for this subcategory */
  defaultDeliveryModel?: DeliveryModel;
  typicallyRequiresInspection?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: Subcategory[];
  /** Default delivery model for new services in this category */
  defaultDeliveryModel?: DeliveryModel;
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
  defaultDeliveryModel?: DeliveryModel;
  requiresInspection?: boolean;
  commissionRate?: number;
  defaultBufferMinutes?: number;
}
