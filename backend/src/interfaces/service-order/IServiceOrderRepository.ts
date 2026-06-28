import { IServiceOrder, ServiceOrderStatus } from "../../models/serviceOrder.model";

export interface PaginatedOrders {
  items: IServiceOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface IServiceOrderRepository {
  create(data: Partial<IServiceOrder>): Promise<IServiceOrder>;
  findById(id: string): Promise<IServiceOrder | null>;
  findByOrderId(orderId: string): Promise<IServiceOrder | null>;
  findByCustomer(customerId: string, filter?: Record<string, unknown>, page?: number, limit?: number): Promise<PaginatedOrders>;
  findByProvider(providerId: string, filter?: Record<string, unknown>, page?: number, limit?: number): Promise<PaginatedOrders>;
  findBroadcastCustom(page?: number, limit?: number): Promise<PaginatedOrders>;
  findAll(filter?: Record<string, unknown>, page?: number, limit?: number): Promise<PaginatedOrders>;
  updateStatus(id: string, status: ServiceOrderStatus, extra?: Partial<IServiceOrder>): Promise<IServiceOrder | null>;
  update(id: string, data: Partial<IServiceOrder>): Promise<IServiceOrder | null>;
  findExpiredInstantRequests(now: Date): Promise<IServiceOrder[]>;
  findExpiredCustomRequests(now: Date): Promise<IServiceOrder[]>;
  incrementQuoteCount(id: string): Promise<void>;
}
