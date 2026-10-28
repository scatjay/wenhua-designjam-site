/* 11/14 走讀 app（學生端）。
   登入：Google（Firebase Auth）；?test=1 時走測試模式（不登入、資料寫 walk1114test）。
   資料：whgm/analysis/walk1114/*（編號/uid 為鍵，不存 email 與姓名）。
   隱私：系／班只在分隊當下使用，隊伍只留「標籤」（建隊者的系），個人不存；位置只給同隊與老師，結束後清除。 */
(function () {
  'use strict';
  var R0 = window.WALK_ROUTE, R = R0, S = R0.stops, REH = false;
  var CAMP = null;
  /* 試玩關卡依信封編號自動選：遊戲設計學 101-130（夜間部、W 棟）走 campusW，其他走 E 棟校園導覽；?route=w 可強制（測試用） */
  function pickCamp() { var w = new URLSearchParams(location.search).get('route') === 'w' || (envNo >= 101 && envNo <= 130); return (w && R0.campusW) ? R0.campusW : R0.campus; }
  function selectRoute(reh) {
    REH = !!reh; CAMP = pickCamp();
    R = REH ? Object.assign({}, R0, { stops: CAMP.stops, fragmentNames: CAMP.fragmentNames, finalTask: CAMP.finalTask }) : R0;
    S = R.stops; curStop = S[0].id;
  }
  function PR_(id) { return (REH ? 'progr/' : 'prog/') + id; }
  function totalFrags() { return S.filter(function (x) { return x.frag !== undefined; }).length; }
  var errBuf = [];
  window.addEventListener('error', function (e) { errBuf.push(String(e.message || e).slice(0, 160)); if (errBuf.length > 12) errBuf.shift(); });
  window.addEventListener('unhandledrejection', function (e) { errBuf.push('promise: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 160)); if (errBuf.length > 12) errBuf.shift(); });
  var qs = new URLSearchParams(location.search);
  var TEST = qs.get('test') === '1';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ROLES = ['隊長', '領航員', '軍師', '偵查員'];
  var ROLE_ICON = { '隊長': '👑', '領航員': '🧭', '軍師': '📜', '偵查員': '🔍' };
  var ROLE_DESC = { '隊長': '📣 「號召全隊」到某一站集合；機動：隨時可以無限次換角色（補位用）', '領航員': '🧭 看得到離每一站的距離與方向', '軍師': '📜 每一站的第一則提示免費、自動出現（不扣分）', '偵查員': '🔍 走近一站，就會看到那裡的「隱藏關卡」，找到了全隊 +15 分' };
  var AVAS = Object.keys(window.WALK_SPRITES || {});
  var SPR = window.WALK_SPRITES || {}, SPRL = window.WALK_SPRITE_LABELS || {};
  /* 像素角色：精靈圖 8 格（前×2、右×2、左×2、背×2，每格 10×14）；walking 時前面兩格交替 */
  function avaHtml(id, scale, walking, name) {
    scale = scale || 3;
    if (!SPR[id]) return '<span class="emo" style="font-size:' + (scale * 7) + 'px">' + esc(id || '🙂') + '</span>';
    var w = 10 * scale, h = 14 * scale;
    return '<span class="spr' + (walking ? ' walk' : '') + '" style="width:' + w + 'px;height:' + h + 'px;background-image:url(' + SPR[id] + ');background-size:' + (80 * scale) + 'px ' + h + 'px;--w:' + w + 'px" title="' + esc(name || SPRL[id] || '') + '"></span>';
  }
  /* 風格包：只改自己看到的地圖與色調；auto＝晚上 18:00–06:00 自動換夜景 */
  var STYLES = [
    { id: 'pixel', name: '像素街景', desc: '預設：清楚的街道＋像素角色' },
    { id: 'toy', name: '軟膠公仔', desc: '暖色柔霧、角色加圓潤陰影（參考：台灣街景微縮公仔質感）' },
    { id: 'ink', name: '墨線古地圖', desc: '米黃褪色、像一張舊地圖' },
    { id: 'night', name: '夜景', desc: '深色地圖，適合傍晚（18:00 後可選自動）' }
  ];
  var styleSel = 'pixel';
  try { styleSel = localStorage.getItem('walk_style') || 'pixel'; } catch (e) {}
  function effectiveStyle() {
    if (styleSel === 'auto') { var h = new Date(nowMs() + 8 * 3600 * 1000).getUTCHours(); return (h >= 18 || h < 6) ? 'night' : 'pixel'; }
    return styleSel;
  }
  /* 向量底圖（OpenFreeMap，免金鑰）＋依風格重新上色；沒有 WebGL 時退回一般圖磚加 CSS 濾鏡 */
  var PAL = {
    pixel: { land: '#f1ead6', water: '#78bde3', park: '#b6d98f', bld: '#d99a72', bldLine: '#9b6445', road: '#ffffff', casing: '#c9b890', rail: '#8a8a8a', text: '#3a3326', halo: '#fff8e6' },
    toy:   { land: '#fff0de', water: '#9edbe0', park: '#c9ebb3', bld: '#ffbfa3', bldLine: '#ee9d82', road: '#ffffff', casing: '#ffd9b8', rail: '#c9a9a6', text: '#7a4a3a', halo: '#fff6ec' },
    ink:   { land: '#ecdfbd', water: '#c7cdb9', park: '#d5cf9f', bld: '#bba878', bldLine: '#7d6a45', road: '#fbf3dc', casing: '#8b7650', rail: '#6d5c3c', text: '#4b3a22', halo: '#f5ebcf' },
    night: { land: '#1a2530', water: '#0e3a57', park: '#1d3a33', bld: '#34475c', bldLine: '#4f6a86', road: '#4e6a86', casing: '#0f1820', rail: '#7a8ca0', text: '#b9d3ea', halo: '#0f1820' }
  };
  var vecLayer = null, mlMap = null, rasterMode = false, curPR = null, DPR = Math.min(2, Math.max(1, window.devicePixelRatio || 1)), PR = { pixel: DPR, toy: DPR, ink: DPR, night: DPR };  /* 文字要清楚：全部用裝置原生解析度，像素感靠配色與圖示，不靠降低解析度 */
  function paintVec(e) {
    if (!mlMap || !mlMap.getStyle) return; var P = PAL[e] || PAL.pixel, st = mlMap.getStyle(); if (!st) return;
    st.layers.forEach(function (l) {
      var id = l.id, set = function (k, v) { try { mlMap.setPaintProperty(id, k, v); } catch (x) {} };
      if (l.type === 'background') set('background-color', P.land);
      else if (l.type === 'raster') { try { mlMap.setLayoutProperty(id, 'visibility', 'none'); } catch (x) {} }
      else if (l.type === 'fill' && id === 'water') set('fill-color', P.water);
      else if (l.type === 'fill' && id === 'building') { set('fill-color', P.bld); set('fill-outline-color', P.bldLine); set('fill-opacity', 1); }
      else if (l.type === 'fill-extrusion') { set('fill-extrusion-color', P.bld); }
      else if (l.type === 'fill' && (/^landcover_(wood|grass|wetland)/.test(id) || id === 'park' || id === 'landuse_pitch' || id === 'landuse_track')) set('fill-color', P.park);
      else if (l.type === 'fill' && /^landuse_(residential|hospital|school|cemetery)/.test(id)) set('fill-color', P.land);
      else if (l.type === 'fill' && id === 'road_area_pattern') { }
      else if (l.type === 'line' && /^waterway/.test(id)) set('line-color', P.water);
      else if (l.type === 'line' && /rail/.test(id)) set('line-color', P.rail);
      else if (l.type === 'line' && /casing/.test(id)) set('line-color', P.casing);
      else if (l.type === 'line' && /^(road|bridge|tunnel)_/.test(id)) set('line-color', P.road);
      else if (l.type === 'line' && id === 'park_outline') set('line-color', P.park);
      else if (l.type === 'symbol') {
        set('text-color', P.text); set('text-halo-color', P.halo); set('text-halo-width', 2.4);
        try {
          var tf = mlMap.getLayoutProperty(id, 'text-field');
          if (tf && JSON.stringify(tf).indexOf('name') >= 0) mlMap.setLayoutProperty(id, 'text-field', ['coalesce', ['get', 'name:zh-Hant'], ['get', 'name:zh'], ['get', 'name']]);   /* 只留中文，不要中英文疊兩行 */
        } catch (x) { }
        if (/^(poi_|highway-name|label_other|label_village|label_town|water_name)/.test(id)) {
          try { mlMap.setLayoutProperty(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 14, 12, 17, 15, 19, 18]); mlMap.setLayoutProperty(id, 'text-font', ['Noto Sans Bold']); } catch (x) { }
        }
      }
    });
  }
  function applyStyle() {
    var e = effectiveStyle(), b = document.body;
    STYLES.forEach(function (x) { b.classList.remove('st-' + x.id); }); b.classList.add('st-' + e); b.classList.toggle('raster', rasterMode);
    if (vecLayer && (PR[e] || 0.9) !== curPR) buildVec(e); else paintVec(e);
    if (map && window.refreshStopIcons) refreshStopIcons();
  }
  function buildVec(e) {
    var pr = PR[e] || 0.9;
    if (vecLayer) { try { map.removeLayer(vecLayer); } catch (x) {} vecLayer = null; mlMap = null; }
    vecLayer = L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/liberty', pixelRatio: pr, attribution: '© OpenStreetMap · OpenFreeMap · OpenMapTiles' }).addTo(map);
    vecLayer.getContainer && vecLayer.getContainer();
    mlMap = vecLayer.getMaplibreMap(); curPR = pr;
    mlMap.on('load', function () { paintVec(effectiveStyle()); });
    mlMap.on('styledata', function () { if (mlMap.isStyleLoaded()) paintVec(effectiveStyle()); });
    mlMap.on('error', function () { });
  }
  function initBasemap() {
    var ok = false;
    try { var cv = document.createElement('canvas'); ok = !!(window.maplibregl && L.maplibreGL && (cv.getContext('webgl') || cv.getContext('experimental-webgl'))); } catch (x) { ok = false; }
    if (ok) { try { buildVec(effectiveStyle()); return; } catch (x) { ok = false; } }
    rasterMode = true;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    applyStyle();
  }
  var DEPTS = ['多樂', '資工', '資管', '半導體', '電機', '電子', '化材', '機械', '企管', '工管', '流音', '應日', '資傳', '視傳', '永續', '其他'];

  /* ---- 信封編號登記：編號要和「已綁定的編號＋Google 帳號」對得上才能進（不收姓名學號） ---- */
  var TEACHERS = ['scatjay@gmail.com', 'yib@stust.edu.tw'];
  var BIND = 'whgm/analysis/w3game';   /* 其他學習單頁共用的綁定資料（envIndex／identity） */
  var envNo = null, isTeacher = false;
  function validEnv(v) { return v === parseInt(v, 10) && ((v >= 1 && v <= 60) || (v >= 101 && v <= 130) || v === 99 || v === 0); }
  var db, auth, ROOT, uid = null, profile = null, team = null, teamId = null, prog = {}, teamPos = {}, posTimer = null;
  var map, meMarker, mateMarkers = {}, stopMarkers = {}, myPos = null, showMates = true, watchId = null, simTimer = null;
  var view = 'map', curStop = null, listeners = [], lastScoreWritten = null;

  /* ---------- 工具 ---------- */
  function nowMs() {
    var f = qs.get('now'); if (!f) return Date.now();
    var m = /^(\d{1,2}):(\d{2})$/.exec(f); if (!m) return Date.now();
    var d = new Date(R.date + 'T00:00:00+08:00'); return d.getTime() + (+m[1] * 3600 + +m[2] * 60) * 1000;
  }
  function dist(a, b) {
    var R0 = 6371000, tr = Math.PI / 180, dLat = (b.lat - a.lat) * tr, dLon = (b.lon - a.lon) * tr;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * tr) * Math.cos(b.lat * tr) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R0 * Math.asin(Math.sqrt(x));
  }
  function confetti() {
    var em = ['⭐', '✨', '🎉', '💖', '🧩', '🌸']; for (var i = 0; i < 14; i++) { var e = document.createElement('span'); e.className = 'cf'; e.textContent = em[i % em.length];
      e.style.left = (30 + Math.random() * 40) + 'vw'; e.style.top = (40 + Math.random() * 15) + 'vh'; e.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); e.style.setProperty('--dy', (-60 - Math.random() * 140) + 'px'); e.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(e); (function (x) { setTimeout(function () { x.remove(); }, 1200); })(e); }
  }
  function toast(m) { if (/^(✔|🧩|🎉)/.test(m)) confetti(); var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 3200); }
  function stopById(id) { for (var i = 0; i < S.length; i++) if (S[i].id === id) return S[i]; return null; }
  function mkcode() { var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function on(ref, ev, fn) { ref.on(ev, fn); listeners.push([ref, ev, fn]); }
  function offAll() { listeners.forEach(function (l) { l[0].off(l[1], l[2]); }); listeners = []; }
  function log(kind, stop, text) { if (!uid) return; ROOT.child('log/' + uid).push({ t: nowMs(), team: teamId || '', stop: stop || '', kind: kind, text: String(text || '').slice(0, 300) }); }

  /* ---------- 啟動與登入 ---------- */
  function boot() {
    firebase.initializeApp({ apiKey: 'AIzaSyBwPR0oE5VK0eBlqq8JY1B56UXy3R9cyng', authDomain: 'gen-lang-client-0929530380.firebaseapp.com', databaseURL: 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', projectId: 'gen-lang-client-0929530380' });
    db = firebase.database(); auth = firebase.auth();
    ROOT = db.ref(TEST ? 'whgm/analysis/walk1114test' : 'stwalk1114');   /* 正式資料在專用區塊 stwalk1114（要登入且登記過信封編號）；測試模式用開放的測試節點 */
    try { buildOnboarding(); } catch (e) { errBuf.push('buildOnboarding ' + e.message); }
    try { applyStyle(); } catch (e) { errBuf.push('applyStyle ' + e.message); }
    try { buildQR(); } catch (e) { errBuf.push('buildQR ' + e.message); }   /* 動畫出錯也不能擋住登入鈕 */
    $('btn-google').onclick = googleLogin;
    if (inAppBrowser()) $('login-msg').innerHTML = '⚠️ 你現在是在 LINE／臉書／Instagram 這類 App 裡面開的，Google 不允許在這裡登入。請點右上角「⋯」→「用瀏覽器開啟」，改用 Chrome 或 Safari。';
    if (TEST) { $('btn-test').hidden = false; $('btn-test').onclick = function () { startUser(qs.get('uid') || ('dev-' + Math.random().toString(36).slice(2, 8))); }; if (qs.get('uid')) startUser(qs.get('uid')); }
    auth.getRedirectResult().catch(loginErr);
    auth.onAuthStateChanged(function (u) { if (u && !uid) startUser(u.uid); });
  }
  function buildQR() {
    var box = $('qr-box'); if (!box || !window.qrcode) return;
    var url = location.origin + location.pathname;
    var night = effectiveStyle() === 'night', ok3d = false, wrap = $('morph-wrap');
    if (window.WalkMorph3D && WalkMorph3D.supported()) {   /* 有 WebGL：等角體素 3D 場景，運鏡變成 QR；沒有就退回 2D 像素版 */
      try {
        var api = WalkMorph3D.mount(wrap, url, night, { onToggle: function (toQR) { $('morph-hint').textContent = toQR ? '朋友掃這個就能加入・再點一下回場景' : '點一下運鏡成 QR，朋友掃了就能加入'; } });
        if (api) { var old = $('morph'); if (old && old !== api.canvas) old.remove(); wrap.insertBefore(api.canvas, $('morph-hint')); window.__morph3d = api; ok3d = true; }
      } catch (e) { ok3d = false; }
    }
    if (!ok3d && window.WalkMorph) WalkMorph.mount($('morph'), url, night);
  }
  function loginErr(e) { $('login-msg').textContent = '登入沒完成（' + ((e && e.code) || (e && e.message) || 'unknown') + '）。可以換瀏覽器（Chrome／Safari）或重試一次；還是不行請按下面的回報。'; }
  function inAppBrowser() { return /Line\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|; wv\)|GSA\//i.test(navigator.userAgent); }
  function googleLogin() {
    if (inAppBrowser()) { $('login-msg').innerHTML = '⚠️ 這個 App 內建的瀏覽器不能用 Google 登入。請點右上角「⋯」→「用瀏覽器開啟」，改用 Chrome 或 Safari 再試。'; return; }
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    /* 一律先彈出視窗：手機 Chrome 的「轉頁登入」會把登入結果丟掉（登入完回來 currentUser 是空的，10-28 實機用 adb 查到），彈窗則正常；被擋掉才退回轉頁 */
    $('login-msg').textContent = '開啟 Google 登入視窗…（沒跳出來的話，請允許彈出視窗）';
    auth.signInWithPopup(p).catch(function (e) {
      var c = (e && e.code) || '';
      if (c === 'auth/popup-blocked') { $('login-msg').textContent = '視窗被擋掉了，改用轉頁登入…'; auth.signInWithRedirect(p).catch(loginErr); return; }
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') { $('login-msg').textContent = '登入視窗被關掉了，請再按一次。'; return; }
      loginErr(e);
    });
  }
  function startUser(u) {
    uid = u; $('screen-login').hidden = true;
    var cu = auth.currentUser, em = ((cu && cu.email) || '').toLowerCase();
    isTeacher = !TEST && qs.get('asstudent') !== '1' && !!cu && cu.emailVerified !== false && TEACHERS.indexOf(em) >= 0;   /* ?asstudent=1：老師帳號預覽學生流程（會出現輸入信封編號的畫面） */
    if (TEST && qs.get('env')) envNo = parseInt(qs.get('env'), 10);
    if (TEST || isTeacher) { afterVerified(); return; }
    ROOT.child('claim/' + uid).once('value').then(function (s) {
      if (s.exists() && qs.get('asstudent') !== '1') { envNo = parseInt(s.val(), 10); afterVerified(); } else showEnv();   /* 預覽模式：就算已有綁定也顯示輸入畫面 */
    }).catch(function (e) { $('screen-login').hidden = false; $('login-msg').textContent = '資料庫連線被拒絕（' + (e.code || e.message) + '）。請確認用 Google 帳號登入後再試。'; });
  }
  function afterVerified() {
    $('screen-vf').hidden = true;
    ROOT.child('players/' + uid).once('value').then(function (s) {
      profile = s.val();
      if (profile && profile.team) {
        return ROOT.child('teams/' + profile.team).once('value').then(function (t) {
          if (t.val() && t.val().members && t.val().members[uid]) { enterGame(profile.team); } else { showOnboarding(); }
        });
      }
      showOnboarding();
    }).catch(function (e) { toast('讀取失敗：' + e.message); });
  }
  function showEnv() {
    $('screen-vf').hidden = false;
    db.ref(BIND + '/identity/' + uid + '/env').once('value').then(function (s) { if (s.exists() && !$('vf-env').value) $('vf-env').value = s.val(); }).catch(function () {});
    $('vf-go').onclick = envGo;
  }
  function envGo() {
    var v = parseInt($('vf-env').value, 10), cu = auth.currentUser, em = ((cu && cu.email) || '');
    if (!validEnv(v)) { $('vf-msg').textContent = '請輸入信封上的編號（數字）。'; return; }
    $('vf-go').disabled = true; $('vf-msg').textContent = '核對中…';
    var bad = function (m) { $('vf-go').disabled = false; $('vf-msg').textContent = m; };
    Promise.all([db.ref(BIND + '/identity/' + uid).once('value'), db.ref(BIND + '/envIndex/' + v).once('value')]).then(function (r) {
      var idn = r[0].val(), ei = r[1].val();
      if (idn && idn.env != null && +idn.env !== v) return bad('你的 Google 帳號已經綁定編號 #' + idn.env + '，和你輸入的不一樣。請確認信封上的號碼；還是不行請按下面的「回報」。');
      if (ei && ei.uid && ei.uid !== uid) return bad('編號 #' + v + ' 已經綁定另一個 Google 帳號。請確認信封號碼和登入的帳號；還是不行請按下面的「回報」。');
      var rec = { env: v, unit: 'walk', uid: uid, email: em || null, name: (cu && cu.displayName) || null, ts: firebase.database.ServerValue.TIMESTAMP };
      var jobs = [];
      if (!ei || !ei.uid) { jobs.push(db.ref(BIND + '/envIndex/' + v).update(rec)); jobs.push(db.ref(BIND + '/identity/' + uid).update(rec)); }
      return Promise.all(jobs).then(function () { return ROOT.child('claim/' + uid).set(String(v)); }).then(function () { return ROOT.child('players/' + uid + '/env').set(v); }).then(function () { envNo = v; log('claim', '', String(v)); afterVerified(); });
    }).catch(function () { bad('編號和帳號對不起來，進不去。請確認信封號碼；還是不行請按下面的「回報」。'); });
  }

  /* ---------- 加入畫面（暱稱、系／班、同意） ---------- */
  function buildOnboarding() {
    var d = $('ob-dept'); d.innerHTML = '<option value="">請選擇</option>' + DEPTS.map(function (x) { return '<option>' + x + '</option>'; }).join('');
    var g = $('ob-ava'); g.innerHTML = AVAS.map(function (a, i) { return '<button type="button" class="ava' + (i === 0 ? ' on' : '') + '" data-a="' + a + '">' + avaHtml(a, 3, false) + '</button>'; }).join('');
    g.onclick = function (e) { var b = e.target.closest('.ava'); if (!b) return; [].forEach.call(g.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
    $('ob-go').onclick = onboardGo;
    var j = qs.get('join'); if (j) $('ob-code').value = j.toUpperCase();
  }
  function showOnboarding() { $('screen-ob').hidden = false; }
  function onboardGo() {
    var nick = $('ob-nick').value.trim(), dept = $('ob-dept').value, cls = $('ob-cls').value;
    var onb = $('ob-ava').querySelector('.on'), ava = onb ? onb.dataset.a : AVAS[0];
    if (!nick) { $('ob-msg').textContent = '請取一個暱稱（不是真實姓名）。'; return; }
    if (!$('ob-ok').checked) { $('ob-msg').textContent = '請先勾選同意。'; return; }
    var code = $('ob-code').value.trim().toUpperCase();
    if (!code && !dept) { $('ob-msg').textContent = '請選你的系（只用來分隊）。'; return; }
    profile = { nick: nick.slice(0, 12), ava: ava, ts: nowMs() };
    if (envNo != null) profile.env = envNo;
    $('ob-go').disabled = true; $('ob-msg').textContent = '分隊中…';
    ROOT.child('players/' + uid).update(profile).then(function () {
      return code ? joinByCode(code) : autoAssign(dept, cls);
    }).then(function (id) { $('screen-ob').hidden = true; enterGame(id); })
      .catch(function (e) { $('ob-go').disabled = false; $('ob-msg').textContent = e.message || '分隊失敗，請再按一次。'; });
  }

  /* ---------- 組隊：自動分隊、開房、加房 ---------- */
  function pickRole(m) { var used = {}; Object.keys(m || {}).forEach(function (k) { used[m[k].role] = 1; }); for (var i = 0; i < ROLES.length; i++) if (!used[ROLES[i]]) return ROLES[i]; return ROLES[Object.keys(m || {}).length % ROLES.length]; }
  function memberRec(m) { return { nick: profile.nick, ava: profile.ava, role: pickRole(m), ts: nowMs() }; }
  function tryJoin(id) {
    return ROOT.child('teams/' + id).once('value').then(function () {
      return ROOT.child('teams/' + id).transaction(function (t) {
        if (t === null) return t;
        if (t.closed) return;
        var m = t.members || {};
        if (m[uid]) return t;
        var n = Object.keys(m).length; if (n >= 4) return;
        m[uid] = memberRec(m); t.members = m; t.n = n + 1; if (n + 1 >= 4) t.closed = true;
        return t;
      });
    }).then(function (r) { if (!r.committed || !r.snapshot.val() || !r.snapshot.val().members || !r.snapshot.val().members[uid]) throw new Error('這個隊已經滿了或關門了。'); return id; });
  }
  function createTeam(kind, dept, cls) {
    var id = ROOT.child('teams').push().key, code = kind === 'room' ? mkcode() : '';
    var tag = dept ? (dept + (cls ? cls : '')) : '';
    var rec = { kind: kind, name: kind === 'room' ? '臨時房' : (tag || '新') + '隊', dept: dept || '', cls: cls || '', owner: uid, code: code, open: true, closed: false, n: 1, ts: nowMs(), members: {} };
    rec.members[uid] = { nick: profile.nick, ava: profile.ava, role: ROLES[0], ts: nowMs() };
    var p = Promise.resolve();
    if (code) p = ROOT.child('codes/' + code).transaction(function (c) { return c === null ? id : undefined; }).then(function (r) { if (!r.committed) return createTeam(kind, dept, cls).then(function (x) { throw { retry: x }; }); });
    return p.then(function () { return ROOT.child('teams/' + id).set(rec); }).then(function () { return id; })
      .catch(function (e) { if (e && e.retry) return e.retry; throw e; });
  }
  function autoAssign(dept, cls) {
    return leaveTeam().then(function () { return ROOT.child('teams').once('value'); }).then(function (s) {
      var all = s.val() || {}, best = null, bs = -1;
      Object.keys(all).forEach(function (id) {
        var t = all[id]; if (t.closed || t.open === false) return;
        var n = Object.keys(t.members || {}).length; if (n >= 4) return;
        var sc = 0; if (cls && t.cls && t.dept === dept && t.cls === cls) sc += 3; if (dept && t.dept === dept) sc += 2; if (n < 3) sc += 1;
        if (sc >= 2 && sc > bs) { bs = sc; best = id; }
      });
      if (best) return tryJoin(best).catch(function () { return createTeam('auto', dept, cls); });
      return createTeam('auto', dept, cls);
    });
  }
  function joinByCode(code) {
    return ROOT.child('codes/' + code).once('value').then(function (s) {
      var id = s.val(); if (!id) throw new Error('找不到房碼 ' + code + '。');
      return leaveTeam().then(function () { return tryJoin(id); });
    });
  }
  function leaveTeam() {
    var old = (profile && profile.team) || teamId; if (!old) return Promise.resolve();
    return ROOT.child('teams/' + old).transaction(function (t) {
      if (t === null) return t; var m = t.members || {}; if (!m[uid]) return t;
      delete m[uid]; var n = Object.keys(m).length; if (n === 0) return null;
      t.members = m; t.n = n; if (n < 4) t.closed = false; if (t.owner === uid) t.owner = Object.keys(m)[0]; return t;
    }).then(function () { ROOT.child('pos/' + old + '/' + uid).remove(); });
  }

  /* ---------- 進入遊戲 ---------- */
  function enterGame(id) {
    ROOT.child('cfg/phase').once('value').then(function (sn) { cfgPhase = sn.val(); selectRoute(phase() === 'rehearsal'); enterGame2(id); }).catch(function (e) { console.log('ENTER_ERR', e && e.stack); });
  }
  function enterGame2(id) {
    teamId = id; offAll();
    ROOT.child('players/' + uid).update({ team: id }); if (profile) profile.team = id;
    $('app').hidden = false; $('screen-ob').hidden = true; $('screen-login').hidden = true;
    initMap(); wireTabs(); startLocation(); startChat(); if (phase() === 'rehearsal') pmark('g0');
    on(ROOT.child('teams/' + id), 'value', function (s) {
      team = s.val();
      if (!team || !team.members || !team.members[uid]) { toast('你已不在這個隊了。'); $('app').hidden = true; showOnboarding(); return; }
      render();
    });
    on(ROOT.child('players/' + uid + '/team'), 'value', function (sn) { var nt = sn.val(); if (nt && nt !== teamId) { toast('你的隊伍被整併了，已切到新隊。'); enterGame(nt); } });
    on(ROOT.child(PR_(id)), 'value', function (s) { prog = s.val() || {}; render(); checkTasks(); });
    on(ROOT.child('pos/' + id), 'value', function (s) { teamPos = s.val() || {}; renderMates(); checkTasks(); });
    on(ROOT.child('cfg/phase'), 'value', function (sn) { cfgPhase = sn.val(); if ((phase() === 'rehearsal') !== REH) { console.log('RELOAD', phase(), REH, cfgPhase, R.liveStart); location.reload(); return; } render(); renderBanner(); });
    on(ROOT.child('rehearsal/' + uid), 'value', function (sn) { rehearsal = sn.val() || {}; render(); });
    on(ROOT.child(REH ? 'boardr' : 'board'), 'value', function (s) { board = s.val() || {}; if (view === 'rank') render(); });
    schedLoop();
  }
  var mapFolded = false; try { mapFolded = localStorage.getItem('walk_fold') === '1'; } catch (e) {}
  var board = {}, cfgPhase = null, rehearsal = {};
  function phase() { if (cfgPhase === 'live' || cfgPhase === 'rehearsal') return cfgPhase; return nowMs() < Date.parse(R.liveStart) ? 'rehearsal' : 'live'; }
  function pdone(id) { return !!rehearsal[id]; }
  function pmark(id) { if (pdone(id)) return; ROOT.child('rehearsal/' + uid + '/' + id).set(nowMs()); }

  /* ---------- 地圖與定位 ---------- */
  function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView([S[0].lat, S[0].lon], 16);
    initBasemap(); addBldgLabels();
    if (REH) { var bb = L.latLngBounds(S.map(function (x) { return [x.lat, x.lon]; })); map.fitBounds(bb, { padding: [50, 50], maxZoom: 18 }); }
    S.forEach(function (s, i) {
      stopMarkers[s.id] = L.marker([s.lat, s.lon], { icon: stopIcon(s, i, false) }).addTo(map).on('click', function () { curStop = s.id; setView('task'); });
      L.circle([s.lat, s.lon], { radius: s.r, color: '#b8402a', weight: 1, fillOpacity: 0.05 }).addTo(map);
      if (s.zones) Object.keys(s.zones).forEach(function (k) { var z = s.zones[k]; L.circle([z.lat, z.lon], { radius: z.r, color: '#1f6f68', weight: 1, dashArray: '4', fillOpacity: 0.08 }).addTo(map).bindTooltip(z.name); });
    });
  }
  var ICONS = window.WALK_ICONS || {};
  function stopIcon(s, i, done) {
    var k = s.final ? 'star' : (s.id === 's0' ? 'sign' : (s.frag !== undefined ? (done ? 'star' : 'chest') : 'house')), it = ICONS[k], sc = 3;
    var img = it ? '<img src="' + it.src + '" style="width:' + (it.w * sc) + 'px;height:' + (it.h * sc) + 'px;image-rendering:pixelated">' : '';
    return L.divIcon({ className: '', html: '<div class="sicon' + (done ? ' done' : '') + '">' + img + '<b>' + i + '</b></div>', iconSize: [44, 48], iconAnchor: [22, 38] });
  }
  window.refreshStopIcons = function () {
    if (!map) return; S.forEach(function (s, i) { var m = stopMarkers[s.id]; if (m) m.setIcon(stopIcon(s, i, !!(prog[s.id] && prog[s.id].frag))); });
  };
  /* 主要建築名稱：用清楚的 HTML 文字疊在底圖上（座標取自 OSM，概略） */
  var BLDG = [['修齊大樓（E 棟）', 23.02364, 120.22407, 1], ['人文藝術中心', 23.02315, 120.22437, 0], ['管理與資訊館', 23.02428, 120.22322, 1], ['資訊傳播館', 23.02356, 120.22555, 0], ['電機一館', 23.02516, 120.22314, 0], ['化工暨生物科技館', 23.02278, 120.2252, 0], ['優活館', 23.02279, 120.22446, 1], ['三連堂（體育館）', 23.02433, 120.22543, 1], ['校史館', 23.02325, 120.22418, 1], ['西淮館', 23.02403, 120.22346, 1], ['汽車工程館', 23.02541, 120.22466, 0], ['光電工程館', 23.02571, 120.22421, 0], ['能源工程館', 23.02553, 120.2251, 0], ['磅礡館（W 棟）', 23.02504, 120.22656, 1], ['姑婆廟', 23.02556, 120.22707, 1], ['校門牌樓', 23.0254, 120.22641, 0]];
  var bldgLayer = null;
  function addBldgLabels() {
    if (bldgLayer) return; bldgLayer = L.layerGroup();
    var all = [], main = [];
    BLDG.forEach(function (b) { if (S.some(function (st) { return st.lat && Math.abs(st.lat - b[1]) < 0.0003 && Math.abs(st.lon - b[2]) < 0.0003; })) return; var m = L.marker([b[1], b[2]], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'bname', html: '<span>' + esc(b[0]) + '</span>', iconSize: [0, 0] }) }); all.push(m); if (b[3]) main.push(m); });
    var upd = function () { var z = map.getZoom(), want = z >= 18 ? all : (z >= 17 ? main : []); all.forEach(function (m) { var on = want.indexOf(m) >= 0; if (on && !map.hasLayer(m)) m.addTo(map); if (!on && map.hasLayer(m)) map.removeLayer(m); }); };
    map.on('zoomend', upd); upd();
  }
  function startLocation() {
    var sim = qs.get('sim');
    if (sim) { var p = sim.split(',').map(Number); gotPos({ coords: { latitude: p[0], longitude: p[1], accuracy: 5 } }); window.__walkSim = function (lat, lon) { gotPos({ coords: { latitude: lat, longitude: lon, accuracy: 5 } }); }; return; }
    if (!navigator.geolocation) { $('gps').textContent = '這個瀏覽器不支援定位。'; return; }
    var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), INAPP = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent);
    var geoStart = function () {
      if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} }
      watchId = navigator.geolocation.watchPosition(gotPos, function (e) {
        var g = $('gps');
        if (e.code === 1) g.innerHTML = '定位被擋住了。' + (INAPP ? '你在 LINE／臉書等App裡面開的，請按右上角「用瀏覽器開啟」改用 Safari／Chrome。' : IOS ? 'iPhone：到「設定 → 隱私權與安全性 → 定位服務」確認開啟，並把「Safari 網站」設成「使用 App 期間」；再回來按重新定位。' : '請在網址列左邊的鎖頭允許「位置」。') + ' <button class="btn2" id="geo-retry">重新定位</button>';
        else if (e.code === 3) { g.innerHTML = '定位逾時，正在重試…（iPhone 請到空曠處、關掉「低耗電模式」）'; setTimeout(geoStart, 4000); }
        else { g.innerHTML = '暫時抓不到位置，正在重試…若一直失敗，可以用任務頁的「我不在現場，先聊聊」先往下玩。'; setTimeout(geoStart, 6000); }
        var rb = $('geo-retry'); if (rb) rb.onclick = function () { g.textContent = '定位中…'; geoStart(); };
      }, { enableHighAccuracy: !IOS, maximumAge: IOS ? 15000 : 5000, timeout: IOS ? 40000 : 20000 });
    };
    geoStart();
    if (!posTimer) posTimer = setInterval(uploadPos, 25000);
  }
  window.__walkSim2 = function () { };
  var lastMe = null, lastMoveT = 0, mateLast = {};
  function gotPos(p) {
    myPos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 0, t: nowMs() };
    $('gps').textContent = '定位精度約 ' + Math.round(myPos.acc) + ' 公尺';
    var moved = lastMe && dist(lastMe, myPos) > 3; lastMe = { lat: myPos.lat, lon: myPos.lon }; if (moved) lastMoveT = nowMs();
    var mic = L.divIcon({ className: '', html: '<div class="mate me">' + avaHtml(profile && profile.ava, 3, nowMs() - lastMoveT < 12000) + '<b>' + esc((profile && profile.nick) || '我') + '</b></div>', iconSize: [48, 56], iconAnchor: [24, 44] });
    if (!meMarker) { meMarker = L.marker([myPos.lat, myPos.lon], { icon: mic, zIndexOffset: 800 }).addTo(map); if (!REH) map.setView([myPos.lat, myPos.lon], 17); }
    else meMarker.setLatLng([myPos.lat, myPos.lon]).setIcon(mic);
    if (phase() === 'rehearsal') pmark('g1');
    if (!uploadPos._last || nowMs() - uploadPos._last > 15000) uploadPos();
    checkTasks();
  }
  function uploadPos() {
    if (!myPos || !teamId || !uid) return; uploadPos._last = nowMs();
    ROOT.child('pos/' + teamId + '/' + uid).set({ lat: +myPos.lat.toFixed(5), lon: +myPos.lon.toFixed(5), acc: Math.round(myPos.acc), t: myPos.t, nick: profile.nick, ava: profile.ava });
  }
  function talkTo(nick) {
    setView('team');
    setTimeout(function () { var i = $('tc-in'); if (i) { i.value = '@' + nick + ' '; i.focus(); try { i.scrollIntoView({ block: 'center' }); } catch (e) {} } }, 250);
  }
  function renderMates() {
    if (phase() === 'rehearsal') { var n = 0; Object.keys(teamPos).forEach(function (k) { if (fresh(teamPos[k])) n++; }); if (n >= 2) pmark('g2'); }
    Object.keys(mateMarkers).forEach(function (k) { if (!teamPos[k] || !showMates) { map.removeLayer(mateMarkers[k]); delete mateMarkers[k]; } });
    if (!showMates) return;
    Object.keys(teamPos).forEach(function (k) {
      if (k === uid) return; var p = teamPos[k];
      var ml = mateLast[k], mv = ml && (Math.abs(ml.lat - p.lat) > 0.00003 || Math.abs(ml.lon - p.lon) > 0.00003); mateLast[k] = { lat: p.lat, lon: p.lon, mv: mv ? nowMs() : (ml ? ml.mv : 0) };
      var html = '<div class="mate mt">' + avaHtml(p.ava, 3, nowMs() - (mateLast[k].mv || 0) < 40000) + '<b>👥 ' + esc(p.nick || '') + '</b></div>';
      var ic = L.divIcon({ className: '', html: html, iconSize: [48, 56], iconAnchor: [24, 44] });
      if (mateMarkers[k]) mateMarkers[k].setLatLng([p.lat, p.lon]).setIcon(ic); else mateMarkers[k] = L.marker([p.lat, p.lon], { icon: ic, zIndexOffset: 600 }).addTo(map).on('click', function () { talkTo(p.nick || ''); });
    });
  }

  /* ---------- 時程（自動模式：依時鐘提示現在該在哪） ---------- */
  function stopStartMs(s) { var m = /(\d{1,2}):(\d{2})/.exec(s.time || ''); if (!m) return Infinity; var d = new Date(R.date + 'T00:00:00+08:00'); return d.getTime() + (+m[1] * 3600 + +m[2] * 60) * 1000; }
  function schedNow() {
    var t = nowMs(), cur = null;
    for (var i = 0; i < S.length; i++) if (stopStartMs(S[i]) <= t) cur = S[i];
    return cur;
  }
  function schedLoop() { renderBanner(); setInterval(renderBanner, 20000); }
  function renderBanner() {
    var b = $('banner');
    if (phase() === 'rehearsal') { b.innerHTML = '🎒 <b>練習日</b>：先在教室登入、分好隊、試試看地圖與任務。11/14 當天直接登入，會回到同一隊。'; return; }
    var c = schedNow();
    if (!c) { var first = S[0]; b.innerHTML = '走讀 ' + esc(first.time) + ' 在 <b>' + esc(first.name) + '</b> 集合。'; return; }
    var end = stopStartMs(c) + c.min * 60000, left = Math.round((end - nowMs()) / 60000);
    b.innerHTML = '現在：<b>' + esc(c.name) + '</b>' + (left > 0 ? '（約剩 ' + left + ' 分鐘）' : '（時間到，跟著承樸走）');
    if (!curStop) curStop = c.id;
  }

  /* ---------- 任務判定 ---------- */
  function taskDone(stopId, tid) { return !!(prog[stopId] && prog[stopId].tasks && prog[stopId].tasks[tid]); }
  function markTask(stopId, tid, extra) {
    if (taskDone(stopId, tid)) return;
    var rec = { by: uid, t: nowMs() }; if (extra) for (var k in extra) rec[k] = extra[k];
    ROOT.child(PR_(teamId) + '/' + stopId + '/tasks/' + tid).transaction(function (c) { return c === null ? rec : undefined; }).then(function (r) { if (r.committed) { log('task', stopId, tid + (extra && extra.soft ? ' (soft)' : '')); toast('✔ 完成：' + (taskTitle(stopId, tid) || tid)); } });
  }
  function taskTitle(sid, tid) { var s = stopById(sid); if (!s || !s.tasks) return ''; for (var i = 0; i < s.tasks.length; i++) if (s.tasks[i].id === tid) return s.tasks[i].title; return ''; }
  function zoneOf(s, key) { return s.zones && s.zones[key]; }
  function fresh(p) { return p && nowMs() - p.t < 90000; }
  function checkTasks() {
    if (!teamId || !uid || !team) return;
    S.forEach(function (s) {
      // 到點打卡
      if (myPos && dist(myPos, s) <= s.r && !(prog[s.id] && prog[s.id].arrived)) {
        ROOT.child(PR_(teamId) + '/' + s.id + '/arrived').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) toast('📍 到達：' + s.name); });
      }
      (s.tasks || []).forEach(function (t) {
        if (taskDone(s.id, t.id)) return;
        if (t.type === 'zone' && myPos) { var z = zoneOf(s, t.zone); if (z && dist(myPos, z) <= z.r + Math.min(myPos.acc || 0, 20)) markTask(s.id, t.id); }
        if (t.type === 'together') {
          var n = 0; Object.keys(teamPos).forEach(function (k) { var p = teamPos[k]; if (fresh(p) && dist(p, s) <= s.r) n++; });
          if (n >= (t.min || 2)) markTask(s.id, t.id);
        }
        if (t.type === 'cross') {
          var a = zoneOf(s, t.zones[0]), b = zoneOf(s, t.zones[1]), pa = null, pb = null;
          Object.keys(teamPos).forEach(function (k) { var p = teamPos[k]; if (!fresh(p)) return; if (dist(p, a) <= a.r && !pa) pa = { p: p, k: k }; else if (dist(p, b) <= b.r && !pb) pb = { p: p, k: k }; });
          if (pa && pb && pa.k !== pb.k && Math.abs(pa.p.t - pb.p.t) <= 60000) markTask(s.id, t.id);
        }
      });
      checkFrag(s);
    });
    var allFrag = S.every(function (s) { return s.frag === undefined || (prog[s.id] && prog[s.id].frag); });
    if (allFrag && !finalOpen) { finalOpen = true; toast('🧩 四塊碎片到手了！回終點拼成一句話。'); }
    writeScore();
  }
  var finalOpen = false;
  function checkFrag(s) {
    if (s.frag === undefined || (prog[s.id] && prog[s.id].frag)) return;
    var need = (s.tasks || []).filter(function (t) { return !t.bonus && t.type !== 'together' && t.type !== 'cross'; });
    if (need.every(function (t) { return taskDone(s.id, t.id); })) {
      ROOT.child(PR_(teamId) + '/' + s.id + '/frag').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) { toast('🧩 取得碎片：' + R.fragmentNames[s.frag]); log('frag', s.id, R.fragmentNames[s.frag]); } });
    }
  }
  function scoreOf() {
    var sc = 0, P = R.score;
    S.forEach(function (s) {
      var p = prog[s.id] || {}; if (p.arrived) sc += P.arrive;
      (s.tasks || []).forEach(function (t) { if (p.tasks && p.tasks[t.id]) sc += t.bonus ? P.bonus : P.task; });
      if (p.frag) sc += P.frag; if (p.secret) sc += 15; sc += P.hint * (p.hints || 0);
    });
    if (prog.final && prog.final.done) sc += P.final;
    return Math.max(0, sc);
  }
  function fragCount() { var n = 0; S.forEach(function (s) { if (s.frag !== undefined && prog[s.id] && prog[s.id].frag) n++; }); return n; }
  function writeScore() {
    if (!team) return; var sc = scoreOf(), key = sc + '|' + fragCount() + '|' + team.n;
    if (key === lastScoreWritten) return; lastScoreWritten = key;
    ROOT.child((REH ? 'boardr/' : 'board/') + teamId).set({ name: teamLabel(), score: sc, frags: fragCount(), n: Object.keys(team.members || {}).length, t: nowMs() });
  }
  /* 隊名：不用系名，依隊伍代號固定產生和故事有關的名字（每個人看到的一樣） */
  var NM_A = ['夜班', '月光', '提燈', '蓋章', '守夜', '迷路', '飄飄', '八億', '審查', '鐘樓', '牌樓', '涼亭'], NM_B = ['小隊', '偵探團', '巡守隊', '探險隊', '審查組', '幽靈團', '蓋章組', '守衛隊'];
  function storyName(id) { var h = 0, i; id = String(id || ''); for (i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return NM_A[h % NM_A.length] + NM_B[Math.floor(h / 13) % NM_B.length]; }
  function teamLabel() { return (team.kind === 'room' ? '房 ' + team.code : storyName(teamId)) || '隊'; }

  /* ---------- 介面渲染 ---------- */
  function wireTabs() {
    if (wireTabs.done) return; wireTabs.done = true;
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.onclick = function () { setView(b.dataset.v); }; });
    $('btn-mates').onclick = function () { showMates = !showMates; $('btn-mates').classList.toggle('off', !showMates); renderMates(); };
    $('btn-fold').onclick = function () { mapFolded = !mapFolded; try { localStorage.setItem('walk_fold', mapFolded ? '1' : '0'); } catch (e) {} setView(view); };
    $('btn-locate').onclick = function () { if (myPos) map.setView([myPos.lat, myPos.lon], 18); };
  }
  function setView(v) {
    view = v; if (phase() === 'rehearsal' && v === 'task') setTimeout(function () { pmark('g4'); }, 4000); if (phase() === 'rehearsal' && v === 'team') pmark('g3'); [].forEach.call(document.querySelectorAll('.pane'), function (p) { p.hidden = (p.id !== 'pane-' + v) && p.id !== 'pane-map'; });
    var pm = $('pane-map'); pm.classList.toggle('mini', v !== 'map'); pm.classList.toggle('folded', v !== 'map' && mapFolded); $('btn-fold').textContent = mapFolded ? '展開 ▾' : '收合 ▴';
    if (map) setTimeout(function () { map.invalidateSize(); }, 80);
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('on', b.dataset.v === v); });
    render();
  }
  function render() {
    if (!team) return; if (window.refreshStopIcons) refreshStopIcons();
    $('hd-team').textContent = teamLabel() + '・' + Object.keys(team.members).length + ' 人';
    $('hd-score').textContent = scoreOf() + ' 分・碎片 ' + fragCount() + '/' + totalFrags();
    if (view === 'task') renderTask(); if (view === 'team') renderTeam(); if (view === 'rank') renderRank();
  }
  function myRole() { return (team && team.members[uid] && team.members[uid].role) || ROLES[0]; }
  function renderTask() {
    var s = stopById(curStop || S[0].id) || S[0], p = prog[s.id] || {}, h = '';
    var WR = CAMP === R0.campusW;
    if (REH && !tutorialOk()) {
      $('pane-task').innerHTML = practiceHtml() + '<div class="card">🔒 校園任務要先完成上面的教學關，完成後才會解鎖。</div>';
      [].forEach.call(document.querySelectorAll('[data-pack]'), function (b) { b.onclick = function () { pmark(b.dataset.pack); }; });
      return;
    }
    if (REH) h = (allDone() ? certHtml() : '') + practiceHtml() + '<h2>校園試玩：' + esc(CAMP.name) + '</h2><div class="sub">' + (WR ? '從 W 棟出發，到門口繞一圈，約 10–15 分鐘；鬼故事都是工坊編的，姑婆廟是真的廟，請小聲、尊重。' : '從 E 棟出發繞一圈，約 10–15 分鐘；校史小知識都來自學校通識電子報。') + '</div>';
    h += '<div class="chips">' + S.map(function (x, i) { var st = (prog[x.id] && prog[x.id].frag) ? 'ok' : (prog[x.id] && prog[x.id].arrived ? 'half' : ''); return '<button class="chip ' + st + (x.id === s.id ? ' cur' : '') + '" data-s="' + x.id + '">' + i + '</button>'; }).join('') + '</div>';
    h += '<h2>' + esc(s.name) + '</h2><div class="sub">' + (REH ? '' : esc(s.time) + ' 起・') + '約 ' + s.min + ' 分' + (s.frag !== undefined ? '・碎片「' + esc(R.fragmentNames[s.frag]) + '」' + (p.frag ? ' ✔' : '') : '') + '</div>';
    if (s.tip) { h += '<div class="card">' + esc(s.tip || '') + '</div>'; if (s.id === 's0' || s.id === 'c0') h += '<div class="card">你的角色：<b>' + ROLE_ICON[myRole()] + myRole() + '</b><br><span class="sub">' + esc(ROLE_DESC[myRole()]) + '</span></div>'; }
    if (s.final) h += finalHtml();
    if (s.npc) h += npcHtml(s, p);
    if (s.tasks) {
      h += '<h3>任務</h3>';
      s.tasks.forEach(function (t) { h += taskHtml(s, t); });
    }
    h += photoCardHtml();
    if (s.note) h += '<details class="card"><summary>給老師看的備註</summary><div class="sub">' + esc(s.note) + '</div></details>';
    $('pane-task').innerHTML = h;
    [].forEach.call(document.querySelectorAll('.chip'), function (b) { b.onclick = function () { curStop = b.dataset.s; renderTask(); }; });
    [].forEach.call(document.querySelectorAll('[data-pack]'), function (b) { b.onclick = function () { pmark(b.dataset.pack); }; });
    [].forEach.call(document.querySelectorAll('[data-arr]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/' + b.dataset.arr + '/arrived').transaction(function (c) { return c === null ? { by: uid, t: nowMs(), manual: 1 } : undefined; }); }; });
    [].forEach.call(document.querySelectorAll('[data-secret]'), function (b) { b.onclick = function () { var sid = b.dataset.secret; ROOT.child(PR_(teamId) + '/' + sid + '/secret').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) { toast('🎉 隱藏關卡解開！全隊 +15 分'); log('secret', sid, 'found'); } }); }; });
    [].forEach.call(document.querySelectorAll('[data-ask]'), function (b) { b.onclick = function () { var st = stopById(b.dataset.s); log('npc', b.dataset.s, b.dataset.ask); toast(b.dataset.ask === 'who' ? st.npc.name + '：' + st.npc.voice : st.npc.open.join(' ')); }; });
    [].forEach.call(document.querySelectorAll('[data-call]'), function (b) { b.onclick = function () { var st = stopById(b.dataset.call); chatSend('tchat/' + teamId, { uid: uid, n: (profile && profile.nick) || '隊長', x: ('📣 隊長號召：大家到「' + st.name + '」集合！').slice(0, 100), call: 1, t: nowMs() }); }; });
    [].forEach.call(document.querySelectorAll('[data-hint]'), function (b) { b.onclick = function () { useHint(b.dataset.hint); }; });
    [].forEach.call(document.querySelectorAll('[data-ans]'), function (b) { b.onclick = function () { answer(b.dataset.s, b.dataset.t, b.dataset.ans); }; });
    [].forEach.call(document.querySelectorAll('[data-text]'), function (b) { b.onclick = function () { submitText(b.dataset.s, b.dataset.t); }; });
    [].forEach.call(document.querySelectorAll('[data-ack]'), function (b) { b.onclick = function () { markTask(b.dataset.s, b.dataset.ack); }; });
    [].forEach.call(document.querySelectorAll('[data-mv]'), function (b) { b.onclick = function () { moveCard(b.dataset.s, +b.dataset.i, +b.dataset.mv); }; });
    [].forEach.call(document.querySelectorAll('[data-ord]'), function (b) { b.onclick = function () { checkOrder(b.dataset.s, b.dataset.t); }; });
    var fb = document.getElementById('final-go'); if (fb) fb.onclick = submitFinal;
    var pf = $('ph-file'); if (pf) { pf.onchange = function () { if (pf.files && pf.files[0]) sendPhoto(pf.files[0]); pf.value = ''; }; $('ph-wall').onclick = openWall; }
  }
  /* ---------- 照片：拍照 → 縮成原圖(老師看)＋縮圖(照片牆) → 一次寫入 ---------- */
  var photoN = 0;
  function photoCardHtml() {
    return '<div class="card"><b>📷 拍一張</b><div class="sub">拍這一站看到的東西，會放上照片牆。請不要拍到別人的臉。</div><input class="inp" id="ph-cap" maxlength="40" placeholder="一句話說明（可不寫）"><label class="btn2" style="display:inline-block">拍照／選照片<input id="ph-file" type="file" accept="image/*" capture="environment" hidden></label><button class="btn2" id="ph-wall">🖼 看照片牆</button><div class="sub" id="ph-msg"></div></div>';
  }
  function shrink(file, max, q, limit) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error('讀不到這張照片')); };
      im.onload = function () {
        URL.revokeObjectURL(url);
        var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var d = c.toDataURL('image/jpeg', q);
        while (d.length > limit && q > 0.2) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
        d.length > limit ? no(new Error('照片太大，換一張試試')) : ok(d);
      };
      im.src = url;
    });
  }
  function sendPhoto(file) {
    var msg = $('ph-msg'); if (!teamId || !uid) { msg.textContent = '還沒加入隊伍。'; return; }
    if (photoN >= 12) { msg.textContent = '這次先拍到這裡，夠多了！'; return; }
    msg.textContent = '處理照片中…';
    Promise.all([shrink(file, 720, 0.6, 130000), shrink(file, 200, 0.6, 22000)]).then(function (r) {
      var id = ROOT.child('photos').push().key, cap = ($('ph-cap').value || '').trim().slice(0, 40), t = nowMs(), ups = {};
      var base = { uid: uid, tid: teamId, stop: curStop || '', t: t, cap: cap, route: REH ? 'campus' : 'live' };
      ups['photos/' + id] = Object.assign({ d: r[0] }, base);
      ups['pth/' + id] = Object.assign({ th: r[1], nick: (profile && profile.nick) || '' }, base);
      return ROOT.update(ups).then(function () { photoN++; $('ph-cap').value = ''; msg.textContent = '已傳上去 ✔（' + Math.round(r[0].length / 1024) + ' KB）'; log('photo', curStop, id); toast('📷 照片傳好了'); });
    }).catch(function (e) { msg.textContent = '傳不出去：' + (e.message || e); });
  }
  function openWall() {
    $('phm').hidden = false; $('ph-grid').innerHTML = '<div class="sub">載入中…</div>';
    ROOT.child('pth').limitToLast(40).once('value').then(function (s) {
      var v = s.val() || {}, ids = Object.keys(v).sort(function (a, b) { return v[b].t - v[a].t; });
      $('ph-grid').innerHTML = ids.length ? ids.map(function (id) { var p = v[id]; return '<figure class="phi"><img src="' + p.th + '" alt=""><figcaption><b>' + esc(p.nick || '') + '</b> ' + esc(p.cap || '') + '</figcaption></figure>'; }).join('') : '<div class="sub">還沒有照片，你來拍第一張！</div>';
      [].forEach.call(document.querySelectorAll('.phi img'), function (im) { im.onclick = function () { im.parentNode.classList.toggle('big'); }; });
    }).catch(function (e) { $('ph-grid').innerHTML = '<div class="sub">載入失敗：' + esc(e.message) + '</div>'; });
  }
  /* 教學關（練習清單）全部完成才解鎖校園任務；測試模式預設略過（?gate=1 可測） */
  function tutorialOk() { return (TEST && qs.get('gate') !== '1') || R0.practice.every(function (t) { return pdone(t.id); }); }
  function allDone() { return R0.practice.every(function (t) { return pdone(t.id); }) && fragCount() >= totalFrags() && !!(prog.final && prog.final.done); }
  function certHtml() {
    var d = new Date(nowMs()), ts = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    return '<div class="card cert"><div style="font-size:34px;text-align:center">🎓🎉</div><h2 style="text-align:center;margin:4px 0">練習日全破！</h2><div style="text-align:center">' + esc((profile && profile.nick) || '') + (envNo != null ? '　#' + envNo : '') + '　' + esc(teamLabel()) + '</div><div class="sub" style="text-align:center">練習清單 ' + R0.practice.length + '／' + R0.practice.length + '・審查單 ' + totalFrags() + '／' + totalFrags() + '・' + ts + '</div><div class="bub done" style="margin-left:0">「' + esc(prog.final.text) + '」</div><div class="sub" style="text-align:center">請把這一頁截圖，交到 flipclass 的作業。</div></div>';
  }
  function practiceHtml() {
    var P = R0.practice, done = P.filter(function (t) { return pdone(t.id); }).length;
    var h = '<div class="card"><b>🎒 練習日清單</b>（不計分）<div class="sub">完成 ' + done + ' / ' + P.length + '。同隊的人一起做比較容易。</div>';
    P.forEach(function (t) { var d = pdone(t.id); h += '<div class="task' + (d ? ' done' : '') + '"><div class="tt">' + (d ? '✔ ' : '') + esc(t.title) + '</div>' + ((!d && t.type === 'ack') ? '<button class="btn2" data-pack="' + t.id + '">做好了</button>' : '') + (!d && t.type === 'gps' ? '<div class="sub">到「地圖」頁並允許定位，會自動完成。</div>' : '') + (!d && t.type === 'mates' ? '<div class="sub">同隊兩人以上同時開著，會自動完成。</div><button class="btn2" data-pack="' + t.id + '">我一個人玩，直接通過</button>' : '') + (!d && t.type === 'auto' ? '<div class="sub">自動完成。</div>' : '') + '</div>'; });
    if (done === P.length) h += '<div class="bub done">🎉 清單完成！接著出 ' + (CAMP === R0.campusW ? 'W' : 'E') + ' 棟繞一圈，完成下面的校園試玩關卡。</div>';
    return h + '</div>';
  }
  var practiceHooked = false;
  function npcHtml(s, p) {
    var n = s.npc, used = p.hints || 0, h = '<div class="npc"><div class="nhd"><span class="nava">' + n.ava + '</span><b>' + esc(n.name) + '</b></div>';
    if (!(p.arrived || TEST)) { h += '<div class="bub dim">（還沒走到這裡，' + esc(n.name) + '還在趕路…）</div><button class="btn2" data-arr="' + s.id + '">我不在現場，先聊聊</button></div>'; return h; }
    n.open.forEach(function (l) { h += '<div class="bub">' + esc(l) + '</div>'; });
    h += '<div class="bub clue">' + esc(n.clue) + '</div>';
    for (var i = 0; i < used && i < n.hints.length; i++) h += '<div class="bub hint">' + esc(n.hints[i]) + '</div>';
    if (p.frag || (s.final && prog.final && prog.final.done)) h += '<div class="bub done">' + esc(n.done) + '</div>';
    Object.keys(p.tasks || {}).forEach(function (k) { var t = (s.tasks || []).filter(function (x) { return x.id === k; })[0]; if (t && t.reward) h += '<div class="bub reward">' + esc(t.reward) + '</div>'; });
    if (!p.frag && used < n.hints.length) h += '<button class="btn2" data-hint="' + s.id + '">再給我一點提示（−10 分，剩 ' + (n.hints.length - used) + ' 次）</button>';
    h += '<div class="opts"><button class="btn2" data-ask="open" data-s="' + s.id + '">再聽一次開場</button><button class="btn2" data-ask="who" data-s="' + s.id + '">你是誰？</button></div>';
    return h + roleHtml(s, p) + '</div>';
  }
  var BEAR = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
  function roleHtml(s, p) {
    var r = myRole(), h = '<div class="roleskill">';
    if (s.secret) {
      if (p.secret) h += '<div class="bub secret">🔍 隱藏關卡已解開 ✔ ' + esc(s.secret) + '</div>';
      else if (r === '偵查員') {
        var dd = myPos ? Math.round(dist(myPos, s)) : null, near = TEST || (dd !== null && dd <= (s.r || 50) + 40);
        if (near) h += '<div class="bub secret">🔍 偵查員發現隱藏關卡：' + esc(s.secret) + '</div><button class="btn2" data-secret="' + s.id + '">✔ 我找到了（全隊 +15 分）</button>';
        else h += '<div class="bub dim">🔍 這一站有隱藏關卡，走到離這裡 ' + ((s.r || 50) + 40) + ' 公尺內才看得到' + (dd !== null ? '（你現在約 ' + dd + ' 公尺）' : '（要先允許定位）') + '。</div>';
      } else h += '<div class="bub dim">🔒 這一站有隱藏關卡，只有「偵查員」走近才看得到。</div>';
    }
    if (r === '領航員') {
      if (myPos) {
        var d = Math.round(dist(myPos, s)), tr = Math.PI / 180, y = Math.sin((s.lon - myPos.lon) * tr) * Math.cos(s.lat * tr);
        var x = Math.cos(myPos.lat * tr) * Math.sin(s.lat * tr) - Math.sin(myPos.lat * tr) * Math.cos(s.lat * tr) * Math.cos((s.lon - myPos.lon) * tr);
        var b = (Math.atan2(y, x) / tr + 360) % 360;
        h += '<div class="bub hint">🧭 領航員：離「' + esc(s.name) + '」約 ' + d + ' 公尺，往' + BEAR[Math.round(b / 45) % 8] + '走。</div>';
      } else h += '<div class="bub dim">🧭 領航員要先允許定位，才算得出距離與方向。</div>';
    }
    if (r === '軍師' && s.npc && s.npc.hints && s.npc.hints[0] && !/^答案/.test(s.npc.hints[0]) && !(p.hints > 0)) h += '<div class="bub hint">📜 軍師的筆記（免費）：' + esc(s.npc.hints[0]) + '</div>';
    if (r === '隊長') h += '<button class="btn2" data-call="' + s.id + '">📣 號召全隊到這一站集合</button>';
    return h + '</div>';
  }
  function taskHtml(s, t) {
    var d = taskDone(s.id, t.id), h = '<div class="task' + (d ? ' done' : '') + (t.bonus ? ' bonus' : '') + '"><div class="tt">' + (d ? '✔ ' : '') + (t.bonus ? '<span class="tag">協力加分</span> ' : '') + esc(t.title) + '</div>';
    if (!d) {
      if (t.type === 'zone') h += '<div class="sub">走到圍欄裡就會自動完成（地圖上的綠色虛線圈）。</div>';
      if (t.type === 'together' || t.type === 'cross') h += '<div class="sub">隊友同時到位就會自動完成，沒做到也不影響主線。</div>';
      if (t.type === 'ack') h += '<button class="btn2" data-ack="' + t.id + '" data-s="' + s.id + '">我拍好了</button>';
      if (t.type === 'choice') h += '<div class="opts">' + t.options.map(function (o) { return '<button class="btn2" data-s="' + s.id + '" data-t="' + t.id + '" data-ans="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      if (t.type === 'text') h += '<input id="tx-' + t.id + '" class="inp" placeholder="寫在這裡"><button class="btn2" data-text="1" data-s="' + s.id + '" data-t="' + t.id + '">送出</button>';
      if (t.type === 'order') h += orderHtml(s, t);
    }
    return h + '</div>';
  }
  /* 排序：卡片先要全部領到（四個角落），再排 */
  var orderState = {};
  function orderHtml(s, t) {
    var got = (s.tasks || []).filter(function (x) { return x.type === 'zone'; }).every(function (x) { return taskDone(s.id, x.id); });
    if (!got) return '<div class="sub">先把四個角落的出土卡都領到。</div>';
    var arr = orderState[s.id] || (orderState[s.id] = shuffleStable(s.cards.map(function (c) { return c.k; })));
    var byK = {}; s.cards.forEach(function (c) { byK[c.k] = c; });
    return '<div class="sub">最早的放最上面。</div>' + arr.map(function (k, i) {
      var c = byK[k]; return '<div class="ocard"><span>' + (i + 1) + '. ' + esc(c.t) + ' <i class="src ' + (c.src === 'doc' ? 'd' : 'f') + '">' + (c.src === 'doc' ? '有文獻' : '文獻?') + '</i></span><span><button data-s="' + s.id + '" data-i="' + i + '" data-mv="-1">▲</button><button data-s="' + s.id + '" data-i="' + i + '" data-mv="1">▼</button></span></div>';
    }).join('') + '<button class="btn2" data-ord="1" data-s="' + s.id + '" data-t="' + t.id + '">就是這個順序</button>';
  }
  function shuffleStable(a) { var b = a.slice(), seed = 7; for (var i = b.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; var j = seed % (i + 1); var x = b[i]; b[i] = b[j]; b[j] = x; } if (b.join() === a.join()) b.reverse(); return b; }
  function moveCard(sid, i, d) { var a = orderState[sid], j = i + d; if (!a || j < 0 || j >= a.length) return; var x = a[i]; a[i] = a[j]; a[j] = x; renderTask(); }
  function checkOrder(sid, tid) {
    var s = stopById(sid), a = orderState[sid] || [];
    if (a.join() === s.cardOrder.join()) { markTask(sid, tid); log('answer', sid, 'order ok'); }
    else { var n = (checkOrder['n' + sid] = (checkOrder['n' + sid] || 0) + 1); log('answer', sid, 'order wrong ' + a.join('>')); toast(n >= 3 ? '還差一點。提示：想想「這塊地先給誰用」。' : '順序不太對，再想想。'); if (n >= 3) { toast('這題送你過～'); markTask(sid, tid, { soft: true }); } }
  }
  var wrong = {};
  function answer(sid, tid, a) {
    var s = stopById(sid), t = s.tasks.filter(function (x) { return x.id === tid; })[0]; log('answer', sid, tid + '=' + a);
    if (a === t.answer) { markTask(sid, tid); return; }
    var k = sid + tid; wrong[k] = (wrong[k] || 0) + 1;
    var n = wrong[k], hs = (s.npc && s.npc.hints) || [];
    if (n >= 3) { toast(t.unverified ? '沒關係，這題先送你過，往下走～' : '沒關係，這題送你過～答案是「' + t.answer + '」'); markTask(sid, tid, { soft: true, ans: a }); return; }   /* 不懲罰：錯三次直接通過 */
    toast('還不太對喔～提示：' + (hs[n - 1] && !/^答案/.test(hs[n - 1]) ? hs[n - 1] : '再看一次現場，想想看。'));
  }
  function submitText(sid, tid) {
    var s = stopById(sid), t = s.tasks.filter(function (x) { return x.id === tid; })[0], v = ($('tx-' + tid).value || '').trim();
    if (v.length < (t.min || 2)) { toast('再多寫一點點（至少 ' + (t.min || 2) + ' 個字）。'); return; }
    log('keyword', sid, v); markTask(sid, tid, { text: v.slice(0, 60) });
  }
  function useHint(sid) {
    var s = stopById(sid), p = prog[sid] || {}, n = p.hints || 0; if (n >= s.npc.hints.length) return;
    ROOT.child(PR_(teamId) + '/' + sid + '/hints').transaction(function (c) { return (c || 0) === n ? n + 1 : undefined; }).then(function (r) { if (r.committed) log('hint', sid, 'level ' + (n + 1)); });
  }
  function finalHtml() {
    var ok = fragCount() >= totalFrags(), d = prog.final && prog.final.done, h = '<div class="card"><b>' + esc(R.finalTask.title) + '</b>';
    if (d) return h + '<div class="bub done">交給時安局了：「' + esc(prog.final.text) + '」</div></div>';
    if (!ok) return h + '<div class="sub">還差 ' + (totalFrags() - fragCount()) + ' 塊碎片。</div></div>';
    return h + '<textarea id="final-tx" class="inp" rows="3" placeholder="寫一句話"></textarea><button id="final-go" class="btn2">交給時安局</button></div>';
  }
  function submitFinal() {
    var v = ($('final-tx').value || '').trim(); if (v.length < R.finalTask.min) { toast('至少 ' + R.finalTask.min + ' 個字。'); return; }
    ROOT.child(PR_(teamId) + '/final').transaction(function (c) { return c === null ? { done: true, by: uid, t: nowMs(), text: v.slice(0, 200) } : undefined; }).then(function (r) { if (r.committed) { log('final', 's7', v); toast('🎉 完成！'); } });
  }
  function renderTeam() {
    var m = team.members, h = '<h2>隊員 ' + Object.keys(m).length + ' / 4</h2><div class="sub">' + (team.closed ? '已關門，不能再加入' : '還可以加入') + '</div>';   /* 隊名與人數頂列已經有了，這裡不再重複 */
    if (team.code) h += '<div class="card big">房碼 <b>' + esc(team.code) + '</b><div class="sub">朋友輸入這 4 碼，或開 ' + esc(location.origin + location.pathname + '?join=' + team.code) + '</div></div>';
    h += '<div class="card">' + Object.keys(m).map(function (k) { var x = m[k], p = teamPos[k]; return '<div class="mem"><span class="mava">' + avaHtml(x.ava, 3, false) + '</span><span><b>' + esc(x.nick) + (k === uid ? '（你）' : '') + '</b><br><span class="sub">' + ROLE_ICON[x.role] + x.role + ' ・ ' + (p && fresh(p) ? '在線上' : '離線／沒開定位') + '</span></span></div>'; }).join('') + '</div>';
    h += roleCard();
    h += chatBox();
    h += '<div class="card"><b>帳號與語言</b><div class="opts"><button class="btn2 lo">登出，換 Google 帳號</button><button class="btn2 lang"></button></div></div>';
    h += '<div class="card"><b>開房間／加入別的房</b><div class="opts"><button class="btn2" id="mk-room">開一個臨時房間</button></div><div class="opts"><input id="jn-code" class="inp" maxlength="4" placeholder="輸入 4 碼房碼"><button class="btn2" id="jn-go">加入</button></div>' + (team.kind === 'room' && team.owner === uid ? '<div class="opts"><button class="btn2" id="rm-open">' + (team.open === false ? '開放補位：關（按此開啟）' : '開放補位：開（按此關閉）') + '</button><button class="btn2" id="rm-close">' + (team.closed ? '重新開門' : '提早關門') + '</button></div>' : '') + '<div class="msg" id="tm-msg"></div></div>';
    h += '<div class="card"><b>地圖風格</b><div class="sub">只改你自己看到的地圖，隊友不受影響。</div><div class="opts">' + ([{ id: 'auto', name: '自動（晚上換夜景）' }].concat(STYLES)).map(function (x) { return '<button class="btn2' + (styleSel === x.id ? ' on' : '') + '" data-style="' + x.id + '">' + esc(x.name) + '</button>'; }).join('') + '</div></div>';
    $('pane-team').innerHTML = h; bindLo(); bindChat();
    [].forEach.call(document.querySelectorAll('[data-style]'), function (b) { b.onclick = function () { styleSel = b.dataset.style; try { localStorage.setItem('walk_style', styleSel); } catch (e) {} applyStyle(); if (phase() === 'rehearsal') pmark('g5'); renderTeam(); }; });
    [].forEach.call(document.querySelectorAll('[data-role]'), function (b) { b.onclick = function () { switchRole(b.dataset.role); }; });
    $('mk-room').onclick = function () { leaveTeam().then(function () { return createTeam('room', ($('ob-dept').value || ''), ''); }).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message; }); };
    $('jn-go').onclick = function () { var c = $('jn-code').value.trim().toUpperCase(); if (c.length !== 4) { $('tm-msg').textContent = '請輸入 4 碼。'; return; } joinByCode(c).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message || '加入失敗。'; }); };
    if ($('rm-open')) $('rm-open').onclick = function () { ROOT.child('teams/' + teamId + '/open').set(team.open === false); };
    if ($('rm-close')) $('rm-close').onclick = function () { ROOT.child('teams/' + teamId + '/closed').set(!team.closed); };
  }
  /* ---------- 角色：一組一種只有一個；被挑走的變灰；隊長可無限換，其他角色只能換一次 ---------- */
  function swapsLeft() {
    var me = team && team.members && team.members[uid]; if (!me) return 0;
    if (me.role === '隊長') return Infinity;
    return Math.max(0, 1 - (me.swaps || 0));
  }
  function roleCard() {
    var m = team.members, owner = {}, left = swapsLeft();
    Object.keys(m).forEach(function (k) { owner[m[k].role] = k; });
    var h = '<div class="card"><b>角色（每種只能一個人當，被挑走的會變灰）</b><div class="sub">你現在是 ' + ROLE_ICON[myRole()] + myRole() + '。' + (left === Infinity ? '隊長可以隨時換角色，沒有次數限制。' : left > 0 ? '你還可以換 1 次角色。' : '你已經換過一次了，不能再換（除非當上隊長）。') + '</div>';
    ROLES.forEach(function (r) {
      var o = owner[r], mine = o === uid, taken = o && !mine, can = !mine && !taken && left > 0;
      h += '<div class="rolerow' + (taken ? ' taken' : '') + (mine ? ' mine' : '') + '"><div class="rr1"><b>' + ROLE_ICON[r] + r + '</b>' + (mine ? ' <span class="tag">你</span>' : '') + (taken ? ' <span class="sub">' + esc((m[o] && m[o].nick) || '隊友') + ' 已選</span>' : '') + '</div><div class="sub">' + esc(ROLE_DESC[r]) + '</div>' + (can ? '<button class="btn2" data-role="' + r + '">換成' + r + '</button>' : '') + '</div>';
    });
    return h + '</div>';
  }
  function switchRole(nr) {
    ROOT.child('teams/' + teamId + '/members').transaction(function (c) {
      if (!c || !c[uid]) return c;
      var me = c[uid], k, used = 0;
      if (me.role === nr) return undefined;
      for (k in c) if (k !== uid && c[k].role === nr) return undefined;   /* 被別人先挑走了 */
      if (me.role !== '隊長' && (me.swaps || 0) >= 1) return undefined;
      me.role = nr; me.swaps = (me.swaps || 0) + 1; return c;
    }).then(function (r) { if (!r.committed) toast('這個角色已被挑走，或你已經換過一次了。'); else log('role', '', nr); });
  }
  /* ---------- 隊內訊息、全場彈幕 ---------- */
  var tchat = [], lastSend = 0, dmStart = 0, lastCall = 0, dmShow = true, dmLane = 0;
  function chatSend(path, obj) { var n = Date.now(); if (n - lastSend < 2000) { toast('慢一點，2 秒一則～'); return false; } lastSend = n; ROOT.child(path).push(obj); return true; }
  function hhmm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function dayLabel(t) {
    var d = new Date(t), n = new Date(), a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    var w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return (d.getMonth() + 1) + '/' + d.getDate() + '（' + w + '）' + (a === b ? ' 今天' : a === b - 86400000 ? ' 昨天' : '');
  }
  function drawTchat() {
    var el = document.getElementById('tc-list'); if (!el) return;
    var last = '';
    el.innerHTML = tchat.length ? tchat.map(function (m) {
      var day = m.t ? dayLabel(m.t) : '', sep = (day && day !== last) ? '<div class="tcday">' + day + '</div>' : ''; if (day) last = day;
      return sep + '<div class="tcm' + (m.uid === uid ? ' me' : '') + (profile && profile.nick && String(m.x).indexOf('@' + profile.nick) >= 0 ? ' at' : '') + (m.call ? ' call' : '') + '"><b>' + esc(m.n || '?') + '</b> ' + esc(m.x) + (m.t ? ' <span class="tctime">' + hhmm(m.t) + '</span>' : '') + '</div>';
    }).join('') : '<div class="sub">還沒有訊息，說聲嗨吧。</div>';
    el.scrollTop = el.scrollHeight;
  }
  function chatBox() {
    return '<div class="card"><b>💬 隊內訊息</b><div id="tc-list" class="tclist"></div><div class="opts"><input id="tc-in" class="inp" maxlength="100" placeholder="只有隊友看得到"><button class="btn2 tcsend" id="tc-go">送出</button></div></div>';
  }
  function bindChat() {
    drawTchat(); var go = $('tc-go'); if (!go) return;
    var send = function () { var v = ($('tc-in').value || '').trim(); if (!v) return; if (chatSend('tchat/' + teamId, { uid: uid, n: (profile && profile.nick) || '?', x: v.slice(0, 100), t: nowMs() })) $('tc-in').value = ''; };
    go.onclick = send; $('tc-in').onkeydown = function (e) { if (e.key === 'Enter') send(); };
  }
  function flyDanmaku(v) {
    var box = document.getElementById('dm'); if (!box || !dmShow || box.children.length > 14) return;
    var e = document.createElement('div'); e.className = 'dmk'; e.textContent = (v.n ? v.n + '：' : '') + v.x;
    dmLane = (dmLane + 1) % 6; e.style.top = (14 + dmLane * 9) + 'vh'; e.style.animationDuration = (8 + Math.random() * 2) + 's';
    box.appendChild(e); setTimeout(function () { e.remove(); }, 11500);
  }
  function startChat() {
    dmStart = nowMs();
    if (!document.getElementById('dm')) {
      var st = document.createElement('style');
      st.textContent = '#dm{position:fixed;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:2500;overflow:hidden}.dmk{position:absolute;left:100%;white-space:nowrap;font-weight:800;font-size:19px;line-height:1.3;color:#fff;background:rgba(24,12,36,.78);padding:4px 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.55);box-shadow:0 2px 8px rgba(0,0,0,.35);animation:dmkgo linear forwards}@keyframes dmkgo{to{transform:translateX(-160vw)}}#dm-btn{position:fixed;left:10px;bottom:76px;z-index:2600;height:46px;padding:0 16px;border-radius:999px;border:3px solid #3a2a4a;background:#ff5c7a;color:#fff;font-size:16px;font-weight:800;box-shadow:0 4px 0 #3a2a4a,0 6px 14px rgba(0,0,0,.3);cursor:pointer}#dm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3a2a4a}#dm-bar .btn2,.tcsend{background:#ff5c7a!important;color:#fff!important;border:2px solid #3a2a4a!important;font-weight:800}#dm-bar{position:fixed;left:8px;right:8px;bottom:128px;z-index:2600;display:none;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}#dm-bar.on{display:flex}#dm-bar input{flex:1;min-width:0}.tclist{max-height:180px;overflow:auto;margin:6px 0;display:flex;flex-direction:column;gap:4px}.tcm{font-size:14px;background:rgba(127,127,127,.12);border-radius:8px;padding:4px 8px}.mate.mt b{background:#2f6690!important;color:#fff!important;border:2px solid #1b3f5c!important;cursor:pointer}.mate.me b{background:#e0821f!important;color:#fff!important;border:2px solid #7a4710!important}.mate.mt .spr{filter:drop-shadow(0 0 4px #2f6690)}.tcm.at{outline:2px solid #2f6690}.tcday{align-self:center;font-size:12px;color:#fff;background:rgba(80,60,100,.75);border-radius:999px;padding:1px 10px;margin:4px 0}.tctime{font-size:11px;opacity:.6;margin-left:4px}.tcm.me{background:rgba(255,160,60,.22)}.tcm.call{background:rgba(255,90,90,.22);font-weight:700}.rolerow{border:1px solid var(--line);border-radius:10px;padding:8px;margin-top:6px}.rolerow.taken{opacity:.42;filter:grayscale(1)}.rolerow.mine{border-color:#e0821f;background:rgba(224,130,31,.1)}.bub.secret{background:#fff3c4;color:#4a3a00;border:1px dashed #c9a400}';
      document.head.appendChild(st);
      var d = document.createElement('div'); d.id = 'dm'; document.body.appendChild(d);
      var b = document.createElement('button'); b.id = 'dm-btn'; b.textContent = '💬 彈幕'; b.title = '全場彈幕（所有人都看得到）'; document.body.appendChild(b);
      var bar = document.createElement('div'); bar.id = 'dm-bar';
      bar.innerHTML = '<input id="dm-in" class="inp" maxlength="40" placeholder="全場彈幕（40 字內，所有人看得到）"><button class="btn2" id="dm-go">送出</button><button class="btn2" id="dm-eye" title="顯示或隱藏彈幕">👁</button>';
      document.body.appendChild(bar);
      b.onclick = function () { bar.classList.toggle('on'); if (bar.classList.contains('on')) $('dm-in').focus(); };
      var sd = function () { var v = ($('dm-in').value || '').trim(); if (!v) return; if (chatSend('gchat', { uid: uid, n: (profile && profile.nick) || '', x: v.slice(0, 40), t: nowMs() })) $('dm-in').value = ''; };
      $('dm-go').onclick = sd; $('dm-in').onkeydown = function (e) { if (e.key === 'Enter') sd(); };
      $('dm-eye').onclick = function () { dmShow = !dmShow; $('dm-eye').style.opacity = dmShow ? 1 : 0.4; if (!dmShow) d.innerHTML = ''; };
    }
    on(ROOT.child('tchat/' + teamId).limitToLast(30), 'value', function (sn) {
      tchat = []; sn.forEach(function (c) { tchat.push(c.val()); }); drawTchat();
      var l = tchat[tchat.length - 1];
      if (l && l.call && l.uid !== uid && l.t > Math.max(dmStart, lastCall)) { lastCall = l.t; toast('📣 ' + l.n + '：' + l.x); }
    });
    on(ROOT.child('gchat').limitToLast(1), 'child_added', function (sn) { var v = sn.val(); if (v && v.t > dmStart) flyDanmaku(v); });
  }
  function renderRank() {
    var arr = Object.keys(board).map(function (k) { return { id: k, b: board[k] }; }).sort(function (a, b) { return b.b.score - a.b.score; });
    var h = '<h2>排行榜</h2><div class="sub">隊與隊競爭積分；落單的人也有完整的單人路徑。</div>';
    h += arr.map(function (x, i) { return '<div class="rk' + (x.id === teamId ? ' me' : '') + '"><span class="n">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1)) + '</span><span class="nm">' + esc(/^房 /.test(x.b.name || '') ? x.b.name : storyName(x.id)) + '・' + x.b.n + ' 人</span><span class="sc">' + x.b.score + ' 分・🧩' + x.b.frags + '</span></div>'; }).join('') || '<div class="card">還沒有分數。</div>';
    $('pane-rank').innerHTML = h;
  }

  /* ---------- 臭蟲與建議回報 ---------- */
  function bindLo() {
    [].forEach.call(document.querySelectorAll('.lo'), function (b) { b.onclick = function () {
      if (b.dataset.arm !== '1') { b.dataset.t = b.textContent; b.dataset.arm = '1'; b.textContent = '再按一次登出'; setTimeout(function () { b.dataset.arm = '0'; b.textContent = b.dataset.t; }, 5000); return; }
      try { clearInterval(posTimer); } catch (e) {}
      auth.signOut().then(function () { location.reload(); });
    }; });
    if (window.WalkLang && WalkLang.bind) WalkLang.bind();
  }
  function openFb() { $('fbm').hidden = false; $('fb-msg').textContent = ''; $('fb-tx').focus(); }
  function sendFb() {
    var tx = ($('fb-tx').value || '').trim(); if (tx.length < 4) { $('fb-msg').textContent = '請多寫幾個字，讓我們看得懂。'; return; }
    var rec = { t: nowMs(), uid: uid || '', team: teamId || '', type: $('fb-type').value, text: tx.slice(0, 600), stop: curStop || '', view: view, route: REH ? 'campus' : 'live', phase: phase(), style: effectiveStyle(), pos: myPos ? { lat: +myPos.lat.toFixed(5), lon: +myPos.lon.toFixed(5), acc: Math.round(myPos.acc) } : null, ua: navigator.userAgent.slice(0, 140), errs: errBuf.slice(-5), ver: R0.version };
    if (!uid) { $('fb-msg').textContent = '請先用 Google 登入再回報；登入不了的話，請直接告訴老師。'; return; }
    if (envNo != null) rec.env = envNo;
    ROOT.child('fb').push(rec).then(function () { $('fb-tx').value = ''; $('fbm').hidden = true; toast('已送出，謝謝！'); }).catch(function (e) { $('fb-msg').textContent = '送不出去：' + e.message; });
  }
  window.addEventListener('load', function () {
    boot();
    [].forEach.call(document.querySelectorAll('.fb-open'), function (b) { b.onclick = openFb; });
    $('ph-close').onclick = function () { $('phm').hidden = true; }; $('ph-ref').onclick = openWall;
    bindLo();
    if ($('btn-mapclose')) $('btn-mapclose').onclick = function () { mapFolded = true; setView('task'); };
    $('fb-send').onclick = sendFb; $('fb-close').onclick = function () { $('fbm').hidden = true; };
  });
})();
