import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ServiceRequest, ProviderQuote } from "@/types/serviceRequest.types";

interface ServiceRequestState {
  items: ServiceRequest[];
  selectedRequest: ServiceRequest | null;
  quotes: ProviderQuote[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ServiceRequestState = {
  items: [],
  selectedRequest: null,
  quotes: [],
  total: 0,
  loading: false,
  error: null,
};

const serviceRequestSlice = createSlice({
  name: "serviceRequest",
  initialState,
  reducers: {
    setServiceRequests(state, action: PayloadAction<{ items: ServiceRequest[]; total: number }>) {
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.error = null;
    },
    setSelectedRequest(state, action: PayloadAction<ServiceRequest | null>) {
      state.selectedRequest = action.payload;
    },
    updateRequestInList(state, action: PayloadAction<ServiceRequest>) {
      const idx = state.items.findIndex((r) => r._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    setQuotes(state, action: PayloadAction<ProviderQuote[]>) {
      state.quotes = action.payload;
    },
    addQuote(state, action: PayloadAction<ProviderQuote>) {
      state.quotes.unshift(action.payload);
    },
    updateQuoteInList(state, action: PayloadAction<ProviderQuote>) {
      const idx = state.quotes.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) state.quotes[idx] = action.payload;
    },
    setServiceRequestLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setServiceRequestError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearServiceRequests(state) {
      state.items = [];
      state.selectedRequest = null;
      state.quotes = [];
      state.total = 0;
      state.error = null;
    },
  },
});

export const {
  setServiceRequests,
  setSelectedRequest,
  updateRequestInList,
  setQuotes,
  addQuote,
  updateQuoteInList,
  setServiceRequestLoading,
  setServiceRequestError,
  clearServiceRequests,
} = serviceRequestSlice.actions;

export default serviceRequestSlice.reducer;
