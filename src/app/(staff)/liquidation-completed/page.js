'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const CompletedLiquidationsPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  
  // State management
  const [liquidations, setLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({})
  
  // Filter and search states
  const [search, setSearch] = useState('')
  const [fundType, setFundType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)

  // Check user permissions
  useEffect(() => {
    if (user && user.system_role) {
      const roleName = user.system_role.name?.toLowerCase()
      if (!['finance', 'director', 'caseworker'].includes(roleName)) {
        router.push('/dashboard')
        return
      }
    }
  }, [user, router])

  // Load completed liquidations
  const loadCompletedLiquidations = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
      })

      if (search) params.append('search', search)
      if (fundType) params.append('fund_type', fundType)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      console.log('Loading completed liquidations with params:', params.toString())
      
      const response = await axios.get(`/api/liquidations/completed?${params.toString()}`)
      
      if (response.data.success) {
        const data = response.data.data
        setLiquidations(data.data || [])
        setCurrentPage(data.current_page || 1)
        setTotalPages(data.last_page || 1)
        setSummary(response.data.summary || {})
      } else {
        throw new Error(response.data.message || 'Failed to load completed liquidations')
      }
      
    } catch (error) {
      console.error('Error loading completed liquidations:', error)
      setError(error.response?.data?.message || error.message || 'Failed to load completed liquidations')
      setLiquidations([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    if (user && ['finance', 'director', 'caseworker'].includes(user.system_role?.name?.toLowerCase())) {
      loadCompletedLiquidations(1)
    }
  }, [user, search, fundType, dateFrom, dateTo])

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadCompletedLiquidations(page)
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setFundType('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Download liquidation summary
  const downloadSummary = async (liquidationId) => {
    try {
      const response = await axios({
        url: `/api/liquidations/${liquidationId}/download-summary`,
        method: 'GET',
        responseType: 'blob'
      })
      
      const blob = response.data
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `Liquidation_Summary_${liquidationId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('Summary download completed successfully')
      
    } catch (error) {
      console.error('Error downloading summary:', error)
      alert(`Error downloading summary: ${error.response?.data?.message || error.message}. Please try again or contact support.`)
    }
  }

  // Show liquidation details
  const showLiquidationDetails = (liquidation) => {
    setSelectedLiquidation(liquidation)
    setShowDetailsModal(true)
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-600">Loading user data...</div>
      </div>
    )
  }

  // Check if user has permission
  const roleName = user.system_role?.name?.toLowerCase()
  if (!['finance', 'director', 'caseworker'].includes(roleName)) {
    return (
      <div className="py-16 text-center">
        <div className="text-red-600 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">Only finance, director, and caseworker roles can access completed liquidations.</div>
        <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <Header title="Completed Liquidations" showMeta={false} />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Completed Liquidations</h1>
                <p className="mt-2 text-gray-600">
                  {roleName === 'caseworker' 
                    ? 'View completed liquidations for your assigned beneficiaries'
                    : 'View all fully liquidated cases that have been approved at all levels'
                  }
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex gap-3">
                <button
                  onClick={() => loadCompletedLiquidations(currentPage)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {!loading && !error && summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{summary.total_completed || 0}</p>
                    <p className="text-sm text-gray-600">Total Completed</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.total_amount)}</p>
                    <p className="text-sm text-gray-600">Total Amount</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{summary.current_page_count || 0}</p>
                    <p className="text-sm text-gray-600">Current Page</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Completed Liquidations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Beneficiary</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Fund Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fund Type</label>
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="tuition">Tuition</option>
                    <option value="cola">COLA</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <div className="text-red-500 text-xl mr-3">⚠️</div>
                <div>
                  <div className="text-red-700 font-semibold mb-2">Error Loading Completed Liquidations</div>
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={() => loadCompletedLiquidations(currentPage)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Retrying...' : 'Try Again'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600 mb-2">Loading completed liquidations...</div>
              <div className="text-sm text-gray-500">Please wait...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && liquidations.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">✅</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">No Completed Liquidations Found</div>
              <div className="text-gray-600 mb-6">
                There are no fully approved and liquidated cases matching your criteria.
              </div>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Liquidations List */}
          {!loading && !error && liquidations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beneficiary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fund Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Liquidation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Approval
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liquidations.map((liquidation) => (
                      <tr key={liquidation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {liquidation.beneficiary.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {liquidation.beneficiary.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {liquidation.beneficiary.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {liquidation.fund_type}
                            </span>
                          </div>
                          {liquidation.purpose && (
                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate" title={liquidation.purpose}>
                              {liquidation.purpose}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(liquidation.fund_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Receipts: {formatCurrency(liquidation.total_receipt_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(liquidation.liquidation_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {liquidation.receipts_count} receipt{liquidation.receipts_count !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(liquidation.final_approval_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {liquidation.final_approver}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3 flex-wrap">
                            <button
                              onClick={() => showLiquidationDetails(liquidation)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                            {liquidation.receipts_count > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedLiquidation(liquidation)
                                  setShowReceiptsModal(true)
                                }}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                View Receipts ({liquidation.receipts_count})
                              </button>
                            )}
                            <button
                              onClick={() => downloadSummary(liquidation.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Download Liquidation Summary PDF"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Summary
                            </button>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {liquidation.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = Math.max(1, currentPage - 2) + i
                        if (page > totalPages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border rounded-md text-sm font-medium ${
                              page === currentPage
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Liquidation Details - #{selectedLiquidation.id}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedLiquidation(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Beneficiary Information */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Beneficiary Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedLiquidation.beneficiary.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedLiquidation.beneficiary.email}</div>
                    <div><span className="font-medium">Beneficiary ID:</span> {selectedLiquidation.beneficiary.id}</div>
                  </div>
                </div>
                
                {/* Liquidation Summary */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Liquidation Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><span className="font-medium">Fund Amount:</span> {formatCurrency(selectedLiquidation.fund_amount)}</div>
                    <div><span className="font-medium">Fund Type:</span> {selectedLiquidation.fund_type}</div>
                    <div><span className="font-medium">Receipt Amount:</span> {formatCurrency(selectedLiquidation.total_receipt_amount)}</div>
                    <div><span className="font-medium">Receipts Count:</span> {selectedLiquidation.receipts_count}</div>
                  </div>
                </div>

                {/* Liquidation Timeline */}
                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-gray-800 mb-3">Timeline</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><span className="font-medium">Liquidation Date:</span> {formatDate(selectedLiquidation.liquidation_date)}</div>
                    <div><span className="font-medium">Final Approval Date:</span> {formatDate(selectedLiquidation.final_approval_date)}</div>
                    <div><span className="font-medium">Final Approver:</span> {selectedLiquidation.final_approver}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {selectedLiquidation.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedLiquidation.description && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Description</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    {selectedLiquidation.description}
                  </div>
                </div>
              )}

              {/* Purpose */}
              {selectedLiquidation.purpose && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Purpose</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    {selectedLiquidation.purpose}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedLiquidation(null)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipts Modal */}
      {showReceiptsModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Receipts for Liquidation #{selectedLiquidation.id}
                </h3>
                <button
                  onClick={() => {
                    setShowReceiptsModal(false)
                    setSelectedLiquidation(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Beneficiary: {selectedLiquidation.beneficiary.name} • 
                Fund Type: {selectedLiquidation.fund_type} • 
                Total: {formatCurrency(selectedLiquidation.fund_amount)}
              </div>
            </div>
            
            <div className="p-6">
              {selectedLiquidation.receipts && selectedLiquidation.receipts.length > 0 ? (
                <div className="space-y-6">
                  {selectedLiquidation.receipts.map((receipt, index) => {
                    // Determine if receipt has an image file
                    const hasImage = receipt.has_image || (receipt.file_path && receipt.mime_type)
                    const isImage = receipt.is_image || (receipt.mime_type && receipt.mime_type.startsWith('image/'))
                    const isPdf = receipt.is_pdf || (receipt.mime_type === 'application/pdf')
                    
                    return (
                    <div key={receipt.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Receipt #{index + 1}
                          </div>
                          {hasImage && (
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              {isImage ? '🖼️' : isPdf ? '📄' : '📎'} 
                              {isImage ? 'Image' : isPdf ? 'PDF' : 'File'}
                            </div>
                          )}
                          {receipt.mime_type && (
                            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                              {receipt.mime_type}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {formatCurrency(receipt.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(receipt.date)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-700">Invoice/OR Number:</span>
                          <div className="text-gray-900">{receipt.number || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Receipt Date:</span>
                          <div className="text-gray-900">{receipt.date ? formatDate(receipt.date) : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Amount:</span>
                          <div className="text-gray-900 font-semibold">{formatCurrency(receipt.amount)}</div>
                        </div>
                        <div className="md:col-span-3">
                          <span className="font-medium text-gray-700">Description:</span>
                          <div className="text-gray-900">{receipt.description || 'No description provided'}</div>
                        </div>
                      </div>
                      
                      {hasImage && (
                        <div className="border-t pt-4">
                          <div className="flex items-center">
                            <button
                              onClick={async () => {
                                try {
                                  // Download file
                                  const url = `/api/liquidations/${selectedLiquidation.id}/receipts/${receipt.id}/download`
                                  console.log('Downloading receipt:', url)
                                  
                                  // Use axios for better authentication handling
                                  const response = await axios({
                                    url: url,
                                    method: 'GET',
                                    responseType: 'blob', // Important for file downloads
                                  })
                                  
                                  // Get the blob from response
                                  const blob = response.data
                                  const downloadUrl = window.URL.createObjectURL(blob)
                                  
                                  const link = document.createElement('a')
                                  link.href = downloadUrl
                                  link.download = receipt.filename || receipt.original_filename || `receipt-${receipt.id}`
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  
                                  // Clean up the object URL
                                  window.URL.revokeObjectURL(downloadUrl)
                                  
                                  console.log('Download completed successfully')
                                  
                                } catch (error) {
                                  console.error('Error downloading file:', error)
                                  alert(`Error downloading file: ${error.message}. Please try again or contact support.`)
                                  
                                  // Log debug information
                                  console.log('Debug info:', {
                                    receiptId: receipt.id,
                                    liquidationId: selectedLiquidation.id,
                                    filename: receipt.filename || receipt.original_filename,
                                    hasImage: hasImage,
                                    filePath: receipt.file_path
                                  })
                                }
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <div className="text-lg font-medium mb-2">No Receipts Available</div>
                  <div className="text-sm">This liquidation does not have any attached receipts.</div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total Receipts: {selectedLiquidation.receipts?.length || 0} • 
                  Total Amount: {formatCurrency(selectedLiquidation.total_receipt_amount)}
                </div>
                <button
                  onClick={() => {
                    setShowReceiptsModal(false)
                    setSelectedLiquidation(null)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default CompletedLiquidationsPage
