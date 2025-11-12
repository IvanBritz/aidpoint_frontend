import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

const AnalyticsDashboard = ({ userRole = 'admin' }) => {
    const [loading, setLoading] = useState(true)
    const [analytics, setAnalytics] = useState({})
    const [timeRange, setTimeRange] = useState('30') // days
    const [selectedMetric, setSelectedMetric] = useState('overview')

    useEffect(() => {
        loadAnalytics()
    }, [timeRange])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/analytics/dashboard?days=${timeRange}`)
            if (response.data.success) {
                setAnalytics(response.data.data)
            }
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0)
    }

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`
    }

    const getStatusColor = (status, type = 'bg') => {
        const colors = {
            approved: type === 'bg' ? 'bg-green-500' : 'text-green-600',
            pending: type === 'bg' ? 'bg-yellow-500' : 'text-yellow-600',
            rejected: type === 'bg' ? 'bg-red-500' : 'text-red-600'
        }
        return colors[status] || (type === 'bg' ? 'bg-gray-500' : 'text-gray-600')
    }

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const {
        totals = {},
        enrollment_stats = {},
        aid_request_stats = {},
        conversion_rates = {},
        trends = {},
        top_caseworkers = [],
        recent_activity = []
    } = analytics

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                    <p className="text-gray-600">System performance and workflow metrics</p>
                </div>
                <div className="flex space-x-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Beneficiaries</dt>
                                <dd className="text-lg font-medium text-gray-900">{totals.beneficiaries || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Approved Enrollments</dt>
                                <dd className="text-lg font-medium text-gray-900">{enrollment_stats.approved || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Approved Aid Requests</dt>
                                <dd className="text-lg font-medium text-gray-900">{aid_request_stats.approved || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Aid Disbursed</dt>
                                <dd className="text-lg font-medium text-gray-900">{formatCurrency(totals.aid_disbursed)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Verification Stats */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Verification Status</h3>
                    <div className="space-y-4">
                        {Object.entries(enrollment_stats).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`}></div>
                                    <span className="text-sm font-medium capitalize">{status}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">{count}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatPercentage((count / Object.values(enrollment_stats).reduce((a, b) => a + b, 0)) * 100)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aid Request Stats */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Aid Request Status</h3>
                    <div className="space-y-4">
                        {Object.entries(aid_request_stats).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`}></div>
                                    <span className="text-sm font-medium capitalize">{status}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">{count}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatPercentage((count / Object.values(aid_request_stats).reduce((a, b) => a + b, 0)) * 100)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Rates */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Rates</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Enrollment Approval Rate</span>
                            <span className="text-sm font-medium text-green-600">
                                {formatPercentage(conversion_rates.enrollment_approval_rate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Aid Request Approval Rate</span>
                            <span className="text-sm font-medium text-green-600">
                                {formatPercentage(conversion_rates.aid_approval_rate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Enrollment to Aid Conversion</span>
                            <span className="text-sm font-medium text-blue-600">
                                {formatPercentage(conversion_rates.enrollment_to_aid_conversion)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Caseworkers */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Caseworkers</h3>
                    <div className="space-y-3">
                        {top_caseworkers.slice(0, 5).map((caseworker, index) => (
                            <div key={caseworker.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white text-xs font-medium">{index + 1}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {caseworker.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {caseworker.beneficiaries_count} beneficiaries
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {caseworker.reviews_completed}
                                    </div>
                                    <div className="text-xs text-gray-500">reviews</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {recent_activity.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {recent_activity.slice(0, 10).map((activity, activityIdx) => (
                                <li key={activity.id}>
                                    <div className="relative pb-8">
                                        {activityIdx !== recent_activity.length - 1 ? (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                    activity.type === 'approved' ? 'bg-green-500' :
                                                    activity.type === 'rejected' ? 'bg-red-500' :
                                                    activity.type === 'submitted' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}>
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        {activity.description}
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    {new Date(activity.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AnalyticsDashboard