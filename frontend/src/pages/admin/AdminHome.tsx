import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Typography } from 'antd';
import { TrophyOutlined, EnvironmentOutlined, FileTextOutlined, DashboardOutlined, UserOutlined, HistoryOutlined, CoffeeOutlined, CompassOutlined, NotificationOutlined } from '@ant-design/icons';

const { Title } = Typography;

const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    { icon: <TrophyOutlined />, title: '奖牌管理', desc: '管理历届奖牌信息与3D模型', path: '/admin/medals', color: '#f59e0b', bg: '#fffbeb' },
    { icon: <EnvironmentOutlined />, title: '地标管理', desc: '管理赛道地标文化内容', path: '/admin/landmarks', color: '#10b981', bg: '#ecfdf5' },
    { icon: <FileTextOutlined />, title: '故事管理', desc: '审核与管理跑者故事', path: '/admin/stories', color: '#C5952B', bg: '#FFF8E7' },
    { icon: <DashboardOutlined />, title: '天气数据', desc: '管理天气预报数据', path: '/admin/weather', color: '#fb923c', bg: '#fff7ed' },
    { icon: <CoffeeOutlined />, title: '美食数据', desc: '管理兰州美食推荐', path: '/admin/foods', color: '#f472b6', bg: '#fdf2f8' },
    { icon: <NotificationOutlined />, title: '小兰发布', desc: '管理发布内容与图文编辑', path: '/admin/publications', color: '#C5952B', bg: '#FFF8E7' },
    { icon: <CompassOutlined />, title: '旅游景点', desc: '管理旅游景点信息', path: '/admin/tourism', color: '#38bdf8', bg: '#f0f9ff' },
    { icon: <UserOutlined />, title: '用户管理', desc: '管理平台注册用户', path: '/admin/users', color: '#8b5cf6', bg: '#f5f3ff' },
    { icon: <HistoryOutlined />, title: '历届马拉松', desc: '管理历年赛事信息', path: '/admin/marathons', color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1a1a1a', fontWeight: 600 }}>管理后台概览</Title>
      <Row gutter={[16, 16]}>
        {modules.map((mod) => (
          <Col xs={24} sm={12} lg={8} key={mod.path}>
            <div
              onClick={() => navigate(mod.path)}
              className="card-hover cursor-pointer liquid-glass"
              style={{ padding: 28, borderRadius: 14 }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: mod.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: mod.color, fontSize: 22, marginBottom: 16
              }}>
                {mod.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{mod.title}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{mod.desc}</div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminHome;
