import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { getErrorMessage } from '../utils/format';

export const fetchPatients = createAsyncThunk('patients/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/patients', { params });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load patients'));
  }
});

export const fetchPatientOptions = createAsyncThunk('patients/options', async (search, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/patients', { params: { search: search || undefined, limit: 20 } });
    return data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load patients'));
  }
});

export const fetchPatient = createAsyncThunk('patients/one', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/patients/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load patient'));
  }
});

export const createPatient = createAsyncThunk('patients/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/patients', payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not save patient'));
  }
});

export const updatePatient = createAsyncThunk('patients/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/patients/${id}`, payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not update patient'));
  }
});

export const deletePatient = createAsyncThunk('patients/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/patients/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not delete patient'));
  }
});

const patientsSlice = createSlice({
  name: 'patients',
  initialState: {
    items: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    options: [],
    current: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCurrentPatient(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPatientOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(fetchPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPatient.pending, (state) => {
        state.saving = true;
      })
      .addCase(createPatient.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createPatient.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updatePatient.pending, (state) => {
        state.saving = true;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
      })
      .addCase(updatePatient.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      });
  },
});

export const { clearCurrentPatient } = patientsSlice.actions;
export default patientsSlice.reducer;
