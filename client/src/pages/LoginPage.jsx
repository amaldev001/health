import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/UI';

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Sign In - AuraCare Health';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      addToast(`Welcome back, ${user.name}!`, 'success');

      if (user.mustChangePassword) {
        navigate('/change-password');
        return;
      }

      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        navigate(decodeURIComponent(returnTo));
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-slate-200/60 border border-slate-300/80 rounded-2xl text-slate-800 shadow-xl">
      <h1 className="text-xl font-bold mb-2 text-slate-900 text-center">Sign In to Your Account</h1>
      <p className="text-xs text-slate-500 text-center mb-6">Enter your email address and password to access the portal.</p>

      {error && <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email Address" htmlFor="loginEmail">
          <input
            id="loginEmail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="Password" htmlFor="loginPassword">
          <input
            id="loginPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showLoginPass"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-0"
          />
          <label htmlFor="showLoginPass" className="text-xs text-slate-600 font-medium">
            Show password
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Don't have a patient account?{' '}
        <Link to="/register" className="text-teal-700 hover:text-teal-900 font-semibold underline">
          Register as a Patient
        </Link>
      </p>
    </div>
  );
}
