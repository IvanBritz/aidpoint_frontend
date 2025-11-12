'use client'

import { useEffect } from 'react'
import '../styles/modal-animations.css'

const SimpleLiquidationSuccessModal = ({ 
  isOpen, 
  onClose, 
  title = "Liquidation Submitted Successfully", 
  message = "Your liquidation has been submitted and is ready for caseworker approval.",
  details = null,
  showWorkflowSteps = true 
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Icon */}
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6">
            {/* Success Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 shadow-lg success-icon-bounce">
              <svg 
                className="h-10 w-10 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="mt-4 text-xl font-bold text-gray-900 leading-tight text-center">
              {title}
            </h3>
            
            {/* Subtitle */}
            <p className="mt-2 text-sm text-green-700 font-medium text-center">
              {message}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Details Section */}
            {details && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Submission Details
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {details.amount && (
                    <div>Amount: <span className="font-semibold">{details.amount}</span></div>
                  )}
                  {details.receipts && (
                    <div>Receipts: <span className="font-semibold">{details.receipts} uploaded</span></div>
                  )}
                  {details.type && (
                    <div>Type: <span className="font-semibold">{details.type}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow Steps */}
            {showWorkflowSteps && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Approval Workflow
                </h4>
                <div className="space-y-3">
                  {/* Step 1: Submitted */}
                  <div className="flex items-center workflow-step">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-semibold mr-3">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">Submitted by You</div>
                      <div className="text-xs text-gray-500">Completed just now</div>
                    </div>
                  </div>
                  
                  {/* Step 2: Caseworker (Active) */}
                  <div className="flex items-center workflow-step">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mr-3">
                      <div className="w-3 h-3 bg-purple-600 rounded-full pulse-dot"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">Caseworker Review</div>
                      <div className="text-xs text-purple-600 font-medium">In progress - awaiting review</div>
                    </div>
                  </div>
                  
                  {/* Step 3: Finance (Pending) */}
                  <div className="flex items-center opacity-60 workflow-step">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm font-semibold mr-3">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-500 text-sm">Finance Review</div>
                      <div className="text-xs text-gray-400">After caseworker approval</div>
                    </div>
                  </div>
                  
                  {/* Step 4: Director (Pending) */}
                  <div className="flex items-center opacity-60 workflow-step">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm font-semibold mr-3">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-500 text-sm">Director Approval</div>
                      <div className="text-xs text-gray-400">Final approval step</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Information Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg info-notice">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">What's next?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You'll receive notifications as your liquidation progresses through each approval stage. 
                    Track the status in your liquidation history below.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3">
            <button
              type="button"
              className="flex-1 inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm modal-button-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                onClose()
                // Scroll to liquidation history section
                setTimeout(() => {
                  const historySection = document.querySelector('[data-section="liquidation-history"]')
                  if (historySection) {
                    historySection.scrollIntoView({ behavior: 'smooth' })
                  }
                }, 100)
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View History
            </button>
            <button
              type="button"
              className="flex-1 inline-flex justify-center items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm modal-button-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleLiquidationSuccessModal