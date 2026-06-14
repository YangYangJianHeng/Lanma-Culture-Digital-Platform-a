import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Button, Rate, Tag, Image, Input, App, Avatar } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CompassOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { tourismApi, TourismRecord } from '../../api/tourism';
import { commentApi, CommentRecord, maskUsername } from '../../api/comments';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_COLORS: Record<string, string> = {
  '自然景观': '#4ade80', '历史文化': '#a78bfa', '公园': '#38bdf8', '博物馆': '#f472b6', '地标建筑': '#fb923c',
};

const TourismDetail: React.FC = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [spot, setSpot] = useState<TourismRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tourismApi.detail(Number(id));
        setSpot(res.data);
      } catch (err) {
        console.error('获取景点详情失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    commentApi.list('tourism', Number(id)).then(res => {
      setComments(res.data);
    }).catch(() => {});
  }, [id]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setSubmitting(true);
    try {
      const res = await commentApi.create({
        target_type: 'tourism',
        target_id: Number(id),
        content: commentText.trim(),
      });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
      message.success('评论成功');
    } catch {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20"><Spin size="large" /></div>;
  }

  if (!spot) {
    return (
      <div className="page-container text-center py-20" style={{ color: '#888' }}>
        景点信息不存在
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '24px 32px' }}>
      <Button type="text" icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/tourism')}
        style={{ color: '#888', marginBottom: 16, padding: '4px 8px' }}>
        返回景点列表
      </Button>

      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)',
        padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Image + Info top section */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
          {/* Image left */}
          <div style={{ width: 360, minWidth: 360 }}>
            {spot.image_url ? (
              <Image src={spot.image_url} alt={spot.name}
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYwIiBoZWlnaHQ9IjI3MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjY2NjIj7wn42b4o+JPC90ZXh0Pjwvc3ZnPg==" />
            ) : (
              <div style={{
                width: '100%', height: 270, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.03))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
              }}>🏛️</div>
            )}
          </div>
          {/* Info right */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="flex items-center gap-3 mb-3">
              <Title level={2} style={{ color: '#1a1a1a', margin: 0, fontWeight: 700 }}>{spot.name}</Title>
              {spot.category && (
                <Tag style={{ borderRadius: 6, border: 'none', background: `${CATEGORY_COLORS[spot.category] || '#C5952B'}20`, color: CATEGORY_COLORS[spot.category] || '#C5952B', fontSize: 13, padding: '2px 14px' }}>
                  {spot.category}
                </Tag>
              )}
            </div>
            {spot.rating && (
              <div className="flex items-center gap-2 mb-3">
                <Rate disabled value={Number(spot.rating)} allowHalf style={{ fontSize: 16 }} />
                <Text style={{ color: '#f59e0b', fontSize: 16, fontWeight: 600 }}>{spot.rating}</Text>
              </div>
            )}
            {spot.address && (
              <div className="flex items-center gap-2 mb-3" style={{ color: '#888', fontSize: 14 }}>
                <EnvironmentOutlined style={{ color: '#999' }} />
                <span>{spot.address}</span>
              </div>
            )}
            {spot.latitude && spot.longitude && (
              <div className="flex items-center gap-2" style={{ color: '#999', fontSize: 13 }}>
                <CompassOutlined /> 北纬 {spot.latitude} / 东经 {spot.longitude}
              </div>
            )}
          </div>
        </div>

        {/* Description full width */}
        {spot.description && (
          <div className="mb-6" style={{ lineHeight: 1.9, color: '#555', fontSize: 15, whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 24 }}>
            <Text strong style={{ color: '#1a1a1a', fontSize: 16, display: 'block', marginBottom: 12 }}>📖 景点介绍</Text>
            {spot.description}
          </div>
        )}

        {/* AI Analysis */}
        {spot.ai_analysis && (
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: 'rgba(197,149,43,0.06)', border: '1px solid rgba(197,149,43,0.12)',
            color: '#3730a3', fontSize: 14, lineHeight: 1.8
          }}>
            🤖 <strong>AI 推荐：</strong>{spot.ai_analysis}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)',
        padding: 28, marginTop: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <Title level={4} style={{ color: '#1a1a1a', margin: 0, marginBottom: 20, fontWeight: 600 }}>
          💬 游客点评 <Text style={{ color: '#999', fontSize: 13, fontWeight: 400 }}>({comments.length} 条评论)</Text>
        </Title>

        {user ? (
          <div className="flex gap-3 mb-6">
            <Avatar size={36} src={user.avatar_url} icon={<UserOutlined />} style={{ background: '#C5952B', minWidth: 36 }} />
            <div style={{ flex: 1 }}>
              <TextArea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="分享你的游览体验..."
                rows={2}
                style={{ borderRadius: 10, borderColor: '#e8e8e8', resize: 'none' }}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="primary" size="small" icon={<SendOutlined />}
                  loading={submitting} onClick={handleSubmitComment}
                  style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8 }}
                >发表评论</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-6" style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>
            请<Button type="link" style={{ padding: 0 }} onClick={() => navigate('/login')}>登录</Button>后发表评论
          </div>
        )}

        {comments.length === 0 ? (
          <div className="text-center" style={{ color: '#ccc', padding: '20px 0', fontSize: 13 }}>暂无评论，快来分享你的游览体验吧~</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map(c => (
              <div key={c.id} style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                background: 'rgba(0,0,0,0.02)', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.03)'
              }}>
                <Avatar size={32} src={c.avatar_url} icon={<UserOutlined />} style={{ background: '#C5952B', minWidth: 32 }} />
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Text style={{ color: '#C5952B', fontSize: 13, fontWeight: 600 }}>{maskUsername(c.username)}</Text>
                    <Text style={{ color: '#bbb', fontSize: 11 }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</Text>
                  </div>
                  <Text style={{ color: '#444', fontSize: 14, lineHeight: 1.6 }}>{c.content}</Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourismDetail;
