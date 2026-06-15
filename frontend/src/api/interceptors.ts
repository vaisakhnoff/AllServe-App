import axios from "axios";
import { env } from "@/utils/env";
import { token, AuthRole } from "@/utils/token";
import { logger } from "@/utils/logger";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse, AuthTokens } from "@/types/auth.types";
import api from "./axiosInstance";

// ── Route prefix constants
const PROVIDER_PORTAL_PREFIX = "/provider-portal";
const ADMIN_PREFIX = "/admin";

// ── Role detection helpers ────────────────────────────────────────────────────

const getRouteRole = (pathname: string): AuthRole => {
  if (pathname.startsWith(ADMIN_PREFIX)) return "admin";
  if (pathname.startsWith(PROVIDER_PORTAL_PREFIX)) return "provider";
  return "user";
};

/** Determine the auth role for a given API URL or current browser route */
const getRequestRole = (url?: string): AuthRole | null => {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;

  // The route prefix determines the role for the request's token
  const pathRole = getRouteRole(pathname);
  if (pathRole !== "user") return pathRole;

  // Fall back to URL-based detection for ambiguous routes (API endpoints)
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

/**
 * True if the failed request was a login attempt for ANY role.
 * Substring matching against `/auth/login` is unsafe — `/provider-auth/login`
 * doesn't include `/auth/login` (a `-` separates them, not a `/`). Use the
 * explicit endpoint constants instead.
 */
const isLoginRequest = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes(API_ENDPOINTS.LOGIN) ||
    url.includes(API_ENDPOINTS.PROVIDER_LOGIN) ||
    url.includes("/admin/login")
  );
};

/** Pick the right refresh-token endpoint for the failed request's role. */
const getRefreshEndpoint = (role: AuthRole | null): string => {
  if (role === "provider") return API_ENDPOINTS.PROVIDER_REFRESH_TOKEN;
  // Admin currently shares the user refresh endpoint; treat the same way.
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
      // Never refresh on a login request — let the wrong-credentials error
      // surface to the caller so the form can show it.
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
