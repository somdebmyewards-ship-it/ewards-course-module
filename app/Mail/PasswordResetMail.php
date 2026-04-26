<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PasswordResetMail extends Mailable
{
    public string $resetUrl;
    public string $userName;

    public function __construct(string $email, string $token, string $userName)
    {
        $this->userName = $userName;
        $this->resetUrl = config('app.url') . '/reset-password?token=' . $token . '&email=' . urlencode($email);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reset your eWards Learning Hub password');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.password-reset');
    }
}
