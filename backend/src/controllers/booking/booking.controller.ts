import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IBookingService } from "../../interfaces/booking/IBookingService";
import { createBookingSchema, rescheduleBookingSchema, cancelBookingSchema, bookingQuerySchema, updateStatusSchema, adminBookingQuerySchema } from "../../dto/booking/booking.dto";

export class BookingController {
  constructor(private readonly service: IBookingService) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createBookingSchema.parse(req.body);
      const data = await this.service.createBooking(req.user!.id, dto);
      sendSuccess(res, data, "Booking created successfully", 201);
    } catch (err) { next(err); }
  }

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const data = await this.service.getUserBookings(req.user!.id, query);
      sendSuccess(res, data, "Bookings fetched");
    } catch (err) { next(err); }
  }

  async getProviderBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const data = await this.service.getProviderBookings(req.user!.id, query);
      sendSuccess(res, data, "Bookings fetched");
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getBookingById(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Booking fetched");
    } catch (err) { next(err); }
  }

  async reschedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = rescheduleBookingSchema.parse(req.body);
      const data = await this.service.reschedule(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, "Booking rescheduled");
    } catch (err) { next(err); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      const data = await this.service.updateStatus(req.params.id as string, req.user!.id, status as "in_progress" | "completed");
      sendSuccess(res, data, "Booking status updated");
    } catch (err) { next(err); }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = cancelBookingSchema.parse(req.body);
      const data = await this.service.cancel(req.params.id as string, req.user!.id, dto.reason);
      sendSuccess(res, data, "Booking cancelled");
    } catch (err) { next(err); }
  }

  async adminGetAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = adminBookingQuerySchema.parse(req.query);
      const data = await this.service.getAllBookings(status as "pending" | "confirmed" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected" | undefined, search, page, limit);
      sendSuccess(res, data, "Bookings fetched");
    } catch (err) { next(err); }
  }
}
