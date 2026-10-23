<?php

namespace App\Http\Controllers;

use App\Services\TwoFactorAuthenticator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TwoFactorAuthenticationController extends Controller
{
    /**
     * Start setup: create a secret the user scans into their authenticator app.
     */
    public function store(Request $request, TwoFactorAuthenticator $twoFactor): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $request->user()->forceFill([
            'two_factor_secret' => $twoFactor->generateSecret(),
            'two_factor_recovery_codes' => $twoFactor->generateRecoveryCodes(),
            'two_factor_confirmed_at' => null,
        ])->save();

        return back()->with('status', 'two-factor-pending');
    }

    /**
     * Finish setup once the user proves their app produces valid codes.
     */
    public function confirm(Request $request, TwoFactorAuthenticator $twoFactor): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret || ! $twoFactor->verifyCode($user, (string) $request->input('code'))) {
            throw ValidationException::withMessages([
                'code' => 'The code is invalid. Check the time on your phone and try a fresh code.',
            ]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();

        return back()->with('status', 'two-factor-enabled');
    }

    public function regenerateRecoveryCodes(Request $request, TwoFactorAuthenticator $twoFactor): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $request->user()->forceFill([
            'two_factor_recovery_codes' => $twoFactor->generateRecoveryCodes(),
        ])->save();

        return back()->with('status', 'recovery-codes-generated');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return back()->with('status', 'two-factor-disabled');
    }
}
