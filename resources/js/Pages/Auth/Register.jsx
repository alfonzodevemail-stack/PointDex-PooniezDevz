import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

function passwordStrength(password) {
    if (password.length < 8) return 0;
    let score = 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score++;
    return score;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const strength = passwordStrength(data.password);
    const mismatch = data.password_confirmation && data.password !== data.password_confirmation;

    return (
        <GuestLayout
            showTabs
            title="Create your account"
            subtitle="Sign up to upload decks and present them hands-free."
        >
            <Head title="Sign up" />

            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    id="name"
                    name="name"
                    label="Full name"
                    icon={User}
                    placeholder="Juan Dela Cruz"
                    value={data.name}
                    autoComplete="name"
                    isFocused={true}
                    required
                    error={errors.name}
                    onChange={(e) => setData('name', e.target.value)}
                />

                <AuthInput
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    icon={Mail}
                    placeholder="you@example.com"
                    value={data.email}
                    autoComplete="username"
                    required
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <div>
                    <AuthInput
                        id="password"
                        type="password"
                        name="password"
                        label="Password"
                        icon={Lock}
                        placeholder="At least 8 characters"
                        value={data.password}
                        autoComplete="new-password"
                        required
                        error={errors.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {data.password && (
                        <div className="mt-2 flex items-center space-x-2">
                            <div className="grid flex-1 grid-cols-4 gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                    <span
                                        key={level}
                                        className={`h-1.5 rounded-full transition-colors ${
                                            strength >= level
                                                ? strength >= 3 ? 'bg-emerald-600' : 'bg-clay-gold'
                                                : 'bg-clay-gray/60'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="w-16 text-right text-[10px] font-bold text-clay-charcoal/70">
                                {STRENGTH_LABELS[strength]}
                            </span>
                        </div>
                    )}
                </div>

                <AuthInput
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    label="Confirm password"
                    icon={Lock}
                    placeholder="Type it again"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    required
                    error={errors.password_confirmation || (mismatch ? 'Passwords do not match yet.' : null)}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm inline-flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                    <span>{processing ? 'Creating account...' : 'Create account'}</span>
                    {!processing && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>

            <p className="mt-6 text-center text-xs font-semibold text-clay-charcoal/70">
                Already have an account?{' '}
                <Link href={route('login')} className="font-black text-clay-charcoal underline decoration-clay-gold decoration-2 underline-offset-2">
                    Log in
                </Link>
            </p>
        </GuestLayout>
    );
}
