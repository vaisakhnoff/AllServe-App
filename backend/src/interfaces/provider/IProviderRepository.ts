import { IProviderAccount } from "../../models/providerAccount.model";

export interface IProviderRepository {
  findById(id: string): Promise<IProviderAccount | null>;
  updateAccount(id: string, data: Partial<IProviderAccount>): Promise<IProviderAccount | null>;
  findApprovedProviders(filter: Partial<Record<string, unknown>>, limit?: number): Promise<IProviderAccount[]>;
  findApprovedProviderById(id: string): Promise<IProviderAccount | null>;
  findNearbyProviders(
    lng: number,
    lat: number,
    maxDistanceMeters: number,
    categoryId?: string,
    search?: string,
    limit?: number
  ): Promise<IProviderAccount[]>;
  getLocationSuggestions(query: string, limit?: number): Promise<string[]>;
}