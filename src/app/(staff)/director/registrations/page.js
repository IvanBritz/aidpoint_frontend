'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'

const RegistrationManagement = () => {
    const { user } = useAuth({ middleware: 'auth' })
    
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [selectedRegistration, setSelectedRegistration] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        const loadRegistrations = async () => {
            if (!user) return
            
            try {
                const res = await axios.get('/api/director/registrations')
                setRegistrations(res.data?.data || [])
            } catch (error) {
                console.error('Failed to load registrations:', error)
                // Mock data for demonstration
                setRegistrations([
                    {
                        id: 1,
                        firstname: 'John',
                        lastname: 'Doe',
                        email: 'john.doe@example.com',
                        type: 'employee',
                        role: 'Caseworker',
                        status: 'verified',
                        created_at: '2024-01-15T10:30:00Z',
                        email_verified_at: '2024-01-15T11:00:00Z'
                    },
                    {
                        id: 2,
                        firstname: 'Jane',
                        lastname: 'Smith',
                        email: 'jane.smith@example.com',
                        type: 'beneficiary',
                        status: 'pending',
                        created_at: '2024-01-16T14:20:00Z',
                        email_verified_at: null
                    },
                    {
                        id: 3,
                        firstname: 'Mike',
                        lastname: 'Johnson',
                        email: 'mike.johnson@example.com',
                        type: 'employee',
                        role: 'Finance',
                        status: 'verified',
                        created_at: '2024-01-18T09:15:00Z',
                        email_verified_at: '2024-01-18T09:30:00Z'
                    }
                ])
            } finally {
                setLoading(false)
            }
        }
        
        loadRegistrations()
    }, [user?.id])

    const filteredRegistrations = registrations.filter(registration => {
        const matchesSearch = !searchTerm || 
            `${registration.firstname} ${registration.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            registration.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesType = !typeFilter || registration.type === typeFilter
        const matchesStatus = !statusFilter || registration.status === statusFilter
        
        const matchesDate = !dateFilter || (() => {
            const regDate = new Date(registration.created_at)
            const today = new Date()
            
            switch (dateFilter) {
                case 'today':
                    return regDate.toDateString() === today.toDateString()
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return regDate >= weekAgo
                case 'month':
                    return regDate.getMonth() === today.getMonth() && regDate.getFullYear() === today.getFullYear()
                default:
                    return true
            }
        })()
        
        return matchesSearch && matchesType && matchesStatus && matchesDate
    })

    const handleViewDetails = (registration) => {
        setSelectedRegistration(registration)
        setShowDetailsModal(true)
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Verified</span>
            case 'pending':
                return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            case 'rejected':
                return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Rejected</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Unknown</span>
        }
    }

    const getTypeBadge = (type) => {
        switch (type) {
            case 'employee':
                return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Employee</span>
            case 'beneficiary':
                return <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">Beneficiary</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Unknown</span>
        }
    }

    const getRegistrationStats = () => {
        const stats = {
            total: registrations.length,
            today: registrations.filter(r => {
                const regDate = new Date(r.created_at)
                const today = new Date()
                return regDate.toDateString() === today.toDateString()
            }).length,
            thisWeek: registrations.filter(r => {
                const regDate = new Date(r.created_at)
                const today = new Date()
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                return regDate >= weekAgo
            }).length,
            thisMonth: registrations.filter(r => {
                const regDate = new Date(r.created_at)
                const today = new Date()
                return regDate.getMonth() === today.getMonth() && regDate.getFullYear() === today.getFullYear()
            }).length,
            employees: registrations.filter(r => r.type === 'employee').length,
            beneficiaries: registrations.filter(r => r.type === 'beneficiary').length,
            verified: registrations.filter(r => r.status === 'verified').length,
            pending: registrations.filter(r => r.status === 'pending').length
        }
        return stats
    }

    const stats = getRegistrationStats()

    if (loading || !user) {
        return <Loading />
    }

    return (
        <>
            <Header title="Registration Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-100 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Registration Management</h1>
                                    <p className="text-gray-600 mt-1">Monitor and manage all system registrations</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-yellow-600">{stats.total}</div>
                                    <div className="text-sm text-gray-600">Total Registrations</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                                    <div className="text-sm text-gray-600">Today</div>
                                </div>
                            </div>
                        </div>

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
                                    <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
                                    <div className="text-sm text-gray-600">This Week</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
                                    <div className="text-sm text-gray-600">This Month</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                    <div className="text-sm text-gray-600">Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="employee">Employee</option>
                                        <option value="beneficiary">Beneficiary</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="verified">Verified</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    >
                                        <option value="">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('')
                                            setTypeFilter('')
                                            setStatusFilter('')
                                            setDateFilter('')
                                        }}
                                        className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registrations Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Registrations ({filteredRegistrations.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registered
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRegistrations.map((registration) => (
                                        <tr key={registration.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-white">
                                                                {registration.firstname?.charAt(0)}{registration.lastname?.charAt(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {registration.firstname} {registration.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {registration.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTypeBadge(registration.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{registration.role || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(registration.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(registration.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewDetails(registration)}
                                                    className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredRegistrations.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Details Modal */}
                    {showDetailsModal && selectedRegistration && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Registration Details
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

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                                            <p className="text-sm text-gray-900">{selectedRegistration.firstname}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                            <p className="text-sm text-gray-900">{selectedRegistration.lastname}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <p className="text-sm text-gray-900">{selectedRegistration.email}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            {getTypeBadge(selectedRegistration.type)}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            {getStatusBadge(selectedRegistration.status)}
                                        </div>
                                    </div>

                                    {selectedRegistration.role && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Role</label>
                                            <p className="text-sm text-gray-900">{selectedRegistration.role}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedRegistration.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    {selectedRegistration.email_verified_at && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedRegistration.email_verified_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-6">
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

export default RegistrationManagement