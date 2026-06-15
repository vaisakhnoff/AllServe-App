import mongoose, { Schema, Document } from "mongoose";

export type ProviderQuoteStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface IProviderQuote extends Document {
  serviceRequestId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  price: number;
  message: string;
  estimatedDuration: string;
  availabilityNote?: string;
  status: ProviderQuoteStatus;
  respondedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const providerQuoteSchema = new Schema<IProviderQuote>(
  {
    serviceRequestId: { type: Schema.Types.ObjectId, ref: "ServiceRequest", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true, index: true },
    price: { type: Number, required: true },
    message: { type: String, required: true, trim: true },
    estimatedDuration: { type: String, required: true, trim: true },
    availabilityNote: { type: String, trim: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending" },
    respondedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

providerQuoteSchema.index({ serviceRequestId: 1, providerId: 1 }, { unique: true });

export const ProviderQuoteModel = mongoose.model<IProviderQuote>("ProviderQuote", providerQuoteSchema);
