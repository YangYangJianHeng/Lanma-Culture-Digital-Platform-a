import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Row, Col, Pagination, Spin, Empty, Avatar, Button } from 'antd';
import { SearchOutlined, HeartOutlined, ClockCircleOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';
import { storyApi, StoryItem } from '../../api/stories';
import { useAuthStore } from '../../store/useAuthStore';

const { Search } = Input;

const Stories: React.FC = () => {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await storyApi.list({ page, limit: 12, keyword: keyword || undefined });
      setStories(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('获取故事列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [page]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>跑者故事广场</h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>分享你的兰马记忆，记录奔跑的感动</p>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => user ? navigate('/dashboard/stories/new') : navigate('/login')}
          style={{
            background: '#C5952B', borderColor: '#C5952B',
            borderRadius: 10, height: 42, paddingLeft: 24, paddingRight: 20,
            boxShadow: '0 2px 8px rgba(197,149,43,0.2)', fontSize: 14
          }}
        >
          发布故事 <RightOutlined style={{ fontSize: 12 }} />
        </Button>
      </div>

      <div className="mb-8">
        <Search
          placeholder="搜索故事（标题/参赛号码）"
          allowClear
          enterButton={<><SearchOutlined /> 搜索</>}
          size="large"
          onSearch={handleSearch}
          className="max-w-md"
          style={{ borderRadius: 10 }}
        />
      </div>

      {loading ? (
        <div className="text-center py-20"><Spin size="large" /></div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20"><Empty description="暂无故事" /></div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {stories.map((story) => (
              <Col xs={24} sm={12} lg={8} key={story.id}>
                <div
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="card-hover cursor-pointer"
                  style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #f0f0f0', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {(() => {
                      const imgs = typeof story.images === 'string' ? (() => { try { return JSON.parse(story.images as string); } catch { return []; } })() : (story.images || []);
                      return imgs.length > 0 ? (
                        <img src={imgs[0]} alt={story.title} className="w-full h-full object-cover" />
                      ) : (
                        <div style={{ fontSize: 40, color: '#d0d0d0', opacity: 0.5 }}>📖</div>
                      );
                    })()}
                  </div>

                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, lineHeight: 1.4 }}>
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar size={24} src={story.author?.avatar_url} style={{ background: '#C5952B' }}>
                        {story.author?.username?.[0]}
                      </Avatar>
                      <span style={{ color: '#888', fontSize: 13 }}>{story.author?.username}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto" style={{ color: '#bbb', fontSize: 12 }}>
                      <span><ClockCircleOutlined style={{ marginRight: 4 }} />{story.created_at?.slice(0, 10)}</span>
                      <span><HeartOutlined style={{ marginRight: 4 }} />{story.likes_count}</span>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-10">
            <Pagination current={page} total={total} pageSize={12} onChange={setPage} showSizeChanger={false} />
            <div style={{ color: '#bbb', fontSize: 13, marginTop: 8 }}>共 {total} 篇故事</div>
          </div>
        </>
      )}
    </div>
  );
};

export default Stories;
