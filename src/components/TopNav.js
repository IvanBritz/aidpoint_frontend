'use client'

import Link from 'next/link'
import LoginLinks from '@/components/LoginLinks'
import { useEffect, useState } from 'react'
import ApplicationLogo from '@/components/ApplicationLogo'

const TopNav = ({ variant = 'white' }) => {
    const isTransparent = variant === 'transparent'
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const baseBg = isTransparent && !scrolled
        ? 'bg-white/50 supports-[backdrop-filter]:bg-white/40 backdrop-blur'
        : 'bg-white'

    const borderShadow = isTransparent && !scrolled
        ? 'ring-1 ring-blue-100/60'
        : 'ring-1 ring-blue-100 shadow-sm'

    return (
        <header className={`sticky top-0 z-50 ${baseBg} ${borderShadow}`}>
            <div className="max-w-7xl mx-auto px-6 py-3 md:py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <ApplicationLogo className="h-8 w-8 group-hover:scale-105 transition-transform" />
                    <span className="text-lg md:text-xl font-semibold text-blue-900">AidPoint</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium text-blue-800/80 hover:text-blue-900 transition-colors">Home</Link>
<Link href="/plans" className="text-sm font-medium text-blue-800/80 hover:text-blue-900 transition-colors">Plans</Link>
                    <Link href="/about" className="text-sm font-medium text-blue-800/80 hover:text-blue-900 transition-colors">About Us</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        aria-label="Toggle menu"
                        className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition"
                        onClick={() => setMobileOpen(o => !o)}
                    >
                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                    <div className="hidden md:block">
                        <LoginLinks />
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="md:hidden border-t border-blue-100/80">
                    <div className="px-6 py-3 space-y-2 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur">
                        <Link href="/" className="block text-sm font-medium text-blue-900 py-2">Home</Link>
<Link href="/plans" className="block text-sm font-medium text-blue-900 py-2">Plans</Link>
                        <Link href="/about" className="block text-sm font-medium text-blue-900 py-2">About Us</Link>
                        <div className="pt-2 border-t border-blue-100">
                            <LoginLinks />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default TopNav
