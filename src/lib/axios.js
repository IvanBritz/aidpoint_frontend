import Axios from 'axios'

const axios = Axios.create({
    // Fall back to local Laravel dev server if env is not set
    // Use a single host (localhost) for both SPA and API to ensure CSRF cookie is readable
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    // Be explicit with Laravel Sanctum cookie/header names
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    withXSRFToken: true
})

export default axios
