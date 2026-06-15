import { createAsyncThunk } from "@reduxjs/toolkit";
import { providerService } from "@/services/provider";
import {
  setProviderProfile,
  setProviderLoading,
  setProviderError,
  updateProviderProfile,
} from "@/features/provider";
import type { AppDispatch, RootState } from "@/store";
import { UpdateProviderProfileDto } from "@/types/provider.types";

export const fetchProviderProfile = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>("provider/fetchProfile", async (_, { dispatch, rejectWithValue }) => {
  dispatch(setProviderLoading(true));
  try {
    const response = await providerService.getProfile();
    dispatch(setProviderProfile(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setProviderError(err.response?.data?.message ?? "Failed to fetch profile"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setProviderLoading(false));
  }
});

export const updateProviderProfileThunk = createAsyncThunk<
  void,
  UpdateProviderProfileDto,
  { dispatch: AppDispatch; state: RootState }
>("provider/updateProfile", async (dto, { dispatch, rejectWithValue }) => {
  dispatch(setProviderLoading(true));
  try {
    const response = await providerService.updateProfile(dto);
    dispatch(updateProviderProfile(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setProviderError(err.response?.data?.message ?? "Failed to update profile"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setProviderLoading(false));
  }
});
