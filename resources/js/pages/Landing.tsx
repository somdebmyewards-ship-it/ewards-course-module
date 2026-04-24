import { useNavigate } from 'react-router-dom';

const LOGO = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';
const GRAD = 'linear-gradient(135deg, #6B2FA0 0%, #3023ae 50%, #c86dd7 100%)';

const FEATURES = [
  {
    icon: '📚',
    title: 'Structured Learning Paths',
    desc: 'Role-specific modules — from POS basics to advanced loyalty strategy — with video, docs, and checklists.',
  },
  {
    icon: '🏆',
    title: 'Gamified Progress',
    desc: 'Earn points, climb levels from Beginner to Expert, unlock badges, and collect certificates your team is proud of.',
  },
  {
    icon: '🤖',
    title: 'Ask Ela — AI Assistant',
    desc: 'Every module comes with an AI tutor trained on your content. Instant answers, no support ticket needed.',
  },
  {
    icon: '📊',
    title: 'Admin Analytics',
    desc: 'Real-time leaderboards, module completion rates, per-merchant adoption, and quiz performance — all in one view.',
  },
];

const STEPS = [
  { num: '01', title: 'Browse Modules', desc: 'Explore a curated library of training content built for eWards merchant teams.' },
  { num: '02', title: 'Learn & Complete', desc: 'Watch videos, read guides, answer quizzes — at your own pace, on any device.' },
  { num: '03', title: 'Get Certified', desc: 'Earn points, unlock achievement badges, and download a verifiable certificate.' },
];

