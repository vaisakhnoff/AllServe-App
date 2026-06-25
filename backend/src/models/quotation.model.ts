import mongoose, { Schema, Document } from "mongoose";

export type QuotationStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "modification_requested"
  | "withdrawn"
  | "rejected_by_selection";

export interface IQuotationRevision {
  revisionNumber: number;
  labourCharge: number;
  materialCost: number;
  additionalCharges: number;
  estimatedDurationDays: number;
  advanceRequired: boolean;
  advanceAmount: number;
  notes?: string;
  termsAndConditions?: string;
  attachments: string[];
  submittedAt: Date;
}

export interface IQuotation extends Document {
  orderId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  status: QuotationStatus;
  currentRevision: IQuotationRevision;
  revisionHistory: IQuotationRevision[];
  modificationComment?: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const quotationRevisionSchema = new Schema(
  {
    revisionNumber: { type: Number, required: true, default: 1 },
    labourCharge: { type: Number, required: true, min: 0 },
    materialCost: { type: Number, required: true, min: 0, default: 0 },
    additionalCharges: { type: Number, required: true, min: 0, default: 0 },
    estimatedDurationDays: { type: Number, required: true, min: 1 },
    advanceRequired: { type: Boolean, default: false },
    advanceAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    attachments: [{ type: String }],
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quotationSchema = new Schema<IQuotation>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "ServiceOrder", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true, index: true },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected", "modification_requested", "withdrawn", "rejected_by_selection"],
      default: "submitted",
    },
    currentRevision: { type: quotationRevisionSchema, required: true },
    revisionHistory: [quotationRevisionSchema],
    modificationComment: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

quotationSchema.index({ orderId: 1, providerId: 1 });
quotationSchema.index({ orderId: 1, status: 1 });

export const QuotationModel = mongoose.model<IQuotation>("Quotation", quotationSchema);
