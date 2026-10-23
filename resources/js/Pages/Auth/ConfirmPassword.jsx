import AuthInput from '@/Components/AuthInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Confirm your password"
            subtitle="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    id="password"
                    type="password"
                    name="password"
                    label="Password"
                    icon={Lock}
                    value={data.password}
                    isFocused={true}
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="clay-btn-gold w-full py-3 text-sm disabled:opacity-60"
                >
                    {processing ? 'Checking...' : 'Confirm'}
                </button>
            </form>
        </GuestLayout>
    );
}
