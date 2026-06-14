import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Typography, Tag, Input, Rate } from 'antd';
import { SearchOutlined, EnvironmentOutlined, StarOutlined, BulbOutlined } from '@ant-design/icons';
import { tourismApi, TourismRecord } from '../../api/tourism';
import { recommendApi, RecommendResult } from '../../api/recommend';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

const CATEGORIES = ['全部', '自然景观', '历史文化', '公园', '博物馆', '地标建筑'];
const CATEGORY_COLORS: Record<string, string> = {
  '自然景观': '#4ade80', '历史文化': '#a78bfa', '公园': '#38bdf8', '博物馆': '#f472b6', '地标建筑': '#fb923c',
};

const Tourism: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [list, setList] = useState<TourismRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [recommend, setRecommend] = useState<RecommendResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cat = category === '全部' ? undefined : category;
        const res = await tourismApi.list(cat);
        setList(res.data);
      } catch (err) {
        console.error('获取旅游数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  useEffect(() => {
    if (user?.occupation || user?.age || user?.gender) {
      recommendApi.get({
        occupation: user.occupation,
        age: user.age,
        gender: user.gender,
      }).then(res => setRecommend(res.data)).catch(() => {});
    }
  }, [user?.occupation, user?.age, user?.gender]);

  const filtered = search
    ? list.filter(t => t.name.includes(search) || t.description?.includes(search))
    : list;

  const aiAnalysis = list.find(t => t.ai_analysis)?.ai_analysis;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 32,
    }}>
      <div className="flex items-center gap-3 mb-6">
        <span style={{ fontSize: 28 }}>🏯</span>
        <Title level={3} style={{ color: '#1a1a1a', margin: 0, fontWeight: 700 }}>小兰旅游</Title>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-3 mb-8" style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          placeholder="搜索景点..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, background: '#fff', border: '1px solid #e8e8e8', color: '#333', borderRadius: 10 }}
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <Tag
              key={c}
              onClick={() => setCategory(c)}
              style={{
                cursor: 'pointer', padding: '4px 14px', borderRadius: 8, fontSize: 13,
                border: category === c ? `1px solid ${CATEGORY_COLORS[c] || '#C5952B'}` : '1px solid #e8e8e8',
                background: category === c ? `${CATEGORY_COLORS[c] || '#C5952B'}15` : '#fff',
                color: category === c ? (CATEGORY_COLORS[c] || '#C5952B') : '#888',
              }}
            >
              {c}
            </Tag>
          ))}
        </div>
      </div>

      {/* 个性化推荐 */}
      {recommend && recommend.tourism.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(197,149,43,0.08)', border: '1px solid rgba(197,149,43,0.15)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#C5952B', fontSize: 13,
        }}>
          <BulbOutlined style={{ marginRight: 6 }} />
          根据您的资料{recommend.based_on.occupation !== '不限' ? `（${recommend.based_on.occupation}` : ''}{recommend.based_on.age !== '不限' ? `, ${recommend.based_on.age}岁` : ''}{recommend.based_on.occupation !== '不限' ? '）' : ''}推荐：{recommend.tourism.map(t => t.name).join('、')}
        </div>
      )}

      {/* AI 推荐 */}
      {aiAnalysis && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(197,149,43,0.06)', border: '1px solid rgba(197,149,43,0.12)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#C5952B', fontSize: 13,
        }}>
          🤖 AI 推荐：{aiAnalysis}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <Row gutter={[20, 20]}>
          {filtered.map(spot => (
            <Col xs={24} sm={12} lg={8} xl={6} key={spot.id}>
              <Card
                hoverable
                onClick={() => navigate(`/tourism/${spot.id}`)}
                style={{
                  borderRadius: 16, height: '100%',
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: 20 } }}
              >
                <div style={{
                  width: '100%', height: 140, borderRadius: 12, marginBottom: 14,
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.03))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48,
                }}>
                  {spot.image_url ? (
                    <img src={spot.image_url} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    '🏛️'
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Text strong style={{ color: '#1a1a1a', fontSize: 17, flex: 1 }}>{spot.name}</Text>
                  {spot.category && (
                    <Tag style={{ borderRadius: 6, border: 'none', background: `${CATEGORY_COLORS[spot.category] || '#C5952B'}20`, color: CATEGORY_COLORS[spot.category] || '#C5952B', fontSize: 11 }}>
                      {spot.category}
                    </Tag>
                  )}
                </div>
                {spot.rating && (
                  <div className="mb-2">
                    <Rate disabled value={Number(spot.rating)} allowHalf style={{ fontSize: 14 }} />
                    <Text style={{ color: '#f59e0b', fontSize: 13, marginLeft: 6 }}>{spot.rating}</Text>
                  </div>
                )}
                <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>
                  {spot.description}
                </Paragraph>
                {spot.address && (
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 6 }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />{spot.address}
                  </div>
                )}
                {spot.ai_analysis && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(197,149,43,0.06)', border: '1px solid rgba(197,149,43,0.12)',
                    color: '#C5952B', fontSize: 12
                  }}>
                    🤖 {spot.ai_analysis}
                  </div>
                )}
              </Card>
            </Col>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20" style={{ color: '#999', width: '100%' }}>暂无数据</div>
          )}
        </Row>
      )}
    </div>
  );
};

export default Tourism;
