import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  label: string | null; // display name
  isSet: boolean;
}

const STORAGE_KEY = "allserve_location";

function loadFromStorage(): LocationState {
  if (typeof window === "undefined") return { latitude: null, longitude: null, city: null, label: null, isSet: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { latitude: null, longitude: null, city: null, label: null, isSet: false };
}

function saveToStorage(state: LocationState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

const locationSlice = createSlice({
  name: "location",
  initialState: loadFromStorage(),
  reducers: {
    setLocation(state, action: PayloadAction<{ latitude: number; longitude: number; city?: string; label?: string }>) {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.city = action.payload.city || null;
      state.label = action.payload.label || action.payload.city || null;
      state.isSet = true;
      saveToStorage(state);
    },
    clearLocation(state) {
      state.latitude = null;
      state.longitude = null;
      state.city = null;
      state.label = null;
      state.isSet = false;
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;
