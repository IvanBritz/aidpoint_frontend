'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'

const EmployeesManagement = () => {
    const { user } = useAuth({ middleware: 'auth' })
    
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [roles, setRoles] = useState([])
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            
            try {
                const [employeesRes, rolesRes] = await Promise.all([
                    axios.get('/api/director/employees').catch(() => ({ data: { data: [] } })),
                    axios.get('/api/system-roles').catch(() => ({ data: { data: [] } }))
                ])
                
                setEmployees(employeesRes.data?.data || [])
                setRoles(rolesRes.data?.data || [])
            } catch (error) {
                console.error('Failed to load employees:', error)
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
    }, [user?.id])

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = !searchTerm || 
            `${employee.firstname} ${employee.middlename} ${employee.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesRole = !roleFilter || employee.system_role?.name === roleFilter
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && employee.email_verified_at && !employee.deleted_at) ||
            (statusFilter === 'inactive' && (!employee.email_verified_at || employee.deleted_at))
        
        return matchesSearch && matchesRole && matchesStatus
    })

    const handleRoleUpdate = async (employeeId, newRoleId) => {
        setActionLoading(employeeId)
        try {
            await axios.put(`/api/director/employees/${employeeId}/role`, {
                system_role_id: newRoleId
            })
            
            // Reload employees
            const res = await axios.get('/api/director/employees')
            setEmployees(res.data?.data || [])
            
            alert('Employee role updated successfully!')
        } catch (error) {
            console.error('Failed to update role:', error)
            alert('Failed to update employee role. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleStatusToggle = async (employeeId, currentStatus) => {
        setActionLoading(employeeId)
        try {
            const action = currentStatus === 'active' ? 'deactivate' : 'activate'
            await axios.put(`/api/director/employees/${employeeId}/${action}`)
            
            // Reload employees
            const res = await axios.get('/api/director/employees')
            setEmployees(res.data?.data || [])
            
            alert(`Employee ${action}d successfully!`)
        } catch (error) {
            console.error('Failed to toggle status:', error)
            alert('Failed to update employee status. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    const getEmployeeStatus = (employee) => {
        if (employee.deleted_at) return 'deleted'
        if (!employee.email_verified_at) return 'unverified'
        return 'active'
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>
            case 'unverified':
                return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Unverified</span>
            case 'deleted':
                return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Inactive</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Unknown</span>
        }
    }

    if (loading || !user) {
        return <Loading />
    }

    return (
        <>
            <Header title="Employee Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                                    <p className="text-gray-600 mt-1">Manage and oversee all system employees</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                                    <div className="text-sm text-gray-600">Total Employees</div>
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
                                    <div className="text-2xl font-bold text-green-600">
                                        {employees.filter(emp => getEmployeeStatus(emp) === 'active').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Active</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {employees.filter(emp => getEmployeeStatus(emp) === 'unverified').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Unverified</div>
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
                                    <div className="text-2xl font-bold text-red-600">
                                        {employees.filter(emp => getEmployeeStatus(emp) === 'deleted').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Inactive</div>
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
                                    <div className="text-2xl font-bold text-purple-600">
                                        {roles.length}
                                    </div>
                                    <div className="text-sm text-gray-600">System Roles</div>
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
                                        placeholder="Search by name or email"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="">All Roles</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.name}>
                                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('')
                                            setRoleFilter('')
                                            setStatusFilter('')
                                        }}
                                        className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employees Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Employees ({filteredEmployees.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredEmployees.map((employee) => {
                                        const status = getEmployeeStatus(employee)
                                        return (
                                            <tr key={employee.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {employee.firstname?.charAt(0)}{employee.lastname?.charAt(0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {employee.firstname} {employee.middlename} {employee.lastname}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {employee.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                                                        value={employee.system_role?.id || ''}
                                                        onChange={(e) => handleRoleUpdate(employee.id, e.target.value)}
                                                        disabled={actionLoading === employee.id}
                                                    >
                                                        {roles.map((role) => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(employee.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleStatusToggle(employee.id, status)}
                                                        disabled={actionLoading === employee.id}
                                                        className={`mr-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                            status === 'active'
                                                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        } ${actionLoading === employee.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {actionLoading === employee.id ? 'Loading...' : status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default EmployeesManagement