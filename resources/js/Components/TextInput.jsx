import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'clay-inset border-0 px-3.5 py-2.5 text-sm font-semibold text-clay-charcoal placeholder:text-clay-charcoal/35 focus:ring-2 focus:ring-clay-gold ' +
                className
            }
            ref={localRef}
        />
    );
});
