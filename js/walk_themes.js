/* 角色主題：每個角色有自己的特效色、QR 配色、首頁（登入畫面）風格。
   登入畫面讀 localStorage 'walk_ava'（上次選的角色）→ 場景裡的主角換成該角色的體素版，QR 與特效換成該角色的色系。
   hue 是 QR／地板的基準色相（0–1）；QR 的深淺格一律用亮度定色，所以任何色相都能掃（深格約 0.22、淺格約 0.965）。 */
(function () {
  var T = {
    student_boy_red:    { name: '熱血', home: 'fire',   hue: 0.02, floorH: 0.07, qrD: '#6b1a10', qrL: '#fff3ea', slab: '#c98b6a', beam2: 0xff6a3d, ringB: 0xffc23d, burstH: [0.02, 0.10], geom: 'oct', P: { grass: '#d08a4a', a1: '#ff6a3d', a2: '#ffc23d', a3: '#ff3d3d', glow: '#ff6a3d' } },
    student_boy_blue:   { name: '海洋', home: 'ocean',  hue: 0.58, floorH: 0.54, qrD: '#10335e', qrL: '#eef6ff', slab: '#9cc3dc', beam2: 0x6ec3ff, ringB: 0x9bf0e6, burstH: [0.55, 0.50], geom: 'ico', P: { grass: '#5fb7c9', a1: '#4fa8ff', a2: '#9bf0e6', a3: '#7ec8ff', glow: '#4fa8ff' } },
    student_boy_green:  { name: '森林', home: 'forest', hue: 0.36, floorH: 0.30, qrD: '#1d4a2a', qrL: '#f3f8e8', slab: '#a9c18f', beam2: 0x8fd18a, ringB: 0xe7d56b, burstH: [0.30, 0.16], geom: 'box', P: { grass: '#7cc27a', a1: '#5da35a', a2: '#e7d56b', a3: '#a8e87a', glow: '#8fd18a' } },
    student_girl_pink:  { name: '櫻花', home: 'sakura', hue: 0.93, floorH: 0.96, qrD: '#6a1d44', qrL: '#fff1f6', slab: '#e8bfd0', beam2: 0xff9bd0, ringB: 0xffd0e6, burstH: [0.93, 0.97], geom: 'ico', P: { grass: '#f0a9c4', a1: '#ff7fb0', a2: '#ffd0e6', a3: '#ffb3d1', glow: '#ff7fb0' } },
    student_girl_purple: { name: '星夜', home: 'night', hue: 0.74, floorH: 0.70, qrD: '#2c1a5e', qrL: '#f1ecff', slab: '#8f7fc8', beam2: 0xb79bff, ringB: 0x9bd1ff, burstH: [0.74, 0.58], geom: 'tet', P: { grass: '#8d7fd0', a1: '#b79bff', a2: '#9bd1ff', a3: '#ffd36b', glow: '#b79bff' } },
    student_girl_yellow: { name: '陽光', home: 'sun',   hue: 0.12, floorH: 0.14, qrD: '#6b4a00', qrL: '#fffbe0', slab: '#e6cf8a', beam2: 0xffd54a, ringB: 0xff9f43, burstH: [0.12, 0.08], geom: 'oct', P: { grass: '#e8c85a', a1: '#ffb300', a2: '#ff9f43', a3: '#fff07a', glow: '#ffb300' } }
  };
  /* 把角色精靈第一格（10×14）解成色塊清單，給 3D 場景做體素；失敗時回 null，場景退回原本的小女孩 */
  function vox(id, cb) {
    var src = (window.WALK_SPRITES || {})[id]; if (!src) { cb(null); return; }
    var im = new Image();
    im.onload = function () {
      try {
        var w = 10, h = im.height || 14, c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h, 0, 0, w, h);
        var d = x.getImageData(0, 0, w, h).data, px = [];
        for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) { var k = (j * w + i) * 4; if (d[k + 3] > 128) px.push({ i: i, j: j, c: '#' + [d[k], d[k + 1], d[k + 2]].map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('') }); }
        cb(px.length ? { w: w, h: h, px: px } : null);
      } catch (e) { cb(null); }
    };
    im.onerror = function () { cb(null); };
    im.src = src;
  }
  window.WalkThemes = { all: T, get: function (id) { return T[id] || null; }, vox: vox };
})();
