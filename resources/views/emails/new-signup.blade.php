<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f0fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(107,47,160,0.1); }
        .header { background: linear-gradient(135deg, #6B2FA0, #9B59B6); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .user-card { background: #f9f5ff; border: 1px solid #e8d5f5; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .field { margin-bottom: 12px; }
        .field-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .field-value { font-size: 16px; color: #333; font-weight: 600; }
        .actions { text-align: center; margin: 28px 0 12px; }
        .btn { display: inline-block; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 6px; }
        .btn-approve { background: #6B2FA0; color: #fff; }
        .btn-view { background: #f0f0f0; color: #333; }
        .footer { text-align: center; padding: 20px 32px; background: #fafafa; border-top: 1px solid #f0f0f0; }
        .footer p { margin: 0; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Signup Request</h1>
            <p>A new user wants to join eWards Learning Hub</p>
        </div>
        <div class="body">
            <p style="color: #666; font-size: 15px;">Hello Admin,</p>
            <p style="color: #666; font-size: 15px;">A new user has registered and is waiting for your approval.</p>

            <div class="user-card">
                <div class="field">
                    <div class="field-label">Name</div>
                    <div class="field-value">{{ $newUser->name }}</div>
                </div>
                <div class="field">
                    <div class="field-label">Email</div>
                    <div class="field-value">{{ $newUser->email }}</div>
                </div>
                @if($newUser->mobile)
                <div class="field">
                    <div class="field-label">Mobile</div>
                    <div class="field-value">{{ $newUser->mobile }}</div>
                </div>
                @endif
                <div class="field">
                    <div class="field-label">Role / Designation</div>
                    <div class="field-value">{{ $newUser->role }} {{ $newUser->designation ? '— ' . $newUser->designation : '' }}</div>
                </div>
                @if($newUser->merchant_name_entered)
                <div class="field">
                    <div class="field-label">Merchant</div>
                    <div class="field-value">{{ $newUser->merchant_name_entered }}</div>
                </div>
                @endif
                @if($newUser->outlet_name_entered)
                <div class="field">
                    <div class="field-label">Outlet</div>
                    <div class="field-value">{{ $newUser->outlet_name_entered }}</div>
                </div>
                @endif
                @if($newUser->ewards_reference)
                <div class="field">
                    <div class="field-label">eWards Reference</div>
                    <div class="field-value">{{ $newUser->ewards_reference }}</div>
                </div>
                @endif
                <div class="field" style="margin-bottom: 0;">
                    <div class="field-label">Registered At</div>
                    <div class="field-value">{{ $newUser->created_at->format('d M Y, h:i A') }}</div>
                </div>
            </div>

            <div class="actions">
                <a href="{{ $approveUrl }}" class="btn btn-approve">Review & Approve</a>
                <a href="{{ $approveUrl }}" class="btn btn-view">View All Pending</a>
            </div>

            <p style="color: #999; font-size: 13px; text-align: center;">
                Log in to the Admin panel to approve or reject this request.
            </p>
        </div>
        <div class="footer">
            <p>eWards Learning Hub — Guided Help & Certification</p>
        </div>
    </div>
</body>
</html>
