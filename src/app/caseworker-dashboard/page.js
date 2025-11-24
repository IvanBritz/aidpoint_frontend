'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import Toast from '@/components/Toast'
import NotificationBell from '@/components/NotificationBell'

const CaseworkerDashboard = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({})
    const [pendingSubmissions, setPendingSubmissions] = useState([])
    const [pendingAidRequests, setPendingAidRequests] = useState([])
    const [activeTab, setActiveTab] = useState('overview')
    const [toast, setToast] = useState({ open: false, type: 'success', title: '', message: '' })
    const [reviewingItem, setReviewingItem] = useState(null)
    const [reviewForm, setReviewForm] = useState({ status: 'approved', review_notes: '' })
    const [downloadingDoc, setDownloadingDoc] = useState(null)
    // Notifications and audit logs
    const [notifications, setNotifications] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [showAuditLogs, setShowAuditLogs] = useState(false)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setIsLoading(true)
            
            // Load pending enrollment verifications
            const submissionsRes = await axios.get('/api/beneficiary-document-submissions/pending')
            if (submissionsRes.data.success) {
                setPendingSubmissions(submissionsRes.data.data.data || [])
            }

            // Load pending aid requests
            const aidRequestsRes = await axios.get('/api/aid-requests/pending')
            if (aidRequestsRes.data.success) {
                setPendingAidRequests(aidRequestsRes.data.data.data || [])
            }

            // Calculate stats
            setStats({
                pendingEnrollments: pendingSubmissions.length,
                pendingAidRequests: pendingAidRequests.length,
                totalPending: pendingSubmissions.length + pendingAidRequests.length
            })
            
            // Load notifications and audit logs
            await Promise.all([
                loadNotifications(),
                loadAuditLogs()
            ])

        } catch (error) {
            console.error('Error loading dashboard data:', error)
            showToast('error', 'Error', 'Failed to load dashboard data')
        } finally {
            setIsLoading(false)
        }
    }
    
    const loadNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications?per_page=10')
            if (response.data.success) {
                setNotifications(response.data.data.data || [])
            }
        } catch (error) {
            console.error('Error loading notifications:', error)
            setNotifications([])
        }
    }
    
    const loadAuditLogs = async () => {
        try {
            const response = await axios.get('/api/audit-logs?per_page=10&category=user_management')
            if (response.data.success) {
                setAuditLogs(response.data.data.data || [])
            }
        } catch (error) {
            console.error('Error loading audit logs:', error)
            setAuditLogs([])
        }
    }

    const showToast = (type, title, message) => {
        setToast({ open: true, type, title, message })
    }

    // Download helper for document images
    const downloadDocument = async (path, documentType) => {
        if (!path) return
        if (downloadingDoc === documentType) return
        setDownloadingDoc(documentType)
        try {
            const response = await axios.get(`/api/documents/${path}`, {
                responseType: 'blob',
                headers: { 'Accept': '*/*' },
                timeout: 30000,
            })
            const contentDisposition = response.headers['content-disposition']
            const contentType = response.headers['content-type'] || ''
            let ext = 'bin'
            if (contentType.includes('jpeg')) ext = 'jpg'
            else if (contentType.includes('png')) ext = 'png'
            else if (contentType.includes('gif')) ext = 'gif'
            else if (contentType.includes('webp')) ext = 'webp'
            let filename = `${documentType}.${ext}`
            if (contentDisposition) {
                const m = contentDisposition.match(/filename=\"?([^\";]+)\"?/)
                if (m) filename = m[1]
            }
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType || 'application/octet-stream' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download failed', err)
            showToast('error', 'Download failed', 'Could not download the document. Please try again.')
        } finally {
            setDownloadingDoc(null)
        }
    }

    const handleReview = async (type, id, status, notes = '') => {
        try {
            const endpoint = type === 'enrollment' 
                ? `/api/beneficiary-document-submissions/${id}/review`
                : `/api/aid-requests/${id}/review`
            
            const response = await axios.post(endpoint, {
                status,
                review_notes: notes
            })

            if (response.data.success) {
                showToast('success', 'Success', response.data.message)
                loadDashboardData() // Refresh data
                setReviewingItem(null)
                setReviewForm({ status: 'approved', review_notes: '' })
            }
        } catch (error) {
            console.error('Review error:', error)
            showToast('error', 'Error', error.response?.data?.message || 'Failed to review item')
        }
    }

    const openReviewModal = (item, type) => {
        setReviewingItem({ ...item, type })
        setReviewForm({ status: 'approved', review_notes: '' })
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    }
    
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
    
    // Navigate to relevant page based on notification type
    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read if unread
            if (!notification.is_read) {
                await axios.post(`/api/notifications/${notification.id}/read`)
            }
            
            // Close notification panel
            setShowNotifications(false)
            
            // Navigate based on notification type
            if (notification.type.includes('submission')) {
                setActiveTab('enrollments')
            } else if (notification.type.includes('aid_request')) {
                setActiveTab('aid-requests')
            } else if (notification.type.includes('disbursement')) {
                window.location.href = '/caseworker-disbursements'
            } else if (notification.type.includes('liquidation')) {
                window.location.href = '/liquidation-approvals-enhanced'
            }
        } catch (error) {
            console.error('Error handling notification click:', error)
        }
    }
    
    // Get icon for audit log event
    const getAuditLogIcon = (eventType) => {
        if (eventType.includes('created') || eventType.includes('submitted')) {
            return '📝'
        } else if (eventType.includes('approved')) {
            return '✅'
        } else if (eventType.includes('rejected')) {
            return '❌'
        } else if (eventType.includes('updated')) {
            return '🔄'
        } else if (eventType.includes('login')) {
            return '🔑'
        } else {
            return '📋'
        }
    }

    if (isLoading) {
        return (
            <>
                <Header title="Caseworker Dashboard" />
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
            <Header title="Caseworker Dashboard" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Pending Enrollment Verifications
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.pendingEnrollments || 0}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Pending Aid Requests
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.pendingAidRequests || 0}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Items to Review
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.totalPending || 0}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a4.5 4.5 0 010-6.364M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    View Notifications
                                </button>
                                <button
                                    onClick={() => setShowAuditLogs(!showAuditLogs)}
                                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Activity History
                                </button>
                                <button
                                    onClick={() => window.location.href = '/approved-submissions'}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    View Approved Submissions
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    {showNotifications && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                                                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                }`}
                                                onClick={() => handleNotificationClick(notification)}
                                                title="Click to go to related page"
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                                        notification.category === 'financial' ? 'bg-green-400' :
                                                        notification.priority === 'high' ? 'bg-red-400' :
                                                        notification.priority === 'medium' ? 'bg-orange-400' :
                                                        'bg-blue-400'
                                                    }`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className={`text-sm font-medium ${
                                                                    !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                                                }`}>
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    {formatTimestamp(notification.created_at)}
                                                                </p>
                                                            </div>
                                                            {!notification.is_read && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activity History Section */}
                    {showAuditLogs && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                                    <button
                                        onClick={() => setShowAuditLogs(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {auditLogs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p>No activity history yet</p>
                                    </div>
                                ) : (
                                    <div className="flow-root">
                                        <ul className="-mb-8">
                                            {auditLogs.map((log, logIdx) => (
                                                <li key={log.id}>
                                                    <div className="relative pb-8">
                                                        {logIdx !== auditLogs.length - 1 && (
                                                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                        )}
                                                        <div className="relative flex items-start space-x-3">
                                                            <div className="relative">
                                                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white text-sm">
                                                                    {getAuditLogIcon(log.event_type)}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div>
                                                                    <div className="text-sm">
                                                                        <span className="font-medium text-gray-900">
                                                                            {log.description}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-0.5 text-sm text-gray-500">
                                                                        {formatDate(log.created_at)}
                                                                    </p>
                                                                </div>
                                                                {log.event_data && Object.keys(log.event_data).length > 0 && (
                                                                    <div className="mt-2 text-sm text-gray-700">
                                                                        <div className="bg-gray-50 rounded-md p-2">
                                                                            {Object.entries(log.event_data).slice(0, 2).map(([key, value]) => (
                                                                                <div key={key} className="text-xs">
                                                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'overview'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('enrollments')}
                                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'enrollments'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Enrollment Verifications ({pendingSubmissions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('aid-requests')}
                                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'aid-requests'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Aid Requests ({pendingAidRequests.length})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Recent Activity Summary */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {pendingSubmissions.slice(0, 3).map((submission) => (
                                            <div key={submission.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        New enrollment verification from {submission.beneficiary?.firstname} {submission.beneficiary?.lastname}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{formatDate(submission.created_at)}</p>
                                                </div>
                                                <button
                                                    onClick={() => openReviewModal(submission, 'enrollment')}
                                                    className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        ))}
                                        {pendingAidRequests.slice(0, 3).map((request) => (
                                            <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Aid request {formatCurrency(request.amount)} from {request.beneficiary?.firstname} {request.beneficiary?.lastname}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                                                </div>
                                                <button
                                                    onClick={() => openReviewModal(request, 'aid')}
                                                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        ))}
                                        {pendingSubmissions.length === 0 && pendingAidRequests.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p>All caught up! No pending items to review.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'enrollments' && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Pending Enrollment Verifications</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingSubmissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {submission.beneficiary?.firstname} {submission.beneficiary?.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {submission.beneficiary?.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(submission.enrollment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {submission.year_level}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(submission.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => openReviewModal(submission, 'enrollment')}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingSubmissions.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                    No pending enrollment verifications
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'aid-requests' && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Pending Aid Requests</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingAidRequests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {request.beneficiary?.firstname} {request.beneficiary?.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.beneficiary?.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                                        {request.fund_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(request.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {request.purpose || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(request.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => openReviewModal(request, 'aid')}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingAidRequests.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    No pending aid requests
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Review Modal */}
                    {reviewingItem && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Review {reviewingItem.type === 'enrollment' ? 'Enrollment Verification' : 'Aid Request'}
                                        </h3>
                                        <button
                                            onClick={() => setReviewingItem(null)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    {/* Beneficiary Info */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Beneficiary Information</h4>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <p><strong>Name:</strong> {reviewingItem.beneficiary?.firstname} {reviewingItem.beneficiary?.lastname}</p>
                                            <p><strong>Email:</strong> {reviewingItem.beneficiary?.email}</p>
                                            <p><strong>School:</strong> {reviewingItem.beneficiary?.enrolled_school || 'Not specified'}</p>
                                            <p><strong>Year:</strong> {reviewingItem.beneficiary?.school_year || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    {reviewingItem.type === 'enrollment' ? (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Enrollment Details</h4>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p><strong>Enrollment Date:</strong> {new Date(reviewingItem.enrollment_date).toLocaleDateString()}</p>
                                                <p><strong>Year Level:</strong> {reviewingItem.year_level}</p>
                                                <p><strong>Scholar Status:</strong> {reviewingItem.is_scholar ? 'Scholar' : 'Non-scholar'}</p>
                                                <p><strong>Submitted:</strong> {formatDate(reviewingItem.created_at)}</p>

                                                {/* Download buttons */}
                                                {reviewingItem.enrollment_certification_path && (
                                                    <div className="mt-2">
                                                        <span className="mr-2 text-gray-700 font-medium">Enrollment Certification:</span>
                                                        <button
                                                            className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                            onClick={() => downloadDocument(reviewingItem.enrollment_certification_path, 'Enrollment_Certification')}
                                                            disabled={downloadingDoc === 'Enrollment_Certification'}
                                                        >
                                                            {downloadingDoc === 'Enrollment_Certification' ? 'Downloading…' : 'Download'}
                                                        </button>
                                                    </div>
                                                )}
                                                {reviewingItem.scholarship_certification_path && (
                                                    <div className="mt-2">
                                                        <span className="mr-2 text-gray-700 font-medium">Scholarship Certification:</span>
                                                        <button
                                                            className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                            onClick={() => downloadDocument(reviewingItem.scholarship_certification_path, 'Scholarship_Certification')}
                                                            disabled={downloadingDoc === 'Scholarship_Certification'}
                                                        >
                                                            {downloadingDoc === 'Scholarship_Certification' ? 'Downloading…' : 'Download'}
                                                        </button>
                                                    </div>
                                                )}
                                                {reviewingItem.sao_photo_path && (
                                                    <div className="mt-2">
                                                        <span className="mr-2 text-gray-700 font-medium">SOA:</span>
                                                        <button
                                                            className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                            onClick={() => downloadDocument(reviewingItem.sao_photo_path, 'SOA')}
                                                            disabled={downloadingDoc === 'SOA'}
                                                        >
                                                            {downloadingDoc === 'SOA' ? 'Downloading…' : 'Download'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Aid Request Details</h4>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p><strong>Fund Type:</strong> <span className="capitalize">{reviewingItem.fund_type}</span></p>
                                                <p><strong>Amount:</strong> {formatCurrency(reviewingItem.amount)}</p>
                                                <p><strong>Purpose:</strong> {reviewingItem.purpose || 'Not specified'}</p>
                                                <p><strong>Submitted:</strong> {formatDate(reviewingItem.created_at)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Review Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                                            <div className="flex space-x-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="approved"
                                                        checked={reviewForm.status === 'approved'}
                                                        onChange={(e) => setReviewForm({...reviewForm, status: e.target.value})}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-green-600">Approve</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="rejected"
                                                        checked={reviewForm.status === 'rejected'}
                                                        onChange={(e) => setReviewForm({...reviewForm, status: e.target.value})}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-red-600">Reject</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Review Notes {reviewForm.status === 'rejected' && '(Required for rejection)'}
                                            </label>
                                            <textarea
                                                value={reviewForm.review_notes}
                                                onChange={(e) => setReviewForm({...reviewForm, review_notes: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                rows="4"
                                                placeholder="Provide feedback or reason for your decision..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                                    <button
                                        onClick={() => setReviewingItem(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleReview(reviewingItem.type, reviewingItem.id, reviewForm.status, reviewForm.review_notes)}
                                        className={`px-4 py-2 rounded-md text-white ${
                                            reviewForm.status === 'approved' 
                                                ? 'bg-green-600 hover:bg-green-700' 
                                                : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                        disabled={reviewForm.status === 'rejected' && !reviewForm.review_notes.trim()}
                                    >
                                        {reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Toast
                open={toast.open}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast(t => ({ ...t, open: false }))}
            />
        </>
    )
}

export default CaseworkerDashboard