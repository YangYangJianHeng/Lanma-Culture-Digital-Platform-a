const api = require('../../utils/api.js');
const subscribe = require('../../utils/subscribe.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    story: null,
    comments: [],
    liked: false,
    likesCount: 0,
    commentText: '',
    submitting: false,
    loading: true,
    currentUserId: null
  },

  onLoad(options) {
    const id = options.id;
    const user = wx.getStorageSync('lanma_user') || null;
    this.setData({ id, currentUserId: user ? (user.id || user.userId) : null });
    this.loadAll();
  },

  async loadAll() {
    this.setData({ loading: true });
    try {
      const story = await api.stories.detail(this.data.id);
      story.createdText = util.formatDate(story.created_at);
      let liked = false;
      try {
        const s = await api.stories.likeStatus(this.data.id);
        liked = !!s.liked;
      } catch (e) {}
      const comments = await this.fetchComments();
      this.setData({
        story,
        likesCount: story.likes_count || 0,
        liked,
        comments,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async fetchComments() {
    try {
      const list = await api.comments.list('story', this.data.id);
      return (list || []).map((c) => ({
        ...c,
        createdText: util.relativeTime(c.created_at),
        isMine: this.data.currentUserId && Number(c.userId || c.user_id) === Number(this.data.currentUserId)
      }));
    } catch (e) { return []; }
  },

  onLikesToggle() {
    if (!util.ensureLogin()) return;
    util.vibrate('short');
    api.stories.like(this.data.id).then((res) => {
      this.setData({
        liked: !!res.liked,
        likesCount: res.likes_count
      });
      util.vibrate(res.liked ? 'success' : 'short');
    }).catch(() => util.vibrate('warning'));
  },

  onCommentInput(e) { this.setData({ commentText: e.detail.value }); },

  async onSubmitComment() {
    const content = this.data.commentText.trim();
    if (!content) return wx.showToast({ title: '请输入评论内容', icon: 'none' });
    if (!util.ensureLogin()) return;
    this.setData({ submitting: true });
    try {
      await api.comments.create('story', this.data.id, content);
      util.vibrate('success');
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({ commentText: '' });
      const comments = await this.fetchComments();
      this.setData({ comments });
      // 引导订阅:被评论/被点赞时通知作者
      subscribe.requestSubscribe({
        tmplIds: ['STORY_COMMENT', 'STORY_LIKED'],
        silent: true,
        hint: '开启后,有人回复你的评论或给你的故事点赞时会通过微信通知你'
      });
    } catch (e) {
      util.vibrate('warning');
    } finally {
      this.setData({ submitting: false });
    }
  },

  /** 长按评论：复制 / 删除（仅本人/管理员可见） */
  onCommentLongPress(e) {
    const idx = e.currentTarget.dataset.idx;
    const c = this.data.comments[idx];
    if (!c) return;
    util.vibrate('short');
    const ops = ['copy'];
    const items = ['📋 复制评论'];
    if (c.isMine) {
      items.push('🗑 删除评论');
      ops.push('delete');
    }
    wx.showActionSheet({
      itemList: items,
      success: async (res) => {
        const op = ops[res.tapIndex];
        if (op === 'copy') {
          util.copyText(c.content, '已复制');
        } else if (op === 'delete') {
          wx.showModal({
            title: '删除这条评论？',
            success: async (r) => {
              if (r.confirm) {
                try {
                  await api.comments.remove(c.id);
                  const comments = await this.fetchComments();
                  this.setData({ comments });
                  wx.showToast({ title: '已删除', icon: 'success' });
                } catch (e) {}
              }
            }
          });
        }
      }
    });
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.all;
    wx.previewImage({ current: url, urls });
  },

  onShareAppMessage() {
    const s = this.data.story || {};
    return util.shareConfig({
      title: (s.title || '跑者故事') + ' · 兰马文化',
      path: '/pages/story-detail/story-detail?id=' + this.data.id,
      imageUrl: s.images && s.images.length ? s.images[0] : ''
    });
  },

  onShareTimeline() {
    const s = this.data.story || {};
    return util.shareConfig({
      title: s.title || '跑者故事 · 兰马文化',
      imageUrl: s.images && s.images.length ? s.images[0] : ''
    });
  },

  /** 复制标题 */
  onCopyTitle() {
    if (this.data.story && this.data.story.title) {
      util.copyText(this.data.story.title);
    }
  },

  /** 举报 - 真实接入 /api/v1/reports */
  onReport() {
    const REASONS = [
      { code: 'spam', label: '垃圾广告' },
      { code: 'abuse', label: '辱骂攻击' },
      { code: 'porn', label: '色情低俗' },
      { code: 'illegal', label: '违法' },
      { code: 'other', label: '其他' }
    ];
    const itemList = REASONS.map(r => r.label);
    wx.showActionSheet({
      itemList: itemList.concat(['取消']),
      success: async (r) => {
        if (r.tapIndex >= REASONS.length) return;
        const reason = REASONS[r.tapIndex];
        wx.showModal({
          title: '举报理由',
          editable: true,
          placeholderText: '可填写详细说明(选填)',
          success: async (res) => {
            if (!res.confirm) return;
            const targetId = this.data.story && this.data.story.id;
            if (!targetId) {
              wx.showToast({ title: '内容信息缺失', icon: 'none' });
              return;
            }
            try {
              await api.reports.submit({
                target_type: 'story',
                target_id: targetId,
                reason: reason.code,
                description: res.content || ''
              });
              wx.showModal({
                title: '提交成功',
                content: '感谢你的反馈,管理员会尽快核实处理。',
                showCancel: false,
                confirmText: '好的'
              });
            } catch (e) {
              wx.showToast({ title: '提交失败,请稍后再试', icon: 'none' });
            }
          }
        });
      },
      fail: () => {}
    });
  }
});