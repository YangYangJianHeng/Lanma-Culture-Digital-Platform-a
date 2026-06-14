import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography, Input } from 'antd';
import { SearchOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { publicationApi, PublicationRecord } from '../../api/publications';

const { Title, Text } = Typography;

const Publication: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<PublicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await publicationApi.list();
        setList(res.data);
      } catch (err) {
        console.error('获取发布数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = search
    ? list.filter(p => p.title.includes(search) || p.summary?.includes(search))
    : list;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 32,
    }}>
      <div className="flex items-center gap-3 mb-6">
        <span style={{ fontSize: 28 }}>📢</span>
        <Title level={3} style={{ color: '#1a1a1a', margin: 0, fontWeight: 700 }}>小兰发布</Title>
      </div>

      {/* Search */}
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16, padding: 16, marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          placeholder="搜索发布内容..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300, background: '#fff', border: '1px solid #e8e8e8', color: '#333', borderRadius: 10 }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(pub => (
            <div
              key={pub.id}
              onClick={() => navigate(`/publications/${pub.id}`)}
              className="cursor-pointer"
              style={{
                display: 'flex',
                gap: 24,
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                padding: 20,
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
              }}
            >
              {/* Cover Image */}
              <div style={{
                width: 200,
                minWidth: 200,
                height: 140,
                borderRadius: 10,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(197,149,43,0.12), rgba(197,149,43,0.03))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
              }}>
                {pub.cover_image ? (
                  <img src={pub.cover_image} alt={pub.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.style.fontSize = '36px';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '📰';
                    }}
                  />
                ) : (
                  <span>📰</span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.4 }}>
                  {pub.title}
                </div>
                {pub.summary && (
                  <div style={{
                    fontSize: 14,
                    color: '#888',
                    lineHeight: 1.6,
                    marginBottom: 12,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {pub.summary}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#bbb' }}>
                  <span><CalendarOutlined style={{ marginRight: 4 }} />{pub.created_at?.slice(0, 10)}</span>
                  <span style={{ color: '#C5952B', marginLeft: 'auto', fontSize: 13 }}>
                    查看详情 <RightOutlined style={{ fontSize: 11 }} />
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20" style={{ color: '#999' }}>暂无内容</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Publication;
