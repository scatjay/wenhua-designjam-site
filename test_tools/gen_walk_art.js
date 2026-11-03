/* 走讀小精靈：24 種的蛋、幼體、成體、覺醒像素圖畫法（程式字串矩陣＋調色盤，不用生圖）。
   成體畫法為「填色層」，之後統一加外框；幼體由成體縮小；覺醒＝成體＋金棕色外框＋閃光。 */
'use strict';
var L = require('./gen_walk_lib.js'), Cv = L.Cv;
var BASE = { o: '#1b1b2f', O: '#8a5a10', k: '#1b1b2f', w: '#ffffff', p: '#e87fa8', g: '#f2c14e', y: '#fff3b0' };

function hex2(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function mix(a, b, t) { var A = hex2(a), B = hex2(b); return '#' + [0, 1, 2].map(function (i) { var v = Math.round(A[i] * (1 - t) + B[i] * t); return ('0' + v.toString(16)).slice(-2); }).join(''); }

/* ===================== 成體畫法（填色層）===================== */
var DRAW = {};
DRAW.tide = function (c) {
  c.line(10, 6, 10, 5, 'e'); c.px(9, 5, 'c'); c.px(11, 5, 'c'); c.px(10, 4, 'c');
  c.poly([[0, 6], [3, 7], [4, 8], [3, 10], [0, 8]], 'b'); c.ell(3.5, 9, 2.6, 2, 'a');
  c.ell(8.5, 9.5, 6, 3.6, 'a'); c.ell(9, 11.2, 4.6, 1.6, 'd');
  c.line(6, 11, 12, 11, 'c'); c.poly([[7, 12], [10, 12], [7.5, 13]], 'b');
  c.px(12, 8, 'k'); c.px(12, 10, 'p'); c.line(13, 10, 11, 10, 'b');
};
DRAW.deer = function (c) {
  c.px(10, 2, 'c'); c.px(10, 1, 'c'); c.px(9, 1, 'c'); c.px(12, 2, 'c'); c.px(12, 1, 'c'); c.px(13, 1, 'c'); c.px(8, 2, 'c');
  [3, 5, 8, 10].forEach(function (x) { c.rect(x, 11, 1, 3, 'b'); c.px(x, 13, 'k'); });
  c.ell(6.5, 9, 4.4, 2.6, 'a'); c.ell(6.5, 10.3, 3, 1, 'd');
  c.poly([[8, 8], [9.5, 3], [12, 4], [10.5, 10]], 'a'); c.ell(11.5, 3.6, 2.1, 1.7, 'a');
  c.px(13, 4, 'd'); c.px(14, 4, 'k'); c.px(11, 3, 'k'); c.px(10, 3, 'b'); c.px(13, 2, 'b');
  [[4, 8], [6, 8], [8, 9], [5, 10], [7, 10]].forEach(function (p) { c.pxo(p[0], p[1], 'd'); });
  c.px(2, 8, 'd'); c.px(2, 9, 'd');
};
DRAW.gull = function (c) {
  c.poly([[0, 9], [3, 8], [4, 11], [0, 11]], 'b'); c.ell(7.5, 9.5, 5, 3, 'a'); c.ell(12, 7, 2.3, 2.1, 'a');
  c.poly([[4, 10], [8, 5], [11, 6], [9, 10]], 'b'); c.line(10, 6, 8, 8, 'd');
  c.px(14, 7, 'c'); c.px(14, 8, 'c'); c.px(13, 8, 'c'); c.px(12, 6, 'e');
  c.ell(6.8, 10, 1.7, 1.7, 'd'); c.px(7, 10, 'a');
  c.line(6, 12, 6, 13, 'c'); c.line(9, 12, 9, 13, 'c'); c.px(5, 13, 'c'); c.px(10, 13, 'c');
  c.poly([[3, 9], [0, 6], [1, 5], [5, 8]], 'b'); c.line(1, 6, 4, 8, 'd'); c.px(12, 4, 'd'); c.px(12, 5, 'd');
};
DRAW.sail = function (c) {
  c.rect(7, 1, 1, 12, 'b'); c.poly([[6.5, 2], [6.5, 11.5], [3, 11.5]], 'a'); c.poly([[8.5, 3], [8.5, 11.5], [11.5, 11.5]], 'c');
  c.poly([[8, 1], [10.5, 2], [8, 3.5]], 'e');
  c.poly([[3, 12], [12, 12], [10, 14], [5, 14]], 'b');
  c.px(4, 9, 'k'); c.px(6, 9, 'k'); c.px(5, 10, 'p');
  c.px(9, 8, 'k'); c.px(11, 8, 'k');
  c.px(4, 14, 'd'); c.px(7, 14, 'd'); c.px(10, 14, 'd');
};
DRAW.bookworm = function (c) {
  c.rect(1, 11, 14, 2, 'c');
  [3, 4, 7, 10, 11, 13].forEach(function (x, i) { c.px(x, i % 2 ? 12 : 11, 'b'); });
  c.line(2, 7, 1, 5, 'b'); c.line(4, 7, 5, 5, 'b'); c.px(1, 4, 'e'); c.px(5, 4, 'e');
  c.ell(3, 9, 2.3, 2, 'a'); c.ell(6, 8.6, 2, 1.9, 'a'); c.ell(8.5, 8.2, 2, 1.9, 'a'); c.ell(11, 8.6, 1.8, 1.7, 'a'); c.ell(13, 9.2, 1.2, 1.1, 'a');
  c.px(6, 8, 'b'); c.px(9, 7, 'b'); c.px(11, 8, 'b'); c.px(3, 10, 'b'); c.px(6, 10, 'b'); c.px(9, 10, 'b'); c.px(11, 10, 'b');
  c.px(2, 9, 'k'); c.px(4, 9, 'k'); c.px(3, 10, 'p'); c.px(14, 10, 'b'); c.px(14, 8, 'b');
};
DRAW.abacus = function (c) {
  c.poly([[4, 4], [5, 1.5], [7, 4]], 'b'); c.poly([[9, 4], [11, 1.5], [12, 4]], 'b'); c.line(8, 4, 8, 2, 'b'); c.px(8, 1, 'd');
  c.rect(3, 4, 10, 8, 'b'); c.rect(4, 5, 8, 6, 'e'); c.line(4, 8, 11, 8, 'a');
  c.ell(6, 6.5, 1.3, 1.2, 'c'); c.ell(10, 6.5, 1.3, 1.2, 'c'); c.px(6, 6, 'k'); c.px(10, 6, 'k'); c.rect(7, 7, 2, 1, 'k');
  [4.5, 6.5, 8.5, 10.5].forEach(function (x, i) { c.ell(x, 9.6, 0.9, 1, i % 2 ? 'd' : 'c'); });
  c.line(3, 8, 1, 10, 'b'); c.px(1, 11, 'a'); c.px(1, 10, 'a'); c.line(12, 8, 14, 10, 'b'); c.px(14, 11, 'a'); c.px(14, 10, 'a');
  c.rect(5, 12, 2, 2, 'b'); c.rect(9, 12, 2, 2, 'b'); c.rect(4, 14, 3, 1, 'a'); c.rect(9, 14, 3, 1, 'a');
  c.px(13, 12, 'd'); c.px(14, 13, 'c'); c.px(14, 14, 'd');
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
  [3, 7, 11].forEach(function (x) { c.px(x, 12, 'd'); c.px(x + 1, 13, 'd'); });
};
DRAW.radio = function (c) {
  c.line(6, 4, 3, 1, 'c'); c.line(11, 4, 13, 1, 'c'); c.px(3, 1, 'e'); c.px(13, 1, 'e'); c.px(2, 1, 'e'); c.px(14, 1, 'e');
  c.rect(4, 4, 9, 8, 'a'); c.rect(5, 5, 7, 6, 'b'); c.rect(6, 5, 5, 1, 'e');
  c.ell(6.5, 7.5, 1.6, 1.6, 'w'); c.ell(10.5, 7.5, 1.6, 1.6, 'w'); c.px(6, 8, 'k'); c.px(10, 8, 'k');
  c.rect(5, 10, 7, 1, 'a'); [6, 8, 10].forEach(function (x) { c.px(x, 10, 'c'); });
  c.line(4, 8, 2, 10, 'c'); c.px(2, 11, 'e'); c.px(1, 11, 'e'); c.line(12, 8, 14, 10, 'c'); c.px(14, 11, 'e'); c.px(15, 11, 'e');
  c.rect(5, 12, 2, 2, 'b'); c.rect(10, 12, 2, 2, 'b'); c.rect(4, 14, 3, 1, 'a'); c.rect(9, 14, 3, 1, 'a');
  c.px(14, 5, 'd'); c.px(15, 6, 'd'); c.px(14, 7, 'd');
};
DRAW.neon = function (c) {
  c.line(7, 4, 5, 1, 'e'); c.line(9, 4, 11, 1, 'e');
  c.poly([[7, 6], [1, 1.5], [0.5, 7], [3, 10], [7, 10]], 'a'); c.poly([[8, 6], [14, 1.5], [14.5, 7], [12, 10], [8, 10]], 'a');
  c.poly([[7, 10], [3, 14], [6, 14], [7, 12]], 'b'); c.poly([[8, 10], [12, 14], [9, 14], [8, 12]], 'b');
  c.ell(3.5, 5.5, 1.7, 1.7, 'c'); c.ell(11.5, 5.5, 1.7, 1.7, 'c'); c.px(3, 5, 'e'); c.px(12, 5, 'e');
  c.rect(7, 6, 2, 6, 'd'); c.px(7, 8, 'b'); c.px(8, 10, 'b'); c.ell(7.5, 4.5, 1.8, 1.6, 'd'); c.px(7, 4, 'k'); c.px(8, 4, 'k');
};
DRAW.ink = function (c) {
  c.poly([[6, 5], [7.5, 1], [9, 5]], 'b'); c.px(7, 1, 'c');
  c.ell(7.5, 7.8, 3.6, 4.2, 'a'); c.ell(5.8, 5.5, 0.9, 1.4, 'c');
  c.line(4, 8, 2, 10, 'a'); c.px(2, 11, 'a'); c.px(1, 11, 'c'); c.line(11, 8, 13, 10, 'a'); c.px(13, 11, 'a'); c.px(14, 11, 'c');
  c.ell(6, 7.5, 1.1, 1.4, 'w'); c.ell(9.5, 7.5, 1.1, 1.4, 'w'); c.px(6, 8, 'k'); c.px(9, 8, 'k'); c.px(7, 10, 'c');
  c.rect(6, 12, 1, 2, 'a'); c.rect(9, 12, 1, 2, 'a'); c.rect(11, 10, 2, 2, 'e');
  c.line(8, 12, 11, 13, 'a'); c.px(12, 12, 'b'); c.px(13, 11, 'b');
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
  c.poly([[0, 6], [4, 8.5], [0, 11]], 'b'); c.poly([[6, 5.5], [9, 3], [11, 5.5]], 'b'); c.poly([[7, 11.5], [8, 13], [11, 11.5]], 'b');
  c.ell(8, 8.5, 6, 3.4, 'a');
  for (var y = 7; y <= 10; y++) for (var x = 5; x <= 12; x++) if ((x + y) % 4 === 0) c.pxo(x, y, 'c');
  c.line(3, 9, 13, 9, 'd'); c.rect(11, 7, 2, 2, 'w'); c.px(12, 8, 'k'); c.line(10, 9, 10, 10, 'b');
};
DRAW.marrow = function (c) {
  c.ell(8, 6, 6.2, 4.8, 'a'); c.clearBelow(8);
  for (var x = 2; x <= 14; x += 2) c.px(x, 9, 'a');
  c.ell(8, 6, 3, 2.4, 'c'); c.ell(8, 6, 1.3, 1.2, 'y');
  c.px(4, 3, 'c'); c.px(5, 2, 'c'); c.px(11, 3, 'w');
  [4, 6, 8, 10, 12].forEach(function (x, i) { for (var y = 10; y <= 14; y++) c.px(x + ((y + i) % 2 ? 0 : 1), y, (y % 2) ? 'b' : 'd'); });
  c.px(5, 7, 'k'); c.px(11, 7, 'k'); c.px(8, 8, 'p');
};
/* ---- 新增 8 隻 ---- */
DRAW.snailcrab = function (c) {
  c.line(10, 9, 10, 7, 'd'); c.line(12, 9, 12, 7, 'd'); c.px(10, 6, 'k'); c.px(12, 6, 'k');
  c.ell(9, 11, 4.6, 2.2, 'd'); c.ell(13, 9.5, 1.6, 1.5, 'd'); c.line(11, 10, 12, 9, 'd'); c.px(14, 9, 'e'); c.px(13, 8, 'e');
  [[3, 14], [4, 13], [6, 14], [7, 13], [10, 14], [11, 13], [13, 14]].forEach(function (p) { c.px(p[0], p[1], 'd'); });
  c.ell(5.5, 8, 4, 3.4, 'a'); c.px(4, 4, 'a'); c.px(5, 4, 'a'); c.px(4, 5, 'a'); c.px(5, 5, 'a'); c.px(3, 5, 'a');
  [[5, 8], [6, 8], [7, 8], [7, 7], [6, 6], [5, 6], [4, 7], [4, 8], [5, 9], [6, 10], [3, 6]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); });
  c.px(10, 11, 'k'); c.px(12, 11, 'k'); c.px(11, 12, 'p');
};
DRAW.leopard = function (c) {
  [[3, 9], [2, 9], [1, 8], [1, 7], [2, 6], [3, 6]].forEach(function (p) { c.px(p[0], p[1], 'a'); }); c.px(3, 6, 'b'); c.px(4, 6, 'b');
  c.ell(7.5, 8.5, 5, 2.5, 'a'); c.ell(8, 10, 3.5, 1, 'c');
  [4, 6, 9, 11].forEach(function (x) { c.rect(x, 10, 1, 3, 'a'); c.px(x, 12, 'c'); });
  c.ell(12.8, 7.2, 2.2, 2, 'a'); c.px(14, 8, 'c'); c.px(13, 8, 'c'); c.px(14, 7, 'k'); c.px(13, 6, 'k');
  c.px(11, 5, 'b'); c.px(14, 5, 'b'); c.px(11, 6, 'a'); c.px(14, 6, 'a');
  [[5, 7], [7, 7], [9, 8], [6, 9], [8, 9], [10, 7], [4, 8]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); c.pxo(p[0] + 1, p[1], 'b'); c.pxo(p[0], p[1] + 1, 'd'); });
};
DRAW.seahorse = function (c) {
  c.px(7, 2, 'd'); c.px(8, 1, 'd'); c.px(9, 1, 'd');
  c.ell(8.5, 6.5, 2.2, 2.8, 'a'); c.ell(9, 9.5, 2.6, 2.6, 'a'); c.ell(9, 3, 2.2, 1.9, 'a'); c.rect(11, 3, 2, 1, 'a'); c.px(9, 2, 'k');
  c.rect(7, 11, 3, 2, 'a'); c.ell(7, 13, 2.2, 1.6, 'a'); c.g[13][7] = '.'; c.px(10, 13, 'a');
  c.line(6, 3, 6, 11, 'b'); c.poly([[6.5, 4], [5, 7], [6.5, 10]], 'c'); c.px(6, 7, 'e');
  [5, 7, 9].forEach(function (y) { c.pxo(9, y, 'b'); c.pxo(10, y, 'b'); });
  c.px(11, 5, 'p');
};
DRAW.ironcrab = function (c) {
  [5, 10].forEach(function (x) { c.rect(x, 5, 1, 2, 'b'); c.px(x, 4, 'd'); });
  c.ell(7.5, 8, 5, 2.4, 'a'); c.rect(3, 9, 9, 1, 'b'); c.line(7, 6, 7, 9, 'b'); c.px(5, 7, 'w'); c.px(10, 7, 'w'); c.px(6, 8, 'e'); c.px(9, 8, 'e');
  [0, 1].forEach(function (s) {
    var f = function (x) { return s ? 15 - x : x; };
    c.line(f(4), 8, f(3), 7, 'b'); c.ell(f(2), 6.5, 1.7, 1.6, 'c'); c.px(f(2), 5, 'b'); c.px(f(1), 7, 'b'); c.px(f(3), 6, 'a');
    c.line(f(4), 10, f(2), 11, 'b'); c.line(f(2), 11, f(1), 12, 'b'); c.line(f(5), 10, f(4), 12, 'b'); c.line(f(4), 12, f(3), 12, 'b');
  });
};
DRAW.kitedragon = function (c) {
  c.poly([[8, 1], [12.5, 5], [8, 9.5], [3.5, 5]], 'a'); c.line(8, 1, 8, 9, 'b'); c.line(4, 5, 12, 5, 'b');
  c.px(6, 6, 'k'); c.px(10, 6, 'k'); c.px(8, 7, 'p'); c.px(6, 2, 'c'); c.px(10, 2, 'c'); c.px(5, 3, 'c'); c.px(11, 3, 'c');
  c.px(5, 9, 'b'); c.px(11, 9, 'b'); c.px(4, 10, 'b'); c.px(12, 10, 'b');
  [[8, 10], [7, 11], [8, 12], [9, 13], [8, 14]].forEach(function (p) { c.px(p[0], p[1], 'd'); });
  c.px(6, 11, 'c'); c.px(10, 12, 'c'); c.px(6, 13, 'c'); c.px(7, 12, 'e');
};
DRAW.sugartrain = function (c) {
  c.rect(5, 7, 9, 3, 'a'); c.rect(1, 6, 5, 4, 'b'); c.rect(0, 5, 7, 1, 'd');
  c.rect(11, 5, 2, 2, 'b'); c.rect(10, 4, 4, 1, 'd');
  c.rect(2, 7, 2, 2, 'c'); c.poly([[14, 9], [14, 11], [12.5, 11]], 'd');
  [3.5, 8, 12.5].forEach(function (x) { c.ell(x, 10.8, 1.4, 1.3, 'k'); c.px(x, 11, 'c'); });
  c.px(11, 8, 'k'); c.px(13, 8, 'k'); c.px(12, 9, 'p'); c.rect(7, 8, 2, 1, 'e');
};
DRAW.parrot = function (c) {
  c.ell(8, 13, 6.5, 1.7, 'k'); c.ell(8, 13, 1.6, 0.8, 'd');
  c.poly([[5, 3], [1, 1], [1, 6]], 'e'); c.px(2, 3, 'c');
  c.line(4, 12, 2, 14, 'd'); c.line(5, 12, 4, 14, 'b');
  c.ell(7, 8.5, 3.6, 3.8, 'a'); c.ell(5.5, 9, 2, 2.8, 'b'); c.ell(8.2, 9.5, 2, 2.4, 'e');
  c.ell(8, 4.5, 2.6, 2.4, 'a'); c.poly([[10, 4], [13, 5], [11, 7]], 'c'); c.px(9, 4, 'k');
  c.px(7, 2, 'd'); c.px(8, 1, 'd'); c.px(9, 2, 'd'); c.px(8, 2, 'd');
  c.line(14, 8, 12, 12, 'w');
};
DRAW.ufo = function (c) {
  c.ell(8, 5, 2.8, 1.4, 'd'); c.px(8, 5, 'e');
  c.ell(8, 7.5, 7, 1.6, 'a'); c.ell(8, 8.6, 5, 0.7, 'b');
  [[3, 7], [6, 8], [10, 8], [13, 7]].forEach(function (p) { c.px(p[0], p[1], 'e'); });
  c.poly([[6, 9.5], [10, 9.5], [12, 10.4], [4, 10.4]], 'c'); c.line(5, 10, 11, 10, 'w');
  c.px(2, 10, 'e'); c.px(14, 10, 'e'); c.px(1, 9, 'd'); c.px(14, 9, 'd');
};

