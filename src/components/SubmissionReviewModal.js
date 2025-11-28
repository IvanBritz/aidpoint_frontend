import { useState, useEffect, useRef, useCallback } from 'react'
import axios from '@/lib/axios'

// File Preview Card Component for server URLs
const FilePreviewCard = ({ filePath, fileName, documentType, onViewFullPreview }) => {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [fileType, setFileType] = useState(null)
  const blobUrlRef = useRef(null)
  
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const docUrl = filePath ? `${backend}/api/documents/${filePath}` : null
  
  useEffect(() => {
    // Cleanup previous blob URL if exists
    if (blobUrlRef.current) {
      window.URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    
    if (!filePath) {
      setLoading(false)
      setPreviewUrl(null)
      setFileType(null)
      return
    }
    
    // Determine file type from path
    const extension = filePath.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      setFileType('image')
      // For images, use direct URL
      setPreviewUrl(docUrl)
      setLoading(false)
      setError(false)
    } else if (extension === 'pdf') {
      setFileType('pdf')
      
      // For PDFs, fetch as blob to handle authentication properly
      setLoading(true)
      setError(false)
      
      axios.get(`/api/documents/${filePath}`, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf' },
        timeout: 30000,
      })
      .then(response => {
        const contentType = response.headers['content-type'] || 'application/pdf'
        const blob = response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: contentType })
        
        const blobUrl = window.URL.createObjectURL(blob)
        blobUrlRef.current = blobUrl
        setPreviewUrl(blobUrl)
        setLoading(false)
        setError(false)
      })
      .catch(err => {
        console.error('Failed to load PDF:', err)
        setError(true)
        setLoading(false)
      })
    } else {
      setFileType(null)
      setLoading(false)
    }
    
    // Cleanup function for blob URLs
    return () => {
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [filePath, docUrl])
  
  const isImage = fileType === 'image'
  const isPdf = fileType === 'pdf'
  
  // Render - all hooks must be called before any conditional returns
  if (!filePath) {
    return (
      <div className="w-full h-40 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
        <div className="text-center text-gray-400">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs">No file</p>
        </div>
      </div>
    )
  }
  
  if (error || (!isImage && !isPdf)) {
    return (
      <div className="w-full h-40 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
        <div className="text-center text-gray-400">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs">Preview not available</p>
          <p className="text-xs mt-1 text-gray-500 truncate px-2">{fileName}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {isImage && previewUrl ? (
        <div className="w-full h-48 bg-white flex items-center justify-center overflow-hidden">
          <img
            src={previewUrl}
            alt={fileName || 'Preview'}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '192px' }}
            onError={() => setError(true)}
            onLoad={() => setError(false)}
          />
        </div>
      ) : isPdf && previewUrl && !loading ? (
        <div className="w-full h-48 bg-white overflow-hidden relative">
          <iframe
            key={previewUrl}
            src={previewUrl}
            type="application/pdf"
            className="w-full h-full border-0"
            title={`PDF Preview - ${fileName || 'PDF'}`}
            style={{ minHeight: '192px', width: '100%' }}
          />
        </div>
      ) : loading ? (
        <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs">Preview not available</p>
          </div>
        </div>
      )}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-600 truncate">{fileName || documentType}</div>
        <button
          type="button"
          onClick={() => onViewFullPreview?.(filePath, fileName, fileType)}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none"
        >
          View full preview
        </button>
      </div>
    </div>
  )
}

