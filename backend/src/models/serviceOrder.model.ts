import mongoose, { Schema, Document } from "mongoose";

// ── Delivery Model & Sub-Mode ─────────────────────────────────────────────────
export type OrderDeliveryModel = "direct" | "inspection_required" | "custom";
export type DirectSubMode = "instant" | "scheduled";

// ── Status Enums ──────────────────────────────────────────────────────────────
export type DirectStatus =
  | "awaiting_provider_response"
  | "accepted"
  | "in_progress"
  | "work_completed"
  | "rejected_by_provider"
  | "provider_unresponsive"
  | "awaiting_payment"
  | "completed"
  | "cancelled_with_refund"
  | "cancelled";


export type InspectionStatus =
  | "awaiting_provider_response"
  | "inspection_accepted"
  | "inspection_completed"
  | "quotation_submitted"
  | "quotation_accepted"
  | "dropped_by_provider"
  | "dropped_by_customer"
  | "in_progress"
  | "work_completed"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export type CustomStatus =
  | "awaiting_provider_response"
  | "quotation_submitted"
  | "quotation_accepted"
  | "awaiting_advance"
  | "in_progress"
  | "work_completed"
  | "awaiting_payment"
  | "completed"
  | "cancelled"
  | "dropped_by_provider"
  | "dropped_by_customer";

export type ServiceOrderStatus = DirectStatus | InspectionStatus | CustomStatus;

export type PlatformFeeStatus = "pending" | "paid" | "refunded";
export type CustomerChoice = "reroute" | "refund";

// ── Status History Entry ──────────────────────────────────────────────────────
export interface IStatusHistoryEntry {
  status: string;
  at: Date;
  note?: string;
  actor?: string;
}

// ── Address ───────────────────────────────────────────────────────────────────
export interface IOrderAddress {
  street?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ── Main Interface ────────────────────────────────────────────────────────────
export interface IServiceOrder extends Document {
  orderId: string;
  customerId: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;

  deliveryModel: OrderDeliveryModel;
  subMode?: DirectSubMode;

  status: ServiceOrderStatus;
  statusHistory: IStatusHistoryEntry[];

  title?: string;
  description: string;
  images: string[];

  address: IOrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };

  preferredDate?: string;
  preferredTime?: string;

  responseDeadline?: Date;
  respondedAt?: Date;

  platformFee: number;
  platformFeeStatus: PlatformFeeStatus;

  budget?: number;
  budgetType?: "fixed" | "flexible" | "quote_needed";
  quoteCount: number;
  selectedQuotationId?: mongoose.Types.ObjectId;

  invoiceId?: mongoose.Types.ObjectId;
  reviewId?: mongoose.Types.ObjectId;

  expiresAt?: Date;

  customerChoice?: CustomerChoice;
  dropReason?: string;
  estimatedStartDate?: string;
  intakeResponses?: Record<string, string>;
  contactPhone?: string;
  reroutedFromOrderId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ── All possible status values ────────────────────────────────────────────────
const ALL_STATUSES: string[] = [
  "awaiting_provider_response", "accepted", "in_progress", "work_completed",
  "rejected_by_provider", "provider_unresponsive", "awaiting_payment", "completed",
  "cancelled_with_refund", "cancelled",
  "inspection_accepted", "inspection_completed", "quotation_submitted", "quotation_accepted",
  "dropped_by_provider", "dropped_by_customer",
  "awaiting_advance",
];

const serviceOrderSchema = new Schema<IServiceOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    deliveryModel: {
      type: String,
      enum: ["direct", "inspection_required", "custom"],
      required: true,
      index: true,
    },
    subMode: { type: String, enum: ["instant", "scheduled"] },

    status: {
      type: String,
      enum: ALL_STATUSES,
      required: true,
      index: true,
    },
    statusHistory: [{
      status: { type: String, required: true },
      at: { type: Date, default: Date.now },
      note: { type: String },
      actor: { type: String },
    }],

    title: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }],

    address: {
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    exactLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },

    preferredDate: { type: String },
    preferredTime: { type: String },

    responseDeadline: { type: Date },
    respondedAt: { type: Date },

    platformFee: { type: Number, required: true, default: 0 },
    platformFeeStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "paid",
    },

    budget: { type: Number },
    budgetType: { type: String, enum: ["fixed", "flexible", "quote_needed"] },
    quoteCount: { type: Number, default: 0 },
    selectedQuotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },

    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    reviewId: { type: Schema.Types.ObjectId, ref: "Review" },

    expiresAt: { type: Date },

    customerChoice: { type: String, enum: ["reroute", "refund"] },
    dropReason: { type: String, trim: true },
    estimatedStartDate: { type: String },
    intakeResponses: { type: Schema.Types.Mixed },
    contactPhone: { type: String, trim: true },
    reroutedFromOrderId: { type: Schema.Types.ObjectId, ref: "ServiceOrder" },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
serviceOrderSchema.index({ customerId: 1, status: 1, createdAt: -1 });
serviceOrderSchema.index({ providerId: 1, status: 1, createdAt: -1 });
serviceOrderSchema.index({ deliveryModel: 1, status: 1 });
serviceOrderSchema.index({ responseDeadline: 1 }, { sparse: true });
serviceOrderSchema.index({ expiresAt: 1 }, { sparse: true });
serviceOrderSchema.index({ exactLocation: "2dsphere" }, { sparse: true });

export const ServiceOrderModel = mongoose.model<IServiceOrder>("ServiceOrder", serviceOrderSchema);
