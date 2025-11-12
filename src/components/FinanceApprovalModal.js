'use client'

import { useEffect } from 'react'

const FinanceApprovalModal = ({ 
  isOpen, 
  onClose,
  beneficiaryId = "00000",
  amount = "500,000",
  caseworkerApproved = "11/6/2026"
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
        className="fixed inset-0 bg-black bg-opacity-55 backdrop-blur transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 font-medium">localhost:3000 says</div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.3 19.7 2.89 18.29 9.17 12 2.89 5.71 4.3 4.3 10.59 10.59 16.89 4.3z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 py-4">
            {/* Success Status */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.34 6.2-6.19 1.4 1.41z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  Step 2 Complete
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Liquidation approved by Finance.
                </p>
              </div>
            </div>

            {/* Next Step */}
            <div className="flex items-center gap-2 mb-4 ml-2">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Next: Director will perform the final approval.
              </span>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Finance Approve - Step 2
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Beneficiary ID:</span>
                  <span className="text-red-600 font-semibold">{beneficiaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Caseworker Approved:</span>
                  <span className="font-semibold">{caseworkerApproved}</span>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Workflow
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Beneficiary - Complete */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.34 6.2-6.19 1.4 1.41z"/>
                  </svg>
                  <span className="text-xs font-medium text-green-700">Beneficiary</span>
                </div>
                
                {/* Arrow */}
                <span className="text-gray-400 text-sm">→</span>
                
                {/* Caseworker - Complete */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.34 6.2-6.19 1.4 1.41z"/>
                  </svg>
                  <span className="text-xs font-medium text-green-700">Caseworker</span>
                </div>
                
                {/* Arrow */}
                <span className="text-gray-400 text-sm">→</span>
                
                {/* Finance - Complete */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.34 6.2-6.19 1.4 1.41z"/>
                  </svg>
                  <span className="text-xs font-medium text-green-700">Finance</span>
                </div>
                
                {/* Arrow */}
                <span className="text-gray-400 text-sm">→</span>
                
                {/* Director - Pending */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full">
                  <span className="text-xs font-medium text-gray-600">Director</span>
                </div>
              </div>
            </div>

            {/* Optional Notes Section */}
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Finance Approval Notes (Optional)
              </div>
              <textarea
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md resize-none bg-gray-50"
                rows="3"
                placeholder="Enter any financial review notes..."
                readOnly
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Processing...
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceApprovalModal