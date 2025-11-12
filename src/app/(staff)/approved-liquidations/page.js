'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const ApprovedLiquidationsPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  
  // State management
  const [liquidations, setLiquidations] = useState([])
  const [filteredLiquidations, setFilteredLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [activeTab, setActiveTab] = useState('all') // all, beneficiary, caseworker, finance, director
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all') // all, today, week, month, year
  const [amountRange, setAmountRange] = useState('all') // all, small, medium, large
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, amount_high, amount_low, name
  const [statusFilter, setStatusFilter] = useState('all') // all, fully_approved, partial
  
  // Modal states
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [showLiquidationModal, setShowLiquidationModal] = useState(false)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    beneficiaryApproved: 0,
    caseworkerApproved: 0,
    financeApproved: 0,
    directorApproved: 0,
    totalAmount: 0
  })

  // Load liquidations data
  const loadApprovedLiquidations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading approved liquidations...')
      
      // Try multiple endpoints to get comprehensive liquidation data
      const endpoints = [
        '/api/liquidations/approved',
        '/api/liquidations/all',
        '/api/liquidations',
        '/api/admin/liquidations',
        '/api/staff/liquidations'
      ]
      
      let liquidationsData = []
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Fetching from: ${endpoint}`)
          const response = await axios.get(endpoint)
          
          if (response?.data) {
            // Parse different response formats
            if (response.data.success && response.data.data) {
              if (Array.isArray(response.data.data.data)) {
                liquidationsData = response.data.data.data
              } else if (Array.isArray(response.data.data)) {
                liquidationsData = response.data.data
              }
            } else if (Array.isArray(response.data)) {
              liquidationsData = response.data
            }
            
            if (liquidationsData.length > 0) {
              console.log(`Successfully loaded ${liquidationsData.length} liquidations from ${endpoint}`)
              break
            }
          }
        } catch (endpointError) {
          console.log(`Failed to fetch from ${endpoint}:`, endpointError.message)
          continue
        }
      }
      
      // Filter for liquidations that have at least some level of approval
      const approvedLiquidations = liquidationsData.filter(liquidation => {
        return liquidation.caseworker_approved_at || 
               liquidation.finance_approved_at || 
               liquidation.director_approved_at ||
               liquidation.status === 'approved' ||
               liquidation.status === 'pending_finance_approval' ||
               liquidation.status === 'pending_director_approval'
      })
      
      console.log(`Filtered to ${approvedLiquidations.length} approved liquidations`)
      
      setLiquidations(approvedLiquidations)
      calculateStats(approvedLiquidations)
      
    } catch (error) {
      console.error('Error loading approved liquidations:', error)
      setError(error.message || 'Failed to load approved liquidations')
      setLiquidations([])
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate statistics
  const calculateStats = (liquidationsData) => {
    const stats = {
      total: liquidationsData.length,
      beneficiaryApproved: liquidationsData.length, // All listed liquidations are submitted by beneficiaries
      caseworkerApproved: liquidationsData.filter(l => l.caseworker_approved_at).length,
      financeApproved: liquidationsData.filter(l => l.finance_approved_at).length,
      directorApproved: liquidationsData.filter(l => l.director_approved_at).length,
      totalAmount: liquidationsData.reduce((sum, l) => sum + (parseFloat(l.total_disbursed_amount || l.amount || 0)), 0)
    }
    
    setStats(stats)
  }

  // Apply filters and search
  useEffect(() => {
    let filtered = [...liquidations]

    // Tab filtering
    if (activeTab !== 'all') {
      filtered = filtered.filter(liquidation => {
        switch (activeTab) {
          case 'beneficiary':
            // All liquidations are submitted by beneficiaries, so show all
            return true
          case 'caseworker':
            return liquidation.caseworker_approved_at
          case 'finance':
            return liquidation.finance_approved_at
          case 'director':
            return liquidation.director_approved_at
          default:
            return true
        }
      })
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(liquidation =>
        `${liquidation.beneficiary?.firstname || ''} ${liquidation.beneficiary?.lastname || ''}`.toLowerCase().includes(query) ||
        liquidation.beneficiary?.email?.toLowerCase().includes(query) ||
        liquidation.id.toString().includes(query) ||
        liquidation.disbursement_type?.toLowerCase().includes(query)
      )
    }

    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(liquidation => {
        const createdDate = new Date(liquidation.created_at)
        return createdDate >= filterDate
      })
    }

    // Amount range filtering
    if (amountRange !== 'all') {
      filtered = filtered.filter(liquidation => {
        const amount = parseFloat(liquidation.total_disbursed_amount || liquidation.amount || 0)
        switch (amountRange) {
          case 'small':
            return amount < 5000
          case 'medium':
            return amount >= 5000 && amount < 20000
          case 'large':
            return amount >= 20000
          default:
            return true
        }
      })
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(liquidation => {
        if (statusFilter === 'fully_approved') {
          return liquidation.director_approved_at || liquidation.status === 'approved'
        } else if (statusFilter === 'partial') {
          return (liquidation.caseworker_approved_at || liquidation.finance_approved_at) && !liquidation.director_approved_at
        }
        return true
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'amount_high':
          return (parseFloat(b.total_disbursed_amount || b.amount || 0)) - (parseFloat(a.total_disbursed_amount || a.amount || 0))
        case 'amount_low':
          return (parseFloat(a.total_disbursed_amount || a.amount || 0)) - (parseFloat(b.total_disbursed_amount || b.amount || 0))
        case 'name':
          const nameA = `${a.beneficiary?.firstname || ''} ${a.beneficiary?.lastname || ''}`.trim()
          const nameB = `${b.beneficiary?.firstname || ''} ${b.beneficiary?.lastname || ''}`.trim()
          return nameA.localeCompare(nameB)
        default:
          return 0
      }
    })

    setFilteredLiquidations(filtered)
  }, [liquidations, activeTab, searchQuery, dateRange, amountRange, sortBy, statusFilter])

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadApprovedLiquidations()
    }
  }, [user])

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

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

  const getApprovalStatus = (liquidation) => {
    if (liquidation.director_approved_at) {
      return { label: 'Fully Approved', color: 'bg-green-100 text-green-800', icon: '🎉' }
    } else if (liquidation.finance_approved_at) {
      return { label: 'Finance Approved', color: 'bg-blue-100 text-blue-800', icon: '💳' }
    } else if (liquidation.caseworker_approved_at) {
      return { label: 'Caseworker Approved', color: 'bg-purple-100 text-purple-800', icon: '👩‍💼' }
    } else {
      return { label: 'Beneficiary Submitted', color: 'bg-gray-100 text-gray-800', icon: '📝' }
    }
  }

  const getWorkflowProgress = (liquidation) => {
    const stages = [
      { name: 'Beneficiary', completed: true, icon: '👤' },
      { name: 'Caseworker', completed: !!liquidation.caseworker_approved_at, icon: '👩‍💼' },
      { name: 'Finance', completed: !!liquidation.finance_approved_at, icon: '💳' },
      { name: 'Director', completed: !!liquidation.director_approved_at, icon: '👨‍💼' }
    ]
    
    return stages
  }

  const clearAllFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setDateRange('all')
    setAmountRange('all')
    setSortBy('newest')
    setStatusFilter('all')
  }

  // Tab configuration
  const tabs = [
    { id: 'all', label: 'All Approved', count: stats.total, color: 'text-blue-600 border-blue-500' },
    { id: 'beneficiary', label: 'By Beneficiary', count: stats.beneficiaryApproved, color: 'text-gray-600 border-gray-500' },
    { id: 'caseworker', label: 'By Caseworker', count: stats.caseworkerApproved, color: 'text-purple-600 border-purple-500' },
    { id: 'finance', label: 'By Finance', count: stats.financeApproved, color: 'text-indigo-600 border-indigo-500' },
    { id: 'director', label: 'By Director', count: stats.directorApproved, color: 'text-green-600 border-green-500' }
  ]

  if (!user) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-600">Loading user data...</div>
      </div>
    )
  }

  return (
    <>
      <Header title="Approved Liquidations" />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Approved Liquidations</h1>
                <p className="mt-2 text-gray-600">
                  Track and view liquidations approved at different stages of the workflow
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex gap-3">
                <button
                  onClick={loadApprovedLiquidations}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Approved</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">👩‍💼</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.caseworkerApproved}</p>
                    <p className="text-sm text-gray-600">Caseworker</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.financeApproved}</p>
                    <p className="text-sm text-gray-600">Finance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">👨‍💼</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.directorApproved}</p>
                    <p className="text-sm text-gray-600">Director</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                    <p className="text-sm text-gray-600">Total Amount</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? `${tab.color} bg-opacity-10 border-2`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search beneficiaries..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                  <select
                    value={amountRange}
                    onChange={(e) => setAmountRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Amounts</option>
                    <option value="small">Under ₱5,000</option>
                    <option value="medium">₱5,000 - ₱20,000</option>
                    <option value="large">Over ₱20,000</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="fully_approved">Fully Approved</option>
                    <option value="partial">Partially Approved</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Highest Amount</option>
                    <option value="amount_low">Lowest Amount</option>
                    <option value="name">By Name</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <span className="text-red-500 text-2xl mr-3">⚠️</span>
                <div>
                  <div className="text-red-700 font-semibold mb-2">Error Loading Liquidations</div>
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={loadApprovedLiquidations}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Retrying...' : '🔄 Try Again'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600 mb-2">Loading approved liquidations...</div>
              <div className="text-sm text-gray-500">This may take a moment</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredLiquidations.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">No Approved Liquidations Found</div>
              <div className="text-gray-600 mb-6">
                {liquidations.length === 0 
                  ? "There are no approved liquidations in the system yet."
                  : "No liquidations match your current filter criteria."
                }
              </div>
              {liquidations.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Liquidations List */}
          {!loading && !error && filteredLiquidations.length > 0 && (
            <div className="space-y-6">
              {filteredLiquidations.map((liquidation) => {
                const approvalStatus = getApprovalStatus(liquidation)
                const workflowStages = getWorkflowProgress(liquidation)
                
                return (
                  <div key={liquidation.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    {/* Liquidation Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {liquidation.beneficiary?.firstname && liquidation.beneficiary?.lastname
                                ? `${liquidation.beneficiary.firstname} ${liquidation.beneficiary.lastname}`
                                : `Beneficiary ID: ${liquidation.beneficiary_id || liquidation.user_id || 'Unknown'}`
                              }
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${approvalStatus.color}`}>
                              <span className="mr-1">{approvalStatus.icon}</span>
                              {approvalStatus.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <div className="font-semibold text-lg text-gray-900">
                                {formatCurrency(liquidation.total_disbursed_amount || liquidation.amount)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Liquidation ID:</span>
                              <div className="font-medium text-gray-900">#{liquidation.id}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Submitted:</span>
                              <div className="font-medium text-gray-900">
                                {formatDate(liquidation.created_at)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Receipts:</span>
                              <div className="font-medium text-gray-900">
                                {liquidation.receipts?.length || 0} attached
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workflow Progress */}
                    <div className="p-6 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Approval Workflow Progress</h4>
                      <div className="flex items-center space-x-4">
                        {workflowStages.map((stage, index) => (
                          <div key={stage.name} className="flex items-center">
                            <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                              stage.completed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span className="mr-2">{stage.icon}</span>
                              <div>
                                <div className="font-semibold">{stage.name}</div>
                                {stage.completed && (
                                  <div className="text-xs opacity-75">✅ Approved</div>
                                )}
                              </div>
                            </div>
                            {index < workflowStages.length - 1 && (
                              <div className="text-gray-400 text-lg mx-2">→</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Approval Details */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Caseworker Approval */}
                        {liquidation.caseworker_approved_at && (
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center mb-2">
                              <span className="text-purple-600 text-lg mr-2">👩‍💼</span>
                              <span className="font-semibold text-purple-800">Caseworker Approved</span>
                            </div>
                            <div className="text-sm text-purple-700">
                              <div>Date: {formatDate(liquidation.caseworker_approved_at)}</div>
                              {liquidation.caseworker_notes && (
                                <div className="mt-2">
                                  <span className="font-medium">Notes:</span> {liquidation.caseworker_notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Finance Approval */}
                        {liquidation.finance_approved_at && (
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <div className="flex items-center mb-2">
                              <span className="text-indigo-600 text-lg mr-2">💳</span>
                              <span className="font-semibold text-indigo-800">Finance Approved</span>
                            </div>
                            <div className="text-sm text-indigo-700">
                              <div>Date: {formatDate(liquidation.finance_approved_at)}</div>
                              {liquidation.finance_notes && (
                                <div className="mt-2">
                                  <span className="font-medium">Notes:</span> {liquidation.finance_notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Director Approval */}
                        {liquidation.director_approved_at && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center mb-2">
                              <span className="text-green-600 text-lg mr-2">👨‍💼</span>
                              <span className="font-semibold text-green-800">Director Approved</span>
                            </div>
                            <div className="text-sm text-green-700">
                              <div>Date: {formatDate(liquidation.director_approved_at)}</div>
                              {liquidation.director_notes && (
                                <div className="mt-2">
                                  <span className="font-medium">Notes:</span> {liquidation.director_notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedLiquidation(liquidation)
                            setShowLiquidationModal(true)
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <span className="mr-2">📄</span>
                          View Details
                        </button>
                        
                        {liquidation.receipts?.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedLiquidation(liquidation)
                              setShowReceiptsModal(true)
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                          >
                            <span className="mr-2">🧾</span>
                            View Receipts ({liquidation.receipts.length})
                          </button>
                        )}
                        
                        <div className="text-sm text-gray-500 flex items-center">
                          <span className="mr-2">🏢</span>
                          Liquidation Type: {liquidation.disbursement_type || 'General'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Results Summary */}
          {!loading && !error && filteredLiquidations.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {filteredLiquidations.length} of {liquidations.length} approved liquidations
              {activeTab !== 'all' && ` (filtered by ${tabs.find(t => t.id === activeTab)?.label})`}
            </div>
          )}

        </div>
      </div>

      {/* Liquidation Details Modal */}
      {showLiquidationModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Liquidation Details - #{selectedLiquidation.id}
                </h3>
                <button
                  onClick={() => {
                    setShowLiquidationModal(false)
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
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Beneficiary Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedLiquidation.beneficiary?.firstname} {selectedLiquidation.beneficiary?.lastname}</div>
                    <div><span className="font-medium">Email:</span> {selectedLiquidation.beneficiary?.email || 'N/A'}</div>
                    <div><span className="font-medium">Phone:</span> {selectedLiquidation.beneficiary?.phone || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Liquidation Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div><span className="font-medium">Amount:</span> {formatCurrency(selectedLiquidation.total_disbursed_amount || selectedLiquidation.amount)}</div>
                    <div><span className="font-medium">Type:</span> {selectedLiquidation.disbursement_type || 'General'}</div>
                    <div><span className="font-medium">Submitted:</span> {formatDate(selectedLiquidation.created_at)}</div>
                    <div><span className="font-medium">Status:</span> {getApprovalStatus(selectedLiquidation).label}</div>
                  </div>
                </div>
              </div>
              
              {selectedLiquidation.description && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Description</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    {selectedLiquidation.description}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowLiquidationModal(false)
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
            </div>
            
            <div className="p-6">
              {selectedLiquidation.receipts && selectedLiquidation.receipts.length > 0 ? (
                <div className="space-y-6">
                  {selectedLiquidation.receipts.map((receipt, index) => (
                    <div key={receipt.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-800">Receipt #{index + 1}</h4>
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {formatCurrency(receipt.receipt_amount || receipt.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(receipt.receipt_date || receipt.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Receipt Number:</span>
                          <div>{receipt.receipt_number || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Description:</span>
                          <div>{receipt.description || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">File:</span>
                          <div>
                            {receipt.file_path ? (
                              <button className="text-blue-600 hover:text-blue-800 underline">
                                View Image
                              </button>
                            ) : (
                              'No file attached'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <div className="text-lg font-medium mb-2">No Receipts Available</div>
                  <div className="text-sm">This liquidation does not have any attached receipts.</div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
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
      )}

    </>
  )
}

export default ApprovedLiquidationsPage