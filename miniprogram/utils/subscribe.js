// utils/subscribe.js - 微信订阅消息工具

/**
 * 调用 wx.requestSubscribeMessage,统一处理权限询问/错误/统计。
 * @param {Object} options
 * @param {string|string[]} options.tmplIds 单个或多个订阅消息模板 id
 * @param {boolean} [options.silent=false] 是否静默(用户点过拒绝则不再弹窗)
 * @param {string} [options.hint] 弹窗前提示文案(可选)
 * @returns {Promise<{success:boolean, accepted:string[], refused:string[], errMsg:string}>}
 */
function requestSubscribe({ tmplIds, silent = false, hint = '' } = {}) {
  return new Promise((resolve, reject) => {
    const ids = Array.isArray(tmplIds) ? tmplIds : (tmplIds ? [tmplIds] : []);
    ids.forEach((id) => ensureChecked(id));
    if (!ids.length) {
      return resolve({ success: false, accepted: [], refused: [], errMsg: 'no_tmplIds' });
    }
    const doCall = () => wx.requestSubscribeMessage({
      tmplIds: ids,
      success: (res) => {
        const accepted = [];
        const refused = [];
        for (const k of Object.keys(res || {})) {
          if (ids.indexOf(k) < 0) continue;
          if (res[k] === 'accept') {
            accepted.push(k);
            markAccepted(k);
          } else if (res[k] === 'reject') {
            refused.push(k);
            markRefused(k);
          }
        }
        resolve({ success: accepted.length > 0, accepted, refused, errMsg: '' });
      },
      fail: (err) => {
        resolve({ success: false, accepted: [], refused: ids.slice(), errMsg: (err && err.errMsg) || 'fail' });
      }
    });

    if (hint && !silent) {
      wx.showModal({
        title: '开启消息订阅',
        content: hint,
        confirmText: '开启',
        cancelText: '稍后',
        success: (r) => {
          if (r.confirm) doCall();
          else resolve({ success: false, accepted: [], refused: ids.slice(), errMsg: 'user_cancel' });
        },
        fail: () => doCall()
      });
    } else {
      doCall();
    }
  });
}

/**
 * 一次性订阅多个常用场景
 * @param {string} scenario 场景 key: story / ai / marathon / weather
 */
function subscribeScenario(scenario) {
  const map = {
    story: ['NEW_STORY', 'STORY_LIKED', 'STORY_COMMENT'],
    ai: ['AI_DAILY'],
    marathon: ['MARATHON_COUNTDOWN', 'RACE_RESULT'],
    weather: ['WEATHER_RUN_TIP']
  };
  const ids = map[scenario] || [];
  return requestSubscribe({ tmplIds: ids, silent: false, hint: getHint(scenario) });
}

function getHint(scenario) {
  switch (scenario) {
    case 'story': return '开启后,有新故事 / 你的故事被点赞 / 被评论时会收到微信通知';
    case 'ai': return '开启后,每天可收到兰马文化小知识推送';
    case 'marathon': return '开启后,可收到赛事倒计时与完赛成绩推送';
    case 'weather': return '开启后,可在每日清晨收到跑步天气建议';
    default: return '开启后可收到对应通知';
  }
}

// ====== 本地状态:记录用户是否拒绝过(防止反复弹窗) ======
const KEY_REFUSED = 'lanma_subscribe_refused';
const KEY_ACCEPTED = 'lanma_subscribe_accepted';

function ensureChecked(id) {
  // 占位,后续可接入服务端校验
}

function markRefused(id) {
  try {
    const arr = wx.getStorageSync(KEY_REFUSED) || [];
    if (arr.indexOf(id) < 0) {
      arr.push(id);
      wx.setStorageSync(KEY_REFUSED, arr);
    }
  } catch (e) {}
}

function markAccepted(id) {
  try {
    const arr = wx.getStorageSync(KEY_ACCEPTED) || [];
    if (arr.indexOf(id) < 0) {
      arr.push(id);
      wx.setStorageSync(KEY_ACCEPTED, arr);
    }
    const ref = wx.getStorageSync(KEY_REFUSED) || [];
    const idx = ref.indexOf(id);
    if (idx >= 0) {
      ref.splice(idx, 1);
      wx.setStorageSync(KEY_REFUSED, ref);
    }
  } catch (e) {}
}

function isRefused(id) {
  try { return (wx.getStorageSync(KEY_REFUSED) || []).indexOf(id) >= 0; } catch (e) { return false; }
}

function isAccepted(id) {
  try { return (wx.getStorageSync(KEY_ACCEPTED) || []).indexOf(id) >= 0; } catch (e) { return false; }
}

module.exports = {
  requestSubscribe,
  subscribeScenario,
  isRefused,
  isAccepted,
  KEYS: { REFUSED: KEY_REFUSED, ACCEPTED: KEY_ACCEPTED }
};