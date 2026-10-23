export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `clay-btn-gold inline-flex items-center justify-center px-5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-clay-charcoal/30 ${
                    disabled ? 'opacity-50' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
