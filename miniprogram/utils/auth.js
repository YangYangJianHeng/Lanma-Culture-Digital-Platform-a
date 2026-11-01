// utils/auth.js - Token 与用户信息持久化
const TOKEN_KEY = 'lanma_token';
const USER_KEY = 'lanma_user';

function saveAuth(token, user) {
  wx.setStorageSync(TOKEN_KEY, token);
  if (user) wx.setStorageSync(USER_KEY, user);
}

function clearAuth() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_KEY);
}

function getToken() { return wx.getStorageSync(TOKEN_KEY) || ''; }

function getCachedUser() { return wx.getStorageSync(USER_KEY) || null; }

function isLoggedIn() { return !!getToken(); }

async function getMe() {
  const api = require('./api.js');
  const user = await api.auth.me();
  wx.setStorageSync(USER_KEY, user);
  return user;
}

async function doLogin(username, password) {
  const api = require('./api.js');
  const data = await api.auth.login(username, password);
  // data: { token, user }
  if (data && data.token) {
    saveAuth(data.token, data.user);
    const app = getApp();
    if (app && app.globalData) app.globalData.userInfo = data.user;
  }
  return data;
}

async function doRegister(payload) {
  const api = require('./api.js');
  const data = await api.auth.register(payload);
  if (data && data.token) {
    saveAuth(data.token, data.user);
    const app = getApp();
    if (app && app.globalData) app.globalData.userInfo = data.user;
  }
  return data;
}

async function doLogout() {
  const api = require('./api.js');
  try { await api.auth.logout(); } catch (e) { /* token 可能已过期 */ }
  clearAuth();
  const app = getApp();
  if (app && app.globalData) app.globalData.userInfo = null;
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  saveAuth,
  clearAuth,
  getToken,
  getCachedUser,
  isLoggedIn,
  getMe,
  doLogin,
  doRegister,
  doLogout
};
