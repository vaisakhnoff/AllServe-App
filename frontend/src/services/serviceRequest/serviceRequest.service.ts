import api from "@/api";
import { ApiResponse } from "@/types/auth.types";
import {
  ServiceRequest,
  CreateServiceRequestDto,
  ServiceRequestListResponse,
  ServiceRequestStatus,
} from "@/types/serviceRequest.types";

export const serviceRequestService = {
  create: (dto: CreateServiceRequestDto) =>
    api.post<ApiResponse<ServiceRequest>>("/service-requests", dto),

  getMyRequests: (params?: { status?: ServiceRequestStatus; page?: number; limit?: number }) =>
    api.get<ApiResponse<ServiceRequestListResponse>>("/service-requests/my", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceRequest>>(`/service-requests/${id}`),

  cancel: (id: string) =>
    api.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/cancel`),

  getStats: () =>
    api.get<ApiResponse<{ total: number; active: number; completed: number }>>("/service-requests/stats"),

  // Provider
  browse: (params?: { categoryId?: string; subCategory?: string; city?: string; lng?: number; lat?: number; radius?: number; page?: number; limit?: number }) =>
    api.get<ApiResponse<ServiceRequestListResponse>>("/service-requests/provider/browse", { params }),
};
