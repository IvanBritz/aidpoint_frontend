'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'

const FacilityHome = () => {
    const { facility_id } = useParams()

    const links = [
        {
            href: `/${facility_id}/dashboard`,
            title: 'Dashboard',
            desc: 'Overview of your facility status and key metrics.',
            icon: (
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                </svg>
            ),
        },
        {
            href: `/${facility_id}/beneficiaries`,
            title: 'Beneficiaries',
            desc: 'Manage and review registered beneficiaries for aid.',
            icon: (
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m10-4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            href: `/${facility_id}/employees`,
            title: 'Employees',
            desc: 'Invite, manage roles, and control employee access.',
            icon: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.567 3-3.5 3S5 12.657 5 11s1.567-3 3.5-3S12 9.343 12 11zm7 8v-1a4 4 0 00-4-4H9a4 4 0 00-4 4v1" />
                </svg>
            ),
        },
        {
            href: `/${facility_id}/roles`,
            title: 'Roles & Permissions',
            desc: 'Configure role-based access control for your team.',
            icon: (
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h8m2-18h2a2 2 0 012 2v2m-6 6l2 2 4-4" />
                </svg>
            ),
        },
        {
            href: `/${facility_id}/subscription`,
            title: 'Subscription',
            desc: 'View plan details, invoices, and manage billing.',
            icon: (
                <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
            ),
        },
    ]

    return (
        <>
            <Header title="Facility" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">Welcome</h2>
                                        <p className="text-sm text-gray-600">Facility ID: <span className="font-mono">{facility_id}</span></p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {links.map(link => (
                                        <Link key={link.href} href={link.href} className="group">
                                            <div className="h-full rounded-xl border border-gray-200 hover:border-blue-300 transition-colors bg-white shadow-sm hover:shadow-md p-5 flex flex-col">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {link.icon}
                                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">{link.title}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600 flex-1">{link.desc}</p>
                                                <div className="mt-4 inline-flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all">
                                                    <span className="text-sm font-medium">Open</span>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <div className="mt-8">
                                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-blue-700 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-blue-900">
                                                Tip: Use the dashboard to verify your facility approval status. Some features may be limited until your facility is approved by an administrator.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FacilityHome
