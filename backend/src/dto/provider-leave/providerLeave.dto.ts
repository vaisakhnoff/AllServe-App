import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const addLeaveSchema = z.object({
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD"),
  reason: z.string().trim().max(500).optional(),
  isFullDay: z.boolean().default(true),
  startTime: z.string().regex(timeRegex, "Time must be in HH:mm format").optional(),
  endTime: z.string().regex(timeRegex, "Time must be in HH:mm format").optional(),
}).refine(
  (data) => {
    if (!data.isFullDay && (!data.startTime || !data.endTime)) return false;
    return true;
  },
  { message: "Start time and end time are required for partial-day leave", path: ["startTime"] }
).refine(
  (data) => {
    if (data.startTime && data.endTime && data.startTime >= data.endTime) return false;
    return true;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

export const leaveQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM").optional(),
  status: z.enum(["active", "cancelled"]).optional(),
});

export type AddLeaveDto = z.infer<typeof addLeaveSchema>;
export type LeaveQuery = z.infer<typeof leaveQuerySchema>;
