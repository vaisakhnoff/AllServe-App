import { IInvoiceRepository } from "../interfaces/invoice/IInvoiceRepository";
import { InvoiceModel, IInvoice } from "../models/invoice.model";

export class InvoiceRepository implements IInvoiceRepository {
  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    return new InvoiceModel(data).save();
  }

  async findById(id: string): Promise<IInvoice | null> {
    return InvoiceModel.findById(id)
      .populate("orderId", "orderId deliveryModel status")
      .populate("providerId", "name businessName")
      .populate("customerId", "name email")
      .exec();
  }

  async findByOrderId(orderId: string): Promise<IInvoice | null> {
    return InvoiceModel.findOne({ orderId }).exec();
  }

  async update(id: string, data: Partial<IInvoice>): Promise<IInvoice | null> {
    return InvoiceModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
