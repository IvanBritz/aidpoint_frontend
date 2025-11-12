import { useState } from 'react'

export const usePopupMessage = () => {
    const [popupState, setPopupState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        autoClose: null,
        onConfirm: null,
        onClose: null,
        size: 'md',
        icon: null
    })

    const showPopup = (options) => {
        setPopupState(prev => ({
            ...prev,
            isOpen: true,
            ...options
        }))
    }

    const closePopup = () => {
        setPopupState(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // Convenience methods for different types of popups
    const showSuccess = (title, message, options = {}) => {
        showPopup({
            type: 'success',
            title: title || 'Success!',
            message,
            autoClose: options.autoClose || 3000,
            ...options
        })
    }

    const showError = (title, message, options = {}) => {
        showPopup({
            type: 'error',
            title: title || 'Error!',
            message,
            ...options
        })
    }

    const showWarning = (title, message, options = {}) => {
        showPopup({
            type: 'warning',
            title: title || 'Warning!',
            message,
            ...options
        })
    }

    const showInfo = (title, message, options = {}) => {
        showPopup({
            type: 'info',
            title: title || 'Information',
            message,
            ...options
        })
    }

    const showConfirm = (title, message, onConfirm, options = {}) => {
        showPopup({
            type: 'confirm',
            title: title || 'Confirm Action',
            message,
            confirmText: options.confirmText || 'Yes',
            cancelText: options.cancelText || 'No',
            showCancel: true,
            onConfirm: () => {
                onConfirm?.()
                closePopup()
            },
            ...options
        })
    }

    // Method to show workflow completion (like your image shows)
    const showWorkflowComplete = (beneficiaryName, amount, options = {}) => {
        showPopup({
            type: 'success',
            title: 'Workflow Complete!',
            message: `Final approval by Director. All steps completed. Beneficiary: ${beneficiaryName} - Finance: ₱${amount}. The liquidation is now fully approved and processed.`,
            confirmText: 'OK',
            autoClose: 5000,
            ...options
        })
    }

    // Method to show processing status
    const showProcessing = (title, message, options = {}) => {
        showPopup({
            type: 'info',
            title: title || 'Processing...',
            message,
            confirmText: 'Processing...',
            showCancel: false,
            ...options
        })
    }

    return {
        popupState,
        showPopup,
        closePopup,
        showSuccess,
        showError,
        showWarning, 
        showInfo,
        showConfirm,
        showWorkflowComplete,
        showProcessing
    }
}