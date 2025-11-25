'use client'

import { useState, useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import echo from '@/lib/echo'

const NotificationBell = ({ userId, userRole }) => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [hasNewNotifications, setHasNewNotifications] = useState(false)
    const dropdownRef = useRef(null)
    const prevUnreadCountRef = useRef(0)

    useEffect(() => {
        if (!userId) return
        loadNotifications()

        const role = typeof userRole === 'string' ? userRole.toLowerCase() : ''
        const shouldPoll = ['director', 'finance', 'caseworker', 'beneficiary'].includes(role)
        const pollMs = shouldPoll ? 10000 : 30000
        const interval = setInterval(() => {
            loadNotifications()
        }, pollMs)

        let channel
        if (echo) {
            channel = echo.private(`user.${userId}`)
            channel.listen('.notification.sent', (event) => {
                console.log('New notification received:', event)
                setNotifications(prevNotifs => [event, ...prevNotifs])
                setUnreadCount(prev => prev + 1)
                setHasNewNotifications(true)
                setTimeout(() => setHasNewNotifications(false), 3000)
                prevUnreadCountRef.current = prevUnreadCountRef.current + 1
            })
        }

        return () => {
            clearInterval(interval)
            if (channel) {
                channel.stopListening('.notification.sent')
                echo?.leave(`user.${userId}`)
            }
        }
    }, [userId, userRole])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const response = await axios.get('/api/notifications')
            if (response.data.success) {
                const payload = response.data.data
                const notifs = Array.isArray(payload) ? payload : (payload?.data ?? [])
                const newUnreadCount = notifs.filter(n => !n.read_at).length
                
                // Detect new notifications
                if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
                    setHasNewNotifications(true)
                    // Auto-hide the new notification indicator after 3 seconds
                    setTimeout(() => setHasNewNotifications(false), 3000)
                }
                
                setNotifications(notifs)
                setUnreadCount(newUnreadCount)
                prevUnreadCountRef.current = newUnreadCount
            }
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`/api/notifications/${notificationId}/read`)
            setNotifications(prevNotifs => 
                prevNotifs.map(n => 
                    n.id === notificationId 
                        ? { ...n, read_at: new Date().toISOString() }
                        : n
                )
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await axios.post('/api/notifications/mark-all-read')
            setNotifications(prevNotifs => 
                prevNotifs.map(n => ({ ...n, read_at: new Date().toISOString() }))
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const deleteNotification = async (notificationId, event) => {
        event?.stopPropagation()
        try {
            await axios.delete(`/api/notifications/${notificationId}`)
            setNotifications(prevNotifs => 
                prevNotifs.filter(n => n.id !== notificationId)
            )
            // Update unread count if the deleted notification was unread
            const notification = notifications.find(n => n.id === notificationId)
            if (notification && !notification.read_at) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const getNotificationIcon = (type) => {
        if (type?.includes('approved')) {
            return <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
        } else if (type?.includes('rejected')) {
            return <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
        } else if (type?.includes('liquidation') || type?.includes('fund') || type?.includes('disbursement')) {
            return <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
        } else if (type?.includes('pending') || type?.includes('request')) {
            return <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
        } else if (type?.includes('submission') || type?.includes('assigned')) {
            return <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
        }
        return <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
    }

    const getNotificationMessage = (notification) => {
        // If notification has a message, use it directly (from database)
        if (notification.message) {
            return notification.message
        }
        
        // Fallback for specific types
        switch (notification.type) {
            case 'enrollment_approved':
                return `Your enrollment verification has been approved by ${notification.data?.caseworker_name || 'your caseworker'}.`
            case 'enrollment_rejected':
                return `Your enrollment verification has been rejected. Please check the review notes and resubmit.`
            case 'aid_approved':
                return `Your aid request for ${formatCurrency(notification.data?.amount)} has been approved.`
            case 'aid_final_approved':
                return `Your fund request has been approved by the director for ${formatCurrency(notification.data?.amount)}.`
            case 'aid_rejected':
                return `Your aid request for ${formatCurrency(notification.data?.amount)} has been rejected.`
            case 'aid_final_rejected':
                return `Your fund request was rejected by the director.`
            case 'fund_request_approved':
                return `Your fund request has been approved${notification.data?.amount ? ` for ${formatCurrency(notification.data.amount)}` : ''}.`
            case 'fund_request_rejected':
                return `Your fund request has been rejected${notification.data?.amount ? ` for ${formatCurrency(notification.data.amount)}` : ''}.`
            case 'beneficiary_assigned':
                return `${notification.data?.beneficiary_name || 'A beneficiary'} has been assigned to you.`
            case 'new_submission':
                return `${notification.data?.beneficiary_name || 'A beneficiary'} has submitted enrollment verification documents for review.`
            case 'new_aid_request':
                return `${notification.data?.beneficiary_name || 'A beneficiary'} has submitted a new aid request for ${formatCurrency(notification.data?.amount)}.`
            case 'liquidation_pending':
                return `Liquidation awaiting approval: ${formatCurrency(notification.data?.amount)} from ${notification.data?.beneficiary_name || 'a beneficiary'}`
            case 'director_pending_fund_request':
                return `Fund request awaiting final approval: ${formatCurrency(notification.data?.amount)} from ${notification.data?.beneficiary_name || 'a beneficiary'}`
            case 'liquidation_completed':
                return `Liquidation completed for ${notification.data?.beneficiary_name || 'a beneficiary'} (${formatCurrency(notification.data?.amount)}).`
            case 'liquidation_director_pending':
                return `Liquidation pending final approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_pending_final_approval':
                return `Liquidation pending final approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'director_fund_pending':
                return `Fund request awaiting director approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_to_review':
                return `New liquidation report requires your review${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'caseworker_liquidation_pending':
                return `Liquidation pending your approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'disbursement_finance_disbursed':
                return `New cash from Finance${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''} — ready to disburse.`
            case 'finance_disbursed':
                return `Finance disbursed cash${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''} to your queue.`
            case 'cash_finance_disbursed':
                return `New cash allocation from Finance${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_approved':
                return `Your liquidation report has been approved${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_rejected':
                return `Your liquidation report has been rejected${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_finance_approved':
                return `Your liquidation report was approved by finance${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''} and sent to the director for final review.`
            case 'liquidation_finance_rejected':
                return `Your liquidation report was rejected by finance${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_director_approved':
                return `Your liquidation report has been approved by the director${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'liquidation_director_rejected':
                return `Your liquidation report was rejected by the director${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'subscription_expiring':
                return `Subscription expiring soon: ${notification.data?.plan_name || 'Plan'} on ${new Date(notification.data?.end_date).toLocaleDateString()}.`
            case 'fund_created':
                return `New fund allocation created: ${notification.data?.sponsor_name || 'Sponsor'} - ${formatCurrency(notification.data?.allocated_amount)}`
            case 'new_sponsor':
                return `New sponsor added: ${notification.data?.sponsor_name || 'Sponsor'} pledged ${formatCurrency(notification.data?.allocated_amount)} (${(notification.data?.fund_type || '').toUpperCase()})`
            case 'disbursement_created':
                return `New disbursement: ${formatCurrency(notification.data?.amount)} to ${notification.data?.beneficiary_name || 'beneficiary'}`
            case 'beneficiary_cash_received':
                return `Beneficiary confirmed receipt of ${formatCurrency(notification.data?.amount)}.`
            case 'disbursement_beneficiary_received':
                return `Your beneficiary confirmed receipt of ${formatCurrency(notification.data?.amount)}.`
            case 'cash_disbursement_ready':
                return `Approved request ready to disburse${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            case 'finance_pending_review':
                return `New request awaiting finance review${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
            default:
                {
                    const t = (notification.type || '').toLowerCase()
                    if (t.includes('liquidation') && t.includes('director') && (t.includes('pending') || t.includes('final')) && t.includes('approval')) {
                        return `Liquidation pending final approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if ((t.includes('aid') || t.includes('fund')) && t.includes('director') && (t.includes('pending') || t.includes('final')) && t.includes('approval')) {
                        return `Fund request awaiting director approval${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if ((t.includes('liquidation') && t.includes('pending')) || t.includes('to_review')) {
                        return `New liquidation report requires your review${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if (t.includes('liquidation') && t.includes('approved')) {
                        return `Your liquidation report has been approved${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if (t.includes('liquidation') && t.includes('rejected')) {
                        return `Your liquidation report has been rejected${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if ((t.includes('disbursement') || t.includes('cash')) && (t.includes('finance') || t.includes('disburs'))) {
                        return `New cash from Finance${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''} — ready to disburse.`
                    }
                    if ((t.includes('aid') || t.includes('fund')) && (t.includes('pending') && t.includes('finance'))) {
                        return `New request awaiting finance review${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if ((t.includes('disbursement') || t.includes('cash')) && (t.includes('ready') || t.includes('approved'))) {
                        return `Approved request ready to disburse${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if (t.includes('beneficiary') && t.includes('received')) {
                        return `Disbursement confirmed by beneficiary${notification.data?.amount ? ` (${formatCurrency(notification.data.amount)})` : ''}.`
                    }
                    if ((t.includes('aid') || t.includes('fund')) && t.includes('approved')) {
                        return `Your fund request has been approved${notification.data?.amount ? ` for ${formatCurrency(notification.data.amount)}` : ''}.`
                    }
                    if ((t.includes('aid') || t.includes('fund')) && t.includes('rejected')) {
                        return `Your fund request has been rejected${notification.data?.amount ? ` for ${formatCurrency(notification.data.amount)}` : ''}.`
                    }
                    return 'You have a new notification.'
                }
        }
    }

    const formatCurrency = (amount) => {
        if (!amount) return ''
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ''
        
        // Parse the timestamp - handle both ISO and database formats
        let date = new Date(timestamp)
        
        // If the date is invalid, try parsing it differently
        if (isNaN(date.getTime())) {
            // Try adding 'Z' to make it UTC if it's missing
            date = new Date(timestamp + 'Z')
        }
        
        // If still invalid, return empty
        if (isNaN(date.getTime())) {
            return ''
        }
        
        const now = new Date()
        const diffInMs = now - date
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        
        // Handle negative differences (future timestamps due to timezone issues)
        if (diffInMinutes < 0) return 'Just now'
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`
        
        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays}d ago`
        
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    setHasNewNotifications(false)
                }}
                className={`relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-all duration-200 ${
                    hasNewNotifications ? 'animate-bounce' : ''
                }`}
            >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22a2 2 0 01-2-2h4a2 2 0 01-2 2zm6-6V11a6 6 0 10-12 0v5l-2 2h16l-2-2z" />
                </svg>
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium text-white transition-all duration-200 ${
                        hasNewNotifications 
                            ? 'bg-red-600 animate-pulse scale-110' 
                            : 'bg-red-500'
                    }`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {hasNewNotifications && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 rounded-full animate-ping"></span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 max-w-[85vw] bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22a2 2 0 01-2-2h4a2 2 0 01-2 2zm6-6V11a6 6 0 10-12 0v5l-2 2h16l-2-2z" />
                                </svg>
                                <p className="mt-2">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors group ${
                                            !notification.read_at ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex space-x-3">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                {notification.title && (
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-700 mt-0.5">
                                                    {getNotificationMessage(notification)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatTimestamp(notification.created_at)}
                                                </p>
                                                {notification.data?.review_notes && (
                                                    <p className="text-xs text-gray-600 mt-2 italic">
                                                        "{notification.data.review_notes}"
                                                    </p>
                                                )}
                                                {/* Action buttons */}
                                                <div className="flex gap-2 mt-2">
                                                    {!notification.read_at && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                markAsRead(notification.id)
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => deleteNotification(notification.id, e)}
                                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="p-2 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    // Navigate to full notifications page if you have one
                                }}
                                className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-2"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell
