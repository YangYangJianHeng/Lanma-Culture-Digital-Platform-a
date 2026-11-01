const auth = require('../../utils/auth.js');

Page({
  data: {
    form: {
      username: '',
      password: '',
      confirm: '',
      email: '',
      occupation: ''
    },
    submitting: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async onSubmit() {
    const { username, password, confirm, email, occupation } = this.data.form;
    if (!username) return wx.showToast({ title: '请输入用户名', icon: 'none' });
    if (!password || password.length < 6) return wx.showToast({ title: '密码至少6位', icon: 'none' });
    if (password !== confirm) return wx.showToast({ title: '两次密码不一致', icon: 'none' });

    this.setData({ submitting: true });
    try {
      await auth.doRegister({ username, password, email, occupation });
      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 600);
    } catch (e) {} finally {
      this.setData({ submitting: false });
    }
  }
});
