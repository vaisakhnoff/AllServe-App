/**
 * localStorage key constants — single source of truth for all storage keys.
 * Import these instead of using raw string literals for localStorage access.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "auth_user",
  ACTIVE_ROLE: "activeAuthRole",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
