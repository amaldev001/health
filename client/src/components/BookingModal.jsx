import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Calendar, Clock, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const BookingModal = ({ doctor, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !doctor) return;
      setLoadingSlots(true);
      setError('');
      setSelectedSlot(null);
      try {
        const res = await API.get(`/doctors/${doctor._id}/available-slots?date=${selectedDate}`);
        if (res.data.success) {
          setSlots(res.data.data);
        }
      } catch (err) {
        setError('Failed to fetch doctor availability slots.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, doctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for your appointment.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await API.post('/appointments', {
        doctorId: doctor._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason,
        notes
      });

      if (res.data.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to book appointment. Please try another slot.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-slate-100 w-full max-w-lg rounded-2xl border border-slate-300/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Book Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-1">With {doctor.userId?.name} ({doctor.specializationId?.name})</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
            />
          </div>

          {/* Slots */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Available Time Slots</label>
            {loadingSlots ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">Checking doctor availability...</div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-center font-medium">
                No available slots found for this selected date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      !slot.isAvailable
                        ? 'bg-slate-200/40 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                        : selectedSlot?.startTime === slot.startTime
                        ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/30'
                        : 'bg-slate-200/70 border-slate-300 text-slate-700 hover:border-teal-500 hover:bg-teal-50/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reason for Visit *</label>
            <input
              type="text"
              required
              placeholder="e.g. Annual health checkup, consultation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
