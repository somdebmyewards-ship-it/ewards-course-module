import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Tabs, Form, Input, InputNumber, Switch, Button, Space, Spin, message, Popconfirm, Select, Divider, Tag, Checkbox, Row, Col, Badge, Tooltip, Alert, Progress } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, LinkOutlined, SafetyCertificateOutlined, CheckSquareOutlined, EyeOutlined, PlayCircleOutlined, FileTextOutlined, BookOutlined, CheckCircleOutlined, SettingOutlined, OrderedListOutlined, QuestionCircleOutlined, TrophyOutlined, UploadOutlined, ClockCircleOutlined, StarOutlined, EditOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text, Paragraph } = Typography;
const PURPLE = '#6B2FA0';

export default function ContentManagerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mod, setMod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsForm] = Form.useForm();
  const [passingPercent, setPassingPercent] = useState<number>(75);
  const [saving, setSaving] = useState(false);

  const fetchModule = () => {
    api.get(`/cm/modules/${id}`).then(r => {
      setMod(r.data);
      detailsForm.setFieldsValue(r.data);
      if (r.data.quiz_metadata?.passing_percent) {
        setPassingPercent(r.data.quiz_metadata.passing_percent);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetchModule, [id]);

  const saveDetails = async (values: any) => {
    setSaving(true);
    // Strip keys the backend doesn't accept and drop nulls for non-nullable columns
    const allowedKeys = [
      'title', 'slug', 'description', 'icon', 'display_order', 'video_url',
      'image_urls', 'document_urls', 'points_reward', 'estimated_minutes',
      'is_published', 'quiz_enabled', 'require_help_viewed', 'require_checklist',
      'require_quiz', 'certificate_enabled', 'page_route',
    ];
    const payload: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in values && values[key] !== null && values[key] !== undefined) {
        payload[key] = values[key];
      }
    }
    try {
      await api.put(`/cm/modules/${id}`, payload);
      message.success('Module details saved successfully');
      fetchModule();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors
        ? (Object.values(errors) as string[][]).flat().join(' ')
        : err?.response?.data?.message || 'Failed to save';
      message.error(msg);
    }
    setSaving(false);
  };

  const addSection = async () => {
    await api.post(`/cm/modules/${id}/sections`, { title: 'New Section', body: '', content_type: 'text', display_order: (mod.sections?.length || 0) + 1 });
    message.success('Section added');
    fetchModule();
  };

  const updateSection = async (secId: number, data: any) => {
    await api.put(`/cm/sections/${secId}`, data);
    message.success('Saved');
    fetchModule();
  };

  const deleteSection = async (secId: number) => {
    await api.delete(`/cm/sections/${secId}`);
    message.success('Section deleted');
    fetchModule();
  };

  const addChecklist = async () => {
    await api.post(`/cm/modules/${id}/checklist`, { label: 'New item', display_order: (mod.checklists?.length || 0) + 1 });
    fetchModule();
  };
  const updateChecklist = async (clId: number, data: any) => { await api.put(`/cm/checklist/${clId}`, data); fetchModule(); };
  const deleteChecklist = async (clId: number) => { await api.delete(`/cm/checklist/${clId}`); fetchModule(); };

  const addQuiz = async () => {
    await api.post(`/cm/modules/${id}/quiz`, { question: 'New question?', options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']), correct_answer: 'Option A', display_order: (mod.quizzes?.length || 0) + 1 });
    fetchModule();
  };
  const updateQuiz = async (qId: number, data: any) => { await api.put(`/cm/quiz/${qId}`, data); fetchModule(); };
  const deleteQuiz = async (qId: number) => { await api.delete(`/cm/quiz/${qId}`); fetchModule(); };

  const savePassingPercent = async () => {
    try {
      await api.put(`/cm/modules/${id}/quiz-metadata`, { passing_percent: passingPercent });
      message.success('Passing percent saved');
    } catch { message.error('Failed to save'); }
  };

  const handleIconUpload = () => {
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

        const iconUrl = res.data.url;
        detailsForm.setFieldsValue({ icon: iconUrl });
        await api.put(`/cm/modules/${id}`, { icon: iconUrl });
        fetchModule();
        message.success({ content: 'Icon updated!', key: 'icon-upload' });
      } catch (err: any) {
        message.error({ content: 'Icon upload failed', key: 'icon-upload' });
      }
    };
    input.click();
  };

  const isIconUrl = (icon?: string) => icon && (icon.startsWith('http') || icon.startsWith('/storage') || icon.startsWith('data:'));

  const handleVideoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,.mp4,.webm,.mov,.avi';
    input.onchange = async (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;

      const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB — small enough for fast progress ticks
      const MAX_RETRIES = 3;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const uploadChunk = async (index: number) => {
        const start = index * CHUNK_SIZE;
        const fd = new FormData();
        fd.append('chunk', file.slice(start, start + CHUNK_SIZE));
        fd.append('upload_id', uploadId);
        fd.append('chunk_index', String(index));
        fd.append('total_chunks', String(totalChunks));
        fd.append('filename', file.name);
        // No timeout — let the server handle it
        await api.post('/cm/upload-chunk', fd, { timeout: 0 });
      };

      message.loading({ content: `Uploading ${file.name} — 0%`, key: 'upload', duration: 0 });

      try {
        for (let i = 0; i < totalChunks; i++) {
          let attempt = 0;
          while (true) {
            try {
              await uploadChunk(i);
              break;
            } catch (err) {
              attempt++;
              if (attempt >= MAX_RETRIES) throw err; // give up after 3 tries
              await new Promise(r => setTimeout(r, 1000 * attempt)); // back-off
            }
          }
          const pct = Math.round(((i + 1) / totalChunks) * 100);
          message.loading({ content: `Uploading ${file.name} — ${pct}%`, key: 'upload', duration: 0 });
        }

        message.loading({ content: 'Finalising…', key: 'upload', duration: 0 });
        const res = await api.post('/cm/upload-finalize', {
          upload_id: uploadId,
          total_chunks: totalChunks,
          filename: file.name,
        }, { timeout: 0 });

        const videoUrl = res.data.url;
        detailsForm.setFieldsValue({ video_url: videoUrl });
        await api.put(`/cm/modules/${id}`, { video_url: videoUrl });
        fetchModule();
        message.success({ content: `✓ ${file.name} uploaded and saved`, key: 'upload' });
      } catch (err: any) {
        const msg = err?.response?.data?.message || err.message || 'Unknown error';
        message.error({ content: `Upload failed: ${msg}`, key: 'upload' });
      }
    };
    input.click();
  };

  const handleSectionVideoUpload = (sectionId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,.mp4,.webm,.mov,.avi';
    input.onchange = async (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;

      const CHUNK_SIZE = 2 * 1024 * 1024;
      const MAX_RETRIES = 3;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const uploadChunk = async (index: number) => {
        const start = index * CHUNK_SIZE;
        const fd = new FormData();
        fd.append('chunk', file.slice(start, start + CHUNK_SIZE));
        fd.append('upload_id', uploadId);
        fd.append('chunk_index', String(index));
        fd.append('total_chunks', String(totalChunks));
        fd.append('filename', file.name);
        await api.post('/cm/upload-chunk', fd, { timeout: 0 });
      };

      message.loading({ content: `Uploading ${file.name} — 0%`, key: 'sec-upload', duration: 0 });

      try {
        for (let i = 0; i < totalChunks; i++) {
          let attempt = 0;
          while (true) {
            try { await uploadChunk(i); break; } catch (err) {
              attempt++;
              if (attempt >= MAX_RETRIES) throw err;
              await new Promise(r => setTimeout(r, 1000 * attempt));
            }
          }
          const pct = Math.round(((i + 1) / totalChunks) * 100);
          message.loading({ content: `Uploading ${file.name} — ${pct}%`, key: 'sec-upload', duration: 0 });
        }

        message.loading({ content: 'Finalising…', key: 'sec-upload', duration: 0 });
        const res = await api.post('/cm/upload-finalize', { upload_id: uploadId, total_chunks: totalChunks, filename: file.name }, { timeout: 0 });

        updateSection(sectionId, { video_url: res.data.url });
        message.success({ content: `✓ ${file.name} uploaded`, key: 'sec-upload' });
      } catch (err: any) {
        message.error({ content: `Upload failed: ${err?.response?.data?.message || err.message}`, key: 'sec-upload' });
      }
    };
    input.click();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" /></div>;

  const completionScore = [mod?.sections?.length > 0, mod?.checklists?.length > 0, mod?.quizzes?.length > 0, mod?.description].filter(Boolean).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/content-manager')}
          style={{ padding: 0, marginBottom: 16, color: PURPLE, fontWeight: 500 }}>
          Back to Modules
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{ fontSize: 36, width: 56, height: 56, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              onClick={handleIconUpload}
              title="Click to change icon"
            >
              {isIconUrl(mod?.icon) ? (
                <img src={mod.icon} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (mod?.icon || '📚')}
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: PURPLE, borderRadius: '8px 0 0 0', padding: '2px 4px' }}>
                <EditOutlined style={{ color: '#fff', fontSize: 10 }} />
              </div>
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>{mod?.title}</Title>
              <Space size={8} style={{ marginTop: 4 }}>
                <Tag color={mod?.is_published ? 'green' : 'orange'}>{mod?.is_published ? 'Published' : 'Draft'}</Tag>
                {mod?.points_reward > 0 && <Tag icon={<StarOutlined />} color="gold">{mod.points_reward} pts</Tag>}
                {mod?.estimated_minutes && <Tag icon={<ClockCircleOutlined />}>{mod.estimated_minutes} min</Tag>}
                <Tag>{mod?.sections?.length || 0} sections</Tag>
                <Tag>{mod?.quizzes?.length || 0} quiz</Tag>
              </Space>
            </div>
          </div>
          <div>
            <Tooltip title="Module completeness">
              <Progress type="circle" percent={completionScore * 25} size={48} strokeColor={PURPLE}
                format={() => `${completionScore}/4`} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="details"
        type="card"
        size="large"
        style={{ marginBottom: 24 }}
        items={[
          /* ============ DETAILS TAB ============ */
          { key: 'details', label: <span><SettingOutlined /> Details</span>, children: (
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card title={<span><EditOutlined /> Module Information</span>} style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Form form={detailsForm} layout="vertical" onFinish={saveDetails} requiredMark="optional">
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Form.Item name="title" label="Module Title" rules={[{ required: true, message: 'Title is required' }]}>
                          <Input size="large" placeholder="e.g. Campaign Creation" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Module Icon">
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden', flexShrink: 0, border: '2px dashed #d4b8ff' }}>
                              {isIconUrl(detailsForm.getFieldValue('icon')) ? (
                                <img src={detailsForm.getFieldValue('icon')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (detailsForm.getFieldValue('icon') || mod?.icon || '📚')}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Form.Item name="icon" noStyle>
                                <Input size="middle" placeholder="📢 or upload" />
                              </Form.Item>
                            </div>
                            <Button icon={<UploadOutlined />} onClick={handleIconUpload} style={{ borderColor: PURPLE, color: PURPLE }}>
                              Upload
                            </Button>
                          </div>
                          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Enter an emoji or upload an image (PNG, JPG, SVG)</Text>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="slug" label="URL Slug" rules={[{ required: true }]} extra="Used in the module URL. Use lowercase with hyphens.">
                      <Input addonBefore="/learning-hub/" placeholder="campaign-creation" />
                    </Form.Item>

                    <Form.Item name="description" label="Description" extra="Brief summary shown on the Learning Hub cards.">
                      <Input.TextArea rows={3} placeholder="What will learners gain from this module?" showCount maxLength={300} />
                    </Form.Item>

                    <Divider><PlayCircleOutlined /> Introductory Video</Divider>
                    <Form.Item name="video_url" label="Video" extra="Paste a YouTube, Vimeo, or direct video URL. Or upload a file.">
                      <Input
                        size="large"
                        placeholder="https://youtube.com/watch?v=..."
                        addonAfter={
                          <Button type="text" icon={<UploadOutlined />} onClick={handleVideoUpload} style={{ border: 'none', padding: '0 4px' }}>
                            Upload
                          </Button>
                        }
                      />
                    </Form.Item>

                    <Divider />
                    <Row gutter={16}>
                      <Col xs={8}>
                        <Form.Item name="display_order" label="Display Order">
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={8}>
                        <Form.Item name="points_reward" label="Points on Complete">
                          <InputNumber min={0} style={{ width: '100%' }} addonAfter="pts" />
                        </Form.Item>
                      </Col>
                      <Col xs={8}>
                        <Form.Item name="estimated_minutes" label="Est. Time">
                          <InputNumber min={1} style={{ width: '100%' }} addonAfter="min" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={12}>
                        <Form.Item name="is_published" label="Published" valuePropName="checked">
                          <Switch checkedChildren="Live" unCheckedChildren="Draft" />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name="quiz_enabled" label="Quiz Enabled" valuePropName="checked">
                          <Switch checkedChildren="On" unCheckedChildren="Off" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large"
                      style={{ background: PURPLE, borderColor: PURPLE, width: '100%', height: 48, borderRadius: 8, fontWeight: 600 }}>
                      Save Module Details
                    </Button>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                {/* Completion Rules */}
                <Card title={<span><CheckSquareOutlined /> Completion Rules</span>} style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Form form={detailsForm} layout="vertical" onFinish={saveDetails}>
                    <Form.Item name="require_help_viewed" valuePropName="checked" style={{ marginBottom: 12 }}>
                      <Checkbox><Text>Require Learn step</Text></Checkbox>
                    </Form.Item>
                    <Form.Item name="require_checklist" valuePropName="checked" style={{ marginBottom: 12 }}>
                      <Checkbox><Text>Require Checklist</Text></Checkbox>
                    </Form.Item>
                    <Form.Item name="require_quiz" valuePropName="checked" style={{ marginBottom: 12 }}>
                      <Checkbox><Text>Require Quiz pass</Text></Checkbox>
                    </Form.Item>
                    <Divider style={{ margin: '12px 0' }} />
                    <Form.Item name="certificate_enabled" valuePropName="checked" style={{ marginBottom: 8 }}>
                      <Checkbox><Text><SafetyCertificateOutlined style={{ color: PURPLE }} /> Certificate eligible</Text></Checkbox>
                    </Form.Item>
                    <Text type="secondary" style={{ fontSize: 12 }}>Users who complete this module can download a certificate.</Text>
                  </Form>
                </Card>

                {/* Dashboard Link */}
                <Card title={<span><LinkOutlined /> Dashboard Link</span>} style={{ borderRadius: 12 }}>
                  <Form form={detailsForm} layout="vertical" onFinish={saveDetails}>
                    <Form.Item name="page_route" label="Linked Page Route">
                      <Input placeholder="/campaign/create" />
                    </Form.Item>
                  </Form>
                  <div style={{ padding: '8px 12px', background: '#f3e8ff', borderRadius: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: PURPLE }}>
                      Module URL: <Tag color="purple" style={{ margin: 0 }}>/learning-hub/{mod?.slug}</Tag>
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          )},

          /* ============ SECTIONS TAB ============ */
          { key: 'sections', label: <span><OrderedListOutlined /> Sections <Badge count={mod?.sections?.length || 0} style={{ background: PURPLE, marginLeft: 4 }} /></span>, children: (
            <div>
              {mod?.sections?.length === 0 && (
                <Alert message="No sections yet" description="Add your first section to start building module content." type="info" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
              )}
              {mod?.sections?.map((sec: any, i: number) => (
                <Card key={sec.id} style={{ borderRadius: 12, marginBottom: 16, borderLeft: `4px solid ${PURPLE}` }}
                  title={
                    <Space>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: PURPLE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{i + 1}</div>
                      <Text strong>{sec.title || 'Untitled Section'}</Text>
                      {sec.is_required && <Tag color="purple" style={{ marginLeft: 4 }}>Required</Tag>}
                    </Space>
                  }
                  extra={<Popconfirm title="Delete this section?" onConfirm={() => deleteSection(sec.id)}><Button danger icon={<DeleteOutlined />} size="small">Delete</Button></Popconfirm>}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Section Title</Text>
                      <Input value={sec.title} onChange={e => updateSection(sec.id, { title: e.target.value })} placeholder="Section title" style={{ marginBottom: 12 }} />
                    </Col>
                    <Col xs={24}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Content (supports markdown: **bold**, - bullet points)</Text>
                      <Input.TextArea value={sec.body} onChange={e => updateSection(sec.id, { body: e.target.value })} rows={8} placeholder="Write section content here..." style={{ marginBottom: 12, fontFamily: 'monospace', fontSize: 13 }} />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        <BookOutlined style={{ color: PURPLE }} /> Key Takeaway
                      </Text>
                      <Input.TextArea value={sec.key_takeaway || ''} onChange={e => updateSection(sec.id, { key_takeaway: e.target.value })} rows={2} placeholder="What's the main learning from this section?" />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        <PlayCircleOutlined /> Section Video URL
                      </Text>
                      <Input value={sec.video_url || ''} onChange={e => updateSection(sec.id, { video_url: e.target.value })} placeholder="Optional video for this section" suffix={<UploadOutlined style={{ cursor: 'pointer', color: PURPLE }} onClick={() => handleSectionVideoUpload(sec.id)} />} />
                      <div style={{ marginTop: 8 }}>
                        <Checkbox checked={!!sec.is_required} onChange={e => updateSection(sec.id, { is_required: e.target.checked })}>
                          Required for completion
                        </Checkbox>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addSection} size="large"
                style={{ borderRadius: 8, height: 48, borderColor: PURPLE, color: PURPLE }}>
                Add Section
              </Button>
            </div>
          )},

          /* ============ CHECKLIST TAB ============ */
          { key: 'checklist', label: <span><CheckCircleOutlined /> Checklist <Badge count={mod?.checklists?.length || 0} style={{ background: '#52c41a', marginLeft: 4 }} /></span>, children: (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Checklist items that learners must complete before moving to the quiz.</Text>
              </div>
              {mod?.checklists?.map((cl: any, i: number) => (
                <div key={cl.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e8f5e9', color: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                  <Input value={cl.label} onChange={e => updateChecklist(cl.id, { label: e.target.value })} bordered={false} style={{ flex: 1, fontSize: 14 }} />
                  <Popconfirm title="Delete?" onConfirm={() => deleteChecklist(cl.id)}><Button danger type="text" icon={<DeleteOutlined />} size="small" /></Popconfirm>
                </div>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addChecklist}
                style={{ borderRadius: 8, marginTop: 8, borderColor: '#52c41a', color: '#52c41a' }}>
                Add Checklist Item
              </Button>
            </Card>
          )},

          /* ============ QUIZ TAB ============ */
          { key: 'quiz', label: <span><QuestionCircleOutlined /> Quiz <Badge count={mod?.quizzes?.length || 0} style={{ background: '#fa8c16', marginLeft: 4 }} /></span>, children: (
            <div>
              {/* Passing Percent Config */}
              <Card style={{ borderRadius: 12, marginBottom: 20, background: '#fffbe6', borderColor: '#ffe58f' }}>
                <Row align="middle" gutter={16}>
                  <Col flex="auto">
                    <Text strong style={{ fontSize: 15 }}><TrophyOutlined style={{ color: '#fa8c16' }} /> Passing Score</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Minimum score required to pass and earn points.</Text>
                  </Col>
                  <Col>
                    <Space>
                      <InputNumber min={1} max={100} value={passingPercent} onChange={(v) => setPassingPercent(v || 75)} addonAfter="%" style={{ width: 120 }} />
                      <Button type="primary" onClick={savePassingPercent} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>Save</Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {mod?.quizzes?.map((q: any, i: number) => {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                return (
                  <Card key={q.id} style={{ borderRadius: 12, marginBottom: 16 }}
                    title={
                      <Space>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff7e6', color: '#fa8c16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>Q{i + 1}</div>
                        <Text strong style={{ fontSize: 14 }}>{q.question?.slice(0, 50)}{q.question?.length > 50 ? '...' : ''}</Text>
                      </Space>
                    }
                    extra={<Popconfirm title="Delete this question?" onConfirm={() => deleteQuiz(q.id)}><Button danger icon={<DeleteOutlined />} size="small">Delete</Button></Popconfirm>}
                  >
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Question</Text>
                    <Input value={q.question} onChange={e => updateQuiz(q.id, { question: e.target.value })} placeholder="Type your question here" style={{ marginBottom: 16 }} />

                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Answer Options</Text>
                    <Row gutter={[12, 8]}>
                      {opts.map((opt: string, j: number) => (
                        <Col xs={24} md={12} key={j}>
                          <Input
                            value={opt}
                            onChange={e => { const newOpts = [...opts]; newOpts[j] = e.target.value; updateQuiz(q.id, { options: JSON.stringify(newOpts) }); }}
                            addonBefore={<span style={{ fontWeight: 600, color: opt === q.correct_answer ? '#52c41a' : undefined }}>{String.fromCharCode(65 + j)}</span>}
                            style={{ borderColor: opt === q.correct_answer ? '#b7eb8f' : undefined }}
                          />
                        </Col>
                      ))}
                    </Row>

                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Correct Answer</Text>
                      <Select value={q.correct_answer} onChange={v => updateQuiz(q.id, { correct_answer: v })}
                        options={opts.map((o: string, j: number) => ({ value: o, label: `${String.fromCharCode(65 + j)}. ${o}` }))}
                        style={{ width: '100%' }} />
                    </div>
                  </Card>
                );
              })}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addQuiz} size="large"
                style={{ borderRadius: 8, height: 48, borderColor: '#fa8c16', color: '#fa8c16' }}>
                Add Question
              </Button>
            </div>
          )},

          /* ============ PREVIEW TAB ============ */
          { key: 'preview', label: <span><EyeOutlined /> Preview</span>, children: mod ? (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Module Header */}
              <Card style={{ borderRadius: 16, marginBottom: 24, background: `linear-gradient(135deg, ${PURPLE} 0%, #9B59B6 50%, #C39BD3 100%)`, border: 'none', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ fontSize: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 16, width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', overflow: 'hidden' }}>
                    {isIconUrl(mod.icon) ? <img src={mod.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (mod.icon || '📚')}
                  </div>
                  <div>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>{mod.title}</Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 12px', fontSize: 15 }}>{mod.description}</Paragraph>
                    <Space size={8} wrap>
                      <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12 }}><FileTextOutlined /> {mod.sections?.length || 0} sections</Tag>
                      <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12 }}><CheckCircleOutlined /> {mod.checklists?.length || 0} checklist</Tag>
                      <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12 }}><QuestionCircleOutlined /> {mod.quizzes?.length || 0} quiz</Tag>
                      {mod.points_reward > 0 && <Tag color="gold" style={{ borderRadius: 12 }}><TrophyOutlined /> {mod.points_reward} pts</Tag>}
                      {mod.estimated_minutes && <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12 }}><ClockCircleOutlined /> {mod.estimated_minutes} min</Tag>}
                    </Space>
                  </div>
                </div>
              </Card>

              {/* Video */}
              {mod.video_url && (
                <Card style={{ borderRadius: 12, marginBottom: 20 }} title={<span><PlayCircleOutlined style={{ color: PURPLE }} /> Introductory Video</span>}>
                  {mod.video_url.includes('youtube') || mod.video_url.includes('youtu.be') ? (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden' }}>
                      <iframe src={mod.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                    </div>
                  ) : (
                    <video controls style={{ width: '100%', borderRadius: 8 }} src={mod.video_url} />
                  )}
                </Card>
              )}

              {/* Sections */}
              {mod.sections?.map((sec: any, i: number) => (
                <Card key={sec.id} style={{ borderRadius: 12, marginBottom: 16 }}
                  title={<Space><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3e8ff', color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div><Text strong>{sec.title}</Text></Space>}
                  extra={sec.is_required ? <Tag color="purple">Required</Tag> : <Tag color="default">Optional</Tag>}
                >
                  <div style={{ lineHeight: 1.8 }}>
                    {sec.body?.split('\n').map((line: string, li: number) => {
                      if (line.startsWith('**') && line.endsWith('**')) return <Text key={li} strong style={{ display: 'block', marginTop: 12, fontSize: 15 }}>{line.replace(/\*\*/g, '')}</Text>;
                      if (line.startsWith('- ')) return <div key={li} style={{ paddingLeft: 16, marginBottom: 2 }}>• {line.slice(2)}</div>;
                      if (line.trim() === '') return <div key={li} style={{ height: 8 }} />;
                      return <span key={li}>{line}<br /></span>;
                    })}
                  </div>
                  {sec.video_url && <div style={{ marginTop: 16 }}><video controls style={{ width: '100%', borderRadius: 8 }} src={sec.video_url} /></div>}
                  {sec.key_takeaway && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#f3e8ff', borderRadius: 8, borderLeft: `4px solid ${PURPLE}` }}>
                      <Text strong style={{ color: PURPLE, fontSize: 13 }}><BookOutlined /> Key Takeaway</Text>
                      <Paragraph style={{ margin: '4px 0 0', fontSize: 14 }}>{sec.key_takeaway}</Paragraph>
                    </div>
                  )}
                </Card>
              ))}

              {/* Checklist */}
              {mod.checklists?.length > 0 && (
                <Card style={{ borderRadius: 12, marginBottom: 16 }} title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> Learning Checklist</span>}>
                  {mod.checklists.map((cl: any, idx: number) => (
                    <div key={cl.id} style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: idx < mod.checklists.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ width: 22, height: 22, border: '2px solid #d9d9d9', borderRadius: 4, flexShrink: 0 }} />
                      <Text style={{ fontSize: 14 }}>{cl.label}</Text>
                    </div>
                  ))}
                </Card>
              )}

              {/* Quiz */}
              {mod.quizzes?.length > 0 && (
                <Card style={{ borderRadius: 12, marginBottom: 16 }} title={<span><QuestionCircleOutlined style={{ color: '#fa8c16' }} /> Quick Quiz ({mod.quizzes.length} questions)</span>}>
                  {mod.quizzes.map((q: any, i: number) => {
                    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                    return (
                      <div key={q.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < mod.quizzes.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <Text strong><span style={{ color: PURPLE }}>Q{i + 1}.</span> {q.question}</Text>
                        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {opts.map((opt: string, j: number) => (
                            <div key={j} style={{
                              padding: '8px 14px', borderRadius: 8,
                              background: opt === q.correct_answer ? '#f6ffed' : '#fafafa',
                              border: opt === q.correct_answer ? '1.5px solid #b7eb8f' : '1px solid #f0f0f0',
                            }}>
                              <Text style={{ color: opt === q.correct_answer ? '#389e0d' : '#595959', fontWeight: opt === q.correct_answer ? 600 : 400 }}>
                                {String.fromCharCode(65 + j)}. {opt} {opt === q.correct_answer && <CheckCircleOutlined style={{ marginLeft: 4 }} />}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Module Configuration — editable */}
              <Card style={{ borderRadius: 12, background: '#fafafa' }} title={<span><SettingOutlined /> Module Configuration</span>}>
                <Form form={detailsForm} layout="vertical" onFinish={saveDetails}>
                  <Row gutter={[16, 8]}>
                    <Col xs={12}>
                      <Form.Item name="require_help_viewed" valuePropName="checked" style={{ marginBottom: 8 }}>
                        <Checkbox><Text>Learn step required</Text></Checkbox>
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="require_checklist" valuePropName="checked" style={{ marginBottom: 8 }}>
                        <Checkbox><Text>Checklist required</Text></Checkbox>
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="require_quiz" valuePropName="checked" style={{ marginBottom: 8 }}>
                        <Checkbox><Text>Quiz pass required</Text></Checkbox>
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="certificate_enabled" valuePropName="checked" style={{ marginBottom: 8 }}>
                        <Checkbox><Text><SafetyCertificateOutlined style={{ color: PURPLE }} /> Certificate eligible</Text></Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large"
                    style={{ background: PURPLE, borderColor: PURPLE, width: '100%', height: 48, borderRadius: 8, fontWeight: 600, marginTop: 12 }}>
                    Save Configuration
                  </Button>
                </Form>
              </Card>
            </div>
          ) : <Spin /> },
        ]}
      />
    </div>
  );
}
