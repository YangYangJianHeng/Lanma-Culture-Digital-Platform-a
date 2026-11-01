const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const util = require('../../utils/util.js');

Page({
  data: {
    foods: [],
    categories: ['全部', '面食', '小吃', '正餐', '饮品', '特产'],
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
      let list = (await api.foods.list(params)) || [];
      if (this.data.showFavOnly) {
        const ids = this.data.favorites.map((f) => f.id);
        list = list.filter((it) => ids.includes(it.id));
      }
      this.setData({ foods: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  refreshFavList() {
    this.setData({ favorites: fav.list('food') });
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
    api.foods.detail(id).then((item) => {
      this.setData({ detail: item, detailFav: fav.isFavorited('food', id) });
    }).catch(() => {});
  },

  closeDetail() { this.setData({ detail: null }); },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    util.vibrate('short');
    const detail = this.data.detail || {};
    const added = fav.toggle('food', detail);
    this.setData({ detailFav: added });
    wx.showToast({ title: added ? '已收藏 ⭐' : '已取消收藏', icon: 'none' });
    this.refreshFavList();
  },

  onPreviewImage() {
    const imgs = this.data.images || [];
    const url = (this.data.detail && this.data.detail.image_url) || '';
    if (url) wx.previewImage({ urls: [url], current: url });
  },

  noop() {},

  onShareAppMessage() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: (d.name || '兰州美食') + ' · 兰马文化',
      path: '/pages/foods/foods',
      imageUrl: d.image_url || d.thumbnail_url || ''
    });
  },

  onShareTimeline() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: '兰州味道 · ' + (d.name || '美食推荐'),
      imageUrl: d.image_url || d.thumbnail_url || ''
    });
  }
});