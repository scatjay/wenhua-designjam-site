/* 走讀商店：36 件家具的像素圖畫法、商品目錄、五套主題套裝、老闆任務板、房間格局。輸出 js/walk_data_shop.js。 */
'use strict';
var L = require('./gen_walk_lib.js'), Cv = L.Cv;
var S = require('./gen_walk_spirit.js');
var I = require('./gen_walk_items.js');

function pal(a, b, c, d, e) { return { a: a, b: b, c: c, d: d, e: e }; }
var F = {};   /* id → { draw(c), pal, post? } */

/* ===== 牆飾（12）===== */
F.tide_map = { pal: pal('#bfe3f0', '#8b5a2b', '#4b6fd6', '#d9a878', '#d95b43'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  c.line(2, 6, 6, 5, 'c'); c.line(6, 5, 10, 7, 'c'); c.line(10, 7, 13, 6, 'c'); c.line(2, 10, 7, 11, 'c'); c.line(7, 11, 13, 10, 'c');
  c.ell(7, 8, 2.2, 1.4, 'd'); c.px(11, 4, 'e'); c.px(11, 5, 'e'); c.px(10, 4, 'e'); c.px(12, 4, 'e'); c.px(11, 3, 'e'); } };
F.whale_bone = { pal: pal('#3a3a4f', '#2a2a3a', '#f4ecd8', '#cfc6ae', '#8b5a2b'), draw: function (c) {
  c.rect(1, 2, 14, 11, 'a'); c.rect(1, 2, 14, 1, 'e'); c.rect(1, 12, 14, 1, 'e');
  c.line(3, 7, 13, 7, 'c'); c.ell(3.5, 7, 1.8, 1.5, 'c'); c.px(3, 6, 'b');
  [[5, 3], [7, 3], [9, 4], [11, 5]].forEach(function (p) { c.line(p[0], 7, p[0] - 1, p[1] + 1, 'c'); });
  [[5, 11], [7, 11], [9, 10], [11, 9]].forEach(function (p) { c.line(p[0], 7, p[0] - 1, p[1] - 1, 'c'); }); } };
F.lantern_string = { pal: pal('#d95b43', '#b8892a', '#8b5a2b', '#f2c14e', '#fff3b0'), draw: function (c) {
  c.line(1, 2, 14, 3, 'c');
  [[3.5, 7], [8, 8], [12.5, 7]].forEach(function (p) {
    c.ell(p[0], p[1], 2, 2.8, 'a'); c.rect(Math.round(p[0]) - 1, Math.round(p[1]) - 3, 2, 1, 'b'); c.rect(Math.round(p[0]) - 1, Math.round(p[1]) + 3, 2, 1, 'b');
    c.px(p[0], p[1], 'e'); c.line(Math.round(p[0]), Math.round(p[1]) + 4, Math.round(p[0]), Math.round(p[1]) + 6, 'd'); }); } };
F.arch_sketch = { pal: pal('#fbf6e6', '#b8892a', '#c4553b', '#8f3a28', '#7fb0e8'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  c.rect(4, 7, 8, 5, 'c'); c.poly([[3, 7], [8, 4], [13, 7]], 'd'); c.rect(7, 9, 2, 3, 'k'); c.px(7, 8, 'k'); c.px(8, 8, 'k');
  c.rect(5, 8, 1, 2, 'e'); c.rect(10, 8, 1, 2, 'e'); } };
F.radio_schedule = { pal: pal('#2f6b52', '#6b3f1e', '#fff3d6', '#8fd3f4', '#f2c14e'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  c.line(3, 5, 9, 5, 'c'); c.line(3, 7, 11, 7, 'c'); c.line(3, 9, 8, 9, 'c'); c.line(3, 11, 10, 11, 'c');
  c.ell(12, 5.5, 1.5, 1.5, 'e'); c.px(12, 5, 'k'); c.px(12, 6, 'k'); c.px(12, 9, 'd'); c.px(11, 10, 'd'); c.px(13, 10, 'd'); } };
F.neon_sign = { pal: pal('#ff5fc8', '#2a2a3a', '#58e8f0', '#8a1f6a', '#fff27a'), draw: function (c) {
  c.rect(1, 3, 14, 10, 'b');
  c.rect(2, 4, 12, 1, 'a'); c.rect(2, 11, 12, 1, 'a'); c.rect(2, 4, 1, 8, 'a'); c.rect(13, 4, 1, 8, 'a');
  c.line(4, 6, 4, 9, 'c'); c.line(4, 6, 6, 6, 'c'); c.line(4, 8, 6, 8, 'c'); c.line(8, 6, 8, 9, 'c'); c.line(10, 6, 10, 9, 'c'); c.line(8, 6, 10, 6, 'c');
  c.px(12, 6, 'e'); c.px(12, 9, 'e'); c.px(2, 13, 'd'); c.px(13, 13, 'd'); } };
F.restore_plan = { pal: pal('#3f78c4', '#8b5a2b', '#ffffff', '#cfe6ff', '#f2c14e'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  for (var x = 3; x <= 12; x += 3) c.line(x, 3, x, 12, 'd'); for (var y = 5; y <= 12; y += 3) c.line(2, y, 13, y, 'd');
  c.rect(4, 7, 7, 4, 'c'); c.poly([[3, 7], [7.5, 4], [12, 7]], 'c'); c.rect(7, 9, 2, 2, 'a'); c.px(12, 11, 'e'); c.px(11, 12, 'e'); } };
