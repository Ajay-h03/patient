import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { login } from '../store/authSlice';
import { validateAuth } from '../utils/validators';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.auth.loading);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateAuth(values, 'login');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await dispatch(login(values)).unwrap();
      toast.success('Signed in');
      navigate('/');
    } catch (message) {
      toast.error(message);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to the clinic workspace.">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="form-control" value={values.email} onChange={update} />
          {errors.email ? <div className="field-error">{errors.email}</div> : null}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-group">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              value={values.password}
              onChange={update}
            />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password ? <div className="field-error">{errors.password}</div> : null}
        </div>
        <button type="submit" className="btn btn-teal w-100 py-2" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-3 mb-0 text-muted">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
