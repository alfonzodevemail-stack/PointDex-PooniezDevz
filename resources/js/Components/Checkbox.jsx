export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-clay-gray text-clay-charcoal shadow-sm focus:ring-clay-gold ' +
                className
            }
        />
    );
}
