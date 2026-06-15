import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.DB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};