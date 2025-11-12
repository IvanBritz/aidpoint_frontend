import { useState } from 'react'
import axios from '@/lib/axios'

export default function SubmissionReviewModal({ isOpen, submission, onClose, onReviewed }) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [downloadingDoc, setDownloadingDoc] = useState(null)

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
  
  const downloadDocument = async (path, documentType) => {
    if (downloadingDoc === documentType) return // Prevent multiple downloads
    
    setDownloadingDoc(documentType)
    try {
      const response = await axios.get(`/api/documents/${path}`, {
        responseType: 'blob', // Important for binary data
        headers: {
          'Accept': '*/*'
        },
        timeout: 30000 // 30 second timeout
      })
      
      // Get the filename from response headers or create one
      const contentDisposition = response.headers['content-disposition']
      const contentType = response.headers['content-type'] || ''
      let ext = 'bin'
      if (contentType.includes('jpeg')) ext = 'jpg'
      else if (contentType.includes('png')) ext = 'png'
      else if (contentType.includes('gif')) ext = 'gif'
      else if (contentType.includes('webp')) ext = 'webp'
      let filename = `${documentType}.${ext}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=\"?([^\"]+)\"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Validate response is actually image or binary data
      if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
        throw new Error('Invalid file format received')
      }
      
      // Use the response blob as-is
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Download failed:', error)
      let errorMessage = 'Failed to download document. Please try again.'
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Download timed out. Please try again.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found.'
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to download this document.'
      }
      
      alert(errorMessage)
    } finally {
      setDownloadingDoc(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/40" onClick={()=>!loading && onClose?.()}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>
          <p className="text-sm text-gray-600">Beneficiary: <span className="font-medium">{beneficiaryName || 'Unknown'}</span></p>
        </div>

        <div className="p-6 space-y-4">
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
            {submission.enrollment_certification_path && (
              <div>
                <div className="text-gray-600">Enrollment Certification</div>
                <button 
                  className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => downloadDocument(submission.enrollment_certification_path, `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Enrollment_Certification`)}
                  disabled={downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Enrollment_Certification`}
                >
                  {downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Enrollment_Certification` ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
Downloading...
                    </span>
                  ) : (
'Download'
                  )}
                </button>
              </div>
            )}
            {submission.scholarship_certification_path && (
              <div>
                <div className="text-gray-600">Scholarship Certification</div>
                <button 
                  className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => downloadDocument(submission.scholarship_certification_path, `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Scholarship_Certification`)}
                  disabled={downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Scholarship_Certification`}
                >
                  {downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_Scholarship_Certification` ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </span>
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            )}
            {submission.sao_photo_path && (
              <div>
                <div className="text-gray-600">SOA</div>
                <button 
                  className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => downloadDocument(submission.sao_photo_path, `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_SOA`)}
                  disabled={downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_SOA`}
                >
                  {downloadingDoc === `${submission.beneficiary?.lastname || 'Unknown'}_${submission.beneficiary?.firstname || 'Beneficiary'}_SOA` ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </span>
                  ) : (
                    'Download'
                  )}
                </button>
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

        <div className="px-6 py-4 border-t flex items-center justify-between">
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
    </div>
  )
}
