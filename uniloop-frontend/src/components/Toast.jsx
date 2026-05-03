import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react'

// ── Context ─────────────────────────────────────────────────
const ToastContext = createContext(null)

let _toastId = 0

// ── Toast Provider ───────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type, duration, visible: true }])
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350)
  }, [])

  const toast = {
    success: (msg, dur) => push(msg, 'success', dur),
    error:   (msg, dur) => push(msg, 'error', dur),
    info:    (msg, dur) => push(msg, 'info', dur),
    warning: (msg, dur) => push(msg, 'warning', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ── Tek Toast ────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, onDismiss])

  const cfg = {
    success: {
      icon:    <CheckCircle2 size={18} />,
      bg:      'bg-[#3b4b6e] border-emerald-200',
      icon_cl: 'text-teal-400',
      bar:     'bg-emerald-500',
      label:   'text-white',
    },
    error: {
      icon:    <XCircle size={18} />,
      bg:      'bg-[#3b4b6e] border-red-200',
      icon_cl: 'text-red-500',
      bar:     'bg-red-500',
      label:   'text-white',
    },
    warning: {
      icon:    <AlertTriangle size={18} />,
      bg:      'bg-[#3b4b6e] border-amber-200',
      icon_cl: 'text-amber-500',
      bar:     'bg-amber-500',
      label:   'text-white',
    },
    info: {
      icon:    <Info size={18} />,
      bg:      'bg-[#3b4b6e] border-white/15',
      icon_cl: 'text-slate-300',
      bar:     'bg-slate-400',
      label:   'text-white',
    },
  }[toast.type] || cfg?.info

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-md
        transition-all duration-350
        ${cfg.bg}
        ${toast.visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-2 scale-95'
        }
      `}
    >
      {/* Sol ikon */}
      <span className={`flex-shrink-0 mt-0.5 ${cfg.icon_cl}`}>{cfg.icon}</span>

      {/* Mesaj */}
      <p className={`text-sm leading-snug flex-1 whitespace-pre-line font-medium ${cfg.label}`}>
        {toast.message}
      </p>

      {/* Kapat butonu */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 mt-0.5 text-slate-300 hover:text-slate-300 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Alt progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
        <div
          className={`h-full ${cfg.bar} opacity-70`}
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

// ── Hook ─────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
