import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const showConfirm = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, showConfirm }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none" role="region" aria-label="Notifications">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-lg shadow-lg border text-sm transition-all duration-300 flex items-center justify-between gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-200'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Global Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-300 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
