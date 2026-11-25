import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { fetchMe } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetails from './pages/PatientDetails';
import Bills from './pages/Bills';
import BillForm from './pages/BillForm';
import BillDetails from './pages/BillDetails';
import Payments from './pages/Payments';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/new" element={<PatientForm />} />
            <Route path="patients/:id" element={<PatientDetails />} />
            <Route path="patients/:id/edit" element={<PatientForm />} />
            <Route path="billing" element={<Bills />} />
            <Route path="billing/new" element={<BillForm />} />
            <Route path="billing/:id" element={<BillDetails />} />
            <Route path="billing/:id/edit" element={<BillForm />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={2800} hideProgressBar newestOnTop />
    </>
  );
}
