"use client"

import { useEffect } from 'react'

const icons = {
  success: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0L3.293 8.849a1 1 0 111.414-1.414L8.12 10.85l6.364-6.364a1 1 0 011.223-.193z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M8.257 3.099c.366-.446.957-.546 1.414-.246l.094.074 6.364 6.364a1 1 0 010 1.414l-6.364 6.364a1 1 0 01-1.497-1.32l.083-.094L13.085 10 8.257 5.172a1 1 0 01-.246-1.415l.074-.094L8.257 3.1z" clipRule="evenodd" />
    </svg>
  ),
}

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => onClose && onClose(), 4500)
    return () => clearTimeout(t)
  }, [notification, onClose])

  if (!notification) return null

  const { type = 'success', title, message } = notification
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600'

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`max-w-sm w-full rounded-lg shadow-lg overflow-hidden ${bg} text-white`} role="status" aria-live="polite">
        <div className="flex items-start gap-3 p-3">
          <div className="flex-shrink-0">{icons[type] || icons.success}</div>
          <div className="flex-1">
            {title && <div className="font-semibold">{title}</div>}
            {message && <div className="text-sm mt-1 opacity-90">{message}</div>}
          </div>
          <button onClick={() => onClose && onClose()} className="ml-3 p-1 rounded hover:bg-white/20">
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
