'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'

const ReviewApplicationPage = () => {
    const router = useRouter()
    const { id } = useParams()
    const [facility, setFacility] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (id) {
            fetchFacility()
        }
    }, [id])

    const fetchFacility = async () => {
        try {
            const response = await axios.get(`/api/financial-aid/${id}`)
            setFacility(response.data)
        } catch (error) {
            console.error('Error fetching facility:', error)
            setError('Failed to load facility details')
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusUpdate = async (isApproved) => {
        setActionLoading(true)
        setError('')
        setSuccess('')
        
        try {
            const response = await axios.patch(`/api/financial-aid/${id}/status`, {
                isManagable: isApproved
            })
            
            setSuccess(response.data.message)

            if (isApproved) {
                await fetchFacility() // Refresh facility data when approved
                // Auto redirect after 3 seconds
                setTimeout(() => {
                    router.push('/applications')
                }, 3000)
            } else {
                // If rejected, the application and user are removed; go back to list immediately
                setTimeout(() => {
                    router.push('/applications')
                }, 1000)
            }
            
        } catch (error) {
            console.error('Error updating status:', error)
            setError(error.response?.data?.message || `Failed to ${isApproved ? 'approve' : 'reject'} facility`)
        } finally {
            setActionLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getDocumentIcon = (documentType) => {
        switch (documentType.toLowerCase()) {
            case 'business_permit':
                return '🏢'
            case 'certificate':
                return '📜'
            case 'license':
                return '📋'
            case 'registration':
                return '📝'
            default:
                return '📄'
        }
    }

    const handleDocumentView = (document) => {
        // Open document in new tab using the secure API route
        const base = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || ''
        const documentUrl = `${base}/api/documents/${document.document_path}`
        window.open(documentUrl, '_blank')
    }

    const getStatusBadge = (facility) => {
        if (facility.isManagable) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Approved
                </span>
            )
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Pending Review
                </span>
            )
        }
    }

    if (isLoading) {
        return (
            <>
                <Header title="Review Application" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    if (error && !facility) {
        return (
            <>
                <Header title="Review Application" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200 text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={() => router.push('/applications')}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Back to Applications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Review Application" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Back Button */}
                    <div>
                        <button
                            onClick={() => router.push('/applications')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Applications
                        </button>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {success}
                            </div>
                            <p className="text-sm mt-1">Redirecting to applications page...</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                            <button
                                onClick={() => setError('')}
                                className="float-right text-red-700 hover:text-red-900"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Facility Details */}
                        <div className="lg:col-span-2">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-gray-900">Facility Details</h2>
                                        {getStatusBadge(facility)}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Center Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{facility.center_name}</dd>
                                        </div>
                                        
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Center ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{facility.center_id}</dd>
                                        </div>
                                        
                                        {facility.latitude && facility.longitude && (
                                            <>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Latitude</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{facility.latitude}</dd>
                                                </div>
                                                
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Longitude</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{facility.longitude}</dd>
                                                </div>
                                            </>
                                        )}
                                        
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Submitted Date</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatDate(facility.created_at)}</dd>
                                        </div>
                                    </dl>
                                    
                                    {facility.description && (
                                        <div className="mt-6">
                                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                                {facility.description}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Supporting Documents</h3>
                                </div>
                                <div className="p-6">
                                    {facility.documents && facility.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {facility.documents.map((document) => (
                                                <div
                                                    key={document.id}
                                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => handleDocumentView(document)}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="text-2xl mr-3">
                                                            {getDocumentIcon(document.document_type)}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Click to view document
                                                            </p>
                                                        </div>
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                                            <p className="mt-1 text-sm text-gray-500">No supporting documents were provided with this application.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Owner Information & Actions */}
                        <div className="space-y-6">
                            {/* Owner Details */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Facility Owner</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {facility.owner?.firstname} {facility.owner?.lastname}
                                            </h4>
                                            <p className="text-sm text-gray-500">{facility.owner?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!facility.isManagable && !success && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Review Actions</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <button
                                            onClick={() => handleStatusUpdate(true)}
                                            disabled={actionLoading}
                                            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Approve Application
                                                </>
                                            )}
                                        </button>
                                        
                                        <button
                                            onClick={() => handleStatusUpdate(false)}
                                            disabled={actionLoading}
                                            className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading ? (
                                                'Processing...'
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    Reject Application
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ReviewApplicationPage