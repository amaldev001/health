import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfig } from '../context/ConfigContext';
import { StatusBadge } from '../components/StatusBadge';
import { MedicalRecordModal } from '../components/MedicalRecordModal';
import {
  Calendar, Clock, User, CheckCircle, XCircle,
  FilePlus, Settings, Stethoscope, AlertCircle, RefreshCw,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function CardSkeleton() {
  return (
    <div className="bg-slate-200/60 p-6 rounded-2xl border border-slate-300/70 animate-pulse space-y-3 shadow-sm">
      <div className="h-3 bg-slate-300/80 rounded w-1/2" />
      <div className="h-2 bg-slate-200 rounded w-3/4" />
      <div className="h-2 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const { addToast, showConfirm } = useToast();
  const { formatDate } = useConfig();

  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [selectedApptForRecord, setSelectedApptForRecord] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Local copy of availability to edit in modal
  const [availability, setAvailability] = useState([]);
  const [draftAvailability, setDraftAvailability] = useState([]);

  const fetchDoctorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meRes = await API.get('/auth/me');
      if (meRes.data.success && meRes.data.data.doctorProfile) {
        const doc = meRes.data.data.doctorProfile;
        setDoctorProfile(doc);
        setAvailability(doc.availability || []);

        const apptRes = await API.get('/appointments');
        if (apptRes.data.success) setAppointments(apptRes.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to load dashboard. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  const handleOpenAvailability = () => {
    setDraftAvailability(JSON.parse(JSON.stringify(availability)));
    setShowAvailabilityModal(true);
  };

  const handleStatusChange = async (appointmentId, newStatus, appt) => {
    const labels = { confirmed: 'confirm', completed: 'mark as completed', cancelled: 'cancel' };
    const confirmed = await showConfirm({
      title: `${labels[newStatus]?.charAt(0).toUpperCase() + labels[newStatus]?.slice(1)} appointment?`,
      message: `Are you sure you want to ${labels[newStatus]} the appointment with ${appt.patientId?.userId?.name || 'this patient'} on ${formatDate(appt.appointmentDate)} at ${appt.startTime}?`,
      confirmText: 'Yes, proceed',
      isDanger: newStatus === 'cancelled',
    });
    if (!confirmed) return;

    try {
      const res = await API.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      if (res.data.success) {
        addToast(`Appointment ${newStatus} successfully.`, 'success');
        fetchDoctorData();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update appointment status.';
      addToast(msg, 'error');
    }
  };

  const toggleDraftDay = (dayNum) => {
    const exists = draftAvailability.some(a => a.dayOfWeek === dayNum);
    if (exists) {
      setDraftAvailability(draftAvailability.filter(a => a.dayOfWeek !== dayNum));
    } else {
      setDraftAvailability([...draftAvailability, { dayOfWeek: dayNum, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const updateDraftTime = (dayNum, field, value) => {
    setDraftAvailability(draftAvailability.map(a =>
      a.dayOfWeek === dayNum ? { ...a, [field]: value } : a
    ));
  };

  const handleSaveAvailability = async () => {
    if (!doctorProfile) return;
    setSavingAvailability(true);
    try {
      const res = await API.put(`/doctors/${doctorProfile._id}/availability`, { availability: draftAvailability });
      if (res.data.success) {
        setShowAvailabilityModal(false);
        addToast('Availability schedule updated.', 'success');
        fetchDoctorData();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update availability.';
      addToast(msg, 'error');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Today's appointments using clinic timezone if available
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const todayAppts = appointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return d.toLocaleDateString('en-CA') === todayStr;
  });

  /* ─── Error state ──────────────────────────────────────────── */
  if (error && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <p className="text-sm text-rose-800 font-semibold">{error}</p>
        <button onClick={fetchDoctorData} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm">
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
          <span className="text-xs text-teal-700 font-bold uppercase tracking-wider">Physician Workspace</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user?.name}</h1>
          <p className="text-xs text-slate-500 font-medium">
            Specialization:{' '}
            <span className="text-teal-700 font-bold">
              {doctorProfile?.specializationId?.name || '—'}
            </span>
          </p>
        </div>
        <button
          onClick={handleOpenAvailability}
          className="px-5 py-3 bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 relative z-10 shrink-0 transition-colors"
        >
          <Settings className="w-4 h-4" /> Manage Availability
        </button>
      </div>

      {/* ── Metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Today's Appointments", value: todayAppts.length, icon: <Calendar className="w-5 h-5" />, bg: 'bg-teal-100/70 text-teal-800 border-teal-300/70' },
          { label: 'Awaiting Confirmation', value: appointments.filter(a => a.status === 'scheduled').length, icon: <Clock className="w-5 h-5" />, bg: 'bg-amber-100/70 text-amber-800 border-amber-300/70' },
          { label: 'Total Consultations', value: appointments.length, icon: <Stethoscope className="w-5 h-5" />, bg: 'bg-sky-100/70 text-sky-800 border-sky-300/70' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-slate-200/60 p-6 rounded-2xl border border-slate-300/70 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`w-10 h-10 rounded-xl ${bg} border flex items-center justify-center`}>
                {icon}
              </div>
            </div>
            {loading
              ? <div className="h-8 w-12 bg-slate-300 rounded mt-2 animate-pulse" />
              : <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{value}</span>
            }
          </div>
        ))}
      </div>

      {/* ── Appointment List ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Schedule</h2>
          <button
            onClick={fetchDoctorData}
            disabled={loading}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <>{[0, 1, 2].map(i => <CardSkeleton key={i} />)}</>
        ) : appointments.length === 0 ? (
          <div className="bg-slate-200/60 p-12 rounded-2xl text-center border border-slate-300/70 shadow-sm">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-semibold">No patient bookings scheduled yet.</p>
            <p className="text-xs text-slate-500 mt-1">Patients can book once you have set your availability.</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <div key={appt._id} className="bg-slate-200/60 p-6 rounded-2xl border border-slate-300/70 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={appt.status} />
                    <span className="text-xs text-slate-600 font-mono font-semibold">
                      {formatDate(appt.appointmentDate)} &bull; {appt.startTime}–{appt.endTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600 shrink-0" />
                    {appt.patientId?.userId?.name || 'Patient'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    <span className="text-slate-500 font-bold">Chief complaint: </span>{appt.reason}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(appt._id, 'confirmed', appt)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}

                  {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                    <>
                      <button
                        onClick={() => handleStatusChange(appt._id, 'completed', appt)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                      </button>

                      <button
                        onClick={() => setSelectedApptForRecord(appt)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <FilePlus className="w-3.5 h-3.5" /> Add Record
                      </button>

                      <button
                        onClick={() => handleStatusChange(appt._id, 'cancelled', appt)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Medical Record Modal ─────────────────────────────── */}
      {selectedApptForRecord && (
        <MedicalRecordModal
          appointment={selectedApptForRecord}
          onClose={() => setSelectedApptForRecord(null)}
          onSuccess={() => {
            setSelectedApptForRecord(null);
            addToast('Medical record saved successfully.', 'success');
            fetchDoctorData();
          }}
        />
      )}

      {/* ── Availability Schedule Modal ──────────────────────── */}
      {showAvailabilityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Manage availability schedule"
        >
          <div className="bg-slate-100 w-full max-w-lg rounded-2xl border border-slate-300/80 shadow-2xl p-6 space-y-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" /> Weekly Schedule
              </h3>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors text-xl leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">Toggle each working day, then set the start and end hours.</p>

            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {DAYS.map((dayName, idx) => {
                const slot = draftAvailability.find(a => a.dayOfWeek === idx);
                return (
                  <div key={dayName} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-200/50 border border-slate-300/60">
                    <button
                      type="button"
                      onClick={() => toggleDraftDay(idx)}
                      className={`w-24 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        slot ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-300/70 text-slate-700'
                      }`}
                      aria-pressed={!!slot}
                    >
                      {dayName}
                    </button>
                    {slot ? (
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-slate-600 font-semibold shrink-0">From</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={e => updateDraftTime(idx, 'startTime', e.target.value)}
                          className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-medium"
                          aria-label={`${dayName} start time`}
                        />
                        <label className="text-slate-600 font-semibold shrink-0">To</label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={e => updateDraftTime(idx, 'endTime', e.target.value)}
                          className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-medium"
                          aria-label={`${dayName} end time`}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Off / Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setShowAvailabilityModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={savingAvailability}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {savingAvailability ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
