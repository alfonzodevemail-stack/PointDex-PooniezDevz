import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function TwoFactorChallenge() {
    const [useRecovery, setUseRecovery] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        recovery_code: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('two-factor.login'), {
            onFinish: () => reset('code', 'recovery_code'),
        });
    };

    const toggleMode = () => {
        setUseRecovery(!useRecovery);
        clearErrors();
        reset();
    };

    return (
        <GuestLayout
            title="Two-step verification"
            subtitle={
                useRecovery
                    ? 'Enter one of the recovery codes you saved when you turned on two-factor authentication.'
                    : 'Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy...) and enter the 6-digit code for PointDex.'
            }
        >
            <Head title="Two-Factor Authentication" />

            <form onSubmit={submit} className="space-y-4">
                {useRecovery ? (
                    <AuthInput
                        key="recovery"
                        id="recovery_code"
                        name="recovery_code"
                        label="Recovery code"
                        icon={KeyRound}
                        placeholder="abcde-12345"
                        value={data.recovery_code}
                        autoComplete="one-time-code"
                        isFocused={true}
                        error={errors.recovery_code}
                        onChange={(e) => setData('recovery_code', e.target.value)}
                    />
                ) : (
                    <AuthInput
                        key="code"
                        id="code"
                        name="code"
                        label="Authentication code"
                        icon={ShieldCheck}
                        placeholder="123456"
                        inputMode="numeric"
                        maxLength={6}
                        value={data.code}
                        autoComplete="one-time-code"
                        isFocused={true}
                        error={errors.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                    />
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm disabled:opacity-60"
                >
                    {processing ? 'Verifying...' : 'Verify'}
                </button>

                <div className="flex items-center justify-between text-xs font-bold">
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="text-clay-charcoal/70 underline decoration-clay-gold decoration-2 underline-offset-2 hover:text-clay-charcoal"
                    >
                        {useRecovery ? 'Use an authentication code' : 'Use a recovery code'}
                    </button>

                    <Link href={route('login')} className="text-clay-charcoal/60 hover:text-clay-charcoal">
                        Back to login
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
