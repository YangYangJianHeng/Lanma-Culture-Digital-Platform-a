const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

/**
 * 社交功能管理 - 仪表盘
 * - 校验当前用户 role === 'admin'(否则显示"无权限"提示)
 * - 展示活动/跑团/举报的统计概览
 * - 4 个快捷入口:活动审核 / 跑团管理 / 举报处理 / 榜单权重
 */
Page({
  data: {
    authorized: false,
    user: null,
    stats: { activity: {}, team: {}, report: {} },
    loading: true,
    lastSyncAt: ''
  },

  onLoad() { this.check(); },
  onShow() { if (this.data.authorized) this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  check() {
    const user = wx.getStorageSync('lanma_user') || null;
    const authorized = !!(user && user.role === 'admin');
    this.setData({ user, authorized });
    if (!authorized) {
      wx.showModal({
        title: '无访问权限',
        content: '仅管理员可访问社交功能管理后台,请确认账号角色。',
        showCancel: false,
        confirmText: '我知道了'
      });
    } else {
      this.load();
    }
  },

  async load() {
    this.setData({ loading: true });
    try {
      const data = await api.adminSocial.stats();
      this.setData({ stats: data || {}, lastSyncAt: new Date().toLocaleTimeString(), loading: false });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  go(e) {
    const page = e.currentTarget.dataset.page;
    if (!page) return;
    wx.navigateTo({ url: '/pages/admin/' + page + '/' + page });
  }
});