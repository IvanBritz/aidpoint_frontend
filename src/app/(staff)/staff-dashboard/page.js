'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'
import TempPasswordModal from '@/components/TempPasswordModal'
import BeneficiaryEditModal from '@/components/BeneficiaryEditModal'
import SubmissionReviewModal from '@/components/SubmissionReviewModal'
import NotificationBell from '@/components/NotificationBell'

const Dashboard = () => {
    const { user } = useAuth({ middleware: 'auth' })

    const [assigned, setAssigned] = useState([])
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tempModal, setTempModal] = useState({ open: false, email: '', password: '' })
    const [editModal, setEditModal] = useState({ open: false, beneficiary: null })
    const [pendingSubs, setPendingSubs] = useState([])
    const [subLoading, setSubLoading] = useState(false)
    const [reviewModal, setReviewModal] = useState({ open: false, submission: null })
    const [downloadingDoc, setDownloadingDoc] = useState(null)
    // Aid requests pending for caseworker
    const [aidPending, setAidPending] = useState([])
    const [aidLoading, setAidLoading] = useState(false)
    const [aidActing, setAidActing] = useState(null)

    // Derived sponsors from allocations
    const sponsorStats = (dashboardData?.allocations || []).reduce((acc, a) => {
        const name = a?.sponsor_name || 'Unknown'
        if (!acc[name]) {
            acc[name] = { name, count: 0, totalAllocated: 0, totalUtilized: 0, totalRemaining: 0 }
        }
        acc[name].count += 1
        acc[name].totalAllocated += parseFloat(a?.allocated_amount) || 0
        acc[name].totalUtilized += parseFloat(a?.utilized_amount) || 0
        acc[name].totalRemaining += parseFloat(a?.remaining_amount) || 0
        return acc
    }, {})
    const sponsorList = Object.values(sponsorStats).sort((a, b) => a.name.localeCompare(b.name))

    // Get user's full name
    const getFullName = () => {
        if (!user) return 'Loading...'
        const parts = [user.firstname, user.middlename, user.lastname].filter(part => part && part.trim())
        return parts.join(' ') || 'Unknown User'
    }
    
    // Get user's position/role
    const getPosition = () => {
        if (!user?.system_role?.name) return 'Unknown Position'
        const roleName = user.system_role.name.toLowerCase()
        
        // Format role names for display
        switch (roleName) {
            case 'caseworker':
                return 'Caseworker'
            case 'finance':
                return 'Finance Officer'
            case 'director':
                return 'Director'
            case 'admin':
                return 'Administrator'
            default:
                return user.system_role.name.charAt(0).toUpperCase() + user.system_role.name.slice(1)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            
            const roleName = user?.system_role?.name?.toLowerCase()
            
            try {
                if (roleName === 'caseworker') {
                    // Load assigned beneficiaries for caseworkers
                    const res = await axios.get('/api/my-assigned-beneficiaries')
                    const page = res.data?.data || res.data
                    const items = page?.data ?? []
                    setAssigned(items)
                    // Load pending document submissions
                    setSubLoading(true)
                    try {
const sres = await axios.get('/api/beneficiary-document-submissions/pending')
                        const sPage = sres.data?.data
                        const sItems = sPage?.data ?? []
                        setPendingSubs(sItems)
                    } finally {
                        setSubLoading(false)
                    }
                    // Load pending aid requests
                    setAidLoading(true)
                    try {
const ar = await axios.get('/api/aid-requests/pending')
                        const aPage = ar.data?.data
                        const aItems = aPage?.data ?? []
                        setAidPending(aItems)
                    } finally {
                        setAidLoading(false)
                    }
                } else if (roleName === 'finance' || roleName === 'director') {
                    // Load fund dashboard data for finance officers and directors
                    const res = await axios.get('/api/funds/dashboard')
                    setDashboardData(res.data.data)
                }
            } catch (_) {
                if (roleName === 'caseworker') {
                    setAssigned([])
                } else if (roleName === 'finance' || roleName === 'director') {
                    setDashboardData(null)
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [user?.id])
    
    
    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        const now = new Date()
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`
        
        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays}d ago`
        
        return date.toLocaleDateString()
    }
    
    // Format date for display  
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
    

    const downloadDocument = async (path, documentType) => {
        if (downloadingDoc === documentType) return // Prevent multiple downloads
        
        setDownloadingDoc(documentType)
        try {
            const response = await axios.get(`/api/documents/${path}`, {
                responseType: 'blob', // Important for binary data
                headers: {
                    'Accept': '*/*'
                },
                timeout: 30000 // 30 second timeout
            })
            
            // Get the filename from response headers or create one
            const contentDisposition = response.headers['content-disposition']
            const contentType = response.headers['content-type'] || ''
            let ext = 'bin'
            if (contentType.includes('jpeg')) ext = 'jpg'
            else if (contentType.includes('png')) ext = 'png'
            else if (contentType.includes('gif')) ext = 'gif'
            else if (contentType.includes('webp')) ext = 'webp'
            let filename = `${documentType}.${ext}`
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=\"?([^\"]+)\"?/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }
            
            // Validate response is actually image or binary data
            if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
                throw new Error('Invalid file format received')
            }
            
            // Use the response blob as-is
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType || 'application/octet-stream' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
        } catch (error) {
            console.error('Download failed:', error)
            let errorMessage = 'Failed to download document. Please try again.'
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Download timed out. Please try again.'
            } else if (error.response?.status === 404) {
                errorMessage = 'Document not found.'
            } else if (error.response?.status === 401) {
                errorMessage = 'You are not authorized to download this document.'
            }
            
            alert(errorMessage)
        } finally {
            setDownloadingDoc(null)
        }
    }

    return (
        <>
            <Header title="Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="bg-white overflow-visible shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {getFullName()}</h1>
                                        <div className="flex items-center gap-3">
                                            {user?.system_role?.name?.toLowerCase() === 'finance' && (
                                                <NotificationBell userId={user?.id} userRole={user?.system_role?.name?.toLowerCase()} />
                                            )}
                                            {['finance','director'].includes(user?.system_role?.name?.toLowerCase()) && dashboardData?.facility && (
                                                <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-blue-800 shadow-sm ring-1 ring-blue-200">
                                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a1 1 0 011-1h1V5a2 2 0 012-2h8a2 2 0 012 2v4h1a1 1 0 110 2h-1v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4H3a1 1 0 01-1-1zm5-5a1 1 0 00-1 1v4h8V6a1 1 0 00-1-1H7z"/></svg>
                                                    <span className="font-medium">{dashboardData.facility.center_name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-lg text-blue-700 font-medium">{getPosition()}</p>
                                    {user?.email && (
                                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                                    )}
                                    {['finance','director'].includes(user?.system_role?.name?.toLowerCase()) && dashboardData?.facility && (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a1 1 0 011-1h1V5a2 2 0 012-2h8a2 2 0 012 2v4h1a1 1 0 110 2h-1v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4H3a1 1 0 01-1-1zm5-5a1 1 0 00-1 1v4h8V6a1 1 0 00-1-1H7z"/></svg>
                                                <span><span className="font-medium text-gray-900">Center:</span> {dashboardData.facility.center_name}</span>
                                            </div>
                                            {dashboardData.facility.director && (
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/></svg>
                                                    <span className="truncate"><span className="font-medium text-gray-900">Director:</span> {`${dashboardData.facility.director.firstname || ''} ${dashboardData.facility.director.middlename || ''} ${dashboardData.facility.director.lastname || ''}`.replace(/\s+/g,' ').trim()} ({dashboardData.facility.director.email})</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    

                    {/* Finance Dashboard */}
                    {['finance','director'].includes(user?.system_role?.name?.toLowerCase()) && (
                        <>
                            {dashboardData ? (
                                <>
                                    {/* Fund Overview Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
<div className="bg-white overflow-hidden shadow-sm sm:rounded-lg ring-1 ring-gray-100 hover:shadow-md transition">
                                            <div className="p-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            ₱{dashboardData.total_allocated?.toFixed(2) || '0.00'}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Total Allocated</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
<div className="bg-white overflow-hidden shadow-sm sm:rounded-lg ring-1 ring-gray-100 hover:shadow-md transition">
                                            <div className="p-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-2xl font-bold text-orange-600">
                                                            ₱{dashboardData.total_utilized?.toFixed(2) || '0.00'}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Total Utilized</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
<div className="bg-white overflow-hidden shadow-sm sm:rounded-lg ring-1 ring-gray-100 hover:shadow-md transition">
                                            <div className="p-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-2xl font-bold text-green-600">
                                                            ₱{dashboardData.total_remaining?.toFixed(2) || '0.00'}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Total Remaining</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                            <div className="p-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {dashboardData.allocations?.length || 0}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Fund Allocations</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Fund Types with Progress Bars */}
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                                        <div className="p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-xl font-semibold text-gray-900">Fund Allocation Summary</h2>
                                                {user?.system_role?.name?.toLowerCase() === 'finance' && (
                                                    <div className="flex gap-2">
                                                        <a 
                                                            href="/cash-disbursement" 
                                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M11 17a1 1 0 01-1 1H7a1 1 0 110-2h3a1 1 0 011 1zM4 4h12a1 1 0 011 1v6a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1z"/>
                                                            </svg>
                                                            Cash Disbursement
                                                        </a>
                                                        <a 
                                                            href="/liquidation-completed" 
                                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                            </svg>
                                                            Completed Liquidations
                                                        </a>
                                                        <a 
                                                            href="/fund-management" 
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                                            </svg>
                                                            Manage Funds
                                                        </a>
                                                    </div>
                                                )}
                                                {user?.system_role?.name?.toLowerCase() === 'director' && (
                                                    <div className="flex gap-2">
                                                        <a 
                                                            href="/director-liquidation" 
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                            </svg>
                                                            Liquidation Approvals
                                                        </a>
                                                        <a 
                                                            href="/liquidation-completed" 
                                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                            </svg>
                                                            Completed Liquidations
                                                        </a>
                                                        <a 
                                                            href="/director-pending-fund-requests" 
                                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                            </svg>
                                                            Final Approvals
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-6">
                                                {/* Tuition Funds */}
                                                <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a1 1 0 00.364.081zm2.97-2.061A9.026 9.026 0 0015 14.935v-3.957l-1.818.78a1 1 0 01-.364.081L12.27 14.512zM17 10.12c-.51.076-1.04.135-1.5.08a1 1 0 01-.89-.89 11.115 11.115 0 00.25-3.762L17 6.88v3.24z"/>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-medium text-gray-900">Tuition Assistance</h3>
                                                                <p className="text-sm text-gray-600">Educational support funds</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                ₱{dashboardData.fund_types?.tuition?.allocated?.toFixed(2) || '0.00'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">Total Allocated</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dashboardData.fund_types?.tuition?.allocated > 0 && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span>Progress: {Math.round((dashboardData.fund_types?.tuition?.utilized / dashboardData.fund_types?.tuition?.allocated) * 100) || 0}% Utilized</span>
                                                                <span>₱{dashboardData.fund_types?.tuition?.remaining?.toFixed(2) || '0.00'} remaining</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-blue-500 h-2 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.round((dashboardData.fund_types?.tuition?.utilized / dashboardData.fund_types?.tuition?.allocated) * 100) || 0)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div className="text-center">
                                                            <div className="font-medium text-blue-600">₱{dashboardData.fund_types?.tuition?.allocated?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Allocated</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-orange-600">₱{dashboardData.fund_types?.tuition?.utilized?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Utilized</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-green-600">₱{dashboardData.fund_types?.tuition?.remaining?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Remaining</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* COLA Funds */}
                                                <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-medium text-gray-900">COLA (Cost of Living Allowance)</h3>
                                                                <p className="text-sm text-gray-600">Living expense assistance</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-yellow-600">
                                                                ₱{dashboardData.fund_types?.cola?.allocated?.toFixed(2) || '0.00'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">Total Allocated</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dashboardData.fund_types?.cola?.allocated > 0 && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span>Progress: {Math.round((dashboardData.fund_types?.cola?.utilized / dashboardData.fund_types?.cola?.allocated) * 100) || 0}% Utilized</span>
                                                                <span>₱{dashboardData.fund_types?.cola?.remaining?.toFixed(2) || '0.00'} remaining</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-yellow-500 h-2 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.round((dashboardData.fund_types?.cola?.utilized / dashboardData.fund_types?.cola?.allocated) * 100) || 0)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div className="text-center">
                                                            <div className="font-medium text-yellow-600">₱{dashboardData.fund_types?.cola?.allocated?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Allocated</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-orange-600">₱{dashboardData.fund_types?.cola?.utilized?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Utilized</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-green-600">₱{dashboardData.fund_types?.cola?.remaining?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Remaining</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Other Funds */}
                                                <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-medium text-gray-900">Other Assistance</h3>
                                                                <p className="text-sm text-gray-600">Miscellaneous support funds</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-purple-600">
                                                                ₱{dashboardData.fund_types?.other?.allocated?.toFixed(2) || '0.00'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">Total Allocated</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dashboardData.fund_types?.other?.allocated > 0 && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span>Progress: {Math.round((dashboardData.fund_types?.other?.utilized / dashboardData.fund_types?.other?.allocated) * 100) || 0}% Utilized</span>
                                                                <span>₱{dashboardData.fund_types?.other?.remaining?.toFixed(2) || '0.00'} remaining</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-purple-500 h-2 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.round((dashboardData.fund_types?.other?.utilized / dashboardData.fund_types?.other?.allocated) * 100) || 0)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div className="text-center">
                                                            <div className="font-medium text-purple-600">₱{dashboardData.fund_types?.other?.allocated?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Allocated</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-orange-600">₱{dashboardData.fund_types?.other?.utilized?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Utilized</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-green-600">₱{dashboardData.fund_types?.other?.remaining?.toFixed(2) || '0.00'}</div>
                                                            <div className="text-gray-500">Remaining</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fund Sponsors List */}
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                                        <div className="p-6">
                                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fund Sponsors</h2>
                                            {sponsorList.length === 0 ? (
                                                <p className="text-sm text-gray-500">No sponsors yet.</p>
                                            ) : (
                                                <ul className="divide-y divide-gray-200">
                                                    {sponsorList.map(s => (
                                                        <li key={s.name} className="py-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0">
                                                                    {s.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-gray-900 truncate">{s.name}</div>
                                                                    <div className="text-xs text-gray-500">{s.count} allocation{s.count !== 1 ? 's' : ''}</div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-6 text-right text-sm">
                                                                <div>
                                                                    <div className="font-medium text-gray-900">₱{s.totalAllocated.toFixed(2)}</div>
                                                                    <div className="text-gray-500">Allocated</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">₱{s.totalUtilized.toFixed(2)}</div>
                                                                    <div className="text-gray-500">Utilized</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">₱{s.totalRemaining.toFixed(2)}</div>
                                                                    <div className="text-gray-500">Remaining</div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                </>
                            ) : (
                                /* No fund allocations yet */
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                                    <div className="p-6">
                                        <div className="text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Fund Allocations Yet</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Start by creating your first fund allocation. You can set up funds from different sponsors and track their usage.
                                            </p>
                                            <div className="mt-6">
                                                <a 
                                                    href="/fund-management" 
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                                    </svg>
                                                    Create Fund Allocation
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Caseworker Tools */}
                    {user?.system_role?.name?.toLowerCase() === 'caseworker' && (
                        <>
                        
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Pending Beneficiary Submissions</h2>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{pendingSubs.length} pending</span>
                                        <button className="px-3 py-1 rounded-md border hover:bg-gray-50" onClick={async ()=>{
                                            setSubLoading(true)
                                            try {
                                                const sres = await axios.get('/api/beneficiary-document-submissions/pending')
                                                const sPage = sres.data?.data
                                                const sItems = sPage?.data ?? []
                                                setPendingSubs(sItems)
                                            } finally { setSubLoading(false) }
                                        }}>Refresh</button>
                                    </div>
                                </div>
                                {subLoading ? (
                                    <Loading />
                                ) : pendingSubs.length === 0 ? (
                                    <p className="text-gray-600">No pending submissions right now.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-600 border-b bg-gray-50">
                                                    <th className="py-2 pr-4">Beneficiary</th>
                                                    <th className="py-2 pr-4">Enrollment Date</th>
                                                    <th className="py-2 pr-4">Year Level</th>
                                                    <th className="py-2 pr-4">Docs</th>
                                                    <th className="py-2 pr-4">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {pendingSubs.map(s => (
                                                    <tr key={s.id} className="hover:bg-gray-50">
                                                        <td className="py-2 pr-4">{s.beneficiary?.firstname} {s.beneficiary?.lastname}</td>
                                                        <td className="py-2 pr-4">{s.enrollment_date}</td>
                                                        <td className="py-2 pr-4">{s.year_level}</td>
                                                        <td className="py-2 pr-4 space-x-3">
                                                            {s.enrollment_certification_path && (
                                                                <button 
                                                                    className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    onClick={() => downloadDocument(s.enrollment_certification_path, `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_Enrollment_Certification`)}
                                                                    disabled={downloadingDoc === `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_Enrollment_Certification`}
                                                                >
                                                                    {downloadingDoc === `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_Enrollment_Certification` ? (
                                                                        <span className="flex items-center">
                                                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Downloading...
                                                                        </span>
                                                                    ) : (
                                                                        'Certification'
                                                                    )}
                                                                </button>
                                                            )}
                                                            {s.sao_photo_path && (
                                                                <button 
                                                                    className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
onClick={() => downloadDocument(s.sao_photo_path, `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_SOA`)}
                                                                    disabled={downloadingDoc === `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_SOA`}
                                                                >
                                                                    {downloadingDoc === `${s.beneficiary?.lastname}_${s.beneficiary?.firstname}_SAO_Document` ? (
                                                                        <span className="flex items-center">
                                                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Downloading...
                                                                        </span>
                                                                    ) : (
'SOA'
                                                                    )}
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="py-2 pr-4 whitespace-nowrap">
                                                            <button className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={()=> setReviewModal({ open: true, submission: s })}>Review</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Caseworker Assigned Beneficiaries */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Assigned Beneficiaries</h2>
                                {loading ? (
                                    <Loading />
                                ) : assigned.length === 0 ? (
                                    <p className="text-gray-600">No beneficiaries assigned yet.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-600 border-b">
                                                    <th className="py-2 pr-4">Name</th>
                                                    <th className="py-2 pr-4">Email</th>
                                                    <th className="py-2 pr-4">School</th>
                                                    <th className="py-2 pr-4">Year</th>
                                                    <th className="py-2 pr-4">Registered</th>
                                                    <th className="py-2 pr-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assigned.map(b => (
                                                    <tr key={b.id} className="border-b last:border-b-0">
                                                        <td className="py-2 pr-4">{b.firstname} {b.middlename} {b.lastname}</td>
                                                        <td className="py-2 pr-4">{b.email}</td>
                                                        <td className="py-2 pr-4">{b.enrolled_school || '-'}</td>
                                                        <td className="py-2 pr-4">{b.school_year || '-'}</td>
                                                        <td className="py-2 pr-4">{new Date(b.created_at).toLocaleDateString()}</td>
                                                        <td className="py-2 pr-4 whitespace-nowrap flex gap-2">
                                                            <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={()=> setEditModal({ open: true, beneficiary: b })}>Edit</button>
                                                            <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200" onClick={async ()=>{
                                                                try {
                                                                    const res = await axios.post(`/api/beneficiaries/${b.id}/reset-password`)
                                                                    const temp = res?.data?.temporary_password
                                                                    if (temp) setTempModal({ open: true, email: b.email, password: temp })
                                                                } catch (err) {
                                                                    console.error('Failed to reset', err)
                                                                    alert(err?.response?.data?.message || 'Failed to reset password')
                                                                }
                                                            }}>Reset Password</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Aid/Fund Requests */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Pending Aid Requests</h2>
                                    <button className="px-3 py-1 rounded-md border hover:bg-gray-50" onClick={async ()=>{
                                        setAidLoading(true)
                                        try {
const r = await axios.get('/api/aid-requests/pending')
                                            const page = r.data?.data
                                            const items = page?.data ?? []
                                            setAidPending(items)
                                        } finally { setAidLoading(false) }
                                    }}>Refresh</button>
                                </div>
                                {aidLoading ? (
                                    <Loading />
                                ) : aidPending.length === 0 ? (
                                    <p className="text-gray-600">No pending aid requests.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-600 border-b bg-gray-50">
                                                    <th className="py-2 pr-4">Beneficiary</th>
                                                    <th className="py-2 pr-4">Fund Type</th>
                                                    <th className="py-2 pr-4">Amount</th>
                                                    <th className="py-2 pr-4">Purpose</th>
                                                    <th className="py-2 pr-4">Requested</th>
                                                    <th className="py-2 pr-4">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {aidPending.map(a => (
                                                    <tr key={a.id} className="hover:bg-gray-50">
                                                        <td className="py-2 pr-4">{a.beneficiary?.firstname} {a.beneficiary?.lastname}</td>
                                                        <td className="py-2 pr-4">{String(a.fund_type).toUpperCase()}</td>
                                                        <td className="py-2 pr-4">₱{Number(a.amount || 0).toFixed(2)}</td>
                                                        <td className="py-2 pr-4 max-w-xs truncate" title={a.purpose || ''}>{a.purpose || '-'}</td>
                                                        <td className="py-2 pr-4">{new Date(a.created_at).toLocaleString()}</td>
                                                        <td className="py-2 pr-4 whitespace-nowrap space-x-2">
                                                            <button
                                                                className={`px-2 py-1 rounded bg-green-600 text-white ${aidActing===`approve_${a.id}`?'opacity-50 cursor-wait':''}`}
                                                                disabled={aidActing}
                                                                onClick={async ()=>{
                                                                    try {
                                                                        setAidActing(`approve_${a.id}`)
                                                                        await axios.post(`/api/aid-requests/${a.id}/review`, { status: 'approved' })
                                                                        setAidPending(prev=> prev.filter(x=> x.id!==a.id))
                                                                    } finally { setAidActing(null) }
                                                                }}
                                                            >Approve</button>
                                                            <button
                                                                className={`px-2 py-1 rounded bg-red-100 text-red-800 ${aidActing===`reject_${a.id}`?'opacity-50 cursor-wait':''}`}
                                                                disabled={aidActing}
                                                                onClick={async ()=>{
                                                                    try {
                                                                        setAidActing(`reject_${a.id}`)
                                                                        await axios.post(`/api/aid-requests/${a.id}/review`, { status: 'rejected' })
                                                                        setAidPending(prev=> prev.filter(x=> x.id!==a.id))
                                                                    } finally { setAidActing(null) }
                                                                }}
                                                            >Reject</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <TempPasswordModal
                isOpen={tempModal.open}
                email={tempModal.email}
                password={tempModal.password}
                onClose={() => setTempModal({ open: false, email: '', password: '' })}
            />
            <BeneficiaryEditModal
                isOpen={editModal.open}
                initial={editModal.beneficiary}
                onClose={() => setEditModal({ open: false, beneficiary: null })}
                onSave={async (payload)=>{
                    try {
                        if (!editModal.beneficiary) return
                        await axios.put(`/api/beneficiaries/${editModal.beneficiary.id}`, payload)
                        // reload list
                        const res = await axios.get('/api/my-assigned-beneficiaries')
                        const page = res.data?.data || res.data
                        const items = page?.data ?? []
                        setAssigned(items)
                        setEditModal({ open: false, beneficiary: null })
                    } catch (err) {
                        console.error('Failed to save', err)
                        alert(err?.response?.data?.message || 'Failed to update beneficiary')
                    }
                }}
            />
            <SubmissionReviewModal
                isOpen={reviewModal.open}
                submission={reviewModal.submission}
                onClose={()=> setReviewModal({ open: false, submission: null })}
                onReviewed={(id)=> setPendingSubs(prev=> prev.filter(s=> s.id !== id))}
            />
        </>
    )
}

// Recent Audit Log Component
const RecentAuditLog = () => {
    const [auditLogs, setAuditLogs] = useState([])
    const [allAuditLogs, setAllAuditLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [loadingModal, setLoadingModal] = useState(false)

    useEffect(() => {
        const loadRecentAuditLogs = async () => {
            try {
                setLoading(true)
                const response = await axios.get('/api/audit-logs?per_page=5&category=financial')
                if (response.data.success) {
                    const logData = response.data.data?.data
                    // Ensure we always have an array
                    setAuditLogs(Array.isArray(logData) ? logData : [])
                } else {
                    setAuditLogs([])
                    throw new Error(response.data.message || 'Failed to load audit logs')
                }
            } catch (error) {
                console.error('Error loading audit logs:', error)
                setError(error.response?.data?.message || error.message)
                setAuditLogs([])
            } finally {
                setLoading(false)
            }
        }

        loadRecentAuditLogs()
    }, [])

    const loadAllAuditLogs = async () => {
        try {
            setLoadingModal(true)
            const response = await axios.get('/api/audit-logs?per_page=50&category=financial')
            if (response.data.success) {
                const logData = response.data.data?.data
                // Ensure we always have an array
                setAllAuditLogs(Array.isArray(logData) ? logData : [])
            } else {
                setAllAuditLogs([])
                throw new Error(response.data.message || 'Failed to load audit logs')
            }
        } catch (error) {
            console.error('Error loading all audit logs:', error)
            setError(error.response?.data?.message || error.message)
            setAllAuditLogs([])
        } finally {
            setLoadingModal(false)
        }
    }

    const handleShowModal = () => {
        if (allAuditLogs.length === 0) {
            loadAllAuditLogs()
        }
        setShowModal(true)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Financial Activity</h3>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3">
                            <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Financial Activity</h3>
                <div className="text-center py-4">
                    <div className="text-red-500 text-sm">{error}</div>
                    <button 
                        onClick={() => {
                            setError(null)
                            // Retry loading data instead of full page reload
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Financial Activity</h3>
                    <button 
                        onClick={handleShowModal}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    >
                        <span>View All</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <div className="text-lg mb-2">📊</div>
                            <div className="text-sm">No recent activity to display</div>
                        </div>
                    ) : (
                        auditLogs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                                <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${log.risk_level === 'high' || log.risk_level === 'critical' ? 'bg-red-500' : log.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900 font-medium truncate">
                                        {log.description}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${log.event_type_color || 'bg-gray-100 text-gray-800'}`}>
                                            {log.event_type.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-500">{log.created_at_formatted || new Date(log.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Audit Logs Modal */}
            {showModal && (
                <AuditLogsModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    auditLogs={allAuditLogs}
                    loading={loadingModal}
                    error={error}
                    onRefresh={loadAllAuditLogs}
                />
            )}
        </>
    )
}

// Financial Notifications Component
const FinancialNotifications = () => {
    const [notifications, setNotifications] = useState([])
    const [allNotifications, setAllNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [loadingModal, setLoadingModal] = useState(false)

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                setLoading(true)
                const [notificationsRes, countRes] = await Promise.all([
                    axios.get('/api/notifications/recent?limit=5'),
                    axios.get('/api/notifications/unread-count')
                ])
                
                if (notificationsRes.data.success) {
                    const notifData = notificationsRes.data.data
                    // Ensure we always have an array
                    setNotifications(Array.isArray(notifData) ? notifData : [])
                } else {
                    setNotifications([])
                }
                
                if (countRes.data.success) {
                    setUnreadCount(countRes.data.data?.total_unread || 0)
                } else {
                    setUnreadCount(0)
                }
            } catch (error) {
                console.error('Error loading notifications:', error)
                setError(error.response?.data?.message || error.message)
                setNotifications([])
                setUnreadCount(0)
            } finally {
                setLoading(false)
            }
        }

        loadNotifications()
    }, [])

    const loadAllNotifications = async () => {
        try {
            setLoadingModal(true)
            console.log('Loading all notifications...')
            // Try different API endpoints
            const endpoints = [
                '/api/notifications?limit=50',
                '/api/notifications/recent?limit=50',
                '/api/notifications'
            ]
            
            let response
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`)
                    response = await axios.get(endpoint)
                    if (response.data.success && response.data.data) {
                        console.log(`Success with endpoint: ${endpoint}`)
                        break
                    }
                } catch (err) {
                    console.log(`Failed with endpoint ${endpoint}:`, err.message)
                    continue
                }
            }
            console.log('All notifications response:', response.data)
            if (response.data.success) {
                const notifData = response.data.data
                console.log('Notification data:', notifData)
                // Ensure we always have an array
                const notifications = Array.isArray(notifData) ? notifData : []
                console.log('Setting all notifications:', notifications)
                setAllNotifications(notifications)
            } else {
                console.log('API response not successful:', response.data)
                setAllNotifications([])
                throw new Error(response.data.message || 'Failed to load notifications')
            }
        } catch (error) {
            console.error('Error loading all notifications:', error)
            setError(error.response?.data?.message || error.message)
            setAllNotifications([])
        } finally {
            setLoadingModal(false)
        }
    }

    const handleShowModal = () => {
        console.log('Show modal clicked')
        console.log('Current notifications:', notifications)
        console.log('Current allNotifications:', allNotifications)
        
        if (allNotifications.length === 0 && notifications.length > 0) {
            console.log('Using basic notifications for modal')
            // If we have basic notifications but no "all" notifications, use the basic ones initially
            setAllNotifications(notifications)
        }
        if (allNotifications.length === 0) {
            console.log('Loading all notifications...')
            loadAllNotifications()
        }
        setShowModal(true)
    }

    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`/api/notifications/${notificationId}/read`)
            setNotifications(prev => prev.map(notif => 
                notif.id === notificationId ? { ...notif, is_read: true } : notif
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const getNotificationUrl = (notification) => {
        // Determine redirect URL based on notification type or content
        const title = notification.title?.toLowerCase() || ''
        const message = notification.message?.toLowerCase() || ''
        
        if (title.includes('fund allocation') || message.includes('fund allocation')) {
            return '/fund-management'
        }
        if (title.includes('disbursement') || message.includes('disbursement')) {
            return '/cash-disbursement'
        }
        if (title.includes('liquidation') || message.includes('liquidation')) {
            return '/liquidation-approvals'
        }
        if (title.includes('beneficiary') || message.includes('beneficiary')) {
            return '/beneficiary-management'
        }
        
        // Default fallback
        return '/staff-dashboard'
    }

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            markAsRead(notification.id)
        }
        
        // Navigate to relevant page
        const url = getNotificationUrl(notification)
        window.location.href = url
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Notifications</h3>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Notifications</h3>
                <div className="text-center py-4">
                    <div className="text-red-500 text-sm">{error}</div>
                    <button 
                        onClick={() => {
                            setError(null)
                            // Retry loading data instead of full page reload
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">Financial Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={handleShowModal}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    >
                        <span>View All</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <div className="text-lg mb-2">🔔</div>
                            <div className="text-sm">No notifications to display</div>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:shadow-sm ${
                                    notification.is_read 
                                        ? 'bg-gray-50 hover:bg-gray-200' 
                                        : 'bg-blue-50 hover:bg-blue-200 border-l-4 border-blue-500'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                                title="Click to view details"
                            >
                                <div className={`flex-shrink-0 p-2 rounded-full ${
                                    notification.category === 'financial' 
                                        ? 'bg-green-100 text-green-600' 
                                        : notification.category === 'alert' 
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {notification.category === 'financial' ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                                        </svg>
                                    ) : notification.category === 'alert' ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z"/>
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                        {notification.title}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate mt-1">
                                        {notification.message}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${notification.priority_color || 'bg-gray-100 text-gray-800'}`}>
                                            {notification.priority || 'normal'}
                                        </span>
                                        <span className="text-xs text-gray-500">{notification.time_ago || new Date(notification.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <div className="flex-shrink-0">
                                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Notifications Modal */}
            {showModal && (
                <NotificationsModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    notifications={allNotifications.length > 0 ? allNotifications : notifications}
                    loading={loadingModal}
                    error={error}
                    onRefresh={loadAllNotifications}
                    onMarkAsRead={markAsRead}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    setNotifications={setNotifications}
                    setAllNotifications={setAllNotifications}
                />
            )}
        </>
    )
}

// Audit Logs Modal Component
const AuditLogsModal = ({ isOpen, onClose, auditLogs, loading, error, onRefresh }) => {
    if (!isOpen) return null

    const getRiskIcon = (riskLevel) => {
        switch (riskLevel) {
            case 'critical':
                return '🔴'
            case 'high':
                return '🟠'
            case 'medium':
                return '🟡'
            case 'low':
                return '🟢'
            default:
                return '⚪'
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Financial Audit Logs</h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                                >
                                    {loading ? 'Refreshing...' : 'Refresh'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading && auditLogs.length === 0 ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <div className="ml-3 text-gray-600">Loading audit logs...</div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500 mb-2">Error loading audit logs</div>
                                    <div className="text-gray-600 text-sm">{error}</div>
                                    <button
                                        onClick={onRefresh}
                                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">📊</div>
                                    <div>No audit logs found</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-start space-x-3">
                                                <span className="text-lg">
                                                    {getRiskIcon(log.risk_level)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {log.description}
                                                            </div>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${log.event_type_color || 'bg-gray-100 text-gray-800'}`}>
                                                                    {log.event_type.replace('_', ' ')}
                                                                </span>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${log.risk_level === 'critical' ? 'bg-red-100 text-red-800' : log.risk_level === 'high' ? 'bg-orange-100 text-orange-800' : log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                                    {log.risk_level}
                                                                </span>
                                                            </div>
                                                            {log.event_data && Object.keys(log.event_data).length > 0 && (
                                                                <div className="mt-2 text-xs text-gray-600">
                                                                    {Object.entries(log.event_data).slice(0, 3).map(([key, value]) => (
                                                                        <div key={key}>
                                                                            <span className="font-medium">{key}:</span> {value}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 ml-4">
                                                            {log.created_at_formatted || new Date(log.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <a
                            href="/staff/audit-logs"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            View Full Page
                        </a>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Notifications Modal Component
const NotificationsModal = ({ 
    isOpen, 
    onClose, 
    notifications, 
    loading, 
    error, 
    onRefresh, 
    onMarkAsRead,
    unreadCount,
    setUnreadCount,
    setNotifications,
    setAllNotifications
}) => {
    const [deleting, setDeleting] = useState(false)
    
    if (!isOpen) return null
    
    console.log('Modal props:', { notifications: notifications.length, loading, error })

    const handleMarkAsRead = async (notificationId) => {
        try {
            await onMarkAsRead(notificationId)
            // Update both notification lists
            setNotifications(prev => prev.map(notif => 
                notif.id === notificationId ? { ...notif, is_read: true } : notif
            ))
            setAllNotifications(prev => prev.map(notif => 
                notif.id === notificationId ? { ...notif, is_read: true } : notif
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const getNotificationUrl = (notification) => {
        // Determine redirect URL based on notification type or content
        const title = notification.title?.toLowerCase() || ''
        const message = notification.message?.toLowerCase() || ''
        
        if (title.includes('fund allocation') || message.includes('fund allocation')) {
            return '/fund-management'
        }
        if (title.includes('disbursement') || message.includes('disbursement')) {
            return '/cash-disbursement'
        }
        if (title.includes('liquidation') || message.includes('liquidation')) {
            return '/liquidation-approvals'
        }
        if (title.includes('beneficiary') || message.includes('beneficiary')) {
            return '/beneficiary-management'
        }
        
        // Default fallback
        return '/staff-dashboard'
    }

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            handleMarkAsRead(notification.id)
        }
        
        // Close modal
        onClose()
        
        // Navigate to relevant page after a short delay to allow state updates
        setTimeout(() => {
            const url = getNotificationUrl(notification)
            window.location.href = url
        }, 100)
    }

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read)
            if (unreadNotifications.length === 0) return
            
            await Promise.all(unreadNotifications.map(n => onMarkAsRead(n.id)))
            
            // Update both notification lists
            setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })))
            setAllNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const deleteAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            return
        }

        try {
            setDeleting(true)
            
            // Delete all notifications
            const deletePromises = notifications.map(notification => 
                axios.delete(`/api/notifications/${notification.id}`)
            )
            
            await Promise.all(deletePromises)
            
            // Clear all notification lists
            setNotifications([])
            setAllNotifications([])
            setUnreadCount(0)
            
            // Close modal
            onClose()
            
            alert('All notifications have been deleted successfully.')
        } catch (error) {
            console.error('Error deleting notifications:', error)
            alert('Failed to delete some notifications. Please try again.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900">Financial Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    >
                                        Mark All Read
                                    </button>
                                )}
                                <button
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                                >
                                    {loading ? 'Refreshing...' : 'Refresh'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="ml-3 text-gray-600">Loading notifications...</div>
                </div>
            ) : error && notifications.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-red-500 mb-2">Error loading notifications</div>
                    <div className="text-gray-600 text-sm">{error}</div>
                    <button
                        onClick={onRefresh}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔔</div>
                    <div>No notifications found</div>
                </div>
            ) : (
                <div className="space-y-2">
                                    {notifications.map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:shadow-md ${
                                                notification.is_read 
                                                    ? 'bg-gray-50 hover:bg-gray-200' 
                                                    : 'bg-blue-50 hover:bg-blue-200 border-l-4 border-blue-500'
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                            title="Click to view details"
                                        >
                                            <div className={`flex-shrink-0 p-2 rounded-full ${
                                                notification.category === 'financial' 
                                                    ? 'bg-green-100 text-green-600' 
                                                    : notification.category === 'alert' 
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notification.category === 'financial' ? (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                                                    </svg>
                                                ) : notification.category === 'alert' ? (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {notification.title}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {notification.message}
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${notification.priority_color || 'bg-gray-100 text-gray-800'}`}>
                                                                {notification.priority || 'normal'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {notification.time_ago || new Date(notification.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!notification.is_read && (
                                                        <div className="flex-shrink-0 ml-2">
                                                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={deleteAllNotifications}
                            disabled={deleting || notifications.length === 0}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {deleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete All Notifications
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
