<?php
use Illuminate\Support\Facades\Route;

// Named login route so Sanctum's unauthenticated redirect doesn't throw RouteNotFoundException
Route::get('/login', function () {
    return view('app');
})->name('login');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
