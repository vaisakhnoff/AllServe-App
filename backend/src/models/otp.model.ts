import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document {
  email?: string;
  phone?: string;
  otp: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: { type: String },
  phone: { type: String },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export const OTPModel = mongoose.model<IOTP>("OTP", otpSchema);