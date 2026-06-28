import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const addressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "ZIP is required"),
  country: z.string().trim().default("India"),
});

const locationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
}).optional();

// ── Direct Instant Request ────────────────────────────────────────────────────
export const createDirectInstantSchema = z.object({
  serviceId: objectIdField,
  providerId: objectIdField,
  description: z.string().trim().min(5).max(2000),
  address: addressSchema,
  exactLocation: locationSchema,
  images: z.array(z.string()).max(5).default([]),
});

// ── Direct Scheduled Request ──────────────────────────────────────────────────
export const createDirectScheduledSchema = z.object({
  serviceId: objectIdField,
  providerId: objectIdField,
  description: z.string().trim().min(5).max(2000),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm"),
  address: addressSchema,
  exactLocation: locationSchema,
  images: z.array(z.string()).max(5).default([]),
});

// ── Inspection Request ────────────────────────────────────────────────────────
export const createInspectionSchema = z.object({
  serviceId: objectIdField,
  providerId: objectIdField,
  description: z.string().trim().min(10).max(3000),
  address: addressSchema,
  exactLocation: locationSchema,
  images: z.array(z.string()).max(10).default([]),
});

// ── Custom Request ────────────────────────────────────────────────────────────
export const createCustomSchema = z.object({
  categoryId: objectIdField,
  providerId: objectIdField.optional(),
  serviceId: objectIdField.optional(),
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(3000),
  budget: z.number().positive().optional(),
  budgetType: z.enum(["fixed", "flexible", "quote_needed"]).default("quote_needed"),
  address: addressSchema,
  exactLocation: locationSchema,
  images: z.array(z.string()).max(10).default([]),
});

// ── Customer Choice (after rejection/timeout) ─────────────────────────────────
export const customerChoiceSchema = z.object({
  choice: z.enum(["reroute", "refund"]),
  newProviderId: objectIdField.optional(),
}).refine(
  (data) => {
    if (data.choice === "reroute" && !data.newProviderId) return false;
    return true;
  },
  { message: "New provider is required when re-routing", path: ["newProviderId"] }
);

// ── Order Query ───────────────────────────────────────────────────────────────
export const orderQuerySchema = z.object({
  deliveryModel: z.enum(["direct", "inspection_required", "custom"]).optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const adminOrderQuerySchema = z.object({
  deliveryModel: z.enum(["direct", "inspection_required", "custom"]).optional(),
  status: z.string().trim().optional(),
  customerId: objectIdField.optional(),
  providerId: objectIdField.optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateDirectInstantDto = z.infer<typeof createDirectInstantSchema>;
export type CreateDirectScheduledDto = z.infer<typeof createDirectScheduledSchema>;
export type CreateInspectionDto = z.infer<typeof createInspectionSchema>;
export type CreateCustomDto = z.infer<typeof createCustomSchema>;
export type CustomerChoiceDto = z.infer<typeof customerChoiceSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
