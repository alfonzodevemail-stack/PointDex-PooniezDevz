import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a link to choose a new one."
        >
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    icon={Mail}
                    placeholder="you@example.com"
                    value={data.email}
                    isFocused={true}
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm disabled:opacity-60"
                >
                    {processing ? 'Sending...' : 'Email me a reset link'}
                </button>
            </form>

            <p className="mt-6 text-center text-xs font-semibold text-clay-charcoal/70">
                Remembered it?{' '}
                <Link href={route('login')} className="font-black text-clay-charcoal underline decoration-clay-gold decoration-2 underline-offset-2">
                    Back to login
                </Link>
            </p>
        </GuestLayout>
    );
}
