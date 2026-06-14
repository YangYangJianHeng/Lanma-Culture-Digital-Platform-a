import React, { useState, useEffect } from 'react';
import { Modal, Typography, Spin, Button, Result } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { medalApi, MedalItem } from '../../api/medals';
import MuseumScene from '../../components/museum/MuseumScene';
import ContentFloatingCards from '../../components/museum/ContentFloatingCards';

const { Title } = Typography;

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32', '#C5952B', '#10b981', '#ef4444'];

function medalPlaceholderSVG(name: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="90" fill="${color}" opacity="0.15"/>
    <circle cx="100" cy="100" r="70" fill="none" stroke="${color}" stroke-width="3" opacity="0.5"/>
    <circle cx="100" cy="100" r="55" fill="${color}" opacity="0.1"/>
    <text x="100" y="110" text-anchor="middle" fill="${color}" font-size="48" font-weight="bold" font-family="sans-serif">🏅</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface Medal3D {
  id: number;
  name: string;
  year: number;
  thumbnail_url: string;
  color: string;
}

const Museum: React.FC = () => {
  const [medals, setMedals] = useState<MedalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedal, setSelectedMedal] = useState<MedalItem | null>(null);
  const [sceneError, setSceneError] = useState(false);

  useEffect(() => {
    const fetchMedals = async () => {
      try {
        const res = await medalApi.list({ sort: 'order' });
        setMedals(res.data);
      } catch (err) {
        console.error('获取奖牌列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedals();
  }, []);

  const medal3DList: Medal3D[] = medals.map((m, i) => ({
    id: m.id,
    name: m.name,
    year: m.year,
    thumbnail_url: m.thumbnail_url,
    color: MEDAL_COLORS[i % MEDAL_COLORS.length],
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 64px)', background: '#0a0a12' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a12' }}>
      <div className="relative">
        {sceneError ? (
          <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
            <Result
              status="warning"
              title="3D 展馆加载失败"
              subTitle="您的浏览器可能不支持 WebGL，或硬件加速未开启"
              extra={
                <Button onClick={() => setSceneError(false)}>
                  重试
                </Button>
              }
            />
          </div>
        ) : medal3DList.length > 0 ? (
          <ErrorBoundary onError={() => setSceneError(true)}>
            <MuseumScene medals={medal3DList} onSelectMedal={(m) => {
              const found = medals.find(medal => medal.id === m.id);
              if (found) setSelectedMedal(found);
            }} />
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)', color: '#666' }}>
            暂无奖牌数据
          </div>
        )}
        {!sceneError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            鼠标拖拽旋转 · 滚轮缩放 · 点击奖牌查看详情
          </div>
        )}
        {!sceneError && <ContentFloatingCards />}
      </div>

      <Modal
        title={null}
        open={!!selectedMedal}
        onCancel={() => setSelectedMedal(null)}
        footer={null}
        width={520}
        closeIcon={<CloseOutlined style={{ color: '#888' }} />}
        className="museum-modal"
      >
        {selectedMedal && (
          <div className="text-center">
            <div className="mb-6">
              <img
                src={selectedMedal.thumbnail_url || medalPlaceholderSVG(selectedMedal.name, MEDAL_COLORS[medals.indexOf(selectedMedal) % MEDAL_COLORS.length])}
                alt={selectedMedal.name}
                className="inline-block"
                style={{
                  width: 180, height: 180, objectFit: 'contain',
                  filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.2))'
                }}
              />
            </div>
            <Title level={3} style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{selectedMedal.name}</Title>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontSize: 14 }}>{selectedMedal.year}年</p>
            {selectedMedal.description && (
              <div
                className="text-left"
                style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: selectedMedal.description }}
              />
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .museum-modal .ant-modal-content {
          background: rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
        }
        .museum-modal .ant-modal-body {
          padding: 32px !important;
        }
      `}</style>
    </div>
  );
};

// ErrorBoundary 组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default Museum;
