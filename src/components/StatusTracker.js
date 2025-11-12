import React from 'react'

const StatusTracker = ({ 
    enrollmentStatus = 'pending', 
    aidRequestStatus = null, 
    showAidRequest = true 
}) => {
    const getStepStatus = (step, currentStatus) => {
        switch (step) {
            case 'enrollment':
                return currentStatus
            case 'aid':
                if (enrollmentStatus !== 'approved') return 'disabled'
                return aidRequestStatus || 'available'
            default:
                return 'pending'
        }
    }

    const getStepIcon = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )
            case 'rejected':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )
            case 'pending':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                )
            case 'disabled':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                )
            case 'available':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                    </svg>
                )
        }
    }

    const getStepColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500 border-green-500'
            case 'rejected':
                return 'bg-red-500 border-red-500'
            case 'pending':
                return 'bg-yellow-500 border-yellow-500'
            case 'disabled':
                return 'bg-gray-400 border-gray-400'
            case 'available':
                return 'bg-blue-500 border-blue-500'
            default:
                return 'bg-gray-300 border-gray-300'
        }
    }

    const getStepLabel = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved'
            case 'rejected':
                return 'Rejected'
            case 'pending':
                return 'Pending Review'
            case 'disabled':
                return 'Locked'
            case 'available':
                return 'Available'
            default:
                return 'Not Started'
        }
    }

    const getConnectorColor = (fromStatus, toStatus) => {
        if (fromStatus === 'approved') {
            return 'border-green-300'
        }
        return 'border-gray-300'
    }

    const enrollmentStepStatus = getStepStatus('enrollment', enrollmentStatus)
    const aidStepStatus = getStepStatus('aid', aidRequestStatus)

    const steps = [
        {
            id: 'enrollment',
            title: 'Enrollment Verification',
            description: 'Submit and get enrollment documents approved',
            status: enrollmentStepStatus
        }
    ]

    if (showAidRequest) {
        steps.push({
            id: 'aid',
            title: 'Aid Request',
            description: 'Request financial aid after enrollment approval',
            status: aidStepStatus
        })
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Application Progress</h3>
                <p className="text-sm text-gray-600">Track your enrollment verification and aid request status</p>
            </div>

            <nav aria-label="Progress">
                <ol className="flex items-center">
                    {steps.map((step, stepIdx) => (
                        <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                            {stepIdx !== steps.length - 1 && (
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className={`h-0.5 w-full border-t-2 ${getConnectorColor(step.status, steps[stepIdx + 1].status)}`} />
                                </div>
                            )}
                            <div className="relative flex items-center justify-center">
                                <div 
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${getStepColor(step.status)}`}
                                    aria-current={step.status === 'pending' ? 'step' : undefined}
                                >
                                    {getStepIcon(step.status)}
                                </div>
                                <div className="ml-4 min-w-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{step.title}</span>
                                        <span className={`text-xs ${
                                            step.status === 'approved' ? 'text-green-600' :
                                            step.status === 'rejected' ? 'text-red-600' :
                                            step.status === 'pending' ? 'text-yellow-600' :
                                            step.status === 'available' ? 'text-blue-600' :
                                            'text-gray-500'
                                        }`}>
                                            {getStepLabel(step.status)}
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">{step.description}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Status Messages */}
            <div className="mt-6 space-y-2">
                {enrollmentStatus === 'pending' && (
                    <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-yellow-800">
                            Your enrollment verification is being reviewed by your caseworker.
                        </span>
                    </div>
                )}
                
                {enrollmentStatus === 'approved' && !aidRequestStatus && showAidRequest && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-800">
                            ✅ Enrollment approved! You can now request financial aid.
                        </span>
                    </div>
                )}
                
                {enrollmentStatus === 'approved' && aidRequestStatus === 'pending' && (
                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-blue-800">
                            Your aid request is being reviewed by your caseworker.
                        </span>
                    </div>
                )}
                
                {aidRequestStatus === 'approved' && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-800">
                            🎉 Aid request approved! Your financial aid will be processed.
                        </span>
                    </div>
                )}
                
                {enrollmentStatus === 'rejected' && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-red-800">
                            Your enrollment verification was rejected. Please check the review notes and resubmit.
                        </span>
                    </div>
                )}
                
                {aidRequestStatus === 'rejected' && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-red-800">
                            Your aid request was rejected. You may submit a new request with revised information.
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatusTracker