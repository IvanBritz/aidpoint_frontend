'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Label from '@/components/Label'
import InputError from '@/components/InputError'

export default function CreateSubscriptionPlan() {
    const router = useRouter()
    
    const [formData, setFormData] = useState({
        plan_name: '',
        price: '',
        duration_in_months: '',
        duration_in_days: '',
        duration_in_seconds: '',
        description: ''
    })
    
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})
        setSuccess('')

        try {
            const response = await axios.post('/api/subscription-plans', formData)
            
            if (response.data.success) {
                setSuccess('Subscription plan created successfully!')
                setFormData({
                    plan_name: '',
                    price: '',
                    duration_in_months: '',
                    duration_in_days: '',
                    duration_in_seconds: '',
                    description: ''
                })
                
                // Redirect to plan list after 2 seconds
                setTimeout(() => {
                    router.push('/plan')
                }, 2000)
            }
        } catch (error) {
            console.error('Error creating subscription plan:', error)
            
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {})
            } else {
                setErrors({ general: ['An error occurred while creating the subscription plan.'] })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }))
        }
    }

    return (
        <>
            <Header title="Create Subscription Plan" />
            
            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Success Message */}
                                {success && (
                                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                        {success}
                                    </div>
                                )}

                                {/* General Error */}
                                {errors.general && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                        {errors.general[0]}
                                    </div>
                                )}

                                {/* Plan Name */}
                                <div>
                                    <Label htmlFor="plan_name">Plan Name *</Label>
                                    <Input
                                        id="plan_name"
                                        name="plan_name"
                                        type="text"
                                        value={formData.plan_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        placeholder="e.g., Basic Plan, Premium Plan"
                                        disabled={loading}
                                        required
                                    />
                                    <InputError messages={errors.plan_name} className="mt-2" />
                                </div>

                                {/* Price */}
                                <div>
                                    <Label htmlFor="price">Price *</Label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₱</span>
                                        </div>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="pl-7 block w-full"
                                            placeholder="0.00"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                    <InputError messages={errors.price} className="mt-2" />
                                </div>

                                {/* Duration - Months */}
                                <div>
                                    <Label htmlFor="duration_in_months">Duration (Months)</Label>
                                    <Input
                                        id="duration_in_months"
                                        name="duration_in_months"
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={formData.duration_in_months}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        placeholder="12"
                                        disabled={loading}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Optional. Use months, days, or seconds (we will compute the end date based on what's provided).</p>
                                    <InputError messages={errors.duration_in_months} className="mt-2" />
                                </div>

                                {/* Duration - Days */}
                                <div>
                                    <Label htmlFor="duration_in_days">Duration (Days)</Label>
                                    <Input
                                        id="duration_in_days"
                                        name="duration_in_days"
                                        type="number"
                                        min="0"
                                        value={formData.duration_in_days}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        placeholder="30"
                                        disabled={loading}
                                    />
                                    <InputError messages={errors.duration_in_days} className="mt-2" />
                                </div>

                                {/* Duration - Seconds */}
                                <div>
                                    <Label htmlFor="duration_in_seconds">Duration (Seconds)</Label>
                                    <Input
                                        id="duration_in_seconds"
                                        name="duration_in_seconds"
                                        type="number"
                                        min="0"
                                        value={formData.duration_in_seconds}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        placeholder="30 (for quick trials)"
                                        disabled={loading}
                                    />
                                    <InputError messages={errors.duration_in_seconds} className="mt-2" />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Describe the features and benefits of this plan..."
                                        disabled={loading}
                                    />
                                    <InputError messages={errors.description} className="mt-2" />
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto"
                                    >
                                        {loading ? 'Creating...' : 'Create Plan'}
                                    </Button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => router.push('/plan')}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
