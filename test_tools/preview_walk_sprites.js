/* 把走讀資料檔裡的像素圖拼成一張聯絡表 PNG，方便肉眼檢查。
   用法：node preview_walk_sprites.js <輸出.png> [spirit|furniture|all]
   只在 Node 執行，不進網站。 */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');
var root = path.resolve(__dirname, '..');
global.window = {};
['js/walk_data_spirit.js', 'js/walk_data_shop.js'].forEach(function (f) { try { (0, eval)(fs.readFileSync(path.join(root, f), 'utf8')); } catch (e) { console.error('略過 ' + f + '：' + e.message); } });

function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function crc32(buf) { var c, crc = -1; for (var n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 255; for (var k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ -1) >>> 0; }
function chunk(t, d) { var l = Buffer.alloc(4); l.writeUInt32BE(d.length); var td = Buffer.concat([Buffer.from(t, 'ascii'), d]); var c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); }
function writePng(file, w, h, rgb) {
  var raw = Buffer.alloc(h * (w * 3 + 1));
  for (var y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  var ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
var S = 5, CELL = 16 * S + 8;
function sheet(list, cols, file) {
  var rows = Math.ceil(list.length / cols), w = cols * CELL, h = rows * CELL, buf = Buffer.alloc(w * h * 3);
  for (var i = 0; i < w * h; i++) { var bg = (((i % w) >> 3) + (Math.floor(i / w) >> 3)) & 1 ? [214, 220, 226] : [226, 231, 236]; buf[i * 3] = bg[0]; buf[i * 3 + 1] = bg[1]; buf[i * 3 + 2] = bg[2]; }
  list.forEach(function (sp, idx) {
    if (!sp) return;
    var ox = (idx % cols) * CELL + 4, oy = Math.floor(idx / cols) * CELL + 4;
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var ch = sp.rows[y][x]; if (ch === '.') continue; var c = hex(sp.pal[ch]);
      for (var dy = 0; dy < S; dy++) for (var dx = 0; dx < S; dx++) { var p = ((oy + y * S + dy) * w + ox + x * S + dx) * 3; buf[p] = c[0]; buf[p + 1] = c[1]; buf[p + 2] = c[2]; }
    }
  });
  writePng(file, w, h, buf);
}
var out = process.argv[2] || 'sheet.png', mode = process.argv[3] || 'all';
if ((mode === 'spirit' || mode === 'all') && window.WALK_SPIRITS) {
  var list = [];
  window.WALK_SPIRITS.forEach(function (s) { list.push(s.stages.egg.sprite, s.stages.baby.sprite, s.stages.adult.sprite, s.stages.awake.sprite); });
  sheet(list, 8, out.replace(/\.png$/, '_spirit.png'));
}
if ((mode === 'furniture' || mode === 'all') && window.WALK_SHOP) {
  var f = window.WALK_SHOP.furniture.map(function (x) { return x.sprite; });
  sheet(f, 9, out.replace(/\.png$/, '_furniture.png'));
  var misc = [];
  (window.WALK_FOODS || []).forEach(function (x) { misc.push(x.sprite); });
  (window.WALK_TOYS || []).forEach(function (x) { misc.push(x.sprite); });
  if (misc.length) sheet(misc, 9, out.replace(/\.png$/, '_misc.png'));
}
console.log('done');
