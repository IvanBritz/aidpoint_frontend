import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const SuccessModal = ({ 
    isOpen, 
    onClose, 
    title = "Success!", 
    message = "Operation completed successfully.", 
    buttonText = "OK",
    icon: CustomIcon 
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6">
                                    <button
                                        onClick={onClose}
                                        className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                    <div className="flex flex-col items-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                            {CustomIcon ? (
                                                <CustomIcon className="h-8 w-8 text-white" />
                                            ) : (
                                                <CheckCircleIcon className="h-8 w-8 text-white" />
                                            )}
                                        </div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-xl font-bold text-white"
                                        >
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-100 px-6 py-4">
                                    <button
                                        type="button"
                                        className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                                        onClick={onClose}
                                    >
                                        {buttonText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default SuccessModal