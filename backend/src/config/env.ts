import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
    PORT : z.string().default("5000"),
     DB_URL: z.string(),
  JWT_SECRET: z.string(),
  REFRESH_SECRET: z.string(),
})


export const env = envSchema.parse(process.env)