import useSWR from 'swr'
import axios from '@/lib/axios'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export const useAuth = ({ middleware, redirectIfAuthenticated, skipInitialUserFetch = false } = {}) => {
    const router = useRouter()
    const params = useParams()

    const swrKey = skipInitialUserFetch ? null : '/api/user'
    const { data: user, error, mutate } = useSWR(
        swrKey,
        () =>
            axios
                .get('/api/user')
                .then(res => res.data)
                .catch(error => {
                    const status = error?.response?.status
                    // 401 is expected on guest pages (e.g. login, login-verification). Do not throw.
                    if (status === 401) return null
                    throw error
                }),
        {
            // Avoid noisy retries on unauthenticated (guest) pages
            shouldRetryOnError: false,
        }
    )

    const roleName = user?.system_role?.name?.toLowerCase?.()
    const isStaff = roleName === 'caseworker' || roleName === 'finance'
    const isDirector = roleName === 'director'
    const isBeneficiary = roleName === 'beneficiary'

    const csrf = () => axios.get('/sanctum/csrf-cookie')

    const register = async ({ setErrors, ...props }) => {
        await csrf()

        setErrors([])

        axios
            .post('/register', props)
            .then(async (response) => {
                if (response?.status === 202 && response?.data?.requires_verification) {
                    sessionStorage.setItem('verification_email', response.data.email)
                    router.push('/login-verification')
                    return
                }
                mutate()
            })
            .catch(error => {
                if (error?.response?.status === 202 && error?.response?.data?.requires_verification) {
                    sessionStorage.setItem('verification_email', error.response.data.email)
                    router.push('/login-verification')
                    return
                }
                if (error?.response?.status !== 422) throw error

                setErrors(error?.response?.data?.errors || { general: ['Unable to register. Please try again.'] })
            })
    }

    const login = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/login', props)
            .then(async (response) => {
                // Check if login verification is required
                if (response.status === 202 && response.data.requires_verification) {
                    // Store the email for verification page and redirect
                    sessionStorage.setItem('verification_email', response.data.email)
                    router.push('/login-verification')
                    return
                }
                // Normal login, fetch user and redirect based on role
                try {
                    const userResponse = await axios.get('/api/user')
                    const loggedInUser = userResponse.data
                    const userRole = loggedInUser?.system_role?.name?.toLowerCase?.()
                    
                    // Check if password change is required
                    const isStaffRole = userRole === 'caseworker' || userRole === 'finance'
                    const requiresPasswordChange = loggedInUser.must_change_password && 
                        (isStaffRole || userRole === 'director' || userRole === 'beneficiary')
                    
                    if (requiresPasswordChange) {
                        router.push('/change-password')
                        return
                    }
                    
                    // Role-based routing
                    if (userRole === 'admin') {
                        router.push('/admin-dashboard')
                    } else if (userRole === 'director') {
                        try {
                            const facilitiesRes = await axios.get('/api/my-facilities')
                            const facilityId = Array.isArray(facilitiesRes.data) && facilitiesRes.data.length > 0 
                                ? facilitiesRes.data[0]?.id 
                                : null
                            router.push(facilityId ? `/${facilityId}/dashboard` : '/facility-registration')
                        } catch {
                            router.push('/facility-registration')
                        }
                    } else if (isStaffRole || userRole === 'employee') {
                        router.push('/staff-dashboard')
                    } else {
                        router.push('/dashboard')
                    }
                    
                    // Update the SWR cache
                    mutate()
                } catch (error) {
                    // If fetching user fails, try mutate and let useEffect handle it
                    mutate()
                }
            })
            .catch(error => {
                if (error?.response?.status === 422) {
                    setErrors(error?.response?.data?.errors || { email: ['Invalid credentials'] })
                    return
                }
                
                // Handle 202 response in error catch (some axios versions treat 202 as error)
                if (error?.response?.status === 202 && error?.response?.data?.requires_verification) {
                    sessionStorage.setItem('verification_email', error.response.data.email)
                    router.push('/login-verification')
                    return
                }
                
                throw error
            })
    }

    const forgotPassword = async ({ setErrors, setStatus, email }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/forgot-password', { email })
            .then(response => setStatus(response.data.status))
            .catch(error => {
                if (error?.response?.status !== 422) throw error
                setErrors(error?.response?.data?.errors || { email: ["We couldn't process your request."] })
            })
    }

    const resetPassword = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/reset-password', { token: params.token, ...props })
            .then(response =>
                router.push('/login?reset=' + btoa(response.data.status)),
            )
            .catch(error => {
                if (error?.response?.status !== 422) throw error
                setErrors(error?.response?.data?.errors || { password: ['Unable to reset password.'] })
            })
    }

    const logout = async () => {
        if (!error) {
            await axios.post('/logout').then(() => mutate())
        }

        window.location.pathname = '/login'
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            const roleName = user?.system_role?.name?.toLowerCase?.()
            const isStaff = roleName === 'caseworker' || roleName === 'finance'
            const isDirector = roleName === 'director'

            // Enforce new password on first login for staff/beneficiaries/directors
            if (user.must_change_password && (isStaff || isDirector || roleName === 'beneficiary')) {
                router.push('/change-password')
                return
            }

            // Role-based dashboard redirection (used after login and login-verification)
            const routeByRole = async () => {
                // Admin portal
                if (roleName === 'admin') {
                    router.push('/admin-dashboard')
                    return
                }
                // Directors: go to facility dashboard or registration
                if (roleName === 'director') {
                    try {
                        const res = await axios.get('/api/my-facilities')
                        const fid = Array.isArray(res.data) && res.data.length > 0 ? res.data[0]?.id : null
                        router.push(fid ? `/${fid}/dashboard` : '/facility-registration')
                    } catch {
                        router.push('/facility-registration')
                    }
                    return
                }
                // Finance/Employee/Caseworker
                if (isStaff || roleName === 'employee') {
                    router.push('/staff-dashboard')
                    return
                }
                // Beneficiaries and others
                router.push('/dashboard')
            }
            routeByRole()
            return
        }

        // Force staff, directors, and beneficiaries to change password on first login
        if (middleware === 'auth' && user?.must_change_password && (isStaff || isDirector || isBeneficiary)) {
            if (window.location.pathname !== '/change-password') {
                router.push('/change-password')
                return
            }
        }
        
        if (middleware === 'auth' && error) logout()
    }, [user, error])

    const verifyLoginCode = async ({ setErrors, setStatus, email, code }) => {
        await csrf()
        setErrors([])
        setStatus(null)
        return axios
            .post('/login-verification', { email, code })
            .then(() => mutate())
            .catch(error => {
                if (error?.response?.status !== 422) throw error
                setErrors(error?.response?.data?.errors || { code: ['Invalid code'] })
                throw error
            })
    }

    const resendLoginVerification = async ({ setErrors, setStatus, email }) => {
        await csrf()
        setErrors([])
        setStatus(null)
        return axios
            .post('/login-verification/resend', { email })
            .then(response => setStatus(response.data.message))
            .catch(error => {
                if (error?.response?.status !== 422) throw error
                setErrors(error?.response?.data?.errors || { email: ['Unable to resend code'] })
                throw error
            })
    }

    return {
        user,
        register,
        login,
        forgotPassword,
        resetPassword,
        verifyLoginCode,
        resendLoginVerification,
        logout,
        mutate,
    }
}
