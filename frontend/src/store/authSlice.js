import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { getErrorMessage } from '../utils/format';

const savedToken = localStorage.getItem('token');

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Unable to sign in'));
  }
});

export const registerAccount = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Unable to create account'));
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Session expired'));
  }
});

function storeSession(state, payload) {
  state.loading = false;
  state.user = payload.user;
  state.token = payload.accessToken;
  state.initializing = false;
  localStorage.setItem('token', payload.accessToken);
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: savedToken,
    initializing: Boolean(savedToken),
    loading: false,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.initializing = false;
      state.loading = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        storeSession(state, action.payload);
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(registerAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerAccount.fulfilled, (state, action) => {
        storeSession(state, action.payload);
      })
      .addCase(registerAccount.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initializing = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.initializing = false;
        localStorage.removeItem('token');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
