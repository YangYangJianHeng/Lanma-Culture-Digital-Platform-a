const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const TABS = [
  { key: 'teams', label: '跑团列表' },
  { key: 'mine', label: '我的跑团' },
  { key: 'ranking', label: '团战排行' }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'teams',
    items: [],
    ranking: [],
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20 }
  },

  onLoad() { this.load(true); },
  onShow() { if (this.data.items.length || this.data.ranking.length) this.load(true); },
  onPullDownRefresh() { this.load(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() {
    if (this.data.activeTab !== 'teams') return;
    if (!this.data.finished && !this.data.loading) this.load(false);
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.load(true);
  },

  async load(reset) {
    this.setData({ loading: true });
    try {
      if (this.data.activeTab === 'teams') {
        const page = reset ? 1 : this.data.pager.page;
        const data = await api.teams.list({ page, limit: this.data.pager.limit });
        const items = (data && data.items) || [];
        this.setData({
          items: reset ? items : this.data.items.concat(items),
          ranking: [],
          loading: false,
          finished: items.length < this.data.pager.limit,
          pager: { ...this.data.pager, page: page + 1 }
        });
      } else if (this.data.activeTab === 'mine') {
        const data = await api.teams.mine();
        const arr = (data && data.items) || (Array.isArray(data) ? data : []);
        this.setData({ items: arr, ranking: [], loading: false, finished: true });
      } else if (this.data.activeTab === 'ranking') {
        const data = await api.teams.ranking(20);
        const arr = (data && data.items) || (Array.isArray(data) ? data : []);
        this.setData({ ranking: arr, items: [], loading: false, finished: true });
      }
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/teams/team-detail?id=' + id });
  },

  goCreate() {
    if (!util.ensureLogin()) return;
    wx.navigateTo({ url: '/pages/teams/team-create' });
  },

  goInvite() {
    if (!util.ensureLogin()) return;
    wx.navigateTo({ url: '/pages/invite-join/invite-join' });
  },

  goDynamic(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/teams/team-detail?id=' + id + '&tab=dynamics' });
  }
});