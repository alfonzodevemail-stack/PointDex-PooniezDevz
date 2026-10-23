import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verify your email"
            subtitle="Thanks for signing up! Click the link we just emailed you to get started. Didn't get it? We'll gladly send another."
        >
            <Head title="Email Verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm disabled:opacity-60"
                >
                    {processing ? 'Sending...' : 'Resend verification email'}
                </button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="clay-btn-light w-full py-2.5 text-xs"
                >
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}
