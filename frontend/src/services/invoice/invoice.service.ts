import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { Invoice, CreateInvoiceDto } from "@/types/order.types";

export const invoiceService = {
  generate: (dto: CreateInvoiceDto) =>
    api.post<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICES, dto),

  /**
   * Fetch pre-filled invoice data from the accepted quotation.
   * Returns null for direct orders (provider fills manually).
   * Use this to populate the invoice form before calling generate().
   */
  getPrefill: (orderId: string) =>
    api.get<ApiResponse<{
      fromQuotation: boolean;
      quotationId: string;
      labourCharge: number;
      materialCost: number;
      additionalCharges: number;
      estimatedDurationDays: number;
      notes?: string;
      termsAndConditions?: string;
      totalAmount: number;
    } | null>>(API_ENDPOINTS.INVOICE_PREFILL(orderId)),

  payOnline: (id: string) =>
    api.patch<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICE_PAY_ONLINE(id)),

  markCash: (id: string) =>
    api.patch<ApiResponse<Invoice>>(API_ENDPOINTS.INVOICE_MARK_CASH(id)),

  getByOrder: (orderId: string) =>
    api.get<ApiResponse<Invoice | null>>(API_ENDPOINTS.INVOICE_BY_ORDER(orderId)),
};
