import { createAsyncThunk } from "@reduxjs/toolkit";
import { serviceRequestService } from "@/services/serviceRequest";
import { providerQuoteService } from "@/services/provider";
import {
  setServiceRequests,
  setSelectedRequest,
  setServiceRequestLoading,
  setServiceRequestError,
  setQuotes,
} from "@/features/serviceRequest";
import type { AppDispatch, RootState } from "@/store";
import { CreateServiceRequestDto } from "@/types/serviceRequest.types";

export const fetchMyServiceRequests = createAsyncThunk<
  void,
  { page?: number; limit?: number } | void,
  { dispatch: AppDispatch; state: RootState }
>("serviceRequest/fetchMine", async (params, { dispatch, rejectWithValue }) => {
  dispatch(setServiceRequestLoading(true));
  try {
    const response = await serviceRequestService.getMyRequests({ page: params?.page, limit: params?.limit });
    const data = response.data.data;
    dispatch(setServiceRequests({ items: data.items, total: data.total }));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setServiceRequestError(err.response?.data?.message ?? "Failed to fetch requests"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setServiceRequestLoading(false));
  }
});

export const fetchServiceRequestById = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: RootState }
>("serviceRequest/fetchById", async (id, { dispatch, rejectWithValue }) => {
  dispatch(setServiceRequestLoading(true));
  try {
    const response = await serviceRequestService.getById(id);
    dispatch(setSelectedRequest(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setServiceRequestError(err.response?.data?.message ?? "Failed to fetch request"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setServiceRequestLoading(false));
  }
});

export const createServiceRequest = createAsyncThunk<
  void,
  CreateServiceRequestDto,
  { dispatch: AppDispatch; state: RootState }
>("serviceRequest/create", async (dto, { dispatch, rejectWithValue }) => {
  dispatch(setServiceRequestLoading(true));
  try {
    await serviceRequestService.create(dto);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setServiceRequestError(err.response?.data?.message ?? "Failed to create request"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setServiceRequestLoading(false));
  }
});

export const fetchQuotesForRequest = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: RootState }
>("serviceRequest/fetchQuotes", async (requestId, { dispatch, rejectWithValue }) => {
  dispatch(setServiceRequestLoading(true));
  try {
    const response = await providerQuoteService.getForRequest(requestId);
    dispatch(setQuotes(response.data.data));
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    dispatch(setServiceRequestError(err.response?.data?.message ?? "Failed to fetch quotes"));
    return rejectWithValue(err.response?.data?.message);
  } finally {
    dispatch(setServiceRequestLoading(false));
  }
});
