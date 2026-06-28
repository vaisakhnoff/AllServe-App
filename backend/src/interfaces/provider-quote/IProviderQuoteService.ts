import { IProviderQuote } from "../../models/providerQuote.model";
import { CreateProviderQuoteDto, UpdateProviderQuoteDto } from "../../dto/provider-quote/providerQuote.dto";

export interface ProviderQuoteListResult {
  items: IProviderQuote[];
  total: number;
  page: number;
  limit: number;
}

export interface ProviderQuoteStats {
  total: number;
  accepted: number;
  pending: number;
  acceptanceRate: number;
}

export interface AcceptQuoteResult {
  quote: IProviderQuote;
  booking: unknown;
}

export interface IProviderQuoteService {
  submitQuote(providerId: string, dto: CreateProviderQuoteDto): Promise<IProviderQuote | null>;
  updateQuote(quoteId: string, providerId: string, dto: UpdateProviderQuoteDto): Promise<IProviderQuote | null>;
  withdrawQuote(quoteId: string, providerId: string): Promise<{ message: string }>;
  getQuotesForRequest(serviceRequestId: string): Promise<IProviderQuote[]>;
  getProviderQuotes(providerId: string, page?: number, limit?: number): Promise<ProviderQuoteListResult>;
  acceptQuote(quoteId: string, userId: string): Promise<AcceptQuoteResult>;
  getProviderStats(providerId: string): Promise<ProviderQuoteStats>;
}
