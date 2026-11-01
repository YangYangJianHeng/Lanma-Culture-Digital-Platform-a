const api = require('../../utils/api.js');
const fav = require('../../utils/favorites.js');
const util = require('../../utils/util.js');

Page({
  data: {
    user: null,
    stats: {
      storyCount: 0,
      likeCount: 0,
      commentCount: 0,
      favFoods: 0,
      favTourism: 0,
      favLandmarks: 0,
      medalFav: 0,
      myMedalCount: 0
    },
    joinDays: 0,
    badges: [
      { id: 'story_first', name: '首篇故事', icon: '📖', desc: '发布第一篇故事', unlocked: false },
      { id: 'story_5', name: '讲述者', icon: '✍️', desc: '发布 5 篇以上故事', unlocked: false },
      { id: 'comment_5', name: '热心评论', icon: '💬', desc: '评论 5 次以上', unlocked: false },
      { id: 'like_10', name: '获赞10+', icon: '👍', desc: '获得 10 个以上点赞', unlocked: false },
      { id: 'collect', name: '收藏家', icon: '⭐', desc: '收藏 3 个以上条目', unlocked: false },
      { id: 'newbie', name: '新晋跑者', icon: '🌱', desc: '注册账号即可获得', unlocked: true }
    ]
  },

  onLoad() { this.load(); },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    let user = wx.getStorageSync('lanma_user') || null;
    // 尝试拉取最新用户资料
    try {
      const fresh = await api.auth.me();
      if (fresh) {
        user = Object.assign({}, user, fresh);
        wx.setStorageSync('lanma_user', user);
      }
    } catch (e) {}

    // 跑者故事统计（包含全部 / 仅自己发布的）
    let myStories = [];
    try {
      const data = await api.stories.my(1, 50);
      myStories = (data && data.items) || [];
    } catch (e) {}

    const storyCount = myStories.length;
    const likeCount = myStories.reduce((sum, s) => sum + (s.likes_count || 0), 0);

    let commentCount = 0;
    try {
      // 简易统计：累计自己故事下收到的评论数（前 10 篇即可）
      const tops = myStories.slice(0, 10);
      const commentsArr = await Promise.all(
        tops.map((s) => api.comments.list('story', s.id).catch(() => []))
      );
      commentCount = commentsArr.reduce((sum, cs) => sum + (cs ? cs.length : 0), 0);
    } catch (e) {}

    // 收藏统计
    const favFoods = fav.list('food').length;
    const favTourism = fav.list('tourism').length;
    const favLandmarks = fav.list('landmark').length;

    // 注册天数（用 createdAt / created_at / createdAt / registeredAt / 注册时间）
    const joinDate = (user && (user.createdAt || user.created_at || user.registeredAt || user.registered_at)) || null;
    const joinDays = joinDate ? util.diffDays(joinDate, new Date()) : 0;

    // 徽章
    const badges = this.data.badges.slice();
    const collect = favFoods + favTourism + favLandmarks;
    const has5 = storyCount >= 5;
    badges[0].unlocked = storyCount >= 1;
    badges[1].unlocked = has5;
    badges[2].unlocked = commentCount >= 5;
    badges[3].unlocked = likeCount >= 10;
    badges[4].unlocked = collect >= 3;

    this.setData({
      user,
      joinDays,
      stats: {
        storyCount, likeCount, commentCount,
        favFoods, favTourism, favLandmarks, medalFav: 0, myMedalCount: 0
      },
      badges
    });
  },

  goEdit() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/edit-profile/edit-profile' });
  },

  goChangePwd() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/change-password/change-password' });
  },

  goMyStories() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/my-stories/my-stories' });
  },

  goAdmin() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  goRunRecords() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/run-records/run-records' });
  },

  goActivities() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/activities/activities' });
  },

  goTeams() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/teams/teams' });
  },

  goInviteJoin() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/invite-join/invite-join' });
  },

  goFavorites() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/favorites-aggregated/favorites-aggregated' });
  },

  goCheckins() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/checkins/checkins' });
  },

  goMedals() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/medals/medals' });
  },

  goWeather() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/weather/weather' });
  },

  goMarathons() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/marathons/marathons' });
  },

  goPublications() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/publications/publications' });
  },

  goAi() {
    util.vibrate('short');
    wx.navigateTo({ url: '/pages/ai/ai' });
  },

  onLogout() {
    wx.showModal({
      title: '确认退出？',
      success: (r) => {
        if (r.confirm) {
          wx.removeStorageSync('lanma_token');
          wx.removeStorageSync('lanma_user');
          util.vibrate('warning');
          wx.showToast({ title: '已退出', icon: 'success' });
          setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 600);
        }
      }
    });
  },

  onChooseAvatar() {
    util.vibrate('short');
    wx.showToast({ title: '请在「编辑资料」中上传头像', icon: 'none' });
  },

  onShareAppMessage() {
    return util.shareConfig({
      title: '我在兰马文化数字平台，快来和我一起~',
      path: '/pages/profile/profile'
    });
  }
});