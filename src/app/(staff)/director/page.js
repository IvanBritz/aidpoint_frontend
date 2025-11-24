'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'
import NotificationBell from '@/components/NotificationBell'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import echo from '@/lib/echo'

const DirectorDashboard = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [metrics, setMetrics] = useState({})
    const [pendingApprovals, setPendingApprovals] = useState([])
    const [fundsSummary, setFundsSummary] = useState(null)
    const [pendingFundCount, setPendingFundCount] = useState(0)
    const [pendingLiqCount, setPendingLiqCount] = useState(0)
    const [refreshTick, setRefreshTick] = useState(0)

    const handleRefresh = () => setRefreshTick(t => t + 1)

    // Check if user is director
    useEffect(() => {
        if (user && user.system_role) {
            const roleName = user.system_role.name?.toLowerCase()
            if (roleName !== 'director') {
                // Redirect non-directors
                switch (roleName) {
                    case 'admin':
                        router.push('/admin-dashboard')
                        break
                    case 'caseworker':
                    case 'finance':
                        router.push('/staff-dashboard')
                        break
                    case 'beneficiary':
                        router.push('/dashboard')
                        break
                    default:
                        router.push('/dashboard')
                }
            }
        }
    }, [user, router])

    // Load dashboard data
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user || user.system_role?.name?.toLowerCase() !== 'director') return

            try {
                setLoading(true)
                setError(null)

                // Load multiple data sources in parallel
                const [
                    facilityRes,
                    analyticsRes,
                    notificationsRes,
                    auditRes,
                    approvalsRes,
                    fundsRes,
                    liqRes,
                    fundPendingRes
                ] = await Promise.allSettled([
                    axios.get('/api/director/facility-overview'),
                    axios.get('/api/analytics/dashboard?days=30'),
                    axios.get('/api/notifications?per_page=10'),
                    axios.get('/api/audit-logs?per_page=10&category=financial'),
                    axios.get('/api/director/pending-approvals'),
                    axios.get('/api/funds/facility-dashboard'),
                    axios.get('/api/liquidations/pending-approvals'),
                    axios.get('/api/aid-requests/director/pending?per_page=1')
                ])

                // Process facility data
                if (facilityRes.status === 'fulfilled' && facilityRes.value.data.success) {
                    setDashboardData(facilityRes.value.data.data)
                }

                // Process analytics data
                if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
                    setMetrics(analyticsRes.value.data.data)
                }

                // Process notifications
                if (notificationsRes.status === 'fulfilled' && notificationsRes.value.data.success) {
                    setNotifications(notificationsRes.value.data.data?.data || [])
                }

                // Process audit logs
                if (auditRes.status === 'fulfilled' && auditRes.value.data.success) {
                    setAuditLogs(auditRes.value.data.data?.data || [])
                }

                // Process pending approvals
                if (approvalsRes.status === 'fulfilled' && approvalsRes.value.data.success) {
                    const list = approvalsRes.value.data.data || []
                    setPendingApprovals(list)
                    // Derive counts per type as a fallback
                    setPendingLiqCount(list.filter(i => i.type === 'liquidation').length)
                    setPendingFundCount(list.filter(i => i.type !== 'liquidation').length)
                }

                // Facility funds summary (allocations across center)
                if (fundsRes.status === 'fulfilled' && fundsRes.value.data.success) {
                    setFundsSummary(fundsRes.value.data.data)
                }

                // Pending liquidations count (role-aware endpoint)
                if (liqRes.status === 'fulfilled') {
                    const data = liqRes.value.data
                    const liqCount = Array.isArray(data) ? data.length : (data?.count ?? (data?.data?.length || 0))
                    if (typeof liqCount === 'number') setPendingLiqCount(liqCount)
                }

                // Pending fund requests count (director final stage)
                if (fundPendingRes.status === 'fulfilled') {
                    const page = fundPendingRes.value.data?.data
                    const total = page?.total ?? (Array.isArray(page?.data) ? page.data.length : 0)
                    if (typeof total === 'number') setPendingFundCount(total)
                }

            } catch (error) {
                console.error('Error loading dashboard data:', error)
                setError(error.message || 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()
        
        // Set up real-time updates every 30 seconds
        const interval = setInterval(() => {
            if (!loading) { // Only refresh if not already loading
                loadDashboardData()
            }
        }, 30000)
        
        return () => clearInterval(interval)
    }, [user, loading, refreshTick])

    useEffect(() => {
        if (!echo) return
        if (user?.system_role?.name?.toLowerCase() !== 'director') return
        const fid = dashboardData?.facility?.id
        if (!fid) return
        const channel = echo.private(`facility.${fid}.audit`)
        channel.listen('.audit.log.recorded', (event) => {
            setAuditLogs(prev => [
                {
                    id: event.id,
                    event_type: event.event_type,
                    event_category: event.event_category,
                    description: event.description,
                    event_data: event.event_data,
                    user: event.user,
                    risk_level: event.risk_level,
                    created_at: event.created_at,
                    event_type_color: 'bg-blue-100 text-blue-800',
                    risk_level_color: 'bg-blue-100 text-blue-800',
                },
                ...prev
            ])
        })
        return () => {
            channel.stopListening('.audit.log.recorded')
            echo.leave(`facility.${fid}.audit`)
        }
    }, [dashboardData?.facility?.id, user])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Tiny inline SVG sparkline without external libs
    const Sparkline = ({ data, color = '#2563eb', height = 28 }) => {
        if (!Array.isArray(data) || data.length < 2) return null
        const w = 120
        const h = height
        const min = Math.min(...data)
        const max = Math.max(...data)
        const span = max - min || 1
        const pts = data.map((v, i) => [
            (i / (data.length - 1)) * w,
            h - ((Number(v) - min) / span) * h
        ])
        const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
        return (
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-2">
                <path d={d} fill="none" stroke={color} strokeWidth="2" />
            </svg>
        )
    }

    // Access trend arrays safely from analytics
    const getTrend = (keys = []) => {
        const t = metrics?.trends || {}
        for (const k of keys) {
            const arr = t?.[k]
            if (Array.isArray(arr) && arr.length > 1) return arr.map(n => Number(n) || 0)
        }
        return null
    }

    const getFullName = () => {
        if (!user) return 'Loading...'
        const parts = [user.firstname, user.middlename, user.lastname].filter(part => part && part.trim())
        return parts.join(' ') || 'Unknown User'
    }

    if (!user) return <Loading />

    // Check if user is director
    if (user.system_role?.name?.toLowerCase() !== 'director') {
        return <Loading />
    }

    return (
        <>
            <Header title="Center Dashboard" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        
                        {/* Header Section */}
                        <div className="bg-white shadow-sm rounded-lg mb-6 sm:mb-8 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-6 sm:py-8">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                                            Welcome, {getFullName()}
                                        </h1>
                                        <p className="text-blue-100 mt-2">Director Dashboard</p>
                                        <p className="text-blue-50 text-sm mt-1 hidden sm:block">
                                            Manage your financial aid center operations
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                                        <NotificationBell 
                                            userId={user?.id} 
                                            userRole="director"
                                        />
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-white font-semibold text-sm sm:text-base truncate max-w-32 sm:max-w-none">
                                                {dashboardData?.facility?.center_name || 'Loading...'}
                                            </div>
                                            <div className="text-blue-100 text-xs sm:text-sm">
                                                {dashboardData?.facility?.center_id || ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Info Bar */}
                            {dashboardData?.facility && (
                                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-gray-700">
                                                <span className="font-medium">Location:</span> {dashboardData.facility.location}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-gray-700">
                                                <span className="font-medium">Status:</span> 
                                                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                                    {dashboardData.facility.status || 'Active'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v2m0 0v2m0-2h2m-2 0h-2m-2-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                                            </svg>
                                            <span className="text-gray-700">
                                                <span className="font-medium">Registered:</span> {formatDate(dashboardData.facility.registration_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            {/* Total Staff */}
                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-500">Total Staff</p>
                                        <div className="flex items-baseline">
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {metrics?.totals?.employees || dashboardData?.staff_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Beneficiaries */}
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-500">Active Beneficiaries</p>
                                        <div className="flex items-baseline">
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {metrics?.totals?.beneficiaries || dashboardData?.beneficiary_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Approvals (combined) */}
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-2xl font-semibold text-gray-900">{(pendingFundCount + pendingLiqCount) || pendingApprovals.length || 0}</p>
                                            <span className="text-xs text-gray-500">({pendingFundCount} fund, {pendingLiqCount} liquidation)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Aid Disbursed */}
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-500">Aid Disbursed</p>
                                        <div className="flex items-baseline">
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {formatCurrency(metrics?.totals?.aid_disbursed || dashboardData?.total_aid_disbursed || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <a href="/director/employees" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">Manage Staff</p>
                                        <p className="text-sm text-gray-500">Add, edit, and manage employees</p>
                                    </div>
                                </a>

                                <a href="/director/beneficiaries" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">View Beneficiaries</p>
                                        <p className="text-sm text-gray-500">Monitor beneficiary status</p>
                                    </div>
                                </a>

                                <a href="/director/subscriptions" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">Subscriptions</p>
                                        <p className="text-sm text-gray-500">Manage fund subscriptions</p>
                                    </div>
                                </a>

                                <a href="/audit-logs" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">Audit Logs</p>
                                        <p className="text-sm text-gray-500">View system activity</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Approvals Overview (separate counts) */}
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">Approvals Overview</h3>
                            <button onClick={handleRefresh} className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                Refresh
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="ml-3 text-sm font-medium text-gray-700">Pending Fund Approvals</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a className="text-xs text-blue-600 hover:text-blue-800" href="/director-pending-fund-requests">View</a>
                                        <button onClick={handleRefresh} className="p-1 rounded hover:bg-gray-50" title="Refresh">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-3 text-2xl font-semibold text-gray-900">{pendingFundCount}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="ml-3 text-sm font-medium text-gray-700">Pending Liquidation Approvals</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a className="text-xs text-blue-600 hover:text-blue-800" href="/director-liquidation">Review</a>
                                        <button onClick={handleRefresh} className="p-1 rounded hover:bg-gray-50" title="Refresh">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-3 text-2xl font-semibold text-gray-900">{pendingLiqCount}</p>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            
                            {/* Left Column - Analytics */}
                            <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
                                {/* Finance Allocation Summary */}
                                {fundsSummary && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900">Finance Allocation Summary</h3>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={handleRefresh} className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                        Refresh
                                                    </button>
                                                    <a href="/fund-management" className="text-sm text-blue-600 hover:text-blue-800">Manage funds</a>
                                                </div>
                                            </div>

                                            {/* Totals */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                                {(() => {
                                                    const trendAllocated = getTrend(['funds_allocated', 'allocations'])
                                                    const trendUtilized = getTrend(['aid_disbursed', 'disbursed', 'aid_requests_approved_amounts'])
                                                    const trendRemaining = trendAllocated && trendUtilized
                                                        ? trendAllocated.map((a, i) => Math.max(0, a - (trendUtilized[i] || 0)))
                                                        : null
                                                    const items = [
                                                        {label: 'Allocated', value: fundsSummary.total_allocated, color: 'bg-blue-500', line: trendAllocated, stroke: '#3b82f6'},
                                                        {label: 'Utilized', value: fundsSummary.total_utilized, color: 'bg-green-500', line: trendUtilized, stroke: '#10b981'},
                                                        {label: 'Remaining', value: fundsSummary.total_remaining, color: 'bg-purple-500', line: trendRemaining, stroke: '#8b5cf6'},
                                                    ]
                                                    return items.map((it) => (
                                                        <div key={it.label} className="p-4 rounded-md border">
                                                            <p className="text-sm text-gray-500">{it.label}</p>
                                                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(it.value)}</p>
                                                            <div className="mt-2 h-2 w-full bg-gray-100 rounded">
                                                                <div className={`${it.color} h-2 rounded`} style={{ width: `${Math.min(100, (it.value / Math.max(1, fundsSummary.total_allocated)) * 100)}%` }}></div>
                                                            </div>
                                                            {it.line && <Sparkline data={it.line} color={it.stroke} />}
                                                        </div>
                                                    ))
                                                })()}
                                            </div>

                                            {/* By Fund Type */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700">By Fund Type</h4>
                                                    <button onClick={handleRefresh} className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                        Refresh
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {Object.entries(fundsSummary.fund_types || {}).map(([type, vals]) => {
                                                        const total = vals.allocated || 0
                                                        const utilizedPct = total > 0 ? (vals.utilized / total) * 100 : 0
                                                        return (
                                                            <div key={type}>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="capitalize text-gray-700">{type}</span>
                                                                    <span className="text-gray-500">{formatCurrency(vals.utilized)} / {formatCurrency(total)}</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-gray-100 rounded">
                                                                    <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, utilizedPct)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sponsors */}
                                {fundsSummary && Array.isArray(fundsSummary.allocations) && fundsSummary.allocations.length > 0 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900">Sponsors</h3>
                                                <button onClick={handleRefresh} className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                    Refresh
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {Object.values((fundsSummary.allocations || []).reduce((acc, a) => {
                                                    const name = a.sponsor_name || 'Unknown'
                                                    if (!acc[name]) acc[name] = { name, allocated: 0, utilized: 0 }
                                                    acc[name].allocated += Number(a.allocated_amount) || 0
                                                    acc[name].utilized += Number(a.utilized_amount) || 0
                                                    return acc
                                                }, {})).slice(0, 6).map((s) => {
                                                    const pct = s.allocated > 0 ? (s.utilized / s.allocated) * 100 : 0
                                                    return (
                                                        <div key={s.name} className="border rounded-md p-3">
                                                            <div className="flex items-center justify-between text-sm mb-1">
                                                                <span className="font-medium text-gray-800 truncate pr-2">{s.name}</span>
                                                                <span className="text-gray-500">{formatCurrency(s.utilized)} / {formatCurrency(s.allocated)}</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-gray-100 rounded">
                                                                <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.min(100, pct)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <AnalyticsDashboard userRole="director" />
                            </div>

                            {/* Right Column - Recent Activity & Notifications */}
                            <div className="space-y-6 lg:space-y-8 order-1 lg:order-2">
                                
                                {/* Pending Approvals */}
                                {pendingApprovals.length > 0 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                Pending Final Approvals
                                            </h3>
                                            <div className="space-y-3">
                                                {pendingApprovals.slice(0, 5).map((approval) => (
                                                    <div key={approval.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {approval.type === 'liquidation' ? 'Liquidation' : 'Fund Request'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatCurrency(approval.amount)}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {formatDate(approval.created_at)}
                                                            </p>
                                                        </div>
                                                        <a 
                                                            href={approval.type === 'liquidation' ? '/director-liquidation' : '/director-pending-fund-requests'}
                                                            className="ml-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            Review
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                            {pendingApprovals.length > 5 && (
                                                <div className="mt-4 text-center">
                                                    <a href="/director-pending-fund-requests" className="text-sm text-blue-600 hover:text-blue-800">
                                                        View all {pendingApprovals.length} pending approvals
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Notifications */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Recent Notifications
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {notifications.filter(n => !n.read_at).length} new
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {notifications.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    No notifications yet
                                                </p>
                                            ) : (
                                                notifications.slice(0, 5).map((notification) => (
                                                    <div key={notification.id} className={`p-3 rounded-lg border ${!notification.read_at ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {notification.title || notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatDate(notification.created_at)}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Recent Activity
                                        </h3>
                                        <div className="space-y-3">
                                            {auditLogs.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    No recent activity
                                                </p>
                                            ) : (
                                                auditLogs.slice(0, 5).map((log) => (
                                                    <div key={log.id} className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-2 h-2 rounded-full mt-2 ${
                                                                log.event_type?.includes('approved') ? 'bg-green-400' :
                                                                log.event_type?.includes('rejected') ? 'bg-red-400' :
                                                                log.event_type?.includes('created') ? 'bg-blue-400' :
                                                                'bg-gray-400'
                                                            }`}></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900">
                                                                {log.description}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {formatDate(log.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="mt-4 text-center">
                                            <a href="/audit-logs" className="text-sm text-blue-600 hover:text-blue-800">
                                                View all activity logs
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                        {/* Loading/Error States */}
                        {loading && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                                    <Loading />
                                    <span className="text-gray-600">Loading dashboard...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default DirectorDashboard