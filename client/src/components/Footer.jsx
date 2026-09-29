import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

export function Footer() {
  const { config } = useConfig();

  return (
    <footer className="bg-slate-200/50 border-t border-slate-300/70 text-slate-600 py-10 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            <h2 className="text-sm font-bold text-slate-900">{config.clinicName || 'AuraCare Health'}</h2>
          </div>
          {config.address && <p className="text-slate-600">{config.address}</p>}
          {config.phone && <p className="text-slate-600">Phone: {config.phone}</p>}
          {config.hours && <p className="text-slate-600">Hours: {config.hours}</p>}
          {config.emergencyPhone && <p className="text-rose-600 font-semibold mt-1">Emergency: {config.emergencyPhone}</p>}
        </div>

        <div className="flex flex-wrap gap-5 text-slate-700 font-medium">
          <Link to="/privacy" className="hover:text-teal-700 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-teal-700 transition-colors">
            Terms of Service
          </Link>
          <Link to="/doctors" className="hover:text-teal-700 transition-colors">
            Our Specialists
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-300/60 text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} {config.clinicName || 'AuraCare Health'}. All rights reserved.</p>
      </div>
    </footer>
  );
}
