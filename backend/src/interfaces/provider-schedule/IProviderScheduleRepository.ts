import { IProviderSchedule } from "../../models/providerSchedule.model";

export interface IProviderScheduleRepository {
  findByProviderId(providerId: string): Promise<IProviderSchedule | null>;
  upsert(providerId: string, data: Partial<IProviderSchedule>): Promise<IProviderSchedule>;
}
