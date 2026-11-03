/* 走讀小精靈：16 隻的像素圖畫法與文字資料。由 gen_walk_data.js 呼叫，輸出 js/walk_data_spirit.js。 */
'use strict';
var L = require('./gen_walk_lib.js'), Cv = L.Cv;
var BASE = { o: '#1b1b2f', O: '#8a5a10', k: '#1b1b2f', w: '#ffffff', p: '#e87fa8', g: '#f2c14e', y: '#fff3b0' };

/* ---------- 16 隻成體畫法（填色層，尚未加外框）---------- */
var DRAW = {};
DRAW.tide = function (c) {
  c.line(10, 5, 10, 3, 'e'); c.px(8, 2, 'c'); c.px(10, 1, 'c'); c.px(12, 2, 'c'); c.px(9, 3, 'c'); c.px(11, 3, 'c'); c.px(10, 2, 'e');
  c.poly([[0, 3], [3, 6], [4, 8], [3, 10], [0, 7]], 'b'); c.ell(3.5, 8.5, 2.6, 2, 'a');
  c.ell(8.5, 9.5, 6, 4, 'a'); c.ell(9, 11.5, 4.6, 1.8, 'd');
  c.line(6, 11, 12, 11, 'c'); c.poly([[7, 12], [10, 12], [7.5, 14]], 'b');
  c.px(12, 8, 'k'); c.px(12, 10, 'p'); c.line(13, 10, 11, 10, 'b');
};
DRAW.deer = function (c) {
  c.line(12, 3, 12, 1, 'c'); c.line(12, 2, 10, 1, 'c'); c.line(13, 3, 14, 1, 'c'); c.px(11, 3, 'c');
  c.rect(3, 12, 1, 2, 'b'); c.rect(5, 12, 1, 2, 'b'); c.rect(9, 12, 1, 2, 'b'); c.rect(11, 12, 1, 2, 'b');
  c.px(3, 14, 'k'); c.px(5, 14, 'k'); c.px(9, 14, 'k'); c.px(11, 14, 'k');
  c.ell(7, 10, 5, 3, 'a'); c.ell(7, 11.6, 3.6, 1.2, 'd');
  c.poly([[9, 8], [11, 4], [13, 5], [12, 10]], 'a'); c.ell(12.5, 5.5, 2.2, 1.8, 'a');
  c.poly([[10, 4], [10, 2], [12, 3.5]], 'b');
  c.px(14, 6, 'd'); c.px(14, 5, 'k'); c.px(12, 5, 'k');
  [[5, 9], [7, 8], [9, 10], [4, 11], [6, 10]].forEach(function (p) { c.pxo(p[0], p[1], 'd'); });
  c.px(2, 8, 'd'); c.px(2, 9, 'd');
};
DRAW.gull = function (c) {
  c.line(12, 4, 12, 2, 'd'); c.px(12, 1, 'e');
  c.poly([[0, 8], [3, 8], [4, 11], [0, 11]], 'b'); c.ell(7.5, 9.5, 5, 3, 'a'); c.ell(12, 6.5, 2.3, 2.2, 'a');
  c.poly([[4, 10], [8, 3], [11, 5], [9, 10]], 'b'); c.line(10, 5, 8, 8, 'd');
  c.px(14, 6, 'c'); c.px(14, 7, 'c'); c.px(13, 7, 'c'); c.px(12, 5, 'e');
  c.ell(6.8, 10, 1.7, 1.7, 'd'); c.px(7, 10, 'a');
  c.line(6, 12, 6, 14, 'c'); c.line(9, 12, 9, 14, 'c'); c.px(5, 14, 'c'); c.px(10, 14, 'c');
};
DRAW.sail = function (c) {
  c.rect(7, 1, 1, 11, 'b'); c.poly([[6.5, 2], [6.5, 11.5], [1, 11.5]], 'a'); c.poly([[8.5, 3], [8.5, 11.5], [13.5, 11.5]], 'c');
  c.poly([[8, 1], [11.5, 2], [8, 3.5]], 'e');
  c.poly([[1, 12], [14, 12], [12, 14], [3, 14]], 'b');
  c.px(3, 9, 'k'); c.px(5, 9, 'k'); c.px(4, 10, 'p');
  c.px(2, 14, 'd'); c.px(7, 14, 'd'); c.px(12, 14, 'd');
};
DRAW.bookworm = function (c) {
  c.rect(1, 10, 14, 5, 'd'); c.rect(2, 10, 6, 4, 'c'); c.rect(8, 10, 6, 4, 'c'); c.line(8, 10, 8, 13, 'd');
  c.px(3, 11, 'b'); c.px(4, 11, 'b'); c.px(3, 12, 'b'); c.px(10, 11, 'b'); c.px(11, 11, 'b'); c.px(11, 12, 'b');
  c.px(12, 13, 'e'); c.px(12, 14, 'e');
  c.line(3, 5, 1, 2, 'b'); c.line(5, 5, 7, 2, 'b');
  c.ell(4, 7.5, 2.4, 2.2, 'a'); c.ell(7.5, 8.5, 2, 1.8, 'a'); c.ell(10.5, 8.8, 1.8, 1.6, 'a'); c.ell(12.8, 9.2, 1.2, 1, 'a');
  c.px(7, 7, 'b'); c.px(7, 9, 'b'); c.px(10, 8, 'b'); c.px(10, 10, 'b');
  c.px(3, 7, 'k'); c.px(5, 7, 'k'); c.px(4, 9, 'p'); c.px(14, 8, 'b'); c.px(14, 10, 'b');
};
DRAW.abacus = function (c) {
  c.poly([[2, 4], [3, 1], [6, 4]], 'b'); c.poly([[10, 4], [13, 1], [14, 4]], 'b');
  c.rect(1, 4, 14, 9, 'b'); c.rect(2, 5, 12, 7, 'e'); c.line(2, 8, 13, 8, 'd');
  c.ell(5, 6, 1.7, 1.4, 'c'); c.ell(10, 6, 1.7, 1.4, 'c'); c.px(5, 6, 'k'); c.px(10, 6, 'k'); c.rect(7, 6, 2, 1, 'k');
  [3.5, 6, 8.5, 11, 13].forEach(function (x, i) { c.ell(x, 10.5, 1, 1.1, i % 2 ? 'a' : 'c'); });
  c.rect(3, 13, 3, 2, 'b'); c.rect(10, 13, 3, 2, 'b');
};
DRAW.lion = function (c) {
  c.rect(5, 1, 2, 2, 'b'); c.rect(9, 1, 2, 2, 'b'); c.rect(7, 2, 2, 1, 'b');
  c.rect(2, 13, 12, 2, 'e');
  c.ell(8, 8, 6.5, 5, 'b'); c.ell(3.5, 4, 1.6, 1.6, 'b'); c.ell(12.5, 4, 1.6, 1.6, 'b');
  c.ell(8, 9, 4.3, 3.6, 'a');
  c.line(5, 7, 6, 7, 'k'); c.line(10, 7, 11, 7, 'k'); c.rect(5, 8, 2, 1, 'd'); c.rect(10, 8, 2, 1, 'd');
  c.rect(7, 10, 2, 1, 'k'); c.line(6, 12, 10, 12, 'k'); c.px(7, 11, 'w'); c.px(9, 11, 'w');
  c.rect(4, 13, 3, 1, 'c'); c.rect(9, 13, 3, 1, 'c');
};
DRAW.brick = function (c) {
  c.ell(13, 11, 1.3, 2.4, 'a'); c.px(14, 8, 'a');
  c.poly([[4.5, 3.5], [5, 0.5], [7.5, 2.5]], 'a'); c.poly([[8.5, 2.5], [11, 0.5], [11.5, 3.5]], 'a');
  c.ell(8, 10.5, 4.6, 3.8, 'a'); c.ell(8, 5.5, 4.2, 3.2, 'a');
  c.px(5, 2, 'c'); c.px(10, 2, 'c');
  c.rect(5, 5, 2, 2, 'e'); c.rect(9, 5, 2, 2, 'e'); c.px(6, 5, 'k'); c.px(6, 6, 'k'); c.px(9, 5, 'k'); c.px(9, 6, 'k'); c.px(8, 7, 'p');
  c.px(3, 7, 'd'); c.px(12, 7, 'd');
  c.line(5, 10, 11, 10, 'b'); c.line(5, 12, 11, 12, 'b');
  [6, 10].forEach(function (x) { c.pxo(x, 9, 'b'); c.pxo(x, 13, 'b'); }); c.pxo(8, 11, 'b');
  c.rect(5, 13, 2, 2, 'a'); c.rect(9, 13, 2, 2, 'a');
};
DRAW.watch = function (c) {
  c.line(5, 3, 3, 1, 'd'); c.line(10, 3, 12, 1, 'd'); c.px(3, 1, 'e'); c.px(12, 1, 'e');
  c.rect(7, 1, 2, 2, 'b');
  c.ell(7.5, 8, 5.3, 5.3, 'a'); c.ell(7.5, 8, 4.2, 4.2, 'c');
  c.px(7, 4, 'k'); c.px(7, 12, 'k'); c.px(4, 8, 'k'); c.px(11, 8, 'k');
  c.line(7, 8, 7, 5, 'k'); c.line(7, 8, 10, 9, 'k'); c.px(7, 8, 'e'); c.px(6, 10, 'e'); c.px(8, 11, 'p');
  c.px(4, 13, 'd'); c.px(3, 14, 'd'); c.px(6, 14, 'd'); c.px(9, 14, 'd'); c.px(11, 13, 'd'); c.px(12, 14, 'd');
};
DRAW.telegraph = function (c) {
  c.rect(0, 11, 16, 1, 'b');
  c.poly([[0, 8], [3, 7], [4, 10], [0, 11]], 'b'); c.ell(7, 8, 4, 3.2, 'a'); c.ell(8, 9.4, 2.4, 1.2, 'd'); c.ell(6, 8, 2.4, 1.6, 'b');
  c.ell(11, 5.5, 2.5, 2.4, 'a'); c.px(10, 2, 'e'); c.px(10, 3, 'e'); c.px(11, 3, 'e');
  c.px(13, 5, 'c'); c.px(14, 6, 'c'); c.px(13, 6, 'c'); c.px(11, 5, 'k');
  c.px(6, 12, 'c'); c.px(9, 12, 'c');
  c.rect(1, 13, 14, 2, 'd'); [3, 6, 7, 10, 13].forEach(function (x, i) { c.px(x, i % 2 ? 14 : 13, 'k'); });
};
DRAW.radio = function (c) {
  c.line(5, 4, 3, 1, 'c'); c.line(10, 4, 12, 1, 'c'); c.px(3, 1, 'e'); c.px(12, 1, 'e');
  c.px(1, 7, 'd'); c.px(0, 8, 'd'); c.px(1, 9, 'd'); c.px(14, 7, 'd'); c.px(15, 8, 'd'); c.px(14, 9, 'd');
  c.rect(2, 4, 12, 9, 'a'); c.rect(3, 5, 10, 7, 'b');
  c.rect(6, 5, 4, 1, 'e');
  c.ell(5.5, 7.5, 1.8, 1.7, 'w'); c.ell(10.5, 7.5, 1.8, 1.7, 'w'); c.px(5, 8, 'k'); c.px(10, 8, 'k');
  c.rect(4, 10, 8, 2, 'a'); [5, 7, 9, 11].forEach(function (x) { c.px(x, 10, 'c'); c.px(x, 11, 'c'); });
  c.rect(3, 13, 2, 2, 'b'); c.rect(11, 13, 2, 2, 'b');
};
DRAW.neon = function (c) {
  c.line(7, 4, 5, 1, 'e'); c.line(9, 4, 11, 1, 'e');
  c.poly([[7, 6], [1, 1.5], [0.5, 7], [3, 10], [7, 10]], 'a'); c.poly([[8, 6], [14, 1.5], [14.5, 7], [12, 10], [8, 10]], 'a');
  c.poly([[7, 10], [3, 14], [6, 14], [7, 12]], 'b'); c.poly([[8, 10], [12, 14], [9, 14], [8, 12]], 'b');
  c.ell(3.5, 5.5, 1.7, 1.7, 'c'); c.ell(11.5, 5.5, 1.7, 1.7, 'c'); c.px(3, 5, 'e'); c.px(12, 5, 'e');
  c.rect(7, 6, 2, 6, 'd'); c.px(7, 8, 'b'); c.px(8, 10, 'b'); c.ell(7.5, 4.5, 1.8, 1.6, 'd'); c.px(7, 4, 'k'); c.px(8, 4, 'k');
  c.px(0, 11, 'e'); c.px(15, 11, 'e'); c.px(1, 13, 'c'); c.px(14, 13, 'c');
};
DRAW.ink = function (c) {
  c.px(13, 2, 'c'); c.px(14, 4, 'c'); c.px(2, 3, 'c');
  c.poly([[6.5, 4], [8, 1], [9.5, 4]], 'b');
  c.ell(8, 8, 5, 4.5, 'a'); c.poly([[4, 10], [8, 14], [12, 10]], 'a');
  c.ell(5.5, 6, 1, 1.6, 'c');
  c.ell(6, 8, 1.4, 1.7, 'w'); c.ell(10, 8, 1.4, 1.7, 'w'); c.px(6, 8, 'k'); c.px(6, 9, 'k'); c.px(10, 8, 'k'); c.px(10, 9, 'k');
  c.rect(11, 11, 2, 2, 'e'); c.px(8, 11, 'c');
};
DRAW.bee = function (c) {
  c.ell(3.5, 7, 2.2, 3.2, 'c'); c.ell(12.5, 7, 2.2, 3.2, 'c');
  c.ell(8, 10.5, 4.2, 3.8, 'a'); c.ell(8, 6.5, 3.2, 2.8, 'a');
  c.rect(5, 10, 6, 1, 'b'); c.rect(5, 12, 6, 1, 'b');
  c.ell(8, 4, 3.6, 1.9, 'e'); c.rect(4, 5, 8, 1, 'e'); c.px(8, 2, 'w');
  c.px(6, 7, 'k'); c.px(10, 7, 'k'); c.px(8, 8, 'p'); c.px(8, 14, 'b');
  c.line(14, 13, 14, 10, 'd'); c.poly([[13, 9], [15, 9], [14, 11]], 'd');
};
DRAW.rubbing = function (c) {
  c.poly([[0, 5], [4, 8], [0, 11]], 'b'); c.poly([[6, 4.5], [9, 1.5], [11, 4.5]], 'b'); c.poly([[7, 11.5], [8, 14], [11, 11.5]], 'b');
  c.ell(8, 8, 5.8, 3.8, 'a');
  for (var y = 6; y <= 10; y++) for (var x = 5; x <= 12; x++) if ((x + y) % 4 === 0) c.pxo(x, y, 'c');
  c.line(3, 9, 12, 9, 'd'); c.pxo(2, 9, 'd');
  c.rect(11, 6, 2, 2, 'w'); c.px(12, 7, 'k'); c.line(10, 8, 10, 10, 'b');
};
DRAW.marrow = function (c) {
  c.ell(8, 6, 6.2, 4.8, 'a'); c.clearBelow(8);
  for (var x = 2; x <= 14; x += 2) c.px(x, 9, 'a');
  c.ell(8, 6, 3, 2.4, 'c'); c.ell(8, 6, 1.3, 1.2, 'y');
  c.px(4, 3, 'c'); c.px(5, 2, 'c'); c.px(11, 3, 'w');
  [4, 6, 8, 10, 12].forEach(function (x, i) { for (var y = 10; y <= 14; y++) c.px(x + ((y + i) % 2 ? 0 : 1), y, (y % 2) ? 'b' : 'd'); });
  c.px(5, 7, 'k'); c.px(11, 7, 'k'); c.px(8, 8, 'p');
};

