import { BaseRepository } from "./base.repository";
import { IBookingRepository, BookingListResult } from "../interfaces/booking/IBookingRepository";
import { BookingModel, IBooking, BookingStatus } from "../models/booking.model";

export class BookingRepository
  extends BaseRepository<IBooking>
  implements IBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  // Override findById to include populates
  async findById(id: string): Promise<IBooking | null> {
    return this.model
      .findById(id)
      .populate("serviceId", "name price duration images")
      .populate("providerId", "name businessName phone headshot")
      .populate("slotId", "date startTime endTime slotStatus")
      .exec();
  }

  async findAllBookings(
    status?: BookingStatus,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<BookingListResult> {
    const filter: Record<string, unknown> = {};
    if (status) filter.bookingStatus = status;
    if (search) {
      filter.$or = [{ _id: { $regex: search, $options: "i" } }];
    }
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("serviceId", "name price duration images")
        .populate("providerId", "name businessName phone headshot")
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IBooking[], total };
  }

  async findByUser(
    userId: string,
    status?: BookingStatus,
    page = 1,
    limit = 20
  ): Promise<BookingListResult> {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.bookingStatus = status;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("serviceId", "name price duration images")
        .populate("providerId", "name businessName headshot")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IBooking[], total };
  }

  async findByProvider(
    providerId: string,
    status?: BookingStatus,
    page = 1,
    limit = 20
  ): Promise<BookingListResult> {
    const filter: Record<string, unknown> = { providerId };
    if (status) filter.bookingStatus = status;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate("serviceId", "name price duration images")
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { items: items as IBooking[], total };
  }

  async updateBooking(id: string, data: Partial<IBooking>): Promise<IBooking | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate("serviceId", "name price duration images")
      .populate("providerId", "name businessName phone headshot")
      .populate("slotId", "date startTime endTime slotStatus")
      .exec();
  }
}
