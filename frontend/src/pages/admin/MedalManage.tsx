import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, App, Popconfirm, Space, Upload, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import request from '../../api/request';
import { uploadApi } from '../../api/upload';

const { TextArea } = Input;

interface MedalRecord {
  id: number;
  name: string;
  year: number;
  model_url: string;
  thumbnail_url: string;
  description: string | null;
  sort_order: number;
  is_featured: number;
  created_at: string;
}

const MedalManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<MedalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [modelUrl, setModelUrl] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: MedalRecord[] }>('/medals?sort=order');
      setData(res.data);
    } catch (err) {
      console.error('获取奖牌列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record?: MedalRecord) => {
    setEditingRecord(record || null);
    form.resetFields();
    setThumbnailUrl(record?.thumbnail_url || '');
    setModelUrl(record?.model_url || '');
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.setFieldsValue({ sort_order: 0, is_featured: false });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        thumbnail_url: thumbnailUrl,
        model_url: modelUrl,
        is_featured: values.is_featured ? 1 : 0
      };
      if (editingRecord) {
        await request.put(`/admin/medals/${editingRecord.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/admin/medals', payload);
        message.success('创建成功');
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
      await request.delete(`/admin/medals/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const handleUploadImage = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setThumbnailUrl(res.data.url);
      message.success('图片上传成功');
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleUploadModel = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setModelUrl(res.data.url);
      message.success('模型上传成功');
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const MEDAL_PLACEHOLDER = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#f0f0f0"/><circle cx="40" cy="40" r="26" fill="none" stroke="#ddd" stroke-width="2"/><text x="40" y="47" text-anchor="middle" fill="#ccc" font-size="22" font-family="sans-serif">M</text></svg>');

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '年份', dataIndex: 'year', width: 80 },
    {
      title: '图片', dataIndex: 'thumbnail_url', width: 80,
      render: (url: string) => (
        <Image src={url || MEDAL_PLACEHOLDER} width={40} height={40} style={{ borderRadius: 6, objectFit: 'cover' }}
          preview={{ mask: '查看' }} />
      )
    },
    { title: '排序', dataIndex: 'sort_order', width: 60 },
    {
      title: '推荐', dataIndex: 'is_featured', width: 60,
      render: (v: number) => v ? '是' : '否'
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: MedalRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}
            style={{ color: '#C5952B' }}>编辑</Button>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>奖牌管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
          style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)' }}>
          新增奖牌
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingRecord ? '编辑奖牌' : '新增奖牌'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="奖牌名称" rules={[{ required: true }]}>
            <Input placeholder="如 2025兰马完赛奖牌" />
          </Form.Item>
          <Form.Item name="year" label="年份" rules={[{ required: true }]}>
            <InputNumber min={2000} max={2030} style={{ width: '100%' }} placeholder="2025" />
          </Form.Item>

          <Form.Item label="奖牌图片" required>
            <Upload
              beforeUpload={handleUploadImage}
              showUploadList={false}
              accept="image/*"
              style={{ width: '100%' }}
            >
              {thumbnailUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image src={thumbnailUrl} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <Button type="link" style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={(e) => { e.stopPropagation(); setThumbnailUrl(''); }}>
                    删除
                  </Button>
                </div>
              ) : (
                <div style={{
                  width: 120, height: 120, border: '2px dashed #e0e0e0',
                  borderRadius: 10, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  background: '#fafafa'
                }}>
                  <UploadOutlined style={{ fontSize: 24, color: '#bbb' }} />
                  <span style={{ color: '#bbb', marginTop: 8, fontSize: 12 }}>点击上传图片</span>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="3D模型文件">
            <Upload
              beforeUpload={handleUploadModel}
              showUploadList={false}
              accept=".glb,.gltf"
            >
              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                {modelUrl ? '已上传，点击更换' : '上传 .glb 模型'}
              </Button>
            </Upload>
            {modelUrl && <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{modelUrl}</span>}
          </Form.Item>

          <Form.Item name="description" label="描述（支持HTML）">
            <TextArea rows={4} placeholder="输入奖牌设计理念，支持HTML格式" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_featured" label="首页推荐" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MedalManage;
