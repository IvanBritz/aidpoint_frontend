const InputError = ({ messages, className = '' }) => {
    // Normalize messages to an array to prevent runtime errors when it's null/undefined/string
    const list = Array.isArray(messages)
        ? messages
        : messages
            ? [messages]
            : []

    return (
        <>
            {list.length > 0 && (
                <>
                    {list.map((message, index) => (
                        <p className={`${className} text-sm text-red-600`} key={index}>
                            {message}
                        </p>
                    ))}
                </>
            )}
        </>
    )
}

export default InputError
