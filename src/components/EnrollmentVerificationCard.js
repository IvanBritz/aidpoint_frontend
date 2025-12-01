import { useEffect, useMemo, useState, useRef } from 'react'
import axios from '@/lib/axios'
import Loading from '@/components/Loading'
import Toast from '@/components/Toast'

// Image Preview Component for small preview cards
const ImagePreview = ({ file, url, fileName }) => {
    const [imageError, setImageError] = useState(false)
    const [imageUrl, setImageUrl] = useState(null)
    
    useEffect(() => {
        if (!file) {
            setImageUrl(null)
            setImageError(false)
            return
        }
        
        // Always create a fresh blob URL from the file
        try {
            const blobUrl = window.URL.createObjectURL(file)
            setImageUrl(blobUrl)
            setImageError(false)
            
            return () => {
                // Cleanup on unmount
                window.URL.revokeObjectURL(blobUrl)
            }
        } catch (err) {
            console.error('Failed to create image preview URL', err)
            // Fallback to provided URL if blob creation fails
            if (url) {
                setImageUrl(url)
            } else {
                setImageError(true)
            }
        }
    }, [file, url])
    
    if (!file) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">Image Preview</p>
                </div>
            </div>
        )
    }
    
    if (imageError && !imageUrl) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">Image Preview</p>
                    <p className="text-xs mt-1 text-gray-500 truncate px-2">{fileName}</p>
                </div>
            </div>
        )
    }
    
    if (!imageUrl) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <p className="text-xs">Loading...</p>
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full h-48 bg-white flex items-center justify-center overflow-hidden border border-gray-200 rounded">
            <img
                key={imageUrl}
                src={imageUrl}
                alt={`Preview - ${fileName || 'Image'}`}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '192px' }}
                onError={() => {
                    setImageError(true)
                }}
                onLoad={() => {
                    setImageError(false)
                }}
            />
        </div>
    )
}

