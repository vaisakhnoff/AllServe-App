import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService, providerAuthService } from "@/services/auth";
import { setAuth, logout } from "@/features/auth";
import type { AppDispatch, RootState } from "@/store";

// ── User Auth Thunks ──────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk<
  void,
  { email: string; password: string },
  { dispatch: AppDispatch; state: RootState }
>("auth/loginUser", async (credentials, { dispatch, rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    dispatch(setAuth(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    return rejectWithValue(err.response?.data?.message ?? "Login failed");
  }
});

export const logoutUser = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>("auth/logoutUser", async (_, { dispatch, getState }) => {
  const { role } = getState().auth;
  try {
    await authService.logout("");
  } finally {
    dispatch(logout(role));
  }
});

// ── Provider Auth Thunks ──────────────────────────────────────────────────────

export const loginProvider = createAsyncThunk<
  void,
  { email: string; password: string },
  { dispatch: AppDispatch; state: RootState }
>("auth/loginProvider", async (credentials, { dispatch, rejectWithValue }) => {
  try {
    const response = await providerAuthService.login(credentials);
    dispatch(setAuth(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    return rejectWithValue(err.response?.data?.message ?? "Provider login failed");
  }
});

export const logoutProvider = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>("auth/logoutProvider", async (_, { dispatch, getState }) => {
  const { role } = getState().auth;
  try {
    await providerAuthService.logout("");
  } finally {
    dispatch(logout(role));
  }
});
