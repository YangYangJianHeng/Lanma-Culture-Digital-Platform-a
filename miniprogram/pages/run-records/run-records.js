const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const TABS = [
  { key: 'mine', label: '我的记录' },
  { key: 'public', label: '跑步广场' }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'mine',
    items: [],
    stats: { total_km: 0, week_km: 0, total_runs: 0 },
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20 },
    sheetOpen: false,
    recordForm: {
      distanceKm: '',
      durationMin: '',
      startLocationText: '',
      title: '',
      note: '',
      weather: '晴'
    },
    submitting: false
  },

  onLoad() { this.load(true); this.loadStats(); },
  onShow() { if (this.data.items.length) this.load(true); },
  onPullDownRefresh() {
    Promise.all([this.load(true), this.loadStats()]).then(() => wx.stopPullDownRefresh());
  },
  onReachBottom() { if (!this.data.finished && !this.data.loading && this.data.activeTab == 'mine') this.load(false); },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.load(true);
  },

  async load(reset) {
    this.setData({ loading: true });
    try {
      const page = reset ? 1 : this.data.pager.page;
      let data;
      if (this.data.activeTab === 'mine') {
        data = await api.runRecords.mine(page, this.data.pager.limit);
      } else {
        data = await api.runRecords.list({ page, limit: this.data.pager.limit });
      }
      const items = (data && data.items) || (Array.isArray(data) ? data : []);
      this.setData({
        items: reset ? items : this.data.items.concat(items),
        loading: false,
        finished: items.length < this.data.pager.limit,
        pager: { ...this.data.pager, page: page + 1 }
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  async loadStats() {
    try {
      const s = await api.runRecords.stats();
      this.setData({ stats: s || this.data.stats });
    } catch (e) {}
  },

  formatPace(s) {
    if (!s || s <= 0) return '--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}'${String(sec).padStart(2, '0')}"`;
  },

  formatDateTime(t) {
    if (!t) return '';
    return String(t).replace('T', ' ').slice(0, 16);
  },

  openSheet() {
    if (!util.ensureLogin()) return;
    this.setData({ sheetOpen: true });
  },

  closeSheet() {
    this.setData({ sheetOpen: false });
  },

  onRecordInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['recordForm.' + field]: e.detail.value });
  },

  onChooseRecordLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ 'recordForm.startLocationText': res.address || res.name || '' });
      },
      fail: () => wx.showToast({ title: '取消选择', icon: 'none' })
    });
  },

  async onSubmitRecord() {
    const f = this.data.recordForm;
    const distance = parseFloat(f.distanceKm);
    const duration = parseInt(f.durationMin);
    if (!distance || distance <= 0) return wx.showToast({ title: '请填写有效距离', icon: 'none' });
    if (!duration || duration <= 0) return wx.showToast({ title: '请填写有效时长', icon: 'none' });

    this.setData({ submitting: true });
    try {
      // 模拟生成 GPS 轨迹 — 真实场景可由 wx.startLocationUpdate 上报
      const sampleTrack = this.mockTrack();
      await api.runRecords.create({
        distanceKm: distance,
        durationSec: duration * 60,
        title: f.title || ('跑后打卡 ' + util.formatDate(new Date(), false)),
        note: f.note,
        weather: f.weather,
        startLocationText: f.startLocationText,
        gpsTrackJson: JSON.stringify(sampleTrack),
        isPublic: true
      });
      wx.showToast({ title: '已同步记录', icon: 'success' });
      util.vibrate('success');
      this.setData({
        sheetOpen: false,
        recordForm: { distanceKm: '', durationMin: '', startLocationText: '', title: '', note: '', weather: '晴' }
      });
      this.load(true);
      this.loadStats();
    } catch (e) {
      wx.showToast({ title: '同步失败:' + (e.message || ''), icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  mockTrack() {
    // 模拟 10 个点的轨迹(无地图场景)
    const base = 103.83 + Math.random() * 0.01;
    const lat0 = 36.06 + Math.random() * 0.01;
    const track = [];
    for (let i = 0; i < 10; i++) {
      track.push([base + i * 0.001, lat0 + i * 0.0008, Date.now() - (10 - i) * 60000]);
    }
    return track;
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '删除记录',
      content: '确认删除此条跑步记录?',
      confirmColor: '#ff4d4f',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.runRecords.remove(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.load(true);
          this.loadStats();
        } catch (e) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '我的跑步记录 · ' + (this.data.stats.total_km || 0) + ' km',
      path: '/pages/run-records/run-records'
    });
  }
});