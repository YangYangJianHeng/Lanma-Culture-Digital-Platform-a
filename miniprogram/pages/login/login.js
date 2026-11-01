const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');
const util = require('../../utils/util.js');

const REMEMBER_KEY = 'lanma_login_remember';

Page({
  data: {
    form: { username: '', password: '' },
    submitting: false,
    remember: false,
    showPwd: false,
    canIUseWxLogin: false,
    wxProfile: null,  // 用户授权后的头像昵称
    showWxPanel: true,
    acceptAgreement: true,
    wxMode: 'auto'    // auto / fallback
  },

  onLoad() {
    const cache = wx.getStorageSync(REMEMBER_KEY);
    if (cache && cache.username) {
      this.setData({
        form: { username: cache.username, password: cache.password || '' },
        remember: true
      });
    }
    // 检测是否支持微信登录(基础库 2.10+)
    // #ifdef MP-WEIXIN
    this.setData({ canIUseWxLogin: typeof wx.login === 'function' });
    // #endif
  },

  onUsernameInput(e) {
    this.setData({ 'form.username': e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ 'form.password': e.detail.value });
  },

  onToggleShowPwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },

  onToggleRemember(e) {
    this.setData({ remember: e.detail.value });
    if (!e.detail.value) wx.removeStorageSync(REMEMBER_KEY);
  },

  onFillTest() {
    this.setData({ form: { username: 'testuser', password: 'test123' } });
    util.vibrate('short');
    wx.showToast({ title: '已填充测试账号', icon: 'none' });
  },

  onToggleAgreement(e) {
    this.setData({ acceptAgreement: e.detail.value });
  },

  async onSubmit() {
    if (!this.data.acceptAgreement) {
      wx.showToast({ title: '请先勾选用户协议', icon: 'none' });
      util.vibrate('warning');
      return;
    }
    const { username, password } = this.data.form;
    if (!username || !username.trim()) return wx.showToast({ title: '请输入用户名', icon: 'none' });
    if (!password || !password.trim()) return wx.showToast({ title: '请输入密码', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const res = await api.auth.login(username.trim(), password);
      const token = res.token || res.access_token || (res.data && res.data.token);
      const user = res.user || res.data || {};
      if (!token) {
        wx.showToast({ title: '登录失败：未返回令牌', icon: 'none' });
        util.vibrate('warning');
        return;
      }
      wx.setStorageSync('lanma_token', token);
      wx.setStorageSync('lanma_user', user);

      if (this.data.remember) {
        wx.setStorageSync(REMEMBER_KEY, { username: username.trim(), password });
      } else {
        wx.removeStorageSync(REMEMBER_KEY);
      }

      util.vibrate('success');
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.afterLogin();
    } catch (e) {
      util.vibrate('warning');
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 微信一键登录主流程:
   * 1) 用户点 "获取微信头像" 按钮  -> 触发 chooseAvatar(新版) / getUserProfile(旧版) 拿昵称头像
   * 2) 调用 wx.login 拿 code,结合 1 的昵称头像,请求后端 /api/v1/auth/wx-login
   * 3) 后端返回 token 后即登录成功
   *
   * 如果后端暂未提供 wx-login 接口,前端会尝试调用通用 wx-login 并 graceful fallback:
   *  使用昵称作为 username + 后端生成默认密码兜底登录。
   */
  onChooseWxAvatar(e) {
    const avatarUrl = (e && e.detail && e.detail.avatarUrl) || '';
    if (!avatarUrl) return;
    util.vibrate('short');
    this.setData({ 'wxProfile.avatarUrl': avatarUrl });
    // 头像选择后自动尝试获取昵称
    if (!this.data.wxProfile || !this.data.wxProfile.nickname) {
      this.fetchNickName();
    } else {
      this.doWxLogin();
    }
  },

  fetchNickName() {
    // 新版 chooseMedia 流程不再提供昵称字段,需要 button open-type="chooseAvatar"
    // 这里提供降级:提示用户补全昵称
    wx.showModal({
      title: '补全昵称',
      editable: true,
      placeholderText: '请输入你希望展示的昵称',
      success: (r) => {
        if (r.confirm && r.content) {
          this.setData({ 'wxProfile.nickname': r.content.trim() });
          this.doWxLogin();
        } else if (r.cancel) {
          // 用户拒绝,使用默认昵称
          this.setData({ 'wxProfile.nickname': '微信用户' });
          this.doWxLogin();
        }
      }
    });
  },

  async onNickNameInput(e) {
    this.setData({ 'wxProfile.nickname': e.detail.value });
  },

  /** 触发昵称输入(新版通过 button type="nickname" 触发) */
  onNicknameTap() {
    util.vibrate('short');
  },

  /** 真正发起微信登录 */
  async doWxLogin() {
    if (!this.data.wxProfile || !this.data.wxProfile.avatarUrl) {
      return wx.showToast({ title: '请先选择微信头像', icon: 'none' });
    }
    if (this.data.submitting) return;
    if (!this.data.acceptAgreement) {
      wx.showToast({ title: '请先勾选用户协议', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    util.vibrate('short');

    try {
      const code = await this.wxLoginCode();
      const nickname = this.data.wxProfile.nickname || '微信用户';
      const avatarUrl = this.data.wxProfile.avatarUrl;

      // 优先调用后端 wx-login
      let token = null;
      let user = null;
      try {
        const res = await api.auth.wxLogin({ code, nickname, avatarUrl });
        token = res && (res.token || res.access_token);
        user = res && (res.user || res.data);
      } catch (e) {
        // 后端未实现时,fallback:用昵称当 username 注册/登录
        try {
          token = await this.fallbackWxLogin(nickname, avatarUrl);
          user = wx.getStorageSync('lanma_user');
        } catch (e2) {
          util.vibrate('warning');
          wx.showToast({ title: '微信登录失败，请稍后重试', icon: 'none' });
          return;
        }
      }

      if (!token) {
        wx.showToast({ title: '登录失败', icon: 'none' });
        return;
      }
      wx.setStorageSync('lanma_token', token);
      if (user) wx.setStorageSync('lanma_user', user);

      util.vibrate('success');
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.afterLogin();
    } catch (e) {
      console.warn('[wxLogin]', e);
      util.vibrate('warning');
      wx.showToast({ title: '微信登录失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  wxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => res.code ? resolve(res.code) : reject(res),
        fail: reject
      });
    });
  },

  /** 后端未实现 wx-login 时的兜底:用昵称生成匿名账户 */
  async fallbackWxLogin(nickname, avatarUrl) {
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const username = 'wx_' + (nickname ? nickname.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 10) : 'user') + '_' + stamp;
    const password = 'wx@' + Math.random().toString(36).slice(2, 12);
    const email = stamp + '@wx.lanma';  // 唯一占位邮箱,后端 RegisterRequest 强制 @Email
    try {
      const data = await api.auth.register({ username, password, email, nickname, avatar_url: avatarUrl });
      return data && (data.token || (data.data && data.data.token));
    } catch (e) {
      // 注册失败(用户名冲突/邮箱冲突),尝试直接登录
      const data = await api.auth.login(username, password);
      return data && (data.token || (data.data && data.data.token));
    }
  },

  afterLogin() {
    setTimeout(() => {
      wx.navigateBack({ delta: 1, fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      } });
    }, 600);
  },

  goAgreement() {
    util.vibrate('short');
    wx.showModal({
      title: '用户协议与隐私',
      content: '兰马文化数字平台重视你的隐私,仅在必要范围内使用微信头像与昵称,不会上传通讯录与位置。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  goRegister() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/register/register' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '加入兰马文化数字平台',
      path: '/pages/login/login'
    });
  }
});