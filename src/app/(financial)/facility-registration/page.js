'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Header from '@/components/Header'

const FacilityRegistration = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingExisting, setIsCheckingExisting] = useState(true)
    const [existingFacility, setExistingFacility] = useState(null)
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    
    // Form state
    const [formData, setFormData] = useState({
        center_id: '',
        center_name: '',
        description: '',
    })
    
    const [documents, setDocuments] = useState([])
    
    // Check if user already has a facility
    useEffect(() => {
        const checkExistingFacility = async () => {
            try {
                const response = await axios.get('/api/my-facilities')
                if (response.data.length > 0) {
                    setExistingFacility(response.data[0])
                }
            } catch (error) {
                console.error('Error checking existing facility:', error)
            } finally {
                setIsCheckingExisting(false)
            }
        }
        
        checkExistingFacility()
    }, [])
    
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    const addDocument = () => {
        setDocuments(prev => [
            ...prev,
            { type: '', file: null, id: Date.now() }
        ])
    }

    const docsValid = documents.length > 0 && documents.every(d => d.type && d.file)
    
    const removeDocument = (id) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
    }
    
    const updateDocument = (id, field, value) => {
        setDocuments(prev => prev.map(doc => 
            doc.id === id ? { ...doc, [field]: value } : doc
        ))
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        setIsLoading(true)
        setErrors({})

        // Require at least one document with type and file
        if (!(documents.length > 0 && documents.every(d => d.type && d.file))) {
            setErrors(prev => ({ ...prev, documents: ['Please add at least one supporting document and select both a type and a file.'] }))
            setIsLoading(false)
            return
        }
        
        try {
            const submitData = new FormData()
            
            // Add form data
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    submitData.append(key, formData[key])
                }
            })
            
            // Add documents
            documents.forEach((doc, index) => {
                if (doc.type && doc.file) {
                    submitData.append(`documents[${index}][type]`, doc.type)
                    submitData.append(`documents[${index}][file]`, doc.file)
                }
            })
            
            const response = await axios.post('/api/financial-aid', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            // Success - redirect to facility dashboard using id
            if (response.data && response.data.id) {
                router.push(`/${response.data.id}/dashboard`)
            } else {
                // Fallback: refetch facility and redirect
                const facilityResponse = await axios.get('/api/my-facilities')
                if (facilityResponse.data.length > 0) {
                    router.push(`/${facilityResponse.data[0].id}/dashboard`)
                } else {
                    router.push('/facility-dashboard')
                }
            }
            
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors)
            } else {
                console.error('Registration error:', error)
                setErrors({ general: ['Something went wrong. Please try again.'] })
            }
        } finally {
            setIsLoading(false)
        }
    }
    
    
    // Show loading state while checking for existing facility
    if (isCheckingExisting) {
        return (
            <>
                <Header title="Register Center" />
                <div className="py-12">
                    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200 text-center">
                                <p>Checking existing centers...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
    
    // Show existing facility message if user already has one
    if (existingFacility) {
        return (
            <>
                <Header title="Register Center" />
                <div className="py-12">
                    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                    Center Already Registered
                                </h2>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-lg font-medium text-blue-900">
                                                You have already registered a center
                                            </h3>
                                            <div className="mt-2 text-blue-800">
                                                <p className="mb-2">Each user can only register one center. Your registered center details:</p>
                                                <div className="bg-white rounded p-4 mt-3">
                                                    <p><strong>Center ID:</strong> {existingFacility.center_id}</p>
                                                    <p><strong>Center Name:</strong> {existingFacility.center_name}</p>
                                                    <p><strong>Status:</strong> 
                                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                            existingFacility.isManagable 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {existingFacility.isManagable ? 'Approved' : 'Pending Approval'}
                                                        </span>
                                                    </p>
                                                    {existingFacility.description && (
                                                        <p><strong>Description:</strong> {existingFacility.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-center">
                                <Button
                                    onClick={() => router.push(`/${existingFacility.id}/dashboard`)}
                                    className="bg-blue-500 hover:bg-blue-700"
                                >
                                    Go to Dashboard
                                </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
    
    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Register Your Center
                                    </h1>
                                    <p className="mt-2 text-gray-600">
                                        Join the FinancialAid Pro network and start managing your center's financial aid programs
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white overflow-hidden shadow-2xl rounded-2xl">
                        <div className="px-8 py-10">
                            {/* Progress indicator */}
                            <div className="mb-8">
                                <div className="flex items-center justify-center">
                                    <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                                                1
                                            </div>
                                            <span className="ml-2 font-medium text-blue-600">Registration</span>
                                        </div>
                                        <div className="w-16 h-1 bg-gray-300 rounded"></div>
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium">
                                                2
                                            </div>
                                            <span className="ml-2 text-gray-500">Review</span>
                                        </div>
                                        <div className="w-16 h-1 bg-gray-300 rounded"></div>
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium">
                                                3
                                            </div>
                                            <span className="ml-2 text-gray-500">Approval</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {errors.general && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{errors.general[0]}</span>
                                    </div>
                                </div>
                            )}
                                
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Information Section */}
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h3>
                                        <p className="text-gray-600">Please provide your center's basic details</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Center ID */}
                                        <div>
                                            <Label htmlFor="center_id" className="text-sm font-medium text-gray-700">
                                                Center ID *
                                            </Label>
                                            <Input
                                                id="center_id"
                                                name="center_id"
                                                type="text"
                                                value={formData.center_id}
                                                onChange={handleInputChange}
                                                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="e.g., FAC-001, CENTER-ABC"
                                                required
                                            />
                                            <InputError 
                                                messages={errors.center_id} 
                                                className="mt-2" 
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Enter a unique identifier for your center
                                            </p>
                                        </div>
                                        
                                        {/* Center Name */}
                                        <div>
                                            <Label htmlFor="center_name" className="text-sm font-medium text-gray-700">
                                                Center Name *
                                            </Label>
                                            <Input
                                                id="center_name"
                                                name="center_name"
                                                type="text"
                                                value={formData.center_name}
                                                onChange={handleInputChange}
                                                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Enter your center's full name"
                                                required
                                            />
                                            <InputError 
                                                messages={errors.center_name} 
                                                className="mt-2" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                    
                                {/* Description Section */}
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Description</h3>
                                        <p className="text-gray-600">Tell us about your center and the services you provide</p>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                            Center Description (Optional)
                                        </Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            rows="4"
                                            placeholder="Describe your center, services offered, specializations, and any other relevant information..."
                                        />
                                        <InputError 
                                            messages={errors.description} 
                                            className="mt-2" 
                                        />
                                    </div>
                                </div>
                                    
                                    {/* Documents Section */}
                                    <div>
                                                <div className="flex justify-between items-center mb-4">
                                            <Label>Supporting Documents (Required)</Label>
                                            <Button
                                                type="button"
                                                onClick={addDocument}
                                                disabled={documents.length >= 2}
                                                className={`text-sm px-3 py-1 ${documents.length >= 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700'}`}
                                            >
                                                Add Document
                                            </Button>
                                        </div>
                                        
                                        {documents.map((doc, index) => (
                                            <div key={doc.id} className="border p-4 rounded-lg mb-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-medium">Document #{index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        onClick={() => removeDocument(doc.id)}
                                                        className="bg-red-500 hover:bg-red-700 text-sm px-2 py-1"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor={`doc_type_${doc.id}`}>
                                                            Document Type
                                                        </Label>
                                                        <select
                                                            id={`doc_type_${doc.id}`}
                                                            value={doc.type}
                                                            onChange={(e) => updateDocument(doc.id, 'type', e.target.value)}
                                                            className={`block mt-1 w-full rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${submitted && !doc.type ? 'border-red-300' : 'border-gray-300'}`}
                                                        >
                                                            <option value="">Select document type</option>
                                                            <option value="partnership_contract">Partnership Contract</option>
                                                            <option value="bir_document">BIR Document</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor={`doc_file_${doc.id}`}>
                                                            Upload File
                                                        </Label>
                                                        <input
                                                            id={`doc_file_${doc.id}`}
                                                            type="file"
                                                            onChange={(e) => updateDocument(doc.id, 'file', e.target.files[0])}
                                                            className={`block mt-1 w-full text-sm ${submitted && !doc.file ? 'text-red-600' : 'text-gray-500'} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                        />
                                                        {submitted && !doc.file && (
                                                            <p className="text-xs text-red-600 mt-1">Please upload a file.</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Accepted formats: PDF, JPG, PNG (Max: 2MB)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                {/* Submit Section */}
                                <div className="border-t border-gray-200 pt-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                                        <button
                                            type="button"
                                            onClick={() => router.back()}
                                            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        
                                        <button
                                            type="submit"
                                            disabled={isLoading || !docsValid}
                                            className={`w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-all duration-200 ${
                                                isLoading 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : 'hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105'
                                            }`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Registering Center...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Register Center
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {errors.documents && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                                            {errors.documents[0]}
                                        </div>
                                    )}

                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-800 mb-1">What happens next?</h4>
                                                <ul className="text-sm text-blue-700 space-y-1">
                                                    <li>• Your center registration will be reviewed by our team</li>
                                                    <li>• You'll receive an email confirmation within 24 hours</li>
                                                    <li>• Once approved, you can access your center dashboard</li>
                                                    <li>• Start managing financial aid applications immediately after approval</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-center text-xs text-gray-500 mt-4">
                                        * Required fields. By registering, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FacilityRegistration
