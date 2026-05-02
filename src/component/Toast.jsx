import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ===== Toast Context =====
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ===== Toast Provider =====
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
    }, duration);
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  }, []);

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  // Toast Icons
  const icons = {
    success: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colorMap = {
    success: { bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
    error: { bg: 'bg-red-500', ring: 'ring-red-300' },
    warning: { bg: 'bg-amber-500', ring: 'ring-amber-300' },
    info: { bg: 'bg-blue-500', ring: 'ring-blue-300' },
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* ===== Toast Container ===== */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '420px' }}>
        {toasts.map(toast => {
          const color = colorMap[toast.type] || colorMap.success;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-semibold shadow-2xl ring-2 ${color.bg} ${color.ring} backdrop-blur-sm ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
            >
              {icons[toast.type] || icons.success}
              <span className="text-sm leading-snug">{toast.message}</span>
            </div>
          );
        })}
      </div>

      {/* ===== Confirm Dialog ===== */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden confirm-enter">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการดำเนินการ</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex border-t border-slate-200">
              <button onClick={handleCancel} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">ยกเลิก</button>
              <button onClick={handleConfirm} className="flex-1 py-4 text-red-600 font-bold hover:bg-red-50 transition-colors border-l border-slate-200 text-sm">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Inline Styles for Animations ===== */}
      <style>{`
        .toast-enter {
          animation: toastSlideIn 0.4s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
        }
        .toast-exit {
          animation: toastSlideOut 0.35s cubic-bezier(0.06, 0.71, 0.55, 1) forwards;
        }
        .confirm-enter {
          animation: confirmPop 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(100px) scale(0.9); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
