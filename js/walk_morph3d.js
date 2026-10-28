/* 登入畫面：等角視角的體素（方塊）3D 場景 ⇄ QR Code。靈感：Creapills「從樹到 QR Code」。
   平台地板本身就是 QR；場景（揮手邀請的小女孩、漂浮的小島與小物件、閃光）從平台上「長出來」，
   鏡頭從正上方（QR，可掃描）傾斜、旋轉成斜視，途中有景深模糊。點一下畫面＝運鏡切換。
   沒有 WebGL 時退回 js/walk_morph.js 的 2D 版。需要 three.js（r128，全域 THREE）。 */
(function () {
  'use strict';
  function supported() {
    try { var c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var ease = function (x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };   /* 三次方進出：起步與收尾乾脆 */
  var back = function (x) { x = clamp01(x); var c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };   /* 長出來時微微彈一下 */
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* 場景模型。單位：48 格寬的平台（會依實際 QR 格數縮放）；+z 朝向鏡頭。
     方柱 B(x0, z0, 寬, 深, 離地 y0, 高 h, 色, {bob, ph})；手臂／馬尾 A(...) 繞肩膀擺動。 */
  function build(night) {
    var P = night
      ? { dress: '#8e7cf0', dress2: '#6f5fd0', grass: '#6fb58f', dirt: '#8a6a52', dirt2: '#6e533f', sign: '#fff1b8', a1: '#ff9bb0', a2: '#ffd36b', a3: '#9bd1ff', glow: '#ffd36b' }
      : { dress: '#ff8fa3', dress2: '#ff6f91', grass: '#8fd18a', dirt: '#b9845a', dirt2: '#9a6a44', sign: '#fff3c4', a1: '#ff6f91', a2: '#ffd54a', a3: '#7ec8ff', glow: '#ff6f91' };
    var skin = '#ffd9b8', hair = '#4a3326', E = [];
    var B = function (x, z, w, d, y0, h, c, o) { E.push({ k: 'b', x: x, z: z, w: w, d: d, y0: y0, h: h, c: c, bob: (o && o.bob) || 0, ph: (o && o.ph) || 0, g: (o && o.g) || 'p' }); };
    var A = function (px, py, pz, off, len, th, c, side, base, amp, spd, ph) { E.push({ k: 'a', px: px, py: py, pz: pz, off: off, len: len, th: th, c: c, side: side, base: base, amp: amp, spd: spd, ph: ph || 0, g: 'girl' }); };
    var G = function (x, z, w, d, y0, h, c) { B(x, z, w, d, y0, h, c, { g: 'girl' }); };

    /* ── 小女孩（站在平台中央，揮手邀請） ── */
    G(-2.4, -1.2, 2.2, 2.8, 0, 1.0, '#c0392b'); G(0.2, -1.2, 2.2, 2.8, 0, 1.0, '#c0392b');         /* 鞋 */
    G(-2.2, -0.8, 1.8, 2.0, 1.0, 2.6, skin); G(0.4, -0.8, 1.8, 2.0, 1.0, 2.6, skin);              /* 腿 */
    G(-4.2, -2.6, 8.4, 5.2, 3.6, 2.4, P.dress); G(-3.5, -2.1, 7.0, 4.2, 6.0, 2.2, P.dress);          /* 裙子 */
    G(-3.6, -2.6, 7.2, 0.5, 3.6, 0.7, '#ffffff');                                                 /* 裙襬白邊 */
    G(-3.0, -1.7, 6.0, 3.4, 8.2, 2.8, P.dress2);                                                  /* 上衣 */
    G(-1.6, 1.6, 3.2, 0.5, 10.2, 0.8, '#ffffff');                                                 /* 白領 */
    G(-3.1, -3.0, 6.2, 6.0, 11.0, 5.6, skin);                                                     /* 頭 */
    G(-3.7, -3.6, 7.4, 2.6, 10.6, 6.4, hair); G(-3.7, -3.6, 7.4, 7.4, 16.2, 1.7, hair);              /* 後腦頭髮、頭頂 */
    G(-3.6, -2.2, 1.0, 5.0, 11.2, 5.0, hair); G(2.6, -2.2, 1.0, 5.0, 11.2, 5.0, hair);              /* 兩側 */
    G(-3.2, 2.2, 6.4, 0.9, 14.6, 2.2, hair); G(-1.4, 2.5, 1.2, 0.7, 13.7, 1.2, hair);               /* 瀏海 */
    G(-1.9, 2.9, 1.0, 0.45, 12.8, 1.4, '#2b2b44'); G(0.9, 2.9, 1.0, 0.45, 12.8, 1.4, '#2b2b44');       /* 眼睛 */
    G(-2.8, 2.9, 1.1, 0.4, 11.8, 0.8, '#ff9bb0'); G(1.7, 2.9, 1.1, 0.4, 11.8, 0.8, '#ff9bb0');         /* 腮紅 */
    G(-0.7, 2.9, 1.4, 0.4, 11.4, 0.5, '#c0392b');                                                 /* 微笑 */
    G(2.8, -0.2, 2.2, 2.2, 15.4, 2.0, P.a1); G(2.4, -0.6, 1.0, 1.0, 15.9, 1.0, '#ffffff');             /* 髮飾 */
    A(-3.4, 10.4, 0, 0, 1.8, 1.7, P.dress2, -1, 1.05, 0.32, 7.0);                                 /* 揮手：袖子 */
    A(-3.4, 10.4, 0, 1.8, 2.0, 1.5, skin, -1, 1.05, 0.32, 7.0);                                   /* 揮手：手 */
    A(-3.2, 15.2, -3.0, 0, 6.0, 1.7, hair, -1, 3.0, 0.16, 2.6, 1.2);                                /* 馬尾（左右晃） */
    G(3.1, -0.9, 1.7, 1.7, 6.0, 3.4, P.dress2); G(3.1, -0.9, 1.7, 1.7, 5.0, 1.2, skin);              /* 另一隻手自然下垂 */
    if (night) { G(3.0, 0.5, 2.4, 2.4, 2.4, 2.6, P.glow); G(3.3, 0.8, 1.8, 1.8, 5.0, 0.7, '#7a5a3a'); G(3.8, 1.3, 0.6, 0.6, 5.7, 1.4, '#7a5a3a'); }   /* 夜：手提小燈籠 */
    else { G(3.7, 0.4, 0.5, 0.5, 2.2, 3.6, '#5da35a'); G(3.0, -0.3, 1.9, 1.9, 5.7, 1.4, P.a1); G(3.4, 0.1, 1.1, 1.1, 6.1, 1.0, '#ffd54a'); }       /* 日：手拿小花 */

    /* 小女孩是主角：整體放大 1.45 倍（以平台中心為原點） */
    E.forEach(function (e) {
      if (e.g !== 'girl') return; var K = 1.45;
      if (e.k === 'b') { e.x *= K; e.z *= K; e.w *= K; e.d *= K; e.y0 *= K; e.h *= K; }
      else { e.px *= K; e.py *= K; e.pz *= K; e.off *= K; e.len *= K; e.th *= K; }
    });
    return { entries: E, P: P };
  }

  function mount(host, url, night, handlers) {
    var THREE = window.THREE, q;
    try { q = qrcode(0, 'M'); q.addData(url); q.make(); } catch (e) { return null; }
    var n = q.getModuleCount(), N = n + 4, S = 280, f = N / 48;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return null; }
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr); renderer.setSize(S, S, false); renderer.setClearColor(0x000000, 0);
    var cv = renderer.domElement; cv.id = 'morph'; cv.style.width = cv.style.height = S + 'px'; cv.setAttribute('aria-label', '揮手邀請的小女孩與漂浮小島，會變成進入遊戲的 QR Code');
    /* 背景不畫：透明，讓頁面底色透出來 */
    var light = night ? '#efe6d2' : '#fffaf0', dark = night ? '#2c2150' : '#4a2c6b';
    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, night ? 0.72 : 0.8));
    var dl = new THREE.DirectionalLight(0xffffff, night ? 0.55 : 0.6); dl.position.set(-30, 60, 40); scene.add(dl);
    var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 400);

    var slab = new THREE.Mesh(new THREE.BoxGeometry(N, 2.4, N), new THREE.MeshLambertMaterial({ color: night ? '#5a4b8a' : '#e6c9b4' }));
    slab.position.y = -1.4; scene.add(slab);
    var tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.4, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), N * N), mm = new THREE.Matrix4(), col = new THREE.Color(), k = 0, darkCells = [], origCols = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var isDark = (r >= 2 && c >= 2 && r < N - 2 && c < N - 2) ? q.isDark(r - 2, c - 2) : false;
      if (isDark) darkCells.push([r, c]);
      mm.makeTranslation(c - N / 2 + 0.5, -0.2, r - N / 2 + 0.5); tiles.setMatrixAt(k, mm); tiles.setColorAt(k, col.set(isDark ? dark : light)); origCols.push(col.clone()); k++;
    }
    tiles.instanceMatrix.needsUpdate = true; tiles.instanceColor.needsUpdate = true; scene.add(tiles);

    var M = build(night), info = M.entries.map(function (b) {
      var cx = b.k === 'b' ? b.x + b.w / 2 : b.px, cz = b.k === 'b' ? b.z + b.d / 2 : b.pz, top = b.k === 'b' ? b.y0 + b.h : b.py;
      b.delay = Math.min(1, Math.sqrt(cx * cx + cz * cz) / 30) * 0.45 + top / 45 * 0.3 + (b.g === 'girl' ? 0 : 0.12);
      return b;
    });
    var cols = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), info.length);
    info.forEach(function (b, i) { cols.setColorAt(i, new THREE.Color(b.c)); });
    scene.add(cols);
    /* 特效：小女孩每揮手兩下，從腳下發出一圈衝擊波；波經過的 QR 方塊會往上彈，其中一些方塊變成同色的小方塊噴向空中再落下。
       粒子的位置與顏色都取自地板上真正的 QR 深色格；全部用時間算出來（不存狀態），收回 QR 時一起歸零。 */
    var PERIOD = 1.5, SPD = 22, LIFE = 1.25, rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    /* 種在地上的草與花：站在 QR 的格子上，隨風輕晃；衝擊波一到，被彈上天、轉幾圈再落回原位重新長好 */
    var PL = 130, plants = [];
    for (var pi = 0; pi < PL * 6 && plants.length < PL; pi++) {
      var rr1 = 2 + Math.floor(rnd(pi * 5 + 1) * (N - 4)), cc1 = 2 + Math.floor(rnd(pi * 5 + 2) * (N - 4)), pxx = cc1 - N / 2 + 0.5, pzz = rr1 - N / 2 + 0.5;
      if (Math.sqrt(pxx * pxx + pzz * pzz) < 4.2 * f * 1.45) continue;   /* 小女孩腳邊留空 */
      var flower = rnd(pi * 5 + 3) < 0.62;
      plants.push({ x: pxx, z: pzz, dist: Math.sqrt(pxx * pxx + pzz * pzz), h: (flower ? 1.5 + rnd(pi * 5 + 4) * 1.6 : 1.1 + rnd(pi * 5 + 4) * 1.4), flower: flower, hs: flower ? 0.9 + rnd(pi * 7 + 1) * 0.5 : 0.45, ph: rnd(pi * 3 + 8) * 6.28, i: plants.length });
    }
    var stems = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), plants.length);
    var heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), plants.length);
    plants.forEach(function (p, i) {
      stems.setColorAt(i, new THREE.Color(rnd(i * 3 + 1) < 0.5 ? '#5da35a' : '#7bc76b'));
      heads.setColorAt(i, p.flower ? new THREE.Color().setHSL(rnd(i * 9 + 5), 0.9, night ? 0.68 : 0.62) : new THREE.Color(rnd(i * 9 + 5) < 0.5 ? '#a8e87a' : '#8fd18a'));
    });
    scene.add(stems); scene.add(heads);
    var tinted = new Uint8Array(N * N), tileFlat = true, ev = new THREE.Euler(), qv = new THREE.Quaternion();
    function fx(cur, t) {
      var s = ease((cur - 0.5) / 0.4), active = s > 0.01, i, j, d, A = 2.2 * f, hc = new THREE.Color();
      /* 1) 衝擊波：方塊依與她的距離彈起 */
      if (active || !tileFlat) {
        var k0 = Math.floor(t / PERIOD), ph = t - k0 * PERIOD, front = ph * SPD, tk = 0;
        for (var r = 0; r < N; r++) for (var c = 0; c < N; c++, tk++) {
          var dx = c - N / 2 + 0.5, dz = r - N / 2 + 0.5, dd = Math.sqrt(dx * dx + dz * dz), y = 0;
          if (active) { var back0 = front - dd; var inBand = back0 > -1 && back0 < 7; if (inBand) y = A * s * Math.sin(Math.min(1, Math.max(0, (back0 + 1) / 8)) * Math.PI) * Math.exp(-dd / 34);
            if (inBand) { var wgt = Math.min(1, y / (A * 0.5)); hc.setHSL(((dd * 0.03 + t * 0.35) % 1 + 1) % 1, 0.9, 0.62); tiles.setColorAt(tk, col.copy(origCols[tk]).lerp(hc, wgt * 0.45)); tinted[tk] = 1; }
            else if (tinted[tk]) { tiles.setColorAt(tk, origCols[tk]); tinted[tk] = 0; } }
          else if (tinted[tk]) { tiles.setColorAt(tk, origCols[tk]); tinted[tk] = 0; }
          mm.makeTranslation(dx, -0.2 + y, dz); tiles.setMatrixAt(tk, mm);
        }
        tiles.instanceMatrix.needsUpdate = true; tiles.instanceColor.needsUpdate = true; tileFlat = !active;
      }
      /* 2) 草與花：生長、隨風晃；被衝擊波掃到的（約六成）彈上天、翻轉、落回原位 */
      for (i = 0; i < plants.length; i++) {
        var pl = plants[i], gr = Math.max(TINY, back((cur - 0.42 - pl.dist * 0.006) / 0.4));
        if (cur <= 0.4 || gr < 0.01) { Sc.set(TINY, TINY, TINY); V.set(0, 0, 0); qv.identity(); mm.compose(V, qv, Sc); stems.setMatrixAt(i, mm); heads.setMatrixAt(i, mm); continue; }
        var tt = t - pl.dist / SPD, kq = Math.floor(tt / PERIOD), age = tt - kq * PERIOD, flew = rnd(kq * 31 + i * 3 + 1) < 0.6, fly = flew && age < LIFE, yL = 0, spin = 0, squash = 1;
        if (fly) { var vy0 = 20 * f * LIFE / 2 * (0.75 + rnd(kq * 17 + i) * 0.6); yL = Math.max(0, vy0 * age - 0.5 * 20 * f * age * age); spin = age * (4 + rnd(i + 3) * 5); }
        else if (flew && age < LIFE + 0.3) squash = 1 - 0.3 * Math.sin(Math.PI * (age - LIFE) / 0.3);   /* 落地時壓扁一下再彈回來，像重新種好 */
        var sw = Math.sin(t * 2 + pl.ph) * 0.12 * (fly ? 0 : 1), hh = pl.h * f * gr * squash;
        ev.set(sw * 0.8 + spin, spin * 0.6, sw + spin * 0.4); qv.setFromEuler(ev);
        V.set(pl.x, yL + hh / 2 + 0.1, pl.z); Sc.set(0.28 * f * 1.4, hh, 0.28 * f * 1.4); mm.compose(V, qv, Sc); stems.setMatrixAt(i, mm);
        var hsz = pl.hs * f * 1.3 * gr; V.set(pl.x + Math.sin(sw) * hh * 0.5, yL + hh + hsz * 0.35 + 0.1, pl.z); Sc.set(hsz, hsz * (pl.flower ? 1 : 1.6), hsz); mm.compose(V, qv, Sc); heads.setMatrixAt(i, mm);
      }
      stems.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    }

    var V = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(), AX = new THREE.Vector3(0, 0, 1), TINY = 1e-6;
    function place(cur, t) {
      for (var i = 0; i < info.length; i++) {
        var b = info[i], s = back((cur - 0.26 - b.delay * 0.45) / 0.5);
        if (cur <= 0 || s < 0.002) { Sc.set(TINY, TINY, TINY); V.set(0, 0, 0); Q.identity(); mm.compose(V, Q, Sc); cols.setMatrixAt(i, mm); continue; }
        var bob = b.bob ? Math.sin(t * 1.3 + b.ph) * b.bob * f * s : 0;
        if (b.k === 'b') {
          var tw = b.g === 'spk' ? (0.7 + 0.3 * Math.sin(t * 3 + b.ph)) : 1;
          var gh = b.g === 'girl' ? Math.sin(t * 2.2) * 0.12 * f * s * (b.y0 > 10 ? 1 : 0) : 0;
          Q.identity(); V.set((b.x + b.w / 2) * f, (b.y0 + b.h / 2) * f * s + bob + gh, (b.z + b.d / 2) * f); Sc.set(b.w * f * tw, b.h * f * s * tw, b.d * f * tw);
        } else {
          var a = b.base + Math.sin(t * b.spd + b.ph) * b.amp, dx = Math.sin(a) * b.side, dy = Math.cos(a), mid = b.off + b.len / 2;
          V.set((b.px + dx * mid) * f, (b.py + dy * mid) * f * s, b.pz * f); Q.setFromAxisAngle(AX, -Math.atan2(dx, dy)); Sc.set(b.th * f * s, b.len * f * s, b.th * f * s);
        }
        mm.compose(V, Q, Sc); cols.setMatrixAt(i, mm);
      }
      cols.instanceMatrix.needsUpdate = true;
    }
    function camera(cur, t) {
      var e = ease(cur), elev = lerp(89.9, 35, e), az = lerp(0, 30 + Math.sin(t * 0.45) * 8, e), half = lerp(N * 0.56, N * 0.74 + Math.sin(Math.PI * cur) * N * 0.04, e);
      var er = elev * Math.PI / 180, ar = az * Math.PI / 180, R = 160;
      cam.position.set(R * Math.cos(er) * Math.sin(ar), R * Math.sin(er), R * Math.cos(er) * Math.cos(ar));
      cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.updateProjectionMatrix();
      /* 鏡頭偏移：場景狀態把視線抬到小女孩身上；切換途中鏡頭再橫向掃過一段（偏移量在兩端歸零，所以 QR 正對、場景定位都是靜止時對齊） */
      var sweep = Math.sin(Math.PI * cur) * N * 0.09, rx = Math.cos(ar), rz = -Math.sin(ar), ty = lerp(0, 7 * f, e);
      cam.position.x += rx * sweep; cam.position.z += rz * sweep;
      cam.lookAt(rx * sweep, ty, rz * sweep);
    }

    var cur = 1, target = 1, mode = 'auto', holdT = 0, lastNow = performance.now(), tAcc = 0, DUR = 1.25;
    function frame(now) {
      var dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now; tAcc += dt;
      if (cv.offsetParent !== null) {
        if (mode === 'auto') {
          if (Math.abs(cur - target) < 0.001) { holdT += dt; if (holdT > (target === 1 ? 3.6 : 5)) { target = 1 - target; holdT = 0; } } else holdT = 0;
        }
        if (cur !== target) { var step = dt / DUR; cur = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step); }
        place(cur, tAcc); fx(cur, tAcc); camera(cur, tAcc);
        var moving = Math.abs(cur - target) > 0.001;
        cv.style.filter = moving ? 'blur(' + (Math.sin(Math.PI * cur) * 1.4).toFixed(2) + 'px)' : 'none';   /* 運鏡途中的景深模糊 */
        renderer.render(scene, cam);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    var api = {
      canvas: cv,
      toggle: function () { mode = 'manual'; target = target === 1 ? 0 : 1; return target === 0; },   /* true＝正在變成 QR */
      state: function () { return { cur: cur, target: target, mode: mode }; },
      seek: function (v) { mode = 'manual'; cur = target = v; }
    };
    host.appendChild(cv);
    cv.onclick = function () { var toQR = api.toggle(); if (handlers && handlers.onToggle) handlers.onToggle(toQR); };
    return api;
  }
  window.WalkMorph3D = { supported: supported, mount: mount };
})();
