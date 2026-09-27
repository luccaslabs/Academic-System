import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextData {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  showSuccess: (message: string, title?: string) => void
  showError: (error: any, fallbackMessage?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type, title, message, duration = 5000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, type, title, message, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const showSuccess = useCallback(
    (message: string, title: string = 'Sucesso') => {
      showToast({ type: 'success', title, message })
    },
    [showToast]
  )

  const showError = useCallback(
    (error: any, fallbackMessage: string = 'Ocorreu um erro inesperado.') => {
      let message = fallbackMessage
      let title = 'Erro'

      if (error) {
        if (error.status === 403) {
          title = 'Acesso Negado'
          message = error.detail || 'Você não tem permissão para realizar esta ação.'
        } else if (error.status === 429) {
          title = 'Muitas Requisições'
          message = error.detail || 'Limite de taxa excedido. Por favor, aguarde alguns instantes.'
        } else if (error.detail && typeof error.detail === 'string') {
          message = error.detail
        } else if (error.message && typeof error.message === 'string') {
          message = error.message
        }
      }

      showToast({ type: 'error', title, message, duration: 6000 })
    },
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, title: string = 'Atenção') => {
      showToast({ type: 'warning', title, message })
    },
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, title: string = 'Informação') => {
      showToast({ type: 'info', title, message })
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}
    >
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>}
              <p className="text-sm opacity-90 mt-0.5 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-black/5 transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
