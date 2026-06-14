import React, { useState, useEffect, useRef, useCallback } from 'react';
import { List, Tag, Spin, Typography, Space, Image, Button } from 'antd';
import { PlayCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { landmarkApi, LandmarkItem } from '../../api/landmarks';
import { AMAP_CONFIG } from '../../config/map';

const { Title, Text } = Typography;

const categoryColors: Record<string, string> = {
  '桥梁': '#C5952B', '雕塑': '#f59e0b', '公园': '#10b981',
  '历史建筑': '#8b5cf6', '自然景观': '#06b6d4',
};

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMap: any;
  }
}

const LANZHOU_CENTER: [number, number] = [103.823, 36.058];

const MARATHON_ROUTE: [number, number][] = [
  // === 南岸向东：奥体中心 → 黄河楼 → 黄河母亲 → 中山桥 ===
  [103.638, 36.087], [103.641, 36.086], [103.644, 36.085],
  [103.648, 36.084], [103.652, 36.082], [103.656, 36.081],
  [103.660, 36.080], [103.664, 36.079], [103.668, 36.078],
  [103.672, 36.077], [103.676, 36.076], [103.680, 36.075],
  [103.684, 36.074], [103.688, 36.073], [103.692, 36.073],
  // 黄河楼
  [103.696, 36.072], [103.700, 36.072], [103.704, 36.071],
  [103.708, 36.071], [103.712, 36.070], [103.716, 36.069],
  [103.720, 36.068], [103.724, 36.067], [103.728, 36.066],
  [103.732, 36.065], [103.736, 36.065], [103.740, 36.064],
  [103.744, 36.063], [103.748, 36.062], [103.752, 36.062],
  // 黄河母亲雕塑
  [103.756, 36.061], [103.760, 36.061], [103.764, 36.060],
  [103.768, 36.060], [103.772, 36.059], [103.776, 36.059],
  [103.780, 36.058], [103.784, 36.058], [103.788, 36.057],
  [103.792, 36.057], [103.796, 36.056], [103.800, 36.056],
  [103.804, 36.055], [103.808, 36.055], [103.812, 36.054],
  // 中山桥（黄河第一桥）
  [103.816, 36.054], [103.820, 36.053], [103.824, 36.052],
  // === 继续南岸向东：水车博览园 → 甘肃大剧院 ===
  [103.828, 36.051], [103.832, 36.050], [103.836, 36.049],
  [103.840, 36.048], [103.844, 36.047],
  // 水车博览园
  [103.848, 36.046], [103.852, 36.045], [103.856, 36.045],
  [103.860, 36.044], [103.864, 36.043], [103.868, 36.042],
  // 甘肃大剧院
  [103.872, 36.041], [103.876, 36.040], [103.880, 36.039],
  // === 折返点 ===
  [103.884, 36.038], [103.888, 36.038], [103.892, 36.037],
  [103.896, 36.036], [103.900, 36.035],
  // === 半程终点（雁白大桥）→ 过黄河到北岸 ===
  [103.900, 36.036], [103.898, 36.038], [103.895, 36.040],
  [103.892, 36.042], [103.889, 36.044], [103.886, 36.046],
  [103.883, 36.048], [103.880, 36.050], [103.877, 36.052],
  // === 北岸向西：白塔山 → 金城关 → 七里河 ===
  [103.874, 36.054], [103.870, 36.055], [103.866, 36.056],
  [103.862, 36.057], [103.858, 36.058], [103.854, 36.059],
  [103.850, 36.060], [103.846, 36.060], [103.842, 36.061],
  [103.838, 36.062], [103.834, 36.063],
  // 白塔山
  [103.830, 36.063], [103.826, 36.064], [103.822, 36.065],
  [103.818, 36.065], [103.814, 36.066],
  // 金城关
  [103.810, 36.066], [103.806, 36.067], [103.802, 36.067],
  [103.798, 36.068], [103.794, 36.068],
  // === 北岸继续向西返回 ===
  [103.790, 36.069], [103.786, 36.069], [103.782, 36.069],
  [103.778, 36.070], [103.774, 36.070], [103.770, 36.070],
  [103.766, 36.071], [103.762, 36.071], [103.758, 36.071],
  [103.754, 36.072], [103.750, 36.072], [103.746, 36.072],
  [103.742, 36.073], [103.738, 36.073], [103.734, 36.073],
  [103.730, 36.074], [103.726, 36.074], [103.722, 36.074],
  [103.718, 36.075], [103.714, 36.075], [103.710, 36.076],
  [103.706, 36.076], [103.702, 36.077], [103.698, 36.077],
  [103.694, 36.078], [103.690, 36.078], [103.686, 36.079],
  [103.682, 36.079], [103.678, 36.080], [103.674, 36.080],
  [103.670, 36.080], [103.666, 36.081], [103.662, 36.082],
  [103.658, 36.083], [103.654, 36.084], [103.650, 36.085],
  [103.646, 36.086], [103.642, 36.087], [103.638, 36.087],
];

