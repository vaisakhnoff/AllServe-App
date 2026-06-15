import mongoose, { Schema, Document } from "mongoose";

export type SlotStatus = "available" | "booked" | "blocked" | "cancelled";

export interface ISlot extends Document {
  providerId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotStatus: SlotStatus;
  serviceId?: mongoose.Types.ObjectId;
  lockedAt?: Date | null;
  lockedBy?: string | null;
}

const slotSchema = new Schema<ISlot>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true, index: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotStatus: { type: String, enum: ["available", "booked", "blocked", "cancelled"], default: "available" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
  },
  { timestamps: true }
);

slotSchema.index({ providerId: 1, date: 1, startTime: 1 });

export const SlotModel = mongoose.model<ISlot>("Slot", slotSchema);
