const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const poster = require('../../utils/poster.js');
const util = require('../../utils/util.js');

const SORT_OPTIONS = [
  { key: 'year_desc', label: '年份倒序' },
  { key: 'year_asc', label: '年份正序' },
  { key: 'featured', label: '精选优先' }
];

Page({
  data: {
    medals: [],
    filter: '',
    sort: 'year_desc',
    sortOptions: SORT_OPTIONS,
    sortIndex: 0,
    loading: true,
    detail: null,
    detailFav: false,
    detailImageLoaded: false,
    years: []
  },

  onLoad() { this.load(); },
  onShow() { this.refreshFav(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  refreshFav() {
    if (this.data.detail) {
      this.setData({ detailFav: fav.isFavorited('medal', this.data.detail.id) });
    }
  },

  async load() {
    this.setData({ loading: true });
    try {
      const params = {};
      if (this.data.filter) params.featured = this.data.filter;
      const list = await api.medals.list(params) || [];
      const sorted = this.sortMedals(list, this.data.sort);
      const years = Array.from(new Set(sorted.map((m) => m.year))).filter((y) => y).sort((a, b) => b - a);
      this.setData({ medals: sorted, years, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  sortMedals(list, sort) {
    const arr = list.slice();
    if (sort === 'year_desc') {
      arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sort === 'year_asc') {
      arr.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else if (sort === 'featured') {
      arr.sort((a, b) => ((b.is_featured === 1 ? 1 : 0) - (a.is_featured === 1 ? 1 : 0)) || ((b.year || 0) - (a.year || 0)));
    }
    return arr;
  },

  onFilterTap(e) {
    const f = e.currentTarget.dataset.filter || '';
    this.setData({ filter: f });
    this.load();
  },

  onSortChange(e) {
    const idx = Number(e.detail.value);
    const sort = SORT_OPTIONS[idx] ? SORT_OPTIONS[idx].key : 'year_desc';
    this.setData({ sortIndex: idx, sort });
    this.setData({ medals: this.sortMedals(this.data.medals, sort) });
    util.vibrate('short');
  },

  onYearJump(e) {
    const year = e.currentTarget.dataset.year;
    if (!year) return;
    wx.showToast({ title: year + ' 年奖牌', icon: 'none' });
  },

  async openDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    // 立即打开骨架弹层
    this.setData({ detail: { id, name: '加载中...', year: '' }, detailFav: false, detailImageLoaded: false });
    try {
      const item = await api.medals.detail(id);
      const enriched = {
        ...item,
        imageUrl: item.thumbnail_url || item.image_url || ''
      };
      this.setData({
        detail: enriched,
        detailFav: fav.isFavorited('medal', id)
      });
    } catch (err) {
      wx.showToast({ title: '加载详情失败', icon: 'none' });
      this.setData({ detail: null });
    }
  },

  onDetailImageLoad() {
    this.setData({ detailImageLoaded: true });
  },

  closeDetail() {
    this.setData({ detail: null, detailImageLoaded: false });
  },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    util.vibrate('short');
    const detail = this.data.detail || {};
    const added = fav.toggle('medal', detail);
    this.setData({ detailFav: added });
    wx.showToast({ title: added ? '已收藏 ⭐' : '已取消收藏', icon: 'none' });
  },

  onPreviewImage() {
    const url = this.data.detail && this.data.detail.imageUrl;
    if (!url) return;
    wx.previewImage({ urls: [url], current: url });
  },

  onGeneratePoster(e) {
    const item = this.data.detail;
    if (!item) return;
    util.vibrate('short');
    wx.showLoading({ title: '生成中…' });
    poster.drawMedalPoster(item).then((path) => {
      wx.hideLoading();
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: () => wx.showToast({ title: '请允许保存到相册', icon: 'none' })
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
    });
  },

  noop() {},

  onShareAppMessage() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: (d.name || '兰马奖牌') + (d.year ? ' · ' + d.year + ' 年' : ''),
      path: '/pages/medals/medals'
    });
  }
});