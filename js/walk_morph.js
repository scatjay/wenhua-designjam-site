/* 登入畫面：像素場景 ⇄ QR Code 互相變形（靈感：Creapills 的「從樹到 QR Code」短片，樹換成校園場景）。
   場景用程式畫在 48×48 小畫布，再取樣成 QR 的格數；每一格從場景色漸變成黑／白，QR 停留時就是標準 QR，可掃描。 */
(function () {
  'use strict';
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function drawScene(night) {
    var c = document.createElement('canvas'); c.width = c.height = 48; var g = c.getContext('2d');
    var R = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
    var i;
    if (night) {
      for (i = 0; i < 38; i++) { var a = hex('#1d1740'), b = hex('#5a4896'), m = mix(a, b, i / 37); R(0, i, 48, 1, 'rgb(' + m.map(Math.round).join(',') + ')'); }
      [[4, 3], [11, 7], [19, 4], [27, 8], [31, 2], [44, 14], [23, 12], [6, 20], [41, 4]].forEach(function (p) { R(p[0], p[1], 1, 1, '#fff6c8'); });
      g.fillStyle = '#fff1a8'; g.beginPath(); g.arc(38.5, 9.5, 5, 0, 7); g.fill();
      var sk = mix(hex('#1d1740'), hex('#5a4896'), 8.5 / 37); g.fillStyle = 'rgb(' + sk.map(Math.round).join(',') + ')'; g.beginPath(); g.arc(40.5, 8.5, 4, 0, 7); g.fill();
      R(0, 38, 48, 10, '#2f5d3a'); R(18, 38, 12, 10, '#d3bf93');
      /* 姑婆廟：紅牆、橘瓦、翹角屋脊、紅燈籠 */
      R(12, 28, 24, 10, '#b8322a'); R(14, 30, 2, 8, '#7a1f1a'); R(32, 30, 2, 8, '#7a1f1a');
      R(21, 31, 6, 7, '#2b1410'); R(21, 29, 6, 2, '#f1c40f');
      R(8, 26, 32, 2, '#e08a2d'); R(10, 24, 28, 2, '#ec9f3a'); R(14, 22, 20, 2, '#e08a2d'); R(20, 20, 8, 2, '#ec9f3a');
      R(7, 25, 2, 1, '#f1c40f'); R(39, 25, 2, 1, '#f1c40f');
      R(10, 28, 1, 2, '#e8d9a0'); R(9, 30, 3, 3, '#ef4b43'); R(37, 28, 1, 2, '#e8d9a0'); R(36, 30, 3, 3, '#ef4b43');
      /* 涼亭 */
      R(38, 31, 9, 1, '#e08a2d'); R(40, 30, 5, 1, '#ec9f3a'); R(39, 32, 1, 6, '#7a5a3a'); R(45, 32, 1, 6, '#7a5a3a');
      /* 畢不了學姊（小幽靈） */
      R(5, 10, 6, 1, '#fff'); R(4, 11, 8, 7, '#fff'); R(4, 18, 2, 1, '#fff'); R(7, 18, 2, 1, '#fff'); R(10, 18, 2, 1, '#fff');
      R(6, 13, 1, 2, '#2b2b44'); R(9, 13, 1, 2, '#2b2b44'); R(5, 15, 1, 1, '#ffb3c1'); R(10, 15, 1, 1, '#ffb3c1'); R(7, 16, 2, 1, '#2b2b44');
    } else {
      for (i = 0; i < 38; i++) { var a2 = hex('#8fd0ff'), b2 = hex('#eaf7ff'), m2 = mix(a2, b2, i / 37); R(0, i, 48, 1, 'rgb(' + m2.map(Math.round).join(',') + ')'); }
      g.fillStyle = '#ffd54a'; g.beginPath(); g.arc(39, 9, 5, 0, 7); g.fill();
      R(5, 7, 9, 3, '#fff'); R(7, 5, 5, 2, '#fff'); R(20, 12, 8, 2, '#fff'); R(22, 10, 4, 2, '#fff');
      R(0, 38, 48, 10, '#7ec27a'); R(19, 38, 10, 10, '#e6d7ae');
      /* 修齊大樓與吳三連銅像 */
      R(9, 17, 30, 21, '#8fa3bf'); R(9, 15, 30, 2, '#5b6f8d');
      for (var y = 19; y < 34; y += 5) for (var x = 11; x < 37; x += 5) R(x, y, 3, 3, '#ffe9a6');
      R(21, 31, 6, 7, '#4a5d7a'); R(23, 33, 2, 5, '#ffe9a6');
      R(41, 34, 5, 4, '#9aa0a6'); R(42, 28, 3, 6, '#b87333'); R(42, 25, 3, 3, '#b87333');
      R(2, 33, 5, 5, '#ff7aa2'); R(3, 31, 3, 2, '#ff7aa2');
    }
    return c;
  }

  function mount(canvas, url, night) {
    if (!canvas || !window.qrcode) return;
    var q; try { q = qrcode(0, 'M'); q.addData(url); q.make(); } catch (e) { return; }
    var n = q.getModuleCount(), N = n + 4, S = 240, dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = Math.max(1, Math.floor(S * dpr / N)); canvas.width = canvas.height = cw * N;
    canvas.style.width = canvas.style.height = (cw * N / dpr) + 'px'; canvas.style.imageRendering = 'pixelated';
    var g = canvas.getContext('2d');
    var sc = document.createElement('canvas'); sc.width = sc.height = N; var sg = sc.getContext('2d');
    sg.imageSmoothingEnabled = false; sg.drawImage(drawScene(night), 0, 0, N, N);
    var px = sg.getImageData(0, 0, N, N).data, cells = [];
    for (var r = 0; r < N; r++) for (var cc = 0; cc < N; cc++) {
      var k = (r * N + cc) * 4, dark = (r >= 2 && cc >= 2 && r < N - 2 && cc < N - 2) ? q.isDark(r - 2, cc - 2) : false;
      var dx = (cc - N / 2) / (N / 2), dy = (r - N / 2) / (N / 2);
      cells.push({ r: r, c: cc, s: [px[k], px[k + 1], px[k + 2]], q: dark ? [17, 17, 17] : [255, 255, 255], d: 0.4 * rnd(r * N + cc) + 0.2 * Math.min(1, Math.sqrt(dx * dx + dy * dy)) });
    }
    var T_SCENE = 3.2, T_MORPH = 2.4, T_QR = 6.5, CYCLE = T_SCENE + T_MORPH + T_QR + T_MORPH, hold = false, t0 = performance.now();
    var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
    function frame(mixAt) {   /* mixAt(cell) -> 0..1，0 是場景、1 是 QR */
      g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < cells.length; i++) {
        var ce = cells[i], p = ease(mixAt(ce)), col = mix(ce.s, ce.q, p), pop = Math.sin(p * Math.PI) * 0.25 * cw;
        g.fillStyle = 'rgb(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ')';
        g.fillRect(ce.c * cw - pop / 2, ce.r * cw - pop / 2, cw + pop, cw + pop);
      }
    }
    function mixFor(t) {
      if (hold) return function () { return 1; };
      t = t % CYCLE;
      if (t < T_SCENE) return function () { return 0; };
      if (t < T_SCENE + T_MORPH) { var tau = (t - T_SCENE) / T_MORPH; return function (ce) { return (tau - ce.d) / 0.4; }; }
      if (t < T_SCENE + T_MORPH + T_QR) return function () { return 1; };
      var tau2 = (t - T_SCENE - T_MORPH - T_QR) / T_MORPH; return function (ce) { return 1 - (tau2 - (0.6 - ce.d)) / 0.4; };
    }
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) hold = true;
    function loop(now) {
      if (canvas.offsetParent !== null) frame(mixFor((now - t0) / 1000));
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    window.__morphSeek = function (sec, h) { hold = !!h; t0 = performance.now() - sec * 1000; };
    canvas.onclick = function () {
      hold = !hold; t0 = performance.now() - (hold ? 0 : (T_SCENE + T_MORPH) * 1000);
      var hnt = document.getElementById('morph-hint'); if (hnt) hnt.textContent = hold ? '已定住 QR，再點一下繼續播放' : '點一下定住 QR 方便掃描';
    };
  }
  window.WalkMorph = { mount: mount };
})();
