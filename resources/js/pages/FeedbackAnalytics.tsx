import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Rate, Tag, Progress, Table, Spin, Empty, Statistic, Tooltip, Tabs } from 'antd';
import { StarFilled, MessageOutlined, BulbOutlined, SmileOutlined, FrownOutlined, MehOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

function getNpsColor(nps: number) {
  if (nps >= 50) return '#52c41a';
  if (nps >= 0) return '#faad14';
  return '#ff4d4f';
}

function getNpsLabel(nps: number) {
  if (nps >= 50) return 'Excellent';
  if (nps >= 20) return 'Good';
  if (nps >= 0) return 'Fair';
  return 'Needs Improvement';
}

export default function FeedbackAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/feedback-analytics').then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return <Empty description="No feedback data available" />;

  const { overview, rating_distribution, modules, recent_feedback } = data;

  const ratingColors = ['', '#ff4d4f', '#fa8c16', '#faad14', '#52c41a', '#237804'];

  const moduleColumns = [
    {
      title: 'Module',
      dataIndex: 'title',
      render: (t: string, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{r.icon || '📚'}</span>
          <Text strong>{t}</Text>
        </div>
      ),
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback_count',
      sorter: (a: any, b: any) => a.feedback_count - b.feedback_count,
      render: (v: number) => <Tag color={v > 0 ? 'purple' : 'default'}>{v} responses</Tag>,
    },
    {
      title: 'Avg Rating',
      dataIndex: 'avg_rating',
      sorter: (a: any, b: any) => a.avg_rating - b.avg_rating,
      render: (v: number) => v > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Rate disabled value={v} allowHalf style={{ fontSize: 14 }} />
          <Text strong>{v}</Text>
        </div>
      ) : <Text type="secondary">No ratings</Text>,
    },
    {
      title: 'NPS',
      dataIndex: 'nps',
      sorter: (a: any, b: any) => a.nps - b.nps,
      render: (v: number, r: any) => r.feedback_count > 0 ? (
        <Tag color={getNpsColor(v) === '#52c41a' ? 'green' : getNpsColor(v) === '#faad14' ? 'orange' : 'red'}>
          {v > 0 ? '+' : ''}{v}
        </Tag>
      ) : <Text type="secondary">—</Text>,
    },
  ];

  const feedbackColumns = [
    {
      title: 'User',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ display: 'block' }}>{r.user_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.user_email}</Text>
        </div>
      ),
    },
    {
      title: 'Module',
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{r.module_icon || '📚'}</span>
          <Text>{r.module_title}</Text>
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      sorter: (a: any, b: any) => a.rating - b.rating,
      render: (v: number) => <Rate disabled value={v} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      render: (v: string) => v ? <Text style={{ maxWidth: 200, display: 'block' }} ellipsis={{ tooltip: v }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Suggestion',
      dataIndex: 'improvement_suggestion',
      render: (v: string) => v ? <Text style={{ maxWidth: 200, display: 'block' }} ellipsis={{ tooltip: v }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>Feedback & Success Metrics</Title>
        <Text type="secondary">Track learner satisfaction, NPS scores, and content improvement opportunities</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'overview',
          label: '📊 Overview',
          children: (
            <div>
              {/* KPI Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 14, textAlign: 'center', borderTop: '3px solid #6B2FA0' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#888' }}>Total Feedback</Text>}
                      value={overview.total_feedback}
                      prefix={<MessageOutlined style={{ color: '#6B2FA0' }} />}
                      valueStyle={{ color: '#6B2FA0', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 14, textAlign: 'center', borderTop: '3px solid #faad14' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#888' }}>Avg Rating</Text>}
                      value={overview.avg_rating}
                      suffix="/ 5"
                      prefix={<StarFilled style={{ color: '#faad14' }} />}
                      valueStyle={{ color: '#faad14', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 14, textAlign: 'center', borderTop: `3px solid ${getNpsColor(overview.nps_score)}` }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#888' }}>NPS Score</Text>}
                      value={overview.nps_score}
                      prefix={overview.nps_score >= 0 ? <SmileOutlined style={{ color: getNpsColor(overview.nps_score) }} /> : <FrownOutlined style={{ color: '#ff4d4f' }} />}
                      valueStyle={{ color: getNpsColor(overview.nps_score), fontWeight: 700 }}
                    />
                    <Tag color={getNpsColor(overview.nps_score) === '#52c41a' ? 'green' : getNpsColor(overview.nps_score) === '#faad14' ? 'orange' : 'red'} style={{ marginTop: 4 }}>
                      {getNpsLabel(overview.nps_score)}
                    </Tag>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 14, textAlign: 'center', borderTop: '3px solid #52c41a' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#888' }}>Suggestions</Text>}
                      value={overview.total_suggestions}
                      prefix={<BulbOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* NPS Breakdown + Rating Distribution */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <Card title={<Text strong>NPS Breakdown</Text>} style={{ borderRadius: 14, height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 20 }}>
                      <div>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', border: '2px solid #52c41a' }}>
                          <SmileOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        </div>
                        <Text strong style={{ fontSize: 20, color: '#52c41a' }}>{overview.promoters}</Text>
                        <br /><Text type="secondary" style={{ fontSize: 12 }}>Promoters (4-5)</Text>
                      </div>
                      <div>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fffbe6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', border: '2px solid #faad14' }}>
                          <MehOutlined style={{ fontSize: 24, color: '#faad14' }} />
                        </div>
                        <Text strong style={{ fontSize: 20, color: '#faad14' }}>{overview.passives}</Text>
                        <br /><Text type="secondary" style={{ fontSize: 12 }}>Passives (3)</Text>
                      </div>
                      <div>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff2f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', border: '2px solid #ff4d4f' }}>
                          <FrownOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                        </div>
                        <Text strong style={{ fontSize: 20, color: '#ff4d4f' }}>{overview.detractors}</Text>
                        <br /><Text type="secondary" style={{ fontSize: 12 }}>Detractors (1-2)</Text>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 0', background: '#fafafa', borderRadius: 10 }}>
                      <Text type="secondary">NPS Formula: (Promoters - Detractors) / Total × 100 = </Text>
                      <Text strong style={{ color: getNpsColor(overview.nps_score), fontSize: 16 }}>{overview.nps_score}</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title={<Text strong>Rating Distribution</Text>} style={{ borderRadius: 14, height: '100%' }}>
                    {rating_distribution.map((r: any) => (
                      <div key={r.rating} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 70 }}>
                          <Text strong>{r.rating}</Text>
                          <StarFilled style={{ color: ratingColors[r.rating], fontSize: 14 }} />
                        </div>
                        <Progress
                          percent={r.percentage}
                          strokeColor={ratingColors[r.rating]}
                          trailColor="#f0f0f0"
                          showInfo={false}
                          style={{ flex: 1 }}
                        />
                        <Text style={{ width: 70, textAlign: 'right', fontSize: 13 }}>
                          {r.count} ({r.percentage}%)
                        </Text>
                      </div>
                    )).reverse()}
                  </Card>
                </Col>
              </Row>

              {/* Module-wise Performance */}
              <Card title={<Text strong>Module-wise Performance</Text>} style={{ borderRadius: 14 }}>
                <Table
                  columns={moduleColumns}
                  dataSource={modules}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </div>
          ),
        },
        {
          key: 'feedback',
          label: `💬 All Feedback (${overview.total_feedback})`,
          children: (
            <Card style={{ borderRadius: 14 }}>
              <Table
                columns={feedbackColumns}
                dataSource={recent_feedback}
                rowKey="id"
                pagination={{ pageSize: 15 }}
                size="middle"
                scroll={{ x: 800 }}
              />
            </Card>
          ),
        },
        {
          key: 'suggestions',
          label: `💡 Suggestions (${overview.total_suggestions})`,
          children: (
            <div>
              {recent_feedback.filter((f: any) => f.improvement_suggestion).length === 0 ? (
                <Empty description="No improvement suggestions yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recent_feedback.filter((f: any) => f.improvement_suggestion).map((f: any) => (
                    <Card key={f.id} style={{ borderRadius: 12, borderLeft: '4px solid #6B2FA0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Tag color="purple">{f.module_icon} {f.module_title}</Tag>
                            <Rate disabled value={f.rating} style={{ fontSize: 12 }} />
                          </div>
                          <Text style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>"{f.improvement_suggestion}"</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>— {f.user_name} ({f.user_role}) · {f.created_at}</Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ]} />
    </div>
  );
}
