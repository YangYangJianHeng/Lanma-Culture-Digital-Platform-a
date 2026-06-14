import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Switch, App, Popconfirm, Typography } from 'antd';import request from '../../api/request';
import { StoryItem } from '../../api/stories';

const { Title } = Typography;

const StoryManage: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get<{ code: number; data: { items: StoryItem[]; total: number } }>(
        '/admin/stories', { params: { page, limit: 20 } }
      );
      setData(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('获取故事列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const togglePublic = async (id: number, current: number) => {
    try {
      await request.put(`/admin/stories/${id}`, { is_public: current ? 0 : 1 });
      message.success('状态已更新');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/admin/stories/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '标题', dataIndex: 'title', ellipsis: true,
      render: (v: string) => v?.substring(0, 30)
    },
    { title: '作者', dataIndex: ['author', 'username'], width: 100 },
    { title: '年份', dataIndex: 'race_year', width: 80 },
    {
      title: '状态', dataIndex: 'is_public', width: 80,
      render: (v: number) => v
        ? <Tag color="#10b981" style={{ borderRadius: 4 }}>公开</Tag>
        : <Tag color="#f59e0b" style={{ borderRadius: 4 }}>私密</Tag>
    },
    {
      title: '公开切换', key: 'toggle', width: 100,
      render: (_: any, record: StoryItem) => (
        <Switch
          checked={!!record.is_public}
          onChange={() => togglePublic(record.id, record.is_public)}
          size="small"
        />
      )
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: StoryItem) => (
        <Popconfirm title="确定删除该故事？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="admin-content-card">
      <Title level={4} style={{ marginTop: 0, marginBottom: 16, color: '#1a1a1a', fontWeight: 600 }}>故事管理</Title>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showSizeChanger: false
        }}
      />
    </div>
  );
};

export default StoryManage;
