'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/auth'
import TopNav from '@/components/TopNav'
import ApplicationLogo from '@/components/ApplicationLogo'
import axios from '@/lib/axios'

export default function SuspendedPage() {
    const { user, logout } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const [checking, setChecking] = useState(false)

    const goToHomeByRole = (role) => {
        if (role === 'director') {
            router.replace('/dashboard')
            return
        }
        if (role === 'admin') {
            router.replace('/admin-dashboard')
            return
        }
        // All associated users go to a unified dashboard
        router.replace('/dashboard')
    }

    useEffect(() => {
        // Persist suspended flag so other tabs/pages block background calls too
        try { localStorage.setItem('center_suspended', '1') } catch {}

        const role = user?.system_role?.name?.toLowerCase?.()
        // Directors should handle renewal on Plans; Admins are exempt → admin dashboard
        if (role === 'director') {
            router.replace('/plans')
            return
        }
        if (role === 'admin') {
            router.replace('/admin-dashboard')
            return
        }
        // Do not auto-redirect away based on user.status; rely on subscription-status
        // The global provider will move users off this page only when center becomes active.
        return () => { try { localStorage.removeItem('center_suspended') } catch {} }
    }, [user, router])

    const retry = async () => {
        try {
            setChecking(true)
            // Re-fetch user and a lightweight status endpoint
            await axios.get('/api/user')
            const res = await axios.get('/api/subscription-status')
            const role = user?.system_role?.name?.toLowerCase?.()
            if (res.data?.has_active_subscription && String(user?.status || '').toLowerCase() !== 'archived') {
                goToHomeByRole(role)
                return
            }
            // If still suspended, do a hard refresh
            router.refresh()
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            <TopNav variant="transparent" />

            <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur rounded-2xl shadow-lg ring-1 ring-blue-100 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400" />

                    <div className="px-8 py-10 md:px-12 md:py-12 text-center">
                        <div className="mx-auto mb-6 w-14 h-14 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Center Subscription Expired</h1>
                        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                            The center subscription has been expired, please wait until the director will renew the subscription.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={retry}
                                disabled={checking}
                                className={`inline-flex items-center justify-center px-5 py-2.5 rounded-md text-white font-medium shadow-sm transition-colors ${checking ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {checking ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        Checking…
                                    </span>
                                ) : (
                                    'Retry Access'
                                )}
                            </button>
                            <button
                                onClick={logout}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-medium text-red-700 bg-red-50 hover:bg-red-100 ring-1 ring-red-100"
                            >
                                Sign Out
                            </button>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-blue-900/70">
                            <ApplicationLogo className="h-5 w-5" />
                            <span>AidPoint</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
