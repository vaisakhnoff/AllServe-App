import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  DB_URL: z.string(),
  JWT_SECRET: z.string(),
  REFRESH_SECRET: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
