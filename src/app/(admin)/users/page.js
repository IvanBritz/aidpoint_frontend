'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'

const UserManagement = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUsers, setSelectedUsers] = useState([])
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        filterUsers()
    }, [users, searchTerm, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            // Mock data - in real app, fetch from API
            const mockUsers = [
                {
                    id: 1,
                    firstname: 'John',
                    lastname: 'Doe',
                    email: 'john.doe@hospital.com',
                    systemrole_id: 2,
                    systemrole_name: 'Director',
                    status: 'Active',
                    created_at: '2024-01-15T10:30:00Z',
                    last_login: '2024-02-20T08:15:00Z'
                },
                {
                    id: 2,
                    firstname: 'Jane',
                    lastname: 'Smith',
                    email: 'jane.smith@clinic.com',
                    systemrole_id: 3,
                    systemrole_name: 'Employee',
                    status: 'Active',
                    created_at: '2024-01-20T14:22:00Z',
                    last_login: '2024-02-19T16:45:00Z'
                },
                {
                    id: 3,
                    firstname: 'Alice',
                    lastname: 'Johnson',
                    email: 'alice.johnson@email.com',
                    systemrole_id: 4,
                    systemrole_name: 'Beneficiary',
                    status: 'Active',
                    created_at: '2024-02-01T09:12:00Z',
                    last_login: '2024-02-20T12:30:00Z'
                },
                {
                    id: 4,
                    firstname: 'Bob',
                    lastname: 'Wilson',
                    email: 'bob.wilson@medical.com',
                    systemrole_id: 2,
                    systemrole_name: 'Director',
                    status: 'Inactive',
                    created_at: '2024-01-10T11:45:00Z',
                    last_login: '2024-01-25T15:20:00Z'
                }
            ]
            setUsers(mockUsers)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterUsers = () => {
        let filtered = users

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.systemrole_id.toString() === roleFilter)
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status.toLowerCase() === statusFilter.toLowerCase())
        }

        setFilteredUsers(filtered)
    }

    const handleUserAction = async (action, userId) => {
        try {
            switch (action) {
                case 'activate':
                case 'deactivate':
                    // Mock API call
                    console.log(`${action} user ${userId}`)
                    // Update local state
                    setUsers(users.map(user => 
                        user.id === userId 
                            ? { ...user, status: action === 'activate' ? 'Active' : 'Inactive' }
                            : user
                    ))
                    break
                case 'delete':
                    if (window.confirm('Are you sure you want to delete this user?')) {
                        setUsers(users.filter(user => user.id !== userId))
                    }
                    break
                default:
                    break
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error)
        }
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

    const getRoleColor = (roleId) => {
        switch (roleId) {
            case 1: return 'bg-purple-100 text-purple-800'
            case 2: return 'bg-blue-100 text-blue-800'
            case 3: return 'bg-green-100 text-green-800'
            case 4: return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        User Management
                                    </h1>
                                    <p className="mt-2 text-gray-600">
                                        Manage platform users, roles, and permissions
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add User
                                </button>
                                <button
                                    onClick={() => router.push('/admin-dashboard')}
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
                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-xl border border-blue-200 mb-8">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="1">Admin</option>
                                    <option value="2">Director</option>
                                    <option value="3">Employee</option>
                                    <option value="4">Beneficiary</option>
                                </select>
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
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {filteredUsers.length} of {users.length} users
                            </p>
                            <div className="text-sm text-gray-500">
                                Total Users: <span className="font-semibold text-blue-600">{users.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">
                                                        {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.firstname} {user.lastname}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.systemrole_id)}`}>
                                                {user.systemrole_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.status === 'Active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                    user.status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                                                }`}></div>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(user.last_login)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleUserAction(user.status === 'Active' ? 'deactivate' : 'activate', user.id)}
                                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                                                        user.status === 'Active'
                                                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                    }`}
                                                >
                                                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction('delete', user.id)}
                                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-all duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <p className="text-gray-500">No users found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserManagement