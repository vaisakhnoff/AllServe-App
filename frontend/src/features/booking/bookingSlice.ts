import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Booking } from "@/types/booking.types";

interface BookingState {
  items: Booking[];
  selectedBooking: Booking | null;
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  items: [],
  selectedBooking: null,
  total: 0,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setBookings(state, action: PayloadAction<{ items: Booking[]; total: number }>) {
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.error = null;
    },
    setSelectedBooking(state, action: PayloadAction<Booking | null>) {
      state.selectedBooking = action.payload;
    },
    updateBookingInList(state, action: PayloadAction<Booking>) {
      const idx = state.items.findIndex((b) => b._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    setBookingLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setBookingError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearBookings(state) {
      state.items = [];
      state.selectedBooking = null;
      state.total = 0;
      state.error = null;
    },
  },
});

export const {
  setBookings,
  setSelectedBooking,
  updateBookingInList,
  setBookingLoading,
  setBookingError,
  clearBookings,
} = bookingSlice.actions;

export default bookingSlice.reducer;
