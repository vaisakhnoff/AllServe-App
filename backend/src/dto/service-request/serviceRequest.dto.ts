import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createServiceRequestSchema = z.object({
  categoryId: objectIdField,
  subCategory: z.string().trim().min(1).max(100),
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(3000),
  budgetType: z.enum(["fixed", "flexible", "quote_needed"]),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  address: z.object({
    street: z.string().trim().min(1),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    zip: z.string().trim().min(1),
    country: z.string().default("India"),
  }),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  images: z.array(z.string()).max(5).default([]),
  urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export type CreateServiceRequestDto = z.infer<typeof createServiceRequestSchema>;
