import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { getErrorMessage } from '../utils/format';

export const fetchPayments = createAsyncThunk('payments/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/payments', { params });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load payments'));
  }
});

export const createPaymentOrder = createAsyncThunk('payments/order', async (billId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/payments/orders', { billId });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not start payment'));
  }
});

export const verifyPayment = createAsyncThunk('payments/verify', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/payments/verify', payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Payment verification failed'));
  }
});

export const failPayment = createAsyncThunk('payments/fail', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/payments/${id}/fail`, { reason });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not record payment failure'));
  }
});

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    items: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: false,
    processing: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPaymentOrder.pending, (state) => {
        state.processing = true;
      })
      .addCase(createPaymentOrder.fulfilled, (state) => {
        state.processing = false;
      })
      .addCase(createPaymentOrder.rejected, (state) => {
        state.processing = false;
      })
      .addCase(verifyPayment.pending, (state) => {
        state.processing = true;
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.processing = false;
      })
      .addCase(verifyPayment.rejected, (state) => {
        state.processing = false;
      });
  },
});

export default paymentsSlice.reducer;
