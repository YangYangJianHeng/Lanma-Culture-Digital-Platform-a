// app.js - 小程序入口
const auth = require('./utils/auth.js');

App({
  globalData: {
    // 后端 API 基础地址，开发时请根据实际情况修改
    // 个人电脑/局域网调试：填 http://你的内网IP:3000
    // 在微信开发者工具中需勾选"不校验合法域名"
    apiBase: 'http://localhost:3000',
    // 当前登录用户信息（缓存）
    userInfo: null,
    systemInfo: null
  },

  onLaunch() {
    // 读取本地缓存的 token
    const token = auth.getToken();
    if (token) {
      // 异步拉取最新用户信息（不阻塞首屏）
      this.fetchUserInfo();
    }
    // 读取设备信息（用于 rpx 计算等）
    try {
      const sys = wx.getSystemInfoSync();
      this.globalData.systemInfo = sys;
    } catch (e) {
      console.warn('[app] 获取系统信息失败', e);
    }
  },

  /** 拉取当前登录用户资料 */
  fetchUserInfo() {
    auth.getMe().then((u) => {
      this.globalData.userInfo = u;
    }).catch((e) => {
      console.warn('[app] 拉取用户信息失败', e);
      // token 失效时清除
      if (e && (e.statusCode === 401 || e.statusCode === 403)) {
        auth.clearAuth();
      }
    });
  }
});
