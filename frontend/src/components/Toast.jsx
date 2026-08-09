import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

/**
 * Toast Notification Utility & Component.
 */
export function showToast(message, type = 'success', duration = 3500) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gigscore:toast', {
        detail: { id: Date.now() + Math.random(), message, type, duration },
      })
    );
  }
}

export const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const newToast = e.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 3500);
    };

    window.addEventListener('gigscore:toast', handleToastEvent);
    return () => window.removeEventListener('gigscore:toast', handleToastEvent);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 backdrop-blur-md transition-all animate-bounce-short ${
            toast.type === 'success'
              ? 'bg-slate-900/90 text-white border-emerald-500/40'
              : toast.type === 'warning'
              ? 'bg-slate-900/90 text-white border-amber-500/40'
              : toast.type === 'error'
              ? 'bg-slate-900/90 text-white border-red-500/40'
              : 'bg-slate-900/90 text-white border-indigo-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}

            <p className="text-xs font-semibold text-slate-100 leading-tight">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