F.rubbing_board = { pal: pal('#fbf6e6', '#8b5a2b', '#3a3a4f', '#cfc6ae', '#c98f63'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  c.line(8, 4, 8, 12, 'c'); c.line(4, 8, 12, 8, 'c'); c.line(8, 4, 12, 8, 'c'); c.line(12, 8, 8, 12, 'c'); c.line(8, 12, 4, 8, 'c'); c.line(4, 8, 8, 4, 'c');
  c.px(8, 8, 'c'); c.px(6, 6, 'd'); c.px(10, 10, 'd'); c.px(10, 6, 'd'); c.px(6, 10, 'd'); } };
F.bureau_badge = { pal: pal('#2f4a9c', '#f2c14e', '#ffffff', '#1e2f6a', '#9ad7ff'), draw: function (c) {
  c.poly([[2, 2], [14, 2], [14, 9], [8, 14], [2, 9]], 'b'); c.poly([[3, 3], [13, 3], [13, 8.5], [8, 13], [3, 8.5]], 'a');
  c.ell(8, 7.5, 3.6, 2.2, 'e'); c.px(11, 7, 'c'); c.px(6, 7, 'k'); c.line(8, 4, 8, 5, 'c'); c.px(7, 4, 'c'); c.px(9, 4, 'c'); } };
F.route_map = { pal: pal('#f4ecd8', '#8b5a2b', '#d95b43', '#5fbf7a', '#7fb0e8'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a'); c.rect(2, 9, 12, 2, 'e'); c.ell(4, 5, 1.5, 1.2, 'd'); c.ell(12, 6, 1.4, 1.2, 'd');
  c.px(4, 11, 'c'); c.px(5, 10, 'c'); c.px(6, 9, 'c'); c.px(7, 8, 'c'); c.px(8, 7, 'c'); c.px(9, 6, 'c'); c.px(10, 6, 'c'); c.px(11, 7, 'c');
  c.px(4, 12, 'c'); c.px(11, 5, 'c'); c.px(11, 4, 'c'); c.px(10, 4, 'c'); c.px(12, 4, 'c'); } };
F.note_board = { pal: pal('#d9a878', '#8b5a2b', '#fff27a', '#ff9fc0', '#9ad7ff'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'a');
  c.rect(3, 4, 4, 4, 'c'); c.rect(8, 5, 4, 3, 'd'); c.rect(4, 9, 3, 3, 'e'); c.rect(8, 9, 5, 3, 'c');
  c.px(4, 5, 'k'); c.px(5, 6, 'k'); c.px(9, 6, 'k'); c.px(10, 6, 'k'); c.px(5, 10, 'k'); c.px(9, 10, 'k'); c.px(11, 10, 'k'); c.px(5, 4, 'o'); c.px(10, 5, 'o'); } };
F.photo_frame = { pal: pal('#9ad7ff', '#b8892a', '#5fbf7a', '#fbf6e6', '#f2c14e'), draw: function (c) {
  c.rect(1, 2, 14, 12, 'b'); c.rect(2, 3, 12, 10, 'd'); c.rect(3, 4, 10, 8, 'a');
  c.ell(5, 6.5, 1.3, 1.3, 'e'); c.poly([[3, 12], [7, 8], [10, 12]], 'c'); c.poly([[8, 12], [11, 9], [13, 12]], 'c'); } };

/* ===== 地面（14）===== */
F.shell_rug = { pal: pal('#f4c7a8', '#c98f63', '#ffffff', '#e8a07a', '#fbe3d0'), draw: function (c) {
  c.ell(8, 11, 7, 3.5, 'b'); c.ell(8, 11, 6, 2.8, 'a');
  c.poly([[8, 8.5], [5, 11.5], [11, 11.5]], 'c'); c.line(8, 9, 8, 12, 'd'); c.line(7, 9, 6, 12, 'd'); c.line(9, 9, 10, 12, 'd'); } };
F.sampan_table = { pal: pal('#d9a878', '#6b3f1e', '#8b5a2b', '#9ad7ff', '#f2c14e'), draw: function (c) {
  c.rect(2, 6, 12, 2, 'a'); c.poly([[2, 8], [14, 8], [12, 13], [4, 13]], 'c'); c.line(3, 10, 13, 10, 'b'); c.line(14, 6, 14, 3, 'b'); c.poly([[14, 3], [14, 5], [11, 4]], 'e');
  c.px(6, 5, 'd'); c.px(7, 5, 'd'); c.px(6, 4, 'd'); } };
F.bamboo_chair = { pal: pal('#d8c070', '#a88f3a', '#f0e2a0', '#8b5a2b', '#5fbf7a'), draw: function (c) {
  c.rect(3, 2, 3, 9, 'a'); c.rect(3, 10, 10, 2, 'a'); c.rect(3, 12, 1, 3, 'b'); c.rect(12, 12, 1, 3, 'b');
  [3, 5, 7, 9].forEach(function (y) { c.line(3, y, 5, y, 'b'); }); [5, 7, 9, 11].forEach(function (x) { c.px(x, 10, 'b'); });
  c.rect(6, 7, 3, 3, 'c'); } };
