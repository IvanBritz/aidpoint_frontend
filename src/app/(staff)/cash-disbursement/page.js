'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const CashDisbursement = () => {
  const { user } = useAuth({ middleware: 'auth' })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [actingId, setActingId] = useState(null)
  const [form, setForm] = useState({}) // per-row amount/notes
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  const isFinance = user?.system_role?.name?.toLowerCase() === 'finance'

  const load = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/disbursements/finance/ready?per_page=10&page=${page}`)
      const data = res?.data?.data
      const rows = data?.data ?? []
      setItems(rows)
      if (data) setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load requests ready for disbursement')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user && isFinance) load() }, [user?.id])

  const updateForm = (id, patch) => setForm(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...patch } }))

  const disburse = async (row) => {
    try {
      setActingId(row.id)
      const f = form[row.id] || {}
      const amount = Number(row.amount) // Always use the approved amount, no modifications allowed
      const notes = f.notes || ''
      if (!amount || amount <= 0) {
        setModalMessage('Invalid approved amount')
        setShowModal(true)
        return
      }
      await axios.post(`/api/aid-requests/${row.id}/disburse`, { amount, notes })
      // After success, reload current page
      await load(meta?.current_page || 1)
    } catch (e) {
      setModalMessage(e?.response?.data?.message || 'Unable to disburse funds')
      setShowModal(true)
    } finally {
      setActingId(null)
    }
  }

  if (!isFinance) {
    return (
      <>
        <Header title="Cash Disbursement" />
        <div className="py-12"><div className="max-w-7xl mx-auto sm:px-6 lg:px-8"><div className="bg-white overflow-hidden shadow-sm sm:rounded-lg"><div className="p-6">Only finance staff can access this page.</div></div></div></div>
      </>
    )
  }

  return (
    <>
      <Header title="Cash Disbursement" />
      
      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
            
            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                {/* Icon */}
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                
                {/* Content */}
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                    Opss!
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {modalMessage}
                    </p>
                  </div>
                </div>
                
                {/* Close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* OK Button */}
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Approved requests ready to disburse</h2>
                  <p className="text-sm text-gray-600">Send cash to the assigned caseworker</p>
                </div>
                <button onClick={() => load(meta?.current_page || 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Refresh</button>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-gray-600">No approved requests ready for disbursement.</p>
              ) : (
                <div className="space-y-4">
                  {items.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{r?.beneficiary?.firstname} {r?.beneficiary?.lastname}</div>
                          <div className="text-sm text-gray-600">Type: <span className="font-medium uppercase">{String(r.fund_type)}</span> • Requested: ₱{Number(r.amount).toFixed(2)}</div>
                          {r.purpose && <div className="text-sm text-gray-500 mt-1">{r.purpose}</div>}
                        </div>
                        <div className="flex items-center">
                          <button onClick={() => disburse(r)} disabled={actingId===r.id} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 font-medium">{actingId===r.id?'Processing...':'Cash Disburse'}</button>
                        </div>
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
    </>
  )
}

export default CashDisbursement