// PDF Preview Component for small preview cards
const PDFPreview = ({ file, url, fileName }) => {
    const [pdfError, setPdfError] = useState(false)
    const [pdfUrl, setPdfUrl] = useState(null)
    const iframeRef = useRef(null)
    
    useEffect(() => {
        if (!file) {
            setPdfUrl(null)
            setPdfError(false)
            return
        }
        
        // Always create a fresh blob URL from the file
        try {
            const blobUrl = window.URL.createObjectURL(file)
            setPdfUrl(blobUrl)
            setPdfError(false)
            
            return () => {
                // Cleanup on unmount
                window.URL.revokeObjectURL(blobUrl)
            }
        } catch (err) {
            console.error('Failed to create PDF preview URL', err)
            // Fallback to provided URL if blob creation fails
            if (url) {
                setPdfUrl(url)
            } else {
                setPdfError(true)
            }
        }
    }, [file, url])
    
    useEffect(() => {
        if (pdfUrl && iframeRef.current) {
            // Force reload the iframe when URL changes
            iframeRef.current.src = pdfUrl
        }
    }, [pdfUrl])
    
    if (!file) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs">PDF Preview</p>
                </div>
            </div>
        )
    }
    
    if (pdfError && !pdfUrl) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs">PDF Preview</p>
                    <p className="text-xs mt-1 text-gray-500 truncate px-2">{fileName}</p>
                </div>
            </div>
        )
    }
    
    if (!pdfUrl) {
        return (
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center text-gray-400">
                    <p className="text-xs">Loading...</p>
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full h-48 bg-white overflow-hidden relative border border-gray-200 rounded">
            <iframe
                ref={iframeRef}
                key={pdfUrl}
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`PDF Preview - ${fileName || 'PDF'}`}
                style={{ minHeight: '192px' }}
                onError={() => {
                    setPdfError(true)
                }}
            />
        </div>
    )
}

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
    // Controls the file preview modal
    const [previewFile, setPreviewFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewKey, setPreviewKey] = useState(0) // Key to force re-render
    const [loadingDocument, setLoadingDocument] = useState(null) // Track which document is loading
    const previewBlobUrlRef = useRef(null) // Store blob URL for server documents
    const documentBlobCache = useRef({}) // Cache blob URLs by document path to avoid re-fetching
    // Store preview URLs for each file to avoid recreating them
    const [filePreviewUrls, setFilePreviewUrls] = useState({})
    // Store file input refs for "Choose another file" functionality
    const fileInputRefs = useRef({
        enrollment_certification: null,
        scholarship_certification: null,
        sao_photo: null,
    })
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    const handleFilePick = (key, file) => {
        if (!file) {
            // Cleanup preview URL for this key
            if (filePreviewUrls[key]) {
                window.URL.revokeObjectURL(filePreviewUrls[key])
                setFilePreviewUrls(prev => {
                    const newUrls = { ...prev }
                    delete newUrls[key]
                    return newUrls
                })
            }
            setForm(f => ({ ...f, [key]: null }))
            return
        }
        if (file.size <= 0) { setErrors('Selected file is empty.'); return }
        if (file.size > MAX_FILE_SIZE) { setErrors('File size must not exceed 10MB.'); return }
        setErrors(null)
        
        // Cleanup old preview URL for this key
        if (filePreviewUrls[key]) {
            window.URL.revokeObjectURL(filePreviewUrls[key])
        }
        
        // Create new preview URL
        const url = window.URL.createObjectURL(file)
        setFilePreviewUrls(prev => ({ ...prev, [key]: url }))
        setForm(f => ({ ...f, [key]: file }))
    }

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
                const m = contentDisposition.match(/filename="?([^";]+)"?/)
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

    // Helper function to check if file is an image
    const isImageFile = (file) => {
        if (!file) return false
        // Check MIME type first
        if (file.type) {
            if (file.type.startsWith('image/')) return true
            // Explicit checks for common image types
            if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type.toLowerCase())) return true
        }
        // Fallback to file extension
        return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name || '')
    }

    // Helper function to check if file is a PDF
    const isPdfFile = (file) => {
        if (!file) return false
        // Check MIME type first
        if (file.type) {
            if (file.type.toLowerCase() === 'application/pdf') return true
        }
        // Fallback to file extension
        return /\.pdf$/i.test(file.name || '')
    }

    // Helper function to check if path is an image (for server documents)
    // Production-safe: Only supports JPG, JPEG, and PNG as specified
    const isImagePath = (path) => {
        if (!path) return false
        const extension = path.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png'].includes(extension)
    }

    // Helper function to check if path is a PDF (for server documents)
    const isPdfPath = (path) => {
        if (!path) return false
        const extension = path.split('.').pop()?.toLowerCase()
        return extension === 'pdf'
    }
    
    // Production-safe validation: Only allow supported file types
    const isSupportedFileType = (contentType, extension) => {
        const supportedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'application/pdf'
        ]
        const supportedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
        
        const isValidType = supportedTypes.includes(contentType?.toLowerCase())
        const isValidExtension = supportedExtensions.includes(extension?.toLowerCase())
        
        return isValidType || isValidExtension
    }

    // Open document from server in preview modal
    const openServerDocument = async (path, documentType) => {
        if (!path) return
        if (loadingDocument === documentType) return
        
        // Always reset modal state first to ensure clean state
        setPreviewFile(null)
        setPreviewUrl(null)
        setPreviewKey(prev => prev + 1)
        setLoadingDocument(documentType)
        
        // Check if we already have a cached blob URL for this document
        // We'll try to use it, but if it fails to load, we'll fetch a fresh one
        if (documentBlobCache.current[path]) {
            const cached = documentBlobCache.current[path]
            const fileName = path.split('/').pop() || documentType
            
            // Verify the cached blob URL exists and looks valid
            if (cached.blobUrl && cached.blobUrl.startsWith('blob:')) {
                // Ensure we have a valid content type for the cached file
                const fileExtension = fileName.split('.').pop()?.toLowerCase() || path.split('.').pop()?.toLowerCase() || ''
                const mimeTypes = {
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'pdf': 'application/pdf'
                }
                const finalCachedType = cached.contentType || mimeTypes[fileExtension] || 'application/octet-stream'
                
                // Increment preview key to force fresh render
                setPreviewKey(prev => prev + 1)
                
                // Set the file and URL from cache
                // If the blob URL is invalid/revoked, the onError handler will detect it
                // and automatically fetch a fresh copy
                setPreviewFile({
                    name: fileName,
                    type: finalCachedType
                })
                setPreviewUrl(cached.blobUrl)
                setLoadingDocument(null)
                
                // Use cached version - if it fails, error handler will re-fetch
                return
            } else {
                // If cached URL is invalid, clear cache and fetch fresh
                delete documentBlobCache.current[path]
            }
        }
        
        // Determine file type from path
        const isImage = isImagePath(path)
        const isPdf = isPdfPath(path)
        
        // Production-safe validation: Check file type before proceeding
        if (!isImage && !isPdf) {
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Preview not supported', 
                message: 'Preview is only available for PDF, PNG, JPEG, and JPG files. Unsupported file types cannot be rendered for security reasons.' 
            })
            setLoadingDocument(null)
            return
        }
        
        // Additional validation using extension
        const extension = path.split('.').pop()?.toLowerCase()
        if (!isSupportedFileType(null, extension)) {
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Unsupported file type', 
                message: `File type "${extension}" is not supported. Only PDF, PNG, JPEG, and JPG files can be previewed.` 
            })
            setLoadingDocument(null)
            return
        }
        
        // Extract filename from path - preserve original filename
        // Path format might be: "documents/folder/filename.png" or just "filename.png"
        let fileName = path.split('/').pop() || documentType
        
        // If filename doesn't have extension, try to get it from path
        if (!fileName.includes('.')) {
            const pathParts = path.split('/')
            for (let i = pathParts.length - 1; i >= 0; i--) {
                if (pathParts[i].includes('.')) {
                    fileName = pathParts[i]
                    break
                }
            }
        }
        
        // Determine initial content type from extension for the temp file
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || path.split('.').pop()?.toLowerCase() || ''
        const initialMimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'pdf': 'application/pdf'
        }
        const initialContentType = initialMimeTypes[fileExtension] || (isImage ? 'image/jpeg' : 'application/pdf')
        
        // Create a temporary file-like object for the modal with correct type
        const tempFile = {
            name: fileName,
            type: initialContentType
        }
        
        setPreviewFile(tempFile)
        setPreviewUrl(null) // Will be set after fetch
        
        try {
            const response = await axios.get(`/api/documents/${path}`, {
                responseType: 'blob',
                headers: { 
                    'Accept': '*/*',
                },
                timeout: 30000,
            })
            
            // Get content type from response headers first, then fallback to file extension
            const headerContentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
            const extension = path.split('.').pop()?.toLowerCase() || ''
            
            // Map file extensions to MIME types
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'pdf': 'application/pdf'
            }
            
            // Determine content type - prefer header, then extension, then default
            let contentType = headerContentType
            if (!contentType || contentType === 'application/octet-stream') {
                contentType = mimeTypes[extension] || (isImage ? 'image/jpeg' : 'application/pdf')
            }
            
            // Ensure content type is valid for our supported types
            if (!contentType.startsWith('image/') && contentType !== 'application/pdf') {
                contentType = mimeTypes[extension] || (isImage ? 'image/jpeg' : 'application/pdf')
            }
            
            // Get the blob from response
            let blob = response.data
            
            // Verify we have valid blob data
            if (!blob) {
                throw new Error('No data received from server')
            }
            
            // Ensure blob is a proper Blob instance
            if (!(blob instanceof Blob)) {
                blob = new Blob([blob], { type: contentType })
            }
            
            // Verify blob was created successfully
            if (!blob || blob.size === 0) {
                throw new Error('Invalid blob data received - blob is empty or corrupted')
            }
            
            // Only recreate blob with correct MIME type if the current type is wrong
            // This is critical for proper image rendering in the browser
            const needsTypeFix = blob.type === 'application/octet-stream' || 
                                 blob.type === '' || 
                                 (isImage && !blob.type.startsWith('image/')) ||
                                 (isPdf && blob.type !== 'application/pdf')
            
            if (needsTypeFix) {
                // Recreate blob with correct MIME type using ArrayBuffer
                // This preserves the actual file data while fixing the MIME type
                const arrayBuffer = await blob.arrayBuffer()
                blob = new Blob([arrayBuffer], { type: contentType })
            }
            
            // Cleanup previous preview blob URL if different
            if (previewBlobUrlRef.current && previewBlobUrlRef.current !== documentBlobCache.current[path]?.blobUrl) {
                const isCached = Object.values(documentBlobCache.current).some(cached => cached.blobUrl === previewBlobUrlRef.current)
                if (!isCached) {
                    try {
                        window.URL.revokeObjectURL(previewBlobUrlRef.current)
                    } catch (e) {
                        // Ignore errors when revoking URLs
                    }
                }
            }
            
            // Create blob URL
            const blobUrl = window.URL.createObjectURL(blob)
            if (!blobUrl || !blobUrl.startsWith('blob:')) {
                throw new Error('Failed to create blob URL')
            }
            
            // Update ref and cache (store path for error recovery)
            previewBlobUrlRef.current = blobUrl
            documentBlobCache.current[path] = {
                blobUrl: blobUrl,
                contentType: contentType,
                path: path // Store path for error recovery
            }
            
            // Create file object with correct type
            const finalType = blob.type || contentType
            const updatedFile = {
                name: fileName,
                type: finalType
            }
            
            // Increment preview key to force fresh render
            setPreviewKey(prev => prev + 1)
            
            // Set state - this will trigger the modal to render
            setPreviewFile(updatedFile)
            setPreviewUrl(blobUrl)
            
            // Log success in development
            if (process.env.NODE_ENV === 'development') {
                console.log('Document loaded successfully:', {
                    fileName,
                    contentType: finalType,
                    blobType: blob.type,
                    blobSize: blob.size,
                    isImage,
                    isPdf,
                    blobUrl: blobUrl.substring(0, 50) + '...'
                })
            }
        } catch (err) {
            // Log error details for debugging
            if (process.env.NODE_ENV === 'development') {
                console.error('Failed to open document:', {
                    error: err,
                    message: err?.message,
                    response: err?.response,
                    status: err?.response?.status,
                    path,
                    documentType,
                    isImage,
                    isPdf
                })
            }
            
            // Clear any invalid cache entry for this path
            if (documentBlobCache.current[path]) {
                try {
                    const cached = documentBlobCache.current[path]
                    if (cached.blobUrl) {
                        window.URL.revokeObjectURL(cached.blobUrl)
                    }
                } catch (e) {
                    // Ignore errors when revoking
                }
                delete documentBlobCache.current[path]
            }
            
            // Determine error message
            let errorMessage = 'Could not open the document. Please try again.'
            if (err?.response?.status === 404) {
                errorMessage = 'Document not found. It may have been deleted.'
            } else if (err?.response?.status === 401) {
                errorMessage = 'You are not authorized to view this document.'
            } else if (err?.message) {
                errorMessage = err.message
            }
            
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Failed to open document', 
                message: errorMessage
            })
            
            // Fully reset preview state on error
            setPreviewFile(null)
            setPreviewUrl(null)
            setPreviewKey(prev => prev + 1)
        } finally {
            setLoadingDocument(null)
        }
    }

    // Generate preview URL for a file (uses cached URL if available)
    const getPreviewUrl = (file, key) => {
        if (!file) return null
        // If we have a cached URL for this file, use it
        if (key && filePreviewUrls[key]) {
            return filePreviewUrls[key]
        }
        // Otherwise create a new one (shouldn't happen normally, but fallback)
        try {
            return window.URL.createObjectURL(file)
        } catch (err) {
            console.error('Failed to create preview URL', err)
            return null
        }
    }

    // Open preview modal
    const openPreviewModal = (file, key) => {
        if (!file) {
            setToast({ open: true, type: 'error', title: 'Preview failed', message: 'No file selected.' })
            return
        }
        
        // Verify file type is supported
        const isImage = isImageFile(file)
        const isPdf = isPdfFile(file)
        
        if (!isImage && !isPdf) {
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Preview not supported', 
                message: 'Preview is only available for PDF, PNG, JPEG, and JPG files.' 
            })
            return
        }
        
        // Always create a fresh blob URL for the modal to ensure it loads properly
        // The cached URL is only used for thumbnails
        let url = null
        try {
            url = window.URL.createObjectURL(file)
            if (!url) {
                throw new Error('Failed to create blob URL')
            }
        } catch (err) {
            console.error('Failed to create preview URL', err)
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Preview failed', 
                message: 'Could not create a preview of the file. Please try again.' 
            })
            return
        }
        
        if (url) {
            // First clear existing preview to ensure clean state
            if (previewUrl && previewUrl !== filePreviewUrls[key]) {
                // Revoke old modal preview URL (but not thumbnail URLs)
                try {
                    window.URL.revokeObjectURL(previewUrl)
                } catch (err) {
                    console.warn('Failed to revoke old preview URL', err)
                }
            }
            
            // Increment key to force re-render of modal content
            setPreviewKey(prev => prev + 1)
            // Set both file and URL together
            setPreviewFile(file)
            setPreviewUrl(url)
        } else {
            setToast({ 
                open: true, 
                type: 'error', 
                title: 'Preview failed', 
                message: 'Could not create a preview of the file. Please try again.' 
            })
        }
    }

    // Close preview modal - fully reset state for consistent behavior
    const closePreviewModal = () => {
        // Reset all preview state to ensure clean state on next open
        setPreviewFile(null)
        setPreviewUrl(null)
        // Increment preview key to force fresh render on next open
        setPreviewKey(prev => prev + 1)
        // Note: We don't revoke cached blob URLs here - they're kept for reuse
        // Only revoke on component unmount or when explicitly replacing
    }

    // Handle "Choose another file" - clears input value and triggers file picker
    const handleChooseAnotherFile = (key) => {
        const input = fileInputRefs.current[key]
        if (input) {
            // Clear the input value so that selecting the same file will trigger onChange
            input.value = ''
            input.click()
        }
    }

    // Download the file from preview modal
    const downloadPreviewFile = () => {
        if (!previewFile || !previewUrl) return
        
        try {
            const a = document.createElement('a')
            a.href = previewUrl
            a.download = previewFile.name || 'download'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download failed', err)
            setToast({ open: true, type: 'error', title: 'Download failed', message: 'Could not download the file. Please try again.' })
        }
    }

    // Cleanup preview URLs only on component unmount
    // DO NOT include dependencies - we only want cleanup on unmount, not on state changes
    useEffect(() => {
        return () => {
            // Cleanup all cached server document blob URLs on unmount only
            Object.values(documentBlobCache.current).forEach(cached => {
                if (cached?.blobUrl) {
                    try {
                        window.URL.revokeObjectURL(cached.blobUrl)
                    } catch (e) {
                        // Ignore errors when revoking URLs
                    }
                }
            })
            documentBlobCache.current = {}
            
            // Cleanup all file preview URLs (local files) on unmount only
            Object.values(filePreviewUrls).forEach(url => {
                if (url) {
                    try {
                        window.URL.revokeObjectURL(url)
                    } catch (e) {
                        // Ignore errors when revoking URLs
                    }
                }
            })
            
            // Cleanup current preview blob URL if it exists
            if (previewBlobUrlRef.current) {
                try {
                    window.URL.revokeObjectURL(previewBlobUrlRef.current)
                    previewBlobUrlRef.current = null
                } catch (e) {
                    // Ignore errors when revoking URLs
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - only run on mount/unmount

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

        if (!form.enrollment_certification && !sub?.enrollment_certification_path) {
            setErrors('Enrollment certification is required.')
            return
        }

        if (!form.sao_photo && !sub?.sao_photo_path) {
            setErrors('SOA is required.')
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
                                                onClick={() => openServerDocument(sub.enrollment_certification_path, 'Enrollment_Certification')}
                                                disabled={loadingDocument === 'Enrollment_Certification'}
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingDocument === 'Enrollment_Certification' ? 'Loading...' : 'View Document'}
                                            </button>
                                        </div>
                                    )}
                                    {sub.scholarship_certification_path && (
                                        <div>
                                            <div className="text-gray-600">Scholarship Certification</div>
                                            <button
                                                onClick={() => openServerDocument(sub.scholarship_certification_path, 'Scholarship_Certification')}
                                                disabled={loadingDocument === 'Scholarship_Certification'}
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingDocument === 'Scholarship_Certification' ? 'Loading...' : 'View Document'}
                                            </button>
                                        </div>
                                    )}
                                    {sub.sao_photo_path && (
                                        <div>
                                            <div className="text-gray-600">SOA</div>
                                            <button
                                                onClick={() => openServerDocument(sub.sao_photo_path, 'SOA')}
                                                disabled={loadingDocument === 'SOA'}
                                                className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingDocument === 'SOA' ? 'Loading...' : 'View Document'}
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
                                    <input
                                        ref={el => fileInputRefs.current.enrollment_certification = el}
                                        type="file"
                                        accept="image/png,image/jpeg,application/pdf"
                                        className="hidden"
                                        required={!sub?.enrollment_certification_path}
                                        onChange={e => handleFilePick('enrollment_certification', e.target.files?.[0] || null)}
                                    />
                                    <div className={`rounded-lg border-2 border-dashed overflow-hidden ${form.enrollment_certification ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                                        {form.enrollment_certification ? (
                                            <div className="p-4">
                                                {isImageFile(form.enrollment_certification) ? (
                                                    <div className="mb-3">
                                                        <ImagePreview 
                                                            file={form.enrollment_certification}
                                                            url={getPreviewUrl(form.enrollment_certification, 'enrollment_certification')}
                                                            fileName={form.enrollment_certification.name}
                                                        />
                                                    </div>
                                                ) : isPdfFile(form.enrollment_certification) ? (
                                                    <div className="mb-3">
                                                        <PDFPreview 
                                                            file={form.enrollment_certification}
                                                            url={getPreviewUrl(form.enrollment_certification, 'enrollment_certification')}
                                                            fileName={form.enrollment_certification.name}
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreviewModal(form.enrollment_certification, 'enrollment_certification')}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChooseAnotherFile('enrollment_certification')}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                    >
                                                        Choose another file
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label 
                                                className="flex cursor-pointer items-center justify-center p-6 text-center hover:border-blue-300"
                                                onClick={() => fileInputRefs.current.enrollment_certification?.click()}
                                            >
                                                <div>
                                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">Scholarship Certification {form.is_scholar === 'scholar' && <span className="text-red-600">(required)</span>}</label>
                                    <input
                                        ref={el => fileInputRefs.current.scholarship_certification = el}
                                        type="file"
                                        accept="image/png,image/jpeg,application/pdf"
                                        className="hidden"
                                        required={form.is_scholar === 'scholar' && !(sub?.scholarship_certification_path)}
                                        disabled={form.is_scholar !== 'scholar'}
                                        onChange={e => handleFilePick('scholarship_certification', e.target.files?.[0] || null)}
                                    />
                                    <div className={`rounded-lg border-2 border-dashed overflow-hidden ${
                                        form.is_scholar !== 'scholar'
                                            ? 'border-gray-200 opacity-50'
                                            : form.scholarship_certification
                                                ? 'border-green-400 bg-green-50'
                                                : 'border-gray-300'
                                    }`}>
                                        {form.scholarship_certification ? (
                                            <div className="p-4">
                                                {isImageFile(form.scholarship_certification) ? (
                                                    <div className="mb-3">
                                                        <ImagePreview 
                                                            file={form.scholarship_certification}
                                                            url={getPreviewUrl(form.scholarship_certification, 'scholarship_certification')}
                                                            fileName={form.scholarship_certification.name}
                                                        />
                                                    </div>
                                                ) : isPdfFile(form.scholarship_certification) ? (
                                                    <div className="mb-3">
                                                        <PDFPreview 
                                                            file={form.scholarship_certification}
                                                            url={getPreviewUrl(form.scholarship_certification, 'scholarship_certification')}
                                                            fileName={form.scholarship_certification.name}
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreviewModal(form.scholarship_certification, 'scholarship_certification')}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChooseAnotherFile('scholarship_certification')}
                                                        disabled={form.is_scholar !== 'scholar'}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Choose another file
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label 
                                                className={`flex items-center justify-center p-6 text-center ${
                                                    form.is_scholar === 'scholar' ? 'cursor-pointer hover:border-blue-300' : 'cursor-not-allowed'
                                                }`}
                                                onClick={() => form.is_scholar === 'scholar' && fileInputRefs.current.scholarship_certification?.click()}
                                            >
                                                <div>
                                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SOA</label>
                                    <input
                                        ref={el => fileInputRefs.current.sao_photo = el}
                                        type="file"
                                        accept="image/png,image/jpeg,application/pdf"
                                        className="hidden"
                                        required={!sub?.sao_photo_path}
                                        onChange={e => handleFilePick('sao_photo', e.target.files?.[0] || null)}
                                    />
                                    <div className={`rounded-lg border-2 border-dashed overflow-hidden ${form.sao_photo ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                                        {form.sao_photo ? (
                                            <div className="p-4">
                                                {isImageFile(form.sao_photo) ? (
                                                    <div className="mb-3">
                                                        <ImagePreview 
                                                            file={form.sao_photo}
                                                            url={getPreviewUrl(form.sao_photo, 'sao_photo')}
                                                            fileName={form.sao_photo.name}
                                                        />
                                                    </div>
                                                ) : isPdfFile(form.sao_photo) ? (
                                                    <div className="mb-3">
                                                        <PDFPreview 
                                                            file={form.sao_photo}
                                                            url={getPreviewUrl(form.sao_photo, 'sao_photo')}
                                                            fileName={form.sao_photo.name}
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreviewModal(form.sao_photo, 'sao_photo')}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChooseAnotherFile('sao_photo')}
                                                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                    >
                                                        Choose another file
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label 
                                                className="flex cursor-pointer items-center justify-center p-6 text-center hover:border-blue-300"
                                                onClick={() => fileInputRefs.current.sao_photo?.click()}
                                            >
                                                <div>
                                                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <div className="mt-2 text-sm text-gray-600">Click to choose file</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
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
            <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4">
                <div
                    className="absolute inset-0 bg-gray-900/40"
                    onClick={() => !saving && setShowReview(false)}
                />
                <div className="relative bg-white w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-lg shadow-xl flex flex-col">
                    <div className="px-6 py-4 border-b flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">Review your enrollment submission</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Please carefully review your details and documents below. If everything
                            looks correct, click <span className="font-semibold">Confirm &amp; Submit</span> to
                            send them to your caseworker.
                        </p>
                    </div>
                    <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1 min-h-0">
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
                        </div>
                        
                        {/* File Preview Cards */}
                        <div className="space-y-4 mt-6">
                            <div>
                                <div className="text-gray-600 mb-2">Enrollment Certification</div>
                                {form.enrollment_certification ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        {isImageFile(form.enrollment_certification) ? (
                                            <ImagePreview 
                                                file={form.enrollment_certification}
                                                url={getPreviewUrl(form.enrollment_certification, 'enrollment_certification')}
                                                fileName={form.enrollment_certification.name}
                                            />
                                        ) : isPdfFile(form.enrollment_certification) ? (
                                            <PDFPreview 
                                                file={form.enrollment_certification}
                                                url={getPreviewUrl(form.enrollment_certification, 'enrollment_certification')}
                                                fileName={form.enrollment_certification.name}
                                            />
                                        ) : null}
                                        <div className="p-2 bg-gray-50 border-t border-gray-200">
                                            <div className="text-xs text-gray-600 truncate">{form.enrollment_certification.name}</div>
                                            <button
                                                type="button"
                                                onClick={() => openPreviewModal(form.enrollment_certification, 'enrollment_certification')}
                                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View full preview
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No file selected</div>
                                )}
                            </div>

                            <div>
                                <div className="text-gray-600 mb-2">Scholarship Certification</div>
                                {form.scholarship_certification ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        {isImageFile(form.scholarship_certification) ? (
                                            <ImagePreview 
                                                file={form.scholarship_certification}
                                                url={getPreviewUrl(form.scholarship_certification, 'scholarship_certification')}
                                                fileName={form.scholarship_certification.name}
                                            />
                                        ) : isPdfFile(form.scholarship_certification) ? (
                                            <PDFPreview 
                                                file={form.scholarship_certification}
                                                url={getPreviewUrl(form.scholarship_certification, 'scholarship_certification')}
                                                fileName={form.scholarship_certification.name}
                                            />
                                        ) : null}
                                        <div className="p-2 bg-gray-50 border-t border-gray-200">
                                            <div className="text-xs text-gray-600 truncate">{form.scholarship_certification.name}</div>
                                            <button
                                                type="button"
                                                onClick={() => openPreviewModal(form.scholarship_certification, 'scholarship_certification')}
                                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View full preview
                                            </button>
                                        </div>
                                    </div>
                                ) : sub?.scholarship_certification_path ? (
                                    <div className="text-gray-600">Existing file on record</div>
                                ) : (
                                    <div className="text-gray-500 italic">No file provided</div>
                                )}
                            </div>

                            <div>
                                <div className="text-gray-600 mb-2">SOA</div>
                                {form.sao_photo ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        {isImageFile(form.sao_photo) ? (
                                            <ImagePreview 
                                                file={form.sao_photo}
                                                url={getPreviewUrl(form.sao_photo, 'sao_photo')}
                                                fileName={form.sao_photo.name}
                                            />
                                        ) : isPdfFile(form.sao_photo) ? (
                                            <PDFPreview 
                                                file={form.sao_photo}
                                                url={getPreviewUrl(form.sao_photo, 'sao_photo')}
                                                fileName={form.sao_photo.name}
                                            />
                                        ) : null}
                                        <div className="p-2 bg-gray-50 border-t border-gray-200">
                                            <div className="text-xs text-gray-600 truncate">{form.sao_photo.name}</div>
                                            <button
                                                type="button"
                                                onClick={() => openPreviewModal(form.sao_photo, 'sao_photo')}
                                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View full preview
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No file selected</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
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

        {/* File Preview Modal */}
        {previewFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" key={`modal-${previewKey}`}>
                <div
                    className="absolute inset-0 bg-gray-900/60"
                    onClick={closePreviewModal}
                />
                <div className="relative bg-white w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-lg shadow-xl flex flex-col">
                    <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {previewFile.name || 'File Preview'}
                        </h3>
                        <div className="flex items-center gap-3">
                            {(isImageFile(previewFile) || isPdfFile(previewFile) || (previewFile?.type && (previewFile.type.startsWith('image/') || previewFile.type === 'application/pdf'))) && (
                                <button
                                    type="button"
                                    onClick={downloadPreviewFile}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closePreviewModal}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-6 bg-gray-100 min-h-0" key={`content-${previewKey}`}>
                        {!previewUrl && previewFile ? (
                            <div className="flex items-center justify-center min-h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading document...</p>
                                </div>
                            </div>
                        ) : previewUrl && previewFile ? (
                            (() => {
                                // Determine if it's an image or PDF based on type
                                const fileType = previewFile.type || ''
                                const fileName = previewFile.name || ''
                                
                                const isImage = fileType.startsWith('image/')
                                const isPdf = fileType === 'application/pdf'
                                
                                // Fallback to checking file name if type is not set
                                // Production-safe: Only check for supported formats (JPG, JPEG, PNG, PDF)
                                const isImageByName = /\.(jpg|jpeg|png)$/i.test(fileName)
                                const isPdfByName = /\.pdf$/i.test(fileName)
                                
                                // Determine final type
                                const shouldShowImage = isImage || isImageByName
                                const shouldShowPdf = isPdf || isPdfByName
                                
                                if (shouldShowImage) {
                                    // Validate previewUrl exists before rendering
                                    if (!previewUrl) {
                                        return (
                                            <div className="flex items-center justify-center min-h-full">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                                    <p className="mt-4 text-gray-600">Loading image...</p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    
                                    return (
                                        <div className="flex items-center justify-center h-full w-full bg-gray-50 p-4 overflow-auto">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <img
                                                    key={`img-${previewKey}-${previewUrl}`}
                                                    src={previewUrl}
                                                    alt={previewFile.name || 'Document Preview'}
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
                                                    style={{ 
                                                        maxHeight: 'calc(90vh - 200px)', 
                                                        width: 'auto',
                                                        height: 'auto',
                                                        display: 'block',
                                                        imageRendering: 'auto'
                                                    }}
                                                    loading="eager"
                                                    decoding="async"
                                                    onError={async (e) => {
                                                        // Log error in development only
                                                        if (process.env.NODE_ENV === 'development') {
                                                            console.error('Failed to load image preview', {
                                                                fileName: previewFile.name,
                                                                fileType: previewFile.type,
                                                                blobUrl: previewUrl?.substring(0, 50) + '...',
                                                                error: e,
                                                                target: e.target,
                                                                imgSrc: e.target?.src,
                                                                blobUrlValid: previewUrl?.startsWith('blob:'),
                                                                naturalWidth: e.target.naturalWidth,
                                                                naturalHeight: e.target.naturalHeight
                                                            })
                                                        }
                                                        
                                                        // Check if this is a cached blob URL that failed
                                                        // If so, clear the cache and re-fetch the document
                                                        const cachedPath = Object.keys(documentBlobCache.current).find(
                                                            key => documentBlobCache.current[key]?.blobUrl === previewUrl
                                                        )
                                                        
                                                        if (cachedPath) {
                                                            // Cached blob URL is invalid - clear it and re-fetch
                                                            const cached = documentBlobCache.current[cachedPath]
                                                            if (cached?.blobUrl) {
                                                                try {
                                                                    window.URL.revokeObjectURL(cached.blobUrl)
                                                                } catch (revokeErr) {
                                                                    // Ignore errors
                                                                }
                                                            }
                                                            delete documentBlobCache.current[cachedPath]
                                                            
                                                            // Determine document type from path
                                                            let docType = 'Document'
                                                            if (cachedPath.includes('enrollment_certification')) {
                                                                docType = 'Enrollment_Certification'
                                                            } else if (cachedPath.includes('scholarship')) {
                                                                docType = 'Scholarship_Certification'
                                                            } else if (cachedPath.includes('sao')) {
                                                                docType = 'SOA'
                                                            }
                                                            
                                                            // Re-fetch the document with a fresh blob
                                                            try {
                                                                await openServerDocument(cachedPath, docType)
                                                                return // Successfully re-fetched, exit error handler
                                                            } catch (refetchErr) {
                                                                // Re-fetch failed, show error
                                                                setToast({ 
                                                                    open: true, 
                                                                    type: 'error', 
                                                                    title: 'Failed to load image', 
                                                                    message: 'The image could not be displayed. Please try again.' 
                                                                })
                                                            }
                                                        } else {
                                                            // Not a cached URL or re-fetch not possible, show error
                                                            setToast({ 
                                                                open: true, 
                                                                type: 'error', 
                                                                title: 'Failed to load image', 
                                                                message: 'The image could not be displayed. The file may be corrupted or in an unsupported format.' 
                                                            })
                                                        }
                                                    }}
                                                    onLoad={(e) => {
                                                        // Success - image loaded
                                                        if (process.env.NODE_ENV === 'development') {
                                                            console.log('Image loaded successfully', {
                                                                fileName: previewFile.name,
                                                                fileType: previewFile.type,
                                                                naturalWidth: e.target.naturalWidth,
                                                                naturalHeight: e.target.naturalHeight,
                                                                blobUrl: previewUrl?.substring(0, 50) + '...',
                                                                imgSrc: e.target.src?.substring(0, 50) + '...'
                                                            })
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                } else if (shouldShowPdf) {
                                    // Validate previewUrl exists before rendering PDF
                                    if (!previewUrl) {
                                        return (
                                            <div className="flex items-center justify-center min-h-full">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                                    <p className="mt-4 text-gray-600">Loading PDF...</p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    
                                    return (
                                        <div className="flex items-center justify-center h-full w-full bg-gray-50">
                                            <iframe
                                                key={`iframe-${previewKey}-${previewUrl}`}
                                                src={`${previewUrl}#toolbar=0`}
                                                className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                                                style={{ 
                                                    minHeight: 'calc(90vh - 180px)', 
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                                title={`PDF Preview - ${previewFile.name || 'PDF'}`}
                                                allow="fullscreen"
                                                onError={(e) => {
                                                    if (process.env.NODE_ENV === 'development') {
                                                        console.error('Failed to load PDF preview', {
                                                            error: e,
                                                            src: previewUrl,
                                                            fileName: previewFile.name
                                                        })
                                                    }
                                                    // If PDF fails to load, try to clear cache and reload
                                                    // Find the path by looking up the blobUrl in cache
                                                    const cachedPath = Object.keys(documentBlobCache.current).find(
                                                        key => documentBlobCache.current[key]?.blobUrl === previewUrl
                                                    )
                                                    if (cachedPath) {
                                                        delete documentBlobCache.current[cachedPath]
                                                    }
                                                    setToast({ 
                                                        open: true, 
                                                        type: 'error', 
                                                        title: 'Preview failed', 
                                                        message: 'Could not load the PDF preview. The file may be corrupted. Please try downloading it instead.' 
                                                    })
                                                }}
                                            />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div className="flex items-center justify-center min-h-full">
                                            <div className="text-center">
                                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="mt-4 text-gray-600">Preview not available for this file type</p>
                                                <p className="mt-2 text-sm text-gray-500">{previewFile?.name || 'Unknown file'}</p>
                                                <p className="mt-1 text-xs text-gray-400">Type: {previewFile?.type || 'unknown'}</p>
                                            </div>
                                        </div>
                                    )
                                }
                            })()
                        ) : (
                            <div className="flex items-center justify-center min-h-full">
                                <div className="text-center">
                                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="mt-4 text-gray-600">No file selected</p>
                                </div>
                            </div>
                        )}
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
