'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const ReceivedDisbursements = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)

  const isFinance = user?.system_role?.name?.toLowerCase() === 'finance'
  const isCaseworker = user?.system_role?.name?.toLowerCase() === 'caseworker'
  const allowed = isFinance || isCaseworker

  const load = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/disbursements/received?per_page=10&page=${page}`)
      const data = res?.data?.data
      const rows = data?.data ?? []
      setItems(rows)
      if (data) setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load received disbursements')
      setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (user && allowed) load() }, [user?.id])

  if (!allowed) {
    return (
      <>
        <Header title="Received Disbursements" />
        <div className="py-12"><div className="max-w-7xl mx-auto sm:px-6 lg:px-8"><div className="bg-white overflow-hidden shadow-sm sm:rounded-lg"><div className="p-6">Only finance staff and caseworkers can access this page.</div></div></div></div>
      </>
    )
  }

  return (
    <>
      <Header title="Received Disbursements" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Confirmed by beneficiaries</h2>
                  <p className="text-sm text-gray-600">Completed disbursements in your scope</p>
                </div>
                <button onClick={() => load(meta?.current_page || 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Refresh</button>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-gray-600">No received disbursements yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b bg-gray-50">
                        <th className="py-2 pr-4">Beneficiary</th>
                        <th className="py-2 pr-4">Fund Type</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Caseworker</th>
                        <th className="py-2 pr-4">Received At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map(d => {
                        // Try multiple shapes to find the caseworker attached to this disbursement
                        const cw = d?.caseworker 
                          || d?.aid_request?.beneficiary?.caseworker 
                          || d?.aid_request?.caseworker 
                          || d?.aid_request?.caseworker_user 
                          || d?.aid_request?.assigned_caseworker 
                          || d?.caseworker_user

                        const caseworkerName = cw
                          ? [cw.firstname, cw.middlename, cw.lastname].filter(Boolean).join(' ')
                          : (d?.caseworker_name || '-')

                        return (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="py-2 pr-4">{d?.aid_request?.beneficiary?.firstname} {d?.aid_request?.beneficiary?.lastname}</td>
                            <td className="py-2 pr-4">{String(d?.aid_request?.fund_type || d.fund_type || '').toUpperCase()}</td>
                            <td className="py-2 pr-4">₱{Number(d.amount || 0).toFixed(2)}</td>
                            <td className="py-2 pr-4">{caseworkerName}</td>
                            <td className="py-2 pr-4">{d?.beneficiary_received_at ? new Date(d.beneficiary_received_at).toLocaleString() : '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-3">
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

export default ReceivedDisbursements
