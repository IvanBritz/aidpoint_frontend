const Input = ({ disabled = false, className = '', ...props }) => (
    <input
        disabled={disabled}
        className={`rounded-md shadow-sm border-blue-200 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${className}`}
        {...props}
    />
)

export default Input
