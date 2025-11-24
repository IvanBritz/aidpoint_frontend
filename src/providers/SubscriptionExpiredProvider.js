'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const SubscriptionExpiredProvider = ({ children }) => {
    const router = useRouter()
    const pathname = usePathname()
    const isAuthPath = (() => {
        const p = typeof window !== 'undefined' ? window.location.pathname : pathname
        return ['/login','/register','/verify-email','/login-verification','/forgot-password','/password-reset'].some(x => p?.startsWith(x))
    })()
    const { user } = useAuth({ skipInitialUserFetch: isAuthPath })

    // Gate to avoid noisy requests before we confirm center status for non-directors
    const [gateReady, setGateReady] = useState(false)

    // Server time sync (avoids client clock drift)
    const [serverOffsetMs, setServerOffsetMs] = useState(0)
    const getNow = () => new Date(Date.now() + serverOffsetMs)

    // Timer management to trigger redirect at exact expiry time
    const expiryTimeoutRef = useRef(null)
    const firingRef = useRef(false)

    const clearExpiryTimer = () => {
        if (expiryTimeoutRef.current) {
            clearTimeout(expiryTimeoutRef.current)
            expiryTimeoutRef.current = null
        }
    }

    const triggerExpiryRedirect = async () => {
        if (firingRef.current) return
        firingRef.current = true
        try {
            const role = user?.system_role?.name?.toLowerCase()
            const path = typeof window !== 'undefined' ? window.location.pathname : ''
            if (role === 'director') {
                // Ask server to suspend now (idempotent)
                try { await axios.post('/api/subscriptions/expire-now') } catch {}
                try { sessionStorage.setItem('redirect_after_subscription', 'expired') } catch {}
                if (!path.startsWith('/plans')) {
                    router.replace('/plans')
                }
            } else if (role === 'admin') {
                // Admins are exempt — keep them in the app
                if (!path.startsWith('/admin-dashboard')) {
                    router.replace('/admin-dashboard')
                }
            } else {
                if (!path.startsWith('/suspended')) {
                    router.replace('/suspended')
                }
            }
        } finally {
            clearExpiryTimer()
            setTimeout(() => { firingRef.current = false }, 1000)
        }
    }

    const goToDashboard = async () => {
        const role = user?.system_role?.name?.toLowerCase()
        const dest = role === 'admin' ? '/admin-dashboard' : '/dashboard'
        router.replace(dest)
    }

    const goHomeByRole = async () => {
        const role = user?.system_role?.name?.toLowerCase()
        if (role === 'director') return goToDashboard()
        if (role === 'admin') return router.replace('/admin-dashboard')
        // All associated users go to the same dashboard
        return router.replace('/dashboard')
    }

    // Non-directors archived/inactive → lockout page (and mark suspended immediately)
    useEffect(() => {
        const role = user?.system_role?.name?.toLowerCase?.()
        if (!user || role === 'director' || role === 'admin') return
        const status = String(user.status || '').toLowerCase()
        if (status === 'archived' || status === 'inactive') {
            try { localStorage.setItem('center_suspended', '1') } catch {}
            if (!pathname?.startsWith('/suspended')) {
                router.replace('/suspended')
            }
        }
    }, [user, router, pathname])

    // Immediate localStorage guard before any server check completes
    useEffect(() => {
        const role = user?.system_role?.name?.toLowerCase?.()
        if (role === 'director' || role === 'admin') return
        const suspendedFlag = (() => { try { return localStorage.getItem('center_suspended') === '1' } catch { return false } })()
        if (suspendedFlag && !pathname?.startsWith('/suspended')) {
            router.replace('/suspended')
        }
    }, [pathname, user, router])

    // Compute exact end date from subscription + plan
    const computeEnd = (sub) => {
        if (!sub) return null
        const plan = sub.subscription_plan || {}

        // Helper: parse flexible datetime / date-only
        const parseFlexible = (s) => {
            try {
                if (!s) return null
                const t = String(s).trim()
                if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(`${t}T23:59:59`)
                const d = new Date(t.includes('T') ? t : t.replace(' ', 'T'))
                if (!isNaN(d)) return d
                return null
            } catch { return null }
        }
        // Seconds-based window
        const inferSeconds = (p) => {
            if (p.duration_in_seconds && p.duration_in_seconds > 0) return p.duration_in_seconds
            if (p.is_free_trial && p.trial_seconds && p.trial_seconds > 0) return p.trial_seconds
            const src = `${p.plan_name || ''} ${p.description || ''}`
            const m = src.match(/(\d+)\s*second(s)?/i)
            return m ? parseInt(m[1], 10) : 0
        }

        const seconds = inferSeconds(plan)
        if (seconds > 0) {
            const start = parseFlexible(sub.created_at) || parseFlexible(sub.start_date) || new Date()
            if (!start) return null
            return new Date(start.getTime() + seconds * 1000)
        }

        // Prefer explicit end datetime if present
        const direct = parseFlexible(sub.expires_at || sub.end_at || sub.end_datetime || sub.end_date_time)
        if (direct) return direct
        const end = parseFlexible(sub.end_date)
        return end
    }

    const scheduleExpiryTimer = (statusPayload) => {
        try {
            // Maintain server time offset from checked_at
            const ts = statusPayload?.checked_at
            if (ts) {
                let d = new Date(ts)
                if (isNaN(d)) {
                    const s = String(ts).replace(' ', 'T')
                    d = new Date(s.endsWith('Z') ? s : s + 'Z')
                    if (isNaN(d)) d = new Date(s)
                }
                if (!isNaN(d)) setServerOffsetMs(d.getTime() - Date.now())
            }
        } catch {}

        const sub = statusPayload?.current_subscription
        clearExpiryTimer()
        if (!sub) return
        const end = computeEnd(sub)
        if (!end) return
        const now = getNow()
        const remainingMs = end.getTime() - now.getTime()
        if (remainingMs <= 0) {
            triggerExpiryRedirect()
            return
        }
        // Schedule with max timeout cap (~24.8 days). If longer, fall back to periodic checks.
        const cap = 2147483647 // 2^31-1
        if (remainingMs > cap) {
            // Poll every minute until within cap
            expiryTimeoutRef.current = setTimeout(() => checkSubscriptionStatus(), 60 * 1000)
        } else {
            expiryTimeoutRef.current = setTimeout(() => triggerExpiryRedirect(), remainingMs)
        }
    }

    const checkSubscriptionStatus = useCallback(async () => {
        if (!user) return
        const role = user.system_role?.name?.toLowerCase()
        try {
            const response = await axios.get('/api/subscription-status')
            if (response.data) {
                const hasActive = !!response.data.has_active_subscription
                const path = typeof window !== 'undefined' ? window.location.pathname : ''

                if (!hasActive) {
                    if (role === 'director') {
                        if (!path.startsWith('/plans')) {
                            sessionStorage.setItem('redirect_after_subscription', path)
                        }
                        router.push('/plans')
                    } else if (role === 'admin') {
                        // Admins remain inside the app
                        if (!path.startsWith('/admin-dashboard')) {
                            router.replace('/admin-dashboard')
                        }
                    } else {
                        if (!path.startsWith('/suspended')) {
                            router.replace('/suspended')
                        }
                    }
                    return
                }

                // Schedule timer to redirect exactly when expiry hits for all users (directors→/plans, others→/suspended)
                scheduleExpiryTimer(response.data)

                // If access has been restored and user is on lockout screens, send them home
                if (role === 'director') {
                    if (path.startsWith('/plans')) {
                        await goToDashboard()
                        return
                    }
                } else if (role === 'admin') {
                    if (path.startsWith('/suspended')) {
                        await goToDashboard()
                        return
                    }
                } else if (path.startsWith('/suspended')) {
                    // Only leave /suspended when access is really restored (director renewed)
                    await goHomeByRole()
                    return
                }
            }
        } catch (error) {
            if (error.response?.status === 403) {
                const message = error.response?.data?.message || ''
                const subscriptionKeywords = [
                    'subscription required',
                    'access is suspended',
                    'subscription has expired',
                    'renew to regain access',
                    'your access is suspended until you renew'
                ]
                const isSubscriptionError = subscriptionKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))
                if (isSubscriptionError) {
                    if (role === 'director') {
                        if (!window.location.pathname.startsWith('/plans')) {
                            sessionStorage.setItem('redirect_after_subscription', window.location.pathname)
                        }
                        router.push('/plans')
                    } else {
                        if (!window.location.pathname.startsWith('/suspended')) {
                            router.push('/suspended')
                        }
                    }
                }
            }
        }
    }, [user, router])

    useEffect(() => {
        if (!user) {
            return
        }

        // If returning from PayMongo, verify then redirect appropriately
        (async () => {
            try {
                const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
                const paid = qs?.get('paid')
                const checkoutId = typeof window !== 'undefined' ? localStorage.getItem('pm_checkout_id') : null
                if (paid === '1' && checkoutId) {
                    try { await axios.post('/api/payments/paymongo/checkout/verify', { checkout_id: checkoutId }) } catch {}
                    try { localStorage.removeItem('pm_checkout_id') } catch {}
                    const status = await axios.get('/api/subscription-status')
                    if (status.data?.has_active_subscription) {
                        await goToDashboard()
                        return
                    }
                }
            } catch {}
        })()

        // Initial check + timer schedule
        checkSubscriptionStatus()

        // Periodic status refresh for ALL users (keeps timers and lockout state up-to-date)
        const statusInterval = setInterval(() => {
            checkSubscriptionStatus()
        }, 30000)

        // Axios 403 interceptor
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 403) {
                    const role = user?.system_role?.name?.toLowerCase()
                    const message = error.response?.data?.message || ''
                    const subscriptionKeywords = [
                        'subscription required',
                        'access is suspended',
                        'subscription has expired',
                        'renew to regain access',
                        'your access is suspended until you renew'
                    ]
                    const isSubscriptionError = subscriptionKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))
                    if (isSubscriptionError) {
                        if (role === 'director') {
                            if (!window.location.pathname.startsWith('/plans')) {
                                sessionStorage.setItem('redirect_after_subscription', window.location.pathname)
                            }
                            router.push('/plans')
                        } else if (role === 'admin') {
                            if (!window.location.pathname.startsWith('/admin-dashboard')) {
                                router.push('/admin-dashboard')
                            }
                        } else {
                            if (!window.location.pathname.startsWith('/suspended')) {
                                router.push('/suspended')
                            }
                        }
                    }
                }
                return Promise.reject(error)
            }
        )

        // Re-schedule timer on visibility/focus to minimize drift
        const onFocus = () => checkSubscriptionStatus()
        const onVisibility = () => { if (document.visibilityState === 'visible') checkSubscriptionStatus() }
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            clearInterval(statusInterval)
            axios.interceptors.response.eject(interceptor)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibility)
            clearExpiryTimer()
        }
    }, [router, user, checkSubscriptionStatus])

    // Hard guard on route changes: non-directors cannot leave /suspended while center inactive; if active and on /suspended, send them home
    useEffect(() => {
        if (!user) return
        const role = user?.system_role?.name?.toLowerCase?.()
        const path = pathname || '/'
        // Only enforce for non-directors
        if (role === 'director' || role === 'admin') return
        ;(async () => {
            try {
                const res = await axios.get('/api/subscription-status')
                const hasActive = !!res.data?.has_active_subscription
                if (!hasActive) {
                    try { localStorage.setItem('center_suspended', '1') } catch {}
                    setGateReady(false)
                    if (!path.startsWith('/suspended')) {
                        router.replace('/suspended')
                    }
                } else {
                    try { localStorage.removeItem('center_suspended') } catch {}
                    setGateReady(true)
                    if (path.startsWith('/suspended')) {
                        await goHomeByRole()
                    }
                }
            } catch (err) {
                // If blocked by middleware, force /suspended
                if (!path.startsWith('/suspended')) router.replace('/suspended')
            }
        })()
    }, [pathname, user])

    // While on /suspended (non-director), block noisy API calls at the client to avoid spamming 403s
    useEffect(() => {
        if (!user) return
        const role = user?.system_role?.name?.toLowerCase?.()
        const path = pathname || '/'
        if (role === 'director' || role === 'admin') return
        const suspendedFlag = (() => { try { return localStorage.getItem('center_suspended') === '1' } catch { return false } })()
        // If we haven't confirmed active status yet for non-directors, also block
        const shouldBlock = suspendedFlag || !gateReady || path.startsWith('/suspended')
        if (!shouldBlock) return

        const allowlist = [
            '/api/user',
            '/api/subscription-status',
            '/api/public/',
            '/api/subscription-plans',
            '/api/subscribe',
            '/api/manual-subscription-activate',
            '/api/cancel-pending-subscription',
            '/api/payments/paymongo/',
            '/api/subscriptions/expire-now',
        ]
        const isAllowed = (url) => {
            if (!url) return false
            // Axios may pass full absolute URL; extract path portion
            try {
                const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
                const p = u.pathname
                return allowlist.some(a => p.startsWith(a))
            } catch {
                return allowlist.some(a => String(url).startsWith(a))
            }
        }

        const reqId = axios.interceptors.request.use((config) => {
            const suspended = (() => { try { return localStorage.getItem('center_suspended') === '1' } catch { return false } })()
            const gate = !gateReady
            if ((path.startsWith('/suspended') || suspended || gate) && config?.url && !isAllowed(config.url)) {
                // Short-circuit the request with a synthetic 204 to avoid network and console noise
                const originalAdapter = config.adapter
                config.adapter = async () => ({
                    data: { blocked_while_suspended: true },
                    status: 204,
                    statusText: 'No Content',
                    headers: {},
                    config,
                    request: undefined,
                })
                // Keep a reference in case other interceptors inspect it
                config.__blocked_while_suspended = true
                return config
            }
            return config
        })

        return () => {
            axios.interceptors.request.eject(reqId)
        }
    }, [pathname, user, gateReady])

    return children
}

export default SubscriptionExpiredProvider
