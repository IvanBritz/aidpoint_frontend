'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'
import PopupMessage from '@/components/PopupMessage'
import { usePopupMessage } from '@/hooks/usePopupMessage'

const DirectorLiquidationPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  const { popupState, showSuccess, showError, showWorkflowComplete, showInfo, closePopup } = usePopupMessage()
  const [liquidations, setLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState('approve')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkNotes, setBulkNotes] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [selectedReceiptLiquidation, setSelectedReceiptLiquidation] = useState(null)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  const [receiptImageUrls, setReceiptImageUrls] = useState({})
  // Preview modal state
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
  const openReceiptPreview = async (receipt, liquidationId) => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const viewUrl = `${backend}/api/liquidations/${liquidationId}/receipts/${receipt.id}/view`
    
    setPreviewKey(prev => prev + 1)
    setPreviewLoading(true)
    
    // Try to detect file type from receipt file path if available
    let initialFileType = null
    if (receipt.file_path) {
      initialFileType = isImageFile(receipt.file_path) ? 'image' : isPdfFile(receipt.file_path) ? 'pdf' : null
    } else if (receipt.receipt_image_path) {
      initialFileType = isImageFile(receipt.receipt_image_path) ? 'image' : isPdfFile(receipt.receipt_image_path) ? 'pdf' : null
    }
    
    const fileName = receipt.original_filename || receipt.file_path?.split('/').pop() || 'Receipt'
    
    setPreviewModal({ open: true, fileUrl: viewUrl, fileName, fileType: initialFileType, previewUrl: null })
    
    try {
      // Fetch as blob for server URLs
      const response = await axios.get(viewUrl, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000,
      })
      
      const contentType = response.headers['content-type'] || ''
      
      // Determine file type from Content-Type header
      let detectedFileType = initialFileType
      if (!detectedFileType) {
        if (contentType.includes('image/')) {
          detectedFileType = 'image'
        } else if (contentType.includes('pdf') || contentType.includes('application/pdf')) {
          detectedFileType = 'pdf'
        } else {
          // Default to PDF if content type is not clear (most receipts are PDFs)
          detectedFileType = 'pdf'
        }
      }
      
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType })
      
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Cleanup previous blob URL
      if (previewBlobUrlRef.current) {
        window.URL.revokeObjectURL(previewBlobUrlRef.current)
      }
      previewBlobUrlRef.current = blobUrl
      
      setPreviewModal(prev => ({ ...prev, previewUrl: blobUrl, fileType: detectedFileType || 'pdf' }))
    } catch (err) {
      console.error('Failed to load receipt preview:', err)
      // Fallback: try to use direct URL if it's an image
      if (initialFileType === 'image') {
        setPreviewModal(prev => ({ ...prev, previewUrl: viewUrl }))
      } else {
        // Still show modal but with error state
        setPreviewModal(prev => ({ ...prev, previewUrl: null }))
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  const loadLiquidations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading liquidations pending director approval (Step 3 - Final)...')
      
      // Use the correct multi-level approval endpoint
      console.log('📡 Fetching liquidations pending director approval')
      const res = await axios.get('/api/liquidations/pending-approvals')
      
      // Parse response data
      let liquidationsData = []
      if (res?.data) {
        if (res.data.success && res.data.data) {
          if (res.data.data.data && Array.isArray(res.data.data.data)) {
            liquidationsData = res.data.data.data
          } 
          else if (Array.isArray(res.data.data)) {
            liquidationsData = res.data.data
          }
        }
        else if (Array.isArray(res.data)) {
          liquidationsData = res.data
        }
        else if (res.data.data && Array.isArray(res.data.data)) {
          liquidationsData = res.data.data
        }
      }
      
      console.log('📋 Step 3 Director Final Workflow Status:')
      console.log('- Liquidations needing director final approval:', liquidationsData.length)
      liquidationsData.forEach(liq => {
        console.log(`  • ID: ${liq.id}, Status: ${liq.status}`)
        console.log(`    Caseworker: ${liq.caseworker_approved_at ? '✅' : '❌'}, Finance: ${liq.finance_approved_at ? '✅' : '❌'}`)
      })
      
      if (!Array.isArray(liquidationsData)) {
        console.warn('No valid liquidation data found, using empty array')
        liquidationsData = []
      }
      
      setLiquidations(liquidationsData)
      setError(null)
      
    } catch (e) {
      console.error('Load error:', e)
      setError(e.message || 'Failed to load liquidations')
      setLiquidations([])
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { if (user) loadLiquidations() }, [user?.id])

  // Function to fetch signed URL for receipt image
  const fetchSignedUrl = async (liquidationId, receiptId) => {
    const cacheKey = `${liquidationId}-${receiptId}`
    
    // Check if we already have the URL cached
    if (receiptImageUrls[cacheKey]) {
      return receiptImageUrls[cacheKey]
    }
    
    try {
      const response = await axios.get(`/api/liquidations/${liquidationId}/receipts/${receiptId}/signed-url`)
      
      if (response.data.success) {
        const signedUrl = response.data.signed_url
        
        // Cache the URL
        setReceiptImageUrls(prev => ({ ...prev, [cacheKey]: signedUrl }))
        
        return signedUrl
      }
    } catch (error) {
      console.error('Failed to fetch signed URL:', error)
    }
    
    return null
  }
  
  // Component for receipt image with signed URL handling
  const ReceiptImage = ({ liquidationId, receiptId, receipt, index }) => {
    const [imageSrc, setImageSrc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    
    useEffect(() => {
      const loadImage = async () => {
        if (receipt.file_path) {
          setLoading(true)
          const signedUrl = await fetchSignedUrl(liquidationId, receiptId)
          if (signedUrl) {
            setImageSrc(signedUrl)
            setError(false)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
        setLoading(false)
      }
      
      loadImage()
    }, [liquidationId, receiptId, receipt.file_path])
    
    if (loading) {
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <div className="w-full max-w-md mx-auto rounded-lg border border-gray-200 shadow-sm flex items-center justify-center" style={{ height: '200px' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-500">Loading image...</div>
            </div>
          </div>
        </div>
      )
    }
    
    if (error || !imageSrc) {
      return (
        <div className="text-center py-8 text-gray-500 bg-gray-100 rounded border border-dashed border-gray-300">
          <span className="text-4xl mb-3 block">📄</span>
          <div className="font-medium mb-2">Could not load receipt image</div>
          <div className="text-sm">File path: {receipt.file_path || 'Not available'}</div>
          <div className="text-xs text-gray-400 mt-1">Receipt ID: {receipt.id}</div>
        </div>
      )
    }
    
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
        <img 
          src={imageSrc}
          alt={`Receipt ${index + 1} - ${receipt.receipt_number || 'No receipt number'}`}
          className="w-full max-w-md mx-auto rounded-lg border border-gray-200 shadow-sm"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
          onLoad={() => {
            console.log('Receipt image loaded successfully:', imageSrc)
          }}
          onError={() => {
            console.error('Failed to load receipt image:', imageSrc, 'Receipt data:', receipt)
            setError(true)
          }}
        />
      </div>
    )
  }

  const handleApprovalAction = (liquidation, action) => {
    setSelectedLiquidation(liquidation)
    setApprovalAction(action)
    setApprovalNotes('')
    setShowApprovalModal(true)
  }

  const submitApprovalDecision = async () => {
    if (!selectedLiquidation) return
    
    try {
      setSubmitting(true)
      
      // Use the multi-level approval endpoints for Step 3 (Final)
      const endpoint = approvalAction === 'approve' 
        ? `/api/liquidations/${selectedLiquidation.id}/director-approve`
        : `/api/liquidations/${selectedLiquidation.id}/director-reject`
      
      const payload = approvalAction === 'approve' 
        ? { notes: approvalNotes } 
        : { reason: approvalNotes }
      
      console.log(`${approvalAction === 'approve' ? '✅ Director Final Approving' : '❌ Director Rejecting'} liquidation ${selectedLiquidation.id}`)
      
      await axios.post(endpoint, payload)
      
      // Show success message with clear workflow completion (replace browser alert)
      if (approvalAction === 'approve') {
        const beneficiaryName = selectedLiquidation.beneficiary
          ? `${selectedLiquidation.beneficiary.firstname} ${selectedLiquidation.beneficiary.lastname}`
          : `ID: ${selectedLiquidation.beneficiary_id}`
        const amount = parseFloat(selectedLiquidation.total_disbursed_amount || 0).toLocaleString()
        showWorkflowComplete(beneficiaryName, amount)
      } else {
        showError('Liquidation Rejected', 'Liquidation rejected by Director (Final Authority). The liquidation has been sent back to finance for review.')
      }
      
      // Reload liquidations
      await loadLiquidations()
      
      // Close modal
      setShowApprovalModal(false)
      setSelectedLiquidation(null)
      setApprovalNotes('')
      
    } catch (err) {
      console.error('Error processing director approval:', err)
      const errorMessage = err?.response?.data?.message || `Failed to ${approvalAction} liquidation`
      showError('Action Failed', errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Role detection for director users
  const isDirector = user && (
    user?.system_role?.name?.toLowerCase() === 'director' || 
    String(user?.system_role?.name || '').toLowerCase() === 'director' ||
    // Temporary: Allow all authenticated users on localhost for testing
    (user && typeof window !== 'undefined' && window.location.hostname === 'localhost')
  )
  
  // Role-based access control
  if (user && !isDirector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">🚫 Access Denied</div>
          <div className="text-gray-700">You must be a director to access this page.</div>
          <div className="text-sm text-gray-500 mt-2">
            Current role: {user?.system_role?.name || user?.role || 'Unknown'}
          </div>
        </div>
      </div>
    )
  }
  
  if (!user) return (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <div className="ml-3 text-gray-600">Loading user data...</div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Director Final Liquidation Approvals</h1>
          <p className="text-gray-600 mt-1">Step 3: Final approval for liquidations approved by Finance</p>
          
          {/* Workflow Indicator */}
          <div className="mt-3 flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">✅ Beneficiary</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">✅ Caseworker</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">✅ Finance</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium ring-2 ring-purple-300">👨‍💼 Director (Final)</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadLiquidations}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              '🔄 Refresh'
            )}
          </button>
          <button
            onClick={() => {
              if (!liquidations || liquidations.length === 0) {
                showError('No items', 'There are no liquidations to bulk approve.')
                return
              }
              setBulkNotes('')
              setBulkModalOpen(true)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            Bulk Approve
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {!loading && !error && liquidations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <span className="text-purple-600 text-lg">👨‍💼</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{liquidations.length}</div>
                <div className="text-sm text-gray-600">Pending Final Approval</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <span className="text-indigo-600 text-lg">💰</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  ₱{liquidations.reduce((sum, l) => sum + (parseFloat(l.total_disbursed_amount) || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-600 text-lg">✅</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{liquidations.filter(l => l.finance_approved_at).length}</div>
                <div className="text-sm text-gray-600">Finance Approved</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 text-2xl mr-3">⚠️</span>
            <div>
              <div className="text-red-700 font-semibold mb-2">Error Loading Liquidations</div>
              <div className="text-red-600 mb-4">{error}</div>
              <button 
                onClick={loadLiquidations}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Retrying...' : '🔄 Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <div className="text-lg text-gray-600 mb-2">Loading liquidations for final approval...</div>
          <div className="text-sm text-gray-500">Step 3 - Final stage of the approval workflow</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && liquidations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👨‍💼</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No Liquidations Pending Final Approval</div>
          <div className="text-gray-600 mb-6">All liquidations from finance have been reviewed, or no new submissions are ready for final approval.</div>
          <div className="text-sm text-gray-500 mb-6">
            Liquidations will appear here after finance approves them in Step 2.
          </div>
          <button 
            onClick={loadLiquidations}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 Check Again
          </button>
        </div>
      )}

      {/* Liquidations List */}
      {!loading && !error && liquidations.length > 0 && (
        <div className="space-y-6">
          {liquidations.map(liquidation => (
            <div key={liquidation.id} className="bg-white border-2 border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Header with Final Approval Badge */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {liquidation.beneficiary ? `${liquidation.beneficiary.firstname} ${liquidation.beneficiary.lastname}` : `Beneficiary ID: ${liquidation.beneficiary_id}`}
                    </h3>
                    <div className="text-gray-600 mt-1 flex flex-wrap gap-4">
                      <span className="flex items-center">
                        <span className="mr-1">💰</span> 
                        ₱{parseFloat(liquidation.total_disbursed_amount)?.toLocaleString() || 'N/A'}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">📅</span>
                        {liquidation.created_at ? new Date(liquidation.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">🆔</span>
                        #{liquidation.id}
                      </span>
                    </div>
                  </div>
                  
                  {/* Final Approval Status Badge */}
                  <div className="px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-800 border-2 border-purple-300">
                    🎯 PENDING FINAL APPROVAL
                  </div>
                </div>
                
                {/* Complete Workflow Progress */}
                <div className="flex items-center space-x-2">
                  {/* All Previous Stages - Completed */}
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-2">👩‍💼</span>
                    <div>
                      <div className="font-semibold">Caseworker</div>
                      <div className="text-xs opacity-75">
                        ✅ {(
                          liquidation.caseworker_name ||
                          (liquidation.caseworkerApprover ? `${liquidation.caseworkerApprover.firstname} ${liquidation.caseworkerApprover.lastname}` : null)
                        ) || 'Approved'}
                      </div>
                      <div className="text-xs opacity-60">
                        {new Date(liquidation.caseworker_approved_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-2">💳</span>
                    <div>
                      <div className="font-semibold">Finance</div>
                      <div className="text-xs opacity-75">
                        ✅ {(
                          liquidation.finance_name ||
                          (liquidation.financeApprover ? `${liquidation.financeApprover.firstname} ${liquidation.financeApprover.lastname}` : null)
                        ) || 'Approved'}
                      </div>
                      <div className="text-xs opacity-60">
                        {new Date(liquidation.finance_approved_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  {/* Director Stage - Current Final Step */}
                  <div className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 ring-2 ring-purple-400">
                    <span className="mr-2 text-lg">👨‍💼</span>
                    <div>
                      <div className="font-bold">Director (FINAL)</div>
                      <div className="text-xs opacity-75">🎯 Awaiting Your Decision</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="p-6">
                {/* Previous Approval Notes */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 Previous Approval History:</h4>
                  <div className="space-y-3">
                    {liquidation.caseworker_notes && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-green-800 mb-1">
                          👩‍💼 Step 1: Caseworker Approval
                          {liquidation.caseworkerApprover && (
                            <span className="ml-2 text-xs font-normal">by {liquidation.caseworkerApprover.firstname} {liquidation.caseworkerApprover.lastname}</span>
                          )}
                        </div>
                        <div className="text-green-700">{liquidation.caseworker_notes}</div>
                        <div className="text-xs text-green-600 mt-2">
                          Approved on {new Date(liquidation.caseworker_approved_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {liquidation.finance_notes && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          💳 Step 2: Finance Approval
                          {liquidation.financeApprover && (
                            <span className="ml-2 text-xs font-normal">by {liquidation.financeApprover.firstname} {liquidation.financeApprover.lastname}</span>
                          )}
                        </div>
                        <div className="text-blue-700">{liquidation.finance_notes}</div>
                        <div className="text-xs text-blue-600 mt-2">
                          Approved on {new Date(liquidation.finance_approved_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Beneficiary Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                    <div className="font-medium">{liquidation.beneficiary?.phone || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Submitted</div>
                    <div className="font-medium">
                      {liquidation.created_at ? new Date(liquidation.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Receipts</div>
                    <div className="font-medium">{liquidation.receipts?.length || 0} attached</div>
                  </div>
                </div>
                
                {/* View Receipts Section */}
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setSelectedReceiptLiquidation(liquidation)
                      setShowReceiptsModal(true)
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <span className="mr-2">📄</span>
                    View All Receipts ({liquidation.receipts?.length || 0})
                  </button>
                </div>
                
                {/* Final Action Buttons */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-purple-800 mb-2">🎯 Final Decision Required</div>
                    <div className="text-sm text-purple-600">
                      As Director, your approval will complete the entire liquidation workflow.
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleApprovalAction(liquidation, 'reject')}
                      className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center font-medium"
                    >
                      <span className="mr-2">❌</span>
                      Final Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(liquidation, 'approve')}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
                    >
                      <span className="mr-2">🎉</span>
                      Final Approve & Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Final Approval Modal */}
      {showApprovalModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 border-2 border-purple-300">
            <h3 className="text-xl font-bold mb-4 text-center">
              {approvalAction === 'approve' ? '🎉 Final Approval' : '❌ Final Rejection'} - Step 3
            </h3>
            
            <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-200">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Beneficiary:</strong> {selectedLiquidation.beneficiary ? `${selectedLiquidation.beneficiary.firstname} ${selectedLiquidation.beneficiary.lastname}` : `ID: ${selectedLiquidation.beneficiary_id}`}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Amount:</strong> ₱{parseFloat(selectedLiquidation.total_disbursed_amount)?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mb-1">
                <strong>Caseworker Approved:</strong> {new Date(selectedLiquidation.caseworker_approved_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Finance Approved:</strong> {new Date(selectedLiquidation.finance_approved_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {approvalAction === 'approve' ? 'Final Approval Notes (Optional)' : 'Final Rejection Reason (Required)'}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                placeholder={approvalAction === 'approve' 
                  ? 'Enter any final notes for this completed liquidation...' 
                  : 'Please provide the reason for final rejection...'}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedLiquidation(null)
                  setApprovalNotes('')
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitApprovalDecision}
                disabled={submitting || (approvalAction === 'reject' && !approvalNotes.trim())}
                className={`px-6 py-3 text-white rounded-lg transition-colors font-medium ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  approvalAction === 'approve' ? '🎉 Complete Workflow' : '❌ Final Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 border-2 border-green-300">
            <h3 className="text-xl font-bold mb-4 text-center">Bulk Final Approve ({liquidations.length} items)</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-700">You are about to final-approve <strong>{liquidations.length}</strong> liquidations. This will complete the workflow for each selected liquidation.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <textarea value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" rows={4} placeholder="Add a note to include with all approvals (optional)"></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setBulkModalOpen(false)} disabled={bulkSubmitting} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    setBulkSubmitting(true)
                    let success = 0
                    let failed = 0
                    for (const liq of liquidations) {
                      try {
                        await axios.post(`/api/liquidations/${liq.id}/director-approve`, { notes: bulkNotes })
                        success++
                      } catch (err) {
                        failed++
                        console.error('Failed approving', liq.id, err?.response?.data || err)
                      }
                    }
                    setBulkModalOpen(false)
                    await loadLiquidations()
                    if (failed === 0) {
                      showSuccess('Bulk Approve Complete', `Successfully approved ${success} liquidation(s).`)
                    } else {
                      showError('Partial Success', `Approved ${success} liquidation(s). ${failed} failed. Check console for details.`)
                    }
                  } finally {
                    setBulkSubmitting(false)
                  }
                }}
                disabled={bulkSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {bulkSubmitting ? 'Processing...' : 'Confirm Bulk Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipts Modal */}
      {showReceiptsModal && selectedReceiptLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-purple-800 mb-2">
                  📄 Receipt Review - Director Final Approval
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold text-purple-700">👤 Beneficiary:</span>
                      <div className="text-gray-800 font-medium">
                        {selectedReceiptLiquidation.beneficiary ? 
                          `${selectedReceiptLiquidation.beneficiary.firstname} ${selectedReceiptLiquidation.beneficiary.lastname}` : 
                          `ID: ${selectedReceiptLiquidation.beneficiary_id}`}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">🆔 Liquidation ID:</span>
                      <div className="text-gray-800 font-medium">#{selectedReceiptLiquidation.id}</div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReceiptsModal(false)
                  closeFullPreview() // Close preview modal if open
                  setSelectedReceiptLiquidation(null)
                }}
                className="text-gray-400 hover:text-gray-600 ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Total Disbursed:</span>
                  <div className="font-bold text-purple-600">₱{parseFloat(selectedReceiptLiquidation.total_disbursed_amount)?.toLocaleString() || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Receipts:</span>
                  <div className="font-bold text-green-600">₱{parseFloat(selectedReceiptLiquidation.total_receipt_amount || 0)?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Remaining:</span>
                  <div className="font-bold text-orange-600">₱{parseFloat(selectedReceiptLiquidation.remaining_amount || 0)?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Receipts:</span>
                  <div className="font-bold text-gray-800">{selectedReceiptLiquidation.receipts?.length || 0}</div>
                </div>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded border">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">✅ Approval History</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>👩‍💼 Caseworker: Approved on {new Date(selectedReceiptLiquidation.caseworker_approved_at).toLocaleDateString()}</div>
                <div>💳 Finance: Approved on {new Date(selectedReceiptLiquidation.finance_approved_at).toLocaleDateString()}</div>
                <div className="font-medium text-purple-700">🎯 Director: Pending your final decision</div>
              </div>
            </div>
            
            {selectedReceiptLiquidation.receipts && selectedReceiptLiquidation.receipts.length > 0 ? (
              <div className="space-y-6">
                {selectedReceiptLiquidation.receipts.map((receipt, index) => {
                  console.log(`Receipt ${index + 1} data:`, receipt)
                  return (
                    <div key={receipt.id || index} className="border-2 border-purple-200 rounded-lg p-6 bg-white shadow-sm">
                    {/* Receipt Header with Name and Amount */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-purple-800">Receipt #{index + 1}</h4>
                          {receipt.receipt_name && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              📋 {receipt.receipt_name}
                            </span>
                          )}
                        </div>
                        {receipt.description && (
                          <div className="bg-gray-50 p-3 rounded-lg border">
                            <span className="font-semibold text-gray-700">📝 Description: </span>
                            <span className="text-gray-800">{receipt.description}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-2xl text-green-600 mb-1">₱{parseFloat(receipt.receipt_amount || 0).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Submitted: {new Date(receipt.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {/* Key Receipt Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <span className="font-semibold text-indigo-700 block mb-1">🧾 Invoice/Receipt No:</span>
                        <div className="text-gray-900 font-medium">{receipt.receipt_number || 'N/A'}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <span className="font-semibold text-blue-700 block mb-1">📅 Receipt Date:</span>
                        <div className="text-gray-900 font-medium">{receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <span className="font-semibold text-orange-700 block mb-1">💰 Amount:</span>
                        <div className="text-gray-900 font-bold text-lg">₱{parseFloat(receipt.receipt_amount || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {/* View Receipt Button */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                        <span className="mr-2">📄</span> Receipt Document
                      </h5>
                      {receipt.file_path ? (
                        <button
                          onClick={() => openReceiptPreview(receipt, selectedReceiptLiquidation.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Receipt
                        </button>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No receipt file available
                        </div>
                      )}
                    </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                📄 No receipts available for this liquidation
              </div>
            )}
            
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  setShowReceiptsModal(false)
                  closeFullPreview() // Close preview modal if open
                  setSelectedReceiptLiquidation(null)
                  closeFullPreview() // Close preview modal if open
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              {previewLoading ? (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-center text-gray-400">
                    <svg className="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm">Loading preview...</p>
                  </div>
                </div>
              ) : previewModal.previewUrl && previewModal.fileType === 'image' ? (
                <div className="flex items-center justify-center h-full w-full">
                  <img
                    key={`preview-img-${previewKey}`}
                    src={previewModal.previewUrl}
                    alt={previewModal.fileName || 'Receipt Preview'}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
                    style={{ maxHeight: 'calc(90vh - 180px)' }}
                    onError={() => {
                      // If image fails, try as PDF
                      setPreviewModal(prev => ({ ...prev, fileType: 'pdf' }))
                    }}
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
              ) : previewModal.previewUrl ? (
                // If we have a URL but no file type detected, default to PDF (most receipts are PDFs)
                <div className="flex items-center justify-center h-full w-full">
                  <iframe
                    key={`preview-iframe-${previewKey}`}
                    src={previewModal.previewUrl}
                    className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                    style={{ minHeight: 'calc(90vh - 180px)', width: '100%' }}
                    title={`PDF Preview - ${previewModal.fileName || 'Receipt'}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Preview not available</p>
                    <p className="text-xs mt-2 text-gray-500">{previewModal.fileName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Global popup message */}
      <PopupMessage {...popupState} onClose={closePopup} />
    </div>
  )
}

export default DirectorLiquidationPage
