'use client'

import { useAuth } from '@/hooks/auth'
import { useSubscriptionChecker } from '@/hooks/useSubscriptionChecker'
import DirectorSideNavigation from '@/app/(financial)/DirectorSideNavigation'
import FinanceSideNavigation from '@/app/(financial)/FinanceSideNavigation'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    
    // Initialize subscription checker for directors
    useSubscriptionChecker(user)

    // Redirect archived/inactive non-directors (finance) to suspension notice
    useEffect(() => {
        const role = user?.system_role?.name?.toLowerCase?.()
        const status = String(user?.status || '').toLowerCase()
        if (user && role !== 'director' && (status === 'archived' || status === 'inactive')) {
            router.replace('/suspended')
        }
    }, [user, router])

    useEffect(() => {
        if (user) {
            const roleName = user.system_role?.name?.toLowerCase()
            
            // Only allow finance users and directors in financial layout
            if (roleName !== 'finance' && roleName !== 'director') {
                switch(roleName) {
                    case 'admin':
                        router.push('/admin-dashboard')
                        break
                    case 'caseworker':
                        router.push('/staff-dashboard')
                        break
                    case 'beneficiary':
                        router.push('/dashboard')
                        break
                    default:
                        router.push('/dashboard')
                }
            }
        }
    }, [user, router])

    if (!user) {
        return <Loading />
    }

    const roleName = user.system_role?.name?.toLowerCase()
    const isDirector = roleName === 'director'
    
    // Only allow finance users and directors in financial layout
    if (roleName !== 'finance' && roleName !== 'director') {
        return <Loading />
    }

    // Director layout with side navigation
    if (isDirector) {
        return (
            <div className="min-h-screen bg-gray-100">
                <DirectorSideNavigation user={user} />
                <div className="lg:pl-64">
                    <div className="lg:hidden">
                        {/* Mobile header spacer */}
                        <div className="h-16"></div>
                    </div>
                    <main>{children}</main>
                </div>
            </div>
        )
    }

    // Finance layout with side navigation
    return (
        <div className="min-h-screen bg-gray-100">
            <FinanceSideNavigation user={user} />
            <div className="lg:pl-64">
                <div className="lg:hidden">
                    {/* Mobile header spacer */}
                    <div className="h-16"></div>
                </div>
                <main>{children}</main>
            </div>
        </div>
    )
}

export default AppLayout
