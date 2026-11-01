const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    code: '',
    resolved: null,
    submitting: false,
    errMsg: ''
  },

  onLoad(opts) {
    // 支持扫码进入:invite-join?code=ABC12345
    if (opts && opts.code) this.setData({ code: opts.code.toUpperCase() });
  },

  onInput(e) {
    this.setData({ code: (e.detail.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) });
  },

  onScan() {
    if (!wx.scanCode) return wx.showToast({ title: '当前环境不支持扫码', icon: 'none' });
    wx.scanCode({
      success: (res) => {
        // 允许邀请码嵌入 URL:?code=ABC12345 或纯字符串
        let code = res.result;
        try {
          const u = new URL(res.result);
          code = u.searchParams.get('code') || res.result;
        } catch (e) { /* 非 URL */ }
        this.setData({ code: code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) });
      },
      fail: () => wx.showToast({ title: '已取消扫码', icon: 'none' })
    });
  },

  async onResolve() {
    if (!util.ensureLogin()) return;
    const c = (this.data.code || '').trim();
    if (c.length < 6) return wx.showToast({ title: '请输入有效的邀请码', icon: 'none' });
    this.setData({ submitting: true, errMsg: '', resolved: null });
    try {
      const r = await api.invites.resolve(c);
      this.setData({ resolved: r, submitting: false });
      util.vibrate('success');
      wx.showToast({
        title: r.joined ? '兑换成功' : '兑换成功,但需手动确认',
        icon: 'success'
      });
    } catch (e) {
      this.setData({
        submitting: false,
        errMsg: e.message || '邀请码无效或已失效'
      });
      util.vibrate('warning');
    }
  },

  goToScope() {
    const r = this.data.resolved;
    if (!r) return;
    if (r.scope_type === 'team') {
      wx.redirectTo({ url: '/pages/teams/team-detail?id=' + r.scope_id });
    } else if (r.scope_type === 'activity') {
      wx.redirectTo({ url: '/pages/activities/activity-detail?id=' + r.scope_id });
    }
  },

  onReset() {
    this.setData({ code: '', resolved: null, errMsg: '' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '一起跑 · 跑团邀请码',
      path: '/pages/invite-join/invite-join'
    });
  }
});