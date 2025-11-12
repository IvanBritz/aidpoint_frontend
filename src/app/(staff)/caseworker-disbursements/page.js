'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const CaseworkerDisbursements = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(null)

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


  const caseworkerDisburse = async (id) => {
    try {
      setActing(id)
      await axios.post(`/api/disbursements/${id}/caseworker-disburse`)
      await load()
    } catch (e) {
      alert(e?.response?.data?.message || 'Unable to disburse to beneficiary')
    } finally { setActing(null) }
  }

  const isCaseworker = user?.system_role?.name?.toLowerCase() === 'caseworker'
  if (!isCaseworker) {
    return (
      <>
        <Header title="Caseworker Disbursements" />
        <div className="py-12"><div className="max-w-7xl mx-auto sm:px-6 lg:px-8"><div className="bg-white overflow-hidden shadow-sm sm:rounded-lg"><div className="p-6">Only caseworkers can access this page.</div></div></div></div>
      </>
    )
  }

  return (
    <>
      <Header title="Caseworker Disbursements" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Cash from Finance</h2>
                  <p className="text-sm text-gray-600">Disburse cash to beneficiaries</p>
                </div>
                <button onClick={load} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Refresh</button>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-gray-600">No disbursements found.</p>
              ) : (
                <div className="space-y-3">
                  {items.map(d => (
                    <div key={d.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{d?.aid_request?.beneficiary?.firstname} {d?.aid_request?.beneficiary?.lastname}</div>
                        <div className="text-sm text-gray-600">Amount: ₱{Number(d.amount).toFixed(2)} • Status: <span className="font-medium capitalize">{String(d.status).replaceAll('_',' ')}</span></div>
                        {d.reference_no && <div className="text-xs text-gray-500 mt-1">Ref: {d.reference_no}</div>}
                      </div>
                      <div className="flex gap-2">
                        {['finance_disbursed','caseworker_received'].includes(d.status) && (
                          <button onClick={() => caseworkerDisburse(d.id)} disabled={acting===d.id} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50">{acting===d.id?'Working...':'Disburse to Beneficiary'}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CaseworkerDisbursements