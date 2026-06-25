import { IProviderScheduleRepository } from "../interfaces/provider-schedule/IProviderScheduleRepository";
import { ProviderScheduleModel, IProviderSchedule } from "../models/providerSchedule.model";

export class ProviderScheduleRepository implements IProviderScheduleRepository {
  async findByProviderId(providerId: string): Promise<IProviderSchedule | null> {
    return ProviderScheduleModel.findOne({ providerId }).exec();
  }

  async upsert(providerId: string, data: Partial<IProviderSchedule>): Promise<IProviderSchedule> {
    return ProviderScheduleModel.findOneAndUpdate(
      { providerId },
      { ...data, providerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IProviderSchedule>;
  }
}
