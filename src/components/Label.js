const Label = ({ className, children, ...props }) => (
    <label
        className={`${className} block font-medium text-sm text-blue-900`}
        {...props}>
        {children}
    </label>
)

export default Label
