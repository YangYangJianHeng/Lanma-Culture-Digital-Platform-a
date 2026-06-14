import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { EditOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <FileTextOutlined />,
      label: '我的故事',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/dashboard/stories/new',
      icon: <EditOutlined />,
      label: '写故事',
      onClick: () => navigate('/dashboard/stories/new')
    },
    {
      key: '/dashboard/profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/dashboard/profile')
    }
  ];

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Sider width={220} className="bg-white"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '1px 0 3px rgba(0,0,0,0.02)'
        }}>
        <div style={{
          padding: '20px 16px',
          fontSize: 15,
          fontWeight: 600,
          color: '#1a1a1a',
          borderBottom: '1px solid #f0f0f0'
        }}>
          个人中心
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Content className="p-6" style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default DashboardLayout;
