import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, App, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

const AdminLogin: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const { user } = res.data;

      if (user.role !== 'admin') {
        message.error('该账号无管理员权限');
        return;
      }

      setAuth(res.data.token, user);
      message.success('管理员登录成功');
      navigate('/admin');
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: 24
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <div className="text-center mb-8">
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#C5952B', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(197,149,43,0.2)'
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, marginBottom: 4, color: '#1a1a1a', fontSize: 22 }}>
            管理员登录
          </Title>
          <Text style={{ color: '#888', fontSize: 14 }}>兰州马拉松 · 后台管理系统</Text>
        </div>

        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员用户名' }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="管理员用户名"
              style={{ height: 46, paddingLeft: 12, borderColor: '#e8e8e8' }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 4 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
              style={{ height: 46, paddingLeft: 12, borderColor: '#e8e8e8' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 46,
                fontSize: 15,
                background: '#C5952B',
                borderColor: '#C5952B',
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(197,149,43,0.2)'
              }}
            >
              管理员登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center" style={{ marginTop: 8 }}>
          <Button type="link" onClick={() => navigate('/login')}
            style={{ color: '#bbb', fontSize: 13 }}>
            普通用户登录
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