F.stall_table = { pal: pal('#d95b43', '#6b3f1e', '#ffffff', '#c98f63', '#f2c14e'), draw: function (c) {
  c.rect(2, 3, 12, 3, 'a'); for (var x = 2; x < 14; x += 4) c.rect(x, 3, 2, 3, 'c');
  c.rect(2, 7, 12, 5, 'd'); c.rect(4, 8, 4, 3, 'e'); c.rect(9, 8, 3, 3, 'b');
  c.ell(4, 13, 1.6, 1.6, 'b'); c.ell(12, 13, 1.6, 1.6, 'b'); c.px(4, 13, 'c'); c.px(12, 13, 'c'); } };
F.brick_shelf = { pal: pal('#c4553b', '#8f3a28', '#7fb0e8', '#5fbf7a', '#f2c14e'), draw: function (c) {
  c.rect(2, 2, 12, 13, 'a'); for (var y = 4; y <= 13; y += 3) c.line(2, y, 13, y, 'b'); [5, 9, 12].forEach(function (x) { c.px(x, 3, 'b'); c.px(x - 2, 6, 'b'); });
  c.rect(4, 3, 8, 3, 'k'); c.rect(4, 8, 8, 3, 'k');
  [[4, 'c'], [5, 'e'], [6, 'd'], [7, 'c'], [9, 'e'], [10, 'd']].forEach(function (b) { c.rect(b[0], 4, 1, 2, b[1]); c.rect(b[0] + 0, 9, 1, 2, b[1] === 'c' ? 'd' : 'c'); }); } };
F.arch_column = { pal: pal('#e8d0b0', '#c4553b', '#b89a70', '#8f3a28', '#fbf3e0'), draw: function (c) {
  c.rect(5, 3, 6, 10, 'a'); c.rect(4, 2, 8, 2, 'b'); c.rect(4, 13, 8, 2, 'b'); c.rect(3, 14, 10, 1, 'c');
  for (var y = 5; y <= 11; y += 2) c.line(5, y, 10, y, 'c'); c.px(6, 4, 'e'); c.px(6, 6, 'e'); } };
F.kiln_model = { pal: pal('#c4553b', '#8f3a28', '#2a2a3a', '#e8d0b0', '#fff3d6'), draw: function (c) {
  c.rect(10, 3, 3, 5, 'b'); c.px(11, 1, 'e'); c.px(12, 2, 'e'); c.px(10, 2, 'e');
  c.ell(7.5, 11, 6, 4.6, 'a'); c.clearBelow(13); c.line(3, 10, 12, 10, 'b'); c.line(2, 12, 13, 12, 'b'); c.px(5, 9, 'b'); c.px(9, 9, 'b');
  c.poly([[5, 13], [5, 11], [7.5, 9.5], [10, 11], [10, 13]], 'c'); c.rect(7, 12, 2, 1, 'd'); c.px(7, 11, 'd'); c.px(8, 11, 'd'); } };
F.radio_cabinet = { pal: pal('#8b5a2b', '#5a3a1e', '#c9ccd2', '#8fd3f4', '#f2c14e'), draw: function (c) {
  c.rect(2, 2, 12, 13, 'a'); c.rect(3, 3, 10, 5, 'b'); c.ell(5.5, 5.5, 1.7, 1.7, 'c'); c.px(5, 6, 'b'); c.rect(8, 4, 4, 1, 'e'); c.px(9, 6, 'e'); c.px(11, 6, 'e');
  c.rect(3, 9, 10, 4, 'b'); [4, 6, 8, 10, 12].forEach(function (x) { c.line(x, 9, x, 12, 'c'); }); c.rect(3, 14, 2, 1, 'b'); c.rect(11, 14, 2, 1, 'b'); } };
F.vinyl_player = { pal: pal('#8b5a2b', '#2a2a3a', '#c9ccd2', '#d95b43', '#f2c14e'), draw: function (c) {
  c.rect(2, 7, 12, 7, 'a'); c.ell(7, 9.5, 5, 2.2, 'b'); c.ell(7, 9.5, 1.5, 1, 'd'); c.px(7, 9, 'e');
  c.line(12, 6, 10, 9, 'c'); c.px(12, 5, 'c'); c.px(13, 5, 'c'); c.rect(3, 12, 2, 1, 'e'); c.rect(2, 14, 2, 1, 'b'); c.rect(12, 14, 2, 1, 'b'); } };
F.workbench = { pal: pal('#d9a878', '#6b3f1e', '#9aa3ad', '#d95b43', '#8b5a2b'), draw: function (c) {
  c.rect(1, 7, 14, 2, 'a'); c.rect(2, 9, 2, 6, 'b'); c.rect(12, 9, 2, 6, 'b'); c.rect(4, 12, 8, 1, 'b');
  c.rect(3, 5, 4, 2, 'c'); c.rect(4, 3, 1, 2, 'e'); c.rect(9, 6, 5, 1, 'c'); c.px(9, 5, 'c'); c.px(11, 5, 'c'); c.px(13, 5, 'c'); c.rect(8, 4, 2, 2, 'd'); } };
F.scaffold_ladder = { pal: pal('#d8a040', '#8b5a2b', '#9aa3ad', '#2a2a3a', '#f2c14e'), draw: function (c) {
  c.rect(4, 2, 1, 13, 'a'); c.rect(11, 2, 1, 13, 'a'); [4, 7, 10, 13].forEach(function (y) { c.rect(5, y, 6, 1, 'b'); });
  c.line(5, 5, 10, 8, 'c'); c.line(5, 8, 10, 11, 'c'); c.rect(3, 1, 10, 1, 'e'); c.px(5, 1, 'd'); c.px(8, 1, 'd'); c.px(11, 1, 'd'); } };
