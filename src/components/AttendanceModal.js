'use client'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
    CheckCircleIcon, 
    XMarkIcon, 
    CalendarDaysIcon,
    ClockIcon,
    UserCheckIcon 
} from '@heroicons/react/24/outline'

const AttendanceModal = ({ 
    isOpen, 
    onClose, 
    type = "success", // "success" | "error"
    attendanceType = "present", // "present" | "absent" | "excused"
    beneficiaryName = "",
    date = "",
    message = ""
}) => {
    const getConfig = () => {
        if (type === "error") {
            return {
                title: "Error Recording Attendance",
                bgColor: "from-red-500 to-red-600",
                buttonColor: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                icon: XMarkIcon,
                iconBg: "bg-red-100"
            }
        }

        const configs = {
            present: {
                title: "Attendance Recorded Successfully",
                bgColor: "from-green-500 to-emerald-600",
                buttonColor: "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
                icon: UserCheckIcon,
                iconBg: "bg-green-100"
            },
            absent: {
                title: "Absence Recorded",
                bgColor: "from-amber-500 to-orange-600",
                buttonColor: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
                icon: CalendarDaysIcon,
                iconBg: "bg-amber-100"
            },
            excused: {
                title: "Excused Absence Recorded",
                bgColor: "from-blue-500 to-indigo-600",
                buttonColor: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
                icon: ClockIcon,
                iconBg: "bg-blue-100"
            }
        }

        return configs[attendanceType] || configs.present
    }

    const config = getConfig()
    const IconComponent = config.icon

    const getDefaultMessage = () => {
        if (type === "error") {
            return message || "Failed to record attendance. Please try again."
        }

        const messages = {
            present: `${beneficiaryName}'s attendance has been marked as Present for ${date}.`,
            absent: `${beneficiaryName}'s absence has been recorded for ${date}. This may affect their COLA calculation.`,
            excused: `${beneficiaryName}'s excused absence has been recorded for ${date}.`
        }

        return message || messages[attendanceType] || messages.present
    }

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
                                <div className={`relative bg-gradient-to-r ${config.bgColor} px-6 py-6`}>
                                    <button
                                        onClick={onClose}
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
                                            {config.title}
                                        </Dialog.Title>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6">
                                    {beneficiaryName && date && (
                                        <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700">Beneficiary:</span>
                                                <span className="text-gray-900">{beneficiaryName}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mt-2">
                                                <span className="font-medium text-gray-700">Date:</span>
                                                <span className="text-gray-900">{date}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mt-2">
                                                <span className="font-medium text-gray-700">Status:</span>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    attendanceType === 'present' ? 'bg-green-100 text-green-800' :
                                                    attendanceType === 'absent' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {attendanceType.charAt(0).toUpperCase() + attendanceType.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {getDefaultMessage()}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-100 px-6 py-4">
                                    <button
                                        type="button"
                                        className={`w-full rounded-lg bg-gradient-to-r ${config.buttonColor} px-6 py-3 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105`}
                                        onClick={onClose}
                                    >
                                        Got it, thanks!
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

export default AttendanceModal
