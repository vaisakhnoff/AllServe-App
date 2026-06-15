import mongoose, { Schema, Document } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "accepted" | "in_progress" | "completed" | "cancelled" | "rejected";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  address: { street: string; city: string; state: string; zip: string; country: string };
  amount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  cancelledBy?: "user" | "provider";
  cancelReason?: string;
  statusHistory: { status: BookingStatus; at: Date; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    amount: { type: Number, required: true },
    bookingStatus: { type: String, enum: ["pending", "confirmed", "accepted", "in_progress", "completed", "cancelled", "rejected"], default: "confirmed" },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "failed"], default: "pending" },
    cancelledBy: { type: String, enum: ["user", "provider"] },
    cancelReason: { type: String },
    statusHistory: [{ status: { type: String, required: true }, at: { type: Date, default: Date.now }, note: String }],
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, bookingStatus: 1 });
bookingSchema.index({ providerId: 1, date: 1 });

export const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);
