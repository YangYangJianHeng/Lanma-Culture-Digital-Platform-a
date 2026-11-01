// utils/poster.js - Canvas 分享卡生成

/**
 * 地标分享卡
 * @param {Object} item { name, category, content, distance_from_start, cover_image }
 */
function drawLandmarkPoster(item) {
  return new Promise((resolve, reject) => {
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    const w = 750;
    const h = 1000;
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: w * dpr, height: h * dpr });
    if (!canvas) {
      // 老版基础库退回普通 canvas(部分机型不支持 offscreen)
      return drawByCanvasId(item, w, h, dpr).then(resolve, reject);
    }
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff5f5');
    grad.addColorStop(1, '#fff8e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 头部装饰带
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(0, 0, w, 16);

    // Logo + 标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('🏃 兰马文化', 40, 80);
    ctx.fillStyle = '#999';
    ctx.font = '22px sans-serif';
    ctx.fillText('兰州国际马拉松 · 文化数字平台', 40, 110);

    // 卡片
    roundRect(ctx, 40, 160, w - 80, 580, 24, '#ffffff');
    // 封面占位
    if (item.cover_image) {
      // 异步加载图片
      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, 60, 180, w - 120, 360);
        drawText(ctx, item, w);
        save();
      };
      img.onerror = () => {
        drawPlaceholder(ctx, w);
        drawText(ctx, item, w);
        save();
      };
      img.src = item.cover_image;
    } else {
      drawPlaceholder(ctx, w);
      drawText(ctx, item, w);
      save();
    }

    function drawText(ctx, item, w) {
      // 名称
      ctx.fillStyle = '#222';
      ctx.font = 'bold 40px sans-serif';
      const name = item.name || '兰马地标';
      wrapText(ctx, name, 60, 590, w - 120, 48);

      // 类别 + 距离
      ctx.fillStyle = '#b71c1c';
      ctx.font = '24px sans-serif';
      let metaY = 660;
      ctx.fillText('📍 ' + (item.category || ''), 60, metaY);
      if (item.distance_from_start) {
        ctx.fillText('  ·  距起点 ' + item.distance_from_start + ' km', 60 + ctx.measureText('📍 ' + (item.category || '')).width + 10, metaY);
      }

      // 简介
      ctx.fillStyle = '#666';
      ctx.font = '26px sans-serif';
      wrapText(ctx, (item.content || '').slice(0, 100), 60, 720, w - 120, 38);
    }

    function drawPlaceholder(ctx, w) {
      ctx.fillStyle = '#fff5f5';
      roundRect(ctx, 60, 180, w - 120, 360, 16, '#fff5f5');
      ctx.fillStyle = '#b71c1c';
      ctx.font = '120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📍', w / 2, 380);
      ctx.textAlign = 'left';
    }

    function save() {
      // 底部推广
      ctx.fillStyle = '#b71c1c';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('扫码打卡,一起来跑兰马 🏁', 40, 880);
      ctx.fillStyle = '#999';
      ctx.font = '22px sans-serif';
      ctx.fillText('微信小程序 · 兰马文化数字平台', 40, 920);

      // 二维码占位
      ctx.fillStyle = '#fff';
      roundRect(ctx, w - 200, 800, 160, 160, 12, '#fff');
      ctx.strokeStyle = '#b71c1c';
      ctx.lineWidth = 4;
      ctx.strokeRect(w - 200, 800, 160, 160);
      ctx.fillStyle = '#b71c1c';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('小程序码', w - 120, 890);

      try {
        wx.canvasToTempFilePath({
          canvas,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      } catch (e) { reject(e); }
    }
  });
}

function drawByCanvasId(item, w, h, dpr) {
  return new Promise((resolve, reject) => {
    // 退化方案:用 hidden canvas 组件。调用方需提供 canvas-id。
    reject(new Error('offscreen canvas not supported'));
  });
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = String(text).split('');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i];
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

