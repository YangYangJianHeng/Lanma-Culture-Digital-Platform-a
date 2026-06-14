import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Typography, Avatar } from 'antd';
import {
  BankOutlined,
  EnvironmentOutlined,
  ReadOutlined,
  DashboardOutlined,
  RightOutlined,
  CoffeeOutlined,
  CompassOutlined,
  RobotOutlined,
  FileTextOutlined,
  EditOutlined,
  UserOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';

const { Title } = Typography;

const features = [
  {
    icon: <BankOutlined style={{ fontSize: 28 }} />,
    title: '3D 数字展馆',
    desc: '沉浸式浏览历届兰马奖牌，感受设计之美',
    path: '/museum',
    color: '#C5952B',
    bgColor: '#FFF8E7'
  },
  {
    icon: <NotificationOutlined style={{ fontSize: 28 }} />,
    title: '小兰发布',
    desc: '兰马最新资讯、赛事公告与精彩内容',
    path: '/publications',
    color: '#C5952B',
    bgColor: '#FFF8E7'
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
    title: '赛道文化遗产地图',
    desc: '探索兰州马拉松赛道沿线的文化地标',
    path: '/map',
    color: '#10b981',
    bgColor: '#ecfdf5'
  },
  {
    icon: <ReadOutlined style={{ fontSize: 28 }} />,
    title: '跑者故事',
    desc: '分享你的兰马记忆，记录奔跑的感动',
    path: '/stories',
    color: '#f59e0b',
    bgColor: '#fffbeb'
  },
  {
    icon: <DashboardOutlined style={{ fontSize: 28 }} />,
    title: '天气预报',
    desc: '兰州实时天气与七日趋势，AI智能分析',
    path: '/weather',
    color: '#fb923c',
    bgColor: '#fff7ed'
  },
  {
    icon: <CoffeeOutlined style={{ fontSize: 28 }} />,
    title: '小兰美食',
    desc: '探索兰州特色美食与地道风味',
    path: '/food',
    color: '#f472b6',
    bgColor: '#fdf2f8'
  },
  {
    icon: <CompassOutlined style={{ fontSize: 28 }} />,
    title: '小兰旅游',
    desc: '兰州旅游景点与文化地标推荐',
    path: '/tourism',
    color: '#38bdf8',
    bgColor: '#f0f9ff'
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28 }} />,
    title: '小兰助手',
    desc: 'AI智能问答，了解兰州的一切',
    path: '/ai',
    color: '#a78bfa',
    bgColor: '#f5f3ff'
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const myFeatures = [
    {
      icon: <FileTextOutlined style={{ fontSize: 22 }} />,
      title: '我的故事',
      desc: '管理你发布的兰马故事',
      path: '/dashboard',
      color: '#C5952B',
      bgColor: '#FFF8E7'
    },
    {
      icon: <EditOutlined style={{ fontSize: 22 }} />,
      title: '写故事',
      desc: '记录你的兰马参赛记忆',
      path: '/dashboard/stories/new',
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      icon: <UserOutlined style={{ fontSize: 22 }} />,
      title: '个人资料',
      desc: '编辑你的个人信息',
      path: '/dashboard/profile',
      color: '#f59e0b',
      bgColor: '#fffbeb'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #f8faff 0%, #FFF8E7 50%, #f8faff 100%)',
        borderBottom: '1px solid #eaeaea'
      }}>
        <div style={{
          position: 'absolute',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,149,43,0.06) 0%, transparent 70%)',
          top: -200, right: -150
        }} />
        <div style={{
          position: 'absolute',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,149,43,0.04) 0%, transparent 70%)',
          bottom: -150, left: -100
        }} />

        <div className="relative z-10 page-container flex flex-col items-center text-center py-24 md:py-32">
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#C5952B', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(197,149,43,0.2)'
          }}>
            <span style={{ fontSize: 28, color: '#fff', fontWeight: 600 }}>兰</span>
          </div>
          <Title level={1} style={{ margin: 0, marginBottom: 12, fontSize: 40, color: '#1a1a1a', fontWeight: 700 }}>
            兰马文化数字博物馆
          </Title>
          <p style={{ fontSize: 16, color: '#888', marginBottom: 36, maxWidth: 480 }}>
            奔跑在黄河之滨的文化记忆 — 用数字技术讲述兰州马拉松的每一段故事
          </p>
          <div className="flex gap-3">
            <Button
              size="large"
              onClick={() => navigate('/museum')}
              style={{
                height: 48, paddingLeft: 32, paddingRight: 28, fontSize: 15,
                borderRadius: 10, background: '#C5952B', borderColor: '#C5952B',
                color: '#000000', boxShadow: '0 4px 14px rgba(197,149,43,0.25)'
              }}
            >
              进入展馆 <RightOutlined />
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/stories')}
              style={{
                height: 48, paddingLeft: 28, paddingRight: 28, fontSize: 15,
                borderRadius: 10, borderColor: '#e0e0e0', color: '#000000',
                background: '#fff'
              }}
            >
              浏览故事
            </Button>
          </div>
        </div>
      </div>

      {/* 我的功能（仅登录后显示） */}
      {user && (
        <div className="page-container" style={{ paddingBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(197,149,43,0.06), rgba(212,168,67,0.06))',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            border: '1px solid rgba(197,149,43,0.1)',
          }}>
            <div className="flex items-center gap-4 mb-5">
              <Avatar
                size={48}
                icon={<UserOutlined />}
                src={user.avatar_url}
                style={{
                  background: 'linear-gradient(135deg, #C5952B, #D4A843)',
                  boxShadow: '0 4px 12px rgba(197,149,43,0.2)'
                }}
              />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                  你好，{user.username}
                </div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                  {user.role === 'admin' ? '管理员' : '跑者'} · 欢迎回来
                </div>
              </div>
              {user.role === 'admin' && (
                <Button
                  onClick={() => navigate('/admin')}
                  style={{
                    marginLeft: 'auto', borderRadius: 8, height: 36,
                    background: '#C5952B', borderColor: '#C5952B', color: '#fff',
                    boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
                  }}
                >
                  后台管理
                </Button>
              )}
            </div>
            <Row gutter={[12, 12]}>
              {myFeatures.map((item, index) => (
                <Col xs={24} sm={8} key={index}>
                  <div
                    onClick={() => navigate(item.path)}
                    className="cursor-pointer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      transition: 'all 0.25s ease',
                      height: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: item.bgColor, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: item.color, flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{item.desc}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )}

      {/* 功能卡片 */}
      <div className="page-container">
        <Row gutter={[24, 24]}>
          {features.map((item, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div
                onClick={() => navigate(item.path)}
                className="card-hover cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: 14,
                  padding: 32,
                  border: '1px solid rgba(255,255,255,0.3)',
                  height: '100%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: item.bgColor, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: item.color, marginBottom: 20
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 数据条 */}
      <div className="page-container" style={{ paddingTop: 0 }}>
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 14, border: '1px solid rgba(255,255,255,0.3)',
          padding: '32px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <Row gutter={[16, 16]} className="text-center">
            <Col span={8}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#C5952B' }}>42.195</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>公里赛道</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>6+</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>文化地标</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>∞</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>跑者故事</div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Home;
