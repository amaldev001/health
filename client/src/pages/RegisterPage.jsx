import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/UI';

export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Create Patient Account - AuraCare Health';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10 || password.length > 128) {
      setError('Password must be between 10 and 128 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    if (!privacyConsent) {
      setError('You must consent to the Privacy Policy to register.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        phone,
        gender,
        dateOfBirth: dateOfBirth || undefined
      });
      addToast('Account created successfully!', 'success');
      navigate('/patient/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-slate-200/60 border border-slate-300/80 rounded-2xl text-slate-800 shadow-xl">
      <h1 className="text-xl font-bold mb-2 text-slate-900 text-center">Create Your Account</h1>
      <p className="text-xs text-slate-500 text-center mb-6">Create a patient account to book appointments and track your clinical records.</p>

      {error && <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" htmlFor="regName">
          <input
            id="regName"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="Email Address" htmlFor="regEmail">
          <input
            id="regEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="Password" htmlFor="regPassword" hint="Must be 10 to 128 characters in length.">
          <input
            id="regPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            maxLength={128}
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="Confirm Password" htmlFor="regConfirmPassword">
          <input
            id="regConfirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showRegPass"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-0"
          />
          <label htmlFor="showRegPass" className="text-xs text-slate-600 font-medium">
            Show passwords
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone Number" htmlFor="regPhone">
            <input
              id="regPhone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
            />
          </FormField>

          <FormField label="Gender" htmlFor="regGender">
            <select
              id="regGender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </FormField>
        </div>

        <FormField label="Date of Birth" htmlFor="regDob">
          <input
            id="regDob"
            type="date"
            autoComplete="bday"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="privacyConsent"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            required
            className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-0"
          />
          <label htmlFor="privacyConsent" className="text-xs text-slate-600 leading-normal">
            I agree to the handling of my health appointment data as described in the{' '}
            <Link to="/privacy" target="_blank" className="text-teal-700 underline font-semibold hover:text-teal-900">
              Privacy Policy
            </Link>.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 mt-4"
        >
          {loading ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-teal-700 hover:text-teal-900 font-semibold underline">
          Sign In here
        </Link>
      </p>
    </div>
  );
}
