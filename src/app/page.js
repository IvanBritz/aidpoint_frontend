import Link from 'next/link'
import TopNav from '@/components/TopNav'

export const metadata = {
    title: 'AidPoint',
}

const Home = () => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-300/20 to-purple-200/20 rounded-full blur-3xl" />
            </div>
            
            {/* Top bar */}
            <TopNav variant="transparent" />

            {/* Hero */}
            <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-20">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 text-sm font-medium ring-1 ring-inset ring-blue-200/50 backdrop-blur-sm animate-pulse">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Financial Aid, reimagined
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-blue-950 leading-tight">
                                Manage financial aid with 
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">clarity</span> and 
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">speed</span>.
                            </h1>
                            <p className="text-lg md:text-xl text-blue-900/80 max-w-2xl leading-relaxed">
                                AidPoint streamlines financial aid management with intelligent dashboards, automated workflows, and secure beneficiary portals. Transform how you handle applications, approvals, and communications.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link href="/register" className="group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1">
                                Get started free
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link href="/login" className="group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/80 backdrop-blur-sm text-blue-700 font-semibold text-lg ring-1 ring-blue-200/50 hover:ring-blue-300 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
                                Sign in
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </Link>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-blue-900/70">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Setup in 5 minutes
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                24/7 support
                            </div>
                        </div>
                    </div>
                    <div className="relative lg:pl-8">
                        {/* Floating background elements */}
                        <div className="absolute -inset-8 bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-purple-200/30 blur-3xl rounded-3xl" />
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
                        
                        {/* Main dashboard mockup */}
                        <div className="relative rounded-3xl bg-white/90 backdrop-blur-sm ring-1 ring-blue-100/70 shadow-2xl p-8 transform hover:scale-105 transition-all duration-500">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                                </div>
                                <div className="text-xs text-gray-400 font-mono">AidPoint Dashboard</div>
                            </div>
                            
                            {/* Dashboard content grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 7V9a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-semibold text-blue-900">Center Dashboard</div>
                                    </div>
                                    <p className="text-xs text-blue-700/70 leading-relaxed">Track beneficiaries, staff, roles, and subscriptions with real-time analytics.</p>
                                </div>
                                
                                <div className="group rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-semibold text-indigo-900">Beneficiary Portal</div>
                                    </div>
                                    <p className="text-xs text-indigo-700/70 leading-relaxed">Secure portal for status reviews and profile management.</p>
                                </div>
                                
                                <div className="group rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-semibold text-green-900">Secure Access</div>
                                    </div>
                                    <p className="text-xs text-green-700/70 leading-relaxed">Enterprise-grade security with email verification.</p>
                                </div>
                                
                                <div className="group rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-semibold text-purple-900">Smart Routing</div>
                                    </div>
                                    <p className="text-xs text-purple-700/70 leading-relaxed">Intelligent navigation and workflow automation.</p>
                                </div>
                            </div>
                            
                            {/* Bottom stats bar */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">99.9%</div>
                                        <div className="text-xs text-gray-500">Uptime</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">24/7</div>
                                        <div className="text-xs text-gray-500">Support</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-6 bg-blue-200 rounded-full" />
                                    <div className="w-1 h-8 bg-blue-400 rounded-full" />
                                    <div className="w-1 h-4 bg-blue-300 rounded-full" />
                                    <div className="w-1 h-6 bg-blue-500 rounded-full" />
                                    <div className="w-1 h-3 bg-blue-300 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative bg-white/80 backdrop-blur-sm border-t border-blue-100/60">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-white/50 pointer-events-none" />
                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    {/* Section header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4">
                            Everything you need to manage 
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">financial aid</span>
                        </h2>
                        <p className="text-lg text-blue-900/70 max-w-2xl mx-auto">
                            Streamline your operations with powerful tools designed for modern financial aid management
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Feature 1 */}
                        <div className="group relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <div className="relative rounded-2xl bg-white p-8 ring-1 ring-blue-100/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-blue-950 mb-3">Lightning-fast setup</h3>
                                <p className="text-blue-900/70 leading-relaxed mb-4">Get your financial aid center up and running in under 5 minutes. No technical expertise required.</p>
                                <div className="flex items-center text-sm text-blue-600 font-medium">
                                    <span>Quick start guide</span>
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Feature 2 */}
                        <div className="group relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <div className="relative rounded-2xl bg-white p-8 ring-1 ring-blue-100/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-blue-950 mb-3">Smart workflows</h3>
                                <p className="text-blue-900/70 leading-relaxed mb-4">Automated processes that adapt to your needs. Manage applications, approvals, and communications seamlessly.</p>
                                <div className="flex items-center text-sm text-indigo-600 font-medium">
                                    <span>Explore workflows</span>
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Feature 3 */}
                        <div className="group relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <div className="relative rounded-2xl bg-white p-8 ring-1 ring-blue-100/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-blue-950 mb-3">Enterprise security</h3>
                                <p className="text-blue-900/70 leading-relaxed mb-4">Bank-level security with role-based access controls. Your data is protected with industry-leading encryption.</p>
                                <div className="flex items-center text-sm text-green-600 font-medium">
                                    <span>Security details</span>
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof & Stats Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="h-full w-full" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />
                </div>
                <div className="relative max-w-7xl mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Trusted by financial aid centers nationwide
                        </h2>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                            Join hundreds of organizations already streamlining their operations with AidPoint
                        </p>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
                            <div className="text-blue-100">Active Centers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">25k+</div>
                            <div className="text-blue-100">Beneficiaries Served</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
                            <div className="text-blue-100">System Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
                            <div className="text-blue-100">Expert Support</div>
                        </div>
                    </div>
                    
                    {/* Final CTA */}
                    <div className="text-center mt-12">
                        <Link href="/register" className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-white text-blue-600 font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1">
                            Start your free trial
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <p className="text-blue-200 text-sm mt-4">No setup fees • Cancel anytime • 30-day money-back guarantee</p>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">A</span>
                                </div>
                                <span className="text-xl font-semibold text-blue-900">AidPoint</span>
                            </div>
                            <p className="text-gray-600 mb-4 max-w-md">
                                Modern financial aid management platform designed for efficiency, security, and growth.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-gray-600 hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                    </svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-gray-600 hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                    </svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-gray-600 hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                        
                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                            <div className="space-y-2">
                                <Link href="/features" className="block text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
                                <Link href="/plans" className="block text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
                                <Link href="/security" className="block text-gray-600 hover:text-blue-600 transition-colors">Security</Link>
                                <Link href="/integrations" className="block text-gray-600 hover:text-blue-600 transition-colors">Integrations</Link>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                            <div className="space-y-2">
                                <Link href="/help" className="block text-gray-600 hover:text-blue-600 transition-colors">Help Center</Link>
                                <Link href="/docs" className="block text-gray-600 hover:text-blue-600 transition-colors">Documentation</Link>
                                <Link href="/contact" className="block text-gray-600 hover:text-blue-600 transition-colors">Contact Us</Link>
                                <Link href="/status" className="block text-gray-600 hover:text-blue-600 transition-colors">System Status</Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom bar */}
                    <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-gray-600 text-sm">
                            © {new Date().getFullYear()} AidPoint. All rights reserved.
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
                            <span className="text-gray-400">Built with Next.js</span>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    )
}

export default Home
