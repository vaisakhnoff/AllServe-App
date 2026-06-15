import mongoose, { Schema, Document } from "mongoose";

export type ServiceStatus = "active" | "inactive";
export type AvailabilityStatus = "available" | "unavailable";

export interface IServiceLocation {
  city?: string;
  state?: string;
  pincode?: string;
}

export interface IService extends Document {
  providerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  /**
   * One of the parent category's `subcategories[]`. Drives the user-facing
   * "Plumbing → Pipe leaks" drilldown navigation.
   */
  subCategory?: string;
  name: string;
  description: string;
  price: number;
  /** Duration in minutes (1 – 1440). */
  duration: number;
  images: string[];
  serviceArea?: string;
  location?: IServiceLocation;
  availabilityStatus: AvailabilityStatus;
  tags: string[];
  /** Provider-controlled activation toggle. */
  status: ServiceStatus;
  /** Admin-controlled block flag. */
  isBlocked: boolean;
  /** Soft-delete flag. Records with isDeleted=true are hidden from all reads. */
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ProviderAccount",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategory: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1, max: 1440 },
    images: { type: [String], default: [] },
    serviceArea: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Common compound index for provider's own service lookups, excluding soft-deleted.
serviceSchema.index({ providerId: 1, isDeleted: 1, createdAt: -1 });
// Public browse: category + status + availability + not-blocked + not-deleted.
serviceSchema.index({ categoryId: 1, status: 1, availabilityStatus: 1, isBlocked: 1, isDeleted: 1, createdAt: -1 });
// Location-based filtering.
serviceSchema.index({ "location.city": 1 });

export const ServiceModel = mongoose.model<IService>("Service", serviceSchema);
