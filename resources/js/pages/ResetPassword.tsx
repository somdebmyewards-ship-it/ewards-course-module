import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const LOGO = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const onFinish = async (values: { password: string; password_confirmation: string }) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, email, ...values });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #2d0a5e 50%, #1a0533 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 420, width: '100%' }}>
          <Alert type="error" message="Invalid reset link" description="This link is missing required parameters. Please request a new password reset." showIcon />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/forgot-password" style={{ color: '#6B2FA0', fontWeight: 600 }}>Request new reset link</Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Set new password</div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>
            Resetting for <strong>{email}</strong>
          </div>
        </div>

        {done ? (
          <Alert
            type="success"
            message="Password reset!"
            description="Your password has been updated. Redirecting to login…"
            showIcon
            style={{ borderRadius: 8 }}
          />
        ) : (
          <Form layout="vertical" onFinish={onFinish}>
            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}
            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600 }}>New password</span>}
              rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                placeholder="At least 8 characters"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password_confirmation"
              label={<span style={{ fontWeight: 600 }}>Confirm password</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                placeholder="Repeat your password"
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
              {loading ? 'Resetting…' : 'Reset Password'}
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
