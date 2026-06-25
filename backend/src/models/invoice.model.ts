import mongoose, { Schema, Document } from "mongoose";

export type InvoicePaymentStatus = "pending" | "paid_online" | "paid_cash";

export interface ILineItemNotes {
  labour?: string;
  material?: string;
  additional?: string;
  discount?: string;
}

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  labourCharge: number;
  materialCost: number;
  additionalCharges: number;
  discount: number;
  total: number;
  lineItemNotes?: ILineItemNotes;
  overallRemark?: string;
  paymentStatus: InvoicePaymentStatus;
  settledAt?: Date;
  settledBy?: "customer" | "provider";
  settlementMethod?: "online" | "cash";
  platformCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "ServiceOrder", required: true, unique: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    labourCharge: { type: Number, required: true, min: 0 },
    materialCost: { type: Number, required: true, min: 0, default: 0 },
    additionalCharges: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    lineItemNotes: {
      labour: { type: String, trim: true },
      material: { type: String, trim: true },
      additional: { type: String, trim: true },
      discount: { type: String, trim: true },
    },
    overallRemark: { type: String, trim: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid_online", "paid_cash"],
      default: "pending",
    },
    settledAt: { type: Date },
    settledBy: { type: String, enum: ["customer", "provider"] },
    settlementMethod: { type: String, enum: ["online", "cash"] },
    platformCommission: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export const InvoiceModel = mongoose.model<IInvoice>("Invoice", invoiceSchema);
