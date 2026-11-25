import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { getErrorMessage } from '../utils/format';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/dashboard');
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load dashboard'));
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    revenueChart: null,
    recentPatients: [],
    recentTransactions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.revenueChart = action.payload.revenueChart;
        state.recentPatients = action.payload.recentPatients;
        state.recentTransactions = action.payload.recentTransactions;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
