const AuthCard = ({ logo, children }) => (
    <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-300/15 to-purple-200/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 mb-8">{logo}</div>

        <div className="relative z-10 w-full sm:max-w-2xl lg:max-w-4xl mt-6 px-6 py-8 bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden sm:rounded-2xl ring-1 ring-blue-100/50">
            {children}
        </div>
        
        {/* Footer */}
        <div className="relative z-10 mt-8 text-center text-sm text-gray-600">
            <p>Secure registration powered by AidPoint</p>
        </div>
    </div>
)

export default AuthCard
