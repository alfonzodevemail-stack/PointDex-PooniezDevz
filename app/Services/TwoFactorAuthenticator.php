<?php

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthenticator
{
    public function __construct(private Google2FA $engine = new Google2FA())
    {
    }

    public function generateSecret(): string
    {
        return $this->engine->generateSecretKey(32);
    }

    /**
     * @return list<string>
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        return collect(range(1, $count))
            ->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))
            ->all();
    }

    public function qrCodeSvg(User $user): string
    {
        $url = $this->engine->getQRCodeUrl(
            config('app.name', 'PointDex'),
            $user->email,
            $user->two_factor_secret
        );

        $writer = new Writer(new ImageRenderer(new RendererStyle(192, 1), new SvgImageBackEnd()));

        return $writer->writeString($url);
    }

    /**
     * Verify a 6-digit authenticator code. Each code can only be used once.
     */
    public function verifyCode(User $user, string $code): bool
    {
        $code = preg_replace('/\s+/', '', $code);

        if (! $user->two_factor_secret || ! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $cacheKey = 'two-factor-last-timestamp:'.$user->getKey();

        $timestamp = $this->engine->verifyKeyNewer(
            $user->two_factor_secret,
            $code,
            Cache::get($cacheKey, 0),
            1
        );

        if ($timestamp === false) {
            return false;
        }

        Cache::put($cacheKey, $timestamp, now()->addMinutes(5));

        return true;
    }

    /**
     * Verify and consume a single-use recovery code.
     */
    public function useRecoveryCode(User $user, string $code): bool
    {
        $code = Str::lower(trim($code));
        $codes = $user->two_factor_recovery_codes ?? [];

        foreach ($codes as $index => $stored) {
            if (hash_equals($stored, $code)) {
                unset($codes[$index]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

                return true;
            }
        }

        return false;
    }
}
