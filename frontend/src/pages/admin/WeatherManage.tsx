import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, App, Space, Popconfirm, Typography } from 'antd';import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { WeatherRecord } from '../../api/weather';
import dayjs from 'dayjs';

const { Title } = Typography;

const WeatherManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeatherRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: WeatherRecord[] }>('/weather/history', { params: { location: '兰州', days: 30 } });
      setData(res.data);
    } catch (err) {
      console.error('获取天气数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record?: WeatherRecord) => {
    setEditingRecord(record || null);
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        ...record,
        record_time: dayjs(record.record_time),
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        record_time: values.record_time.format('YYYY-MM-DD HH:mm:ss'),
      };
      if (editingRecord) {
        await request.put(`/admin/weather/${editingRecord.id}`, payload);
        message.success('天气数据更新成功');
      } else {
        await request.post('/admin/weather', payload);
        message.success('天气数据添加成功');
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
      await request.delete(`/admin/weather/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: '城市', dataIndex: 'location', width: 70 },
    { title: '时间', dataIndex: 'record_time', width: 150, render: (v: string) => v?.replace('T', ' ')?.slice(0, 19) },
    { title: '温度°C', dataIndex: 'temperature', width: 70 },
    { title: '体感°C', dataIndex: 'feels_like', width: 70 },
    { title: '低温/高温', key: 'range', width: 90, render: (_: any, r: WeatherRecord) => `${r.temp_min || '--'}/${r.temp_max || '--'}` },
    { title: '湿度%', dataIndex: 'humidity', width: 60 },
    { title: '天气', dataIndex: 'weather_condition', width: 65 },
    { title: '风向', dataIndex: 'wind_direction', width: 65 },
    { title: '风速', dataIndex: 'wind_speed', width: 55 },
    { title: 'AQI', dataIndex: 'air_quality', width: 55 },
    { title: '类型', dataIndex: 'forecast_type', width: 65 },
    { title: '来源', dataIndex: 'source', ellipsis: true },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right' as const,
      render: (_: any, record: WeatherRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openModal(record)} style={{ color: '#C5952B' }}>
            编辑
          </Button>
          <Popconfirm title="确定删除该条数据？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-content-card">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>天气数据管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
          style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)' }}>
          添加数据
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 1200 }} />

      <Modal
        title={editingRecord ? '编辑天气数据' : '添加天气数据'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="location" label="城市" rules={[{ required: true }]}>
            <Input placeholder="如 兰州" />
          </Form.Item>
          <Form.Item name="record_time" label="数据时间" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item name="forecast_type" label="数据类型" initialValue="current">
            <Select>
              <Select.Option value="current">当前实况</Select.Option>
              <Select.Option value="hourly">逐时预报</Select.Option>
              <Select.Option value="daily">每日预报</Select.Option>
            </Select>
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="temperature" label="温度(°C)">
              <InputNumber min={-40} max={60} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="feels_like" label="体感温度(°C)">
              <InputNumber min={-40} max={60} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="temp_min" label="最低温(°C)">
              <InputNumber min={-40} max={60} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="temp_max" label="最高温(°C)">
              <InputNumber min={-40} max={60} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="humidity" label="湿度(%)">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
            <Form.Item name="pressure" label="气压(hPa)">
              <InputNumber min={800} max={1100} className="w-full" />
            </Form.Item>
            <Form.Item name="wind_speed" label="风速(m/s)">
              <InputNumber min={0} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="wind_direction" label="风向">
              <Input placeholder="如 东南风" />
            </Form.Item>
            <Form.Item name="weather_condition" label="天气状况">
              <Select>
                <Select.Option value="晴">晴</Select.Option>
                <Select.Option value="多云">多云</Select.Option>
                <Select.Option value="阴">阴</Select.Option>
                <Select.Option value="小雨">小雨</Select.Option>
                <Select.Option value="中雨">中雨</Select.Option>
                <Select.Option value="大雨">大雨</Select.Option>
                <Select.Option value="雷阵雨">雷阵雨</Select.Option>
                <Select.Option value="小雪">小雪</Select.Option>
                <Select.Option value="雾">雾</Select.Option>
                <Select.Option value="霾">霾</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="precipitation" label="降水量(mm)">
              <InputNumber min={0} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="visibility" label="能见度(km)">
              <InputNumber min={0} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="uv_index" label="紫外线指数">
              <InputNumber min={0} max={15} className="w-full" />
            </Form.Item>
            <Form.Item name="air_quality" label="空气质量(AQI)">
              <InputNumber min={0} max={500} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="source" label="数据来源" rules={[{ required: true }]}>
            <Input placeholder="如 中国气象局" />
          </Form.Item>
          <Form.Item name="ai_analysis" label="AI 分析（预留LangChain）">
            <Input.TextArea rows={3} placeholder="AI 分析结果（预留字段，后续接入 LangChain 后使用）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WeatherManage;
