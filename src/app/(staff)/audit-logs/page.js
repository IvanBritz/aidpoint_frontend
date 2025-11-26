'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'

const AuditLogsPage = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const router = useRouter()
  
  // State management
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterOptions, setFilterOptions] = useState({})
  
  // Filter states
  const [filters, setFilters] = useState({
    event_type: '',
    category: '',
    date_from: '',
    date_to: '',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const statistics = {}

  // Check user permissions
  useEffect(() => {
    if (user && user.system_role) {
      const roleName = user.system_role.name?.toLowerCase()
      if (!['finance', 'director', 'admin', 'caseworker'].includes(roleName)) {
        router.push('/staff-dashboard')
        return
      }
      // No default category; caseworker/finance/director/admin can filter by performer role
    }
  }, [user, router])

  // Load audit logs
  const loadAuditLogs = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
        ...filters
      })

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          params.delete(key)
        }
      })

      const response = await axios.get(`/api/audit-logs?${params.toString()}`)
      
      if (response.data.success) {
        const data = response.data.data
        setAuditLogs(data.data || [])
        setCurrentPage(data.current_page || 1)
        setTotalPages(data.last_page || 1)
      } else {
        throw new Error(response.data.message || 'Failed to load audit logs')
      }
      
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setError(error.response?.data?.message || error.message || 'Failed to load audit logs')
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Load statistics and filter options
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !['finance', 'director', 'admin', 'caseworker'].includes(user.system_role?.name?.toLowerCase())) {
        return
      }

      try {
        const optionsRes = await axios.get('/api/audit-logs/filter-options')
        if (optionsRes.data.success) {
          setFilterOptions(optionsRes.data.data || {})
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, [user])

  // Load audit logs when filters change
  useEffect(() => {
    if (user && ['finance', 'director', 'admin', 'caseworker'].includes(user.system_role?.name?.toLowerCase())) {
      loadAuditLogs(1)
    }
  }, [user, filters])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!user || !['finance', 'director', 'admin', 'caseworker'].includes(user.system_role?.name?.toLowerCase())) {
      return
    }

    const interval = setInterval(() => {
      loadAuditLogs(currentPage)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, currentPage, filters])

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadAuditLogs(page)
  }

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setCurrentPage(1)
  }

  // Clear all filters
  const clearFilters = () => {
    const roleName = user?.system_role?.name?.toLowerCase()
    setFilters({
      event_type: '',
      category: roleName === 'finance' ? 'financial' : '',
      date_from: '',
      date_to: '',
      search: ''
    })
    setCurrentPage(1)
  }

  // Format date for display
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

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
    } catch {
      return `₱${Number(value || 0).toFixed(2)}`
    }
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
  if (!['finance', 'director', 'admin', 'caseworker'].includes(roleName)) {
    return (
      <div className="py-16 text-center">
        <div className="text-red-600 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">Only finance officers, directors, administrators, and caseworkers can view audit logs.</div>
        <button 
          onClick={() => router.push('/staff-dashboard')}
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <>
      <Header title="Audit Logs" />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{roleName === 'director' ? 'Center Audit Logs' : 'Financial Audit Logs'}</h1>
                <p className="mt-2 text-gray-600">{roleName === 'director' ? 'Track all activities and system events across your center' : 'Track all financial activities and system events'}</p>
              </div>
              <div className="mt-4 lg:mt-0 flex gap-3">
                <button
                  onClick={() => loadAuditLogs(currentPage)}
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

          {/* Statistics Cards */}
          {false && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_events || 0}</p>
                    <p className="text-sm text-gray-600">Total Events</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {(statistics.events_by_risk_level?.high || 0) + (statistics.events_by_risk_level?.critical || 0)}
                    </p>
                    <p className="text-sm text-gray-600">High Risk Events</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8v4h8V8H6z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.events_by_category?.financial || 0}
                    </p>
                    <p className="text-sm text-gray-600">Financial Events</p>
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
                    <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
                    <p className="text-sm text-gray-600">Current Page</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Audit Logs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    {filterOptions.event_types?.map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Performed By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {(filterOptions.actor_roles || ['beneficiary','caseworker','finance','director']).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search events..."
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
                  <div className="text-red-700 font-semibold mb-2">Error Loading Audit Logs</div>
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={() => loadAuditLogs(currentPage)}
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
              <div className="text-lg text-gray-600 mb-2">Loading audit logs...</div>
              <div className="text-sm text-gray-500">Please wait...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && auditLogs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">No Audit Logs Found</div>
              <div className="text-gray-600 mb-6">
                No audit logs match your current filters. Try adjusting your search criteria.
              </div>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Audit Logs List */}
          {!loading && !error && auditLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.description}
                            </div>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${log.event_type_color}`}>
                                {log.event_type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.user.name || 'System'}</div>
                          <div className="text-sm text-gray-500">{log.user.role || 'N/A'}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.event_data && Object.keys(log.event_data).length > 0 ? (
                            <div className="max-w-xs">
                              {(() => {
                                const d = log.event_data || {}
                                const typeVal = d['Fund Type'] ?? d['Type'] ?? d.fund_type ?? d.type
                                const amountRaw = d['Amount'] ?? d.amount
                                const amountVal = typeof amountRaw === 'string' ? amountRaw : formatCurrency(amountRaw)
                                const output = []
                                if (typeVal !== undefined) {
                                  output.push(
                                    <div key="req-type" className="text-xs">
                                      <span className="font-medium">Request Type:</span> {String(typeVal)}
                                    </div>
                                  )
                                }
                                if (amountRaw !== undefined) {
                                  output.push(
                                    <div key="req-amount" className="text-xs">
                                      <span className="font-medium">Request Amount:</span> {amountVal}
                                    </div>
                                  )
                                }
                                if (output.length === 0) {
                                  return Object.entries(d)
                                    .filter(([key]) => !['Year','Month','year','month'].includes(key))
                                    .slice(0, 2)
                                    .map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="font-medium">{key}:</span> {String(value)}
                                      </div>
                                    ))
                                }
                                return output
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400">No additional data</span>
                          )}
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
    </>
  )
}

export default AuditLogsPage
