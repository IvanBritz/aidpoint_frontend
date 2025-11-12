"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/auth'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
const { user, mutate } = useAuth({ middleware: 'auth' })
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)

    const onSubmit = async e => {
        e.preventDefault()
        setErrors({})
        setStatus('')
        setLoading(true)
        try {
            // Ensure CSRF cookie is present for Sanctum
            try { await axios.get('/sanctum/csrf-cookie') } catch (_) {}
            await axios.put('/api/user/password', {
                password,
                password_confirmation: passwordConfirmation,
            })
            setStatus('Password updated successfully.')
            // Revalidate the user so must_change_password is cleared before redirect
            try { await mutate() } catch (_) {}
            const roleName = user?.system_role?.name?.toLowerCase?.()
            if (roleName === 'director') {
                router.push('/facility-registration')
            } else if (roleName === 'caseworker' || roleName === 'finance') {
                router.push('/staff-dashboard')
            } else {
                router.push('/dashboard')
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {})
            } else {
                setErrors({ general: ['Failed to update password.'] })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Header title="Change Password" />
            <div className="py-12">
                <div className="max-w-md mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {user?.must_change_password && (
                                <div className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
                                    For security reasons, please change your password before continuing.
                                </div>
                            )}

                            {status && (
                                <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                                    {status}
                                </div>
                            )}

                            {errors.general && (
                                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                    {errors.general[0]}
                                </div>
                            )}

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError messages={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={e => setPasswordConfirmation(e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError messages={errors.password_confirmation} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save New Password'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
