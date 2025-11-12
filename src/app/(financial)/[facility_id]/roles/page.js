'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function RolesPageRemoved() {
    const router = useRouter()
    const { facility_id } = useParams()

    useEffect(() => {
        if (facility_id) {
            router.replace(`/${facility_id}/employees`)
        }
    }, [facility_id, router])

    return (
        <>
            <Header title="Redirecting" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Loading />
                </div>
            </div>
        </>
    )
}
