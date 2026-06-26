import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { Quotation, CreateQuotationDto, ReviseQuotationDto } from "@/types/order.types";

export const quotationService = {
  submit: (dto: CreateQuotationDto) =>
    api.post<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATIONS, dto),

  revise: (id: string, dto: ReviseQuotationDto) =>
    api.put<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATION_REVISE(id), dto),

  accept: (id: string) =>
    api.patch<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATION_ACCEPT(id)),

  reject: (id: string) =>
    api.patch<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATION_REJECT(id)),

  requestModification: (id: string, comment: string) =>
    api.patch<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATION_MODIFICATION(id), { comment }),

  getForOrder: (orderId: string) =>
    api.get<ApiResponse<Quotation[]>>(API_ENDPOINTS.QUOTATIONS_FOR_ORDER(orderId)),

  getMyQuotations: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ items: Quotation[]; total: number }>>(API_ENDPOINTS.QUOTATIONS_MY, { params }),
};
