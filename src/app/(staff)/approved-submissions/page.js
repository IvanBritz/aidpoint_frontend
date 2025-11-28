'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import Toast from '@/components/Toast'

const ApprovedSubmissions = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const [isLoading, setIsLoading] = useState(true)
    const [submissions, setSubmissions] = useState([])
    const [pagination, setPagination] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [toast, setToast] = useState({ open: false, type: 'success', title: '', message: '' })
    const [viewingSubmission, setViewingSubmission] = useState(null)
    const [downloadingDoc, setDownloadingDoc] = useState(null)
    const [previewModal, setPreviewModal] = useState({ open: false, filePath: null, fileName: null, fileType: null, previewUrl: null })
    const [previewKey, setPreviewKey] = useState(0)
    const previewBlobUrlRef = useRef(null)

    useEffect(() => {
        if (user) {
            loadApprovedSubmissions(currentPage)
        }
    }, [currentPage, user])

    const loadApprovedSubmissions = async (page = 1) => {
        try {
            setIsLoading(true)
            const response = await axios.get(`/api/beneficiary-document-submissions/approved?page=${page}&per_page=15`)
            
            if (response.data.success) {
                setSubmissions(response.data.data.data || [])
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                    per_page: response.data.data.per_page,
                })
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error loading approved submissions:', error)
            showToast('error', 'Error', 'Failed to load approved submissions')
            setSubmissions([])
            setPagination(null)
        } finally {
            setIsLoading(false)
        }
    }

    const showToast = (type, title, message) => {
        setToast({ open: true, type, title, message })
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Close full preview modal
    const closeFullPreview = useCallback(() => {
        // Cleanup blob URL
        if (previewBlobUrlRef.current) {
            window.URL.revokeObjectURL(previewBlobUrlRef.current)
            previewBlobUrlRef.current = null
        }
        setPreviewModal({ open: false, filePath: null, fileName: null, fileType: null, previewUrl: null })
    }, [])
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewBlobUrlRef.current) {
                window.URL.revokeObjectURL(previewBlobUrlRef.current)
                previewBlobUrlRef.current = null
            }
        }
    }, [])
    
    // Close preview modal when viewing submission modal closes
    useEffect(() => {
        if (!viewingSubmission) {
            closeFullPreview()
        }
    }, [viewingSubmission, closeFullPreview])
    
    // Helper function to check if file is an image
    const isImageFile = (path) => {
        if (!path) return false
        const extension = path.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)
    }
    
    // Helper function to check if file is a PDF
    const isPdfFile = (path) => {
        if (!path) return false
        const extension = path.split('.').pop()?.toLowerCase()
        return extension === 'pdf'
    }
    
    // Open full preview modal
    const openDocument = async (path, documentType) => {
        if (!path) return
        if (downloadingDoc === documentType) return
        
        setDownloadingDoc(documentType)
        setPreviewKey(prev => prev + 1)
        
        // Determine file type
        const fileType = isImageFile(path) ? 'image' : isPdfFile(path) ? 'pdf' : null
        const fileName = path.split('/').pop() || documentType
        
        setPreviewModal({ open: true, filePath: path, fileName, fileType, previewUrl: null })
        
        try {
            const response = await axios.get(`/api/documents/${path}`, {
                responseType: 'blob',
                headers: { 'Accept': '*/*' },
                timeout: 30000,
            })
            
            const contentType = response.headers['content-type'] || 'application/octet-stream'
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType })
            
            const blobUrl = window.URL.createObjectURL(blob)
            
            // Cleanup previous blob URL
            if (previewBlobUrlRef.current) {
                window.URL.revokeObjectURL(previewBlobUrlRef.current)
            }
            previewBlobUrlRef.current = blobUrl
            
            setPreviewModal(prev => ({ ...prev, previewUrl: blobUrl }))
        } catch (err) {
            console.error('Failed to open document', err)
            showToast('error', 'Failed to open document', 'Could not open the document. Please try again.')
            closeFullPreview()
        } finally {
            setDownloadingDoc(null)
        }
    }
    
    // Download file from preview modal
    const downloadPreviewFile = () => {
        if (!previewModal.previewUrl) return
        
        const link = document.createElement('a')
        link.href = previewModal.previewUrl
        link.download = previewModal.fileName || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    if (!user) {
        return <Loading />
    }

    if (isLoading && submissions.length === 0) {
        return (
            <>
                <Header title="Approved Submissions" />
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
            <Header title="Approved Submissions" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Summary Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Submissions You Approved
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Total: {pagination?.total || 0} approved submissions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submissions Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Approved Beneficiary Submissions</h3>
                                <button
                                    onClick={() => loadApprovedSubmissions(currentPage)}
                                    disabled={isLoading}
                                    className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                >
                                    {isLoading ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholar</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {submission.beneficiary?.firstname} {submission.beneficiary?.lastname}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {submission.beneficiary?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {submission.enrollment_date ? new Date(submission.enrollment_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {submission.year_level || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    submission.is_scholar 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {submission.is_scholar ? 'Scholar' : 'Non-scholar'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(submission.reviewed_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => setViewingSubmission(submission)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p>No approved submissions yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details Modal */}
                    {viewingSubmission && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Submission Details
                                        </h3>
                                        <button
                                            onClick={() => setViewingSubmission(null)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    {/* Status Badge */}
                                    <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Approved
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            on {formatDate(viewingSubmission.reviewed_at)}
                                        </span>
                                    </div>

                                    {/* Beneficiary Info */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Beneficiary Information</h4>
                                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                                            <p><strong>Name:</strong> {viewingSubmission.beneficiary?.firstname} {viewingSubmission.beneficiary?.lastname}</p>
                                            <p><strong>Email:</strong> {viewingSubmission.beneficiary?.email}</p>
                                            <p><strong>School:</strong> {viewingSubmission.beneficiary?.enrolled_school || 'Not specified'}</p>
                                            <p><strong>School Year:</strong> {viewingSubmission.beneficiary?.school_year || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    {/* Enrollment Details */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Enrollment Details</h4>
                                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                                            <p><strong>Enrollment Date:</strong> {viewingSubmission.enrollment_date ? new Date(viewingSubmission.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                                            <p><strong>Year Level:</strong> {viewingSubmission.year_level || 'N/A'}</p>
                                            <p><strong>Scholar Status:</strong> {viewingSubmission.is_scholar ? 'Scholar' : 'Non-scholar'}</p>
                                            <p><strong>Submitted:</strong> {formatDate(viewingSubmission.created_at)}</p>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Submitted Documents</h4>
                                        <div className="bg-gray-50 p-4 rounded-md space-y-3">
                                            {viewingSubmission.enrollment_certification_path && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">Enrollment Certification</span>
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                                        onClick={() => openDocument(viewingSubmission.enrollment_certification_path, 'Enrollment_Certification')}
                                                        disabled={downloadingDoc === 'Enrollment_Certification'}
                                                    >
                                                        {downloadingDoc === 'Enrollment_Certification' ? 'Opening…' : 'Open Document'}
                                                    </button>
                                                </div>
                                            )}
                                            {viewingSubmission.scholarship_certification_path && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">Scholarship Certification</span>
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                                        onClick={() => openDocument(viewingSubmission.scholarship_certification_path, 'Scholarship_Certification')}
                                                        disabled={downloadingDoc === 'Scholarship_Certification'}
                                                    >
                                                        {downloadingDoc === 'Scholarship_Certification' ? 'Opening…' : 'Open Document'}
                                                    </button>
                                                </div>
                                            )}
                                            {viewingSubmission.sao_photo_path && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">SOA</span>
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                                        onClick={() => openDocument(viewingSubmission.sao_photo_path, 'SOA')}
                                                        disabled={downloadingDoc === 'SOA'}
                                                    >
                                                        {downloadingDoc === 'SOA' ? 'Opening…' : 'Open Document'}
                                                    </button>
                                                </div>
                                            )}
                                            {!viewingSubmission.enrollment_certification_path && 
                                             !viewingSubmission.scholarship_certification_path && 
                                             !viewingSubmission.sao_photo_path && (
                                                <p className="text-sm text-gray-500 text-center py-2">No documents available</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Notes */}
                                    {viewingSubmission.review_notes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Review Notes</h4>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-700">{viewingSubmission.review_notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        onClick={() => setViewingSubmission(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Full Preview Modal */}
                    {previewModal.open && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4" key={`preview-modal-${previewKey}`}>
                            <div
                                className="absolute inset-0 bg-gray-900/60"
                                onClick={closeFullPreview}
                            />
                            <div className="relative bg-white w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-lg shadow-xl flex flex-col">
                                <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {previewModal.fileName || 'File Preview'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {(isImageFile(previewModal.filePath) || isPdfFile(previewModal.filePath)) && previewModal.previewUrl && (
                                            <button
                                                type="button"
                                                onClick={downloadPreviewFile}
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={closeFullPreview}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-6 bg-gray-100 min-h-0" key={`preview-content-${previewKey}`}>
                                    {previewModal.previewUrl && isImageFile(previewModal.filePath) ? (
                                        <div className="flex items-center justify-center h-full w-full">
                                            <img
                                                key={`preview-img-${previewKey}`}
                                                src={previewModal.previewUrl}
                                                alt={previewModal.fileName || 'Preview'}
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
                                                style={{ maxHeight: 'calc(90vh - 180px)' }}
                                            />
                                        </div>
                                    ) : previewModal.previewUrl && isPdfFile(previewModal.filePath) ? (
                                        <div className="flex items-center justify-center h-full w-full">
                                            <iframe
                                                key={`preview-iframe-${previewKey}`}
                                                src={previewModal.previewUrl}
                                                className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                                                style={{ minHeight: 'calc(90vh - 180px)', width: '100%' }}
                                                title={`PDF Preview - ${previewModal.fileName || 'PDF'}`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center min-h-full">
                                            <div className="text-center text-gray-400">
                                                <svg className="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <p className="text-sm">Loading preview...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Toast
                open={toast.open}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast(t => ({ ...t, open: false }))}
            />
        </>
    )
}

export default ApprovedSubmissions
