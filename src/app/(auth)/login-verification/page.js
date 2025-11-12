'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import { CheckCircleIcon, ShieldCheckIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

const LoginVerification = () => {
    const router = useRouter()
    const { verifyLoginCode, resendLoginVerification, user } = useAuth({ 
        middleware: 'guest', 
        redirectIfAuthenticated: '/dashboard',
        skipInitialUserFetch: true,
    })
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [canResend, setCanResend] = useState(false)
    const [resendCountdown, setResendCountdown] = useState(60)

    useEffect(() => {
        // Get email from session storage
        const storedEmail = sessionStorage.getItem('verification_email')
        if (storedEmail) {
            setEmail(storedEmail)
        } else {
            // If no email stored, redirect back to login
            router.push('/login')
            return
        }

        // Start countdown for resend button
        const timer = setInterval(() => {
            setResendCountdown(prev => {
                if (prev <= 1) {
                    setCanResend(true)
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    // The auth hook's useEffect will handle redirection automatically

    const submitForm = async (event) => {
        event.preventDefault()
        setIsLoading(true)

        try {
            await verifyLoginCode({ 
                email, 
                code, 
                setErrors, 
                setStatus 
            })
            
            // Clear stored email
            sessionStorage.removeItem('verification_email')
            
            // After successful verification, fetch the authenticated user and check requirements
            try {
                const me = await axios.get('/api/user')
                const u = me?.data || null
                
                // Check if email verification is required first
                if (!u?.email_verified_at) {
                    router.replace('/verify-email')
                    return
                }
                
                // Check if password change is required
                const role = u?.system_role?.name?.toLowerCase?.()
                const requiresPasswordChange = u?.must_change_password && 
                    (role === 'caseworker' || role === 'finance' || role === 'director' || role === 'beneficiary')
                
                if (requiresPasswordChange) {
                    router.replace('/change-password')
                    return
                }
                
                // All requirements met, route to dashboard
                let target = '/dashboard'
                if (role === 'admin') {
                    target = '/admin-dashboard'
                } else if (role === 'director') {
                    try {
                        const res = await axios.get('/api/my-facilities')
                        const fid = Array.isArray(res.data) && res.data.length > 0 ? res.data[0]?.id : null
                        target = fid ? `/${fid}/dashboard` : '/facility-registration'
                    } catch {
                        target = '/facility-registration'
                    }
                } else if (role === 'employee' || role === 'finance' || role === 'caseworker') {
                    target = '/staff-dashboard'
                } else if (role === 'beneficiary') {
                    target = '/dashboard'
                }
                router.replace(target)
                return
            } catch (e) {
                // Fallback: if user fetch fails, go to verify email or default dashboard
                router.replace('/verify-email')
                return
            }
        } catch (error) {
            // Errors are handled by the auth hook
        } finally {
            setIsLoading(false)
        }
    }

    const resendCode = async () => {
        if (!canResend) return
        
        setIsLoading(true)

        try {
            await resendLoginVerification({ 
                email, 
                setErrors, 
                setStatus 
            })
            setCanResend(false)
            setResendCountdown(60)
            
            // Start countdown again
            const timer = setInterval(() => {
                setResendCountdown(prev => {
                    if (prev <= 1) {
                        setCanResend(true)
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (error) {
            // Errors are handled by the auth hook
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
            <div className="max-w-md w-full animate-fade-in-up relative z-10">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
                        <ShieldCheckIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
                    <p className="text-gray-600">We've sent a 6-digit verification code to your email address</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform transition-all duration-300 hover:shadow-2xl">
                    {/* Email Display */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                            <span className="text-gray-700 font-medium">{email}</span>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {status && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                                <p className="text-blue-700 text-sm">{status}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Messages */}
                    {(errors.code || errors.email) && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            {errors.code && <p className="text-red-700 text-sm mb-1">{errors.code[0]}</p>}
                            {errors.email && <p className="text-red-700 text-sm">{errors.email[0]}</p>}
                        </div>
                    )}

                    <form onSubmit={submitForm}>
                        {/* Verification Code Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Verification Code</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full text-center text-3xl font-bold tracking-[0.5em] py-4 px-6 border-2 rounded-xl outline-none transition-all duration-300 ${
                                        code.length === 6 
                                            ? 'border-green-500 bg-green-50 focus:ring-4 focus:ring-green-100' 
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                    }`}
                                    placeholder="000000"
                                    maxLength="6"
                                    autoFocus
                                    required
                                />
                                {/* Progress indicator */}
                                <div className="mt-3 bg-gray-200 rounded-full h-1 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                                        style={{ width: `${(code.length / 6) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                {code.length === 0 && "Enter the 6-digit code from your email"}
                                {code.length > 0 && code.length < 6 && `${code.length}/6 digits entered`}
                                {code.length === 6 && (
                                    <span className="text-green-600 font-medium flex items-center justify-center">
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Code complete! Ready to verify.
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={isLoading || code.length !== 6}
                                className={`w-full py-4 px-6 rounded-xl font-semibold focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-[1.02] ${
                                    code.length === 6 && !isLoading
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl animate-pulse-glow'
                                        : 'bg-gray-200 text-gray-400'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheckIcon className="w-5 h-5" />
                                        <span>Verify Code</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={resendCode}
                                disabled={!canResend || isLoading}
                                className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-[1.01] ${
                                    canResend && !isLoading
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:border-gray-300'
                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                                }`}
                            >
                                <PaperAirplaneIcon className={`w-4 h-4 ${canResend && !isLoading ? 'animate-bounce' : ''}`} />
                                <span>
                                    {canResend ? 'Resend Code' : (
                                        <>
                                            Resend in <span className="font-mono">{resendCountdown}s</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => {
                                sessionStorage.removeItem('verification_email')
                                router.push('/login')
                            }}
                            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            <span>Back to Login</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-500 text-sm">
                        Secure registration powered by{' '}
                        <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            AidPoint
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginVerification