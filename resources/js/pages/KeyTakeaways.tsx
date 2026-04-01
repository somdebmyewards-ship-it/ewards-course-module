import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Spin } from 'antd';
import { BulbOutlined, BookOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface TakeawayGroup {
  module_title: string;
  takeaways: string[];
}

export default function KeyTakeaways() {
  const [groups, setGroups] = useState<TakeawayGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/takeaways')
      .then(r => setGroups(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <Title level={3}>
        <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
        Key Takeaways
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        A recap of the most important points from your completed modules
      </Text>

      {groups.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <Title level={5} style={{ color: '#999' }}>No Key Takeaways Yet</Title>
          <Text type="secondary">Complete modules to see key takeaways here</Text>
        </Card>
      ) : (
        groups.map((group, i) => (
          <Card
            key={i}
            style={{ borderRadius: 12, marginBottom: 16 }}
            title={
              <span>
                <BookOutlined style={{ color: '#6B2FA0', marginRight: 8 }} />
                {group.module_title}
              </span>
            }
          >
            <List
              dataSource={group.takeaways}
              renderItem={(takeaway: string) => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <BulbOutlined style={{ color: '#faad14', marginTop: 4, flexShrink: 0 }} />
                    <Text>{takeaway}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        ))
      )}
    </div>
  );
}
