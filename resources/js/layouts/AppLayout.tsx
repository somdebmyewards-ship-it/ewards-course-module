import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Tag, Tooltip } from 'antd';
import {
  TrophyOutlined, EditOutlined, UserOutlined, DashboardOutlined,
  TeamOutlined, LogoutOutlined, AppstoreOutlined, CheckCircleOutlined,
  StarOutlined, BulbOutlined, MessageOutlined, ClockCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import ChatWidget from '@/components/ChatWidget';

const { Sider, Content } = Layout;

const LOGO_URL = 'https://ewardsdata.s3.ap-south-1.amazonaws.com/ewards_website/eWards+logo+-+purple+(1).png';

const PAGE_TITLES: Record<string, string> = {
  '/learning-hub': 'Learning Hub',
  '/my-progress': 'My Progress',
  '/takeaways': 'Key Takeaways',
  '/bookmarks': 'Bookmarks',
  '/certificate': 'Certificate',
  '/content-manager': 'Content Manager',
  '/feedback-analytics': 'Feedback Analytics',
  '/users': 'User Management',
  '/pending-approvals': 'Pending Approvals',
  '/admin': 'Admin Dashboard',
  '/profile': 'My Profile',
};

const roleDisplayName = (role?: string) => {
  const map: Record<string, string> = { ADMIN: 'Admin', TRAINER: 'Trainer', CASHIER: 'User', CLIENT: 'User' };
  return map[role || ''] || role || 'User';
};

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

const MENU_GROUPS = [
  {
    key: 'learning',
    label: 'LEARNING',
    roles: null as string[] | null,
    items: [
      { key: '/learning-hub', icon: <AppstoreOutlined />, label: 'Learning Hub' },
      { key: '/my-progress', icon: <CheckCircleOutlined />, label: 'My Progress' },
      { key: '/takeaways', icon: <BulbOutlined />, label: 'Key Takeaways' },
      { key: '/bookmarks', icon: <StarOutlined />, label: 'Bookmarks' },
      { key: '/certificate', icon: <TrophyOutlined />, label: 'Certificate' },
    ],
  },
  {
    key: 'management',
    label: 'MANAGEMENT',
    roles: ['ADMIN', 'TRAINER'] as string[],
    items: [
      { key: '/content-manager', icon: <EditOutlined />, label: 'Content Manager' },
      { key: '/feedback-analytics', icon: <MessageOutlined />, label: 'Feedback' },
    ],
  },
  {
    key: 'admin',
    label: 'ADMIN',
    roles: ['ADMIN'] as string[],
    items: [
      { key: '/users', icon: <TeamOutlined />, label: 'Users' },
      { key: '/pending-approvals', icon: <ClockCircleOutlined />, label: 'Pending Approvals' },
      { key: '/admin', icon: <DashboardOutlined />, label: 'Admin Dashboard' },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarWidth = collapsed ? 72 : 240;
  const userLevel = user?.level || getLevel(user?.points || 0);

  const pathKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const pageTitle = PAGE_TITLES[pathKey] || 'eWards Learning Hub';

  const toggleCollapsed = () => {
    setCollapsed(c => {
      localStorage.setItem('sidebar_collapsed', String(!c));
      return !c;
    });
  };

  const userMenu = {
    items: [
      { key: 'role', label: roleDisplayName(user?.role), disabled: true },
      { type: 'divider' as const },
      { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }: any) => {
      if (key === 'logout') { logout(); navigate('/login'); }
      if (key === 'profile') { navigate('/profile'); }
    },
  };

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isModuleDetail = pathParts[0] === 'learning-hub' && pathParts.length >= 2;

  if (isModuleDetail) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 100, height: 52,
          background: '#fff', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/learning-hub')}
          >
            <img src={LOGO_URL} alt="eWards" style={{ height: 24 }} />
            <div style={{ width: 1, height: 20, background: '#e8e8e8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B2FA0', letterSpacing: 0.5 }}>LEARNING HUB</span>
          </div>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Avatar style={{ background: '#6B2FA0', cursor: 'pointer' }} size={32} icon={<UserOutlined />} />
          </Dropdown>
        </div>
        <Content style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: 'calc(100vh - 52px)' }}>
          <Outlet />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── SIDEBAR ── */}
      <Sider
        trigger={null}
        collapsed={collapsed}
        width={240}
        collapsedWidth={72}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'hidden',
          boxShadow: '2px 0 16px rgba(107,47,160,0.06)',
          transition: 'width 0.2s ease',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '18px 0 14px' : '18px 20px 14px',
          borderBottom: '1px solid #f5f0ff',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}>
          {collapsed ? (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #4a1080, #7B35B8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: -0.5,
            }}>eW</div>
          ) : (
            <div>
              <img src={LOGO_URL} alt="eWards" style={{ height: 26, display: 'block' }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9B59B6', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
                Learning Hub
              </div>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <div style={{ padding: collapsed ? '10px 8px' : '10px 12px', flex: 1, overflowY: 'auto' }}>
          {MENU_GROUPS.map(group => {
            if (group.roles && !group.roles.includes(user?.role || '')) return null;
            return (
              <div key={group.key}>
                {!collapsed && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#c7a8e8', letterSpacing: 1.5,
                    padding: '10px 12px 4px', textTransform: 'uppercase',
                  }}>{group.label}</div>
                )}
                {collapsed && <div style={{ height: 8 }} />}
                {group.items.map(item => {
                  const isActive = selectedKey === item.key;
                  const navItem = (
                    <div
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 10,
                        padding: collapsed ? '10px 0' : '9px 12px',
                        borderRadius: 10,
                        marginBottom: 2,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: isActive ? 'linear-gradient(90deg, #f3ebfc, #faf5ff)' : 'transparent',
                        borderLeft: collapsed ? 'none' : (isActive ? '3px solid #6B2FA0' : '3px solid transparent'),
                        outline: isActive && collapsed ? '2px solid #c7a8e8' : 'none',
                        color: isActive ? '#6B2FA0' : '#595959',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#faf5ff'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: collapsed ? 18 : 15, display: 'flex', alignItems: 'center', color: isActive ? '#6B2FA0' : '#888' }}>
                        {item.icon}
                      </span>
                      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    </div>
                  );
                  return collapsed
                    ? <Tooltip key={item.key} title={item.label} placement="right">{navItem}</Tooltip>
                    : navItem;
                })}
              </div>
            );
          })}
        </div>

        {/* User card */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid #f5f0ff',
          background: 'linear-gradient(180deg, #fff 0%, #faf5ff 100%)',
          flexShrink: 0,
        }}>
          {collapsed ? (
            <Tooltip title={user?.name} placement="right">
              <Dropdown menu={userMenu} trigger={['click']}>
                <div style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                  <Avatar style={{ background: 'linear-gradient(135deg, #4a1080, #7B35B8)' }} icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </Tooltip>
          ) : (
            <Dropdown menu={userMenu} trigger={['click']}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3ebfc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Avatar style={{ background: 'linear-gradient(135deg, #4a1080, #7B35B8)', flexShrink: 0 }} icon={<UserOutlined />} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#9B59B6', fontWeight: 500 }}>{roleDisplayName(user?.role)}</div>
                  <Tag color={getLevelColor(userLevel)} style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', marginTop: 2, border: 'none' }}>
                    {userLevel}
                  </Tag>
                </div>
                <LogoutOutlined style={{ fontSize: 13, color: '#c7a8e8' }} />
              </div>
            </Dropdown>
          )}
        </div>
      </Sider>

      {/* ── MAIN AREA ── */}
      <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s ease' }}>

        {/* Top header bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 90,
          height: 52, background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 14,
          boxShadow: '0 1px 8px rgba(107,47,160,0.06)',
        }}>
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1.5px solid #f0e8ff',
              background: collapsed ? '#f3ebfc' : '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B2FA0', fontSize: 15, flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3ebfc'; }}
            onMouseLeave={e => { if (!collapsed) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <div style={{ width: 1, height: 20, background: '#f0e8ff', flexShrink: 0 }} />

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{pageTitle}</span>
          </div>

          {/* Right: level + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag
              color={getLevelColor(userLevel)}
              style={{ margin: 0, fontWeight: 600, fontSize: 11 }}
            >
              {userLevel}
            </Tag>
            <Dropdown menu={userMenu} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  style={{ background: 'linear-gradient(135deg, #4a1080, #7B35B8)', cursor: 'pointer' }}
                  size={32}
                  icon={<UserOutlined />}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{user?.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, color: '#9B59B6' }}>{roleDisplayName(user?.role)}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Page content */}
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 52px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <ChatWidget />
    </Layout>
  );
}
