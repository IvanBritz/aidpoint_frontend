'use client'

import { useAuth } from '@/hooks/auth'
import CaseworkerSideNavigation from '@/app/(staff)/CaseworkerSideNavigation'
import FinanceSideNavigation from '@/app/(financial)/FinanceSideNavigation'
import DirectorSideNavigation from '@/app/(financial)/DirectorSideNavigation'
import Loading from '@/components/Loading'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const AppLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const pathname = usePathname()

    const roleName = user?.system_role?.name?.toLowerCase?.()
    const isStaff = roleName === 'caseworker' || roleName === 'finance'
    const isDirector = roleName === 'director'
    const isFinance = roleName === 'finance'

    const status = String(user?.status || '').toLowerCase()
    const isArchivedOrInactive = user && roleName !== 'director' && (status === 'archived' || status === 'inactive')
    
    // Redirect archived/inactive staff to suspension notice
    useEffect(() => {
        if (isArchivedOrInactive && !pathname?.startsWith('/suspended')) {
            router.replace('/suspended')
        }
    }, [isArchivedOrInactive, router, pathname])

    // Allow directors to access director-specific routes AND staff routes like liquidation-completed
    const isDirectorRoute = pathname?.startsWith('/director-')
    const isSharedStaffRoute = ['/liquidation-completed', '/staff-dashboard', '/audit-logs'].some(route => pathname?.startsWith(route))
    const canAccess = isStaff || isDirectorRoute || (isDirector && isSharedStaffRoute)

    useEffect(() => {
        if (!user) return
        if (!canAccess) {
            // Not authorized to access this route — redirect them to their appropriate area
            switch (roleName) {
                case 'admin':
                    router.push('/admin-dashboard')
                    break
                case 'director':
                    router.push('/facility-registration')
                    break
                case 'beneficiary':
                    router.push('/dashboard')
                    break
                default:
                    router.push('/dashboard')
            }
        }
    }, [user, canAccess, roleName, router])

    if (isArchivedOrInactive && !pathname?.startsWith('/suspended')) return <Loading />

    if (!user) return <Loading />
    if (!canAccess) return <Loading />

    // If it's a director route, let the specific layout handle it
    if (isDirectorRoute) {
        return children
    }

    // If it's a finance user, use sidebar navigation
    if (isFinance) {
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

    // If it's a director on a shared staff route, use director sidebar navigation
    if (isDirector && isSharedStaffRoute) {
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

    // For caseworkers, use sidebar navigation
    return (
        <div className="min-h-screen bg-gray-100">
            <CaseworkerSideNavigation user={user} />
            <div className="lg:pl-64">
                <div className="lg:hidden">
                    <div className="h-16"></div>
                </div>
                <main>{children}</main>
            </div>
        </div>
    )
}

export default AppLayout
