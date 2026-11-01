const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const MODULES = [
  { name: '数字展馆', icon: '🏛', path: '/pages/gallery/gallery' },
  { name: '奖牌博物馆', icon: '🏅', path: '/pages/medals/medals' },
  { name: '赛道地标', icon: '📍', path: '/pages/landmarks/landmarks' },
  { name: '美食推荐', icon: '🍜', path: '/pages/foods/foods' },
  { name: '旅游景点', icon: '🏯', path: '/pages/tourism/tourism' },
  { name: '比赛天气', icon: '⛅', path: '/pages/weather/weather' },
  { name: '历届兰马', icon: '🏃', path: '/pages/marathons/marathons' },
  { name: '小兰发布', icon: '📢', path: '/pages/publications/publications' },
  { name: 'AI 小兰', icon: '🤖', path: '/pages/ai/ai' },
  { name: '一起跑', icon: '🤝', path: '/pages/activities/activities' },
  { name: '跑团', icon: '👥', path: '/pages/teams/teams' }
];

Page({
  data: {
    modules: MODULES,
    countdownDays: 0,
    countdownLabel: '天后开赛',
    nextMarathon: null,
    publications: [],
    weather: null,
    recommendedFoods: [],
    recommendedSpots: [],
    latestStories: [],
    recommendReason: '',
    loading: false,
    splash: false,
    showSkeleton: true,
    banners: [],
    currentTab: 0,
    greeting: ''
  },

  onLoad() {
    this.computeGreeting();
    // 仅在本次小程序启动第一次进入时显示启动动画
    const shown = wx.getStorageSync('lanma_splash_shown');
    if (!shown) {
      this.setData({ splash: true });
      wx.setStorageSync('lanma_splash_shown', true);
      setTimeout(() => this.setData({ splash: false }), 1200);
    }
    this.loadAll();
  },

  onShow() {
    // 每次切回首页，刷新最新推荐（用户资料可能在登录页变化）
    if (!this.data.showSkeleton) this.loadRecommend();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  computeGreeting() {
    const h = new Date().getHours();
    let g = '你好';
    if (h < 6) g = '夜深了';
    else if (h < 11) g = '早上好';
    else if (h < 14) g = '中午好';
    else if (h < 18) g = '下午好';
    else g = '晚上好';
    this.setData({ greeting: g });
  },

  async loadAll() {
    this.setData({ showSkeleton: true, loading: true });
    await Promise.all([
      this.loadMarathon(),
      this.loadPublications(),
      this.loadWeather(),
      this.loadRecommend(),
      this.loadLatestStories()
    ]);
    this.setData({ loading: false });
    // 骨架屏保留一点过渡感
    setTimeout(() => this.setData({ showSkeleton: false }), 350);
  },

  async loadMarathon() {
    try {
      const list = await api.marathons.list();
      if (!Array.isArray(list) || list.length === 0) {
        this.setData({ banners: this.buildBanners() });
        return;
      }
      const now = Date.now();
      const future = list.filter((m) => m.date && new Date(m.date).getTime() > now);
      const next = (future.length ? future : list).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const days = next && next.date ? util.daysUntil(next.date) : 0;
      this.setData({
        nextMarathon: next,
        countdownDays: days,
        countdownLabel: days > 0 ? '天后开赛' : '即将开始',
        banners: this.buildBanners(next, days)
      });
    } catch (e) {
      this.setData({ banners: this.buildBanners() });
    }
  },

  /** 组装顶部轮播内容 */
  buildBanners(next, days) {
    const greet = this.data.greeting || '你好';
    const banners = [];
    if (next) {
      banners.push({
        id: 'marathon',
        url: '',
        title: next.year + ' 兰州国际马拉松',
        subtitle: next.slogan || next.name || '黄河之都，金城兰州',
        greet,
        days: days > 0 ? days : 0,
        cdLabel: days > 0 ? '天后开赛' : '开赛',
        meta: [
          '📅 ' + (next.date || ''),
          '📍 ' + (next.location || '甘肃兰州'),
          next.type ? '🏃 ' + next.type : ''
        ].filter(Boolean),
        bg1: '#b71c1c',
        bg2: '#f57c00'
      });
    }
    // 推广位
    banners.push({
      id: 'culture',
      url: '/pages/medals/medals',
      title: '兰马奖牌博物馆',
      subtitle: '历届奖牌·3D 鉴赏·数字典藏',
      greet,
      meta: ['🏅 数字典藏', '📐 3D 鉴赏'],
      bg1: '#6a1b9a',
      bg2: '#d81b60'
    });
    banners.push({
      id: 'food',
      url: '/pages/foods/foods',
      title: '兰州味道',
      subtitle: '牛肉面·酿皮·灰豆子·手抓羊肉',
      greet,
      meta: ['🍜 必吃榜', '🌶 地道风味'],
      bg1: '#ef6c00',
      bg2: '#fbc02d'
    });
    return banners;
  },

  onBannerTap(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    util.vibrate('short');
    const tabbarPages = ['pages/index/index', 'pages/stories/stories', 'pages/ai/ai', 'pages/profile/profile'];
    if (tabbarPages.includes(url.replace(/^\//, ''))) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },

  async loadPublications() {
    try {
      const list = await api.publications.list();
      this.setData({ publications: (list || []).slice(0, 3) });
    } catch (e) {}
  },

  async loadWeather() {
    try {
      const w = await api.weather.now('兰州');
      this.setData({ weather: w });
    } catch (e) {}
  },

  async loadRecommend() {
    try {
      const user = wx.getStorageSync('lanma_user') || null;
      const params = {};
      if (user) {
        if (user.occupation) params.occupation = user.occupation;
        if (user.age) params.age = user.age;
        if (user.gender) params.gender = user.gender;
      }
      const data = await api.recommend.fetch(params);
      if (data) {
        this.setData({
          recommendedFoods: (data.foods || []).slice(0, 4),
          recommendedSpots: (data.tourism || []).slice(0, 4),
          recommendReason: data.based_on ? `${data.based_on.occupation === '不限' ? '' : '基于 ' + data.based_on.occupation + ' '}推荐` : ''
        });
      }
    } catch (e) {}
  },

  async loadLatestStories() {
    try {
      const data = await api.stories.list({ page: 1, limit: 3 });
      const items = (data && data.items) || [];
      const mapped = items.map((s) => ({
        ...s,
        authorName: s.author ? s.author.username : '匿名',
        authorAvatar: s.author ? s.author.avatar_url : '',
        createdText: util.relativeTime(s.created_at),
        coverImage: s.images && s.images.length ? s.images[0] : ''
      }));
      this.setData({ latestStories: mapped });
    } catch (e) {}
  },

  goModule(e) {
    const path = e.currentTarget.dataset.path;
    util.vibrate('short');
    const tabbarPages = ['pages/index/index', 'pages/stories/stories', 'pages/ai/ai', 'pages/profile/profile'];
    if (tabbarPages.includes(path.replace(/^\//, ''))) {
      wx.switchTab({ url: path });
    } else {
      wx.navigateTo({ url: path });
    }
  },

  goAllStories() {
    wx.switchTab({ url: '/pages/stories/stories' });
  },

  goPublications() {
    wx.navigateTo({ url: '/pages/publications/publications' });
  },

  goPublicationDetail(e) {
    const id = e.currentTarget.dataset.id;
    // 没有详情页的话跳到列表页
    if (!id) return this.goPublications();
    // 复用 publications 弹层
    wx.navigateTo({ url: '/pages/publications/publications?id=' + id });
  },

  goStoryDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/story-detail/story-detail?id=' + id });
  },

  goPublish() {
    if (!util.ensureLogin()) return;
    wx.navigateTo({ url: '/pages/story-publish/story-publish' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '兰马文化数字平台 · 兰州马拉松·美食·旅游',
      path: '/pages/index/index'
    });
  },

  onShareTimeline() {
    return util.shareConfig({
      title: '兰马文化数字平台'
    });
  }
});