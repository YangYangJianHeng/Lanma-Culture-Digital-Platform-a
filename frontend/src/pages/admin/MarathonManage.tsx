import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, App, Space, Popconfirm, Tag, DatePicker, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { marathonApi, MarathonItem } from '../../api/marathons';
import { uploadApi } from '../../api/upload';

const MarathonManage: React.FC = () => {
  const { message } = App.useApp();
  const [list, setList] = useState<MarathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MarathonItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [form] = Form.useForm();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marathonApi.adminList();
      setList(res.data);
    } catch {
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setImageUrls([]);
    setModal(true);
  };

  const openEdit = (item: MarathonItem) => {
    setEditing(item);
    let parsed: string[] = [];
    if (item.images) {
      try { parsed = JSON.parse(item.images); } catch {}
    }
    setImageUrls(parsed);
    form.setFieldsValue({
      ...item,
      date: item.date ? dayjs(item.date) : null
    });
    setModal(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      };
      if (editing) {
        await marathonApi.update(editing.id, data);
        message.success('更新成功');
      } else {
        await marathonApi.create(data);
        message.success('创建成功');
      }
      setModal(false);
      fetchList();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await marathonApi.delete(id);
      message.success('删除成功');
      fetchList();
    } catch {
      message.error('删除失败');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setImageUrls(prev => [...prev, res.data.url]);
      message.success('图片上传成功');
    } catch {
      message.error('图片上传失败');
    }
    return false;
  };

  const removeImage = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const columns = [
    { title: '年份', dataIndex: 'year', key: 'year', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '日期', dataIndex: 'date', key: 'date',
      render: (d: string) => d?.slice(0, 10) || '-'
    },
    {
      title: '口号', dataIndex: 'slogan', key: 'slogan',
      ellipsis: true
    },
    {
      title: '参赛人数', dataIndex: 'participant_count', key: 'participant_count',
      render: (v: number) => v ? `${v.toLocaleString()} 人` : '-'
    },
    {
      title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 70
    },
    {
      title: '操作', key: 'action', width: 140,
      render: (_: any, record: MarathonItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}
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
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>历年马拉松管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchList} style={{ borderRadius: 8 }}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)' }}>
            新增赛事
          </Button>
        </Space>
      </div>

      <Table dataSource={list} columns={columns} rowKey="id" loading={loading} pagination={false} />

      <Modal
        title={editing ? '编辑赛事' : '新增赛事'}
        open={modal}
        onOk={handleSubmit}
        onCancel={() => setModal(false)}
        confirmLoading={submitLoading}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="year" label="年份" rules={[{ required: true, message: '请输入年份' }]}>
            <InputNumber min={2000} max={2030} style={{ width: '100%' }} placeholder="如 2025" />
          </Form.Item>
          <Form.Item name="name" label="赛事名称" rules={[{ required: true, message: '请输入赛事名称' }]}>
            <Input placeholder="如 2025兰州马拉松" />
          </Form.Item>
          <Form.Item name="date" label="举办日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="举办地点">
            <Input placeholder="如 兰州奥体中心" />
          </Form.Item>
          <Form.Item name="slogan" label="赛事口号">
            <Input placeholder="如 奔跑兰州，逐梦黄河" />
          </Form.Item>
          <Form.Item name="participant_count" label="参赛人数">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如 40000" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#1a1a1a', fontSize: 14, fontWeight: 500 }}>赛事图片</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div onClick={() => removeImage(idx)} style={{
                    position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 12, lineHeight: '18px',
                  }}>×</div>
                </div>
              ))}
            </div>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleImageUpload}
            >
              <Button icon={<UploadOutlined />} size="small">上传图片</Button>
            </Upload>
          </div>
          <Form.Item name="description" label="赛事介绍 (HTML)">
            <Input.TextArea rows={4} placeholder="支持 HTML 格式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MarathonManage;
