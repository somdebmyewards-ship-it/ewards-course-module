import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Result, Spin, Row, Col, Tag, Empty, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { TrophyOutlined, DownloadOutlined, LockOutlined, SafetyCertificateOutlined, StarOutlined, CrownOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface CertificateItem {
  id?: number;
  type: 'module' | 'path' | 'expert';
  title: string;
  description: string;
  issued_at?: string;
  earned: boolean;
  download_url?: string;
  module_id?: number;
}

export default function CertificatePage() {
  const { user } = useAuth();
  const userName = user?.name || 'User';
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/certificates').catch(() => ({ data: [] })),
      api.get('/modules').catch(() => ({ data: [] })),
    ]).then(([certRes, modRes]) => {
      const certs: CertificateItem[] = [];
      const earnedCerts: any[] = Array.isArray(certRes.data) ? certRes.data : (certRes.data?.certificates || []);
      const modData = modRes.data;
      const modules: any[] = Array.isArray(modData) ? modData : (modData?.modules || []);

      // Module certificates
      modules.forEach((m: any) => {
        const earned = earnedCerts.find((c: any) => (c.certificate_type ?? c.type) === 'module' && c.module_id === m.id);
        const isComplete = m.progress?.module_completed;
        certs.push({
          id: earned?.id,
          type: 'module',
          title: m.title,
          description: `Complete the "${m.title}" module`,
          issued_at: earned?.issued_at || (isComplete ? m.progress?.updated_at : undefined),
          earned: !!isComplete,
          download_url: earned?.id ? `/api/certificates/${earned.id}/download` : (isComplete ? `/api/certificate/download?module_id=${m.id}` : undefined),
          module_id: m.id,
        });
      });

      // Path certificate (all modules completed)
      const allCompleted = modules.length > 0 && modules.every((m: any) => m.progress?.module_completed);
      const pathCert = earnedCerts.find((c: any) => (c.certificate_type ?? c.type) === 'path');
      certs.push({
        id: pathCert?.id,
        type: 'path',
        title: 'eWards Product Training',
        description: 'Complete all training modules',
        issued_at: pathCert?.issued_at,
        earned: allCompleted,
        download_url: pathCert?.id ? `/api/certificates/${pathCert.id}/download` : (allCompleted ? '/api/certificate/download' : undefined),
      });

      // Expert certificate (300+ points)
      const userPoints = modules.reduce((sum: number, m: any) => sum + (m.progress?.module_completed ? (m.points_reward || 0) : 0), 0);
      const expertCert = earnedCerts.find((c: any) => (c.certificate_type ?? c.type) === 'expert');
      certs.push({
        id: expertCert?.id,
        type: 'expert',
        title: 'eWards Expert',
        description: 'Earn 300+ points across all modules',
        issued_at: expertCert?.issued_at,
        earned: userPoints >= 300,
        download_url: expertCert?.id ? `/api/certificates/${expertCert.id}/download` : (userPoints >= 300 ? '/api/certificate/download?type=expert' : undefined),
      });

      setCertificates(certs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  const earnedCount = certificates.filter(c => c.earned).length;

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; tagColor: string }> = {
    module: { icon: <SafetyCertificateOutlined style={{ fontSize: 36, color: '#6B2FA0' }} />, color: '#6B2FA0', tagColor: 'purple' },
    path: { icon: <TrophyOutlined style={{ fontSize: 36, color: '#faad14' }} />, color: '#faad14', tagColor: 'gold' },
    expert: { icon: <CrownOutlined style={{ fontSize: 36, color: '#eb2f96' }} />, color: '#eb2f96', tagColor: 'magenta' },
  };

  return (
    <div>
      <Title level={3}>Certificates</Title>
      <Text type="secondary">Earn certificates by completing modules and achieving milestones</Text>

      <Card style={{ borderRadius: 12, marginTop: 16, marginBottom: 24, textAlign: 'center' }}>
        <TrophyOutlined style={{ fontSize: 48, color: '#6B2FA0' }} />
        <Title level={2} style={{ margin: '8px 0 0', color: '#6B2FA0' }}>{earnedCount}</Title>
        <Text type="secondary">of {certificates.length} certificates earned</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {certificates.map((cert, idx) => {
          const config = typeConfig[cert.type];
          return (
            <Col key={idx} xs={24} sm={12} lg={8}>
              <Card
                style={{
                  borderRadius: 12,
                  border: cert.earned ? `2px solid ${config.color}` : '1px solid #f0f0f0',
                  opacity: cert.earned ? 1 : 0.7,
                  height: '100%',
                }}
                hoverable={cert.earned}
              >
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  {config.icon}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Tag color={config.tagColor} style={{ marginBottom: 8 }}>
                    {cert.type === 'module' ? 'Module' : cert.type === 'path' ? 'Path' : 'Expert'}
                  </Tag>
                  <Title level={5} style={{ margin: '0 0 4px' }}>{cert.title}</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>{cert.description}</Text>
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  {cert.earned ? (
                    <>
                      {cert.issued_at && (
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Earned: {new Date(cert.issued_at).toLocaleDateString()}
                          </Text>
                        </div>
                      )}
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        style={{ background: config.color, borderColor: config.color, borderRadius: 8 }}
                        onClick={async () => {
                          if (!cert.download_url) return;
                          try {
                            const path = cert.download_url.replace(/^\/api/, '');
                            const res = await api.get(path, {
                              responseType: 'blob',
                              headers: { Accept: 'application/pdf' },
                              transformResponse: [(data: any) => data],
                            });
                            const blob = new Blob([res.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `eWards-Certificate-${userName?.replace(/[^a-zA-Z0-9-]/g, '-') || 'user'}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                            message.success('Certificate downloaded!');
                          } catch (e: any) {
                            console.error('Certificate download error:', e);
                            message.error('Failed to download certificate');
                          }
                        }}
                      >
                        Download
                      </Button>
                    </>
                  ) : (
                    <Tag icon={<LockOutlined />}>Locked</Tag>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
