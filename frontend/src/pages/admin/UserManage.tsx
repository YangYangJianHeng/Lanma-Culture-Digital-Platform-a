import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, App, Tag, Space, Popconfirm, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminUserApi, AdminUser } from '../../api/adminUsers';
import { adminRoleApi, RoleDefinition } from '../../api/adminRoles';

const OCCUPATIONS = ['学生', '教师', '程序员', '医护人员', '自由职业', '退休', '其他'];
const GENDERS = ['男', '女', '其他'];

const UserManage: React.FC = () => {
  const { message } = App.useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const roleMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach(r => { map[r.role_name] = r.display_name; });
    return map;
  }, [roles]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUserApi.list(page, 15);
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, message]);

  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    setRolesLoading(true);
    adminRoleApi.list()
      .then(res => setRoles(res.data))
      .catch(() => {
        setRoles([
          { id: 1, role_name: 'admin', display_name: '管理员', description: null, sort_order: 1, created_at: '' },
          { id: 2, role_name: 'runner', display_name: '跑者', description: null, sort_order: 2, created_at: '' }
        ]);
      })
      .finally(() => setRolesLoading(false));
  }, [fetchUsers]);

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue({ username: user.username, email: user.email, role: user.role, occupation: user.occupation, age: user.age, gender: user.gender });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const values = await form.validateFields();
      await adminUserApi.update(editingUser.id, values);
      message.success('更新成功');
      setEditModal(false);
      fetchUsers();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminUserApi.delete(id);
      message.success('删除成功');
      fetchUsers();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: AdminUser) => (
        <Space>
          <Avatar src={record.avatar_url} icon={<UserOutlined />} style={{ background: '#C5952B' }} />
          <span style={{ color: '#333' }}>{record.username}</span>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'blue' : role === 'runner' ? 'green' : 'default'} style={{ borderRadius: 4 }}>
          {roleMap[role] || role}
        </Tag>
      )
    },
    { title: '职业', dataIndex: 'occupation', key: 'occupation', width: 80 },
    { title: '年龄', dataIndex: 'age', key: 'age', width: 50 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 50 },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => t?.slice(0, 10)
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: AdminUser) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}
            style={{ color: '#C5952B' }}>
            编辑
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-content-card">
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>用户管理</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers} style={{ borderRadius: 8 }}>刷新</Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 个用户`
        }}
      />

      <Modal
        title="编辑用户"
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        confirmLoading={editLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select>
              {roles.map(r => (
                <Select.Option key={r.role_name} value={r.role_name}>{r.display_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="flex gap-3">
            <Form.Item name="occupation" label="职业" style={{ flex: 1 }}>
              <Select allowClear placeholder="选择职业" options={OCCUPATIONS.map(o => ({ label: o, value: o }))} />
            </Form.Item>
            <Form.Item name="age" label="年龄" style={{ width: 120 }}>
              <InputNumber placeholder="年龄" min={1} max={150} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ width: 110 }}>
              <Select allowClear placeholder="性别" options={GENDERS.map(g => ({ label: g, value: g }))} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
