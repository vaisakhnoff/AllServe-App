import api from "@/api";
import { ApiResponse } from "@/types/auth.types";
import {
  ProviderQuote,
  CreateProviderQuoteDto,
  ProviderQuoteListResponse,
} from "@/types/serviceRequest.types";

export const providerQuoteService = {
  submit: (dto: CreateProviderQuoteDto) =>
    api.post<ApiResponse<ProviderQuote>>("/provider-quotes", dto),

  getMyQuotes: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<ProviderQuoteListResponse>>("/provider-quotes/my", { params }),

  update: (id: string, data: Partial<CreateProviderQuoteDto>) =>
    api.patch<ApiResponse<ProviderQuote>>(`/provider-quotes/${id}`, data),

  withdraw: (id: string) =>
    api.patch<ApiResponse<{ message: string }>>(`/provider-quotes/${id}/withdraw`),

  getForRequest: (requestId: string) =>
    api.get<ApiResponse<ProviderQuote[]>>(`/provider-quotes/request/${requestId}`),

  accept: (id: string) =>
    api.patch<ApiResponse<{ quote: ProviderQuote; booking: unknown }>>(`/provider-quotes/${id}/accept`),

  getStats: () =>
    api.get<ApiResponse<{ total: number; accepted: number; pending: number; acceptanceRate: number }>>("/provider-quotes/stats"),
};
