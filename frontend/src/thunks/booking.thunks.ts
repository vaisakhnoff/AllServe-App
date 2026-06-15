import { createAsyncThunk } from "@reduxjs/toolkit";
import { bookingService } from "@/services/booking";
import {
  setBookings,
  setSelectedBooking,
  setBookingLoading,
  setBookingError,
} from "@/features/booking";
import type { AppDispatch, RootState } from "@/store";

export const fetchMyBookings = createAsyncThunk<
  void,
  { page?: number; limit?: number } | void,
  { dispatch: AppDispatch; state: RootState }
>("booking/fetchMyBookings", async (params, { dispatch, rejectWithValue }) => {
  dispatch(setBookingLoading(true));
  try {
    const response = await bookingService.getMyBookings({ page: params?.page, limit: params?.limit });
    const data = response.data.data;
    dispatch(setBookings({ items: data.items, total: data.total }));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setBookingError(err.response?.data?.message ?? "Failed to fetch bookings"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setBookingLoading(false));
  }
});

export const fetchBookingById = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: RootState }
>("booking/fetchById", async (id, { dispatch, rejectWithValue }) => {
  dispatch(setBookingLoading(true));
  try {
    const response = await bookingService.getById(id);
    dispatch(setSelectedBooking(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setBookingError(err.response?.data?.message ?? "Failed to fetch booking"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setBookingLoading(false));
  }
});
