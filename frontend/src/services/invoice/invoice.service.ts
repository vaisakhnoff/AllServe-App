import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { Invoice, CreateInvoiceDto } from "@/types/order.types";

export const invoiceService = {
  generate: (dto: CreateInvoiceDto) =>
    api.post<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICES, dto),

  payOnline: (id: string) =>
    api.patch<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICE_PAY_ONLINE(id)),

  markCash: (id: string) =>
    api.patch<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICE_MARK_CASH(id)),

  getByOrder: (orderId: string) =>
    api.get<ApiResponse<Invoice | null>>(API_ENDPOINTS.INVOICE_BY_ORDER(orderId)),
};
