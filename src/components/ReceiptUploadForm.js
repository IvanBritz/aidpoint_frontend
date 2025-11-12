'use client'

import { useState } from 'react'

const ReceiptUploadForm = ({ 
  receipts, 
  setReceipts, 
  disbursedAmount = 0, 
  showAmountTracking = true,
  error,
  setError,
  selectedDisbursement = null
}) => {
  const addReceipt = () => {
    const newReceipt = {
      id: Date.now(),
      file: null,
      amount: '',
      receipt_number: '',
      receipt_date: '',
      description: ''
    }
    setReceipts([...receipts, newReceipt])
  }

  const removeReceipt = (id) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id))
  }

  const updateReceipt = (id, field, value) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === id ? { ...receipt, [field]: value } : receipt
    ))
  }

  const handleFileChange = (id, file) => {
    updateReceipt(id, 'file', file)
  }

  const getTotalReceiptAmount = () => {
    return receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount) || 0), 0)
  }

  const getRemainingAmount = () => {
    return Math.max(0, disbursedAmount - getTotalReceiptAmount())
  }

  const getCompletionPercentage = () => {
    if (disbursedAmount <= 0) return 0
    return Math.min(100, (getTotalReceiptAmount() / disbursedAmount) * 100)
  }

  const isComplete = () => {
    return disbursedAmount > 0 && Math.abs(getRemainingAmount()) < 0.01
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  const getDateConstraints = () => {
    if (!selectedDisbursement?.request_month || !selectedDisbursement?.request_year) {
      return { min: null, max: null, info: null }
    }

    const year = selectedDisbursement.request_year
    const month = selectedDisbursement.request_month
    const firstDay = new Date(year, month - 1, 1)
    const lastAllowed = new Date(year, month, 0) // end of month

    const fmt = d => d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    const infoText = `Receipts must be dated within ${selectedDisbursement.request_period || `${month}/${year}`} — ${fmt(firstDay)} to ${fmt(lastAllowed)}`

    return {
      min: firstDay.toISOString().split('T')[0],
      max: lastAllowed.toISOString().split('T')[0],
      info: infoText
    }
  }

  const validateReceiptDate = (date) => {
    if (!selectedDisbursement?.request_month || !selectedDisbursement?.request_year) {
      return true // No validation if no period specified
    }

    const receiptDate = new Date(date)
    const requestYear = selectedDisbursement.request_year
    const requestMonth = selectedDisbursement.request_month

    return receiptDate.getFullYear() === requestYear && receiptDate.getMonth() + 1 === requestMonth
  }

  return (
    <div className="space-y-4">
      {showAmountTracking && disbursedAmount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Liquidation Progress</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(disbursedAmount)}
              </div>
              <div className="text-sm text-blue-700">Total Disbursed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(getTotalReceiptAmount())}
              </div>
              <div className="text-sm text-green-700">Receipt Total</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRemainingAmount() > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {formatCurrency(getRemainingAmount())}
              </div>
              <div className={`text-sm ${getRemainingAmount() > 0 ? 'text-red-700' : 'text-green-700'}`}>
                Remaining
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                isComplete() ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {getCompletionPercentage().toFixed(1)}% Complete
            {isComplete() && (
              <span className="ml-2 text-green-600 font-semibold">✓ Fully Liquidated</span>
            )}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900">Receipt Details</h4>
          <button
            type="button"
            onClick={addReceipt}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          >
            Add Receipt
          </button>
        </div>

        {receipts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No receipts added yet. Click "Add Receipt" to start.</p>
          </div>
        )}

        {receipts.map((receipt, index) => (
          <div key={receipt.id} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-medium text-gray-900">Receipt #{index + 1}</h5>
              {receipts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReceipt(receipt.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Image/Document *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(receipt.id, e.target.files[0])}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {receipt.file && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {receipt.file.name} ({(receipt.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Amount (₱) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={receipt.amount}
                  onChange={(e) => updateReceipt(receipt.id, 'amount', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OR/Invoice Number
                </label>
                <input
                  type="text"
                  value={receipt.receipt_number}
                  onChange={(e) => updateReceipt(receipt.id, 'receipt_number', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter receipt or invoice number"
                />
              </div>

              {/* Receipt Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  value={receipt.receipt_date}
                  onChange={(e) => {
                    const newDate = e.target.value
                    updateReceipt(receipt.id, 'receipt_date', newDate)
                    
                    // Client-side validation
                    if (newDate && !validateReceiptDate(newDate)) {
                      const constraints = getDateConstraints()
                      setError(`Receipt date must be within the requested fund period: ${constraints.info}`)
                    } else if (error && error.includes('Receipt date must be within')) {
                      setError(null)
                    }
                  }}
                  min={getDateConstraints().min}
                  max={getDateConstraints().max}
                  className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    receipt.receipt_date && !validateReceiptDate(receipt.receipt_date) 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  required
                />
                {getDateConstraints().info && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 {getDateConstraints().info}
                  </p>
                )}
                {receipt.receipt_date && !validateReceiptDate(receipt.receipt_date) && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ This date is outside the allowed period for this fund request
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={receipt.description}
                  onChange={(e) => updateReceipt(receipt.id, 'description', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what this receipt is for"
                />
              </div>
            </div>
          </div>
        ))}

        {showAmountTracking && disbursedAmount > 0 && getTotalReceiptAmount() > disbursedAmount && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm font-medium">Warning</p>
            </div>
            <p className="text-red-600 text-sm mt-1">
              Total receipt amount ({formatCurrency(getTotalReceiptAmount())}) exceeds disbursed amount ({formatCurrency(disbursedAmount)}).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceiptUploadForm