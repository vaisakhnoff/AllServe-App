import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const numberFromString = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return value;
  }, schema);

const trimmedString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const tagSchema = z.string().trim().min(1).max(30);

const locationSchema = z
  .object({
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    pincode: z.string().trim().max(20).optional(),
  })
  .optional();

/**
 * Create-service payload.
 *
 * Notes:
 * - `categoryId` is OPTIONAL here because the server stamps it from the
 *   authenticated provider's approved category. Any value sent by the client
 *   is ignored. This guarantees a provider can only sell services in the
 *   single category their application was approved for.
 * - `price` accepts numeric strings (form inputs send strings) and coerces to number.
 * - `duration` is in minutes (integer, 1 – 1440).
 * - `images` accepts URLs or base64 data strings; max 10 items per service.
 * - `tags` accepts free-form strings; max 20 items, each 1–30 chars.
 */
export const serviceSchema = z.object({
  name: trimmedString(2, 100, "Service name"),
  categoryId: objectIdField.optional(),
  subCategory: z.string().trim().min(1).max(100).optional(),
  description: trimmedString(10, 2000, "Description"),
  price: numberFromString(z.number().min(0, "Price cannot be negative")),
  duration: numberFromString(
    z
      .number()
      .int("Duration must be a whole number of minutes")
      .min(1, "Duration must be at least 1 minute")
      .max(1440, "Duration cannot exceed 24 hours (1440 minutes)")
  ),
  images: z.array(z.string()).max(10, "You can attach at most 10 images").default([]),
  serviceArea: z.string().trim().max(200).optional(),
  location: locationSchema,
  availabilityStatus: z.enum(["available", "unavailable"]).default("available"),
  tags: z.array(tagSchema).max(20, "You can add at most 20 tags").default([]),
  status: z.enum(["active", "inactive"]).default("active"),
});

/**
 * Update payload — `categoryId` is intentionally omitted. Providers cannot
 * change a service's category; it is bound to their approved application
 * category for the lifetime of the service.
 */
export const updateServiceSchema = serviceSchema.omit({ categoryId: true }).partial();

/** Provider list filter (own services). */
export const providerServiceQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  availabilityStatus: z.enum(["available", "unavailable"]).optional(),
  search: z.string().trim().max(200).optional(),
});

/** Public-facing browse for the user dashboard / drilldown navigation. */
export const publicServiceQuerySchema = z.object({
  categoryId: objectIdField.optional(),
  subCategory: z.string().trim().max(100).optional(),
  providerId: objectIdField.optional(),
  search: z.string().trim().max(200).optional(),
  /** Filter by city (case-insensitive partial match on location.city). */
  city: z.string().trim().max(100).optional(),
  /** Geospatial: filter services by nearby providers. */
  latitude: z.preprocess((v) => (typeof v === "string" && v !== "" ? Number(v) : v), z.number()).optional(),
  longitude: z.preprocess((v) => (typeof v === "string" && v !== "" ? Number(v) : v), z.number()).optional(),
  radius: z.preprocess((v) => (typeof v === "string" && v !== "" ? Number(v) : v), z.number().min(1).max(200)).optional(),
  minPrice: z
    .preprocess((v) => (typeof v === "string" && v !== "" ? Number(v) : v), z.number().min(0))
    .optional(),
  maxPrice: z
    .preprocess((v) => (typeof v === "string" && v !== "" ? Number(v) : v), z.number().min(0))
    .optional(),
  sortBy: z.enum(["recent", "priceAsc", "priceDesc"]).default("recent"),
  page: z
    .preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1).max(50))
    .optional()
    .default(20),
});

/** Admin filters for browsing all services. */
export const adminServiceQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  isBlocked: z
    .preprocess((v) => (typeof v === "string" ? v === "true" : v), z.boolean())
    .optional(),
  providerId: objectIdField.optional(),
  categoryId: objectIdField.optional(),
  search: z.string().trim().max(200).optional(),
  page: z
    .preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().min(1).max(100))
    .optional()
    .default(20),
});

export type ServiceDto = z.infer<typeof serviceSchema>;
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
export type ProviderServiceQuery = z.infer<typeof providerServiceQuerySchema>;
export type AdminServiceQuery = z.infer<typeof adminServiceQuerySchema>;
export type PublicServiceQuery = z.infer<typeof publicServiceQuerySchema>;
