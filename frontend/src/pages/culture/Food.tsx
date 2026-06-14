import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Typography, Tag, Select, Input, Rate } from 'antd';
import { SearchOutlined, EnvironmentOutlined, StarOutlined, BulbOutlined } from '@ant-design/icons';
import { foodApi, FoodRecord } from '../../api/foods';
import { recommendApi, RecommendResult } from '../../api/recommend';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

const CATEGORIES = ['全部', '面食', '小吃', '正餐', '饮品', '特产'];
const CATEGORY_COLORS: Record<string, string> = {
  '面食': '#fb923c', '小吃': '#f472b6', '正餐': '#4ade80', '饮品': '#38bdf8', '特产': '#a78bfa',
};

const Food: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [list, setList] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [recommend, setRecommend] = useState<RecommendResult | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cat = category === '全部' ? undefined : category;
        const res = await foodApi.list(cat);
        setList(res.data);
      } catch (err) {
        console.error('获取美食数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  useEffect(() => {
    if (user?.occupation || user?.age || user?.gender) {
      setRecLoading(true);
      recommendApi.get({
        occupation: user.occupation,
        age: user.age,
        gender: user.gender,
      }).then(res => setRecommend(res.data)).catch(() => {}).finally(() => setRecLoading(false));
    }
  }, [user?.occupation, user?.age, user?.gender]);

  const filtered = search
    ? list.filter(f => f.name.includes(search) || f.description?.includes(search))
    : list;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 32,
    }}>
      <div className="flex items-center gap-3 mb-6">
        <span style={{ fontSize: 28 }}>🍜</span>
        <Title level={3} style={{ color: '#1a1a1a', margin: 0, fontWeight: 700 }}>小兰美食</Title>
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
          placeholder="搜索美食..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, background: '#fff', border: '1px solid #e8e8e8', color: '#333', borderRadius: 10 }}
        />
        <div className="flex gap-2">
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
      {recommend && recommend.foods.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#b45309', fontSize: 13,
        }}>
          <BulbOutlined style={{ marginRight: 6 }} />
          根据您的资料（{recommend.based_on.occupation !== '不限' ? recommend.based_on.occupation : ''}{recommend.based_on.age !== '不限' ? `, ${recommend.based_on.age}岁` : ''}）推荐：{recommend.foods.map(f => f.name).join('、')}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <Row gutter={[20, 20]}>
          {filtered.map(food => (
            <Col xs={24} sm={12} lg={8} xl={6} key={food.id}>
              <Card
                hoverable
                onClick={() => navigate(`/food/${food.id}`)}
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
                  background: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(251,146,60,0.03))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48,
                }}>
                  {food.image_url ? (
                    <img src={food.image_url} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    '🍽️'
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Text strong style={{ color: '#1a1a1a', fontSize: 17, flex: 1 }}>{food.name}</Text>
                  {food.category && (
                    <Tag style={{ borderRadius: 6, border: 'none', background: `${CATEGORY_COLORS[food.category] || '#C5952B'}20`, color: CATEGORY_COLORS[food.category] || '#C5952B', fontSize: 11 }}>
                      {food.category}
                    </Tag>
                  )}
                </div>
                {food.rating && (
                  <div className="mb-2">
                    <Rate disabled value={Number(food.rating)} allowHalf style={{ fontSize: 14 }} />
                    <Text style={{ color: '#f59e0b', fontSize: 13, marginLeft: 6 }}>{food.rating}</Text>
                  </div>
                )}
                <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>
                  {food.description}
                </Paragraph>
                {food.address && (
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />{food.address}
                  </div>
                )}
                {food.recommend && (
                  <Text style={{ color: '#fb923c', fontSize: 12 }}>
                    <StarOutlined style={{ marginRight: 4 }} />{food.recommend}
                  </Text>
                )}
                {food.ai_analysis && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.12)',
                    color: '#b45309', fontSize: 12
                  }}>
                    🤖 {food.ai_analysis}
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

export default Food;
