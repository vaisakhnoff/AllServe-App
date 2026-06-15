/**
 * api/index.ts
 *
 * Central export for the configured Axios instance.
 * Import interceptors first so they are registered before any request is made.
 *
 * Usage:
 *   import api from '@/api';
 */

import "./interceptors"; // side-effect: wires request/response interceptors onto the instance
import api from "./axiosInstance";

export default api;
