import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from './PageLoader';

export default function ProtectedRoute() {
  const { token, initializing } = useSelector((state) => state.auth);
  if (initializing) return <PageLoader label="Checking your session" />;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
