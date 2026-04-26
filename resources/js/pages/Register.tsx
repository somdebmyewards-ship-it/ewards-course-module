import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Select } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, ShopOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;
const LOGO = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await register(values);
      message.success('Account created! Please login to continue.');
      navigate('/login');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f0ff 0%, #e8e0f0 100%)' }}>
      <Card style={{ width: '100%', maxWidth: 420, margin: '0 16px', borderRadius: 16, boxShadow: '0 8px 30px rgba(107,47,160,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={LOGO} alt="eWards" style={{ height: 52, marginBottom: 8, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <div style={{ color: '#6B2FA0', fontWeight: 700, fontSize: 20, letterSpacing: 1, whiteSpace: 'nowrap' }}>Learning Hub</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Register to start your learning journey</div>
        </div>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="name" rules={[{ required: true, message: 'Enter your name' }]}>
            <Input prefix={<UserOutlined />} placeholder="Full name" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item name="password_confirmation" dependencies={['password']} rules={[{ required: true, message: 'Confirm password' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject('Passwords do not match'); } })]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>
          <Form.Item name="mobile">
            <Input prefix={<PhoneOutlined />} placeholder="Mobile (optional)" />
          </Form.Item>
          <Form.Item name="merchant_name_entered">
            <Input prefix={<ShopOutlined />} placeholder="Merchant Name (optional)" />
          </Form.Item>
          <Form.Item name="outlet_name_entered">
            <Input prefix={<ShopOutlined />} placeholder="Outlet Name (optional)" />
          </Form.Item>
          <Form.Item name="designation">
            <Input prefix={<IdcardOutlined />} placeholder="Your role in eWards (optional)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, borderRadius: 8, background: '#6B2FA0' }}>
              Create Account
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/login" style={{ color: '#6B2FA0', fontWeight: 600 }}>Log in</Link>
        </div>
      </Card>
    </div>
  );
}
