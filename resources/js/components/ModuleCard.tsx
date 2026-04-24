import React from 'react';

// ── Helpers ──
const isIconUrl = (icon?: string | null) =>
  icon && (icon.startsWith('http') || icon.startsWith('/storage') || icon.startsWith('data:'));

const ModuleIcon = ({ icon, size = 28 }: { icon?: string | null; size?: number }) =>
  isIconUrl(icon)
    ? <img src={icon!} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: size > 30 ? 10 : 6 }} />
    : <span style={{ fontSize: size }}>{icon || '\u{1F4DA}'}</span>;

// ── Types ──
export interface ModuleProgress {
  help_viewed?: boolean;
  checklist_completed?: boolean;
  quiz_completed?: boolean;
  quiz_score?: number;
  module_completed?: boolean;
  viewed_sections_count?: number;
}

export interface ModuleData {
  id: number;
  title: string;
  slug: string;
  description?: string;
  icon?: string | null;
  sections_count?: number;
  quizzes_count?: number;
  estimated_minutes?: number | null;
  quiz_enabled?: boolean;
  progress?: ModuleProgress | null;
}

export interface ModuleCardProps {
  mod: ModuleData;
  progress: ModuleProgress | null | undefined;
  viewMode: 'grid' | 'list';
  onStart: () => void;
  onRestart: () => void;
}

// ── Status helpers ──
function getStatus(mod: ModuleData, progress: ModuleProgress | null | undefined) {
  if (!progress)
    return { status: 'pending' as const, label: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: '#e8e8e8' };

  const quizRequired = mod.quiz_enabled || (mod.quizzes_count ?? 0) > 0;
  if (progress.module_completed && (!quizRequired || progress.quiz_completed))
    return { status: 'completed' as const, label: 'Completed', color: '#6B2FA0', bg: '#f3ebfc', border: '#c7a8e8' };

  if (progress.help_viewed || progress.checklist_completed || progress.quiz_completed || progress.module_completed)
    return { status: 'in_progress' as const, label: 'In Progress', color: '#6B2FA0', bg: '#f3ebfc', border: '#c7a8e8' };

  return { status: 'pending' as const, label: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: '#e8e8e8' };
}

function getPct(progress: ModuleProgress | null | undefined) {
  if (!progress) return 0;
  return Math.round(
    ((progress.help_viewed ? 1 : 0) + (progress.checklist_completed ? 1 : 0) + (progress.quiz_completed ? 1 : 0)) / 3 * 100,
  );
}

function coverGradient(status: string) {
  if (status === 'completed') return 'linear-gradient(145deg, #2d0066 0%, #4a1080 50%, #6B2FA0 100%)';
  if (status === 'in_progress') return 'linear-gradient(145deg, #2d0066 0%, #4a1080 50%, #6B2FA0 100%)';
  return 'linear-gradient(145deg, #1c1c35 0%, #2a2a4a 50%, #363660 100%)';
}

