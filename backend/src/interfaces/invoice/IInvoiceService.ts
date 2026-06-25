import { IInvoice } from "../../models/invoice.model";
import { CreateInvoiceDto } from "../../dto/invoice/invoice.dto";

export interface IInvoiceService {
  generate(providerId: string, dto: CreateInvoiceDto): Promise<IInvoice>;
  payOnline(invoiceId: string, customerId: string): Promise<IInvoice>;
  markCash(invoiceId: string, providerId: string): Promise<IInvoice>;
  getByOrderId(orderId: string): Promise<IInvoice | null>;
}
