import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Typography, Button, Empty, Tag, message, Popconfirm } from 'antd';
import { StarFilled, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = () => {
    api.get('/bookmarks').then(r => { setBookmarks(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(fetch, []);

  const remove = async (id: number) => {
    await api.delete(`/bookmarks/${id}`);
    message.success('Bookmark removed');
    fetch();
  };

  return (
    <div>
      <Title level={3}><StarFilled style={{ color: '#6B2FA0', marginRight: 8 }} />My Bookmarks</Title>
      <Card>
        <List
          loading={loading}
          dataSource={bookmarks}
          locale={{ emptyText: <Empty description="No bookmarks yet. Bookmark sections while learning!" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => navigate(`/learning-hub/${item.module?.slug}`, { state: { sectionId: item.section_id } })}>Go to Section</Button>,
                <Popconfirm title="Remove bookmark?" onConfirm={() => remove(item.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<BookOutlined style={{ fontSize: 24, color: '#6B2FA0' }} />}
                title={item.section?.title || 'Section'}
                description={<><Tag color="purple">{item.module?.title}</Tag><Text type="secondary">{item.section?.content_type}</Text></>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
