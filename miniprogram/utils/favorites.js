// utils/favorites.js - 收藏功能（本地缓存）
const KEY = 'lanma_favorites';

function getAll() {
  return wx.getStorageSync(KEY) || {};
}

/** 添加或取消收藏 */
function toggle(type, item) {
  if (!item || !item.id) return false;
  const all = getAll();
  const k = type + '_' + item.id;
  let added = false;
  if (all[k]) {
    delete all[k];
    added = false;
  } else {
    all[k] = {
      type,
      id: item.id,
      name: item.name,
      image: item.image_url || item.thumbnail_url || item.cover_image || '',
      addedAt: Date.now()
    };
    added = true;
  }
  wx.setStorageSync(KEY, all);
  return added;
}

/** 检查是否已收藏 */
function isFavorited(type, id) {
  const all = getAll();
  return !!all[type + '_' + id];
}

/** 获取指定类型的所有收藏 */
function list(type) {
  const all = getAll();
  return Object.keys(all)
    .filter((k) => k.startsWith(type + '_'))
    .map((k) => all[k])
    .sort((a, b) => b.addedAt - a.addedAt);
}

/** 清空某种类型收藏 */
function clear(type) {
  const all = getAll();
  Object.keys(all).forEach((k) => { if (k.startsWith(type + '_')) delete all[k]; });
  wx.setStorageSync(KEY, all);
}

module.exports = { getAll, toggle, isFavorited, list, clear };