F.scanner_stand = { pal: pal('#cfd6e0', '#5a6070', '#58e8f0', '#ff5fc8', '#fff27a'), draw: function (c) {
  c.line(8, 9, 3, 14, 'b'); c.line(8, 9, 13, 14, 'b'); c.line(8, 9, 8, 14, 'b');
  c.rect(4, 3, 8, 6, 'a'); c.rect(5, 4, 6, 4, 'b'); c.ell(8, 6, 1.7, 1.7, 'c'); c.px(8, 6, 'e'); c.px(5, 3, 'd'); c.px(11, 3, 'd'); } };
F.plant = { pal: pal('#5fbf7a', '#c4783a', '#3f8d66', '#a8743f', '#8fe0a8'), draw: function (c) {
  c.poly([[4, 10], [12, 10], [11, 14], [5, 14]], 'b'); c.rect(4, 9, 8, 2, 'd');
  c.ell(5, 6, 2, 3, 'a'); c.ell(11, 6, 2, 3, 'a'); c.ell(8, 4, 2, 3.2, 'a'); c.ell(8, 7, 1.2, 2, 'c'); c.line(5, 8, 5, 5, 'c'); c.line(11, 8, 11, 5, 'c'); c.px(8, 3, 'e'); } };
F.book_stack = { pal: pal('#d95b43', '#4b6fd6', '#f2c14e', '#5fbf7a', '#fbf6e6'), draw: function (c) {
  c.rect(3, 12, 10, 3, 'a'); c.rect(4, 9, 8, 3, 'b'); c.rect(5, 6, 6, 3, 'c'); c.rect(6, 3, 4, 3, 'd');
  [[3, 14], [4, 11], [5, 8], [6, 5]].forEach(function (p) { c.line(p[0] + 1, p[1], p[0] + 3, p[1], 'e'); }); } };

/* ===== 窗景（4）===== */
F.sea_window = { pal: pal('#4b6fd6', '#d9a878', '#bfe3f0', '#ffffff', '#f2c14e'), draw: function (c) {
  c.rect(1, 1, 14, 14, 'b'); c.rect(2, 2, 12, 12, 'c'); c.rect(2, 8, 12, 6, 'a'); c.line(3, 10, 6, 10, 'd'); c.line(9, 12, 12, 12, 'd'); c.line(5, 9, 7, 9, 'd');
  c.ell(11, 4.5, 1.6, 1.6, 'e'); c.px(4, 4, 'd'); c.px(5, 3, 'd'); c.rect(7, 2, 2, 12, 'b'); c.rect(2, 7, 12, 1, 'b'); } };
F.street_dusk = { pal: pal('#f08a4a', '#8b5a2b', '#ffd27a', '#2a2a3a', '#d95b43'), draw: function (c) {
  c.rect(1, 1, 14, 14, 'b'); c.rect(2, 2, 12, 6, 'a'); c.rect(2, 5, 12, 3, 'c'); c.rect(2, 8, 12, 6, 'd');
  c.poly([[2, 8], [5, 6], [8, 8]], 'd'); c.poly([[7, 8], [11, 5.5], [14, 8]], 'd'); c.rect(3, 9, 4, 3, 'd'); c.px(4, 10, 'c'); c.px(10, 10, 'c'); c.px(11, 10, 'c');
  c.px(5, 12, 'e'); c.px(5, 13, 'e'); c.px(11, 12, 'e'); c.px(11, 13, 'e'); c.rect(7, 2, 2, 12, 'b'); c.rect(2, 7, 12, 1, 'b'); } };
F.brick_arch = { pal: pal('#c4553b', '#8f3a28', '#9ad7ff', '#e8d0b0', '#ffffff'), draw: function (c) {
  c.rect(1, 2, 14, 13, 'a'); for (var y = 4; y <= 13; y += 3) c.line(1, y, 14, y, 'b');
  c.ell(8, 7.5, 4.6, 4.6, 'd'); c.rect(3, 7, 10, 7, 'd'); c.ell(8, 7.5, 3.6, 3.6, 'c'); c.rect(4, 7, 8, 6, 'c'); c.rect(7, 4, 2, 9, 'd'); c.rect(4, 8, 8, 1, 'd'); c.px(5, 5, 'e'); c.px(10, 9, 'e'); } };
F.whale_night = { pal: pal('#1e2f6a', '#4b6fd6', '#ffffff', '#9ad7ff', '#fff27a'), draw: function (c) {
  c.rect(1, 1, 14, 14, 'b'); c.rect(2, 2, 12, 12, 'a');
  [[4, 3], [10, 4], [6, 6], [12, 7], [3, 9], [11, 12], [5, 12]].forEach(function (p) { c.px(p[0], p[1], 'c'); }); c.ell(11, 4, 1.5, 1.5, 'e'); c.px(12, 3, 'a');
  c.ell(7, 9, 4.2, 2, 'b'); c.poly([[2, 6.5], [4, 8.5], [3, 9], [2, 8]], 'b'); c.px(9, 8, 'k'); c.px(7, 11, 'd'); c.px(8, 6, 'd'); c.px(8, 5, 'd'); c.px(9, 5, 'd');
  c.rect(7, 2, 2, 12, 'a'); c.rect(2, 7, 12, 1, 'a'); } };

/* ===== 小精靈用品（6）===== */
F.spirit_nest = { pal: pal('#e8c870', '#a8843a', '#f4e3b0', '#8b5a2b', '#e87fa8'), draw: function (c) {
  c.ell(8, 11, 6.5, 3.6, 'a'); c.ell(8, 10.4, 4.8, 2, 'c'); c.line(3, 11, 6, 13, 'b'); c.line(9, 13, 13, 11, 'b'); c.line(2, 10, 4, 8, 'b'); c.line(12, 8, 14, 10, 'b'); c.ell(8, 10.4, 1.8, 0.9, 'e'); } };
F.plush_nest = { pal: pal('#f0a8c0', '#c4647c', '#fff0f5', '#f2c14e', '#ffffff'), draw: function (c) {
  c.rect(2, 8, 12, 6, 'b'); c.ell(8, 8.5, 6.5, 3, 'a'); c.ell(8, 8.5, 5, 2, 'c'); c.rect(3, 10, 10, 4, 'a'); c.line(4, 12, 12, 12, 'b');
  c.px(8, 8, 'd'); c.px(7, 8, 'd'); c.px(9, 8, 'd'); c.px(8, 7, 'd'); c.px(4, 11, 'c'); c.px(12, 11, 'c'); } };
F.food_bowl = { pal: pal('#7fb0e8', '#4b6fd6', '#d9a878', '#f4e3b0', '#d95b43'), draw: function (c) {
  c.ell(8, 9, 6, 3.2, 'd'); c.ell(8, 9, 4.8, 2, 'c'); c.ell(8, 8.5, 3.4, 1.6, 'e'); c.clearBelow(13);
  c.poly([[2, 9.5], [14, 9.5], [12, 13], [4, 13]], 'a'); c.line(3, 11, 13, 11, 'b'); c.px(7, 7, 'e'); c.px(9, 7, 'e'); } };
F.toy_basket = { pal: pal('#d9a878', '#8b5a2b', '#d95b43', '#4b6fd6', '#f2c14e'), draw: function (c) {
  c.rect(3, 8, 10, 6, 'a'); c.rect(2, 7, 12, 2, 'b'); [4, 6, 8, 10, 12].forEach(function (x) { c.line(x, 9, x, 13, 'b'); }); c.line(3, 11, 12, 11, 'b');
  c.ell(5.5, 5, 1.8, 1.8, 'c'); c.rect(8, 3, 3, 3, 'd'); c.px(12, 4, 'e'); c.px(12, 5, 'e'); c.px(11, 5, 'e'); c.px(13, 5, 'e'); c.px(12, 6, 'e'); } };
F.light_lamp = { pal: pal('#fff27a', '#5a6070', '#cfd6e0', '#ffe9a0', '#f2c14e'), draw: function (c) {
  c.rect(6, 12, 4, 2, 'b'); c.rect(7, 7, 2, 5, 'b'); c.ell(8, 5, 3, 3, 'a'); c.ell(8, 5, 1.5, 1.5, 'd'); c.px(3, 5, 'e'); c.px(2, 5, 'e'); c.px(13, 5, 'e'); c.px(12, 5, 'e'); c.px(8, 1, 'e'); c.px(5, 2, 'e'); c.px(11, 2, 'e'); c.px(5, 9, 'e'); c.px(11, 9, 'e'); } };
F.scratch_tower = { pal: pal('#d9a878', '#8b5a2b', '#a8743f', '#e87fa8', '#f4e3b0'), draw: function (c) {
  c.rect(2, 13, 12, 2, 'b'); c.rect(7, 4, 3, 9, 'c'); [5, 7, 9, 11].forEach(function (y) { c.line(7, y, 9, y, 'b'); });
  c.rect(3, 3, 10, 2, 'a'); c.rect(3, 3, 10, 1, 'e'); c.rect(2, 8, 5, 1, 'a'); c.ell(4.5, 7, 1.5, 1.3, 'd'); } };

