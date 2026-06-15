import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm");
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const createSlotSchema = z.object({
  date: dateField,
  startTime: timeField,
  endTime: timeField,
  serviceId: objectIdField.optional(),
  slotStatus: z.enum(["available", "blocked"]).default("available"),
});

export const updateSlotSchema = z.object({
  date: dateField.optional(),
  startTime: timeField.optional(),
  endTime: timeField.optional(),
  serviceId: objectIdField.nullable().optional(),
  slotStatus: z.enum(["available", "blocked", "cancelled"]).optional(),
});

export const bulkCreateSchema = z.object({
  dates: z.array(dateField).min(1, "At least one date required"),
  startTime: timeField,
  endTime: timeField,
  slotStatus: z.enum(["available", "blocked"]).default("available"),
  serviceId: objectIdField.optional(),
});

export const recurringSlotSchema = z.object({
  startTime: timeField,
  endTime: timeField,
  pattern: z.enum(["daily", "weekly", "weekdays", "weekends", "custom"]),
  customDays: z.array(z.number().min(0).max(6)).optional(), // 0=Sun, 6=Sat
  startDate: dateField,
  endDate: dateField.optional(),
  occurrences: z.number().int().min(1).max(90).optional(),
  slotStatus: z.enum(["available", "blocked"]).default("available"),
  serviceId: objectIdField.optional(),
});

export const blockRangeSchema = z.object({
  startDate: dateField,
  endDate: dateField,
  startTime: timeField.optional(),
  endTime: timeField.optional(),
});

export type CreateSlotDto = z.infer<typeof createSlotSchema>;
export type UpdateSlotDto = z.infer<typeof updateSlotSchema>;
export type BulkCreateDto = z.infer<typeof bulkCreateSchema>;
export type RecurringSlotDto = z.infer<typeof recurringSlotSchema>;
export type BlockRangeDto = z.infer<typeof blockRangeSchema>;
