import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Spin, Progress, Table, Tag, List, Avatar } from 'antd';
import {
  UserOutlined, BookOutlined, TrophyOutlined, CheckCircleOutlined,
  FileTextOutlined, ShopOutlined, CrownOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

type Period = 'all' | '7d' | '30d';

const LEVEL_COLOR: Record<string, string> = {
  Expert:       'purple',
  Specialist:   'blue',
  Practitioner: 'green',
  Beginner:     'default',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 2)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PERIOD_LABELS: { label: string; value: Period }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 7 Days', value: '7d' },
];

export default function AdminDashboard() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?period=${period}`)
      .then(r  => { setData(r.data); setLoading(false); })
      .catch(() => { setError('Failed to load analytics. Please refresh.'); setLoading(false); });
  }, [period]);

  if (error) return <div style={{ padding: 40, color: '#ff4d4f', textAlign: 'center' }}>{error}</div>;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIOD_LABELS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: period === p.value ? '#6B2FA0' : '#d9d9d9',
                background: period === p.value ? '#6B2FA0' : '#fff',
                color: period === p.value ? '#fff' : '#595959',
                cursor: 'pointer',
                fontWeight: period === p.value ? 700 : 400,
                fontSize: 13,
                transition: 'all .15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { title: 'Total Users',       value: data?.total_users || 0,        icon: <UserOutlined style={{ color: '#6B2FA0' }} />,  note: 'all-time' },
              { title: 'Total Modules',     value: data?.total_modules || 0,      icon: <BookOutlined style={{ color: '#1890ff' }} />,  note: 'all-time' },
              { title: 'Certificates',      value: data?.certificates_issued || 0,icon: <TrophyOutlined style={{ color: '#52c41a' }} />,note: 'all-time' },
              { title: 'Modules Completed', value: data?.modules_completed || 0,  icon: <CheckCircleOutlined style={{ color: '#6B2FA0' }} />, note: period === 'all' ? 'all-time' : period },
              { title: 'Quiz Submissions',  value: data?.quiz_submissions || 0,   icon: <FileTextOutlined style={{ color: '#722ed1' }} />,   note: period === 'all' ? 'all-time' : period },
            ].map((s, i) => (
              <Col key={i} xs={12} sm={8} lg={4}>
                <Card style={{ borderRadius: 12 }}>
                  <Statistic title={s.title} value={s.value} prefix={s.icon} />
                  <Text type="secondary" style={{ fontSize: 10 }}>{s.note}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Module completion ── */}
          {data?.module_stats && (
            <Card style={{ borderRadius: 12, marginBottom: 24 }} title="Module Completion">
              {data.module_stats.map((m: any) => (
                <div key={m.title} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Text style={{ width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</Text>
                  <Progress percent={m.percentage} strokeColor="#6B2FA0" style={{ flex: 1 }} />
                  <Text type="secondary" style={{ width: 60, textAlign: 'right' }}>{m.completed} users</Text>
                </div>
              ))}
            </Card>
          )}

          {/* ── Leaderboard + Activity feed ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* U1b: Leaderboard */}
            <Col xs={24} lg={12}>
              <Card
                style={{ borderRadius: 12, height: '100%' }}
                title={<span><CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />Top 10 Leaderboard</span>}
              >
                <List
                  dataSource={data?.leaderboard || []}
                  renderItem={(u: any, idx: number) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                        <Text
                          strong
                          style={{
                            width: 24, textAlign: 'center', fontSize: 13,
                            color: idx === 0 ? '#faad14' : idx === 1 ? '#8c8c8c' : idx === 2 ? '#d46b08' : '#8c8c8c',
                          }}
                        >
                          {idx + 1}
                        </Text>
                        <Avatar size={32} icon={<UserOutlined />} style={{ background: '#f0e6f8', color: '#6B2FA0', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                            {u.name}
                          </Text>
                          {u.designation && (
                            <Text type="secondary" style={{ fontSize: 11 }}>{u.designation}</Text>
                          )}
                        </div>
                        <Tag color={LEVEL_COLOR[u.level] || 'default'} style={{ flexShrink: 0 }}>{u.level}</Tag>
                        <Text strong style={{ color: '#6B2FA0', flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                          {u.points} pts
                        </Text>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No data yet' }}
                />
              </Card>
            </Col>

            {/* U1c: Activity feed */}
            <Col xs={24} lg={12}>
              <Card
                style={{ borderRadius: 12, height: '100%' }}
                title={<span><ClockCircleOutlined style={{ color: '#6B2FA0', marginRight: 8 }} />Recent Completions</span>}
              >
                <List
                  dataSource={data?.activity || []}
                  renderItem={(a: any) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                        <Avatar size={32} style={{ background: '#f0e6f8', flexShrink: 0, fontSize: 16 }}>
                          {a.module_icon || '📘'}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ display: 'block', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.user_name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            completed {a.module_title}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                          {a.completed_at ? relativeTime(a.completed_at) : '—'}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No completions yet' }}
                />
              </Card>
            </Col>
          </Row>

          {/* ── Merchant adoption ── */}
          {data?.merchant_adoption && data.merchant_adoption.length > 0 && (
            <Card style={{ borderRadius: 12 }} title={<span><ShopOutlined style={{ marginRight: 8 }} />Merchant Adoption</span>}>
              <Table
                dataSource={data.merchant_adoption}
                rowKey={(record: any) => record.merchant_name || record.id}
                pagination={false}
                columns={[
                  { title: 'Merchant',        dataIndex: 'merchant_name',   key: 'merchant_name' },
                  { title: 'Users',           dataIndex: 'total_users',     key: 'total_users',     align: 'center' as const },
                  { title: 'Completed',       dataIndex: 'completed_users', key: 'completed_users', align: 'center' as const },
                  {
                    title: 'Adoption Rate', key: 'adoption_rate', align: 'center' as const,
                    render: (_: any, record: any) => {
                      const rate = record.adoption_rate ?? 0;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Progress
                            percent={rate} size="small"
                            strokeColor={rate >= 75 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'}
                            style={{ flex: 1, minWidth: 80 }}
                          />
                          <Text strong>{rate}%</Text>
                        </div>
                      );
                    },
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
