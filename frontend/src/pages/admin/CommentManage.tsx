import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Button, App, Popconfirm, Tag, Typography, Collapse, Empty, Spin } from 'antd';import { DeleteOutlined, ReloadOutlined, MessageOutlined, CaretRightOutlined } from '@ant-design/icons';
import request from '../../api/request';

const { Title } = Typography;
const { Panel } = Collapse;

interface AdminComment {
  id: number;
  target_type: string;
  target_id: number;
  target_name: string | null;
  content: string;
  username: string;
  created_at: string;
}

interface CommentGroup {
  target_id: number;
  target_name: string;
  comments: AdminComment[];
}

const TARGET_CONFIG: Record<string, { label: string; color: string }> = {
  food: { label: '美食', color: 'orange' },
  tourism: { label: '景点', color: 'blue' },
};

const TAB_ITEMS = [
  { key: '', label: '全部' },
  ...Object.entries(TARGET_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
  })),
];

const CommentManage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentMap, setCommentMap] = useState<Record<string, CommentGroup[]>>({});
  const [countMap, setCountMap] = useState<Record<string, number>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const types = ['', 'food', 'tourism'];
      const results = await Promise.all(
        types.map(async (t) => {
          const params: any = { page: 1, limit: 99999 };
          if (t) params.targetType = t;
          const res = await request.get<{ code: number; data: { items: AdminComment[]; total: number } }>(
            '/admin/comments', { params }
          );
          return { type: t, items: res.data.items, total: res.data.total };
        })
      );

      const map: Record<string, CommentGroup[]> = {};
      const counts: Record<string, number> = {};
      for (const { type, items } of results) {
        counts[type] = items.length;
        // Group by target_id
        const groups: Record<string, CommentGroup> = {};
        for (const c of items) {
          const key = `${c.target_type}-${c.target_id}`;
          if (!groups[key]) {
            groups[key] = {
              target_id: c.target_id,
              target_name: c.target_name || `${TARGET_CONFIG[c.target_type]?.label || c.target_type} (已删除)`,
              comments: [],
            };
          }
          groups[key].comments.push(c);
        }
        map[type] = Object.values(groups).sort((a, b) => b.comments.length - a.comments.length);
      }
      setCommentMap(map);
      setCountMap(counts);
    } catch {
      message.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/admin/comments/${id}`);
      message.success('删除成功');
      fetchAll();
    } catch {
      message.error('删除失败');
    }
  };

  const renderComments = (groups: CommentGroup[]) => {
    if (!groups || groups.length === 0) {
      return <Empty description="暂无评论" style={{ marginTop: 48 }} />;
    }
    return (
      <Collapse
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        size="small"
        style={{ background: 'transparent', border: 'none' }}
      >
        {groups.map((group) => (
          <Panel
            key={`${group.target_id}`}
            header={
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {group.target_name}
                <Tag style={{ marginLeft: 8 }}>{group.comments.length} 条评论</Tag>
              </span>
            }
            style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}
          >
            {group.comments.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '10px 12px', borderBottom: '1px solid #f5f5f5',
                  background: '#fafafa', borderRadius: 6, marginBottom: 4,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#C5952B', fontWeight: 500 }}>{c.username}</span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>
                      {c.created_at?.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{c.content}</div>
                </div>
                <Popconfirm title="确定删除该评论？" onConfirm={() => handleDelete(c.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />}
                    style={{ flexShrink: 0, marginLeft: 12 }} />
                </Popconfirm>
              </div>
            ))}
          </Panel>
        ))}
      </Collapse>
    );
  };

  const tabItems = TAB_ITEMS.map((tab) => ({
    key: tab.key,
    label: (
      <span>
        {tab.label}
        {countMap[tab.key] !== undefined && (
          <span style={{ marginLeft: 6, fontSize: 12, color: '#999' }}>
            ({countMap[tab.key]})
          </span>
        )}
      </span>
    ),
    children: loading ? (
      <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div>
    ) : (
      renderComments(commentMap[tab.key] || [])
    ),
  }));

  return (
    <div className="admin-content-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageOutlined style={{ color: '#C5952B' }} />
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>评论管理</Title>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchAll} style={{ borderRadius: 8 }}>刷新</Button>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
        style={{ minHeight: 300 }}
      />
    </div>
  );
};

export default CommentManage;