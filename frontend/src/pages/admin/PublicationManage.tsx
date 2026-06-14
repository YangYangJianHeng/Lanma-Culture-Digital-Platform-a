import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, App, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { PublicationRecord } from '../../api/publications';
import RichTextEditor from '../../components/common/RichTextEditor';

const { Title } = Typography;
const { TextArea } = Input;

const PublicationManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<PublicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<PublicationRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: PublicationRecord[] }>('/admin/publications');
      setData(res.data);
    } catch (err) {
      console.error('获取发布数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record?: PublicationRecord) => {
    setEditorKey(k => k + 1);
    setEditingRecord(record || null);
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        ...record,
      });
      setEditorContent(record.content || '');
    } else {
      setEditorContent('');
      form.setFieldsValue({ is_published: 1, sort_order: 0 });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    values.content = editorContent;
    setSubmitting(true);
    try {
      if (editingRecord) {
        await request.put(`/admin/publications/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/admin/publications', values);
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/admin/publications/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const showPreview = (record: PublicationRecord) => {
    setPreviewTitle(record.title);
    setPreviewContent(record.content || '');
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    document.querySelectorAll('video').forEach(v => v.pause());
  };

  const columns = [
    { title: '标题', dataIndex: 'title', ellipsis: true, width: 200 },
    { title: '摘要', dataIndex: 'summary', ellipsis: true, width: 200 },
    {
      title: '封面', dataIndex: 'cover_image', width: 80,
      render: (url: string) => url ? <img src={url} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} /> : '-',
    },
    {
      title: '状态', dataIndex: 'is_published', width: 60,
      render: (v: number) => v === 1 ? <span style={{ color: '#52c41a' }}>已发布</span> : <span style={{ color: '#999' }}>草稿</span>,
    },
    { title: '排序', dataIndex: 'sort_order', width: 50 },
    { title: '创建时间', dataIndex: 'created_at', width: 80, render: (v: string) => v?.slice(0, 10) },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: any, record: PublicationRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showPreview(record)} style={{ color: '#C5952B' }}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} style={{ color: '#B8860B' }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-content-card">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>小兰发布管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
          style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8 }}>
          新增发布
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 1000 }} />

      <Modal title={editingRecord ? '编辑发布' : '新增发布'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} confirmLoading={submitting}
        width={900} styles={{ body: { maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' } }}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="cover_image" label="封面图片URL">
              <Input placeholder="输入图片地址或上传" style={{ marginBottom: 8 }} />
            </Form.Item>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                action="/api/v1/upload"
                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    form.setFieldsValue({ cover_image: info.file.response.data.url });
                    message.success('上传成功');
                  } else if (info.file.status === 'error') {
                    message.error('上传失败');
                  }
                }}
              >
                <Button icon={<UploadOutlined />} size="small">上传封面</Button>
              </Upload>
            </div>
          </div>
          <Form.Item name="summary" label="摘要">
            <TextArea rows={2} placeholder="简短摘要，用于列表展示" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="sort_order" label="排序">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item name="is_published" label="状态">
              <Select>
                <Select.Option value={1}>已发布</Select.Option>
                <Select.Option value={0}>草稿</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#333' }}>内容（支持图文混排）</div>
            <RichTextEditor key={editorKey} value={editorContent} onChange={setEditorContent} />
          </div>
        </Form>
      </Modal>

      <Modal title={previewTitle} open={previewOpen}
        onCancel={closePreview} footer={null} width={700}
        afterClose={() => document.querySelectorAll('video').forEach(v => v.pause())}>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: '#444' }}
          dangerouslySetInnerHTML={{ __html: previewContent }} />
      </Modal>
    </div>
  );
};

export default PublicationManage;
