'use client'

import { useAuth } from '@/hooks/auth'
import Navigation from '@/app/(admin)/Navigation'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    useEffect(() => {
        if (user && user.systemrole_id !== 1) {
            // Not admin, redirect to appropriate dashboard
            switch(user.systemrole_id) {
                case 2: // Director
                case 3: // Employee
                    router.push('/facility-dashboard')
                    break
                case 4: // Beneficiary
                    router.push('/dashboard')
                    break
                default:
                    router.push('/dashboard')
            }
        }
    }, [user, router])

    if (!user) {
        return <Loading />
    }

    // Only allow admin users
    if (user.systemrole_id !== 1) {
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
