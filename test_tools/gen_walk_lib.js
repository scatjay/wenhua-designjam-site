/* 走讀資料檔產生器：共用工具（16x16 畫布、外框、縮小、序列化）。只在 Node 執行，不進網站。 */
'use strict';
var W = 16;
function Cv() { this.g = []; for (var y = 0; y < W; y++) { var r = []; for (var x = 0; x < W; x++) r.push('.'); this.g.push(r); } }
Cv.prototype.clone = function () { var c = new Cv(); for (var y = 0; y < W; y++) c.g[y] = this.g[y].slice(); return c; };
Cv.prototype.get = function (x, y) { return (x >= 0 && x < W && y >= 0 && y < W) ? this.g[y][x] : '.'; };
Cv.prototype.px = function (x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < W) this.g[y][x] = c; return this; };
/* 只畫在已有顏色的格子上（做花紋用） */
Cv.prototype.pxo = function (x, y, c) { x = Math.round(x); y = Math.round(y); if (this.get(x, y) !== '.') this.g[y][x] = c; return this; };
Cv.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.px(x + i, y + j, c); return this; };
Cv.prototype.ell = function (cx, cy, rx, ry, c, over) {
  for (var y = 0; y < W; y++) for (var x = 0; x < W; x++) {
    var dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1 && (!over || this.g[y][x] !== '.')) this.g[y][x] = c;
  } return this;
};
Cv.prototype.poly = function (pts, c) {
  for (var y = 0; y < W; y++) for (var x = 0; x < W; x++) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) this.g[y][x] = c;
  } return this;
};
Cv.prototype.line = function (x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er = dx + dy;
  for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; var e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx; } if (e2 <= dx) { er += dx; y0 += sy; } }
  return this;
};
Cv.prototype.clearBelow = function (y0) { for (var y = y0 + 1; y < W; y++) for (var x = 0; x < W; x++) this.g[y][x] = '.'; return this; };
/* 在不透明格子的四周補一圈外框 */
Cv.prototype.outline = function (ch) {
  var o = this.clone();
  for (var y = 0; y < W; y++) for (var x = 0; x < W; x++) {
    if (this.g[y][x] !== '.') continue;
    if (this.get(x - 1, y) !== '.' || this.get(x + 1, y) !== '.' || this.get(x, y - 1) !== '.' || this.get(x, y + 1) !== '.') o.g[y][x] = ch;
  }
  this.g = o.g; return this;
};
/* 只畫在空白格（做外框之後的閃光、取景框） */
Cv.prototype.free = function (x, y, c) { if (this.get(x, y) === '.') this.px(x, y, c); return this; };
Cv.prototype.plusFree = function (cx, cy, cc, oc) {
  var cells = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var i = 0; i < cells.length; i++) if (this.get(cx + cells[i][0], cy + cells[i][1]) !== '.') return false;
  this.px(cx, cy, cc); this.px(cx + 1, cy, oc); this.px(cx - 1, cy, oc); this.px(cx, cy + 1, oc); this.px(cx, cy - 1, oc); return true;
};
Cv.prototype.rows = function () { return this.g.map(function (r) { return r.join(''); }); };
Cv.prototype.chars = function () { var s = {}; this.g.forEach(function (r) { r.forEach(function (c) { if (c !== '.') s[c] = 1; }); }); return Object.keys(s); };

/* 縮小（幼體用）：裁出外框、縮到 k 倍、靠底置中；眼睛字元 k 有優先權 */
function shrink(src, k, baseY) {
  var minx = W, maxx = -1, miny = W, maxy = -1;
  for (var y = 0; y < W; y++) for (var x = 0; x < W; x++) if (src.g[y][x] !== '.') { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  var bw = maxx - minx + 1, bh = maxy - miny + 1;
  var nw = Math.max(4, Math.round(bw * k)), nh = Math.max(4, Math.round(bh * k));
  var out = new Cv();
  var ox = Math.floor((W - nw) / 2), oy = baseY - nh + 1;
  for (var j = 0; j < nh; j++) for (var i = 0; i < nw; i++) {
    var x0 = minx + i * bw / nw, x1 = minx + (i + 1) * bw / nw, y0 = miny + j * bh / nh, y1 = miny + (j + 1) * bh / nh;
    var cnt = {}, tot = 0, filled = 0;
    for (var yy = Math.floor(y0); yy < Math.ceil(y1 - 1e-9); yy++) for (var xx = Math.floor(x0); xx < Math.ceil(x1 - 1e-9); xx++) {
      var ch = src.get(xx, yy); tot++; if (ch !== '.') { filled++; cnt[ch] = (cnt[ch] || 0) + 1; }
    }
    if (!tot || filled / tot < 0.4) continue;
    var best = null; if (cnt.k) best = 'k'; else Object.keys(cnt).forEach(function (c) { if (!best || cnt[c] > cnt[best]) best = c; });
    out.px(ox + i, oy + j, best);
  }
  return out;
}

/* 序列化：輸出 ES5 相容的資料字面值。小物件放同一行，精靈圖每列一行；Raw 直接輸出原文 */
function Raw(s) { this.s = s; }
function ser(v, ind) {
  ind = ind || '';
  if (v instanceof Raw) return v.s;
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  var one = flat(v);
  if (one.length <= 100 && !hasRaw(v)) return one;
  var ni = ind + '  ', parts;
  if (Array.isArray(v)) { parts = v.map(function (x) { return ni + ser(x, ni); }); return '[\n' + parts.join(',\n') + '\n' + ind + ']'; }
  parts = Object.keys(v).map(function (k) { return ni + JSON.stringify(k) + ': ' + ser(v[k], ni); });
  return '{\n' + parts.join(',\n') + '\n' + ind + '}';
}
function hasRaw(v) { if (v instanceof Raw) return true; if (v && typeof v === 'object') return Object.keys(v).some(function (k) { return hasRaw(v[k]); }); return false; }
function flat(v) { return JSON.stringify(v); }

module.exports = { Cv: Cv, shrink: shrink, ser: ser, Raw: Raw, W: W };
