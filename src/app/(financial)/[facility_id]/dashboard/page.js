'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import { useAuth } from '@/hooks/auth'
import NotificationBell from '@/components/NotificationBell'

const Dashboard = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const { facility_id } = useParams()
    const [facility, setFacility] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // High-level stats cards
    const [stats, setStats] = useState({
        employees: 0,
        beneficiaries: 0,
        pendingAidApprovals: 0,
        pendingLiquidationApprovals: 0,
        completedLiquidations: 0,
    })

    // Finance allocation summary for the facility (director view)
    const [finance, setFinance] = useState({
        total_allocated: 0,
        total_utilized: 0,
        total_remaining: 0,
        fund_types: { tuition: {}, cola: {}, other: {} },
        allocations: [],
        sponsors: []
    })

    useEffect(() => {
        let isMounted = true

        const fetchAllData = async () => {
            try {
                // Try optimized endpoint first, fallback to old method if it fails
                let facilityData, statsData, financeData
                
                try {
                    // Use optimized endpoint that returns all data in one request
                    const response = await axios.get('/api/director/dashboard-data', { params: { facility_id } })

                    if (!isMounted) return

                    if (response.data.success) {
                        ({ facility: facilityData, stats: statsData, finance: financeData } = response.data.data)
                    } else {
                        throw new Error('Optimized endpoint failed')
                    }
                } catch (optimizedError) {
                    console.log('Optimized endpoint not available, using fallback method')
                    // Fallback to original method: parallel API calls
                    const [facilityRes, overviewRes, pendingAidRes, pendingLiqRes, financeRes] = await Promise.all([
                        axios.get('/api/my-facilities'),
                        axios.get('/api/director/facility-overview').catch(() => ({ data: { success: false } })),
                        axios.get('/api/aid-requests/director/pending?per_page=1').catch(() => ({ data: {} })),
                        axios.get('/api/liquidations/pending-approvals').catch(() => ({ data: {} })),
                        axios.get('/api/funds/facility-dashboard').catch(() => ({ data: { success: false } })),
                    ])

                    if (!isMounted) return

                    // Validate facility
                    if (facilityRes.data.length === 0) {
                        setError('No facility found')
                        setIsLoading(false)
                        return
                    }

                    const userFacility = facilityRes.data[0]
                    if (userFacility.id?.toString() !== facility_id) {
                        setError('Facility not found or access denied')
                        setIsLoading(false)
                        return
                    }

                    // Process stats from fallback
                    const employees = overviewRes.data.success ? (overviewRes.data.data?.staff_count ?? 0) : 0
                    const beneficiaries = overviewRes.data.success ? (overviewRes.data.data?.beneficiary_count ?? 0) : 0
                    const pendingAidApprovals = pendingAidRes.data?.data?.total ?? pendingAidRes.data?.total ?? 0
                    
                    let pendingLiquidationApprovals = 0
                    if (typeof pendingLiqRes.data?.count === 'number') {
                        pendingLiquidationApprovals = pendingLiqRes.data.count
                    } else if (Array.isArray(pendingLiqRes.data?.data)) {
                        pendingLiquidationApprovals = pendingLiqRes.data.data.length
                    }

                    // Process finance from fallback
                    let financeSum = {
                        total_allocated: 0,
                        total_utilized: 0,
                        total_remaining: 0,
                        fund_types: {},
                        sponsors: []
                    }

                    if (financeRes.data?.success) {
                        const data = financeRes.data.data
                        const allocations = data.allocations || []
                        const sponsorSet = new Set(allocations.map(a => a.sponsor_name).filter(Boolean))
                        financeSum = {
                            total_allocated: data.total_allocated || 0,
                            total_utilized: data.total_utilized || 0,
                            total_remaining: data.total_remaining || 0,
                            fund_types: data.fund_types || {},
                            sponsors: Array.from(sponsorSet)
                        }
                    }

                    // Set data from fallback
                    facilityData = userFacility
                    statsData = {
                        staff_count: employees,
                        beneficiary_count: beneficiaries,
                        pending_aid_approvals: pendingAidApprovals,
                        pending_liquidation_approvals: pendingLiquidationApprovals
                    }
                    financeData = financeSum
                }

                if (!isMounted) return

                // Validate facility ID matches
                if (facilityData.id?.toString() !== facility_id) {
                    setError('Facility not found or access denied')
                    setIsLoading(false)
                    return
                }

                // Set facility data
                setFacility({
                    id: facilityData.id,
                    center_id: facilityData.center_id,
                    center_name: facilityData.center_name,
                    location: facilityData.location,
                    status: facilityData.status,
                    isManagable: facilityData.status === 'active' || facilityData.isManagable
                })

                // Set stats
                setStats({
                    employees: statsData.staff_count ?? 0,
                    beneficiaries: statsData.beneficiary_count ?? 0,
                    pendingAidApprovals: statsData.pending_aid_approvals ?? 0,
                    pendingLiquidationApprovals: statsData.pending_liquidation_approvals ?? 0,
                    completedLiquidations: 0,
                })

                // Set finance data
                setFinance({
                    total_allocated: financeData.total_allocated ?? 0,
                    total_utilized: financeData.total_utilized ?? 0,
                    total_remaining: financeData.total_remaining ?? 0,
                    fund_types: financeData.fund_types ?? {},
                    allocations: [],
                    sponsors: financeData.sponsors ?? []
                })

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                if (isMounted) {
                    setError('Failed to load dashboard data')
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        if (facility_id && user) {
            fetchAllData()
        }

        return () => {
            isMounted = false
        }
    }, [facility_id, user])




    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <h1 className="text-xl font-semibold text-gray-700 ml-4">Loading dashboard...</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Center Dashboard</h1>
                            <p className="text-red-600 mb-6">{error}</p>
                            <Button 
                                onClick={() => router.push('/facility-registration')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Register Center
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!facility) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                                <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">No Center Found</h1>
                            <p className="text-gray-600 mt-2">Please contact your administrator or register a new center.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{facility.center_name}</h1>
                                    <p className="text-sm text-gray-500 mt-1">Center ID: {facility.center_id}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                        facility.isManagable 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                        {facility.isManagable ? 'Active' : 'Pending'}
                                    </span>
                                    {user && (
                                        <NotificationBell 
                                            userId={user.id} 
                                            userRole={user.system_role?.name?.toLowerCase()}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Welcome Message */}
                        <div className="px-8 py-6">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                                <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.name || 'User'}!</h2>
                                <p className="text-blue-100">Manage your center operations from this dashboard. Track staff, beneficiaries, and system activities.</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Employees */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.employees}</p>
                                </div>
                            </div>
                        </div>

                        {/* Beneficiaries */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Beneficiaries</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.beneficiaries}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending aid request approvals (director) */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-yellow-100">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Request Approvals</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pendingAidApprovals}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending liquidation approvals */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-purple-100">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Liquidation Approvals</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pendingLiquidationApprovals}</p>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Finance Allocation Summary */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Finance Allocation Summary</h2>
                            <div className="text-sm text-gray-500">Sponsors: <span className="font-semibold text-gray-700">{finance.sponsors.length}</span></div>
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <p className="text-sm text-blue-700 mb-1">Total Allocated</p>
                                <p className="text-2xl font-bold text-blue-900">₱{(finance.total_allocated || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                                <p className="text-sm text-green-700 mb-1">Utilized</p>
                                <p className="text-2xl font-bold text-green-900">₱{(finance.total_utilized || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                                <p className="text-sm text-purple-700 mb-1">Remaining</p>
                                <p className="text-2xl font-bold text-purple-900">₱{(finance.total_remaining || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Fund type breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(finance.fund_types || {}).map(([type, vals]) => {
                                const allocated = vals?.allocated || 0
                                const utilized = vals?.utilized || 0
                                const remaining = Math.max(0, allocated - utilized)
                                const pct = allocated > 0 ? Math.min(100, Math.round((utilized / allocated) * 100)) : 0
                                const label = type.charAt(0).toUpperCase() + type.slice(1)
                                return (
                                    <div key={type} className="border rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-800">{label}</h4>
                                            <span className="text-sm text-gray-500">{pct}% used</span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-3 bg-indigo-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <div className="text-gray-500">Allocated</div>
                                                <div className="font-medium text-gray-900">₱{allocated.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Utilized</div>
                                                <div className="font-medium text-gray-900">₱{utilized.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Remaining</div>
                                                <div className="font-medium text-gray-900">₱{remaining.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Sponsors list */}
                        {finance.sponsors.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sponsors</h3>
                                <div className="flex flex-wrap gap-2">
                                    {finance.sponsors.map(name => (
                                        <span key={name} className="px-3 py-1 rounded-full bg-gray-100 border text-gray-700 text-sm">{name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Dashboard