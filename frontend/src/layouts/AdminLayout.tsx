import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  TrophyOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DashboardOutlined,
  UserOutlined,
  HistoryOutlined,
  CoffeeOutlined,
  CompassOutlined,
  MessageOutlined,
  NotificationOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '概览',
      onClick: () => navigate('/admin')
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      onClick: () => navigate('/admin/users')
    },
    {
      key: '/admin/marathons',
      icon: <HistoryOutlined />,
      label: '历届马拉松',
      onClick: () => navigate('/admin/marathons')
    },
    {
      key: '/admin/medals',
      icon: <TrophyOutlined />,
      label: '奖牌管理',
      onClick: () => navigate('/admin/medals')
    },
    {
      key: '/admin/landmarks',
      icon: <EnvironmentOutlined />,
      label: '地标管理',
      onClick: () => navigate('/admin/landmarks')
    },
    {
      key: '/admin/stories',
      icon: <FileTextOutlined />,
      label: '故事管理',
      onClick: () => navigate('/admin/stories')
    },
    {
      key: '/admin/weather',
      icon: <DashboardOutlined />,
      label: '天气数据管理',
      onClick: () => navigate('/admin/weather')
    },
    {
      key: '/admin/foods',
      icon: <CoffeeOutlined />,
      label: '美食数据管理',
      onClick: () => navigate('/admin/foods')
    },
    {
      key: '/admin/publications',
      icon: <NotificationOutlined />,
      label: '小兰发布管理',
      onClick: () => navigate('/admin/publications')
    },
    {
      key: '/admin/tourism',
      icon: <CompassOutlined />,
      label: '旅游景点管理',
      onClick: () => navigate('/admin/tourism')
    },
    {
      key: '/admin/comments',
      icon: <MessageOutlined />,
      label: '评论管理',
      onClick: () => navigate('/admin/comments')
    },
    {
      key: '/admin/roles',
      icon: <TeamOutlined />,
      label: '角色管理',
      onClick: () => navigate('/admin/roles')
    }
  ];

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      <Sider width={220} className="liquid-glass-animated" style={{
        borderRight: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '1px 0 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          padding: '22px 16px 18px',
          fontSize: 15,
          fontWeight: 700,
          color: '#1a1a1a',
          letterSpacing: 1,
          borderBottom: '1px solid rgba(255,255,255,0.4)'
        }}>
          后台管理
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Content className="p-6" style={{ background: 'transparent' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AdminLayout;