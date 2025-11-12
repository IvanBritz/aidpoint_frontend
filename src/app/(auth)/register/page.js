'use client'

import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useState } from 'react'
import InfoModal from '@/components/InfoModal'

const Page = () => {
    const { register } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })

    const [firstname, setFirstname] = useState('')
    const [middlename, setMiddlename] = useState('')
    const [lastname, setLastname] = useState('')
    const [contactNumber, setContactNumber] = useState('')
    const [address, setAddress] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [errors, setErrors] = useState([])
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [showPrivacy, setShowPrivacy] = useState(false)

    const submitForm = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        
        try {
            await register({
                firstname,
                middlename,
                lastname,
                contact_number: contactNumber,
                address,
                email,
                password,
                password_confirmation: passwordConfirmation,
                systemrole_id: 2, // Director role ID
                setErrors,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
                <p className="text-gray-600">Join AidPoint to streamline your financial aid management</p>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
                <div className="w-12 h-1 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium">2</div>
                <div className="w-12 h-1 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium">3</div>
            </div>
            
            <form onSubmit={submitForm} className="space-y-5">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Information
                    </h3>
                    
                    {/* Name Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstname" className="text-sm font-medium text-gray-700">First Name *</Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="firstname"
                                    type="text"
                                    value={firstname}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setFirstname(event.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <InputError messages={errors.firstname} className="mt-1" />
                        </div>
                        
                        <div>
                            <Label htmlFor="lastname" className="text-sm font-medium text-gray-700">Last Name *</Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="lastname"
                                    type="text"
                                    value={lastname}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setLastname(event.target.value)}
                                    required
                                    placeholder="Enter your last name"
                                />
                            </div>
                            <InputError messages={errors.lastname} className="mt-1" />
                        </div>
                    </div>
                    
                    {/* Middle Name */}
                    <div>
                        <Label htmlFor="middlename" className="text-sm font-medium text-gray-700">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></Label>
                        <div className="mt-1 relative">
                            <Input
                                id="middlename"
                                type="text"
                                value={middlename}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                onChange={event => setMiddlename(event.target.value)}
                                placeholder="Enter your middle name (optional)"
                            />
                        </div>
                        <InputError messages={errors.middlename} className="mt-1" />
                    </div>
                </div>
                
                {/* Contact Information Section */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setEmail(event.target.value)}
                                    required
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <InputError messages={errors.email} className="mt-1" />
                        </div>
                        
                        <div>
                            <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">Contact Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <Input
                                    id="contactNumber"
                                    type="tel"
                                    value={contactNumber}
                                    className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setContactNumber(event.target.value)}
                                    placeholder="Enter your contact number"
                                />
                            </div>
                            <InputError messages={errors.contact_number} className="mt-1" />
                        </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address <span className="text-gray-400 font-normal">(Optional)</span></Label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <Input
                                id="address"
                                type="text"
                                value={address}
                                className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                onChange={event => setAddress(event.target.value)}
                                placeholder="Enter your address"
                            />
                        </div>
                        <InputError messages={errors.address} className="mt-1" />
                    </div>
                </div>
                
                {/* Security Section */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Account Security
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password *</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    className="block w-full pl-10 pr-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setPassword(event.target.value)}
                                    required
                                    autoComplete="new-password"
                                    placeholder="Create a secure password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError messages={errors.password} className="mt-1" />
                            {password && (
                                <div className="mt-2">
                                    <div className="text-xs text-gray-500 mb-1">Password strength:</div>
                                    <div className="flex space-x-1">
                                        <div className={`h-1 w-full rounded ${password.length >= 8 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                                        <div className={`h-1 w-full rounded ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                                        <div className={`h-1 w-full rounded ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                                        <div className={`h-1 w-full rounded ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Use 8+ characters with uppercase, numbers & symbols
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">Confirm Password *</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <Input
                                    id="passwordConfirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    className="block w-full pl-10 pr-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                    onChange={event => setPasswordConfirmation(event.target.value)}
                                    required
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError messages={errors.password_confirmation} className="mt-1" />
                            {passwordConfirmation && password !== passwordConfirmation && (
                                <div className="text-sm text-red-500 mt-1 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Passwords don't match
                                </div>
                            )}
                            {passwordConfirmation && password === passwordConfirmation && passwordConfirmation.length > 0 && (
                                <div className="text-sm text-green-600 mt-1 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Passwords match
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Terms and Submit */}
                <div className="space-y-6">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="text-gray-600">
                                I agree to the{' '}
<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true) }} className="text-blue-600 hover:text-blue-500 font-medium underline-offset-2 hover:underline">
                                    Terms of Service
                                </button>{' '}
                                and{' '}
<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPrivacy(true) }} className="text-blue-600 hover:text-blue-500 font-medium underline-offset-2 hover:underline">
                                    Privacy Policy
                                </button>
                            </label>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <Button 
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                                isSubmitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating your account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </Button>
                        
                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                                    Sign in here
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </form>

            {/* Terms of Service Modal */}
            <InfoModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
                <div className="space-y-4 text-gray-700">
                    <p>By creating an account and using AidPoint, you agree to the terms below.</p>
                    <h4 className="font-semibold text-gray-900">1. Use of Service</h4>
                    <p>AidPoint provides tools to manage financial aid–related workflows. You must use the Service in compliance with applicable laws and these Terms.</p>
                    <h4 className="font-semibold text-gray-900">2. Accounts</h4>
                    <p>You are responsible for the accuracy of your information and for safeguarding your password. Notify us of any unauthorized use of your account.</p>
                    <h4 className="font-semibold text-gray-900">3. Payments and Subscriptions</h4>
                    <p>Where paid features are offered, fees are disclosed prior to purchase. Except where required by law, fees are non‑refundable once service is delivered. The system does not refund subscription payments. The system does not allow subscription cancellation.</p>
                    <h4 className="font-semibold text-gray-900">4. Prohibited Use</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>No unlawful, infringing, or misleading activity.</li>
                        <li>No attempts to disrupt, reverse‑engineer, or gain unauthorized access.</li>
                        <li>No sharing of credentials or misuse of others’ data.</li>
                    </ul>
                    <h4 className="font-semibold text-gray-900">5. Limitation of Liability</h4>
                    <p>The Service is provided “as is.” To the fullest extent permitted by law, AidPoint is not liable for indirect, incidental, or consequential damages.</p>
                    <h4 className="font-semibold text-gray-900">6. Changes</h4>
                    <p>We may update these Terms from time to time. Continued use of the Service constitutes acceptance of the updated Terms.</p>
                    <p className="text-sm text-gray-500">Contact: support@aidpoint.example</p>
                </div>
            </InfoModal>

            {/* Privacy Policy Modal */}
            <InfoModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
                <div className="space-y-4 text-gray-700">
                    <p>This policy explains what data we collect and how we use it.</p>
                    <h4 className="font-semibold text-gray-900">1. Information We Collect</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Account data (name, email, contact details, address).</li>
                        <li>Usage data (device, log, and analytics information).</li>
                        <li>Payment-related metadata when applicable.</li>
                    </ul>
                    <h4 className="font-semibold text-gray-900">2. How We Use Information</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>To provide and improve the Service and security.</li>
                        <li>To communicate about your account and service updates.</li>
                        <li>To comply with legal and contractual obligations.</li>
                    </ul>
                    <h4 className="font-semibold text-gray-900">3. Sharing</h4>
                    <p>We do not sell personal data. We may share with service providers under contractual safeguards or when required by law.</p>
                    <h4 className="font-semibold text-gray-900">4. Data Retention and Security</h4>
                    <p>Data is retained only as long as necessary for the purposes above and protected with reasonable technical and organizational measures.</p>
                    <h4 className="font-semibold text-gray-900">5. Your Rights</h4>
                    <p>You may request access, correction, or deletion of your personal information, subject to legal limitations.</p>
                    <p className="text-sm text-gray-500">Contact: aidpoint4@gmail.com</p>
                </div>
            </InfoModal>
        </div>
    )
}

export default Page
