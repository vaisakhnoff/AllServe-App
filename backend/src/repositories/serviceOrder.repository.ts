import { IServiceOrderRepository, PaginatedOrders } from "../interfaces/service-order/IServiceOrderRepository";
import { ServiceOrderModel, IServiceOrder, ServiceOrderStatus } from "../models/serviceOrder.model";

export class ServiceOrderRepository implements IServiceOrderRepository {
  async create(data: Partial<IServiceOrder>): Promise<IServiceOrder> {
    return new ServiceOrderModel(data).save();
  }

  async findById(id: string): Promise<IServiceOrder | null> {
    return ServiceOrderModel.findById(id)
      .populate("customerId", "name email phone")
      .populate("providerId", "name email phone businessName")
      .populate("serviceId", "name price duration deliveryModel")
      .populate("categoryId", "name icon")
      .exec();
  }

  async findByOrderId(orderId: string): Promise<IServiceOrder | null> {
    return ServiceOrderModel.findOne({ orderId })
      .populate("customerId", "name email phone")
      .populate("providerId", "name email phone businessName")
      .exec();
  }

  async findByCustomer(customerId: string, filter: Record<string, unknown> = {}, page = 1, limit = 20): Promise<PaginatedOrders> {
    const query = { customerId, ...filter };
    const [items, total] = await Promise.all([
      ServiceOrderModel.find(query)
        .populate("providerId", "name businessName")
        .populate("serviceId", "name")
        .populate("categoryId", "name icon")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrderModel.countDocuments(query).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findByProvider(providerId: string, filter: Record<string, unknown> = {}, page = 1, limit = 20): Promise<PaginatedOrders> {
    const query = { providerId, ...filter };
    const [items, total] = await Promise.all([
      ServiceOrderModel.find(query)
        .populate("customerId", "name email phone")
        .populate("serviceId", "name")
        .populate("categoryId", "name icon")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrderModel.countDocuments(query).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findBroadcastCustom(page = 1, limit = 20): Promise<PaginatedOrders> {
    const query = {
      deliveryModel: "custom",
      status: { $in: ["broadcast_open", "receiving_quotations"] },
      $or: [{ providerId: null }, { providerId: { $exists: false } }],
    } as Record<string, unknown>;
    const [items, total] = await Promise.all([
      ServiceOrderModel.find(query)
        .populate("customerId", "name email phone")
        .populate("categoryId", "name icon")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrderModel.countDocuments(query).exec(),
    ]);
    return { items: items as IServiceOrder[], total, page, limit };
  }

  async findAll(filter: Record<string, unknown> = {}, page = 1, limit = 20): Promise<PaginatedOrders> {
    const [items, total] = await Promise.all([
      ServiceOrderModel.find(filter)
        .populate("customerId", "name email")
        .populate("providerId", "name businessName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrderModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: ServiceOrderStatus, extra: Partial<IServiceOrder> = {}): Promise<IServiceOrder | null> {
    return ServiceOrderModel.findByIdAndUpdate(
      id,
      {
        status,
        ...extra,
        $push: { statusHistory: { status, at: new Date() } },
      },
      { new: true }
    ).exec();
  }

  async update(id: string, data: Partial<IServiceOrder>): Promise<IServiceOrder | null> {
    return ServiceOrderModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findExpiredInstantRequests(now: Date): Promise<IServiceOrder[]> {
    return ServiceOrderModel.find({
      deliveryModel: "direct",
      subMode: "instant",
      status: "awaiting_provider_response",
      responseDeadline: { $lte: now },
    }).exec();
  }

  async incrementQuoteCount(id: string): Promise<void> {
    await ServiceOrderModel.findByIdAndUpdate(id, { $inc: { quoteCount: 1 } }).exec();
  }
}
