'use client'

import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'

const RolesManagement = () => {
    const { user } = useAuth({ middleware: 'auth' })
    
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    })

    const [permissions] = useState([
        { id: 'view_dashboard', name: 'View Dashboard', category: 'General' },
        { id: 'manage_employees', name: 'Manage Employees', category: 'Administration' },
        { id: 'manage_roles', name: 'Manage Roles', category: 'Administration' },
        { id: 'manage_beneficiaries', name: 'Manage Beneficiaries', category: 'Beneficiary Management' },
        { id: 'approve_liquidations', name: 'Approve Liquidations', category: 'Financial' },
        { id: 'manage_funds', name: 'Manage Funds', category: 'Financial' },
        { id: 'view_reports', name: 'View Reports', category: 'Reporting' },
        { id: 'system_admin', name: 'System Administration', category: 'Administration' }
    ])

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            
            try {
                const res = await axios.get('/api/system-roles')
                setRoles(res.data?.data || [])
            } catch (error) {
                console.error('Failed to load roles:', error)
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
    }, [user?.id])

    const handleCreateRole = async (e) => {
        e.preventDefault()
        setActionLoading('create')
        
        try {
            await axios.post('/api/system-roles', formData)
            
            // Reload roles
            const res = await axios.get('/api/system-roles')
            setRoles(res.data?.data || [])
            
            setShowCreateModal(false)
            setFormData({ name: '', description: '', permissions: [] })
            alert('Role created successfully!')
        } catch (error) {
            console.error('Failed to create role:', error)
            alert('Failed to create role. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleUpdateRole = async (e) => {
        e.preventDefault()
        setActionLoading('update')
        
        try {
            await axios.put(`/api/system-roles/${editingRole.id}`, formData)
            
            // Reload roles
            const res = await axios.get('/api/system-roles')
            setRoles(res.data?.data || [])
            
            setEditingRole(null)
            setFormData({ name: '', description: '', permissions: [] })
            alert('Role updated successfully!')
        } catch (error) {
            console.error('Failed to update role:', error)
            alert('Failed to update role. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteRole = async (roleId) => {
        if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return
        }

        setActionLoading(roleId)
        try {
            await axios.delete(`/api/system-roles/${roleId}`)
            
            // Reload roles
            const res = await axios.get('/api/system-roles')
            setRoles(res.data?.data || [])
            
            alert('Role deleted successfully!')
        } catch (error) {
            console.error('Failed to delete role:', error)
            alert('Failed to delete role. It may be in use by existing users.')
        } finally {
            setActionLoading(null)
        }
    }

    const openEditModal = (role) => {
        setEditingRole(role)
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || []
        })
    }

    const closeModal = () => {
        setShowCreateModal(false)
        setEditingRole(null)
        setFormData({ name: '', description: '', permissions: [] })
    }

    const handlePermissionChange = (permissionId, checked) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                permissions: [...prev.permissions, permissionId]
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                permissions: prev.permissions.filter(p => p !== permissionId)
            }))
        }
    }

    const getPermissionsByCategory = () => {
        const categorized = {}
        permissions.forEach(permission => {
            if (!categorized[permission.category]) {
                categorized[permission.category] = []
            }
            categorized[permission.category].push(permission)
        })
        return categorized
    }

    const getRoleUserCount = (roleName) => {
        // This would typically come from the API
        const mockCounts = {
            'director': 2,
            'finance': 5,
            'caseworker': 12,
            'beneficiary': 150,
            'admin': 1
        }
        return mockCounts[roleName.toLowerCase()] || 0
    }

    if (loading || !user) {
        return <Loading />
    }

    return (
        <>
            <Header title="Role Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-100 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
                                    <p className="text-gray-600 mt-1">Manage system roles and access privileges</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Role
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {roles.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Roles</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {roles.reduce((sum, role) => sum + getRoleUserCount(role.name), 0)}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Users</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {permissions.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Permissions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role) => (
                            <div key={role.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                {role.name}
                                            </h3>
                                            {role.description && (
                                                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(role)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="Edit Role"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            {role.name.toLowerCase() !== 'admin' && role.name.toLowerCase() !== 'director' && (
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    disabled={actionLoading === role.id}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Delete Role"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                            </svg>
                                            {getRoleUserCount(role.name)} users
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'director'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'director' ? 'System Role' : 'Custom Role'}
                                        </span>
                                    </div>

                                    {role.permissions && role.permissions.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-gray-700 mb-2">Permissions ({role.permissions.length})</div>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 3).map((permission, index) => (
                                                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                        {permission}
                                                    </span>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                        +{role.permissions.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Create/Edit Role Modal */}
                    {(showCreateModal || editingRole) && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                                <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {editingRole ? 'Edit Role' : 'Create New Role'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter role name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Enter role description"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Permissions
                                            </label>
                                            <div className="space-y-4">
                                                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                                                    <div key={category}>
                                                        <h4 className="text-sm font-semibold text-gray-800 mb-2">{category}</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {categoryPermissions.map((permission) => (
                                                                <label key={permission.id} className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                        checked={formData.permissions.includes(permission.id)}
                                                                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">{permission.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading === 'create' || actionLoading === 'update'}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === 'create' || actionLoading === 'update' ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default RolesManagement