import { BaseRepository } from "./base.repository";
import {
  IProviderQuoteRepository,
  ProviderQuoteListResult,
} from "../interfaces/provider-quote/IProviderQuoteRepository";
import { ProviderQuoteModel, IProviderQuote, ProviderQuoteStatus } from "../models/providerQuote.model";

export class ProviderQuoteRepository
  extends BaseRepository<IProviderQuote>
  implements IProviderQuoteRepository
{
  constructor() {
    super(ProviderQuoteModel);
  }

  async create(data: Partial<IProviderQuote>): Promise<IProviderQuote> {
    return ProviderQuoteModel.create(data) as Promise<IProviderQuote>;
  }

  async findById(id: string): Promise<IProviderQuote | null> {
    return this.model
      .findById(id)
      .populate("providerId", "name businessName headshot rating city district")
      .exec();
  }

  async findByRequestId(serviceRequestId: string): Promise<IProviderQuote[]> {
    return this.model
      .find({ serviceRequestId, status: { $ne: "withdrawn" } })
      .populate("providerId", "name businessName headshot rating city district")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProvider(
    providerId: string,
    page = 1,
    limit = 20
  ): Promise<ProviderQuoteListResult> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find({ providerId })
        .populate(
          "serviceRequestId",
          "title status budgetType budgetMin budgetMax address urgency"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.model.countDocuments({ providerId }),
    ]);
    return { items: items as IProviderQuote[], total, page, limit };
  }

  async findExisting(
    serviceRequestId: string,
    providerId: string
  ): Promise<IProviderQuote | null> {
    return this.model.findOne({ serviceRequestId, providerId }).exec();
  }

  async updateQuote(
    id: string,
    providerId: string,
    data: Partial<IProviderQuote>
  ): Promise<IProviderQuote | null> {
    return this.model
      .findOneAndUpdate({ _id: id, providerId }, data, { returnDocument: 'after' })
      .populate("providerId", "name businessName headshot rating city district")
      .exec();
  }

  async updateStatus(id: string, status: ProviderQuoteStatus): Promise<IProviderQuote | null> {
    return this.model.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }).exec();
  }

  async rejectAllExcept(serviceRequestId: string, acceptedQuoteId: string): Promise<unknown> {
    return this.model.updateMany(
      { serviceRequestId, _id: { $ne: acceptedQuoteId }, status: "pending" },
      { status: "rejected" }
    );
  }

  async countByProvider(providerId: string, status?: ProviderQuoteStatus): Promise<number> {
    const filter: Record<string, unknown> = { providerId };
    if (status) filter.status = status;
    return this.model.countDocuments(filter);
  }
}
