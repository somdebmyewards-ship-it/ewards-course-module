<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MediaStreamController;

// Range-enabled media streaming for locally-stored uploads (videos, audio, etc.).
// Cloud-hosted assets (Cloudinary / S3) bypass this — their URLs are absolute.
// Path pattern: /media/{anything-including-slashes}.{ext}
Route::get('/media/{path}', [MediaStreamController::class, 'stream'])
    ->where('path', '.*')
    ->name('media.stream');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|api/v1|up|media).*$');
