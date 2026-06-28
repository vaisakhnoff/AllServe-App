import { IDirectRequestService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IProviderRepository } from "../interfaces/provider/IProviderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { ServiceModel } from "../models/service.model";
import { CreateDirectInstantDto, CreateDirectScheduledDto, CustomerChoiceDto } from "../dto/service-order/serviceOrder.dto";
import { NotFoundError, BadRequestError, ForbiddenError } from "../shared/errors/HttpErrors";
import { nanoid } from "nanoid";

export class DirectRequestService implements IDirectRequestService {
  constructor(
    private readonly orderRepo: IServiceOrderRepository,
    private readonly providerRepo: IProviderRepository
  ) {}

  async createInstantRequest(customerId: string, dto: CreateDirectInstantDto): Promise<IServiceOrder> {
    const service = await ServiceModel.findById(dto.serviceId).lean();
    if (!service) throw new NotFoundError("Service not found");
    const effectiveDeliveryModel = service.deliveryModel || "direct";
    if (effectiveDeliveryModel !== "direct") throw new BadRequestError("This service does not support direct requests");
    if (service.status !== "active" || service.isDeleted) throw new BadRequestError("Service is not available");

    const provider = await this.providerRepo.findById(dto.providerId);
    if (!provider) throw new NotFoundError("Provider not found");
    if (provider.onlineStatus !== "online") throw new BadRequestError("Provider is currently offline");
    if (provider.engagementStatus !== "available") throw new BadRequestError("Provider is currently busy");

    const responseDeadline = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const order = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: customerId as unknown as IServiceOrder["customerId"],
      providerId: dto.providerId as unknown as IServiceOrder["providerId"],
      serviceId: dto.serviceId as unknown as IServiceOrder["serviceId"],
      categoryId: service.categoryId,
      deliveryModel: "direct",
      subMode: "instant",
      status: "awaiting_provider_response",
      statusHistory: [{ status: "awaiting_provider_response", at: new Date(), actor: customerId }],
      description: dto.description,
      images: dto.images || [],
      address: dto.address,
      exactLocation: dto.exactLocation,
      responseDeadline,
      platformFee: 0, // TODO: compute from category settings
      platformFeeStatus: "paid",
      quoteCount: 0,
    });

    return order;
  }

  async createScheduledRequest(customerId: string, dto: CreateDirectScheduledDto): Promise<IServiceOrder> {
    const service = await ServiceModel.findById(dto.serviceId).lean();
    if (!service) throw new NotFoundError("Service not found");
    const effectiveDeliveryModel = service.deliveryModel || "direct";
    if (effectiveDeliveryModel !== "direct") throw new BadRequestError("This service does not support direct requests");
    if (service.status !== "active" || service.isDeleted) throw new BadRequestError("Service is not available");

    const provider = await this.providerRepo.findById(dto.providerId);
    if (!provider) throw new NotFoundError("Provider not found");

    const order = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: customerId as unknown as IServiceOrder["customerId"],
      providerId: dto.providerId as unknown as IServiceOrder["providerId"],
      serviceId: dto.serviceId as unknown as IServiceOrder["serviceId"],
      categoryId: service.categoryId,
      deliveryModel: "direct",
      subMode: "scheduled",
      status: "awaiting_provider_response",
      statusHistory: [{ status: "awaiting_provider_response", at: new Date(), actor: customerId }],
      description: dto.description,
      images: dto.images || [],
      address: dto.address,
      exactLocation: dto.exactLocation,
      preferredDate: dto.preferredDate,
      preferredTime: dto.preferredTime,
      platformFee: 0,
      platformFeeStatus: "paid",
      quoteCount: 0,
    });

    return order;
  }

  private extractId(ref: unknown): string {
    if (ref && typeof ref === "object" && "_id" in (ref as Record<string, unknown>)) {
      return String((ref as Record<string, unknown>)._id);
    }
    return String(ref);
  }

  async acceptRequest(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") throw new BadRequestError("Order cannot be accepted in current state");

    const updated = await this.orderRepo.updateStatus(orderId, "accepted", {
      respondedAt: new Date(),
    });

    

    return updated!;
  }

  async rejectRequest(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") throw new BadRequestError("Order cannot be rejected in current state");

    const updated = await this.orderRepo.updateStatus(orderId, "rejected_by_provider", {
      respondedAt: new Date(),
    });

    return updated!;
  }

  async handleCustomerChoice(orderId: string, customerId: string, dto: CustomerChoiceDto): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (this.extractId(order.customerId) !== customerId) throw new ForbiddenError("Unauthorized");
    if (!["rejected_by_provider", "provider_unresponsive"].includes(order.status)) {
      throw new BadRequestError("Customer choice is not available for this order");
    }

    if (dto.choice === "refund") {
      return (await this.orderRepo.updateStatus(orderId, "cancelled_with_refund", {
        customerChoice: "refund",
        platformFeeStatus: "refunded",
      }))!;
    }

    // Reroute: create a new order with the new provider
    if (!dto.newProviderId) throw new BadRequestError("New provider is required for reroute");

    const newProvider = await this.providerRepo.findById(dto.newProviderId);
    if (!newProvider) throw new NotFoundError("New provider not found");

    // Mark original as cancelled
    await this.orderRepo.updateStatus(orderId, "cancelled_with_refund", {
      customerChoice: "reroute",
    });

    // Create new order
    const responseDeadline = order.subMode === "instant"
      ? new Date(Date.now() + 30 * 60 * 1000)
      : undefined;

    const newOrder = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: order.customerId,
      providerId: dto.newProviderId as unknown as IServiceOrder["providerId"],
      serviceId: order.serviceId,
      categoryId: order.categoryId,
      deliveryModel: "direct",
      subMode: order.subMode,
      status: "awaiting_provider_response",
      statusHistory: [{ status: "awaiting_provider_response", at: new Date(), actor: customerId, note: "Rerouted from previous order" }],
      description: order.description,
      images: order.images,
      address: order.address,
      exactLocation: order.exactLocation,
      preferredDate: order.preferredDate,
      preferredTime: order.preferredTime,
      responseDeadline,
      platformFee: order.platformFee,
      platformFeeStatus: "paid",
      quoteCount: 0,
      reroutedFromOrderId: order._id,
    });

    return newOrder;
  }

async startWork(orderId: string, providerId: string): Promise<IServiceOrder> {
  const order = await this.orderRepo.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");
  if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
  const validStartStatuses = ["accepted", "quotation_accepted"];
  if (!validStartStatuses.includes(order.status)) throw new BadRequestError("Order must be accepted before starting work");

  const updated = await this.orderRepo.updateStatus(orderId, "in_progress");

  // Set provider busy
  await this.providerRepo.updateAccount(providerId, {
    engagementStatus: "busy",
    lastStatusChangeAt: new Date(),
  } as Record<string, unknown>);

  // Emit socket event
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

async completeWork(orderId: string, providerId: string): Promise<IServiceOrder> {
  const order = await this.orderRepo.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");
  if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
  if (order.status !== "in_progress") throw new BadRequestError("Order must be in progress to mark as complete");

  const updated = await this.orderRepo.updateStatus(orderId, "work_completed");

  // Set provider available again
  await this.providerRepo.updateAccount(providerId, {
    engagementStatus: "available",
    lastStatusChangeAt: new Date(),
  } as Record<string, unknown>);

  // Emit socket event
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


}
