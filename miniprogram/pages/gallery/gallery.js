const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

/**
 * 数字展馆(3D 轻量化方案)
 * 不用 three.js / webgl,改用 swiper + 多视角图模拟 3D 旋转,
 * 适配低端机流畅运行
 */
const TABS = [
  { key: '', label: '全部' },
  { key: 'medal', label: '🏅 奖牌' },
  { key: 'landmark', label: '📍 地标' },
  { key: 'culture', label: '🏯 文化' },
  { key: 'history', label: '🕰 历史' }
];

/** 预置本地数据 - 后端不可达时兜底 */
const FALLBACK = [
  {
    id: 1, name: '2011 年首届兰马奖牌', category: 'medal',
    cover: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop&q=70'
    ],
    description: '首届兰马奖牌,寓意"奔跑的黄河",以丝路文化为灵感设计',
    year: 2011, pan: false
  },
  {
    id: 2, name: '中山桥 360° 全景', category: 'landmark',
    cover: 'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1551041777-ed1a33d86b9b?w=400&h=400&fit=crop&q=70'
    ],
    description: '百年中山桥,黄河第一铁桥,见证兰州近代史',
    year: 1909, pan: true
  },
  {
    id: 3, name: '黄河母亲雕塑', category: 'culture',
    cover: 'https://images.unsplash.com/photo-1518288774672-bd6e543d2d68?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1518288774672-bd6e543d2d68?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1572059860148-6c4eb1bd6dbb?w=400&h=400&fit=crop&q=70'
    ],
    description: '何鄂女士创作的黄河母亲雕塑,兰州城市标志',
    year: 1986, pan: true
  },
  {
    id: 4, name: '白塔山公园', category: 'landmark',
    cover: 'https://images.unsplash.com/photo-1545569310-9f3bf07106f7?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1545569310-9f3bf07106f7?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1572059860148-6c4eb1bd6dbb?w=400&h=400&fit=crop&q=70'
    ],
    description: '白塔山俯瞰黄河,兰马赛道 18 公里处地标',
    year: null, pan: true
  },
  {
    id: 5, name: '2019 兰马完赛奖牌', category: 'medal',
    cover: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop&q=70'
    ],
    description: '兰马十周年完赛奖牌,刻有"十年之约"字样',
    year: 2019, pan: false
  },
  {
    id: 6, name: '兰州水车博览园', category: 'culture',
    cover: 'https://images.unsplash.com/photo-1604942839292-e2e7d10dba6b?w=400&h=400&fit=crop&q=70',
    angles: [
      'https://images.unsplash.com/photo-1604942839292-e2e7d10dba6b?w=400&h=400&fit=crop&q=70',
      'https://images.unsplash.com/photo-1545569310-9f3bf07106f7?w=400&h=400&fit=crop&q=70'
    ],
    description: '兰州水车,黄河岸边古老的灌溉工具',
    year: null, pan: false
  },
  {
    id: 7, name: '2017 兰马奖牌 · 历史回顾', category: 'history',
    cover: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop&q=70',
    angles: [],
    description: '2017 年兰马奖牌设计回顾,融入敦煌飞天元素',
    year: 2017, pan: false
  },
  {
    id: 8, name: '2020 兰马线上赛奖牌', category: 'history',
    cover: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop&q=70',
    angles: [],
    description: '2020 年线上赛奖牌,云端相聚的特别纪念',
    year: 2020, pan: false
  }
];

Page({
  data: {
    tabs: TABS,
    activeTab: '',
    list: [],
    loading: true,
    detail: null,
    detailIndex: 0,
    immersive: false,         // 沉浸模式
    gyroEnabled: false,       // 是否启用了陀螺仪
    showPreview: false,       // 单图预览
    previewUrl: ''
  },

  onLoad() { this.load(); },
  onShow() { /* 页面打开 */ },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      let list = await api.gallery.list({ category: this.data.activeTab }) || [];
      if (!Array.isArray(list) || list.length === 0) {
        // 后端未实现/无数据,使用本地兜底数据
        list = this.data.activeTab
          ? FALLBACK.filter((it) => it.category === this.data.activeTab)
          : FALLBACK;
      } else {
        // 后端数据归一化字段
        list = list.map((it) => ({
          ...it,
          cover: it.thumbnail_url || it.cover || it.image_url || '',
          angles: it.angles || (it.images || (it.image_url ? [it.image_url] : []))
        }));
      }
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ list: FALLBACK, loading: false });
    }
  },

  onTabTap(e) {
    const k = e.currentTarget.dataset.key;
    if (k === this.data.activeTab) return;
    util.vibrate('short');
    this.setData({ activeTab: k }, () => this.load());
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.list.findIndex((it) => String(it.id) === String(id));
    if (idx < 0) return;
    util.vibrate('short');
    const item = this.data.list[idx];
    const angles = (item.angles && item.angles.length > 0)
      ? item.angles
      : (item.cover ? [item.cover] : []);
    this.setData({
      detail: { ...item, angles },
      detailIndex: 0,
      immersive: false,
      gyroEnabled: false
    });
  },

  closeDetail() {
    this.disableGyro();
    this.setData({ detail: null, immersive: false });
  },

  onAngleChange(e) {
    this.setData({ detailIndex: e.detail.current || 0 });
  },

  toggleImmersive() {
    util.vibrate('short');
    const next = !this.data.immersive;
    this.setData({ immersive: next });
    if (next) {
      this.enableGyro();
    } else {
      this.disableGyro();
    }
  },

  /** 启用陀螺仪(高端机增强体验,低端机自动 fail 不会卡顿) */
  enableGyro() {
    if (this.data.gyroEnabled) return;
    try {
      wx.startAccelerometer({ interval: 'game' });
      wx.onAccelerometerChange((res) => {
        // 简化:用左右倾斜切换角度帧
        const x = res.x || 0;
        if (x > 0.4) this.setData({ detailIndex: 1 });
        else if (x < -0.4) this.setData({ detailIndex: 0 });
      });
      this.setData({ gyroEnabled: true });
    } catch (e) { /* 不支持就跳过 */ }
  },

  disableGyro() {
    if (!this.data.gyroEnabled) return;
    try {
      wx.stopAccelerometer();
      wx.offAccelerometerChange();
    } catch (e) {}
    this.setData({ gyroEnabled: false });
  },

  previewCurrentImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    this.setData({ showPreview: true, previewUrl: url });
  },

  closePreview() { this.setData({ showPreview: false, previewUrl: '' }); },

  /** 跳转到对应"实体"模块 */
  goEntity(e) {
    const { type, id } = e.currentTarget.dataset;
    if (!type) return;
    util.vibrate('short');
    const pageMap = {
      medal: '/pages/medals/medals',
      landmark: '/pages/landmarks/landmarks'
    };
    const page = pageMap[type];
    if (page) wx.navigateTo({ url: page });
  },

  onShareAppMessage() {
    const d = this.data.detail;
    return util.shareConfig({
      title: d ? '【数字展馆】' + d.name : '兰马数字展馆',
      path: '/pages/gallery/gallery'
    });
  },

  onShareTimeline() {
    return util.shareConfig({
      title: '沉浸式体验兰马数字展馆 · 3D 轻量化浏览'
    });
  }
});