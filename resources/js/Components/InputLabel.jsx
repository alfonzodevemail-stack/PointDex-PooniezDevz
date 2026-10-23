export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-extrabold text-clay-charcoal ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