/* 外框之後才畫的覆蓋層（取景框） */
var POST = {
  rubbing: function (c) { [[0, 0, 1, 1], [15, 0, -1, 1], [0, 15, 1, -1], [15, 15, -1, -1]].forEach(function (b) { for (var i = 0; i < 3; i++) { c.free(b[0] + b[2] * i, b[1], 'e'); c.free(b[0], b[1] + b[3] * i, 'e'); } }); }
};

/* ---------- 調色盤（a 主色、b 暗部、c/d/e 配色，各隻不同）---------- */
var PAL = {
  tide: { a: '#4b6fd6', b: '#2f4a9c', c: '#9ad7ff', d: '#dff3ff', e: '#6fe0e8' },
  deer: { a: '#b9763a', b: '#7a4a22', c: '#e8c98a', d: '#f4e3c0' },
  gull: { a: '#eaf0f7', b: '#9fb0c4', c: '#f0a030', d: '#6b7a8f', e: '#e04a3a' },
  sail: { a: '#f4ecd8', b: '#7a4a22', c: '#7fd0cf', d: '#4b6fd6', e: '#d95b43' },
  bookworm: { a: '#c9d3df', b: '#8d9bb0', c: '#f6efd8', d: '#7a4a22', e: '#d95b43' },
  abacus: { a: '#d95b43', b: '#6b3f1e', c: '#f2c14e', d: '#c98f63', e: '#fff3d6' },
  lion: { a: '#b9b4aa', b: '#7d7a70', c: '#d6d2c8', d: '#5aa8a0', e: '#8d6a3a' },
  brick: { a: '#c4553b', b: '#8f3a28', c: '#f0b090', d: '#e8d0b0', e: '#f2c14e' },
  watch: { a: '#f2c14e', b: '#b8892a', c: '#fff6dc', d: '#7a8fa0', e: '#d95b43' },
  telegraph: { a: '#5aa0e0', b: '#2f6aa8', c: '#f2c14e', d: '#e8f0f8', e: '#d95b43' },
  radio: { a: '#8b5a2b', b: '#5a3a1e', c: '#c9ccd2', d: '#8fd3f4', e: '#f2c14e' },
  neon: { a: '#e048c8', b: '#7a2a9c', c: '#58e8f0', d: '#ffe6fa', e: '#fff27a' },
  ink: { a: '#33406e', b: '#1e2748', c: '#8fa0e8', d: '#d9d2c0', e: '#d95b43' },
  bee: { a: '#f2c14e', b: '#3b2f2f', c: '#cfeaf5', d: '#9aa3ad', e: '#f08a24' },
  rubbing: { a: '#46c7b0', b: '#2a8d7e', c: '#9ef0dc', d: '#ff6fb5', e: '#f2c14e' },
  marrow: { a: '#b9a0f0', b: '#7a5af8', c: '#e8dcff', d: '#8fe0ff' }
};

