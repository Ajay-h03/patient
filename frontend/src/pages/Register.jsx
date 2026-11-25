import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { registerAccount } from '../store/authSlice';
import { validateAuth } from '../utils/validators';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.auth.loading);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateAuth(values, 'register');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await dispatch(registerAccount(values)).unwrap();
      toast.success('Account created');
      navigate('/');
    } catch (message) {
      toast.error(message);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Staff accounts use email and a secure password.">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="name">Full name</label>
          <input id="name" name="name" className="form-control" value={values.name} onChange={update} />
          {errors.name ? <div className="field-error">{errors.name}</div> : null}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="form-control" value={values.email} onChange={update} />
          {errors.email ? <div className="field-error">{errors.email}</div> : null}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="form-control" value={values.password} onChange={update} />
          {errors.password ? <div className="field-error">{errors.password}</div> : null}
        </div>
        <button type="submit" className="btn btn-teal w-100 py-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-3 mb-0 text-muted">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
