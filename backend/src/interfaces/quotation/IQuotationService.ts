import { IQuotation } from "../../models/quotation.model";
import { CreateQuotationDto, ReviseQuotationDto, ModificationRequestDto } from "../../dto/quotation/quotation.dto";

export interface IQuotationService {
  submit(providerId: string, dto: CreateQuotationDto): Promise<IQuotation>;
  accept(quotationId: string, customerId: string): Promise<IQuotation>;
  reject(quotationId: string, customerId: string): Promise<IQuotation>;
  requestModification(quotationId: string, customerId: string, dto: ModificationRequestDto): Promise<IQuotation>;
  revise(quotationId: string, providerId: string, dto: ReviseQuotationDto): Promise<IQuotation>;
  getForOrder(orderId: string): Promise<IQuotation[]>;
  getProviderQuotations(providerId: string, page?: number, limit?: number): Promise<{ items: IQuotation[]; total: number }>;
}
