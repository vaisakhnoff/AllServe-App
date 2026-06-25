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

  async generate(providerId: string, dto: CreateInvoiceDto): Promise<IInvoice> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) throw new NotFoundError("Order not found");

    const orderProviderId = (order.providerId as unknown as { _id?: unknown })?._id || order.providerId;
    if (String(orderProviderId) !== providerId) throw new ForbiddenError("Unauthorized");

    // Validate order is in correct state for invoice generation
    const validStatuses: Record<string, string[]> = {
      direct: ["accepted"],
      inspection_required: ["in_progress"],
      custom: ["in_progress"],
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

    const orderCustomerId = (order.customerId as unknown as { _id?: unknown })?._id || order.customerId;

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

    // Transition order status
    const nextStatus = order.deliveryModel === "direct" ? "awaiting_payment" : "awaiting_final_payment";
    await this.orderRepo.updateStatus(dto.orderId, nextStatus as never, {
      invoiceId: invoice._id,
    } as Partial<IServiceOrder>);

    return invoice;
  }

  async payOnline(invoiceId: string, customerId: string): Promise<IInvoice> {
    const invoice = await this.repo.findById(invoiceId);
    if (!invoice) throw new NotFoundError("Invoice not found");
    if (invoice.paymentStatus !== "pending") throw new BadRequestError("Invoice is already settled");

    const invCustomerId = (invoice.customerId as unknown as { _id?: unknown })?._id || invoice.customerId;
    if (String(invCustomerId) !== customerId) throw new ForbiddenError("Unauthorized");

    const updated = await this.repo.update(invoiceId, {
      paymentStatus: "paid_online",
      settledAt: new Date(),
      settledBy: "customer",
      settlementMethod: "online",
    });

    // Transition order to completed
    const order = await this.orderRepo.findById(String(invoice.orderId));
    if (order) {
      await this.orderRepo.updateStatus(String(order._id), "completed");
    }

    return updated!;
  }

  async markCash(invoiceId: string, providerId: string): Promise<IInvoice> {
    const invoice = await this.repo.findById(invoiceId);
    if (!invoice) throw new NotFoundError("Invoice not found");
    if (invoice.paymentStatus !== "pending") throw new BadRequestError("Invoice is already settled");

    const invProviderId = (invoice.providerId as unknown as { _id?: unknown })?._id || invoice.providerId;
    if (String(invProviderId) !== providerId) throw new ForbiddenError("Unauthorized");

    const updated = await this.repo.update(invoiceId, {
      paymentStatus: "paid_cash",
      settledAt: new Date(),
      settledBy: "provider",
      settlementMethod: "cash",
    });

    // Transition order to completed
    const order = await this.orderRepo.findById(String(invoice.orderId));
    if (order) {
      await this.orderRepo.updateStatus(String(order._id), "completed");

      // Release provider busy status for direct instant orders
      if (order.deliveryModel === "direct" && order.subMode === "instant") {
        // Provider availability release handled separately
      }
    }

    return updated!;
  }

  async getByOrderId(orderId: string): Promise<IInvoice | null> {
    return this.repo.findByOrderId(orderId);
  }
}
