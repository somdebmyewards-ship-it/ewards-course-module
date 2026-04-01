<?php

/**
 * eWards Learning Hub — LMS-specific configuration.
 * All env-dependent values should live here so controllers use config() only.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Admin Notification Email
    |--------------------------------------------------------------------------
    */
    'admin_notification_email' => env('ADMIN_NOTIFICATION_EMAIL', 'admin@ewards.com'),

    /*
    |--------------------------------------------------------------------------
    | Upload Limits
    |--------------------------------------------------------------------------
    */
    'upload_max_size_mb' => (int) env('UPLOAD_MAX_SIZE', 500),

    'upload_allowed_types' => explode(',', env(
        'UPLOAD_ALLOWED_TYPES',
        'mp4,webm,mov,avi,pdf,png,jpg,jpeg,gif,doc,docx,xls,xlsx,ppt,pptx'
    )),

    /*
    |--------------------------------------------------------------------------
    | Certificate
    |--------------------------------------------------------------------------
    */
    'certificate_company_name' => env('CERTIFICATE_COMPANY_NAME', 'eWards'),
    'certificate_signatory'    => env('CERTIFICATE_SIGNATORY', 'eWards Training Team'),

];
