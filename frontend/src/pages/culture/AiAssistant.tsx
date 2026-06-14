import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Typography, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { aiApi } from '../../api/ai';

const { Title, Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  time?: string;
}

const WELCOME_MSG: Message = {
  role: 'assistant',
  content: '你好！我是小兰助手 🤖\n\n我可以帮你了解兰州的美食、旅游景点、兰马赛事和黄河文化。\n\n> 当前未连接本地大模型，回答为预设内容。启动 Ollama 后（如 `ollama run llama3`），我会自动使用大模型回答你的问题！\n\n试试问我：\n• "兰州有什么好吃的？"\n• "兰州必去的景点有哪些？"\n• "介绍一下兰马赛事"',
  source: 'system',
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
};

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', content: msg, time: now };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await aiApi.chat(msg);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.reply,
        source: res.data.source,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '😅 和小兰聊天出了点小问题，请稍后再试。',
        source: 'error',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      height: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #C5952B, #D4A843)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🤖</div>
          <div>
            <Title level={4} style={{ color: '#1a1a1a', margin: 0, fontWeight: 600 }}>小兰助手</Title>
            <Text style={{ color: '#999', fontSize: 12 }}>基于 Ollama 本地大模型</Text>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: '#f5f5f5' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className="flex gap-3" style={{
              maxWidth: '70%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* 头像 */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user' ? '#C5952B' : '#f0f0f0',
                color: msg.role === 'user' ? '#fff' : '#666',
                fontSize: 16,
              }}>
                {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              </div>

              {/* 气泡 */}
              <div>
                <div style={{
                  padding: '12px 16px', borderRadius: 14,
                  background: msg.role === 'user' ? '#C5952B' : '#fff',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: msg.role === 'user'
                    ? '0 2px 8px rgba(197,149,43,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.03)',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  fontSize: 14, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-2" style={{ marginTop: 4, paddingLeft: msg.role === 'user' ? 0 : 4 }}>
                  {msg.time && (
                    <Text style={{ color: '#bbb', fontSize: 11 }}>{msg.time}</Text>
                  )}
                  {msg.source && msg.source !== 'system' && msg.role === 'assistant' && (
                    <Tag style={{ margin: 0, fontSize: 11, borderRadius: 6, border: 'none', lineHeight: '18px' }}
                      color={msg.source === 'fallback' ? 'warning' : msg.source.startsWith('ollama') ? 'success' : 'default'}>
                      {msg.source === 'fallback' ? '💡 预设回复' : msg.source.startsWith('ollama') ? '🦙 Ollama' : '⚠️'}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-3" style={{ maxWidth: '70%' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f0f0f0', color: '#666', fontSize: 16,
              }}><RobotOutlined /></div>
              <div style={{
                padding: '12px 20px', borderRadius: 14,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}>
                <Spin size="small" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div style={{
        padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.03)',
      }}>
        <div className="flex gap-3">
          <Input.TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问小兰关于兰州的一切..."
            rows={1}
            style={{
              flex: 1, borderRadius: 12, resize: 'none',
              background: '#fff', border: '1px solid #e8e8e8',
              color: '#333', padding: '10px 16px', fontSize: 14,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            style={{
              height: 42, width: 42, borderRadius: 12, padding: 0,
              background: '#C5952B',
              border: 'none', boxShadow: '0 4px 12px rgba(197,149,43,0.3)',
            }}
          />
        </div>
        <div style={{ color: '#bbb', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
          Enter 发送 · Shift+Enter 换行
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
