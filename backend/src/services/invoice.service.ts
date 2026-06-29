import { IInvoiceService } from "../interfaces/invoice/IInvoiceService";
import { IInvoiceRepository } from "../interfaces/invoice/IInvoiceRepository";
import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";
import { IInvoice } from "../models/invoice.model";
import { IServiceOrder } from "../models/serviceOrder.model";
import { CategoryModel } from "../models/category.model";
import { CreateInvoiceDto } from "../dto/invoice/invoice.dto";
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from "../shared/errors/HttpErrors";

export class InvoiceService implements IInvoiceService {
  constructor(
    private readonly repo: IInvoiceRepository,
    private readonly orderRepo: IServiceOrderRepository
  ) {}

  private extractId(ref: unknown): string {
    if (ref && typeof ref === "object" && "_id" in (ref as unknown as Record<string, unknown>)) {
      return String((ref as unknown as { _id: unknown })._id);
    }
    return String(ref);
  }

  async generate(providerId: string, dto: CreateInvoiceDto): Promise<IInvoice> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) throw new NotFoundError("Order not found");

    const orderProviderId = this.extractId(order.providerId);
    if (orderProviderId !== providerId) throw new ForbiddenError("Unauthorized");

    // Validate order is in correct state for invoice generation
    const validStatuses: Record<string, string[]> = {
      direct: ["work_completed"],
      inspection_required: ["work_completed"],
      custom: ["work_completed"],
    };
    const allowed = validStatuses[order.deliveryModel] || [];
    if (!allowed.includes(order.status)) {
      throw new BadRequestError(`Cannot generate invoice for order in status "${order.status}"`);
    }

    // Check no existing invoice
    const existing = await this.repo.findByOrderId(dto.orderId);
    if (existing) throw new ConflictError("Invoice already exists for this order");

    // Compute total and commission
    const total = dto.labourCharge + dto.materialCost + dto.additionalCharges - dto.discount;
    const category = await CategoryModel.findById(order.categoryId).lean();
    const commissionRate = category?.commissionRate ?? 15;
    const platformCommission = Math.round((total * commissionRate) / 100);

    const orderCustomerId = this.extractId(order.customerId);

    const invoice = await this.repo.create({
      orderId: dto.orderId as unknown as IInvoice["orderId"],
      providerId: providerId as unknown as IInvoice["providerId"],
      customerId: orderCustomerId as unknown as IInvoice["customerId"],
      labourCharge: dto.labourCharge,
      materialCost: dto.materialCost,
      additionalCharges: dto.additionalCharges,
      discount: dto.discount,
      total,
      lineItemNotes: dto.lineItemNotes,
      overallRemark: dto.overallRemark,
      paymentStatus: "pending",
      platformCommission,
    });

    // Transition order to awaiting_payment
    await this.orderRepo.updateStatus(dto.orderId, "awaiting_payment" as never, {
      invoiceId: invoice._id,
    } as Partial<IServiceOrder>);

    return invoice;
  }

  async payOnline(invoiceId: string, customerId: string): Promise<IInvoice> {
    const invoice = await this.repo.findById(invoiceId);
    if (!invoice) throw new NotFoundError("Invoice not found");
    if (invoice.paymentStatus !== "pending") throw new BadRequestError("Invoice is already settled");

    const invCustomerId = this.extractId(invoice.customerId);
    if (invCustomerId !== customerId) throw new ForbiddenError("Unauthorized");

    const updated = await this.repo.update(invoiceId, {
      paymentStatus: "paid_online",
      settledAt: new Date(),
      settledBy: "customer",
      settlementMethod: "online",
    });

    // Transition order to completed
    const orderId = this.extractId(invoice.orderId);
    await this.orderRepo.updateStatus(orderId, "completed" as never);

    return updated!;
  }

  async markCash(invoiceId: string, providerId: string): Promise<IInvoice> {
    const invoice = await this.repo.findById(invoiceId);
    if (!invoice) throw new NotFoundError("Invoice not found");
    if (invoice.paymentStatus !== "pending") throw new BadRequestError("Invoice is already settled");

    const invProviderId = this.extractId(invoice.providerId);
    if (invProviderId !== providerId) throw new ForbiddenError("Unauthorized");

    const updated = await this.repo.update(invoiceId, {
      paymentStatus: "paid_cash",
      settledAt: new Date(),
      settledBy: "provider",
      settlementMethod: "cash",
    });

    // Transition order to completed
    const orderId = this.extractId(invoice.orderId);
    await this.orderRepo.updateStatus(orderId, "completed" as never);

    return updated!;
  }

  async getByOrderId(orderId: string): Promise<IInvoice | null> {
    return this.repo.findByOrderId(orderId);
  }
}
