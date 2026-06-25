import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createQuotationSchema = z.object({
  orderId: objectIdField,
  labourCharge: z.number().min(0, "Labour charge cannot be negative"),
  materialCost: z.number().min(0).default(0),
  additionalCharges: z.number().min(0).default(0),
  estimatedDurationDays: z.number().int().min(1, "Duration must be at least 1 day"),
  advanceRequired: z.boolean().default(false),
  advanceAmount: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional(),
  termsAndConditions: z.string().trim().max(3000).optional(),
  attachments: z.array(z.string()).max(10).default([]),
}).refine(
  (data) => {
    if (data.advanceRequired && data.advanceAmount <= 0) return false;
    return true;
  },
  { message: "Advance amount must be > 0 when advance is required", path: ["advanceAmount"] }
);

export const reviseQuotationSchema = z.object({
  labourCharge: z.number().min(0),
  materialCost: z.number().min(0).default(0),
  additionalCharges: z.number().min(0).default(0),
  estimatedDurationDays: z.number().int().min(1),
  advanceRequired: z.boolean().default(false),
  advanceAmount: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional(),
  termsAndConditions: z.string().trim().max(3000).optional(),
  attachments: z.array(z.string()).max(10).default([]),
});

export const modificationRequestSchema = z.object({
  comment: z.string().trim().min(5).max(1000),
});

export type CreateQuotationDto = z.infer<typeof createQuotationSchema>;
export type ReviseQuotationDto = z.infer<typeof reviseQuotationSchema>;
export type ModificationRequestDto = z.infer<typeof modificationRequestSchema>;
