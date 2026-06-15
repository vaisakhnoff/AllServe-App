import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const optionalString = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().min(1).optional());

export const applyProviderSchema = z.object({
  fullName: optionalString,
  email: optionalString,
  phone: optionalString,
  businessName: z.string().trim().max(100).optional(),
  categoryId: objectIdField,
  subCategory: z.string().optional(),
  experience: z.string().min(1),
  address: z.object({ street: z.string().min(1), city: z.string().min(1), zip: z.string().min(1) }),
  serviceArea: z.string().min(1),
  description: z.string().min(1),
  documentType: z.string().min(1),
  documents: z.array(z.string()).optional(),
  headshot: z.string().optional(),
  // ── Location fields ──
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  fullAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadius: z.number().min(1).max(100).optional(),
});

export const updateProviderProfileSchema = z.object({
  experience: z.string().optional(),
  description: z.string().optional(),
  categoryId: objectIdField.optional(),
  serviceArea: z.string().min(1).optional(),
  headshot: z.string().optional(),
  // ── Location fields ──
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  fullAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadius: z.number().min(1).max(100).optional(),
});

export const providerQuerySchema = z.object({
  categoryId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(200).optional(),
});

export type ProviderApplicationDto = z.infer<typeof applyProviderSchema>;
export type UpdateProviderProfileDto = z.infer<typeof updateProviderProfileSchema>;
export type ProviderQuery = z.infer<typeof providerQuerySchema>;

// ── Plain Response DTOs ───────────────────────────────────────────────────────

export interface CategoryRefDto {
  id: unknown;
  name?: string;
  icon?: string;
}

export interface ProviderListItemDto {
  id: unknown;
  name: string;
  rating: number;
  price: number | null;
  profileImage: string | null;
}

export interface ProviderDetailsDto extends ProviderListItemDto {
  businessName?: string;
  category: CategoryRefDto | null;
  description?: string;
  serviceAreas: string[];
  services: { id: unknown; name: string; price: number; description: string }[];
  subcategoriesWorkedIn?: string[];
}

export interface ProviderApplicationResponseDto {
  id: unknown;
  fullName: string;
  email: string;
  phone: string;
  category: CategoryRefDto | null;
  experience?: string;
  address?: Record<string, string>;
  serviceArea?: string;
  description?: string;
  documentType?: string;
  headshot?: string;
  documents: string[];
  status: string;
  rejectionReason: string | null;
}

export interface ProviderProfileResponseDto {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  applicationStatus: string;
  headshot: string;
  businessName: string;
  categoryId: CategoryRefDto | null;
  experience: string;
  serviceAreas: string[];
  description: string;
  services: unknown[];
  earnings: number;
  rating: number;
}