function pack(c, pal) {
  var p = {}, used = c.chars();
  used.forEach(function (ch) { p[ch] = pal[ch] || BASE[ch]; if (!p[ch]) throw new Error('未定義調色盤字元 ' + ch); });
  return { w: 16, h: 16, rows: c.rows(), pal: p };
}

/* ---------- 三種蛋 ---------- */
function egg(kind) {
  var c = new Cv(), pal;
  c.ell(8, 6.5, 3.8, 4, 'a'); c.ell(8, 10, 5, 4.4, 'a');
  c.ell(5.6, 7, 0.9, 1.6, 'w', true);
  if (kind === 'common') {
    [[6, 9], [7, 9], [6, 10], [10, 7], [10, 8], [9, 12], [10, 12], [10, 13], [7, 13]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); });
    pal = { a: '#f3e6c8', b: '#b58a52' };
  } else if (kind === 'rare') {
    [[8, 6], [7, 7], [9, 7], [8, 8], [6, 11], [5, 12], [7, 12], [6, 13], [11, 11], [10, 12], [12, 12], [11, 13]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); });
    c.pxo(8, 7, 'w'); c.pxo(6, 12, 'w'); c.pxo(11, 12, 'w');
    pal = { a: '#7fb5f0', b: '#3f78c4' };
  } else {
    [[8, 7], [8, 8], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [7, 10], [8, 10], [9, 10], [7, 11], [9, 11]].forEach(function (p) { c.pxo(p[0], p[1], 'y'); });
    pal = { a: '#f2c14e', b: '#c98a1e' };
  }
  c.outline('o');
  if (kind === 'legend') { c.plusFree(2, 3, 'g', 'y'); c.plusFree(13, 4, 'g', 'y'); c.plusFree(13, 13, 'g', 'y'); }
  if (kind === 'rare') { c.free(2, 4, 'w'); c.free(13, 3, 'w'); c.free(14, 12, 'w'); }
  return pack(c, pal);
}

