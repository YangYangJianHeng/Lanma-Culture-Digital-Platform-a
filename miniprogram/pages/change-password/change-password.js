const api = require('../../utils/api.js');

Page({
  data: {
    form: { old_password: '', new_password: '', confirm: '' },
    submitting: false
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async onSubmit() {
    const { old_password, new_password, confirm } = this.data.form;
    if (!old_password) return wx.showToast({ title: '请输入原密码', icon: 'none' });
    if (!new_password || new_password.length < 6) return wx.showToast({ title: '新密码至少 6 位', icon: 'none' });
    if (new_password !== confirm) return wx.showToast({ title: '两次新密码不一致', icon: 'none' });
    if (old_password === new_password) return wx.showToast({ title: '新密码不能与原密码相同', icon: 'none' });

    this.setData({ submitting: true });
    try {
      await api.auth.updatePassword(old_password, new_password);
      wx.showToast({ title: '修改成功，请重新登录', icon: 'success' });
      setTimeout(() => {
        wx.removeStorageSync('lanma_token');
        wx.removeStorageSync('lanma_user');
        wx.reLaunch({ url: '/pages/login/login' });
      }, 800);
    } finally {
      this.setData({ submitting: false });
    }
  }
});