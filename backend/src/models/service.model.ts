import mongoose, { Schema, Document } from "mongoose";

export type ServiceStatus = "active" | "inactive";
export type AvailabilityStatus = "available" | "unavailable";

/**
 * Delivery Model Classification:
 * - direct: Fixed duration, price known upfront, immediate or scheduled booking (e.g., haircut, basic plumbing)
 * - inspection_required: Provider must visit/inspect before final pricing (e.g., house painting, renovation)
 * - custom: Fully negotiated scope via bidding (e.g., PC build, interior design)
 */
export type DeliveryModel = "direct" | "inspection_required" | "custom";

/**
 * Pricing Model:
 * - fixed: Single fixed price (e.g., ₹500 for haircut)
 * - per_unit: Price per unit with unit specification (e.g., ₹15/sq.ft for painting)
 * - hourly: Price per hour (e.g., ₹300/hour for consultation)
 * - starting_from: Minimum price, actual price determined after inspection
 * - quote_based: No upfront price, determined through bidding
 */
export type PricingModel = "fixed" | "per_unit" | "hourly" | "starting_from" | "quote_based";

export interface IServiceLocation {
  city?: string;
  state?: string;
  pincode?: string;
}

export type IntakeFieldType = "text" | "textarea" | "number" | "select" | "date" | "file";

export interface IIntakeField {
  id: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select type
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
  
  /** Delivery model determines the booking flow */
  deliveryModel: DeliveryModel;
  
  /** 
   * Pricing model determines how price is calculated and displayed 
   * - For 'direct': typically 'fixed' or 'hourly'
   * - For 'inspection_required': typically 'per_unit' or 'starting_from'
   * - For 'custom': typically 'quote_based'
   */
  pricingModel: PricingModel;
  
  /** 
   * Base price - interpretation depends on pricingModel:
   * - fixed: total price
   * - per_unit/hourly: price per unit/hour
   * - starting_from: minimum price
   * - quote_based: can be 0 or estimated range
   */
  price: number;
  
  /** For per_unit pricing (e.g., "sq.ft", "sq.m", "item") */
  priceUnit?: string;
  
  /** 
   * Duration in minutes (1 – 1440).
   * - For 'direct': exact duration for scheduling
   * - For 'inspection_required': duration of inspection visit (if applicable)
   * - For 'custom': estimated duration (informational only)
   */
  duration: number;
  
  /** 
   * For 'inspection_required' services - whether inspection visit is free
   * Default: true (inspection is usually free, charge comes after estimate)
   */
  freeInspection?: boolean;
  
  /** For 'inspection_required' services - inspection visit fee if not free */
  inspectionFee?: number;
  
  /** 
   * For 'inspection_required' and 'custom' services - estimated project duration in days
   * Helps users understand time commitment
   */
  estimatedProjectDays?: number;
  
  images: string[];
  serviceArea?: string;
  location?: IServiceLocation;
  availabilityStatus: AvailabilityStatus;
  tags: string[];

  /**
   * Custom service intake fields — defines what information the provider
   * needs from the customer when requesting this service.
   * Only relevant for deliveryModel: "custom"
   */
  intakeFields?: IIntakeField[];

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
    deliveryModel: {
      type: String,
      enum: ["direct", "inspection_required", "custom"],
      required: true,
      default: "direct",
      index: true,
    },
    pricingModel: {
      type: String,
      enum: ["fixed", "per_unit", "hourly", "starting_from", "quote_based"],
      required: true,
      default: "fixed",
    },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, trim: true },
    duration: { type: Number, required: true, min: 1, max: 1440 },
    freeInspection: { type: Boolean, default: true },
    inspectionFee: { type: Number, min: 0 },
    estimatedProjectDays: { type: Number, min: 1 },
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
    intakeFields: [{
      id: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ["text", "textarea", "number", "select", "date", "file"], required: true },
      required: { type: Boolean, default: false },
      placeholder: { type: String },
      options: [{ type: String }],
    }],
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
// Service type filtering for different booking flows
serviceSchema.index({ categoryId: 1, deliveryModel: 1, isDeleted: 1 });
// Location-based filtering.
serviceSchema.index({ "location.city": 1 });

export const ServiceModel = mongoose.model<IService>("Service", serviceSchema);
