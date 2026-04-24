<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | In production, set CORS_ALLOWED_ORIGINS to your Vercel frontend URL.
    | Example: CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
    | Multiple origins: CORS_ALLOWED_ORIGINS=https://app.vercel.app,https://custom-domain.com
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', '*'))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
