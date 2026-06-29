import { IBooking, BookingStatus } from "../../models/booking.model";
import { CreateBookingDto, RescheduleBookingDto, BookingQuery, AdminBookingQuery } from "../../dto/booking/booking.dto";

export interface BookingListResult {
  items: IBooking[];
  total: number;
}

export interface IBookingService {
  createBooking(userId: string, data: CreateBookingDto): Promise<IBooking | null>;
  getAllBookings(
    status?: AdminBookingQuery["status"],
    search?: AdminBookingQuery["search"],
    page?: AdminBookingQuery["page"],
    limit?: AdminBookingQuery["limit"]
  ): Promise<BookingListResult>;
  getUserBookings(userId: string, query: BookingQuery): Promise<BookingListResult>;
  getProviderBookings(providerId: string, query: BookingQuery): Promise<BookingListResult>;
  getBookingById(id: string, userId: string): Promise<IBooking>;
  reschedule(bookingId: string, userId: string, data: RescheduleBookingDto): Promise<IBooking | null>;
  updateStatus(
    bookingId: string,
    providerId: string,
    status: Extract<BookingStatus, "accepted" | "in_progress" | "completed">
  ): Promise<IBooking | null>;
  cancel(bookingId: string, userId: string, reason?: string): Promise<IBooking | null>;
}