// 沿线地标标注（routeIndex 表示从第几个点开始显示）
interface RouteLandmark {
  name: string;
  routeIndex: number;
  pos: [number, number];
  desc: string;
}
const ROUTE_LANDMARKS: RouteLandmark[] = [
  { name: '兰州奥体中心', routeIndex: 0, pos: [103.638, 36.087], desc: '起点/终点' },
  { name: '黄河楼', routeIndex: 15, pos: [103.696, 36.075], desc: '约3km处' },
  { name: '黄河母亲雕塑', routeIndex: 31, pos: [103.756, 36.063], desc: '兰州标志' },
  { name: '中山桥', routeIndex: 45, pos: [103.818, 36.055], desc: '黄河第一桥' },
  { name: '水车博览园', routeIndex: 54, pos: [103.848, 36.048], desc: '兰州水车文化' },
  { name: '甘肃大剧院', routeIndex: 62, pos: [103.872, 36.043], desc: '文化地标' },
  { name: '折返点', routeIndex: 70, pos: [103.900, 36.036], desc: '全程折返' },
  { name: '白塔山', routeIndex: 85, pos: [103.830, 36.064], desc: '北岸名胜' },
  { name: '金城关', routeIndex: 90, pos: [103.810, 36.067], desc: '历史关隘' },
  { name: '兰州奥体中心', routeIndex: 125, pos: [103.638, 36.087], desc: '终点' },
];

function loadAmapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AMap) { resolve(); return; }
    window._AMapSecurityConfig = { securityJsCode: AMAP_CONFIG.securityJsCode };
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=${AMAP_CONFIG.version}&key=${AMAP_CONFIG.key}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('高德地图脚本加载失败'));
    document.head.appendChild(script);
  });
}

