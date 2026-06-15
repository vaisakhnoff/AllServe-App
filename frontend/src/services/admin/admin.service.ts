import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { UserListItem } from "@/types/user.types";
import { ProviderApplication, ProviderProfile } from "@/types/provider.types";
import {
  Service,
  AdminServiceListQuery,
  AdminServiceListResponse,
} from "@/types/service.types";
import { BookingListResponse, BookingStatus } from "@/types/booking.types";

export interface AdminDashboardStats {
  totalUsers: number;
  totalProviders: number;
  pendingApplications: number;
}

export const adminService = {
  getDashboardStats: () =>
    api.get<ApiResponse<AdminDashboardStats>>(API_ENDPOINTS.ADMIN_DASHBOARD),

  getUsers: () =>
    api.get<ApiResponse<UserListItem[]>>(API_ENDPOINTS.ADMIN_USERS),

  blockUser: (id: string) =>
    api.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.ADMIN_BLOCK_USER(id)),

  unblockUser: (id: string) =>
    api.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.ADMIN_UNBLOCK_USER(id)),

  getApplications: () =>
    api.get<ApiResponse<ProviderApplication[]>>(API_ENDPOINTS.ADMIN_APPLICATIONS),

  approveProvider: (id: string) =>
    api.patch<ApiResponse<ProviderApplication>>(API_ENDPOINTS.ADMIN_APPROVE(id)),

  rejectProvider: (id: string, reasonCode: string, adminRemarks?: string) =>
    api.patch<ApiResponse<ProviderApplication>>(API_ENDPOINTS.ADMIN_REJECT(id), { reasonCode, adminRemarks }),

  getProviders: () =>
    api.get<ApiResponse<ProviderProfile[]>>(API_ENDPOINTS.ADMIN_PROVIDERS),

  blockProvider: (id: string) =>
    api.patch<ApiResponse<ProviderProfile>>(API_ENDPOINTS.ADMIN_BLOCK_PROVIDER(id)),

  unblockProvider: (id: string) =>
    api.patch<ApiResponse<ProviderProfile>>(API_ENDPOINTS.ADMIN_UNBLOCK_PROVIDER(id)),

  // ── Services ────────────────────────────────────────────────────────────
  getServices: (query?: AdminServiceListQuery) =>
    api.get<ApiResponse<AdminServiceListResponse>>(API_ENDPOINTS.ADMIN_SERVICES, {
      params: query,
    }),

  blockService: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.ADMIN_BLOCK_SERVICE(id)),

  unblockService: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.ADMIN_UNBLOCK_SERVICE(id)),

  // ── Bookings ────────────────────────────────────────────────────────────
  getBookings: (params?: { status?: BookingStatus; search?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<BookingListResponse>>(API_ENDPOINTS.ADMIN_BOOKINGS, { params }),
};
