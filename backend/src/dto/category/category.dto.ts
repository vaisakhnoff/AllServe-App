import { z } from "zod";

const subcategoryItemSchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  image: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  subcategories: z.array(subcategoryItemSchema).optional(),
});

export const categoryQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1)).optional().default(1),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1).max(100)).optional().default(20),
});

export type CategoryDto = z.infer<typeof categorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;

// ── Response DTO (what the service returns to controllers/clients) ─────────────

export interface CategoryResponseDto {
  _id: unknown;
  name: string;
  description?: string;
  icon?: string;
  subcategories: { name: string; image?: string }[];
}

export interface PaginatedCategoryResponse {
  items: CategoryResponseDto[];
  total: number;
  page: number;
  limit: number;
}