/* ===== 目錄 ===== */
var FURN = [
  /* id, 名稱, 擺放類型, 價格, 套裝, 稀有度, 說明 */
  ['tide_map', '潮汐海圖', 'wall', 60, 'set_tide', '普通', '畫著海岸線與潮汐的小地圖。'],
  ['whale_bone', '鯨骨標本掛飾', 'wall', 0, 'set_tide', '稀有', '一副鯨魚骨骼的小標本。'],
  ['lantern_string', '老街燈籠串', 'wall', 50, 'set_street', '普通', '一串紅燈籠，掛在牆上很熱鬧。'],
  ['arch_sketch', '建築素描框', 'wall', 60, 'set_brick', '普通', '用鉛筆畫的磚造拱門。'],
  ['radio_schedule', '廣播時間表', 'wall', 50, 'set_radio', '普通', '寫滿節目時刻的綠色黑板。'],
  ['neon_sign', '霓虹字招牌', 'wall', 90, 'set_radio', '普通', '夜裡會發光的小招牌。'],
  ['restore_plan', '修復計畫圖', 'wall', 60, 'set_restore', '普通', '藍色底的修復設計圖。'],
  ['rubbing_board', '拓印板', 'wall', 70, 'set_restore', '普通', '把紋路拓在紙上的木板。'],
  ['bureau_badge', '時安局徽章', 'wall', 0, '', '稀有', '時安局的盾形徽章。'],
  ['route_map', '走讀路線地圖', 'wall', 40, '', '普通', '用紅點畫出走過的路。'],
  ['note_board', '便條板', 'wall', 30, '', '普通', '貼滿彩色便條的軟木板。'],
  ['photo_frame', '照片相框', 'wall', 40, '', '普通', '放一張你喜歡的風景。'],
  ['shell_rug', '貝殼地毯', 'floor', 90, 'set_tide', '普通', '鋪一片海灘在房間裡。'],
  ['sampan_table', '舢舨小桌', 'floor', 120, 'set_tide', '普通', '船形的小桌子，桅杆上有小旗。'],
  ['bamboo_chair', '竹編躺椅', 'floor', 110, 'set_street', '普通', '涼涼的竹編椅，躺著很舒服。'],
  ['stall_table', '攤車小餐桌', 'floor', 130, 'set_street', '普通', '帶遮陽棚的小攤車。'],
  ['brick_shelf', '紅磚書櫃', 'floor', 140, 'set_brick', '普通', '磚紅色的書櫃，書排得整整齊齊。'],
  ['arch_column', '拱廊立柱', 'floor', 100, 'set_brick', '普通', '拱廊下常見的粗圓柱。'],
  ['kiln_model', '磚窯模型', 'floor', 0, 'set_brick', '稀有', '會冒小煙的磚窯模型。'],
  ['radio_cabinet', '老收音機櫃', 'floor', 130, 'set_radio', '普通', '木頭櫃子上有一台老收音機。'],
  ['vinyl_player', '黑膠唱片機', 'floor', 150, 'set_radio', '普通', '放著一張紅色唱片。'],
  ['workbench', '木工工作台', 'floor', 130, 'set_restore', '普通', '桌上放著鎚子和鋸子。'],
  ['scaffold_ladder', '鷹架小梯', 'floor', 90, 'set_restore', '普通', '黃色的工地小梯。'],
  ['scanner_stand', '掃描儀座', 'floor', 0, 'set_restore', '稀有', '會發出藍光的三腳掃描儀。'],
  ['plant', '綠葉盆栽', 'floor', 70, '', '普通', '陶盆裡的綠葉小植物。'],
  ['book_stack', '書堆小桌', 'floor', 60, '', '普通', '一疊顏色不同的書。'],
  ['sea_window', '海潮窗景', 'window', 100, 'set_tide', '普通', '窗外是藍藍的海和小太陽。'],
  ['street_dusk', '老街黃昏', 'window', 90, 'set_street', '普通', '窗外是黃昏的老屋頂與燈光。'],
  ['brick_arch', '紅磚拱窗', 'window', 110, 'set_brick', '普通', '磚砌的拱形窗。'],
  ['whale_night', '藍鯨之夜', 'window', 0, '', '傳說', '夜空中一隻藍鯨慢慢游過。'],
  ['spirit_nest', '小精靈窩', 'pet', 30, '', '普通', '稻草編的小窩，小精靈最愛打盹。'],
  ['plush_nest', '軟墊大窩', 'pet', 80, '', '普通', '粉紅色的軟墊，窩的升級版。'],
  ['food_bowl', '食碗', 'pet', 30, '', '普通', '放點心的藍色小碗。'],
  ['toy_basket', '玩具籃', 'pet', 50, '', '普通', '裝滿球與積木的小籃子。'],
  ['light_lamp', '光點燈', 'pet', 60, '', '普通', '會在地上投出光點的小燈。'],
  ['scratch_tower', '抓板小塔', 'pet', 70, '', '普通', '有繩柱和平台的小塔。']
];
/* 稀有與傳說：不能用點數買，寫明取得條件 */
var UNLOCK = {
  whale_bone: { type: 'shards', n: 10, cond: '在收藏換物所，用 10 張重複的情報碎屑換取。' },
  kiln_model: { type: 'shards', n: 10, cond: '在收藏換物所，用 10 張重複的情報碎屑換取。' },
  scanner_stand: { type: 'dexPct', n: 50, cond: '圖鑑完成度達 50%，在里程碑獎勵領取。' },
  bureau_badge: { type: 'routeDone', n: 1, cond: '完成一整條走讀路線（拿齊所有碎片）。' },
  whale_night: { type: 'dexPct', n: 100, cond: '圖鑑完成度達 100%，在里程碑獎勵領取。' }
};
var SETS = [
  { id: 'set_tide', name: '台江海', desc: '潮水與鯨骨的海味房間。', bonus: { name: '海風', desc: '窗外多一群海鷗飛過（純裝飾，不加分）。', fx: 'seagulls' } },
  { id: 'set_street', name: '府城老街', desc: '燈籠、竹椅與小攤的熱鬧。', bonus: { name: '夜市燈', desc: '房間的燈光變暖黃色（純裝飾，不加分）。', fx: 'warmLight' } },
  { id: 'set_brick', name: '日治紅磚', desc: '紅磚、拱廊與窯火的老味道。', bonus: { name: '磚紋', desc: '牆面浮出淡淡的磚紋（純裝飾，不加分）。', fx: 'brickWall' } },
  { id: 'set_radio', name: '戰後廣播', desc: '收音機、唱片與霓虹招牌。', bonus: { name: '電台', desc: '收音機會有小小的音符飄出（純裝飾，不加分）。', fx: 'notes' } },
  { id: 'set_restore', name: '文資修復室', desc: '工作台、鷹架與掃描儀。', bonus: { name: '修復燈', desc: '小精靈會戴上小安全帽走動（純裝飾，不加分）。', fx: 'hardhat' } }
];

