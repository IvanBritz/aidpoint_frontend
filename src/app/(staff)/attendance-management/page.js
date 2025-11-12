'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'

const AttendanceManagement = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceStatus, setAttendanceStatus] = useState('present')
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthlyAttendance, setMonthlyAttendance] = useState({})

  const isCaseworker = user?.system_role?.name?.toLowerCase() === 'caseworker'

  useEffect(() => {
    if (user && isCaseworker) {
      loadBeneficiaries()
      loadAttendanceRecords()
    }
  }, [user, isCaseworker])

  useEffect(() => {
    if (selectedBeneficiary) {
      loadBeneficiaryMonthlyAttendance()
    }
  }, [selectedBeneficiary, currentMonth, currentYear])

  const loadBeneficiaries = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/attendance/beneficiaries')
      setBeneficiaries(res?.data?.data || [])
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load beneficiaries')
      setBeneficiaries([])
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceRecords = async () => {
    try {
      const res = await axios.get(`/api/attendance?month=${currentMonth}&year=${currentYear}&per_page=20`)
      setAttendanceRecords(res?.data?.data?.data || [])
    } catch (e) {
      console.error('Error loading attendance records:', e)
    }
  }

  const loadBeneficiaryMonthlyAttendance = async () => {
    if (!selectedBeneficiary) return
    
    try {
      const res = await axios.get(`/api/attendance/beneficiaries/${selectedBeneficiary.id}/monthly?month=${currentMonth}&year=${currentYear}`)
      setMonthlyAttendance(res?.data?.data || {})
    } catch (e) {
      console.error('Error loading monthly attendance:', e)
      setMonthlyAttendance({})
    }
  }

  const recordAttendance = async (e) => {
    e.preventDefault()
    
    if (!selectedBeneficiary) {
      alert('Please select a beneficiary')
      return
    }

    try {
      setRecording(true)
      await axios.post('/api/attendance/record', {
        beneficiary_id: selectedBeneficiary.id,
        attendance_date: attendanceDate,
        status: attendanceStatus,
        notes: notes.trim() || null,
      })
      
      // Reset form
      setAttendanceDate(new Date().toISOString().split('T')[0])
      setAttendanceStatus('present')
      setNotes('')
      
      // Refresh data
      loadAttendanceRecords()
      loadBeneficiaryMonthlyAttendance()
      
      alert('Attendance recorded successfully!')
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to record attendance')
    } finally {
      setRecording(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  if (!isCaseworker) {
    return (
      <>
        <Header title="Attendance Management" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <p>Only caseworkers can access attendance management.</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Header title="Attendance Management" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Attendance Management" />
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Record Attendance */}
            <div className="lg:col-span-1">
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Record Attendance</h3>
                </div>
                <div className="p-6">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <form onSubmit={recordAttendance} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary *
                      </label>
                      <select
                        value={selectedBeneficiary?.id || ''}
                        onChange={(e) => {
                          const beneficiary = beneficiaries.find(b => b.id == e.target.value)
                          setSelectedBeneficiary(beneficiary || null)
                        }}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a beneficiary</option>
                        {beneficiaries.map(beneficiary => (
                          <option key={beneficiary.id} value={beneficiary.id}>
                            {beneficiary.name} {beneficiary.is_scholar && '(Scholar)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Optional notes..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={recording}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
                    >
                      {recording ? 'Recording...' : 'Record Attendance'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Attendance Summary and Records */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Monthly Summary */}
              {selectedBeneficiary && monthlyAttendance.beneficiary && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Monthly Attendance - {selectedBeneficiary.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <select
                          value={currentMonth}
                          onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>
                              {new Date(2023, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                        <select
                          value={currentYear}
                          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({length: 5}, (_, i) => (
                            <option key={i} value={new Date().getFullYear() - 2 + i}>
                              {new Date().getFullYear() - 2 + i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {monthlyAttendance.attendance_summary?.present_days || 0}
                        </div>
                        <div className="text-sm text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {monthlyAttendance.attendance_summary?.absent_days || 0}
                        </div>
                        <div className="text-sm text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {monthlyAttendance.attendance_summary?.excused_days || 0}
                        </div>
                        <div className="text-sm text-gray-500">Excused</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {monthlyAttendance.attendance_summary?.sunday_absences || 0}
                        </div>
                        <div className="text-sm text-gray-500">Sunday Absences</div>
                      </div>
                    </div>

                    {/* COLA Calculation */}
                    {monthlyAttendance.cola_calculation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">COLA Calculation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium ${monthlyAttendance.cola_calculation.is_scholar ? 'text-blue-600' : 'text-gray-600'}`}>
                              {monthlyAttendance.cola_calculation.is_scholar ? 'Scholar' : 'Non-Scholar'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Amount:</span>
                            <span className="font-medium">{formatCurrency(monthlyAttendance.cola_calculation.base_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sunday Absence Deduction:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(monthlyAttendance.cola_calculation.deduction_amount)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-medium">Final COLA Amount:</span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(monthlyAttendance.cola_calculation.final_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Attendance Records */}
              <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
                </div>
                <div className="overflow-x-auto">
                  {attendanceRecords.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No attendance records found.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Beneficiary
                          </th>
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
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {record.beneficiary?.firstname} {record.beneficiary?.lastname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.beneficiary?.is_scholar ? 'Scholar' : 'Non-Scholar'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.attendance_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {record.day_of_week}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'present' ? 'bg-green-100 text-green-800' :
                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {record.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AttendanceManagement