export default function SubmissionReviewModal({ isOpen, submission, onClose, onReviewed }) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [downloadingDoc, setDownloadingDoc] = useState(null)
  const [previewModal, setPreviewModal] = useState({ open: false, filePath: null, fileName: null, fileType: null, previewUrl: null })
  const [previewKey, setPreviewKey] = useState(0)
  const previewBlobUrlRef = useRef(null)

  // Close full preview modal
  const closeFullPreview = useCallback(() => {
    // Cleanup blob URL
    if (previewBlobUrlRef.current) {
      window.URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
    setPreviewModal({ open: false, filePath: null, fileName: null, fileType: null, previewUrl: null })
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup preview modal blob URL when component unmounts
      if (previewBlobUrlRef.current) {
        window.URL.revokeObjectURL(previewBlobUrlRef.current)
        previewBlobUrlRef.current = null
      }
    }
  }, [])
  
  // Close preview modal when main modal closes
  useEffect(() => {
    if (!isOpen) {
      closeFullPreview()
    }
  }, [isOpen, closeFullPreview])

  if (!isOpen || !submission) return null

  const beneficiaryName = `${submission?.beneficiary?.firstname || ''} ${submission?.beneficiary?.middlename || ''} ${submission?.beneficiary?.lastname || ''}`.replace(/\s+/g,' ').trim()
  
  const act = async (status) => {
    try {
      setLoading(true)
      await axios.post(`/api/beneficiary-document-submissions/${submission.id}/review`, { status, review_notes: notes })
      onReviewed?.(submission.id, status)
      onClose?.()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const docUrl = (p) => `${backend}/api/documents/${p}`
  
  // Open full preview modal
  const openFullPreview = async (filePath, fileName, fileType) => {
    if (!filePath) return
    
    setPreviewKey(prev => prev + 1)
    setPreviewModal({ open: true, filePath, fileName, fileType, previewUrl: null })
    
    // Fetch file as blob for preview
    try {
      const response = await axios.get(`/api/documents/${filePath}`, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000,
      })
      
      const contentType = response.headers['content-type'] || ''
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType || 'application/octet-stream' })
      
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Cleanup previous blob URL
      if (previewBlobUrlRef.current) {
        window.URL.revokeObjectURL(previewBlobUrlRef.current)
      }
      previewBlobUrlRef.current = blobUrl
      
      setPreviewModal(prev => ({ ...prev, previewUrl: blobUrl }))
    } catch (error) {
      console.error('Failed to load file for preview:', error)
      alert('Failed to load file preview. Please try again.')
      closeFullPreview()
    }
  }
  
  // Helper function to check if file is an image
  const isImageFile = (type) => {
    return type === 'image'
  }
  
  // Helper function to check if file is a PDF
  const isPdfFile = (type) => {
    return type === 'pdf'
  }
  
  // Download file from preview modal
  const downloadPreviewFile = () => {
    if (!previewModal.previewUrl) return
    
    const link = document.createElement('a')
    link.href = previewModal.previewUrl
    link.download = previewModal.fileName || 'document'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Open a beneficiary document in a new browser tab for review.
  // We still fetch via Axios to keep the existing auth headers/CSRF setup,
  // then stream the blob into a temporary object URL instead of forcing a download.
  const downloadDocument = async (path, documentType) => {
    if (downloadingDoc === documentType) return // Prevent multiple parallel opens

    setDownloadingDoc(documentType)
    try {
      const response = await axios.get(`/api/documents/${path}`, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000,
      })

      const contentType = response.headers['content-type'] || ''

      // Accept images, PDFs, or generic binary streams – the browser will decide how to render.
      if (!contentType.includes('image') && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        throw new Error('Unsupported file format received from server')
      }

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType || 'application/octet-stream' })

      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')

      // Best-effort cleanup after the new tab has loaded.
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 60000)
    } catch (error) {
      console.error('Open document failed:', error)
      let errorMessage = 'Failed to open document. Please try again.'

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Opening the document timed out. Please try again.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found.'
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to view this document.'
      }

      alert(errorMessage)
    } finally {
      setDownloadingDoc(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40" onClick={()=>!loading && onClose?.()}></div>
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>
          <p className="text-sm text-gray-600">Beneficiary: <span className="font-medium">{beneficiaryName || 'Unknown'}</span></p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Enrollment Date</div>
              <div className="font-medium">{submission.enrollment_date}</div>
            </div>
            <div>
              <div className="text-gray-600">Year Level</div>
              <div className="font-medium">{submission.year_level}</div>
            </div>
            <div>
              <div className="text-gray-600">Scholar Status</div>
              <div className="font-medium">{submission.is_scholar ? 'Scholar' : 'Non-scholar'}</div>
            </div>
          </div>
          
          {/* File Preview Cards Section */}
          <div className="space-y-4 mt-4">
            {submission.enrollment_certification_path && (
              <div>
                <div className="text-gray-600 mb-2 text-sm font-medium">Enrollment Certification</div>
                <FilePreviewCard
                  filePath={submission.enrollment_certification_path}
                  fileName={`${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Enrollment_Certification`}
                  documentType="Enrollment Certification"
                  onViewFullPreview={openFullPreview}
                />
              </div>
            )}
            {submission.scholarship_certification_path && (
              <div>
                <div className="text-gray-600 mb-2 text-sm font-medium">Scholarship Certification</div>
                <FilePreviewCard
                  filePath={submission.scholarship_certification_path}
                  fileName={`${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Scholarship_Certification`}
                  documentType="Scholarship Certification"
                  onViewFullPreview={openFullPreview}
                />
              </div>
            )}
            {submission.sao_photo_path && (
              <div>
                <div className="text-gray-600 mb-2 text-sm font-medium">SOA</div>
                <FilePreviewCard
                  filePath={submission.sao_photo_path}
                  fileName={`${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_SOA`}
                  documentType="SOA"
                  onViewFullPreview={openFullPreview}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e=> setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a short note about your decision"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={()=> act('rejected')}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Reject'}
            </button>
            <button
              onClick={()=> act('approved')}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Approve'}
            </button>
          </div>
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
                {previewModal.fileName || 'File Preview'}
              </h3>
              <div className="flex items-center gap-3">
                {(isImageFile(previewModal.fileType) || isPdfFile(previewModal.fileType)) && previewModal.previewUrl && (
                  <button
                    type="button"
                    onClick={downloadPreviewFile}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                )}
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
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-100 min-h-0" key={`preview-content-${previewKey}`}>
              {previewModal.previewUrl && isImageFile(previewModal.fileType) ? (
                <div className="flex items-center justify-center h-full w-full">
                  <img
                    key={`preview-img-${previewKey}`}
                    src={previewModal.previewUrl}
                    alt={previewModal.fileName || 'Preview'}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
                    style={{ maxHeight: 'calc(90vh - 180px)' }}
                  />
                </div>
              ) : previewModal.previewUrl && isPdfFile(previewModal.fileType) ? (
                <div className="flex items-center justify-center h-full w-full">
                  <iframe
                    key={`preview-iframe-${previewKey}`}
                    src={previewModal.previewUrl}
                    className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                    style={{ minHeight: 'calc(90vh - 180px)', width: '100%' }}
                    title={`PDF Preview - ${previewModal.fileName || 'PDF'}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-center text-gray-400">
                    <svg className="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm">Loading preview...</p>
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
