<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(90deg, #6B2FA0, #3023ae); padding: 32px 40px; text-align: center; }
    .header img { height: 28px; }
    .body { padding: 40px; color: #333; }
    .body h2 { margin: 0 0 12px; color: #1a1a1a; font-size: 22px; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #555; }
    .btn { display: inline-block; background: #6B2FA0; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0 24px; }
    .note { font-size: 13px; color: #999; }
    .footer { background: #f9f9fb; padding: 20px 40px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png" alt="eWards" />
    </div>
    <div class="body">
      <h2>Reset your password</h2>
      <p>Hi {{ $userName }},</p>
      <p>We received a request to reset your eWards Learning Hub password. Click the button below to choose a new password. This link expires in 60 minutes.</p>
      <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
      <p class="note">If you did not request a password reset, you can ignore this email — your account remains secure.</p>
      <p class="note">If the button doesn't work, copy and paste this URL into your browser:<br />{{ $resetUrl }}</p>
    </div>
    <div class="footer">eWards Learning Hub &bull; This is an automated message, please do not reply.</div>
  </div>
</body>
</html>
