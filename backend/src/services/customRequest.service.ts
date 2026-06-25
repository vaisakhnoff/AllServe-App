import { ICustomRequestService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { CreateCustomDto } from "../dto/service-order/serviceOrder.dto";
import { CategoryModel } from "../models/category.model";
import { NotFoundError } from "../shared/errors/HttpErrors";
import { nanoid } from "nanoid";

export class CustomRequestService implements ICustomRequestService {
  constructor(private readonly orderRepo: IServiceOrderRepository) {}

  async createRequest(customerId: string, dto: CreateCustomDto): Promise<IServiceOrder> {
    const category = await CategoryModel.findById(dto.categoryId).lean();
    if (!category) throw new NotFoundError("Category not found");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day default expiry

    const order = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: customerId as unknown as IServiceOrder["customerId"],
      categoryId: dto.categoryId as unknown as IServiceOrder["categoryId"],
      deliveryModel: "custom",
      status: "broadcast_open",
      statusHistory: [{ status: "broadcast_open", at: new Date(), actor: customerId }],
      title: dto.title,
      description: dto.description,
      images: dto.images || [],
      address: dto.address,
      exactLocation: dto.exactLocation,
      budget: dto.budget,
      budgetType: dto.budgetType,
      platformFee: 0,
      platformFeeStatus: "paid",
      quoteCount: 0,
      expiresAt,
    });

    return order;
  }
}
