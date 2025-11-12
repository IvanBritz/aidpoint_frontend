const NotFoundPage = () => {
    return (
        <div className="relative flex items-top justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 sm:items-center sm:pt-0">
            <div className="max-w-xl mx-auto sm:px-6 lg:px-8">
                <div className="flex items-center pt-8 sm:justify-start sm:pt-0">
                    <div className="px-4 text-lg text-blue-700 border-r border-blue-200 tracking-wider">
                        404
                    </div>

                    <div className="ml-4 text-lg text-blue-800 uppercase tracking-wider">
                        Not Found
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFoundPage
