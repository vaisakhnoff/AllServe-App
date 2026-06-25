import { IProviderLeave } from "../../models/providerLeave.model";

export interface IProviderLeaveRepository {
  findByProviderAndDate(providerId: string, date: string): Promise<IProviderLeave | null>;
  findByProviderMonth(providerId: string, yearMonth: string, status?: string): Promise<IProviderLeave[]>;
  create(data: Partial<IProviderLeave>): Promise<IProviderLeave>;
  cancelLeave(providerId: string, date: string): Promise<IProviderLeave | null>;
  getActiveLeavesForDate(providerId: string, date: string): Promise<IProviderLeave[]>;
}
