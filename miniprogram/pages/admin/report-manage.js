const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'handled', label: '已处理' },
  { key: 'dismissed', label: '驳回' },
  { key: 'ignored', label: '已忽略' }
];

const TARGET_TABS = [
  { key: 'all', label: '全部' },
  { key: 'story', label: '故事' },
  { key: 'comment', label: '评论' },
  { key: 'activity', label: '活动' },
  { key: 'team', label: '跑团' }
];

const REASON_LABELS = {
  spam: '垃圾广告',
  abuse: '辱骂攻击',
  porn: '色情低俗',
  illegal: '违法',
  other: '其他'
};

Page({
  data: {
    statusTabs: STATUS_TABS,
    targetTabs: TARGET_TABS,
    activeStatus: 'pending',
    activeTarget: 'all',
    items: [],
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20, total: 0 }
  },

  onLoad() { this.load(true); },
  onPullDownRefresh() { this.load(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { if (!this.data.finished && !this.data.loading) this.load(false); },

  switchStatus(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeStatus) return;
    this.setData({ activeStatus: key });
    this.load(true);
  },

  switchTarget(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTarget) return;
    this.setData({ activeTarget: key });
    this.load(true);
  },

  async load(reset) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = reset ? 1 : this.data.pager.page;
    try {
      const data = await api.adminSocial.listReports({
        page,
        limit: this.data.pager.limit,
        status: this.data.activeStatus,
        targetType: this.data.activeTarget
      });
      const list2 = (data && data.items) || [];
      const merged = reset ? list2 : this.data.items.concat(list2);
      this.setData({
        items: merged,
        loading: false,
        finished: list2.length < this.data.pager.limit,
        pager: { ...this.data.pager, page: page + 1, total: (data && data.total) || 0 }
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  reasonText(r) {
    return REASON_LABELS[r] || r;
  },

  targetText(t) {
    return ({ story: '故事', comment: '评论', activity: '活动', team: '跑团' })[t] || t;
  },

  async onHandle(e) {
    const { id, action } = e.currentTarget.dataset;
    if (!id || !action) return;
    const isWarn = action === 'warn';
    const isDelete = action === 'delete';
    const isBan = action === 'ban';

    let title = '';
    let noteDefault = '';
    if (isDelete) { title = '删除违规内容'; noteDefault = '已删除'; }
    else if (isWarn) { title = '记录警告'; noteDefault = '内容不当,已警告作者'; }
    else if (isBan) { title = '封禁用户'; noteDefault = '严重违规,已记录封禁请求'; }

    wx.showModal({
      title,
      editable: true,
      placeholderText: '请填写处理备注',
      content: noteDefault,
      success: async (r) => {
        if (!r.confirm) return;
        const note = r.content || noteDefault;
        try {
          await api.adminSocial.handleReport(id, { action, note });
          wx.showToast({ title: '处理完成', icon: 'success' });
          this.load(true);

          // 联动封禁用户时,顺手调用 warn/ban 接口
          if (isWarn || isBan) {
            const item = this.data.items.find(it => it.id === id);
            if (item) {
              try {
                if (isWarn) await api.adminSocial.warnUser({ user_id: item.userId || item.user_id, reason: note });
                if (isBan) await api.adminSocial.banUser({ user_id: item.userId || item.user_id, reason: note });
              } catch (e) { /* 联动失败不影响主流程 */ }
            }
          }
        } catch (e) {
          wx.showToast({ title: '处理失败', icon: 'none' });
        }
      }
    });
  },

  async onIgnore(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '忽略此举报',
      editable: true,
      placeholderText: '可填写忽略原因',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.ignoreReport(id, r.content || '');
          wx.showToast({ title: '已忽略', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '删除举报记录',
      content: '将永久删除该条举报,确认操作?',
      confirmColor: '#ff4d4f',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.deleteReport(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  }
});