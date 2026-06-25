import mongoose, { Schema, Document } from "mongoose";

export interface IDaySchedule {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday
  isWorkingDay: boolean;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  breakStart?: string; // "HH:mm"
  breakEnd?: string; // "HH:mm"
}

export interface IProviderSchedule extends Document {
  providerId: mongoose.Types.ObjectId;
  weeklyHours: IDaySchedule[];
  bufferMinutes: number; // Gap between appointments
  defaultServiceDuration: number; // Fallback duration in minutes
  advanceBookingDays: number; // How far ahead customers can book
  createdAt: Date;
  updatedAt: Date;
}

const dayScheduleSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    isWorkingDay: { type: Boolean, required: true, default: true },
    startTime: { type: String, required: true, default: "09:00" },
    endTime: { type: String, required: true, default: "18:00" },
    breakStart: { type: String },
    breakEnd: { type: String },
  },
  { _id: false }
);

const providerScheduleSchema = new Schema<IProviderSchedule>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ProviderAccount",
      required: true,
      unique: true,
      index: true,
    },
    weeklyHours: {
      type: [dayScheduleSchema],
      required: true,
      validate: {
        validator: (v: IDaySchedule[]) => v.length === 7,
        message: "Weekly hours must have exactly 7 entries (one per day)",
      },
    },
    bufferMinutes: { type: Number, required: true, default: 15, min: 0, max: 120 },
    defaultServiceDuration: { type: Number, required: true, default: 60, min: 15, max: 480 },
    advanceBookingDays: { type: Number, required: true, default: 30, min: 1, max: 90 },
  },
  { timestamps: true }
);

export const ProviderScheduleModel = mongoose.model<IProviderSchedule>(
  "ProviderSchedule",
  providerScheduleSchema
);
