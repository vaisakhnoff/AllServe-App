import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { ProviderApplicationDto, ProviderApplication, ProviderApplicationStatus, ProviderProfile, PublicProvider, PublicProviderDetails, UpdateProviderProfileDto, ProviderServiceDto, ProviderService as IProviderService } from "@/types/provider.types";

export const providerService = {
  getPublicProviders: (params?: Record<string, any>) =>
    api.get<ApiResponse<PublicProvider[]>>(API_ENDPOINTS.PUBLIC_PROVIDERS, { params }),

  getPublicProviderById: (id: string) =>
    api.get<ApiResponse<PublicProviderDetails>>(`${API_ENDPOINTS.PUBLIC_PROVIDERS}/${id}`),

  apply: (dto: ProviderApplicationDto) =>
    api.post<ApiResponse<ProviderApplication>>(API_ENDPOINTS.APPLY_PROVIDER, dto),

  /**
   * Fetches the authenticated provider's own application status (JWT-protected).
   * Used on the provider portal dashboard/status screens for logged-in providers.
   */
  getApplicationStatus: () =>
    api.get<ApiResponse<ProviderApplicationStatus>>(API_ENDPOINTS.PROVIDER_APPLICATION_STATUS),

  /**
   * Reapply after a rejected application (JWT-protected).
   * Updates the existing rejected application to pending status with new data.
   */
  reapply: (dto: ProviderApplicationDto) =>
    api.put<ApiResponse<ProviderApplication>>(API_ENDPOINTS.PROVIDER_REAPPLY, dto),



  getProfile: () =>
    api.get<ApiResponse<ProviderProfile>>(API_ENDPOINTS.PROVIDER_PROFILE),

  updateProfile: (dto: UpdateProviderProfileDto) =>
    api.put<ApiResponse<ProviderProfile>>(API_ENDPOINTS.PROVIDER_PROFILE, dto),

  changePassword: (dto: { oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROVIDER_PROFILE}/password`, dto),

  uploadHeadshot: (base64Image: string) =>
    api.put<ApiResponse<ProviderProfile>>(API_ENDPOINTS.PROVIDER_PROFILE, { headshot: base64Image }),

  addService: (dto: ProviderServiceDto) =>
    api.post<ApiResponse<IProviderService>>(API_ENDPOINTS.SERVICES, dto),

  updateService: (id: string, dto: ProviderServiceDto) =>
    api.put<ApiResponse<IProviderService>>(API_ENDPOINTS.SERVICE_BY_ID(id), dto),

  deleteService: (id: string) =>
    api.delete<ApiResponse<null>>(API_ENDPOINTS.SERVICE_BY_ID(id)),
};
