import mongoose, { Schema, Document } from "mongoose";
import { ApplicationStatus } from "../shared/enums/application-status.enum";
import { RejectionReasonCode } from "../shared/enums/rejection-reason.enum";

export interface IProviderLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IProviderAccount extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  isVerified: boolean;
  applicationStatus: ApplicationStatus;
  categoryId?: mongoose.Types.ObjectId;
  subCategory?: string;
  experience?: string;
  address?: { street: string; city: string; zip: string };
  serviceArea?: string;
  description?: string;
  documentType?: string;
  documents: string[];
  headshot?: string;
  rejectionReasonCode?: RejectionReasonCode;
  rejectionReason?: string;
  adminRemarks?: string;
  rejectedAt?: Date;
  businessName?: string;
  services: { name: string; price: number; description: string }[];
  serviceAreas: string[];
  earnings: number;
  rating: number;
  // ── Location fields ──
  location?: IProviderLocation;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  fullAddress?: string;
  serviceRadius?: number; // km
}

const providerAccountSchema = new Schema<IProviderAccount>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    applicationStatus: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.NOT_APPLIED },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: String },
    experience: { type: String },
    address: { street: { type: String }, city: { type: String }, zip: { type: String } },
    serviceArea: { type: String },
    description: { type: String },
    documentType: { type: String },
    documents: [{ type: String }],
    headshot: { type: String },
    rejectionReasonCode: { type: String, enum: Object.values(RejectionReasonCode) },
    rejectionReason: { type: String },
    adminRemarks: { type: String },
    rejectedAt: { type: Date },
    businessName: { type: String },
    services: [{ name: { type: String, required: true }, price: { type: Number, required: true }, description: { type: String, required: true } }],
    serviceAreas: [{ type: String }],
    earnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    // ── Location fields ──
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    state: { type: String },
    district: { type: String },
    city: { type: String },
    pincode: { type: String },
    fullAddress: { type: String },
    serviceRadius: { type: Number, default: 10 },
  },
  { timestamps: true }
);

providerAccountSchema.index({ location: "2dsphere" });

export const ProviderAccountModel = mongoose.model<IProviderAccount>("ProviderAccount", providerAccountSchema);
