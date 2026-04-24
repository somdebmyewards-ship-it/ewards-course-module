<?php

namespace Database\Factories;

use App\Models\TrainingQuiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrainingQuizFactory extends Factory
{
    protected $model = TrainingQuiz::class;

    public function definition(): array
    {
        $options = ['A', 'B', 'C', 'D'];
        $correct = fake()->randomElement($options);

        return [
            'module_id'      => null,
            'question'       => fake()->sentence() . '?',
            'options'        => $options,
            'correct_answer' => $correct,
            'explanation'    => fake()->sentence(),
            'display_order'  => fake()->numberBetween(1, 10),
        ];
    }
}
