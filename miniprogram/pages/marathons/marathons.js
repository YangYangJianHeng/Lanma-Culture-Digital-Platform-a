const api = require('../../utils/api.js');
const subscribe = require('../../utils/subscribe.js');
const poster = require('../../utils/poster.js');
const util = require('../../utils/util.js');

const CATEGORY_OPTIONS = [
  { key: '全程马拉松', label: '全程马拉松 · 42.195 km' },
  { key: '半程马拉松', label: '半程马拉松 · 21.0975 km' },
  { key: '迷你马拉松', label: '迷你马拉松 · 5 km' },
  { key: '健康跑', label: '健康跑 · 3 km' }
];

function buildCertForm(detail, user) {
  return {
    name: (user && user.username) || '',
    category: '全程马拉松',
    catIndex: 0,
    gun_time: '',
    net_time: '',
    bib_no: ''
  };
}

Page({
  data: {
    marathons: [],
    loading: true,
    detail: null,
    certForm: null,
    categoryOptions: CATEGORY_OPTIONS
  },

  onLoad() {
    this.load();
    // 提示订阅赛事倒计时
    setTimeout(() => {
      subscribe.requestSubscribe({
        tmplIds: ['MARATHON_COUNTDOWN', 'RACE_RESULT'],
        silent: true,
        hint: '开启后,可收到赛事倒计时与完赛成绩微信通知'
      });
    }, 1500);
  },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const list = await api.marathons.list();
      const now = Date.now();
      const mapped = (list || []).map((m) => {
        let images = [];
        if (m.images) {
          if (Array.isArray(m.images)) images = m.images;
          else if (typeof m.images === 'string') {
            const s = m.images.trim();
            try {
              const parsed = JSON.parse(s);
              if (Array.isArray(parsed)) images = parsed;
              else if (typeof parsed === 'string') images = [parsed];
            } catch (e) {
              images = s.split(/[,\n]/).map(x => x).filter(x => x.length > 0 && (x.startsWith('http') || x.startsWith('/')));
            }
          }
        }
        const ts = m.date ? new Date(m.date).getTime() : null;
        const isPast = ts != null && ts < now;
        const isLatest = ts != null && ts > now;
        return { ...m, images, imageArr: images.length ? images[0] : '', isPast, isLatest };
      });
      // 按年份倒序
      mapped.sort((a, b) => (b.year || 0) - (a.year || 0));
      this.setData({ marathons: mapped, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    api.marathons.detail(id).then((item) => {
      // 详情里也带上 imageArr
      let imageArr = '';
      if (item.images) {
        if (Array.isArray(item.images) && item.images.length) imageArr = item.images[0];
        else if (typeof item.images === 'string') {
          try {
            const arr = JSON.parse(item.images);
            imageArr = Array.isArray(arr) ? arr[0] : arr;
          } catch (e) {
            imageArr = item.images.split(',')[0].trim();
          }
        }
      }
      this.setData({ detail: Object.assign({}, item, { imageArr }) });
    }).catch(() => {});
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ urls: [url] });
  },

  closeDetail() { this.setData({ detail: null }); },

  onGenerateCert() {
    util.vibrate('short');
    const detail = this.data.detail || {};
    const user = wx.getStorageSync('user') || {};
    this.setData({ certForm: buildCertForm(detail, user) });
  },

  closeCertForm() { this.setData({ certForm: null }); },

  onCertInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['certForm.' + field]: e.detail.value });
  },

  onCertCatChange(e) {
    const idx = Number(e.detail.value) || 0;
    const category = CATEGORY_OPTIONS[idx] ? CATEGORY_OPTIONS[idx].key : '';
    this.setData({ 'certForm.catIndex': idx, 'certForm.category': category });
  },

  async onConfirmCert() {
    const f = this.data.certForm;
    if (!f || !f.name) return wx.showToast({ title: '请填写姓名', icon: 'none' });

    util.vibrate('short');
    wx.showLoading({ title: '生成中…' });
    try {
      const detail = this.data.detail || {};
      const cert = Object.assign({}, detail, {
        name: f.name,
        category: f.category,
        gun_time: f.gun_time,
        net_time: f.net_time,
        bib_no: f.bib_no,
        medal: '已颁发',
        date: detail.date
      });
      const path = await poster.drawCertificatePoster(cert);
      wx.hideLoading();
      this.setData({ certForm: null });
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => wx.showToast({ title: '已保存到相册,可分享到朋友圈', icon: 'success' }),
        fail: () => {
          wx.showModal({
            title: '保存失败',
            content: '请允许小程序保存到相册,然后到微信朋友圈发布图片即可',
            showCancel: false
          });
        }
      });
      // 引导订阅成绩推送
      subscribe.requestSubscribe({
        tmplIds: ['RACE_RESULT'],
        silent: true,
        hint: '开启后,正式完赛成绩将通过微信推送给你'
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  noop() {},

  onShareAppMessage() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: (d.year ? d.year + ' 兰州国际马拉松 · ' : '') + '历届兰马时间轴',
      path: '/pages/marathons/marathons',
      imageUrl: d.imageArr || ''
    });
  },

  onShareTimeline() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: (d.year ? d.year + ' 兰州国际马拉松 · ' : '') + '历届兰马时间轴',
      imageUrl: d.imageArr || ''
    });
  }
});