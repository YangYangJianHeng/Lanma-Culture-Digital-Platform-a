const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const CHECKIN_KEY = 'lanma_landmark_checkins';

function getCheckins() {
  try { return wx.getStorageSync(CHECKIN_KEY) || []; } catch (e) { return []; }
}

Page({
  data: {
    list: [],
    loading: true,
    count: 0
  },

  onLoad() { this.load(); },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const ids = getCheckins();
      const all = await api.landmarks.list().catch(() => []);
      const map = new Map(all.map((it) => [it.id, it]));
      const list = ids.map((id) => {
        const item = map.get(id) || {};
        return {
          id,
          name: item.name || ('地标 #' + id),
          cover: item.cover_image || '',
          category: item.category || '',
          distance: item.distance_from_start || 0
        };
      });
      this.setData({ list, count: ids.length, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/landmarks/landmarks' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '我已打卡 ' + this.data.count + ' 个兰马赛道地标',
      path: '/pages/checkins/checkins'
    });
  }
});