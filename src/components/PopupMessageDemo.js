import { useState } from 'react'
import PopupMessage from './PopupMessage'
import { usePopupMessage } from '../hooks/usePopupMessage'
import { 
    DocumentCheckIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline'

const PopupMessageDemo = () => {
    const { 
        popupState, 
        closePopup, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo, 
        showConfirm,
        showWorkflowComplete,
        showProcessing
    } = usePopupMessage()

    // Individual popup states for direct component usage examples
    const [directPopups, setDirectPopups] = useState({
        basicSuccess: false,
        basicError: false,
        customIcon: false,
        largeSize: false,
        autoClose: false,
        twoButtons: false
    })

    const toggleDirectPopup = (key) => {
        setDirectPopups(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const demoButtons = [
        {
            title: 'Success Message',
            description: 'Show success with auto-close',
            variant: 'success',
            onClick: () => showSuccess(
                'Operation Successful!', 
                'Your financial aid application has been approved successfully.'
            )
        },
        {
            title: 'Error Message', 
            description: 'Show error message',
            variant: 'error',
            onClick: () => showError(
                'Submission Failed',
                'Unable to process your application. Please check your documents and try again.'
            )
        },
        {
            title: 'Warning Message',
            description: 'Show warning message',
            variant: 'warning', 
            onClick: () => showWarning(
                'Missing Documents',
                'Some required documents are missing. Please upload all required files before proceeding.'
            )
        },
        {
            title: 'Info Message',
            description: 'Show information message',
            variant: 'info',
            onClick: () => showInfo(
                'System Maintenance',
                'The system will be under maintenance from 2:00 AM to 4:00 AM. Please save your work.'
            )
        },
        {
            title: 'Confirm Dialog',
            description: 'Show confirmation dialog',
            variant: 'confirm',
            onClick: () => showConfirm(
                'Delete Application',
                'Are you sure you want to delete this application? This action cannot be undone.',
                () => alert('Confirmed! Application deleted.')
            )
        },
        {
            title: 'Workflow Complete',
            description: 'Show workflow completion',
            variant: 'success',
            onClick: () => showWorkflowComplete('Ma Hannah Narvasa', '5000')
        },
        {
            title: 'Processing',
            description: 'Show processing message',
            variant: 'info',
            onClick: () => showProcessing(
                'Processing Request',
                'Please wait while we process your financial aid application...'
            )
        }
    ]

    const getVariantStyles = (variant) => {
        const styles = {
            success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white',
            error: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
            warning: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
            info: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white',
            confirm: 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white'
        }
        return styles[variant] || styles.info
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Popup Message Components Demo
                </h1>
                <p className="text-lg text-gray-600">
                    Comprehensive popup message system for your Financial Aid application
                </p>
            </div>

            {/* Hook-based Usage */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Using usePopupMessage Hook
                </h2>
                <p className="text-gray-600 mb-6">
                    The easiest way to show popups with convenient methods
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {demoButtons.map((button, index) => (
                        <div key={index} className="space-y-2">
                            <button
                                onClick={button.onClick}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${getVariantStyles(button.variant)}`}
                            >
                                {button.title}
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                {button.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Direct Component Usage */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Direct Component Usage Examples
                </h2>
                <p className="text-gray-600 mb-6">
                    Examples showing direct component usage with various configurations
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Basic Success */}
                    <button
                        onClick={() => toggleDirectPopup('basicSuccess')}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Basic Success
                    </button>

                    {/* Basic Error */}
                    <button
                        onClick={() => toggleDirectPopup('basicError')}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Basic Error
                    </button>

                    {/* Custom Icon */}
                    <button
                        onClick={() => toggleDirectPopup('customIcon')}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Custom Icon
                    </button>

                    {/* Large Size */}
                    <button
                        onClick={() => toggleDirectPopup('largeSize')}
                        className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Large Size
                    </button>

                    {/* Auto Close */}
                    <button
                        onClick={() => toggleDirectPopup('autoClose')}
                        className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Auto Close (2s)
                    </button>

                    {/* Two Buttons */}
                    <button
                        onClick={() => toggleDirectPopup('twoButtons')}
                        className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Two Buttons
                    </button>
                </div>
            </div>

            {/* Code Examples */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Usage Examples
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Using the Hook:</h3>
                        <div className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`const { showSuccess, showError, showConfirm } = usePopupMessage()

// Success with auto-close
showSuccess('Success!', 'Operation completed successfully')

// Error message
showError('Error!', 'Something went wrong')

// Confirmation dialog
showConfirm('Delete Item', 'Are you sure?', () => deleteItem())`}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Direct Component:</h3>
                        <div className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`<PopupMessage
    isOpen={isOpen}
    type="success"
    title="Success!"
    message="Your application has been submitted."
    onClose={() => setIsOpen(false)}
    autoClose={3000}
/>`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hook-based popup */}
            <PopupMessage
                {...popupState}
                onClose={closePopup}
            />

            {/* Direct component examples */}
            <PopupMessage
                isOpen={directPopups.basicSuccess}
                type="success"
                title="Success!"
                message="This is a basic success message."
                onClose={() => toggleDirectPopup('basicSuccess')}
            />

            <PopupMessage
                isOpen={directPopups.basicError}
                type="error"
                title="Error Occurred"
                message="This is a basic error message with more details about what went wrong."
                onClose={() => toggleDirectPopup('basicError')}
            />

            <PopupMessage
                isOpen={directPopups.customIcon}
                type="info"
                title="Custom Icon"
                message="This popup uses a custom icon instead of the default one."
                icon={DocumentCheckIcon}
                onClose={() => toggleDirectPopup('customIcon')}
            />

            <PopupMessage
                isOpen={directPopups.largeSize}
                type="info"
                title="Large Size Popup"
                message="This is a larger popup that can accommodate more content. It's useful when you need to display more information or have longer messages that require more space."
                size="lg"
                onClose={() => toggleDirectPopup('largeSize')}
            />

            <PopupMessage
                isOpen={directPopups.autoClose}
                type="warning"
                title="Auto Close"
                message="This popup will automatically close after 2 seconds."
                autoClose={2000}
                onClose={() => toggleDirectPopup('autoClose')}
            />

            <PopupMessage
                isOpen={directPopups.twoButtons}
                type="confirm"
                title="Two Button Example"
                message="This popup has both Cancel and Confirm buttons."
                showCancel={true}
                confirmText="Proceed"
                cancelText="Cancel"
                onConfirm={() => {
                    alert('Confirmed!')
                    toggleDirectPopup('twoButtons')
                }}
                onClose={() => toggleDirectPopup('twoButtons')}
            />
        </div>
    )
}

export default PopupMessageDemo