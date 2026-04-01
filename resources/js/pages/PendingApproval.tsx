import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Result, Button, Alert, Spin } from 'antd';
import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';

export default function PendingApproval() {
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/me')
        .then(r => {
          if (r.data.rejection_reason) {
            setRejectionReason(r.data.rejection_reason);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Rejected state
  if (rejectionReason) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f0ff 0%, #e8e0f0 100%)' }}>
        <div style={{ maxWidth: 500, width: '100%', padding: '0 16px' }}>
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Application Not Approved"
            subTitle="Unfortunately, your registration was not approved."
            extra={<Link to="/login"><Button type="primary" style={{ background: '#6B2FA0' }}>Back to Login</Button></Link>}
          />
          <Alert
            type="error"
            message="Rejection Reason"
            description={rejectionReason}
            showIcon
            style={{ borderRadius: 8, marginTop: -16 }}
          />
        </div>
      </div>
    );
  }

  // Pending state (default)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f0ff 0%, #e8e0f0 100%)' }}>
      <Result
        icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
        title="Account Pending Approval"
        subTitle="Your account has been created. An administrator will review and approve your access shortly."
        extra={<Link to="/login"><Button type="primary" style={{ background: '#6B2FA0' }}>Back to Login</Button></Link>}
      />
    </div>
  );
}
