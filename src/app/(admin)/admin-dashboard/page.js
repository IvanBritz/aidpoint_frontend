'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

const Dashboard = () => {
    const { user } = useAuth()
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const response = await axios.get('/api/admin/dashboard')
                setDashboardData(response.data.data)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchDashboardData()
        }
    }, [user])

    if (loading) {
        return (
            <>
                <Header title="Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <Header title="Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="text-red-600">
                                    Error: {error}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const { centers, metrics } = dashboardData || {}

    return (
        <>
            <Header title="Admin Dashboard" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
                        <p className="text-gray-600 text-sm md:text-base">Here's what happening with your financial aid centers today.</p>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Total Centers Card */}
                        <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {metrics?.total_centers || 0}
                                </div>
                                <div className="text-blue-100 text-sm font-medium">Total Centers</div>
                            </div>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
                        </div>

                        {/* Approved Centers Card */}
                        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {metrics?.approved_centers || 0}
                                </div>
                                <div className="text-green-100 text-sm font-medium">Approved Centers</div>
                            </div>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
                        </div>

                        {/* Pending Centers Card */}
                        <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {metrics?.pending_centers || 0}
                                </div>
                                <div className="text-amber-100 text-sm font-medium">Pending Centers</div>
                            </div>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
                        </div>

                        {/* Total Earnings Card */}
                        <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    ₱{(metrics?.total_earnings || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}
                                </div>
                                <div className="text-purple-100 text-sm font-medium">Total Earnings</div>
                            </div>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
                        </div>
                    </div>

                    {/* Centers Table */}
                    <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-100">
                        <div className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-white to-blue-50 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Registered Centers</h2>
                                    <p className="text-gray-600 text-sm sm:text-base">Manage and monitor all registered financial aid centers</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {centers?.length || 0} centers
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Table Content */}
                        <div className="p-6">
                            {centers && centers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Center
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Owner
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Plan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Beneficiaries
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Earnings
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {centers.map((center) => (
                                                <tr key={center.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {center.center_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: {center.center_id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {center.owner?.firstname} {center.owner?.lastname}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {center.owner?.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {center.current_plan ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {center.current_plan.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ₱{center.current_plan.price} - {center.current_plan.duration} months
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">No active plan</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {center.beneficiary_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                        ₱{center.total_earnings.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {center.isManagable ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Approved
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-500">
                                        No centers registered yet.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard