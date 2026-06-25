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
 * - `serviceType` determines the booking flow (instant/visit_first/custom)
 * - `pricingModel` determines how price is calculated and displayed
 * - `price` accepts numeric strings (form inputs send strings) and coerces to number.
 * - `duration` is in minutes (integer, 1 – 1440).
 * - `images` accepts URLs or base64 data strings; max 10 items per service.
 * - `tags` accepts free-form strings; max 20 items, each 1–30 chars.
 */
/** Base object schema without refinements (needed for .omit()/.partial() in Zod v4) */
const serviceBaseSchema = z.object({
  name: trimmedString(2, 100, "Service name"),
  categoryId: objectIdField.optional(),
  subCategory: z.string().trim().min(1).max(100).optional(),
  description: trimmedString(10, 2000, "Description"),
  
  /** Service type determines the booking flow */
  serviceType: z.enum(["instant", "visit_first", "custom"]).default("instant"),
  
  /** Pricing model determines how price is calculated */
  pricingModel: z.enum(["fixed", "per_unit", "hourly", "starting_from", "quote_based"]).default("fixed"),
  
  price: numberFromString(z.number().min(0, "Price cannot be negative")),
  
  /** For per_unit pricing (e.g., "sq.ft", "sq.m", "item") */
  priceUnit: z.string().trim().max(20).optional(),
  
  duration: numberFromString(
    z
      .number()
      .int("Duration must be a whole number of minutes")
      .min(1, "Duration must be at least 1 minute")
      .max(1440, "Duration cannot exceed 24 hours (1440 minutes)")
  ),
  
  /** For 'visit_first' services - whether inspection visit is free */
  freeInspection: z.boolean().default(true).optional(),
  
  /** For 'visit_first' services - inspection visit fee if not free */
  inspectionFee: numberFromString(z.number().min(0)).optional(),
  
  /** For 'visit_first' and 'custom' services - estimated project duration in days */
  estimatedProjectDays: numberFromString(z.number().int().min(1).max(365)).optional(),
  
  images: z.array(z.string()).max(10, "You can attach at most 10 images").default([]),
  serviceArea: z.string().trim().max(200).optional(),
  location: locationSchema,
  availabilityStatus: z.enum(["available", "unavailable"]).default("available"),
  tags: z.array(tagSchema).max(20, "You can add at most 20 tags").default([]),
  status: z.enum(["active", "inactive"]).default("active"),
});

/** Cross-field refinements applied on top of the base schema */
export const serviceSchema = serviceBaseSchema.refine(
  (data) => {
    // If pricingModel is per_unit, priceUnit must be provided
    if (data.pricingModel === "per_unit" && !data.priceUnit) {
      return false;
    }
    return true;
  },
  {
    message: "Price unit is required when pricing model is 'per_unit'",
    path: ["priceUnit"],
  }
).refine(
  (data) => {
    // If freeInspection is false, inspectionFee must be provided and > 0
    if (data.freeInspection === false && (!data.inspectionFee || data.inspectionFee <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Inspection fee must be greater than 0 when inspection is not free",
    path: ["inspectionFee"],
  }
);

/**
 * Update payload — `categoryId` is intentionally omitted. Providers cannot
 * change a service's category; it is bound to their approved application
 * category for the lifetime of the service.
 *
 * Uses the base schema (pre-refinement) so .omit()/.partial() work in Zod v4.
 * Refinements are re-applied on the partial shape where applicable.
 */
export const updateServiceSchema = serviceBaseSchema.omit({ categoryId: true }).partial().refine(
  (data) => {
    // Only validate if both fields are present in the partial update
    if (data.pricingModel === "per_unit" && data.pricingModel !== undefined && !data.priceUnit) {
      return false;
    }
    return true;
  },
  {
    message: "Price unit is required when pricing model is 'per_unit'",
    path: ["priceUnit"],
  }
).refine(
  (data) => {
    if (data.freeInspection === false && (!data.inspectionFee || data.inspectionFee <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Inspection fee must be greater than 0 when inspection is not free",
    path: ["inspectionFee"],
  }
);

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
  /** Filter by service type */
  serviceType: z.enum(["instant", "visit_first", "custom"]).optional(),
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
