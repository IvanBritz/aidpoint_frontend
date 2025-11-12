'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'

const SubscriptionManagement = () => {
    const { user } = useAuth({ middleware: 'auth' })
    
    const [subscriptions, setSubscriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [planFilter, setPlanFilter] = useState('')
    const [selectedSubscription, setSelectedSubscription] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        const loadSubscriptions = async () => {
            if (!user) return
            
            try {
                const res = await axios.get('/api/director/subscriptions')
                setSubscriptions(res.data?.data || [])
            } catch (error) {
                console.error('Failed to load subscriptions:', error)
                // Mock data for demonstration
                setSubscriptions([
                    {
                        id: 1,
                        center_name: 'Metro Manila Financial Aid Center',
                        plan_name: 'Professional',
                        status: 'active',
                        start_date: '2024-01-01T00:00:00Z',
                        end_date: '2024-12-31T23:59:59Z',
                        monthly_fee: 2500.00,
                        max_beneficiaries: 500,
                        current_beneficiaries: 245,
                        contact_email: 'admin@mmfac.org'
                    },
                    {
                        id: 2,
                        center_name: 'Cebu City Aid Foundation',
                        plan_name: 'Basic',
                        status: 'active',
                        start_date: '2024-02-15T00:00:00Z',
                        end_date: '2025-02-14T23:59:59Z',
                        monthly_fee: 1500.00,
                        max_beneficiaries: 200,
                        current_beneficiaries: 89,
                        contact_email: 'info@ccaf.org'
                    },
                    {
                        id: 3,
                        center_name: 'Davao Community Support',
                        plan_name: 'Enterprise',
                        status: 'expired',
                        start_date: '2023-06-01T00:00:00Z',
                        end_date: '2024-05-31T23:59:59Z',
                        monthly_fee: 5000.00,
                        max_beneficiaries: 1000,
                        current_beneficiaries: 786,
                        contact_email: 'support@dcs.org'
                    },
                    {
                        id: 4,
                        center_name: 'Bacolod Family Services',
                        plan_name: 'Professional',
                        status: 'pending',
                        start_date: null,
                        end_date: null,
                        monthly_fee: 2500.00,
                        max_beneficiaries: 500,
                        current_beneficiaries: 0,
                        contact_email: 'contact@bfs.org'
                    }
                ])
            } finally {
                setLoading(false)
            }
        }
        
        loadSubscriptions()
    }, [user?.id])

    const filteredSubscriptions = subscriptions.filter(subscription => {
        const matchesSearch = !searchTerm || 
            subscription.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = !statusFilter || subscription.status === statusFilter
        const matchesPlan = !planFilter || subscription.plan_name === planFilter
        
        return matchesSearch && matchesStatus && matchesPlan
    })

    const handleViewDetails = (subscription) => {
        setSelectedSubscription(subscription)
        setShowDetailsModal(true)
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>
            case 'expired':
                return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Expired</span>
            case 'pending':
                return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            case 'cancelled':
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Cancelled</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Unknown</span>
        }
    }

    const getPlanBadge = (plan) => {
        switch (plan) {
            case 'Basic':
                return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Basic</span>
            case 'Professional':
                return <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">Professional</span>
            case 'Enterprise':
                return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">Enterprise</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Unknown</span>
        }
    }

    const getSubscriptionStats = () => {
        const stats = {
            total: subscriptions.length,
            active: subscriptions.filter(s => s.status === 'active').length,
            expired: subscriptions.filter(s => s.status === 'expired').length,
            pending: subscriptions.filter(s => s.status === 'pending').length,
            totalRevenue: subscriptions.filter(s => s.status === 'active')
                                      .reduce((sum, s) => sum + s.monthly_fee, 0),
            totalBeneficiaries: subscriptions.reduce((sum, s) => sum + s.current_beneficiaries, 0)
        }
        return stats
    }

    const getRemainingDays = (endDate) => {
        if (!endDate) return null
        const end = new Date(endDate)
        const now = new Date()
        const diffTime = end - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const stats = getSubscriptionStats()

    if (loading || !user) {
        return <Loading />
    }

    return (
        <>
            <Header title="Subscription Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gradient-to-r from-red-50 to-pink-100 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
                                    <p className="text-gray-600 mt-1">Monitor system subscriptions and activities</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                                    <div className="text-sm text-gray-600">Total Subscriptions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                                    <div className="text-sm text-gray-600">Active</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                                    <div className="text-sm text-gray-600">Expired</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-blue-600">₱{stats.totalRevenue.toFixed(2)}</div>
                                    <div className="text-sm text-gray-600">Monthly Revenue</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-purple-600">{stats.totalBeneficiaries}</div>
                                    <div className="text-sm text-gray-600">Total Beneficiaries</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by center name or email"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                        value={planFilter}
                                        onChange={(e) => setPlanFilter(e.target.value)}
                                    >
                                        <option value="">All Plans</option>
                                        <option value="Basic">Basic</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('')
                                            setStatusFilter('')
                                            setPlanFilter('')
                                        }}
                                        className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscriptions Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Subscriptions ({filteredSubscriptions.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Center
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Beneficiaries
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monthly Fee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expires
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSubscriptions.map((subscription) => (
                                        <tr key={subscription.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {subscription.center_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {subscription.contact_email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPlanBadge(subscription.plan_name)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(subscription.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {subscription.current_beneficiaries} / {subscription.max_beneficiaries}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                    <div 
                                                        className="bg-blue-500 h-2 rounded-full" 
                                                        style={{ width: `${(subscription.current_beneficiaries / subscription.max_beneficiaries) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    ₱{subscription.monthly_fee.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {subscription.end_date ? (
                                                    <div>
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(subscription.end_date).toLocaleDateString()}
                                                        </div>
                                                        {subscription.status === 'active' && (
                                                            <div className={`text-xs ${getRemainingDays(subscription.end_date) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                                                                {getRemainingDays(subscription.end_date)} days left
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewDetails(subscription)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredSubscriptions.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Details Modal */}
                    {showDetailsModal && selectedSubscription && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Subscription Details
                                    </h3>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Center Name</label>
                                            <p className="text-sm text-gray-900">{selectedSubscription.center_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                            <p className="text-sm text-gray-900">{selectedSubscription.contact_email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Plan</label>
                                            {getPlanBadge(selectedSubscription.plan_name)}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            {getStatusBadge(selectedSubscription.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Monthly Fee</label>
                                            <p className="text-sm text-gray-900">₱{selectedSubscription.monthly_fee.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Beneficiaries</label>
                                            <p className="text-sm text-gray-900">
                                                {selectedSubscription.current_beneficiaries} / {selectedSubscription.max_beneficiaries}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedSubscription.start_date && selectedSubscription.end_date && (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedSubscription.start_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedSubscription.end_date).toLocaleDateString()}
                                                </p>
                                                {selectedSubscription.status === 'active' && (
                                                    <p className={`text-xs mt-1 ${getRemainingDays(selectedSubscription.end_date) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {getRemainingDays(selectedSubscription.end_date)} days remaining
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedSubscription.current_beneficiaries > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Usage</label>
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div 
                                                    className="bg-blue-500 h-4 rounded-full flex items-center justify-center text-xs text-white font-medium" 
                                                    style={{ width: `${(selectedSubscription.current_beneficiaries / selectedSubscription.max_beneficiaries) * 100}%` }}
                                                >
                                                    {Math.round((selectedSubscription.current_beneficiaries / selectedSubscription.max_beneficiaries) * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-8">
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default SubscriptionManagement