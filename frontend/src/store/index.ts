import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { locationReducer } from "@/features/location";
import { bookingReducer } from "@/features/booking";
import { providerReducer } from "@/features/provider";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    booking: bookingReducer,
    provider: providerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
