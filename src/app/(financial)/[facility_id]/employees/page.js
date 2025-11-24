'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import TempPasswordModal from '@/components/TempPasswordModal'
import ConfirmModal from '@/components/ConfirmModal'
import EmployeeEditModal from '@/components/EmployeeEditModal'

const roleOptions = [
    { value: 'caseworker', label: 'Caseworker' },
    { value: 'finance', label: 'Finance' },
]

const EmployeesPage = () => {
    const router = useRouter()
    const { facility_id } = useParams()
    const [facility, setFacility] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [employees, setEmployees] = useState([])
    const [loadingEmployees, setLoadingEmployees] = useState(true)

    // modals state
    const [tempModal, setTempModal] = useState({ open: false, email: '', password: '' })
    const [statusModal, setStatusModal] = useState({ open: false, employee: null, mode: null }) // mode: 'archive' | 'activate'
    const [editModal, setEditModal] = useState({ open: false, employee: null })

    // form state
    const [form, setForm] = useState({
        firstname: '',
        middlename: '',
        lastname: '',
        email: '',
        contact_number: '',
        address: '',
        role: 'caseworker',
    })
    const [saving, setSaving] = useState(false)

    // removed (moved to group above)

    useEffect(() => {
        const fetchFacility = async () => {
            try {
                const response = await axios.get('/api/my-facilities')
                if (response.data.length > 0) {
                    const userFacility = response.data[0]
                    if (userFacility.id?.toString() === facility_id) {
                        setFacility(userFacility)
                        loadEmployees()
                    } else {
                        setError('Center not found or access denied')
                    }
                } else {
                    setError('No center found')
                }
            } catch (error) {
                console.error('Error fetching center:', error)
                setError('Failed to load center data')
            } finally {
                setIsLoading(false)
            }
        }

        const loadEmployees = async () => {
            setLoadingEmployees(true)
            try {
                const res = await axios.get('/api/employees')
                const page = res.data?.data || res.data
                // If paginated (Laravel), use data.data
                const items = page?.data ?? []
                setEmployees(items)
            } catch (err) {
                console.error('Failed to load employees', err)
            } finally {
                setLoadingEmployees(false)
            }
        }

        if (facility_id) {
            fetchFacility()
        }
    }, [facility_id])

    const submit = async e => {
        e.preventDefault()
        setSaving(true)
        try {
            const createRes = await axios.post('/api/employees', form)
            const temp = createRes?.data?.temporary_password
            const email = form.email
            // Open modal to show temporary password
            if (temp) {
                setTempModal({ open: true, email, password: temp })
            }
            // reload employees
            const res = await axios.get('/api/employees')
            const page = res.data?.data || res.data
            const items = page?.data ?? []
            setEmployees(items)
            setForm({ firstname: '', middlename: '', lastname: '', email: '', contact_number: '', address: '', role: 'caseworker' })
        } catch (err) {
            console.error('Failed to add employee', err)
            alert(err?.response?.data?.message || 'Failed to add employee')
        } finally {
            setSaving(false)
        }
    }

    const reloadEmployees = async () => {
        const res = await axios.get('/api/employees')
        const page = res.data?.data || res.data
        const items = page?.data ?? []
        setEmployees(items)
    }

    const handleSave = async (emp, payload) => {
        try {
            await axios.put(`/api/employees/${emp.id}`, payload)
            await reloadEmployees()
        } catch (err) {
            console.error('Failed to update', err)
            alert(err?.response?.data?.message || 'Failed to update employee')
        }
    }

    const handleArchive = async (emp) => {
        // Set employee status to inactive (archived) without deleting any related data
        await handleSave(emp, { status: 'inactive' })
    }

    const handleActivate = async (emp) => {
        // Reactivate employee so they can regain access to previously managed data
        await handleSave(emp, { status: 'active' })
    }

    if (isLoading) {
        return (
            <>
                <Header title="Employee Management" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <Header title="Employee Management" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200 text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={() => router.push('/facility-registration')}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Register Center
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Employee Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {facility && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Employee Management for: {facility.center_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Center ID: {facility.id} | Center Code: {facility.center_id}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Add Employee */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Add Employee</h3>
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input className="border rounded p-2" placeholder="First name" value={form.firstname} onChange={e=>setForm({...form, firstname:e.target.value})} required />
                                <input className="border rounded p-2" placeholder="Middle name" value={form.middlename} onChange={e=>setForm({...form, middlename:e.target.value})} />
                                <input className="border rounded p-2" placeholder="Last name" value={form.lastname} onChange={e=>setForm({...form, lastname:e.target.value})} required />
                                <input className="border rounded p-2 md:col-span-2" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
                                <select className="border rounded p-2" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                                    {roleOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                                </select>
                                <input className="border rounded p-2" placeholder="Contact number" value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} />
                                <input className="border rounded p-2 md:col-span-2" placeholder="Address" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} />
                                <button disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded w-full md:w-auto">{saving ? 'Saving...' : 'Add Employee'}</button>
                            </form>
                        </div>
                    </div>

                    {/* Employees Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Employees</h3>
                            </div>

                            {loadingEmployees ? (
                                <Loading />)
                                : employees.length === 0 ? (
                                    <p className="text-gray-600">No employees yet.</p>
                                ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600 border-b">
                                            <th className="py-2 pr-4">Name</th>
                                            <th className="py-2 pr-4">Email</th>
                                            <th className="py-2 pr-4">Role</th>
                                            <th className="py-2 pr-4">Contact</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => (
                                            <tr key={emp.id} className="border-b last:border-b-0">
                                                <td className="py-2 pr-4">{emp.firstname} {emp.middlename} {emp.lastname}</td>
                                                <td className="py-2 pr-4">{emp.email}</td>
                                                <td className="py-2 pr-4">{emp.system_role?.name || emp.systemRole?.name || emp.role}</td>
                                                <td className="py-2 pr-4">{emp.contact_number || '-'}</td>
                                                <td className="py-2 pr-4 capitalize">{emp.status === 'inactive' ? 'Archived' : emp.status}</td>
                                                <td className="py-2 pr-4 whitespace-nowrap flex gap-2">
                                                    <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={()=> setEditModal({ open: true, employee: emp })}>Edit</button>
                                                    {emp.status === 'active' ? (
                                                        <button
                                                            className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                            onClick={()=> setStatusModal({ open: true, employee: emp, mode: 'archive' })}
                                                        >
                                                            Archive
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200"
                                                            onClick={()=> setStatusModal({ open: true, employee: emp, mode: 'activate' })}
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TempPasswordModal
                isOpen={tempModal.open}
                email={tempModal.email}
                password={tempModal.password}
                facilityName={facility?.center_name}
                onClose={() => setTempModal({ open: false, email: '', password: '' })}
            />

            <ConfirmModal
                isOpen={statusModal.open}
                onClose={() => setStatusModal({ open: false, employee: null, mode: null })}
                onConfirm={async () => {
                    if (!statusModal.employee || !statusModal.mode) return
                    if (statusModal.mode === 'archive') {
                        await handleArchive(statusModal.employee)
                    } else if (statusModal.mode === 'activate') {
                        await handleActivate(statusModal.employee)
                    }
                    setStatusModal({ open: false, employee: null, mode: null })
                }}
                title={statusModal.mode === 'archive' ? 'Archive Employee' : 'Activate Employee'}
                message={statusModal.mode === 'archive'
                    ? `Are you sure you want to archive ${statusModal.employee ? (statusModal.employee.firstname + ' ' + statusModal.employee.lastname) : ''}? They will be deactivated but their data will be preserved.`
                    : `Are you sure you want to activate ${statusModal.employee ? (statusModal.employee.firstname + ' ' + statusModal.employee.lastname) : ''}? They will regain access to their managed data.`}
                confirmText={statusModal.mode === 'archive' ? 'Archive' : 'Activate'}
                type={statusModal.mode === 'archive' ? 'warning' : 'info'}
            />

            <EmployeeEditModal
                isOpen={editModal.open}
                initial={editModal.employee}
                onClose={()=> setEditModal({ open:false, employee:null })}
                onSave={async (payload)=>{ if (!editModal.employee) return; await handleSave(editModal.employee, payload); setEditModal({ open:false, employee:null }) }}
            />
        </>
    )
}

export default EmployeesPage
