'use client'

import { useAuth } from '@/hooks/auth'
import Navigation from '@/app/(beneficiary)/Navigation'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    // Redirect archived beneficiaries to suspension notice
    useEffect(() => {
        if (user && String(user.status || '').toLowerCase() === 'archived') {
            router.replace('/suspended')
        }
    }, [user, router])

    // If archived and redirecting, avoid rendering beneficiary UI to prevent overlap
    if (user && String(user.status || '').toLowerCase() === 'archived') {
        return <Loading />
    }

    useEffect(() => {
        if (user && user.systemrole_id !== 4) {
            // Not beneficiary, redirect to appropriate dashboard
            switch(user.systemrole_id) {
                case 1: // Admin
                    router.push('/admin-dashboard')
                    break
                case 2: // Director
                case 3: // Employee
                    router.push('/facility-dashboard')
                    break
                default:
                    router.push('/dashboard')
            }
        }
    }, [user, router])

    if (!user) {
        return <Loading />
    }

    // Only allow beneficiary users
    if (user.systemrole_id !== 4) {
        return <Loading />
    }
    return (
        <div className="min-h-screen bg-gray-100">
            <Navigation user={user} />
            

            <main>{children}</main>
        </div>
    )
}

export default AppLayout
