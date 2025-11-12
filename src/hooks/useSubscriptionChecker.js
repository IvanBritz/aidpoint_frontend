'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'

/**
 * Hook to check subscription status periodically for directors
 * and redirect to plans page when subscription expires
 */
export const useSubscriptionChecker = (user) => {
    const router = useRouter()

    const checkSubscriptionStatus = useCallback(async () => {
        // Only check for directors
        if (!user || user.system_role?.name?.toLowerCase() !== 'director') {
            return
        }

        try {
            // Check subscription status via API
            const response = await axios.get('/api/subscription-status')
            
            // If subscription is inactive/expired, redirect to plans
            if (response.data && !response.data.has_active_subscription) {
                // Store the current path for potential future use
                if (!window.location.pathname.startsWith('/plans')) {
                    sessionStorage.setItem('redirect_after_subscription', window.location.pathname)
                }
                
                // Redirect to plans page
                router.push('/plans')
                return
            }

        } catch (error) {
            // If we get a 403 error with subscription messages, redirect to plans
            if (error.response?.status === 403) {
                const message = error.response?.data?.message || ''
                
                const subscriptionKeywords = [
                    'subscription required',
                    'access is suspended',
                    'subscription has expired',
                    'renew to regain access',
                    'your access is suspended until you renew'
                ]
                
                const isSubscriptionError = subscriptionKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword.toLowerCase())
                )
                
                if (isSubscriptionError) {
                    if (!window.location.pathname.startsWith('/plans')) {
                        sessionStorage.setItem('redirect_after_subscription', window.location.pathname)
                    }
                    router.push('/plans')
                }
            }
        }
    }, [user, router])

    useEffect(() => {
        // Only run for directors
        if (!user || user.system_role?.name?.toLowerCase() !== 'director') {
            return
        }

        // Check immediately on mount
        checkSubscriptionStatus()

        // Set up periodic checking every 30 seconds
        const interval = setInterval(() => {
            checkSubscriptionStatus()
        }, 30000)

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [checkSubscriptionStatus, user])

    return { checkSubscriptionStatus }
}