import React, { useEffect, useRef } from 'react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className={`bg-slate-100 border border-slate-300/80 rounded-2xl p-6 w-full ${maxWidth} shadow-2xl text-slate-800 relative my-8`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function FormField({ label, htmlFor, error, hint, children }) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id: htmlFor,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy
          })
        : children}
      {hint && !error && <p id={hintId} className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export function Table({ caption, headers, children }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      <table className="w-full text-left text-sm text-slate-800">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-200/60 text-xs uppercase text-slate-600 border-b border-slate-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3.5 font-bold tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-xs text-slate-600 font-medium">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-200/70 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 shadow-sm transition-colors"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-200/70 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 shadow-sm transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="py-12 px-4 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/70 my-4">
      <p className="text-slate-600 text-sm mb-4 font-medium">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="py-8 px-4 text-center border border-rose-200 bg-rose-50/70 rounded-2xl my-4">
      <p className="text-rose-800 text-sm font-semibold mb-3">{message || 'Unable to load details.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = 'h-6 w-full' }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />;
}
