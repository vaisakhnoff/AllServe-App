import { IQuotationRepository } from "../interfaces/quotation/IQuotationRepository";
import { QuotationModel, IQuotation, QuotationStatus } from "../models/quotation.model";

export class QuotationRepository implements IQuotationRepository {
  async create(data: Partial<IQuotation>): Promise<IQuotation> {
    return new QuotationModel(data).save();
  }

  async findById(id: string): Promise<IQuotation | null> {
    return QuotationModel.findById(id)
      .populate("providerId", "name businessName email phone")
      .populate("orderId", "orderId customerId deliveryModel status")
      .exec();
  }

  async findByOrderId(orderId: string): Promise<IQuotation[]> {
    return QuotationModel.find({ orderId })
      .populate("providerId", "name businessName email phone")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByOrderAndProvider(orderId: string, providerId: string): Promise<IQuotation | null> {
    return QuotationModel.findOne({ orderId, providerId }).exec();
  }

  async findByProvider(providerId: string, page = 1, limit = 20): Promise<{ items: IQuotation[]; total: number }> {
    const filter = { providerId };
    const [items, total] = await Promise.all([
      QuotationModel.find(filter)
        .populate("orderId", "orderId title description deliveryModel status")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      QuotationModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async updateStatus(id: string, status: QuotationStatus, extra: Partial<IQuotation> = {}): Promise<IQuotation | null> {
    return QuotationModel.findByIdAndUpdate(id, { status, ...extra }, { new: true }).exec();
  }

  async rejectAllExcept(orderId: string, exceptId: string): Promise<void> {
    await QuotationModel.updateMany(
      { orderId, _id: { $ne: exceptId }, status: { $in: ["submitted", "modification_requested"] } },
      { status: "rejected_by_selection" }
    ).exec();
  }

  async update(id: string, data: Partial<IQuotation>): Promise<IQuotation | null> {
    return QuotationModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
