import Link from 'next/link'

const ResponsiveNavLink = ({ active = false, children, ...props }) => (
    <Link
        {...props}
        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium leading-5 focus:outline-none transition duration-150 ease-in-out ${
            active
                ? 'border-blue-500 text-blue-800 bg-blue-50 focus:text-blue-900 focus:bg-blue-100 focus:border-blue-700'
                : 'border-transparent text-blue-700/80 hover:text-blue-900 hover:bg-blue-50 hover:border-blue-300 focus:text-blue-900 focus:bg-blue-50 focus:border-blue-300'
        }`}>
        {children}
    </Link>
)

export const ResponsiveNavButton = props => (
    <button
        className="block w-full pl-3 pr-4 py-2 border-l-4 text-left text-base font-medium leading-5 focus:outline-none transition duration-150 ease-in-out border-transparent text-blue-700/80 hover:text-blue-900 hover:bg-blue-50 hover:border-blue-300 focus:text-blue-900 focus:bg-blue-50 focus:border-blue-300"
        {...props}
    />
)

export default ResponsiveNavLink
