import { ApplicationStatus } from "@/enums/application-status.enum";

export interface ProviderCategoryRef {
  _id: string;         // normalized to _id — matches MongoDB response
  name: string;
  icon?: string;
}

export interface ProviderApplicationDto {
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
  categoryId: string;
  subCategory?: string;
  experience: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  serviceArea: string;
  description: string;
  documentType: string;
  documents?: string[];
  headshot?: string;
  // Location fields
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  serviceRadius?: number;
}

export interface ProviderApplication {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  categoryId?: {
    _id: string;
    name: string;
  } | string;
  experience: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  serviceArea: string;
  description: string;
  documentType: string;
  documents: string[];
  headshot?: string;
  rejectionReason?: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
}

export interface ProviderApplicationStatus {
  id: string;
  status: ApplicationStatus | "not_applied";
  /** Human-readable rejection label derived from the reason code */
  rejectionReason: string | null;
  /** Structured rejection reason code for UI display logic */
  rejectionReasonCode: string | null;
  /** Optional custom admin remarks (especially when code is OTHER) */
  adminRemarks: string | null;
  /** Timestamp when the application was rejected */
  rejectedAt: string | null;
  category?: string | ProviderCategoryRef | null;
  submittedAt?: string;
  updatedAt?: string;
  // Full application data for pre-populating the reapply form
  fullName?: string;
  email?: string;
  phone?: string;
  experience?: string;
  description?: string;
  address?: { street: string; city: string; zip: string };
  serviceArea?: string;
  documentType?: string;
  subCategory?: string;
  headshot?: string;
  documents?: string[];
}

export interface ProviderService {
  _id: string;
  name: string;
  price: number;
  description: string;
}

export interface ProviderProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified?: boolean;
  applicationStatus: ApplicationStatus;
  businessName?: string;
  categoryId?: {
    _id: string;
    name: string;
  } | string;
  experience: string;
  serviceAreas: string[];
  description: string;
  services: ProviderService[];
  earnings: number;
  rating: number;
  headshot?: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  rating: number;
  price: number | null;
  profileImage?: string | null;
}

export interface PublicProviderDetails {
  id: string;
  name: string;
  businessName?: string;
  category: { id: string; name: string; icon?: string } | null;
  description?: string;
  serviceAreas?: string[];
  rating: number;
  price: number | null;
  profileImage?: string | null;
  onlineStatus?: "online" | "offline";
  engagementStatus?: "available" | "busy";
  services: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
     subCategory: string | null; 
  }>;
  subcategoriesWorkedIn: string[];
}

export interface UpdateProviderProfileDto {
  experience?: string;
  serviceAreas?: string[];
  serviceArea?: string;
  description?: string;
  categoryId?: string;
  headshot?: string;
}

export interface ProviderServiceDto {
  name: string;
  price: number;
  description: string;
}
