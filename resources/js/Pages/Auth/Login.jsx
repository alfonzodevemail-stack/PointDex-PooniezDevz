import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            showTabs
            title="Welcome back"
            subtitle="Log in to pick up your decks and get presenting."
        >
            <Head title="Log in" />

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
                    autoComplete="username"
                    isFocused={true}
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <AuthInput
                    id="password"
                    type="password"
                    name="password"
                    label="Password"
                    icon={Lock}
                    placeholder="Your password"
                    value={data.password}
                    autoComplete="current-password"
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-clay-gray text-clay-charcoal focus:ring-clay-gold"
                        />
                        <span className="text-xs font-semibold text-clay-charcoal/80">Remember me</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs font-bold text-clay-charcoal/70 underline decoration-clay-gold decoration-2 underline-offset-2 hover:text-clay-charcoal"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm inline-flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                    <span>{processing ? 'Logging in...' : 'Log in'}</span>
                    {!processing && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>

            <p className="mt-6 text-center text-xs font-semibold text-clay-charcoal/70">
                New to PointDex?{' '}
                <Link href={route('register')} className="font-black text-clay-charcoal underline decoration-clay-gold decoration-2 underline-offset-2">
                    Create an account
                </Link>
            </p>
        </GuestLayout>
    );
}
