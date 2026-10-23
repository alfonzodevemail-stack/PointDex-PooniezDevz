import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Choose a new password" subtitle="Pick something you haven't used before.">
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    icon={Mail}
                    value={data.email}
                    autoComplete="username"
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <AuthInput
                    id="password"
                    type="password"
                    name="password"
                    label="New password"
                    icon={Lock}
                    value={data.password}
                    autoComplete="new-password"
                    isFocused={true}
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                />

                <AuthInput
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    label="Confirm new password"
                    icon={Lock}
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    error={errors.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm disabled:opacity-60"
                >
                    {processing ? 'Saving...' : 'Reset password'}
                </button>
            </form>
        </GuestLayout>
    );
}
