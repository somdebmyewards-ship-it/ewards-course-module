<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewSignupNotification extends Mailable
{
    use Queueable, SerializesModels;

    public User $newUser;
    public string $approveUrl;
    public string $rejectUrl;

    public function __construct(User $newUser)
    {
        $this->newUser = $newUser;
        $baseUrl = config('app.url');
        $this->approveUrl = $baseUrl . '/pending-approvals';
        $this->rejectUrl = $baseUrl . '/pending-approvals';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Signup Request — ' . $this->newUser->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-signup',
        );
    }
}
