'use client'

import { useAuth } from '@/hooks/auth'
import Navigation from '@/app/(beneficiary)/Navigation'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    // Redirect archived/inactive beneficiaries to suspension notice
    useEffect(() => {
        const status = String(user?.status || '').toLowerCase()
        if (user && (status === 'archived' || status === 'inactive')) {
            router.replace('/suspended')
        }
    }, [user, router])

    // If archived/inactive and redirecting, avoid rendering beneficiary UI to prevent overlap
    {
        const status = String(user?.status || '').toLowerCase()
        if (user && (status === 'archived' || status === 'inactive')) {
            return <Loading />
        }
    }

    useEffect(() => {
        if (user && user.systemrole_id !== 6) {
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
    if (user.systemrole_id !== 6) {
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
