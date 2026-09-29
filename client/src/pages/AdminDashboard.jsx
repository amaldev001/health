import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfig } from '../context/ConfigContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck, Users, Stethoscope, Calendar,
  UserPlus, FolderPlus, Check, X, RefreshCw, AlertCircle, Eye, EyeOff, Trash2
} from 'lucide-react';

function TableSkeleton({ cols = 4 }) {
  return (
    <div className="p-4 space-y-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 bg-slate-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

const EMPTY_DOC = { name: '', email: '', password: '', specializationId: '', qualification: '', experience: '', consultationFee: '', phone: '' };
const EMPTY_SPEC = { name: '', description: '' };

export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { addToast, showConfirm } = useToast();
  const { formatDate, formatCurrency } = useConfig();

  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Doctor modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocData, setNewDocData] = useState(EMPTY_DOC);
  const [docFieldErrors, setDocFieldErrors] = useState({});
  const [showDocPassword, setShowDocPassword] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Add Specialization modal
  const [showAddSpecModal, setShowAddSpecModal] = useState(false);
  const [newSpecData, setNewSpecData] = useState(EMPTY_SPEC);
  const [submittingSpec, setSubmittingSpec] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, userRes, specRes, apptRes] = await Promise.all([
        API.get('/admin/dashboard'),
        API.get('/admin/users'),
        API.get('/specializations'),
        API.get('/admin/appointments'),
      ]);

      if (dashRes.data.success) setMetrics(dashRes.data.data.metrics);
      if (userRes.data.success) setUsers(userRes.data.data);
      if (specRes.data.success) setSpecializations(specRes.data.data);
      if (apptRes.data.success) setAppointments(apptRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to load admin data. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setDocFieldErrors({});

    if (!newDocData.specializationId) {
      setDocFieldErrors(prev => ({ ...prev, specializationId: 'Please select a specialization.' }));
      addToast('Please select a specialization first.', 'error');
      return;
    }
    if (newDocData.password.length < 10) {
      setDocFieldErrors(prev => ({ ...prev, password: 'Temporary password must be at least 10 characters long.' }));
      addToast('Temporary password must be at least 10 characters long.', 'error');
      return;
    }
    setSubmittingDoc(true);
    try {
      await API.post('/doctors', {
        ...newDocData,
        experience: Number(newDocData.experience) || 0,
        consultationFee: Number(newDocData.consultationFee) || 0,
      });
      addToast('Doctor account created successfully.', 'success');
      setShowAddDocModal(false);
      setNewDocData(EMPTY_DOC);
      setDocFieldErrors({});
      fetchAdminData();
    } catch (err) {
      const errObj = err.response?.data?.error;
      let msg = errObj?.message || 'Failed to create doctor account.';
      if (errObj?.details && Array.isArray(errObj.details) && errObj.details.length > 0) {
        const fieldMap = {};
        errObj.details.forEach(d => {
          if (d.field) fieldMap[d.field] = d.message;
        });
        setDocFieldErrors(fieldMap);
        msg = errObj.details.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      addToast(msg, 'error');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleToggleUserStatus = async (u) => {
    try {
      await API.patch(`/admin/users/${u._id}/status`, { isActive: !u.isActive });
      addToast(`Account status updated for ${u.name}.`, 'success');
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update user status.';
      addToast(msg, 'error');
    }
  };

  const handleDeleteUser = async (u) => {
    const confirmed = await showConfirm({
      title: 'Remove User Account',
      message: `Are you sure you want to permanently delete account '${u.name}' (${u.email})? This action cannot be undone.`,
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await API.delete(`/admin/users/${u._id}`);
      addToast(`User account '${u.name}' deleted successfully.`, 'success');
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to delete user account.';
      addToast(msg, 'error');
    }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    setSubmittingSpec(true);
    try {
      await API.post('/specializations', newSpecData);
      addToast('Specialization created.', 'success');
      setShowAddSpecModal(false);
      setNewSpecData(EMPTY_SPEC);
      fetchAdminData();
    } catch (err) {
      const errObj = err.response?.data?.error;
      let msg = errObj?.message || 'Failed to create specialization.';
      if (errObj?.details && Array.isArray(errObj.details) && errObj.details.length > 0) {
        msg = errObj.details.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      addToast(msg, 'error');
    } finally {
      setSubmittingSpec(false);
    }
  };

  const inputCls = 'w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors';

  /* ─── Error state ──────────────────────────────────────────── */
  if (error && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <p className="text-sm text-rose-800 font-semibold">{error}</p>
        <button onClick={fetchAdminData} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-800">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-slate-200/60 p-6 sm:p-8 rounded-3xl border border-slate-300/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-xs text-teal-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Administrator Control Panel
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Operations</h1>
          <p className="text-xs text-slate-500 font-medium">Manage users, doctors, specializations, and system appointments</p>
        </div>
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => { setNewSpecData(EMPTY_SPEC); setShowAddSpecModal(true); }}
            className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-teal-600" /> Add Specialization
          </button>
          <button
            onClick={() => { setNewDocData(EMPTY_DOC); setDocFieldErrors({}); setShowDocPassword(false); setShowAddDocModal(true); }}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      {/* ── Metrics Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: metrics?.totalUsers, colour: 'text-slate-900' },
          { label: 'Doctors', value: metrics?.totalDoctors, colour: 'text-teal-700' },
          { label: 'Patients', value: metrics?.totalPatients, colour: 'text-sky-700' },
          { label: 'Specializations', value: metrics?.totalSpecializations, colour: 'text-emerald-700' },
          { label: 'Appointments', value: metrics?.totalAppointments, colour: 'text-amber-700' },
        ].map(({ label, value, colour }) => (
          <div key={label} className="bg-slate-200/60 p-5 rounded-2xl border border-slate-300/70 shadow-sm">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">{label}</span>
            {loading
              ? <div className="h-7 w-10 bg-slate-300 rounded mt-1 animate-pulse" />
              : <span className={`text-2xl font-extrabold mt-1 block ${colour}`}>{value ?? '—'}</span>
            }
          </div>
        ))}
      </div>

      {/* ── Sub-Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-2 flex-wrap">
        {[
          { key: 'overview', label: `Appointments (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
          { key: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4" /> },
          { key: 'specs', label: `Specializations (${specializations.length})`, icon: <Stethoscope className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-2 px-1 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === key ? 'border-teal-700 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {icon} {label}
          </button>
        ))}
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="ml-auto text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ── Global Appointments ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="bg-slate-200/60 rounded-2xl border border-slate-300/70 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm">System Appointments Log</h3>
          </div>
          {loading ? (
            <TableSkeleton cols={5} />
          ) : appointments.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No appointments in the system yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-200/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Date &amp; Time</th>
                    <th className="p-4 truncate max-w-xs">Reason</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-200/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{appt.patientId?.userId?.name || '—'}</td>
                      <td className="p-4 font-semibold text-teal-700">{appt.doctorId?.userId?.name || '—'}</td>
                      <td className="p-4 font-mono font-semibold text-slate-600">
                        {formatDate(appt.appointmentDate)} &bull; {appt.startTime}
                      </td>
                      <td className="p-4 truncate max-w-xs text-slate-600">{appt.reason}</td>
                      <td className="p-4"><StatusBadge status={appt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── User Management ─────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-slate-200/60 rounded-2xl border border-slate-300/70 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm">System Users Directory</h3>
          </div>
          {loading ? (
            <TableSkeleton cols={5} />
          ) : users.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No users registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-200/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-200/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 font-mono text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md border uppercase text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          u.role === 'doctor' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${u.isActive ? 'text-teal-700' : 'text-rose-600'}`}>
                          {u.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{formatDate(u.createdAt)}</td>
                      <td className="p-4 text-right">
                        {u._id !== currentUser?.id && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                u.isActive
                                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete account"
                              aria-label={`Delete account ${u.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Specializations ──────────────────────────────────── */}
      {activeTab === 'specs' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-slate-200/60 p-5 rounded-2xl border border-slate-300/70 animate-pulse space-y-2 shadow-sm">
                <div className="h-4 bg-slate-300 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : specializations.length === 0 ? (
          <div className="bg-slate-200/60 p-12 rounded-2xl text-center border border-slate-300/70 shadow-sm">
            <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-semibold">No specializations created yet.</p>
            <button
              onClick={() => { setNewSpecData(EMPTY_SPEC); setShowAddSpecModal(true); }}
              className="mt-4 text-xs text-teal-700 hover:underline font-bold"
            >
              Add the first specialization
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specializations.map((s) => (
              <div key={s._id} className="bg-slate-200/60 p-5 rounded-2xl border border-slate-300/70 space-y-2 shadow-sm">
                <h4 className="font-bold text-teal-700 text-base">{s.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Modal: Add Doctor ─────────────────────────────────── */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-slate-100 w-full max-w-md rounded-2xl border border-slate-300/80 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" /> Create Doctor Account
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-700 p-1 text-xl leading-none" aria-label="Close">
                &times;
              </button>
            </div>
            <form id="add-doctor-form" onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Full name (e.g., Dr. Alex Chen)"
                  value={newDocData.name}
                  onChange={e => {
                    setNewDocData(d => ({ ...d, name: e.target.value }));
                    setDocFieldErrors(errs => ({ ...errs, name: undefined }));
                  }}
                  autoComplete="name"
                  className={`${inputCls} ${docFieldErrors.name ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                />
                {docFieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.name}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={newDocData.email}
                  onChange={e => {
                    setNewDocData(d => ({ ...d, email: e.target.value }));
                    setDocFieldErrors(errs => ({ ...errs, email: undefined }));
                  }}
                  autoComplete="email"
                  className={`${inputCls} ${docFieldErrors.email ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                />
                {docFieldErrors.email && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.email}</p>
                )}
              </div>

              {/* Password with toggle */}
              <div>
                <div className="relative">
                  <input
                    type={showDocPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    placeholder="Temporary password (min 10 characters)"
                    value={newDocData.password}
                    onChange={e => {
                      setNewDocData(d => ({ ...d, password: e.target.value }));
                      setDocFieldErrors(errs => ({ ...errs, password: undefined }));
                    }}
                    autoComplete="new-password"
                    className={`${inputCls} pr-10 ${docFieldErrors.password ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDocPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showDocPassword ? 'Hide password' : 'Show password'}
                  >
                    {showDocPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {docFieldErrors.password && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.password}</p>
                )}
              </div>

              <div>
                <select
                  required
                  value={newDocData.specializationId}
                  onChange={e => {
                    setNewDocData(d => ({ ...d, specializationId: e.target.value }));
                    setDocFieldErrors(errs => ({ ...errs, specializationId: undefined }));
                  }}
                  className={`${inputCls} ${docFieldErrors.specializationId ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                >
                  <option value="">Select specialization *</option>
                  {specializations.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                {docFieldErrors.specializationId && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.specializationId}</p>
                )}
                {specializations.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">No specializations exist yet. Create one first.</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Qualification (e.g., MBBS, MD, PhD)"
                  value={newDocData.qualification}
                  onChange={e => {
                    setNewDocData(d => ({ ...d, qualification: e.target.value }));
                    setDocFieldErrors(errs => ({ ...errs, qualification: undefined }));
                  }}
                  className={`${inputCls} ${docFieldErrors.qualification ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                />
                {docFieldErrors.qualification && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.qualification}</p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={newDocData.phone || ''}
                  onChange={e => {
                    setNewDocData(d => ({ ...d, phone: e.target.value }));
                    setDocFieldErrors(errs => ({ ...errs, phone: undefined }));
                  }}
                  className={`${inputCls} ${docFieldErrors.phone ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                />
                {docFieldErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    required
                    min="0"
                    max="60"
                    placeholder="Experience (years)"
                    value={newDocData.experience}
                    onChange={e => {
                      setNewDocData(d => ({ ...d, experience: e.target.value }));
                      setDocFieldErrors(errs => ({ ...errs, experience: undefined }));
                    }}
                    className={`${inputCls} ${docFieldErrors.experience ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                  />
                  {docFieldErrors.experience && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.experience}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Consultation fee"
                    value={newDocData.consultationFee}
                    onChange={e => {
                      setNewDocData(d => ({ ...d, consultationFee: e.target.value }));
                      setDocFieldErrors(errs => ({ ...errs, consultationFee: undefined }));
                    }}
                    className={`${inputCls} ${docFieldErrors.consultationFee ? '!border-rose-500 ring-1 ring-rose-500' : ''}`}
                  />
                  {docFieldErrors.consultationFee && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{docFieldErrors.consultationFee}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddDocModal(false)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingDoc ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Specialization ─────────────────────────── */}
      {showAddSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-slate-100 w-full max-w-md rounded-2xl border border-slate-300/80 shadow-2xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-600" /> Create Specialization
              </h3>
              <button onClick={() => setShowAddSpecModal(false)} className="text-slate-400 hover:text-slate-700 p-1 text-xl leading-none" aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSpec} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Specialization name (e.g., Cardiology)"
                value={newSpecData.name}
                onChange={e => setNewSpecData(d => ({ ...d, name: e.target.value }))}
                className={inputCls}
              />
              <textarea
                rows={3}
                placeholder="Brief description of this department…"
                value={newSpecData.description}
                onChange={e => setNewSpecData(d => ({ ...d, description: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddSpecModal(false)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSpec}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingSpec ? 'Saving…' : 'Save Specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
