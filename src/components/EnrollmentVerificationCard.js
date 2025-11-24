import { useEffect, useMemo, useState } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'
import Toast from '@/components/Toast'

const badgeClasses = status => {
    switch ((status || '').toLowerCase()) {
        case 'approved':
            return 'bg-green-100 text-green-800 ring-1 ring-green-200'
        case 'rejected':
            return 'bg-red-100 text-red-800 ring-1 ring-red-200'
        default:
            return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'
    }
}

const getApiUrl = path => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    return `${base}${path.startsWith('/') ? path : '/' + path}`
}

export default function EnrollmentVerificationCard({ user }) {
    const [sub, setSub] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState({ open: false, type: 'success', title: '', message: '' })
    const [errors, setErrors] = useState(null)
    const [form, setForm] = useState({
        enrollment_date: '',
        year_level: '',
        is_scholar: '', // 'scholar' | 'non-scholar' (empty for unselected)
        enrollment_certification: null,
        scholarship_certification: null,
        sao_photo: null,
    })
    const [downloadingDoc, setDownloadingDoc] = useState(null)
    // Controls the "review before submit" modal so beneficiaries must confirm
    // their details and documents before anything is sent to the backend.
    const [showReview, setShowReview] = useState(false)

    const submitted = useMemo(() => !!sub, [sub])

    useEffect(() => {
        const load = async () => {
            if (!user) return
            setLoading(true)
            try {
                const res = await axios.get('/api/beneficiary/my-document-submission')
                setSub(res.data?.data || null)
            } catch {
                setSub(null)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [user?.id])

    const downloadDocument = async (path, documentType) => {
        if (!path) return
        if (downloadingDoc === documentType) return
        setDownloadingDoc(documentType)
        try {
            const response = await axios.get(`/api/documents/${path}`, {
                responseType: 'blob',
                headers: { 'Accept': '*/*' },
                timeout: 30000,
            })
            const contentDisposition = response.headers['content-disposition']
            const contentType = response.headers['content-type'] || ''
            let ext = 'bin'
            if (contentType.includes('jpeg')) ext = 'jpg'
            else if (contentType.includes('png')) ext = 'png'
            else if (contentType.includes('gif')) ext = 'gif'
            else if (contentType.includes('webp')) ext = 'webp'
            let filename = `${documentType}.${ext}`
            if (contentDisposition) {
                const m = contentDisposition.match(/filename=\"?([^\";]+)\"?/)
                if (m) filename = m[1]
            }
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType || 'application/octet-stream' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download failed', err)
            setToast({ open: true, type: 'error', title: 'Download failed', message: 'Could not download the document. Please try again.' })
        } finally {
            setDownloadingDoc(null)
        }
    }

    // Opens a preview of a locally selected file (image or PDF) in a new tab.
    // This only uses the browser File object and does not touch the backend,
    // so the change is deployment-safe.
    const openLocalPreview = file => {
        if (!file) return
        try {
            const url = window.URL.createObjectURL(file)
            window.open(url, '_blank', 'noopener,noreferrer')
            // Best-effort cleanup after the new tab loads.
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
            }, 10000)
        } catch (err) {
            console.error('Preview failed', err)
            setToast({ open: true, type: 'error', title: 'Preview failed', message: 'Could not open a preview of the file.' })
        }
    }

    // Open the review dialog when the form is valid instead of immediately
    // sending the payload to the backend. This ensures beneficiaries always
    // see a summary of what they are about to submit.
    const onSubmit = e => {
        e.preventDefault()
        setErrors(null)

        // Basic guard in case the native `required` attributes are bypassed.
        if (!form.enrollment_date || !form.year_level || !form.is_scholar) {
            setErrors('Please complete all required fields before reviewing your submission.')
            return
        }
        if (form.is_scholar === 'scholar' && !form.scholarship_certification && !sub?.scholarship_certification_path) {
            setErrors('Scholarship certification is required for scholars.')
            return
        }

        setShowReview(true)
    }

    // Handles the actual network request once the beneficiary confirms the
    // details in the review modal.
    const confirmAndSubmit = async () => {
        setErrors(null)
        try {
            setSaving(true)
            const fd = new FormData()
            fd.append('enrollment_date', form.enrollment_date)
            fd.append('year_level', form.year_level)
            // Laravel's boolean validator expects 1/0 (or true/false boolean).
            // FormData serializes to strings, so send 1/0.
            fd.append('is_scholar', form.is_scholar === 'scholar' ? '1' : '0')
            if (form.enrollment_certification) fd.append('enrollment_certification', form.enrollment_certification)
            if (form.scholarship_certification) fd.append('scholarship_certification', form.scholarship_certification)
            if (form.sao_photo) fd.append('sao_photo', form.sao_photo)
            const res = await axios.post('/api/beneficiary/document-submissions', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setSub(res.data?.data)
            setToast({ open: true, type: 'success', title: 'Submitted successfully', message: 'Wait for your caseworker to review.' })
            setShowReview(false)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to submit documents'
            setErrors(msg)
            setToast({ open: true, type: 'error', title: 'Submission failed', message: msg })
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Enrollment Verification</h2>
                        <p className="text-sm text-gray-600">Submit your current enrollment details for validation.</p>
                    </div>
                    {sub && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClasses(sub.status)}`}>
                            {String(sub.status).toUpperCase()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="mt-4"><Loading /></div>
                ) : (
                    <div className="mt-5 space-y-5">
                        {sub && (
                            <div className="rounded-md border border-gray-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">Enrollment Date</div>
                                        <div className="font-medium">{sub.enrollment_date}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Year Level</div>
                                        <div className="font-medium">{sub.year_level}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Scholar Status</div>
                                        <div className="font-medium">{sub.is_scholar ? 'Scholar' : 'Non-scholar'}</div>
                                    </div>
                                    {sub.enrollment_certification_path && (
                                        <div>
                                            <div className="text-gray-600">Enrollment Certification</div>
                                            <button 
                                                type="button"
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                onClick={() => downloadDocument(sub.enrollment_certification_path, 'Enrollment_Certification')}
                                                disabled={downloadingDoc === 'Enrollment_Certification'}
                                            >
{downloadingDoc === 'Enrollment_Certification' ? 'Downloading…' : 'Download'}
                                            </button>
                                        </div>
                                    )}
                                    {sub.scholarship_certification_path && (
                                        <div>
                                            <div className="text-gray-600">Scholarship Certification</div>
                                            <button 
                                                type="button"
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                onClick={() => downloadDocument(sub.scholarship_certification_path, 'Scholarship_Certification')}
                                                disabled={downloadingDoc === 'Scholarship_Certification'}
                                            >
{downloadingDoc === 'Scholarship_Certification' ? 'Downloading…' : 'Download'}
                                            </button>
                                        </div>
                                    )}
                                    {sub.sao_photo_path && (
                                        <div>
                                            <div className="text-gray-600">SOA</div>
                                            <button 
                                                type="button"
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                                                onClick={() => downloadDocument(sub.sao_photo_path, 'SOA')}
                                                disabled={downloadingDoc === 'SOA'}
                                            >
{downloadingDoc === 'SOA' ? 'Downloading…' : 'Download'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {(sub.review_notes || sub.reviewed_at) && (
                                    <div className="mt-3 text-xs text-gray-600">
                                        {sub.review_notes && <div>Notes: {sub.review_notes}</div>}
                                        {sub.reviewed_at && <div>Reviewed: {new Date(sub.reviewed_at).toLocaleString()}</div>}
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.enrollment_date}
                                        onChange={e => setForm(f => ({ ...f, enrollment_date: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Year Level</label>
                                    <select
                                        required
                                        value={form.year_level}
                                        onChange={e => setForm(f => ({ ...f, year_level: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select year level</option>
                                        <option>1st Year</option>
                                        <option>2nd Year</option>
                                        <option>3rd Year</option>
                                        <option>4th Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Scholar Status</label>
                                    <select
                                        required
                                        value={form.is_scholar}
                                        onChange={e => setForm(f => ({ ...f, is_scholar: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select scholar status</option>
                                        <option value="non-scholar">Non-scholar</option>
                                        <option value="scholar">Scholar</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Certification</label>
                                    <label
                                        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${form.enrollment_certification ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-300'}`}
                                    >
                                        <div>
                                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                            {form.enrollment_certification && (
                                                <div className="mt-1 text-xs text-gray-500 truncate">File selected</div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,application/pdf"
                                            className="hidden"
                                            onChange={e => setForm(f => ({ ...f, enrollment_certification: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">Scholarship Certification {form.is_scholar === 'scholar' && <span className="text-red-600">(required)</span>}</label>
                                    <label
                                        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${
                                            form.is_scholar !== 'scholar'
                                                ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                                : form.scholarship_certification
                                                    ? 'border-green-400 bg-green-50'
                                                    : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                    >
                                        <div>
                                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                            {form.scholarship_certification && (
                                                <div className="mt-1 text-xs text-gray-500 truncate">File selected</div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,application/pdf"
                                            className="hidden"
                                            required={form.is_scholar === 'scholar' && !(sub?.scholarship_certification_path)}
                                            disabled={form.is_scholar !== 'scholar'}
                                            onChange={e => setForm(f => ({ ...f, scholarship_certification: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SOA</label>
                                    <label
                                        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${form.sao_photo ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-300'}`}
                                    >
                                        <div>
                                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                            {form.sao_photo && (
                                                <div className="mt-1 text-xs text-gray-500 truncate">File selected</div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,application/pdf"
                                            className="hidden"
                                            onChange={e => setForm(f => ({ ...f, sao_photo: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>
                            </div>

                            {errors && <p className="text-sm text-red-600">{errors}</p>}

                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Submitting…' : (submitted ? 'Update Submission' : 'Submit Documents')}
                                </button>
                                {submitted && sub?.status === 'approved' && (
                                    <span className="text-sm text-green-700">Approved — no further action needed.</span>
                                )}
                            </div>
                        </form>

                    </div>
                )}
            </div>
        </div>
        {/* Beneficiary review modal – opened before submitting to backend */}
        {showReview && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-gray-900/40"
                    onClick={() => !saving && setShowReview(false)}
                />
                <div className="relative bg-white w-full max-w-xl rounded-lg shadow-xl">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Review your enrollment submission</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Please carefully review your details and documents below. If everything
                            looks correct, click <span className="font-semibold">Confirm &amp; Submit</span> to
                            send them to your caseworker.
                        </p>
                    </div>
                    <div className="p-6 space-y-4 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-gray-600">Enrollment Date</div>
                                <div className="font-medium">{form.enrollment_date || 'Not set'}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Year Level</div>
                                <div className="font-medium">{form.year_level || 'Not set'}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Scholar Status</div>
                                <div className="font-medium">
                                    {form.is_scholar === 'scholar' ? 'Scholar' : (form.is_scholar === 'non-scholar' ? 'Non-scholar' : 'Not set')}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Enrollment Certification</div>
                                <div className="font-medium">
                                    {form.enrollment_certification ? 'File selected' : 'No file selected'}
                                </div>
                                {form.enrollment_certification && (
                                    <button
                                        type="button"
                                        onClick={() => openLocalPreview(form.enrollment_certification)}
                                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        View file (opens in new tab)
                                    </button>
                                )}
                            </div>
                            <div>
                                <div className="text-gray-600">Scholarship Certification</div>
                                <div className="font-medium">
                                    {form.scholarship_certification
                                        ? 'File selected'
                                        : (sub?.scholarship_certification_path ? 'Existing file on record' : 'No file provided')}
                                </div>
                                {form.scholarship_certification && (
                                    <button
                                        type="button"
                                        onClick={() => openLocalPreview(form.scholarship_certification)}
                                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        View file (opens in new tab)
                                    </button>
                                )}
                            </div>
                            <div>
                                <div className="text-gray-600">SOA</div>
                                <div className="font-medium break-words">
                                    {form.sao_photo ? 'File selected' : 'No file selected'}
                                </div>
                                {form.sao_photo && (
                                    <button
                                        type="button"
                                        onClick={() => openLocalPreview(form.sao_photo)}
                                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        View file (opens in new tab)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => !saving && setShowReview(false)}
                            disabled={saving}
                            className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Go Back and Edit
                        </button>
                        <button
                            type="button"
                            onClick={confirmAndSubmit}
                            disabled={saving}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Submitting…' : 'Confirm & Submit'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <Toast
            open={toast.open}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(t => ({ ...t, open: false }))}
        />
        </>
    )
}
