const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    activity: null,
    registrations: [],
    invites: [],
    joined: false,
    phone: '',
    loading: true,
  },

  onLoad(opts) {
    this.setData({ id: opts.id });
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      const act = await api.activities.detail(this.data.id);
      const regs = await api.activities.registrations(this.data.id);
      const invites = await api.invites.list('activity', this.data.id);
      this.setData({
        activity: act,
        registrations: regs,
        invites: invites || [],
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  formatPace(s) {
    if (!s || s <= 0) return '--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}'${String(sec).padStart(2, '0')}"`;
  },

  formatTime(t) {
    if (!t) return '';
    return String(t).replace('T', ' ').slice(0, 16);
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  async onRegister() {
    if (!util.ensureLogin()) return;
    if (!this.data.activity) return;
    const max = this.data.activity.capacity || 999;
    const cnt = this.data.activity.registeredCount || this.data.activity.registered_count || 0;
    if (cnt >= max) {
      wx.showToast({ title: '活动名额已满', icon: 'none' });
      return;
    }
    try {
      await api.activities.register(this.data.id, this.data.phone);
      wx.showToast({ title: '报名成功', icon: 'success' });
      util.vibrate('success');
      this.load();
    } catch (e) {
      wx.showToast({ title: '报名失败:' + (e.message || ''), icon: 'none' });
    }
  },

  async onUnregister() {
    wx.showModal({
      title: '取消报名',
      content: '确认取消本次活动报名?',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.activities.unregister(this.data.id);
          wx.showToast({ title: '已取消', icon: 'success' });
          this.load();
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  async onCreateInvite() {
    if (!this.data.activity) return;
    try {
      const inv = await api.invites.create({
        scope_type: 'activity',
        scope_id: this.data.id,
        scope_name: this.data.activity.title,
        max_uses: 20,
        valid_days: 7
      });
      this.setData({ invites: [inv].concat(this.data.invites) });
      wx.showModal({
        title: '已生成邀请码',
        content: inv.code,
        showCancel: false,
        confirmText: '复制',
        success: (r) => {
          if (r.confirm) util.copyText(inv.code, '已复制');
        }
      });
    } catch (e) {
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  async onCopyCode(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    util.copyText(code, '邀请码已复制');
  },

  async onDeactivate(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      await api.invites.deactivate(id);
      wx.showToast({ title: '已停用', icon: 'success' });
      this.load();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    const a = this.data.activity;
    return util.shareConfig({
      title: a ? a.title : '一起跑约跑',
      path: '/pages/activities/activity-detail?id=' + this.data.id
    });
  }
});