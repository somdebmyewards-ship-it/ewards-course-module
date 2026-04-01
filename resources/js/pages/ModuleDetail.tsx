import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Typography, Card, Steps, Button, Checkbox, Radio, Space, Tag, Spin, message, Divider, Image, Alert, Result, Progress as AntProgress, Layout, Menu, Statistic, Rate, Input, Dropdown } from 'antd';
import { CheckCircleOutlined, TrophyOutlined, BookOutlined, StarOutlined, StarFilled, PlayCircleOutlined, FileTextOutlined, PictureOutlined, LeftOutlined, RightOutlined, CopyOutlined, DownloadOutlined, SafetyCertificateOutlined, RiseOutlined, BulbOutlined, UnorderedListOutlined, ShareAltOutlined, LinkedinOutlined, XOutlined, WhatsAppOutlined, RobotOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import AssistantDrawer from '@/components/AssistantDrawer';
import { assistantApi, AssistantStatus } from '@/lib/assistantApi';
import { useAuth } from '@/contexts/AuthContext';
import api, { downloadPdf } from '@/lib/api';

const isIconUrl = (icon?: string) => icon && (icon.startsWith('http') || icon.startsWith('/storage') || icon.startsWith('data:'));

/** Detects YouTube/Vimeo/Drive/Loom URLs and renders iframe embed; falls back to <video> for direct files */
const VideoPlayer = ({ url: rawUrl, style }: { url: string; style?: React.CSSProperties }) => {
  // Fix relative /storage/ paths — prepend backend URL so they load from Render, not Vercel
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
  const url = rawUrl.startsWith('/storage/') && apiBase ? `${apiBase}${rawUrl}` : rawUrl;

  const iframeWrapper = (embedSrc: string) => (
    <div style={{ position: 'relative', paddingTop: '56.25%', ...style }}>
      <iframe
        src={embedSrc}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return iframeWrapper(`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`);

  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return iframeWrapper(`https://player.vimeo.com/video/${vimeoMatch[1]}`);

  // Google Drive: drive.google.com/file/d/ID/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return iframeWrapper(`https://drive.google.com/file/d/${driveMatch[1]}/preview`);

  // Loom: loom.com/share/ID
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return iframeWrapper(`https://www.loom.com/embed/${loomMatch[1]}`);

  // Any URL containing "youtube", "vimeo", "drive.google", "loom" that didn't match above — try iframe
  if (/youtube|youtu\.be|vimeo|drive\.google|loom\.com|embed|iframe/i.test(url)) {
    return iframeWrapper(url);
  }

  // Direct video file (mp4, webm, etc.)
  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
  if (isDirectVideo) {
    return (
      <video
        controls
        style={{ width: '100%', display: 'block' }}
        src={url}
        onError={(e) => {
          const parent = (e.target as HTMLElement).parentElement;
          if (parent) {
            parent.innerHTML = '<div style="padding:40px;text-align:center;color:#999;background:#1a1a1a">'
              + '<div style="font-size:48px;margin-bottom:12px">&#9658;</div>'
              + '<div style="font-size:14px">Video unavailable — file may have been removed after deploy.</div>'
              + '<div style="font-size:12px;margin-top:8px;color:#666">Re-upload the video or use a YouTube/Google Drive link in Content Manager.</div>'
              + '</div>';
          }
        }}
      />
    );
  }

  // Unknown URL — try iframe as fallback (works for most embeddable video services)
  return iframeWrapper(url);
};

const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;

function getLevel(points: number): string {
  if (points >= 500) return 'Expert';
  if (points >= 250) return 'Specialist';
  if (points >= 100) return 'Practitioner';
  return 'Beginner';
}

export default function ModuleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookmarkSectionId: number | null = (location.state as any)?.sectionId ?? null;
  const [mod, setMod] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0=Learn, 1=Quiz, 2=Done
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [viewingIntro, setViewingIntro] = useState(false);
  const [viewedSections, setViewedSections] = useState<number[]>([]);
  const [achievement, setAchievement] = useState<any>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answerReview, setAnswerReview] = useState<any>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [assistantOpen, setAssistantOpen]         = useState(false);
  const [assistantStatus, setAssistantStatus]     = useState<AssistantStatus | null>(null);
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    // Single API call — server bundles bookmarks, feedback, assistant status
    api.get(`/modules/${slug}`).then(modRes => {
      const m = modRes.data;
      setMod(m);
      const p = m.progress;
      setProgress(p);
      if (p) {
        const cs = typeof p.checklist_state === 'string' ? JSON.parse(p.checklist_state || '{}') : (p.checklist_state || {});
        setChecklistState(cs);
        if (bookmarkSectionId) {
          // Coming from a bookmark — always show section content regardless of quiz state
          setStep(0);
          setViewingIntro(false);
        } else if (p.quiz_completed && p.module_completed) {
          setStep(2);
          setQuizResult({ score: p.quiz_score, passed: true });
          localStorage.removeItem(`module_step_${slug}`);
        } else {
          // Restore the step the user was on when they left (stored in localStorage)
          const savedStep = parseInt(localStorage.getItem(`module_step_${slug}`) || '0', 10);
          if (savedStep === 1 && !p.quiz_completed) {
            setStep(1); // resume at quiz page
          }
          // else step stays 0 — resume content at last_section_id
        }

        // Resume from bookmarked section, or last visited section
        if (bookmarkSectionId && m.sections?.some((s: any) => s.id === bookmarkSectionId)) {
          setCurrentSectionId(bookmarkSectionId);
        } else if (p.last_section_id && m.sections?.length > 0) {
          setCurrentSectionId(p.last_section_id);
        }

        // Track viewed sections from progress
        if (p.viewed_section_ids) {
          const ids = typeof p.viewed_section_ids === 'string' ? JSON.parse(p.viewed_section_ids) : p.viewed_section_ids;
          setViewedSections(Array.isArray(ids) ? ids : []);
        }
      }

      // Default to first section if none selected
      if (!p?.last_section_id && m.sections?.length > 0) {
        setCurrentSectionId(m.sections[0].id);
        if (m.video_url) setViewingIntro(true);
      }

      // Use bundled bookmarks from server response
      if (m._bookmarks) {
        setBookmarks(Array.isArray(m._bookmarks) ? m._bookmarks : []);
      }

      // Use bundled feedback from server response
      if (m._feedback) {
        setFeedbackRating(m._feedback.rating || 0);
        setFeedbackComment(m._feedback.comment || '');
        setFeedbackSuggestion(m._feedback.improvement_suggestion || '');
        if (m._feedback.rating > 0) setFeedbackSubmitted(true);
      }

      // Use bundled assistant status
      if (m._assistant_status) {
        setAssistantStatus(m._assistant_status);
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const submitFeedback = async () => {
    if (!mod || feedbackRating === 0) { message.warning('Please select a rating'); return; }
    setFeedbackLoading(true);
    try {
      await api.post(`/feedback/${mod.id}`, {
        rating: feedbackRating,
        comment: feedbackComment,
        improvement_suggestion: feedbackSuggestion,
      });
      setFeedbackSubmitted(true);
      message.success('Thank you for your feedback!');
    } catch { message.error('Failed to submit feedback'); }
    setFeedbackLoading(false);
  };

  // Track section view — also auto-completes corresponding checklist item
  useEffect(() => {
    if (!currentSectionId || !mod || viewingIntro) return;

    api.post('/section-views', { module_id: mod.id, section_id: currentSectionId }).catch(() => {});
    api.post(`/progress/${mod.id}/resume`, { section_id: currentSectionId }).catch(() => {});

    if (!viewedSections.includes(currentSectionId)) {
      setViewedSections(prev => {
        const updated = [...prev, currentSectionId];

        // Auto-check the matching checklist item (by section index)
        const sectionIdx = mod.sections?.findIndex((s: any) => s.id === currentSectionId) ?? -1;
        if (sectionIdx >= 0 && mod.checklists?.[sectionIdx]) {
          const item = mod.checklists[sectionIdx];
          setChecklistState(cs => {
            if (cs[item.id]) return cs;
            api.post(`/progress/${mod.id}/checklist`, { checklist_item_id: item.id, checked: true }).catch(() => {});
            return { ...cs, [item.id]: true };
          });
        }

        // Auto-complete ALL remaining checklist items when every section is viewed
        const allViewed = mod.sections?.length > 0 && mod.sections?.every((s: any) => updated.includes(s.id));
        if (allViewed) {
          setChecklistState(cs => {
            const remaining = (mod.checklists || []).filter((c: any) => !cs[c.id]);
            if (remaining.length === 0) return cs;
            const next = { ...cs };
            remaining.forEach((c: any) => {
              next[c.id] = true;
              api.post(`/progress/${mod.id}/checklist`, { checklist_item_id: c.id, checked: true }).catch(() => {});
            });
            api.post(`/progress/${mod.id}/help-viewed`).catch(() => {});
            // Delay notification slightly so state settles
            setTimeout(() => message.success({ content: '🎉 All sections complete — Quiz is now unlocked!', duration: 4 }), 200);
            return next;
          });
        }

        return updated;
      });
    }
  }, [currentSectionId, mod?.id, viewingIntro]);

  const markHelpViewed = async () => {
    try { await api.post(`/progress/${mod.id}/help-viewed`); } catch {}
  };

  const allChecklistDone = mod?.checklists?.every((c: any) => checklistState[c.id]) ||
    mod?.sections?.every((s: any) => viewedSections.includes(s.id)) || false;

  const proceedToQuiz = async () => {
    try { await markHelpViewed(); } catch {}
    localStorage.setItem(`module_step_${slug}`, '1');
    setStep(1);
    window.scrollTo(0, 0);
  };

  const submitQuiz = async () => {
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/progress/${mod.id}/quiz`, { answers: quizAnswers });
      setQuizResult(res.data);
      if (res.data.achievement) {
        setAchievement(res.data.achievement);
      }
      if (res.data.passed) {
        localStorage.removeItem(`module_step_${slug}`);
        setStep(2);
        refreshUser();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Quiz submission failed');
    }
    setSubmittingQuiz(false);
  };

  const toggleBookmark = async (sectionId: number) => {
    if (bookmarks.includes(sectionId)) {
      const bk = (await api.get('/bookmarks')).data.find((b: any) => b.section_id === sectionId);
      if (bk) { await api.delete(`/bookmarks/${bk.id}`); setBookmarks(prev => prev.filter(id => id !== sectionId)); message.success('Bookmark removed'); }
    } else {
      await api.post('/bookmarks', { module_id: mod.id, section_id: sectionId });
      setBookmarks(prev => [...prev, sectionId]);
      message.success('Section bookmarked');
    }
  };

  const resetModule = async () => {
    await api.post(`/progress/${mod.id}/reset`);
    localStorage.removeItem(`module_step_${slug}`);
    setStep(0); setChecklistState({}); setQuizAnswers({}); setQuizResult(null); setProgress(null);
    setViewedSections([]); setCurrentQuizIndex(0); setExpandedSections({});
    if (mod.sections?.length > 0) setCurrentSectionId(mod.sections[0].id);
    if (mod.video_url) setViewingIntro(true);
    message.success('Module reset');
  };

  const navigateSection = (direction: 'prev' | 'next') => {
    if (!mod?.sections || !currentSectionId) return;
    const idx = mod.sections.findIndex((s: any) => s.id === currentSectionId);
    if (direction === 'prev' && idx > 0) {
      setCurrentSectionId(mod.sections[idx - 1].id);
    } else if (direction === 'next' && idx < mod.sections.length - 1) {
      setCurrentSectionId(mod.sections[idx + 1].id);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!mod) return <Result status="404" title="Module not found" extra={<Button onClick={() => navigate('/learning-hub')}>Back to Hub</Button>} />;

  const currentSection = mod.sections?.find((s: any) => s.id === currentSectionId);
  const currentSectionIndex = mod.sections?.findIndex((s: any) => s.id === currentSectionId) ?? -1;

  const stepStatus = (s: number) => {
    if (s < step) return 'finish';
    if (s === step) return 'process';
    return 'wait';
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Header — Compact bar with integrated section navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', marginBottom: 18, borderBottom: '1px solid #e8e8e8',
        gap: 10,
      }}>
        {/* Left: Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate('/learning-hub')}
            style={{
              background: '#f5f5f5', border: 'none', borderRadius: 8,
              padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: '#6B2FA0', fontSize: 13, fontWeight: 500,
              transition: 'background 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3ebfc')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f5f5f5')}
          >
            <LeftOutlined style={{ fontSize: 10 }} /> Back
          </button>
          <div style={{ width: 1, height: 24, background: '#d9d9d9', flexShrink: 0 }} />
          {isIconUrl(mod.icon) ? <img src={mod.icon} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> : <span style={{ fontSize: 22, flexShrink: 0 }}>{mod.icon || '📚'}</span>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              {mod.sections?.length || 0} sections · {(mod.quizzes?.length || 0)} {(mod.quizzes?.length || 0) === 1 ? 'quiz' : 'quizzes'}{mod.estimated_minutes ? ` · ${mod.estimated_minutes} min` : ''}
            </div>
          </div>
        </div>

        {/* Right: Section navigation controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {step === 0 && !viewingIntro && mod.sections?.length > 1 && (
            <>
              <button
                disabled={currentSectionIndex <= 0}
                onClick={() => navigateSection('prev')}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentSectionIndex > 0 ? '#fff' : '#fafafa',
                  border: `1.5px solid ${currentSectionIndex > 0 ? '#d3adf7' : '#f0f0f0'}`,
                  cursor: currentSectionIndex > 0 ? 'pointer' : 'not-allowed',
                  color: currentSectionIndex > 0 ? '#6B2FA0' : '#d9d9d9',
                  transition: 'all 0.2s', fontSize: 12,
                }}
                onMouseEnter={e => { if (currentSectionIndex > 0) { e.currentTarget.style.background = '#f3ebfc'; e.currentTarget.style.borderColor = '#b48fd8'; } }}
                onMouseLeave={e => { if (currentSectionIndex > 0) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d3adf7'; } }}
              >
                <LeftOutlined />
              </button>

              {/* Section indicator pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                background: '#f9f5ff', border: '1px solid #ede4f8',
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {mod.sections?.map((_: any, idx: number) => {
                    const isViewed = (step >= 2) || viewedSections.includes(mod.sections[idx].id);
                    return (
                      <div key={idx}
                        onClick={() => setCurrentSectionId(mod.sections[idx].id)}
                        style={{
                          width: idx === currentSectionIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          cursor: 'pointer',
                          background: idx === currentSectionIndex ? '#6B2FA0' : isViewed ? '#c9a8e8' : '#ddd',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    );
                  })}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B2FA0', marginLeft: 2 }}>
                  {currentSectionIndex + 1}/{mod.sections?.length}
                </span>
              </div>

              <button
                disabled={currentSectionIndex >= mod.sections.length - 1}
                onClick={() => navigateSection('next')}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentSectionIndex < mod.sections.length - 1
                    ? 'linear-gradient(135deg, #6B2FA0, #8B45C0)' : '#fafafa',
                  border: currentSectionIndex < mod.sections.length - 1 ? 'none' : '1.5px solid #f0f0f0',
                  cursor: currentSectionIndex < mod.sections.length - 1 ? 'pointer' : 'not-allowed',
                  color: currentSectionIndex < mod.sections.length - 1 ? '#fff' : '#d9d9d9',
                  transition: 'all 0.2s', fontSize: 12,
                  boxShadow: currentSectionIndex < mod.sections.length - 1 ? '0 2px 8px rgba(107,47,160,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (currentSectionIndex < mod.sections.length - 1) { e.currentTarget.style.transform = 'scale(1.05)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <RightOutlined />
              </button>
            </>
          )}

          {step > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 12,
              color: step === 2 ? '#52c41a' : '#6B2FA0',
              background: step === 2 ? '#f6ffed' : '#f3ebfc',
              border: step === 2 ? '1px solid #d9f7be' : '1px solid #e9d4ff',
            }}>
              {step === 2 ? '✓ Completed' : '● In Progress'}
            </span>
          )}
        </div>
      </div>

      {/* UNIFIED LAYOUT — Sidebar always visible like LinkedIn Learning / Internshala */}
      <Layout style={{ background: 'transparent', minHeight: 500 }}>

        {/* ── LEFT SIDEBAR ── */}
        <Sider
          width={284}
          style={{
            background: '#fff',
            borderRadius: 18,
            marginRight: 22,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 130px)',
            position: 'sticky',
            top: 72,
            border: '1px solid #ede8f5',
            boxShadow: '0 4px 24px rgba(107,47,160,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            flexShrink: 0,
          }}
        >
          {/* ── HEADER: Purple gradient banner ── */}
          <div style={{
            background: 'linear-gradient(145deg, #4A1A7A 0%, #6B2FA0 40%, #8B45C0 80%, #A855E8 100%)',
            padding: '22px 18px 18px',
            borderRadius: '18px 18px 0 0',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -25, left: -25,
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 10, right: 10,
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
                  Your Progress
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -0.5 }}>
                  {step >= 2 ? '100%' : `${Math.round((viewedSections.length / (mod.sections?.length || 1)) * 100)}%`}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
                  {step >= 2 ? 'Course complete 🎉' : `${viewedSections.length} of ${mod.sections?.length || 0} lessons read`}
                </div>
              </div>
              {/* Circular progress indicator */}
              <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <circle cx="26" cy="26" r="22" fill="none"
                    stroke={step >= 2 ? '#52c41a' : '#fff'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - (step >= 2 ? 1 : viewedSections.length / (mod.sections?.length || 1)))}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff',
                }}>
                  {step >= 2 ? '✓' : viewedSections.length}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: step >= 2 ? '#52c41a' : 'rgba(255,255,255,0.9)',
                width: step >= 2 ? '100%' : `${Math.round((viewedSections.length / (mod.sections?.length || 1)) * 100)}%`,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px rgba(255,255,255,0.5)',
              }} />
            </div>
          </div>

          {/* ── LESSONS LIST ── */}
          <div style={{ padding: '10px 0 6px' }}>
            <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>📖</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Lessons</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: (step >= 2 || allChecklistDone) ? '#f3ebfc' : '#f5f5f5',
                color: (step >= 2 || allChecklistDone) ? '#6B2FA0' : '#999',
              }}>
                {step >= 2 ? mod.sections?.length || 0 : viewedSections.length}/{mod.sections?.length || 0}
              </span>
            </div>

            {/* Timeline connector */}
            <div style={{ position: 'relative' }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute', left: 22, top: 10, bottom: 10,
                width: 0,
                background: 'transparent',
                opacity: 0, borderRadius: 1,
                zIndex: 0,
              }} />

              {/* Introductory Video item */}
              {mod.video_url && (
                <div>
                  <div
                    onClick={() => { setViewingIntro(true); if (step > 0) setStep(0); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', margin: '0 8px', cursor: 'pointer',
                      transition: 'all 0.2s ease', borderRadius: 12,
                      background: viewingIntro && step === 0 ? '#f3ebfc' : 'transparent',
                      borderLeft: viewingIntro && step === 0 ? '3px solid #6B2FA0' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!(viewingIntro && step === 0)) (e.currentTarget as HTMLElement).style.background = '#faf8fd'; }}
                    onMouseLeave={e => { if (!(viewingIntro && step === 0)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                      background: viewingIntro && step === 0 ? '#6B2FA0' : '#f3ebfc',
                      border: `2px solid ${viewingIntro && step === 0 ? '#6B2FA0' : '#ddd0f5'}`,
                    }}>
                      <PlayCircleOutlined style={{ color: viewingIntro && step === 0 ? '#fff' : '#6B2FA0' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, lineHeight: 1.5,
                        fontWeight: viewingIntro && step === 0 ? 600 : 500,
                        color: viewingIntro && step === 0 ? '#4A1A7A' : '#666',
                      }}>
                        Introductory Video
                      </div>
                    </div>
                  </div>
                  <div style={{ margin: '0 22px', height: 1, background: '#f5f5f5' }} />
                </div>
              )}

              {mod.sections?.map((s: any, i: number) => {
                const moduleComplete = step >= 2;
                const viewed = moduleComplete || viewedSections.includes(s.id);
                const active = currentSectionId === s.id && step === 0 && !viewingIntro;
                const isBookmarked = bookmarks.includes(s.id);
                const isLast = i === (mod.sections?.length || 0) - 1;
                return (
                  <div key={s.id}>
                    <div
                      onClick={() => { setCurrentSectionId(s.id); setViewingIntro(false); if (step > 0) setStep(0); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px',
                        margin: '0 8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: 12,
                        background: active ? '#f3ebfc' : 'transparent',
                        borderLeft: active ? '3px solid #6B2FA0' : '3px solid transparent',
                      }}
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = '#faf8fd';
                      }}
                      onMouseLeave={e => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {/* Circle */}
                      <div style={{
                        flexShrink: 0,
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        transition: 'all 0.3s',
                        background: active ? '#6B2FA0' : viewed ? '#fff' : '#fff',
                        border: active ? '2px solid #6B2FA0' : viewed ? '2px solid #6B2FA0' : '2px solid #e0e0e0',
                        color: active ? '#fff' : viewed ? '#6B2FA0' : '#bbb',
                      }}>
                        {active ? (i + 1) : viewed ? '✓' : i + 1}
                      </div>

                      {/* Title */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, lineHeight: 1.5, fontWeight: active ? 600 : 500,
                          color: active ? '#4A1A7A' : viewed ? '#333' : '#666',
                        }}>
                          {s.title}
                        </div>
                      </div>

                      {/* Bookmark */}
                      {isBookmarked && (
                        <StarFilled style={{ color: '#faad14', fontSize: 11, flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Separator */}
                    {!isLast && (
                      <div style={{ margin: '0 22px', height: 1, background: viewed ? '#f3ebfc' : '#f5f5f5' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ padding: '4px 16px 8px' }}>
            <div style={{ height: 1, background: '#f0f0f0' }} />
          </div>

          {/* ── QUIZ CARD ── */}
          <div style={{ padding: '0 8px 6px' }}>
            <div
              onClick={() => { if (allChecklistDone) proceedToQuiz(); }}
              style={{
                borderRadius: 12, padding: '14px 14px',
                cursor: allChecklistDone ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                background: step === 1
                  ? 'linear-gradient(135deg, #6B2FA0, #9B59B6)'
                  : step >= 2
                    ? '#f9f5ff'
                    : '#fafafa',
                border: step === 1 ? 'none' : step >= 2 ? '1px solid #d3adf7' : '1px solid #f0f0f0',
                opacity: allChecklistDone || step >= 1 ? 1 : 0.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  background: step === 1 ? 'rgba(255,255,255,0.2)' : step >= 2 ? '#6B2FA0' : '#e8e8e8',
                  color: step >= 1 ? '#fff' : '#bbb',
                }}>
                  {step >= 2 ? '✓' : '📝'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: step === 1 ? '#fff' : step >= 2 ? '#6B2FA0' : '#333' }}>
                    Knowledge Check
                  </div>
                  <div style={{ fontSize: 11, color: step === 1 ? 'rgba(255,255,255,0.7)' : step >= 2 ? '#9B59B6' : '#aaa', marginTop: 1 }}>
                    {step >= 2 ? 'Passed ✓' : allChecklistDone ? `${mod.quizzes?.length || 0} questions · Start` : 'Read all lessons first'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CERTIFICATE CARD ── */}
          <div style={{ padding: '0 8px 14px' }}>
            <div
              onClick={() => { if (step >= 2) setStep(2); }}
              style={{
                borderRadius: 12, padding: '14px 14px',
                cursor: step >= 2 ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                background: step >= 2
                  ? 'linear-gradient(135deg, #f9f5ff 0%, #f3ebfc 50%, #f9f5ff 100%)'
                  : '#fafafa',
                border: step >= 2 ? '1.5px solid #d3adf7' : '1px solid #f0f0f0',
                opacity: step >= 2 ? 1 : 0.4,
                boxShadow: step >= 2 ? '0 2px 12px rgba(107,47,160,0.15)' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer effect when earned */}
              {step >= 2 && (
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  animation: 'shimmer 3s infinite',
                  pointerEvents: 'none',
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  background: step >= 2
                    ? 'linear-gradient(135deg, #6B2FA0, #9B59B6)'
                    : '#e8e8e8',
                  color: step >= 2 ? '#fff' : '#bbb',
                  boxShadow: step >= 2 ? '0 2px 8px rgba(107,47,160,0.35)' : 'none',
                }}>
                  {step >= 2 ? '🏅' : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: step >= 2 ? '#6B2FA0' : '#999' }}>
                    Certificate
                  </div>
                  <div style={{ fontSize: 11, color: step >= 2 ? '#9B59B6' : '#ccc', marginTop: 1 }}>
                    {step >= 2 ? 'Tap to view 🎉' : 'Pass quiz to unlock'}
                  </div>
                </div>
                {step >= 2 && (
                  <span style={{ fontSize: 11, color: '#6B2FA0', fontWeight: 600 }}>View →</span>
                )}
              </div>
            </div>
          </div>

          {/* Shimmer keyframe */}
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(50%); }
            }
          `}</style>
        </Sider>

        {/* ── RIGHT CONTENT AREA ── */}
        <Content style={{ background: 'transparent', minWidth: 0 }}>

          {/* LEARN: Section content + checklist (step === 0) */}
          {step === 0 && (<>
              {/* Introductory Video view */}
              {viewingIntro && mod.video_url && (
                <div style={{ marginBottom: 18, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #6B2FA0 0%, #9B59B6 50%, #c084fc 100%)', height: 4 }} />
                  <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlayCircleOutlined style={{ color: '#6B2FA0', fontSize: 18 }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1a0933' }}>Introductory Video</span>
                  </div>
                  <div style={{ position: 'relative', background: '#000', overflow: 'hidden', borderRadius: 0 }}>
                    <VideoPlayer url={mod.video_url} />
                  </div>
                  {/* Images + Documents if any */}
                  {((mod.image_urls && JSON.parse(mod.image_urls || '[]').length > 0) || (mod.document_urls && JSON.parse(mod.document_urls || '[]').length > 0)) && (
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid #f0f0f0' }}>
                      {mod.image_urls && JSON.parse(mod.image_urls || '[]').map((url: string, i: number) => (
                        <Image key={i} src={url} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }} preview />
                      ))}
                      {mod.document_urls && JSON.parse(mod.document_urls || '[]').map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                          borderRadius: 8, background: '#f9f0ff', border: '1px solid #e9d4ff',
                          fontSize: 12, color: '#6B2FA0', fontWeight: 500, textDecoration: 'none',
                        }}>
                          <FileTextOutlined /> {url.split('/').pop()?.slice(0, 20)}
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '14px 24px' }}>
                    <Button
                      type="primary"
                      style={{ background: '#6B2FA0', borderColor: '#6B2FA0', borderRadius: 8 }}
                      onClick={() => { setViewingIntro(false); }}
                    >
                      Start Lessons →
                    </Button>
                  </div>
                </div>
              )}

              {/* Module-level images/documents (non-video) — only when not viewing intro */}
              {!viewingIntro && ((mod.image_urls && JSON.parse(mod.image_urls || '[]').length > 0) || (mod.document_urls && JSON.parse(mod.document_urls || '[]').length > 0)) && (
                <div style={{ marginBottom: 18, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {mod.image_urls && JSON.parse(mod.image_urls || '[]').map((url: string, i: number) => (
                      <Image key={i} src={url} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }} preview />
                    ))}
                    {mod.document_urls && JSON.parse(mod.document_urls || '[]').map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                        borderRadius: 8, background: '#f9f0ff', border: '1px solid #e9d4ff',
                        fontSize: 12, color: '#6B2FA0', fontWeight: 500, textDecoration: 'none',
                      }}>
                        <FileTextOutlined /> {url.split('/').pop()?.slice(0, 20)}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Section Content */}
              {!viewingIntro && currentSection && (
                <div style={{
                  background: '#fff', borderRadius: 16, marginBottom: 18,
                  border: '1px solid #f0f0f0', overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  {/* Section header with accent bar */}
                  <div style={{ background: 'linear-gradient(90deg, #6B2FA0 0%, #9B59B6 50%, #c084fc 100%)', height: 4 }} />
                  <div style={{ padding: '22px 32px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#fff', background: '#6B2FA0',
                            padding: '2px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            Section {currentSectionIndex + 1} / {mod.sections.length}
                          </span>
                          {viewedSections.includes(currentSection.id) && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#6B2FA0', background: '#f3ebfc', padding: '2px 8px', borderRadius: 10 }}>
                              ✓ Read
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>{currentSection.title}</div>
                      </div>
                      <button
                        onClick={() => toggleBookmark(currentSection.id)}
                        style={{
                          background: bookmarks.includes(currentSection.id) ? '#fffbe6' : '#fafafa',
                          border: `1px solid ${bookmarks.includes(currentSection.id) ? '#ffe58f' : '#e8e8e8'}`,
                          borderRadius: 8, cursor: 'pointer', padding: '6px 12px',
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500,
                          color: bookmarks.includes(currentSection.id) ? '#d48806' : '#8c8c8c',
                          transition: 'all 0.2s',
                        }}
                      >
                        {bookmarks.includes(currentSection.id) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                        {bookmarks.includes(currentSection.id) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Section body content */}
                  <div style={{ padding: '22px 32px 28px' }}>
                    {/* 1. Section Video (always first) */}
                    {currentSection.video_url && (
                      <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#000' }}>
                        <VideoPlayer url={currentSection.video_url} />
                      </div>
                    )}

                    {/* 2. Section Images */}
                    {currentSection.image_urls && (() => {
                      const imgs = typeof currentSection.image_urls === 'string' ? JSON.parse(currentSection.image_urls || '[]') : (currentSection.image_urls || []);
                      return imgs.length > 0 ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                          <Image.PreviewGroup>
                            {imgs.map((url: string, i: number) => (
                              <Image key={i} src={url} width={100} height={100} style={{ objectFit: 'cover', borderRadius: 10 }} />
                            ))}
                          </Image.PreviewGroup>
                        </div>
                      ) : null;
                    })()}

                    {/* 3. Rich text content with Read More */}
                    {(() => {
                      const lines = currentSection.body?.split('\n') || [];
                      const hasVideo = !!currentSection.video_url;

                      // Find the split point: first bold heading (**...**) for video+text,
                      // or after first paragraph block for text-only
                      let splitIdx = -1;
                      if (hasVideo) {
                        // For video sections: split right before the first bold heading
                        splitIdx = lines.findIndex((l: string) => l.startsWith('**') && l.endsWith('**'));
                      } else {
                        // For text-only: find the second bold heading or after ~6 non-empty lines
                        let headingCount = 0;
                        for (let i = 0; i < lines.length; i++) {
                          if (lines[i].startsWith('**') && lines[i].endsWith('**')) {
                            headingCount++;
                            if (headingCount === 2) { splitIdx = i; break; }
                          }
                        }
                        // Fallback: if no second heading, split after 6 content lines
                        if (splitIdx === -1 && lines.length > 10) {
                          let contentLines = 0;
                          for (let i = 0; i < lines.length; i++) {
                            if (lines[i].trim() !== '') contentLines++;
                            if (contentLines >= 6) { splitIdx = i + 1; break; }
                          }
                        }
                      }

                      const isLong = splitIdx > 0 && splitIdx < lines.length;
                      const isExpanded = expandedSections[currentSection.id] || false;
                      const previewLines = isLong ? lines.slice(0, splitIdx) : lines;
                      const restLines = isLong ? lines.slice(splitIdx) : [];

                      const renderLine = (line: string, i: number) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <div key={i} style={{
                              fontWeight: 700, fontSize: 17, marginTop: 24, marginBottom: 8, color: '#1a1a2e',
                              paddingBottom: 6, borderBottom: '2px solid #d3adf7',
                            }}>
                              {line.replace(/\*\*/g, '')}
                            </div>
                          );
                        }
                        if (line.startsWith('- ')) {
                          const text = line.slice(2);
                          const boldMatch = text.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
                          return (
                            <div key={i} style={{
                              paddingLeft: 24, position: 'relative', marginBottom: 6,
                              padding: '4px 4px 4px 24px',
                            }}>
                              <span style={{
                                position: 'absolute', left: 6, top: 6,
                                width: 6, height: 6, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6B2FA0, #9B59B6)',
                              }} />
                              {boldMatch ? (
                                <span><strong style={{ color: '#1a1a2e' }}>{boldMatch[1]}</strong> — {boldMatch[2]}</span>
                              ) : (
                                <span>{text}</span>
                              )}
                            </div>
                          );
                        }
                        if (line.trim() === '') return <div key={i} style={{ height: 14 }} />;
                        return <div key={i} style={{ marginBottom: 4 }}>{line}</div>;
                      };

                      return (
                        <div style={{
                          fontSize: 15, lineHeight: 1.9, color: '#3a3a3a',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}>
                          {/* Always-visible preview content */}
                          {previewLines.map(renderLine)}

                          {/* Read More / Read Less toggle */}
                          {isLong && !isExpanded && (
                            <div style={{
                              margin: '12px 0 0',
                              padding: '10px 0 16px',
                              display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #d3adf7, transparent)' }} />
                              <button
                                id="continue-reading-btn"
                                onClick={() => { setExpandedSections(prev => ({ ...prev, [currentSection.id]: true })); setTimeout(() => { const el = document.getElementById('expanded-content-start'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150); }}
                                style={{
                                  background: 'linear-gradient(135deg, #6B2FA0 0%, #8B45C0 100%)',
                                  border: 'none',
                                  borderRadius: 20, padding: '8px 22px',
                                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                  color: '#fff', letterSpacing: 0.3,
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  boxShadow: '0 4px 14px rgba(107,47,160,0.3)',
                                  transition: 'all 0.25s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,47,160,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,47,160,0.3)'; }}
                              >
                                Continue Reading <DownOutlined style={{ fontSize: 10 }} />
                              </button>
                              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #d3adf7, transparent)' }} />
                            </div>
                          )}

                          {/* Expanded content with smooth reveal */}
                          {isLong && isExpanded && (
                            <>
                              <div id="expanded-content-start" style={{
                                animation: 'fadeSlideIn 0.4s ease',
                              }}>
                                {restLines.map((line: string, i: number) => renderLine(line, i + splitIdx))}
                              </div>

                              <div style={{
                                margin: '24px 0 0',
                                padding: '12px 0',
                                display: 'flex', alignItems: 'center', gap: 14,
                              }}>
                                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #e8e8e8, transparent)' }} />
                                <button
                                  onClick={() => setExpandedSections(prev => ({ ...prev, [currentSection.id]: false }))}
                                  style={{
                                    background: '#fafafa',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: 20, padding: '7px 20px',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    color: '#8c8c8c',
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#6B2FA0'; e.currentTarget.style.borderColor = '#d3adf7'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#8c8c8c'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                                >
                                  Show Less <UpOutlined style={{ fontSize: 9 }} />
                                </button>
                                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #e8e8e8, transparent)' }} />
                              </div>
                            </>
                          )}

                          <style>{`
                            @keyframes fadeSlideIn {
                              from { opacity: 0; transform: translateY(-8px); }
                              to { opacity: 1; transform: translateY(0); }
                            }
                          `}</style>
                        </div>
                      );
                    })()}

                    {/* Key Takeaway */}
                    {currentSection.key_takeaway && (
                      <div style={{
                        marginTop: 24, padding: '16px 20px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #fffdf0 0%, #fff8e1 100%)',
                        border: '1px solid #ffe58f',
                        boxShadow: '0 2px 8px rgba(250,173,20,0.08)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'linear-gradient(135deg, #faad14, #ffc53d)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, boxShadow: '0 2px 6px rgba(250,173,20,0.3)',
                          }}>💡</div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#ad6800' }}>Key Takeaway</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#595959', lineHeight: 1.75, paddingLeft: 36 }}>
                          {currentSection.key_takeaway}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom spacer */}
                  <div style={{ height: 12 }} />
                </div>
              )}

              {/* Auto-progress tracker — shown inline, no manual interaction needed */}
              {!viewingIntro && mod.checklists?.length > 0 && (
                <Card style={{ borderRadius: 14, marginBottom: 16, border: `1px solid ${allChecklistDone ? '#d3adf7' : '#e9d4ff'}`, background: allChecklistDone ? '#f9f5ff' : '#fafafe' }} bodyStyle={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#6B2FA0' }}>
                      {allChecklistDone ? '✅ All topics covered — Quiz unlocked!' : '📖 Read all sections to unlock the quiz'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: allChecklistDone ? '#6B2FA0' : '#8c8c8c' }}>
                      {viewedSections.length}/{mod.sections?.length || 0} sections
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e8e8e8', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.4s',
                      background: 'linear-gradient(90deg, #6B2FA0, #9B59B6)',
                      width: `${Math.round((viewedSections.length / (mod.sections?.length || 1)) * 100)}%`,
                    }} />
                  </div>
                  {allChecklistDone && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mod.checklists.map((c: any) => (
                        <span key={c.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#f3ebfc', color: '#6B2FA0', border: '1px solid #d3adf7' }}>
                          ✓ {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )}


              {!viewingIntro && <button
                disabled={!allChecklistDone}
                onClick={proceedToQuiz}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: allChecklistDone ? 'pointer' : 'not-allowed',
                  background: allChecklistDone ? '#6B2FA0' : '#e8e8e8',
                  color: allChecklistDone ? '#fff' : '#bfbfbf',
                  transition: 'all 0.2s', letterSpacing: 0.3,
                }}
              >
                Continue to Quiz →
              </button>}
            </>)}

          {/* QUIZ STEP — one question at a time */}
          {step === 1 && (() => {
            const quizzes = mod.quizzes || [];
            const total = quizzes.length;
            const q = quizzes[currentQuizIndex];
            const answered = q ? !!quizAnswers[q.id] : false;
            const isLast = currentQuizIndex === total - 1;
            const allAnswered = Object.keys(quizAnswers).length >= total;
            const optLetters = ['A', 'B', 'C', 'D', 'E'];
            const progressPct = total > 0 ? Math.round(((currentQuizIndex + (answered ? 1 : 0)) / total) * 100) : 0;

            return (
              <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* Failed banner */}
                {quizResult && !quizResult.passed && (
                  <div style={{
                    marginBottom: 20, padding: '14px 18px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #fff1f0 0%, #ffe7e5 100%)',
                    border: '1.5px solid #ffa39e',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>😕</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#cf1322' }}>Score: {quizResult.score}% — Need 75% to pass</div>
                        <div style={{ fontSize: 12, color: '#a8071a', marginTop: 1 }}>Review and try again — you've got this!</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setQuizResult(null); setQuizAnswers({}); setCurrentQuizIndex(0); }}
                      style={{
                        background: '#ff4d4f', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      Retry Quiz
                    </button>
                  </div>
                )}

                {/* Header: progress bar + question counter */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#6B2FA0' }}>
                      Question {currentQuizIndex + 1} <span style={{ color: '#bbb', fontWeight: 400 }}>of {total}</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {Object.keys(quizAnswers).length} answered
                    </span>
                  </div>
                  {/* Segmented progress dots */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {quizzes.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1, height: 5, borderRadius: 3, transition: 'background 0.3s',
                          background: quizAnswers[quizzes[idx]?.id]
                            ? '#6B2FA0'
                            : idx === currentQuizIndex
                              ? 'linear-gradient(90deg, #6B2FA0 50%, #e0d4f5 50%)'
                              : '#e8e8e8',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Question card */}
                {q && (
                  <div style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #ede8f5',
                    boxShadow: '0 4px 24px rgba(107,47,160,0.07)',
                    overflow: 'hidden',
                  }}>
                    {/* Question banner */}
                    <div style={{
                      background: 'linear-gradient(135deg, #5B1F8A 0%, #7B35B8 100%)',
                      padding: '28px 32px',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ position: 'absolute', bottom: -15, left: 10, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                        Question {currentQuizIndex + 1}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.5, position: 'relative' }}>
                        {q.question}
                      </div>
                    </div>

                    {/* Options */}
                    <div style={{ padding: '20px 24px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).map((opt: string, j: number) => {
                          const selected = quizAnswers[q.id] === opt;
                          return (
                            <div
                              key={j}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 18px',
                                borderRadius: 14,
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                background: selected
                                  ? 'linear-gradient(135deg, #f3ebfc 0%, #ede0ff 100%)'
                                  : '#fafafa',
                                border: `2px solid ${selected ? '#7B35B8' : '#ebebeb'}`,
                                boxShadow: selected ? '0 2px 12px rgba(107,47,160,0.15)' : 'none',
                                transform: selected ? 'translateY(-1px)' : 'none',
                              }}
                              onMouseEnter={e => {
                                if (!selected) {
                                  (e.currentTarget as HTMLElement).style.background = '#f5f0ff';
                                  (e.currentTarget as HTMLElement).style.borderColor = '#c7a8e8';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!selected) {
                                  (e.currentTarget as HTMLElement).style.background = '#fafafa';
                                  (e.currentTarget as HTMLElement).style.borderColor = '#ebebeb';
                                }
                              }}
                            >
                              {/* Letter badge */}
                              <div style={{
                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 13,
                                background: selected
                                  ? 'linear-gradient(135deg, #6B2FA0, #9B59B6)'
                                  : '#fff',
                                border: `2px solid ${selected ? '#6B2FA0' : '#e0e0e0'}`,
                                color: selected ? '#fff' : '#aaa',
                                boxShadow: selected ? '0 2px 6px rgba(107,47,160,0.3)' : 'none',
                                transition: 'all 0.18s',
                              }}>
                                {selected ? '✓' : optLetters[j]}
                              </div>
                              <span style={{
                                fontSize: 14, fontWeight: selected ? 600 : 400,
                                color: selected ? '#5B1F8A' : '#1a1a2e',
                                lineHeight: 1.4, flex: 1,
                              }}>
                                {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Nav buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                        <button
                          onClick={() => setCurrentQuizIndex(i => Math.max(0, i - 1))}
                          disabled={currentQuizIndex === 0}
                          style={{
                            background: 'none', border: '1.5px solid #e8e8e8', borderRadius: 10,
                            padding: '9px 20px', fontSize: 13, fontWeight: 500,
                            color: currentQuizIndex === 0 ? '#d9d9d9' : '#595959',
                            cursor: currentQuizIndex === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s',
                          }}
                        >
                          ← Back
                        </button>

                        {!isLast ? (
                          <button
                            onClick={() => { if (answered) setCurrentQuizIndex(i => i + 1); }}
                            disabled={!answered}
                            style={{
                              background: answered
                                ? 'linear-gradient(135deg, #6B2FA0, #9B59B6)'
                                : '#e8e8e8',
                              border: 'none', borderRadius: 10,
                              padding: '10px 28px', fontSize: 14, fontWeight: 700,
                              color: answered ? '#fff' : '#bfbfbf',
                              cursor: answered ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 8,
                              boxShadow: answered ? '0 4px 14px rgba(107,47,160,0.3)' : 'none',
                              transition: 'all 0.2s',
                              letterSpacing: 0.2,
                            }}
                          >
                            Next Question →
                          </button>
                        ) : (
                          <button
                            onClick={() => { if (allAnswered && !submittingQuiz) submitQuiz(); }}
                            disabled={!allAnswered || submittingQuiz}
                            style={{
                              background: allAnswered
                                ? 'linear-gradient(135deg, #6B2FA0, #8B45C0)'
                                : '#e8e8e8',
                              border: 'none', borderRadius: 10,
                              padding: '10px 28px', fontSize: 14, fontWeight: 700,
                              color: allAnswered ? '#fff' : '#bfbfbf',
                              cursor: allAnswered && !submittingQuiz ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 8,
                              boxShadow: allAnswered ? '0 4px 14px rgba(107,47,160,0.35)' : 'none',
                              transition: 'all 0.2s',
                              letterSpacing: 0.2,
                            }}
                          >
                            {submittingQuiz ? '⏳ Submitting...' : '🎯 Submit Quiz'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Question dots navigator */}
                {total > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    {quizzes.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentQuizIndex(idx)}
                        title={`Question ${idx + 1}`}
                        style={{
                          width: idx === currentQuizIndex ? 24 : 8,
                          height: 8, borderRadius: 4,
                          cursor: 'pointer', transition: 'all 0.25s ease',
                          background: quizAnswers[quizzes[idx]?.id]
                            ? '#6B2FA0'
                            : idx === currentQuizIndex
                              ? '#9B59B6'
                              : '#e0e0e0',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* DONE STEP — Achievement Card */}
          {step === 2 && (() => {
        const ach = achievement;
        const modulePoints = mod.points_reward || 50;
        const quizBonus = quizResult?.passed ? 20 : (ach?.quiz_bonus || 0);
        const totalEarned = modulePoints + quizBonus;
        const qScore = quizResult?.score ?? progress?.quiz_score ?? 0;
        const shareText = ach?.share_text || `Just completed ${mod.title} on eWards Learning Hub! Scored ${qScore}%`;

        // Fetch fresh user points
        const userPoints = ach?.total_points || (modulePoints + quizBonus);
        const currentLevel = ach?.new_level || getLevel(userPoints);
        const levelUp = ach?.level_up || false;
        const certUnlocked = ach?.certificate_unlocked || false;

        const levelThresholds: Record<string, { min: number; max: number; next: string }> = {
          'Beginner': { min: 0, max: 100, next: 'Practitioner' },
          'Practitioner': { min: 100, max: 250, next: 'Specialist' },
          'Specialist': { min: 250, max: 500, next: 'Expert' },
          'Expert': { min: 500, max: 500, next: '' },
        };
        const lvlInfo = levelThresholds[currentLevel] || levelThresholds['Beginner'];
        const levelProgress = currentLevel === 'Expert' ? 100 : Math.min(100, Math.round(((userPoints - lvlInfo.min) / (lvlInfo.max - lvlInfo.min)) * 100));
        const levelColors: Record<string, string> = { 'Beginner': 'default', 'Practitioner': 'blue', 'Specialist': 'purple', 'Expert': 'gold' };

        const copyAchievement = () => {
          navigator.clipboard.writeText(shareText);
          message.success('Copied to clipboard!');
        };

        const downloadCertificate = async () => {
          try {
            message.loading({ content: 'Preparing certificate...', key: 'cert-dl' });
            const safeName = (user?.name || 'User').replace(/[^a-zA-Z0-9-]/g, '-');
            await downloadPdf('/certificate/download', `eWards-Certificate-${safeName}.pdf`);
            message.success({ content: 'Certificate downloaded!', key: 'cert-dl', duration: 3 });
          } catch (e: any) {
            message.error({ content: 'Failed to download certificate: ' + (e.message || ''), key: 'cert-dl' });
          }
        };

        return (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Celebration Card */}
            <Card style={{ borderRadius: 20, textAlign: 'center', border: 'none', background: 'linear-gradient(135deg, #6B2FA0 0%, #9B59B6 50%, #C39BD3 100%)', marginBottom: 24, padding: '32px 24px' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
              <Title level={2} style={{ color: '#fff', margin: '0 0 4px' }}>Module Completed!</Title>
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
                You successfully completed <strong style={{ color: '#fff' }}>{mod.title}</strong>
              </Text>

              {/* Quiz Score Circle */}
              <div style={{ margin: '24px 0 16px' }}>
                <AntProgress
                  type="circle"
                  percent={qScore}
                  width={100}
                  strokeColor={{ '0%': '#52c41a', '100%': '#87d068' }}
                  trailColor="rgba(255,255,255,0.2)"
                  format={(p) => <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{p}%</span>}
                />
                <div style={{ marginTop: 8 }}><Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Quiz Score</Text></div>
              </div>

              {/* Points Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 24px', backdropFilter: 'blur(4px)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Module</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>+{modulePoints}</div>
                </div>
                {quizBonus > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 24px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Quiz Bonus</div>
                    <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>+{quizBonus}</div>
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '12px 24px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total Earned</div>
                  <div style={{ color: '#fadb14', fontSize: 28, fontWeight: 800 }}>+{totalEarned}</div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button icon={<DownloadOutlined />} size="large" onClick={downloadCertificate}
                style={{ borderRadius: 10 }}>
                Download Certificate
              </Button>
              <Dropdown menu={{
                items: [
                  {
                    key: 'linkedin',
                    icon: <LinkedinOutlined style={{ color: '#0077B5' }} />,
                    label: 'Share on LinkedIn',
                    onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(shareText)}`, '_blank'),
                  },
                  {
                    key: 'twitter',
                    icon: <XOutlined />,
                    label: 'Share on X (Twitter)',
                    onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`, '_blank'),
                  },
                  {
                    key: 'whatsapp',
                    icon: <WhatsAppOutlined style={{ color: '#25D366' }} />,
                    label: 'Share on WhatsApp',
                    onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + window.location.href)}`, '_blank'),
                  },
                ],
              }} trigger={['click']}>
                <Button icon={<ShareAltOutlined />} size="large" style={{ borderRadius: 10 }}>
                  Share Certificate
                </Button>
              </Dropdown>
              <Button onClick={resetModule} size="large" style={{ borderRadius: 10 }}>Restart Module</Button>
              <Button type="primary" onClick={() => navigate('/learning-hub')} size="large" style={{ background: '#6B2FA0', borderColor: '#6B2FA0', borderRadius: 10, fontWeight: 600, color: '#fff' }}>
                Back to Learning Hub
              </Button>
            </div>

            {/* Collapsible Answer Review */}
            <div style={{
              marginTop: 24, borderRadius: 16, overflow: 'hidden',
              border: '1px solid #e9d4ff', background: '#fff',
            }}>
              <button
                onClick={async () => {
                  if (showAnswers) { setShowAnswers(false); return; }
                  if (answerReview) { setShowAnswers(true); return; }
                  if (quizResult?.results) {
                    setAnswerReview(quizResult.results);
                    setShowAnswers(true);
                  } else {
                    setLoadingAnswers(true);
                    try {
                      const res = await api.get(`/progress/${mod.id}/quiz-answers`);
                      setAnswerReview(res.data.results);
                      setShowAnswers(true);
                    } catch { message.error('Could not load answers'); }
                    setLoadingAnswers(false);
                  }
                }}
                style={{
                  width: '100%', padding: '16px 24px',
                  background: showAnswers ? '#f9f5ff' : '#fff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9f5ff'; }}
                onMouseLeave={e => { if (!showAnswers) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BookOutlined style={{ fontSize: 16, color: '#6B2FA0' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#6B2FA0' }}>
                    {loadingAnswers ? 'Loading...' : 'View Correct Answers'}
                  </span>
                </div>
                <div style={{
                  transition: 'transform 0.3s ease',
                  transform: showAnswers ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  <DownOutlined style={{ fontSize: 12, color: '#6B2FA0' }} />
                </div>
              </button>

              {showAnswers && answerReview && (
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeSlideIn 0.3s ease' }}>
                  {answerReview.map((r: any, idx: number) => {
                    let options: string[] = [];
                    if (r.options) {
                      options = Array.isArray(r.options) ? r.options : JSON.parse(r.options || '[]');
                    } else if (mod.quizzes?.[idx]) {
                      const q = mod.quizzes[idx];
                      options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
                    }
                    const hasUserAnswer = !!r.user_answer;
                    const isCorrectQ = r.is_correct;
                    const headerBg = isCorrectQ === true ? '#f9f5ff' : isCorrectQ === false ? '#fff1f0' : '#f9f5ff';
                    const headerBorder = isCorrectQ === true ? '#d3adf7' : isCorrectQ === false ? '#ffa39e' : '#e8dcf5';
                    const badgeBg = isCorrectQ === true ? '#6B2FA0' : isCorrectQ === false ? '#ff4d4f' : '#6B2FA0';
                    const badgeIcon = isCorrectQ === true ? '✓' : isCorrectQ === false ? '✗' : String(idx + 1);
                    return (
                      <div key={r.question_id} style={{
                        background: '#fff', borderRadius: 12,
                        border: `1.5px solid ${headerBorder}`,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          padding: '14px 18px',
                          background: headerBg,
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            background: badgeBg, color: '#fff',
                          }}>
                            {badgeIcon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', marginBottom: 3 }}>Question {idx + 1}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0933', lineHeight: 1.5 }}>{r.question}</div>
                          </div>
                        </div>
                        <div style={{ padding: '10px 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {options.length > 0 ? options.map((opt: string, j: number) => {
                            const isCorrect = opt === r.correct_answer;
                            const isUserPick = hasUserAnswer && opt === r.user_answer;
                            const isWrongPick = isUserPick && !isCorrect;
                            return (
                              <div key={j} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px', borderRadius: 8,
                                background: isCorrect ? '#f9f5ff' : isWrongPick ? '#fff1f0' : '#fafafa',
                                border: `1.5px solid ${isCorrect ? '#d3adf7' : isWrongPick ? '#ffa39e' : '#f0f0f0'}`,
                              }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                  background: isCorrect ? '#6B2FA0' : isWrongPick ? '#ff4d4f' : '#e8e8e8',
                                  color: isCorrect || isWrongPick ? '#fff' : '#999',
                                }}>
                                  {isCorrect ? '✓' : isWrongPick ? '✗' : String.fromCharCode(65 + j)}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: isCorrect ? 600 : 400, color: isCorrect ? '#6B2FA0' : isWrongPick ? '#cf1322' : '#595959' }}>
                                  {opt}
                                </span>
                                {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#6B2FA0' }}>Correct</span>}
                                {isWrongPick && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#ff4d4f' }}>Your answer</span>}
                              </div>
                            );
                          }) : (
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f9f5ff', border: '1.5px solid #d3adf7', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B2FA0' }}>✓ {r.correct_answer}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#6B2FA0' }}>Correct</span>
                            </div>
                          )}
                          {r.explanation && (
                            <div style={{ marginTop: 2, padding: '8px 12px', borderRadius: 8, background: '#f9f5ff', border: '1px solid #e9d4ff', fontSize: 12, color: '#4a4a6a', lineHeight: 1.6 }}>
                              <strong style={{ color: '#6B2FA0' }}>Explanation:</strong> {r.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feedback Section */}
            <div style={{
              marginTop: 20, padding: 28, borderRadius: 16,
              background: feedbackSubmitted ? '#f9f5ff' : '#fafafa',
              border: feedbackSubmitted ? '1px solid #d3adf7' : '1px solid #e8e8e8',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>💬</span>
                <Text strong style={{ fontSize: 16, color: '#333' }}>
                  {feedbackSubmitted ? 'Thanks for your feedback!' : 'How was this module?'}
                </Text>
              </div>

              {feedbackSubmitted ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ color: '#666' }}>Your rating:</Text>
                    <Rate disabled value={feedbackRating} style={{ fontSize: 18 }} />
                  </div>
                  {feedbackComment && <Text style={{ color: '#666', display: 'block', marginBottom: 4 }}>Comment: {feedbackComment}</Text>}
                  {feedbackSuggestion && <Text style={{ color: '#666', display: 'block' }}>Suggestion: {feedbackSuggestion}</Text>}
                  <Button size="small" style={{ marginTop: 12, borderRadius: 8 }} onClick={() => setFeedbackSubmitted(false)}>
                    Edit Feedback
                  </Button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Text style={{ color: '#666', display: 'block', marginBottom: 8 }}>Rate this module:</Text>
                    <Rate value={feedbackRating} onChange={setFeedbackRating} style={{ fontSize: 28 }} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text style={{ color: '#666', display: 'block', marginBottom: 6 }}>What did you think? (optional)</Text>
                    <Input.TextArea
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts about this module..."
                      rows={2}
                      maxLength={500}
                      showCount
                      style={{ borderRadius: 10 }}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#666', display: 'block', marginBottom: 6 }}>Any content that could be improved? (optional)</Text>
                    <Input.TextArea
                      value={feedbackSuggestion}
                      onChange={e => setFeedbackSuggestion(e.target.value)}
                      placeholder="Suggest specific sections, topics, or content that could be better..."
                      rows={2}
                      maxLength={500}
                      showCount
                      style={{ borderRadius: 10 }}
                    />
                  </div>

                  <Button
                    type="primary"
                    onClick={submitFeedback}
                    loading={feedbackLoading}
                    disabled={feedbackRating === 0}
                    size="large"
                    style={{
                      background: feedbackRating > 0 ? '#6B2FA0' : undefined,
                      borderColor: feedbackRating > 0 ? '#6B2FA0' : undefined,
                      borderRadius: 10, fontWeight: 600,
                    }}
                  >
                    Submit Feedback
                  </Button>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        </Content>
      </Layout>

      {/* ── Smart Learning Assistant — always visible ─────────────── */}
      <>
        <button
          onClick={() => setAssistantOpen(true)}
          title="Ask Learning Assistant"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
            width: 56, height: 56, borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg,#2d0066,#7B35B8)',
            color: '#fff', cursor: 'pointer', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(107,47,160,0.5)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(107,47,160,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(107,47,160,0.5)';
          }}
        >
          <RobotOutlined />
        </button>

        <AssistantDrawer
          moduleId={mod.id}
          moduleTitle={mod.title}
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          status={assistantStatus}
        />
      </>

    </div>
  );
}
