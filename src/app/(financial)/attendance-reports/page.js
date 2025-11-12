'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'

const AttendanceReports = () => {
  const { user } = useAuth({ middleware: 'auth' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [attendanceData, setAttendanceData] = useState({})
  const [reportData, setReportData] = useState([])
  const [summary, setSummary] = useState({})
  
  const isAuthorized = user?.system_role?.name?.toLowerCase() === 'director' || 
                      user?.system_role?.name?.toLowerCase() === 'finance'

  useEffect(() => {
    if (user && isAuthorized) {
      loadBeneficiaries()
    }
  }, [user, isAuthorized])

  useEffect(() => {
    if (selectedBeneficiary) {
      loadBeneficiaryAttendance()
    } else {
      loadFacilityReport()
    }
  }, [selectedBeneficiary, selectedMonth, selectedYear])

  const loadBeneficiaries = async () => {
    try {
      setLoading(true)
      // This would need to be an endpoint that returns beneficiaries for the facility
      const res = await axios.get('/api/beneficiaries')
      setBeneficiaries(res?.data?.data || [])
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load beneficiaries')
      setBeneficiaries([])
    } finally {
      setLoading(false)
    }
  }

  const loadBeneficiaryAttendance = async () => {
    if (!selectedBeneficiary) return
    
    try {
      setLoading(true)
      const res = await axios.post('/api/calculate-cola-amount', {
        beneficiary_id: parseInt(selectedBeneficiary),
        month: selectedMonth,
        year: selectedYear,
      })
      setAttendanceData(res?.data?.data || {})
      setError(null)
    } catch (e) {
      console.error('Error loading attendance data:', e)
      setAttendanceData({})
    } finally {
      setLoading(false)
    }
  }

  const loadFacilityReport = async () => {
    try {
      setLoading(true)
      // Mock implementation - this would need a proper backend endpoint
      // For now, we'll create sample data
      const mockData = [
        {
          id: 1,
          name: 'John Doe',
          is_scholar: true,
          present_days: 22,
          absent_days: 3,
          sunday_absences: 1,
          base_amount: 2000,
          deduction: 300,
          final_amount: 1700
        },
        {
          id: 2,
          name: 'Jane Smith',
          is_scholar: false,
          present_days: 25,
          absent_days: 0,
          sunday_absences: 0,
          base_amount: 1500,
          deduction: 0,
          final_amount: 1500
        }
      ]
      
      setReportData(mockData)
      
      // Calculate summary
      const totalBeneficiaries = mockData.length
      const totalScholars = mockData.filter(b => b.is_scholar).length
      const totalColaAmount = mockData.reduce((sum, b) => sum + b.final_amount, 0)
      const totalDeductions = mockData.reduce((sum, b) => sum + b.deduction, 0)
      
      setSummary({
        total_beneficiaries: totalBeneficiaries,
        total_scholars: totalScholars,
        total_non_scholars: totalBeneficiaries - totalScholars,
        total_cola_amount: totalColaAmount,
        total_deductions: totalDeductions,
      })
      
      setError(null)
    } catch (e) {
      console.error('Error loading facility report:', e)
      setReportData([])
      setSummary({})
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    // Mock export functionality
    const csvContent = [
      ['Beneficiary Name', 'Scholar Status', 'Present Days', 'Absent Days', 'Sunday Absences', 'Base Amount', 'Deductions', 'Final COLA Amount'],
      ...reportData.map(row => [
        row.name,
        row.is_scholar ? 'Scholar' : 'Non-Scholar',
        row.present_days,
        row.absent_days,
        row.sunday_absences,
        row.base_amount,
        row.deduction,
        row.final_amount
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-cola-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getMonthName = (monthNum) => {
    return new Date(2023, monthNum - 1).toLocaleString('default', { month: 'long' })
  }

  if (!isAuthorized) {
    return (
      <>
        <Header title="Attendance Reports" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <p>Only directors and finance staff can access attendance reports.</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Attendance & COLA Reports" />
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Filters */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary
                  </label>
                  <select
                    value={selectedBeneficiary}
                    onChange={(e) => setSelectedBeneficiary(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Beneficiaries</option>
                    {beneficiaries.map(beneficiary => (
                      <option key={beneficiary.id} value={beneficiary.id}>
                        {beneficiary.firstname} {beneficiary.lastname}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>
                        {getMonthName(i+1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({length: 3}, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - 1 + i}>
                        {new Date().getFullYear() - 1 + i}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={exportReport}
                    disabled={reportData.length === 0 && !attendanceData.beneficiary_name}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Individual Beneficiary Report */}
          {selectedBeneficiary && attendanceData.beneficiary_name && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Individual Report - {attendanceData.beneficiary_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {getMonthName(selectedMonth)} {selectedYear}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${attendanceData.is_scholar ? 'text-blue-600' : 'text-gray-600'}`}>
                      {attendanceData.is_scholar ? 'Scholar' : 'Non-Scholar'}
                    </div>
                    <div className="text-sm text-gray-500">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceData.attendance_summary?.present_days || 0}
                    </div>
                    <div className="text-sm text-gray-500">Present Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceData.sunday_absences || 0}
                    </div>
                    <div className="text-sm text-gray-500">Sunday Absences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(attendanceData.deduction_amount || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Deductions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(attendanceData.final_cola_amount || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Final COLA</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">COLA Calculation Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Amount ({attendanceData.is_scholar ? 'Scholar' : 'Non-Scholar'}):</span>
                      <span className="font-medium">{formatCurrency(attendanceData.base_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday Absences ({attendanceData.sunday_absences || 0} × ₱300):</span>
                      <span className="font-medium text-red-600">-{formatCurrency(attendanceData.deduction_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">Final COLA Amount:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(attendanceData.final_cola_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facility Summary */}
          {!selectedBeneficiary && Object.keys(summary).length > 0 && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Facility Summary - {getMonthName(selectedMonth)} {selectedYear}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.total_beneficiaries}
                    </div>
                    <div className="text-sm text-gray-500">Total Beneficiaries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {summary.total_scholars}
                    </div>
                    <div className="text-sm text-gray-500">Scholars</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {summary.total_non_scholars}
                    </div>
                    <div className="text-sm text-gray-500">Non-Scholars</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.total_deductions)}
                    </div>
                    <div className="text-sm text-gray-500">Total Deductions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.total_cola_amount)}
                    </div>
                    <div className="text-sm text-gray-500">Total COLA Amount</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facility Report Table */}
          {!selectedBeneficiary && reportData.length > 0 && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed Report</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beneficiary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sunday Absences
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final COLA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.is_scholar ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row.is_scholar ? 'Scholar' : 'Non-Scholar'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.present_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {row.sunday_absences}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.base_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(row.deduction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(row.final_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !selectedBeneficiary && reportData.length === 0 && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-900">No attendance data found</p>
                <p className="mt-2 text-sm text-gray-500">
                  No attendance records found for {getMonthName(selectedMonth)} {selectedYear}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default AttendanceReports