import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createBookingSchema = z.object({
  serviceId: objectIdField,
  slotId: objectIdField,
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().default("India"),
  }),
});

export const rescheduleBookingSchema = z.object({
  newSlotId: objectIdField,
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["in_progress", "completed"]),
});

export const bookingQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "accepted", "in_progress", "completed", "cancelled", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const adminBookingQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "accepted", "in_progress", "completed", "cancelled", "rejected"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type RescheduleBookingDto = z.infer<typeof rescheduleBookingSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;
