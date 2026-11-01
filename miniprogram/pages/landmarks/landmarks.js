const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const util = require('../../utils/util.js');

const CHECKIN_KEY = 'lanma_landmark_checkins';

function getCheckins() {
  try { return wx.getStorageSync(CHECKIN_KEY) || []; } catch (e) { return []; }
}
function toggleCheckin(id) {
  const arr = getCheckins();
  const idx = arr.indexOf(id);
  if (idx >= 0) { arr.splice(idx, 1); } else { arr.push(id); }
  wx.setStorageSync(CHECKIN_KEY, arr);
  return idx < 0;
}
function isCheckedIn(id) {
  return getCheckins().indexOf(id) >= 0;
}

Page({
  data: {
    landmarks: [],
    categories: ['全部', '历史文化', '黄河景观', '现代地标', '体育地标'],
    activeCat: '全部',
    loading: true,
    detail: null,
    detailFav: false,
    showFavOnly: false,
    favorites: [],
    isPlaying: false,
    viewMode: 'list',        // list / map
    markers: [],
    mapCenter: { latitude: 36.0611, longitude: 103.8343 }, // 兰州中心
    mapScale: 12,
    activeMarker: null,
    sheetExpanded: false
  },

  onLoad() { this.load(); },
  onShow() { this.refreshFavList(); this.refreshCheckinMarks(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const params = this.data.activeCat !== '全部' ? { category: this.data.activeCat } : null;
      let list = (await api.landmarks.list(params)) || [];
      if (this.data.showFavOnly) {
        const ids = this.data.favorites.map((f) => f.id);
        list = list.filter((it) => ids.indexOf(it.id) >= 0);
      }
      list.sort((a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0));
      this.setData({ landmarks: list, loading: false }, () => {
        this.buildMarkers();
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  refreshFavList() {
    this.setData({ favorites: fav.list('landmark') });
  },

  refreshCheckinMarks() {
    const list = this.data.landmarks.slice();
    list.forEach((it) => { it.checkedIn = isCheckedIn(it.id); });
    this.setData({ landmarks: list });
  },

  buildMarkers() {
    const markers = (this.data.landmarks || [])
      .filter((m) => m.latitude && m.longitude)
      .map((m, i) => ({
        id: m.id,
        latitude: Number(m.latitude),
        longitude: Number(m.longitude),
        title: m.name,
        width: 36,
        height: 36,
        callout: {
          content: ' ' + (m.name || '') + ' ',
          color: '#b71c1c',
          fontSize: 12,
          borderRadius: 4,
          padding: 4,
          bgColor: '#fff5f5',
          display: 'BYCLICK',
          borderWidth: 1,
          borderColor: '#fbe9e7'
        },
        iconPath: '',
        alpha: 0
      }));
    this.setData({ markers });

    // 如果有地标,以第一个为地图中心
    if (markers.length) {
      this.setData({
        mapCenter: { latitude: markers[0].latitude, longitude: markers[0].longitude }
      });
    }
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

  onToggleView() {
    util.vibrate('short');
    const next = this.data.viewMode === 'list' ? 'map' : 'list';
    this.setData({ viewMode: next });
    if (next === 'map') this.buildMarkers();
  },

  /** 地图选点:同步 activeMarker + 弹出卡片 */
  onMarkerTap(e) {
    const id = e.detail && e.detail.markerId;
    const m = (this.data.landmarks || []).find((it) => it.id === id);
    if (!m) return;
    util.vibrate('short');
    this.setData({ activeMarker: m, sheetExpanded: false });
  },

  onSelectMarker(e) {
    const id = e.currentTarget.dataset.id;
    const m = (this.data.landmarks || []).find((it) => it.id === id);
    if (!m) return;
    util.vibrate('short');
    this.setData({ activeMarker: m, mapCenter: { latitude: Number(m.latitude), longitude: Number(m.longitude) } });
  },

  onRegionChange() {},

  onToggleSheet() {
    this.setData({ sheetExpanded: !this.data.sheetExpanded });
  },

  /** 打卡 */
  onCheckIn(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    util.vibrate('success');
    const added = toggleCheckin(id);
    wx.showToast({ title: added ? '已打卡 🏁' : '取消打卡', icon: 'none' });
    this.refreshCheckinMarks();
    // 更新详情/活动标记
    if (this.data.detail && this.data.detail.id === id) {
      this.setData({ 'detail.checkedIn': added });
    }
    if (this.data.activeMarker && this.data.activeMarker.id === id) {
      this.setData({ 'activeMarker.checkedIn': added });
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    api.landmarks.detail(id).then((item) => {
      item.checkedIn = isCheckedIn(item.id);
      this.setData({ detail: item, detailFav: fav.isFavorited('landmark', id) });
    }).catch(() => {});
  },

  closeDetail() {
    if (this.audio) {
      try { this.audio.stop(); } catch (e) {}
      this.setData({ isPlaying: false });
    }
    this.setData({ detail: null });
  },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    util.vibrate('short');
    const detail = this.data.detail || {};
    const added = fav.toggle('landmark', detail);
    this.setData({ detailFav: added });
    wx.showToast({ title: added ? '已收藏 ⭐' : '已取消收藏', icon: 'none' });
    this.refreshFavList();
  },

  openMap(e) {
    const { lat, lng, name } = e.currentTarget.dataset;
    if (!lat || !lng) return wx.showToast({ title: '暂无坐标', icon: 'none' });
    util.vibrate('short');
    wx.openLocation({ latitude: Number(lat), longitude: Number(lng), name: name || '地标', scale: 16 });
  },

  noop() {},

  playAudio() {
    if (!this.data.detail || !this.data.detail.audio_url) {
      return wx.showToast({ title: '暂无音频介绍', icon: 'none' });
    }
    if (!this.audio) {
      this.audio = wx.createInnerAudioContext();
      this.audio.onEnded(() => this.setData({ isPlaying: false }));
      this.audio.onError(() => this.setData({ isPlaying: false }));
    }
    if (this.data.isPlaying) {
      this.audio.stop();
      this.setData({ isPlaying: false });
    } else {
      this.audio.src = this.data.detail.audio_url;
      this.audio.play();
      this.setData({ isPlaying: true });
      util.vibrate('short');
    }
  },

  /** 生成分享卡(用 canvas 画简易分享图) */
  onGeneratePoster(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.detail || this.data.landmarks.find((x) => x.id === id);
    if (!item) return;
    util.vibrate('short');
    wx.showLoading({ title: '生成中…' });
    const poster = require('../../utils/poster.js');
    poster.drawLandmarkPoster(item).then((path) => {
      wx.hideLoading();
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: () => wx.showToast({ title: '请允许保存到相册', icon: 'none' })
      });
    }).catch((err) => {
      wx.hideLoading();
      console.warn(err);
      wx.showToast({ title: '生成失败', icon: 'none' });
    });
  },

  onShareAppMessage() {
    const d = this.data.detail || this.data.activeMarker || {};
    return util.shareConfig({
      title: (d.name || '兰马赛道地标') + ' · 兰马文化',
      path: '/pages/landmarks/landmarks',
      imageUrl: d.cover_image || ''
    });
  },

  onShareTimeline() {
    const d = this.data.detail || this.data.activeMarker || {};
    return util.shareConfig({
      title: '我在兰马赛道 · ' + (d.name || '打卡地标'),
      imageUrl: d.cover_image || ''
    });
  }
});