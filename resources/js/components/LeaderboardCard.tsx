import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Text } = Typography;

interface Entry {
  rank: number;
  user_id: number;
  name: string;
  points: number;
  level: string;
  badge_count: number;
  last_active_at: string | null;
  is_current_user: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  Expert:      '#6B2FA0',
  Specialist:  '#1890ff',
  Practitioner:'#52c41a',
  Beginner:    '#faad14',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const LeaderboardCard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then(r => setEntries(r.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      width: 60,
      render: (rank: number) => (
        <Text strong>{RANK_MEDAL[rank] ?? `#${rank}`}</Text>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row: Entry) => (
        <span>
          {name}
          {row.is_current_user && (
            <Tag color="purple" style={{ marginLeft: 6, fontSize: 11 }}>You</Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      width: 110,
      render: (level: string) => (
        <Tag color={LEVEL_COLORS[level] ?? '#999'}>{level}</Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      width: 80,
      render: (pts: number) => <Text strong>{pts}</Text>,
    },
    {
      title: 'Badges',
      dataIndex: 'badge_count',
      width: 75,
      render: (n: number) => n > 0 ? `🏅 ${n}` : '—',
    },
    {
      title: 'Last Active',
      dataIndex: 'last_active_at',
      width: 110,
      render: (d: string | null) =>
        d ? new Date(d).toLocaleDateString() : '—',
    },
  ];

  return (
    <Card
      title={<><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />Company Leaderboard</>}
      size="small"
      style={{ borderRadius: 12 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : (
        <Table
          dataSource={entries}
          columns={columns}
          rowKey="user_id"
          pagination={false}
          size="small"
          rowClassName={(row: Entry) => row.is_current_user ? 'leaderboard-highlight' : ''}
        />
      )}
    </Card>
  );
};

export default LeaderboardCard;
