const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    form: {
      title: '',
      location: '',
      startTime: '',
      paceRange: '5:00\'-6:00\'',
      distanceKm: '',
      capacity: '',
      contactPhone: '',
      description: ''
    },
    submitting: false,
  },

  onLoad() {
    if (!util.ensureLogin()) {
      wx.navigateBack();
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onChooseTime(e) {
    this.setData({ 'form.startTime': e.detail.value });
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location': res.address ? (res.address + ' ' + (res.name || '')) : res.name || ''
        });
      },
      fail: () => {
        wx.showToast({ title: '取消选择', icon: 'none' });
      }
    });
  },

  async onSubmit() {
    const f = this.data.form;
    if (!f.title || !f.title.trim()) return wx.showToast({ title: '请填写活动主题', icon: 'none' });
    if (!f.location) return wx.showToast({ title: '请选择集合点', icon: 'none' });
    if (!f.startTime) return wx.showToast({ title: '请选择开始时间', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const payload = {
        title: f.title.trim(),
        location: f.location,
        startTime: f.startTime,
        paceRange: f.paceRange,
        distanceKm: f.distanceKm ? parseFloat(f.distanceKm) : null,
        capacity: f.capacity ? parseInt(f.capacity) : null,
        contactPhone: f.contactPhone,
        description: f.description
      };
      const a = await api.activities.create(payload);
      wx.showToast({ title: '已提交,等待审核', icon: 'success' });
      util.vibrate('success');
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/activities/activity-detail?id=' + a.id });
      }, 800);
    } catch (e) {
      wx.showToast({ title: '提交失败:' + (e.message || ''), icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});