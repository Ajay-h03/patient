import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import patientReducer from './patientSlice';
import billReducer from './billSlice';
import paymentReducer from './paymentSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientReducer,
    bills: billReducer,
    payments: paymentReducer,
    dashboard: dashboardReducer,
  },
});
