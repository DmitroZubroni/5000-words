import { createContext, useContext, useState, useCallback } from 'react'
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle
} from '@tabler/icons-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const success = useCallback((msg) => show(msg, 'success'), [show])
  const error   = useCallback((msg) => show(msg, 'error', 4000), [show])
  const info    = useCallback((msg) => show(msg, 'info'), [show])
  const warning = useCallback((msg) => show(msg, 'warning'), [show])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const STYLES = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    icon: <IconCheck size={18} className="text-green-500 flex-shrink-0" />,
    text: 'text-green-800 dark:text-green-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: <IconX size={18} className="text-red-500 flex-shrink-0" />,
    text: 'text-red-800 dark:text-red-200',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    icon: <IconAlertTriangle size={18} className="text-orange-500 flex-shrink-0" />,
    text: 'text-orange-800 dark:text-orange-200',
  },
  info: {
    bg: 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800',
    icon: <IconInfoCircle size={18} className="text-violet-500 flex-shrink-0" />,
    text: 'text-violet-800 dark:text-violet-200',
  },
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(toast => {
        const style = STYLES[toast.type] || STYLES.info
        return (
          <div
            key={toast.id}
            className={`w-full md:max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg pointer-events-auto
              ${style.bg} animate-fade-in`}
          >
            {style.icon}
            <p className={`flex-1 text-sm font-medium ${style.text}`}>{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <IconX size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}