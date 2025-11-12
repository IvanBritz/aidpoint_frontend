'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import ApprovalNotesModal from '@/components/ApprovalNotesModal'

const PendingFundRequests = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [modal, setModal] = useState({ open: false, id: null, action: 'approved' })
  const [saving, setSaving] = useState(false)

  const load = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/aid-requests/finance/pending?per_page=10&page=${page}`)
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
    if (user) {
      load() 
    }
  }, [user?.id])

  const openModal = (id, action) => setModal({ open: true, id, action })

  const confirmModal = async (notes) => {
    try {
      setSaving(true)
      await axios.post(`/api/aid-requests/${modal.id}/finance-review`, { status: modal.action, notes })
      setModal({ open: false, id: null, action: 'approved' })
      await load(meta?.current_page || 1)
    } catch (e) {
      alert(e?.response?.data?.message || `Unable to ${modal.action} request`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header title="Pending Fund Request Approval" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Requests awaiting finance review</h2>
                  <p className="text-sm text-gray-600">Caseworker-approved requests from your center</p>
                  <p className="text-xs text-blue-600 mt-1">💡 Approved requests will proceed to director for final approval</p>
                </div>
                <button onClick={() => load(meta?.current_page || 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Refresh</button>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-gray-600">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {items.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{r?.beneficiary?.firstname} {r?.beneficiary?.lastname}</div>
                        <div className="text-sm text-gray-600">Type: <span className="font-medium">{r.fund_type}</span> • Amount: ₱{Number(r.amount).toFixed(2)}</div>
                        {r.purpose && <div className="text-sm text-gray-500 mt-1">{r.purpose}</div>}
                        <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(r.id, 'approved')} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Approve</button>
                        <button onClick={() => openModal(r.id, 'rejected')} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Reject</button>
                      </div>
                    </div>
                  ))}

                  {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button disabled={meta.current_page === 1} onClick={() => load(meta.current_page - 1)} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50">Prev</button>
                      <span className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page}</span>
                      <button disabled={meta.current_page === meta.last_page} onClick={() => load(meta.current_page + 1)} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50">Next</button>
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
        title={modal.action === 'approved' ? 'Approve fund request' : 'Reject fund request'}
        description={modal.action === 'approved' ? 'This request will proceed to director for final approval after your finance approval. Add any notes for the director.' : 'Optionally add notes to explain the rejection.'}
        actionLabel={modal.action === 'approved' ? 'Approve' : 'Reject'}
        onCancel={() => setModal({ open: false, id: null, action: 'approved' })}
        onConfirm={confirmModal}
        loading={saving}
      />
    </>
  )
}

export default PendingFundRequests
