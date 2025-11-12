import { Nunito } from 'next/font/google'
import '@/app/global.css'
import SubscriptionExpiredProvider from '@/providers/SubscriptionExpiredProvider'

const nunitoFont = Nunito({
    subsets: ['latin'],
    display: 'swap',
})

const RootLayout = ({ children }) => {
    return (
        <html lang="en" className={nunitoFont.className}>
            <body className="antialiased bg-blue-50">
                <SubscriptionExpiredProvider>
                    {children}
                </SubscriptionExpiredProvider>
            </body>
        </html>
    )
}

export const metadata = {
    title: 'AidPoint',
    description: 'AidPoint — Modern financial aid platform for facilities and beneficiaries',
}

export default RootLayout
