import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, App, Typography, Select, InputNumber } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

const OCCUPATIONS = ['学生', '教师', '程序员', '医护人员', '自由职业', '退休', '其他'];
const GENDERS = ['男', '女', '其他'];

const Register: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
        ...(values.occupation ? { occupation: values.occupation } : {}),
        ...(values.age ? { age: values.age } : {}),
        ...(values.gender ? { gender: values.gender } : {}),
      });
      setAuth(res.data.token, res.data.user);
      message.success('注册成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || '注册失败');
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
      background: 'linear-gradient(135deg, #FFF8E7 0%, #f5f5f5 50%, #f8faff 100%)',
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
            <span style={{ fontSize: 24, color: '#fff', fontWeight: 600 }}>跑</span>
          </div>
          <Title level={3} style={{ margin: 0, marginBottom: 4, color: '#1a1a1a', fontSize: 22 }}>
            创建账号
          </Title>
          <Text style={{ color: '#888', fontSize: 14 }}>加入兰马文化，开启你的数字之旅</Text>
        </div>

        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名"
              style={{ height: 46, paddingLeft: 12, borderColor: '#e8e8e8' }}
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="邮箱"
              style={{ height: 46, paddingLeft: 12, borderColor: '#e8e8e8' }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码（至少6位）"
              style={{ height: 46, paddingLeft: 12, borderColor: '#e8e8e8' }}
            />
          </Form.Item>

          <div className="flex gap-3" style={{ marginBottom: 24 }}>
            <Form.Item name="occupation" label="职业" style={{ flex: 1, marginBottom: 0 }}>
              <Select
                placeholder="选择职业"
                allowClear
                style={{ height: 46 }}
                options={OCCUPATIONS.map(o => ({ label: o, value: o }))}
              />
            </Form.Item>
            <Form.Item name="age" label="年龄" style={{ width: 120, marginBottom: 0 }}>
              <InputNumber
                placeholder="年龄"
                min={1}
                max={150}
                style={{ height: 46, width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ width: 110, marginBottom: 0 }}>
              <Select
                placeholder="性别"
                allowClear
                style={{ height: 46 }}
                options={GENDERS.map(g => ({ label: g, value: g }))}
              />
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 12 }}>
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
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center" style={{ marginTop: 8 }}>
          <Link to="/login" style={{ color: '#C5952B', fontSize: 13 }}>
            已有账号？立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
