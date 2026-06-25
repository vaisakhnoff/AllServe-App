import { IServiceOrderQueryService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository, PaginatedOrders } from "../interfaces/service-order/IServiceOrderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { OrderQuery } from "../dto/service-order/serviceOrder.dto";
import { NotFoundError, ForbiddenError, BadRequestError } from "../shared/errors/HttpErrors";

export class ServiceOrderQueryService implements IServiceOrderQueryService {
  constructor(private readonly repo: IServiceOrderRepository) {}

  async getCustomerOrders(customerId: string, query: OrderQuery): Promise<PaginatedOrders> {
    const filter: Record<string, unknown> = {};
    if (query.deliveryModel) filter.deliveryModel = query.deliveryModel;
    if (query.status) filter.status = query.status;
    return this.repo.findByCustomer(customerId, filter, query.page, query.limit);
  }

  async getProviderOrders(providerId: string, query: OrderQuery): Promise<PaginatedOrders> {
    const filter: Record<string, unknown> = {};
    if (query.deliveryModel) filter.deliveryModel = query.deliveryModel;
    if (query.status) filter.status = query.status;
    return this.repo.findByProvider(providerId, filter, query.page, query.limit);
  }

  async getOrderById(id: string, actorId: string): Promise<IServiceOrder> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundError("Order not found");

    const isCustomer = String(order.customerId) === actorId ||
      (order.customerId && typeof order.customerId === "object" && "_id" in order.customerId &&
        String((order.customerId as unknown as { _id: unknown })._id) === actorId);
    const isProvider = order.providerId && (
      String(order.providerId) === actorId ||
      (typeof order.providerId === "object" && "_id" in order.providerId &&
        String((order.providerId as unknown as { _id: unknown })._id) === actorId)
    );

    if (!isCustomer && !isProvider) throw new ForbiddenError("Unauthorized");
    return order;
  }

  async cancelOrder(id: string, actorId: string, reason?: string): Promise<IServiceOrder> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundError("Order not found");

    const isCustomer = String(order.customerId) === actorId ||
      (order.customerId && typeof order.customerId === "object" && "_id" in order.customerId &&
        String((order.customerId as unknown as { _id: unknown })._id) === actorId);

    if (!isCustomer) throw new ForbiddenError("Only the customer can cancel an order");

    // Determine if cancellation is allowed based on delivery model and status
    const cancellableStatuses: Record<string, string[]> = {
      direct: ["awaiting_provider_response", "accepted"],
      inspection_required: ["inspection_pending", "quotation_submitted"],
      custom: ["broadcast_open", "receiving_quotations"],
    };

    const allowed = cancellableStatuses[order.deliveryModel] || [];
    if (!allowed.includes(order.status)) {
      throw new BadRequestError(`Cannot cancel order in status "${order.status}"`);
    }

    const updated = await this.repo.updateStatus(id, "cancelled", {
      statusHistory: [
        ...order.statusHistory,
        { status: "cancelled", at: new Date(), actor: actorId, note: reason },
      ],
    } as Partial<IServiceOrder>);

    return updated!;
  }
}
