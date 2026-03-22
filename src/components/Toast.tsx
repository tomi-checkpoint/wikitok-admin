import React, { useEffect } from 'react'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  text: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const addToast = (type: ToastMessage['type'], text: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, text }])
  }

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-accent/10 border-accent/30 text-accent',
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border text-sm min-w-[300px] flex items-center justify-between shadow-lg ${colors[toast.type]}`}
    >
      <span>{toast.text}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
      >
        &times;
      </button>
    </div>
  )
}
