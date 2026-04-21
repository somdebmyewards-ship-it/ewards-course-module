import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined, SearchOutlined } from '@ant-design/icons';
import api, { cachedGet } from '@/lib/api';
import ModuleCard from '@/components/ModuleCard';

const isIconUrl = (icon?: string) => icon && (icon.startsWith('http') || icon.startsWith('/storage') || icon.startsWith('data:'));
const ModuleIcon = ({ icon, size = 28 }: { icon?: string; size?: number }) =>
  isIconUrl(icon) ? <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: size > 30 ? 10 : 6 }} /> : <span style={{ fontSize: size }}>{icon || '📚'}</span>;

export default function LearningHub() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<string>(localStorage.getItem('hub_view') || 'grid');
  const [restartingId, setRestartingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    cachedGet('/modules').then(r => {
      if (r.data && Array.isArray(r.data.modules)) setModules(r.data.modules);
      else if (Array.isArray(r.data)) setModules(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const navigate = useNavigate();

  const handleRestart = (e: React.MouseEvent, moduleId: number) => {
    e.stopPropagation();
    setConfirmId(moduleId);
  };

  const confirmRestart = async (moduleId: number) => {
    setConfirmId(null);
    setRestartingId(moduleId);
    try {
      await api.post(`/progress/${moduleId}/reset`);
      const r = await api.get('/modules');
      if (r.data && Array.isArray(r.data.modules)) setModules(r.data.modules);
      else if (Array.isArray(r.data)) setModules(r.data);
    } catch {}
    setRestartingId(null);
  };

  const getStatus = (m: any) => {
    if (!m.progress) return { status: 'pending', label: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: '#e8e8e8' };
    // Only truly completed if module_completed AND (no quiz, or quiz is done)
    const quizRequired = m.quiz_enabled || m.quizzes_count > 0;
    if (m.progress.module_completed && (!quizRequired || m.progress.quiz_completed))
      return { status: 'completed', label: 'Completed', color: '#6B2FA0', bg: '#f3ebfc', border: '#c7a8e8' };
    if (m.progress.help_viewed || m.progress.checklist_completed || m.progress.quiz_completed || m.progress.module_completed)
      return { status: 'in_progress', label: 'In Progress', color: '#6B2FA0', bg: '#f3ebfc', border: '#c7a8e8' };
    return { status: 'pending', label: 'Not Started', color: '#8c8c8c', bg: '#f5f5f5', border: '#e8e8e8' };
  };

  const getPct = (m: any) => {
    if (!m.progress) return 0;
    return Math.round(((m.progress.help_viewed ? 1 : 0) + (m.progress.checklist_completed ? 1 : 0) + (m.progress.quiz_completed ? 1 : 0)) / 3 * 100);
  };

  const inProgressModules = useMemo(() => modules.filter(m =>
    m.progress &&
    !m.progress.module_completed &&
    (m.progress.help_viewed || m.progress.checklist_completed || m.progress.quiz_completed)
  ), [modules]);

  const filteredModules = useMemo(() => {
    let result = [...modules];
    if (filterTab === 'completed') result = result.filter(m => m.progress?.module_completed);
    else if (filterTab === 'in_progress') result = result.filter(m => getStatus(m).status === 'in_progress');
    else if (filterTab === 'not_started') result = result.filter(m => getStatus(m).status === 'pending');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m => m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    }
    if (sortBy === 'az') result = [...result].sort((a, b) => a.title?.localeCompare(b.title));
    if (sortBy === 'za') result = [...result].sort((a, b) => b.title?.localeCompare(a.title));
    if (sortBy === 'progress') result = [...result].sort((a, b) => getPct(b) - getPct(a));
    if (sortBy === 'status') {
      const order: any = { completed: 0, in_progress: 1, pending: 2 };
      result = [...result].sort((a, b) => order[getStatus(a).status] - order[getStatus(b).status]);
    }
    return result;
  }, [modules, filterTab, search, sortBy]);

  if (loading) return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Skeleton hero */}
      <div className="skeleton" style={{ height: 80, borderRadius: 20, marginBottom: 22 }} />
      {/* Skeleton toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div className="skeleton" style={{ height: 40, width: 240, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 40, width: 100, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 40, width: 110, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 40, width: 120, borderRadius: 10 }} />
      </div>
      {/* Skeleton cards */}
      <Row gutter={[20, 20]}>
        {[1,2,3,4,5,6].map(i => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="skeleton" style={{ height: 156, borderRadius: 0 }} />
              <div style={{ padding: '18px 20px 20px', background: '#fff' }}>
                <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 18 }} />
                <div className="skeleton" style={{ height: 40, borderRadius: 12 }} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );

  const completedCount = modules.filter(m => m.progress?.module_completed).length;
  const inProgressCount = inProgressModules.length;
  const notStartedCount = modules.length - completedCount - inProgressCount;
  const overallPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: 80 }}>

      {/* ── Restart Confirmation Modal ── */}
      {confirmId !== null && (() => {
        const mod = modules.find(m => m.id === confirmId);
        return (
          <div onClick={() => setConfirmId(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(10,0,25,0.6)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#fff', borderRadius: 24, padding: '36px 32px 28px',
              maxWidth: 400, width: '90%',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
                  background: 'linear-gradient(135deg, #fff1f0, #ffe7e5)',
                  border: '2px solid #ffa39e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                }}>🔄</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>Restart Module?</div>
                <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.7 }}>
                  All progress for <strong style={{ color: '#1a1a2e' }}>{mod?.title}</strong> will be permanently reset, including your quiz scores and certificate.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmId(null)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e8e8e8',
                  background: '#fff', fontSize: 13, fontWeight: 600, color: '#595959', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={() => confirmRestart(confirmId!)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                  fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,77,79,0.4)',
                }}>Yes, Restart</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0035 0%, #3d0080 38%, #5B1F8A 68%, #8B44C4 100%)',
        borderRadius: 20, padding: '16px 24px', marginBottom: 22,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'relative', flexWrap: 'wrap' }}>

          {/* Left: title + subtitle */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3, lineHeight: 1.2 }}>
              {completedCount === modules.length && modules.length > 0
                ? '🎉 All Modules Complete!'
                : inProgressCount > 0
                  ? 'Keep the momentum going 🚀'
                  : 'Start your training journey'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
              {completedCount === modules.length && modules.length > 0
                ? "You've mastered every module."
                : `${modules.length - completedCount} remaining · Complete all to earn your certificate`}
            </div>
          </div>

          {/* Right: overall progress percentage */}
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 14, padding: '8px 20px',
            textAlign: 'center', backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{overallPct}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Complete</div>
          </div>
        </div>
      </div>

      {/* ── CONTINUE LEARNING STRIP ── */}
      {inProgressModules.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Continue Learning</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#6B2FA0',
              background: '#f3ebfc', border: '1px solid #c7a8e8',
              borderRadius: 8, padding: '1px 8px',
            }}>{inProgressModules.length} in progress</span>
          </div>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {inProgressModules.map((m: any) => {
              const viewed = m.progress?.viewed_sections_count ?? 0;
              const total = m.sections_count ?? 0;
              const pct = total > 0 ? Math.round((viewed / total) * 100) : getPct(m);
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/learning-hub/${m.slug}`)}
                  style={{
                    minWidth: 260, maxWidth: 260, borderRadius: 14,
                    border: '1.5px solid #c7a8e8', cursor: 'pointer',
                    background: '#fff', boxShadow: '0 2px 10px rgba(107,47,160,0.08)',
                    transition: 'all 0.2s ease', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,47,160,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(107,47,160,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(145deg, #2d0066, #6B2FA0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden',
                  }}><ModuleIcon icon={m.icon} size={isIconUrl(m.icon) ? 40 : 20} /></div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{m.title}</div>
                    <div style={{ height: 3, borderRadius: 2, background: '#f0e8ff', overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4a1080, #7B35B8)', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 10, color: '#9B59B6', fontWeight: 600 }}>{pct}% complete</div>
                      {total > 0 && (
                        <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>
                          📖 {viewed}/{total} sections
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/learning-hub/${m.slug}`); }}
                      style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #4a1080, #7B35B8)',
                        color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(107,47,160,0.3)',
                      }}
                    >▶ Resume</button>
                    <button
                      onClick={(e) => handleRestart(e, m.id)}
                      disabled={restartingId === m.id}
                      style={{
                        padding: '4px 9px', borderRadius: 8, border: '1.5px solid #ffd6d6',
                        background: '#fff1f0', color: '#ff4d4f', fontWeight: 700, fontSize: 10,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ffe7e5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff1f0'; }}
                    >{restartingId === m.id ? '⏳' : '🔄'} Restart</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SEARCH + FILTER TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12,
            padding: '9px 14px', minWidth: 210, maxWidth: 280,
            boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
            transition: 'border-color 0.15s',
          }}
            onFocus={() => {}}
          >
            <SearchOutlined style={{ color: '#bbb', fontSize: 14, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules..."
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, color: '#333', width: '100%',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: '#bbb', fontSize: 12, padding: 0, lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Filter dropdown */}
          <select
            className="sort-select"
            value={filterTab}
            onChange={e => setFilterTab(e.target.value)}
          >
            <option value="all">All ({modules.length})</option>
            <option value="in_progress">In Progress ({inProgressCount})</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="not_started">Not Started ({notStartedCount})</option>
          </select>
        </div>

        {/* Sort + View toggle */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: 2,
            background: '#fff', borderRadius: 10, padding: 4,
            border: '1.5px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'list', icon: <UnorderedListOutlined /> },
            ].map(opt => (
              <button key={opt.value} onClick={() => { setViewMode(opt.value); localStorage.setItem('hub_view', opt.value); }} style={{
                width: 34, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: viewMode === opt.value ? '#6B2FA0' : 'transparent',
                color: viewMode === opt.value ? '#fff' : '#aaa',
                fontSize: 14, transition: 'all 0.15s',
              }}>{opt.icon}</button>
            ))}
          </div>
        </div>
      </div>


      {/* ===== GRID VIEW ===== */}
      {viewMode === 'grid' && filteredModules.length > 0 && (
        <Row gutter={[20, 20]}>
          {filteredModules.map((m: any) => (
            <Col xs={24} sm={12} lg={8} key={m.id} className="card-enter">
              <ModuleCard
                mod={m}
                progress={m.progress}
                viewMode="grid"
                onStart={() => navigate(`/learning-hub/${m.slug}`)}
                onRestart={() => handleRestart({ stopPropagation: () => {} } as any, m.id)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && filteredModules.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredModules.map((m: any) => (
            <ModuleCard
              key={m.id}
              mod={m}
              progress={m.progress}
              viewMode="list"
              onStart={() => navigate(`/learning-hub/${m.slug}`)}
              onRestart={() => handleRestart({ stopPropagation: () => {} } as any, m.id)}
            />
          ))}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {filteredModules.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '56px 24px',
          background: '#fff', borderRadius: 20,
          border: '1.5px dashed #e0d4f7',
          boxShadow: '0 2px 12px rgba(107,47,160,0.06)',
        }}>
          {/* Illustrated icon cluster */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f3ebfc, #e8d5ff)',
              border: '2px solid #c7a8e8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
            }}>{search ? '🔍' : '📭'}</div>
            <div style={{
              position: 'absolute', top: -6, right: -6,
              width: 28, height: 28, borderRadius: '50%',
              background: '#fff', border: '2px solid #f0e8ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>✨</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            {search ? 'No modules found' : 'Nothing here yet'}
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 28, lineHeight: 1.6 }}>
            {search
              ? <>No results for "<strong style={{ color: '#6B2FA0' }}>{search}</strong>" — try a different keyword</>
              : 'No modules match the selected filter. Try switching to All.'}
          </div>
          <button onClick={() => { setSearch(''); setFilterTab('all'); setSortBy('default'); }} style={{
            padding: '11px 28px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #4a1080, #7B35B8)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(107,47,160,0.3)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,47,160,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,47,160,0.3)'; }}
          >Clear All Filters</button>
        </div>
      )}
    </div>
  );
}
