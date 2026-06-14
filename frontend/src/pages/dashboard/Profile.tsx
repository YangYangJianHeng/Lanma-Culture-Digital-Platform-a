import React, { useState } from 'react';
import { Form, Input, Button, Typography, Avatar, App, Upload, Select, InputNumber } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/auth';
import { uploadApi } from '../../api/upload';

const { Title } = Typography;

const OCCUPATIONS = ['学生', '教师', '程序员', '医护人员', '自由职业', '退休', '其他'];
const GENDERS = ['男', '女', '其他'];

const Profile: React.FC = () => {
  const { message } = App.useApp();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwForm] = Form.useForm();

  const handleUploadAvatar = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setAvatarUrl(res.data.url);
      return false;
    } catch {
      message.error('头像上传失败');
      return false;
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        username: values.username,
        avatar_url: avatarUrl || undefined,
        occupation: values.occupation || undefined,
        age: values.age || undefined,
        gender: values.gender || undefined,
      });
      updateUser(res.data);
      message.success('资料更新成功');
    } catch (err: any) {
      message.error(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordChange = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.warning('两次输入的新密码不一致');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.updatePassword({
        old_password: values.old_password,
        new_password: values.new_password
      });
      message.success('密码修改成功');
      pwForm.resetFields();
    } catch (err: any) {
      message.error(err.message || '密码修改失败');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 个人资料卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.3)',
        padding: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div className="text-center mb-6">
          <Avatar size={80} icon={<UserOutlined />} src={avatarUrl || user?.avatar_url}
            style={{ background: '#C5952B' }} />
          <Title level={4} style={{ marginTop: 12, marginBottom: 0, color: '#1a1a1a' }}>{user?.username}</Title>
        </div>

        <Form
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
            occupation: user?.occupation,
            age: user?.age,
            gender: user?.gender,
          }}
          onFinish={onFinish}
        >
          <Form.Item label="头像">
            <Upload
              beforeUpload={handleUploadAvatar}
              showUploadList={false}
              accept="image/*"
            >
              {avatarUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar size={80} src={avatarUrl} />
                  <Button type="link" danger size="small"
                    style={{ position: 'absolute', top: -8, right: -8, fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); setAvatarUrl(''); }}>
                    删除
                  </Button>
                </div>
              ) : (
                <div style={{
                  width: 80, height: 80, border: '2px dashed #e0e0e0',
                  borderRadius: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  background: '#fafafa', transition: 'border-color 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#C5952B'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}>
                  <UploadOutlined style={{ fontSize: 20, color: '#bbb' }} />
                  <span style={{ color: '#bbb', marginTop: 4, fontSize: 10 }}>上传</span>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item name="username" label="用户名" rules={[{ min: 2, message: '用户名至少2个字符' }]}>
            <Input style={{ borderColor: '#e8e8e8' }} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input disabled style={{ borderColor: '#e8e8e8' }} />
          </Form.Item>
          <div className="flex gap-3">
            <Form.Item name="occupation" label="职业" style={{ flex: 1 }}>
              <Select
                placeholder="选择职业"
                allowClear
                style={{ height: 40 }}
                options={OCCUPATIONS.map(o => ({ label: o, value: o }))}
              />
            </Form.Item>
            <Form.Item name="age" label="年龄" style={{ width: 120 }}>
              <InputNumber placeholder="年龄" min={1} max={150} style={{ height: 40, width: '100%' }} />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ width: 110 }}>
              <Select
                placeholder="性别"
                allowClear
                style={{ height: 40 }}
                options={GENDERS.map(g => ({ label: g, value: g }))}
              />
            </Form.Item>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}
              style={{
                background: '#C5952B', borderColor: '#C5952B',
                borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
              }}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* 修改密码卡片 */}
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.3)',
        padding: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 20, color: '#1a1a1a' }}>修改密码</Title>
        <Form form={pwForm} layout="vertical" onFinish={onPasswordChange}>
          <Form.Item name="old_password" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="输入原密码" style={{ borderColor: '#e8e8e8' }} />
          </Form.Item>
          <Form.Item name="new_password" label="新密码" rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' }
          ]}>
            <Input.Password placeholder="输入新密码（至少6位）" style={{ borderColor: '#e8e8e8' }} />
          </Form.Item>
          <Form.Item name="confirm_password" label="确认新密码" rules={[
            { required: true, message: '请再次输入新密码' },
            { min: 6, message: '密码至少6位' }
          ]}>
            <Input.Password placeholder="再次输入新密码" style={{ borderColor: '#e8e8e8' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={pwLoading}
              style={{
                background: '#C5952B', borderColor: '#C5952B',
                borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
              }}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Profile;
