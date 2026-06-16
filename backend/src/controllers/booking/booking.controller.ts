import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IBookingService } from "../../interfaces/booking/IBookingService";
import { createBookingSchema, rescheduleBookingSchema, cancelBookingSchema, bookingQuerySchema, updateStatusSchema, adminBookingQuerySchema } from "../../dto/booking/booking.dto";

export class BookingController {
  constructor(private readonly service: IBookingService) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createBookingSchema.parse(req.body);
      const data = await this.service.createBooking(req.user!.id, dto);
      sendSuccess(res, data, Messages.BOOKING_CREATED, StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const data = await this.service.getUserBookings(req.user!.id, query);
      sendSuccess(res, data, Messages.BOOKINGS_FETCHED);
    } catch (err) { next(err); }
  }

  async getProviderBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const data = await this.service.getProviderBookings(req.user!.id, query);
      sendSuccess(res, data, Messages.BOOKINGS_FETCHED);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getBookingById(req.params.id as string, req.user!.id);
      sendSuccess(res, data, Messages.BOOKING_FETCHED);
    } catch (err) { next(err); }
  }

  async reschedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = rescheduleBookingSchema.parse(req.body);
      const data = await this.service.reschedule(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, Messages.BOOKING_RESCHEDULED);
    } catch (err) { next(err); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      const data = await this.service.updateStatus(req.params.id as string, req.user!.id, status as "in_progress" | "completed");
      sendSuccess(res, data, Messages.BOOKING_STATUS_UPDATED);
    } catch (err) { next(err); }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = cancelBookingSchema.parse(req.body);
      const data = await this.service.cancel(req.params.id as string, req.user!.id, dto.reason);
      sendSuccess(res, data, Messages.BOOKING_CANCELLED);
    } catch (err) { next(err); }
  }

  async adminGetAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = adminBookingQuerySchema.parse(req.query);
      const data = await this.service.getAllBookings(status as "pending" | "confirmed" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected" | undefined, search, page, limit);
      sendSuccess(res, data, Messages.BOOKINGS_FETCHED);
    } catch (err) { next(err); }
  }
}
