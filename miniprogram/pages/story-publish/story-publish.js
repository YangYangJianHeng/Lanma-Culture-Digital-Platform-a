const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    form: { race_year: new Date().getFullYear(), bib_number: '', finish_time: '', title: '', content: '', is_public: true },
    images: [],
    submitting: false,
    years: [],
    editId: null,
    isEdit: false,
    pageTitle: '发布故事',
    submittingText: '发布中...',
    submitText: '发 布'
  },

  onLoad(options) {
    const now = new Date().getFullYear();
    const years = [];
    for (let y = now; y >= now - 10; y--) years.push(y);
    const baseData = { years };
    if (options && options.id) {
      // 编辑模式
      this.setData(Object.assign({ editId: options.id, isEdit: true, pageTitle: '编辑故事', submittingText: '保存中...', submitText: '保 存' }, baseData));
      wx.setNavigationBarTitle({ title: '编辑故事' });
      this.loadDraft(options.id);
    } else {
      this.setData(baseData);
      wx.setNavigationBarTitle({ title: '发布故事' });
    }
  },

  async loadDraft(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const s = await api.stories.detail(id);
      // 私密故事别人无权查看，自己查看 OK（API 已允许本人查看 is_public=0 的）
      this.setData({
        form: {
          race_year: s.race_year || new Date().getFullYear(),
          bib_number: s.bib_number || '',
          finish_time: s.finish_time || '',
          title: s.title || '',
          content: s.content || '',
          is_public: s.is_public === 1
        },
        images: s.images || []
      });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onYearChange(e) {
    this.setData({ 'form.race_year': Number(e.detail.value) });
  },

  onPublicSwitch(e) {
    this.setData({ 'form.is_public': e.detail.value });
    util.vibrate('short');
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const files = res.tempFiles || [];
        for (const f of files) {
          wx.showLoading({ title: '上传中...' });
          try {
            const url = await api.upload(f.tempFilePath);
            this.setData({ images: this.data.images.concat(url) });
          } catch (e) {} finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const images = this.data.images.slice();
    images.splice(idx, 1);
    this.setData({ images });
    util.vibrate('short');
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.images });
  },

  async onSubmit() {
    const { title, content, race_year, bib_number, finish_time } = this.data.form;
    if (!title || !title.trim()) return wx.showToast({ title: '请输入标题', icon: 'none' });
    if (!content || !content.trim()) return wx.showToast({ title: '请输入正文', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const payload = {
        race_year,
        bib_number: bib_number || null,
        finish_time: finish_time || null,
        title: title.trim(),
        content: content.trim(),
        images: this.data.images,
        is_public: this.data.form.is_public ? 1 : 0
      };
      if (this.data.isEdit && this.data.editId) {
        await api.stories.update(this.data.editId, payload);
      } else {
        await api.stories.create(payload);
      }
      util.vibrate('success');
      wx.showToast({ title: this.data.isEdit ? '保存成功' : '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 600);
    } catch (e) {
      util.vibrate('warning');
    } finally {
      this.setData({ submitting: false });
    }
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: this.data.form.title || '我的兰马故事',
      path: '/pages/stories/stories'
    });
  }
});