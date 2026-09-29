import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/UI';
import API from '../services/api';

export function ChangePasswordPage() {
  const { user, refreshAuth } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Change Password - AuraCare Health';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 10 || newPassword.length > 128) {
      setError('New password must be between 10 and 128 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        addToast('Password changed successfully!', 'success');
        await refreshAuth();
        window.location.href = '/';
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to change password.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-slate-200/60 border border-slate-300/80 rounded-2xl text-slate-800 shadow-xl">
      <h1 className="text-xl font-bold mb-2 text-slate-900">Change Password</h1>
      {user?.mustChangePassword && (
        <div className="p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
          ⚠️ Please update your temporary password to continue.
        </div>
      )}

      {error && <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Current Password" htmlFor="currentPassword">
          <input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="New Password" htmlFor="newPassword" hint="Must be 10 to 128 characters in length.">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={10}
            maxLength={128}
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <FormField label="Confirm New Password" htmlFor="confirmPassword">
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
          />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswordToggle"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-0"
          />
          <label htmlFor="showPasswordToggle" className="text-xs text-slate-600 font-medium">
            Show passwords
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
