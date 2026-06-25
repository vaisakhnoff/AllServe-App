import { IInvoice } from "../../models/invoice.model";

export interface IInvoiceRepository {
  create(data: Partial<IInvoice>): Promise<IInvoice>;
  findById(id: string): Promise<IInvoice | null>;
  findByOrderId(orderId: string): Promise<IInvoice | null>;
  update(id: string, data: Partial<IInvoice>): Promise<IInvoice | null>;
}
