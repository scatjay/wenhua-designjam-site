/* 走讀遊戲：像素繪製工具 WalkPix（字串矩陣 + 調色盤 → canvas）。
   只放工具與共用調色盤，不放小精靈與家具的圖（那些是資料檔的事）。
   矩陣＝字串陣列（或以換行分隔的單一字串），每個字元對應調色盤的一種顏色，'.' 與空白為透明。
   ES5 風格 IIFE，無外部相依；沒有 document（例如 node 測試）時，toCanvas／toDataURL 回傳 null，draw 仍可對任何 2D context 運作。 */
(function (root) {
  'use strict';

  /* 共用調色盤（16 位元風，色彩沿用 walk_sprites.js／walk_pet.js 的暖色底） */
  var PAL = {
    'k': '#2b2233', /* 輪廓深紫黑 */
    'w': '#fff4e0', /* 暖白 */
    's': '#ffe0ec', /* 淡粉 */
    'g': '#9aa0a6', /* 灰 */
    'G': '#5b6068', /* 深灰 */
    'r': '#d9534f', /* 紅 */
    'o': '#f0953a', /* 橘 */
    'y': '#f6d55c', /* 黃 */
    'l': '#8bc34a', /* 淺綠 */
    'n': '#3f8f4e', /* 綠 */
    'c': '#6ccbd9', /* 青 */
    'b': '#3c6fc4', /* 藍 */
    'B': '#223a7a', /* 深藍 */
    'p': '#e58fb5', /* 粉紅 */
    'P': '#8a5aa8', /* 紫 */
    'm': '#a0673c', /* 棕 */
    'M': '#5a3a3a', /* 深棕 */
    'e': '#e8c9a0'  /* 膚色 */
  };

  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

  /* 把矩陣正規化成字串陣列 */
  function rows(matrix) {
    if (!matrix) return [];
    if (typeof matrix === 'string') return matrix.split(/\r?\n/).filter(function (r) { return r.length > 0; });
    if (isArr(matrix)) return matrix;
    return [];
  }

  /* 取得顏色：自訂調色盤優先，其次共用調色盤；'.'、空白或查無回傳 null（透明） */
  function colorOf(ch, palette) {
    if (ch === '.' || ch === ' ' || ch === undefined) return null;
    if (palette && palette[ch] !== undefined) return palette[ch] || null;
    return PAL[ch] || null;
  }

  function size(matrix) {
    var r = rows(matrix), w = 0, i;
    for (i = 0; i < r.length; i++) if (r[i].length > w) w = r[i].length;
    return { w: w, h: r.length };
  }

  /* 左右翻轉，回傳新矩陣（字串陣列） */
  function flip(matrix) {
    return rows(matrix).map(function (r) { return r.split('').reverse().join(''); });
  }

  /* 上下翻轉 */
  function flipV(matrix) {
    return rows(matrix).slice().reverse();
  }

  /* 把矩陣畫到 ctx 的 (x, y)，每個像素放大 scale 倍。opts: { flip:bool, alpha:0-1 } */
  function draw(ctx, matrix, palette, x, y, scale, opts) {
    var r = rows(matrix), sc = scale || 1, o = opts || {};
    var i, j, c, line;
    if (o.flip) r = flip(r);
    var prevAlpha = null;
    if (o.alpha !== undefined && o.alpha !== null) { prevAlpha = ctx.globalAlpha; ctx.globalAlpha = o.alpha; }
    for (i = 0; i < r.length; i++) {
      line = r[i];
      for (j = 0; j < line.length; j++) {
        c = colorOf(line.charAt(j), palette);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(Math.round(x + j * sc), Math.round(y + i * sc), sc, sc);
      }
    }
    if (prevAlpha !== null) ctx.globalAlpha = prevAlpha;
  }

  function hasDom() { return typeof document !== 'undefined' && document && typeof document.createElement === 'function'; }

  /* 產生一個 canvas（尺寸 = 矩陣尺寸 × scale）；沒有 DOM 時回傳 null */
  function toCanvas(matrix, palette, scale, opts) {
    if (!hasDom()) return null;
    var s = size(matrix), sc = scale || 1;
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, s.w * sc);
    cv.height = Math.max(1, s.h * sc);
    var ctx = cv.getContext('2d');
    if (ctx) {
      if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;
      draw(ctx, matrix, palette, 0, 0, sc, opts);
    }
    return cv;
  }

  /* 轉成 data URL（可放進 <img src>）；沒有 DOM 時回傳 null。簡單快取同一矩陣、調色盤與倍率。 */
  var urlCache = {};
  var urlCacheN = 0;
  function toDataURL(matrix, palette, scale, opts) {
    var cv;
    var key = null;
    if (!hasDom()) return null;
    try { key = rows(matrix).join('/') + '|' + (palette ? JSON.stringify(palette) : '') + '|' + (scale || 1) + '|' + (opts && opts.flip ? 'f' : ''); } catch (e) { key = null; }
    if (key && urlCache[key]) return urlCache[key];
    cv = toCanvas(matrix, palette, scale, opts);
    if (!cv) return null;
    var url = cv.toDataURL('image/png');
    if (key) {
      if (urlCacheN > 200) { urlCache = {}; urlCacheN = 0; }
      urlCache[key] = url; urlCacheN++;
    }
    return url;
  }

  /* 動畫格輔助：frames 是矩陣陣列，fps 預設 8；frameAt(t) 依時間（毫秒）取格。 */
  function anim(frames, fps) {
    var f = frames || [], rate = fps || 8;
    return {
      frames: f,
      fps: rate,
      length: f.length,
      index: function (tMs) { if (!f.length) return 0; return Math.floor((tMs || 0) / (1000 / rate)) % f.length; },
      frameAt: function (tMs) { return f.length ? f[this.index(tMs)] : null; },
      /* 直接畫目前格 */
      drawAt: function (ctx, palette, x, y, scale, tMs, opts) {
        var m = this.frameAt(tMs);
        if (m) draw(ctx, m, palette, x, y, scale, opts);
      }
    };
  }

  /* 兩格待機：以 y 位移 0／1 模擬呼吸起伏（不需要另外畫格）。回傳 0 或 1。 */
  function bob(tMs, periodMs) {
    var p = periodMs || 800;
    return (Math.floor((tMs || 0) / (p / 2)) % 2);
  }

  /* 把字串矩陣中的某個字元換成另一個（做換色或眨眼格），回傳新矩陣 */
  function recolor(matrix, from, to) {
    return rows(matrix).map(function (r) { return r.split(from).join(to); });
  }

  /* ---- 形態：配色偏移＋配件 ---- */
  function hexToRgb(h) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || ''));
    if (!m) return null;
    h = m[1];
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function rgbToHex(c) {
    function p(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); }
    return '#' + p(c[0]) + p(c[1]) + p(c[2]);
  }
  function lum(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }
  /* 把顏色往 tint.color 混合 amount；太暗的輪廓色不動 */
  function tintColor(hex, tint) {
    var c = hexToRgb(hex), t = tint && hexToRgb(tint.color), a = tint ? tint.amount : 0;
    if (!c || !t || !(a > 0) || lum(c) < 50) return hex;
    return rgbToHex([c[0] + (t[0] - c[0]) * a, c[1] + (t[1] - c[1]) * a, c[2] + (t[2] - c[2]) * a]);
  }
  function formDefOf(formId) {
    var d = root.WALK_FORMS, i;
    if (!formId || !d) return null;
    if (d.byId && d.byId[formId]) return d.byId[formId];
    if (isArr(d)) { for (i = 0; i < d.length; i++) if (d[i] && d[i].id === formId) return d[i]; }
    return null;
  }
  /* formSprite(matrix, palette, formId) → { matrix, palette }：原圖套配色偏移並疊加配件（配件的 '.' 不蓋）。
     matrix 可以是字串陣列，也可以是 {rows, pal} 的精靈物件；輸出一律是 16×16 字串陣列與完整調色盤（字元→#rrggbb）。formId 空或查無回傳原圖。 */
  function formSprite(matrix, palette, formId) {
    var src = matrix, pal = palette, f = formDefOf(formId), base, out = [], outPal = {}, i, j, ch, line, acc, accRows, k, c;
    if (src && !isArr(src) && typeof src === 'object' && src.rows) { pal = pal || src.pal; src = src.rows; }
    base = rows(src);
    if (!f) return { matrix: base, palette: pal || {} };
    for (i = 0; i < 16; i++) {
      line = base[i] || '';
      while (line.length < 16) line += '.';
      out.push(line.substr(0, 16).split(''));
    }
    for (i = 0; i < 16; i++) for (j = 0; j < 16; j++) {
      ch = out[i][j];
      if (ch === '.' || ch === ' ') { out[i][j] = '.'; continue; }
      if (outPal[ch] === undefined) {
        c = colorOf(ch, pal);
        if (!c) { out[i][j] = '.'; continue; }
        outPal[ch] = tintColor(c, f.tint);
      }
    }
    acc = f.accessory;
    if (acc && acc.rows) {
      accRows = rows(acc.rows);
      for (i = 0; i < 16 && i < accRows.length; i++) {
        for (j = 0; j < 16 && j < accRows[i].length; j++) {
          ch = accRows[i].charAt(j);
          if (ch === '.' || ch === ' ') continue;
          if (acc.pal && acc.pal[ch]) { out[i][j] = ch; outPal[ch] = acc.pal[ch]; }
        }
      }
    }
    k = out.map(function (r) { return r.join(''); });
    return { matrix: k, palette: outPal };
  }

  root.WalkPix = {
    formSprite: formSprite,
    PAL: PAL,
    rows: rows,
    size: size,
    colorOf: colorOf,
    flip: flip,
    flipV: flipV,
    draw: draw,
    toCanvas: toCanvas,
    toDataURL: toDataURL,
    anim: anim,
    bob: bob,
    recolor: recolor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WalkPix;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
