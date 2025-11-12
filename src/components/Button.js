const Button = ({ type = 'submit', className = '', ...props }) => (
    <button
        type={type}
        className={`inline-flex items-center px-4 py-2 rounded-md font-semibold text-xs uppercase tracking-widest transition ease-in-out duration-150 shadow-sm focus:outline-none ring-1 ring-inset ${className} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-300`}
        {...props}
    />
)

export default Button
