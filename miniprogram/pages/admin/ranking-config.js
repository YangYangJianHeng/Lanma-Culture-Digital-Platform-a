const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

/**
 * 团队排行配置 - 调整 distance / pace / members 三个权重
 * 后端实际配置来源于 application.yml 的 app.team-ranking.* 节,
 * 接口 PUT 仅 echo 调整后的值,需重启后端才真正写入;前端在生产可改为提交并轮询确认。
 */
Page({
  data: {
    config: {
      weightDistance: 1.0,
      weightPace: 5.0,
      weightMembers: 100.0,
      defaultLimit: 20
    },
    preview: [],
    saving: false,
    loaded: false
  },

  onLoad() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    try {
      const cfg = await api.adminSocial.rankingConfig();
      const prev = await api.adminSocial.rankingPreview(20);
      this.setData({
        config: Object.assign({}, this.data.config, cfg || {}),
        preview: (prev || []).slice(0, 10),
        loaded: true
      });
    } catch (e) {
      util.vibrate('warning');
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseFloat(e.detail.value);
    if (isNaN(value)) return;
    this.setData({ ['config.' + field]: value });
  },

  onLimitInput(e) {
    const value = parseInt(e.detail.value);
    if (isNaN(value)) return;
    this.setData({ 'config.defaultLimit': value });
  },

  async onSave() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      await api.adminSocial.updateRankingConfig({
        weight_distance: this.data.config.weightDistance,
        weight_pace: this.data.config.weightPace,
        weight_members: this.data.config.weightMembers,
        default_limit: this.data.config.defaultLimit
      });
      wx.showModal({
        title: '保存成功',
        content: '配置已保存至后端响应(实际生效需修改 application.yml 后重启服务)',
        showCancel: false
      });
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onPreview() {
    try {
      const prev = await api.adminSocial.rankingPreview(this.data.config.defaultLimit || 20);
      this.setData({ preview: (prev || []).slice(0, 10) });
      wx.showToast({ title: '已刷新预览', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '预览失败', icon: 'none' });
    }
  },

  formatPace(s) {
    if (!s) return '--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}'${String(sec).padStart(2, '0')}"`;
  }
});