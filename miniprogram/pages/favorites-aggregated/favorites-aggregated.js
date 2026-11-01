const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const util = require('../../utils/util.js');

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '🍜 美食' },
  { key: 'tourism', label: '🗺 旅游' },
  { key: 'landmark', label: '📍 地标' },
  { key: 'medal', label: '🏅 奖牌' }
];

const TYPE_PAGE = {
  food: '/pages/foods/foods',
  tourism: '/pages/tourism/tourism',
  landmark: '/pages/landmarks/landmarks',
  medal: '/pages/medals/medals'
};

Page({
  data: {
    tabs: TABS,
    activeTab: 'all',
    allFavs: [],   // 全部收藏(按时间倒序)
    list: [],
    counts: { all: 0, food: 0, tourism: 0, landmark: 0, medal: 0 },
    loading: true
  },

  onLoad() {
    this.loadAll();
  },

  onShow() { this.loadAll(); },
  onPullDownRefresh() { this.loadAll().then(() => wx.stopPullDownRefresh()); },

  async loadAll() {
    this.setData({ loading: true });
    try {
      // 拉取各种类别的元数据以补全信息
      const [foods, tourisms, landmarks, medals] = await Promise.all([
        api.foods.list().catch(() => []),
        api.tourism.list().catch(() => []),
        api.landmarks.list().catch(() => []),
        api.medals.list().catch(() => [])
      ]);

      // 用后端数据 + 本地收藏 key 拼装
      const collected = [];
      const map = {
        food: new Map(foods.map((it) => [it.id, it])),
        tourism: new Map(tourisms.map((it) => [it.id, it])),
        landmark: new Map(landmarks.map((it) => [it.id, it])),
        medal: new Map(medals.map((it) => [it.id, it]))
      };

      TABS.forEach((t) => {
        if (t.key === 'all') return;
        const list = fav.list(t.key);
        list.forEach((c) => {
          const full = map[t.key].get(c.id) || {};
          collected.push({
            type: t.key,
            id: c.id,
            name: c.name || full.name || ('收藏 #' + c.id),
            image: c.image || full.cover_image || full.thumbnail_url || full.image_url || '',
            meta: t.label.replace(/^[^\s]+\s/, ''),
            addedAt: c.addedAt
          });
        });
      });

      collected.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

      const counts = { all: collected.length, food: 0, tourism: 0, landmark: 0, medal: 0 };
      collected.forEach((c) => counts[c.type]++);

      this.setData({ allFavs: collected, counts, loading: false }, () => this.applyTab());
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  applyTab() {
    const t = this.data.activeTab;
    const list = t === 'all' ? this.data.allFavs : this.data.allFavs.filter((it) => it.type === t);
    this.setData({ list });
  },

  onTabTap(e) {
    const k = e.currentTarget.dataset.key;
    if (k === this.data.activeTab) return;
    util.vibrate('short');
    this.setData({ activeTab: k }, () => this.applyTab());
  },

  goItem(e) {
    const { type, id } = e.currentTarget.dataset;
    if (!type || !id) return;
    util.vibrate('short');
    const page = TYPE_PAGE[type];
    if (!page) return;
    wx.navigateTo({ url: page + '?highlight=' + id });
  },

  onUnfav(e) {
    const { type, id } = e.currentTarget.dataset;
    util.vibrate('warning');
    wx.showModal({
      title: '取消收藏？',
      success: (r) => {
        if (r.confirm) {
          // 从全量列表中找(因为 list 可能因 tab 过滤而不完整)
          const item = this.data.allFavs.find((x) => x.type === type && String(x.id) === String(id));
          fav.toggle(type, Object.assign({}, item, { id }));
          this.loadAll();
        }
      }
    });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '我的兰马收藏夹 · 兰马文化',
      path: '/pages/favorites-aggregated/favorites-aggregated'
    });
  }
});