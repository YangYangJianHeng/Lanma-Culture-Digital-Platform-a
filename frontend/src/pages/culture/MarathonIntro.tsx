import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Carousel, Spin, Typography, Tag, Row, Col, Empty } from 'antd';
import { CalendarOutlined, TeamOutlined, TrophyOutlined, FlagOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { marathonApi, MarathonItem } from '../../api/marathons';

const { Title, Text } = Typography;

const MarathonIntro: React.FC = () => {
  const [list, setList] = useState<MarathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const carouselRef = useRef<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await marathonApi.list();
        setList(res.data);
      } catch {
        console.error('获取赛事信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const selected = list[selectedIdx] || null;

  // 解析图片数组
  const getImages = useCallback((item: MarathonItem): string[] => {
    if (!item.images) return [];
    try {
      const parsed = JSON.parse(item.images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }, []);

  const images = selected ? getImages(selected) : [];

  if (loading) return <div className="flex justify-center items-center py-20"><Spin size="large" /></div>;
  if (list.length === 0) return <Empty description="暂无赛事信息" className="py-20" />;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 24,
    }}>
      {/* 标题 */}
      <div className="text-center mb-6">
        <Title level={2} style={{ color: '#1a1a1a', marginBottom: 4, fontWeight: 700 }}>历年兰州马拉松</Title>
        <Text style={{ color: '#888', fontSize: 14 }}>每一届兰马，都是这座城市的文化印记</Text>
      </div>

      {/* 年份选择 */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {list.map((item, i) => (
          <div
            key={item.id}
            onClick={() => { setSelectedIdx(i); carouselRef.current?.goTo(0); }}
            style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
              fontSize: 14, fontWeight: selectedIdx === i ? 600 : 400,
              background: selectedIdx === i ? '#C5952B' : 'rgba(255,255,255,0.75)',
              color: selectedIdx === i ? '#fff' : '#666',
              border: selectedIdx === i ? 'none' : '1px solid rgba(0,0,0,0.06)',
              backdropFilter: selectedIdx === i ? 'none' : 'blur(8px)',
              transition: 'all 0.2s',
              boxShadow: selectedIdx === i ? '0 2px 12px rgba(197,149,43,0.25)' : 'none',
            }}
          >
            {item.year} · {item.name.replace(/兰州马拉松/g, '').replace(String(item.year), '').trim() || '兰马'}
          </div>
        ))}
      </div>

      {selected && (
        <Row gutter={[20, 20]} style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 左侧：轮播图 3/4 */}
          <Col xs={24} lg={18}>
            <div style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)',
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              height: '100%', minHeight: 460,
            }}>
              {images.length > 0 ? (
                <Carousel
                  ref={carouselRef}
                  autoplay
                  autoplaySpeed={4000}
                  effect="fade"
                  dots={{ className: 'carousel-dots' }}
                >
                  {images.map((url, i) => (
                    <div key={i}>
                      <div style={{
                        width: '100%', height: 520,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f0f0f0', overflow: 'hidden',
                      }}>
                        <img
                          src={url}
                          alt={`${selected.name} - ${i + 1}`}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                          }}
                          onError={e => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            (el.parentElement as HTMLElement).innerHTML = `<div style="font-size:48px;color:#ccc;">📷</div>`;
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div className="flex items-center justify-center" style={{ height: 520, color: '#ccc' }}>
                  <div className="text-center">
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🏟️</div>
                    <div style={{ fontSize: 14 }}>暂无图片</div>
                  </div>
                </div>
              )}
              {/* 图片计数器 */}
              {images.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  background: 'rgba(0,0,0,0.45)', color: '#fff',
                  padding: '2px 12px', borderRadius: 12,
                  fontSize: 12, backdropFilter: 'blur(4px)',
                  zIndex: 10,
                }}>
                  1 / {images.length}
                </div>
              )}
            </div>
          </Col>

          {/* 右侧：赛事信息 1/4 */}
          <Col xs={24} lg={6}>
            <div style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)',
              padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              height: '100%',
            }}>
              {/* 赛事名称 */}
              <Title level={4} style={{ color: '#1a1a1a', marginBottom: 12, fontWeight: 700 }}>
                {selected.name}
              </Title>

              {/* 口号 */}
              {selected.slogan && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'linear-gradient(135deg, rgba(197,149,43,0.08), rgba(197,149,43,0.03))',
                  border: '1px solid rgba(197,149,43,0.12)',
                  color: '#C5952B', fontSize: 14, fontWeight: 500,
                  lineHeight: 1.5,
                }}>
                  <FlagOutlined style={{ marginRight: 6 }} />{selected.slogan}
                </div>
              )}

              {/* 基础信息 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {selected.date && (
                  <div style={{ color: '#888', fontSize: 13 }}>
                    <CalendarOutlined style={{ marginRight: 6, color: '#C5952B' }} />
                    {selected.date.slice(0, 10)}
                  </div>
                )}
                {selected.location && (
                  <div style={{ color: '#888', fontSize: 13 }}>
                    <EnvironmentOutlined style={{ marginRight: 6, color: '#f59e0b' }} />
                    {selected.location}
                  </div>
                )}
                {selected.participant_count != null && (
                  <div style={{ color: '#888', fontSize: 13 }}>
                    <TeamOutlined style={{ marginRight: 6, color: '#10b981' }} />
                    {selected.participant_count.toLocaleString()} 人参赛
                  </div>
                )}
                <div style={{ color: '#888', fontSize: 13 }}>
                  <TrophyOutlined style={{ marginRight: 6, color: '#f59e0b' }} />
                  {selected.year}年赛事
                </div>
              </div>

              {/* 获奖情况 / 比赛简介 */}
              {selected.description && (
                <div style={{
                  borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 14,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                    🏆 赛事详情
                  </div>
                  <div style={{
                    fontSize: 13, color: '#555', lineHeight: 1.8,
                    maxHeight: 280, overflowY: 'auto',
                  }}
                    dangerouslySetInnerHTML={{ __html: selected.description }}
                  />
                </div>
              )}

              {/* 底部标签 */}
              <div className="flex flex-wrap gap-1" style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <Tag style={{ borderRadius: 6, border: 'none', background: '#FFF8E7', color: '#C5952B', fontSize: 11 }}>
                  兰州马拉松
                </Tag>
                <Tag style={{ borderRadius: 6, border: 'none', background: '#f0fdf4', color: '#10b981', fontSize: 11 }}>
                  黄河风情线
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Carousel dots 样式 */}
      <style>{`
        .carousel-dots li button {
          background: #ddd !important;
          height: 4px !important;
          border-radius: 2px !important;
        }
        .carousel-dots li.slick-active button {
          background: #C5952B !important;
        }
      `}</style>
    </div>
  );
};

export default MarathonIntro;