// ── Action buttons ──
function renderActions(
  st: ReturnType<typeof getStatus>,
  pct: number,
  onStart: () => void,
  onRestart: () => void,
  compact: boolean,
  restartingId?: boolean,
) {
  const pad = compact ? '8px 14px' : '10px 13px';
  const padMain = compact ? '8px 18px' : '10px 0';
  const radius = compact ? 10 : 12;

  if (st.status === 'completed')
    return (
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRestart(); }}
          style={{
            padding: pad, borderRadius: radius, border: '1.5px solid #ffd6d6',
            background: '#fff1f0', color: '#ff4d4f', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffe7e5'; e.currentTarget.style.borderColor = '#ffb3b3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff1f0'; e.currentTarget.style.borderColor = '#ffd6d6'; }}
        >{'\u{1F504}'} Restart</button>
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          style={{
            padding: padMain, borderRadius: radius, border: 'none', flex: compact ? undefined : 1,
            background: 'linear-gradient(135deg, #4a1080, #6B2FA0)',
            color: '#fff', fontWeight: 700, fontSize: compact ? 12 : 13, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(107,47,160,0.3)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,47,160,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,47,160,0.3)'; }}
        >{'\u2713'} Review</button>
      </div>
    );

  if (st.status === 'in_progress')
    return (
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRestart(); }}
          style={{
            padding: pad, borderRadius: radius, border: '1.5px solid #ffd6d6',
            background: '#fff1f0', color: '#ff4d4f', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffe7e5'; e.currentTarget.style.borderColor = '#ffb3b3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff1f0'; e.currentTarget.style.borderColor = '#ffd6d6'; }}
        >{'\u{1F504}'} Restart</button>
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          style={{
            padding: padMain, borderRadius: radius, border: 'none', flex: compact ? undefined : 1,
            background: 'linear-gradient(135deg,#4a1080,#7B35B8)',
            color: '#fff', fontWeight: 700, fontSize: compact ? 12 : 13, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(107,47,160,0.3)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: 0.3,
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 7px 22px rgba(107,47,160,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,47,160,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >{'\u25B6'} Resume</button>
      </div>
    );

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onStart(); }}
      style={{
        padding: compact ? '9px 22px' : '12px 0', width: compact ? undefined : '100%',
        borderRadius: radius, border: 'none', cursor: 'pointer', fontWeight: 700,
        fontSize: compact ? 12 : 13, flexShrink: 0,
        background: 'linear-gradient(135deg,#2d0066,#6B2FA0)',
        color: '#fff', boxShadow: '0 4px 14px rgba(107,47,160,0.3)', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: 0.3,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 7px 22px rgba(107,47,160,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,47,160,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >Start</button>
  );
}

// ── Component ──
export default function ModuleCard({ mod, progress, viewMode, onStart, onRestart }: ModuleCardProps) {
  const st = getStatus(mod, progress);
  const pct = getPct(progress);

  // ===== LIST VIEW =====
  if (viewMode === 'list') {
    return (
      <div
        className="card-enter"
        onClick={onStart}
        style={{
          background: '#fff', borderRadius: 18, padding: '16px 20px',
          border: `1.5px solid ${st.border}`,
          display: 'flex', alignItems: 'center', gap: 16,
          cursor: 'pointer', transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(107,47,160,0.13)';
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.borderColor = '#9B59B6';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.borderColor = st.border;
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 15, flexShrink: 0,
          background: coverGradient(st.status),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: '0 4px 14px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}>
          <ModuleIcon icon={mod.icon} size={isIconUrl(mod.icon) ? 56 : 26} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', letterSpacing: -0.1 }}>{mod.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: st.color,
              background: st.bg, padding: '3px 10px', borderRadius: 10,
              border: `1px solid ${st.border}`, flexShrink: 0,
            }}>
              {st.status === 'completed' && '\u2713 '}{st.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
            {mod.description}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 140, height: 5, borderRadius: 3, background: '#f0e8ff', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.5s',
                background: st.status === 'completed' || st.status === 'in_progress'
                  ? 'linear-gradient(90deg,#4a1080,#7B35B8)'
                  : '#e0e0e0',
                width: `${pct}%`,
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B2FA0', flexShrink: 0 }}>{pct}%</span>
            <span style={{ fontSize: 11, color: '#ddd' }}>{'\u00B7'}</span>
            <span style={{ fontSize: 11, color: '#c0c0c0' }}>{'\u{1F4D6}'} {mod.sections_count || 0} lessons</span>
            {mod.estimated_minutes && <>
              <span style={{ fontSize: 11, color: '#ddd' }}>{'\u00B7'}</span>
              <span style={{ fontSize: 11, color: '#c0c0c0' }}>{'\u23F1'} {mod.estimated_minutes}m</span>
            </>}
          </div>
        </div>

        {/* Buttons */}
        {renderActions(st, pct, onStart, onRestart, true)}
      </div>
    );
  }

  // ===== GRID VIEW =====
  return (
    <div
      onClick={onStart}
      style={{
        background: '#fff', borderRadius: 20, cursor: 'pointer',
        border: `1.5px solid ${st.border}`,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        height: '100%', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 16px 44px rgba(107,47,160,0.18)';
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = '#9B59B6';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = st.border;
      }}
    >
      {/* Card Cover */}
      <div style={{
        background: coverGradient(st.status),
        height: 156, padding: '18px 20px', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: -35, right: -35, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -25, left: -15, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Status badge top-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#fff',
            background: 'rgba(255,255,255,0.14)', borderRadius: 20, padding: '4px 11px',
            border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {st.status === 'completed' && <span style={{ fontSize: 9 }}>{'\u2713'}</span>}
            {st.status === 'in_progress' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c7a8e8', display: 'inline-block' }} />}
            {st.label}
          </span>
        </div>

        {/* Icon + meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 15,
            background: 'rgba(255,255,255,0.13)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, backdropFilter: 'blur(6px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <ModuleIcon icon={mod.icon} size={isIconUrl(mod.icon) ? 58 : 28} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 3 }}>
              {mod.sections_count || 0} Lessons
            </div>
            {mod.estimated_minutes && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {'\u23F1'} {mod.estimated_minutes} min
              </div>
            )}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              {'\u{1F4DD}'} {mod.quizzes_count || 0} quiz
            </div>
          </div>
        </div>

        {/* Progress bar at cover bottom */}
        <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${pct}%`, transition: 'width 0.7s ease',
            background: 'rgba(255,255,255,0.85)',
            boxShadow: pct > 0 ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
          }} />
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.35, letterSpacing: -0.2 }}>
          {mod.title}
        </div>
        <div style={{
          fontSize: 12, color: '#9e9e9e', lineHeight: 1.65, marginBottom: 15, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {mod.description}
        </div>

        {/* Progress row */}
        {pct > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f0e8ff', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #4a1080, #7B35B8)',
                width: `${pct}%`, transition: 'width 0.6s ease',
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, flexShrink: 0,
              color: '#6B2FA0',
            }}>{pct}%</span>
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: '#f7f5ff', color: '#6B2FA0', border: '1px solid #ede5ff', fontWeight: 600 }}>
            {'\u{1F4D6}'} {mod.sections_count || 0} sections
          </span>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: '#f7f5ff', color: '#6B2FA0', border: '1px solid #ede5ff', fontWeight: 600 }}>
            {'\u{1F4DD}'} {mod.quizzes_count || 0} quiz
          </span>
          {st.status === 'completed' && (
            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: '#f3ebfc', color: '#6B2FA0', border: '1px solid #d3adf7', fontWeight: 700 }}>
              {'\u2713'} Certified
            </span>
          )}
        </div>

        {/* Action buttons */}
        {renderActions(st, pct, onStart, onRestart, false)}
      </div>
    </div>
  );
}
