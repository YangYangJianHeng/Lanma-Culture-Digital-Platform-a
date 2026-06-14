import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Button, App, Avatar, Image, Space } from 'antd';
import { HeartOutlined, HeartFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { storyApi, StoryItem } from '../../api/stories';
import { useAuthStore } from '../../store/useAuthStore';

const { Title } = Typography;

const StoryDetail: React.FC = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [story, setStory] = useState<StoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await storyApi.detail(Number(id));
        setStory(res.data);
        setLikesCount(res.data.likes_count);
      } catch (err) {
        console.error('获取故事详情失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();

    if (user) {
      storyApi.likeStatus(Number(id)).then(res => {
        setLiked(res.data.liked);
      }).catch(() => {});
    }
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    try {
      const res = await storyApi.toggleLike(Number(id));
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  if (loading) {
    return <div className="text-center py-20"><Spin size="large" /></div>;
  }

  if (!story) {
    return (
      <div className="page-container text-center py-20" style={{ color: '#888' }}>
        故事不存在
      </div>
    );
  }

  const images = typeof story.images === 'string'
    ? (() => { try { return JSON.parse(story.images as string); } catch { return []; } })()
    : (story.images || []);

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/stories')}
        style={{ color: '#888', marginBottom: 16, padding: '4px 8px' }}>
        返回故事广场
      </Button>

      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
        padding: '40px 40px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {images.length > 0 && (
          <div className="w-full rounded-xl overflow-hidden mb-8 bg-gray-50" style={{ maxHeight: 400 }}>
            <Image.PreviewGroup>
              <img src={images[0]} alt={story.title}
                className="w-full object-cover" style={{ maxHeight: 400 }} />
            </Image.PreviewGroup>
          </div>
        )}

        <Title level={2} style={{ color: '#1a1a1a', marginBottom: 20, fontWeight: 700 }}>{story.title}</Title>

        <div className="flex items-center gap-4 pb-6 mb-8" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <Avatar size={36} src={story.author?.avatar_url} style={{ background: '#C5952B' }}>
            {story.author?.username?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>{story.author?.username}</div>
            <div className="flex items-center gap-3" style={{ color: '#bbb', fontSize: 12, marginTop: 2 }}>
              <span>{story.created_at?.slice(0, 10)}</span>
              {story.race_year && <span>· {story.race_year}年参赛</span>}
              {story.finish_time && <span>· 完赛 {story.finish_time}</span>}
            </div>
          </div>
        </div>

        <div className="mb-8" style={{ lineHeight: 1.9, color: '#444', fontSize: 15 }}
          dangerouslySetInnerHTML={{ __html: story.content }} />

        {images.length > 1 && (
          <Image.PreviewGroup>
            <div className="flex gap-2 flex-wrap mb-8">
              {images.map((url: string, idx: number) => (
                <Image key={idx} src={url} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </Image.PreviewGroup>
        )}

        <div className="text-center pt-6" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Button type="text" size="large"
            icon={liked ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
            onClick={handleLike}
            style={{ fontSize: 15, color: liked ? '#ef4444' : '#888', height: 44, padding: '0 24px' }}>
            {likesCount > 0 ? likesCount : '点赞'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
