import { ICustomRequestService } from "../interfaces/service-order/IServiceOrderService";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IServiceOrder } from "../models/serviceOrder.model";
import { CreateCustomDto } from "../dto/service-order/serviceOrder.dto";
import { CategoryModel } from "../models/category.model";
import { NotFoundError, BadRequestError } from "../shared/errors/HttpErrors";
import { nanoid } from "nanoid";

/**
 * For custom orders: compute a nominal booking/listing fee.
 * = min(budget, budget * commissionRate%) capped at ₹500.
 * If no budget provided, fee is 0 (deferred to invoice time).
 */
async function computeCustomPlatformFee(budget: number | undefined, categoryId: unknown): Promise<number> {
  if (!budget || budget <= 0) return 0;
  try {
    const category = await CategoryModel.findById(categoryId).lean();
    const rate = category?.commissionRate ?? 15;
    const fee = Math.round((budget * rate) / 100);
    return Math.min(fee, 500); // cap at ₹500 to avoid large upfront charges
  } catch {
    return 0;
  }
}

/**
 * Custom service flow (provider-specific, quotation-based):
 *   awaiting_provider_response
 *     → (provider accepts) → quotation_submitted
 *     → (user accepts quote) → quotation_accepted
 *     → (provider starts) → in_progress
 *     → (provider completes) → work_completed
 *     → (invoice + payment) → awaiting_payment → completed
 *   OR provider rejects → cancelled
 */
export class CustomRequestService implements ICustomRequestService {
  constructor(private readonly orderRepo: IServiceOrderRepository) {}

  async createRequest(customerId: string, dto: CreateCustomDto): Promise<IServiceOrder> {
    const category = await CategoryModel.findById(dto.categoryId).lean();
    if (!category) throw new NotFoundError("Category not found");

    // Custom service MUST be directed at a specific provider
    if (!dto.providerId) {
      throw new BadRequestError("Custom service requests must target a specific provider");
    }

    const platformFee = await computeCustomPlatformFee(dto.budget, dto.categoryId);

    const order = await this.orderRepo.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: customerId as unknown as IServiceOrder["customerId"],
      providerId: dto.providerId as unknown as IServiceOrder["providerId"],
      ...(dto.serviceId ? { serviceId: dto.serviceId as unknown as IServiceOrder["serviceId"] } : {}),
      categoryId: dto.categoryId as unknown as IServiceOrder["categoryId"],
      deliveryModel: "custom",
      status: "awaiting_provider_response",
      statusHistory: [{ status: "awaiting_provider_response", at: new Date(), actor: customerId }],
      title: dto.title,
      description: dto.description,
      images: dto.images || [],
      address: dto.address,
      exactLocation: dto.exactLocation,
      contactPhone: dto.contactPhone,
      budget: dto.budget,
      budgetType: dto.budgetType,
      intakeResponses: dto.intakeResponses,
      platformFee,
      platformFeeStatus: platformFee > 0 ? "pending" : "paid",
      quoteCount: 0,
    });

    return order;
  }
}
