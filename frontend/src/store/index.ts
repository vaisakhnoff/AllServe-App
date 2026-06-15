import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { locationReducer } from "@/features/location";
import { bookingReducer } from "@/features/booking";
import { providerReducer } from "@/features/provider";
import { serviceRequestReducer } from "@/features/serviceRequest";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    booking: bookingReducer,
    provider: providerReducer,
    serviceRequest: serviceRequestReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
