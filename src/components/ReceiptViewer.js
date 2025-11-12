'use client'

import { useState, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const ReceiptViewer = ({ 
  receipt, 
  isOpen, 
  onClose, 
  onVerify = null, 
  showVerificationControls = false,
  isVerified = false 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const downloadLinkRef = useRef(null)

  if (!isOpen || !receipt) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFileType = (filePath) => {
    const extension = filePath?.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  const isImageFile = (filePath) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    return imageTypes.includes(getFileType(filePath))
  }

  const isPDFFile = (filePath) => {
    return getFileType(filePath) === 'pdf'
  }

  const handleDownload = async () => {
    if (!receipt.file_path) return
    
    try {
      const response = await fetch(receipt.file_path)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = downloadLinkRef.current
      link.href = url
      link.download = `receipt_${receipt.receipt_number || receipt.id}_${formatDate(receipt.receipt_date)}.${getFileType(receipt.file_path)}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download receipt. Please try again.')
    }
  }

  const handleVerification = (status) => {
    setShowVerificationModal(false)
    if (onVerify) {
      onVerify(receipt.id, status, verificationNotes)
    }
    setVerificationNotes('')
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(false)
    setImageError(true)
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
        <div className="relative min-h-screen">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Receipt #{receipt.receipt_number || 'N/A'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(receipt.amount)} • {formatDate(receipt.receipt_date)}
                  </p>
                </div>
                
                {isVerified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {receipt.file_path && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                )}
                
                {showVerificationControls && !isVerified && (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                  >
                    Verify Receipt
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Main Content Area */}
            <div className="flex-1 bg-gray-100">
              {receipt.file_path ? (
                <div className="h-full">
                  {isPDFFile(receipt.file_path) ? (
                    /* PDF Viewer */
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <svg className="mx-auto h-20 w-20 text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
                        <p className="text-gray-600 mb-6">Click below to open the PDF receipt in a new tab</p>
                        <a 
                          href={receipt.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open PDF
                        </a>
                      </div>
                    </div>
                  ) : isImageFile(receipt.file_path) ? (
                    /* Image Viewer with Zoom */
                    <div className="h-full relative">
                      <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={5}
                        centerOnInit={true}
                        wheel={{ wheelDisabled: false }}
                        doubleClick={{ disabled: false }}
                      >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                          <>
                            {/* Zoom Controls */}
                            <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
                              <button
                                onClick={() => zoomIn()}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Zoom In"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                              <button
                                onClick={() => zoomOut()}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Zoom Out"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                </svg>
                              </button>
                              <button
                                onClick={() => resetTransform()}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Reset Zoom"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            
                            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                              <div className="relative">
                                {!imageLoaded && !imageError && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                )}
                                
                                <img 
                                  src={receipt.file_path} 
                                  alt="Receipt"
                                  className={`max-w-full max-h-full object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                                  onLoad={handleImageLoad}
                                  onError={handleImageError}
                                  style={{ cursor: 'grab' }}
                                />
                                
                                {imageError && (
                                  <div className="flex items-center justify-center p-8 bg-gray-200 rounded">
                                    <div className="text-center">
                                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-gray-500">Failed to load image</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TransformComponent>
                          </>
                        )}
                      </TransformWrapper>
                    </div>
                  ) : (
                    /* Unknown File Type */
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">File Type Not Supported</p>
                        <p className="text-gray-500 mb-4">This file type cannot be previewed in the browser</p>
                        <button
                          onClick={handleDownload}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        >
                          Download File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No File */
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Receipt file not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div className="w-full lg:w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Amount</label>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(receipt.amount)}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Receipt Number</label>
                    <div className="text-gray-900">{receipt.receipt_number || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date</label>
                    <div className="text-gray-900">{formatDate(receipt.receipt_date)}</div>
                  </div>
                  
                  {receipt.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Description</label>
                      <div className="text-gray-900 text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                        {receipt.description}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">File Type</label>
                    <div className="text-gray-900 capitalize">{getFileType(receipt.file_path)} file</div>
                  </div>
                  
                  {receipt.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Uploaded</label>
                      <div className="text-gray-900 text-sm">{formatDate(receipt.created_at)}</div>
                    </div>
                  )}
                </div>
                
                {/* Verification Status */}
                {showVerificationControls && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Verification Status</h4>
                    {isVerified ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-3 rounded-lg">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Receipt Verified</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Pending Verification</span>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => handleVerification('verified')}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                          >
                            Mark as Verified
                          </button>
                          <button
                            onClick={() => setShowVerificationModal(true)}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                          >
                            Flag as Invalid
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* File Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">File Actions</h4>
                  <div className="space-y-2">
                    {receipt.file_path && (
                      <>
                        <button
                          onClick={handleDownload}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Original
                        </button>
                        
                        <a
                          href={receipt.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Tab
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Flag Receipt as Invalid
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Please provide a reason for marking this receipt as invalid. This will be reported to the beneficiary.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Invalid Receipt
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    placeholder="Explain why this receipt is being flagged as invalid..."
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => {
                    setShowVerificationModal(false)
                    setVerificationNotes('')
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerification('invalid')}
                  disabled={!verificationNotes.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
                >
                  Flag as Invalid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </>
  )
}

export default ReceiptViewer