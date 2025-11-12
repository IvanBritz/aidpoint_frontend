'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const EnhancedLiquidationApprovals = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  
  const [liquidations, setLiquidations] = useState([])
  const [filteredLiquidations, setFilteredLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLiquidations, setSelectedLiquidations] = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState('approve')
  const [bulkNotes, setBulkNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const loadLiquidations = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/api/liquidations/pending-approvals')
      
      let liquidationsData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          liquidationsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          liquidationsData = response.data.data
        }
      }
      
      setLiquidations(liquidationsData)
      setFilteredLiquidations(liquidationsData)
    } catch (err) {
      console.error('Error loading liquidations:', err)
      setError(err?.response?.data?.message || 'Failed to load liquidations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLiquidations()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...liquidations]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(liq => 
        `${liq.beneficiary?.firstname} ${liq.beneficiary?.lastname}`.toLowerCase().includes(query) ||
        liq.beneficiary?.email?.toLowerCase().includes(query) ||
        liq.beneficiary?.student_id?.toLowerCase().includes(query) ||
        liq.disbursement_type?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(liq => liq.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(liq => liq.disbursement_type === typeFilter)
    }

    // Amount filter
    if (amountFilter !== 'all') {
      const amount = parseFloat(liq.total_disbursed_amount || 0)
      filtered = filtered.filter(liq => {
        const amount = parseFloat(liq.total_disbursed_amount || 0)
        switch (amountFilter) {
          case 'small': return amount < 5000
          case 'medium': return amount >= 5000 && amount < 20000
          case 'large': return amount >= 20000
          default: return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'amount_high':
          return (b.total_disbursed_amount || 0) - (a.total_disbursed_amount || 0)
        case 'amount_low':
          return (a.total_disbursed_amount || 0) - (b.total_disbursed_amount || 0)
        case 'name':
          return `${a.beneficiary?.firstname} ${a.beneficiary?.lastname}`.localeCompare(
            `${b.beneficiary?.firstname} ${b.beneficiary?.lastname}`
          )
        default:
          return 0
      }
    })

    setFilteredLiquidations(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [liquidations, searchQuery, statusFilter, typeFilter, amountFilter, sortBy])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDisbursementLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'tuition': return 'Tuition Fee'
      case 'cola': return 'COLA'
      case 'other': return 'Other'
      default: return type || 'Unknown'
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_caseworker_approval': {
        label: 'PENDING REVIEW',
        className: 'bg-purple-100 text-purple-800'
      },
      'pending_finance_approval': {
        label: 'FINANCE REVIEW',
        className: 'bg-indigo-100 text-indigo-800'
      },
      'approved': {
        label: 'APPROVED',
        className: 'bg-green-100 text-green-800'
      },
      'rejected': {
        label: 'REJECTED',
        className: 'bg-red-100 text-red-800'
      }
    }

    const config = statusConfig[status] || {
      label: 'UNKNOWN',
      className: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleSelectLiquidation = (liquidationId) => {
    setSelectedLiquidations(prev => 
      prev.includes(liquidationId)
        ? prev.filter(id => id !== liquidationId)
        : [...prev, liquidationId]
    )
  }

  const handleSelectAll = () => {
    const currentPageLiquidations = getCurrentPageLiquidations()
    const allSelected = currentPageLiquidations.every(liq => selectedLiquidations.includes(liq.id))
    
    if (allSelected) {
      setSelectedLiquidations(prev => 
        prev.filter(id => !currentPageLiquidations.some(liq => liq.id === id))
      )
    } else {
      const newSelections = currentPageLiquidations
        .filter(liq => !selectedLiquidations.includes(liq.id))
        .map(liq => liq.id)
      setSelectedLiquidations(prev => [...prev, ...newSelections])
    }
  }

  const handleBulkAction = async () => {
    if (selectedLiquidations.length === 0) return

    try {
      setProcessing(true)
      
      const promises = selectedLiquidations.map(liquidationId => {
        const endpoint = bulkAction === 'approve' 
          ? `/api/liquidations/${liquidationId}/caseworker-approve`
          : `/api/liquidations/${liquidationId}/caseworker-reject`
        
        const payload = bulkAction === 'approve' 
          ? { notes: bulkNotes } 
          : { reason: bulkNotes }
        
        return axios.post(endpoint, payload)
      })

      await Promise.all(promises)
      
      alert(`${selectedLiquidations.length} liquidations have been ${bulkAction === 'approve' ? 'approved' : 'rejected'} successfully.`)
      
      // Reset states and reload
      setSelectedLiquidations([])
      setShowBulkModal(false)
      setBulkNotes('')
      await loadLiquidations()
      
    } catch (err) {
      console.error('Error processing bulk action:', err)
      alert('Some liquidations could not be processed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Pagination logic
  const getCurrentPageLiquidations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLiquidations.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredLiquidations.length / itemsPerPage)

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setAmountFilter('all')
    setSortBy('newest')
  }

  const getFilterCount = () => {
    let count = 0
    if (searchQuery) count++
    if (statusFilter !== 'all') count++
    if (typeFilter !== 'all') count++
    if (amountFilter !== 'all') count++
    return count
  }

  return (
    <>
      <Header title="Liquidation Approvals - Enhanced" />
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Liquidation Approvals</h1>
                <p className="text-gray-600">Review and approve liquidations from your assigned beneficiaries</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadLiquidations}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
                >
                  Refresh
                </button>
                {selectedLiquidations.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    Actions ({selectedLiquidations.length})
                  </button>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{liquidations.length}</div>
                <div className="text-sm text-gray-600">Total Pending</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {liquidations.filter(l => l.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved Today</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(liquidations.reduce((sum, l) => sum + (l.total_disbursed_amount || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(liquidations.filter(l => l.total_receipt_amount && l.total_disbursed_amount).reduce(
                    (sum, l) => sum + ((l.total_receipt_amount / l.total_disbursed_amount) * 100), 0
                  ) / Math.max(liquidations.length, 1))}%
                </div>
                <div className="text-sm text-gray-600">Avg Liquidated</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search by name, email, or student ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-md font-medium ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586l-4-4V9.414a1 1 0 00-.293-.707L3.293 2.707A1 1 0 013 2V4z" />
                      </svg>
                      Filters {getFilterCount() > 0 && <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs">{getFilterCount()}</span>}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Highest Amount</option>
                    <option value="amount_low">Lowest Amount</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending_caseworker_approval">Pending Review</option>
                        <option value="pending_finance_approval">Finance Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="tuition">Tuition Fee</option>
                        <option value="cola">COLA</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                      <select
                        value={amountFilter}
                        onChange={(e) => setAmountFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Amounts</option>
                        <option value="small">Under ₱5,000</option>
                        <option value="medium">₱5,000 - ₱20,000</option>
                        <option value="large">Over ₱20,000</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={clearAllFilters}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading liquidations...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button onClick={loadLiquidations} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Try Again
                </button>
              </div>
            ) : filteredLiquidations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No liquidations found</p>
                <p className="text-sm text-gray-500">
                  {getFilterCount() > 0 ? 'Try adjusting your filters' : 'No liquidations are pending your review'}
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={getCurrentPageLiquidations().length > 0 && getCurrentPageLiquidations().every(liq => selectedLiquidations.includes(liq.id))}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Select All ({getCurrentPageLiquidations().length} items)
                    </span>
                  </div>
                </div>

                {/* Liquidations List */}
                <div className="divide-y divide-gray-200">
                  {getCurrentPageLiquidations().map((liquidation) => (
                    <div key={liquidation.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLiquidations.includes(liquidation.id)}
                          onChange={() => handleSelectLiquidation(liquidation.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-medium text-gray-900">
                                {liquidation.beneficiary?.firstname} {liquidation.beneficiary?.lastname}
                              </h4>
                              {getStatusBadge(liquidation.status)}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getDisbursementLabel(liquidation.disbursement_type)}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(liquidation.total_disbursed_amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {liquidation.receipts?.length || 0} receipt(s)
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Student ID:</span>
                              <span className="ml-2 text-gray-900">{liquidation.beneficiary?.student_id || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Email:</span>
                              <span className="ml-2 text-gray-900">{liquidation.beneficiary?.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Submitted:</span>
                              <span className="ml-2 text-gray-900">{formatDate(liquidation.created_at)}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <button
                              onClick={() => router.push(`/liquidations/${liquidation.id}/review`)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                            >
                              Review Details
                            </button>
                            
                            {liquidation.status === 'pending_caseworker_approval' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedLiquidations([liquidation.id])
                                    setBulkAction('approve')
                                    setShowBulkModal(true)
                                  }}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                                >
                                  Quick Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLiquidations([liquidation.id])
                                    setBulkAction('reject')
                                    setShowBulkModal(true)
                                  }}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {liquidation.remaining_amount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ₱{liquidation.remaining_amount.toLocaleString()} remaining
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLiquidations.length)} of {filteredLiquidations.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                {bulkAction === 'approve' ? 'Bulk Approve' : 'Bulk Reject'} ({selectedLiquidations.length})
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  {bulkAction === 'approve' 
                    ? 'These liquidations will be approved and forwarded to the finance team.'
                    : 'Please provide a reason for rejecting these liquidations. All beneficiaries will be notified.'}
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {bulkAction === 'approve' ? 'Bulk Approval Notes (Optional)' : 'Bulk Rejection Reason (Required)'}
                  </label>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    rows={4}
                    required={bulkAction === 'reject'}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={bulkAction === 'approve' 
                      ? 'Add any notes for this bulk approval...' 
                      : 'Explain why these liquidations are being rejected...'}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => {
                    setShowBulkModal(false)
                    setBulkNotes('')
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-md"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={processing || (bulkAction === 'reject' && !bulkNotes.trim())}
                  className={`px-6 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 ${
                    bulkAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? 'Processing...' : (bulkAction === 'approve' ? 'Approve All' : 'Reject All')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EnhancedLiquidationApprovals