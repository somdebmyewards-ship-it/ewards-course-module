import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircleOutlined,
  RobotOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  RightOutlined,
  StarFilled,
  ThunderboltOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { Button, Progress, Tag } from 'antd';

// ── Types ────────────────────────────────────────────────────────────────────

interface PrototypeStep {
  id: string;
  type: 'instruction' | 'action' | 'success';
  content: string;
  hint?: string;
}

interface PrototypeFlow {
  id: string;
  title: string;
  description: string;
  steps: PrototypeStep[];
}

interface PrototypeConfig {
  enabled: boolean;
  title: string;
  description: string;
  points_reward: number;
  flows: PrototypeFlow[];
}

interface Props {
  config: PrototypeConfig;
  completedFlows: Record<string, boolean>;
  onFlowComplete: (flowId: string) => Promise<void>;
  allComplete: boolean;
  onProceed: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const FONT = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#6B2FA0';
const PRIMARY_DARK = '#4a1080';
const PRIMARY_DEEP = '#2d0066';
const PRIMARY_LIGHT = '#9B59B6';
const PRIMARY_LIGHTER = '#c084fc';
const GRADIENT_PRIMARY = `linear-gradient(135deg, ${PRIMARY_DARK}, ${PRIMARY_LIGHT})`;
const GRADIENT_HEADER = `linear-gradient(135deg, ${PRIMARY_DEEP}, ${PRIMARY})`;
const AUTO_ADVANCE_DELAY = 2000;
const TYPING_DELAY = 1500;

// ── Keyframe styles (injected once) ─────────────────────────────────────────

const KEYFRAMES = `
@keyframes protoTypingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}
@keyframes protoFadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes protoPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes protoCheckPop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes protoConfetti1 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-60px, -120px) rotate(360deg); opacity: 0; }
}
@keyframes protoConfetti2 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(40px, -140px) rotate(-280deg); opacity: 0; }
}
@keyframes protoConfetti3 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(80px, -100px) rotate(200deg); opacity: 0; }
}
@keyframes protoConfetti4 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-80px, -90px) rotate(-300deg); opacity: 0; }
}
@keyframes protoConfetti5 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(20px, -160px) rotate(400deg); opacity: 0; }
}
@keyframes protoShine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

// ── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end',
      animation: 'protoFadeSlideUp 0.3s ease both',
    }}>
      <BotAvatar />
      <div style={{
        background: '#f3ebfc', borderRadius: '4px 14px 14px 14px',
        padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 0.18, 0.36].map((d, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: PRIMARY_LIGHT,
            animation: `protoTypingBounce 1.1s ${d}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      background: GRADIENT_HEADER,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <RobotOutlined style={{ fontSize: 14, color: '#fff' }} />
    </div>
  );
}

function InstructionBubble({ content }: { content: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end',
      animation: 'protoFadeSlideUp 0.35s ease both',
    }}>
      <BotAvatar />
      <div style={{
        maxWidth: '78%', background: '#f5f5f5',
        borderRadius: '4px 14px 14px 14px',
        padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
        color: '#333', fontWeight: 500,
      }}>
        {content}
      </div>
    </div>
  );
}

