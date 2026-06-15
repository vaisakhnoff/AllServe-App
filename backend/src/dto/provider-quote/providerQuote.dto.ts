import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createProviderQuoteSchema = z.object({
  serviceRequestId: objectIdField,
  price: z.number().positive("Price must be positive"),
  message: z.string().trim().min(5).max(2000),
  estimatedDuration: z.string().trim().min(1).max(200),
  availabilityNote: z.string().trim().max(500).optional(),
});

export const updateProviderQuoteSchema = z.object({
  price: z.number().positive().optional(),
  message: z.string().trim().min(5).max(2000).optional(),
  estimatedDuration: z.string().trim().min(1).max(200).optional(),
  availabilityNote: z.string().trim().max(500).optional(),
});

export type CreateProviderQuoteDto = z.infer<typeof createProviderQuoteSchema>;
export type UpdateProviderQuoteDto = z.infer<typeof updateProviderQuoteSchema>;
