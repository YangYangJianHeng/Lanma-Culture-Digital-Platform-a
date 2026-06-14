import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Popconfirm, App, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { storyApi, StoryItem } from '../../api/stories';

const { Title } = Typography;

const DashboardHome: React.FC = () => {
  const { message } = App.useApp();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await storyApi.myStories({ page });
      setStories(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('获取我的故事失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [page]);

  const handleDelete = async (id: number) => {
    try {
      await storyApi.delete(id);
      message.success('删除成功');
      fetchStories();
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '年份',
      dataIndex: 'race_year',
      key: 'race_year',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'is_public',
      key: 'is_public',
      width: 80,
      render: (val: number) => val
        ? <Tag color="#10b981" style={{ borderRadius: 4 }}>公开</Tag>
        : <Tag color="#f59e0b" style={{ borderRadius: 4 }}>私密</Tag>
    },
    {
      title: '点赞',
      dataIndex: 'likes_count',
      key: 'likes_count',
      width: 80
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string) => val?.slice(0, 19).replace('T', ' ')
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: StoryItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/dashboard/stories/${record.id}/edit`)}
            style={{ color: '#C5952B' }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该故事？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.3)',
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>我的故事</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/stories/new')}
          style={{
            background: '#C5952B', borderColor: '#C5952B',
            borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
          }}
        >
          写故事
        </Button>
      </div>
      <Table
        dataSource={stories}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 12,
          onChange: setPage,
          showSizeChanger: false
        }}
      />
    </div>
  );
};

export default DashboardHome;
