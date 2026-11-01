const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已成立' },
  { key: 'rejected', label: '已驳回' },
  { key: 'disbanded', label: '已解散' }
];

Page({
  data: {
    tabs: STATUS_TABS,
    activeTab: 'pending',
    items: [],
    loading: false,
    finished: false,
    pager: { page: 1, limit: 20, total: 0 }
  },

  onLoad() { this.load(true); },
  onPullDownRefresh() { this.load(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { if (!this.data.finished && !this.data.loading) this.load(false); },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.load(true);
  },

  async load(reset) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = reset ? 1 : this.data.pager.page;
    const status = this.data.activeTab;
    try {
      const data = await api.adminSocial.listTeams({ page, limit: this.data.pager.limit, status });
      const list2 = (data && data.items) || [];
      const merged = reset ? list2 : this.data.items.concat(list2);
      this.setData({
        items: merged,
        loading: false,
        finished: list2.length < this.data.pager.limit,
        pager: { ...this.data.pager, page: page + 1, total: (data && data.total) || 0 }
      });
    } catch (e) {
      this.setData({ loading: false });
      util.vibrate('warning');
    }
  },

  async onReview(e) {
    const { id, action } = e.currentTarget.dataset;
    if (!id || !action) return;
    const isApprove = action === 'approve';
    wx.showModal({
      title: isApprove ? '通过审核' : '驳回申请',
      editable: !isApprove,
      placeholderText: !isApprove ? '请填写驳回原因' : '',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.reviewTeam(id, {
            status: isApprove ? 'approved' : 'rejected',
            note: r.content || (isApprove ? '审核通过' : '不符合要求')
          });
          wx.showToast({ title: isApprove ? '已通过' : '已驳回', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  async onDisband(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '解散跑团',
      content: '解散后所有成员将被标记为已退出,确认解散?',
      confirmColor: '#ff4d4f',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.disbandTeam(id);
          wx.showToast({ title: '已解散', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  async onShowMembers(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const members = await api.adminSocial.teamMembers(id);
      const lines = (members || []).map(m =>
        `• ${m.userName || m.user_name || '匿名'} [${m.role}] ${m.distanceKm || m.distance_km || 0}km ${m.runCount || m.run_count || 0}次`
      );
      wx.showActionSheet({
        itemList: lines.concat(['关闭']),
        success: async (r) => {
          if (r.tapIndex == lines.length) return;
          const m = members[r.tapIndex];
          if (!m) return;
          wx.showModal({
            title: '踢出成员',
            content: `将 ${m.userName || m.user_name} 移出跑团?`,
            confirmColor: '#ff4d4f',
            success: async (res) => {
              if (!res.confirm) return;
              try {
                await api.adminSocial.kickTeamMember(id, m.userId || m.user_id);
                wx.showToast({ title: '已踢出', icon: 'success' });
              } catch (e) {
                wx.showToast({ title: '踢出失败', icon: 'none' });
              }
            }
          });
        }
      });
    } catch (e) {
      wx.showToast({ title: '获取失败', icon: 'none' });
    }
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '删除跑团',
      content: '已成立跑团将先解散再删除,确认操作?',
      confirmColor: '#ff4d4f',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await api.adminSocial.deleteTeam(id);
          wx.showToast({ title: '已处理', icon: 'success' });
          this.load(true);
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  }
});