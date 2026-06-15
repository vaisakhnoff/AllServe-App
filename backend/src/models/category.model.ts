import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory {
  name: string;
  image?: string;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  subcategories?: ISubcategory[];
}

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
  },
  { _id: false }
);

const schema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    icon: String,
    subcategories: [subcategorySchema],
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>("Category", schema);