const STATS = [
  { value: '500+', label: 'Modules Completed' },
  { value: '4.8★', label: 'Avg Rating' },
  { value: '50+',  label: 'Certificates Issued' },
  { value: '10+',  label: 'Merchants Enrolled' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.06)} }
        @keyframes float2 { 0%,100%{transform:translateX(0) scale(1)} 50%{transform:translateX(18px) scale(1.04)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

        .orb1 { animation: float1 10s ease-in-out infinite; }
        .orb2 { animation: float2 13s ease-in-out infinite; }
        .orb3 { animation: float1  8s ease-in-out infinite; animation-delay:4s; }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both; }

        .nav-btn {
          padding: 9px 22px; border-radius: 40px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all .18s; border: none; font-family: inherit;
        }
        .btn-outline {
          background: transparent; border: 1.5px solid rgba(255,255,255,0.5); color: #fff;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.12); }
        .btn-primary {
          background: #fff; color: #6B2FA0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.22); }
        .btn-hero {
          padding: 15px 36px; border-radius: 40px; font-size: 16px; font-weight: 800;
          cursor: pointer; transition: all .2s; border: none; font-family: inherit;
        }
        .btn-hero-primary {
          background: #fff; color: #6B2FA0;
          box-shadow: 0 6px 32px rgba(0,0,0,0.22);
        }
        .btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.28); }
        .btn-hero-ghost {
          background: rgba(255,255,255,0.14); color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .btn-hero-ghost:hover { background: rgba(255,255,255,0.22); }

        .feature-card {
          background: #fff; border-radius: 20px; padding: 32px 28px;
          border: 1.5px solid #f0e6f8; transition: all .2s;
          box-shadow: 0 2px 16px rgba(107,47,160,0.06);
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(107,47,160,0.14);
          border-color: #c7a8e8;
        }

        .step-card {
          background: linear-gradient(135deg, #faf5ff, #f3ebfc);
          border-radius: 20px; padding: 32px 28px;
          border: 1.5px solid #ede0f8;
        }

        .stat-item { text-align: center; }

        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .steps-grid    { grid-template-columns: 1fr !important; }
          .hero-title    { font-size: 36px !important; }
          .stats-strip   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title    { font-size: 28px !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: GRAD,
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
        boxShadow: '0 2px 20px rgba(48,35,174,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '5px 12px' }}>
            <img src={LOGO} alt="eWards" style={{ height: 22, display: 'block' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
            LEARNING HUB
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="nav-btn btn-outline" onClick={() => navigate('/register')}>Register</button>
          <button className="nav-btn btn-primary" onClick={() => navigate('/login')}>Sign In →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: GRAD,
        padding: '80px 40px 100px',
        position: 'relative', overflow: 'hidden',
        minHeight: 560,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        {/* Orbs */}
        <div className="orb1" style={{ position:'absolute', top:-60, left:-80, width:340, height:340, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
        <div className="orb2" style={{ position:'absolute', bottom:-80, right:-60, width:420, height:420, borderRadius:'50%', background:'rgba(200,109,215,0.18)', pointerEvents:'none' }} />
        <div className="orb3" style={{ position:'absolute', top:80, right:120, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

        {/* Eyebrow */}
        <div className="fade-up" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(255,255,255,0.14)', borderRadius:40, padding:'7px 18px',
          marginBottom:28,
        }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#6fdf8a', display:'inline-block', boxShadow:'0 0 0 3px rgba(111,223,138,0.3)' }} />
          <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>Trusted by eWards merchants</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title fade-up-2" style={{
          fontSize:54, fontWeight:900, color:'#fff', lineHeight:1.12,
          maxWidth:720, marginBottom:20,
          textShadow:'0 2px 24px rgba(0,0,0,0.18)',
        }}>
          Train Smarter.<br />
          <span style={{ color:'#f8c8ff' }}>Certify Faster.</span><br />
          Grow Together.
        </h1>

        <p className="fade-up-3" style={{
          fontSize:18, color:'rgba(255,255,255,0.82)', maxWidth:520,
          lineHeight:1.65, marginBottom:40, fontWeight:400,
        }}>
          The all-in-one learning platform built for eWards merchant teams.
          Gamified, AI-powered, and designed to make training something your staff actually enjoys.
        </p>

        <div className="fade-up-3" style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', marginBottom:60 }}>
          <button className="btn-hero btn-hero-primary" onClick={() => navigate('/login')}>
            Sign In to Get Started →
          </button>
          <button className="btn-hero btn-hero-ghost" onClick={() => navigate('/register')}>
            Create Account
          </button>
        </div>

        {/* Floating product preview card */}
        <div className="fade-up-3" style={{
          background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
          border:'1px solid rgba(255,255,255,0.25)', borderRadius:20,
          padding:'20px 32px', maxWidth:640, width:'100%',
          display:'flex', gap:24, alignItems:'center',
          boxShadow:'0 8px 40px rgba(0,0,0,0.2)',
        }}>
          {['📚 12 Modules', '🏆 3 Levels', '🤖 Ask Ela AI', '🎓 Certificates'].map((item, i) => (
            <div key={i} style={{ color:'#fff', fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>{item}</div>
          ))}
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section style={{ background:'#faf5ff', borderBottom:'1px solid #ede0f8', padding:'36px 40px' }}>
        <div className="stats-strip" style={{
          display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          gap:24, maxWidth:800, margin:'0 auto',
        }}>
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <div style={{ fontSize:32, fontWeight:900, color:'#6B2FA0', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:13, color:'#888', marginTop:6, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:'80px 40px', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9B59B6', letterSpacing:2, marginBottom:12 }}>PLATFORM FEATURES</div>
            <h2 style={{ fontSize:36, fontWeight:800, color:'#1a1a2e' }}>Everything your team needs to level up</h2>
          </div>
          <div className="features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize:36, marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1a2e', marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'#666', lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding:'80px 40px', background:'#faf5ff' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9B59B6', letterSpacing:2, marginBottom:12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize:36, fontWeight:800, color:'#1a1a2e' }}>Up and running in minutes</h2>
          </div>
          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div style={{ fontSize:40, fontWeight:900, color:'#c7a8e8', marginBottom:14, lineHeight:1 }}>{s.num}</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#6B2FA0', marginBottom:10 }}>{s.title}</h3>
                <p style={{ fontSize:14, color:'#666', lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification highlight ── */}
      <section style={{ padding:'80px 40px', background:'#fff' }}>
        <div style={{ maxWidth:960, margin:'0 auto', display:'flex', gap:60, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9B59B6', letterSpacing:2, marginBottom:12 }}>BUILT FOR ENGAGEMENT</div>
            <h2 style={{ fontSize:32, fontWeight:800, color:'#1a1a2e', marginBottom:16 }}>
              Learning that feels like winning
            </h2>
            <p style={{ fontSize:15, color:'#666', lineHeight:1.7, marginBottom:24 }}>
              Points, leaderboards, achievement badges, and level-up milestones keep your team coming back.
              Cashiers become Practitioners. Practitioners become Experts.
            </p>
            <button className="nav-btn btn-primary" style={{ background:'#6B2FA0', color:'#fff', padding:'12px 28px', fontSize:15 }}
              onClick={() => navigate('/register')}>
              Get Your Team Started →
            </button>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            {/* Level progression visual */}
            {[
              { level:'Beginner',     pts:0,   color:'#8c8c8c', pct:0 },
              { level:'Practitioner', pts:100,  color:'#52c41a', pct:25 },
              { level:'Specialist',   pts:250,  color:'#1890ff', pct:55 },
              { level:'Expert',       pts:500,  color:'#722ed1', pct:100 },
            ].map((l, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:l.color, display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:800, fontSize:12,
                }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{l.level}</span>
                    <span style={{ fontSize:12, color:'#888' }}>{l.pts}+ pts</span>
                  </div>
                  <div style={{ height:6, borderRadius:6, background:'#f0e6f8', overflow:'hidden' }}>
                    <div style={{ width:`${l.pct}%`, height:'100%', background:l.color, borderRadius:6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{
        background: GRAD, padding:'80px 40px', textAlign:'center',
        position:'relative', overflow:'hidden',
      }}>
        <div className="orb1" style={{ position:'absolute', top:-40, left:-60, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div className="orb2" style={{ position:'absolute', bottom:-60, right:-40, width:320, height:320, borderRadius:'50%', background:'rgba(200,109,215,0.15)', pointerEvents:'none' }} />
        <h2 style={{ fontSize:38, fontWeight:900, color:'#fff', marginBottom:16, position:'relative' }}>
          Ready to transform your merchant team?
        </h2>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.78)', marginBottom:36, position:'relative' }}>
          Join eWards merchants already upskilling their teams with structured, gamified learning.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', position:'relative' }}>
          <button className="btn-hero btn-hero-primary" onClick={() => navigate('/login')}>
            Sign In to Get Started →
          </button>
          <button className="btn-hero btn-hero-ghost" onClick={() => navigate('/register')}>
            Create Account
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background:'#1a1a2e', padding:'28px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'#fff', borderRadius:6, padding:'4px 10px' }}>
            <img src={LOGO} alt="eWards" style={{ height:18, display:'block' }} />
          </div>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>Learning Hub</span>
        </div>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>© 2026 eWards. All rights reserved.</span>
      </footer>
    </div>
  );
}
