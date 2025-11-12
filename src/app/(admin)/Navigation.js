import ApplicationLogo from '@/components/ApplicationLogo'
import Dropdown from '@/components/Dropdown'
import Link from 'next/link'
import NavLink from '@/components/NavLink'
import ResponsiveNavLink, {
    ResponsiveNavButton,
} from '@/components/ResponsiveNavLink'
import { DropdownButton } from '@/components/DropdownLink'
import { useAuth } from '@/hooks/auth'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const Navigation = ({ user }) => {
    const { logout } = useAuth()

    const [open, setOpen] = useState(false)

    return (
        <nav className="bg-white/95 backdrop-blur-md border-b border-blue-100/60 shadow-sm sticky top-0 z-50">
            {/* Primary Navigation Menu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="flex items-center space-x-2 group">
                                <ApplicationLogo className="block h-10 w-auto text-blue-600 group-hover:text-blue-700 transition-colors" />
                                <div className="hidden md:block">
                                    <span className="text-xl font-bold text-blue-900 group-hover:text-blue-800 transition-colors">AidPoint</span>
                                    <div className="text-xs text-blue-600 font-medium">Admin Portal</div>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                            <NavLink
                                href="/admin-dashboard"
                                active={usePathname() === '/admin-dashboard'}>
                                Dashboard
                            </NavLink>
                            <NavLink
                                href="/applications"
                                active={usePathname().startsWith('/applications')}>
                                Applications
                            </NavLink>
                        <NavLink
                            href="/plan"
                            active={usePathname().startsWith('/plan')}>
                            Subscription Plans
                        </NavLink>
                        <NavLink
                            href="/subscription-transactions"
                            active={usePathname().startsWith('/subscription-transactions')}>
                            Transactions
                        </NavLink>
                    </div>
                    </div>

                    {/* Settings Dropdown */}
                    <div className="hidden sm:flex sm:items-center sm:ml-6">
                        <Dropdown
                            align="right"
                            width="48"
                            trigger={
                                <button className="flex items-center space-x-2 text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                        {user?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <div className="font-semibold">{user?.name}</div>
                                        <div className="text-xs text-blue-600">Administrator</div>
                                    </div>
                                    <svg className="fill-current h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            }>
                            {/* Authentication */}
                            <DropdownButton onClick={logout}>
                                Logout
                            </DropdownButton>
                        </Dropdown>
                    </div>

                    {/* Hamburger */}
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setOpen(open => !open)}
className="inline-flex items-center justify-center p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 focus:text-blue-800 transition duration-150 ease-in-out">
                            <svg
                                className="h-6 w-6"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24">
                                {open ? (
                                    <path
                                        className="inline-flex"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        className="inline-flex"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Responsive Navigation Menu */}
            {open && (
                <div className="block sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink
                            href="/admin-dashboard"
                            active={usePathname() === '/admin-dashboard'}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href="/applications"
                            active={usePathname().startsWith('/applications')}>
                            Applications
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href="/plan"
                            active={usePathname().startsWith('/plan')}>
                            Subscription Plans
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href="/subscription-transactions"
                            active={usePathname().startsWith('/subscription-transactions')}>
                            Transactions
                        </ResponsiveNavLink>
                    </div>

                    {/* Responsive Settings Options */}
<div className="pt-4 pb-1 border-t border-blue-100">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <svg
className="h-10 w-10 fill-current text-blue-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>

                            <div className="ml-3">
<div className="font-medium text-base text-blue-900">
                                    {user?.name}
                                </div>
<div className="font-medium text-sm text-blue-700/80">
                                    {user?.email}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            {/* Authentication */}
                            <ResponsiveNavButton onClick={logout}>
                                Logout
                            </ResponsiveNavButton>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navigation