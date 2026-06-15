import { STORAGE_KEYS } from "@/shared/storage";

export type AuthRole = "user" | "provider" | "admin";

const scopedKey = (baseKey: string, role: string) => `${baseKey}:${role}`;

const getRoleFromPath = (pathname: string): AuthRole => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/provider-portal")) return "provider";
  return "user";
};

const getCurrentRouteRole = (): AuthRole => {
  if (typeof window === "undefined") return "user";
  return getRoleFromPath(window.location.pathname);
};

export const token = {
  getAccess: (role?: string | null): string | null => {
    if (typeof window === "undefined") return null;
    const targetRole = role ?? localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) ?? getCurrentRouteRole();
    const scopedAccess = localStorage.getItem(scopedKey(STORAGE_KEYS.ACCESS_TOKEN, targetRole));
    if (scopedAccess) return scopedAccess;

    const legacyAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const decoded = legacyAccess ? decodeToken(legacyAccess) : null;
    return decoded?.role === targetRole ? legacyAccess : null;
  },

  getRefresh: (role?: string | null): string | null => {
    if (typeof window === "undefined") return null;
    const targetRole = role ?? localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) ?? getCurrentRouteRole();
    const scopedRefresh = localStorage.getItem(scopedKey(STORAGE_KEYS.REFRESH_TOKEN, targetRole));
    if (scopedRefresh) return scopedRefresh;

    const legacyAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const decoded = legacyAccess ? decodeToken(legacyAccess) : null;
    return decoded?.role === targetRole ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
  },

  getValidAccess: (role?: string | null): string | null => {
    const accessToken = token.getAccess(role);
    if (!accessToken) return null;

    const decoded = decodeToken(accessToken);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      token.clear(role ?? decoded?.role);
      return null;
    }

    return accessToken;
  },

  hasValidRole: (role: string): boolean => {
    return Boolean(token.getValidAccess(role));
  },

  getAccessForCurrentRoute: (): string | null => {
    return token.getValidAccess(getCurrentRouteRole());
  },

  setTokens: (access: string, refresh: string, role?: string): void => {
    const decoded = decodeToken(access);
    const targetRole = role ?? decoded?.role;

    if (!targetRole) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      return;
    }

    localStorage.setItem(scopedKey(STORAGE_KEYS.ACCESS_TOKEN, targetRole), access);
    localStorage.setItem(scopedKey(STORAGE_KEYS.REFRESH_TOKEN, targetRole), refresh);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, targetRole);
  },

  setAccess: (access: string, role?: string | null): void => {
    const decoded = decodeToken(access);
    const targetRole = role ?? decoded?.role ?? localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
    if (!targetRole) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      return;
    }

    localStorage.setItem(scopedKey(STORAGE_KEYS.ACCESS_TOKEN, targetRole), access);
  },

  clear: (role?: string | null): void => {
    if (role) {
      localStorage.removeItem(scopedKey(STORAGE_KEYS.ACCESS_TOKEN, role));
      localStorage.removeItem(scopedKey(STORAGE_KEYS.REFRESH_TOKEN, role));
      if (localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) === role) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      }
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    (["user", "provider", "admin"] as AuthRole[]).forEach((roleName) => {
      localStorage.removeItem(scopedKey(STORAGE_KEYS.ACCESS_TOKEN, roleName));
      localStorage.removeItem(scopedKey(STORAGE_KEYS.REFRESH_TOKEN, roleName));
    });
  },
};

export interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const decodeToken = (accessToken: string): DecodedToken | null => {
  try {
    const payload = accessToken.split(".")[1];
    return JSON.parse(atob(payload)) as DecodedToken;
  } catch {
    return null;
  }
};
