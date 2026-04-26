import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  TrophyOutlined, LockOutlined, StarFilled, ThunderboltOutlined,
  CrownOutlined, RiseOutlined, CheckCircleOutlined, SafetyCertificateOutlined,
  BookOutlined, UnorderedListOutlined, FormOutlined,
  FireOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const LEVELS = [
  { key: 'Beginner',     min: 0,   max: 100, next: 'Practitioner', nextMin: 100  },
  { key: 'Practitioner', min: 100, max: 250, next: 'Specialist',   nextMin: 250  },
  { key: 'Specialist',   min: 250, max: 500, next: 'Expert',       nextMin: 500  },
  { key: 'Expert',       min: 500, max: 500, next: null,           nextMin: 500  },
];

function getLevel(pts: number) {
  if (pts >= 500) return LEVELS[3];
  if (pts >= 250) return LEVELS[2];
  if (pts >= 100) return LEVELS[1];
  return LEVELS[0];
}

function LevelIcon({ lk, size = 22 }: { lk: string; size?: number }) {
  const s = { fontSize: size, color: '#fff' };
  if (lk === 'Expert')       return <CrownOutlined style={s} />;
  if (lk === 'Specialist')   return <TrophyOutlined style={s} />;
  if (lk === 'Practitioner') return <ThunderboltOutlined style={s} />;
  return <StarFilled style={s} />;
}