function ActionBubble({
  content,
  hint,
  onTap,
  tapped,
}: {
  content: string;
  hint?: string;
  onTap: () => void;
  tapped: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      marginBottom: 12,
      animation: 'protoFadeSlideUp 0.35s ease both',
    }}>
      <div
        onClick={tapped ? undefined : onTap}
        style={{
          maxWidth: '78%',
          background: tapped
            ? 'linear-gradient(135deg, #7B35B8, #9B59B6)'
            : GRADIENT_PRIMARY,
          borderRadius: '14px 14px 4px 14px',
          padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
          color: '#fff', fontWeight: 600,
          cursor: tapped ? 'default' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          opacity: tapped ? 0.75 : 1,
        }}
      >
        {content}
        {!tapped && (
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
            animation: 'protoPulse 2s ease-in-out infinite',
          }}>
            <PlayCircleOutlined style={{ fontSize: 13 }} />
            Tap to continue
          </div>
        )}
      </div>
      {hint && (
        <div style={{
          maxWidth: '78%', marginTop: 4,
          fontSize: 11, fontStyle: 'italic', color: '#aaa', lineHeight: 1.5,
          paddingRight: 4,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function SuccessBubble({ content }: { content: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end',
      animation: 'protoFadeSlideUp 0.35s ease both',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, #52c41a, #73d13d)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleOutlined style={{
          fontSize: 16, color: '#fff',
          animation: 'protoCheckPop 0.45s ease both',
        }} />
      </div>
      <div style={{
        maxWidth: '78%', background: '#f6ffed',
        border: '1.5px solid #b7eb8f',
        borderRadius: '4px 14px 14px 14px',
        padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
        color: '#389e0d', fontWeight: 600,
      }}>
        {content}
      </div>
    </div>
  );
}

function ConfettiEffect() {
  const confettiColors = ['#6B2FA0', '#9B59B6', '#c084fc', '#ffd700', '#52c41a', '#ff6b6b', '#4ecdc4'];
  const confettiPieces = Array.from({ length: 18 }, (_, i) => ({
    color: confettiColors[i % confettiColors.length],
    left: `${10 + Math.random() * 80}%`,
    animName: `protoConfetti${(i % 5) + 1}`,
    delay: `${Math.random() * 0.6}s`,
    size: 6 + Math.random() * 6,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'rect',
  }));

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10,
    }}>
      {confettiPieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: '40%',
          left: p.left,
          width: p.shape === 'rect' ? p.size * 1.5 : p.size,
          height: p.size,
          borderRadius: p.shape === 'circle' ? '50%' : 2,
          background: p.color,
          animation: `${p.animName} 1.4s ${p.delay} ease-out forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

function FlowCard({
  flow,
  isActive,
  isCompleted,
  completedStepCount,
  onClick,
}: {
  flow: PrototypeFlow;
  isActive: boolean;
  isCompleted: boolean;
  completedStepCount: number;
  onClick: () => void;
}) {
  const totalSteps = flow.steps.length;

  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? '#f9f5ff' : '#fff',
        borderRadius: 14,
        border: isActive
          ? `2px solid ${PRIMARY}`
          : isCompleted
            ? '2px solid #b7eb8f'
            : '1.5px solid #f0e8ff',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isActive ? `0 4px 16px rgba(107,47,160,0.12)` : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Status icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginTop: 1,
          background: isCompleted
            ? 'linear-gradient(135deg, #52c41a, #73d13d)'
            : isActive
              ? GRADIENT_PRIMARY
              : '#f0e8ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isCompleted
            ? <CheckCircleOutlined style={{ fontSize: 15, color: '#fff' }} />
            : isActive
              ? <ThunderboltOutlined style={{ fontSize: 14, color: '#fff' }} />
              : <PlayCircleOutlined style={{ fontSize: 14, color: PRIMARY_LIGHT }} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: isCompleted ? '#389e0d' : isActive ? PRIMARY_DARK : '#1a1a2e',
            marginBottom: 3, lineHeight: 1.3,
          }}>
            {flow.title}
          </div>
          <div style={{
            fontSize: 11, color: '#aaa', lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {flow.description}
          </div>

          {/* Step progress */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 2, background: '#f0e8ff', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${isCompleted ? 100 : (completedStepCount / totalSteps) * 100}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #52c41a, #73d13d)'
                  : `linear-gradient(90deg, ${PRIMARY_DARK}, ${PRIMARY_LIGHT})`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, flexShrink: 0,
              color: isCompleted ? '#52c41a' : PRIMARY,
            }}>
              {isCompleted ? 'Done' : `${completedStepCount}/${totalSteps}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PrototypeSimulator({
  config,
  completedFlows,
  onFlowComplete,
  allComplete,
  onProceed,
}: Props) {
  // ── State ────────────────────────
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedBubbles, setDisplayedBubbles] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [tappedActions, setTappedActions] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived values ───────────────
  const activeFlow = useMemo(
    () => config.flows.find(f => f.id === activeFlowId) ?? null,
    [config.flows, activeFlowId],
  );

  const completedFlowCount = useMemo(
    () => config.flows.filter(f => completedFlows[f.id]).length,
    [config.flows, completedFlows],
  );

  // ── Responsive check ─────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Auto-select first incomplete flow ─
  useEffect(() => {
    if (activeFlowId) return;
    const first = config.flows.find(f => !completedFlows[f.id]);
    if (first) {
      setActiveFlowId(first.id);
    } else if (config.flows.length > 0) {
      setActiveFlowId(config.flows[0].id);
    }
  }, [config.flows, completedFlows, activeFlowId]);

  // ── Scroll chat to bottom ────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedBubbles, showTyping]);

  // ── Clean up timers ──────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Reset state when switching flows ─
  useEffect(() => {
    if (!activeFlow) return;
    setCurrentStepIndex(0);
    setDisplayedBubbles([]);
    setShowTyping(false);
    setTappedActions({});
    if (timerRef.current) clearTimeout(timerRef.current);

    // If the flow is already completed, show all bubbles
    if (completedFlows[activeFlow.id]) {
      setDisplayedBubbles(activeFlow.steps.map((_, i) => i));
      return;
    }

    // Start showing first step with typing indicator
    setShowTyping(true);
    timerRef.current = setTimeout(() => {
      setShowTyping(false);
      setDisplayedBubbles([0]);
      setCurrentStepIndex(0);
    }, TYPING_DELAY);
  }, [activeFlowId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-advance for instruction steps ─
  useEffect(() => {
    if (!activeFlow || completedFlows[activeFlow.id]) return;
    if (displayedBubbles.length === 0) return;

    const lastBubbleIdx = displayedBubbles[displayedBubbles.length - 1];
    const step = activeFlow.steps[lastBubbleIdx];
    if (!step) return;

    // Auto-advance instruction steps after delay
    if (step.type === 'instruction') {
      timerRef.current = setTimeout(() => {
        advanceToNext(lastBubbleIdx);
      }, AUTO_ADVANCE_DELAY);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    // Auto-advance success steps (a bit faster)
    if (step.type === 'success') {
      timerRef.current = setTimeout(() => {
        advanceToNext(lastBubbleIdx);
      }, AUTO_ADVANCE_DELAY);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [displayedBubbles, activeFlow, completedFlows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show celebration when all complete ─
  useEffect(() => {
    if (allComplete && completedFlowCount === config.flows.length) {
      setShowCelebration(true);
    }
  }, [allComplete, completedFlowCount, config.flows.length]);

  // ── Advance logic ────────────────
  const advanceToNext = useCallback((fromIndex: number) => {
    if (!activeFlow) return;
    const nextIndex = fromIndex + 1;

    if (nextIndex >= activeFlow.steps.length) {
      // Flow completed
      handleFlowComplete();
      return;
    }

    setShowTyping(true);
    timerRef.current = setTimeout(() => {
      setShowTyping(false);
      setDisplayedBubbles(prev => [...prev, nextIndex]);
      setCurrentStepIndex(nextIndex);
    }, TYPING_DELAY);
  }, [activeFlow]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActionTap = useCallback((stepIdx: number) => {
    if (!activeFlow) return;
    const key = `${activeFlow.id}-${stepIdx}`;
    if (tappedActions[key]) return;

    setTappedActions(prev => ({ ...prev, [key]: true }));
    advanceToNext(stepIdx);
  }, [activeFlow, tappedActions, advanceToNext]);

  const handleFlowComplete = useCallback(async () => {
    if (!activeFlow || completing) return;
    setCompleting(true);
    try {
      await onFlowComplete(activeFlow.id);
    } finally {
      setCompleting(false);
    }
  }, [activeFlow, completing, onFlowComplete]);

  const selectFlow = useCallback((flowId: string) => {
    if (flowId === activeFlowId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveFlowId(flowId);
  }, [activeFlowId]);

  // ── Render ───────────────────────

  if (!config.enabled) return null;

  const flowPanel = (
    <div style={{
      width: isMobile ? '100%' : '40%',
      minWidth: isMobile ? undefined : 300,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
      order: isMobile ? -1 : undefined,
    }}>
      {/* Flow panel header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1.5px solid #f0e8ff',
      }}>
        <div style={{
          fontSize: 17, fontWeight: 800, color: '#1a1a2e',
          marginBottom: 4, letterSpacing: -0.2,
        }}>
          {config.title}
        </div>
        <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>
          {config.description}
        </div>
        {config.points_reward > 0 && (
          <Tag
            style={{
              marginTop: 8, background: '#f9f5ff', border: '1px solid #e8d5ff',
              color: PRIMARY, fontWeight: 700, fontSize: 11, borderRadius: 8,
              padding: '2px 10px',
            }}
          >
            <StarFilled style={{ color: '#ffd700', marginRight: 4 }} />
            {config.points_reward} points on completion
          </Tag>
        )}
      </div>

      {/* Flow list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxHeight: isMobile ? 260 : undefined,
      }}>
        {config.flows.map(flow => {
          const isCompleted = !!completedFlows[flow.id];
          const isActive = flow.id === activeFlowId;
          // Calculate completed step count for active flow
          let completedStepCount = 0;
          if (isCompleted) {
            completedStepCount = flow.steps.length;
          } else if (isActive && activeFlow) {
            completedStepCount = displayedBubbles.length;
          }

          return (
            <FlowCard
              key={flow.id}
              flow={flow}
              isActive={isActive}
              isCompleted={isCompleted}
              completedStepCount={completedStepCount}
              onClick={() => selectFlow(flow.id)}
            />
          );
        })}
      </div>

      {/* Bottom: overall progress + proceed */}
      <div style={{
        padding: '16px 20px', borderTop: '1.5px solid #f0e8ff',
        background: '#faf8ff',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>
            {completedFlowCount}/{config.flows.length} flows
          </span>
        </div>
        <Progress
          percent={Math.round((completedFlowCount / Math.max(config.flows.length, 1)) * 100)}
          strokeColor={{ from: PRIMARY_DARK, to: PRIMARY_LIGHTER }}
          trailColor="#f0e8ff"
          size="small"
          showInfo={false}
          style={{ marginBottom: allComplete ? 14 : 0 }}
        />
        {allComplete && (
          <Button
            type="primary"
            size="large"
            block
            onClick={onProceed}
            icon={<RightOutlined />}
            style={{
              background: GRADIENT_PRIMARY,
              border: 'none',
              borderRadius: 12,
              height: 44,
              fontWeight: 800,
              fontSize: 14,
              fontFamily: FONT,
              boxShadow: '0 4px 16px rgba(107,47,160,0.35)',
            }}
          >
            Proceed to Quiz
          </Button>
        )}
      </div>
    </div>
  );

  const simulatorPanel = (
    <div style={{
      width: isMobile ? '100%' : '60%',
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
      position: 'relative',
    }}>
      {/* Phone frame */}
      <div style={{
        flex: 1,
        margin: isMobile ? '0' : '20px 20px 20px 24px',
        borderRadius: 24,
        border: '2.5px solid #2a2a3d',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(107,47,160,0.08)',
        minHeight: isMobile ? 420 : 480,
        maxHeight: isMobile ? 500 : 600,
        position: 'relative',
      }}>
        {/* Celebration overlay */}
        {showCelebration && <ConfettiEffect />}

        {/* Phone top bar (notch area) */}
        <div style={{
          height: 28, background: '#1a1a2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 60, height: 4, borderRadius: 3, background: '#3a3a5a',
          }} />
        </div>

        {/* Flow header bar */}
        <div style={{
          background: GRADIENT_HEADER,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'rgba(255,255,255,0.13)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MobileOutlined style={{ fontSize: 15, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {activeFlow?.title ?? 'Select a flow'}
            </div>
            {activeFlow && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {completedFlows[activeFlow.id]
                  ? 'Completed'
                  : `Step ${Math.min(displayedBubbles.length, activeFlow.steps.length)} of ${activeFlow.steps.length}`
                }
              </div>
            )}
          </div>
          {/* Step counter badge */}
          {activeFlow && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>
              {completedFlows[activeFlow.id]
                ? `${activeFlow.steps.length}/${activeFlow.steps.length}`
                : `${displayedBubbles.length}/${activeFlow.steps.length}`
              }
            </div>
          )}
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 14px',
          background: '#fafafa',
        }}>
          {/* Empty state */}
          {!activeFlow && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', padding: 20,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, marginBottom: 14,
                background: 'linear-gradient(135deg, #f3ebfc, #e8d5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PlayCircleOutlined style={{ fontSize: 24, color: PRIMARY }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>
                Select a flow to begin
              </div>
              <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                Choose a practice flow from the panel to start the interactive simulation.
              </div>
            </div>
          )}

          {/* Celebration state */}
          {showCelebration && activeFlow && completedFlows[activeFlow.id] && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '30px 16px', textAlign: 'center',
              animation: 'protoFadeSlideUp 0.5s ease both',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, marginBottom: 16,
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(255,215,0,0.3)',
              }}>
                <TrophyOutlined style={{ fontSize: 34, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>
                All Flows Complete!
              </div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 4 }}>
                You have successfully completed all practice flows.
                {config.points_reward > 0 && (
                  <span style={{ color: PRIMARY, fontWeight: 700 }}>
                    {' '}+{config.points_reward} points earned!
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>
                You are ready to take the quiz.
              </div>
            </div>
          )}

          {/* Displayed bubbles */}
          {activeFlow && !(showCelebration && allComplete) && displayedBubbles.map(stepIdx => {
            const step = activeFlow.steps[stepIdx];
            if (!step) return null;

            if (step.type === 'instruction') {
              return <InstructionBubble key={step.id} content={step.content} />;
            }

            if (step.type === 'action') {
              const tapped = !!tappedActions[`${activeFlow.id}-${stepIdx}`]
                || !!completedFlows[activeFlow.id];
              return (
                <ActionBubble
                  key={step.id}
                  content={step.content}
                  hint={step.hint}
                  onTap={() => handleActionTap(stepIdx)}
                  tapped={tapped}
                />
              );
            }

            if (step.type === 'success') {
              return <SuccessBubble key={step.id} content={step.content} />;
            }

            return null;
          })}

          {/* Typing indicator */}
          {showTyping && <TypingIndicator />}

          <div ref={chatEndRef} style={{ height: 8 }} />
        </div>

        {/* Bottom bar */}
        <div style={{
          padding: '10px 14px', borderTop: '1px solid #f0f0f0',
          background: '#fff', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {activeFlow && !completedFlows[activeFlow.id] && displayedBubbles.length > 0 && (
            (() => {
              const lastIdx = displayedBubbles[displayedBubbles.length - 1];
              const lastStep = activeFlow.steps[lastIdx];
              const isLast = lastIdx === activeFlow.steps.length - 1;

              // For action steps that haven't been tapped, show helper text
              if (lastStep?.type === 'action' && !tappedActions[`${activeFlow.id}-${lastIdx}`]) {
                return (
                  <div style={{
                    fontSize: 11, color: '#bbb', fontStyle: 'italic',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <ThunderboltOutlined style={{ color: PRIMARY_LIGHTER }} />
                    Tap the purple message above to continue
                  </div>
                );
              }

              // Show step progress text
              if (!isLast && !showTyping) {
                return (
                  <div style={{ fontSize: 11, color: '#ccc' }}>
                    Processing next step...
                  </div>
                );
              }

              if (isLast && lastStep?.type !== 'action') {
                return (
                  <div style={{
                    fontSize: 11, color: completing ? '#bbb' : PRIMARY,
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {completing ? 'Completing...' : 'Completing flow...'}
                  </div>
                );
              }

              return null;
            })()
          )}

          {activeFlow && completedFlows[activeFlow.id] && !allComplete && (
            <div style={{
              fontSize: 12, color: '#52c41a', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <CheckCircleOutlined />
              Flow completed! Select the next flow to continue.
            </div>
          )}

          {allComplete && (
            <div style={{
              fontSize: 12, fontWeight: 700,
              background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_LIGHTER})`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'protoShine 3s linear infinite',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <TrophyOutlined style={{ color: '#ffd700', WebkitTextFillColor: '#ffd700' }} />
              All practice flows completed!
            </div>
          )}

          {!activeFlow && (
            <div style={{ fontSize: 11, color: '#ccc' }}>
              Select a flow to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily: FONT,
      background: '#fff',
      borderRadius: 20,
      border: '1.5px solid #f0e8ff',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(107,47,160,0.08)',
    }}>
      {/* Section header */}
      <div style={{
        background: GRADIENT_HEADER,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ThunderboltOutlined style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
            Interactive Practice
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
            Walk through simulated flows before taking the quiz
          </div>
        </div>
        {allComplete && (
          <Tag style={{
            marginLeft: 'auto', background: 'rgba(82,196,26,0.2)',
            border: '1px solid rgba(82,196,26,0.35)',
            color: '#73d13d', fontWeight: 700, fontSize: 11,
            borderRadius: 8,
          }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            Complete
          </Tag>
        )}
      </div>

      {/* Main body: simulator + flow panel */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: isMobile ? undefined : 540,
      }}>
        {simulatorPanel}

        {/* Vertical divider */}
        {!isMobile && (
          <div style={{ width: 1, background: '#f0e8ff', flexShrink: 0 }} />
        )}

        {flowPanel}
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}
