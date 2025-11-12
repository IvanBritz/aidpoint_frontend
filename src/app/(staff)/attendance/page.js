'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'
import Toast from '@/components/Toast'

const AttendancePage = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const [loading, setLoading] = useState(true)
    const [beneficiaries, setBeneficiaries] = useState([])
    const [selectedBeneficiary, setSelectedBeneficiary] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [attendanceData, setAttendanceData] = useState([])
    const [attendanceLoading, setAttendanceLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // Toast notification state
    const [toast, setToast] = useState({
        show: false,
        type: 'success',
        title: '',
        message: ''
    })

    // Check if user is caseworker
    const isCaseworker = user?.system_role?.name?.toLowerCase() === 'caseworker'
    
    // Helper functions
    const getBeneficiaryName = (beneficiaryId) => {
        const beneficiary = beneficiaries.find(b => b.id == beneficiaryId)
        return beneficiary ? `${beneficiary.firstname} ${beneficiary.lastname}` : ''
    }
    
    const showToast = (type, title, message) => {
        setToast({
            show: true,
            type,
            title,
            message
        })
    }
    
    const closeToast = () => {
        setToast(prev => ({ ...prev, show: false }))
    }

    useEffect(() => {
        if (user && isCaseworker) {
            loadBeneficiaries()
        }
    }, [user, isCaseworker])

    useEffect(() => {
        if (selectedBeneficiary) {
            loadAttendanceData()
        }
    }, [selectedBeneficiary, selectedMonth, selectedYear])

    const loadBeneficiaries = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/attendance/beneficiaries')
            setBeneficiaries(res.data?.data || [])
        } catch (error) {
            console.error('Failed to load beneficiaries:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadAttendanceData = async () => {
        try {
            setAttendanceLoading(true)
            const res = await axios.get(`/api/attendance/beneficiaries/${selectedBeneficiary}/monthly`, {
                params: {
                    year: selectedYear,
                    month: selectedMonth
                }
            })
            setAttendanceData(res.data?.data || [])
        } catch (error) {
            console.error('Failed to load attendance data:', error)
            setAttendanceData([])
        } finally {
            setAttendanceLoading(false)
        }
    }

    const recordAttendance = async (date, status) => {
        try {
            setSaving(true)
            await axios.post('/api/attendance/record', {
                beneficiary_id: selectedBeneficiary,
                attendance_date: date,
                status: status
            })
            
            // Reload attendance data
            await loadAttendanceData()
            
            // Show success toast
            const beneficiaryName = getBeneficiaryName(selectedBeneficiary)
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            showToast('success', 'Attendance Recorded!', `${beneficiaryName} marked as ${status.charAt(0).toUpperCase() + status.slice(1)} for ${formattedDate}`)
        } catch (error) {
            console.error('Failed to record attendance:', error)
            showToast('error', 'Recording Failed', error.response?.data?.message || 'Failed to record attendance. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const updateAttendance = async (attendanceId, status) => {
        try {
            setSaving(true)
            
            // Find the current attendance record to get the date
            const currentRecord = attendanceData.find(record => record.id === attendanceId)
            const date = currentRecord ? currentRecord.attendance_date : ''
            
            await axios.put(`/api/attendance/${attendanceId}`, {
                status: status
            })
            
            // Reload attendance data
            await loadAttendanceData()
            
            // Show success toast
            const beneficiaryName = getBeneficiaryName(selectedBeneficiary)
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            showToast('success', 'Attendance Updated!', `${beneficiaryName} updated to ${status.charAt(0).toUpperCase() + status.slice(1)} for ${formattedDate}`)
        } catch (error) {
            console.error('Failed to update attendance:', error)
            showToast('error', 'Update Failed', error.response?.data?.message || 'Failed to update attendance. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const getDaysInMonth = (year, month) => {
        return new Date(year, month, 0).getDate()
    }

    const getDateString = (year, month, day) => {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    }

    const getDayOfWeek = (year, month, day) => {
        const date = new Date(year, month - 1, day)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[date.getDay()]
    }

    const getAttendanceForDate = (dateString) => {
        return attendanceData.find(record => record.attendance_date === dateString)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800'
            case 'absent':
                return 'bg-red-100 text-red-800'
            case 'excused':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const calculateCOLAInfo = () => {
        if (!selectedBeneficiary || !attendanceData.length) return null

        const selectedBen = beneficiaries.find(b => b.id == selectedBeneficiary)
        if (!selectedBen) return null

        // Base COLA amount
        const baseCOLA = selectedBen.is_scholar ? 2000 : 1500

        // Count Sunday absences
        const sundayAbsences = attendanceData.filter(record => 
            record.day_of_week === 'sunday' && record.status === 'absent'
        ).length

        // Calculate deduction
        const deduction = sundayAbsences * 300
        const finalAmount = Math.max(0, baseCOLA - deduction)

        return {
            baseCOLA,
            sundayAbsences,
            deduction,
            finalAmount,
            isScholar: selectedBen.is_scholar
        }
    }

    if (!isCaseworker) {
        return (
            <>
                <Header title="Sunday Attendance Management" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <p className="text-red-600">Access denied. Only caseworkers can access this page.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Calculate how many Sundays are in the selected month
    const getSundaysInMonth = (year, month) => {
        const sundays = []
        for (let day = 1; day <= getDaysInMonth(year, month); day++) {
            const dayOfWeek = getDayOfWeek(year, month, day)
            if (dayOfWeek === 'Sunday') {
                sundays.push(day)
            }
        }
        return sundays
    }

    const sundaysInMonth = getSundaysInMonth(selectedYear, selectedMonth)
    const colaInfo = calculateCOLAInfo()

    return (
        <>
            <Header title="Sunday Attendance Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Control Panel */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Sunday Attendance (COLA Days)</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Beneficiary Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Beneficiary
                                    </label>
                                    <select
                                        value={selectedBeneficiary}
                                        onChange={(e) => setSelectedBeneficiary(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={loading}
                                    >
                                        <option value="">Choose a beneficiary...</option>
                                        {beneficiaries.map((beneficiary) => (
                                            <option key={beneficiary.id} value={beneficiary.id}>
                                                {beneficiary.firstname} {beneficiary.lastname}
                                                {beneficiary.is_scholar && ' (Scholar)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Month Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Month
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {monthNames.map((month, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Year
                                    </label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {[2024, 2025, 2026].map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* COLA Information */}
                            {colaInfo && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h3 className="text-lg font-medium text-blue-900 mb-2">COLA Calculation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-blue-800">Base Amount:</span>
                                            <div className="text-lg font-bold text-blue-900">₱{colaInfo.baseCOLA.toLocaleString()}</div>
                                            <div className="text-xs text-blue-600">
                                                {colaInfo.isScholar ? 'Scholar Rate' : 'Non-Scholar Rate'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-red-800">Sunday Absences:</span>
                                            <div className="text-lg font-bold text-red-900">{colaInfo.sundayAbsences}</div>
                                            <div className="text-xs text-red-600">₱300 each</div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-red-800">Total Deduction:</span>
                                            <div className="text-lg font-bold text-red-900">₱{colaInfo.deduction.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-green-800">Final COLA:</span>
                                            <div className="text-lg font-bold text-green-900">₱{colaInfo.finalAmount.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Calendar */}
                    {selectedBeneficiary && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Sunday Attendance for {monthNames[selectedMonth - 1]} {selectedYear}
                                    </h3>
                                    {attendanceLoading && (
                                        <div className="flex items-center text-blue-600">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading...
                                        </div>
                                    )}
                                </div>

                                {!attendanceLoading && (
                                    <div className="overflow-x-auto">
                                        {sundaysInMonth.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Sundays in {monthNames[selectedMonth - 1]} {selectedYear}</h3>
                                                    <p className="mt-1 text-sm text-gray-500">There are no COLA days (Sundays) to track in this month.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Day
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {Array.from({ length: daysInMonth }, (_, index) => {
                                                        const day = index + 1
                                                        const dateString = getDateString(selectedYear, selectedMonth, day)
                                                        const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day)
                                                        const attendance = getAttendanceForDate(dateString)
                                                        const isSunday = dayOfWeek === 'Sunday'

                                                        // Only show Sundays
                                                        if (!isSunday) {
                                                            return null
                                                        }

                                                        return (
                                                            <tr key={day} className="bg-yellow-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {dateString}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <span className="font-bold text-yellow-700">
                                                                        {dayOfWeek} (COLA Day)
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {attendance ? (
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                                                                            {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">Not recorded</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                    {attendance ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => updateAttendance(attendance.id, 'present')}
                                                                                disabled={saving || attendance.status === 'present'}
                                                                                className={`px-3 py-1 rounded text-xs font-medium ${
                                                                                    attendance.status === 'present' 
                                                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                                                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                                                                }`}
                                                                            >
                                                                                Present
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateAttendance(attendance.id, 'absent')}
                                                                                disabled={saving || attendance.status === 'absent'}
                                                                                className={`px-3 py-1 rounded text-xs font-medium ${
                                                                                    attendance.status === 'absent' 
                                                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                                                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                                                                }`}
                                                                            >
                                                                                Absent
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateAttendance(attendance.id, 'excused')}
                                                                                disabled={saving || attendance.status === 'excused'}
                                                                                className={`px-3 py-1 rounded text-xs font-medium ${
                                                                                    attendance.status === 'excused' 
                                                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                                                                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                                                }`}
                                                                            >
                                                                                Excused
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={() => recordAttendance(dateString, 'present')}
                                                                                disabled={saving}
                                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50"
                                                                            >
                                                                                Present
                                                                            </button>
                                                                            <button
                                                                                onClick={() => recordAttendance(dateString, 'absent')}
                                                                                disabled={saving}
                                                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                                                                            >
                                                                                Absent
                                                                            </button>
                                                                            <button
                                                                                onClick={() => recordAttendance(dateString, 'excused')}
                                                                                disabled={saving}
                                                                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium disabled:opacity-50"
                                                                            >
                                                                                Excused
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    }).filter(Boolean)}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {attendanceLoading && (
                                    <div className="text-center py-12">
                                        <Loading />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <Loading />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Toast Notifications */}
            <Toast
                open={toast.show}
                onClose={closeToast}
                type={toast.type}
                title={toast.title}
                message={toast.message}
            />
        </>
    )
}

export default AttendancePage
