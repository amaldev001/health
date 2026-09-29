import React from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const config = {
    scheduled: { label: 'Scheduled', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    confirmed: { label: 'Confirmed', bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle2 },
    completed: { label: 'Completed', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Calendar },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
    no_show: { label: 'No Show', bg: 'bg-slate-100 text-slate-600 border-slate-300', icon: AlertCircle }
  };

  const current = config[status] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${current.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
};
