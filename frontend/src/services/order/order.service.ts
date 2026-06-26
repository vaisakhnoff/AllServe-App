import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import {
  ServiceOrder,
  PaginatedOrders,
  CreateDirectInstantDto,
  CreateDirectScheduledDto,
  CreateInspectionRequestDto,
  CreateCustomRequestDto,
  CustomerChoiceDto,
  OrderListQuery,
} from "@/types/order.types";

export const orderService = {
  // ── Create Orders ───────────────────────────────────────────────────────
  createDirectInstant: (dto: CreateDirectInstantDto) =>
    api.post<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDERS_DIRECT_INSTANT, dto),

  createDirectScheduled: (dto: CreateDirectScheduledDto) =>
    api.post<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDERS_DIRECT_SCHEDULED, dto),

  createInspection: (dto: CreateInspectionRequestDto) =>
    api.post<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDERS_INSPECTION, dto),

  createCustom: (dto: CreateCustomRequestDto) =>
    api.post<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDERS_CUSTOM, dto),

  // ── Provider Actions ────────────────────────────────────────────────────
  accept: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_ACCEPT(id)),

  reject: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_REJECT(id)),

  // ── Customer Actions ────────────────────────────────────────────────────
  customerChoice: (id: string, dto: CustomerChoiceDto) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_CUSTOMER_CHOICE(id), dto),

  cancel: (id: string, reason?: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_CANCEL(id), { reason }),

  // ── Query ───────────────────────────────────────────────────────────────
  getMyOrders: (query?: OrderListQuery) =>
    api.get<ApiResponse<PaginatedOrders>>(API_ENDPOINTS.ORDERS_MY, { params: query }),

  getProviderOrders: (query?: OrderListQuery) =>
    api.get<ApiResponse<PaginatedOrders>>(API_ENDPOINTS.ORDERS_PROVIDER, { params: query }),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_BY_ID(id)),
};
