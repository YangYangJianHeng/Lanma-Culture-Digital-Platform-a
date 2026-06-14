import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, App, Space, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { adminRoleApi, RoleDefinition } from '../../api/adminRoles';

const { Title } = Typography;

const RoleManage: React.FC = () => {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleDefinition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminRoleApi.list();
      setRoles(res.data);
    } catch {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0 });
    setModalOpen(true);
  };

  const openEditModal = (record: RoleDefinition) => {
    setEditingRecord(record);
    form.setFieldsValue({
      role_name: record.role_name,
      display_name: record.display_name,
      description: record.description || '',
      sort_order: record.sort_order
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingRecord) {
        await adminRoleApi.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await adminRoleApi.create(values);
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminRoleApi.delete(id);
      message.success('删除成功');
      fetchRoles();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '角色标识',
      dataIndex: 'role_name',
      key: 'role_name',
      width: 140,
      render: (v: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{v}</Tag>
    },
    { title: '显示名称', dataIndex: 'display_name', key: 'display_name', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (v: string) => v?.slice(0, 10)
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: RoleDefinition) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}
            style={{ color: '#C5952B' }}>编辑</Button>
          <Popconfirm title="确定删除该角色？" description="删除后用户将无法使用此角色" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-content-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TeamOutlined style={{ color: '#C5952B', fontSize: 18 }} />
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>角色管理</Title>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles} style={{ borderRadius: 8 }}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}
            style={{ background: '#C5952B', borderColor: '#C5952B', borderRadius: 8 }}>
            添加角色
          </Button>
        </Space>
      </div>

      <Table dataSource={roles} columns={columns} rowKey="id" loading={loading} pagination={false} />

      <Modal
        title={editingRecord ? '编辑角色' : '添加角色'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="role_name"
            label="角色标识"
            rules={[
              { required: true, message: '请输入角色标识' },
              { pattern: /^[a-z][a-z0-9_]*$/, message: '仅支持小写字母开头，可含数字和下划线' }
            ]}
            extra="英文标识，如 editor、moderator，创建后不建议修改"
          >
            <Input placeholder="如 editor" disabled={!!editingRecord} />
          </Form.Item>
          <Form.Item name="display_name" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如 编辑员" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="角色权限说明" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManage;
