"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import TopNav from "@/components/TopNav"
import Link from "next/link"

const formatPrice = price =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(price || 0)
  )

const formatDuration = months => {
  if (!months) return ""
  if (months === 1) return "1 month"
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  let duration = years === 1 ? "1 year" : `${years} years`
  if (remainingMonths > 0) duration += remainingMonths === 1 ? ", 1 month" : `, ${remainingMonths} months`
  return duration
}

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showExpiredMessage, setShowExpiredMessage] = useState(false)
  const [subscribingPlanId, setSubscribingPlanId] = useState(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get("/api/public/subscription-plans")
        let allPlans = res.data?.data || []
        
        // Always hide the "Free" plan from this page
        allPlans = allPlans.filter(p => !(p.plan_name === 'Free' || (p.price === 0 && p.duration_in_months === 1)))
        
        // Filter out plans the user should not see
        try {
          // Get user's subscription transactions
          const transactionHistory = await axios.get("/api/subscription-transactions")
          const transactions = transactionHistory.data?.data || []
          
          // Track used free-trial plan IDs
          const usedFreeTrialPlanIds = transactions
            .filter(txn => txn.payment_method === 'FREE_TRIAL')
            .map(txn => txn.new_plan_id)
          
          // Determine if the "Free" plan has already been availed by this user
          const freePlan = allPlans.find(p => p.plan_name === 'Free' || (p.price === 0 && p.duration_in_months === 1))
          const hasUsedFreePlan = freePlan
            ? transactions.some(txn => String(txn.new_plan_id) === String(freePlan.plan_id))
            : false
          
          // Any paid subscription in history (excluding free trials)
          const hasPaidSubscription = transactions.some(txn => txn.payment_method !== 'FREE_TRIAL' && Number(txn.amount_paid || 0) > 0)
          
          // Filter:
          // 1) Hide free-trial plans already used
          // 2) Hide Free plan if user already availed it OR has any paid history (renewal scenario)
          const filteredPlans = allPlans.filter(plan => {
            const isFreeTrialPlan = plan.is_free_trial && plan.trial_seconds > 0
            const hasAlreadyUsedTrial = usedFreeTrialPlanIds.includes(plan.plan_id)
            const isFreePlan = plan.plan_name === 'Free' || (plan.price === 0 && plan.duration_in_months === 1)
            
            if (isFreeTrialPlan && hasAlreadyUsedTrial) return false
            if (isFreePlan && (hasUsedFreePlan || hasPaidSubscription)) return false
            
            return true
          })
          
          setPlans(filteredPlans)
        } catch (txnError) {
          // If transaction history is not accessible (e.g., unauthenticated user),
          // show all plans. Authenticated users will see filtered results.
          if (txnError.response?.status !== 401 && txnError.response?.status !== 403) {
            console.warn("Could not fetch transaction history", txnError)
          }
          setPlans(allPlans)
        }
      } catch (e) {
        console.error("Failed to fetch plans", e)
        setError("Unable to load plans right now. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
    
    // Check if user was redirected due to subscription expiry
    const redirectReason = sessionStorage.getItem('redirect_after_subscription')
    if (redirectReason) {
      setShowExpiredMessage(true)
      // Clear the session storage flag
      sessionStorage.removeItem('redirect_after_subscription')
    }

    // If returning from PayMongo (?paid=1), verify using stored checkout id
    ;(async () => {
      try {
        const qs = new URLSearchParams(window.location.search)
        const paid = qs.get('paid')
        const checkoutId = localStorage.getItem('pm_checkout_id')
        if (paid === '1' && checkoutId) {
          try { await axios.post('/api/payments/paymongo/checkout/verify', { checkout_id: checkoutId }) } catch {}
          try { localStorage.removeItem('pm_checkout_id') } catch {}
        }
      } catch {}
    })()

    // If user already has an active subscription, auto-redirect to dashboard
    ;(async () => {
      try {
        const status = await axios.get('/api/subscription-status')
        if (status.data?.has_active_subscription) {
          const facilities = await axios.get('/api/my-facilities')
          const first = Array.isArray(facilities.data) && facilities.data.length > 0 ? facilities.data[0] : null
          if (first?.id) window.location.replace(`/${first.id}/dashboard`)
        }
      } catch {}
    })()
  }, [])

  const handleSubscribe = async (plan) => {
    if (!plan) return
    setSubscribingPlanId(plan.plan_id)
    try {
      // Create checkout session without specifying payment method
      // Let PayMongo handle payment method selection
      const res = await axios.post('/api/payments/paymongo/checkout', {
        plan_id: plan.plan_id,
        return_url: `${window.location.origin}/plans`
      })
      const url = res.data?.checkout_url
      const id = res.data?.checkout_id
      try { if (id) localStorage.setItem('pm_checkout_id', id) } catch {}
      if (url) {
        window.location.href = url
      } else {
        alert('Failed to start checkout. Please try again.')
        setSubscribingPlanId(null)
      }
    } catch (e) {
      console.error('Checkout error', e)
      alert('Failed to start checkout. Please try again.')
      setSubscribingPlanId(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <TopNav />

      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950">Choose a plan</h1>
          <p className="mt-2 text-blue-900/80">These plans are configured by our administrators.</p>
          
          {showExpiredMessage && (
            <div className="mt-6 mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
                  <p className="text-sm text-red-700 mt-1">Your subscription has expired and access has been suspended. Please choose a plan below to regain access to your facility management features.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto bg-white ring-1 ring-red-100 text-red-700 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : plans.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white ring-1 ring-blue-100 text-blue-900 p-6 rounded-lg text-center">
            No plans are available at the moment.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <div key={plan.plan_id} className="relative rounded-2xl bg-white p-6 ring-1 ring-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-blue-950">{plan.plan_name}</h3>
                  <span className="text-sm px-2 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">{formatDuration(plan.duration_in_months)}</span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-blue-700">{formatPrice(plan.price)}</div>
                {plan.description && (
                  <p className="mt-3 text-sm text-blue-900/80 whitespace-pre-line">{plan.description}</p>
                )}
                <div className="mt-6 text-xs text-blue-900/60">Plan details are defined by the administrator.</div>
                <div className="mt-4">
                  <button 
                    onClick={() => handleSubscribe(plan)} 
                    disabled={subscribingPlanId === plan.plan_id}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscribingPlanId === plan.plan_id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe now
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
