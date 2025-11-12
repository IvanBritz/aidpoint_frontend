'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'

const FundRequest = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [fundType, setFundType] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [month, setMonth] = useState(null)
  const [year, setYear] = useState(null)
  const [loading, setLoading] = useState(false)
  const [colaPreview, setColaPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [allowedMonths, setAllowedMonths] = useState([])
  const [monthlyRestrictions, setMonthlyRestrictions] = useState({})
  
  // Request history state
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Load user's requests on component mount
  useEffect(() => {
    if (user) {
      loadRequests()
    }
  }, [user])
  
  // Auto-calculate COLA preview when fund type changes (period is server-driven)
  useEffect(() => {
    if (fundType === 'cola') {
      loadColaPreview()
    }
  }, [fundType])
  
  const loadRequests = async () => {
    try {
      setRequestsLoading(true)
      const res = await axios.get('/api/beneficiary/aid-requests')
      const requestsData = Array.isArray(res.data?.data) ? res.data.data : []
      setRequests(requestsData)
      
      // Calculate monthly restrictions based on existing requests
      const restrictions = {}
      requestsData.forEach(request => {
        if (['cola', 'tuition'].includes(request.fund_type) && request.status !== 'rejected') {
          const key = `${request.fund_type}_${request.month || new Date(request.created_at).getMonth() + 1}_${request.year || new Date(request.created_at).getFullYear()}`
          restrictions[key] = request
        }
      })
      setMonthlyRestrictions(restrictions)
    } catch (e) {
      console.error('Failed to load requests:', e)
      setRequests([])
      setMonthlyRestrictions({})
    } finally {
      setRequestsLoading(false)
    }
  }

  const loadColaPreview = async () => {
    if (!user || fundType !== 'cola') return
    
    try {
      setPreviewLoading(true)
      // No payload: server will use current month/year (and validate against semester window)
      const res = await axios.post('/api/beneficiary/cola-preview')
      const data = res?.data?.data || null
      setColaPreview(data)
      if (Array.isArray(data?.allowed_months)) {
        setAllowedMonths(data.allowed_months)
      }
      if (data?.period) {
        setMonth(data.period.month)
        setYear(data.period.year)
      }
      setError(null)
    } catch (e) {
      console.error('COLA preview error:', e)
      setColaPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check for monthly restriction
    const existingRequest = getCurrentRestriction()
    if (existingRequest) {
      const checkMonth = fundType === 'cola' ? month : new Date().getMonth() + 1
      const checkYear = fundType === 'cola' ? year : new Date().getFullYear()
      const monthName = getMonthName(checkMonth)
      setError(`You have already submitted a ${fundType} request for ${monthName} ${checkYear}. Each beneficiary can only request funds for ${fundType} once per month.`)
      return
    }
    
    if (fundType === 'cola' && colaPreview && !colaPreview.can_request) {
      setError('Cannot submit COLA request - final amount is ₱0.00 due to attendance deductions.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const payload = {
        fund_type: fundType,
        purpose: purpose.trim() || null,
      }

      if (fundType === 'cola') {
        // Month/year are server-driven; do not send from client
        // Amount is calculated by backend for COLA
      } else {
        payload.amount = parseFloat(amount)
      }

      const res = await axios.post('/api/beneficiary/aid-requests', payload)
      
      setSuccess('Fund request submitted successfully!')
      
      // Reload requests to show the new one
      await loadRequests()
      
      // Reset form
      setFundType('')
      setAmount('')
      setPurpose('')
      setColaPreview(null)
      
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit fund request.')
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

  const getMonthName = (monthNum) => {
    return new Date(2023, monthNum - 1).toLocaleString('default', { month: 'long' })
  }
  
  // Helper function to check if a month/year combination has existing requests
  const hasExistingRequest = (fundType, month, year) => {
    const key = `${fundType}_${month}_${year}`
    return monthlyRestrictions[key]
  }
  
  // Helper function to check current selection restrictions
  const getCurrentRestriction = () => {
    if (!fundType || !['cola', 'tuition'].includes(fundType)) return null
    
    const checkMonth = fundType === 'cola' ? month : new Date().getMonth() + 1
    const checkYear = fundType === 'cola' ? year : new Date().getFullYear()
    
    return hasExistingRequest(fundType, checkMonth, checkYear)
  }

  return (
    <>
      <Header title="Request Financial Aid" />
      <div className="py-8">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Submit Fund Request</h3>
              <p className="text-sm text-gray-600 mt-1">
                Request financial assistance for your educational needs.
              </p>
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <span className="font-medium">Policy:</span> Each beneficiary can only submit one COLA and one tuition request per month.
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
                {/* Fund Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fund Type *
                  </label>
                  <select
                    value={fundType}
                    onChange={(e) => {
                      setFundType(e.target.value)
                      if (e.target.value !== 'cola') {
                        setColaPreview(null)
                      }
                    }}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select fund type</option>
                    <option value="tuition">Tuition Fee Assistance</option>
                    <option value="cola">COLA (Cost of Living Allowance)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Monthly Restriction Warning */}
                {(() => {
                  const restriction = getCurrentRestriction()
                  if (restriction) {
                    const checkMonth = fundType === 'cola' ? month : new Date().getMonth() + 1
                    const checkYear = fundType === 'cola' ? year : new Date().getFullYear()
                    const monthName = getMonthName(checkMonth)
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                        <div className="flex">
                          <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h5 className="text-sm font-medium text-orange-800">Monthly Limit Reached</h5>
                            <p className="text-sm text-orange-700 mt-1">
                              You have already submitted a {fundType} request for {monthName} {checkYear}. 
                              Each beneficiary can only request funds for {fundType} once per month.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* COLA Period (server-driven) */}
                {fundType === 'cola' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period
                      </label>
                      <input
                        type="text"
                        value={month && year ? `${getMonthName(month)} ${year}` : ''}
                        readOnly
                        className="w-full border-gray-300 rounded-md shadow-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                      {/* <p className="text-xs text-gray-500">COLA requests use the current server month and year and are limited to 5 months starting from your enrollment month.</p> */}
                    </div>
                    
                  </div>
                )}

                {/* COLA Preview */}
                {fundType === 'cola' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-1">
                      COLA Calculation Preview - {getMonthName(month)} {year}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">Select one of the five months starting from your enrollment month.</p>
                    
                    {previewLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Calculating COLA amount...</p>
                      </div>
                    ) : colaPreview ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">
                              {colaPreview.is_scholar ? 'Scholar' : 'Non-Scholar'}
                            </div>
                            <div className="text-gray-500">Status</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(colaPreview.base_amount)}
                            </div>
                            <div className="text-gray-500">Base Amount</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">
                              {colaPreview.sunday_absences}
                            </div>
                            <div className="text-gray-500">Sunday Absences</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">
                              -{formatCurrency(colaPreview.deduction_amount)}
                            </div>
                            <div className="text-gray-500">Deductions</div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Final COLA Amount:</span>
                            <span className={`text-xl font-bold ${colaPreview.final_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(colaPreview.final_amount)}
                            </span>
                          </div>
                        </div>

                        {!colaPreview.can_request && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <div className="flex">
                              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <h5 className="text-sm font-medium text-yellow-800">Cannot Request COLA</h5>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Due to Sunday absences, your COLA amount for this period is ₱0.00. No request can be submitted.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attendance Summary */}
                        {colaPreview.attendance_summary && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Attendance Summary
                            </summary>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Present:</span> {colaPreview.attendance_summary.present_days}
                              </div>
                              <div>
                                <span className="font-medium">Absent:</span> {colaPreview.attendance_summary.absent_days}
                              </div>
                              <div>
                                <span className="font-medium">Excused:</span> {colaPreview.attendance_summary.excused_days}
                              </div>
                              <div>
                                <span className="font-medium">Total Days:</span> {colaPreview.attendance_summary.total_days}
                              </div>
                            </div>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">COLA calculation is based on the current server month and year.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Field (for non-COLA requests) */}
                {fundType && fundType !== 'cola' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₱) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount in PHP"
                      required
                    />
                  </div>
                )}

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose {fundType !== 'cola' && '*'}
                  </label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder={fundType === 'cola' ? 'Optional: Additional notes for your COLA request' : 'Describe the purpose of your fund request'}
                    required={fundType !== 'cola'}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || 
                             (fundType === 'cola' && colaPreview && !colaPreview.can_request) || 
                             getCurrentRestriction()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Request History Section */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">My Fund Requests</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track the status of your submitted fund requests.
                  </p>
                </div>
                <button
                  onClick={loadRequests}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading your requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">No fund requests yet</p>
                  <p className="text-sm text-gray-500">Your submitted fund requests will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => {
                    const getStatusColor = (status) => {
                      switch (status?.toLowerCase()) {
                        case 'approved':
                          return 'bg-green-100 text-green-800 border-green-200'
                        case 'rejected':
                          return 'bg-red-100 text-red-800 border-red-200'
                        case 'pending':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        default:
                          return 'bg-gray-100 text-gray-800 border-gray-200'
                      }
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
                    
                    return (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {request.fund_type?.toUpperCase() || 'UNKNOWN'}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                {(request.status || 'pending').toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Amount:</span>
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(request.amount)}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-500">Submitted:</span>
                                <div className="text-gray-700">
                                  {formatDate(request.created_at)}
                                </div>
                              </div>
                              
                              {request.fund_type === 'cola' && (
                                <div>
                                  <span className="font-medium text-gray-500">Period:</span>
                                  <div className="text-gray-700">
                                    {request.month && request.year ? 
                                      `${getMonthName(request.month)} ${request.year}` : 
                                      'N/A'
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {request.purpose && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-500 text-sm">Purpose:</span>
                                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                                  {request.purpose}
                                </p>
                              </div>
                            )}
                            
                            {/* Review Notes */}
                            {(request.caseworker_notes || request.finance_notes || request.director_notes) && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-500 text-sm">Review Notes:</span>
                                <div className="mt-1 space-y-1">
                                  {request.caseworker_notes && (
                                    <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                      <span className="font-medium">Caseworker:</span> {request.caseworker_notes}
                                    </p>
                                  )}
                                  {request.finance_notes && (
                                    <p className="text-sm text-gray-700 bg-green-50 p-2 rounded border-l-4 border-green-400">
                                      <span className="font-medium">Finance:</span> {request.finance_notes}
                                    </p>
                                  )}
                                  {request.director_notes && (
                                    <p className="text-sm text-gray-700 bg-purple-50 p-2 rounded border-l-4 border-purple-400">
                                      <span className="font-medium">Director:</span> {request.director_notes}
                                    </p>
                                  )}
                                </div>
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
    </>
  )
}

export default FundRequest