/* ===================== 蛋（24 種各自的形狀、花紋、配色）===================== */
var EGG = {};
EGG.tide = function (c) { c.ell(7.5, 8, 4.8, 5.8, 'a'); [[4, 6], [5, 5], [6, 6], [7, 5], [8, 6], [9, 5], [10, 6]].forEach(function (p) { c.pxo(p[0], p[1], 'c'); }); [[4, 10], [5, 9], [6, 10], [7, 9], [8, 10], [9, 9], [10, 10]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); }); c.pxo(5, 4, 'd'); c.pxo(5, 5, 'd'); };
EGG.deer = function (c) { c.ell(8, 9.5, 3.6, 4.2, 'a'); c.ell(8, 5.2, 4.4, 2.2, 'b'); for (var x = 5; x <= 11; x += 2) { c.pxo(x, 5, 'c'); } c.px(8, 3, 'b'); c.px(8, 2, 'b'); c.px(8, 14, 'b'); c.pxo(7, 9, 'd'); c.pxo(9, 11, 'd'); c.pxo(7, 12, 'd'); };
EGG.gull = function (c) { c.ell(3.5, 8, 2.8, 3, 'a'); c.ell(12.5, 8, 2.8, 3, 'a'); c.rect(3, 5, 10, 6, 'a'); c.line(8, 5, 8, 10, 'b'); c.line(5, 5, 5, 10, 'c'); c.line(11, 5, 11, 10, 'c'); c.px(6, 7, 'd'); c.px(10, 8, 'd'); c.px(2, 7, 'w'); c.px(13, 9, 'e'); };
EGG.sail = function (c) { c.poly([[8, 1], [13, 11], [3, 11]], 'a'); c.ell(8, 11, 5, 2.5, 'a'); c.line(8, 2, 8, 12, 'b'); c.px(9, 2, 'e'); c.px(10, 3, 'e'); c.pxo(6, 8, 'c'); c.pxo(10, 9, 'c'); c.line(5, 13, 11, 13, 'd'); };
EGG.bookworm = function (c) { c.ell(8, 8, 6.5, 3.6, 'c'); c.ell(2.5, 8, 1.6, 3.2, 'd'); c.ell(13.5, 8, 1.6, 3.2, 'd'); [[5, 6], [6, 6], [8, 7], [9, 7], [6, 9], [7, 9], [10, 9]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); }); c.line(8, 4, 8, 12, 'e'); };
EGG.abacus = function (c) { c.rect(3, 3, 10, 9, 'b'); c.rect(4, 4, 8, 7, 'e'); c.line(4, 7, 11, 7, 'a'); [5, 7, 9, 11].forEach(function (x, i) { c.px(x, 5, i % 2 ? 'd' : 'c'); c.px(x, 9, i % 2 ? 'c' : 'd'); c.px(x, 10, i % 2 ? 'c' : 'd'); }); c.rect(4, 12, 2, 2, 'b'); c.rect(10, 12, 2, 2, 'b'); };
EGG.lion = function (c) { c.ell(8, 6.5, 4.5, 4.5, 'a'); c.rect(4, 11, 8, 3, 'e'); c.pxo(6, 5, 'c'); c.pxo(7, 4, 'c'); c.pxo(10, 8, 'b'); c.pxo(9, 9, 'b'); c.px(5, 12, 'd'); c.px(9, 12, 'd'); c.px(8, 13, 'd'); c.line(6, 7, 7, 7, 'd'); };
EGG.brick = function (c) { c.rect(2, 5, 12, 7, 'a'); c.line(2, 8, 13, 8, 'b'); [4, 9].forEach(function (x) { c.px(x, 6, 'b'); c.px(x, 7, 'b'); }); [6, 11].forEach(function (x) { c.px(x, 9, 'b'); c.px(x, 10, 'b'); c.px(x, 11, 'b'); }); c.px(3, 6, 'c'); c.px(4, 6, 'c'); c.px(12, 10, 'e'); };
EGG.watch = function (c) { c.ell(8, 9, 5.4, 5.4, 'a'); c.ell(8, 2.5, 1.8, 1.8, 'b'); c.g[2][8] = '.'; c.ell(8, 9, 4, 4, 'c'); c.line(8, 9, 8, 6, 'k'); c.line(8, 9, 10, 10, 'k'); c.px(8, 9, 'e'); c.px(8, 5, 'k'); c.px(8, 13, 'k'); };
EGG.telegraph = function (c) { c.ell(8, 4, 3, 3, 'a'); c.rect(7, 6, 2, 2, 'a'); c.poly([[3, 13], [5, 8], [11, 8], [13, 13]], 'a'); c.rect(2, 12, 12, 2, 'b'); c.px(7, 3, 'd'); c.px(7, 4, 'd'); c.line(5, 10, 11, 10, 'b'); c.px(6, 11, 'c'); c.px(10, 11, 'c'); c.px(8, 2, 'c'); };
EGG.radio = function (c) { c.rect(2, 4, 12, 9, 'a'); c.rect(3, 5, 10, 7, 'b'); c.ell(10.5, 8, 2, 2, 'c'); c.px(10, 8, 'e'); c.rect(4, 6, 4, 5, 'a'); [5, 7].forEach(function (x) { c.line(x, 7, x, 10, 'c'); }); c.line(5, 4, 3, 2, 'c'); c.line(11, 4, 13, 2, 'c'); c.px(10, 6, 'e'); };
EGG.neon = function (c) { c.ell(8, 8, 6, 6, 'a'); c.ell(8, 8, 3.4, 3.4, 'c'); for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { var dx = x - 8, dy = y - 8; if (dx * dx + dy * dy <= 6.5) c.g[y][x] = '.'; } c.px(4, 5, 'e'); c.px(11, 11, 'e'); c.px(5, 11, 'd'); c.px(11, 4, 'd'); c.px(8, 2, 'd'); };
EGG.ink = function (c) { c.poly([[8, 1], [12, 8], [12, 11], [8, 14], [4, 11], [4, 8]], 'a'); c.ell(8, 10, 4, 3.6, 'a'); c.px(6, 8, 'c'); c.px(6, 9, 'c'); c.px(7, 7, 'c'); c.px(10, 12, 'b'); c.px(9, 11, 'd'); };
EGG.bee = function (c) { c.poly([[5, 3], [11, 3], [14, 8], [11, 13], [5, 13], [2, 8]], 'a'); c.poly([[6, 5], [10, 5], [12, 8], [10, 11], [6, 11], [4, 8]], 'c'); c.line(5, 8, 11, 8, 'b'); c.px(8, 6, 'b'); c.px(8, 10, 'b'); c.px(6, 9, 'e'); };
EGG.rubbing = function (c) { c.rect(4, 2, 8, 12, 'a'); for (var y = 3; y <= 12; y++) for (var x = 5; x <= 10; x++) if ((x + y) % 2 === 0) c.pxo(x, y, 'c'); c.rect(4, 2, 2, 2, 'e'); c.rect(10, 12, 2, 2, 'e'); c.rect(6, 6, 4, 4, 'b'); c.px(7, 7, 'd'); c.px(8, 8, 'd'); };
EGG.marrow = function (c) { c.ell(8, 8, 5.6, 5.6, 'a'); c.ell(8, 8, 4.4, 4.4, 'c'); c.ell(8, 8, 1.8, 1.8, 'y'); c.px(5, 5, 'w'); c.px(6, 5, 'w'); c.px(5, 6, 'w'); c.px(11, 10, 'd'); c.px(10, 11, 'd'); };
EGG.snailcrab = function (c) { c.ell(8, 11.5, 6, 2.6, 'a'); c.ell(8, 8.5, 4.6, 2.2, 'a'); c.ell(8, 5.8, 3.2, 1.8, 'a'); c.ell(8, 3.8, 1.6, 1.2, 'a'); [10, 7.6, 5.4].forEach(function (y, i) { c.line(8 - 5 + i * 1.3, y, 8 + 5 - i * 1.3, y, 'b'); }); c.px(5, 12, 'c'); c.px(11, 12, 'c'); };
EGG.leopard = function (c) { c.ell(8, 8, 6.6, 4.1, 'a'); [[4, 6], [7, 6], [10, 7], [5, 9], [8, 9], [11, 9], [12, 6]].forEach(function (p) { c.pxo(p[0], p[1], 'b'); c.pxo(p[0] + 1, p[1], 'b'); c.pxo(p[0], p[1] + 1, 'd'); }); c.px(3, 8, 'c'); };
EGG.seahorse = function (c) { c.ell(8, 8, 5.2, 6.2, 'a'); for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { var dx = (x - 11.5) / 3.6, dy = (y - 8) / 4.6; if (dx * dx + dy * dy <= 1) c.g[y][x] = '.'; } c.px(8, 8, 'c'); c.px(8, 9, 'c'); c.pxo(5, 6, 'd'); c.pxo(6, 11, 'b'); c.pxo(5, 9, 'b'); c.px(9, 2, 'e'); };
EGG.ironcrab = function (c) { c.rect(2, 5, 12, 7, 'a'); c.rect(2, 5, 12, 1, 'b'); c.rect(2, 11, 12, 1, 'b'); [3, 6, 9, 12].forEach(function (x) { c.px(x, 8, 'w'); }); c.rect(5, 6, 6, 4, 'b'); c.rect(6, 7, 4, 2, 'd'); c.px(7, 8, 'e'); c.px(8, 8, 'e'); c.rect(3, 12, 2, 2, 'b'); c.rect(11, 12, 2, 2, 'b'); };
EGG.kitedragon = function (c) { c.poly([[8, 1], [13, 6], [8, 14], [3, 6]], 'a'); c.line(8, 1, 8, 14, 'b'); c.line(3, 6, 13, 6, 'b'); c.px(5, 8, 'c'); c.px(11, 8, 'c'); c.px(7, 10, 'e'); c.px(9, 9, 'e'); c.px(8, 12, 'd'); c.px(6, 4, 'c'); c.px(10, 4, 'c'); };
EGG.sugartrain = function (c) { c.poly([[8, 2], [14, 5], [8, 8], [2, 5]], 'c'); c.poly([[2, 5], [8, 8], [8, 14], [2, 11]], 'a'); c.poly([[14, 5], [8, 8], [8, 14], [14, 11]], 'b'); c.px(8, 5, 'd'); c.px(5, 10, 'd'); c.px(11, 11, 'd'); c.px(4, 8, 'e'); };
EGG.parrot = function (c) { c.ell(8, 8, 6, 6, 'k'); [5, 4].forEach(function (r, i) { for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { var dx = x - 8, dy = y - 8, d = dx * dx + dy * dy; if (d > (r - 0.5) * (r - 0.5) && d <= r * r) c.pxo(x, y, 'b'); } }); c.ell(8, 8, 2, 2, 'a'); c.px(8, 8, 'd'); c.px(4, 5, 'e'); c.px(5, 4, 'e'); };
EGG.ufo = function (c) { c.ell(8, 9, 7, 2.8, 'a'); c.ell(8, 6.5, 3.2, 2.6, 'c'); c.ell(8, 11, 4.5, 1, 'b'); [3, 6, 10, 13].forEach(function (x) { c.px(x, 9, 'e'); }); c.px(7, 6, 'd'); c.px(8, 5, 'w'); };

