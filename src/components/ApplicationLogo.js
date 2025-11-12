const ApplicationLogo = ({ className = '' }) => (
    <svg
        className={className}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AidPoint logo">
        <defs>
            <linearGradient id="apg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="9" fill="url(#apg)" />
        <path d="M16 32l8-16 8 16m-3-6h-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
)

export default ApplicationLogo