/** 奖牌分享卡 */
function drawMedalPoster(item) {
  return new Promise((resolve, reject) => {
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    const w = 750;
    const h = 1000;
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: w * dpr, height: h * dpr });
    if (!canvas) return reject(new Error('offscreen canvas not supported'));
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 背景 - 金色渐变
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fff8e1');
    grad.addColorStop(0.5, '#ffecb3');
    grad.addColorStop(1, '#ffd54f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 顶部红色装饰
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(0, 0, w, 16);

    // 标题
    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('🏅 兰马奖牌博物馆', 40, 80);
    ctx.fillStyle = '#5d4037';
    ctx.font = '22px sans-serif';
    ctx.fillText('兰州国际马拉松 · 文化数字平台', 40, 110);

    // 年份大数字
    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(item.year || ''), w / 2, 240);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5d4037';
    ctx.font = '28px sans-serif';
    ctx.fillText('🏅 第 ' + (item.year || '') + ' 届', w / 2 - 80, 290);

    // 主图区
    if (item.imageUrl || item.thumbnail_url) {
      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, (w - 480) / 2, 320, 480, 480);
        finish();
      };
      img.onerror = () => {
        ctx.fillStyle = '#fff';
        roundRect(ctx, (w - 480) / 2, 320, 480, 480, 24, '#fff');
        ctx.fillStyle = '#b71c1c';
        ctx.font = '180px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏅', w / 2, 620);
        ctx.textAlign = 'left';
        finish();
      };
      img.src = item.imageUrl || item.thumbnail_url;
    } else {
      ctx.fillStyle = '#fff';
      roundRect(ctx, (w - 480) / 2, 320, 480, 480, 24, '#fff');
      ctx.fillStyle = '#b71c1c';
      ctx.font = '180px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏅', w / 2, 620);
      ctx.textAlign = 'left';
      finish();
    }

    function finish() {
      // 名称
      ctx.fillStyle = '#222';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name || '兰马奖牌', w / 2, 870);
      // 主题
      ctx.fillStyle = '#666';
      ctx.font = '24px sans-serif';
      ctx.fillText('"' + (item.theme || '').slice(0, 28) + '"', w / 2, 910);
      // 底部二维码
      ctx.fillStyle = '#fff';
      roundRect(ctx, w - 200, 800, 160, 160, 12, '#fff');
      ctx.strokeStyle = '#b71c1c';
      ctx.lineWidth = 4;
      ctx.strokeRect(w - 200, 800, 160, 160);
      ctx.fillStyle = '#b71c1c';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('小程序码', w - 120, 890);
      ctx.textAlign = 'left';

      try {
        wx.canvasToTempFilePath({
          canvas,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      } catch (e) { reject(e); }
    }
  });
}

module.exports = { drawLandmarkPoster, drawMedalPoster, drawCertificatePoster };

/** 完赛证书海报 */
function drawCertificatePoster(c) {
  return new Promise((resolve, reject) => {
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    const w = 750;
    const h = 1180;
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: w * dpr, height: h * dpr });
    if (!canvas) return reject(new Error('offscreen canvas not supported'));
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 背景:暖米色羊皮纸
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fdf6e3');
    grad.addColorStop(0.5, '#f7efd6');
    grad.addColorStop(1, '#fdf6e3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 双层外框(深红)
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b71c1c';
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // 顶部丝带
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = '#fbc02d';
    ctx.fillRect(0, 12, w, 4);

    // 标题
    ctx.fillStyle = '#5d4037';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LANZHOU INTERNATIONAL MARATHON', w / 2, 110);

    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 56px serif';
    ctx.fillText('完赛证书', w / 2, 180);

    ctx.fillStyle = '#8d6e63';
    ctx.font = '20px sans-serif';
    ctx.fillText('CERTIFICATE OF COMPLETION', w / 2, 220);

    // 横线
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 250);
    ctx.lineTo(w - 120, 250);
    ctx.stroke();

    // 主体文案
    ctx.fillStyle = '#5d4037';
    ctx.font = '28px sans-serif';
    ctx.fillText('兹证明', w / 2, 310);

    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 60px serif';
    ctx.fillText(c.name || '跑者', w / 2, 400);

    // 参赛项目行
    ctx.fillStyle = '#5d4037';
    ctx.font = '26px sans-serif';
    const cat = c.category || '马拉松';
    ctx.fillText('已圆满完成 ' + (c.year || '2024') + ' 兰州国际马拉松', w / 2, 480);

    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#b71c1c';
    ctx.fillText(cat, w / 2, 530);

    // 成绩区域(三列)
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#8d6e63';

    const colY = 620;
    const cols = [
      { x: 200, label: '枪声成绩', value: c.gun_time || '--:--:--' },
      { x: w / 2, label: '净成绩', value: c.net_time || '--:--:--' },
      { x: w - 200, label: '完赛名次', value: c.rank ? '#' + c.rank : '-' }
    ];
    cols.forEach((col) => {
      ctx.fillText(col.label, col.x, colY);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#b71c1c';
      ctx.fillText(col.value, col.x, colY + 50);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#8d6e63';
    });

    // 装饰线
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 720);
    ctx.lineTo(w - 120, 720);
    ctx.stroke();

    // 信息区
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5d4037';
    ctx.font = '24px sans-serif';
    ctx.fillText('比赛日期: ' + (c.date || '2024年6月'), 120, 780);
    ctx.fillText('完赛号: ' + (c.bib_no || 'L' + (c.year || 24) + '0001'), 120, 830);
    ctx.fillText('完赛奖牌: ' + (c.medal || '已颁发'), 120, 880);

    // 章印
    ctx.beginPath();
    ctx.arc(w / 2, 1020, 90, 0, Math.PI * 2);
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, 1020, 75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LANMA', w / 2, 1015);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText((c.year || '2024') + ' FINISHER', w / 2, 1045);

    // 二维码 + 底部
    ctx.fillStyle = '#fff';
    roundRect(ctx, w - 200, 880, 160, 160, 12, '#fff');
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 4;
    ctx.strokeRect(w - 200, 880, 160, 160);
    ctx.fillStyle = '#b71c1c';
    ctx.font = '20px sans-serif';
    ctx.fillText('小程序码', w - 120, 970);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#8d6e63';
    ctx.font = '20px sans-serif';
    ctx.fillText('兰马文化数字平台官方颁发', 100, 1130);

    try {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      });
    } catch (e) { reject(e); }
  });
}