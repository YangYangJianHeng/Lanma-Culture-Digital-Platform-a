const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    form: {
      name: '',
      slogan: '',
      description: '',
      city: '兰州',
      baseLocation: '',
    },
    submitting: false
  },

  onLoad() {
    if (!util.ensureLogin()) wx.navigateBack();
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onChooseCity() {
    wx.showModal({
      title: '选择城市',
      editable: true,
      placeholderText: '请输入城市名称',
      content: this.data.form.city,
      success: (res) => {
        if (res.confirm && res.content) this.setData({ 'form.city': res.content });
      }
    });
  },

  onChooseBaseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ 'form.baseLocation': res.address || res.name || '' });
      },
      fail: () => wx.showToast({ title: '取消选择', icon: 'none' })
    });
  },

  async onSubmit() {
    const f = this.data.form;
    if (!f.name || !f.name.trim()) return wx.showToast({ title: '请填写团名', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const t = await api.teams.create({
        name: f.name.trim(),
        slogan: f.slogan,
        description: f.description,
        city: f.city,
        baseLocation: f.baseLocation
      });
      wx.showToast({ title: '已提交,待审核', icon: 'success' });
      util.vibrate('success');
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/teams/team-detail?id=' + t.id });
      }, 800);
    } catch (e) {
      wx.showToast({ title: '提交失败:' + (e.message || ''), icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});