import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Button, Image } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { publicationApi, PublicationRecord } from '../../api/publications';

const { Title, Text } = Typography;

const PublicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pub, setPub] = useState<PublicationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await publicationApi.detail(Number(id));
        setPub(res.data);
      } catch (err) {
        console.error('获取发布详情失败:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Pause all videos when leaving the page
  useEffect(() => {
    return () => {
      document.querySelectorAll('video').forEach(v => v.pause());
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !pub) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        gap: 16,
      }}>
        <span style={{ fontSize: 48 }}>📄</span>
        <div style={{ fontSize: 16, color: '#999' }}>内容不存在或已被删除</div>
        <Button onClick={() => navigate('/publications')}>返回小兰发布</Button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 32,
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/publications')}
          style={{ marginBottom: 16, color: '#666' }}
        >
          返回列表
        </Button>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {pub.cover_image && (
            <div style={{ width: '100%', height: 320, overflow: 'hidden' }}>
              <Image
                src={pub.cover_image}
                alt={pub.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                preview={false}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjY2NjIj7mmoLml6Dlm77niYc8L3RleHQ+PC9zdmc+"
              />
            </div>
          )}
          <div style={{ padding: 32 }}>
            <div className="flex items-center gap-2 mb-4" style={{ color: '#999', fontSize: 13 }}>
              <CalendarOutlined />
              <span>{pub.created_at?.slice(0, 10)}</span>
            </div>
            <Title level={2} style={{ color: '#1a1a1a', fontWeight: 700, marginBottom: 16 }}>
              {pub.title}
            </Title>
            {pub.summary && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, marginBottom: 24,
                background: 'rgba(197,149,43,0.08)', border: '1px solid rgba(197,149,43,0.15)',
                color: '#666', fontSize: 14, lineHeight: 1.6
              }}>
                📌 {pub.summary}
              </div>
            )}
            <div
              style={{ fontSize: 15, lineHeight: 2, color: '#444' }}
              dangerouslySetInnerHTML={{ __html: pub.content || '' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationDetail;
