<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TrainingModuleFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'title' => ucwords($title),
            'slug' => Str::slug($title),
            'description' => fake()->sentence(),
            'icon' => '📚',
            'display_order' => fake()->numberBetween(1, 100),
            'video_url' => '',
            'points_reward' => 10,
            'is_published' => true,
        ];
    }
}
