const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    form: { username: '', email: '', occupation: '', age: '', gender: 'unknown' },
    avatarUrl: '',
    submitting: false
  },

  onLoad() {
    const cached = wx.getStorageSync('lanma_user') || {};
    this.setData({
      form: {
        username: cached.username || '',
        email: cached.email || '',
        occupation: cached.occupation || '',
        age: cached.age || '',
        gender: cached.gender || 'unknown'
      },
      avatarUrl: cached.avatarUrl || cached.avatar_url || ''
    });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onGenderChange(e) {
    this.setData({ 'form.gender': e.detail.value });
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        wx.showLoading({ title: '上传中...' });
        try {
          const url = await api.upload(file.tempFilePath);
          this.setData({ avatarUrl: url });
        } catch (e) {} finally {
          wx.hideLoading();
        }
      }
    });
  },

  async onSubmit() {
    const { username, email, occupation, age, gender } = this.data.form;
    if (!username) return wx.showToast({ title: '请输入用户名', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const payload = {
        username,
        avatar_url: this.data.avatarUrl,
        occupation,
        gender,
        age: age === '' ? null : Number(age)
      };
      const fresh = await api.auth.updateProfile(payload);
      wx.setStorageSync('lanma_user', fresh);
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } finally {
      this.setData({ submitting: false });
    }
  }
});