var SPOT_ZONE = { wall: '家具鋪・牆飾', floor: '家具鋪・地面', window: '家具鋪・窗景', pet: '玩具與用品' };
/* zone＝所屬分區（家具鋪底下再標擺放類型，方便畫面與擺放程式判斷）；cat＝商品大類 */
function zoneOf(spot) { return SPOT_ZONE[spot]; }
function catOf(spot) { return spot === 'pet' ? '小精靈用品' : '家具'; }
function build() {
  var furniture = FURN.map(function (f) {
    var def = F[f[0]]; if (!def) throw new Error('缺畫法 ' + f[0]);
    var c = new Cv(); def.draw(c); c.outline('o');
    var o = { id: f[0], name: f[1], zone: zoneOf(f[2]), cat: catOf(f[2]), spot: f[2], price: f[3], set: f[4], rarity: f[5], desc: f[6], sprite: S.pack(c, Object.assign({}, S.BASE, def.pal)) };
    if (f[5] !== '普通') { o.noBuy = true; var u = UNLOCK[f[0]]; if (!u) throw new Error('稀有品缺取得條件 ' + f[0]); o.unlock = { type: u.type, n: u.n }; o.cond = u.cond; }
    return o;
  });
  var sets = SETS.map(function (s) {
    var m = furniture.filter(function (x) { return x.set === s.id; });
    var sum = m.reduce(function (a, x) { return a + x.price; }, 0);
    var bp = Math.max(300, Math.round(sum * 0.8 / 10) * 10);
    return { id: s.id, name: s.name, zone: '家具鋪', cat: '套裝', desc: s.desc, items: m.map(function (x) { return x.id; }), bundlePrice: bp, price: bp, bonus: s.bonus };
  });
  return { furniture: furniture, sets: sets };
}

/* ===== 老闆任務板（每日由種子抽 3 則）===== */
var BOARD = [
  { id: 'bq_arrive', text: '走到任何一站的圍欄裡。', event: 'arrive', n: 1, reward: { points: 10, food: null } },
  { id: 'bq_feed', text: '餵你的小精靈吃點心。', event: 'feed', n: 1, reward: { points: 5, food: 'food_plain' } },
  { id: 'bq_visit', text: '去拜訪一間別人的房間。', event: 'visit', n: 1, reward: { points: 8, food: null } },
  { id: 'bq_pet', text: '摸摸小精靈 3 次。', event: 'pet', n: 3, reward: { points: 5, food: 'food_plain' } },
  { id: 'bq_play', text: '陪小精靈玩一次。', event: 'play', n: 1, reward: { points: 6, food: 'food_plain' } },
  { id: 'bq_task', text: '完成一個任務。', event: 'task', n: 1, reward: { points: 12, food: null } },
  { id: 'bq_dispatch', text: '派一隻小精靈去勘察。', event: 'dispatch', n: 1, reward: { points: 8, food: 'food_plain' } },
  { id: 'bq_collect', text: '把勘察帶回的情報收下來。', event: 'collect', n: 1, reward: { points: 10, food: null } }
];

/* ===== 房間格局：12×8 格，每格 16 像素，放大 3 倍 =====
   第 0~2 列是牆面（不可走），第 3~7 列是地板；擺放點共 15 個：牆 6、地 6、窗 3。
   areas 是固定的大件區域（成就牆、照片牆、圖鑑書櫃、衣櫃、地圖桌、小精靈窩），blocking 裡的區域不可走。
   walk＝由牆面與 blocking 推出的可走格（'.' 可走、'#' 不可走）；放了家具的地面擺放點在執行時另外擋住。 */
var LAYOUT = {
  cols: 12, rows: 8, tile: 16, scale: 3, wallRows: 3,
  spots: {
    wall1: { x: 0, y: 2 }, wall2: { x: 1, y: 2 }, wall3: { x: 3, y: 2 }, wall4: { x: 6, y: 2 }, wall5: { x: 7, y: 2 }, wall6: { x: 8, y: 2 },
    floor1: { x: 2, y: 5 }, floor2: { x: 3, y: 3 }, floor3: { x: 8, y: 3 }, floor4: { x: 8, y: 5 }, floor5: { x: 3, y: 7 }, floor6: { x: 6, y: 7 },
    window1: { x: 3, y: 0 }, window2: { x: 6, y: 0 }, window3: { x: 9, y: 0 }
  },
  areas: {
    achieve: { x: 0, y: 0, w: 2, h: 2 }, photos: { x: 4, y: 0, w: 2, h: 2 }, shelf: { x: 10, y: 0, w: 2, h: 4 },
    closet: { x: 0, y: 3, w: 1, h: 2 }, map: { x: 5, y: 4, w: 2, h: 1 }, nest: { x: 10, y: 6, w: 1, h: 1 }
  },
  blocking: ['closet', 'shelf', 'map'],
  accepts: { wall: ['wall'], floor: ['floor', 'pet'], window: ['window'] },
  note: '地面擺放點也可放小精靈用品（spot=pet）。'
};
(function () {
  var g = [], x, y, a;
  for (y = 0; y < LAYOUT.rows; y++) { g.push([]); for (x = 0; x < LAYOUT.cols; x++) g[y].push(y >= LAYOUT.wallRows ? '.' : '#'); }
  LAYOUT.blocking.forEach(function (k) { a = LAYOUT.areas[k]; for (y = a.y; y < a.y + a.h; y++) for (x = a.x; x < a.x + a.w; x++) g[y][x] = '#'; });
  LAYOUT.walk = g.map(function (r) { return r.join(''); });
})();

