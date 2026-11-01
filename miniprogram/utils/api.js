// utils/api.js - 后端 API 封装
const TOKEN_KEY = 'lanma_token';
const USERINFO_KEY = 'lanma_user';

function getApp() { return getApp(); }

const api = {
  base: '',

  /** 通用请求 */
  request(method, url, data, options = {}) {
    const app = getApp();
    const baseUrl = (options.base !== undefined ? options.base : (app && app.globalData ? app.globalData.apiBase : ''));
    const fullUrl = /^https?:\/\//i.test(url) ? url : (baseUrl + url);

    const header = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    // 注入 token
    const token = wx.getStorageSync(TOKEN_KEY);
    if (token) header['Authorization'] = 'Bearer ' + token;

    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method,
        data,
        header,
        timeout: options.timeout || 20000,
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const body = res.data || {};
            if (body.code === 200 || body.code === 201) {
              resolve(body.data);
            } else if (body.code === 401 || body.code === 403) {
              // 登录态失效
              wx.removeStorageSync(TOKEN_KEY);
              wx.removeStorageSync(USERINFO_KEY);
              if (typeof options.onAuthFail === 'function') {
                options.onAuthFail(body);
              } else {
                wx.showToast({ title: body.message || '请先登录', icon: 'none' });
              }
              reject({ code: body.code, message: body.message, data: body.data });
            } else {
              wx.showToast({ title: body.message || '请求失败', icon: 'none' });
              reject({ code: body.code, message: body.message, data: body.data });
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            wx.removeStorageSync(TOKEN_KEY);
            wx.removeStorageSync(USERINFO_KEY);
            wx.showToast({ title: '请先登录', icon: 'none' });
            reject({ code: res.statusCode, message: '未登录', data: null });
          } else {
            const msg = (res.data && res.data.message) || `请求失败 (${res.statusCode})`;
            wx.showToast({ title: msg, icon: 'none' });
            reject({ code: res.statusCode, message: msg, data: res.data });
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none' });
          reject({ code: -1, message: '网络异常', error: err });
        }
      });
    });
  },

  get(url, params, options) {
    let fullUrl = url;
    if (params && typeof params === 'object') {
      const qs = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
      if (qs) fullUrl += (url.indexOf('?') >= 0 ? '&' : '?') + qs;
    }
    return this.request('GET', fullUrl, undefined, options);
  },

  post(url, data, options) { return this.request('POST', url, data, options); },
  put(url, data, options) { return this.request('PUT', url, data, options); },
  del(url, data, options) { return this.request('DELETE', url, data, options); },

  // ====== 认证 ======
  auth: {
    login(username, password) { return api.post('/api/v1/auth/login', { username, password }); },
    register(payload) { return api.post('/api/v1/auth/register', payload); },
    /**
     * 微信一键登录:前端用 wx.login 拿到 code + 头像昵称,后端换取 token
     * 期望后端实现: POST /api/v1/auth/wx-login { code, nickname, avatarUrl }
     * 后端未实现时,前端 fallback 到 register+login
     */
    wxLogin(payload) { return api.post('/api/v1/auth/wx-login', payload); },
    /** 解密微信手机号(可选) */
    decryptPhone(payload) { return api.post('/api/v1/auth/decrypt-phone', payload); },
    me() { return api.get('/api/v1/auth/me'); },
    logout() {
      const token = wx.getStorageSync(TOKEN_KEY);
      if (token) {
        return api.post('/api/v1/auth/logout', {});
      }
      return Promise.resolve(null);
    },
    updateProfile(payload) { return api.put('/api/v1/auth/profile', payload); },
    updatePassword(oldPassword, newPassword) {
      return api.put('/api/v1/auth/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
    }
  },

  // ====== 奖牌 / 地标 / 美食 / 旅游 ======
  medals: {
    list(params) { return api.get('/api/v1/medals', params); },
    detail(id) { return api.get('/api/v1/medals/' + id); }
  },
  landmarks: {
    list(params) { return api.get('/api/v1/landmarks', params); },
    detail(id) { return api.get('/api/v1/landmarks/' + id); }
  },
  foods: {
    list(params) { return api.get('/api/v1/foods', params); },
    detail(id) { return api.get('/api/v1/foods/' + id); }
  },
  tourism: {
    list(params) { return api.get('/api/v1/tourism', params); },
    detail(id) { return api.get('/api/v1/tourism/' + id); }
  },

  // ====== 马拉松 / 发布 / 天气 ======
  marathons: {
    list() { return api.get('/api/v1/marathons'); },
    detail(id) { return api.get('/api/v1/marathons/' + id); }
  },
  publications: {
    list() { return api.get('/api/v1/publications'); },
    detail(id) { return api.get('/api/v1/publications/' + id); }
  },
  weather: {
    latest(location) { return api.get('/api/v1/weather/latest', { location }); },
    history(location, days) { return api.get('/api/v1/weather/history', { location, days }); },
    now(location) { return api.get('/api/v1/weather/now', { location }); },
    forecast(location) { return api.get('/api/v1/weather/forecast', { location }); }
  },

  // ====== 推荐 ======
  recommend: {
    fetch(params) { return api.get('/api/v1/recommend', params); }
  },

  // ====== 跑者故事 ======
  stories: {
    list(params) { return api.get('/api/v1/stories', params); },
    my(page, limit) { return api.get('/api/v1/stories/my', { page, limit }); },
    detail(id) { return api.get('/api/v1/stories/' + id); },
    create(payload) { return api.post('/api/v1/stories', payload); },
    update(id, payload) { return api.put('/api/v1/stories/' + id, payload); },
    remove(id) { return api.del('/api/v1/stories/' + id); },
    like(id) { return api.post('/api/v1/stories/' + id + '/like', {}); },
    likeStatus(id) { return api.get('/api/v1/stories/' + id + '/like-status'); }
  },

  // ====== 评论 ======
  comments: {
    list(targetType, targetId) { return api.get('/api/v1/comments/' + targetType + '/' + targetId); },
    create(targetType, targetId, content) {
      return api.post('/api/v1/comments', {
        target_type: targetType,
        target_id: targetId,
        content
      });
    },
    remove(commentId) { return api.del('/api/v1/comments/' + commentId); }
  },

  // ====== AI ======
  ai: {
    chat(message, model, extraHeaders) {
      const opts = extraHeaders ? { headers: extraHeaders, timeout: 60000 } : { timeout: 60000 };
      return api.post('/api/v1/ai/chat', { message, model: model || 'llama3' }, opts);
    },
    history(extraHeaders) {
      const opts = extraHeaders ? { headers: extraHeaders, timeout: 20000 } : { timeout: 20000 };
      return api.get('/api/v1/ai/history', null, opts);
    }
  },

  // ====== 数字展馆(轻量 3D 浏览)======
  gallery: {
    list(params) { return api.get('/api/v1/gallery', params); },
    detail(id) { return api.get('/api/v1/gallery/' + id); }
  },

  // ====== 完赛证书 ======
  certificate: {
    list(params) { return api.get('/api/v1/certificates', params); },
    detail(id) { return api.get('/api/v1/certificates/' + id); }
  },

  // ====== 约跑活动 ======
  activities: {
    list(params) { return api.get('/api/v1/activities', params); },
    mine() { return api.get('/api/v1/activities/mine'); },
    detail(id) { return api.get('/api/v1/activities/' + id); },
    create(payload) { return api.post('/api/v1/activities', payload); },
    register(id, phone) { return api.post('/api/v1/activities/' + id + '/register', { phone: phone || '' }); },
    unregister(id) { return api.del('/api/v1/activities/' + id + '/register'); },
    registrations(id) { return api.get('/api/v1/activities/' + id + '/registrations'); }
  },

  // ====== 跑团 ======
  teams: {
    list(params) { return api.get('/api/v1/teams', params); },
    mine() { return api.get('/api/v1/teams/mine'); },
    ranking(limit = 20) { return api.get('/api/v1/teams/ranking', { limit }); },
    detail(id) { return api.get('/api/v1/teams/' + id); },
    members(id) { return api.get('/api/v1/teams/' + id + '/members'); },
    create(payload) { return api.post('/api/v1/teams', payload); },
    join(id) { return api.post('/api/v1/teams/' + id + '/join', {}); },
    leave(id) { return api.del('/api/v1/teams/' + id + '/leave'); }
  },

  // ====== 举报 ======
  reports: {
    submit(payload) { return api.post('/api/v1/reports', payload); },
    mine() { return api.get('/api/v1/reports/mine'); }
  },

  // ====== 跑步记录(跑后数据) =====
  runRecords: {
    list(params) { return api.get('/api/v1/run-records', params); },
    mine(page, limit) { return api.get('/api/v1/run-records/mine', { page, limit }); },
    stats() { return api.get('/api/v1/run-records/stats'); },
    detail(id) { return api.get('/api/v1/run-records/' + id); },
    create(payload) { return api.post('/api/v1/run-records', payload); },
    remove(id) { return api.del('/api/v1/run-records/' + id); }
  },

  // ====== 跑团动态/相册(挂在 team 之下) ======
  dynamics: {
    list(teamId, page, limit) { return api.get('/api/v1/teams/' + teamId + '/dynamics', { page, limit }); },
    stats(teamId) { return api.get('/api/v1/teams/' + teamId + '/dynamics/stats'); },
    detail(teamId, id) { return api.get('/api/v1/teams/' + teamId + '/dynamics/' + id); },
    images(teamId, id) { return api.get('/api/v1/teams/' + teamId + '/dynamics/' + id + '/images'); },
    create(teamId, payload) { return api.post('/api/v1/teams/' + teamId + '/dynamics', payload); },
    like(teamId, id) { return api.post('/api/v1/teams/' + teamId + '/dynamics/' + id + '/like', {}); },
    remove(teamId, id) { return api.del('/api/v1/teams/' + teamId + '/dynamics/' + id); }
  },

  // ====== 里程挑战 ======
  challenges: {
    all(page, limit, status) { return api.get('/api/v1/challenges', { page, limit, status: status || 'ongoing' }); },
    stats() { return api.get('/api/v1/challenges/stats'); },
    listByTeam(teamId, page, limit) { return api.get('/api/v1/teams/' + teamId + '/challenges', { page, limit }); },
    create(teamId, payload) { return api.post('/api/v1/teams/' + teamId + '/challenges', payload); },
    detail(id) { return api.get('/api/v1/challenges/' + id); },
    stats2(id) { return api.get('/api/v1/challenges/' + id + '/stats'); },
    join(id) { return api.post('/api/v1/challenges/' + id + '/join', {}); },
    ranking(id) { return api.get('/api/v1/challenges/' + id + '/ranking'); },
    finish(id) { return api.post('/api/v1/challenges/' + id + '/finish', {}); },
    cancel(id) { return api.post('/api/v1/challenges/' + id + '/cancel', {}); },
    remove(id) { return api.del('/api/v1/challenges/' + id); }
  },

  // ====== 邀请码 ======
  invites: {
    list(scopeType, scopeId) { return api.get('/api/v1/invites', { scopeType, scopeId }); },
    create(payload) { return api.post('/api/v1/invites', payload); },
    resolve(code) { return api.post('/api/v1/invites/resolve', { code }); },
    deactivate(id) { return api.post('/api/v1/invites/' + id + '/deactivate', {}); }
  },

  // ====== 社交功能管理(Admin) ======
  adminSocial: {
    stats() { return api.get('/api/v1/admin/social/stats'); },

    // 活动审核
    listActivities(params) { return api.get('/api/v1/admin/social/activities', params); },
    reviewActivity(id, payload) { return api.post('/api/v1/admin/social/activities/' + id + '/review', payload); },
    closeActivity(id) { return api.post('/api/v1/admin/social/activities/' + id + '/close', {}); },
    deleteActivity(id) { return api.del('/api/v1/admin/social/activities/' + id); },
    activityRegistrations(id) { return api.get('/api/v1/admin/social/activities/' + id + '/registrations'); },

    // 跑团管理
    listTeams(params) { return api.get('/api/v1/admin/social/teams', params); },
    reviewTeam(id, payload) { return api.post('/api/v1/admin/social/teams/' + id + '/review', payload); },
    disbandTeam(id) { return api.post('/api/v1/admin/social/teams/' + id + '/disband', {}); },
    deleteTeam(id) { return api.del('/api/v1/admin/social/teams/' + id); },
    teamMembers(id) { return api.get('/api/v1/admin/social/teams/' + id + '/members'); },
    kickTeamMember(teamId, userId) { return api.post('/api/v1/admin/social/teams/' + teamId + '/kick/' + userId, {}); },

    // 团队排行配置
    rankingConfig() { return api.get('/api/v1/admin/social/teams/ranking/config'); },
    rankingPreview(limit = 20) { return api.get('/api/v1/admin/social/teams/ranking/preview', { limit }); },
    updateRankingConfig(payload) { return api.put('/api/v1/admin/social/teams/ranking/config', payload); },

    // 举报处理
    listReports(params) { return api.get('/api/v1/admin/social/reports', params); },
    handleReport(id, payload) { return api.post('/api/v1/admin/social/reports/' + id + '/handle', payload); },
    ignoreReport(id, note) { return api.post('/api/v1/admin/social/reports/' + id + '/ignore', { note: note || '' }); },
    deleteReport(id) { return api.del('/api/v1/admin/social/reports/' + id); },

    // 违规处理(批量)
    warnUser(payload) { return api.post('/api/v1/admin/social/moderation/warn', payload); },
    banUser(payload) { return api.post('/api/v1/admin/social/moderation/ban', payload); },

    // 动态 / 相册
    listDynamics(params) { return api.get('/api/v1/admin/social/dynamics', params); },
    featureDynamic(id, featured) { return api.post('/api/v1/admin/social/dynamics/' + id + '/feature', { featured: !!featured }); },
    deleteDynamic(id) { return api.del('/api/v1/admin/social/dynamics/' + id); },
    dynamicsGlobalStats() { return api.get('/api/v1/admin/social/dynamics/global-stats'); },

    // 挑战
    listChallenges(params) { return api.get('/api/v1/admin/social/challenges', params); },
    finishChallenge(id) { return api.post('/api/v1/admin/social/challenges/' + id + '/finish', {}); },
    deleteChallenge(id) { return api.del('/api/v1/admin/social/challenges/' + id); },

    // 邀请码
    listInvites(scopeType, scopeId) { return api.get('/api/v1/admin/social/invites', { scopeType, scopeId }); },
    deactivateInvite(id) { return api.post('/api/v1/admin/social/invites/' + id + '/deactivate', {}); },

    // 跑步记录
    listRunRecords(params) { return api.get('/api/v1/admin/social/run-records', params); }
  },

  // ====== 文件上传 ======
  upload(filePath, name = 'file') {
    const app = getApp();
    const baseUrl = app.globalData.apiBase;
    const token = wx.getStorageSync(TOKEN_KEY);
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + '/api/v1/upload',
        filePath,
        name,
        header: token ? { 'Authorization': 'Bearer ' + token } : {},
        success: (res) => {
          try {
            const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (body && body.code === 200 && body.data && body.data.url) {
              resolve(body.data.url);
            } else {
              reject(body);
            }
          } catch (e) { reject(e); }
        },
        fail: (err) => reject(err)
      });
    });
  }
};

module.exports = api;
