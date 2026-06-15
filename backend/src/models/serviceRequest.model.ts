import mongoose, { Schema, Document } from "mongoose";

export type ServiceRequestStatus =
  | "open"
  | "receiving_quotes"
  | "quote_selected"
  | "booking_created"
  | "completed"
  | "cancelled"
  | "expired";

export type BudgetType = "fixed" | "flexible" | "quote_needed";
export type UrgencyLevel = "low" | "medium" | "high" | "urgent";

export interface IServiceRequest extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  subCategory: string;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  preferredDate?: string;
  preferredTime?: string;
  address: { street: string; city: string; state: string; zip: string; country: string };
  location?: { type: "Point"; coordinates: [number, number] };
  images: string[];
  urgency: UrgencyLevel;
  status: ServiceRequestStatus;
  quoteCount: number;
  selectedQuoteId?: mongoose.Types.ObjectId;
  selectedProviderId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    budgetType: { type: String, enum: ["fixed", "flexible", "quote_needed"], required: true },
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    preferredDate: { type: String },
    preferredTime: { type: String },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    images: [{ type: String }],
    urgency: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: {
      type: String,
      enum: ["open", "receiving_quotes", "quote_selected", "booking_created", "completed", "cancelled", "expired"],
      default: "open",
      index: true,
    },
    quoteCount: { type: Number, default: 0 },
    selectedQuoteId: { type: Schema.Types.ObjectId, ref: "ProviderQuote" },
    selectedProviderId: { type: Schema.Types.ObjectId, ref: "ProviderAccount" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ location: "2dsphere" });
serviceRequestSchema.index({ status: 1, categoryId: 1, "address.city": 1 });

export const ServiceRequestModel = mongoose.model<IServiceRequest>("ServiceRequest", serviceRequestSchema);
