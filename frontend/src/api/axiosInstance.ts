import axios from "axios";
import { env } from "@/utils/env";

/**
 * Base Axios instance shared across the entire app.
 * Interceptors are wired in `./interceptors.ts`.
 */
const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;
