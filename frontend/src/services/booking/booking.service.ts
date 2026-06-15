import api from "@/api";
import { ApiResponse } from "@/types/auth.types";
import { Booking, CreateBookingDto, BookingListResponse, BookingStatus } from "@/types/booking.types";

export const bookingService = {
  create: (dto: CreateBookingDto) =>
    api.post<ApiResponse<Booking>>("/bookings", dto),

  getMyBookings: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    api.get<ApiResponse<BookingListResponse>>("/bookings/my", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`),

  reschedule: (id: string, newSlotId: string) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/reschedule`, { newSlotId }),

  cancel: (id: string, reason?: string) =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason }),

  // Provider endpoints
  getProviderBookings: (params?: { status?: BookingStatus; page?: number; limit?: number }) =>
    api.get<ApiResponse<BookingListResponse>>("/bookings/provider/list", { params }),

  updateStatus: (id: string, status: "in_progress" | "completed") =>
    api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status }),
};
