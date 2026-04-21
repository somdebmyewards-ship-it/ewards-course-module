import React from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface HelpCTAProps {
  moduleSlug: string;
  sectionIndex?: number;
  label?: string;
}

const HelpCTA: React.FC<HelpCTAProps> = ({ moduleSlug, sectionIndex, label = 'Learn this page' }) => {
  const navigate = useNavigate();
  return (
    <Tooltip title={label}>
      <Button
        type="primary"
        ghost
        icon={<QuestionCircleOutlined />}
        onClick={() => navigate(`/learning-hub/${moduleSlug}${sectionIndex !== undefined ? `?section=${sectionIndex}` : ''}`)}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, borderRadius: 20, height: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      >
        {label}
      </Button>
    </Tooltip>
  );
};

export default HelpCTA;
