import { IInspectionRequestService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { ServiceModel } from "../models/service.model";
import { CreateInspectionDto } from "../dto/service-order/serviceOrder.dto";
import { NotFoundError, BadRequestError } from "../shared/errors/HttpErrors";
import { nanoid } from "nanoid";

export class InspectionRequestService implements IInspectionRequestService {
  constructor(private readonly orderRepo: IServiceOrderRepository) {}

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
      status: "inspection_pending",
      statusHistory: [{ status: "inspection_pending", at: new Date(), actor: customerId }],
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
}
