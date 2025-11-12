'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscriptionRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center text-gray-600">
            Redirecting...
        </div>
    )
}
