import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Clay-styled field used on the login / sign-up screens.
export default forwardRef(function AuthInput(
    { id, label, type = 'text', icon: Icon, error, isFocused = false, className = '', ...props },
    ref,
) {
    const localRef = useRef(null);
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-xs font-extrabold text-clay-charcoal">
                    {label}
                </label>
            )}

            <div
                className={`clay-inset flex items-center px-3.5 transition-shadow focus-within:ring-2 ${
                    error ? 'ring-2 ring-red-400 focus-within:ring-red-400' : 'focus-within:ring-clay-gold'
                }`}
            >
                {Icon && <Icon className="mr-2.5 h-4 w-4 flex-shrink-0 text-clay-charcoal/50" />}
                <input
                    {...props}
                    id={id}
                    ref={localRef}
                    type={isPassword && revealed ? 'text' : type}
                    aria-invalid={error ? true : undefined}
                    className="w-full border-0 bg-transparent px-0 py-2.5 text-sm font-semibold text-clay-charcoal placeholder:text-clay-charcoal/35 focus:ring-0"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed(!revealed)}
                        className="ml-2 text-clay-charcoal/50 hover:text-clay-charcoal"
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                    >
                        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
        </div>
    );
});
