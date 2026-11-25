import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { getErrorMessage } from '../utils/format';

export const fetchBills = createAsyncThunk('bills/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/bills', { params });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load bills'));
  }
});

export const fetchBill = createAsyncThunk('bills/one', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/bills/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load bill'));
  }
});

export const createBill = createAsyncThunk('bills/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/bills', payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not create bill'));
  }
});

export const updateBill = createAsyncThunk('bills/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/bills/${id}`, payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not update bill'));
  }
});

export const updateBillStatus = createAsyncThunk('bills/status', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/bills/${id}/status`, { status });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not update status'));
  }
});

export const deleteBill = createAsyncThunk('bills/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/bills/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not delete bill'));
  }
});

const billsSlice = createSlice({
  name: 'bills',
  initialState: {
    items: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    current: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCurrentBill(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBill.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBill.pending, (state) => {
        state.saving = true;
      })
      .addCase(createBill.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createBill.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateBill.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
      })
      .addCase(updateBill.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateBillStatus.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      });
  },
});

export const { clearCurrentBill } = billsSlice.actions;
export default billsSlice.reducer;
