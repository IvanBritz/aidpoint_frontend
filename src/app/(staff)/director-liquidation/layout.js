'use client'

import { useAuth } from '@/hooks/auth'
import DirectorSideNavigation from '@/app/(financial)/DirectorSideNavigation'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const DirectorLiquidationLayout = ({ children }) => {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    const roleName = user?.system_role?.name?.toLowerCase()
    const isDirector = roleName === 'director'

    useEffect(() => {
        if (!user) return
        if (!isDirector) {
            // Not a director — redirect them to their appropriate area
            switch (roleName) {
                case 'admin':
                    router.push('/admin-dashboard')
                    break
                case 'caseworker':
                case 'finance':
                    router.push('/staff-dashboard')
                    break
                case 'beneficiary':
                    router.push('/dashboard')
                    break
                default:
                    router.push('/dashboard')
            }
        }
    }, [user, isDirector, roleName, router])

    if (!user) return <Loading />
    if (!isDirector) return <Loading />

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

export default DirectorLiquidationLayout