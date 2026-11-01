const api = require('../../utils/api.js');
const subscribe = require('../../utils/subscribe.js');
const util = require('../../utils/util.js');

const WEATHER_ICONS = {
  '晴': '☀️', '多云': '⛅', '阴': '☁️', '霾': '🌫',
  '小雨': '🌦', '中雨': '🌧', '大雨': '⛈', '暴雨': '⛈',
  '雷阵雨': '⛈', '雪': '❄️', '小雪': '🌨', '雾': '🌫️', '沙尘暴': '🌪'
};

function iconFor(desc) {
  if (!desc) return '☀️';
  for (const k of Object.keys(WEATHER_ICONS)) {
    if (desc.indexOf(k) >= 0) return WEATHER_ICONS[k];
  }
  return '☀️';
}

function dayLabel(date, idx) {
  if (idx === 0) return '今天';
  if (idx === 1) return '明天';
  if (idx === 2) return '后天';
  try {
    const d = date ? new Date(date) : new Date();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[d.getDay()];
  } catch (e) { return ''; }
}

function hourLabel(h) {
  const H = h < 10 ? ('0' + h) : h;
  return H + ':00';
}

function buildTrend(list) {
  if (!Array.isArray(list) || list.length === 0) return { points: [], maxTemp: 0, minTemp: 0, yLabels: [] };
  // 归一化为 24 个时段
  let items = list.slice(0, 24);
  items = items.map((it, idx) => {
    const temp = Number(it.temperature || it.temperature_min || it.temperature_max || 0);
    const cond = it.weatherCondition || it.weather || it.description || '晴';
    const date = it.recordTime || it.record_time || it.observed_at || it.date;
    const hour = (() => {
      try { return new Date(date).getHours(); } catch (e) { return idx; }
    })();
    return { temp, cond, hour };
  });

  const temps = items.map((i) => i.temp).filter((n) => !isNaN(n));
  if (temps.length === 0) return { points: [], maxTemp: 0, minTemp: 0, yLabels: [] };
  const maxTemp = Math.ceil(Math.max(...temps));
  const minTemp = Math.floor(Math.min(...temps));
  const range = Math.max(maxTemp - minTemp, 1);

  const points = items.map((it, idx) => {
    const pct = ((it.temp - minTemp) / range) * 100;
    let color1 = '#42a5f5', color2 = '#90caf9';
    if (it.temp >= 30) { color1 = '#ef5350'; color2 = '#ffab91'; }
    else if (it.temp >= 20) { color1 = '#ffa726'; color2 = '#ffcc80'; }
    else if (it.temp <= 5) { color1 = '#42a5f5'; color2 = '#bbdefb'; }
    return {
      temp: it.temp,
      icon: iconFor(it.cond),
      hourLabel: hourLabel(it.hour != null ? it.hour : idx),
      heightPct: Math.max(pct, 8),
      color1, color2
    };
  });

  const yLabels = [maxTemp, Math.round((maxTemp + minTemp) / 2), minTemp];
  return { points, maxTemp, minTemp, yLabels };
}

function buildTempRange(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return arr;
  const allTemps = [];
  arr.forEach((it) => {
    const lo = Number(it.tempMin || it.temperature_min || it.temperature);
    const hi = Number(it.tempMax || it.temperature_max || it.temperature);
    if (!isNaN(lo)) allTemps.push(lo);
    if (!isNaN(hi)) allTemps.push(hi);
  });
  const minAll = allTemps.length ? Math.min(...allTemps) : 0;
  const maxAll = allTemps.length ? Math.max(...allTemps) : 1;
  const range = Math.max(maxAll - minAll, 1);
  return arr.map((it, idx) => {
    const lo = Number(it.tempMin || it.temperature_min || it.temperature || minAll);
    const hi = Number(it.tempMax || it.temperature_max || it.temperature || maxAll);
    const dayLabel_ = dayLabel(it.recordTime || it.record_time || it.observed_at || it.date, idx);
    return {
      ...it,
      lowPct: ((lo - minAll) / range) * 100,
      highPct: ((hi - minAll) / range) * 100,
      icon: iconFor(it.weatherCondition || it.weather || it.description || '晴'),
      dayLabel: dayLabel_
    };
  });
}

