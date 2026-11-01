const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const TABS = [
  { key: 'info', label: '团信息' },
  { key: 'dynamics', label: '动态' },
  { key: 'challenges', label: '挑战' },
  { key: 'members', label: '成员' }
];

Page({
  data: {
    id: null,
    tabs: TABS,
    activeTab: 'info',
    team: null,
    members: [],
    dynamics: [],
    challenges: [],
    invites: [],
    joined: false,
    isLeader: false,
    loading: false
  },

  onLoad(opts) {
    this.setData({
      id: opts.id,
      activeTab: opts.tab || 'info'
    });
    this.load();
  },

  onShow() { if (this.data.team) this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const team = await api.teams.detail(this.data.id);
      const members = await api.teams.members(this.data.id);
      const dynamics = await api.dynamics.list(this.data.id, 1, 10);
      const challenges = await api.challenges.listByTeam(this.data.id, 1, 5);
      const invites = await api.invites.list('team', this.data.id);
      const user = wx.getStorageSync('lanma_user') || null;
      const uid = user ? user.id : null;
      this.setData({
        team,
        members: members || [],
        dynamics: (dynamics && dynamics.items) || [],
        challenges: (challenges && challenges.items) || [],
        invites: invites || [],
        joined: (members || []).some(m => (m.userId || m.user_id) === uid),
        isLeader: team && uid === team.leaderId,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
  },

  async onJoin() {
    if (!util.ensureLogin()) return;
    try {
      await api.teams.join(this.data.id);
      wx.showToast({ title: '已加入', icon: 'success' });
      util.vibrate('success');
      this.load();
    } catch (e) {
      wx.showToast({ title: '加入失败:' + (e.message || ''), icon: 'none' });
    }
  },

  async onLeave() {
    wx.showModal({
      title: '退出跑团',
      content: '确认退出?',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.teams.leave(this.data.id);
          wx.showToast({ title: '已退出', icon: 'success' });
          this.load();
        } catch (e) {
          wx.showToast({ title: '退出失败', icon: 'none' });
        }
      }
    });
  },

  async onCreateDynamic() {
    if (!util.ensureLogin()) return;
    if (!this.data.joined && !this.data.isLeader) {
      return wx.showToast({ title: '请先加入跑团', icon: 'none' });
    }
    wx.showActionSheet({
      itemList: ['文字动态', '训练打卡', '相册照片', '里程碑'],
      success: async (r) => {
        const type = ['post', 'training', 'album', 'milestone'][r.tapIndex];
        wx.showModal({
          title: '发布' + ['文字动态', '训练打卡', '相册照片', '里程碑'][r.tapIndex],
          editable: true,
          placeholderText: type === 'milestone' ? '请输入里程碑文字' : '请输入内容',
          success: async (res) => {
            if (!res.confirm) return;
            try {
              const payload = {
                type,
                content: res.content || '',
                title: type === 'milestone' ? '🏆 新里程碑' : null,
                milestone: type === 'milestone' ? res.content : null
              };
              await api.dynamics.create(this.data.id, payload);
              wx.showToast({ title: '已发布', icon: 'success' });
              this.load();
            } catch (e) {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          }
        });
      }
    });
  },

  async onCreateChallenge() {
    if (!this.data.isLeader) return wx.showToast({ title: '仅团长可创建挑战', icon: 'none' });
    wx.showModal({
      title: '创建里程挑战',
      editable: true,
      placeholderText: '挑战名称,例:本周冲 50km',
      success: async (r) => {
        if (!r.confirm || !r.content) return;
        try {
          await api.challenges.create(this.data.id, {
            teamId: this.data.id,
            teamName: this.data.team.name,
            name: r.content,
            targetKm: 50,
            durationDays: 7,
            rewardType: 'text',
            rewardText: '🏆 完赛鼓励奖'
          });
          wx.showToast({ title: '挑战已发布', icon: 'success' });
          this.load();
        } catch (e) {
          wx.showToast({ title: '创建失败', icon: 'none' });
        }
      }
    });
  },

  async onJoinChallenge(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    if (!util.ensureLogin()) return;
    try {
      await api.challenges.join(id);
      wx.showToast({ title: '已参与', icon: 'success' });
      this.load();
    } catch (e) {
      wx.showToast({ title: '参与失败:' + (e.message || ''), icon: 'none' });
    }
  },

  async onCreateInvite() {
    try {
      const inv = await api.invites.create({
        scope_type: 'team',
        scope_id: this.data.id,
        scope_name: this.data.team.name,
        max_uses: 50,
        valid_days: 7
      });
      this.setData({ invites: [inv].concat(this.data.invites) });
      wx.showModal({
        title: '已生成邀请码',
        content: inv.code,
        showCancel: false,
        confirmText: '复制',
        success: (r) => { if (r.confirm) util.copyText(inv.code, '已复制'); }
      });
    } catch (e) {
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    const t = this.data.team;
    return util.shareConfig({
      title: t ? t.name : '加入跑团一起跑',
      path: '/pages/teams/team-detail?id=' + this.data.id
    });
  }
});