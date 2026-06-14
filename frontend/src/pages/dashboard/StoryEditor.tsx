import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, Switch, App, Typography, Upload, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { storyApi, CreateStoryParams } from '../../api/stories';
import { uploadApi } from '../../api/upload';

const { Title } = Typography;
const { TextArea } = Input;

const StoryEditor: React.FC = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      storyApi.detail(Number(id)).then(res => {
        const data = res.data;
        form.setFieldsValue({
          ...data,
          images: undefined
        });
        if (Array.isArray(data.images)) {
          setImageUrls(data.images);
        } else if (typeof data.images === 'string') {
          try { setImageUrls(JSON.parse(data.images)); } catch { setImageUrls([]); }
        }
        setFetching(false);
      }).catch(() => {
        message.error('获取故事失败');
        navigate('/dashboard');
      });
    }
  }, [id]);

  const handleUploadImage = async (file: File) => {
    try {
      const res = await uploadApi.upload(file);
      setImageUrls(prev => [...prev, res.data.url]);
    } catch {
      message.error('图片上传失败');
    }
    return false;
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onFinish = async (values: any) => {
    const payload: CreateStoryParams = {
      ...values,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      is_public: values.is_public ? 1 : 0
    };

    setLoading(true);
    try {
      if (isEdit) {
        await storyApi.update(Number(id), payload);
        message.success('更新成功');
      } else {
        await storyApi.create(payload);
        message.success('发布成功');
      }
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-8" style={{ color: '#888' }}>加载中...</div>;
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.3)',
      padding: 32,
      maxWidth: 720,
      margin: '0 auto',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <Title level={4} style={{ marginBottom: 24, color: '#1a1a1a', fontWeight: 600 }}>
        {isEdit ? '编辑故事' : '写故事'}
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ is_public: true, race_year: new Date().getFullYear() }}
      >
        <Form.Item name="title" label="故事标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="给故事起个标题" style={{ borderColor: '#e8e8e8' }} />
        </Form.Item>

        <Form.Item name="race_year" label="参赛年份" rules={[{ required: true, message: '请选择年份' }]}>
          <Select style={{ borderColor: '#e8e8e8' }}>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <Select.Option key={y} value={y}>{y}年</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="bib_number" label="参赛号码">
          <Input placeholder="如: A1234" style={{ borderColor: '#e8e8e8' }} />
        </Form.Item>

        <Form.Item name="finish_time" label="完赛成绩">
          <Input placeholder="如: 4:32:10" style={{ borderColor: '#e8e8e8' }} />
        </Form.Item>

        <Form.Item name="content" label="故事内容" rules={[{ required: true, message: '请输入故事内容' }]}>
          <TextArea rows={12} placeholder="写下你的兰马故事..." style={{ borderColor: '#e8e8e8' }} />
        </Form.Item>

        <Form.Item label="图片上传">
          <Upload
            beforeUpload={handleUploadImage}
            showUploadList={false}
            accept="image/*"
            listType="picture-card"
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </div>
          </Upload>
          {imageUrls.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {imageUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <Image src={url} width={100} height={100}
                    style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <Button type="link" danger size="small"
                    style={{ position: 'absolute', top: 0, right: 0, fontSize: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 4 }}
                    onClick={() => handleRemoveImage(index)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        <Form.Item name="is_public" label="公开状态" valuePropName="checked">
          <Switch checkedChildren="公开" unCheckedChildren="私密" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}
            style={{
              background: '#C5952B', borderColor: '#C5952B',
              borderRadius: 8, boxShadow: '0 2px 8px rgba(197,149,43,0.2)'
            }}>
            {isEdit ? '保存修改' : '发布故事'}
          </Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard')}
            style={{ borderRadius: 8 }}>取消</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default StoryEditor;
