import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const LOGO = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';
const GRAD = 'linear-gradient(90deg, #c86dd7 0%, #3023ae 55%, #f78c1f 100%)';

function EwardsLogo() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: '#ffffff',
      borderRadius: 10, padding: '8px 18px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
    }}>
      <img src={LOGO} alt="eWards" style={{ height: 24, display: 'block', objectFit: 'contain' }} />
    </div>
  );
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/learning-hub');
    } catch (err: any) {
      message.error(err.response?.data?.message || err.response?.data?.error || 'Invalid credentials.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

        .lr * { box-sizing: border-box; }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orb1 {
          0%,100% { transform: scale(1) translateY(0px); opacity: 1; }
          50%      { transform: scale(1.08) translateY(-16px); opacity: 0.7; }
        }
        @keyframes orb2 {
          0%,100% { transform: scale(1) translateX(0px); opacity: 0.8; }
          50%      { transform: scale(1.05) translateX(12px); opacity: 0.55; }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(111,223,138,0.7); }
          50%      { box-shadow: 0 0 0 5px rgba(111,223,138,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }

        .o1 { animation: orb1 10s ease-in-out infinite; }
        .o2 { animation: orb2 13s ease-in-out infinite; }
        .o3 { animation: orb1  8s ease-in-out infinite; animation-delay: 3s; }
        .o4 { animation: orb2 15s ease-in-out infinite; animation-delay: 6s; }
        .green-dot { animation: pulse 2.4s ease-in-out infinite; }
        .card-in   { animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        /* ── Inputs ── */
        .lr-form .ant-input-affix-wrapper {
          background: #f9f6ff !important;
          border: 1.5px solid #e2d5f5 !important;
          border-radius: 12px !important;
          height: 52px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 14px !important;
          transition: all 0.2s ease !important;
          padding: 0 16px !important;
          box-shadow: none !important;
        }
        .lr-form .ant-input-affix-wrapper:hover {
          border-color: #b48fd8 !important;
          background: #f5efff !important;
        }
        .lr-form .ant-input-affix-wrapper-focused,
        .lr-form .ant-input-affix-wrapper:focus-within {
          border-color: #7b2cbf !important;
          background: #f5efff !important;
          box-shadow: 0 0 0 3px rgba(123,44,191,0.09) !important;
        }
        .lr-form .ant-input {
          background: transparent !important;
          color: #120929 !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .lr-form .ant-input::placeholder { color: #c4b0d8 !important; }
        .lr-form .ant-input:-webkit-autofill,
        .lr-form .ant-input:-webkit-autofill:hover,
        .lr-form .ant-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #f5efff inset !important;
          -webkit-text-fill-color: #120929 !important;
        }
        .lr-form .ant-input-prefix { color: #a882cc !important; margin-right: 10px !important; }
        .lr-form .ant-input-suffix .anticon,
        .lr-form .ant-input-password-icon { color: #a882cc !important; }
        .lr-form .ant-input-password-icon:hover { color: #7b2cbf !important; }
        .lr-form .ant-form-item { margin-bottom: 0 !important; }
        .lr-form .ant-form-item-label { padding-bottom: 0 !important; }
        .lr-form .ant-form-item-explain-error {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 12px !important;
          color: #dc2626 !important;
          margin-top: 5px !important;
        }

        /* ── Sign In Button ── */
        .sign-btn {
          height: 52px !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          letter-spacing: 0.01em !important;
          border: none !important;
          background: linear-gradient(135deg, #7b2cbf 0%, #5b17a0 50%, #3a0d8a 100%) !important;
          box-shadow: 0 4px 16px rgba(91,23,160,0.35), 0 1px 0 rgba(255,255,255,0.12) inset !important;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease !important;
          position: relative;
          overflow: hidden;
        }
        .sign-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          background-size: 400px 100%;
          animation: shimmer 3s infinite;
        }
        .sign-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 28px rgba(91,23,160,0.45), 0 1px 0 rgba(255,255,255,0.14) inset !important;
        }
        .sign-btn:active:not(:disabled) { transform: translateY(0) !important; }

        @media (max-width: 860px) {
          .lr-left    { display: none !important; }
          .lr-divider { display: none !important; }
        }
      `}</style>

      <div className="lr" style={{
        minHeight: '100vh', display: 'flex',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="lr-left" style={{
          width: '46%', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          padding: '48px 52px',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(150deg, #2d0a6e 0%, #5b1fa0 40%, #7b2cbf 70%, #3a0d8a 100%)',
          zIndex: 1,
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:GRAD, zIndex:2 }} />

          <div className="o1" style={{ position:'absolute', top:-160, left:-120, width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle, rgba(160,100,255,0.28) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }} />
          <div className="o2" style={{ position:'absolute', bottom:-140, right:-80, width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(120,60,220,0.30) 0%, transparent 65%)', filter:'blur(55px)', pointerEvents:'none' }} />
          <div className="o3" style={{ position:'absolute', top:'40%', right:'-5%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(247,140,31,0.18) 0%, transparent 70%)', filter:'blur(32px)', pointerEvents:'none' }} />

          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize:'26px 26px' }} />

          <div style={{ position:'absolute', right:-140, top:'12%', width:520, height:520, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:-90, top:'18%', width:380, height:380, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.04)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <EwardsLogo />
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', zIndex:1 }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:54, fontWeight:900, lineHeight:1.05, color:'#ffffff', letterSpacing:'-2px', marginBottom:2 }}>
                Learning
              </div>
              <div style={{ fontSize:54, fontWeight:900, lineHeight:1.05, letterSpacing:'-2px', color:'#e879f9' }}>
                Hub
              </div>
            </div>

            <p style={{ margin:'0 0 36px', fontSize:13.5, lineHeight:1.85, color:'rgba(255,255,255,0.50)', maxWidth:268 }}>
              Restricted to authorised eWards staff, brand partners, and store teams.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:38 }}>
              {[
                { text:'Product Feature Learning' },
                { text:'Interactive Modules & Quizzes' },
                { text:'Certified on Completion' },
              ].map(f => (
                <div key={f.text} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#e879f9', flexShrink:0, boxShadow:'0 0 8px rgba(232,121,249,0.6)' }} />
                  <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{f.text}</span>
                </div>
              ))}
            </div>

            <div style={{ width:44, height:3, borderRadius:3, background:GRAD }} />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="lr-divider" style={{
          width: 1, flexShrink: 0, alignSelf: 'stretch', zIndex: 2,
          background: 'linear-gradient(180deg, transparent 0%, rgba(180,140,240,0.3) 15%, rgba(180,140,240,0.3) 85%, transparent 100%)',
        }} />

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 48px',
          position: 'relative', overflow: 'hidden',
          background: '#ffffff',
          zIndex: 1,
        }}>
          {/* Subtle dot grid */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle, rgba(140,80,220,0.08) 1px, transparent 1px)', backgroundSize:'24px 24px' }} />

          {/* Soft corner orbs */}
          <div className="o4" style={{ position:'absolute', top:-120, right:-120, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(140,80,220,0.10) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }} />
          <div className="o2" style={{ position:'absolute', bottom:-100, left:-80, width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,50,200,0.08) 0%, transparent 65%)', filter:'blur(55px)', pointerEvents:'none' }} />

          {/* ── Card ── */}
          <div className="card-in" style={{
            width: '100%', maxWidth: 420,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #ede4f8',
            boxShadow: '0 2px 4px rgba(100,50,180,0.04), 0 8px 20px rgba(100,50,180,0.08), 0 32px 64px rgba(100,50,180,0.10)',
            overflow: 'hidden',
            position: 'relative', zIndex: 1,
          }}>

            {/* Top gradient strip */}
            <div style={{ height: 4, background: GRAD }} />

            <div style={{ padding: '36px 36px 30px' }}>

              {/* Heading */}
              <div style={{ marginBottom: 30 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#9b59c0',
                  background: '#f5eeff', borderRadius: 20, padding: '4px 12px',
                  marginBottom: 14,
                }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#c084fc', display:'inline-block' }} />
                  Welcome back
                </div>
                <h2 style={{ margin:'0 0 8px', fontSize:26, fontWeight:800, color:'#120929', letterSpacing:'-0.5px', lineHeight:1.2 }}>
                  Sign in
                </h2>
                <p style={{ margin:0, fontSize:13, color:'#9285a0', lineHeight:1.65 }}>
                  Use your eWards credentials to access the Learning Hub.
                </p>
              </div>

              {/* Form */}
              <div className="lr-form">
                <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 7 }}><FL>Email address</FL></div>
                    <Form.Item
                      name="email"
                      rules={[{ required:true, type:'email', message:'Enter a valid email' }]}
                    >
                      <Input prefix={<MailOutlined style={{ fontSize:14 }} />} placeholder="you@ewards.in" />
                    </Form.Item>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <FL>Password</FL>
                      <a href="#" style={{ fontSize:12, color:'#7b2cbf', fontWeight:600, textDecoration:'none', letterSpacing:'-0.01em' }}>
                        Forgot password?
                      </a>
                    </div>
                    <Form.Item
                      name="password"
                      rules={[{ required:true, message:'Password is required' }]}
                    >
                      <Input.Password prefix={<LockOutlined style={{ fontSize:14 }} />} placeholder="Enter your password" />
                    </Form.Item>
                  </div>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" block loading={loading} className="sign-btn">
                      {loading ? 'Signing in…' : 'Sign In →'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
                <div style={{ flex:1, height:1, background:'#f0e8fc' }} />
                <span style={{ fontSize:11, color:'#c8b8dc', fontWeight:600, letterSpacing:'0.1em' }}>OR</span>
                <div style={{ flex:1, height:1, background:'#f0e8fc' }} />
              </div>

              {/* Request access */}
              <p style={{ margin:0, textAlign:'center', fontSize:13, color:'#9285a0' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color:'#7b2cbf', fontWeight:700, textDecoration:'none' }}>
                  Sign up
                </Link>
              </p>
            </div>

            {/* Card footer */}
            <div style={{
              borderTop: '1px solid #f5eeff',
              padding: '13px 36px',
              background: '#fcfaff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <SafetyCertificateOutlined style={{ fontSize:11, color:'#c8b8dc' }} />
              <span style={{ fontSize:12, color:'#a895bc' }}>
                Access issues?{' '}
                <a href="mailto:support@ewards.in" style={{ color:'#7b2cbf', textDecoration:'underline', textUnderlineOffset:3 }}>
                  support@ewards.in
                </a>
              </span>
            </div>
          </div>

          {/* Trust pills */}
          <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:22, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1 }}>
            {['SSL Secured','Data Encrypted','SOC 2 Ready'].map((t, i) => (
              <React.Fragment key={t}>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#a895bc', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase' }}>
                  <div className="green-dot" style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />
                  {t}
                </div>
                {i < 2 && <div style={{ width:1, height:10, background:'#e8d8f5' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function FL({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: '#7b5aa6',
      textTransform: 'uppercase', letterSpacing: '0.12em',
    }}>
      {children}
    </span>
  );
}
