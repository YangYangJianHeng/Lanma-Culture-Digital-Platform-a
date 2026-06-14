import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, App, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { FoodRecord } from '../../api/foods';

const { Title } = Typography;

const FoodManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: FoodRecord[] }>('/foods');
      setData(res.data);
    } catch (err) {
      console.error('获取美食数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record?: FoodRecord) => {
    setEditingRecord(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingRecord) {
        await request.put(`/admin/foods/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/admin/foods', values);
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
      await request.delete(`/admin/foods/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', width: 120 },
    { title: '分类', dataIndex: 'category', width: 60 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    { title: '评分', dataIndex: 'rating', width: 60 },
    { title: '推荐语', dataIndex: 'recommend', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 50 },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right' as const,
      render: (_: any, record: FoodRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} style={{ color: '#C5952B' }}>编辑</Button>
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
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>美食数据管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
          style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8 }}>
          添加美食
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 800 }} />

      <Modal title={editingRecord ? '编辑美食' : '添加美食'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} confirmLoading={submitting} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="面食">面食</Select.Option>
              <Select.Option value="小吃">小吃</Select.Option>
              <Select.Option value="正餐">正餐</Select.Option>
              <Select.Option value="饮品">饮品</Select.Option>
              <Select.Option value="特产">特产</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="image_url" label="图片URL">
            <Input placeholder="输入图片地址或上传文件" />
          </Form.Item>
          <Form.Item label=" ">
            <Upload
              accept="image/*"
              showUploadList={false}
              action="/api/v1/upload"
              headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  form.setFieldsValue({ image_url: info.file.response.data.url });
                  message.success('上传成功');
                } else if (info.file.status === 'error') {
                  message.error('上传失败，请手动输入URL');
                }
              }}
            >
              <Button icon={<UploadOutlined />} size="small">上传图片</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="rating" label="评分"><InputNumber min={0} max={5} step={0.1} className="w-full" /></Form.Item>
            <Form.Item name="sort_order" label="排序"><InputNumber className="w-full" /></Form.Item>
          </div>
          <Form.Item name="recommend" label="推荐语"><Input /></Form.Item>
          <Form.Item name="ai_analysis" label="AI 分析（LangChain）"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FoodManage;
