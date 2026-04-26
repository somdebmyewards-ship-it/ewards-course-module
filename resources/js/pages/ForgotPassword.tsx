import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const LOGO = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values: { email: string }) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', values);
      setSent(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0533 0%, #2d0a5e 50%, #1a0533 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO} alt="eWards" style={{ height: 28, marginBottom: 20 }} />
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Forgot password?</div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>
            Enter your email and we'll send a reset link.
          </div>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

        {sent ? (
          <Alert
            type="success"
            message="Reset link sent"
            description="If that email is registered, you'll receive a password reset link shortly. Check your inbox (and spam folder)."
            showIcon
            style={{ borderRadius: 8 }}
          />
        ) : (
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600 }}>Email address</span>}
              rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bbb' }} />}
                placeholder="you@ewards.in"
                size="large"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ background: '#6B2FA0', border: 'none', borderRadius: 8, fontWeight: 600, marginTop: 4 }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#6B2FA0', fontSize: 13, fontWeight: 600 }}>
            <ArrowLeftOutlined style={{ marginRight: 4 }} />Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
