'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import { useAuth } from '@/hooks/auth'
import { intervalToDuration } from 'date-fns'

export default function SubscriptionPage() {
    const { user } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const { facility_id } = useParams()
    const searchParams = useSearchParams()
    
    const [facility, setFacility] = useState(null)
    const [subscriptions, setSubscriptions] = useState({
        current: null,
        pending: null
    })
    const [allPlans, setAllPlans] = useState([])
    const [availablePlans, setAvailablePlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [subscribing, setSubscribing] = useState(null)
    const [downloading, setDownloading] = useState(null)
    const [showManualActivation, setShowManualActivation] = useState(false)
    const [lastPaymentPlan, setLastPaymentPlan] = useState(null)
    const [suspensionTriggered, setSuspensionTriggered] = useState(false)

    // Server-time sync to avoid client clock drift affecting expiry calculations
    const [serverOffsetMs, setServerOffsetMs] = useState(0)
    const getNow = () => new Date(Date.now() + serverOffsetMs)
    const syncServerTime = async () => {
        try {
            const res = await axios.get('/api/subscription-status')
            const ts = res.data?.checked_at
            if (ts) {
                let d = new Date(ts)
                if (isNaN(d)) {
                    const s = String(ts).replace(' ', 'T')
                    d = new Date(s.endsWith('Z') ? s : s + 'Z')
                    if (isNaN(d)) d = new Date(s)
                }
                if (!isNaN(d)) setServerOffsetMs(d.getTime() - Date.now())
            }
        } catch {/* non-fatal */}
    }
    useEffect(() => {
        syncServerTime()
        const i = setInterval(syncServerTime, 60_000)
        return () => clearInterval(i)
    }, [])

    useEffect(() => {
        if (facility_id) {
            // Handle reload after expiration
            try {
                const flag = typeof window !== 'undefined' ? localStorage.getItem('expired_reload') : null
                if (flag) {
                    localStorage.removeItem('expired_reload')
                    setError('Your subscription expired. Please choose a plan to regain access.')
                }
            } catch {}
            
            fetchFacilityData()
            fetchSubscriptionData()
            fetchAvailablePlans()
        }
    }, [facility_id])

    // Auto-refresh plans every 30 seconds to catch new plans created by admin
    useEffect(() => {
        const interval = setInterval(() => {
            if (facility_id && !loading) {
                fetchAvailablePlans()
            }
        }, 30000) // 30 seconds
        
        return () => clearInterval(interval)
    }, [facility_id, loading])

    // Handle PayMongo return flags (?paid=1 or ?cancelled=1) and finalize without webhook
    useEffect(() => {
        const paid = searchParams?.get('paid')
        const cancelled = searchParams?.get('cancelled')
        if (cancelled === '1') {
            setError('Payment was cancelled. No subscription was created.')
        }
        if (paid === '1') {
            setSuccess('Payment received. Activating your subscription...')
            const storedCheckoutId = typeof window !== 'undefined' ? localStorage.getItem('pm_checkout_id') : null
            ;(async () => {
                let finalized = false
                let verificationData = null
                
                try {
                    if (storedCheckoutId) {
                        const vr = await axios.post('/api/payments/paymongo/checkout/verify', { checkout_id: storedCheckoutId })
                        verificationData = vr.data
                        finalized = vr.data?.finalized === true
                        
                        console.log('Payment verification result:', {
                            finalized,
                            data: verificationData
                        })
                    }
                } catch (e) {
                    console.error('Payment verification failed:', e.response?.data || e.message)
                    // Continue with polling anyway
                } finally {
                    if (storedCheckoutId) localStorage.removeItem('pm_checkout_id')
                }

                // Always refresh subscription data first
                await fetchSubscriptionData()
                
                // Check if we now have an active subscription (lightweight check)
                const checkHasActiveSubscription = async () => {
                    try {
                        const response = await axios.get('/api/subscription-status')
                        if (response.data.success) {
                            const hasActive = response.data.has_active_subscription
                        if (hasActive) {
                                // Refresh full subscription data when we detect activation
                                await fetchSubscriptionData()
                                // Clear any prior expiry flags/messages
                                try { localStorage.removeItem('expired_reload') } catch {}
                            }
                            return hasActive
                        }
                    } catch (e) {
                        console.error('Error checking subscription status:', e)
                        // Fallback to full refresh
                        await fetchSubscriptionData()
                        return subscriptions.current?.status === 'Active'
                    }
                    return false
                }
                
                if (!finalized) {
                    // Poll for subscription activation
                    let attempts = 0
                    const maxAttempts = 15 // Increased attempts
                    setSuccess('Verifying payment and activating subscription...')
                    
                    const i = setInterval(async () => {
                        attempts += 1
                        console.log(`Polling attempt ${attempts}/${maxAttempts}`)
                        
                        const hasActive = await checkHasActiveSubscription()
                        
                        if (hasActive) {
                            clearInterval(i)
                            setSuccess('Subscription activated successfully!')
                            // Redirect to dashboard after successful activation
                            setTimeout(() => {
                                try { router.replace(`/${facility_id}/dashboard`) } catch {}
                            }, 800)
                        } else if (attempts >= maxAttempts) {
                            clearInterval(i)
                            setError('Payment received but subscription activation failed. Please use manual activation below.')
                            setShowManualActivation(true)
                            // Try to determine which plan was paid for
                            const basicPlan = allPlans.find(p => p.plan_name === 'Basic')
                            if (basicPlan) {
                                setLastPaymentPlan({ ...basicPlan, amount_paid: 499.00 })
                            }
                        }
                    }, 2000) // Poll every 2 seconds
                    
                    // Clean up interval on component unmount
                    return () => clearInterval(i)
                } else {
                    setSuccess('Subscription activated!')
                    // Redirect to dashboard after successful activation
                    setTimeout(() => {
                        try { router.replace(`/${facility_id}/dashboard`) } catch {}
                    }, 800)
                }
            })()
        }
    }, [searchParams])

    const fetchFacilityData = async () => {
        try {
            const response = await axios.get('/api/my-facilities')
            if (response.data.length > 0) {
                const userFacility = response.data[0]
                // Verify that the facility_id matches the id
                if (userFacility.id?.toString() === facility_id) {
                    setFacility(userFacility)
                } else {
                    setError('Facility not found or access denied')
                }
            } else {
                setError('No facility found')
            }
        } catch (error) {
            console.error('Error fetching facility:', error)
            setError('Failed to load facility data')
        }
    }

    const fetchSubscriptionData = async () => {
        try {
            const response = await axios.get('/api/my-subscriptions')
            if (response.data.success) {
                const subs = response.data.data
                
                // Helper: treat end_date as end-of-day and robustly parse DB formats
                const isOnOrAfterToday = (dateStr) => {
                    if (!dateStr) return false
                    try {
                        const s = String(dateStr).trim()
                        // Support: 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss'
                        const dateOnlyMatch = s.match(/^\d{4}-\d{2}-\d{2}/)
                        let d
                        if (dateOnlyMatch) {
                            const dateOnly = dateOnlyMatch[0]
                            d = new Date(`${dateOnly}T23:59:59`)
                        } else {
                            d = new Date(s)
                            if (!isNaN(d)) d.setHours(23,59,59,999)
                        }
                        if (isNaN(d)) return false
                        return d >= getNow()
                    } catch {
                        return false
                    }
                }
                
                // Separate current and pending subscriptions
                const current = subs.find(sub => 
                    sub.status === 'Active' && isOnOrAfterToday(sub.end_date)
                )
                
                console.log('Subscription check:', {
                    foundSubs: subs.length,
                    activeSubs: subs.filter(s => s.status === 'Active').map(s => ({
                        id: s.subscription_id,
                        plan: s.subscription_plan?.plan_name,
                        status: s.status,
                        end_date: s.end_date,
                        is_valid: isOnOrAfterToday(s.end_date)
                    })),
                    selectedCurrent: current ? {
                        id: current.subscription_id,
                        plan: current.subscription_plan?.plan_name,
                        status: current.status
                    } : null
                })
                const pending = subs.find(sub => sub.status === 'Pending')
                
                setSubscriptions({ current, pending })
                // If we have a valid current subscription, clear any stale expiry error
                if (current) setError('')
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error)
            setError('Failed to load subscription data.')
        }
    }

    const fetchAvailablePlans = async () => {
        try {
            let resp = null
            try {
                resp = await axios.get('/api/subscription-plans')
            } catch (e) {
                // Fallback to public endpoint when not authenticated (after suspension)
                resp = await axios.get('/api/public/subscription-plans')
            }
            const response = resp
            if (response.data.success !== false) {
                const data = response.data.data || response.data // handle both shapes
                const plans = (data || []).filter(plan => {
                    const name = (plan.plan_name || '').toLowerCase()
                    // exclude generic free and explicit free-trial plans
                    return name !== 'free' && (plan.is_free_trial ? false : true)
                })
                setAllPlans(plans)
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        } finally {
            setLoading(false)
        }
    }

    // Free trial activation (server enforces one-time director rule)
    const availFreeTrial = async (planId) => {
        setSubscribing(planId)
        setError('')
        setSuccess('')
        try {
            const res = await axios.post('/api/subscribe/free-trial', { plan_id: planId })
            if (res.data.success) {
                setSuccess('Free Trial activated!')
                await fetchSubscriptionData()
            }
        } catch (error) {
            console.error('Error availing free trial:', error)
            setError(error.response?.data?.message || 'Failed to start free trial.')
        } finally {
            setSubscribing(null)
        }
    }

    // Start PayMongo checkout with selected method and return URL so cancel goes back here
    const startCheckout = async (planId, method) => {
        if (subscriptions.pending) {
            setError('You already have a pending subscription. Only one pending subscription is allowed.')
            return
        }
        setSubscribing(planId)
        setError('')
        setSuccess('')
        try {
            const returnUrl = `${window.location.origin}/${facility_id}/dashboard`
            const res = await axios.post('/api/payments/paymongo/checkout', {
                plan_id: planId,
                method: method || undefined,
                return_url: returnUrl,
            })
            const url = res.data?.checkout_url
            const id = res.data?.checkout_id
            if (id) localStorage.setItem('pm_checkout_id', id)
            if (url) {
                window.location.href = url
                return
            }
            // fallback
            await axios.post('/api/subscribe', { plan_id: planId, facility_id })
            await fetchSubscriptionData()
        } catch (error) {
            console.error('Error starting checkout:', error)
            setError(error.response?.data?.message || 'Failed to start payment.')
        } finally {
            setSubscribing(null)
        }
    }

    const handleSubscribeToPlan = async (planId) => {
        if (subscriptions.pending) {
            setError('You already have a pending subscription. Only one pending subscription is allowed.')
            return
        }

        setSubscribing(planId)
        setError('')
        setSuccess('')

        try {
            // Start PayMongo Checkout (default GCash). To choose Maya, use startCheckout(planId,'paymaya').
            const returnUrl = `${window.location.origin}/${facility_id}/dashboard`
            const res = await axios.post('/api/payments/paymongo/checkout', {
                plan_id: planId,
                method: 'gcash',
                return_url: returnUrl,
            })
            const url = res.data?.checkout_url
            const id = res.data?.checkout_id
            if (id) localStorage.setItem('pm_checkout_id', id)
            if (url) {
                window.location.href = url
                return
            }
            // Fallback to old pending flow when checkout URL is not returned
            const response = await axios.post('/api/subscribe', { plan_id: planId, facility_id })
            if (response.data.success) {
                await fetchSubscriptionData()
                if (response.data.message) {
                    setSuccess(response.data.message)
                    setTimeout(() => setSuccess(''), 5000)
                }
            }
        } catch (error) {
            console.error('Error subscribing to plan:', error)
            const message = error.response?.data?.message || 'Failed to start payment.'
            setError(message)
        } finally {
            setSubscribing(null)
        }
    }

    // Manual activation for when payment succeeds but subscription doesn't activate
    const manualActivateSubscription = async () => {
        if (!lastPaymentPlan) {
            setError('No payment plan information available for manual activation.')
            return
        }
        
        setSubscribing('manual')
        setError('')
        setSuccess('')
        
        try {
            const res = await axios.post('/api/manual-subscription-activate', {
                plan_id: lastPaymentPlan.plan_id,
                payment_method: 'GCASH_PAYMONGO',
                amount_paid: lastPaymentPlan.amount_paid,
                notes: 'Manual activation after PayMongo payment success but auto-activation failed'
            })
            
            if (res.data.success) {
                setSuccess('Subscription manually activated successfully!')
                setShowManualActivation(false)
                await fetchSubscriptionData()
            }
        } catch (error) {
            console.error('Manual activation failed:', error)
            setError(error.response?.data?.message || 'Manual activation failed. Please contact support.')
        } finally {
            setSubscribing(null)
        }
    }

    const downloadReceipt = async (subscriptionId) => {
        try {
            setDownloading(subscriptionId)
            // Use backend baseURL directly to avoid Next.js proxy/404 and let browser handle download
            const apiBase = (axios.defaults.baseURL || '').replace(/\/$/, '')
            const url = `${apiBase}/api/subscriptions/${subscriptionId}/receipt?download=1`
            const a = document.createElement('a')
            a.href = url
            a.rel = 'noopener'
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (e) {
            setError('Failed to initiate receipt download.')
        } finally {
            setDownloading(null)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price)
    }

    const formatDuration = (months) => {
        if (months === 1) return '1 month'
        if (months < 12) return `${months} months`
        
        const years = Math.floor(months / 12)
        const remainingMonths = months % 12
        
        let duration = years === 1 ? '1 year' : `${years} years`
        if (remainingMonths > 0) {
            duration += remainingMonths === 1 ? ', 1 month' : `, ${remainingMonths} months`
        }
        
        return duration
    }

    const isExpiringSoon = (endDate) => {
        const end = new Date(endDate)
        const now = getNow()
        const diffTime = end - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 30 && diffDays > 0
    }

    // Normalize an end date to local end-of-day, handling both string and Date inputs
    const endOfDayLocal = (input) => {
        if (!input) return null
        try {
            if (typeof input === 'string') {
                const s = input.trim()
                // yyyy-mm-dd
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T23:59:59`)
                const d = new Date(s)
                if (!isNaN(d)) { d.setHours(23,59,59,999); return d }
                return null
            }
            const d = new Date(input)
            if (isNaN(d)) return null
            d.setHours(23,59,59,999)
            return d
        } catch {
            return null
        }
    }

    const isExpired = (endDate) => {
        const end = endOfDayLocal(endDate)
        if (!end) return true
        return end < getNow()
    }

    // Compute the exact expiry Date object for a subscription
    const getExactEnd = (sub) => {
        if (!sub) return null
        const plan = sub.subscription_plan || {}
        const parseFlexible = (s) => {
            try {
                if (!s) return null
                const t = String(s).trim()
                // ISO-ish date/time
                const d = new Date(t.includes('T') || /\d\s+\d/.test(t) ? t : `${t}T00:00:00`)
                return isNaN(d) ? null : d
            } catch { return null }
        }
        // 1) Prefer explicit datetime from API if present
        const direct = parseFlexible(sub.expires_at || sub.expiry_at || sub.end_at || sub.end_datetime || sub.end_date_time)
        if (direct) return direct
        // 2) If end_date has time, parse as-is; if date-only, fall back to computed end
        const endMaybe = parseFlexible(sub.end_date)
        if (endMaybe && (String(sub.end_date).includes('T') || /\d\s+\d/.test(String(sub.end_date)))) return endMaybe
        // 3) Compute from start date + plan duration
        const start = parseFlexible(sub.start_date) || parseFlexible(sub.created_at) || new Date()
        if (isNaN(start)) return endMaybe || null
        const addMonthsSafe = (date, months) => {
            const d = new Date(date)
            const targetMonth = d.getMonth() + months
            const targetYear = d.getFullYear() + Math.floor(targetMonth / 12)
            const monthIndex = ((targetMonth % 12) + 12) % 12
            const day = d.getDate()
            // Set to first day of target month then clamp day
            const tmp = new Date(d)
            tmp.setFullYear(targetYear, monthIndex, 1)
            const lastDay = new Date(targetYear, monthIndex + 1, 0).getDate()
            tmp.setDate(Math.min(day, lastDay))
            return tmp
        }
        let end = new Date(start)
        const m = Number(plan.duration_in_months || 0)
        if (m) end = addMonthsSafe(end, m)
        const days = Number(plan.duration_in_days || 0)
        if (days) end = new Date(end.getTime() + days * 24 * 60 * 60 * 1000)
        const secs = Number(plan.duration_in_seconds || plan.trial_seconds || 0)
        if (secs) end = new Date(end.getTime() + secs * 1000)
        return end || endMaybe || null
    }

    // Trial/seconds-based countdown (must be declared before any early returns)
    const [trialRemaining, setTrialRemaining] = useState(null)
    useEffect(() => {
        const sub = subscriptions.current
        const plan = sub?.subscription_plan
        if (!sub || !plan) { setTrialRemaining(null); return }

        // Try to infer seconds-based access
        const inferPlanSeconds = (p) => {
            if (p.duration_in_seconds && p.duration_in_seconds > 0) return p.duration_in_seconds
            if (p.trial_seconds && p.trial_seconds > 0) return p.trial_seconds
            // Parse from name or description like "25 seconds"
            const src = `${p.plan_name || ''} ${p.description || ''}`
            const m = src.match(/(\d+)\s*second(s)?/i)
            return m ? parseInt(m[1], 10) : 0
        }
        const secondsWindow = plan.is_free_trial ? (plan.trial_seconds || 0) : inferPlanSeconds(plan)
        if (secondsWindow <= 0) { setTrialRemaining(null); return }

        const startTs = new Date(sub.created_at || sub.start_date || Date.now()).getTime()
        const tick = () => {
            const elapsed = Math.floor(((getNow().getTime()) - startTs) / 1000)
            const remain = Math.max(0, secondsWindow - elapsed)
            setTrialRemaining(remain)
            if (remain <= 0) {
                // Refresh to reflect server-side auto-expire
                fetchSubscriptionData()
            }
        }
        tick()
        const i = setInterval(tick, 1000)
        return () => clearInterval(i)
    }, [subscriptions.current])

    // General remaining time (years, months, days, hours, minutes, seconds) for current subscription
    const [remainingParts, setRemainingParts] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
    useEffect(() => {
        const sub = subscriptions.current;
        if (!sub) {
            setRemainingParts({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        // For seconds-based (trial or inferred), show seconds countdown only
        if (trialRemaining !== null) {
            setRemainingParts({ years: 0, months: 0, days: 0, hours: 0, minutes: Math.floor(Math.max(0, trialRemaining) / 60), seconds: Math.max(0, trialRemaining) % 60 });
            return;
        }

        const calculateRemaining = () => {
            const now = getNow();
            const end = getExactEnd(sub) || endOfDayLocal(sub.end_date);

            if (!end || end < now) {
                setRemainingParts({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            let tempNow = new Date(now);

            let years = end.getFullYear() - tempNow.getFullYear();
            tempNow.setFullYear(tempNow.getFullYear() + years);
            if (tempNow > end) {
                years--;
                tempNow.setFullYear(tempNow.getFullYear() - 1);
            }

            let months = 0;
            while (true) {
                let nextMonth = new Date(tempNow);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                if (nextMonth > end) {
                    break;
                }
                tempNow.setMonth(tempNow.getMonth() + 1);
                months++;
            }

            const diffTime = end.getTime() - tempNow.getTime();
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let remainingMillis = diffTime % (1000 * 60 * 60 * 24);
            const hours = Math.floor(remainingMillis / (1000 * 60 * 60));
            remainingMillis = remainingMillis % (1000 * 60 * 60);
            const minutes = Math.floor(remainingMillis / (1000 * 60));
            const seconds = Math.floor((remainingMillis % (1000 * 60)) / 1000);

            setRemainingParts({ years, months, days, hours, minutes, seconds });
        };

        calculateRemaining();
        const interval = setInterval(calculateRemaining, 1000);

        return () => clearInterval(interval);
    }, [subscriptions.current, trialRemaining]);

    // When we actually hit expiry (not just initial 0s), trigger suspension and redirect
    useEffect(() => {
        if (suspensionTriggered) return

        // Require that we have a loaded current subscription before acting
        const sub = subscriptions.current
        if (!sub) return

        // If this is a seconds-based trial, require trialRemaining === 0 explicitly
        if (trialRemaining !== null) {
            if (trialRemaining > 0) return
        } else {
            // For date-based plans, double-check expiry using server time-aware now
            const end = getExactEnd(sub) || endOfDayLocal(sub.end_date)
            if (!end || end > getNow()) return
        }

        const monthsTotal = (remainingParts.years || 0) * 12 + (remainingParts.months || 0)
        const allZero = monthsTotal === 0 && remainingParts.days === 0 && remainingParts.hours === 0 && remainingParts.minutes === 0 && remainingParts.seconds === 0
        if (!allZero) return

        (async () => {
            try {
                setSuspensionTriggered(true)
                const res = await axios.post('/api/subscriptions/expire-now')
                if (res.data?.suspended) {
                    try { sessionStorage.setItem('redirect_after_subscription', 'expired') } catch {}
                    setTimeout(() => { router.replace('/plans') }, 500)
                }
            } catch (e) {
                console.error('Suspension trigger failed', e)
                try { sessionStorage.setItem('redirect_after_subscription', 'expired') } catch {}
                setTimeout(() => { router.replace('/plans') }, 1000)
            }
        })()
    }, [remainingParts, subscriptions.current, trialRemaining])

    // Recompute available plans: show ALL paid plans, exclude Free/0-price
    useEffect(() => {
        const filtered = allPlans.filter(p => {
            const price = p.price ? parseFloat(p.price) : 0
            const name = (p.plan_name || '').toLowerCase()
            if (name === 'free') return false
            return price > 0
        })
        filtered.sort((a, b) => {
            const priceA = parseFloat(a.price) || 0
            const priceB = parseFloat(b.price) || 0
            return priceA - priceB
        })
        setAvailablePlans(filtered)
    }, [allPlans])

    if (loading) {
        return (
            <>
                <Header title="My Subscription" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    if (error && !facility) {
        return (
            <>
                <Header title="My Subscription" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200 text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={() => router.push('/facility-registration')}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Register Facility
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="My Subscription" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Facility Info */}
                    {facility && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Subscription for: {facility.center_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Facility ID: {facility.id} | Center ID: {facility.center_id}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {success}
                            <button
                                onClick={() => setSuccess('')}
                                className="absolute top-2 right-2 text-green-700 hover:text-green-900"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                            <button
                                onClick={() => setError('')}
                                className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Current Subscription */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Subscription</h2>
                            
                            {subscriptions.current ? (
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {subscriptions.current.subscription_plan?.plan_name || 'Unknown Plan'}
                                            </h3>
                                            <p className="text-2xl font-bold text-green-600 mt-2">
                                                {formatPrice(subscriptions.current.subscription_plan?.price || 0)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                                subscriptions.current.status === 'Active' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {subscriptions.current.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* Live countdown */}
                                            <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {trialRemaining !== null ? (
                                                    <>Remaining: {String(Math.floor((trialRemaining||0)/3600)).padStart(2,'0')}h {String(Math.floor(((trialRemaining||0)%3600)/60)).padStart(2,'0')}m {String((trialRemaining||0)%60).padStart(2,'0')}s</>
                                                ) : (
                                                    <>Remaining: {remainingParts.years>0 && `${remainingParts.years}y `}{remainingParts.months>0 && `${remainingParts.months}m `}{remainingParts.days>0 && `${remainingParts.days}d `}{String(remainingParts.hours||0).padStart(2,'0')}:{String(remainingParts.minutes||0).padStart(2,'0')}:{String(remainingParts.seconds||0).padStart(2,'0')}</>
                                                )}
                                            </span>
                                            <button
                                                onClick={() => downloadReceipt(subscriptions.current.subscription_id)}
                                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-white text-sm ${downloading === subscriptions.current.subscription_id ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                disabled={downloading === subscriptions.current.subscription_id}
                                            >
                                                {downloading === subscriptions.current.subscription_id ? 'Preparing...' : 'Download Receipt (PDF)'}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Start Date</p>
                                            <p className="font-medium">
                                                {new Date(subscriptions.current.start_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">End Date</p>
                                            <p className={`font-medium ${
                                                isExpired(subscriptions.current.end_date) 
                                                    ? 'text-red-600'
                                                    : isExpiringSoon(subscriptions.current.end_date)
                                                    ? 'text-yellow-600'
                                                    : 'text-gray-900'
                                            }`}>
                                                {new Date(subscriptions.current.end_date).toLocaleDateString()}
                                                {isExpired(subscriptions.current.end_date) && ' (Expired)'}
                                                {isExpiringSoon(subscriptions.current.end_date) && ' (Expiring Soon)'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {subscriptions.current.subscription_plan?.description && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600">Description</p>
                                            <p className="text-gray-800">{subscriptions.current.subscription_plan.description}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg">No active subscription</p>
                                    <p className="text-sm">Subscribe to a plan to continue using our services.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Subscription */}
                    {subscriptions.pending && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Subscription</h2>
                                
                                <div className="border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1 pr-4">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                {subscriptions.pending.subscription_plan?.plan_name || 'Unknown Plan'}
                                            </h3>
                                            <p className="text-2xl font-bold text-orange-600">
                                                {formatPrice(subscriptions.pending.subscription_plan?.price || 0)}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 ring-1 ring-orange-200">
                                                Pending Activation
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/60 rounded-md p-4 backdrop-blur-sm">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        This subscription will become active when your current subscription expires or when activated by admin.
                                                    </p>
                                                </div>
                                                <div className="grid sm:grid-cols-2 gap-3 ml-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration:</span>
                                                        <span className="text-sm font-medium text-gray-900">{formatDuration(subscriptions.pending.subscription_plan?.duration_in_months || 0)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested:</span>
                                                        <span className="text-sm font-medium text-gray-900">{new Date(subscriptions.pending.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center lg:justify-end">
                                                <button
                                                    onClick={() => downloadReceipt(subscriptions.pending.subscription_id)}
                                                    className={`inline-flex items-center px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm ${downloading === subscriptions.pending.subscription_id ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'} transition-all duration-200`}
                                                    disabled={downloading === subscriptions.pending.subscription_id}
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {downloading === subscriptions.pending.subscription_id ? 'Preparing...' : 'Download Receipt (PDF)'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual Activation Section */}
                    {showManualActivation && lastPaymentPlan && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-yellow-800 mb-4">Manual Subscription Activation</h2>
                                <div className="bg-white rounded-md p-4 border border-yellow-200">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-yellow-800 mb-2">Payment Received - Activation Required</h3>
                                            <p className="text-sm text-yellow-700 mb-4">
                                                Your payment of <strong>₱{lastPaymentPlan.amount_paid?.toFixed(2)}</strong> for the <strong>{lastPaymentPlan.plan_name}</strong> plan was successfully received, but automatic activation failed. Please click the button below to manually activate your subscription.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={manualActivateSubscription}
                                                    disabled={subscribing === 'manual'}
                                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                                        subscribing === 'manual'
                                                            ? 'bg-yellow-400 text-yellow-800 cursor-wait'
                                                            : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500'
                                                    }`}
                                                >
                                                    {subscribing === 'manual' ? 'Activating...' : 'Activate Subscription Now'}
                                                </button>
                                                <button
                                                    onClick={() => setShowManualActivation(false)}
                                                    className="px-4 py-2 rounded-md font-medium text-sm text-yellow-700 hover:text-yellow-900 focus:outline-none"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Available Plans */}
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-2xl border border-gray-200">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-white">Available Plans</h2>
                                <button
                                    onClick={() => {
                                        fetchAvailablePlans()
                                        setSuccess('Plans refreshed!')
                                        setTimeout(() => setSuccess(''), 2000)
                                    }}
                                    className="inline-flex items-center px-4 py-2 border-2 border-white/30 shadow-sm text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-8">
                            {availablePlans.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {availablePlans.map((plan) => (
                                        <div
                                            key={plan.plan_id}
                                            className="relative border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 group"
                                        >
                                            <div className="mb-6">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {plan.plan_name}
                                                    </h3>
                                                    {(plan.is_free_trial || (plan.plan_name || '').toLowerCase().includes('free trial')) && (
                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Trial</span>
                                                    )}
                                                </div>
                                                <div className="text-3xl font-bold text-green-600 mt-3">
                                                    {formatPrice(plan.price)}
                                                    {(plan.is_free_trial || (plan.plan_name || '').toLowerCase().includes('free trial')) && (
                                                        <span className="ml-2 text-xs text-gray-500 font-normal">(30 sec)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        Duration: {formatDuration(plan.duration_in_months)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {plan.description && (
                                                <div className="mb-6">
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="mt-auto">
                                                {plan.is_free_trial ? (
                                                    <button
                                                        onClick={() => availFreeTrial(plan.plan_id)}
                                                        disabled={subscribing === plan.plan_id || !plan.is_free_trial_eligible}
                                                        className={`w-full px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                                                            !plan.is_free_trial_eligible
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                                                : subscribing === plan.plan_id
                                                                ? 'bg-purple-400 text-white cursor-wait'
                                                                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                                                        }`}
                                                    >
                                                        {plan.is_free_trial_eligible ? (subscribing === plan.plan_id ? 'Activating...' : 'Start Free Trial') : 'Trial Unavailable'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => startCheckout(plan.plan_id)}
                                                        disabled={subscribing === plan.plan_id || subscriptions.pending}
                                                        className={`w-full px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                                                            subscriptions.pending
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                                                : subscribing === plan.plan_id
                                                                ? 'bg-emerald-400 text-white cursor-wait'
                                                                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
                                                        }`}
                                                    >
                                                        {subscribing === plan.plan_id ? 'Processing...' : 'Subscribe Now'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-500 text-lg font-medium">No subscription plans available at the moment.</p>
                                    <p className="text-gray-400 text-sm mt-2">Please check back later or contact support.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Back to Dashboard */}
                    <div className="text-center">
                        <button
                            onClick={() => router.push(`/${facility_id}/dashboard`)}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
