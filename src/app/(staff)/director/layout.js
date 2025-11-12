'use client'

import { useAuth } from '@/hooks/auth'
import Loading from '@/components/Loading'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const DirectorLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const roleName = user?.system_role?.name?.toLowerCase?.()
    const isDirector = roleName === 'director'

    useEffect(() => {
        if (!user) return
        if (!isDirector) {
            // Not a director — redirect them to their appropriate area
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
    }, [user, isDirector, roleName, router])

    const navigation = [
        {
            name: 'Dashboard',
            href: '/director',
            icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
            current: pathname === '/director'
        },
        {
            name: 'Staff Management',
            href: '/director/employees',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z',
            current: pathname.startsWith('/director/employees')
        },
        {
            name: 'Beneficiaries',
            href: '/director/beneficiaries',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            current: pathname.startsWith('/director/beneficiaries')
        },
        {
            name: 'Role Management',
            href: '/director/roles',
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            current: pathname.startsWith('/director/roles')
        },
        {
            name: 'Registrations',
            href: '/director/registrations',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            current: pathname.startsWith('/director/registrations')
        },
        {
            name: 'Subscriptions',
            href: '/director/subscriptions',
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            current: pathname.startsWith('/director/subscriptions')
        },
        {
            name: 'Audit Logs',
            href: '/audit-logs',
            icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            current: pathname.startsWith('/audit-logs')
        }
    ]

    if (!user) return <Loading />
    if (!isDirector) return <Loading />

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile menu backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar for mobile */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Director Panel</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="mt-6 px-4">
                    {navigation.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                                item.current
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <svg
                                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d={item.icon} clipRule="evenodd" />
                            </svg>
                            {item.name}
                        </a>
                    ))}
                </nav>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
                <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-lg font-semibold text-white">Director Panel</h2>
                </div>
                <nav className="mt-6 px-4">
                    {navigation.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                                item.current
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <svg
                                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d={item.icon} clipRule="evenodd" />
                            </svg>
                            {item.name}
                        </a>
                    ))}
                </nav>
                
                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                    {user?.firstname?.charAt(0) || 'D'}
                                </span>
                            </div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {[user?.firstname, user?.lastname].filter(Boolean).join(' ') || 'Director'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">Director</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="lg:pl-64">
                {/* Top navigation bar for mobile */}
                <div className="sticky top-0 z-40 lg:hidden">
                    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h1 className="text-lg font-semibold text-gray-900">Director Panel</h1>
                            <div className="w-6"></div> {/* Spacer for centering */}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DirectorLayout