function stagesOf(key) {
  var pal = PAL[key], fn = DRAW[key], post = POST[key];
  var full = {}; Object.keys(BASE).forEach(function (k) { full[k] = BASE[k]; }); Object.keys(pal).forEach(function (k) { full[k] = pal[k]; });
  var fill = new Cv(); fn(fill);
  var adult = fill.clone().outline('o'); if (post) post(adult);
  var baby = L.shrink(fill, 0.72, 14).outline('o'); if (post) post(baby);
  var awake = fill.clone().outline('o'); if (post) post(awake);
  /* 覺醒：外框換成金棕色，再補金色閃光（空位不夠的就補單點） */
  awake.g = awake.g.map(function (r) { return r.map(function (ch) { return ch === 'o' ? 'O' : ch; }); });
  var n = 0;
  [[2, 2], [13, 3], [2, 13], [13, 13], [3, 1], [12, 1]].forEach(function (p) { if (n < 3 && awake.plusFree(p[0], p[1], 'g', 'y')) n++; });
  [[0, 0], [15, 0], [0, 15], [15, 15], [1, 0], [14, 0]].forEach(function (p) { if (n < 3) { awake.free(p[0], p[1], 'g'); n++; } });
  return { baby: pack(baby, full), adult: pack(adult, full), awake: pack(awake, full) };
}

