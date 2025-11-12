'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'

const FinancialAidApplications = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const [applications, setApplications] = useState([])
    const [filteredApplications, setFilteredApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        fetchApplications()
    }, [])

    useEffect(() => {
        filterApplications()
    }, [applications, searchTerm, statusFilter, dateFilter])

    const fetchApplications = async () => {
        try {
            // Mock data - in real app, fetch from API
            const mockApplications = [
                {
                    id: 1,
                    applicant_name: 'Maria Rodriguez',
                    applicant_email: 'maria.rodriguez@email.com',
                    application_type: 'Emergency Medical Care',
                    amount_requested: 5000,
                    status: 'pending',
                    priority: 'high',
                    submitted_at: '2024-02-20T10:30:00Z',
                    updated_at: '2024-02-20T10:30:00Z',
                    facility_name: 'City General Hospital',
                    reason: 'Emergency surgery required, patient unable to afford treatment costs',
                    documents_count: 3
                },
                {
                    id: 2,
                    applicant_name: 'James Thompson',
                    applicant_email: 'james.t@email.com',
                    application_type: 'Prescription Assistance',
                    amount_requested: 800,
                    status: 'approved',
                    priority: 'medium',
                    submitted_at: '2024-02-18T14:22:00Z',
                    updated_at: '2024-02-19T09:15:00Z',
                    facility_name: 'Community Health Clinic',
                    reason: 'Long-term medication costs for chronic condition',
                    documents_count: 2
                },
                {
                    id: 3,
                    applicant_name: 'Sarah Johnson',
                    applicant_email: 'sarah.johnson@email.com',
                    application_type: 'Specialist Consultation',
                    amount_requested: 1200,
                    status: 'rejected',
                    priority: 'low',
                    submitted_at: '2024-02-15T09:12:00Z',
                    updated_at: '2024-02-16T11:30:00Z',
                    facility_name: 'Regional Medical Center',
                    reason: 'Specialist consultation and diagnostic tests',
                    documents_count: 1
                },
                {
                    id: 4,
                    applicant_name: 'Michael Brown',
                    applicant_email: 'michael.brown@email.com',
                    application_type: 'Rehabilitation Services',
                    amount_requested: 3500,
                    status: 'under_review',
                    priority: 'high',
                    submitted_at: '2024-02-19T16:45:00Z',
                    updated_at: '2024-02-20T08:00:00Z',
                    facility_name: 'Rehabilitation Center',
                    reason: 'Physical therapy and rehabilitation after accident',
                    documents_count: 4
                }
            ]
            setApplications(mockApplications)
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterApplications = () => {
        let filtered = applications

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(app =>
                app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.application_type.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => app.status === statusFilter)
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date()
            const filterDate = new Date()
            
            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0)
                    filtered = filtered.filter(app => new Date(app.submitted_at) >= filterDate)
                    break
                case 'week':
                    filterDate.setDate(now.getDate() - 7)
                    filtered = filtered.filter(app => new Date(app.submitted_at) >= filterDate)
                    break
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1)
                    filtered = filtered.filter(app => new Date(app.submitted_at) >= filterDate)
                    break
            }
        }

        setFilteredApplications(filtered)
    }

    const handleStatusUpdate = async (applicationId, newStatus) => {
        try {
            // Mock API call
            console.log(`Updating application ${applicationId} to ${newStatus}`)
            
            // Update local state
            setApplications(applications.map(app =>
                app.id === applicationId
                    ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
                    : app
            ))
        } catch (error) {
            console.error('Error updating application status:', error)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'under_review':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-600'
            case 'medium':
                return 'text-yellow-600'
            case 'low':
                return 'text-green-600'
            default:
                return 'text-gray-600'
        }
    }

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high':
                return '🔴'
            case 'medium':
                return '🟡'
            case 'low':
                return '🟢'
            default:
                return '⚪'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-lg border-b border-blue-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Financial Aid Applications
                                    </h1>
                                    <p className="mt-2 text-gray-600">
                                        Review and manage financial aid applications for your facility
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                    <span className="font-medium">Total Applications:</span>
                                    <span className="ml-2 font-bold text-blue-600">{applications.length}</span>
                                </div>
                                <button
                                    onClick={() => router.back()}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(app => app.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Under Review</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(app => app.status === 'under_review').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(app => app.status === 'approved').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {applications.filter(app => app.status === 'rejected').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl border border-blue-200 mb-8">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Applications</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or type..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">Last 30 Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-600">
                            Showing {filteredApplications.length} of {applications.length} applications
                        </div>
                    </div>
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {filteredApplications.map((application) => (
                            <div key={application.id} className="p-6 hover:bg-blue-50 transition-colors duration-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className="text-lg">{getPriorityIcon(application.priority)}</span>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {application.applicant_name}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                                {application.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Application Type</p>
                                                <p className="text-sm text-gray-900">{application.application_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Amount Requested</p>
                                                <p className="text-sm font-bold text-blue-600">{formatCurrency(application.amount_requested)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Submitted</p>
                                                <p className="text-sm text-gray-900">{formatDate(application.submitted_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Documents</p>
                                                <p className="text-sm text-gray-900">{application.documents_count} files</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-4">
                                            <span className="font-medium">Reason:</span> {application.reason}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>{application.applicant_email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedApplication(application)
                                                        setShowDetailsModal(true)
                                                    }}
                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Details
                                                </button>
                                                
                                                {application.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(application.id, 'approved')}
                                                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredApplications.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">No applications found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FinancialAidApplications