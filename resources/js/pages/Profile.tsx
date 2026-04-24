import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Typography, Avatar, Tag } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import BadgeShelf from '@/components/BadgeShelf';

const { Title, Text } = Typography;
const PURPLE = '#6B2FA0';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  designation: string | null;
  role: string;
  points: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      form.setFieldsValue({
        name: r.data.name,
        mobile: r.data.mobile ?? '',
        designation: r.data.designation ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      await api.patch('/profile', {
        name: values.name,
        mobile: values.mobile || null,
        designation: values.designation || null,
      });
      message.success('Profile updated');
      setProfile(p => p ? { ...p, name: values.name, mobile: values.mobile, designation: values.designation } : p);
    } catch {
      message.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      await api.patch('/profile', {
        name: profile!.name,
        current_password: values.current_password,
        new_password: values.new_password,
        new_password_confirmation: values.new_password_confirmation,
      });
      message.success('Password changed successfully');
      pwForm.resetFields();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to change password';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getLevel = (points: number) => {
    if (points >= 500) return 'Expert';
    if (points >= 250) return 'Specialist';
    if (points >= 100) return 'Practitioner';
    return 'Beginner';
  };

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = { Expert: 'gold', Specialist: 'purple', Practitioner: 'blue', Beginner: 'default' };
    return map[level] ?? 'default';
  };

  const level = getLevel(profile?.points ?? user?.points ?? 0);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header card */}
      <Card
        loading={loading}
        style={{ borderRadius: 16, marginBottom: 24, border: '1.5px solid #ede4ff', boxShadow: '0 2px 12px rgba(107,47,160,0.07)' }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #4a1080, #7B35B8)', flexShrink: 0 }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>{profile?.name ?? user?.name}</Title>
            <Text style={{ color: '#666', fontSize: 13 }}>{profile?.email ?? user?.email}</Text>
            <div style={{ marginTop: 6 }}>
              <Tag color={getLevelColor(level)}>{level}</Tag>
              <Tag color="purple" style={{ marginLeft: 4 }}>{profile?.points ?? user?.points ?? 0} pts</Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile fields */}
      <Card
        title={<span style={{ color: PURPLE, fontWeight: 700 }}>Personal Information</span>}
        style={{ borderRadius: 16, marginBottom: 24, border: '1.5px solid #ede4ff' }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Form form={form} layout="vertical" onFinish={saveProfile}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input size="large" placeholder="Your full name" />
          </Form.Item>
          <Form.Item label="Email">
            <Input size="large" value={profile?.email ?? user?.email} disabled />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Mobile" name="mobile">
              <Input size="large" placeholder="e.g. +91 98765 43210" />
            </Form.Item>
            <Form.Item label="Designation" name="designation">
              <Input size="large" placeholder="e.g. Store Manager" />
            </Form.Item>
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary" htmlType="submit" icon={<SaveOutlined />}
              loading={saving} size="large"
              style={{ background: PURPLE, borderColor: PURPLE, borderRadius: 8 }}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Badges */}
      <Card
        title={<span style={{ color: PURPLE, fontWeight: 700 }}>🏅 My Badges</span>}
        style={{ borderRadius: 16, marginBottom: 24, border: '1.5px solid #ede4ff' }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <BadgeShelf />
      </Card>

      {/* Password change */}
      <Card
        title={<span style={{ color: PURPLE, fontWeight: 700 }}>Change Password</span>}
        style={{ borderRadius: 16, border: '1.5px solid #ede4ff' }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Form form={pwForm} layout="vertical" onFinish={changePassword}>
          <Form.Item
            label="Current Password" name="current_password"
            rules={[{ required: true, message: 'Enter your current password' }]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Current password" />
          </Form.Item>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Form.Item
            label="New Password" name="new_password"
            rules={[
              { required: true, message: 'Enter a new password' },
              { min: 8, message: 'At least 8 characters' },
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="New password (min 8 chars)" />
          </Form.Item>
          <Form.Item
            label="Confirm New Password" name="new_password_confirmation"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary" htmlType="submit" icon={<LockOutlined />}
              loading={saving} size="large"
              style={{ background: PURPLE, borderColor: PURPLE, borderRadius: 8 }}
            >
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
