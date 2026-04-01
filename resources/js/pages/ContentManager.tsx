import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Spin, Popconfirm, message, Tag, Space, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

export default function ContentManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchModules = () => {
    api.get('/cm/modules').then(r => { setModules(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(fetchModules, []);

  const createModule = async (values: any) => {
    setCreating(true);
    try {
      const res = await api.post('/cm/modules', values);
      message.success('Module created');
      setCreateOpen(false);
      form.resetFields();
      navigate(`/content-manager/${res.data.id}`);
    } catch (err: any) { message.error(err.response?.data?.message || 'Failed'); }
    setCreating(false);
  };

  const deleteModule = async (id: number) => {
    await api.delete(`/cm/modules/${id}`);
    message.success('Module deleted');
    fetchModules();
  };

  const isIconUrl = (icon?: string) => icon && (icon.startsWith('http') || icon.startsWith('/storage') || icon.startsWith('data:'));

  const handleIconUpload = (moduleId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.png,.jpg,.jpeg,.svg,.webp,.gif';
    input.onchange = async (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { message.error('Image must be under 5MB'); return; }

      const CHUNK_SIZE = 2 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `icon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      message.loading({ content: 'Uploading icon...', key: 'icon-upload', duration: 0 });

      try {
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const fd = new FormData();
          fd.append('chunk', file.slice(start, start + CHUNK_SIZE));
          fd.append('upload_id', uploadId);
          fd.append('chunk_index', String(i));
          fd.append('total_chunks', String(totalChunks));
          fd.append('filename', file.name);
          await api.post('/cm/upload-chunk', fd, { timeout: 0 });
        }

        const res = await api.post('/cm/upload-finalize', {
          upload_id: uploadId,
          total_chunks: totalChunks,
          filename: file.name,
        }, { timeout: 0 });

        await api.put(`/cm/modules/${moduleId}`, { icon: res.data.url });
        message.success({ content: 'Icon updated!', key: 'icon-upload' });
        fetchModules();
      } catch {
        message.error({ content: 'Upload failed', key: 'icon-upload' });
      }
    };
    input.click();
  };

  const togglePublish = async (m: any) => {
    await api.put(`/cm/modules/${m.id}`, { is_published: !m.is_published });
    message.success(m.is_published ? 'Module unpublished' : 'Module published');
    fetchModules();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Content Manager</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} style={{ background: '#6B2FA0', borderRadius: 8 }}>
          Create New Module
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {modules.map(m => (
          <Col xs={24} sm={12} lg={8} key={m.id}>
            <Card style={{ borderRadius: 12 }} actions={[
              <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content-manager/${m.id}`)}>Edit</Button>,
              <Button type="link" style={{ color: m.is_published ? '#fa8c16' : '#52c41a' }} onClick={() => togglePublish(m)}>{m.is_published ? 'Unpublish' : 'Publish'}</Button>,
              <Popconfirm title="Delete this module?" onConfirm={() => deleteModule(m.id)}><Button type="link" danger icon={<DeleteOutlined />}>Delete</Button></Popconfirm>,
            ]}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); handleIconUpload(m.id); }}
                  title="Click to change icon"
                  style={{
                    width: 44, height: 44, borderRadius: 10, background: '#f3e8ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    position: 'relative', border: '2px solid #e8d5f5', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B2FA0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8d5f5'; }}
                >
                  {isIconUrl(m.icon) ? (
                    <img src={m.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (m.icon || '📚')}
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1, background: '#6B2FA0',
                    borderRadius: '6px 0 0 0', padding: '1px 3px', lineHeight: 1,
                  }}>
                    <EditOutlined style={{ color: '#fff', fontSize: 9 }} />
                  </div>
                </div>
                <div>
                  <Text strong>{m.title}</Text>
                  <Tag color={m.is_published ? 'green' : 'default'} style={{ marginLeft: 8 }}>{m.is_published ? 'Published' : 'Draft'}</Tag>
                </div>
              </div>
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13 }}>{m.description}</Paragraph>
              <div style={{ fontSize: 12, color: '#999' }}>
                {m.sections_count || 0} sections | {m.checklists_count || 0} checklist | {m.quizzes_count || 0} quiz
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal title="Create New Module" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={createModule}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="icon" label="Icon (emoji)" initialValue="📚"><Input /></Form.Item>
          <Form.Item name="display_order" label="Order" initialValue={modules.length + 1}><InputNumber min={1} /></Form.Item>
          <Form.Item name="points_reward" label="Points Reward" initialValue={10}><InputNumber min={0} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={creating} block style={{ background: '#6B2FA0' }}>Create Module</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