function createMarkerContent(name: string, color: string): string {
  return `<div style="
    background: ${color}; color: #fff; padding: 4px 10px; border-radius: 12px;
    font-size: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    cursor: pointer; font-weight: 500; border: 2px solid #fff;
  ">${name}</div>`;
}

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const runnerRef = useRef<any>(null);
  const labelMarkersRef = useRef<any[]>([]);
  const animRef = useRef<number>(0);

  const [landmarks, setLandmarks] = useState<LandmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkItem | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'landmarks' | 'route'>('landmarks');
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeDrawing, setRouteDrawing] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  // 加载地标数据
  useEffect(() => {
    if (activeTab !== 'landmarks') return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await landmarkApi.list({ category: filter });
        setLandmarks(res.data);
      } catch (err) {
        console.error('获取地标列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, activeTab]);

  // 初始化高德地图
  useEffect(() => {
    let destroyed = false;
    const initMap = async () => {
      try {
        await loadAmapScript();
        if (destroyed || !mapRef.current) return;
        const map = new window.AMap.Map(mapRef.current, {
          center: LANZHOU_CENTER,
          zoom: 12,
          lang: 'zh_cn',
          mapStyle: 'amap://styles/light',
          features: ['bg', 'road', 'building', 'point'],
        });
        window.AMap.plugin(['AMap.Scale', 'AMap.MapType'], () => {
          map.addControl(new window.AMap.Scale());
        });
        mapInstance.current = map;
        setMapLoading(false);
      } catch (err: any) {
        setMapError(err.message || '地图加载失败');
        setMapLoading(false);
      }
    };
    initMap();
    return () => {
      destroyed = true;
      clearRoute();
      markersRef.current.forEach((m: any) => m.remove?.());
      if (mapInstance.current) { mapInstance.current.destroy(); mapInstance.current = null; }
    };
  }, []);

  // 更新地标标记
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || activeTab !== 'landmarks') return;
    markersRef.current.forEach((m: any) => m.remove?.());
    markersRef.current = [];
    if (landmarks.length === 0) return;

    landmarks.forEach((item) => {
      const lng = parseFloat(item.longitude as any);
      const lat = parseFloat(item.latitude as any);
      if (isNaN(lng) || isNaN(lat)) return;
      const color = categoryColors[item.category] || '#C5952B';
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: createMarkerContent(item.name, color),
        offset: new window.AMap.Pixel(-40, -15),
      });
      marker.on('click', () => {
        setSelectedLandmark(item);
        map.setCenter([lng, lat]);
        map.setZoom(15);
      });
      marker.setMap(map);
      markersRef.current.push(marker);
    });
  }, [landmarks, activeTab]);

  const clearRoute = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = 0; }
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (runnerRef.current) { runnerRef.current.remove(); runnerRef.current = null; }
    labelMarkersRef.current.forEach((m: any) => m.remove?.());
    labelMarkersRef.current = [];
    setRouteDrawing(false);
    setRouteProgress(0);
    setCurrentLocation('');
  }, []);

  // 路线绘制动画
  const startRouteAnimation = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    clearRoute();
    setRouteDrawing(true);
    setSelectedLandmark(null);

    // 调整地图视野到完整路线
    map.setZoom(12);
    map.setCenter(LANZHOU_CENTER);

    // 创建路线 polyline（初始空路径）
    const polyline = new window.AMap.Polyline({
      path: [],
      strokeColor: '#C5952B',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
      strokeStyle: 'solid',
      showDir: true,
    });
    polyline.setMap(map);
    polylineRef.current = polyline;

    // 创建 runner marker
    const runner = new window.AMap.Marker({
      position: MARATHON_ROUTE[0],
      content: `<div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: #C5952B; border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(197,149,43,0.5);
      "></div>`,
      offset: new window.AMap.Pixel(-7, -7),
    });
    runner.setMap(map);
    runnerRef.current = runner;

    // 创建所有地标标注（初始隐藏）
    labelMarkersRef.current = ROUTE_LANDMARKS.map((lm, i) => {
      const label = new window.AMap.Marker({
        position: lm.pos,
        content: `<div style="
          background: rgba(197,149,43,0.12);
          backdropFilter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(197,149,43,0.25);
          border-radius: 12px; padding: 6px 14px;
          box-shadow: 0 2px 12px rgba(197,149,43,0.1);
          text-align: center;
        ">
          <div style="font-size: 13px; font-weight: 600; color: #C5952B;">${lm.name}</div>
          <div style="font-size: 10px; color: #888; margin-top: 1px;">${lm.desc}</div>
        </div>`,
        offset: new window.AMap.Pixel(-50, -30),
        zIndex: 100,
      });
      return label;
    });

    const total = MARATHON_ROUTE.length;
    let idx = 1;
    let shownIndex = -1;
    const timer = setInterval(() => {
      if (idx >= total) {
        polyline.setPath(MARATHON_ROUTE);
        if (runnerRef.current) {
          runnerRef.current.setPosition(MARATHON_ROUTE[total - 1]);
        }
        setRouteProgress(100);
        setRouteDrawing(false);
        clearInterval(timer);
        return;
      }
      const drawnPath = MARATHON_ROUTE.slice(0, idx + 1);
      polyline.setPath(drawnPath);
      if (runnerRef.current) {
        runnerRef.current.setPosition(MARATHON_ROUTE[idx]);
      }
      setRouteProgress(Math.round((idx / total) * 100));

      // 路过地标时显示标注
      const nextLm = ROUTE_LANDMARKS.find(
        (lm, i) => i > shownIndex && lm.routeIndex <= idx
      );
      if (nextLm) {
        const lmIdx = ROUTE_LANDMARKS.indexOf(nextLm);
        shownIndex = lmIdx;
        const marker = labelMarkersRef.current[lmIdx];
        if (marker) {
          marker.setMap(map);
          setCurrentLocation(nextLm.name);
          // 3秒后自动隐藏
          setTimeout(() => {
            if (marker) marker.setMap(null);
          }, 3000);
        }
      }

      idx++;
    }, 100);
    animRef.current = timer as any;
  }, [clearRoute]);

  // 切换 tab 时清理
  useEffect(() => {
    if (activeTab === 'landmarks') clearRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSelectLandmark = (item: LandmarkItem) => {
    setSelectedLandmark(item);
    setActiveTab('landmarks');
    const map = mapInstance.current;
    if (!map) return;
    const lng = parseFloat(item.longitude as any);
    const lat = parseFloat(item.latitude as any);
    if (isNaN(lng) || isNaN(lat)) return;
    map.setCenter([lng, lat]);
    map.setZoom(15);
  };

  const categories = ['桥梁', '雕塑', '公园', '历史建筑', '自然景观'];

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      {/* 地图容器 */}
      <div className="flex-1 relative" style={{ background: '#f0f5f8' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
          {mapLoading && !mapError && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Spin size="large" />
                <p style={{ color: '#999', marginTop: 12, fontSize: 13 }}>加载高德地图...</p>
              </div>
            </div>
          )}
          {mapError && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🗺️</div>
                <p style={{ fontSize: 16, color: '#999', marginBottom: 4 }}>地图加载失败</p>
                <p style={{ fontSize: 13, color: '#ccc' }}>{mapError}</p>
              </div>
            </div>
          )}
        </div>

        {/* 路线进度提示 */}
        {activeTab === 'route' && routeProgress > 0 && routeProgress < 100 && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '6px 18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 10,
            fontSize: 13, color: '#C5952B', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#C5952B', animation: 'pulse 1s infinite' }} />
            {currentLocation ? `📍 ${currentLocation}` : '🏃 路线绘制中'} {routeProgress}%
          </div>
        )}
        {activeTab === 'route' && routeProgress === 100 && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '6px 18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 10,
            fontSize: 13, color: '#10b981', fontWeight: 500,
          }}>
            ✅ 路线绘制完成 — 全程42.195km
          </div>
        )}
      </div>

      {/* 侧边栏 */}
      <div className="w-96 bg-white overflow-y-auto" style={{ borderLeft: '1px solid #eaeaea' }}>
        {/* Tab 切换 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          <div
            onClick={() => setActiveTab('landmarks')}
            style={{
              flex: 1, textAlign: 'center', padding: '14px 0', cursor: 'pointer',
              fontWeight: activeTab === 'landmarks' ? 600 : 400,
              color: activeTab === 'landmarks' ? '#C5952B' : '#999',
              borderBottom: activeTab === 'landmarks' ? '2px solid #C5952B' : '2px solid transparent',
              transition: 'all 0.2s', fontSize: 14,
            }}
          >
            <EnvironmentOutlined style={{ marginRight: 6 }} />地标
          </div>
          <div
            onClick={() => { setActiveTab('route'); setSelectedLandmark(null); }}
            style={{
              flex: 1, textAlign: 'center', padding: '14px 0', cursor: 'pointer',
              fontWeight: activeTab === 'route' ? 600 : 400,
              color: activeTab === 'route' ? '#C5952B' : '#999',
              borderBottom: activeTab === 'route' ? '2px solid #C5952B' : '2px solid transparent',
              transition: 'all 0.2s', fontSize: 14,
            }}
          >
            🏃 路线
          </div>
        </div>

        {/* 地标面板 */}
        {activeTab === 'landmarks' && (
          <>
            <div style={{ padding: '16px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Title level={5} style={{ margin: 0, marginBottom: 12, color: '#1a1a1a' }}>赛道文化导览</Title>
              <Space wrap size={4}>
                <Tag
                  style={{
                    cursor: 'pointer', borderRadius: 6, padding: '2px 10px',
                    border: !filter ? 'none' : '1px solid #e8e8e8',
                    color: !filter ? '#fff' : '#666',
                    background: !filter ? '#C5952B' : '#f5f5f5'
                  }}
                  onClick={() => setFilter(undefined)}
                >全部</Tag>
                {categories.map((cat) => (
                  <Tag key={cat}
                    style={{
                      cursor: 'pointer', borderRadius: 6, padding: '2px 10px',
                      border: filter === cat ? 'none' : '1px solid #e8e8e8',
                      color: filter === cat ? '#fff' : '#666',
                      background: filter === cat ? categoryColors[cat] : '#f5f5f5'
                    }}
                    onClick={() => setFilter(cat)}
                  >{cat}</Tag>
                ))}
              </Space>
            </div>

            {loading ? (
              <div className="text-center py-12"><Spin /></div>
            ) : (
              <div style={{ padding: '4px 0' }}>
                <List
                  dataSource={landmarks}
                  renderItem={(item) => (
                    <List.Item
                      onClick={() => handleSelectLandmark(item)}
                      style={{
                        cursor: 'pointer', padding: '10px 16px',
                        borderLeft: selectedLandmark?.id === item.id ? '3px solid #C5952B' : '3px solid transparent',
                        background: selectedLandmark?.id === item.id ? '#f8f9ff' : 'transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <img src={item.cover_image} alt={item.name}
                            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{item.name}</span>
                            <Tag style={{
                              fontSize: 11, borderRadius: 4, padding: '0 6px', lineHeight: '20px',
                              color: categoryColors[item.category], border: `1px solid ${categoryColors[item.category]}20`,
                              background: `${categoryColors[item.category]}10`
                            }}>{item.category}</Tag>
                          </div>
                        }
                        description={item.distance_from_start
                          ? <span style={{ color: '#999', fontSize: 12 }}>距起点 {item.distance_from_start}km</span>
                          : null}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 玻璃卡片-地标详情 */}
            {selectedLandmark && (
              <div style={{
                margin: '12px 16px 16px',
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                overflow: 'hidden',
              }}>
                {selectedLandmark.cover_image && (
                  <Image
                    src={selectedLandmark.cover_image}
                    alt={selectedLandmark.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjY2NjIj7wn4+6PC90ZXh0Pjwvc3ZnPg=="
                  />
                )}
                <div style={{ padding: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>{selectedLandmark.name}</span>
                    <Tag style={{
                      borderRadius: 6, border: 'none', fontSize: 11, padding: '0 10px', lineHeight: '22px',
                      background: `${categoryColors[selectedLandmark.category] || '#C5952B'}20`,
                      color: categoryColors[selectedLandmark.category] || '#C5952B',
                    }}>{selectedLandmark.category}</Tag>
                  </div>
                  {selectedLandmark.distance_from_start && (
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                      📍 距起点 {selectedLandmark.distance_from_start}km
                    </div>
                  )}
                  {selectedLandmark.content && (
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8, marginBottom: 8 }}
                      dangerouslySetInnerHTML={{ __html: selectedLandmark.content }} />
                  )}
                  {(selectedLandmark.video_url || selectedLandmark.audio_url) && (
                    <div className="flex gap-3">
                      {selectedLandmark.video_url && (
                        <a href={selectedLandmark.video_url} target="_blank" rel="noreferrer"
                          style={{ color: '#C5952B', fontSize: 13 }}>▶ 查看视频</a>
                      )}
                      {selectedLandmark.audio_url && (
                        <audio src={selectedLandmark.audio_url} controls
                          style={{ width: '100%', height: 32, borderRadius: 8 }} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 路线面板 */}
        {activeTab === 'route' && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
              🏃 兰州马拉松路线
            </div>
            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              全程 42.195 公里，沿黄河风情线展开。起点为兰州奥体中心，
              途经北滨河路、中山桥、南滨河路，最终返回奥体中心。
            </p>

            {!routeDrawing && routeProgress === 0 && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                size="large"
                onClick={startRouteAnimation}
                style={{
                  background: '#C5952B', borderColor: '#C5952B',
                  borderRadius: 12, height: 44, width: '100%',
                  boxShadow: '0 4px 16px rgba(197,149,43,0.25)',
                  fontSize: 15,
                }}
              >
                开始动态追踪路线
              </Button>
            )}

            {routeDrawing && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
                <p style={{ color: '#C5952B', fontSize: 13, marginTop: 12 }}>
                  路线绘制中 {routeProgress}%
                </p>
              </div>
            )}

            {routeProgress === 100 && !routeDrawing && (
              <Button
                onClick={startRouteAnimation}
                style={{
                  borderRadius: 12, height: 44, width: '100%', fontSize: 15,
                  border: '1px solid #C5952B', color: '#C5952B',
                }}
              >
                🔄 重新播放
              </Button>
            )}

            {/* 路线数据卡片 */}
            <div style={{
              marginTop: 20,
              background: 'rgba(197,149,43,0.06)',
              borderRadius: 12, padding: 16,
              border: '1px solid rgba(197,149,43,0.1)',
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#C5952B' }}>42.195</div>
                  <div style={{ color: '#888', fontSize: 12 }}>公里</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>≈6h</div>
                  <div style={{ color: '#888', fontSize: 12 }}>关门时间</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>黄河</div>
                  <div style={{ color: '#888', fontSize: 12 }}>沿线风光</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>1500m</div>
                  <div style={{ color: '#888', fontSize: 12 }}>海拔</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
