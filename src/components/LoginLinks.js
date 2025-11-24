'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

const LoginLinks = () => {
    const { user, logout } = useAuth({ middleware: 'guest' })
    const [facilityId, setFacilityId] = useState(null)
    const [isLoadingFacility, setIsLoadingFacility] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    const roleName = user?.system_role?.name?.toLowerCase?.()
    const status = String(user?.status || '').toLowerCase()
    const isSuspended = status === 'archived' || status === 'inactive'

    // Fetch facility ID for financial users and directors
    useEffect(() => {
        const fetchFacilityId = async () => {
            const role = user?.system_role?.name?.toLowerCase?.()
            if (user && (role === 'finance' || role === 'director')) {
                setIsLoadingFacility(true)
                try {
                    const response = await axios.get('/api/my-facilities')
                    if (response.data.length > 0) {
                        setFacilityId(response.data[0].id)
                    }
                } catch (error) {
                    console.error('Error fetching facility for LoginLinks:', error)
                } finally {
                    setIsLoadingFacility(false)
                }
            }
        }

        fetchFacilityId()
    }, [user])

    // Function to get dashboard URL based on user role
    const getDashboardUrl = () => {
        // Prefer system_role (used across app); fallback to systemRole
        const sr = user?.system_role?.name || user?.systemRole?.name
        if (!user || !sr) return '/dashboard'
        
        const r = sr.toLowerCase()
        switch(r) {
            case 'admin':
                return '/admin-dashboard'
            case 'director':
                return facilityId ? `/${facilityId}/dashboard` : '/facility-registration'
            case 'employee':
            case 'finance':
                return '/staff-dashboard'
            case 'caseworker':
                return '/staff-dashboard'
            case 'beneficiary':
                return '/dashboard'
            default:
                return '/dashboard'
        }
    }

    const getRoleName = () => {
        const sr = user?.system_role?.name || user?.systemRole?.name
        if (!user || !sr) return 'User'
        const name = String(sr)
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }

    if (user) {
        return (
            <div className="flex items-center space-x-4">
                {/* Dashboard link (locked when suspended) */}
                {isSuspended ? (
                    <span
                        title="Locked — subscription expired"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed select-none"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 118 0v4M5 11h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                        </svg>
                        Dashboard (Locked)
                    </span>
                ) : (
                    <Link
                        href={getDashboardUrl()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                        {isLoadingFacility ? 'Loading...' : 'Dashboard'}
                    </Link>
                )}

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {user.firstname?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <span className="hidden sm:block">{user.firstname || 'User'}</span>
                        <span className="hidden sm:block text-xs text-gray-500">({getRoleName()})</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <p className="text-xs text-blue-600 font-medium">{getRoleName()}</p>
                            </div>
                            <div className="py-1">
                                <Link
                                    href="/profile"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile Settings
                                </Link>
                                <Link
                                    href="/help"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Help Center
                                </Link>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    onClick={() => {
                                        setShowDropdown(false)
                                        logout()
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Guest user links
    return (
        <div className="flex items-center space-x-4">
            <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
                Sign In
            </Link>
            <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
            >
                Get Started
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </Link>
        </div>
    )
}

export default LoginLinks
