'use client'
import { Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon,
    InformationCircleIcon,
    QuestionMarkCircleIcon,
    XMarkIcon 
} from '@heroicons/react/24/outline'

const PopupMessage = ({ 
    isOpen, 
    onClose,
    onConfirm,
    type = "info", // "success", "error", "warning", "info", "confirm"
    title = "Message", 
    message = "", 
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    autoClose = null, // Auto close after X milliseconds
    icon: CustomIcon,
    size = "md" // "sm", "md", "lg"
}) => {
    // Auto close functionality
    useEffect(() => {
        if (isOpen && autoClose && autoClose > 0) {
            const timer = setTimeout(() => {
                onClose?.()
            }, autoClose)
            return () => clearTimeout(timer)
        }
    }, [isOpen, autoClose, onClose])

    const getTypeConfig = () => {
        const configs = {
            success: {
                bgGradient: "from-green-500 to-emerald-600",
                buttonGradient: "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
                icon: CheckCircleIcon,
                iconBg: "bg-green-100",
                iconColor: "text-green-600"
            },
            error: {
                bgGradient: "from-red-500 to-red-600",
                buttonGradient: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                icon: XCircleIcon,
                iconBg: "bg-red-100",
                iconColor: "text-red-600"
            },
            warning: {
                bgGradient: "from-amber-500 to-orange-600",
                buttonGradient: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
                icon: ExclamationTriangleIcon,
                iconBg: "bg-amber-100",
                iconColor: "text-amber-600"
            },
            info: {
                bgGradient: "from-blue-500 to-indigo-600",
                buttonGradient: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
                icon: InformationCircleIcon,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600"
            },
            confirm: {
                bgGradient: "from-slate-500 to-slate-600",
                buttonGradient: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
                icon: QuestionMarkCircleIcon,
                iconBg: "bg-slate-100",
                iconColor: "text-slate-600"
            }
        }
        return configs[type] || configs.info
    }

    const getSizeConfig = () => {
        const sizes = {
            sm: "max-w-sm",
            md: "max-w-md", 
            lg: "max-w-lg"
        }
        return sizes[size] || sizes.md
    }

    const config = getTypeConfig()
    const sizeClass = getSizeConfig()
    const IconComponent = CustomIcon || config.icon

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        } else {
            onClose?.()
        }
    }

    const handleCancel = () => {
        onClose?.()
    }

    if (!isOpen) return null

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleCancel}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full ${sizeClass} transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}>
                                {/* Header */}
                                <div className={`relative bg-gradient-to-r ${config.bgGradient} px-6 py-6`}>
                                    <button
                                        onClick={handleCancel}
                                        className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                    <div className="flex flex-col items-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                            <IconComponent className="h-8 w-8 text-white" />
                                        </div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-xl font-bold text-white text-center"
                                        >
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6">
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        {typeof message === 'string' ? (
                                            <p>{message}</p>
                                        ) : (
                                            message
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-100 px-6 py-4">
                                    {type === 'confirm' || showCancel ? (
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                type="button"
                                                className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                                                onClick={handleCancel}
                                            >
                                                {cancelText}
                                            </button>
                                            <button
                                                type="button"
                                                className={`px-6 py-3 rounded-lg bg-gradient-to-r ${config.buttonGradient} text-white text-sm font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105`}
                                                onClick={handleConfirm}
                                            >
                                                {confirmText}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`w-full rounded-lg bg-gradient-to-r ${config.buttonGradient} px-6 py-3 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105`}
                                            onClick={handleConfirm}
                                        >
                                            {confirmText}
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default PopupMessage
