const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const util = require('../../utils/util.js');

Page({
  data: {
    spots: [],
    categories: ['全部', '自然景观', '历史文化', '公园', '博物馆', '地标建筑'],
    activeCat: '全部',
    loading: true,
    detail: null,
    detailFav: false,
    showFavOnly: false,
    favorites: []
  },

  onLoad() { this.load(); },
  onShow() { this.refreshFavList(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const params = this.data.activeCat !== '全部' ? { category: this.data.activeCat } : null;
      let list = (await api.tourism.list(params)) || [];
      if (this.data.showFavOnly) {
        const ids = this.data.favorites.map((f) => f.id);
        list = list.filter((it) => ids.includes(it.id));
      }
      this.setData({ spots: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  refreshFavList() {
    this.setData({ favorites: fav.list('tourism') });
  },

  onCatTap(e) {
    const cat = e.currentTarget.dataset.cat;
    if (cat === this.data.activeCat) return;
    util.vibrate('short');
    this.setData({ activeCat: cat });
    this.load();
  },

  onToggleFavFilter() {
    this.setData({ showFavOnly: !this.data.showFavOnly });
    this.load();
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    api.tourism.detail(id).then((item) => {
      this.setData({ detail: item, detailFav: fav.isFavorited('tourism', id) });
    }).catch(() => {});
  },

  closeDetail() { this.setData({ detail: null }); },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    util.vibrate('short');
    const detail = this.data.detail || {};
    const added = fav.toggle('tourism', detail);
    this.setData({ detailFav: added });
    wx.showToast({ title: added ? '已收藏 ⭐' : '已取消收藏', icon: 'none' });
    this.refreshFavList();
  },

  openMap(e) {
    const { lat, lng, name } = e.currentTarget.dataset;
    if (!lat || !lng) return wx.showToast({ title: '暂无坐标', icon: 'none' });
    util.vibrate('short');
    wx.openLocation({
      latitude: Number(lat),
      longitude: Number(lng),
      name: name || '景点',
      scale: 16
    });
  },

  noop() {},

  onShareAppMessage() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: (d.name || '兰州景点') + ' · 兰马文化',
      path: '/pages/tourism/tourism',
      imageUrl: d.image_url || d.thumbnail_url || ''
    });
  },

  onShareTimeline() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: '兰州游玩 · ' + (d.name || '景点推荐'),
      imageUrl: d.image_url || d.thumbnail_url || ''
    });
  }
});