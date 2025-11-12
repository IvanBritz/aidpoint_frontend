'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

const CaseworkerLiquidationsRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/caseworker/liquidation-approvals')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <>
      <Header title="Liquidation Approvals" />
      <div className="py-12">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-8 text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔄 Redirecting to Liquidation Approvals
              </h2>
              
              <p className="text-gray-600 mb-6">
                We're taking you to the improved liquidation approvals interface with better features and functionality.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Redirecting in 3 seconds...</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/caseworker/liquidation-approvals')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Go Now - New Interface
                  </button>
                  <button
                    onClick={() => router.push('/caseworker-liquidation')}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                  >
                    Use Legacy Interface
                  </button>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">✨ New Features Include:</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Advanced filtering and search capabilities</li>
                  <li>• Bulk approve/reject actions</li>
                  <li>• Better receipt viewing with zoom</li>
                  <li>• Visual approval workflow tracking</li>
                  <li>• Enhanced mobile responsiveness</li>
                  <li>• Real-time status updates</li>
                </ul>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <p>If you're not redirected automatically, click the "Go Now" button above.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CaseworkerLiquidationsRedirect