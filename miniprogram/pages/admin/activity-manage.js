const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已发布' },
  { key: 'rejected', label: '已驳回' },
  { key: 'closed', label: '已关闭' }
];

Page({
  data: {
    tabs: STATUS_TABS,
    activeTab: 'pending',
    items: [],
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20, total: 0 }
  },

  onLoad() { this.load(true); },
  onPullDownRefresh() { this.load(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { if (!this.data.finished && !this.data.loading) this.load(false); },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.load(true);
  },

  async load(reset) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = reset ? 1 : this.data.pager.page;
    const status = this.data.activeTab;
    try {
      const data = await api.adminSocial.listActivities({ page, limit: this.data.pager.limit, status });
      const items = (data && data.items) || [];
      const merged = reset ? items : this.data.items.concat(items);
      this.setData({
        items: merged,
        loading: false,
        finished: items.length < this.data.pager.limit,
        pager: { ...this.data.pager, page: page + 1, total: (data && data.total) || 0 }
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  formatTime(t) {
    if (!t) return '-';
    return String(t).replace('T', ' ').slice(0, 16);
  },

  formatStatus(s) {
    return ({
      pending: '待审核', approved: '已发布', rejected: '已驳回', closed: '已关闭'
    })[s] || s;
  },

  async onReview(e) {
    const { id, action } = e.currentTarget.dataset;
    if (!id || !action) return;
    const isApprove = action === 'approve';
    wx.showModal({
      title: isApprove ? '通过审核' : '驳回审核',
      editable: !isApprove,
      placeholderText: !isApprove ? '请填写驳回原因' : '',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.reviewActivity(id, {
            status: isApprove ? 'approved' : 'rejected',
            note: r.content || (isApprove ? '审核通过' : '不符合要求')
          });
          wx.showToast({ title: isApprove ? '已通过' : '已驳回', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  async onClose(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '关闭活动',
      content: '关闭后用户无法继续报名,确认关闭?',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.closeActivity(id);
          wx.showToast({ title: '已关闭', icon: 'success' });
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
      title: '删除活动',
      content: '删除后将无法恢复,确认删除?',
      confirmColor: '#ff4d4f',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.deleteActivity(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败:' + (e.message || '请先关闭'), icon: 'none' });
        }
      }
    });
  },

  async onShowRegistrations(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const list = await api.adminSocial.activityRegistrations(id);
      const summary = (list || []).slice(0, 10).map(r =>
        `• ${r.userName || r.user_name || '匿名'} (${r.status})${r.phone ? ' ' + r.phone : ''}`
      ).join('\n');
      wx.showModal({
        title: `报名名单(${list.length}人)`,
        content: summary || '暂无报名',
        showCancel: false,
        confirmText: '关闭'
      });
    } catch (e) {
      wx.showToast({ title: '获取失败', icon: 'none' });
    }
  }
});