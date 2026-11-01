const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    publications: [],
    detail: null,
    loading: true,
    detailRichText: ''
  },

  onLoad() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    this.setData({ loading: true });
    try {
      const list = await api.publications.list();
      const mapped = (list || []).map((p) => ({
        ...p,
        createdText: util.relativeTime(p.created_at),
        hasCover: !!(p.coverImage || p.cover_image || p.thumbnail)
      }));
      this.setData({ publications: mapped, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async openDetail(e) {
    const id = e.currentTarget.dataset.id;
    util.vibrate('short');
    try {
      const item = await api.publications.detail(id);
      const enriched = {
        ...item,
        coverImage: item.coverImage || item.cover_image || item.thumbnail || '',
        createdText: util.formatDate(item.created_at || item.updated_at)
      };
      // 解析富文本（后端 content 一般为 HTML 或纯文本，简单做兼容）
      const rich = this.buildRichText(item.content);
      this.setData({ detail: enriched, detailRichText: rich });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  closeDetail() {
    this.setData({ detail: null, detailRichText: '' });
  },

  noop() {},

  /** 把 HTML/纯文本转 rich-text 节点数组（简易处理） */
  buildRichText(content) {
    if (!content) return [];
    const text = String(content);
    // 如果含 HTML 标签，按段落拆，rich-text 接受 nodes 数组 [{name, children:[{text}]}]
    const blocks = text.split(/\n{2,}/);
    return blocks.map((b) => {
      const t = b.trim();
      if (!t) return null;
      return { name: 'p', attrs: { class: 'pub-p' }, children: [{ type: 'text', text: t }] };
    }).filter(Boolean);
  },

  onShareAppMessage() {
    const d = this.data.detail || {};
    return util.shareConfig({
      title: d.title || '小兰发布',
      path: '/pages/publications/publications'
    });
  }
});