import PointDexLayout from '@/Layouts/PointDexLayout';
import { Head, usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import TwoFactorAuthenticationForm from './Partials/TwoFactorAuthenticationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function SectionCard({ icon: Icon, tone = 'default', children }) {
    return (
        <div className={`clay-card p-6 sm:p-7 ${tone === 'danger' ? 'ring-1 ring-red-200' : ''}`}>
            <div
                className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center ${
                    tone === 'danger' ? 'bg-red-600 text-white' : 'clay-btn-dark'
                }`}
            >
                <Icon className={`w-5 h-5 ${tone === 'danger' ? '' : 'text-clay-gold'}`} />
            </div>
            {children}
        </div>
    );
}

export default function Edit({ mustVerifyEmail, status, twoFactor }) {
    const user = usePage().props.auth.user;
    const initials = user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : null;

    return (
        <PointDexLayout title="Profile">
            <Head title="Profile & Security - PointDex" />

            <div className="space-y-6">
                {/* Account summary */}
                <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-full clay-btn-dark border-2 border-clay-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-black text-clay-gold">{initials || '?'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-black text-clay-charcoal truncate">{user.name}</h1>
                        <p className="text-xs font-semibold text-clay-charcoal/70 truncate">{user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    twoFactor.enabled ? 'bg-emerald-600 text-white' : 'bg-clay-gold text-clay-charcoal'
                                }`}
                            >
                                {twoFactor.enabled ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                {twoFactor.enabled ? 'Two-factor on' : 'Two-factor off'}
                            </span>
                            {memberSince && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-clay-charcoal text-clay-cream">
                                    Member since {memberSince}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6">
                        <SectionCard icon={UserRound}>
                            <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                        </SectionCard>

                        <SectionCard icon={KeyRound}>
                            <UpdatePasswordForm />
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <SectionCard icon={ShieldCheck}>
                            <TwoFactorAuthenticationForm twoFactor={twoFactor} />
                        </SectionCard>

                        <SectionCard icon={Trash2} tone="danger">
                            <DeleteUserForm />
                        </SectionCard>
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}
