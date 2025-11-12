'use client'

import { useState } from 'react'

const ApprovalWorkflow = ({ 
  liquidation, 
  currentUserRole = null,
  showNotes = true,
  size = 'default' // 'compact', 'default', 'large'
}) => {
  const [expandedStep, setExpandedStep] = useState(null)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStepStatus = (step) => {
    const status = liquidation?.status?.toLowerCase()
    
    switch (step) {
      case 'caseworker':
        if (liquidation?.rejected_at_level === 'caseworker') return 'rejected'
        if (liquidation?.caseworker_approved_at) return 'completed'
        if (status === 'pending_caseworker_approval') return 'active'
        return 'pending'
        
      case 'finance':
        if (liquidation?.rejected_at_level === 'finance') return 'rejected'
        if (liquidation?.finance_approved_at) return 'completed'
        if (status === 'pending_finance_approval') return 'active'
        if (liquidation?.caseworker_approved_at) return 'pending'
        return 'disabled'
        
      case 'director':
        if (liquidation?.rejected_at_level === 'director') return 'rejected'
        if (liquidation?.director_approved_at || status === 'approved') return 'completed'
        if (status === 'pending_director_approval') return 'active'
        if (liquidation?.finance_approved_at) return 'pending'
        return 'disabled'
        
      default:
        return 'disabled'
    }
  }

  const getStepConfig = (step, stepStatus) => {
    const baseConfig = {
      caseworker: {
        title: 'Caseworker Review',
        description: 'Initial review by assigned caseworker',
        icon: 'user',
        approver: liquidation?.caseworker_approver?.name,
        approvedAt: liquidation?.caseworker_approved_at,
        notes: liquidation?.caseworker_notes
      },
      finance: {
        title: 'Finance Review',
        description: 'Financial validation and compliance check',
        icon: 'calculator',
        approver: liquidation?.finance_approver?.name,
        approvedAt: liquidation?.finance_approved_at,
        notes: liquidation?.finance_notes
      },
      director: {
        title: 'Director Approval',
        description: 'Final approval by project director',
        icon: 'shield',
        approver: liquidation?.director_approver?.name,
        approvedAt: liquidation?.director_approved_at,
        notes: liquidation?.director_notes
      }
    }

    const config = baseConfig[step]
    
    // Status-specific styling
    const statusConfig = {
      completed: {
        bgColor: 'bg-green-100',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
        dotColor: 'bg-green-500'
      },
      active: {
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
        dotColor: 'bg-blue-500 animate-pulse'
      },
      rejected: {
        bgColor: 'bg-red-100',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
        dotColor: 'bg-red-500'
      },
      pending: {
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600',
        dotColor: 'bg-yellow-500'
      },
      disabled: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-500',
        iconColor: 'text-gray-400',
        dotColor: 'bg-gray-300'
      }
    }

    return { ...config, ...statusConfig[stepStatus] }
  }

  const getStepIcon = (iconType, iconColor) => {
    const iconClass = size === 'compact' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
    
    switch (iconType) {
      case 'user':
        return (
          <svg className={`${iconClass} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'calculator':
        return (
          <svg className={`${iconClass} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'shield':
        return (
          <svg className={`${iconClass} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      default:
        return (
          <svg className={`${iconClass} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getStatusLabel = (stepStatus, step) => {
    if (stepStatus === 'completed') {
      return liquidation?.rejected_at_level === step ? 'Rejected' : 'Approved'
    }
    
    return {
      active: 'In Review',
      pending: 'Awaiting',
      rejected: 'Rejected',
      disabled: 'Pending'
    }[stepStatus] || 'Unknown'
  }

  const getCurrentUserStep = () => {
    if (!currentUserRole) return null
    
    const roleStepMap = {
      caseworker: 'caseworker',
      finance: 'finance', 
      director: 'director'
    }
    
    return roleStepMap[currentUserRole.toLowerCase()]
  }

  const canCurrentUserAct = (step) => {
    const userStep = getCurrentUserStep()
    const stepStatus = getStepStatus(step)
    return userStep === step && stepStatus === 'active'
  }

  const steps = ['caseworker', 'finance', 'director']

  if (size === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step)
          const config = getStepConfig(step, stepStatus)
          
          return (
            <div key={step} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-2" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step)
        const config = getStepConfig(step, stepStatus)
        const isExpanded = expandedStep === step
        const hasNotes = config.notes && showNotes
        const canAct = canCurrentUserAct(step)
        
        return (
          <div key={step} className="relative">
            {index < steps.length - 1 && (
              <div 
                className={`absolute left-4 mt-8 w-0.5 h-4 ${
                  getStepStatus(steps[index + 1]) !== 'disabled' ? 'bg-gray-300' : 'bg-gray-200'
                }`} 
              />
            )}
            
            <div 
              className={`relative flex items-start p-4 rounded-lg border-2 transition-all duration-200 ${
                config.bgColor
              } ${config.borderColor} ${canAct ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.dotColor}`}>
                {stepStatus === 'completed' ? (
                  liquidation?.rejected_at_level === step ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )
                ) : (
                  getStepIcon(config.icon, 'text-white')
                )}
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-medium ${config.textColor}`}>
                      {config.title}
                      {canAct && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Your Turn
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stepStatus === 'completed' ? 'bg-white bg-opacity-70' : 'bg-white bg-opacity-50'
                    } ${config.textColor}`}>
                      {getStatusLabel(stepStatus, step)}
                    </span>
                  </div>
                </div>
                
                {(config.approver || config.approvedAt) && (
                  <div className="mt-2 text-xs text-gray-600">
                    {config.approver && (
                      <div>
                        <span className="font-medium">
                          {stepStatus === 'completed' && liquidation?.rejected_at_level !== step ? 'Approved' : 
                           stepStatus === 'completed' && liquidation?.rejected_at_level === step ? 'Rejected' : 
                           'Assigned'} by:
                        </span> {config.approver}
                      </div>
                    )}
                    {config.approvedAt && (
                      <div className="mt-1">
                        <span className="font-medium">Date:</span> {formatDate(config.approvedAt)}
                      </div>
                    )}
                  </div>
                )}
                
                {hasNotes && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : step)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className={`w-3 h-3 mr-1 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {liquidation?.rejected_at_level === step ? 'Rejection Reason' : 'Review Notes'}
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-white bg-opacity-70 rounded border text-xs text-gray-700">
                        {config.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Overall Status Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900">Overall Status</h5>
            <p className="text-xs text-gray-600">
              {liquidation?.status === 'approved' ? 'Fully approved and ready for processing' :
               liquidation?.rejected_at_level ? `Rejected at ${liquidation.rejected_at_level} level` :
               liquidation?.status === 'pending_director_approval' ? 'Awaiting final director approval' :
               liquidation?.status === 'pending_finance_approval' ? 'Under finance team review' :
               liquidation?.status === 'pending_caseworker_approval' ? 'Under caseworker review' :
               'Processing...'}
            </p>
          </div>
          
          <div className="text-right">
            <div className={`text-lg font-bold ${
              liquidation?.status === 'approved' ? 'text-green-600' :
              liquidation?.rejected_at_level ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {liquidation?.status === 'approved' ? '✓ Complete' :
               liquidation?.rejected_at_level ? '✗ Rejected' :
               '⏳ In Progress'}
            </div>
            {liquidation?.created_at && (
              <div className="text-xs text-gray-500">
                Started {formatDate(liquidation.created_at)}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {steps.filter(step => getStepStatus(step) === 'completed').length} of {steps.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                liquidation?.rejected_at_level ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${(steps.filter(step => getStepStatus(step) === 'completed').length / steps.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApprovalWorkflow