import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IProviderRepository } from "../interfaces/provider/IProviderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { NotFoundError, BadRequestError, ForbiddenError } from "../shared/errors/HttpErrors";

/**
 * Custom order lifecycle — quotation-based flow:
 *
 *   awaiting_provider_response
 *     ↓ acceptCustom()         ↓ rejectCustom()
 *   quotation_submitted       cancelled
 *     ↓ (quotation.service submit — sets order status to quotation_submitted)
 *   quotation_submitted
 *     ↓ (user accepts quotation via quotation.service → sets to quotation_accepted)
 *   quotation_accepted
 *     ↓ startWork()
 *   in_progress
 *     ↓ completeWork()
 *   work_completed
 *     ↓ (invoice generated + paid)
 *   awaiting_payment → completed
 */
export class CustomOrderLifecycleService {
  constructor(
    private readonly orderRepo: IServiceOrderRepository,
    private readonly providerRepo: IProviderRepository
  ) {}

  private extractId(ref: unknown): string {
    if (ref && typeof ref === "object" && "_id" in (ref as Record<string, unknown>)) {
      return String((ref as Record<string, unknown>)._id);
    }
    return String(ref);
  }

  /**
   * Provider accepts the custom service request.
   * Order moves from awaiting_provider_response → quotation_submitted so the
   * provider can then send a Quotation via the quotation API.
   */
  async acceptCustom(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") {
      throw new BadRequestError(`Cannot accept in status '${order.status}'`);
    }

    return (await this.orderRepo.updateStatus(orderId, "quotation_submitted", {
      respondedAt: new Date(),
    } as Partial<IServiceOrder>))!;
  }

  /**
   * Provider rejects the custom service request.
   */
  async rejectCustom(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") {
      throw new BadRequestError(`Cannot reject in status '${order.status}'`);
    }

    return (await this.orderRepo.updateStatus(orderId, "cancelled", {
      respondedAt: new Date(),
      dropReason: "Rejected by provider",
    } as Partial<IServiceOrder>))!;
  }

  /**
   * Provider starts work after the user has accepted the quotation.
   */
  async startWork(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");

    if (!["quotation_accepted", "awaiting_advance"].includes(order.status)) {
      throw new BadRequestError(
        `Order must have an accepted quotation to start work, currently in '${order.status}'`
      );
    }

    const updated = await this.orderRepo.updateStatus(orderId, "in_progress");

    await this.providerRepo.updateAccount(providerId, {
      engagementStatus: "busy",
      lastStatusChangeAt: new Date(),
    } as Record<string, unknown>);

    try {
      const { getIo } = await import("../socket/io");
      getIo().to(`provider:${providerId}`).emit("provider:status-changed", {
        providerId,
        onlineStatus: "online",
        engagementStatus: "busy",
      });
    } catch {}

    return updated!;
  }

  /**
   * Provider marks work as complete.
   */
  async completeWork(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "in_progress") {
      throw new BadRequestError("Order must be in progress to mark as complete");
    }

    const updated = await this.orderRepo.updateStatus(orderId, "work_completed");

    await this.providerRepo.updateAccount(providerId, {
      engagementStatus: "available",
      lastStatusChangeAt: new Date(),
    } as Record<string, unknown>);

    try {
      const { getIo } = await import("../socket/io");
      getIo().to(`provider:${providerId}`).emit("provider:status-changed", {
        providerId,
        onlineStatus: "online",
        engagementStatus: "available",
      });
    } catch {}

    return updated!;
  }

  /**
   * Provider drops the job (only before work starts or while in progress).
   */
  async dropByProvider(orderId: string, providerId: string, reason: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");

    const droppable = [
      "awaiting_provider_response",
      "quotation_submitted",
      "quotation_accepted",
      "awaiting_advance",
      "in_progress",
    ];
    if (!droppable.includes(order.status)) {
      throw new BadRequestError(`Cannot drop in status '${order.status}'`);
    }

    const updated = await this.orderRepo.updateStatus(orderId, "cancelled", {
      dropReason: reason,
    } as Partial<IServiceOrder>);

    if (order.status === "in_progress") {
      await this.providerRepo.updateAccount(providerId, {
        engagementStatus: "available",
        lastStatusChangeAt: new Date(),
      } as Record<string, unknown>);

      try {
        const { getIo } = await import("../socket/io");
        getIo().to(`provider:${providerId}`).emit("provider:status-changed", {
          providerId,
          onlineStatus: "online",
          engagementStatus: "available",
        });
      } catch {}
    }

    return updated!;
  }

  /**
   * Customer cancels/drops before work starts.
   */
  async dropByCustomer(orderId: string, customerId: string, reason: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "custom") throw new BadRequestError("Not a custom order");
    if (this.extractId(order.customerId) !== customerId) throw new ForbiddenError("Unauthorized");

    const droppable = [
      "awaiting_provider_response",
      "quotation_submitted",
      "quotation_accepted",
      "awaiting_advance",
    ];
    if (!droppable.includes(order.status)) {
      throw new BadRequestError(`Cannot cancel in status '${order.status}'`);
    }

    return (await this.orderRepo.updateStatus(orderId, "cancelled", {
      dropReason: reason,
    } as Partial<IServiceOrder>))!;
  }
}
