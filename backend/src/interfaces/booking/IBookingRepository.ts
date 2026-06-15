import { IBooking, BookingStatus } from "../../models/booking.model";

export interface BookingListResult {
  items: IBooking[];
  total: number;
}

export interface IBookingRepository {
  create(data: Partial<IBooking>): Promise<IBooking>;
  findById(id: string): Promise<IBooking | null>;
  findAllBookings(
    status?: BookingStatus,
    search?: string,
    page?: number,
    limit?: number
  ): Promise<BookingListResult>;
  findByUser(
    userId: string,
    status?: BookingStatus,
    page?: number,
    limit?: number
  ): Promise<BookingListResult>;
  findByProvider(
    providerId: string,
    status?: BookingStatus,
    page?: number,
    limit?: number
  ): Promise<BookingListResult>;
  updateBooking(id: string, data: Partial<IBooking>): Promise<IBooking | null>;
}