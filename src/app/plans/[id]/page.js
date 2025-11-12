'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from '@/lib/axios'
import TopNav from '@/components/TopNav'
import Link from 'next/link'

export default function PlanDetailsPage() {
  const { id } = useParams() || {}
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`/api/public/subscription-plans/${id}`)
        if (res.data?.success) setPlan(res.data.data)
        else setError('Plan not found.')
      } catch (e) {
        console.error('Failed to fetch plan', e)
        setError('Unable to load plan details.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [id])

  const subscribe = async () => {
    if (!plan) return
    setPaying(true)
    try {
      // Don't pass method - let PayMongo handle payment method selection
      const res = await axios.post('/api/payments/paymongo/checkout', {
        plan_id: plan.plan_id,
        return_url: `${window.location.origin}/plans`
      })
      const url = res.data?.checkout_url
      const id = res.data?.checkout_id
      try { if (id) localStorage.setItem('pm_checkout_id', id) } catch {}
      if (url) window.location.href = url
      else alert('Failed to start checkout.')
    } catch (e) {
      console.error('Checkout error', e)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(price || 0))
  const formatDuration = (months) => {
    if (!months) return ''
    if (months === 1) return '1 month'
    if (months < 12) return `${months} months`
    const years = Math.floor(months / 12)
    const rem = months % 12
    let txt = years === 1 ? '1 year' : `${years} years`
    if (rem > 0) txt += rem === 1 ? ', 1 month' : `, ${rem} months`
    return txt
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <TopNav />

      <section className="max-w-3xl mx-auto px-6 pt-10 pb-16">
        <div className="mb-6">
          <Link href="/plans" className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to plans
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white ring-1 ring-red-100 text-red-700 p-4 rounded-lg text-center">{error}</div>
        ) : !plan ? (
          <div className="bg-white ring-1 ring-blue-100 text-blue-900 p-6 rounded-lg text-center">Plan not found.</div>
        ) : (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-blue-100 shadow-sm">
            <h1 className="text-3xl font-extrabold text-blue-950">{plan.plan_name}</h1>
            <div className="mt-3 text-2xl font-bold text-blue-700">{formatPrice(plan.price)}</div>
            <div className="mt-1 text-sm text-blue-900/70">Duration: {formatDuration(plan.duration_in_months)}</div>
            {plan.description && (
              <p className="mt-6 text-blue-900/90 whitespace-pre-line">{plan.description}</p>
            )}
            <div className="mt-6 text-xs text-blue-900/60">All details are defined by the administrator.</div>
            {Number(plan.price) > 0 && (
              <div className="mt-8">
                <button 
                  disabled={paying} 
                  onClick={subscribe} 
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {paying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Subscribe now'
                  )}
                </button>
                <p className="mt-3 text-xs text-center text-blue-900/60">
                  You will be redirected to PayMongo to choose your payment method (GCash, Maya, etc.)
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
