<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Training Module: {{ $module->title }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f0ff; color: #1a1a2e; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(107,47,160,0.10); }
    .header { background: linear-gradient(135deg, #3b0d6e 0%, #6B2FA0 60%, #9B59B6 100%); padding: 36px 40px 28px; text-align: center; }
    .header-logo { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .header h1 { font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3; }
    .banner { width: 100%; height: 200px; object-fit: cover; display: block; }
    .banner-placeholder { width: 100%; height: 160px; background: linear-gradient(135deg, #ede4ff 0%, #d4b8ff 100%); display: flex; align-items: center; justify-content: center; font-size: 56px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 15px; color: #555; margin-bottom: 20px; }
    .module-title { font-size: 24px; font-weight: 800; color: #3b0d6e; margin-bottom: 12px; line-height: 1.3; }
    .module-desc { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 28px; }
    .meta-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .meta-pill { background: #f4f0ff; border: 1px solid #d4b8ff; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #6B2FA0; }
    .cta-wrap { text-align: center; margin-bottom: 32px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #4a1080, #6B2FA0); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
    .footer { background: #faf7ff; border-top: 1px solid #ede4ff; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.6; }
    .footer a { color: #6B2FA0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <div class="header-logo">eWards Learning Hub</div>
      <h1>✨ New Module Available</h1>
    </div>

    <!-- Cover image or placeholder -->
    @if($module->cover_image)
      <img src="{{ asset('storage/' . $module->cover_image) }}" alt="{{ $module->title }}" class="banner" />
    @else
      <div class="banner-placeholder">{{ $module->icon ?: '📚' }}</div>
    @endif

    <!-- Body -->
    <div class="body">

      <p class="greeting">Hi {{ $recipientName }},</p>

      <div class="module-title">{{ $module->title }}</div>
      <p class="module-desc">{{ $module->description }}</p>

      <div class="meta-row">
        @if($module->points_reward)
          <span class="meta-pill">⚡ {{ $module->points_reward }} pts on completion</span>
        @endif
        @if($module->estimated_minutes)
          <span class="meta-pill">⏱ ~{{ $module->estimated_minutes }} min</span>
        @endif
        @if($module->quiz_enabled)
          <span class="meta-pill">📝 Includes quiz</span>
        @endif
        @if($module->certificate_enabled)
          <span class="meta-pill">🎓 Certificate</span>
        @endif
      </div>

      <div class="cta-wrap">
        <a href="{{ config('app.url') }}/learning-hub/{{ $module->slug }}" class="cta">
          Start Learning →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        You're receiving this because you're registered on the eWards Learning Hub.<br />
        <a href="{{ config('app.url') }}/learning-hub">View all modules</a>
      </p>
    </div>

  </div>
</body>
</html>
