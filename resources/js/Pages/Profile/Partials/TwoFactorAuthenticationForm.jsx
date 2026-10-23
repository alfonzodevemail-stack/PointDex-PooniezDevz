import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

// Asks for the current password before a sensitive two-factor change.
function PasswordPrompt({ label, buttonText, danger = false, onSubmit, onCancel }) {
    const { data, setData, errors, processing, reset, setError } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        onSubmit(data, {
            preserveScroll: true,
            onError: (errs) => setError(errs),
            onFinish: () => reset('password'),
        });
    };

    const Button = danger ? DangerButton : PrimaryButton;

    return (
        <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
                <InputLabel htmlFor="two_factor_password" value={label} />
                <TextInput
                    id="two_factor_password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="mt-1 block w-full sm:w-3/4"
                    autoComplete="current-password"
                    isFocused={true}
                />
                <InputError message={errors.password} className="mt-2" />
            </div>
            <div className="flex items-center gap-3">
                <Button disabled={processing}>{buttonText}</Button>
                <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
            </div>
        </form>
    );
}

export default function TwoFactorAuthenticationForm({ twoFactor, className = '' }) {
    const [prompt, setPrompt] = useState(null);
    const confirmForm = useForm({ code: '' });
    const actionForm = useForm({});

    const run = (method, url) => (data, options) => {
        actionForm.transform(() => data);
        actionForm[method](url, {
            ...options,
            onSuccess: () => setPrompt(null),
        });
    };

    const confirm = (e) => {
        e.preventDefault();
        confirmForm.post(route('two-factor.confirm'), {
            preserveScroll: true,
            onFinish: () => confirmForm.reset('code'),
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-black text-clay-charcoal">
                    Two-Factor Authentication
                </h2>

                <p className="mt-1 text-xs font-medium text-clay-charcoal/70">
                    Add a second step to your login: after your password, enter a 6-digit code from an
                    authenticator app on your phone.
                </p>
            </header>

            <div className="mt-4">
                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        twoFactor.enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : twoFactor.pending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-clay-charcoal text-clay-cream'
                    }`}
                >
                    {twoFactor.enabled ? 'Enabled' : twoFactor.pending ? 'Finish setup' : 'Disabled'}
                </span>
            </div>

            {twoFactor.pending && (
                <div className="mt-4 space-y-4">
                    <p className="text-xs font-bold text-emerald-700">
                        1. Scan this QR code with Google Authenticator, Microsoft Authenticator or Authy.
                        If you can't scan it, type the setup key into the app instead.
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div
                            className="inline-block rounded-xl bg-white p-2 shadow-md w-fit"
                            dangerouslySetInnerHTML={{ __html: twoFactor.qrCodeSvg }}
                        />
                        <div className="text-sm">
                            <div className="font-extrabold text-clay-charcoal text-xs">Setup key</div>
                            <code className="mt-1 block break-all clay-inset px-3 py-2 font-mono text-xs text-clay-charcoal">
                                {twoFactor.setupKey}
                            </code>
                        </div>
                    </div>

                    <form onSubmit={confirm} className="space-y-3">
                        <div>
                            <InputLabel htmlFor="two_factor_code" value="2. Enter the 6-digit code shown in the app" />
                            <TextInput
                                id="two_factor_code"
                                inputMode="numeric"
                                maxLength={6}
                                value={confirmForm.data.code}
                                onChange={(e) => confirmForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                className="mt-1 block w-40 font-mono tracking-[0.3em]"
                                autoComplete="one-time-code"
                            />
                            <InputError message={confirmForm.errors.code} className="mt-2" />
                        </div>
                        <div className="flex items-center gap-3">
                            <PrimaryButton disabled={confirmForm.processing}>Confirm</PrimaryButton>
                            <SecondaryButton type="button" onClick={() => setPrompt('disable')}>
                                Cancel setup
                            </SecondaryButton>
                        </div>
                    </form>
                </div>
            )}

            {twoFactor.recoveryCodes && (
                <div className="mt-4 rounded-2xl bg-clay-gold/15 border border-clay-gold/40 p-4">
                    <p className="text-xs font-bold text-clay-charcoal">
                        Save these recovery codes somewhere safe. Each one can be used once to log in if you
                        lose your phone. They won't be shown again.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm font-bold text-clay-charcoal">
                        {twoFactor.recoveryCodes.map((code) => (
                            <div key={code}>{code}</div>
                        ))}
                    </div>
                </div>
            )}

            {prompt === 'enable' && (
                <PasswordPrompt
                    label="Confirm your password to start setup"
                    buttonText="Continue"
                    onSubmit={run('post', route('two-factor.enable'))}
                    onCancel={() => setPrompt(null)}
                />
            )}

            {prompt === 'recovery' && (
                <PasswordPrompt
                    label="Confirm your password to create new recovery codes"
                    buttonText="Generate new codes"
                    onSubmit={run('post', route('two-factor.recovery-codes'))}
                    onCancel={() => setPrompt(null)}
                />
            )}

            {prompt === 'disable' && (
                <PasswordPrompt
                    label="Confirm your password to turn off two-factor authentication"
                    buttonText="Turn off"
                    danger
                    onSubmit={run('delete', route('two-factor.disable'))}
                    onCancel={() => setPrompt(null)}
                />
            )}

            {!prompt && !twoFactor.pending && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    {twoFactor.enabled ? (
                        <>
                            <SecondaryButton type="button" onClick={() => setPrompt('recovery')}>
                                New recovery codes
                            </SecondaryButton>
                            <DangerButton type="button" onClick={() => setPrompt('disable')}>
                                Turn off
                            </DangerButton>
                        </>
                    ) : (
                        <PrimaryButton type="button" onClick={() => setPrompt('enable')}>
                            Turn on
                        </PrimaryButton>
                    )}
                </div>
            )}
        </section>
    );
}
