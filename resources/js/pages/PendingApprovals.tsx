import React, { useEffect, useState } from 'react';
import { Typography, Table, Tag, Button, Modal, Form, Input, Select, message, Space, Card, Descriptions, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, ShopOutlined, IdcardOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function PendingApprovals() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = () => {
    setLoading(true);
    api.get('/admin/pending').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const fetchMerchants = () => {
    api.get('/admin/merchants').then(r => setMerchants(r.data)).catch(() => {});
  };

  const fetchOutlets = (merchantId?: number) => {
    const url = merchantId ? `/admin/outlets?merchant_id=${merchantId}` : '/admin/outlets';
    api.get(url).then(r => setOutlets(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchPending();
    fetchMerchants();
    fetchOutlets();
  }, []);

  const handleApprove = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/approve/${approveModal.id}`, {
        merchant_id: values.merchant_id,
        outlet_id: values.outlet_id,
      });
      message.success(`${approveModal.name} has been approved`);
      setApproveModal(null);
      approveForm.resetFields();
      fetchPending();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Approval failed');
    }
    setSubmitting(false);
  };

  const handleReject = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/reject/${rejectModal.id}`, {
        rejection_reason: values.rejection_reason,
      });
      message.success(`${rejectModal.name} has been rejected`);
      setRejectModal(null);
      rejectForm.resetFields();
      fetchPending();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Rejection failed');
    }
    setSubmitting(false);
  };

  const columns = [
    {
      title: 'User', key: 'user',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{r.email}</div>
        </div>
      ),
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role', width: 100,
      render: (role: string) => <Tag color={role === 'CLIENT' ? 'green' : 'default'}>{role}</Tag>,
    },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', width: 130, render: (v: string) => v || '-' },
    { title: 'Merchant', dataIndex: 'merchant_name_entered', key: 'merchant', width: 150, render: (v: string) => v || '-' },
    { title: 'Outlet', dataIndex: 'outlet_name_entered', key: 'outlet', width: 150, render: (v: string) => v || '-' },
    { title: 'eWards Ref', dataIndex: 'ewards_reference', key: 'ref', width: 130, render: (v: string) => v || '-' },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_: any, r: any) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => { setApproveModal(r); approveForm.resetFields(); }}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => { setRejectModal(r); rejectForm.resetFields(); }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Pending Approvals</Title>
          <Text type="secondary">{users.length} user{users.length !== 1 ? 's' : ''} awaiting approval</Text>
        </div>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: 'No pending approvals' }}
        />
      </Card>

      {/* Approve Modal */}
      <Modal
        title={`Approve: ${approveModal?.name}`}
        open={!!approveModal}
        onCancel={() => setApproveModal(null)}
        footer={null}
      >
        {approveModal && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Email">{approveModal.email}</Descriptions.Item>
              <Descriptions.Item label="Role">{approveModal.role}</Descriptions.Item>
              {approveModal.mobile && <Descriptions.Item label="Mobile">{approveModal.mobile}</Descriptions.Item>}
              {approveModal.merchant_name_entered && <Descriptions.Item label="Merchant (entered)">{approveModal.merchant_name_entered}</Descriptions.Item>}
              {approveModal.outlet_name_entered && <Descriptions.Item label="Outlet (entered)">{approveModal.outlet_name_entered}</Descriptions.Item>}
              {approveModal.designation && <Descriptions.Item label="Designation">{approveModal.designation}</Descriptions.Item>}
              {approveModal.ewards_reference && <Descriptions.Item label="eWards Reference">{approveModal.ewards_reference}</Descriptions.Item>}
            </Descriptions>
            <Divider />
            <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
              <Form.Item name="merchant_id" label="Map to Merchant">
                <Select
                  allowClear
                  placeholder="Select merchant (optional)"
                  showSearch
                  optionFilterProp="label"
                  onChange={(val) => { approveForm.setFieldValue('outlet_id', undefined); if (val) fetchOutlets(val); else fetchOutlets(); }}
                  options={merchants.map((m: any) => ({ value: m.id, label: m.name }))}
                />
              </Form.Item>
              <Form.Item name="outlet_id" label="Map to Outlet">
                <Select
                  allowClear
                  placeholder="Select outlet (optional)"
                  showSearch
                  optionFilterProp="label"
                  options={outlets.map((o: any) => ({ value: o.id, label: o.name }))}
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={submitting} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                Approve User
              </Button>
            </Form>
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={`Reject: ${rejectModal?.name}`}
        open={!!rejectModal}
        onCancel={() => setRejectModal(null)}
        footer={null}
      >
        {rejectModal && (
          <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
            <Form.Item
              name="rejection_reason"
              label="Rejection Reason"
              rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
            >
              <TextArea rows={4} placeholder="Explain why this application is being rejected..." />
            </Form.Item>
            <Button type="primary" danger htmlType="submit" block loading={submitting}>
              Reject User
            </Button>
          </Form>
        )}
      </Modal>
    </div>
  );
}
