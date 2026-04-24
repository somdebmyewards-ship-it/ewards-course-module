<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['code' => 'first_section',      'name' => 'First Step',        'icon_emoji' => '👣', 'description' => 'Completed your very first learning section'],
            ['code' => 'first_module',        'name' => 'Module Master',     'icon_emoji' => '📚', 'description' => 'Completed your first full training module'],
            ['code' => 'first_cert',          'name' => 'Certified!',        'icon_emoji' => '🎓', 'description' => 'Earned your first certificate'],
            ['code' => 'quiz_first_attempt',  'name' => 'Quiz Ace',          'icon_emoji' => '⚡', 'description' => 'Passed a quiz on the very first attempt'],
            ['code' => 'quiz_perfect',        'name' => 'Perfect Score',     'icon_emoji' => '💯', 'description' => 'Scored 100% on a quiz'],
            ['code' => 'feedback_giver',      'name' => 'Feedback Giver',    'icon_emoji' => '💬', 'description' => 'Submitted feedback on 3 or more modules'],
            ['code' => 'top_10',              'name' => 'Top 10',            'icon_emoji' => '🏆', 'description' => 'Ranked in the top 10 on the company leaderboard'],
            ['code' => 'points_100',          'name' => 'Century',           'icon_emoji' => '💪', 'description' => 'Earned 100 or more points'],
            ['code' => 'points_500',          'name' => 'Expert Achiever',   'icon_emoji' => '🌟', 'description' => 'Earned 500 or more points'],
        ];

        foreach ($badges as $badge) {
            DB::table('lms_badges')->updateOrInsert(
                ['code' => $badge['code']],
                array_merge($badge, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
