import Link from 'next/link'

const NavLink = ({ active = false, children, ...props }) => (
    <Link
        {...props}
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 focus:outline-none transition duration-150 ease-in-out ${
            active
                ? 'border-blue-500 text-blue-900 focus:border-blue-700'
                : 'border-transparent text-blue-700/80 hover:text-blue-900 hover:border-blue-300 focus:text-blue-900 focus:border-blue-300'
        }`}>
        {children}
    </Link>
)

export default NavLink
