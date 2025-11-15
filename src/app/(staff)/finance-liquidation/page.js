'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'
import FinanceApprovalModal from '@/components/FinanceApprovalModal'

const FinanceLiquidationPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  const [liquidations, setLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState('approve')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedReceiptLiquidation, setSelectedReceiptLiquidation] = useState(null)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  // Step 2 success popup state
  const [showStep2Success, setShowStep2Success] = useState(false)
  const [lastApprovalDetails, setLastApprovalDetails] = useState(null)

  const loadLiquidations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading liquidations pending finance approval (Step 2)...')
      
      // Use the correct multi-level approval endpoint
      console.log('📡 Fetching liquidations pending finance approval')
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
      
      console.log('📋 Step 2 Finance Workflow Status:')
      console.log('- Liquidations needing finance review:', liquidationsData.length)
      liquidationsData.forEach(liq => {
        console.log(`  • ID: ${liq.id}, Status: ${liq.status}, Caseworker Approved: ${liq.caseworker_approved_at ? '✅' : '❌'}`)
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
      
      // Use the multi-level approval endpoints for Step 2
      const endpoint = approvalAction === 'approve' 
        ? `/api/liquidations/${selectedLiquidation.id}/finance-approve`
        : `/api/liquidations/${selectedLiquidation.id}/finance-reject`
      
      const payload = approvalAction === 'approve' 
        ? { notes: approvalNotes } 
        : { reason: approvalNotes }
      
      console.log(`${approvalAction === 'approve' ? '✅ Finance Approving' : '❌ Finance Rejecting'} liquidation ${selectedLiquidation.id}`)
      
      await axios.post(endpoint, payload)
      
      if (approvalAction === 'approve') {
        // Prepare details for the designed success popup
        setLastApprovalDetails({
          beneficiaryId: selectedLiquidation.beneficiary_id || selectedLiquidation.beneficiary?.id || selectedLiquidation.beneficiary?.beneficiary_id,
          amount: `₱${(parseFloat(selectedLiquidation.total_disbursed_amount) || 0).toLocaleString()}`,
          caseworkerApproved: selectedLiquidation.caseworker_approved_at ? new Date(selectedLiquidation.caseworker_approved_at).toLocaleDateString() : 'N/A'
        })
        setShowStep2Success(true)
      } else {
        // Keep a lightweight notification for reject for now
        alert('❌ Liquidation rejected by Finance.\n\nThe liquidation has been sent back to the caseworker for review.')
      }
      
      // Reload liquidations
      await loadLiquidations()
      
      // Close decision modal and reset
      setShowApprovalModal(false)
      setSelectedLiquidation(null)
      setApprovalNotes('')
      
    } catch (err) {
      console.error('Error processing finance approval:', err)
      const errorMessage = err?.response?.data?.message || `Failed to ${approvalAction} liquidation`
      alert(`❌ ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Debug: log user and role
  console.log('Finance page user object:', user)
  console.log('Finance page roleName:', user?.system_role?.name, '->', user?.system_role?.name?.toLowerCase?.())

  // Role detection for finance users — mirror staff layout logic
  const roleName = user?.system_role?.name?.toLowerCase?.()
  const isFinance = roleName === 'finance'

  // Role-based access control
  if (user && !isFinance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">🚫 Access Denied</div>
          <div className="text-gray-700">You must be a finance team member to access this page.</div>
          <div className="text-sm text-gray-500 mt-2">
            Current role: {user?.systemRole?.name || user?.system_role?.name || user?.role || 'Unknown'}
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
          <h1 className="text-2xl font-bold text-gray-900">Finance Liquidation Approvals</h1>
          <p className="text-gray-600 mt-1">Step 2: Review liquidations approved by caseworkers</p>
          
          {/* Workflow Indicator */}
          <div className="mt-3 flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">✅ Beneficiary</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">✅ Caseworker</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium ring-2 ring-blue-300">💳 Finance (You)</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">⏳ Director</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadLiquidations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
        </div>
      </div>

      {/* Stats Summary */}
      {!loading && !error && liquidations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <span className="text-blue-600 text-lg">💳</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{liquidations.length}</div>
                <div className="text-sm text-gray-600">Pending Finance Review</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <span className="text-purple-600 text-lg">💰</span>
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
                <div className="font-semibold text-gray-900">{liquidations.filter(l => l.caseworker_approved_at).length}</div>
                <div className="text-sm text-gray-600">Caseworker Approved</div>
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600 mb-2">Loading liquidations for finance review...</div>
          <div className="text-sm text-gray-500">Step 2 of the approval workflow</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && liquidations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💳</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No Liquidations Pending Finance Approval</div>
          <div className="text-gray-600 mb-6">All liquidations from caseworkers have been reviewed, or no new submissions are ready for Step 2.</div>
          <div className="text-sm text-gray-500 mb-6">
            Liquidations will appear here after caseworkers approve them in Step 1.
          </div>
          <button 
            onClick={loadLiquidations}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Check Again
          </button>
        </div>
      )}

      {/* Liquidations List */}
      {!loading && !error && liquidations.length > 0 && (
        <div className="space-y-6">
          {liquidations.map(liquidation => (
            <div key={liquidation.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {liquidation.beneficiary?.name || `Beneficiary ID: ${liquidation.beneficiary_id}`}
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
                  
                  {/* Current Status Badge */}
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    PENDING FINANCE APPROVAL
                  </div>
                </div>
                
                {/* Approval Workflow Progress - Step 2 Focus */}
                <div className="flex items-center space-x-2">
                  {/* Caseworker Stage - Completed */}
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-2">👩‍💼</span>
                    <div>
                      <div className="font-semibold">Caseworker</div>
                      <div className="text-xs opacity-75">
                        ✅ {new Date(liquidation.caseworker_approved_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  {/* Finance Stage - Current Step */}
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 ring-2 ring-blue-300">
                    <span className="mr-2">💳</span>
                    <div>
                      <div className="font-semibold">Finance (Step 2)</div>
                      <div className="text-xs opacity-75">⏳ Pending Your Review</div>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  {/* Director Stage - Next Step */}
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                    <span className="mr-2">👨‍💼</span>
                    <div>
                      <div className="font-semibold">Director</div>
                      <div className="text-xs opacity-75">⏳ Step 3</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="p-6">
                {/* Previous Approval Notes */}
                {liquidation.caseworker_notes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 Step 1 Notes from Caseworker:</h4>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-1">👩‍💼 Caseworker Approval</div>
                      <div className="text-green-700">{liquidation.caseworker_notes}</div>
                      <div className="text-xs text-green-600 mt-2">
                        Approved on {new Date(liquidation.caseworker_approved_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                
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
                
                {/* Action Buttons - Finance Step */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedReceiptLiquidation(liquidation)
                      setShowReceiptsModal(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <span className="mr-2">📄</span>
                    View Receipts ({liquidation.receipts?.length || 0})
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApprovalAction(liquidation, 'reject')}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <span className="mr-2">❌</span>
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(liquidation, 'approve')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <span className="mr-2">✅</span>
                      Approve for Director Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Approval Modal */}
      {showApprovalModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {approvalAction === 'approve' ? '✅ Finance Approve' : '❌ Finance Reject'} - Step 2
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Beneficiary:</strong> {selectedLiquidation.beneficiary?.name || `ID: ${selectedLiquidation.beneficiary_id}`}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Amount:</strong> ₱{parseFloat(selectedLiquidation.total_disbursed_amount)?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Caseworker Approved:</strong> {new Date(selectedLiquidation.caseworker_approved_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {approvalAction === 'approve' ? 'Finance Approval Notes (Optional)' : 'Finance Rejection Reason (Required)'}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={approvalAction === 'approve' 
                  ? 'Enter any financial review notes...' 
                  : 'Please explain why you are rejecting this liquidation...'}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedLiquidation(null)
                  setApprovalNotes('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitApprovalDecision}
                disabled={submitting || (approvalAction === 'reject' && !approvalNotes.trim())}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
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
                  `${approvalAction === 'approve' ? '✅ Finance Approve' : '❌ Finance Reject'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipts Modal */}
      {showReceiptsModal && selectedReceiptLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                📄 Receipts for {selectedReceiptLiquidation.beneficiary?.name || `ID: ${selectedReceiptLiquidation.beneficiary_id}`}
              </h3>
              <button
                onClick={() => {
                  setShowReceiptsModal(false)
                  setSelectedReceiptLiquidation(null)
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close receipts modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Total Disbursed:</span>
                  <div className="font-bold text-blue-600">₱{parseFloat(selectedReceiptLiquidation.total_disbursed_amount)?.toLocaleString() || 'N/A'}</div>
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
            
            {selectedReceiptLiquidation.receipts && selectedReceiptLiquidation.receipts.length > 0 ? (
              <div className="space-y-4">
                {selectedReceiptLiquidation.receipts.map((receipt, index) => (
                  <div key={receipt.id || index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">Receipt #{index + 1}</h4>
                        <p className="text-sm text-gray-600">{receipt.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">₱{parseFloat(receipt.receipt_amount || 0).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{new Date(receipt.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium text-gray-500">Receipt Number:</span>
                        <div className="text-gray-800">{receipt.receipt_number || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Vendor:</span>
                        <div className="text-gray-800">{receipt.vendor_name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Date:</span>
                        <div className="text-gray-800">{receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </div>
                    
                    {receipt.receipt_image_path && (
                      <div className="mt-3">
                        <button
                          onClick={() => window.open(`/api/liquidations/${selectedReceiptLiquidation.id}/receipts/${receipt.id}/view`, '_blank')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          📷 View Receipt Image
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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
                  setSelectedReceiptLiquidation(null)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 Success Popup (designed modal) */}
      {showStep2Success && (
        <FinanceApprovalModal 
          isOpen={showStep2Success}
          onClose={() => setShowStep2Success(false)}
          beneficiaryId={lastApprovalDetails?.beneficiaryId}
          amount={lastApprovalDetails?.amount}
          caseworkerApproved={lastApprovalDetails?.caseworkerApproved}
        />
      )}
    </div>
  )
}

export default FinanceLiquidationPage
