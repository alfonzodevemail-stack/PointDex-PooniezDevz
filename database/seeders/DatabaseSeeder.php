<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Alfonzo Balagapo',
            'email' => 'alfonzo@pointdex.test',
            'password' => bcrypt('password'),
        ]);

        \App\Models\GestureSetting::create([
            'user_id' => $user->id,
            'sensitivity' => 5,
            'cooldown_ms' => 800,
            'swipe_pixel_threshold' => 60,
            'fist_hold_seconds' => 1.5,
            'show_landmark_canvas' => true,
            'audio_feedback' => true,
        ]);
    }
}
