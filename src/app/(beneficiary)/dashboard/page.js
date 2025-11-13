'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

import Header from '@/components/Header'
import Loading from '@/components/Loading'
import { useAuth } from '@/hooks/auth'
import EnrollmentVerificationCard from '@/components/EnrollmentVerificationCard'
import StatusTracker from '@/components/StatusTracker'

const Dashboard = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const [enrollmentStatus, setEnrollmentStatus] = useState('pending')
    const [aidRequestStatus, setAidRequestStatus] = useState(null)
    
    // Redirect to password change if required (prevents infinite loading)
    useEffect(() => {
        if (user?.must_change_password) {
            window.location.href = '/change-password'
        }
    }, [user])

    // Load statuses from backend so Application Progress is accurate
    useEffect(() => {
        const loadStatuses = async () => {
            if (!user?.id) return
            try {
                // 1) Enrollment submission status
                const subRes = await axios.get('/api/beneficiary/my-document-submission')
                const sub = subRes.data?.data
                if (sub?.status) setEnrollmentStatus(String(sub.status).toLowerCase())
            } catch (_) {
                // no submission yet
                setEnrollmentStatus('pending')
            }
            try {
                // 2) Latest aid request status (if any)
                const arRes = await axios.get('/api/beneficiary/aid-requests')
                const list = Array.isArray(arRes.data?.data) ? arRes.data.data : []
                if (list.length > 0) {
                    const latest = list[0] // already returned in desc order
                    if (latest?.status) setAidRequestStatus(String(latest.status).toLowerCase())
                } else {
                    setAidRequestStatus(null)
                }
            } catch (_) {
                setAidRequestStatus(null)
            }
        }
        
        loadStatuses()
    }, [user?.id])

    const fullName = () => {
        if (!user) return ''
        return [user.firstname, user.middlename, user.lastname].filter(Boolean).join(' ')
    }
    

    if (!user) {
        return (
            <>
                <Header title="Dashboard" />
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
            <Header title="Dashboard" />
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Profile */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h2>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">Beneficiary ID</dt>
                                    <dd className="text-gray-900 font-medium">{user.id}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">Full Name</dt>
                                    <dd className="text-gray-900 font-medium">{fullName()}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">Email</dt>
                                    <dd className="text-gray-900 font-medium">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">Enrolled School</dt>
                                    <dd className="text-gray-900 font-medium">{user.enrolled_school || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">School Year</dt>
                                    <dd className="text-gray-900 font-medium">{user.school_year || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-gray-500">Assigned Caseworker</dt>
                                    <dd className="text-gray-900 font-medium">
                                        {user.caseworker
                                            ? `${user.caseworker.firstname || ''} ${user.caseworker.middlename || ''} ${user.caseworker.lastname || ''}`.replace(/\s+/g,' ').trim()
                                            : 'Not Assigned'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Status Tracker */}
                    <StatusTracker 
                        enrollmentStatus={enrollmentStatus}
                        aidRequestStatus={aidRequestStatus}
                        showAidRequest={true}
                    />

                    {/* Enrollment Verification Submission */}
                    <EnrollmentVerificationCard user={user} />

                </div>
            </div>
        </>
    )
}

export default Dashboard