function gen(write, ser, Raw) {
  var b = build();
  var zones = {
    furniture: { name: '家具鋪', desc: '房間家具與主題套裝。' },
    food: { name: '食材舖', desc: '小精靈的點心與普通食物。' },
    toys: { name: '玩具與用品', desc: '玩具與窩的升級。' },
    looks: { name: '造型屋', desc: '玩家造型與登入畫面主題。' },
    eggs: { name: '蛋鋪', desc: '孵蛋加速與已完成章節的普通蛋。' },
    exchange: { name: '收藏換物所', desc: '用情報碎屑換限定家具與稱號邊框。' },
    board: { name: '老闆任務板', desc: '每日 3 個小任務。' }
  };
  var foods = I.FOODS_DEF.map(function (f) { return { id: f.id, name: f.name, zone: '食材舖', cat: '食材', price: f.price, ref: 'WALK_FOODS' }; });
  foods.push({ id: 'food_plain', name: '清水糰子', zone: '食材舖', cat: '食材', price: 5, ref: 'WALK_FOODS' });
  var toys = I.TOYS_DEF.map(function (t) { return { id: t.id, name: t.name, zone: '玩具與用品', cat: '玩具', price: t.price, ref: 'WALK_TOYS' }; });
  var SKINS = [['sk_hat', '偵探帽', '🕵️'], ['sk_astro', '太空人', '🧑‍🚀'], ['sk_cat', '貓咪', '🐱'], ['sk_ghost', '小幽靈', '👻'], ['sk_robot', '機器人', '🤖'], ['sk_ninja', '忍者', '🥷'], ['sk_mage', '魔法師', '🧙'], ['sk_dragon', '小龍', '🐲']];
  var looks = SKINS.map(function (k) { return { id: 'look_' + k[0], name: k[1], zone: '造型屋', cat: '造型', price: 50, skin: k[0], emoji: k[2] }; });
  [['theme_dusk', '黃昏登入畫面', 60, ['#f08a4a', '#2a2a3a']], ['theme_sea', '海藍登入畫面', 60, ['#4b6fd6', '#dff3ff']], ['theme_brick', '紅磚登入畫面', 70, ['#c4553b', '#f4ecd8']]].forEach(function (t) {
    looks.push({ id: t[0], name: t[1], zone: '造型屋', cat: '造型', price: t[2], theme: true, colors: t[3] });
  });
  var shop = {
    version: 1,
    note: '價格依 SHOP_ROOM_LIFE_1029 第 3 節：家具 30～150 點、套裝 300～600 點、食材 5～20 點、玩具與用品 30～80 點、造型 50 點起。稀有與傳說（noBuy）只能用條件取得。頂層陣列（furniture、sets、foods、toys、looks、eggs）都是可購買商品。',
    zoneOrder: ['furniture', 'food', 'toys', 'looks', 'eggs', 'exchange', 'board'],
    zones: zones,
    limits: { furniturePerDay: 3, foodPerDay: 10, firstBuyHalf: true, supplyOfficerDiscountApplies: false, note: '補給官折扣只適用簡報室；商店只有新手第一次購買半價。' },
    furniture: b.furniture,
    sets: b.sets,
    foods: foods,
    toys: toys,
    looks: looks,
    eggs: [
      { id: 'egg_speedup', name: '孵蛋加速', zone: '蛋鋪', cat: '蛋', price: 20, desc: '讓一顆蛋縮短孵化時間。', key: 'hatchSpeedup', value: 0.5 },
      { id: 'egg_common', name: '普通蛋', zone: '蛋鋪', cat: '蛋', price: 100, rarity: '普通', needChapterDone: true, pool: S.SP.filter(function (d) { return d.rarity === '普通'; }).map(function (d) { return d.id; }), desc: '只賣已完成章節的普通蛋；稀有與傳說不能購買。' }
    ],
    nestUpgrade: { from: 'spirit_nest', to: 'plush_nest' },
    exchange: {
      rate: { snack: 3, furniture: 10 },
      note: '重複的情報卡自動變成碎屑：3 張同類碎屑換 1 份該類點心，10 張換 1 件限定家具。',
      furniture: ['whale_bone', 'kiln_model'],
      frames: [
        { id: 'frame_bamboo', name: '竹編邊框', shards: 5, color: '#d8c070' },
        { id: 'frame_brick', name: '紅磚邊框', shards: 8, color: '#c4553b' },
        { id: 'frame_neon', name: '霓虹邊框', shards: 12, color: '#ff5fc8' }
      ]
    },
    board: { perDay: 3, pool: BOARD },
    layout: LAYOUT
  };
  var s = '/* 走讀：商店目錄、家具（36 件）、五套主題套裝、老闆任務板、房間格局。\n' +
    '   純資料（ES5、掛 window.WALK_SHOP），由 test_tools/gen_walk_data.js 排版產生；規格見 BUILD_SPEC_ROOM_SPIRIT_1103.md、SHOP_ROOM_LIFE_1029.md。\n' +
    '   家具圖＝16×16 字串矩陣 rows（\'.\' 透明）＋調色盤 pal；食材與玩具另見 walk_data_spirit.js 的 WALK_FOODS、WALK_TOYS。 */\n' +
    '(function () {\n  \'use strict\';\n  window.WALK_SHOP = ' + ser(shop, '  ') + ';\n})();\n';
  write('js/walk_data_shop.js', s);
}
module.exports = { gen: gen, build: build, LAYOUT: LAYOUT };
