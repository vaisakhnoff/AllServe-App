import mongoose, { Schema, Document } from "mongoose";

export interface IProviderApplication extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
}

const schema = new Schema<IProviderApplication>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  businessName: { type: String, required: true },
  documents: [{ type: String }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

export const ProviderApplicationModel = mongoose.model<IProviderApplication>("ProviderApplication", schema);
