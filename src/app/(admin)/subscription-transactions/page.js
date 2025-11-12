'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function SubscriptionTransactionsPage() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all') // all, paid, pending, failed
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('/api/admin/subscription-transactions')
            if (response.data.success) {
                setTransactions(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
            setError('Failed to load subscription transactions.')
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatReferenceNumber = (transactionId, transactionDate) => {
        try {
            const date = new Date(transactionDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hour = String(date.getHours()).padStart(2, '0')
            const minute = String(date.getMinutes()).padStart(2, '0')
            const timestamp = `${year}${month}${day}${hour}${minute}`
            const paddedId = String(transactionId).padStart(6, '0')
            return `AIDP-${timestamp}-${paddedId}`
        } catch (error) {
            return `AIDP-${String(transactionId).padStart(6, '0')}`
        }
    }

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || 'unknown'
        
        const styles = {
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            unknown: 'bg-gray-100 text-gray-800'
        }

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[statusLower] || styles.unknown}`}>
                {status || 'N/A'}
            </span>
        )
    }

    const getPaymentMethodBadge = (method) => {
        const methodLower = method?.toLowerCase() || ''
        
        let color = 'bg-blue-100 text-blue-800'
        if (methodLower.includes('manual')) {
            color = 'bg-purple-100 text-purple-800'
        } else if (methodLower.includes('gcash')) {
            color = 'bg-cyan-100 text-cyan-800'
        } else if (methodLower.includes('paymongo')) {
            color = 'bg-indigo-100 text-indigo-800'
        }

        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                {method || 'N/A'}
            </span>
        )
    }

    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        // Filter by status
        if (filter !== 'all') {
            const statusMatch = transaction.status?.toLowerCase() === filter.toLowerCase()
            if (!statusMatch) return false
        }

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            const userMatch = `${transaction.user?.firstname || ''} ${transaction.user?.lastname || ''}`.toLowerCase().includes(searchLower)
            const emailMatch = transaction.user?.email?.toLowerCase().includes(searchLower)
            const planMatch = transaction.new_plan?.plan_name?.toLowerCase().includes(searchLower)
            const idMatch = transaction.sub_transaction_id?.toString().includes(searchLower)
            
            if (!userMatch && !emailMatch && !planMatch && !idMatch) return false
        }

        return true
    })

    if (loading) {
        return (
            <>
                <Header title="Subscription Transactions" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Subscription Transactions" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Subscription Transactions
                                </h2>
                                
                                {/* Filters and Search */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by user, email, plan, or transaction ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    {/* Status Filter */}
                                    <div className="sm:w-48">
                                        <select
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="paid">Paid</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-sm text-blue-600 font-medium">Total Transactions</div>
                                        <div className="text-2xl font-bold text-blue-900">{transactions.length}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-sm text-green-600 font-medium">Paid</div>
                                        <div className="text-2xl font-bold text-green-900">
                                            {transactions.filter(t => t.status?.toLowerCase() === 'paid').length}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-sm text-purple-600 font-medium">Total Revenue</div>
                                        <div className="text-xl font-bold text-purple-900">
                                            {formatPrice(transactions.filter(t => t.status?.toLowerCase() === 'paid').reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
                                    {error}
                                    <button
                                        onClick={() => setError('')}
                                        className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Transactions Table */}
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 text-lg">
                                        No transactions found.
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reference No
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Plan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Payment Method
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredTransactions.map((transaction) => (
                                                <tr key={transaction.sub_transaction_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                        {formatReferenceNumber(transaction.sub_transaction_id, transaction.transaction_date)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction.user?.firstname} {transaction.user?.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {transaction.user?.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {transaction.new_plan?.plan_name || 'N/A'}
                                                        </div>
                                                        {transaction.old_plan && (
                                                            <div className="text-xs text-gray-500">
                                                                From: {transaction.old_plan.plan_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                        {formatPrice(transaction.amount_paid)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getPaymentMethodBadge(transaction.payment_method)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(transaction.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div>{new Date(transaction.transaction_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                                        <div className="text-gray-500">{new Date(transaction.transaction_date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Results Count */}
                            {filteredTransactions.length > 0 && (
                                <div className="mt-4 text-sm text-gray-600">
                                    Showing {filteredTransactions.length} of {transactions.length} transactions
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
