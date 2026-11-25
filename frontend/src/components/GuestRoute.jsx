import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function GuestRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const initializing = useSelector((state) => state.auth.initializing);
  if (initializing) return null;
  if (token) return <Navigate to="/" replace />;
  return children;
}
