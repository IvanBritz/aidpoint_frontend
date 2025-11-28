'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const BeneficiaryDisbursements = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [receivedAmount, setReceivedAmount] = useState(0)

  const load = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/my-disbursements')
      setItems(res?.data?.data || [])
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load disbursements')
      setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user?.id])

  const confirmReceipt = async (id) => {
    try {
      setActing(id)
      const disbursement = items.find(d => d.id === id)
      await axios.post(`/api/disbursements/${id}/beneficiary-receive`)
      await load()
      setReceivedAmount(disbursement?.amount || 0)
      setShowSuccessModal(true)
    } catch (e) {
      alert(e?.response?.data?.message || 'Unable to confirm receipt')
    } finally { setActing(null) }
  }

  const SuccessModal = () => {
    if (!showSuccessModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
          {/* Header with icon */}
          <div className="text-center pt-8 pb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Cash Received Successfully!</h3>
            <p className="text-gray-600 mb-4">Your cash assistance has been confirmed</p>
          </div>

          {/* Amount display */}
          <div className="px-8 pb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-sm text-green-600 font-medium mb-1">Amount Received</div>
              <div className="text-3xl font-bold text-green-700">
                ₱{Number(receivedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="px-8 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">What's Next?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your cash assistance transaction is now complete. The finance department has been notified of your successful receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="px-8 pb-8">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'finance_disbursed': { color: 'bg-yellow-100 text-yellow-800', text: 'Finance Disbursed' },
      'caseworker_received': { color: 'bg-blue-100 text-blue-800', text: 'Caseworker Received' },
      'caseworker_disbursed': { color: 'bg-green-100 text-green-800', text: 'Ready for Collection' },
      'beneficiary_received': { color: 'bg-gray-100 text-gray-800', text: 'Received' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'finance_disbursed':
        return 'Finance has disbursed the cash to your caseworker. Please wait for your caseworker to collect it.'
      case 'caseworker_received':
        return 'Your caseworker has received the cash from finance. They will contact you for disbursement.'
      case 'caseworker_disbursed':
        return 'Your cash assistance is ready for collection! Please confirm once you have received it.'
      case 'beneficiary_received':
        return 'You have successfully received your cash assistance.'
      default:
        return 'Processing your disbursement...'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isBeneficiary = user?.system_role?.name?.toLowerCase() === 'beneficiary'
  if (!isBeneficiary) {
    return (
      <>
        <Header title="Cash Assistance Disbursements" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">Only beneficiaries can access this page.</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Cash Assistance Disbursements" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Your Cash Assistance</h2>
                  <p className="text-sm text-gray-600 mt-1">Track and confirm receipt of your cash assistance disbursements</p>
                </div>
                <button 
                  onClick={load} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading disbursements...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No disbursements found</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any cash assistance disbursements yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(d => (
                    <div key={d.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              ₱{Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            {getStatusBadge(d.status)}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            <p>{getStatusMessage(d.status)}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                            <div>
                              <strong>Finance Disbursed:</strong> {formatDate(d.finance_disbursed_at)}
                              {d.finance_dispenser && (
                                <span className="ml-1 text-gray-600">
                                  by {d.finance_dispenser.firstname} {d.finance_dispenser.lastname}
                                </span>
                              )}
                            </div>
                            {d.caseworker_received_at && (
                              <div>
                                <strong>Caseworker Received:</strong> {formatDate(d.caseworker_received_at)}
                                {d.caseworker_receiver && (
                                  <span className="ml-1 text-gray-600">
                                    by {d.caseworker_receiver.firstname} {d.caseworker_receiver.lastname}
                                  </span>
                                )}
                              </div>
                            )}
                            {d.caseworker_disbursed_at && (
                              <div>
                                <strong>Ready for Collection:</strong> {formatDate(d.caseworker_disbursed_at)}
                                {d.caseworker_dispenser && (
                                  <span className="ml-1 text-gray-600">
                                    by {d.caseworker_dispenser.firstname} {d.caseworker_dispenser.lastname}
                                  </span>
                                )}
                              </div>
                            )}
                            {d.beneficiary_received_at && (
                              <div>
                                <strong>You Received:</strong> {formatDate(d.beneficiary_received_at)}
                              </div>
                            )}
                          </div>

                          {d.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                              <strong>Notes:</strong> {d.notes}
                            </div>
                          )}

                          {d.reference_no && (
                            <div className="mt-2 text-xs text-gray-500">
                              <strong>Reference:</strong> {d.reference_no}
                            </div>
                          )}
                        </div>

                        <div className="ml-6">
                          {d.status === 'caseworker_disbursed' && (
                            <button
                              onClick={() => confirmReceipt(d.id)}
                              disabled={acting === d.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                            >
                              {acting === d.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Confirming...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Receive Cash</span>
                                </>
                              )}
                            </button>
                          )}
                          {d.status === 'beneficiary_received' && (
                            <div className="flex items-center text-green-600 text-sm">
                              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Received
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <SuccessModal />
    </>
  )
}

export default BeneficiaryDisbursements