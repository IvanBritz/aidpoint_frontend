'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const LiquidationReviewPage = () => {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth({ middleware: 'auth' })
  
  const [liquidation, setLiquidation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState('approve')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const loadLiquidation = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get(`/api/liquidations/${id}/review`)
      setLiquidation(response.data)
    } catch (err) {
      console.error('Error loading liquidation:', err)
      setError(err?.response?.data?.message || 'Failed to load liquidation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadLiquidation()
    }
  }, [id])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDisbursementLabel = (disbursementType) => {
    switch (disbursementType?.toLowerCase()) {
      case 'tuition':
        return 'Tuition Fee Assistance'
      case 'cola':
        return 'COLA (Cost of Living Allowance)'
      case 'other':
        return 'Other Financial Assistance'
      default:
        return disbursementType || 'Financial Assistance'
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_caseworker_approval': {
        label: 'PENDING YOUR APPROVAL',
        className: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'pending_finance_approval': {
        label: 'PENDING FINANCE',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      },
      'pending_director_approval': {
        label: 'PENDING DIRECTOR',
        className: 'bg-cyan-100 text-cyan-800 border-cyan-200'
      },
      'approved': {
        label: 'FULLY APPROVED',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'rejected': {
        label: 'REJECTED',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'complete': {
        label: 'READY FOR SUBMISSION',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }

    const config = statusConfig[status] || {
      label: (status || 'unknown').toUpperCase().replace('_', ' '),
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleApprovalAction = (action) => {
    setApprovalAction(action)
    setApprovalNotes('')
    setShowApprovalModal(true)
  }

  const submitApprovalDecision = async () => {
    if (!liquidation) return
    
    try {
      setSubmitting(true)
      const endpoint = approvalAction === 'approve' 
        ? `/api/liquidations/${liquidation.id}/caseworker-approve`
        : `/api/liquidations/${liquidation.id}/caseworker-reject`
      
      const payload = approvalAction === 'approve' 
        ? { notes: approvalNotes } 
        : { reason: approvalNotes }
      
      await axios.post(endpoint, payload)
      
      alert(approvalAction === 'approve' 
        ? 'Liquidation approved and forwarded to finance team!' 
        : 'Liquidation rejected successfully.')
      
      // Reload liquidation to show updated status
      await loadLiquidation()
      setShowApprovalModal(false)
      setApprovalNotes('')
      
    } catch (err) {
      console.error('Error processing approval:', err)
      setError(err?.response?.data?.message || 'Failed to process approval')
    } finally {
      setSubmitting(false)
    }
  }

  const openReceiptModal = (receipt) => {
    setSelectedReceipt(receipt)
    setShowReceiptModal(true)
  }

  const canApprove = () => {
    return liquidation?.status === 'pending_caseworker_approval' && 
           liquidation?.beneficiary?.caseworker_id === user?.id
  }

  if (loading) {
    return (
      <>
        <Header title="Liquidation Review" />
        <div className="py-8">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading liquidation details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !liquidation) {
    return (
      <>
        <Header title="Liquidation Review" />
        <div className="py-8">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">Unable to load liquidation</p>
                  <p className="text-sm text-gray-500 mb-4">{error || 'Liquidation not found'}</p>
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Liquidation Review" />
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Action Bar */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Liquidations
            </button>
            
            {canApprove() && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprovalAction('approve')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                >
                  Approve Liquidation
                </button>
                <button
                  onClick={() => handleApprovalAction('reject')}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
                >
                  Reject Liquidation
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Beneficiary & Basic Info */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Liquidation Details</h3>
                    {getStatusBadge(liquidation.status)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-xl text-gray-900 mb-4">
                        {liquidation.beneficiary?.firstname} {liquidation.beneficiary?.lastname}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-500">Email:</span>
                          <div className="text-gray-900">{liquidation.beneficiary?.email || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Contact:</span>
                          <div className="text-gray-900">{liquidation.beneficiary?.contact_number || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Student ID:</span>
                          <div className="text-gray-900">{liquidation.beneficiary?.student_id || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-500">Disbursement Type:</span>
                          <div className="text-gray-900">{getDisbursementLabel(liquidation.disbursement_type)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Total Disbursed Amount:</span>
                          <div className="text-xl font-bold text-gray-900">{formatCurrency(liquidation.total_disbursed_amount)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Total Receipts Amount:</span>
                          <div className="text-xl font-bold text-green-700">{formatCurrency(liquidation.total_receipt_amount)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Remaining Amount:</span>
                          <div className={`text-lg font-bold ${
                            (liquidation.remaining_amount || 0) > 0 ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {formatCurrency(liquidation.remaining_amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {liquidation.description && (
                    <div className="mt-6">
                      <span className="font-medium text-gray-500">Beneficiary Notes:</span>
                      <p className="mt-2 text-gray-700 bg-gray-50 p-4 rounded-lg">{liquidation.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipts Section */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Receipts ({liquidation.receipts?.length || 0})
                  </h3>
                </div>
                <div className="p-6">
                  {liquidation.receipts && liquidation.receipts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {liquidation.receipts.map((receipt, index) => (
                        <div key={receipt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Receipt #{index + 1}</h4>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(receipt.amount)}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {receipt.receipt_number && (
                              <div>
                                <span className="font-medium text-gray-500">Receipt Number:</span>
                                <span className="ml-2 text-gray-900">{receipt.receipt_number}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-500">Date:</span>
                              <span className="ml-2 text-gray-900">
                                {new Date(receipt.receipt_date).toLocaleDateString('en-PH')}
                              </span>
                            </div>
                            {receipt.description && (
                              <div>
                                <span className="font-medium text-gray-500">Description:</span>
                                <p className="mt-1 text-gray-700">{receipt.description}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <button
                              onClick={() => openReceiptModal(receipt)}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                            >
                              View Receipt File
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">No receipts uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Approval History & Timeline */}
            <div className="space-y-6">
              
              {/* Approval Workflow */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Approval Workflow</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Caseworker Step */}
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        liquidation.caseworker_approved_at ? 'bg-green-500' : 
                        liquidation.status === 'pending_caseworker_approval' ? 'bg-purple-500 animate-pulse' : 
                        'bg-gray-300'
                      }`}>
                        {liquidation.caseworker_approved_at ? '✓' : '1'}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">Caseworker Review</div>
                        <div className="text-sm text-gray-500">
                          {liquidation.caseworker_approved_at ? (
                            <>
                              Approved by {liquidation.caseworker_approver?.name || 'Caseworker'}
                              <div className="text-xs text-gray-400">{formatDate(liquidation.caseworker_approved_at)}</div>
                            </>
                          ) : liquidation.status === 'pending_caseworker_approval' ? (
                            'Pending your review'
                          ) : (
                            'Awaiting submission'
                          )}
                        </div>
                        {liquidation.caseworker_notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {liquidation.caseworker_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Finance Step */}
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        liquidation.finance_approved_at ? 'bg-green-500' : 
                        liquidation.status === 'pending_finance_approval' ? 'bg-indigo-500 animate-pulse' : 
                        'bg-gray-300'
                      }`}>
                        {liquidation.finance_approved_at ? '✓' : '2'}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">Finance Review</div>
                        <div className="text-sm text-gray-500">
                          {liquidation.finance_approved_at ? (
                            <>
                              Approved by {liquidation.finance_approver?.name || 'Finance Team'}
                              <div className="text-xs text-gray-400">{formatDate(liquidation.finance_approved_at)}</div>
                            </>
                          ) : liquidation.status === 'pending_finance_approval' ? (
                            'Pending finance team review'
                          ) : (
                            'Awaiting caseworker approval'
                          )}
                        </div>
                        {liquidation.finance_notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {liquidation.finance_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Director Step */}
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        liquidation.director_approved_at ? 'bg-green-500' : 
                        liquidation.status === 'pending_director_approval' ? 'bg-cyan-500 animate-pulse' : 
                        'bg-gray-300'
                      }`}>
                        {liquidation.director_approved_at ? '✓' : '3'}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">Director Final Approval</div>
                        <div className="text-sm text-gray-500">
                          {liquidation.director_approved_at ? (
                            <>
                              Approved by {liquidation.director_approver?.name || 'Project Director'}
                              <div className="text-xs text-gray-400">{formatDate(liquidation.director_approved_at)}</div>
                            </>
                          ) : liquidation.status === 'pending_director_approval' ? (
                            'Pending director approval'
                          ) : (
                            'Awaiting finance approval'
                          )}
                        </div>
                        {liquidation.director_notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {liquidation.director_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Submitted:</span>
                        <span className="ml-2 text-gray-600">{formatDate(liquidation.created_at)}</span>
                      </div>
                    </div>
                    
                    {liquidation.submitted_for_approval_at && (
                      <div className="flex items-center text-sm">
                        <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">Sent for Approval:</span>
                          <span className="ml-2 text-gray-600">{formatDate(liquidation.submitted_for_approval_at)}</span>
                        </div>
                      </div>
                    )}
                    
                    {liquidation.liquidation_date && (
                      <div className="flex items-center text-sm">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">Liquidation Date:</span>
                          <span className="ml-2 text-gray-600">{formatDate(liquidation.liquidation_date)}</span>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{liquidation.receipts?.length || 0}</div>
                      <div className="text-xs text-gray-500">Receipts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {liquidation.total_receipt_amount && liquidation.total_disbursed_amount ? 
                          Math.round((liquidation.total_receipt_amount / liquidation.total_disbursed_amount) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-500">Liquidated</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                {approvalAction === 'approve' ? 'Approve Liquidation' : 'Reject Liquidation'}
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  {approvalAction === 'approve' 
                    ? 'This liquidation will be forwarded to the finance team for further review.'
                    : 'Please provide a detailed reason for rejection. The beneficiary will be notified.'}
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={4}
                    required={approvalAction === 'reject'}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={approvalAction === 'approve' 
                      ? 'Add any notes about this approval...' 
                      : 'Explain why this liquidation is being rejected...'}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-md"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submitApprovalDecision}
                  disabled={submitting || (approvalAction === 'reject' && !approvalNotes.trim())}
                  className={`px-6 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 ${
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Receipt #{selectedReceipt.receipt_number || 'N/A'} - {formatCurrency(selectedReceipt.amount)}
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(selectedReceipt.receipt_date).toLocaleDateString('en-PH')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Amount:</span>
                  <span className="ml-2 text-gray-900 font-bold">{formatCurrency(selectedReceipt.amount)}</span>
                </div>
                {selectedReceipt.description && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">Description:</span>
                    <p className="mt-1 text-gray-700">{selectedReceipt.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 min-h-96 flex items-center justify-center">
              {selectedReceipt.file_path ? (
                <div className="text-center">
                  {selectedReceipt.file_path.toLowerCase().includes('.pdf') ? (
                    <div>
                      <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600 mb-4">PDF Document</p>
                      <a 
                        href={selectedReceipt.file_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <img 
                      src={selectedReceipt.file_path} 
                      alt="Receipt"
                      className="max-w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">Receipt file not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LiquidationReviewPage