'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import ApprovalNotesModal from '@/components/ApprovalNotesModal'
import NotificationToast from '@/components/NotificationToast'

const DirectorPendingFundRequests = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [modal, setModal] = useState({ open: false, id: null, action: 'approved' })
  const [saving, setSaving] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [notification, setNotification] = useState(null)

  // Redirect non-directors to appropriate pages
  useEffect(() => {
    if (user && user.system_role?.name?.toLowerCase() !== 'director') {
      // Redirect based on role
      if (user.system_role?.name?.toLowerCase() === 'finance') {
        const facilityId = user.financial_aid_id || 4 // fallback
        router.push(`/${facilityId}/fund-requests/pending`)
      } else {
        router.push(`/${user.financial_aid_id || 4}/dashboard`)
      }
      return
    }
  }, [user, router])

  const load = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/aid-requests/director/pending?per_page=10&page=${page}`)
      const data = res?.data?.data
      const rows = data?.data ?? []
      setItems(rows)
      if (data) setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pending fund requests')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (user && user.system_role?.name?.toLowerCase() === 'director') {
      load() 
    }
  }, [user])

  const openModal = (id, action) => setModal({ open: true, id, action })

  const confirmModal = async (notes) => {
    try {
      setSaving(true)
      await axios.post(`/api/aid-requests/${modal.id}/director-review`, { status: modal.action, notes })
      setModal({ open: false, id: null, action: 'approved' })
      await load(meta?.current_page || 1)
    } catch (e) {
      setNotification({ type: 'error', title: 'Unable to complete', message: e?.response?.data?.message || `Unable to ${modal.action} request` })
    } finally {
      setSaving(false)
    }
  }

  const confirmBulkApprove = async (notes) => {
    if (!items || items.length === 0) return
    setBulkSaving(true)
    let success = 0
    let failed = 0
    // Process sequentially for reliability; keeps load light on server
    for (const r of items) {
      try {
        await axios.post(`/api/aid-requests/${r.id}/director-review`, { status: 'approved', notes })
        success++
      } catch (e) {
        failed++
        console.error('Bulk approve failed for', r.id, e?.response?.data || e)
      }
    }

    setBulkModalOpen(false)
    setBulkSaving(false)
    await load(meta?.current_page || 1)

    if (failed === 0) {
      setNotification({ type: 'success', title: 'Bulk Approve Complete', message: `Successfully approved ${success} request(s).` })
    } else {
      setNotification({ type: 'error', title: 'Partial Success', message: `Approved ${success} request(s). ${failed} failed.` })
    }
  }

  // Show loading for non-directors while redirecting
  if (user && user.system_role?.name?.toLowerCase() !== 'director') {
    return (
      <>
        <Header title="Redirecting..." />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-center">
                <p>Redirecting you to the appropriate page...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Director Final Fund Request Approval" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Requests awaiting director approval</h2>
                  <p className="text-sm text-gray-600">Finance-approved requests requiring final director approval</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => load(meta?.current_page || 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Refresh</button>
                  {items.length > 0 && (
                    <button
                      onClick={() => setBulkModalOpen(true)}
                      disabled={bulkSaving}
                      title="Approve all displayed requests"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
                    >
                      {bulkSaving ? 'Approving...' : 'Bulk Approve'}
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading pending requests...</p>
                </div>
              ) : error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="font-medium">Error Loading Requests</p>
                  </div>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={() => load()} 
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900">
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg font-medium text-gray-900">No pending requests</p>
                  <p className="mt-2 text-sm text-gray-500">There are currently no fund requests awaiting director approval.</p>
                  <p className="mt-1 text-xs text-gray-400">Requests will appear here after finance staff approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="font-semibold text-lg text-gray-900">{r?.beneficiary?.firstname} {r?.beneficiary?.lastname}</div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Finance Approved
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Fund Type</p>
                              <p className="text-sm text-gray-900">{r.fund_type}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Amount</p>
                              <p className="text-sm font-semibold text-green-600">₱{Number(r.amount).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Submitted</p>
                              <p className="text-sm text-gray-900">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {r.purpose && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-500">Purpose</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{r.purpose}</p>
                            </div>
                          )}
                          
                          {r.finance_notes && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-500">Finance Review Notes</p>
                              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">{r.finance_notes}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-700 flex flex-col md:flex-row md:items-center md:gap-4">
                            <span>Beneficiary: {r?.beneficiary?.email}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Caseworker Approved: <span className="font-medium">{r.caseworker_name || (r.reviewer ? `${r.reviewer.firstname} ${r.reviewer.lastname}` : 'Caseworker')}</span> — {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : 'N/A'}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Finance Approved: <span className="font-medium">{r.finance_name || (r.financeReviewer ? `${r.financeReviewer.firstname} ${r.financeReviewer.lastname}` : 'Finance')}</span> — {r.finance_reviewed_at ? new Date(r.finance_reviewed_at).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => openModal(r.id, 'approved')} 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors">
                            Final Approve
                          </button>
                          <button 
                            onClick={() => openModal(r.id, 'rejected')} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-4">
                      <button 
                        disabled={meta.current_page === 1} 
                        onClick={() => load(meta.current_page - 1)} 
                        className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50">
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page}</span>
                      <button 
                        disabled={meta.current_page === meta.last_page} 
                        onClick={() => load(meta.current_page + 1)} 
                        className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50">
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ApprovalNotesModal
        open={modal.open}
        title={modal.action === 'approved' ? 'Final Approval - Fund Request' : 'Reject Fund Request'}
        description={
          modal.action === 'approved' 
            ? 'This is the final approval step. Once approved, the fund request will be processed. Add any final notes if needed.' 
            : 'Please provide a reason for rejecting this fund request after finance approval.'
        }
        actionLabel={modal.action === 'approved' ? 'Final Approve' : 'Reject'}
        onCancel={() => setModal({ open: false, id: null, action: 'approved' })}
        onConfirm={confirmModal}
        loading={saving}
      />
      <ApprovalNotesModal
        open={bulkModalOpen}
        title={'Bulk Final Approval - Displayed Requests'}
        description={'This will final-approve all requests displayed on this page. This action will process each request sequentially. Add a note to include with all approvals if needed.'}
        actionLabel={'Bulk Approve'}
        onCancel={() => setBulkModalOpen(false)}
        onConfirm={confirmBulkApprove}
        loading={bulkSaving}
      />
      <NotificationToast notification={notification} onClose={() => setNotification(null)} />
    </>
  )
}

export default DirectorPendingFundRequests