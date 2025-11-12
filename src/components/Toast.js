import { useEffect } from 'react'

const icons = {
  success: (
    <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.293 7.293a1 1 0 011.414 0L10 7.586l.293-.293a1 1 0 111.414 1.414L11.414 9l.293.293a1 1 0 01-1.414 1.414L10 10.414l-.293.293A1 1 0 018.293 9.293L8.586 9l-.293-.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zM9 9a1 1 0 112 0v5a1 1 0 11-2 0V9zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
    </svg>
  ),
}

const tone = {
  success: 'bg-green-50 ring-green-200',
  error: 'bg-red-50 ring-red-200',
  info: 'bg-blue-50 ring-blue-200',
}

export default function Toast({ open, onClose, title = 'Notice', message, type = 'info', duration = 3500 }) {
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(id)
  }, [open, duration])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-6 right-6 w-[360px] pointer-events-auto">
        <div className={`relative flex items-start gap-3 rounded-lg ring-1 shadow-md p-4 ${tone[type]}`}>
          <div className="shrink-0 mt-0.5">{icons[type]}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {message && <p className="mt-0.5 text-sm text-gray-700 break-words">{message}</p>}
          </div>
          <button
            className="absolute top-2 right-2 rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close notification"
            onClick={onClose}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
