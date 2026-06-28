import { IQuotationService } from "../interfaces/quotation/IQuotationService";
import { IQuotationRepository } from "../interfaces/quotation/IQuotationRepository";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IQuotation } from "../models/quotation.model";
import { CreateQuotationDto, ReviseQuotationDto, ModificationRequestDto } from "../dto/quotation/quotation.dto";
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from "../shared/errors/HttpErrors";

export class QuotationService implements IQuotationService {
  constructor(
    private readonly repo: IQuotationRepository,
    private readonly orderRepo: IServiceOrderRepository
  ) {}

  private extractId(ref: unknown): string {
    if (ref && typeof ref === "object" && "_id" in (ref as unknown as Record<string, unknown>)) {
      return String((ref as unknown as { _id: unknown })._id);
    }
    return String(ref);
  }

  async submit(providerId: string, dto: CreateQuotationDto): Promise<IQuotation> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) throw new NotFoundError("Order not found");

    // Validate order accepts quotations
    const validStatuses = ["inspection_completed", "broadcast_open", "receiving_quotations"];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestError("This order is not accepting quotations");
    }

    // For inspection: only the assigned provider can submit
    if (order.deliveryModel === "inspection_required") {
      const orderProviderId = order.providerId && typeof order.providerId === "object" && "_id" in (order.providerId as unknown as Record<string, unknown>)
        ? String((order.providerId as unknown as { _id: unknown })._id)
        : String(order.providerId);
      if (orderProviderId !== providerId) {
        throw new ForbiddenError("Only the assigned provider can submit a quotation for inspection orders");
      }
      // Check for existing active quotation
      const existing = await this.repo.findByOrderAndProvider(dto.orderId, providerId);
      if (existing && ["submitted", "modification_requested"].includes(existing.status)) {
        throw new ConflictError("You already have an active quotation for this order");
      }
    }

    // For custom: check for existing quotation from this provider
    if (order.deliveryModel === "custom") {
      const existing = await this.repo.findByOrderAndProvider(dto.orderId, providerId);
      if (existing) throw new ConflictError("You have already submitted a quotation for this order");
    }

    const totalAmount = dto.labourCharge + dto.materialCost + dto.additionalCharges;
    const revision = {
      revisionNumber: 1,
      labourCharge: dto.labourCharge,
      materialCost: dto.materialCost,
      additionalCharges: dto.additionalCharges,
      estimatedDurationDays: dto.estimatedDurationDays,
      advanceRequired: dto.advanceRequired,
      advanceAmount: dto.advanceAmount,
      notes: dto.notes,
      termsAndConditions: dto.termsAndConditions,
      attachments: dto.attachments || [],
      submittedAt: new Date(),
    };

    const quotation = await this.repo.create({
      orderId: dto.orderId as unknown as IQuotation["orderId"],
      providerId: providerId as unknown as IQuotation["providerId"],
      status: "submitted",
      currentRevision: revision,
      revisionHistory: [revision],
      totalAmount,
    });

    // Update order status
    await this.orderRepo.incrementQuoteCount(dto.orderId);
    if (order.deliveryModel === "inspection_required" && order.status === "inspection_completed") {
      await this.orderRepo.updateStatus(dto.orderId, "quotation_submitted");
    } else if (order.deliveryModel === "custom" && order.status === "broadcast_open") {
      await this.orderRepo.updateStatus(dto.orderId, "receiving_quotations");
    }

    return quotation;
  }

  async accept(quotationId: string, customerId: string): Promise<IQuotation> {
    const quotation = await this.repo.findById(quotationId);
    if (!quotation) throw new NotFoundError("Quotation not found");
    if (quotation.status !== "submitted") throw new BadRequestError("Only submitted quotations can be accepted");

    const order = await this.orderRepo.findById(this.extractId(quotation.orderId));
    if (!order) throw new NotFoundError("Order not found");

    const orderCustomerId = this.extractId(order.customerId);
    if (orderCustomerId !== customerId) throw new ForbiddenError("Unauthorized");

    // Accept this quotation
    await this.repo.updateStatus(quotationId, "accepted");

    // Reject all other quotations for this order (custom flow)
    if (order.deliveryModel === "custom") {
      await this.repo.rejectAllExcept(this.extractId(quotation.orderId), quotationId);
    }

    // Determine next order status
    const needsAdvance = quotation.currentRevision.advanceRequired && quotation.currentRevision.advanceAmount > 0;
    const nextStatus = needsAdvance ? "awaiting_advance" : "in_progress";

    await this.orderRepo.updateStatus(this.extractId(order._id), nextStatus as never, {
      selectedQuotationId: quotation._id,
      providerId: quotation.providerId,
    });

    return (await this.repo.findById(quotationId))!;
  }

  async reject(quotationId: string, customerId: string): Promise<IQuotation> {
    const quotation = await this.repo.findById(quotationId);
    if (!quotation) throw new NotFoundError("Quotation not found");
    if (quotation.status !== "submitted") throw new BadRequestError("Only submitted quotations can be rejected");

    const order = await this.orderRepo.findById(this.extractId(quotation.orderId));
    if (!order) throw new NotFoundError("Order not found");
    const orderCustomerId = this.extractId(order.customerId);
    if (orderCustomerId !== customerId) throw new ForbiddenError("Unauthorized");

    await this.repo.updateStatus(quotationId, "rejected");
    return (await this.repo.findById(quotationId))!;
  }

  async requestModification(quotationId: string, customerId: string, dto: ModificationRequestDto): Promise<IQuotation> {
    const quotation = await this.repo.findById(quotationId);
    if (!quotation) throw new NotFoundError("Quotation not found");
    if (quotation.status !== "submitted") throw new BadRequestError("Only submitted quotations can be modified");

    const order = await this.orderRepo.findById(this.extractId(quotation.orderId));
    if (!order) throw new NotFoundError("Order not found");
    const orderCustomerId = this.extractId(order.customerId);
    if (orderCustomerId !== customerId) throw new ForbiddenError("Unauthorized");

    await this.repo.updateStatus(quotationId, "modification_requested", {
      modificationComment: dto.comment,
    });

    return (await this.repo.findById(quotationId))!;
  }

  async revise(quotationId: string, providerId: string, dto: ReviseQuotationDto): Promise<IQuotation> {
    const quotation = await this.repo.findById(quotationId);
    if (!quotation) throw new NotFoundError("Quotation not found");
    if (quotation.status !== "modification_requested") {
      throw new BadRequestError("Only quotations with modification requested can be revised");
    }

    const qProviderId = this.extractId(quotation.providerId);
    if (qProviderId !== providerId) throw new ForbiddenError("Unauthorized");

    const newRevisionNumber = quotation.revisionHistory.length + 1;
    const totalAmount = dto.labourCharge + dto.materialCost + dto.additionalCharges;

    const newRevision = {
      revisionNumber: newRevisionNumber,
      labourCharge: dto.labourCharge,
      materialCost: dto.materialCost,
      additionalCharges: dto.additionalCharges,
      estimatedDurationDays: dto.estimatedDurationDays,
      advanceRequired: dto.advanceRequired,
      advanceAmount: dto.advanceAmount,
      notes: dto.notes,
      termsAndConditions: dto.termsAndConditions,
      attachments: dto.attachments || [],
      submittedAt: new Date(),
    };

    await this.repo.update(quotationId, {
      status: "submitted",
      currentRevision: newRevision,
      totalAmount,
      modificationComment: undefined,
      $push: { revisionHistory: newRevision },
    } as unknown as Partial<IQuotation>);

    return (await this.repo.findById(quotationId))!;
  }

  async getForOrder(orderId: string): Promise<IQuotation[]> {
    return this.repo.findByOrderId(orderId);
  }

  async getProviderQuotations(providerId: string, page?: number, limit?: number): Promise<{ items: IQuotation[]; total: number }> {
    return this.repo.findByProvider(providerId, page, limit);
  }
}
