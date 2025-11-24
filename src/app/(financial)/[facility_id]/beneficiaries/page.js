'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import TempPasswordModal from '@/components/TempPasswordModal'

const BeneficiariesPage = () => {
    const router = useRouter()
    const { facility_id } = useParams()
    
    const [facility, setFacility] = useState(null)
    const [beneficiaries, setBeneficiaries] = useState([])
    const [caseworkers, setCaseworkers] = useState([])
    const [pagination, setPagination] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    
    // Form states
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const [tempModal, setTempModal] = useState({ open: false, email: '', password: '' })
    const [formData, setFormData] = useState({
        firstname: '',
        middlename: '',
        lastname: '',
        contact_number: '',
        address: '',
        email: '',
        birthdate: '',
        enrolled_school: '',
        school_year: '',
        caseworker_id: ''
    })

    // Inline assignment state for unassigned beneficiaries
    const [assignSelection, setAssignSelection] = useState({})
    const [assigningId, setAssigningId] = useState(null)

    useEffect(() => {
        if (facility_id) {
            fetchFacilityAndBeneficiaries(currentPage)
            fetchCaseworkers()
        }
    }, [facility_id, currentPage])

    const fetchFacilityAndBeneficiaries = async (page = 1) => {
        try {
            setIsLoading(true)
            
            // Fetch facility info first
            const facilityResponse = await axios.get('/api/my-facilities')
            if (facilityResponse.data.length > 0) {
                const userFacility = facilityResponse.data[0]
                if (userFacility.id?.toString() === facility_id) {
                    setFacility(userFacility)
                } else {
                    setError('Facility not found or access denied')
                    return
                }
            } else {
                setError('No facility found')
                return
            }
            
            // Fetch beneficiaries
            const response = await axios.get(`/api/beneficiaries?page=${page}&per_page=10`)
            if (response.data.success) {
                setBeneficiaries(response.data.data.data)
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                    per_page: response.data.data.per_page,
                    from: response.data.data.from,
                    to: response.data.data.to
                })
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            setError(error.response?.data?.message || 'Failed to load data')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCaseworkers = async () => {
        try {
            const response = await axios.get('/api/caseworkers/dropdown')
            if (response.data.success) {
                setCaseworkers(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching caseworkers:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear specific field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: [] }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFormErrors({})
        setError('')
        setSuccess('')

        try {
            const response = await axios.post('/api/beneficiaries', formData)
            if (response.data.success) {
                setSuccess(response.data.message)
                // Show temp password modal if provided
                const temp = response.data.temporary_password
                if (temp) setTempModal({ open: true, email: formData.email, password: temp })
                setShowForm(false)
                setFormData({
                    firstname: '',
                    middlename: '',
                    lastname: '',
                    contact_number: '',
                    address: '',
                    email: '',
                    birthdate: '',
                    enrolled_school: '',
                    school_year: '',
                    caseworker_id: ''
                })
                // Refresh beneficiaries list
                await fetchFacilityAndBeneficiaries(currentPage)
                
                // Auto hide success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000)
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setFormErrors(error.response.data.errors || {})
            } else {
                setError(error.response?.data?.message || 'Failed to register beneficiary')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const assignBeneficiary = async (beneficiaryId) => {
        const selected = assignSelection[beneficiaryId]
        if (!selected) {
            alert('Please select a caseworker.')
            return
        }
        try {
            setAssigningId(beneficiaryId)
            await axios.post('/api/caseworkers/assign', { beneficiary_id: beneficiaryId, caseworker_id: selected })
            // Refresh list
            await fetchFacilityAndBeneficiaries(currentPage)
            setSuccess('Beneficiary assigned successfully.')
            setTimeout(() => setSuccess(''), 3000)
        } catch (e) {
            alert(e?.response?.data?.message || 'Failed to assign beneficiary')
        } finally {
            setAssigningId(null)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const renderPagination = () => {
        if (!pagination.last_page || pagination.last_page <= 1) return null

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{pagination.from}</span> to{' '}
                            <span className="font-medium">{pagination.to}</span> of{' '}
                            <span className="font-medium">{pagination.total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                                onClick={() => setCurrentPage(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                const pageNum = i + Math.max(1, pagination.current_page - 2)
                                if (pageNum > pagination.last_page) return null
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            pageNum === pagination.current_page
                                                ? 'z-10 bg-blue-600 text-white'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                            
                            <button
                                onClick={() => setCurrentPage(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading && !facility) {
        return (
            <>
                <Header title="Beneficiary Management" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Loading />
                    </div>
                </div>
            </>
        )
    }

    if (error && !facility) {
        return (
            <>
                <Header title="Beneficiary Management" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200 text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={() => router.push('/facility-registration')}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Register Facility
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
            <Header title="Beneficiary Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Facility Info */}
                    {facility && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Beneficiary Management for: {facility.center_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Facility ID: {facility.id} | Center ID: {facility.center_id}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                            <button
                                onClick={() => setError('')}
                                className="float-right text-red-700 hover:text-red-900"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Registration Form */}
                    {showForm && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Register New Beneficiary</h2>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Personal Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="firstname">First Name *</Label>
                                            <Input
                                                id="firstname"
                                                name="firstname"
                                                type="text"
                                                value={formData.firstname}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.firstname} className="mt-2" />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="middlename">Middle Name</Label>
                                            <Input
                                                id="middlename"
                                                name="middlename"
                                                type="text"
                                                value={formData.middlename}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                            />
                                            <InputError messages={formErrors.middlename} className="mt-2" />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="lastname">Last Name *</Label>
                                            <Input
                                                id="lastname"
                                                name="lastname"
                                                type="text"
                                                value={formData.lastname}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.lastname} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.email} className="mt-2" />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="contact_number">Contact Number</Label>
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                type="text"
                                                value={formData.contact_number}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                            />
                                            <InputError messages={formErrors.contact_number} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="block mt-1 w-full"
                                        />
                                        <InputError messages={formErrors.address} className="mt-2" />
                                    </div>

                                    {/* Educational Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="birthdate">Birthdate *</Label>
                                            <Input
                                                id="birthdate"
                                                name="birthdate"
                                                type="date"
                                                value={formData.birthdate}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.birthdate} className="mt-2" />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="enrolled_school">Enrolled School *</Label>
                                            <Input
                                                id="enrolled_school"
                                                name="enrolled_school"
                                                type="text"
                                                value={formData.enrolled_school}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.enrolled_school} className="mt-2" />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="school_year">School Year *</Label>
                                            <Input
                                                id="school_year"
                                                name="school_year"
                                                type="text"
                                                placeholder="e.g., Grade 10, 2nd Year College"
                                                value={formData.school_year}
                                                onChange={handleInputChange}
                                                className="block mt-1 w-full"
                                                required
                                            />
                                            <InputError messages={formErrors.school_year} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Caseworker Assignment */}
                                    <div>
                                        <Label htmlFor="caseworker_id">Assign to Caseworker *</Label>
                                        <select
                                            id="caseworker_id"
                                            name="caseworker_id"
                                            value={formData.caseworker_id}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm block mt-1 w-full"
                                            required
                                        >
                                            <option value="">Select a caseworker...</option>
                                            {caseworkers.map((caseworker) => (
                                                <option key={caseworker.id} value={caseworker.id}>
                                                    {caseworker.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError messages={formErrors.caseworker_id} className="mt-2" />
                                        {caseworkers.length === 0 && (
                                            <p className="mt-2 text-sm text-yellow-600">
                                                No caseworkers found. Please add caseworkers to your facility first.
                                            </p>
                                        )}
                                    </div>

                                    {/* Temporary password will be auto-generated. */}
                                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
                                        A temporary password will be generated automatically. The beneficiary will be required to change it on first login.
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex items-center justify-end space-x-4 pt-4">
                                        <Button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="bg-gray-500 hover:bg-gray-700"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
                                            {isSubmitting ? 'Registering...' : 'Register Beneficiary'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Beneficiaries List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Registered Beneficiaries</h2>
                                {facility?.isManagable ? (
                                    <Button
                                        onClick={() => setShowForm(!showForm)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {showForm ? 'Cancel' : 'Register New Beneficiary'}
                                    </Button>
                                ) : (
                                    <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                                        Facility must be approved to register beneficiaries
                                    </div>
                                )}
                            </div>
                            
                            {beneficiaries.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No beneficiaries</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {facility?.isManagable 
                                            ? 'Get started by registering your first beneficiary.' 
                                            : 'Your facility must be approved before you can register beneficiaries.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Education
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Assigned Caseworker
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Registered
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {beneficiaries.map((beneficiary) => (
                                                <tr key={beneficiary.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {beneficiary.firstname} {beneficiary.middlename} {beneficiary.lastname}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                                <span>Age: {beneficiary.age ?? 'N/A'}</span>
                                                                {Number(beneficiary.age) >= 22 && !beneficiary.exit_letter_requested && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                const res = await axios.post(`/api/beneficiaries/${beneficiary.id}/request-exit-letter`)
                                                                                setSuccess(res.data?.message || 'Exit letter request sent successfully.')
                                                                                // Hide the button after first click without waiting for refetch
                                                                                setBeneficiaries(prev => prev.map(b => b.id === beneficiary.id ? { ...b, exit_letter_requested: true } : b))
                                                                                setTimeout(() => setSuccess(''), 3000)
                                                                            } catch (e) {
                                                                                alert(e?.response?.data?.message || 'Failed to send request')
                                                                            }
                                                                        }}
                                                                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-orange-600 hover:bg-orange-700 text-white"
                                                                    >
                                                                        Request Exit Letter
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {beneficiary.email}
                                                        </div>
                                                        {beneficiary.contact_number && (
                                                            <div className="text-sm text-gray-500">
                                                                {beneficiary.contact_number}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {beneficiary.enrolled_school}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {beneficiary.school_year}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {beneficiary.caseworker ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {beneficiary.caseworker.firstname} {beneficiary.caseworker.lastname}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {beneficiary.caseworker.email}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Not Assigned</span>
                                                                <select
                                                                    className="border-gray-300 rounded-md shadow-sm text-sm"
                                                                    value={assignSelection[beneficiary.id] || ''}
                                                                    onChange={e=> setAssignSelection(s=> ({...s, [beneficiary.id]: e.target.value}))}
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {caseworkers.map(cw => (
                                                                        <option key={cw.id} value={cw.id}>{cw.name}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={()=> assignBeneficiary(beneficiary.id)}
                                                                    disabled={assigningId===beneficiary.id || !assignSelection[beneficiary.id]}
                                                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs disabled:opacity-50"
                                                                >
                                                                    {assigningId===beneficiary.id ? 'Assigning...' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            beneficiary.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {beneficiary.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(beneficiary.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination */}
                        {renderPagination()}
                    </div>

                    {/* Navigation Back to Dashboard */}
                    <div className="text-center">
                        <button
                            onClick={() => router.push(`/${facility_id}/dashboard`)}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Temporary Password Modal */}
            <TempPasswordModal
                isOpen={tempModal.open}
                email={tempModal.email}
                password={tempModal.password}
                facilityName={facility?.center_name}
                onClose={() => setTempModal({ open: false, email: '', password: '' })}
            />
        </>
    )
}

export default BeneficiariesPage
