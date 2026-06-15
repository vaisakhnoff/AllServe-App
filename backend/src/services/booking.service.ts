import { IBookingRepository } from "../interfaces/booking/IBookingRepository";
import { ISlotRepository } from "../interfaces/slot/ISlotRepository";
import { IBookingService } from "../interfaces/booking/IBookingService";
import { CreateBookingDto, RescheduleBookingDto, BookingQuery, AdminBookingQuery } from "../dto/booking/booking.dto";
import { ServiceModel } from "../models/service.model";
import { IBooking } from "../models/booking.model";
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from "../shared/errors/HttpErrors";

function extractId(ref: unknown): string {
  if (ref && typeof ref === "object" && "_id" in ref) return String((ref as { _id: unknown })._id);
  return String(ref);
}

export class BookingService implements IBookingService {
  constructor(
    private readonly repo: IBookingRepository,
    private readonly slotRepo: ISlotRepository
  ) {}

  async createBooking(userId: string, data: CreateBookingDto) {
    const service = await ServiceModel.findById(data.serviceId).lean();
    if (!service) throw new NotFoundError("Service not found");

    const slot = await this.slotRepo.findById(data.slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.slotStatus !== "available") throw new ConflictError("Slot is not available");

    const locked = await this.slotRepo.acquireLock(data.slotId, userId);
    if (!locked) throw new ConflictError("Slot is no longer available");

    await this.slotRepo.markBooked(data.slotId, data.serviceId);

    const booking = await this.repo.create({
      userId: userId as unknown as IBooking["userId"],
      providerId: service.providerId,
      serviceId: data.serviceId as unknown as IBooking["serviceId"],
      slotId: data.slotId as unknown as IBooking["slotId"],
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      address: data.address,
      amount: service.price,
      bookingStatus: "confirmed",
      paymentStatus: "pending",
      statusHistory: [{ status: "confirmed", at: new Date() }],
    });

    return this.repo.findById(String(booking._id));
  }

  async getAllBookings(
    status?: AdminBookingQuery["status"],
    search?: AdminBookingQuery["search"],
    page = 1,
    limit = 20
  ) {
    return this.repo.findAllBookings(status, search, page, limit);
  }

  async getUserBookings(userId: string, query: BookingQuery) {
    return this.repo.findByUser(userId, query.status, query.page, query.limit);
  }

  async getProviderBookings(providerId: string, query: BookingQuery) {
    return this.repo.findByProvider(providerId, query.status, query.page, query.limit);
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.repo.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    if (String(booking.userId) !== userId && String(booking.providerId) !== userId) {
      throw new ForbiddenError("Unauthorized");
    }
    return booking;
  }

  async reschedule(bookingId: string, userId: string, data: RescheduleBookingDto) {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (String(booking.userId) !== userId) throw new ForbiddenError("Unauthorized");
    if (["cancelled", "completed", "rejected"].includes(booking.bookingStatus)) {
      throw new BadRequestError("Cannot reschedule this booking");
    }

    const bookingTime = new Date(`${booking.date}T${booking.startTime}:00`);
    if (bookingTime.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      throw new BadRequestError("Reschedule must be at least 24 hours before booking time");
    }

    const newSlot = await this.slotRepo.findById(data.newSlotId);
    if (!newSlot) throw new NotFoundError("New slot not found");
    if (newSlot.slotStatus !== "available") throw new ConflictError("New slot is not available");

    // Release old slot
    await this.slotRepo.releaseSlot(extractId(booking.slotId));

    // Book new slot
    const locked = await this.slotRepo.acquireLock(data.newSlotId, userId);
    if (!locked) throw new ConflictError("New slot is no longer available");
    await this.slotRepo.markBooked(data.newSlotId, String(booking.serviceId));

    const history = [
      ...(booking.statusHistory || []),
      {
        status: "confirmed" as const,
        at: new Date(),
        note: `Rescheduled from ${booking.date} ${booking.startTime} to ${newSlot.date} ${newSlot.startTime}`,
      },
    ];

    return this.repo.updateBooking(bookingId, {
      slotId: data.newSlotId as unknown as IBooking["slotId"],
      date: newSlot.date,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      statusHistory: history,
    });
  }

  async updateStatus(bookingId: string, providerId: string, status: "in_progress" | "completed") {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (extractId(booking.providerId) !== providerId) {
      throw new ForbiddenError("Unauthorized");
    }
    if (status === "in_progress" && booking.bookingStatus !== "confirmed") {
      throw new BadRequestError("Can only start confirmed bookings");
    }
    if (status === "completed" && booking.bookingStatus !== "in_progress") {
      throw new BadRequestError("Can only complete in-progress bookings");
    }
    const history = [...(booking.statusHistory || []), { status, at: new Date() }];
    return this.repo.updateBooking(bookingId, { bookingStatus: status, statusHistory: history });
  }

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");

    const isUser     = String(booking.userId)          === userId;
    const isProvider = extractId(booking.providerId)   === userId;
    if (!isUser && !isProvider) throw new ForbiddenError("Unauthorized");

    if (booking.bookingStatus !== "confirmed") {
      throw new BadRequestError("Only confirmed bookings can be cancelled");
    }

    // Deadline: end of the day BEFORE the service date (23:59:59 of booking.date - 1 day)
    const serviceDate = new Date(`${booking.date}T00:00:00`);
    const deadline    = new Date(serviceDate.getTime() - 1000); // 23:59:59 of previous day
    if (Date.now() >= deadline.getTime()) {
      throw new BadRequestError("Cancellation deadline has passed. Bookings cannot be cancelled on or after the service day.");
    }

    await this.slotRepo.releaseSlot(extractId(booking.slotId));

    const cancelledBy: "user" | "provider" = isUser ? "user" : "provider";
    const history = [
      ...(booking.statusHistory || []),
      { status: "cancelled" as const, at: new Date(), note: reason },
    ];

    return this.repo.updateBooking(bookingId, {
      bookingStatus: "cancelled",
      cancelledBy,
      cancelReason: reason,
      statusHistory: history,
    });
  }
}
