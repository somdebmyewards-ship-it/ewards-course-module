import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0035 0%, #3d0080 60%, #5B1F8A 100%)',
      fontFamily: 'inherit',
    }}>
      <div style={{
        textAlign: 'center', padding: '48px 32px',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)',
        borderRadius: 24, border: '1px solid rgba(255,255,255,0.12)',
        maxWidth: 420, width: '90%',
      }}>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.12)', lineHeight: 1, marginBottom: -16 }}>404</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Page not found</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or may have been moved.
        </div>
        <button
          onClick={() => navigate('/learning-hub')}
          style={{
            padding: '13px 32px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #7B35B8, #9B59D6)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(107,47,160,0.5)',
          }}
        >
          Go to Learning Hub
        </button>
      </div>
    </div>
  );
}
