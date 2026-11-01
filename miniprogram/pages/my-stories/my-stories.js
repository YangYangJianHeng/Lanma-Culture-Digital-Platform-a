const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    stories: [],
    pager: { page: 1, limit: 10, total: 0, finished: false, loading: false }
  },

  onLoad() { this.loadList(true); },
  onShow() { this.loadList(true); },
  onPullDownRefresh() { this.loadList(true).then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { this.loadList(false); },

  async loadList(reset) {
    const { pager } = this.data;
    if (pager.loading) return;
    if (pager.finished && !reset) return;
    if (reset) this.setData({ pager: { page: 1, limit: 10, total: 0, finished: false, loading: true } });
    else this.setData({ 'pager.loading': true });

    try {
      const data = await api.stories.my(pager.page, pager.limit);
      const items = (data && data.items) || [];
      const mapped = items.map((s) => ({
        ...s,
        createdText: util.relativeTime(s.created_at),
        publicText: s.is_public === 1 ? '公开' : '仅自己可见',
        coverImage: s.images && s.images.length ? s.images[0] : ''
      }));
      const newList = reset ? mapped : this.data.stories.concat(mapped);
      this.setData({
        stories: newList,
        pager: {
          page: items.length > 0 ? (reset ? 2 : pager.page + 1) : pager.page,
          limit: pager.limit,
          total: data ? data.total : 0,
          finished: items.length === 0,
          loading: false
        }
      });
    } catch (e) {
      this.setData({ 'pager.loading': false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/story-detail/story-detail?id=' + id });
  },

  /** 长按：操作菜单 */
  onLongPress(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.idx;
    const s = this.data.stories[idx];
    if (!s) return;
    util.vibrate('short');
    const items = ['✏️ 编辑', '🔗 分享', '📋 复制标题', '🗑 删除'];
    wx.showActionSheet({
      itemList: items,
      success: async (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/story-publish/story-publish?id=' + id });
        } else if (res.tapIndex === 1) {
          util.copyText(`《${s.title}》— ${s.authorName || '我'}的故事`, '已复制分享文案');
        } else if (res.tapIndex === 2) {
          util.copyText(s.title, '已复制');
        } else if (res.tapIndex === 3) {
          this.confirmDelete(id);
        }
      }
    });
  },

  /** 右下角浮动操作 */
  onMoreTap(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.idx;
    this.setData({ moreIdx: idx });
    this.onLongPress({ currentTarget: { dataset: { id, idx } } });
  },

  confirmDelete(id) {
    wx.showModal({
      title: '确认删除？',
      content: '删除后无法恢复',
      success: async (r) => {
        if (r.confirm) {
          try {
            await api.stories.remove(id);
            util.vibrate('success');
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadList(true);
          } catch (e) {}
        }
      }
    });
  },

  goPublish() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/story-publish/story-publish' });
  },

  /** 切换公开状态 */
  async onTogglePublic(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.idx;
    const s = this.data.stories[idx];
    if (!s) return;
    util.vibrate('short');
    try {
      await api.stories.update(id, { is_public: s.is_public === 1 ? 0 : 1 });
      const stories = this.data.stories.slice();
      stories[idx] = Object.assign({}, s, {
        is_public: s.is_public === 1 ? 0 : 1,
        publicText: s.is_public === 1 ? '仅自己可见' : '公开'
      });
      this.setData({ stories });
      wx.showToast({ title: stories[idx].publicText, icon: 'none' });
    } catch (e) {}
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '我的兰马故事',
      path: '/pages/my-stories/my-stories'
    });
  }
});