/* ===================== 調色盤：a 主色、b 暗部、c/d/e 配色、o 專屬外框 ===================== */
var PAL = {
  tide: { a: '#4b6fd6', b: '#2f4a9c', c: '#9ad7ff', d: '#dff3ff', e: '#6fe0e8', o: '#14235a' },
  deer: { a: '#b9763a', b: '#7a4a22', c: '#e8c98a', d: '#f4e3c0', o: '#3d2209' },
  gull: { a: '#eaf0f7', b: '#9fb0c4', c: '#f0a030', d: '#6b7a8f', e: '#e04a3a', o: '#38485c' },
  sail: { a: '#d8ecf4', b: '#7a4a22', c: '#f0a860', d: '#4b6fd6', e: '#d95b43', o: '#2a3a5a' },
  bookworm: { a: '#a8c8a0', b: '#6f9468', c: '#f6efd8', d: '#7a4a22', e: '#d95b43', o: '#284a2c' },
  abacus: { a: '#e8d8a8', b: '#7a4a14', c: '#4b6fd6', d: '#c4553b', e: '#fff3d6', o: '#4a2a08' },
  lion: { a: '#c8b8a0', b: '#8a7660', c: '#e0d4c0', d: '#5aa8a0', e: '#8d6a3a', o: '#40281a' },
  brick: { a: '#c4553b', b: '#8f3a28', c: '#f0b090', d: '#e8d0b0', e: '#f2c14e', o: '#4a1a10' },
  watch: { a: '#c8a040', b: '#8a6a1c', c: '#fff6dc', d: '#7a8fa0', e: '#d95b43', o: '#3a2a08' },
  telegraph: { a: '#5aa0e0', b: '#2f6aa8', c: '#f2c14e', d: '#e8f0f8', e: '#d95b43', o: '#12305a' },
  radio: { a: '#8b5a2b', b: '#5a3a1e', c: '#c9ccd2', d: '#8fd3f4', e: '#f2c14e', o: '#2a1608' },
  neon: { a: '#e048c8', b: '#7a2a9c', c: '#58e8f0', d: '#ffe6fa', e: '#fff27a', o: '#3a0f52' },
  ink: { a: '#33406e', b: '#1e2748', c: '#8fa0e8', d: '#d9d2c0', e: '#d95b43', o: '#0c1230' },
  bee: { a: '#ffd23a', b: '#3b2f2f', c: '#cfeaf5', d: '#9aa3ad', e: '#f08a24', o: '#3b2f10' },
  rubbing: { a: '#46c7b0', b: '#2a8d7e', c: '#9ef0dc', d: '#ff6fb5', e: '#f2c14e', o: '#0f4a42' },
  marrow: { a: '#b9a0f0', b: '#7a5af8', c: '#e8dcff', d: '#8fe0ff', o: '#2a1a6a' },
  snailcrab: { a: '#f4b8c8', b: '#c87890', c: '#fff0f4', d: '#f08050', e: '#d95b43', o: '#5a2a3a' },
  leopard: { a: '#d8c890', b: '#5a4a30', c: '#f4ecd0', d: '#8a8a78', o: '#2a2214' },
  seahorse: { a: '#3fb8b0', b: '#1f7a78', c: '#f4ecd8', d: '#f0c040', e: '#d95b43', o: '#0a3a38' },
  ironcrab: { a: '#8a98a8', b: '#4a5868', c: '#c8d4e0', d: '#e04a3a', e: '#58e8f0', o: '#1a2230' },
  kitedragon: { a: '#e8506a', b: '#a02a48', c: '#ffd86a', d: '#58c8e8', e: '#ffffff', o: '#4a0f20' },
  sugartrain: { a: '#f6a0c0', b: '#b8587c', c: '#fff0a8', d: '#6fcfae', e: '#f2c14e', o: '#5a1a38' },
  parrot: { a: '#4fc05a', b: '#207a30', c: '#f08a24', d: '#d02a3a', e: '#f2c14e', o: '#0f3a18' },
  ufo: { a: '#9aa8c0', b: '#5a6888', c: '#58e8f0', d: '#a0f0ff', e: '#ff6fb5', o: '#1a2040' }
};
/* 蛋用比較淺的色塊，並讓外框色貼近主色 */
function fullPal(key, awake) {
  var p = {}, k; for (k in BASE) p[k] = BASE[k]; for (k in PAL[key]) p[k] = PAL[key][k];
  p.k = mix(PAL[key].o, '#000000', 0.5); if (awake) p.O = mix(PAL[key].o, '#f2c14e', 0.4);
  return p;
}
function pack(c, pal) {
  var p = {}, used = c.chars();
  used.forEach(function (ch) { p[ch] = pal[ch] || BASE[ch]; if (!p[ch]) throw new Error('未定義調色盤字元 ' + ch); });
  return { w: 16, h: 16, rows: c.rows(), pal: p };
}
var BABY_SCALE = { abacus: 0.82, lion: 0.66 };
function eggOf(key) {
  var c = new Cv(); EGG[key](c); c.outline('o');
  return pack(c, fullPal(key));
}
function stagesOf(key) {
  var fn = DRAW[key], pal = fullPal(key), palA = fullPal(key, true);
  var fill = new Cv(); fn(fill);
  var adult = fill.clone().outline('o');
  var bf = L.shrink(fill, BABY_SCALE[key] || 0.7, 14);
  (function () {                       /* 蛋殼帽：頭頂一小片白色殼，表示剛孵化 */
    var top = 16, left = 16, right = -1;
    bf.g.forEach(function (r, y) { r.forEach(function (ch, x) { if (ch !== '.') { if (y < top) top = y; } }); });
    bf.g[top].forEach(function (ch, x) { if (ch !== '.') { if (x < left) left = x; if (x > right) right = x; } });
    var cx = Math.round((left + right) / 2);
    [cx - 1, cx, cx + 1].forEach(function (x) { bf.px(x, top, 'w'); });
  })();
  var baby = bf.outline('o');
  var awake = fill.clone().outline('o');
  awake.g = awake.g.map(function (r) { return r.map(function (ch) { return ch === 'o' ? 'O' : ch; }); });
  /* 閃光只放在原本外框範圍內的空格，不撐大輪廓 */
  var n = 0, minx = 16, maxx = -1, miny = 16, maxy = -1;
  awake.g.forEach(function (r, y) { r.forEach(function (ch, x) { if (ch !== '.') { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }); });
  var cand = [];
  for (var y = miny + 1; y < maxy; y++) for (var x = minx + 1; x < maxx; x++) cand.push([x, y]);
  cand.sort(function (a, b) { return (Math.abs(b[0] - 7.5) + Math.abs(b[1] - 7.5)) - (Math.abs(a[0] - 7.5) + Math.abs(a[1] - 7.5)); });
  cand.forEach(function (p) { if (n < 3 && awake.plusFree(p[0], p[1], 'g', 'y')) n++; });
  cand.forEach(function (p) { if (n < 2) { if (awake.get(p[0], p[1]) === '.') { awake.px(p[0], p[1], 'g'); n++; } } });
  return { baby: pack(baby, pal), adult: pack(adult, pal), awake: pack(awake, palA) };
}
module.exports = { DRAW: DRAW, EGG: EGG, PAL: PAL, BASE: BASE, stagesOf: stagesOf, eggOf: eggOf, pack: pack, mix: mix };
