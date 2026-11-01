const api = require('../../utils/api.js');
const subscribe = require('../../utils/subscribe.js');
const util = require('../../utils/util.js');

const MODELS = [
  { key: 'llama3', label: 'Llama 3' },
  { key: 'qwen3', label: '通义千问 Qwen3' },
  { key: 'qwen2.5', label: 'Qwen 2.5' },
  { key: 'deepseek-r1:7b', label: 'DeepSeek R1' }
];

const QUICK_PROMPTS = [
  { q: '推荐一家正宗的兰州牛肉面馆', icon: '🍜', label: '牛肉面' },
  { q: '兰州周边一日游攻略', icon: '🏯', label: '一日游' },
  { q: '跑兰马需要准备什么', icon: '🏃', label: '跑马准备' },
  { q: '兰州有哪些特色小吃', icon: '🥟', label: '特色小吃' },
  { q: '黄河文化有什么典故', icon: '🌊', label: '黄河文化' }
];

const STORAGE_SESSIONS = 'lanma_ai_sessions';
const STORAGE_ACTIVE = 'lanma_ai_active';

const WELCOME = {
  role: 'assistant',
  content: '你好，我是「小兰」🌍～\n\n我熟悉兰州的美食、旅游、文化和马拉松赛事。\n试试问我：\n• 推荐几家正宗的兰州牛肉面馆\n• 6月跑兰马应该注意什么\n• 兰州周边一日游怎么安排',
  time: '',
  id: 'welcome'
};

function newId_() { return 's-' + Date.now() + '-' + Math.floor(Math.random() * 1000); }

