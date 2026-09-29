import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center text-slate-800">
      <div className="relative z-10 space-y-6 max-w-md">
        {/* 404 */}
        <div className="space-y-2">
          <p className="text-8xl font-extrabold text-teal-700 select-none">404</p>
          <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 border border-slate-300 text-sm font-semibold text-slate-800 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>

        {/* Quick nav suggestions */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold">Quick links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Browse Doctors', to: '/doctors' },
              { label: 'Sign In', to: '/login' },
              { label: 'Register', to: '/register' },
              { label: 'Privacy Policy', to: '/privacy' },
            ].map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 shadow-sm transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
