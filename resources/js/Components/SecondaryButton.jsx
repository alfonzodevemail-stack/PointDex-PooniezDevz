export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `clay-btn-light inline-flex items-center justify-center px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-clay-gold ${
                    disabled ? 'opacity-50' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
