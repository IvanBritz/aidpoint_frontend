const Header = ({ title, children }) => {
    return (
        <header className="bg-gradient-to-r from-white to-blue-50/50 border-b border-blue-100/60 shadow-sm">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                            {title}
                        </h1>
                    </div>
                    {children && (
                        <div className="flex items-center gap-4">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
