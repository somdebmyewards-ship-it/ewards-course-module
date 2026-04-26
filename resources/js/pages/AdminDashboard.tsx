import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Spin, Progress, Divider, Table, Tabs } from 'antd';
import { UserOutlined, BookOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, ShopOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => { setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <Title level={3}>Admin Dashboard</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Users', value: data?.total_users || 0, icon: <UserOutlined style={{ color: '#6B2FA0' }} /> },
          { title: 'Pending Approval', value: data?.pending_users || 0, icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
          { title: 'Total Modules', value: data?.total_modules || 0, icon: <BookOutlined style={{ color: '#1890ff' }} /> },
          { title: 'Certificates', value: data?.certificates_issued || 0, icon: <TrophyOutlined style={{ color: '#52c41a' }} /> },
          { title: 'Modules Completed', value: data?.modules_completed || 0, icon: <CheckCircleOutlined style={{ color: '#6B2FA0' }} /> },
          { title: 'Quiz Submissions', value: data?.quiz_submissions || 0, icon: <FileTextOutlined style={{ color: '#722ed1' }} /> },
        ].map((s, i) => (
          <Col key={i} xs={12} sm={8} lg={4}>
            <Card style={{ borderRadius: 12 }}><Statistic title={s.title} value={s.value} prefix={s.icon} /></Card>
          </Col>
        ))}
      </Row>

      {data?.module_stats && (
        <Card style={{ borderRadius: 12, marginBottom: 24 }} title="Module Completion">
          {data.module_stats.map((m: any) => (
            <div key={m.title} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Text style={{ width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</Text>
              <Progress percent={data.total_users > 0 ? Math.round((m.completed / data.total_users) * 100) : 0} strokeColor="#6B2FA0" style={{ flex: 1 }} />
              <Text type="secondary" style={{ width: 60, textAlign: 'right' }}>{m.completed} users</Text>
            </div>
          ))}
        </Card>
      )}

      {data?.merchant_adoption && data.merchant_adoption.length > 0 && (
        <Card style={{ borderRadius: 12 }} title={<span><ShopOutlined style={{ marginRight: 8 }} />Merchant Adoption</span>}>
          <Table
            dataSource={data.merchant_adoption}
            rowKey={(record: any) => record.merchant_name || record.id}
            pagination={false}
            columns={[
              {
                title: 'Merchant Name',
                dataIndex: 'merchant_name',
                key: 'merchant_name',
              },
              {
                title: 'Total Users',
                dataIndex: 'total_users',
                key: 'total_users',
                align: 'center' as const,
              },
              {
                title: 'Completed Users',
                dataIndex: 'completed_users',
                key: 'completed_users',
                align: 'center' as const,
              },
              {
                title: 'Adoption Rate',
                key: 'adoption_rate',
                align: 'center' as const,
                render: (_: any, record: any) => {
                  const rate = record.total_users > 0
                    ? Math.round((record.completed_users / record.total_users) * 100)
                    : 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Progress
                        percent={rate}
                        size="small"
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
    </div>
  );
}
