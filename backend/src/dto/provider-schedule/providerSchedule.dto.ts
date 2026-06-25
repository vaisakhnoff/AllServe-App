import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = z.string().regex(timeRegex, "Time must be in HH:mm format");

const dayScheduleSchema = z.object({
  day: z.number().int().min(0).max(6),
  isWorkingDay: z.boolean(),
  startTime: timeField,
  endTime: timeField,
  breakStart: timeField.optional(),
  breakEnd: timeField.optional(),
}).refine(
  (data) => {
    if (data.isWorkingDay && data.startTime >= data.endTime) return false;
    return true;
  },
  { message: "End time must be after start time on working days", path: ["endTime"] }
).refine(
  (data) => {
    if (data.breakStart && data.breakEnd && data.breakStart >= data.breakEnd) return false;
    return true;
  },
  { message: "Break end must be after break start", path: ["breakEnd"] }
);

export const upsertScheduleSchema = z.object({
  weeklyHours: z.array(dayScheduleSchema).length(7, "Must provide schedule for all 7 days"),
  bufferMinutes: z.number().int().min(0).max(120).default(15),
  defaultServiceDuration: z.number().int().min(15).max(480).default(60),
  advanceBookingDays: z.number().int().min(1).max(90).default(30),
});

export const availableWindowsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid service id").optional(),
  duration: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number().int().min(15).max(480).optional()
  ),
});

export type UpsertScheduleDto = z.infer<typeof upsertScheduleSchema>;
export type AvailableWindowsQuery = z.infer<typeof availableWindowsQuerySchema>;
