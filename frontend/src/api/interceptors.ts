import axios from "axios";
import { env } from "@/utils/env";
import { token, AuthRole } from "@/utils/token";
import { logger } from "@/utils/logger";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse, AuthTokens } from "@/types/auth.types";
import api from "./axiosInstance";

// ── Route prefix 
const PROVIDER_PORTAL_PREFIX = "/provider-portal";
const ADMIN_PREFIX = "/admin";

// ── Role detection helpers

const getRouteRole = (pathname: string): AuthRole => {
  if (pathname.startsWith(ADMIN_PREFIX)) return "admin";
  if (pathname.startsWith(PROVIDER_PORTAL_PREFIX)) return "provider";
  return "user";
};

// Determine the auth role for a given API URL
 
const getRequestRole = (url?: string): AuthRole | null => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;


  const pathRole = getRouteRole(pathname);
  if (pathRole !== "user") return pathRole;

  const normalizedUrl = url ?? "";
  if (normalizedUrl.startsWith("/admin")) return "admin";
  if (normalizedUrl.startsWith("/provider-auth") || normalizedUrl.startsWith("/provider/")) return "provider";

  return "user";
};

const getLoginRedirectPath = (role: AuthRole | null): string => {
  if (role === "admin") return `${ADMIN_PREFIX}/login`;
  if (role === "provider") return `${PROVIDER_PORTAL_PREFIX}/login`;
  return "/login";
};


const isLoginRequest = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes(API_ENDPOINTS.LOGIN) ||
    url.includes(API_ENDPOINTS.PROVIDER_LOGIN) ||
    url.includes("/admin/login")
  );
};

// Pick the right refresh-token endpoint
const getRefreshEndpoint = (role: AuthRole | null): string => {
  if (role === "provider") return API_ENDPOINTS.PROVIDER_REFRESH_TOKEN;
  
  return API_ENDPOINTS.REFRESH_TOKEN;
};

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const requestRole = getRequestRole(config.url);
    const accessToken = token.getValidAccess(requestRole);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: refresh on 401, redirect on failure ─────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 403 && !isLoginRequest(originalRequest.url)) {
      const requestRole = getRequestRole(originalRequest.url);
      token.clear(requestRole);
      if (typeof window !== "undefined") {
        window.location.replace(getLoginRedirectPath(requestRole));
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isLoginRequest(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const requestRole = getRequestRole(originalRequest.url);
      const refreshToken = token.getRefresh(requestRole);

      if (!refreshToken) {
        token.clear(requestRole);
        if (typeof window !== "undefined") {
          window.location.replace(getLoginRedirectPath(requestRole));
        }
        return Promise.reject(error);
      }

      try {
        const refreshEndpoint = getRefreshEndpoint(requestRole);
        const { data } = await axios.post<ApiResponse<AuthTokens>>(
          `${env.NEXT_PUBLIC_API_URL}${refreshEndpoint}`,
          { token: refreshToken }
        );

        const newAccessToken = data.data.accessToken;
        token.setAccess(newAccessToken, requestRole);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        logger.info("Token refreshed successfully");
        return api(originalRequest);
      } catch (refreshError) {
        logger.error("Token refresh failed — logging out", refreshError);
        token.clear(requestRole);
        if (typeof window !== "undefined") {
          window.location.replace(getLoginRedirectPath(requestRole));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
