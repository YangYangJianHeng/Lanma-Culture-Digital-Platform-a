import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from '../components/layout/Navbar';

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <Navbar />
      <Content style={{ marginTop: 64 }}>
        <Outlet />
      </Content>
      <Footer className="text-center" style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.3)',
        color: '#999',
        fontSize: 13,
        padding: '20px 16px'
      }}>
        兰马智旅数字平台 © {new Date().getFullYear()} — 兰州马拉松文化传播平台
      </Footer>
    </Layout>
  );
};

export default MainLayout;
