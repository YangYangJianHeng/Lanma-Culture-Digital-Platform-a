import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, SettingOutlined, MenuOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';

const { Header } = Layout;

const navLinks = [
  { path: '/museum', label: '数字展馆' },
  { path: '/publications', label: '小兰发布' },
  { path: '/map', label: '文化地图' },
  { path: '/stories', label: '跑者故事' },
  { path: '/marathons', label: '历届兰马' },
  { path: '/weather', label: '天气预报' },
  { path: '/food', label: '小兰美食' },
  { path: '/tourism', label: '小兰旅游' },
  { path: '/ai', label: '小兰助手' },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '个人中心',
      onClick: () => navigate('/dashboard')
    },
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: '后台管理',
      onClick: () => navigate('/admin')
    }] : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <Header className="flex items-center justify-between fixed top-0 left-0 right-0 z-50 px-6"
      style={{
        height: 64,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span style={{
            display: 'inline-flex',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #C5952B, #D4A843)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3C12 3 7 8 7 13c0 3 2 6 5 6s5-3 5-6c0-5-5-10-5-10Z" />
              <path d="M12 19v3" />
              <path d="M9 22h6" />
              <path d="M14 16c.7-.7 2-1.5 3-1" />
            </svg>
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>兰马文化数字空间</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className="no-underline px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  color: isActive ? '#C5952B' : '#666',
                  background: isActive ? '#FFF8E7' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.color = '#1a1a1a';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="cursor-pointer px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all" style={{ color: '#666' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: '#FFF8E7', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#C5952B', fontSize: 13, fontWeight: 500
              }}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm hidden sm:inline" style={{ color: '#333' }}>{user.username}</span>
            </Space>
          </Dropdown>
        ) : (
          <>
            <Button type="text" onClick={() => navigate('/login')}
              style={{ color: '#666', borderRadius: 8, height: 36 }}>
              登录
            </Button>
            <Button onClick={() => navigate('/register')}
              style={{
                background: '#C5952B', borderColor: '#C5952B', color: '#000000',
                borderRadius: 8, height: 36, boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
              }}>
              注册
            </Button>
          </>
        )}
      </div>
    </Header>
  );
};

export default Navbar;
