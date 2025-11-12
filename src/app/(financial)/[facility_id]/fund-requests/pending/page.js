'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Button from '@/components/Button'
import ApprovalNotesModal from '@/components/ApprovalNotesModal'
import { useAuth } from '@/hooks/auth'

const PendingFundRequests = () => {
    const { facility_id } = useParams()
    const router = useRouter()
    const { user } = useAuth({ middleware: 'auth' })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [items, setItems] = useState([])
    const [pageMeta, setPageMeta] = useState(null)
    const [modal, setModal] = useState({ open: false, id: null, action: 'approved' })
    const [saving, setSaving] = useState(false)

    const fetchPending = async (page = 1) => {
        try {
            setLoading(true)
            const res = await axios.get(`/api/aid-requests/finance/pending?per_page=10&page=${page}`)
            const data = res?.data?.data
            if (data?.data) {
                setItems(data.data)
                setPageMeta({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    total: data.total,
                })
            } else {
                setItems([])
                setPageMeta(null)
            }
            setError(null)
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load pending requests')
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    // Redirect directors to their proper page
    useEffect(() => {
        if (user && user.system_role?.name?.toLowerCase() === 'director') {
            router.push('/director-pending-fund-requests')
            return
        }
    }, [user, router])

    useEffect(() => {
        if (facility_id && user && user.system_role?.name?.toLowerCase() !== 'director') {
            fetchPending()
        }
    }, [facility_id, user])

    const openModal = (id, action) => setModal({ open: true, id, action })

    const confirmModal = async (notes) => {
        try {
            setSaving(true)
            await axios.post(`/api/aid-requests/${modal.id}/finance-review`, { status: modal.action, notes })
            setModal({ open: false, id: null, action: 'approved' })
            await fetchPending(pageMeta?.current_page || 1)
        } catch (e) {
            alert(e?.response?.data?.message || `Unable to ${modal.action} request`)
        } finally {
            setSaving(false)
        }
    }

    // Show loading for directors while redirecting
    if (user && user.system_role?.name?.toLowerCase() === 'director') {
        return (
            <>
                <Header title="Redirecting..." />
                <div className="py-8">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p>Redirecting you to the director approval page...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Pending Fund Request Approval" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Requests awaiting finance review</h2>
                                <p className="text-xs text-blue-600 mt-1">💡 Approved requests will proceed to director for final approval</p>
                                <div className="flex gap-2">
                                    <Button onClick={() => router.back()} className="bg-gray-100 text-gray-800 hover:bg-gray-200">Back</Button>
                                    <Button onClick={() => fetchPending(pageMeta?.current_page || 1)} className="bg-blue-600 hover:bg-blue-700">Refresh</Button>
                                </div>
                            </div>

                            {loading ? (
                                <p>Loading pending requests...</p>
                            ) : error ? (
                                <p className="text-red-600">{error}</p>
                            ) : items.length === 0 ? (
                                <p className="text-gray-600">No pending requests at the moment.</p>
                            ) : (
                                <div className="space-y-3">
                                    {items.map(req => (
                                        <div key={req.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{req?.beneficiary?.firstname} {req?.beneficiary?.lastname}</div>
                                                <div className="text-sm text-gray-600">Type: <span className="font-medium">{req.fund_type}</span> • Amount: ₱{Number(req.amount).toFixed(2)}</div>
                                                {req.purpose && <div className="text-sm text-gray-500 mt-1">{req.purpose}</div>}
                                                <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(req.created_at).toLocaleString()}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => openModal(req.id, 'approved')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                                <Button onClick={() => openModal(req.id, 'rejected')} className="bg-red-600 hover:bg-red-700">Reject</Button>
                                            </div>
                                        </div>
                                    ))}

                                    {pageMeta && pageMeta.last_page > 1 && (
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <Button disabled={pageMeta.current_page === 1} onClick={() => fetchPending(pageMeta.current_page - 1)} className="bg-gray-100 text-gray-800 hover:bg-gray-200">Prev</Button>
                                            <span className="text-sm text-gray-600">Page {pageMeta.current_page} of {pageMeta.last_page}</span>
                                            <Button disabled={pageMeta.current_page === pageMeta.last_page} onClick={() => fetchPending(pageMeta.current_page + 1)} className="bg-gray-100 text-gray-800 hover:bg-gray-200">Next</Button>
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
