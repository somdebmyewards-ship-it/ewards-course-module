import React, { useEffect, useState } from 'react';
import { Tooltip, Empty, Spin } from 'antd';
import api from '@/lib/api';

interface Badge {
  code: string;
  name: string;
  description: string;
  icon_emoji: string;
  awarded_at: string;
}

interface Props {
  userId?: number; // if omitted, loads the authenticated user's own badges
}

const BadgeShelf: React.FC<Props> = ({ userId }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId ? `/badges/user/${userId}` : '/badges/mine';
    api.get(url)
      .then(r => setBadges(r.data))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spin size="small" />;

  if (badges.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No badges yet — complete modules to earn them!"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {badges.map(badge => (
        <Tooltip
          key={badge.code}
          title={
            <div>
              <div style={{ fontWeight: 600 }}>{badge.name}</div>
              <div style={{ fontSize: 12 }}>{badge.description}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Earned {new Date(badge.awarded_at).toLocaleDateString()}
              </div>
            </div>
          }
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'rgba(107,47,160,0.15)',
              border: '1px solid rgba(107,47,160,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              cursor: 'default',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {badge.icon_emoji}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export default BadgeShelf;
