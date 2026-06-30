"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "@/enums/role.enum";
import { User } from "@/types/auth.types";
import { token, decodeToken, AuthRole } from "@/utils/token";

interface AuthState {
  user: User | null;
  role: Role | null;
  applicationStatus: "not_applied" | "pending" | "approved" | "rejected" | "suspended" | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  applicationStatus: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Called on app mount. Receives the current pathname from the component
     * (via usePathname()) to avoid reading window.location inside the reducer.
     */
    initializeAuth: (state, action: PayloadAction<{ pathname: string }>) => {
      state.isInitialized = true;

      const { pathname } = action.payload;

      // Determine role from pathname
      const routeRole: AuthRole = pathname.startsWith("/admin")
        ? "admin"
        : pathname.startsWith("/provider-portal")
          ? "provider"
          : "user";

      const accessToken =
        token.getValidAccess(routeRole) ??
        (pathname === "/google-callback" ? token.getValidAccess() : null);

      if (!accessToken) return;

      const decoded = decodeToken(accessToken);
      if (!decoded) return;

      if (decoded.exp * 1000 < Date.now()) {
        token.clear(decoded.role);
        return;
      }

      state.role = decoded.role as Role;
      state.applicationStatus = (decoded as unknown).applicationStatus ?? null;
      state.isAuthenticated = true;
    },

    setAuth: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      const decoded = decodeToken(accessToken);
      token.setTokens(accessToken, refreshToken, decoded?.role ?? user.role);
      state.user = user;
      state.role = (decoded?.role as Role) ?? user.role;
      state.applicationStatus = (decoded as unknown)?.applicationStatus ?? user.applicationStatus ?? null;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    /**
     * Update only the applicationStatus in redux without touching tokens.
     * Used after apply/reapply succeed and when refetching live status from
     * the server (so admin-side approve/reject changes show up without
     * forcing the provider to log out and back in).
     */
    setApplicationStatus: (
      state,
      action: PayloadAction<"not_applied" | "pending" | "approved" | "rejected" | "suspended" | null>
    ) => {
      state.applicationStatus = action.payload;
    },

    logout: (state, action: PayloadAction<Role | string | null | undefined>) => {
      token.clear(action.payload ?? state.role);
      state.user = null;
      state.role = null;
      state.applicationStatus = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const { initializeAuth, setAuth, setUser, setApplicationStatus, logout } = authSlice.actions;
export default authSlice.reducer;
