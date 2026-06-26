import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import {
  ProviderStatus,
  ProviderSchedule,
  UpsertScheduleDto,
  ProviderLeave,
  AddLeaveDto,
  AvailableWindowsResponse,
} from "@/types/providerSchedule.types";

export const providerScheduleService = {
  // ── Provider Status ─────────────────────────────────────────────────────
  getStatus: () =>
    api.get<ApiResponse<ProviderStatus>>(API_ENDPOINTS.PROVIDER_STATUS),

  toggleOnline: (onlineStatus: "online" | "offline") =>
    api.patch<ApiResponse<ProviderStatus>>(API_ENDPOINTS.PROVIDER_STATUS_TOGGLE, { onlineStatus }),

  // ── Provider Schedule ───────────────────────────────────────────────────
  getSchedule: () =>
    api.get<ApiResponse<ProviderSchedule | null>>(API_ENDPOINTS.PROVIDER_SCHEDULE),

  upsertSchedule: (dto: UpsertScheduleDto) =>
    api.put<ApiResponse<ProviderSchedule>>(API_ENDPOINTS.PROVIDER_SCHEDULE, dto),

  // ── Provider Leave ──────────────────────────────────────────────────────
  getLeaves: (params?: { month?: string; status?: string }) =>
    api.get<ApiResponse<ProviderLeave[]>>(API_ENDPOINTS.PROVIDER_LEAVE, { params }),

  addLeave: (dto: AddLeaveDto) =>
    api.post<ApiResponse<ProviderLeave>>(API_ENDPOINTS.PROVIDER_LEAVE, dto),

  cancelLeave: (date: string) =>
    api.delete<ApiResponse<ProviderLeave>>(API_ENDPOINTS.PROVIDER_LEAVE_CANCEL(date)),

  // ── Available Windows (Public) ──────────────────────────────────────────
  getAvailableWindows: (providerId: string, date: string, serviceId?: string) =>
    api.get<ApiResponse<AvailableWindowsResponse>>(
      API_ENDPOINTS.PROVIDER_AVAILABLE_WINDOWS(providerId),
      { params: { date, ...(serviceId ? { serviceId } : {}) } }
    ),
};
