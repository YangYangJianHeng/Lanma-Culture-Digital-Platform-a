const api = require('../../utils/api.js');
const subscribe = require('../../utils/subscribe.js');
const util = require('../../utils/util.js');

const SORTS = [
  { key: 'latest', label: '最新发布' },
  { key: 'hottest', label: '最多点赞' },
  { key: 'oldest', label: '最早发布' }
];

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

const TOPICS = [
  { key: 'first', label: '首马', icon: '🎽', q: '首马' },
  { key: 'pb', label: 'PB 故事', icon: '🏆', q: 'PB' },
  { key: 'training', label: '训练日常', icon: '🛤', q: '训练' },
  { key: 'volunteer', label: '志愿者', icon: '🤝', q: '志愿者' },
  { key: 'food', label: '补给美食', icon: '🍝', q: '补给' },
  { key: 'scenery', label: '沿途风景', icon: '🌉', q: '风景' }
];

Page({
  data: {
    stories: [],
    pager: { page: 1, limit: 10, total: 0, finished: false, loading: false },
    keyword: '',
    year: null,
    sort: 'latest',
    sortIndex: 0,
    sorts: SORTS,
    years: YEARS,
    topics: TOPICS,
    loading: false,
    pinnedList: []
  },

  onLoad() {
    this.loadList(true);
    this.loadPinned();
    // 首次进入提示订阅新故事(静默模式,已拒绝过的不再弹)
    setTimeout(() => {
      subscribe.requestSubscribe({
        tmplIds: ['NEW_STORY'],
        silent: true,
        hint: '开启后,有精选兰马故事上新时会通过微信服务通知推送给你'
      });
    }, 1200);
  },
  onPullDownRefresh() {
    Promise.all([this.loadList(true), this.loadPinned()]).then(() => wx.stopPullDownRefresh());
  },
  onReachBottom() { this.loadList(false); },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },
  onConfirmSearch() {
    util.vibrate('short');
    this.loadList(true);
  },
  onClearSearch() {
    this.setData({ keyword: '' });
    this.loadList(true);
  },

  onYearFilter(e) {
    const y = e.currentTarget.dataset.year;
    const year = (y === this.data.year || !y) ? null : Number(y);
    this.setData({ year });
    util.vibrate('short');
    this.loadList(true);
  },

  onSortChange(e) {
    const idx = Number(e.detail.value);
    const sort = SORTS[idx] ? SORTS[idx].key : 'latest';
    this.setData({ sortIndex: idx, sort });
    util.vibrate('short');
    this.loadList(true);
  },

  onTopicTap(e) {
    const q = e.currentTarget.dataset.q || '';
    util.vibrate('short');
    this.setData({ keyword: q });
    this.loadList(true);
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  /** 客户端排序 */
  sortStoriesClient(arr, sort) {
    const a = arr.slice();
    if (sort === 'hottest') {
      a.sort((x, y) => (y.likes_count || 0) - (x.likes_count || 0));
    } else if (sort === 'oldest') {
      a.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
    } else {
      a.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
    }
    return a;
  },

  async loadList(reset) {
    const { pager, keyword, year, sort } = this.data;
    if (pager.loading) return;
    if (reset) {
      this.setData({
        pager: { page: 1, limit: 10, total: 0, finished: false, loading: true }
      });
    } else {
      if (pager.finished) return;
      this.setData({ 'pager.loading': true });
    }
    try {
      const params = { page: pager.page, limit: pager.limit };
      if (keyword) params.keyword = keyword;
      if (year) params.year = year;
      const data = await api.stories.list(params);
      const items = (data && data.items) || [];
      const mapped = items.map((s) => ({
        ...s,
        authorName: s.author ? s.author.username : '匿名',
        authorAvatar: s.author ? s.author.avatar_url : '',
        createdText: util.relativeTime(s.created_at),
        coverImage: s.images && s.images.length ? s.images[0] : '',
        bibText: s.bib_number ? '#' + s.bib_number : ''
      }));
      const sorted = this.sortStoriesClient(mapped, sort);
      const newList = reset ? sorted : this.sortStoriesClient(this.data.stories.concat(mapped), sort);
      this.setData({
        stories: newList,
        pager: {
          ...this.data.pager,
          loading: false,
          total: data ? data.total : 0,
          finished: items.length === 0 || (this.data.pager.page * pager.limit) >= (data ? data.total : 0),
          page: (items.length > 0 && !reset) ? (this.data.pager.page + 1) : this.data.pager.page
        }
      });
    } catch (e) {
      this.setData({ 'pager.loading': false });
    }
  },

  /** 加载置顶/精华 (基于最热前 3) */
  async loadPinned() {
    try {
      const data = await api.stories.list({ page: 1, limit: 5 });
      const items = (data && data.items) || [];
      const mapped = items
        .slice()
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 3)
        .map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author ? s.author.username : '匿名',
          cover: s.images && s.images.length ? s.images[0] : '',
          likes: s.likes_count || 0
        }));
      this.setData({ pinnedList: mapped });
    } catch (e) {}
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/story-detail/story-detail?id=' + id });
  },

  goPublish() {
    if (!util.ensureLogin()) return;
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/story-publish/story-publish' });
  },

  goMyStories() {
    if (!util.ensureLogin()) return;
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/my-stories/my-stories' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '跑者故事广场 · 兰马文化',
      path: '/pages/stories/stories'
    });
  },

  onShareTimeline() {
    return util.shareConfig({
      title: '兰马跑者故事广场'
    });
  }
});