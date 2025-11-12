import { useEffect, useRef, useState } from 'react'

const ApprovalNotesModal = ({
  open,
  title = 'Add notes',
  description = 'Optionally add notes to include with your decision.',
  placeholder = 'Write notes (optional)...',
  actionLabel = 'Confirm',
  onConfirm,
  onCancel,
  loading = false,
  defaultValue = ''
}) => {
  const [notes, setNotes] = useState(defaultValue || '')
  const cancelRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (open) {
      setNotes(defaultValue || '')
      // focus the textarea after mount
      const t = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(t)
    }
  }, [open, defaultValue])

  useEffect(() => {
    const onKey = e => {
      if (!open) return
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 1l7.997 4.884v8.232L10 19l-7.997-4.884V5.884zM10 3.197L4 6.631v6.738L10 16.8l6-3.431V6.631L10 3.197z"/></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="sr-only">Notes</label>
            <textarea
              ref={inputRef}
              rows={5}
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 p-3"
              placeholder={placeholder}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {notes.length}/1000
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(notes)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApprovalNotesModal