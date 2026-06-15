import api from "@/api";
import { ApiResponse } from "@/types/auth.types";

export interface Slot {
  _id: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotStatus: "available" | "booked" | "blocked" | "cancelled";
  serviceId?: string;
  createdAt: string;
}

export interface CreateSlotDto {
  date: string;
  startTime: string;
  endTime: string;
  slotStatus?: "available" | "blocked";
  serviceId?: string;
}

export interface BulkCreateDto {
  dates: string[];
  startTime: string;
  endTime: string;
  slotStatus?: "available" | "blocked";
}

export interface RecurringSlotDto {
  startTime: string;
  endTime: string;
  pattern: "daily" | "weekly" | "weekdays" | "weekends" | "custom";
  customDays?: number[];
  startDate: string;
  endDate?: string;
  occurrences?: number;
  slotStatus?: "available" | "blocked";
}

export interface BlockRangeDto {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export interface SlotStats {
  available: number;
  booked: number;
  blocked: number;
  cancelled: number;
  total: number;
  todayBooked: number;
  upcoming: number;
}

export const slotService = {
  // Provider
  getMySlots: (date?: string) => api.get<ApiResponse<Slot[]>>("/slots/my", { params: date ? { date } : {} }),
  getStats: () => api.get<ApiResponse<SlotStats>>("/slots/stats"),
  create: (dto: CreateSlotDto) => api.post<ApiResponse<Slot>>("/slots", dto),
  bulkCreate: (dto: BulkCreateDto) => api.post<ApiResponse<{ created: number; skipped: number; skippedDates: string[] }>>("/slots/bulk", dto),
  recurring: (dto: RecurringSlotDto) => api.post<ApiResponse<{ created: number; skipped: number; total: number }>>("/slots/recurring", dto),
  blockRange: (dto: BlockRangeDto) => api.post<ApiResponse<{ blockedDates: number; slotsAffected: number }>>("/slots/block-range", dto),
  update: (id: string, dto: Partial<CreateSlotDto>) => api.put<ApiResponse<Slot>>(`/slots/${id}`, dto),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/slots/${id}`),
  // User
  getAvailable: (providerId: string, date?: string) => api.get<ApiResponse<Slot[]>>(`/slots/provider/${providerId}/available`, { params: date ? { date } : {} }),
  lock: (id: string) => api.post<ApiResponse<Slot>>(`/slots/${id}/lock`),
  unlock: (id: string) => api.post<ApiResponse<null>>(`/slots/${id}/unlock`),
  book: (id: string, serviceId?: string) => api.post<ApiResponse<Slot>>(`/slots/${id}/book`, serviceId ? { serviceId } : {}),
};
