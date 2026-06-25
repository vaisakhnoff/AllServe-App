import { IServiceOrder } from "../../models/serviceOrder.model";
import {
  CreateDirectInstantDto,
  CreateDirectScheduledDto,
  CreateInspectionDto,
  CreateCustomDto,
  CustomerChoiceDto,
  OrderQuery,
} from "../../dto/service-order/serviceOrder.dto";
import { PaginatedOrders } from "./IServiceOrderRepository";

export interface IDirectRequestService {
  createInstantRequest(customerId: string, dto: CreateDirectInstantDto): Promise<IServiceOrder>;
  createScheduledRequest(customerId: string, dto: CreateDirectScheduledDto): Promise<IServiceOrder>;
  acceptRequest(orderId: string, providerId: string): Promise<IServiceOrder>;
  rejectRequest(orderId: string, providerId: string): Promise<IServiceOrder>;
  handleCustomerChoice(orderId: string, customerId: string, dto: CustomerChoiceDto): Promise<IServiceOrder>;
}

export interface IInspectionRequestService {
  createRequest(customerId: string, dto: CreateInspectionDto): Promise<IServiceOrder>;
}

export interface ICustomRequestService {
  createRequest(customerId: string, dto: CreateCustomDto): Promise<IServiceOrder>;
}

export interface IServiceOrderQueryService {
  getCustomerOrders(customerId: string, query: OrderQuery): Promise<PaginatedOrders>;
  getProviderOrders(providerId: string, query: OrderQuery): Promise<PaginatedOrders>;
  getOrderById(id: string, actorId: string): Promise<IServiceOrder>;
  cancelOrder(id: string, actorId: string, reason?: string): Promise<IServiceOrder>;
}
