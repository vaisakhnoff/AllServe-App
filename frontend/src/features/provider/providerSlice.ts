import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProviderProfile } from "@/types/provider.types";

interface ProviderState {
  profile: ProviderProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProviderState = {
  profile: null,
  loading: false,
  error: null,
};

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setProviderProfile(state, action: PayloadAction<ProviderProfile>) {
      state.profile = action.payload;
      state.error = null;
    },
    updateProviderProfile(state, action: PayloadAction<Partial<ProviderProfile>>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setProviderLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setProviderError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearProviderProfile(state) {
      state.profile = null;
      state.error = null;
    },
  },
});

export const {
  setProviderProfile,
  updateProviderProfile,
  setProviderLoading,
  setProviderError,
  clearProviderProfile,
} = providerSlice.actions;

export default providerSlice.reducer;
