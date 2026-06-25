import { IProviderLeaveRepository } from "../interfaces/provider-leave/IProviderLeaveRepository";
import { ProviderLeaveModel, IProviderLeave } from "../models/providerLeave.model";

export class ProviderLeaveRepository implements IProviderLeaveRepository {
  async findByProviderAndDate(providerId: string, date: string): Promise<IProviderLeave | null> {
    return ProviderLeaveModel.findOne({ providerId, date, status: "active" }).exec();
  }

  async findByProviderMonth(providerId: string, yearMonth: string, status?: string): Promise<IProviderLeave[]> {
    const filter: Record<string, unknown> = {
      providerId,
      date: { $regex: `^${yearMonth}` }, // e.g. "2026-06" matches "2026-06-01", "2026-06-15" etc.
    };
    if (status) filter.status = status;
    return ProviderLeaveModel.find(filter).sort({ date: 1 }).exec();
  }

  async create(data: Partial<IProviderLeave>): Promise<IProviderLeave> {
    return new ProviderLeaveModel(data).save();
  }

  async cancelLeave(providerId: string, date: string): Promise<IProviderLeave | null> {
    return ProviderLeaveModel.findOneAndUpdate(
      { providerId, date, status: "active" },
      { status: "cancelled" },
      { new: true }
    ).exec();
  }

  async getActiveLeavesForDate(providerId: string, date: string): Promise<IProviderLeave[]> {
    return ProviderLeaveModel.find({ providerId, date, status: "active" }).exec();
  }
}
