// utils/util.js - 通用工具

/** 将相对路径转为完整 URL（用于图片） */
function resolveImage(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const app = getApp();
  const base = app && app.globalData ? app.globalData.apiBase : '';
  if (!base) return url;
  if (url.startsWith('/')) return base + url;
  return base + '/' + url;
}

/** 格式化日期时间 */
function formatDate(value, withTime = true) {
  if (!value) return '';
  // 支持 ISO 字符串或时间戳
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (isNaN(d.getTime())) return String(value);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (!withTime) return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 相对时间 */
function relativeTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 604800) return Math.floor(diff / 86400) + '天前';
  return formatDate(value, false);
}

/** 计算距离开幕天数 */
function daysUntil(targetDate) {
  const target = new Date(targetDate).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/** 防抖 */
function debounce(fn, wait = 300) {
  let timer = null;
  return function () {
    const args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** 节流 */
function throttle(fn, gap = 500) {
  let last = 0;
  return function () {
    const now = Date.now();
    if (now - last >= gap) {
      last = now;
      fn.apply(this, arguments);
    }
  };
}

/** 分页加载合并 */
function pager() {
  return { page: 1, limit: 12, total: 0, finished: false, loading: false };
}

async function loadList(apiFn, params, pagerObj, onData) {
  if (pagerObj.loading || pagerObj.finished) return;
  pagerObj.loading = true;
  try {
    const data = await apiFn(Object.assign({}, params, { page: pagerObj.page, limit: pagerObj.limit }));
    if (!data) return;
    const items = data.items || [];
    pagerObj.total = data.total || 0;
    onData(items, data);
    if (items.length === 0 || pagerObj.page * pagerObj.limit >= pagerObj.total) {
      pagerObj.finished = true;
    } else {
      pagerObj.page += 1;
    }
  } finally {
    pagerObj.loading = false;
  }
}

/** 校验登录态，未登录则跳转登录页并返回 false */
function ensureLogin() {
  if (!wx.getStorageSync('lanma_token')) {
    wx.navigateTo({ url: '/pages/login/login' });
    return false;
  }
  return true;
}

/**
 * 轻震动反馈
 * @param {'short'|'long'|'success'|'warning'} type
 */
function vibrate(type) {
  try {
    if (type === 'success') {
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(() => wx.vibrateShort({ type: 'light' }), 80);
    } else if (type === 'warning') {
      wx.vibrateShort({ type: 'medium' });
    } else if (type === 'long') {
      wx.vibrateLong();
    } else {
      wx.vibrateShort({ type: 'light' });
    }
  } catch (e) { /* 部分设备不支持 */ }
}

/**
 * 复制到剪贴板（带提示）
 */
function copyText(text, tip = '已复制') {
  if (!text) return;
  wx.setClipboardData({
    data: String(text),
    success: () => wx.showToast({ title: tip, icon: 'none' }),
    fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
  });
}

/**
 * 统一分享配置（供 onShareAppMessage 直接返回）
 */
function shareConfig({ title = '兰马文化数字平台', path = '/pages/index/index', imageUrl = '' } = {}) {
  const payload = { title, path };
  if (imageUrl) payload.imageUrl = imageUrl;
  return payload;
}

/**
 * 把 Markdown / 简单富文本（含 \n 换行）解析为 nodes 数组，
 * 供 rich-text 使用：[{ name: 'p', children: [{ text: 'xxx' }] }]
 */
function plainToRichText(text) {
  if (!text) return [];
  const lines = String(text).split(/\n+/);
  return lines
    .filter((l) => l.length > 0)
    .map((l) => ({ name: 'p', attrs: { class: 'rt-line' }, children: [{ text: l }] }));
}

/**
 * 简易深度克隆（用于表单 / 编辑）
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);
  const o = {};
  for (const k in obj) o[k] = deepClone(obj[k]);
  return o;
}

/**
 * 把数字格式化为带单位的字符串（>=10000 显示 1.2 万）
 */
function formatCount(n) {
  if (n == null || isNaN(n)) return '0';
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
}

/**
 * 计算两个日期之间的天数差（向上取整）
 */
function diffDays(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * 取文本的预览（前 N 个字符）
 */
function previewText(text, n = 50) {
  if (!text) return '';
  const s = String(text).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '...' : s;
}

module.exports = {
  resolveImage,
  formatDate,
  relativeTime,
  daysUntil,
  debounce,
  throttle,
  pager,
  loadList,
  ensureLogin,
  vibrate,
  copyText,
  shareConfig,
  plainToRichText,
  deepClone,
  formatCount,
  diffDays,
  previewText
};