function defaultSession(model) {
  return {
    id: newId_(),
    title: '新对话',
    messages: [WELCOME],
    model: model || 'llama3',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadFromStorage() {
  try {
    const sessions = wx.getStorageSync(STORAGE_SESSIONS) || [];
    const active = wx.getStorageSync(STORAGE_ACTIVE);
    return { sessions, active };
  } catch (e) { return { sessions: [], active: null }; }
}

function saveSessions(sessions, activeId) {
  try {
    wx.setStorageSync(STORAGE_SESSIONS, sessions);
    wx.setStorageSync(STORAGE_ACTIVE, activeId);
  } catch (e) {}
}

Page({
  data: {
    messages: [WELCOME],
    query: '',
    sending: false,
    scrollTo: '',
    models: MODELS,
    modelIndex: 0,
    currentModel: 'llama3',
    quickPrompts: QUICK_PROMPTS,
    showModelPicker: false,
    historyLoaded: false,
    inputFocus: false,
    // 多会话管理
    activeSessionId: '',
    sessions: [],
    sessionList: [],
    showDrawer: false,
    showRename: false,
    renameValue: ''
  },

  onLoad() {
    const { sessions, active } = loadFromStorage();
    const ensured = sessions.length ? sessions : [defaultSession(this.data.currentModel)];
    const activeId = (active && sessions.find((s) => s.id === active)) ? active : ensured[0].id;
    const activeSess = ensured.find((s) => s.id === activeId) || ensured[0];
    this.setData({
      sessions: ensured,
      activeSessionId: activeId,
      messages: activeSess.messages,
      currentModel: activeSess.model || 'llama3',
      modelIndex: MODELS.findIndex((m) => m.key === (activeSess.model || 'llama3'))
    });
    saveSessions(ensured, activeId);
    this._refreshSessionViews();
    this.loadHistory();
    // 进入 AI 页时,提示订阅每日兰马小知识(静默模式)
    setTimeout(() => {
      subscribe.requestSubscribe({
        tmplIds: ['AI_DAILY'],
        silent: true,
        hint: '开启后,每日清晨可收到兰马文化小知识推送'
      });
    }, 1500);
  },

  _refreshSessionViews() {
    const list = (this.data.sessions || [])
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((s) => ({
        id: s.id,
        title: s.title || '新对话',
        count: (s.messages || []).length,
        updatedAtText: this._formatTime(s.updatedAt || s.createdAt)
      }));
    this.setData({ sessionList: list });
  },

  _formatTime(ts) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      if (sameDay) {
        return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      }
      return (d.getMonth() + 1) + '/' + d.getDate();
    } catch (e) { return ''; }
  },

  onShow() { this.scrollToBottom(true); },

  async loadHistory() {
    try {
      const list = await api.ai.history();
      const history = (list || []).map((it, i) => ({
        role: it.role,
        content: it.content,
        time: util.relativeTime(it.createdAt || it.created_at),
        id: 'h-' + i
      }));
      // 仅在当前会话只有欢迎语时合并历史
      if (history.length && this.data.messages.length <= 1) {
        const merged = [WELCOME].concat(history);
        this.setData({ messages: merged, historyLoaded: true }, () => this.scrollToBottom(true));
        this._updateCurrentSession({ messages: merged });
      } else {
        this.setData({ historyLoaded: true });
      }
    } catch (e) {
      this.setData({ historyLoaded: true });
    }
  },

  onInput(e) { this.setData({ query: e.detail.value }); },
  onInputFocus() { this.setData({ inputFocus: true }); },
  onInputBlur() { this.setData({ inputFocus: false }); },

  onModelTap() { this.setData({ showModelPicker: !this.data.showModelPicker }); },
  onModelSelect(e) {
    const idx = Number(e.detail.value);
    const m = MODELS[idx];
    if (!m) return;
    this.setData({ modelIndex: idx, currentModel: m.key, showModelPicker: false });
    this._updateCurrentSession({ model: m.key });
    util.vibrate('short');
    wx.showToast({ title: '已切换：' + m.label, icon: 'none' });
  },
  onCloseModelPicker() { this.setData({ showModelPicker: false }); },

  onQuickTap(e) {
    const q = e.currentTarget.dataset.q || '';
    if (!q) return;
    util.vibrate('short');
    this.setData({ query: q });
    this.onSend();
  },

  scrollToBottom(force) {
    setTimeout(() => {
      const id = 'msg-' + (this.data.messages.length - 1);
      this.setData({ scrollTo: id });
    }, force ? 100 : 30);
  },

  async onSend() {
    const q = this.data.query.trim();
    if (!q || this.data.sending) {
      if (!q) util.vibrate('warning');
      return;
    }

    const userMsg = {
      role: 'user', content: q, time: '刚刚', id: 'u-' + Date.now()
    };
    const messages = this.data.messages.concat(userMsg);
    this.setData({ messages, sending: true, query: '' }, () => this.scrollToBottom(true));
    this._updateCurrentSession({ messages });

    // 如果这是当前会话的首条用户消息,自动用其内容作为会话标题
    const current = this.data.sessions.find((s) => s.id === this.data.activeSessionId);
    if (current && (!current.title || current.title === '新对话') && this._countUserMsgs(messages) === 1) {
      const title = q.length > 16 ? q.slice(0, 16) + '…' : q;
      this._updateCurrentSession({ title });
    }

    try {
      const user = wx.getStorageSync('lanma_user') || null;
      const reply = await api.ai.chat(q, this.data.currentModel, user && user.id ? { 'X-User-Id': String(user.id) } : null);
      const aiMsg = {
        role: 'assistant',
        content: (reply && reply.reply) || '（无回复）',
        time: '刚刚',
        source: reply && reply.source,
        id: 'a-' + Date.now()
      };
      messages.push(aiMsg);
      this.setData({ messages, sending: false }, () => this.scrollToBottom(true));
      this._updateCurrentSession({ messages });
      util.vibrate('success');
    } catch (e) {
      messages.push({
        role: 'assistant',
        content: '⚠️ 出错了，请稍后再试',
        time: '刚刚',
        id: 'e-' + Date.now()
      });
      this.setData({ messages, sending: false }, () => this.scrollToBottom(true));
      this._updateCurrentSession({ messages });
      util.vibrate('warning');
    }
  },

  _countUserMsgs(msgs) {
    return (msgs || []).filter((m) => m.role === 'user').length;
  },

  _updateCurrentSession(patch) {
    const sessions = this.data.sessions.slice();
    const idx = sessions.findIndex((s) => s.id === this.data.activeSessionId);
    if (idx < 0) return;
    sessions[idx] = Object.assign({}, sessions[idx], patch, { updatedAt: Date.now() });
    this.setData({ sessions }, () => this._refreshSessionViews());
    saveSessions(sessions, this.data.activeSessionId);
  },

  /** ===== 多会话管理 ===== */
  onOpenDrawer() {
    util.vibrate('short');
    this.setData({ showDrawer: true });
  },
  onCloseDrawer() {
    this.setData({ showDrawer: false });
  },

  onSelectSession(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || id === this.data.activeSessionId) {
      this.setData({ showDrawer: false });
      return;
    }
    util.vibrate('short');
    // 保存当前会话
    this._updateCurrentSession({ messages: this.data.messages });
    const target = this.data.sessions.find((s) => s.id === id);
    if (!target) return;
    this.setData({
      activeSessionId: id,
      messages: target.messages,
      currentModel: target.model || 'llama3',
      modelIndex: MODELS.findIndex((m) => m.key === (target.model || 'llama3')),
      showDrawer: false
    });
    saveSessions(this.data.sessions, id);
    this.scrollToBottom(true);
  },

  onNewSession() {
    util.vibrate('short');
    const sess = {
      id: newId_(),
      title: '新对话',
      messages: [WELCOME],
      model: this.data.currentModel,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this._updateCurrentSession({ messages: this.data.messages });
    const sessions = [sess].concat(this.data.sessions);
    this.setData({
      sessions,
      activeSessionId: sess.id,
      messages: sess.messages,
      showDrawer: false
    }, () => this._refreshSessionViews());
    saveSessions(sessions, sess.id);
  },

  onRenameSession(e) {
    const id = e.currentTarget.dataset.id;
    const sess = this.data.sessions.find((s) => s.id === id);
    if (!sess) return;
    util.vibrate('short');
    this.setData({
      showRename: true,
      renameValue: sess.title || '',
      _renameId: id
    });
  },

  onRenameInput(e) { this.setData({ renameValue: e.detail.value }); },

  onRenameConfirm() {
    const id = this.data._renameId;
    const v = (this.data.renameValue || '').trim();
    if (!id) return;
    if (v) {
      const sessions = this.data.sessions.slice();
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sessions[idx] = Object.assign({}, sessions[idx], { title: v });
        this.setData({ sessions }, () => this._refreshSessionViews());
        saveSessions(sessions, this.data.activeSessionId);
      }
    }
    this.setData({ showRename: false, renameValue: '', _renameId: null });
  },

  onRenameCancel() {
    this.setData({ showRename: false, renameValue: '', _renameId: null });
  },

  onDeleteSession(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const sess = this.data.sessions.find((s) => s.id === id);
    if (!sess) return;
    util.vibrate('warning');
    wx.showModal({
      title: '删除会话？',
      content: '「' + (sess.title || '新对话') + '」将无法恢复',
      confirmText: '删除',
      confirmColor: '#b71c1c',
      success: (r) => {
        if (!r.confirm) return;
        let sessions = this.data.sessions.filter((s) => s.id !== id);
        if (!sessions.length) {
          sessions = [defaultSession(this.data.currentModel)];
        }
        let activeId = this.data.activeSessionId;
        if (id === activeId) {
          activeId = sessions[0].id;
          const target = sessions.find((s) => s.id === activeId);
          this.setData({
            sessions,
            activeSessionId: activeId,
            messages: target.messages,
            currentModel: target.model || 'llama3',
            modelIndex: MODELS.findIndex((m) => m.key === (target.model || 'llama3'))
          }, () => this._refreshSessionViews());
        } else {
          this.setData({ sessions }, () => this._refreshSessionViews());
        }
        saveSessions(sessions, activeId);
      }
    });
  },

  /** 长按消息 */
  onMsgLongPress(e) {
    const idx = e.currentTarget.dataset.idx;
    const msg = this.data.messages[idx];
    if (!msg) return;
    util.vibrate('short');
    const items = ['📋 复制内容'];
    const ops = ['copy'];
    if (msg.role === 'user') { items.push('🔄 重新发送'); ops.push('resend'); }
    if (msg.role === 'assistant' && idx === this.data.messages.length - 1 && !this.data.sending) {
      items.push('🔄 重新生成'); ops.push('regen');
    }
    items.push('🗑 删除本条'); ops.push('delete');
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const op = ops[res.tapIndex];
        if (op === 'copy') util.copyText(msg.content);
        else if (op === 'resend') this.setData({ query: msg.content });
        else if (op === 'regen') {
          for (let i = idx - 1; i >= 0; i--) {
            if (this.data.messages[i].role === 'user') {
              this.setData({ query: this.data.messages[i].content }, () => this.onSend());
              break;
            }
          }
        } else if (op === 'delete') {
          const messages = this.data.messages.slice();
          messages.splice(idx, 1);
          this.setData({ messages });
          this._updateCurrentSession({ messages });
        }
      }
    });
  },

  /** 清空当前会话 */
  onClearHistory() {
    wx.showModal({
      title: '清空当前对话？',
      content: '将清空页面上显示的对话，服务器历史不会被删除。',
      success: (r) => {
        if (!r.confirm) return;
        this.setData({ messages: [WELCOME] });
        this._updateCurrentSession({ messages: [WELCOME] });
        util.vibrate('warning');
      }
    });
  },

  onNewChat() {
    this.onNewSession();
  },

  onAbout() {
    wx.showModal({
      title: '关于小兰助手',
      content: '小兰助手基于本地大模型（Ollama），支持切换多种 LLM。\n当前模型：' + (MODELS[this.data.modelIndex].label) + '\n如果回答慢，请确认 Ollama 已启动。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '和小兰聊一聊兰州的故事',
      path: '/pages/ai/ai'
    });
  }
});