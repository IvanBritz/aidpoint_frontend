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
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

const Navigation = ({ user }) => {
    const { logout } = useAuth()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [facilityId, setFacilityId] = useState(null)

    // Fetch facility ID for navigation
    useEffect(() => {
        const fetchFacility = async () => {
            try {
                const response = await axios.get('/api/my-facilities')
                if (response.data.length > 0) {
                    setFacilityId(response.data[0].id)
                }
            } catch (error) {
                console.error('Error fetching facility for navigation:', error)
            }
        }

        if (user) {
            fetchFacility()
        }
    }, [user])

    return (
<nav className="bg-white border-b border-blue-100">
            {/* Primary Navigation Menu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href={facilityId ? `/${facilityId}/dashboard` : '/facility-registration'}>
<ApplicationLogo className="block h-10 w-auto text-blue-600" />
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                            {facilityId ? (
                                <>
                                    <NavLink
                                        href={`/${facilityId}/dashboard`}
                                        active={pathname === `/${facilityId}/dashboard`}>
                                        Dashboard
                                    </NavLink>
                                    <NavLink
                                        href={`/${facilityId}/employees`}
                                        active={pathname === `/${facilityId}/employees`}>
                                        Employees
                                    </NavLink>
                                    <NavLink
                                        href={`/${facilityId}/beneficiaries`}
                                        active={pathname === `/${facilityId}/beneficiaries`}>
                                        Beneficiaries
                                    </NavLink>
                                    {user?.system_role?.name?.toLowerCase() === 'director' && (
                                        <>
                                            <NavLink
                                                href="/director-liquidation"
                                                active={pathname === '/director-liquidation'}>
                                                Liquidation Approvals
                                            </NavLink>
                                            <NavLink
                                                href="/liquidation-completed"
                                                active={pathname === '/liquidation-completed'}>
                                                Completed Liquidations
                                            </NavLink>
                                        </>
                                    )}
                                    {user?.system_role?.name?.toLowerCase() === 'director' ? (
                                        <NavLink
                                            href="/director-pending-fund-requests"
                                            active={pathname === '/director-pending-fund-requests'}>
                                            Pending Final Approval
                                        </NavLink>
                                    ) : (
                                        <NavLink
                                            href={`/${facilityId}/fund-requests/pending`}
                                            active={pathname === `/${facilityId}/fund-requests/pending`}>
                                            Pending Fund Requests
                                        </NavLink>
                                    )}
                                    <NavLink
                                        href={`/${facilityId}/subscription`}
                                        active={pathname === `/${facilityId}/subscription`}>
                                        Subscription
                                    </NavLink>
                                    <NavLink
                                        href="/facility-registration"
                                        active={pathname === '/facility-registration'}>
                                        Registration
                                    </NavLink>
                                </>
                            ) : (
                                <NavLink
                                    href="/facility-registration"
                                    active={pathname === '/facility-registration'}>
                                    Register Center
                                </NavLink>
                            )}
                        </div>
                    </div>

                    {/* Settings Dropdown */}
                    <div className="hidden sm:flex sm:items-center sm:ml-6">
                        <Dropdown
                            align="right"
                            width="48"
                            trigger={
<button className="flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none transition duration-150 ease-in-out">
                                <div>{user?.firstname} {user?.lastname}</div>

                                    <div className="ml-1">
                                        <svg
                                            className="fill-current h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
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
                        {facilityId ? (
                            <>
                                <ResponsiveNavLink
                                    href={`/${facilityId}/dashboard`}
                                    active={pathname === `/${facilityId}/dashboard`}>
                                    Dashboard
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={`/${facilityId}/employees`}
                                    active={pathname === `/${facilityId}/employees`}>
                                    Employees
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={`/${facilityId}/beneficiaries`}
                                    active={pathname === `/${facilityId}/beneficiaries`}>
                                    Beneficiaries
                                </ResponsiveNavLink>
                                {user?.system_role?.name?.toLowerCase() === 'director' && (
                                    <>
                                        <ResponsiveNavLink
                                            href="/director-liquidation"
                                            active={pathname === '/director-liquidation'}>
                                            Liquidation Approvals
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href="/liquidation-completed"
                                            active={pathname === '/liquidation-completed'}>
                                            Completed Liquidations
                                        </ResponsiveNavLink>
                                    </>
                                )}
                                {user?.system_role?.name?.toLowerCase() === 'director' ? (
                                    <ResponsiveNavLink
                                        href="/director-pending-fund-requests"
                                        active={pathname === '/director-pending-fund-requests'}>
                                        Pending Final Approval
                                    </ResponsiveNavLink>
                                ) : (
                                    <ResponsiveNavLink
                                        href={`/${facilityId}/fund-requests/pending`}
                                        active={pathname === `/${facilityId}/fund-requests/pending`}>
                                        Pending Fund Requests
                                    </ResponsiveNavLink>
                                )}
                                <ResponsiveNavLink
                                    href={`/${facilityId}/subscription`}
                                    active={pathname === `/${facilityId}/subscription`}>
                                    Subscription
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href="/facility-registration"
                                    active={pathname === '/facility-registration'}>
                                    Registration
                                </ResponsiveNavLink>
                            </>
                        ) : (
                            <ResponsiveNavLink
                                href="/facility-registration"
                                active={pathname === '/facility-registration'}>
                                Register Center
                            </ResponsiveNavLink>
                        )}
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
                                    {user?.firstname} {user?.lastname}
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