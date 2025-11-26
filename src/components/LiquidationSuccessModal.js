'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

const LiquidationSuccessModal = ({ 
  isOpen, 
  onClose, 
  title = "Liquidation Submitted Successfully", 
  message = "Your liquidation has been submitted and is ready for caseworker approval.",
  details = null,
  showWorkflowSteps = true 
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header with Icon */}
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 shadow-lg">
                    <svg 
                      className="h-10 w-10 text-green-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </div>
                  
                  <Dialog.Title
                    as="h3"
                    className="mt-4 text-xl font-bold text-gray-900 leading-tight"
                  >
                    {title}
                  </Dialog.Title>
                  
                  <p className="mt-2 text-sm text-green-700 font-medium">
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
                        Next Steps
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-semibold mr-3">
                            ✓
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Submitted by You</div>
                            <div className="text-xs text-gray-500">Completed just now</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mr-3 animate-pulse">
                            1
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Caseworker Review</div>
                            <div className="text-xs text-gray-500">Your caseworker will review and approve</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center opacity-60">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm font-semibold mr-3">
                            2
                          </div>
                          <div>
                            <div className="font-medium text-gray-500 text-sm">Finance Review</div>
                            <div className="text-xs text-gray-400">After caseworker approval</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center opacity-60">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm font-semibold mr-3">
                            3
                          </div>
                          <div>
                            <div className="font-medium text-gray-500 text-sm">Director Approval</div>
                            <div className="text-xs text-gray-400">Final approval step</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Information Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800">What happens next?</p>
                        <p className="text-sm text-amber-700 mt-1">
                          You'll receive notifications as your liquidation moves through each approval stage. 
                          You can track the progress in your liquidation history.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    View History
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all"
                    onClick={onClose}
                  >
                    Got it!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default LiquidationSuccessModal
'use client'
