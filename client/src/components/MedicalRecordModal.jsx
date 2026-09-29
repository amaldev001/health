import React, { useState } from 'react';
import API from '../services/api';
import { FileText, X, AlertCircle, Save } from 'lucide-react';

export const MedicalRecordModal = ({ appointment, onClose, onSuccess }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Diagnosis is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await API.post('/medical-records', {
        patientId: appointment.patientId._id,
        appointmentId: appointment._id,
        doctorId: appointment.doctorId._id,
        diagnosis,
        symptoms,
        treatment,
        prescription,
        notes,
        attachments: attachments ? attachments.split(',').map(s => s.trim()) : []
      });

      if (res.data.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save medical record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-slate-100 w-full max-w-2xl rounded-2xl border border-slate-300/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" /> Create Clinical Record
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Patient: {appointment.patientId?.userId?.name || 'Patient'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Diagnosis *</label>
              <input
                type="text"
                required
                placeholder="Primary clinical diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Symptoms</label>
              <input
                type="text"
                placeholder="Observed symptoms..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Treatment Plan</label>
            <textarea
              rows={2}
              placeholder="Treatment details and therapeutic plan..."
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Prescription</label>
            <textarea
              rows={2}
              placeholder="Medications, dosages, and instructions..."
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Notes & Lab Attachments</label>
            <input
              type="text"
              placeholder="Comma separated file names e.g. Lab-Panel.pdf, XRay.pdf"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full bg-slate-200/60 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-slate-100 transition-colors"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving Record...' : 'Save Record'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