function buildRunningAdvice(now) {
  if (!now) return null;
  const temp = Number(now.temperature || now.temperature_min || 0);
  const humidity = Number(now.humidity || 50);
  const wind = Number(now.windSpeed || now.wind_speed || 0);
  const cond = (now.weatherCondition || now.weather || '') + '';
  let score = 85;
  if (temp >= 18 && temp <= 24) score += 10;
  else if (temp > 30 || temp < 5) score -= 25;
  else if (temp > 26 || temp < 10) score -= 10;
  if (humidity > 80) score -= 8;
  if (wind > 8) score -= 10;
  if (cond.indexOf('雨') >= 0) score -= 15;
  if (cond.indexOf('雪') >= 0) score -= 10;
  if (cond.indexOf('霾') >= 0 || cond.indexOf('雾') >= 0) score -= 12;
  score = Math.max(0, Math.min(100, score));

  let level = '适宜跑步';
  let main = '各项条件都不错,可以开跑!';
  let sub = '';
  let color1 = '#66bb6a', color2 = '#a5d6a7';
  if (score >= 85) {
    level = '极佳';
    main = '完美的跑步日';
    color1 = '#43a047'; color2 = '#a5d6a7';
  } else if (score >= 70) {
    level = '良好';
    main = '适宜跑步';
    color1 = '#fb8c00'; color2 = '#ffd180';
  } else if (score >= 50) {
    level = '一般';
    main = '注意防护';
    color1 = '#f4511e'; color2 = '#ffab91';
  } else {
    level = '不推荐';
    main = '建议改为室内训练';
    color1 = '#c62828'; color2 = '#ef9a9a';
  }

  const tips = [];
  if (temp >= 28) tips.push('温度较高,推荐早晚训练');
  else if (temp <= 5) tips.push('注意保暖');
  if (humidity > 80) tips.push('湿度大,补水要勤');
  if (wind > 8) tips.push('风力较大');
  if (cond.indexOf('雨') >= 0) tips.push('有降雨,关注路面');
  if (cond.indexOf('霾') >= 0) tips.push('空气较差,建议室内');
  sub = tips.length ? tips.join(' · ') : '祝您跑出好成绩!';
  return { score, level, main, sub, color1, color2 };
}

function buildSunriseSunset(now) {
  if (!now) return {};
  // 后端若没提供 sunrise/sunset,根据日期推算个默认值
  if (now.sunrise || now.sunset) return { sunrise: now.sunrise, sunset: now.sunset };
  const d = new Date();
  const month = d.getMonth() + 1; // 1-12
  // 兰州地区简化估算
  const sunriseDefault = month <= 3 || month >= 11 ? '07:30' : (month <= 5 || month >= 9 ? '06:30' : '06:00');
  const sunsetDefault = month <= 3 || month >= 11 ? '18:30' : (month <= 5 || month >= 9 ? '19:30' : '20:00');
  return { sunrise: sunriseDefault, sunset: sunsetDefault };
}

function buildUviLabel(uvi) {
  if (uvi == null || uvi === '') return '--';
  const n = Number(uvi);
  if (n < 3) return '弱';
  if (n < 6) return '中等';
  if (n < 8) return '强';
  if (n < 11) return '很强';
  return '极强';
}

Page({
  data: {
    location: '兰州',
    now: null,
    forecast: [],
    history: [],
    trend: { points: [], maxTemp: 0, minTemp: 0, yLabels: [] },
    weatherIcon: '☀️',
    weatherDesc: '--',
    sunriseSunset: {},
    runningAdvice: null,
    uviLabel: '--',
    updateTime: ''
  },

  onLoad() {
    this.load();
    // 跑步天气订阅(避开 12-14 时,适合清晨/傍晚跑步的提醒)
    setTimeout(() => {
      subscribe.requestSubscribe({
        tmplIds: ['WEATHER_RUN_TIP'],
        silent: true,
        hint: '开启后,每日清晨/傍晚跑步时段可收到兰马推荐天气推送'
      });
    }, 1500);
  },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  async load() {
    try {
      const [nowRes, forecastRes, historyRes] = await Promise.all([
        api.weather.now(this.data.location).catch(() => null),
        api.weather.forecast(this.data.location).catch(() => []),
        api.weather.history(this.data.location, 7).catch(() => [])
      ]);
      const now = nowRes || {};
      const cond = now.weatherCondition || now.weather || now.description || '晴';
      const forecast = buildTempRange(forecastRes || []);
      const history = buildTempRange(historyRes || []);
      this.setData({
        now,
        forecast,
        history,
        trend: buildTrend(forecastRes || historyRes || []),
        weatherIcon: iconFor(cond),
        weatherDesc: cond,
        sunriseSunset: buildSunriseSunset(now),
        runningAdvice: buildRunningAdvice(now),
        uviLabel: buildUviLabel(now.uvi || now.uv_index || now.UVI),
        updateTime: new Date().toLocaleString('zh-CN')
      });
    } catch (e) {}
  },

  onChangeLocation(e) {
    this.setData({ location: e.detail.value });
  },
  onConfirmLocation() { this.load(); },

  onShareAppMessage() {
    return util.shareConfig({
      title: '兰州' + (this.data.now && this.data.now.temperature ? '· 当前 ' + this.data.now.temperature + '°' : '') + ' 实时天气',
      path: '/pages/weather/weather'
    });
  },

  onShareTimeline() {
    return util.shareConfig({ title: '兰州实时天气 · 兰马文化' });
  }
});