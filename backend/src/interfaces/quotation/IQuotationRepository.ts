import { IQuotation, QuotationStatus } from "../../models/quotation.model";

export interface IQuotationRepository {
  create(data: Partial<IQuotation>): Promise<IQuotation>;
  findById(id: string): Promise<IQuotation | null>;
  findByOrderId(orderId: string): Promise<IQuotation[]>;
  findByOrderAndProvider(orderId: string, providerId: string): Promise<IQuotation | null>;
  findByProvider(providerId: string, page?: number, limit?: number): Promise<{ items: IQuotation[]; total: number }>;
  updateStatus(id: string, status: QuotationStatus, extra?: Partial<IQuotation>): Promise<IQuotation | null>;
  rejectAllExcept(orderId: string, exceptId: string): Promise<void>;
  update(id: string, data: Partial<IQuotation>): Promise<IQuotation | null>;
}
