"use client"

export default function ReceiptReviewModal({ open, receipts = [], disbursedAmount = 0, onCancel, onConfirm, loading = false }) {
  if (!open) return null

  const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)

  const total = receipts.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const getFileHref = (r) => {
    if (!r) return null
    if (r.file && typeof r.file === 'object') {
      // if the file object already has a url/preview available
      if (r.file.url) return r.file.url
      if (r.file.preview) return r.file.preview
      // if it's a File object (user just selected a local file), create an object URL
      try {
        if (typeof File !== 'undefined' && r.file instanceof File) return URL.createObjectURL(r.file)
      } catch (e) {
        // ignore
      }
    }
    if (r.url) return r.url
    if (r.signedUrl) return r.signedUrl
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Review Receipts</h3>
          <p className="text-sm text-gray-600">Please review all receipt details before submitting for approval.</p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {receipts.length === 0 ? (
              <p className="text-sm text-gray-500">No receipts to review.</p>
            ) : receipts.map((r, idx) => (
              <div key={r.id || idx} className="border border-gray-200 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Receipt #{idx + 1}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(parseFloat(r.amount) || 0)}</div>
                </div>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <div>
                    <span className="font-medium">File:</span>
                    {(() => {
                      const href = getFileHref(r)
                      if (href) {
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">
                            Open receipt
                          </a>
                        )
                      }
                      // fallback to showing the original filename if available
                      if (r.file && r.file.name) {
                        return (
                          <a href={getFileHref(r)} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">
                            {r.file.name}
                          </a>
                        )
                      }
                      return <span className="ml-2 text-gray-500">No file selected</span>
                    })()}
                  </div>
                  <div><span className="font-medium">OR/Invoice #:</span> {r.receipt_number || '—'}</div>
                  <div><span className="font-medium">Date:</span> {r.receipt_date || '—'}</div>
                  {r.description && <div><span className="font-medium">Description:</span> {r.description}</div>}
                </div>
              </div>
            ))}

            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Disbursed amount</div>
                <div className="font-semibold">{formatCurrency(disbursedAmount)}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">Total receipts</div>
                <div className={`font-semibold ${total > disbursedAmount ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(total)}</div>
              </div>
              {total > disbursedAmount && (
                <p className="mt-3 text-sm text-red-600">Warning: Total receipt amount exceeds disbursed amount. Please correct the amounts before submitting.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
