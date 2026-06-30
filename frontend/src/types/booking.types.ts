export type BookingStatus = "pending" | "confirmed" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface BookingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface BookingStatusEntry {
  status: BookingStatus;
  at: string;
  note?: string;
}

export interface Booking {
  _id: string;
  userId: string | { _id: string; name: string; email: string; phone?: string };
  providerId: string | { _id: string; name: string; businessName?: string; phone?: string; headshot?: string };
  serviceId: string | { _id: string; name: string; price: number; duration: number; images: string[] };
  slotId: string | { _id: string; date: string; startTime: string; endTime: string; slotStatus: string };
  date: string;
  startTime: string;
  endTime: string;
  address: BookingAddress;
  amount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  cancelledBy?: "user" | "provider";
  cancelReason?: string;
  statusHistory: BookingStatusEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  serviceId: string;
  slotId: string;
  address: BookingAddress;
}

export interface BookingListResponse {
  items: Booking[];
  total: number;
}

export type BookingStep = "checkout" | "success";
export type RequestMode = "instant" | "scheduled";
