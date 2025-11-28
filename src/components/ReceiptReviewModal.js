"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import axios from '@/lib/axios'

export default function ReceiptReviewModal({ open, receipts = [], disbursedAmount = 0, onCancel, onConfirm, loading = false }) {
  const [previewModal, setPreviewModal] = useState({ open: false, fileUrl: null, fileName: null, fileType: null, previewUrl: null })
  const [previewKey, setPreviewKey] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewBlobUrlRef = useRef(null)

  // Close full preview modal
  const closeFullPreview = useCallback(() => {
    // Cleanup blob URL
    if (previewBlobUrlRef.current) {
      window.URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
    setPreviewModal({ open: false, fileUrl: null, fileName: null, fileType: null, previewUrl: null })
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        window.URL.revokeObjectURL(previewBlobUrlRef.current)
        previewBlobUrlRef.current = null
      }
    }
  }, [])
  
  // Close preview modal when main modal closes
  useEffect(() => {
    if (!open) {
      closeFullPreview()
    }
  }, [open, closeFullPreview])

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
    if (r.file_path) {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      return `${backend}/api/documents/${r.file_path}`
    }
    return null
  }
  
  // Helper function to check if file is an image
  const isImageFile = (url) => {
    if (!url) return false
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0]
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)
  }
  
  // Helper function to check if file is a PDF
  const isPdfFile = (url) => {
    if (!url) return false
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0]
    return extension === 'pdf'
  }
  
  // Open full preview modal
  const openReceiptPreview = async (receipt) => {
    const fileUrl = getFileHref(receipt)
    if (!fileUrl) return
    
    // Check if it's a File object (local file)
    if (receipt.file && typeof File !== 'undefined' && receipt.file instanceof File) {
      // Handle local File objects
      const fileType = isImageFile(receipt.file.name) ? 'image' : isPdfFile(receipt.file.name) ? 'pdf' : null
      const blobUrl = URL.createObjectURL(receipt.file)
      
      setPreviewKey(prev => prev + 1)
      setPreviewModal({ 
        open: true, 
        fileUrl, 
        fileName: receipt.file.name || 'Receipt', 
        fileType,
        previewUrl: blobUrl 
      })
      return
    }
    
    // Handle server URLs - fetch as blob
    setPreviewKey(prev => prev + 1)
    setPreviewLoading(true)
    
    const fileType = isImageFile(fileUrl) ? 'image' : isPdfFile(fileUrl) ? 'pdf' : null
    const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'Receipt'
    
    setPreviewModal({ open: true, fileUrl, fileName, fileType, previewUrl: null })
    
    try {
      // If it's already a blob URL or object URL, use it directly
      if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
        setPreviewModal(prev => ({ ...prev, previewUrl: fileUrl }))
        setPreviewLoading(false)
        return
      }
      
      // Fetch as blob for server URLs
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000,
      })
      
      const contentType = response.headers['content-type'] || ''
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType })
      
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Cleanup previous blob URL
      if (previewBlobUrlRef.current) {
        window.URL.revokeObjectURL(previewBlobUrlRef.current)
      }
      previewBlobUrlRef.current = blobUrl
      
      setPreviewModal(prev => ({ ...prev, previewUrl: blobUrl }))
    } catch (err) {
      console.error('Failed to load receipt preview:', err)
      // Fallback to direct URL for images
      if (fileType === 'image') {
        setPreviewModal(prev => ({ ...prev, previewUrl: fileUrl }))
      } else {
        closeFullPreview()
      }
    } finally {
      setPreviewLoading(false)
    }
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
                      if (href || (r.file && r.file.name)) {
                        return (
                          <button
                            type="button"
                            onClick={() => openReceiptPreview(r)}
                            className="ml-2 text-blue-600 underline hover:text-blue-800 focus:outline-none"
                          >
                            Open receipt
                          </button>
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
      
      {/* Full Preview Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4" key={`preview-modal-${previewKey}`}>
          <div
            className="absolute inset-0 bg-gray-900/60"
            onClick={closeFullPreview}
          />
          <div className="relative bg-white w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {previewModal.fileName || 'Receipt Preview'}
              </h3>
              <button
                type="button"
                onClick={closeFullPreview}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-100 min-h-0" key={`preview-content-${previewKey}`}>
              {previewModal.previewUrl && previewModal.fileType === 'image' ? (
                <div className="flex items-center justify-center h-full w-full">
                  <img
                    key={`preview-img-${previewKey}`}
                    src={previewModal.previewUrl}
                    alt={previewModal.fileName || 'Receipt Preview'}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
                    style={{ maxHeight: 'calc(90vh - 180px)' }}
                  />
                </div>
              ) : previewModal.previewUrl && previewModal.fileType === 'pdf' ? (
                <div className="flex items-center justify-center h-full w-full">
                  <iframe
                    key={`preview-iframe-${previewKey}`}
                    src={previewModal.previewUrl}
                    className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                    style={{ minHeight: 'calc(90vh - 180px)', width: '100%' }}
                    title={`PDF Preview - ${previewModal.fileName || 'Receipt'}`}
                  />
                </div>
              ) : previewLoading ? (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-center text-gray-400">
                    <svg className="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm">Loading preview...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Preview not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