export default function MyProgress() {
  const [modules, setModules]     = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/modules'),
      api.get('/bookmarks').catch(() => ({ data: [] })),
    ]).then(([modRes, bkRes]) => {
      setModules(Array.isArray(modRes.data) ? modRes.data : (modRes.data?.modules ?? []));
      setBookmarks(Array.isArray(bkRes.data) ? bkRes.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  /* ── skeleton ── */
  if (loading) return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="skeleton" style={{ height: 130, borderRadius: 20, marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 90, flex: 1, borderRadius: 16 }} />)}
      </div>
      <div className="skeleton" style={{ height: 120, borderRadius: 18, marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, flex: 1, borderRadius: 16 }} />)}
      </div>
      <div className="skeleton" style={{ height: 180, borderRadius: 18, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 100, borderRadius: 18 }} />
    </div>
  );

  /* ── derived stats ── */
  const total      = modules.length;
  const completed  = modules.filter(m => m.progress?.module_completed).length;
  const inProgress = modules.filter(m => {
    const p = m.progress;
    return p && !p.module_completed && (p.help_viewed || p.checklist_completed || p.quiz_completed);
  }).length;
  const notStarted = total - completed - inProgress;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;

  const userPoints = (user as any)?.points ?? 0;
  const lvl        = getLevel(userPoints);
  const lvlPct     = lvl.key === 'Expert' ? 100 : Math.min(100, Math.round(((userPoints - lvl.min) / (lvl.max - lvl.min)) * 100));

  // Activity breakdown
  const totalSections   = modules.reduce((s, m) => s + (m.sections_count || 0), 0);
  const viewedSections  = modules.reduce((s, m) => s + (m.progress?.viewed_sections_count || 0), 0);
  const totalChecklists = modules.reduce((s, m) => s + (m.checklists_count || 0), 0);
  const doneChecklists  = modules.reduce((s, m) => {
    if (!m.progress?.checklist_state) return s;
    const st = typeof m.progress.checklist_state === 'string'
      ? JSON.parse(m.progress.checklist_state || '{}')
      : m.progress.checklist_state;
    return s + Object.values(st).filter(Boolean).length;
  }, 0);
  const totalQuizzes  = modules.filter(m => m.quizzes_count > 0).length;
  const passedQuizzes = modules.filter(m => m.progress?.quiz_completed).length;
  const avgQuizScore  = passedQuizzes > 0
    ? Math.round(modules.filter(m => m.progress?.quiz_completed).reduce((s, m) => s + (m.progress?.quiz_score || 0), 0) / passedQuizzes)
    : 0;

  const completedModules = modules.filter(m => m.progress?.module_completed);
  const firstName = (user as any)?.name?.split(' ')[0] || 'Learner';

  const statPills = [
    { icon: <CheckCircleOutlined />, value: completed,       label: 'Completed',   color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
    { icon: <FireOutlined />,        value: inProgress,      label: 'In Progress', color: '#6B2FA0', bg: '#f3ebfc', border: '#c7a8e8' },
    { icon: <ClockCircleOutlined />, value: notStarted,      label: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: '#e8e8e8' },
    { icon: <StarFilled />,          value: userPoints,       label: 'Points',      color: '#d48806', bg: '#fffbe6', border: '#ffe58f' },
    { icon: <BookOutlined />,    value: bookmarks.length, label: 'Bookmarks',   color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff', onClick: () => navigate('/bookmarks') },
  ];

  const activityCards = [
    {
      icon: <BookOutlined style={{ fontSize: 22, color: '#6B2FA0' }} />,
      label: 'Sections Read',
      value: viewedSections,
      total: totalSections,
      pct: totalSections > 0 ? Math.round((viewedSections / totalSections) * 100) : 0,
      color: '#6B2FA0', track: '#f0e8ff',
    },
    {
      icon: <UnorderedListOutlined style={{ fontSize: 22, color: '#389e0d' }} />,
      label: 'Checklist Items',
      value: doneChecklists,
      total: totalChecklists,
      pct: totalChecklists > 0 ? Math.round((doneChecklists / totalChecklists) * 100) : 0,
      color: '#389e0d', track: '#f6ffed',
    },
    {
      icon: <FormOutlined style={{ fontSize: 22, color: '#d48806' }} />,
      label: 'Quizzes Passed',
      value: passedQuizzes,
      total: totalQuizzes,
      pct: totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0,
      color: '#d48806', track: '#fffbe6',
      extra: passedQuizzes > 0 ? `Avg ${avgQuizScore}%` : null,
    },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div className="card-enter" style={{
        background: 'linear-gradient(135deg, #1a0035 0%, #3d0080 38%, #5B1F8A 68%, #8B44C4 100%)',
        borderRadius: 20, padding: '22px 28px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 140, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Progress Dashboard</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: -0.4, lineHeight: 1.2 }}>
              {pct === 100 ? '🎉 Training Complete!' : `${firstName}'s Learning Analytics`}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
              {completed} of {total} modules completed · {userPoints} points earned
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Complete</div>
            <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', margin: '7px auto 0' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#52c41a' : 'rgba(255,255,255,0.85)', borderRadius: 2, transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          STAT PILLS ROW
      ══════════════════════════════════════ */}
      <div className="card-enter" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', animationDelay: '0.05s' }}>
        {statPills.map((s, i) => (
          <div key={i} onClick={s.onClick}
            style={{
              flex: 1, minWidth: 100,
              background: s.bg, border: `1.5px solid ${s.border}`,
              borderRadius: 16, padding: '14px 16px',
              cursor: s.onClick ? 'pointer' : 'default',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = s.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = s.border;
            }}
          >
            <div style={{ fontSize: 18, color: s.color, marginBottom: 6, lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════
          LEVEL & POINTS CARD
      ══════════════════════════════════════ */}
      <div className="card-enter" style={{
        background: '#fff', borderRadius: 18,
        border: '1.5px solid #ede8f8', padding: '20px 24px',
        marginBottom: 16, boxShadow: '0 2px 12px rgba(107,47,160,0.07)',
        animationDelay: '0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg,#2d0066,#6B2FA0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(107,47,160,0.35)',
          }}>
            <LevelIcon lk={lvl.key} size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Current Level</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{lvl.key}</div>
            {lvl.next ? (
              <div style={{ fontSize: 11, color: '#9B59B6', fontWeight: 700, marginTop: 2 }}>
                <RiseOutlined style={{ marginRight: 4 }} />{lvl.nextMin - userPoints} pts to {lvl.next}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#52c41a', fontWeight: 700, marginTop: 2 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />Maximum level reached!
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#6B2FA0', lineHeight: 1 }}>{userPoints}</div>
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Points</div>
          </div>
        </div>

        {/* Level progress bar */}
        <div style={{ height: 8, borderRadius: 4, background: '#f0e8ff', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%', width: `${lvlPct}%`, borderRadius: 4,
            background: 'linear-gradient(90deg,#4a1080,#9B59B6)',
            transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Milestone dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'visible' }}>
          {LEVELS.map(l => (
            <Tooltip key={l.key} title={`${l.key}: ${l.min} pts`}>
              <div style={{ textAlign: 'center', cursor: 'default', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 11, height: 11, borderRadius: '50%', margin: '0 auto 4px',
                  background: userPoints >= l.min ? '#6B2FA0' : '#e8e8e8',
                  border: l.key === lvl.key ? '2.5px solid #3d0080' : 'none',
                  transition: 'background 0.3s',
                }} />
                <div style={{ fontSize: 9, color: userPoints >= l.min ? '#6B2FA0' : '#bbb', fontWeight: userPoints >= l.min ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.key}</div>
                <div style={{ fontSize: 8, color: '#ccc' }}>{l.min}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ACTIVITY BREAKDOWN
      ══════════════════════════════════════ */}
      <div className="card-enter" style={{ animationDelay: '0.15s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg,#6B2FA0,#9B59B6)' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Activity Breakdown</span>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {activityCards.map((s, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 180, background: '#fff', borderRadius: 16,
              border: '1.5px solid #ede8f8', padding: '18px 20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              transition: 'all 0.18s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
                e.currentTarget.style.borderColor = s.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#ede8f8';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: s.track,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s.icon}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#ccc', fontWeight: 600 }}>of {s.total}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{s.label}</div>
              <div style={{ height: 6, borderRadius: 3, background: s.track, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3, transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>{s.pct}% complete</div>
                {s.extra && <div style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.extra}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          POINTS BREAKDOWN
      ══════════════════════════════════════ */}
      {completedModules.length > 0 && (
        <div className="card-enter" style={{ animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg,#6B2FA0,#9B59B6)' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Points Breakdown</span>
          </div>
          <div style={{
            background: '#fff', borderRadius: 18,
            border: '1.5px solid #ede8f8', overflow: 'hidden',
            marginBottom: 20, boxShadow: '0 2px 12px rgba(107,47,160,0.07)',
          }}>
            {completedModules.map((m, i) => (
              <div key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 20px',
                  borderBottom: i < completedModules.length - 1 ? '1px solid #f5f0ff' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#faf7ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>
                    {m.icon && <span style={{ marginRight: 6 }}>{m.icon}</span>}{m.title}
                  </span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#6B2FA0',
                  background: '#f3ebfc', border: '1px solid #c7a8e8',
                  borderRadius: 8, padding: '3px 10px',
                }}>
                  +{m.points_reward || 0} pts
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', background: '#f9f5ff', borderTop: '2px solid #e8dff5',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>Total Points Earned</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#6B2FA0' }}>{userPoints} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          BOOKMARKS PREVIEW
      ══════════════════════════════════════ */}
      {bookmarks.length > 0 && (
        <div className="card-enter" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg,#6B2FA0,#9B59B6)' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Saved Bookmarks</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#1890ff',
                background: '#e6f7ff', border: '1px solid #91d5ff',
                borderRadius: 20, padding: '2px 9px',
              }}>{bookmarks.length}</span>
            </div>
            <button onClick={() => navigate('/bookmarks')} style={{
              padding: '5px 14px', borderRadius: 8,
              border: '1.5px solid #c7a8e8', background: '#fff',
              color: '#6B2FA0', fontWeight: 700, fontSize: 11,
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3ebfc'; e.currentTarget.style.borderColor = '#9B59B6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c7a8e8'; }}
            >
              View All →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }} className="hide-scrollbar">
            {bookmarks.slice(0, 6).map((bk: any) => (
              <div key={bk.id} style={{
                minWidth: 200, maxWidth: 200, background: '#fff', borderRadius: 14,
                border: '1.5px solid #e8dff5', padding: '14px 16px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(107,47,160,0.06)',
                transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(107,47,160,0.12)'; e.currentTarget.style.borderColor = '#c7a8e8'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(107,47,160,0.06)'; e.currentTarget.style.borderColor = '#e8dff5'; }}
              >
                <div style={{ fontSize: 10, color: '#9B59B6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  <BookOutlined style={{ marginRight: 4 }} />Saved
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bk.section?.title || bk.title || 'Section'}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bk.module?.title || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CERTIFICATE BANNER
      ══════════════════════════════════════ */}
      <div className="card-enter" style={{ animationDelay: '0.3s' }}>
        <div style={{
          borderRadius: 20, padding: '32px 36px', textAlign: 'center',
          background: pct === 100
            ? 'linear-gradient(135deg, #1a0035 0%, #3d0080 38%, #5B1F8A 68%, #8B44C4 100%)'
            : '#fff',
          border: pct === 100 ? 'none' : '1.5px solid #f0e8ff',
          boxShadow: pct === 100 ? '0 8px 32px rgba(107,47,160,0.35)' : '0 2px 12px rgba(107,47,160,0.07)',
          position: 'relative', overflow: 'hidden',
        }}>
          {pct === 100 ? (
            <>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -30, left: 60, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 56, marginBottom: 12, position: 'relative' }}>🏆</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6, position: 'relative' }}>Certificate Earned!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24, position: 'relative' }}>
                You've completed all {total} modules. Outstanding achievement!
              </div>
              <button onClick={() => navigate('/certificate')} style={{
                padding: '13px 36px', borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.18s ease', position: 'relative',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />View My Certificate
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f3ebfc', border: '2px solid #d4b8ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <LockOutlined style={{ fontSize: 26, color: '#9B59B6' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Certificate Locked</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 20, lineHeight: 1.8 }}>
                Complete <strong style={{ color: '#6B2FA0' }}>{total - completed}</strong> more module{total - completed !== 1 ? 's' : ''} to unlock your certificate
              </div>
              <div style={{ maxWidth: 340, margin: '0 auto 8px', height: 8, borderRadius: 4, background: '#f0e8ff', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#4a1080,#9B59B6)', borderRadius: 4, transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <div style={{ fontSize: 11, color: '#9B59B6', fontWeight: 700 }}>{pct}% complete</div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
