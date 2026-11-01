const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const TABS = [
  { key: 'approved', label: '全部活动' },
  { key: 'mine', label: '我参与的' },
  { key: 'open', label: '正在招募' }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'approved',
    items: [],
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20 }
  },

  onLoad() { this.load(true); },
  onShow() { if (this.data.items.length) this.load(true); },
  onPullDownRefresh() { this.load(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { if (!this.data.finished && !this.data.loading) this.load(false); },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.load(true);
  },

  async load(reset) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = reset ? 1 : this.data.pager.page;
    try {
      let data;
      if (this.data.activeTab === 'mine') {
        data = await api.activities.mine();
        const arr = (data && data.items) || (Array.isArray(data) ? data : []);
        this.setData({ items: arr, loading: false, finished: true });
      } else {
        const params = { page, limit: this.data.pager.limit, status: this.data.activeTab };
        data = await api.activities.list(params);
        const arr = (data && data.items) || [];
        this.setData({
          items: reset ? arr : this.data.items.concat(arr),
          loading: false,
          finished: arr.length < this.data.pager.limit,
          pager: { ...this.data.pager, page: page + 1 }
        });
      }
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/activities/activity-detail?id=' + id });
  },

  goCreate() {
    if (!util.ensureLogin()) return;
    wx.navigateTo({ url: '/pages/activities/activity-create' });
  },

  formatPace(s) {
    if (!s || s <= 0) return '--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}'${String(sec).padStart(2, '0')}"`;
  },

  formatTime(t) {
    if (!t) return '';
    return String(t).replace('T', ' ').slice(0, 16);
  }
});