import { IProviderQuote, ProviderQuoteStatus } from "../../models/providerQuote.model";

export interface ProviderQuoteListResult {
  items: IProviderQuote[];
  total: number;
  page: number;
  limit: number;
}

export interface IProviderQuoteRepository {
  create(data: Partial<IProviderQuote>): Promise<IProviderQuote>;
  findById(id: string): Promise<IProviderQuote | null>;
  findByRequestId(serviceRequestId: string): Promise<IProviderQuote[]>;
  findByProvider(providerId: string, page?: number, limit?: number): Promise<ProviderQuoteListResult>;
  findExisting(serviceRequestId: string, providerId: string): Promise<IProviderQuote | null>;
  updateQuote(id: string, providerId: string, data: Partial<IProviderQuote>): Promise<IProviderQuote | null>;
  updateStatus(id: string, status: ProviderQuoteStatus): Promise<IProviderQuote | null>;
  rejectAllExcept(serviceRequestId: string, acceptedQuoteId: string): Promise<unknown>;
  countByProvider(providerId: string, status?: ProviderQuoteStatus): Promise<number>;
}
