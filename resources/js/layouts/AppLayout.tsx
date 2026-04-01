import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Typography, Button, Dropdown, Space, Badge, Tag, theme } from 'antd';
import {
  BookOutlined, TrophyOutlined, EditOutlined, UserOutlined, DashboardOutlined,
  TeamOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,
  AppstoreOutlined, CheckCircleOutlined, StarOutlined, AuditOutlined, BulbOutlined, MessageOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import ChatWidget from '@/components/ChatWidget';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const roleDisplayName = (role?: string) => {
  const map: Record<string, string> = { ADMIN: 'Admin', TRAINER: 'Trainer', CASHIER: 'User', CLIENT: 'User' };
  return map[role || ''] || role || 'User';
};

const LOGO_URL = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { user, logout } = useAuth();

  const getLevelColor = (level?: string): string => {
    switch (level) {
      case 'Expert': return 'gold';
      case 'Specialist': return 'purple';
      case 'Practitioner': return 'blue';
      default: return 'default';
    }
  };

  const getLevel = (points: number): string => {
    if (points >= 500) return 'Expert';
    if (points >= 250) return 'Specialist';
    if (points >= 100) return 'Practitioner';
    return 'Beginner';
  };

  const userLevel = user?.level || getLevel(user?.points || 0);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/pending').then(r => {
        setPendingCount(Array.isArray(r.data) ? r.data.length : 0);
      }).catch(() => {});
    }
  }, [user?.role]);

  const menuItems: any[] = [];

  // Learning section — visible to all roles
  menuItems.push({ type: 'group', label: 'LEARNING' });
  menuItems.push({ key: '/learning-hub', icon: <AppstoreOutlined />, label: 'Learning Hub' });
  menuItems.push({ key: '/my-progress', icon: <CheckCircleOutlined />, label: 'My Progress' });
  menuItems.push({ key: '/takeaways', icon: <BulbOutlined />, label: 'Key Takeaways' });
  menuItems.push({ key: '/bookmarks', icon: <StarOutlined />, label: 'Bookmarks' });
  menuItems.push({ key: '/certificate', icon: <TrophyOutlined />, label: 'Certificate' });

  // Management section — ADMIN + TRAINER
  if (user?.role === 'ADMIN' || user?.role === 'TRAINER') {
    menuItems.push({ type: 'group', label: 'MANAGEMENT' });
    menuItems.push({ key: '/content-manager', icon: <EditOutlined />, label: 'Content Manager' });
    menuItems.push({ key: '/feedback-analytics', icon: <MessageOutlined />, label: 'Feedback' });
  }

  // Admin section — ADMIN only
  if (user?.role === 'ADMIN') {
    menuItems.push({ type: 'group', label: 'ADMIN' });
    menuItems.push({
      key: '/pending-approvals',
      icon: <AuditOutlined />,
      label: (
        <span>
          Pending Approvals
          {pendingCount > 0 && <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} />}
        </span>
      ),
    });
    menuItems.push({ key: '/users', icon: <TeamOutlined />, label: 'Users' });
    menuItems.push({ key: '/admin', icon: <DashboardOutlined />, label: 'Admin Dashboard' });
  }

  const userMenu = {
    items: [
      { key: 'role', label: roleDisplayName(user?.role), disabled: true },
      { type: 'divider' as const },
      { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }: any) => { if (key === 'logout') { logout(); navigate('/login'); } },
  };

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');

  // Hide sidebar on module detail pages (/learning-hub/:slug)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isModuleDetail = pathParts[0] === 'learning-hub' && pathParts.length >= 2;

  if (isModuleDetail) {
    // Full-width layout with minimal header for learning experience
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#fff', padding: '0 24px', height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/learning-hub')}
          >
            <img src={LOGO_URL} alt="eWards" style={{ height: 24 }} />
            <div style={{ width: 1, height: 20, background: '#e8e8e8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B2FA0', letterSpacing: 0.5 }}>LEARNING HUB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={userMenu} trigger={['click']}>
              <Avatar style={{ background: '#6B2FA0', cursor: 'pointer' }} size={32} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: 'calc(100vh - 52px)' }}>
          <Outlet />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible={false} collapsed={false}
        trigger={null} width={240}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto',
          boxShadow: '2px 0 16px rgba(107,47,160,0.06)',
        }}
      >
        {/* Logo area */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f5f0ff' }}>
          <img src={LOGO_URL} alt="eWards" style={{ height: 26, display: 'block' }} />
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#9B59B6', marginTop: 4,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>Learning Hub</div>
        </div>

        {/* Nav menu */}
        <div style={{ padding: '10px 12px' }}>
          {menuItems.filter(i => i.type !== 'divider' && (i as any).key).map((item: any) => {
            const isActive = selectedKey === item.key;
            const isDividerBefore = menuItems[menuItems.indexOf(item) - 1]?.type === 'divider';
            return (
              <React.Fragment key={item.key}>
                {isDividerBefore && <div style={{ height: 1, background: '#f5f0ff', margin: '8px 4px' }} />}
                <div
                  onClick={() => navigate(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    background: isActive ? 'linear-gradient(90deg, #f3ebfc, #faf5ff)' : 'transparent',
                    borderLeft: isActive ? '3px solid #6B2FA0' : '3px solid transparent',
                    color: isActive ? '#6B2FA0' : '#595959',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#faf5ff'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 15, display: 'flex', alignItems: 'center', color: isActive ? '#6B2FA0' : '#888' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* User card */}
        <div style={{
          position: 'absolute', bottom: 0, width: '100%',
          padding: '12px 16px', borderTop: '1px solid #f5f0ff',
          background: 'linear-gradient(180deg, #fff 0%, #faf5ff 100%)',
        }}>
          <Dropdown menu={userMenu} trigger={['click']}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3ebfc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Avatar style={{
                background: 'linear-gradient(135deg, #4a1080, #7B35B8)',
                flexShrink: 0,
              }} icon={<UserOutlined />} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1a1a2e',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#9B59B6', fontWeight: 500 }}>{roleDisplayName(user?.role)}</div>
              </div>
              <LogoutOutlined style={{ fontSize: 13, color: '#c7a8e8' }} />
            </div>
          </Dropdown>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 240 }}>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
      <ChatWidget />
    </Layout>
  );
}
