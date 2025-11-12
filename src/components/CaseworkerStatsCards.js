'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

const CaseworkerStatsCards = ({ 
  userId = null, 
  refreshTrigger = 0,
  showDetailed = true,
  className = '' 
}) => {
  const [stats, setStats] = useState({
    totalPending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalValue: 0,
    averageProcessingTime: 0,
    beneficiaryCount: 0,
    weeklyProgress: [],
    urgentCount: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('today') // 'today', 'week', 'month'

  useEffect(() => {
    loadStats()
  }, [userId, refreshTrigger, selectedPeriod])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/api/caseworker/liquidation-stats', {
        params: { 
          user_id: userId,
          period: selectedPeriod 
        }
      })
      
      setStats(response.data?.stats || stats)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError(err?.response?.data?.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${Math.round(value || 0)}%`
  }

  const formatTime = (hours) => {
    if (!hours || hours === 0) return 'N/A'
    if (hours < 1) return `${Math.round(hours * 60)} mins`
    if (hours < 24) return `${Math.round(hours * 10) / 10} hours`
    return `${Math.round(hours / 24 * 10) / 10} days`
  }

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      default: return 'Today'
    }
  }

  const getStatIcon = (statType) => {
    const iconClass = 'w-8 h-8'
    
    switch (statType) {
      case 'pending':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'approved':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'rejected':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'value':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'time':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      case 'urgent':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'rate':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const mainStats = [
    {
      id: 'pending',
      title: 'Pending Reviews',
      value: stats.totalPending,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      change: stats.pendingChange || 0,
      period: 'vs yesterday'
    },
    {
      id: 'approved',
      title: `Approved ${getPeriodLabel(selectedPeriod)}`,
      value: stats.approvedToday,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      change: stats.approvedChange || 0,
      period: selectedPeriod === 'today' ? 'vs yesterday' : 'vs last period'
    },
    {
      id: 'value',
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      change: stats.valueChange || 0,
      period: getPeriodLabel(selectedPeriod)
    },
    {
      id: 'rate',
      title: 'Completion Rate',
      value: formatPercentage(stats.completionRate),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      change: stats.rateChange || 0,
      period: 'last 7 days'
    }
  ]

  const detailedStats = showDetailed ? [
    {
      id: 'rejected',
      title: `Rejected ${getPeriodLabel(selectedPeriod)}`,
      value: stats.rejectedToday,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'time',
      title: 'Avg Processing Time',
      value: formatTime(stats.averageProcessingTime),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'users',
      title: 'Active Beneficiaries',
      value: stats.beneficiaryCount,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      id: 'urgent',
      title: 'Urgent Reviews',
      value: stats.urgentCount,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ] : []

  const allStats = [...mainStats, ...detailedStats]

  return (
    <div className={className}>
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={loadStats}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            title="Refresh Stats"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {allStats.map((stat) => (
          <div
            key={stat.id}
            className={`bg-white p-6 rounded-lg shadow border ${stat.borderColor || 'border-gray-200'} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor || 'bg-gray-50'} ${stat.color}`}>
                {getStatIcon(stat.id)}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">
                  {stat.title}
                </p>
                <div className="flex items-baseline">
                  <p className={`text-2xl font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                  {stat.change !== undefined && (
                    <span className={`ml-2 text-xs font-medium ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </div>
                {stat.period && (
                  <p className="text-xs text-gray-500 mt-1">{stat.period}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Progress Chart (Simple Bar Chart) */}
      {showDetailed && stats.weeklyProgress && stats.weeklyProgress.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Progress</h4>
          <div className="grid grid-cols-7 gap-2">
            {stats.weeklyProgress.map((day, index) => {
              const maxValue = Math.max(...stats.weeklyProgress.map(d => d.approved + d.rejected))
              const approvedHeight = maxValue > 0 ? (day.approved / maxValue) * 100 : 0
              const rejectedHeight = maxValue > 0 ? (day.rejected / maxValue) * 100 : 0
              
              return (
                <div key={index} className="text-center">
                  <div className="h-24 flex flex-col justify-end mb-2">
                    <div className="relative">
                      <div 
                        className="bg-green-200 rounded-t"
                        style={{ height: `${approvedHeight}%`, minHeight: day.approved > 0 ? '2px' : '0' }}
                      />
                      <div 
                        className="bg-red-200 rounded-t"
                        style={{ height: `${rejectedHeight}%`, minHeight: day.rejected > 0 ? '2px' : '0' }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {day.day}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.approved + day.rejected}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
              <span className="text-gray-600">Approved</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
              <span className="text-gray-600">Rejected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaseworkerStatsCards