import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  ProviderServiceListQuery,
  AdminServiceListQuery,
  AdminServiceListResponse,
  PublicServiceListQuery,
  PublicServiceListResponse,
} from "@/types/service.types";

/**
 * Standalone Service module API client.
 * Talks to the comprehensive /services and /admin/services endpoints.
 */
export const serviceService = {
  // ── Provider scope ──────────────────────────────────────────────────────

  list: (query?: ProviderServiceListQuery) =>
    api.get<ApiResponse<Service[]>>(API_ENDPOINTS.SERVICES, { params: query }),

  getById: (id: string) =>
    api.get<ApiResponse<Service>>(API_ENDPOINTS.SERVICE_BY_ID(id)),

  create: (dto: CreateServiceDto) =>
    api.post<ApiResponse<Service>>(API_ENDPOINTS.SERVICES, dto),

  update: (id: string, dto: UpdateServiceDto) =>
    api.put<ApiResponse<Service>>(API_ENDPOINTS.SERVICE_BY_ID(id), dto),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(API_ENDPOINTS.SERVICE_BY_ID(id)),

  activate: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.SERVICE_ACTIVATE(id)),

  deactivate: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.SERVICE_DEACTIVATE(id)),

  // ── Admin scope ─────────────────────────────────────────────────────────

  adminList: (query?: AdminServiceListQuery) =>
    api.get<ApiResponse<AdminServiceListResponse>>(API_ENDPOINTS.ADMIN_SERVICES, {
      params: query,
    }),

  adminBlock: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.ADMIN_BLOCK_SERVICE(id)),

  adminUnblock: (id: string) =>
    api.patch<ApiResponse<Service>>(API_ENDPOINTS.ADMIN_UNBLOCK_SERVICE(id)),

  // ── Public browse (no auth) ─────────────────────────────────────────────

  publicList: (query?: PublicServiceListQuery) =>
    api.get<ApiResponse<PublicServiceListResponse>>(API_ENDPOINTS.PUBLIC_SERVICES, {
      params: query,
    }),

  publicGet: (id: string) =>
    api.get<ApiResponse<Service>>(API_ENDPOINTS.PUBLIC_SERVICE_BY_ID(id)),
};
