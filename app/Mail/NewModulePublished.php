<?php

namespace App\Mail;

use App\Models\TrainingModule;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewModulePublished extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public TrainingModule $module,
        public string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Training Module: {$this->module->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-module-published',
        );
    }
}