/* ---------- 文字資料（照 ROOM_SPIRIT_DESIGN 第 3 節與 SPIRIT_SKILLS 第 1 節逐字）---------- */
var SP = [
  { key: 'tide', id: 'sp_tide', no: 1, name: '潮汐鯨魂', nick: '潮', era: '西拉雅與大員前史', eraId: 'pre', anchor: '與台江內海地形變遷有關的海洋生物，待文史把關', attr: '觀察', rarity: '傳說', starter: true,
    assist: { name: '指路', desc: '標出下一站方向', cd: 3, effect: { key: 'showNextDir', value: 1 } },
    talent: { name: '寬步', desc: '到站判定範圍 +3 公尺', key: 'arriveRange', value: 3 },
    scout: { kind: ['方位'], era: '西拉雅與大員前史' },
    awaken: { name: '潮聲', desc: '30 秒內顯示 200 公尺內全部隱藏關卡', effect: { key: 'revealHidden', value: 200, seconds: 30 } },
    lines: { idle: ['海風今天很輕。', '我在聽遠方的潮聲。', '慢慢走，潮也是慢慢來。', '你的腳步，和浪一樣穩。'], pet: ['呼——像海水拍過來。', '再摸一下，水珠會跳。', '好暖，像曬過的沙。'], feed: ['謝謝，味道像鹹鹹的海。', '我記住這一口了。', '吃飽了，能游更遠。'], awake: ['潮聲，替你開路。', '我看見很遠很遠的方向。', '一起去看看海的另一邊。'] } },
  { key: 'deer', id: 'sp_deer', no: 2, name: '鹿影', nick: '斑', era: '荷治', eraId: 'dutch', anchor: '與荷治時期鹿皮貿易有關的森林生物，待文史把關', attr: '觀察', rarity: '普通', starter: true,
    assist: { name: '整理筆記', desc: '把本章線索排成清單', cd: 0, effect: { key: 'listClues', value: 1 } },
    talent: { name: '先機', desc: '每章第一則提示免費', key: 'freeFirstHint', value: 1 },
    scout: { kind: ['史料'], era: '荷治' },
    awaken: { name: '鹿徑', desc: '下一站的「走路分鐘」與路況一次顯示', effect: { key: 'nextWalkInfo', value: 1 } },
    lines: { idle: ['我躲在樹影後面看你。', '這裡的草，聞起來不一樣。', '你走快一點，我跟得上。', '我在數你的腳印。'], pet: ['咦…可以再摸耳朵嗎？', '癢癢的，但很舒服。', '我的斑點在發熱。'], feed: ['好好吃，我小口小口吃。', '謝謝你，我不挑食。', '這個，留一點給你。'], awake: ['鹿徑亮了，跟我來。', '我不再躲了，換我帶路。', '腳印串成一條路了。'] } },
  { key: 'gull', id: 'sp_gull', no: 3, name: '機械海鷗', nick: '鷗', era: '荷治', eraId: 'dutch', anchor: '與大員港一帶海岸有關的機械鳥，待文史把關', attr: '行動', rarity: '普通',
    assist: { name: '遠望', desc: '預告 300 公尺內的站點', cd: 5, effect: { key: 'previewStops', value: 300 } },
    talent: { name: '加速齒輪', desc: '計時賽速度分上限 +2', key: 'timedSpeedCap', value: 2 },
    scout: { kind: ['路況'], era: '荷治' },
    awaken: { name: '俯衝', desc: '計時賽中跳過一次到站判定等待', effect: { key: 'skipArriveWait', value: 1 } },
    lines: { idle: ['回報：天氣晴，視野良好。', '正在掃描前方。', '零件狀態：很有精神。', '我的齒輪在哼歌。'], pet: ['摸到天線了，嗶。', '感應到溫度，舒適。', '再摸一次，我就轉圈。'], feed: ['能量補充中，嗶嗶。', '味道分析：很讚。', '電量上升，起飛準備。'], awake: ['俯衝模式，啟動！', '視野全開，看得到更遠。', '翅膀換新，出發吧。'] } },
  { key: 'sail', id: 'sp_sail', no: 4, name: '帆影', nick: '帆', era: '明鄭', eraId: 'zheng', anchor: '與海上航行和水師有關的船帆靈體，不涉及人物，待文史把關', attr: '行動', rarity: '稀有',
    assist: { name: '集合信號', desc: '全隊目標列指向你', cd: 10, effect: { key: 'rallySignal', value: 1 } },
    talent: { name: '順風隊形', desc: '全隊到站速度 +5%', key: 'teamArriveSpeed', value: 0.05 },
    scout: { kind: ['方位'], era: '明鄭' },
    awaken: { name: '順風', desc: '10 分鐘內到站判定 +10 公尺', effect: { key: 'arriveRange', value: 10, minutes: 10 } },
    lines: { idle: ['全員注意，風向正好！', '出發出發，別落隊！', '我的帆鼓得滿滿的。', '今天也是好航向。'], pet: ['哈哈，別拍我的帆啦！', '摸得好，士氣上升！', '再來，我不怕癢！'], feed: ['好料！補給完畢！', '吃飽才有力氣揚帆。', '謝啦，下次請你。'], awake: ['順風來了，全速前進！', '號令一響，大家都跟上。', '揚帆，目標就在前方。'] } },
  { key: 'bookworm', id: 'sp_bookworm', no: 5, name: '書卷蠹魚', nick: '蠹', era: '明鄭', eraId: 'zheng', anchor: '與府城教育和孔廟有關的書卷生物，待文史把關', attr: '智識', rarity: '稀有', starter: true,
    assist: { name: '查證', desc: '顯示這題的出處與可信度', cd: 0, perChapter: 2, effect: { key: 'showSource', value: 1 } },
    talent: { name: '出處標記', desc: '選擇題顯示「有出處」標記', key: 'showSourceBadge', value: 1 },
    scout: { kind: ['史料'], era: '明鄭' },
    awaken: { name: '蛀書', desc: '把已有線索自動串成時間線', effect: { key: 'autoTimeline', value: 1 } },
    lines: { idle: ['這句話，出處在哪裡？', '我正在啃一頁小字。', '慢著，先查證再說。', '書頁的味道最香了。'], pet: ['小心，別弄皺書角。', '嗯…摸頭也算閱讀嗎？', '癢，像字跳來跳去。'], feed: ['紙香點心，我最愛了。', '這口，我要做筆記。', '謝謝，下次我幫你找資料。'], awake: ['我把線索串成一條線了。', '蛀書成冊，時間有序。', '來，看看完整的時間線。'] } },
  { key: 'abacus', id: 'sp_abacus', no: 6, name: '算盤獸', nick: '珠珠', era: '清領', eraId: 'qing', anchor: '與三郊商貿和行郊有關的算盤生物，待文史把關', attr: '智識', rarity: '普通',
    assist: { name: '結算', desc: '顯示可用點數與最划算的採購', cd: 0, effect: { key: 'showBudget', value: 1 } },
    talent: { name: '九五折', desc: '簡報室採購打 95 折（與補給官不疊加，取較大者）', key: 'shopDiscount', value: 0.05, stack: 'max' },
    scout: { kind: ['路況'], extra: '點數情報', era: '清領' },
    awaken: { name: '精打細算', desc: '每章回饋 10 點', effect: { key: 'chapterRebate', value: 10 } },
    lines: { idle: ['噼啪，今天花了多少？', '我在算哪裡最划算。', '錢要花在刀口上。', '算盤珠子今天很順。'], pet: ['噼啪噼啪，好舒服！', '別摸太久，要收費喔。', '珠子轉起來啦。'], feed: ['這點心，值這個價。', '吃了有力氣算帳。', '謝謝，我給你打個折。'], awake: ['精打細算，一分不浪費。', '每章回饋，算我的。', '總帳算出來了，賺到。'] } },
  { key: 'lion', id: 'sp_lion', no: 7, name: '城門石獅靈', nick: '獅', era: '清領', eraId: 'qing', anchor: '與府城城門和防禦有關的石獅守護獸，待文史把關', attr: '守護', rarity: '稀有',
    assist: { name: '警戒', desc: '標出隊友位置與離隊距離', cd: 5, effect: { key: 'showMates', value: 1 } },
    talent: { name: '穩住', desc: '提示扣分 −1', key: 'hintPenaltyDelta', value: -1 },
    scout: { kind: ['路況'], note: '安全', era: '清領' },
    awaken: { name: '鎮守', desc: '走散警示放寬並提醒集合點', effect: { key: 'straySafetyRelax', value: 1 } },
    lines: { idle: ['我守著，你放心走。', '人到齊了嗎？數一數。', '注意腳下，別趕。', '我不會離開你的視線。'], pet: ['…哼，才不是在撒嬌。', '摸一下就好，我在站崗。', '鬃毛別亂揉，嗚。'], feed: ['嗯，勉強說好吃。', '吃飽了，才有力氣守護。', '謝謝…別告訴別人。'], awake: ['鎮守此處，大家別走散。', '我的吼聲，會替你們壯膽。', '集合點在這，我等你們。'] } },
  { key: 'brick', id: 'sp_brick', no: 8, name: '紅磚貓', nick: '磚', era: '日治', eraId: 'japan', anchor: '與磚造公共建築有關的貓形生物，待文史把關', attr: '觀察', rarity: '普通',
    assist: { name: '細看', desc: '給本站「形狀、材質、新舊」三個觀察提示', cd: 0, perChapter: 3, effect: { key: 'observeHints', value: 3 } },
    talent: { name: '利眼', desc: '觀察題字數門檻 −1', key: 'observeMinChars', value: -1 },
    scout: { kind: ['觀察'], era: '日治' },
    awaken: { name: '磚縫', desc: '每章多一個觀察細節（不是答案）', effect: { key: 'extraObserveDetail', value: 1 } },
    lines: { idle: ['喵，這面牆有點意思。', '我在曬太陽，順便觀察。', '形狀、材質、新舊…喵。', '磚縫裡藏著小驚喜。'], pet: ['呼嚕呼嚕…', '再摸摸下巴，喵。', '我的磚紋在發熱。'], feed: ['喵！這個我愛。', '嗯，吃完再觀察。', '謝謝，賞你看一個細節。'], awake: ['磚縫裡，又多一個細節。', '喵，我看得更仔細了。', '來，我指給你看。'] } },
  { key: 'watch', id: 'sp_watch', no: 9, name: '懷錶蟲', nick: '滴答', era: '日治', eraId: 'japan', anchor: '與近代時間制度和時鐘有關的懷錶昆蟲，待文史把關', attr: '智識', rarity: '普通',
    assist: { name: '倒數', desc: '顯示計時賽剩餘與建議節奏', cd: 0, effect: { key: 'timerPace', value: 1 } },
    talent: { name: '快一拍', desc: '提示等待時間縮短', key: 'hintWaitCut', value: 0.2 },
    scout: { kind: ['路況'], era: '日治' },
    awaken: { name: '回撥', desc: '計時賽中取消一次扣分（每趟 1 次）', effect: { key: 'cancelTimedPenalty', value: 1, perTrip: 1 } },
    lines: { idle: ['滴答，時間不等人。', '快點快點，別遲到！', '倒數三、二、一…', '我的指針今天很準。'], pet: ['別摸到發條，嚇我一跳。', '滴答滴答，開心的節奏。', '再摸一下，慢兩秒。'], feed: ['滴答，剛好整點開飯。', '好吃，我多走一格。', '謝謝，節奏更穩了。'], awake: ['回撥一下，重來一次。', '時間，聽我的。', '這一步，我替你撥回。'] } },
  { key: 'telegraph', id: 'sp_telegraph', no: 10, name: '電報鳥', nick: '嘀', era: '日治', eraId: 'japan', anchor: '與電信和郵政有關的電報鳥，待文史把關', attr: '溝通', rarity: '稀有',
    assist: { name: '傳話', desc: '把一句話貼到隊內與全場', cd: 3, effect: { key: 'broadcastMsg', value: 1 } },
    talent: { name: '快回', desc: '求援回應變快', key: 'helpReplyCut', value: 0.2 },
    scout: { kind: ['人物'], era: '日治' },
    awaken: { name: '電文', desc: '自動把本章成果報給全場', effect: { key: 'autoReportChapter', value: 1 } },
    lines: { idle: ['嘀嘀嗒，有消息要傳！', '你要我傳什麼話？', '線路暢通，隨時待命。', '嘀，我聽見遠方的聲音。'], pet: ['嘀嘀，好癢！', '摸到羽毛啦，嗒。', '再摸，我會一直嘀。'], feed: ['嘀，收到點心一份。', '好吃，訊號變強了。', '嗒嗒，謝謝你。'], awake: ['電文發出，大家都收到。', '全頻道，一起播報！', '嘀——成果傳出去了。'] } },
  { key: 'radio', id: 'sp_radio', no: 11, name: '老收音機妖', nick: '沙沙', era: '戰後', eraId: 'postwar', anchor: '與廣播和街頭聲音有關的老收音機精怪，待文史把關', attr: '溝通', rarity: '稀有',
    assist: { name: '說書', desc: '用說書人口吻講這一站', cd: 0, perChapter: 1, effect: { key: 'storyteller', value: 1 } },
    talent: { name: '氛圍', desc: 'NPC 回話多一句氛圍', key: 'npcExtraLine', value: 1 },
    scout: { kind: ['人物', '彩蛋'], era: '戰後' },
    awaken: { name: '轉台', desc: '切換 NPC 對話的口吻（正經或戲劇）', effect: { key: 'npcToneSwitch', value: 1 } },
    lines: { idle: ['沙沙…各位聽眾晚安。', '轉到哪一台好呢？', '來，聽我說個故事。', '雜訊也是一種聲音。'], pet: ['沙沙…好舒服的震動。', '別轉到旋鈕呀，癢！', '再摸，我會唱歌喔。'], feed: ['沙…這個味道清晰。', '吃飽了，講更久的故事。', '謝謝，音量調大了。'], awake: ['轉台！換個說法講給你聽。', '沙沙，正經還是戲劇？', '這一台，只為你播。'] } },
  { key: 'neon', id: 'sp_neon', no: 12, name: '霓虹蛾', nick: '霓', era: '戰後', eraId: 'postwar', anchor: '與夜間商街有關的霓虹蛾，待文史把關', attr: '行動', rarity: '普通',
    assist: { name: '夜行', desc: '夜間顯示最亮的路線', cd: 5, effect: { key: 'nightRoute', value: 1 } },
    talent: { name: '夜眼', desc: '夜間定位判定 +3 公尺', key: 'nightArriveRange', value: 3 },
    scout: { kind: ['路況', '彩蛋'], era: '戰後' },
    awaken: { name: '趨光', desc: '夜間隱藏關卡顯示範圍加倍', effect: { key: 'nightRevealScale', value: 2 } },
    lines: { idle: ['夜晚才是我的舞台。', '哪裡有光，我就飛過去。', '今晚的路，我來照亮。', '翅膀閃閃，心情也閃閃。'], pet: ['啊，粉粉掉下來了。', '輕輕的，我會發光。', '再摸，我臉紅了。'], feed: ['甜甜的，像霓虹糖。', '謝謝，翅膀更亮了。', '吃飽了，就去夜遊。'], awake: ['趨光而行，夜更亮了。', '今晚，整條路都是我的。', '看，隱藏的光都現身了。'] } },
  { key: 'ink', id: 'sp_ink', no: 13, name: '墨靈', nick: '墨', era: '戰後與文學', eraId: 'postwar', anchor: '與在地文學和民間文學有關的墨汁精靈，待文史把關', attr: '溝通', rarity: '稀有',
    assist: { name: '起筆', desc: '給書寫題三種開頭句型', cd: 0, perQuestion: 1, effect: { key: 'writeStarters', value: 3 } },
    talent: { name: '語氣', desc: '書寫題多一句語氣建議', key: 'writeToneHint', value: 1 },
    scout: { kind: ['彩蛋'], era: '戰後與文學' },
    awaken: { name: '落款', desc: '最後一句話完成時額外 +10 分', effect: { key: 'finalLineBonus', value: 10 } },
    lines: { idle: ['我在想一句開頭。', '留白，也是一種寫法。', '墨乾了，再潤一潤。', '今天的句子，有點長。'], pet: ['小心，會暈開來的。', '摸頭…像被筆尖輕點。', '再摸一下，句子就來了。'], feed: ['滋潤，字更有精神。', '這口，我想寫成詩。', '謝謝，落筆更穩了。'], awake: ['落款，這一句收好了。', '最後一行，我陪你寫。', '筆鋒一轉，完成。'] } },
  { key: 'bee', id: 'sp_bee', no: 14, name: '修復匠蜂', nick: '蜜', era: '當代文資', eraId: 'heritage', anchor: '與古蹟修復有關的工匠蜜蜂，待文史把關', attr: '守護', rarity: '普通',
    assist: { name: '補漏', desc: '列出本章還沒完成的任務', cd: 0, effect: { key: 'listTodo', value: 1 } },
    talent: { name: '減半', desc: '提示扣分只扣一半（每章 1 次）', key: 'hintPenaltyHalf', value: 0.5, perChapter: 1 },
    scout: { kind: ['觀察'], era: '當代文資' },
    awaken: { name: '修復', desc: '重做一個任務不扣分（每趟 1 次）', effect: { key: 'redoFree', value: 1, perTrip: 1 } },
    lines: { idle: ['這裡有裂縫，補一補。', '嗡嗡，慢工出細活。', '我的小抹刀呢？', '先清灰，再修復。'], pet: ['嗡，手別太用力。', '摸摸安全帽也行。', '嗡嗡嗡，好舒服。'], feed: ['蜜糖點心，補充體力。', '謝謝，繼續修復。', '吃完這口，就上工。'], awake: ['修復完成，重來一次。', '這一步不算數，再試。', '嗡——補得剛剛好。'] } },
  { key: 'rubbing', id: 'sp_rubbing', no: 15, name: '數位拓印魚', nick: '拓', era: '當代文資', eraId: 'heritage', anchor: '與數位典藏和三維掃描有關的拓印魚，待文史把關', attr: '觀察', rarity: '稀有',
    assist: { name: '構圖', desc: '拍照任務給取景建議', cd: 0, perQuestion: 1, effect: { key: 'photoComposition', value: 1 } },
    talent: { name: '好取景', desc: '拍照任務加分 +2', key: 'photoBonus', value: 2 },
    scout: { kind: ['觀察', '方位'], era: '當代文資' },
    awaken: { name: '拓印', desc: '把本章照片整理成圖鑑相片卡', effect: { key: 'photoToDexCard', value: 1 } },
    lines: { idle: ['框好了嗎？再往左一點。', '我在掃描這塊紋路。', '安靜，正在存檔。', '像素今天很整齊。'], pet: ['啵，癢到畫面抖動。', '別動，這樣構圖剛好。', '再摸一下，存成相簿。'], feed: ['解析度上升，謝謝。', '味道已拓印，永久保存。', '好吃，我拍一張。'], awake: ['拓印完成，整理成卡片。', '這一章的照片，我收好了。', '每張相片，都有故事。'] } },
  { key: 'marrow', id: 'sp_marrow', no: 16, name: '時之髓水母', nick: '髓', era: '時安局核心', eraId: 'core', anchor: '虛構的時安局核心生物，藍鯨與時之髓設定尚為候選，待文史把關', attr: '全', rarity: '傳說', hidden: 'dex100',
    assist: { name: '時間回溯', desc: '撤回最近一次提示扣分', cd: 0, perChapter: 1, effect: { key: 'undoHintPenalty', value: 1 } },
    talent: { name: '全屬性', desc: '全屬性 +1', key: 'allAttr', value: 1 },
    scout: { kind: ['史料', '路況', '人物', '觀察', '彩蛋', '方位'], era: '全部時期' },
    awaken: { name: '髓動', desc: '覺醒後所有助理技冷卻 −30%', effect: { key: 'allCooldownCut', value: 0.3 } },
    lines: { idle: ['我在時間裡漂著。', '很輕…很遠…', '你聽，髓在發光。', '所有時代，都在我身上。'], pet: ['好輕的觸碰，像水波。', '再摸一下，時間就慢了。', '光在你手心打轉。'], feed: ['溫暖，像回到起點。', '謝謝，髓更亮了。', '我記下這一刻。'], awake: ['髓動，時間為你加速。', '所有技能，都醒著。', '我們一起穿過時代。'] } }
];
var EGG_LINE = { '普通': '蛋殼裡有輕輕的動靜。', '稀有': '蛋殼閃著淡淡的光。', '傳說': '蛋殼裡傳出低低的歌聲。' };
var EGG_KIND = { '普通': 'common', '稀有': 'rare', '傳說': 'legend' };
var AWAKE_COND = { '普通': 15, '稀有': 30, '傳說': 50 };

module.exports = { SP: SP, stagesOf: stagesOf, egg: egg, pack: pack, EGG_LINE: EGG_LINE, EGG_KIND: EGG_KIND, AWAKE_COND: AWAKE_COND, BASE: BASE, PAL: PAL };
