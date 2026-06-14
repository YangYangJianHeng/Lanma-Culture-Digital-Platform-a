import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, App, Popconfirm, Space, Upload, Image, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { uploadApi } from '../../api/upload';

const { TextArea } = Input;

interface LandmarkRecord {
  id: number;
  name: string;
  longitude: string;
  latitude: string;
  category: string;
  cover_image: string;
  content: string | null;
  video_url: string | null;
  audio_url: string | null;
  distance_from_start: string | null;
  sort_order: number;
}

const LandmarkManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<LandmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LandmarkRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: LandmarkRecord[] }>('/landmarks');
      setData(res.data);
    } catch (err) {
      console.error('获取地标列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record?: LandmarkRecord) => {
    setEditingRecord(record || null);
    form.resetFields();
    setCoverImageUrl(record?.cover_image || '');
    if (record) form.setFieldsValue(record);
    else form.setFieldsValue({ sort_order: 0 });
    setModalOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setCoverImageUrl(res.data.url);
      message.success('图片上传成功');
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = { ...values, cover_image: coverImageUrl };
      if (editingRecord) {
        await request.put(`/admin/landmarks/${editingRecord.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/admin/landmarks', payload);
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
      await request.delete(`/admin/landmarks/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '类别', dataIndex: 'category', width: 100 },
    { title: '经度', dataIndex: 'longitude', width: 120, ellipsis: true },
    { title: '纬度', dataIndex: 'latitude', width: 120, ellipsis: true },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: LandmarkRecord) => (
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
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>地标管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
          style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)' }}>
          新增地标
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingRecord ? '编辑地标' : '新增地标'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="地标名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类别" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="桥梁">桥梁</Select.Option>
              <Select.Option value="雕塑">雕塑</Select.Option>
              <Select.Option value="公园">公园</Select.Option>
              <Select.Option value="历史建筑">历史建筑</Select.Option>
              <Select.Option value="自然景观">自然景观</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="longitude" label="经度" rules={[{ required: true }]}>
            <Input placeholder="如 103.8235640" />
          </Form.Item>
          <Form.Item name="latitude" label="纬度" rules={[{ required: true }]}>
            <Input placeholder="如 36.0610890" />
          </Form.Item>

          <Form.Item label="封面图片" required>
            <Upload
              beforeUpload={handleUploadImage}
              showUploadList={false}
              accept="image/*"
            >
              {coverImageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image src={coverImageUrl} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <Button type="link" style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={(e) => { e.stopPropagation(); setCoverImageUrl(''); }}>
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
                  <span style={{ color: '#bbb', marginTop: 8, fontSize: 12 }}>点击上传封面图</span>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item name="content" label="文化介绍（支持HTML）">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="video_url" label="视频URL">
            <Input />
          </Form.Item>
          <Form.Item name="audio_url" label="音频URL">
            <Input />
          </Form.Item>
          <Form.Item name="distance_from_start" label="距起点(km)">
            <InputNumber min={0} step={0.1} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LandmarkManage;
