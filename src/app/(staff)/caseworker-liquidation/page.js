'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'
import PopupMessage from '@/components/PopupMessage'
import { usePopupMessage } from '@/hooks/usePopupMessage'

const CaseworkerLiquidationPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  const { popupState, showSuccess, showError, closePopup } = usePopupMessage()
  const [liquidations, setLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(null)
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState('approve')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Receipt review modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceiptLiquidation, setSelectedReceiptLiquidation] = useState(null)

  const loadLiquidations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading liquidations pending caseworker approval...')
      
      // Use the multi-level approval system endpoint
      let res = null
      
      // Try multiple endpoints to find liquidations submitted by beneficiaries
      const endpoints = [
        '/api/liquidations/pending-approvals',
        '/api/caseworker/liquidations',
        '/api/liquidations/pending-caseworker-approval',
        '/api/liquidations?status=submitted',
        '/api/liquidations?status=pending',
        '/api/liquidations?status=in_progress',
        '/api/liquidations?status=liquidated',
        '/api/liquidations?status=complete',
        '/api/disbursements', // Try disbursements endpoint
        '/api/disbursements/liquidated',
        '/api/disbursements?status=liquidated', 
        '/api/liquidations',
        '/api/beneficiaries/liquidations',
        '/api/user/liquidations',
        '/api/admin/liquidations', // Admin view of all liquidations
        '/api/staff/liquidations' // Staff view
      ]
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Trying endpoint: ${endpoint}`)
          res = await axios.get(endpoint)
          if (res?.data) {
            console.log(`✅ Success with endpoint: ${endpoint}`)
            console.log('Response structure:', {
              hasData: !!res.data,
              dataType: Array.isArray(res.data) ? 'array' : typeof res.data,
              dataLength: Array.isArray(res.data) ? res.data.length : 'N/A',
              hasSuccess: !!res.data.success,
              hasDataProperty: !!res.data.data,
              keys: Object.keys(res.data || {})
            })
            break
          }
        } catch (endpointError) {
          const status = endpointError.response?.status
          const message = endpointError.response?.data?.message || endpointError.message
          console.log(`❌ Failed endpoint ${endpoint}: ${status} - ${message}`)
          continue
        }
      }
      
      if (!res?.data) {
        throw new Error('All liquidation API endpoints are unavailable. Please check if the backend server is running and the endpoints are implemented.')
      }
      
      console.log('API Response:', res?.data)
      
      // Parse response data
      let liquidationsData = []
      if (res?.data) {
        // Handle different API response formats
        if (res.data.success && res.data.data) {
          // Laravel success response with paginated data
          if (res.data.data.data && Array.isArray(res.data.data.data)) {
            liquidationsData = res.data.data.data
          } 
          // Laravel success response with direct array
          else if (Array.isArray(res.data.data)) {
            liquidationsData = res.data.data
          }
        }
        // Direct array response
        else if (Array.isArray(res.data)) {
          liquidationsData = res.data
        }
        // Object with data property
        else if (res.data.data && Array.isArray(res.data.data)) {
          liquidationsData = res.data.data
        }
      }
      
      console.log('Raw liquidations before filtering:', liquidationsData.length)
      if (liquidationsData.length > 0) {
        console.log('Sample raw liquidation (full structure):')
        console.log('First liquidation:', JSON.stringify(liquidationsData[0], null, 2))
        
        console.log('Key fields:')
        liquidationsData.slice(0, 2).forEach((liq, index) => {
          console.log(`Liquidation ${index + 1}:`)
          console.log('  - id:', liq.id)
          console.log('  - status:', liq.status)
          console.log('  - liquidation_status:', liq.liquidation_status)
          console.log('  - disbursement_status:', liq.disbursement_status)
          console.log('  - disbursement_type:', liq.disbursement_type)
          console.log('  - total_disbursed_amount:', liq.total_disbursed_amount)
          console.log('  - receipt_total:', liq.receipt_total)
          console.log('  - liquidation_percentage:', liq.liquidation_percentage)
          console.log('  - caseworker_approved_at:', liq.caseworker_approved_at)
          console.log('  - beneficiary:', liq.beneficiary)
          console.log('  - user:', liq.user)
          console.log('  ---')
        })
      }
      
      // Filter for liquidations ready for caseworker approval (Step 1)
      // These should be liquidations submitted by beneficiaries that need review
      liquidationsData = liquidationsData.filter(liq => {
        const status = (liq.status || '').toLowerCase()
        const liquidationStatus = (liq.liquidation_status || '').toLowerCase()
        const disbursementStatus = (liq.disbursement_status || '').toLowerCase()
        
        // Check various status conditions
        const isSubmittedStatus = status === 'pending_caseworker_approval' || 
                                 status === 'submitted' || 
                                 status === 'pending' || 
                                 status === 'in progress' || 
                                 status === 'in_progress' ||
                                 status === 'awaiting_review' ||
                                 status === 'needs_review' ||
                                 status === 'liquidated' ||
                                 status === 'fully_liquidated' ||
                                 status === 'complete' ||
                                 liquidationStatus === 'submitted' ||
                                 liquidationStatus === 'pending' ||
                                 disbursementStatus === 'liquidated'
        
        // Include liquidations that don't have caseworker approval yet
        const needsCaseworkerApproval = !liq.caseworker_approved_at && 
                                       !liq.caseworker_approval_date &&
                                       !liq.reviewed_by_caseworker
        
        // Check if it has been fully liquidated by beneficiary (100% complete)
        const isFullyLiquidated = liq.liquidation_percentage === 100 ||
                                 liq.liquidated_percentage === 100 ||
                                 (liq.total_disbursed_amount && liq.receipt_total && 
                                  parseFloat(liq.total_disbursed_amount) === parseFloat(liq.receipt_total))
        
        const shouldInclude = (isSubmittedStatus || isFullyLiquidated) && needsCaseworkerApproval
        
        // Debug logging for each liquidation
        console.log(`Liquidation ${liq.id}: status='${liq.status}', isSubmittedStatus=${isSubmittedStatus}, isFullyLiquidated=${isFullyLiquidated}, needsCaseworkerApproval=${needsCaseworkerApproval}, shouldInclude=${shouldInclude}`)
        
        return shouldInclude
      })
      
      // TEMPORARY DEBUG MODE: If no liquidations found with filters, show first few for inspection
      if (liquidationsData.length === 0 && res?.data) {
        console.log('🔍 DEBUG MODE: No liquidations matched filters, showing first few raw items for inspection')
        let debugData = []
        if (Array.isArray(res.data)) {
          debugData = res.data.slice(0, 3)
        } else if (res.data.data && Array.isArray(res.data.data)) {
          debugData = res.data.data.slice(0, 3)
        } else if (res.data.data?.data && Array.isArray(res.data.data.data)) {
          debugData = res.data.data.data.slice(0, 3)
        }
        
        if (debugData.length > 0) {
          console.log('Showing first few items without filtering for inspection:')
          liquidationsData = debugData
        }
      }
      
      console.log('📋 Workflow Status Summary:')
      console.log('- Total liquidations found:', liquidationsData.length)
      console.log('- Liquidations after filtering:', liquidationsData.length)
      
      // Log first few liquidations for debugging
      if (liquidationsData.length > 0) {
        console.log('Sample liquidations:')
        liquidationsData.slice(0, 3).forEach(liq => {
          console.log(`  • ID: ${liq.id}`)  
          console.log(`    Status: '${liq.status}'`)
          console.log(`    Beneficiary: ${liq.beneficiary?.name || liq.beneficiary?.firstname + ' ' + liq.beneficiary?.lastname || 'Unknown'}`)
          console.log(`    Amount: ${liq.amount || liq.total_disbursed_amount || 'N/A'}`)
          console.log(`    Created: ${liq.created_at || liq.date || 'N/A'}`)
          console.log(`    Caseworker approved: ${liq.caseworker_approved_at ? 'Yes' : 'No'}`)
          console.log('    ---')
        })
      } else {
        console.log('No liquidations found that match caseworker review criteria')
      }
      
      // Ensure we have an array
      if (!Array.isArray(liquidationsData)) {
        console.warn('No valid liquidation data found, using empty array')
        liquidationsData = []
      }
      
      console.log(`Found ${liquidationsData.length} liquidations pending caseworker approval`)
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
      
      // Use the multi-level approval endpoints
      const endpoint = approvalAction === 'approve' 
        ? `/api/liquidations/${selectedLiquidation.id}/caseworker-approve`
        : `/api/liquidations/${selectedLiquidation.id}/caseworker-reject`
      
      const payload = approvalAction === 'approve' 
        ? { notes: approvalNotes } 
        : { reason: approvalNotes }
      
      console.log(`${approvalAction === 'approve' ? '✅ Approving' : '❌ Rejecting'} liquidation ${selectedLiquidation.id}`)
      
      await axios.post(endpoint, payload)
      
      // Show success message with clear workflow steps using Popup UI (replace alert)
      if (approvalAction === 'approve') {
        const messageContent = (
          <div className="space-y-3 text-left">
            <p className="text-gray-800 font-medium">Step 1 complete: Liquidation approved by Caseworker.</p>
            <p className="text-gray-600">Next: Finance team will review and approve this liquidation.</p>
            <div className="mt-1 rounded-lg border bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Workflow</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="text-green-600" aria-hidden="true"><path d="M20 7 10 17l-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>Beneficiary</span>
                </span>
                <span aria-hidden className="text-slate-400">→</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="text-green-600" aria-hidden="true"><path d="M20 7 10 17l-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>Caseworker</span>
                </span>
                <span aria-hidden className="text-slate-400">→</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Finance</span>
                </span>
                <span aria-hidden className="text-slate-400">→</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Director</span>
                </span>
              </div>
            </div>
          </div>
        )
        showSuccess('Step 1 Complete', messageContent, { confirmText: 'OK' })
      } else {
        showError('Liquidation Rejected', 'Liquidation rejected by Caseworker. The beneficiary has been notified and can resubmit with corrections if needed.')
      }
      
      // Reload liquidations
      await loadLiquidations()
      
      // Close modal
      setShowApprovalModal(false)
      setSelectedLiquidation(null)
      setApprovalNotes('')
      
    } catch (err) {
      console.error('Error processing approval:', err)
      const errorMessage = err?.response?.data?.message || `Failed to ${approvalAction} liquidation`
      showError('Action Failed', errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle receipt review modal
  const handleReceiptReview = (liquidation) => {
    console.log('Receipt Review - Full liquidation data:', liquidation)
    console.log('Receipt Review - Receipts data:', liquidation.receipts)
    if (liquidation.receipts && liquidation.receipts.length > 0) {
      console.log('Receipt Review - First receipt structure:', liquidation.receipts[0])
      console.log('Receipt Review - Available fields:', Object.keys(liquidation.receipts[0]))
    }
    setSelectedReceiptLiquidation(liquidation)
    setShowReceiptModal(true)
  }

  // Legacy review function for backward compatibility
  const reviewLiquidation = async (id, action) => {
    const liquidation = liquidations.find(l => l.id === id)
    if (liquidation) {
      handleApprovalAction(liquidation, action)
    }
  }

  // Simple role detection - allow access for testing 
  const isCaseworker = user && (
    user?.systemRole?.name?.toLowerCase?.() === 'caseworker' || 
    user?.system_role?.name?.toLowerCase?.() === 'caseworker' ||
    String(user?.systemRole?.name || user?.system_role?.name || '').toLowerCase() === 'caseworker' ||
    // Temporary: Allow all authenticated users on localhost for testing
    (user && typeof window !== 'undefined' && window.location.hostname === 'localhost')
  )
  
  // Role-based access control - simplified
  if (user && !isCaseworker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">🚫 Access Denied</div>
          <div className="text-gray-700">You must be a caseworker to access this page.</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Caseworker Liquidation Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve liquidations pending your approval</p>
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{liquidations.filter(l => l.status === 'pending_caseworker_approval').length}</div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-600 text-lg">✅</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{liquidations.filter(l => l.caseworker_approved_at).length}</div>
                <div className="text-sm text-gray-600">Approved by You</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <span className="text-blue-600 text-lg">💰</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  ₱{liquidations.reduce((sum, l) => sum + (parseFloat(l.amount || l.total_disbursed_amount || l.disbursed_amount) || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
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
          <div className="text-lg text-gray-600 mb-2">Loading liquidations...</div>
          <div className="text-sm text-gray-500">This may take a moment</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && liquidations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No Liquidations to Review</div>
          <div className="text-gray-600 mb-6">There are currently no liquidations pending your approval.</div>
          <div className="text-sm text-gray-500 mb-6">Liquidations will appear here when they require caseworker approval.</div>
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
                      {liquidation.beneficiary?.name || 
                       (liquidation.beneficiary?.firstname && liquidation.beneficiary?.lastname 
                         ? `${liquidation.beneficiary.firstname} ${liquidation.beneficiary.lastname}` 
                         : liquidation.beneficiary?.firstname ||
                           liquidation.beneficiary_name ||
                           `Beneficiary ID: ${liquidation.beneficiary_id || liquidation.user_id || 'Unknown'}`)}
                    </h3>
                    <div className="text-gray-600 mt-1 flex flex-wrap gap-4">
                      <span className="flex items-center">
                        <span className="mr-1">💰</span> 
                        ₱{parseFloat(liquidation.amount || liquidation.total_disbursed_amount || liquidation.disbursed_amount || 0)?.toLocaleString() || 'N/A'}
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
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    liquidation.status === 'pending_caseworker_approval' ? 'bg-yellow-100 text-yellow-800' :
                    liquidation.status === 'pending_finance_approval' ? 'bg-blue-100 text-blue-800' :
                    liquidation.status === 'pending_director_approval' ? 'bg-purple-100 text-purple-800' :
                    liquidation.status === 'approved' ? 'bg-green-100 text-green-800' :
                    liquidation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {liquidation.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
                
                {/* Approval Workflow Progress */}
                <div className="flex items-center space-x-2">
                  {/* Caseworker Stage */}
                  <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    liquidation.status === 'pending_caseworker_approval' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300' :
                    liquidation.caseworker_approved_at ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="mr-2">👩‍💼</span>
                    <div>
                      <div className="font-semibold">Caseworker</div>
                      {liquidation.caseworker_approved_at && (
                        <div className="text-xs opacity-75">
                          ✅ {new Date(liquidation.caseworker_approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  {/* Finance Stage */}
                  <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    liquidation.status === 'pending_finance_approval' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300' :
                    liquidation.finance_approved_at ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="mr-2">💳</span>
                    <div>
                      <div className="font-semibold">Finance</div>
                      {liquidation.finance_approved_at && (
                        <div className="text-xs opacity-75">
                          ✅ {new Date(liquidation.finance_approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-lg">→</div>
                  
                  {/* Director Stage */}
                  <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    liquidation.status === 'pending_director_approval' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300' :
                    liquidation.director_approved_at ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="mr-2">👨‍💼</span>
                    <div>
                      <div className="font-semibold">Director</div>
                      {liquidation.director_approved_at && (
                        <div className="text-xs opacity-75">
                          ✅ {new Date(liquidation.director_approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="p-6">
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
                
                {/* Previous Notes */}
                {(liquidation.caseworker_notes || liquidation.finance_notes || liquidation.director_notes) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 Previous Notes:</h4>
                    <div className="space-y-3">
                      {liquidation.caseworker_notes && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">👩‍💼 Caseworker</div>
                          <div className="text-blue-700">{liquidation.caseworker_notes}</div>
                        </div>
                      )}
                      {liquidation.finance_notes && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-purple-800 mb-1">💳 Finance</div>
                          <div className="text-purple-700">{liquidation.finance_notes}</div>
                        </div>
                      )}
                      {liquidation.director_notes && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-indigo-800 mb-1">👨‍💼 Director</div>
                          <div className="text-indigo-700">{liquidation.director_notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Receipt Review Button - Always available */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleReceiptReview(liquidation)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <span className="mr-2">📋</span>
                    Review Receipts
                  </button>
                  
                  {/* Action Buttons - Only show if pending caseworker approval */}
                  {liquidation.status === 'pending_caseworker_approval' && (
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
                        Approve
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Already Approved by Caseworker */}
                {liquidation.caseworker_approved_at && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-800">
                      <span className="mr-2 text-lg">✅</span>
                      <div>
                        <div className="font-semibold">Already Approved by You</div>
                        <div className="text-sm opacity-80">
                          Approved on {new Date(liquidation.caseworker_approved_at).toLocaleDateString()} - 
                          Now waiting for {liquidation.status === 'pending_finance_approval' ? 'Finance' : 'Director'} approval
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              {approvalAction === 'approve' ? '✅ Approve' : '❌ Reject'} Liquidation
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Beneficiary:</strong> {selectedLiquidation.beneficiary?.name || 
                 (selectedLiquidation.beneficiary?.firstname && selectedLiquidation.beneficiary?.lastname 
                   ? `${selectedLiquidation.beneficiary.firstname} ${selectedLiquidation.beneficiary.lastname}` 
                   : selectedLiquidation.beneficiary?.firstname ||
                     selectedLiquidation.beneficiary_name ||
                     `ID: ${selectedLiquidation.beneficiary_id || selectedLiquidation.user_id || 'Unknown'}`)}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Amount:</strong> ₱{parseFloat(selectedLiquidation.amount || selectedLiquidation.total_disbursed_amount || selectedLiquidation.disbursed_amount || 0)?.toLocaleString() || 'N/A'}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={approvalAction === 'approve' 
                  ? 'Enter any notes about this approval...' 
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
                  `${approvalAction === 'approve' ? '✅ Approve' : '❌ Reject'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipt Review Modal */}
      {showReceiptModal && selectedReceiptLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    📋 Receipt Review - {selectedReceiptLiquidation.beneficiary?.name || 
                     (selectedReceiptLiquidation.beneficiary?.firstname && selectedReceiptLiquidation.beneficiary?.lastname 
                       ? `${selectedReceiptLiquidation.beneficiary.firstname} ${selectedReceiptLiquidation.beneficiary.lastname}` 
                       : selectedReceiptLiquidation.beneficiary?.firstname ||
                         selectedReceiptLiquidation.beneficiary_name ||
                         `Beneficiary ID: ${selectedReceiptLiquidation.beneficiary_id || selectedReceiptLiquidation.user_id || 'Unknown'}`)}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Amount:</span> ₱{parseFloat(selectedReceiptLiquidation.amount || selectedReceiptLiquidation.total_disbursed_amount || selectedReceiptLiquidation.disbursed_amount || 0)?.toLocaleString() || 'N/A'} • 
                    <span className="font-medium">ID:</span> #{selectedReceiptLiquidation.id}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setSelectedReceiptLiquidation(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Receipt Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Receipt Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Total Receipts</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedReceiptLiquidation.receipts?.length || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Receipt Total</div>
                    <div className="text-xl font-bold text-green-600">
                      ₱{(() => {
                        // Calculate total from actual receipts if available
                        if (selectedReceiptLiquidation.receipts && selectedReceiptLiquidation.receipts.length > 0) {
                          const total = selectedReceiptLiquidation.receipts.reduce((sum, receipt) => {
                            return sum + parseFloat(receipt.receipt_amount || receipt.amount || 0)
                          }, 0)
                          return total.toLocaleString()
                        }
                        // Fallback to stored total
                        return parseFloat(selectedReceiptLiquidation.total_receipt_amount || selectedReceiptLiquidation.receipt_total || selectedReceiptLiquidation.receipts_total || 0)?.toLocaleString() || '0.00'
                      })()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Disbursed Amount</div>
                    <div className="text-xl font-bold text-blue-600">
                      ₱{parseFloat(selectedReceiptLiquidation.total_disbursed_amount || selectedReceiptLiquidation.amount || 0)?.toLocaleString() || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Receipts List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">📄 Receipt Details</h4>
                
                {selectedReceiptLiquidation.receipts && selectedReceiptLiquidation.receipts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedReceiptLiquidation.receipts.map((receipt, index) => (
                      <div key={receipt.id || index} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Receipt Details */}
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">Receipt #{index + 1}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <span className="ml-2 font-medium">₱{parseFloat(receipt.receipt_amount || receipt.amount || 0)?.toLocaleString() || '0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-2">
                                  {receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'short', 
                                    day: 'numeric'
                                  }) : (receipt.date ? new Date(receipt.date).toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'N/A')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">OR/Invoice:</span>
                                <span className="ml-2">{receipt.receipt_number || receipt.or_number || receipt.invoice_number || receipt.reference || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-2">{receipt.receipt_type || receipt.type || 'General'}</span>
                              </div>
                            </div>
                            
                            {receipt.description && (
                              <div className="mt-3">
                                <span className="text-gray-500">Description:</span>
                                <p className="text-sm text-gray-700 mt-1">{receipt.description}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Receipt Image */}
                          <div className="lg:w-64">
                            {receipt.image || receipt.file_path || receipt.receipt_image ? (
                              <div className="bg-gray-100 rounded-lg p-2">
                                <div className="text-xs text-gray-500 mb-2">Receipt Image:</div>
                                <img 
                                  src={(() => {
                                    const imagePath = receipt.image || receipt.file_path || receipt.receipt_image
                                    // Check if it's already a full URL
                                    if (imagePath?.startsWith('http')) {
                                      return imagePath
                                    }
                                    // Use the proper API endpoint for viewing receipt images inline
                                    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
                                    // Use the dedicated view endpoint that handles authentication and serves images for viewing
                                    if (receipt.id && selectedReceiptLiquidation?.id) {
                                      return `${backend}/api/liquidations/${selectedReceiptLiquidation.id}/receipts/${receipt.id}/view`
                                    }
                                    // Fallback to storage path if receipt/liquidation IDs are not available
                                    return `${backend}/storage/${imagePath}`
                                  })()}
                                  alt={`Receipt ${index + 1}`}
                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                  onClick={() => {
                                    const imagePath = receipt.image || receipt.file_path || receipt.receipt_image
                                    let fullUrl = imagePath
                                    
                                    if (imagePath && !imagePath.startsWith('http')) {
                                      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
                                      // Use the view endpoint for proper viewing
                                      if (receipt.id && selectedReceiptLiquidation?.id) {
                                        fullUrl = `${backend}/api/liquidations/${selectedReceiptLiquidation.id}/receipts/${receipt.id}/view`
                                      } else {
                                        fullUrl = `${backend}/storage/${imagePath}`
                                      }
                                    }
                                    window.open(fullUrl, '_blank')
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load receipt image:', receipt)
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY5NzM4MiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4='
                                  }}
                                />
                                <div className="text-xs text-gray-400 mt-1 text-center">
                                  Click to view full size
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                                🖼️<br/>No image available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📄</div>
                    <div className="text-lg font-medium mb-2">No Receipt Details Available</div>
                    <div className="text-sm">Receipt information may not have been properly submitted or loaded.</div>
                  </div>
                )}
              </div>
              
              {/* Liquidation Notes */}
              {(selectedReceiptLiquidation.description || selectedReceiptLiquidation.notes || selectedReceiptLiquidation.liquidation_notes) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">📝 Liquidation Notes</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700">
                      {selectedReceiptLiquidation.description || selectedReceiptLiquidation.notes || selectedReceiptLiquidation.liquidation_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  🔍 Review completed. Use the approve/reject buttons on the main page to make your decision.
                </div>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setSelectedReceiptLiquidation(null)
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global popup message */}
      <PopupMessage {...popupState} onClose={closePopup} />
    </div>
  )
}

export default CaseworkerLiquidationPage
