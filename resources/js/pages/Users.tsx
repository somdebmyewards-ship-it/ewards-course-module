import React, { useEffect, useState } from 'react';
import { Typography, Table, Tag, Button, Modal, Form, Input, Select, Switch, Popconfirm, message, Space, Card, Row, Col, Statistic, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title } = Typography;

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);

  const fetchUsers = () => { api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false); }); };
  const fetchMerchants = () => { api.get('/admin/merchants').then(r => setMerchants(r.data)).catch(() => {}); };
  const fetchOutlets = (merchantId?: number) => {
    const url = merchantId ? `/admin/outlets?merchant_id=${merchantId}` : '/admin/outlets';
    api.get(url).then(r => setOutlets(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
    fetchMerchants();
    fetchOutlets();
  }, []);

  const addUser = async (values: any) => {
    await api.post('/admin/users', values);
    message.success('User created');
    setAddOpen(false); form.resetFields(); fetchUsers();
  };

  const updateUser = async (values: any) => {
    await api.put(`/admin/users/${editUser.id}`, values);
    message.success('User updated');
    setEditOpen(false); fetchUsers();
  };

  const deleteUser = async (id: number) => {
    await api.delete(`/admin/users/${id}`);
    message.success('User deleted');
    fetchUsers();
  };

  const approve = async (id: number) => {
    await api.post(`/admin/approve/${id}`);
    message.success('User approved');
    fetchUsers();
  };

  const stats = {
    total: users.length,
    approved: users.filter(u => u.approved).length,
    pending: users.filter(u => !u.approved).length,
    certified: users.filter(u => u.certificate).length,
  };

  const roleColors: Record<string, string> = { ADMIN: 'purple', TRAINER: 'blue', CASHIER: 'default', CLIENT: 'green', USER: 'cyan' };
  const roleLabels: Record<string, string> = { ADMIN: 'Admin', TRAINER: 'Trainer', CASHIER: 'Cashier', CLIENT: 'Client', USER: 'User' };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string, r: any) => <><div style={{ fontWeight: 600 }}>{name}</div><div style={{ fontSize: 12, color: '#999' }}>{r.email}</div></> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={roleColors[role]}>{roleLabels[role] || role}</Tag>, width: 100 },
    {
      title: 'Merchant', key: 'merchant', width: 150,
      render: (_: any, r: any) => {
        if (r.merchant?.name) return r.merchant.name;
        if (r.merchant_name_entered) return <span style={{ color: '#999' }}>{r.merchant_name_entered}</span>;
        return <span style={{ color: '#ccc' }}>-</span>;
      },
    },
    {
      title: 'Outlet', key: 'outlet', width: 150,
      render: (_: any, r: any) => {
        if (r.outlet?.name) return r.outlet.name;
        if (r.outlet_name_entered) return <span style={{ color: '#999' }}>{r.outlet_name_entered}</span>;
        return <span style={{ color: '#ccc' }}>-</span>;
      },
    },
    {
      title: 'Points', dataIndex: 'points', key: 'points', width: 90,
      render: (points: number) => <Tag icon={<ThunderboltOutlined />} color="purple">{points || 0}</Tag>,
      sorter: (a: any, b: any) => (a.points || 0) - (b.points || 0),
    },
    {
      title: 'Progress', key: 'progress', width: 120,
      render: (_: any, r: any) => {
        const pct = r.progress_percentage ?? 0;
        return <Progress percent={pct} size="small" strokeColor="#6B2FA0" />;
      },
      sorter: (a: any, b: any) => (a.progress_percentage || 0) - (b.progress_percentage || 0),
    },
    { title: 'Status', dataIndex: 'approved', key: 'approved', width: 110, render: (approved: boolean) => approved ? <Tag icon={<CheckCircleOutlined />} color="success">Approved</Tag> : <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag> },
    { title: 'Actions', key: 'actions', width: 180, render: (_: any, r: any) => (
      <Space>
        {!r.approved && <Button size="small" type="primary" onClick={() => approve(r.id)} style={{ background: '#52c41a' }}>Approve</Button>}
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditUser(r); editForm.setFieldsValue({ ...r, merchant_id: r.merchant_id || undefined, outlet_id: r.outlet_id || undefined }); setEditOpen(true); if (r.merchant_id) fetchOutlets(r.merchant_id); }} />
        <Popconfirm title="Delete user?" onConfirm={() => deleteUser(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Users</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#6B2FA0' }}>Add User</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total', value: stats.total, icon: <UserOutlined /> },
          { title: 'Approved', value: stats.approved, icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
          { title: 'Pending', value: stats.pending, icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
          { title: 'Certified', value: stats.certified, icon: <TrophyOutlined style={{ color: '#6B2FA0' }} /> },
        ].map((s, i) => <Col key={i} xs={12} sm={6}><Card style={{ borderRadius: 12 }}><Statistic title={s.title} value={s.value} prefix={s.icon} /></Card></Col>)}
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} scroll={{ x: 1100 }} />
      </Card>

      <Modal title="Add User" open={addOpen} onCancel={() => setAddOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={addUser}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Role" initialValue="CASHIER"><Select options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TRAINER', label: 'Trainer' }, { value: 'CASHIER', label: 'Cashier' }, { value: 'CLIENT', label: 'Client' }, { value: 'USER', label: 'User' }]} /></Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: '#6B2FA0' }}>Create User</Button>
        </Form>
      </Modal>

      <Modal title="Edit User" open={editOpen} onCancel={() => setEditOpen(false)} footer={null} width={520}>
        <Form form={editForm} layout="vertical" onFinish={updateUser}>
          <Form.Item name="name" label="Name"><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Select options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TRAINER', label: 'Trainer' }, { value: 'CASHIER', label: 'Cashier' }, { value: 'CLIENT', label: 'Client' }, { value: 'USER', label: 'User' }]} /></Form.Item>
          <Form.Item name="merchant_id" label="Merchant">
            <Select
              allowClear
              placeholder="Select merchant"
              showSearch
              optionFilterProp="label"
              onChange={(val) => { editForm.setFieldValue('outlet_id', undefined); if (val) fetchOutlets(val); else fetchOutlets(); }}
              options={merchants.map((m: any) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>
          <Form.Item name="outlet_id" label="Outlet">
            <Select
              allowClear
              placeholder="Select outlet"
              showSearch
              optionFilterProp="label"
              options={outlets.map((o: any) => ({ value: o.id, label: o.name }))}
            />
          </Form.Item>
          <Form.Item name="approved" label="Approved" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: '#6B2FA0' }}>Save Changes</Button>
        </Form>
      </Modal>
    </div>
  );
}
