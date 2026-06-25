import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory {
  name: string;
  image?: string;
  /** Default service type for this subcategory (helps guide providers) */
  defaultServiceType?: "instant" | "visit_first" | "custom";
  /** Whether services in this subcategory typically require inspection */
  typicallyRequiresInspection?: boolean;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  subcategories?: ISubcategory[];
  
  /** 
   * Default service type for new services in this category
   * Helps guide providers during service creation
   */
  defaultServiceType: "instant" | "visit_first" | "custom";
  
  /** 
   * Typical duration range in minutes for services in this category
   * Used for validation and suggestions
   */
  typicalDurationRange?: {
    min: number;  // e.g., 30 minutes
    max: number;  // e.g., 480 minutes (8 hours)
  };
  
  /** 
   * Whether services in this category typically require inspection before pricing
   * true for categories like Painting, Renovation, etc.
   */
  requiresInspection: boolean;
  
  /** 
   * Platform commission rate for this category (percentage)
   * e.g., 15 means 15% commission
   */
  commissionRate: number;
  
  /** 
   * Default buffer time between slots in minutes (for instant services)
   * Accounts for travel time, cleanup, etc.
   */
  defaultBufferMinutes: number;
}

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    defaultServiceType: {
      type: String,
      enum: ["instant", "visit_first", "custom"],
    },
    typicallyRequiresInspection: { type: Boolean, default: false },
  },
  { _id: false }
);

const schema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    icon: String,
    subcategories: [subcategorySchema],
    defaultServiceType: {
      type: String,
      enum: ["instant", "visit_first", "custom"],
      default: "instant",
      required: true,
    },
    typicalDurationRange: {
      min: { type: Number, default: 30 },
      max: { type: Number, default: 480 },
    },
    requiresInspection: { type: Boolean, default: false, required: true },
    commissionRate: { type: Number, default: 15, min: 0, max: 100, required: true },
    defaultBufferMinutes: { type: Number, default: 15, min: 0, required: true },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>("Category", schema);
