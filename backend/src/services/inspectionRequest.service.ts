import { IInspectionRequestService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { ServiceModel } from "../models/service.model";
import { CreateInspectionDto } from "../dto/service-order/serviceOrder.dto";
import { NotFoundError, BadRequestError, ForbiddenError } from "../shared/errors/HttpErrors";
import { nanoid } from "nanoid";

export class InspectionRequestService implements IInspectionRequestService {
  constructor(private readonly orderRepo: IServiceOrderRepository) {}

  private extractId(ref: unknown): string {
    if (ref && typeof ref === "object" && "_id" in (ref as unknown as Record<string, unknown>)) {
      return String((ref as unknown as { _id: unknown })._id);
    }
    return String(ref);
  }

  async createRequest(customerId: string, dto: CreateInspectionDto): Promise<IServiceOrder> {
    const service = await ServiceModel.findById(dto.serviceId).lean();
    if (!service) throw new NotFoundError("Service not found");
    if (service.deliveryModel !== "inspection_required") {
      throw new BadRequestError("This service does not support inspection requests");
    }
    if (service.status !== "active" || service.isDeleted) throw new BadRequestError("Service is not available");

    const order = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: customerId as unknown as IServiceOrder["customerId"],
      providerId: dto.providerId as unknown as IServiceOrder["providerId"],
      serviceId: dto.serviceId as unknown as IServiceOrder["serviceId"],
      categoryId: service.categoryId,
      deliveryModel: "inspection_required",
      status: "awaiting_provider_response",
      statusHistory: [{ status: "awaiting_provider_response", at: new Date(), actor: customerId }],
      description: dto.description,
      images: dto.images || [],
      address: dto.address,
      exactLocation: dto.exactLocation,
      platformFee: service.inspectionFee || 0,
      platformFeeStatus: "paid",
      quoteCount: 0,
    });

    return order;
  }

  async acceptInspection(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") throw new BadRequestError("Order cannot be accepted in current state");

    return (await this.orderRepo.updateStatus(orderId, "inspection_accepted", { respondedAt: new Date() }))!;
  }

  async rejectInspection(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "awaiting_provider_response") throw new BadRequestError("Order cannot be rejected in current state");

    return (await this.orderRepo.updateStatus(orderId, "rejected_by_provider", { respondedAt: new Date() }))!;
  }

  async markInspectionDone(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "inspection_accepted") throw new BadRequestError("Must be in inspection_accepted state");

    return (await this.orderRepo.updateStatus(orderId, "inspection_completed"))!;
  }

  async dropByProvider(orderId: string, providerId: string, reason: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    const droppableStatuses = ["inspection_accepted", "inspection_completed"];
    if (!droppableStatuses.includes(order.status)) throw new BadRequestError("Cannot drop in current state");

    return (await this.orderRepo.updateStatus(orderId, "dropped_by_provider", { dropReason: reason }))!;
  }

  async dropByCustomer(orderId: string, customerId: string, reason: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.customerId) !== customerId) throw new ForbiddenError("Unauthorized");
    const droppableStatuses = ["awaiting_provider_response", "inspection_accepted", "inspection_completed", "quotation_submitted"];
    if (!droppableStatuses.includes(order.status)) throw new BadRequestError("Cannot drop in current state");

    return (await this.orderRepo.updateStatus(orderId, "dropped_by_customer", { dropReason: reason }))!;
  }

  async startWork(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "quotation_accepted") throw new BadRequestError("Quotation must be accepted before starting work");

    return (await this.orderRepo.updateStatus(orderId, "in_progress"))!;
  }

  async completeWork(orderId: string, providerId: string): Promise<IServiceOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.deliveryModel !== "inspection_required") throw new BadRequestError("Not an inspection order");
    if (this.extractId(order.providerId) !== providerId) throw new ForbiddenError("Unauthorized");
    if (order.status !== "in_progress") throw new BadRequestError("Work must be in progress");

    return (await this.orderRepo.updateStatus(orderId, "work_completed"))!;
  }
}
