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

  startWork: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_START(id)),

  completeWork: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_COMPLETE(id)),

  // ── Inspection Lifecycle ────────────────────────────────────────────────
  acceptInspection: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_INSPECTION_ACCEPT(id)),

  rejectInspection: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_INSPECTION_REJECT(id)),

  markInspectionDone: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_INSPECTION_DONE(id)),

  inspectionStartWork: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_INSPECTION_START(id)),

  inspectionCompleteWork: (id: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_INSPECTION_COMPLETE(id)),

  dropByProvider: (id: string, reason: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_DROP_PROVIDER(id), { reason }),

  dropByCustomer: (id: string, reason: string) =>
    api.patch<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_DROP_CUSTOMER(id), { reason }),


  // ── Query ───────────────────────────────────────────────────────────────
  getMyOrders: (query?: OrderListQuery) =>
    api.get<ApiResponse<PaginatedOrders>>(API_ENDPOINTS.ORDERS_MY, { params: query }),

  getProviderOrders: (query?: OrderListQuery) =>
    api.get<ApiResponse<PaginatedOrders>>(API_ENDPOINTS.ORDERS_PROVIDER, { params: query }),

  getBroadcastCustom: (page = 1, limit = 20) =>
    api.get<ApiResponse<PaginatedOrders>>(API_ENDPOINTS.ORDERS_BROADCAST_CUSTOM, { params: { page, limit } }),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceOrder>>(API_ENDPOINTS.ORDER_BY_ID(id)),
};
