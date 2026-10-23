<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorAuthenticator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    /**
     * Show the second login step (authenticator or recovery code).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if (! $this->challengedUser($request)) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    /**
     * Verify the code and finish logging the user in.
     */
    public function store(Request $request, TwoFactorAuthenticator $twoFactor): RedirectResponse
    {
        $user = $this->challengedUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        $request->validate([
            'code' => ['nullable', 'string', 'required_without:recovery_code'],
            'recovery_code' => ['nullable', 'string', 'required_without:code'],
        ]);

        $throttleKey = 'two-factor:'.$user->getKey().'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw ValidationException::withMessages([
                'code' => trans('auth.throttle', [
                    'seconds' => RateLimiter::availableIn($throttleKey),
                    'minutes' => ceil(RateLimiter::availableIn($throttleKey) / 60),
                ]),
            ]);
        }

        $valid = $request->filled('recovery_code')
            ? $twoFactor->useRecoveryCode($user, (string) $request->input('recovery_code'))
            : $twoFactor->verifyCode($user, (string) $request->input('code'));

        if (! $valid) {
            RateLimiter::hit($throttleKey);

            $field = $request->filled('recovery_code') ? 'recovery_code' : 'code';

            throw ValidationException::withMessages([
                $field => $field === 'code'
                    ? 'The authentication code is invalid or has already been used.'
                    : 'The recovery code is invalid.',
            ]);
        }

        RateLimiter::clear($throttleKey);

        $remember = (bool) $request->session()->pull('login.remember', false);
        $request->session()->forget('login.id');

        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function challengedUser(Request $request): ?User
    {
        $id = $request->session()->get('login.id');
        $user = $id ? User::find($id) : null;

        return $user?->hasEnabledTwoFactorAuthentication() ? $user : null;
    }
}
