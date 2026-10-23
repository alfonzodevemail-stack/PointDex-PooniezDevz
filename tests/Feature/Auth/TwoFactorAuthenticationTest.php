<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithTwoFactor(): User
    {
        $user = User::factory()->create();
        $user->forceFill([
            'two_factor_secret' => (new Google2FA())->generateSecretKey(32),
            'two_factor_recovery_codes' => ['aaaaa-bbbbb', 'ccccc-ddddd'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        return $user;
    }

    public function test_two_factor_can_be_enabled_and_confirmed(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/user/two-factor', ['password' => 'password'])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertFalse($user->hasEnabledTwoFactorAuthentication());

        $this->actingAs($user)->get('/profile')->assertOk();

        $code = (new Google2FA())->getCurrentOtp($user->two_factor_secret);

        $this->actingAs($user)
            ->post('/user/two-factor/confirm', ['code' => $code])
            ->assertSessionHasNoErrors();

        $this->assertTrue($user->refresh()->hasEnabledTwoFactorAuthentication());
    }

    public function test_enabling_requires_the_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/user/two-factor', ['password' => 'wrong-password'])
            ->assertSessionHasErrors('password');

        $this->assertNull($user->refresh()->two_factor_secret);
    }

    public function test_login_requires_a_code_when_two_factor_is_enabled(): void
    {
        $user = $this->userWithTwoFactor();

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('two-factor.login'));

        $this->assertGuest();

        $this->post('/two-factor-challenge', ['code' => '000000'])
            ->assertSessionHasErrors('code');
        $this->assertGuest();

        $code = (new Google2FA())->getCurrentOtp($user->two_factor_secret);

        $this->post('/two-factor-challenge', ['code' => $code])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_a_code_cannot_be_reused(): void
    {
        $user = $this->userWithTwoFactor();
        $code = (new Google2FA())->getCurrentOtp($user->two_factor_secret);

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['code' => $code]);
        $this->assertAuthenticatedAs($user);

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $this->post('/two-factor-challenge', ['code' => $code])
            ->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_a_recovery_code_logs_in_once(): void
    {
        $user = $this->userWithTwoFactor();

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['recovery_code' => 'aaaaa-bbbbb']);

        $this->assertAuthenticatedAs($user);
        $this->assertSame(['ccccc-ddddd'], $user->refresh()->two_factor_recovery_codes);
    }

    public function test_challenge_page_requires_a_pending_login(): void
    {
        $this->get('/two-factor-challenge')->assertRedirect(route('login'));
    }

    public function test_two_factor_can_be_disabled(): void
    {
        $user = $this->userWithTwoFactor();

        $this->actingAs($user)
            ->delete('/user/two-factor', ['password' => 'password'])
            ->assertSessionHasNoErrors();

        $this->assertFalse($user->refresh()->hasEnabledTwoFactorAuthentication());
        $this->assertNull($user->two_factor_secret);
    }
}
