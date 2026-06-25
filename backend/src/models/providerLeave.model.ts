import mongoose, { Schema, Document } from "mongoose";

export type LeaveStatus = "active" | "cancelled";

export interface IProviderLeave extends Document {
  providerId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  reason?: string;
  isFullDay: boolean;
  startTime?: string; // For partial-day leave "HH:mm"
  endTime?: string; // For partial-day leave "HH:mm"
  hasBookings: boolean; // System-set: true if bookings exist on this date
  status: LeaveStatus;
  createdAt: Date;
  updatedAt: Date;
}

const providerLeaveSchema = new Schema<IProviderLeave>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ProviderAccount",
      required: true,
      index: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    reason: { type: String, trim: true, maxlength: 500 },
    isFullDay: { type: Boolean, required: true, default: true },
    startTime: { type: String }, // "HH:mm"
    endTime: { type: String }, // "HH:mm"
    hasBookings: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// One active leave per provider per date
providerLeaveSchema.index({ providerId: 1, date: 1, status: 1 }, { unique: true });

export const ProviderLeaveModel = mongoose.model<IProviderLeave>(
  "ProviderLeave",
  providerLeaveSchema
);
