'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import ConfirmModal from '@/components/ConfirmModal'

export default function SubscriptionPlansPage() {
    const router = useRouter()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(null)
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, plan: null })

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/subscription-plans')
            if (response.data.success) {
                setPlans(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
            setError('Failed to load subscription plans.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (plan) => {
        setDeleteModal({ isOpen: true, plan })
    }

    const handleDeleteConfirm = async () => {
        const plan = deleteModal.plan
        if (!plan) return

        setDeleting(plan.plan_id)
        setDeleteModal({ isOpen: false, plan: null })
        
        try {
            const response = await axios.delete(`/api/subscription-plans/${plan.plan_id}`)
            
            if (response.data.success) {
                setPlans(plans.filter(p => p.plan_id !== plan.plan_id))
            }
        } catch (error) {
            console.error('Error deleting plan:', error)
            const message = error.response?.data?.message || 'Failed to delete subscription plan.'
            setError(message)
        } finally {
            setDeleting(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, plan: null })
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price)
    }

    const formatDuration = (months) => {
        if (months === 1) return '1 month'
        if (months < 12) return `${months} months`
        
        const years = Math.floor(months / 12)
        const remainingMonths = months % 12
        
        let duration = years === 1 ? '1 year' : `${years} years`
        if (remainingMonths > 0) {
            duration += remainingMonths === 1 ? ', 1 month' : `, ${remainingMonths} months`
        }
        
        return duration
    }

    if (loading) {
        return (
            <>
                <Header title="Subscription Plans" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Subscription Plans" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {/* Header with Create Button */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Subscription Plans
                                </h2>
                                <Link
                                    href="/plan/create"
                                    className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    Create New Plan
                                </Link>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
                                    {error}
                                    <button
                                        onClick={() => setError('')}
                                        className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Plans List */}
                            {plans.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 text-lg mb-4">
                                        No subscription plans found.
                                    </div>
                                    <Link
                                        href="/plan/create"
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Create Your First Plan
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.plan_id}
                                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {plan.plan_name}
                                                </h3>
                                                <div className="flex space-x-2">
                                                    <Link
                                                        href={`/plan/${plan.plan_id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(plan)}
                                                        disabled={deleting === plan.plan_id}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                                                    >
                                                        {deleting === plan.plan_id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {formatPrice(plan.price)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Duration: {formatDuration(plan.duration_in_months)}
                                                </div>
                                            </div>
                                            
                                            {plan.description && (
                                                <p className="text-gray-600 text-sm line-clamp-3">
                                                    {plan.description}
                                                </p>
                                            )}
                                            
                                            <div className="mt-4 text-xs text-gray-500">
                                                Created: {new Date(plan.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Subscription Plan"
                message={`Are you sure you want to delete "${deleteModal.plan?.plan_name}"? This action cannot be undone.`}
                confirmText="Delete Plan"
                cancelText="Cancel"
                type="danger"
            />
        </>
    )
}