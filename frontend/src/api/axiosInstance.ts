import axios from "axios";
import { env } from "@/utils/env";


 // Base Axios instancee


const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;
