'use client'

import { useAuth } from '@/hooks/auth'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginLinks from '@/components/LoginLinks'

const CaseworkerLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    useEffect(() => {
        if (user && user.systemRole && user.systemRole.name.toLowerCase() !== 'caseworker') {
            // Not a caseworker, redirect to appropriate dashboard
            const roleName = user.systemRole.name.toLowerCase()
            switch(roleName) {
                case 'admin':
                    router.push('/admin-dashboard')
                    break
                case 'director':
                case 'employee':
                    router.push('/facility-dashboard')
                    break
                case 'beneficiary':
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

    // Only allow caseworker users
    if (!user.systemRole || user.systemRole.name.toLowerCase() !== 'caseworker') {
        return <Loading />
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Financial Aid System</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <LoginLinks />
                        </div>
                    </div>
                </div>
            </nav>
            
            <main>{children}</main>
        </div>
    )
}

export default CaseworkerLayout
