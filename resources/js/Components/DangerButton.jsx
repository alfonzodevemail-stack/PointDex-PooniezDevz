export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-[0.875rem] bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-[0_8px_16px_rgba(220,38,38,0.25),inset_-3px_-3px_6px_rgba(127,29,29,0.45),inset_3px_3px_6px_rgba(252,165,165,0.45)] transition-all hover:-translate-y-px hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                    disabled ? 'opacity-50' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
