'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import ReceiptUploadForm from '@/components/ReceiptUploadForm'
import SimpleLiquidationSuccessModal from '@/components/SimpleLiquidationSuccessModal'
import ReceiptReviewModal from '@/components/ReceiptReviewModal'

const Liquidation = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [selectedDisbursement, setSelectedDisbursement] = useState('')
  const [receipts, setReceipts] = useState([{
    id: Date.now(),
    file: null,
    amount: '',
    receipt_number: '',
    receipt_date: '',
    description: ''
  }])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedLiquidationDetails, setSubmittedLiquidationDetails] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  
  // Liquidation history state
  const [liquidations, setLiquidations] = useState([])
  const [liquidationsLoading, setLiquidationsLoading] = useState(false)
  
  // Available disbursements state
  const [availableDisbursements, setAvailableDisbursements] = useState([])
  const [disbursementsLoading, setDisbursementsLoading] = useState(false)

  // Load user's liquidations and available disbursements on component mount
  useEffect(() => {
    if (user) {
      loadLiquidations()
      loadAvailableDisbursements()
    }
  }, [user])

  // Keep a ref of previous liquidations to detect status transitions
  const prevLiquidationsRef = useRef([])

  // When liquidations change, detect newly rejected items and refresh available disbursements
  useEffect(() => {
    const prev = prevLiquidationsRef.current || []
    if (prev.length > 0 && liquidations.length > 0) {
      const newlyRejected = liquidations.filter(l => {
        const wasPrev = prev.find(p => p.id === l.id)
        return l.status === 'rejected' && (!wasPrev || wasPrev.status !== 'rejected')
      })
      if (newlyRejected.length > 0) {
        // Refresh available disbursements so rejected disbursements reappear
        loadAvailableDisbursements()
      }
    }
    prevLiquidationsRef.current = liquidations
  }, [liquidations])

  const loadLiquidations = async () => {
    try {
      setLiquidationsLoading(true)
      const res = await axios.get('/api/beneficiary/liquidations')
      const liquidationsData = Array.isArray(res.data?.data?.data) ? res.data.data.data : []
      // Sort liquidations by date in descending order (most recent first)
      const sortedLiquidations = liquidationsData.sort((a, b) => {
        const dateA = new Date(a.liquidation_date || a.created_at)
        const dateB = new Date(b.liquidation_date || b.created_at)
        return dateB - dateA
      })
      setLiquidations(sortedLiquidations)
    } catch (e) {
      console.error('Failed to load liquidations:', e)
      setLiquidations([])
    } finally {
      setLiquidationsLoading(false)
    }
  }

  const loadAvailableDisbursements = async () => {
    const buildFromMine = async () => {
      const my = await axios.get('/api/my-disbursements')
      const mine = Array.isArray(my.data?.data) ? my.data.data : []
      const received = mine.filter(d => (d.status === 'beneficiary_received'))

      return received.map(d => {
        const total = Number(d.amount || 0)
        const liquidated = Number(d.liquidated_amount || 0)
        let remaining = d.remaining_to_liquidate
        if (remaining == null) remaining = total - liquidated
        if (Number(remaining) === 0 && Number(liquidated) === 0) remaining = total

        const fundType = (d.aid_request?.fund_type || d.fund_type || 'other')
        const receivedAt = d.beneficiary_received_at || d.received_at || null

        const receivedDisplay = receivedAt
          ? new Date(receivedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : null

        const baseText = `Disbursement #${d.id} - ₱${Number(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining (${(fundType || 'Other').toString().toUpperCase()})`
        const display = receivedDisplay ? `${baseText} • Received ${receivedDisplay}` : baseText

        return {
          id: d.id,
          amount: Number(remaining),
          total_amount: total,
          liquidated_amount: liquidated,
          remaining_amount: Number(remaining),
          fund_type: fundType,
          received_at: receivedAt,
          reference_no: d.reference_no || null,
          request_month: d.aid_request?.month || null,
          request_year: d.aid_request?.year || null,
          request_period: d.aid_request?.month && d.aid_request?.year
            ? new Date(d.aid_request.year, d.aid_request.month - 1, 1).toLocaleString('en-PH', { month: 'long', year: 'numeric' })
            : null,
          display_text: display,
        }
      })
    }

    try {
      setDisbursementsLoading(true)

      // Previously we excluded any disbursement that had any liquidation.
      // New rule: allow re-liquidation while a liquidation is still in progress.
      // So we do not exclude disbursements here; backend will already filter out fully liquidated ones.

      // Try the primary dedicated endpoint first
      let disbursementsData = []
      try {
        const res = await axios.get('/api/beneficiary/disbursements/available')
        disbursementsData = Array.isArray(res.data?.data) ? res.data.data : []
      } catch (primaryErr) {
        // If the primary endpoint fails (e.g., 403 or 500), silently fall back
        disbursementsData = []
      }

      // If none returned, build from my-disbursements
      if (!disbursementsData.length) {
        try {
          disbursementsData = await buildFromMine()
        } catch (fallbackErr) {
          console.error('Fallback load (my-disbursements) failed:', fallbackErr?.response?.data || fallbackErr)
        }
      }

      // Do not remove disbursements with existing in-progress liquidations; allow re-liquidation.
      const filtered = Array.isArray(disbursementsData) ? disbursementsData : []
      setAvailableDisbursements(filtered)
    } catch (e) {
      console.error('Failed to load available disbursements:', e?.response?.data || e)
      setAvailableDisbursements([])
    } finally {
      setDisbursementsLoading(false)
    }
  }



  const getDisbursedAmount = () => {
    if (selectedDisbursement) {
      const disbursement = availableDisbursements.find(d => d.id.toString() === selectedDisbursement)
      return disbursement?.amount || 0
    }
    return 0
  }

  const getTotalReceiptAmount = () => {
    return receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0)
  }

  const isReceiptTotalExceeding = () => {
    const disb = getDisbursedAmount()
    if (!disb || disb <= 0) return false
    return getTotalReceiptAmount() > disb
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedDisbursement) {
      setError('Please select a specific disbursement to liquidate.')
      return
    }
    
    if (receipts.length === 0) {
      setError('Please add at least one receipt.')
      return
    }
    
    // Validate each receipt
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i]
      if (!receipt.file) {
        setError(`Please upload a file for Receipt #${i + 1}.`)
        return
      }
      if (!receipt.amount || parseFloat(receipt.amount) <= 0) {
        setError(`Please enter a valid amount for Receipt #${i + 1}.`)
        return
      }
      if (!receipt.receipt_date) {
        setError(`Please enter a date for Receipt #${i + 1}.`)
        return
      }
    }

    // All validations passed; open review modal to confirm submission
    setError(null)
    setReviewOpen(true)
  }

  // Called after user confirms in the review modal
  const submitConfirmed = async () => {
    // Prevent submission if receipt total exceeds disbursed amount
    if (isReceiptTotalExceeding()) {
      setError(`Total receipt amount (${formatCurrency(getTotalReceiptAmount())}) exceeds disbursed amount (${formatCurrency(getDisbursedAmount())}). Please correct the amounts before submitting.`)
      setReviewOpen(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append('disbursement_id', selectedDisbursement)

      // Get disbursement type from selected disbursement
      const selectedDisbursementData = availableDisbursements.find(d => d.id.toString() === selectedDisbursement)
      formData.append('disbursement', selectedDisbursementData?.fund_type || 'other')
      formData.append('description', description.trim() || '')

      receipts.forEach((receipt, index) => {
        formData.append(`receipts[${index}][file]`, receipt.file)
        formData.append(`receipts[${index}][amount]`, parseFloat(receipt.amount))
        formData.append(`receipts[${index}][receipt_number]`, receipt.receipt_number || '')
        formData.append(`receipts[${index}][receipt_date]`, receipt.receipt_date)
        formData.append(`receipts[${index}][description]`, receipt.description || '')
      })

      const res = await axios.post('/api/beneficiary/liquidations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Store details for the success modal
      const totalReceiptAmount = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount || 0), 0)
      const disbursementType = selectedDisbursementData?.fund_type || 'other'

      setSubmittedLiquidationDetails({
        amount: new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP'
        }).format(totalReceiptAmount),
        receipts: receipts.length,
        type: disbursementType === 'cola' ? 'COLA' : 
              disbursementType === 'tuition' ? 'Tuition Fee' : 
              'Other',
        disbursementId: selectedDisbursement
      })

      setSuccess('Liquidation submitted successfully!')
      setShowSuccessModal(true)

      // Reload liquidations and available disbursements
      await loadLiquidations()
      await loadAvailableDisbursements()

      // Reset form
      setSelectedDisbursement('')
      setReceipts([{
        id: Date.now(),
        file: null,
        amount: '',
        receipt_number: '',
        receipt_date: '',
        description: ''
      }])
      setDescription('')
      setReviewOpen(false)

    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit liquidation.')
      setReviewOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
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

  const submitForApproval = async (liquidationId) => {
    try {
      setError('')
      const response = await axios.post(`/api/liquidations/${liquidationId}/submit-for-approval`)
      
      // Show success message
      setSuccess('Liquidation successfully submitted for caseworker approval!')
      
      // Reload liquidations to show updated status
      await loadLiquidations()
      // Remove the related disbursement from the available list immediately (optimistic update)
      try {
        const liq = liquidations.find(l => l.id === liquidationId)
        const disbId = liq?.disbursement_id || response?.data?.disbursement_id
        if (disbId) {
          setAvailableDisbursements(prev => prev.filter(d => d.id !== disbId))
        } else {
          // Fallback: refresh available disbursements from server
          await loadAvailableDisbursements()
        }
      } catch (e) {
        // If anything goes wrong, refresh available disbursements to keep UI consistent
        await loadAvailableDisbursements()
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
      
    } catch (err) {
      console.error('Submit for approval error:', err)
      setError(err?.response?.data?.message || 'Failed to submit liquidation for approval')
    }
  }

  const reLiquidate = (liq) => {
    try {
      setSelectedDisbursement(String(liq.disbursement_id))
      // Prefill one receipt with the remaining amount to complete exactly
      const remaining = Number(liq.remaining_amount || 0)
      setReceipts([{
        id: Date.now(),
        file: null,
        amount: remaining > 0 ? remaining.toFixed(2) : '',
        receipt_number: '',
        receipt_date: '',
        description: ''
      }])
      // Scroll to top form
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {}
  }

  return (
    <>
      <Header title="Liquidation" />
      <div className="py-8">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Submit Liquidation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Submit receipts and documentation for your disbursed funds.
              </p>
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <span className="font-medium">Policy:</span> Your total receipts should meet or exceed the disbursed amount. If below, your liquidation will stay "In Progress" and you must re‑liquidate by adding more receipts.
              </div>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-600 text-sm font-medium">Error</p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-600 text-sm font-medium">Success</p>
                  </div>
                  <p className="text-green-600 text-sm mt-1">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Specific Disbursement Selection (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Disbursement to Liquidate *
                  </label>
                  {disbursementsLoading ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading available disbursements...
                    </div>
                  ) : availableDisbursements.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-yellow-800 text-sm font-medium">No disbursements available</p>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        You don't have any disbursements that need liquidation. This could be because:<br/>
                        • All your received disbursements have already been fully liquidated<br/>
                        • You haven't received any disbursements yet<br/>
                        • Your pending liquidations are awaiting approval
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedDisbursement}
                      onChange={(e) => {
                        const selected = e.target.value
                        setSelectedDisbursement(selected)
                        if (selected) {
                          const disbursement = availableDisbursements.find(d => d.id.toString() === selected)
                          if (disbursement) {
                            // Auto-populate the first receipt with the full disbursement amount
                            if (receipts.length === 1 && !receipts[0].amount) {
                              setReceipts([{
                                ...receipts[0],
                                amount: disbursement.amount.toString()
                              }])
                            }
                          }
                        } else {
                          // Clear auto-populated amount if no disbursement selected
                          if (receipts.length === 1 && receipts[0].amount && !receipts[0].file) {
                            setReceipts([{
                              ...receipts[0],
                              amount: ''
                            }])
                          }
                        }
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a disbursement to liquidate</option>
                      {availableDisbursements.map(disbursement => (
                        <option key={disbursement.id} value={disbursement.id}>
                          {disbursement.display_text}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Select the specific disbursement you want to liquidate. The disbursement type will be automatically determined.
                    {availableDisbursements.length > 0 && (
                      <span className="text-green-600 font-medium"> ({availableDisbursements.length} disbursement{availableDisbursements.length !== 1 ? 's' : ''} available)</span>
                    )}
                  </p>
                  
                  {selectedDisbursement && (() => {
                    const disbursement = availableDisbursements.find(d => d.id.toString() === selectedDisbursement)
                    
                    const requirementBox = disbursement?.request_month && disbursement?.request_year ? (() => {
                      const year = disbursement.request_year
                      const month = disbursement.request_month
                      const start = new Date(year, month - 1, 1)
                      const endOfMonth = new Date(year, month, 0)
                      const fmt = d => d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                      return (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-blue-800 text-sm font-medium">Important: Receipt Date Requirement</p>
                          </div>
                          <p className="text-blue-700 text-sm mt-1">
                            All receipts for this disbursement must be dated within <span className="font-semibold">{disbursement.request_period}</span>
                            <> — <span className="font-semibold">{fmt(start)}</span> to <span className="font-semibold">{fmt(endOfMonth)}</span></>
                            .
                          </p>
                        </div>
                      )
                    })() : (
                      <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-green-800 text-sm font-medium">Receipt Date Flexibility</p>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          For this disbursement, receipt dates can be any date up to today. No specific month restriction applies.
                        </p>
                      </div>
                    )

                    const receivedBox = disbursement?.received_at ? (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 2a1 1 0 000 2h1v1a1 1 0 102 0V4h2v1a1 1 0 102 0V4h1a1 1 0 100-2H6z" />
                            <path fillRule="evenodd" d="M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm3 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <p className="text-gray-800 text-sm font-medium">Cash Received by Beneficiary</p>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">
                          Received on <span className="font-semibold">{formatDate(disbursement.received_at)}</span>
                          {disbursement.reference_no ? (
                            <> — Ref. <span className="font-mono">{disbursement.reference_no}</span></>
                          ) : null}
                        </p>
                      </div>
                    ) : null

                    return (<>
                      {requirementBox}
                      {receivedBox}
                    </>)
                  })()}
                </div>


                {/* Receipt Upload Form */}
                <ReceiptUploadForm
                  receipts={receipts}
                  setReceipts={setReceipts}
                  disbursedAmount={getDisbursedAmount()}
                  showAmountTracking={true}
                  error={error}
                  setError={setError}
                  selectedDisbursement={selectedDisbursement ? availableDisbursements.find(d => d.id.toString() === selectedDisbursement) : null}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description/Notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Optional: Add any additional notes or description about this liquidation"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || isReceiptTotalExceeding()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Liquidation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Liquidation History Section */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6" data-section="liquidation-history">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">My Liquidations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Liquidation history arranged by date.
                  </p>
                </div>
                <button
                  onClick={loadLiquidations}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {liquidationsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading your liquidations...</p>
                </div>
              ) : liquidations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">No liquidations yet</p>
                  <p className="text-sm text-gray-500">Your submitted liquidations will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liquidations.map(liquidation => {
                    const getStatusColor = (status) => {
                      switch (status?.toLowerCase()) {
                        case 'approved':
                          return 'bg-green-100 text-green-800 border-green-200'
                        case 'rejected':
                          return 'bg-red-100 text-red-800 border-red-200'
                        case 'complete':
                          return 'bg-blue-100 text-blue-800 border-blue-200'
                        case 'pending_caseworker_approval':
                          return 'bg-purple-100 text-purple-800 border-purple-200'
                        case 'pending_finance_approval':
                          return 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        case 'pending_director_approval':
                          return 'bg-cyan-100 text-cyan-800 border-cyan-200'
                        case 'in_progress':
                          return 'bg-orange-100 text-orange-800 border-orange-200'
                        case 'pending':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        default:
                          return 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    }
                    
                    const getStatusLabel = (status) => {
                      switch (status?.toLowerCase()) {
                        case 'approved':
                          return 'FULLY APPROVED'
                        case 'rejected':
                          return 'REJECTED'
                        case 'complete':
                          return 'READY FOR SUBMISSION'
                        case 'pending_caseworker_approval':
                          return 'PENDING CASEWORKER'
                        case 'pending_finance_approval':
                          return 'PENDING FINANCE'
                        case 'pending_director_approval':
                          return 'PENDING DIRECTOR'
                        case 'in_progress':
                          return 'IN PROGRESS'
                        case 'pending':
                          return 'PENDING'
                        default:
                          return (status || 'pending').toUpperCase()
                      }
                    }
                    
                    const getDisbursementLabel = (disbursementType) => {
                      switch (disbursementType?.toLowerCase()) {
                        case 'tuition':
                          return 'Tuition Fee Assistance'
                        case 'cola':
                          return 'COLA (Cost of Living Allowance)'
                        case 'other':
                          return 'Other'
                        default:
                          return disbursementType || 'LIQUIDATION'
                      }
                    }
                    
                    return (
                      <div key={liquidation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {getDisbursementLabel(liquidation.disbursement_type)}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(liquidation.status)}`}>
                                {getStatusLabel(liquidation.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Disbursed:</span>
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(liquidation.total_disbursed_amount || 0)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Liquidated:</span>
                                <div className="font-semibold text-green-900">
                                  {formatCurrency(liquidation.total_receipt_amount || 0)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Remaining:</span>
                                <div className={`font-semibold ${liquidation.remaining_amount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                                  {formatCurrency(liquidation.remaining_amount || 0)}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-500">Date:</span>
                                <div className="text-gray-700">
                                  {liquidation.liquidation_date ? new Date(liquidation.liquidation_date).toLocaleDateString('en-PH') : 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-500">OR/Invoice No.:</span>
                                <div className="text-gray-700">
                                  {liquidation.or_invoice_no || 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-500">Receipts:</span>
                                <div className="text-gray-700">
                                  {liquidation.receipts_count || liquidation.receipts?.length || 0} file(s)
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <span className="font-medium text-gray-500">Submitted:</span>
                              <span className="text-gray-700 ml-1">
                                {formatDate(liquidation.created_at)}
                              </span>
                            </div>
                            
                            {liquidation.description && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-500 text-sm">Description:</span>
                                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                                  {liquidation.description}
                                </p>
                              </div>
                            )}
                            
                            {/* Review Notes */}
                            {(liquidation.reviewer_notes) && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-500 text-sm">Review Notes:</span>
                                <div className="mt-1">
                                  <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                    <span className="font-medium">Reviewer:</span> {liquidation.reviewer_notes}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Submit for Approval Button */}
                            {liquidation.status === 'complete' && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <button
                                  onClick={() => submitForApproval(liquidation.id)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  Submit for Approval
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  This will submit your liquidation to your caseworker for approval.
                                </p>
                              </div>
                            )}

                            {liquidation.status === 'in_progress' && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <button
                                  onClick={() => reLiquidate(liquidation)}
                                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  Re‑liquidate (add more receipts)
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  Your receipt total is below the disbursed amount. Add additional receipts until it meets or exceeds the amount.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      <SimpleLiquidationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setSubmittedLiquidationDetails(null)
        }}
        title="Liquidation Submitted Successfully!"
        message="Your liquidation has been submitted for caseworker approval."
        details={submittedLiquidationDetails}
        showWorkflowSteps={true}
      />
      <ReceiptReviewModal
        open={reviewOpen}
        receipts={receipts}
        disbursedAmount={getDisbursedAmount()}
        onCancel={() => setReviewOpen(false)}
        onConfirm={submitConfirmed}
        loading={loading}
      />
    </>
  )
}

export default Liquidation
