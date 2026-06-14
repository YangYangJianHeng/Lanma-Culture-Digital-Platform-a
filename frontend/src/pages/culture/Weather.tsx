import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Typography, Tag } from 'antd';
import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { weatherApi, WeatherRecord } from '../../api/weather';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const { Title, Text } = Typography;

const WEATHER_ICONS: Record<string, string> = {
  '晴': '☀️', '多云': '⛅', '阴': '☁️', '小雨': '🌦️', '中雨': '🌧️',
  '大雨': '🌧️', '雷阵雨': '⛈️', '小雪': '🌨️', '中雪': '❄️', '大雪': '❄️',
  '雾': '🌫️', '霾': '🌫️', '大风': '💨', '浮尘': '🏜️', '沙尘暴': '🏜️',
};

const AQI_LABEL = ['优', '良', '轻度污染', '中度污染', '重度污染', '严重污染'];
const AQI_COLOR = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#1a1a1a'];

const Weather: React.FC = () => {
  const [latest, setLatest] = useState<WeatherRecord | null>(null);
  const [history, setHistory] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [nowRes, forecastRes] = await Promise.all([
        weatherApi.now('兰州'),
        weatherApi.forecast('兰州')
      ]);
      if (nowRes.data) setLatest(nowRes.data);
      setHistory(forecastRes.data);
    } catch (err) {
      console.error('获取天气数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, []);

  const tempChartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        if (!p || !p.value) return '';
        return `${p.axisValue}<br/>🌡️ 温度: ${p.value}°C`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: history.map(r => r.record_time?.slice(5, 16).replace('T', ' ')),
      axisLabel: { color: '#aaa', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '温度 (°C)',
      axisLabel: { color: '#aaa' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [{
      data: history.map(r => Number(r.temperature)),
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#fb923c', width: 2 },
      itemStyle: { color: '#fb923c' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(251,146,60,0.3)' },
          { offset: 1, color: 'rgba(251,146,60,0.02)' },
        ])
      },
    }]
  };

  const weatherIcon = latest?.weather_condition
    ? WEATHER_ICONS[latest.weather_condition] || '🌤️'
    : '🌤️';

  const aqi = latest?.air_quality ?? -1;
  const aqiIndex = aqi <= 50 ? 0 : aqi <= 100 ? 1 : aqi <= 150 ? 2 : aqi <= 200 ? 3 : aqi <= 300 ? 4 : 5;

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      padding: 32,
    }}>
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-8">
        <span style={{ fontSize: 28 }}>🌤️</span>
        <div>
          <Title level={3} style={{ color: '#1a1a1a', margin: 0, fontWeight: 700 }}>
            兰州 · 实时天气
          </Title>
          <Text style={{ color: '#888', fontSize: 13 }}>
            {latest?.record_time?.replace('T', ' ')?.slice(0, 19) || '--'} 更新
          </Text>
        </div>
      </div>

      {/* 当前天气 - 主卡片 */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} md={14}>
          <Card style={{
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
            background: 'linear-gradient(135deg, rgba(197,149,43,0.08) 0%, rgba(255,255,255,0.75) 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            <Row align="middle">
              <Col span={12} className="text-center">
                <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>{weatherIcon}</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
                  {latest?.temperature || '--'}°
                </div>
                <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
                  体感 {latest?.feels_like || '--'}°C
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>
                  {latest?.weather_condition || '--'}
                </div>
                <div style={{ color: '#888', fontSize: 14, lineHeight: 2 }}>
                  <div>↑ {latest?.temp_max || '--'}°C &nbsp; ↓ {latest?.temp_min || '--'}°C</div>
                  <div>💨 {latest?.wind_direction || ''}{latest?.wind_speed ? ` ${latest.wind_speed}m/s` : ''}</div>
                  <div>💧 {latest?.humidity ?? '--'}% 湿度</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 空气质量 */}
        <Col xs={12} md={5}>
          <Card style={{
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.75)', height: '100%',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            <div className="text-center" style={{ paddingTop: 8 }}>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>空气质量</div>
              <div style={{
                fontSize: 36, fontWeight: 700,
                color: aqi >= 0 ? AQI_COLOR[aqiIndex] : '#ccc'
              }}>
                {aqi >= 0 ? aqi : '--'}
              </div>
              {aqi >= 0 && (
                <Tag color={AQI_COLOR[aqiIndex]} style={{ fontSize: 13, padding: '2px 12px', borderRadius: 8, marginTop: 4 }}>
                  {AQI_LABEL[aqiIndex]}
                </Tag>
              )}
            </div>
          </Card>
        </Col>

        {/* 紫外线 */}
        <Col xs={12} md={5}>
          <Card style={{
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.75)', height: '100%',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            <div className="text-center" style={{ paddingTop: 8 }}>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>紫外线指数</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b' }}>
                {latest?.uv_index ?? '--'}
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                {latest?.uv_index != null
                  ? (latest.uv_index <= 2 ? '低' : latest.uv_index <= 5 ? '中等' : latest.uv_index <= 7 ? '高' : '极高')
                  : '--'}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        {[
          { label: '湿度', value: `${latest?.humidity ?? '--'}%`, color: '#38bdf8' },
          { label: '气压', value: `${latest?.pressure ?? '--'} hPa`, color: '#a78bfa' },
          { label: '降水量', value: `${latest?.precipitation ?? '0'} mm`, color: '#60a5fa' },
          { label: '能见度', value: `${latest?.visibility ?? '--'} km`, color: '#34d399' },
          { label: '风速', value: latest?.wind_speed ? `${latest.wind_speed} m/s` : (latest?.wind_direction || '--'), color: '#f472b6' },
          { label: '体感温度', value: `${latest?.feels_like ?? '--'}°C`, color: '#fb923c' },
        ].map((item, i) => (
          <Col xs={12} sm={8} md={4} key={i}>
            <Card style={{
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
              <StatItem label={item.label} value={item.value} color={item.color} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 温度变化趋势 */}
      <Card style={{
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>🌡️ 温度变化趋势（未来5天预报）</div>
        {history.length > 0 ? (
          <ReactEChartsCore echarts={echarts} option={tempChartOption} style={{ height: 280 }} />
        ) : (
          <div className="text-center" style={{ color: '#888', padding: '60px 0' }}>
            暂无历史数据
          </div>
        )}
      </Card>

      {/* 底部信息 */}
      <div className="text-center" style={{ color: '#bbb', fontSize: 12, marginTop: 16 }}>
        数据来源: {latest?.source || 'uapis.cn'} | 自动更新每5分钟
        {latest?.ai_analysis && (
          <div style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
            🤖 AI分析: {latest.ai_analysis}
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="text-center">
    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 600, color }}>{value}</div>
  </div>
);

export default Weather;
