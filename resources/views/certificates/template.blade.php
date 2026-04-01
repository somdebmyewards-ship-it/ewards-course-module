<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
  @page { margin: 18px; size: A4 landscape; }
  body { font-family: DejaVu Sans, sans-serif; margin: 0; padding: 0; color: #1a0035; }
</style>
</head>
<body>

{{-- OUTER BORDER --}}
<div style="border: 4px solid #4B0082; padding: 4px;">
<div style="border: 1.5px solid #9B59B6; padding: 0;">

  {{-- ═══ HEADER ═══ --}}
  <div style="background: #4B0082; text-align: center; padding: 16px 0 14px;">
    {{-- Logo on white pill --}}
    <img src="{{ public_path('ewards-logo.png') }}" style="height: 40px; background: #ffffff; padding: 8px 28px 6px;" /><br/>
    <span style="font-size: 13px; font-weight: bold; color: #ffffff; letter-spacing: 4px;">LEARNING HUB</span><br/>
    <span style="font-size: 7px; color: #b8a0d4; letter-spacing: 2px;">PRODUCT TRAINING &amp; CERTIFICATION PLATFORM</span>
  </div>

  {{-- Gold accent line --}}
  <div style="height: 3px; background: #D4A843;"></div>

  {{-- ═══ BODY ═══ --}}
  <div style="text-align: center; padding: 16px 50px 10px; background: #ffffff; min-height: 270px;">


    {{-- Badge --}}
    <div style="margin-bottom: 6px;">
      <span style="display: inline-block; background: #f3ebfc; border: 1.5px solid #c7a8e8; padding: 4px 22px; font-size: 8px; font-weight: bold; color: #6B2FA0; letter-spacing: 2.5px;">
        @if(($certificate_type ?? 'path') === 'expert')
          ★ EXPERT ACHIEVEMENT
        @elseif(($certificate_type ?? 'path') === 'module')
          ✓ MODULE CERTIFICATE
        @else
          ✦ FULL PATH COMPLETION
        @endif
      </span>
    </div>

    {{-- Subtitle --}}
    <div style="font-size: 8px; color: #9B59B6; letter-spacing: 4px; margin-top: 6px;">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>

    {{-- Title --}}
    <div style="font-size: 28px; font-weight: bold; color: #4B0082; letter-spacing: 1px; margin-top: 4px;">Certificate of Completion</div>

    {{-- Gold divider --}}
    <div style="width: 180px; border-bottom: 2px solid #D4A843; margin: 6px auto;"></div>

    {{-- Awarded to --}}
    <div style="font-size: 8px; color: #aaa; letter-spacing: 2px; margin-bottom: 2px;">AWARDED TO</div>

    {{-- ★ USER NAME ★ --}}
    <div style="font-size: 42px; font-weight: bold; color: #1a0035; line-height: 1.15;">{{ $user_name }}</div>

    {{-- Name underline with diamond --}}
    <div style="width: 300px; margin: 2px auto 8px;">
      <div style="border-bottom: 2px solid #6B2FA0;"></div>
    </div>

    {{-- Description --}}
    <div style="font-size: 10px; color: #555; line-height: 1.7; max-width: 550px; margin: 0 auto 6px;">
      for successfully completing all required training modules on the
      <strong style="color: #4B0082;">eWards Learning Platform</strong>
      and demonstrating proficiency in eWards products, features and operations.
    </div>

    {{-- Module names --}}
    @if($completed_modules->isNotEmpty())
    <div style="margin-top: 8px;">
      <div style="font-size: 7px; color: #aaa; letter-spacing: 2px; margin-bottom: 2px;">MODULES COMPLETED</div>
      @foreach($completed_modules->take(4) as $modName)
        <span style="display: inline-block; background: #f3ebfc; border: 1px solid #d4c4e8; padding: 3px 14px; font-size: 8px; font-weight: bold; color: #6B2FA0; letter-spacing: 0.5px; margin: 2px 3px;">
          {{ $modName }}
        </span>
      @endforeach
      @if($completed_modules->count() > 4)
        <span style="font-size: 8px; color: #999;">+{{ $completed_modules->count() - 4 }} more</span>
      @endif
    </div>
    @endif


  </div>

  {{-- Gold accent line --}}
  <div style="height: 3px; background: #D4A843;"></div>

  {{-- ═══ FOOTER ═══ --}}
  <div style="background: #4B0082; color: #ffffff; text-align: center; padding: 10px 20px 6px;">

    <span style="display: inline-block; width: 19%; text-align: center; vertical-align: top;">
      <span style="font-size: 13px; font-weight: bold; color: #e8d5ff;">{{ $issued_at }}</span><br/>
      <span style="display: inline-block; width: 80px; border-bottom: 1px solid #D4A843; margin: 4px 0 3px;"></span><br/>
      <span style="font-size: 6.5px; color: #b8a0d4; letter-spacing: 1.5px;">DATE OF ISSUE</span>
    </span>

    <span style="display: inline-block; width: 15%; text-align: center; vertical-align: top;">
      <span style="font-size: 13px; font-weight: bold; color: #e8d5ff;">{{ $total_points }} pts</span><br/>
      <span style="display: inline-block; width: 60px; border-bottom: 1px solid #D4A843; margin: 4px 0 3px;"></span><br/>
      <span style="font-size: 6.5px; color: #b8a0d4; letter-spacing: 1.5px;">POINTS EARNED</span>
    </span>

    <span style="display: inline-block; width: 16%; text-align: center; vertical-align: top;">
      <span style="font-size: 28px; color: #D4A843;">★</span><br/>
      <span style="font-size: 6.5px; color: #D4A843; letter-spacing: 1.5px; font-weight: bold;">CERTIFIED</span>
    </span>

    <span style="display: inline-block; width: 15%; text-align: center; vertical-align: top;">
      <span style="font-size: 13px; font-weight: bold; color: #e8d5ff;">
        @if(($certificate_type ?? 'path') === 'expert') Expert
        @elseif(($certificate_type ?? 'path') === 'module') Module
        @else Full Path
        @endif
      </span><br/>
      <span style="display: inline-block; width: 60px; border-bottom: 1px solid #D4A843; margin: 4px 0 3px;"></span><br/>
      <span style="font-size: 6.5px; color: #b8a0d4; letter-spacing: 1.5px;">ACHIEVEMENT</span>
    </span>

    <span style="display: inline-block; width: 19%; text-align: center; vertical-align: top;">
      <span style="font-size: 12px; font-weight: bold; color: #e8d5ff;">eWards Training Team</span><br/>
      <span style="display: inline-block; width: 100px; border-bottom: 1px solid #D4A843; margin: 4px 0 3px;"></span><br/>
      <span style="font-size: 6.5px; color: #b8a0d4; letter-spacing: 1.5px;">AUTHORISED SIGNATORY</span>
    </span>

    <div style="font-size: 6px; color: #7B35B8; letter-spacing: 1.5px; margin-top: 4px;">
      CERTIFICATE ID: {{ $certificate_id }}
    </div>
  </div>

</div>
</div>

</body>
</html>
