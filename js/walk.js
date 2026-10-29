/* 11/14 走讀 app（學生端）。
   登入：Google（Firebase Auth）；?test=1 時走測試模式（不登入、資料寫 walk1114test）。
   資料：whgm/analysis/walk1114/*（編號/uid 為鍵，不存 email 與姓名）。
   隱私：系／班只在分隊當下使用，隊伍只留「標籤」（建隊者的系），個人不存；位置只給同隊與老師，結束後清除。 */
(function () {
  'use strict';
  var R0 = window.WALK_ROUTE, R = R0, S = R0.stops, REH = false;
  var CAMP = null;
  /* 試玩關卡依信封編號自動選：遊戲設計學 101-130（夜間部、W 棟）走 campusW，其他走 E 棟校園導覽；?route=w 可強制（測試用） */
  var TWR = new URLSearchParams(location.search).get('route') === 'tw';
  function pickCamp() { if (TWR && R0.tw) return R0.tw; var w = new URLSearchParams(location.search).get('route') === 'w' || (envNo >= 101 && envNo <= 130); return (w && R0.campusW) ? R0.campusW : R0.campus; }
  function selectRoute(reh) {
    REH = !!reh || (TWR && !!R0.tw); CAMP = pickCamp();
    R = REH ? Object.assign({}, R0, { stops: CAMP.stops, fragmentNames: CAMP.fragmentNames, finalTask: CAMP.finalTask }) : R0;
    S = R.stops; curStop = S[0].id;
  }
  function PR_(id) { return (REH ? 'progr/' : 'prog/') + id; }
  /* 角色與造型依章節解鎖：隊伍完成幾個案件（拿到幾格碎片）才開放；一開始只有 2 款可選。角色的「等級」是另一回事（簡報室升級） */
  var AVA_CH = [0, 0, 1, 2, 3, 4], SKIN_CH = [1, 1, 2, 2, 3, 4, 5, 6];
  function chDone() { try { return fragCount(); } catch (e) { return 0; } }
  function totalFrags() { return S.filter(function (x) { return x.frag !== undefined; }).length; }
  var errBuf = [];
  window.addEventListener('error', function (e) { errBuf.push(String(e.message || e).slice(0, 160)); if (errBuf.length > 12) errBuf.shift(); });
  window.addEventListener('unhandledrejection', function (e) { errBuf.push('promise: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 160)); if (errBuf.length > 12) errBuf.shift(); });
  var qs = new URLSearchParams(location.search);
  var TEST = qs.get('test') === '1';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  /* 組織的功能性角色（簡報室可挑、可換；一隊一種只有一個）。前四個是預設，其餘由隊員在簡報室自己挑 */
  var ROLES = ['隊長', '領航員', '軍師', '偵查員', '檔案官', '訪談員', '蒐證員', '記錄官', '文化設計員', '通訊官', '安全官', '補給官', '鑑識員', '技術專家', '在地嚮導', '扮演專員'];
  var ROLE_ICON = { '隊長': '👑', '領航員': '🧭', '軍師': '📜', '偵查員': '🔍', '檔案官': '🗂️', '訪談員': '🎤', '蒐證員': '📸', '記錄官': '✍️', '文化設計員': '🎎', '通訊官': '📡', '安全官': '🦺', '補給官': '🎒', '鑑識員': '🔬', '技術專家': '🛠️', '在地嚮導': '🗺️', '扮演專員': '🎭' };
  var ROLE_DEPT = { '隊長': '指揮', '領航員': '調度', '軍師': '分析', '偵查員': '情報', '檔案官': '情報', '訪談員': '行動', '蒐證員': '行動', '記錄官': '行動', '文化設計員': '行動', '通訊官': '聯絡', '安全官': '後勤', '補給官': '後勤', '鑑識員': '情報', '技術專家': '後勤', '在地嚮導': '調度', '扮演專員': '行動' };
  var ROLE_DESC = {
    '隊長': '【指揮】「號召全隊」到某一站集合；可採購補給；機動：隨時可以無限次換角色（補位用）。',
    '領航員': '【調度】看得到離每一站的距離與方向。負責走在前面帶路。',
    '軍師': '【分析】每一站的第一則提示免費、自動出現（不扣分）；負責回答選擇題與排序題。',
    '偵查員': '【情報】走近一站，就會看到那裡的「隱藏關卡」，找到了全隊 +15 分。',
    '檔案官': '【情報】每一站都看得到「資料出處與可信度」，知道哪些是有出處的、哪些只是聽說。',
    '訪談員': '【行動】向 NPC 提問時，看得到這個人「怎麼問他才會開口、怎樣的問法他只會冷處理」。',
    '蒐證員': '【行動】負責拍照任務（蒐證），照片是全隊的證據。',
    '記錄官': '【行動】負責寫字的任務與最後那一句話，把全隊的想法整理成一句。',
    '文化設計員': '【行動】負責「文化→遊戲」那一題：這一站的文化要素屬於哪一類、放進遊戲會變成什麼規則。',
    '通訊官': '【聯絡】可以對「全場」廣播求援，附上你們隊在哪一站需要協助。',
    '安全官': '【後勤】看得到隊友離你最遠多少公尺，並顯示每一站的現場安全提醒（車流、安靜、不拍人臉）。',
    '補給官': '【後勤】管理隊伍的點數：和隊長一樣可以在簡報室採購技能、裝備與造型。',
    '鑑識員': '【情報】寫觀察題時，多給你一個「觀察框架」（形狀、材質、新舊、文字、數字），教你怎麼看出細節。',
    '技術專家': '【後勤】看得到定位精度與連線狀況，並提醒怎麼讓手機定位更準。',
    '在地嚮導': '【調度】看得到走到每一站大約要幾分鐘，以及怎麼走比較安全。',
    '扮演專員': '【行動】向 NPC 提問時以劇中人身分入戲，NPC 會多回一句符合場景的反應（不會給答案）。'
  };
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
  /* ---------- 顯示與省電：深色（OLED 黑色像素不發光）、省電模式（停動畫、降低定位處理與上傳頻率） ---------- */
  var themePref = 'auto', ecoPref = 'auto', ecoAuto = false, ecoOn = false, geoCtl = null;
  try { themePref = localStorage.getItem('walk_theme') || 'auto'; ecoPref = localStorage.getItem('walk_eco') || 'auto'; } catch (e) {}
  function isDark() { return themePref === 'dark' || (themePref === 'auto' && !!(window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches)); }
  function applyTheme() {
    ecoOn = ecoPref === 'on' || (ecoPref === 'auto' && ecoAuto);
    var d = isDark(), r = document.documentElement; r.classList.toggle('dk', d); r.classList.toggle('lt', themePref === 'light');
    if (document.body) { document.body.classList.toggle('dk', d); document.body.classList.toggle('eco', ecoOn); }
  }
  try { if (navigator.getBattery) navigator.getBattery().then(function (b) { var u = function () { ecoAuto = !b.charging && b.level < 0.3; applyTheme(); }; b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); u(); }); } catch (e) {}
  document.addEventListener('visibilitychange', function () { if (!geoCtl) return; if (document.hidden) geoCtl.stop(); else geoCtl.start(); });
  function dispCard() {
    var T = [['auto', '跟著手機'], ['dark', '深色'], ['light', '淺色']], E = [['auto', '電量低時自動'], ['on', '一律開'], ['off', '關']];
    return '<div class="card"><b>顯示與省電</b><div class="sub">深色背景較省電（OLED 螢幕）。省電模式會停掉動畫、降低定位與上傳的頻率。只影響你自己的手機。</div>'
      + '<div class="opts">' + T.map(function (x) { return '<button class="btn2' + (themePref === x[0] ? ' on' : '') + '" data-theme="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>'
      + '<div class="opts">' + E.map(function (x) { return '<button class="btn2' + (ecoPref === x[0] ? ' on' : '') + '" data-eco="' + x[0] + '">省電：' + x[1] + '</button>'; }).join('') + '</div>'
      + '<div class="opts"><button class="btn2' + (window.WalkSfx && WalkSfx.isOn() ? ' on' : '') + '" data-sfxset="1">音效：開</button><button class="btn2' + (window.WalkSfx && !WalkSfx.isOn() ? ' on' : '') + '" data-sfxset="0">音效：關</button></div></div>';
  }
  function bindDisp() {
    [].forEach.call(document.querySelectorAll('[data-theme]'), function (b) { b.onclick = function () { themePref = b.dataset.theme; try { localStorage.setItem('walk_theme', themePref); } catch (e) {} applyTheme(); applyStyle(); renderTeam(); }; });
    [].forEach.call(document.querySelectorAll('[data-sfxset]'), function (b) { b.onclick = function () { if (window.WalkSfx) WalkSfx.setOn(b.dataset.sfxset === '1'); renderTeam(); }; });
    [].forEach.call(document.querySelectorAll('[data-eco]'), function (b) { b.onclick = function () { ecoPref = b.dataset.eco; try { localStorage.setItem('walk_eco', ecoPref); } catch (e) {} applyTheme(); renderTeam(); }; });
  }
  applyTheme();
  function effectiveStyle() {
    if (isDark() && (styleSel === 'pixel' || styleSel === 'auto')) return 'night';
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
  /* ---------- 導航：點隊友或地點 → 設成目標，距離與方位常駐顯示，一鍵開 Google 地圖（步行）---------- */
  var NAVT = null, navBarEl = null;
  function navUrl(ll) { return 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + ll.lat + ',' + ll.lon; }
  function dTxt(d) { return d < 1000 ? Math.round(d) + ' 公尺' : (d / 1000).toFixed(1) + ' 公里'; }
  function distLine(s) {
    return (myPos ? '📏 距離你 <b>' + dTxt(dist(myPos, s)) + '</b>・約 ' + Math.max(1, Math.round(dist(myPos, s) / 70)) + ' 分鐘・' : '（開定位會顯示距離）') + '<a class="btn2 gm" target="_blank" rel="noopener" href="' + navUrl(s) + '">🧭 Google 地圖導航</a> <button class="btn2" data-navset="' + s.id + '">📌 設為目標</button>';
  }
  function setNavTarget(t) { NAVT = t; navBarRender(); }
  function navBarRender() {
    if (!navBarEl) { navBarEl = document.createElement('div'); navBarEl.id = 'navbar'; document.body.appendChild(navBarEl); }
    if (!NAVT) { navBarEl.className = ''; navBarEl.innerHTML = ''; return; }
    var ll = NAVT.get(); if (!ll) { NAVT = null; navBarEl.className = ''; return; }
    var d = myPos ? dist(myPos, ll) : null;
    if (d !== null && d < 20 && NAVT.auto) { toast('📍 到了：' + NAVT.name); NAVT = null; navBarEl.className = ''; navBarEl.innerHTML = ''; return; }
    navBarEl.className = 'on';
    navBarEl.innerHTML = '<span class="nbt">🧭 ' + esc(NAVT.name) + (d !== null ? '・' + dTxt(d) + '・' + bearingText(ll) : '') + '</span><a class="btn2" target="_blank" rel="noopener" href="' + navUrl(ll) + '">Google 地圖</a><button class="btn2" id="nb-x">✕</button>';
    $('nb-x').onclick = function () { NAVT = null; navBarRender(); };
  }
  function updDist() {
    if (document.hidden) return;
    if (myPos) {
      [].forEach.call(document.querySelectorAll('[data-cd]'), function (e) { var x = stopById(e.dataset.cd); if (x) e.textContent = dTxt(dist(myPos, x)); });
      var cd = $('cur-dist'), st = stopById(curStop || S[0].id); if (cd && st) { cd.innerHTML = distLine(st); bindNavSet(); }
    }
    if (NAVT) navBarRender();
  }
  function bindNavSet() {
    [].forEach.call(document.querySelectorAll('[data-navset]'), function (b) { b.onclick = function () { var x = stopById(b.dataset.navset); if (x) setNavTarget({ name: x.name, get: function () { return x; }, auto: true }); }; });
  }
  function bindNav(marker, title, getLL, extraLabel, extraFn) {
    var box = document.createElement('div'); box.style.minWidth = '150px';
    box.innerHTML = '<b>' + esc(title) + '</b><div class="sub pd"></div><a class="btn2 gm" target="_blank" rel="noopener" style="display:block;margin-top:4px;text-align:center">🧭 Google 地圖導航</a><button class="btn2 pset" style="display:block;margin-top:4px;width:100%">📌 設為導航目標</button>' + (extraLabel ? '<button class="btn2 px" style="display:block;margin-top:4px;width:100%">' + extraLabel + '</button>' : '');
    marker.bindPopup(box);
    marker.on('popupopen', function () {
      var ll = getLL(); if (!ll) return;
      box.querySelector('.gm').href = navUrl(ll);
      box.querySelector('.pd').textContent = myPos ? '距離你 ' + dTxt(dist(myPos, ll)) : '';
    });
    box.querySelector('.pset').onclick = function () { setNavTarget({ name: title, get: getLL, auto: false }); try { marker.closePopup(); } catch (e) { } };
    if (extraFn) box.querySelector('.px').onclick = function () { try { marker.closePopup(); } catch (e) { } extraFn(); };
  }
  function confetti() {
    var em = ['⭐', '✨', '🎉', '💖', '🧩', '🌸']; for (var i = 0; i < 14; i++) { var e = document.createElement('span'); e.className = 'cf'; e.textContent = em[i % em.length];
      e.style.left = (30 + Math.random() * 40) + 'vw'; e.style.top = (40 + Math.random() * 15) + 'vh'; e.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); e.style.setProperty('--dy', (-60 - Math.random() * 140) + 'px'); e.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(e); (function (x) { setTimeout(function () { x.remove(); }, 1200); })(e); }
  }
  function toast(m) { try { window.WalkSfx && WalkSfx.forToast(m); } catch (e) { } if (/^(✔|🧩|🎉)/.test(m)) confetti(); var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 3200); }
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
    /* 角色主題：用上次選的角色，換主角、QR 配色、特效色與首頁風格 */
    var aid = ''; try { aid = localStorage.getItem('walk_ava') || ''; } catch (e) { }
    var TH0 = window.WalkThemes && WalkThemes.get(aid);
    if (TH0) { var lg = $('screen-login'); if (lg) lg.dataset.home = TH0.home; if (!buildQR._v) { return WalkThemes.vox(aid, function (v) { buildQR._v = { th: TH0, vox: v }; buildQR(); }); } }
    var url = location.origin + location.pathname;
    var night = effectiveStyle() === 'night', ok3d = false, wrap = $('morph-wrap');
    if (window.WalkMorph3D && WalkMorph3D.supported()) {   /* 有 WebGL：等角體素 3D 場景，運鏡變成 QR；沒有就退回 2D 像素版 */
      try {
        var api = WalkMorph3D.mount(wrap, url, night, { onToggle: function (toQR) { $('morph-hint').textContent = toQR ? '朋友掃這個就能加入・再點一下回場景' : '點一下運鏡成 QR，朋友掃了就能加入'; } }, buildQR._v || null);
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
      profile = s.val(); try { if (profile && profile.ava) localStorage.setItem('walk_ava', profile.ava); } catch (e) { }
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
    var g = $('ob-ava'); g.innerHTML = AVAS.map(function (a, i) { var lk = (AVA_CH[i] || 0) > 0; return '<button type="button" class="ava' + (i === 0 ? ' on' : '') + (lk ? ' lock' : '') + '" data-a="' + a + '"' + (lk ? ' data-lock="1" title="完成 ' + AVA_CH[i] + ' 個案件後解鎖"' : '') + '>' + avaHtml(a, 3, false) + (lk ? '<br><span class="sub">🔒 完成 ' + AVA_CH[i] + ' 案</span>' : '') + '</button>'; }).join('');
    g.onclick = function (e) { var b = e.target.closest('.ava'); if (!b || b.dataset.lock) return; [].forEach.call(g.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
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
    profile = { nick: nick.slice(0, 12), ava: ava, ts: nowMs() }; try { localStorage.setItem('walk_ava', ava); } catch (e) { }
    if (envNo != null) profile.env = envNo;
    $('ob-go').disabled = true; $('ob-msg').textContent = '分隊中…';
    ROOT.child('players/' + uid).update(profile).then(function () {
      return code ? joinByCode(code) : autoAssign(dept, cls);
    }).then(function (id) { $('screen-ob').hidden = true; enterGame(id); })
      .catch(function (e) { $('ob-go').disabled = false; $('ob-msg').textContent = e.message || '分隊失敗，請再按一次。'; });
  }

  /* ---------- 組隊：自動分隊、開房、加房 ---------- */
  function pickRole(m) { var used = {}; Object.keys(m || {}).forEach(function (k) { used[m[k].role] = 1; }); for (var i = 0; i < 4; i++) if (!used[ROLES[i]]) return ROLES[i]; for (i = 4; i < ROLES.length; i++) if (!used[ROLES[i]]) return ROLES[i]; return ROLES[Object.keys(m || {}).length % 4]; }
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
  function kickMember(k) {
    if (myRole() !== '隊長' || k === uid) return;
    ROOT.child('teams/' + teamId).transaction(function (t) {
      if (!t || !t.members || !t.members[k]) return t;
      var me = t.members[uid]; if (!me || me.role !== '隊長') return;
      delete t.members[k]; t.n = Object.keys(t.members).length; if (t.n < 4) t.closed = false; return t;
    }).then(function (r) { if (r.committed) { ROOT.child('pos/' + teamId + '/' + k).remove(); ROOT.child('players/' + k + '/team').remove(); toast('已請他離開隊伍。'); log('kick', '', k); } });
  }
  function leaveTeam() {
    var old = (profile && profile.team) || teamId; if (!old) return Promise.resolve();
    return ROOT.child('teams/' + old).transaction(function (t) {
      if (t === null) return t; var m = t.members || {}; if (!m[uid]) return t;
      var wasCap = m[uid].role === '隊長';
      delete m[uid]; var n = Object.keys(m).length; if (n === 0) return null;
      var nk = null;
      if (wasCap) {   /* 隊長離開：從還在的隊員裡隨機指定新隊長（優先挑在線的） */
        var ks = Object.keys(m), on = ks.filter(function (k) { return teamPos[k] && fresh(teamPos[k]); }), pool = on.length ? on : ks;
        nk = pool[Math.floor(Math.random() * pool.length)]; m[nk].role = '隊長'; m[nk].swaps = 0;
      }
      t.members = m; t.n = n; if (n < 4) t.closed = false; if (t.owner === uid) t.owner = nk || Object.keys(m)[0]; return t;
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
    on(ROOT.child('cfg/phase'), 'value', function (sn) { cfgPhase = sn.val(); if (!(TWR && R0.tw) && (phase() === 'rehearsal') !== REH) { console.log('RELOAD', phase(), REH, cfgPhase, R.liveStart); location.reload(); return; } render(); renderBanner(); });
    on(ROOT.child('cfg/npcd'), 'value', function (sn) { npcd = sn.val() || {}; refreshNpcBox(); });
    db.ref('.info/serverTimeOffset').on('value', function (sn) { svOff = sn.val() || 0; });
    on(ROOT.child('npca/' + uid), 'value', function (sn) { var v = sn.val() || {}; Object.keys(v).forEach(function (k) { if (!npcAns[k] && window.WalkSfx) WalkSfx.play('npc'); npcAns[k] = v[k]; }); refreshNpcBox(); });
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
    /* 地圖右上角：回到現在開放的關卡、回到我的位置 */
    var MapBtns = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        var d = L.DomUtil.create('div', 'mapbtns'); L.DomEvent.disableClickPropagation(d);
        d.innerHTML = '<button type="button" class="btn2" id="mb-stops">🎯 回到關卡</button><button type="button" class="btn2" id="mb-me">📍 我的位置</button>';
        d.querySelector('#mb-stops').onclick = function () {
          var cur = (!REH && typeof schedNow === 'function') ? schedNow() : null;
          if (cur) map.flyTo([cur.lat, cur.lon], 17); else map.fitBounds(L.latLngBounds(S.map(function (x) { return [x.lat, x.lon]; })), { padding: [50, 50], maxZoom: 18 });
        };
        d.querySelector('#mb-me').onclick = function () { if (myPos) map.flyTo([myPos.lat, myPos.lon], Math.max(map.getZoom(), 17)); else toast('還沒有定位，請允許定位後再試。'); };
        return d;
      }
    });
    map.addControl(new MapBtns());
    if (REH) { var bb = L.latLngBounds(S.map(function (x) { return [x.lat, x.lon]; })); map.fitBounds(bb, { padding: [50, 50], maxZoom: 18 }); }
    S.forEach(function (s, i) {
      stopMarkers[s.id] = L.marker([s.lat, s.lon], { icon: stopIcon(s, i, false) }).addTo(map); bindNav(stopMarkers[s.id], s.name, function () { return s; }, '📋 看這一站的任務', function () { curStop = s.id; setView('task'); });
      stopCircles[s.id] = [L.circle([s.lat, s.lon], { radius: s.r, color: '#b8402a', weight: 1, opacity: 0.45, dashArray: '2 6', fillOpacity: 0.015, interactive: false }).addTo(map)];
      if (s.zones) Object.keys(s.zones).forEach(function (k) { var z = s.zones[k]; stopCircles[s.id].push(L.circle([z.lat, z.lon], { radius: z.r, color: '#1f6f68', weight: 1, opacity: 0.4, dashArray: '4', fillOpacity: 0.02, interactive: false }).addTo(map)); });
    });
  }
  var stopCircles = {};
  function hiliCircles() {
    Object.keys(stopCircles).forEach(function (id) {
      var on = id === curStop;
      stopCircles[id].forEach(function (c, i) { c.setStyle(i === 0 ? { weight: on ? 2.5 : 1, opacity: on ? 0.95 : 0.35, fillOpacity: on ? 0.08 : 0.01, dashArray: on ? null : '2 6' } : { weight: on ? 2 : 1, opacity: on ? 0.95 : 0.3, fillOpacity: on ? 0.15 : 0.01 }); });
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
      if (document.hidden) return;
      if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} }
      watchId = navigator.geolocation.watchPosition(gotPos, function (e) {
        var g = $('gps');
        if (e.code === 1) g.innerHTML = '定位被擋住了。' + (INAPP ? '你在 LINE／臉書等App裡面開的，請按右上角「用瀏覽器開啟」改用 Safari／Chrome。' : IOS ? 'iPhone：到「設定 → 隱私權與安全性 → 定位服務」確認開啟，並把「Safari 網站」設成「使用 App 期間」；再回來按重新定位。' : '請在網址列左邊的鎖頭允許「位置」。') + ' <button class="btn2" id="geo-retry">重新定位</button>';
        else if (e.code === 3) { g.innerHTML = '定位逾時，正在重試…（iPhone 請到空曠處、關掉「低耗電模式」）'; setTimeout(geoStart, 4000); }
        else { g.innerHTML = '暫時抓不到位置，正在重試…若一直失敗，可以用任務頁的「我不在現場，先聊聊」先往下玩。'; setTimeout(geoStart, 6000); }
        var rb = $('geo-retry'); if (rb) rb.onclick = function () { g.textContent = '定位中…'; geoStart(); };
      }, { enableHighAccuracy: !IOS, maximumAge: IOS ? 15000 : 5000, timeout: IOS ? 40000 : 20000 });
    };
    geoCtl = { start: geoStart, stop: function () { if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; } } };
    geoStart();
    if (!posTimer) posTimer = setInterval(uploadPos, 25000);
  }
  window.__walkSim2 = function () { };
  var lastMe = null, lastMoveT = 0, mateLast = {}, meSkin = '';
  /* 換造型後，我的地圖圖示馬上換（不用等下一次定位） */
  function refreshMeIcon() {
    if (typeof meMarker === 'undefined' || !meMarker) return; var k = (skinOf(uid) || {}).k || ''; if (k === meSkin) return; meSkin = k;
    meMarker.setIcon(L.divIcon({ className: '', html: '<div class="mate me">' + skinAva(uid, profile && profile.ava, 3, nowMs() - lastMoveT < 12000) + '<b>' + esc((profile && profile.nick) || '我') + '</b></div>', iconSize: [48, 56], iconAnchor: [24, 44] }));
  }
  function gotPos(p) {
    myPos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 0, t: nowMs() };
    try { updDist(); } catch (e) { }
    if (!window.__walkSim && gotPos._t && nowMs() - gotPos._t < (ecoOn ? 8000 : 3000) && gotPos._p && dist(gotPos._p, myPos) < 4) return;
    gotPos._t = nowMs(); gotPos._p = { lat: myPos.lat, lon: myPos.lon };
    $('gps').textContent = '定位精度約 ' + Math.round(myPos.acc) + ' 公尺';
    var moved = lastMe && dist(lastMe, myPos) > 3; lastMe = { lat: myPos.lat, lon: myPos.lon }; if (moved) lastMoveT = nowMs();
    var mic = L.divIcon({ className: '', html: '<div class="mate me">' + skinAva(uid, profile && profile.ava, 3, nowMs() - lastMoveT < 12000) + '<b>' + esc((profile && profile.nick) || '我') + '</b></div>', iconSize: [48, 56], iconAnchor: [24, 44] });
    if (!meMarker) { meMarker = L.marker([myPos.lat, myPos.lon], { icon: mic, zIndexOffset: 800 }).addTo(map); if (!REH) map.setView([myPos.lat, myPos.lon], 17); }
    else { meMarker.setLatLng([myPos.lat, myPos.lon]); if (meMarker._ik !== mic.options.html) { meMarker.setIcon(mic); meMarker._ik = mic.options.html; } }
    if (phase() === 'rehearsal') pmark('g1');
    updateGoal();
    if (!uploadPos._last || nowMs() - uploadPos._last > (ecoOn ? 45000 : 15000)) uploadPos();
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
  var placedPos = {};
  function spreadPos(k, p) {   /* 兩人距離 < 12 公尺就沿圓周錯開，免得頭像疊在一起 */
    var lat = p.lat, lon = p.lon, n = 0, others = [myPos].concat(Object.keys(placedPos).filter(function (x) { return x !== k; }).map(function (x) { return placedPos[x]; }));
    others.forEach(function (o) { if (o && dist(o, { lat: lat, lon: lon }) < 12) n++; });
    if (n) { var a = (n * 2.1 + 0.6), r = 0.00011; lat += Math.sin(a) * r; lon += Math.cos(a) * r; }
    placedPos[k] = { lat: lat, lon: lon }; return { lat: lat, lon: lon };
  }
  function renderMates() {
    if (phase() === 'rehearsal') { var n = 0; Object.keys(teamPos).forEach(function (k) { if (fresh(teamPos[k])) n++; }); if (n >= 2) pmark('g2'); }
    Object.keys(mateMarkers).forEach(function (k) { if (!teamPos[k] || !showMates) { map.removeLayer(mateMarkers[k]); delete mateMarkers[k]; } });
    if (!showMates) return;
    Object.keys(teamPos).forEach(function (k) {
      if (k === uid) return; var p = teamPos[k];
      var pp = spreadPos(k, p), ml = mateLast[k], mv = ml && (Math.abs(ml.lat - p.lat) > 0.00003 || Math.abs(ml.lon - p.lon) > 0.00003); mateLast[k] = { lat: p.lat, lon: p.lon, mv: mv ? nowMs() : (ml ? ml.mv : 0) };
      var html = '<div class="mate mt">' + skinAva(k, p.ava, 3, nowMs() - (mateLast[k].mv || 0) < 40000) + '<b>👥 ' + esc(p.nick || '') + '</b></div>';
      var ic = L.divIcon({ className: '', html: html, iconSize: [48, 56], iconAnchor: [24, 44] });
      if (mateMarkers[k]) mateMarkers[k].setLatLng([pp.lat, pp.lon]).setIcon(ic); else { mateMarkers[k] = L.marker([pp.lat, pp.lon], { icon: ic, zIndexOffset: 600 }).addTo(map); bindNav(mateMarkers[k], '👥 ' + (p.nick || '隊友'), function () { return teamPos[k] || p; }, '💬 跟他說話', function () { talkTo(p.nick || ''); }); }
    });
  }

  /* ---------- 時程（自動模式：依時鐘提示現在該在哪） ---------- */
  function stopStartMs(s) { var m = /(\d{1,2}):(\d{2})/.exec(s.time || ''); if (!m) return Infinity; var d = new Date(R.date + 'T00:00:00+08:00'); return d.getTime() + (+m[1] * 3600 + +m[2] * 60) * 1000; }
  function schedNow() {
    var t = nowMs(), cur = null;
    for (var i = 0; i < S.length; i++) if (stopStartMs(S[i]) <= t) cur = S[i];
    return cur;
  }
  function schedLoop() { renderBanner(); setInterval(function () { if (!document.hidden) renderBanner(); }, 20000); }
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
      if (myPos && dist(myPos, s) <= s.r + Math.min(myPos.acc || 0, 40) + 10 * hqLv('range') + 5 * rlvA('技術專家') && !(prog[s.id] && prog[s.id].arrived)) {
        ROOT.child(PR_(teamId) + '/' + s.id + '/arrived').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) toast('📍 到達：' + s.name); });
      }
      (s.tasks || []).forEach(function (t) {
        if (taskDone(s.id, t.id)) return;
        if (t.type === 'zone' && myPos) { var z = zoneOf(s, t.zone); if (z && dist(myPos, z) <= z.r + Math.min(myPos.acc || 0, 40) + 12 + 10 * hqLv('range') + 5 * rlvA('技術專家')) markTask(s.id, t.id); }
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
    try { checkAch(); } catch (e) { }
    var allFrag = S.every(function (s) { return s.frag === undefined || (prog[s.id] && prog[s.id].frag); });
    if (allFrag && !finalOpen) { finalOpen = true; toast('🧩 四塊碎片到手了！回終點拼成一句話。'); }
    writeScore();
  }
  var finalOpen = false;
  function checkFrag(s) {
    if (s.frag === undefined || (prog[s.id] && prog[s.id].frag)) return;
    var need = (s.tasks || []).filter(function (t) { return !t.bonus && t.type !== 'together' && t.type !== 'cross'; });
    if (need.every(function (t) { return taskDone(s.id, t.id); })) {
      ROOT.child(PR_(teamId) + '/' + s.id + '/frag').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) { toast('🧩 取得碎片：' + R.fragmentNames[s.frag] + '　回「簡報室」領補給！'); hqNew = true; hqBadge(); if (myRole() === '通訊官' && rlvA('通訊官') >= 3) { try { ROOT.child('gchat').push({ uid: uid, n: (profile && profile.nick) || '', x: ('🎉 ' + teamLabel() + '完成了「' + s.name.replace(/^第 \d (案|章)｜/, '') + '」').slice(0, 40), t: nowMs() }); } catch (e) { } } log('frag', s.id, R.fragmentNames[s.frag]); } });
    }
  }
  function scoreOf() {
    var sc = 0, P = R.score, hn = 0;
    S.forEach(function (s) {
      var p = prog[s.id] || {}; if (p.arrived) sc += P.arrive;
      (s.tasks || []).forEach(function (t) { if (p.tasks && p.tasks[t.id]) sc += (t.bonus ? P.bonus + (modeOf() === 'relax' ? 3 : 0) : P.task) + roleTaskBonus(t); });
      if (p.frag) sc += P.frag + speedBonus(p.frag && p.frag.t) + ((pkInfo() && pkInfo().mutual) ? 5 : 0); if (p.secret) sc += 15 + 10 * rlvA('偵查員'); sc += hintPenalty(P) * (p.hints || 0); hn += (p.hints || 0);
    });
    if (hasGear('kit') && hn > 0) sc -= hintPenalty(P);
    if (prog.final && prog.final.done) sc += P.final + (rlvA('記錄官') >= 3 ? 10 : 0);
    var pk0 = pkInfo(); if (pk0 && pk0.mutual && prog.final && prog.final.done && sc > pk0.their) sc += 20;
    sc += 10 * achCount() + 5 * pairBonusN() * fragCount();
    return Math.max(0, sc);
  }
  /* ---------- 隊伍成就（每個 +10 分，隊伍第一次達成時記一筆）---------- */
  var ACHS = [
    { k: 'split', icon: '🧭', name: '分頭探索', desc: '隊員同時分散在不同案件的現場，每人各在一案（至少 2 人在線）' },
    { k: 'gather', icon: '🤝', name: '全員集合', desc: '全隊同時聚在同一個案件現場，一個都不少' },
    { k: 'roles', icon: '🎭', name: '各司其職', desc: '同一個案件的任務，由 3 位不同隊員分別完成（不到 3 人的隊伍需全員參與）' }
  ];
  function achDone(k) { return !!((hqState().ach || {})[k]); }
  function achCount() { var n = 0; ACHS.forEach(function (a) { if (achDone(a.k)) n++; }); return n; }
  function awardAch(a) {
    if (achDone(a.k)) return;
    ROOT.child(PR_(teamId) + '/_hq/ach/' + a.k).transaction(function (c) { return c === null ? { t: nowMs(), by: uid } : undefined; }).then(function (r) { if (r.committed) { toast('🎉 隊伍成就：' + a.icon + a.name + '（+10 分）'); log('ach', '', a.k); } });
  }
  function checkAch() {
    if (!team || !teamId || !S.length) return;
    var nTeam = Object.keys(team.members || {}).length, ks = Object.keys(teamPos).filter(function (k) { return fresh(teamPos[k]); });
    function at(p) { for (var i = 0; i < S.length; i++) if (S[i].frag !== undefined && dist(p, S[i]) <= S[i].r + 30) return i; return -1; }
    if (ks.length >= 2 && ks.length >= Math.min(nTeam, 3)) {
      var where = ks.map(function (k) { return at(teamPos[k]); });
      var uniq = {}; where.forEach(function (w) { uniq[w] = 1; });
      if (where.every(function (w) { return w >= 0; }) && Object.keys(uniq).length === ks.length) awardAch(ACHS[0]);
      if (nTeam >= 2 && ks.length === nTeam && where[0] >= 0 && where.every(function (w) { return w === where[0]; })) awardAch(ACHS[1]);
    }
    if (nTeam >= 2) S.forEach(function (s) {
      var by = {}, tk = (prog[s.id] && prog[s.id].tasks) || {}; Object.keys(tk).forEach(function (t) { if (tk[t] && tk[t].by) by[tk[t].by] = 1; });
      if (Object.keys(by).length >= Math.min(3, nTeam)) awardAch(ACHS[2]);
    });
  }

  /* 走讀貼紙本：每完成一案得一張「案件貼紙」，每個隊伍成就一張「成就章」；空格是暗凹槽。貼紙＝NPC 圖示＋厚白描邊＋日期與地點 */
  function stickerSeen() { try { return JSON.parse(localStorage.getItem('walk_stk_' + teamId) || '[]'); } catch (e) { return []; } }
  function stickerMark(ids) { try { localStorage.setItem('walk_stk_' + teamId, JSON.stringify(ids)); } catch (e) { } }
  function fmtD(t) { var d = new Date(t || 0); return t ? (d.getMonth() + 1) + '/' + d.getDate() : ''; }
  function stickerBook() {
    var seen = stickerSeen(), now = [], cases = S.filter(function (x) { return x.frag !== undefined; });
    var got = 0, h = '<div class="card"><h2 class="cl-h">📒 走讀貼紙本</h2><div class="stk-grid">';
    cases.forEach(function (s) {
      var f = prog[s.id] && prog[s.id].frag, nm = s.name.replace(/^第 \d (案|章)｜/, '');
      if (f) { got++; now.push(s.id); var who = (team.members && team.members[f.by] && team.members[f.by].nick) || '';
        h += '<div class="stk' + (seen.indexOf(s.id) < 0 ? ' new' : '') + '" title="' + esc(nm) + '"><div class="stk-i">' + ((s.npc && s.npc.ava) || '📍') + '</div><div class="stk-n">' + esc(nm) + '</div><div class="stk-d">' + fmtD(f.t) + (who ? '・' + esc(who) : '') + '</div></div>';
      } else h += '<div class="stk empty" title="尚未取得"><div class="stk-i">？</div><div class="stk-n">' + esc(nm) + '</div></div>';
    });
    ACHS.forEach(function (a) {
      var ok = achDone(a.k); if (ok) { got++; now.push('a_' + a.k); }
      h += ok ? '<div class="stk seal' + (seen.indexOf('a_' + a.k) < 0 ? ' new' : '') + '" title="' + esc(a.desc) + '"><div class="stk-i">' + a.icon + '</div><div class="stk-n">' + esc(a.name) + '</div></div>'
              : '<div class="stk seal empty" title="' + esc(a.desc) + '"><div class="stk-i">？</div><div class="stk-n">' + esc(a.name) + '</div></div>';
    });
    h += '</div><div class="sub">已收集 ' + got + '／' + (cases.length + ACHS.length) + '　圓章是隊伍成就，方貼是案件。</div></div>';
    var fresh = now.filter(function (k) { return seen.indexOf(k) < 0; });
    if (fresh.length) setTimeout(function () { stickerMark(now); }, 1500);
    return h;
  }
  function achCard() {
    return '<div class="card"><b>🏅 隊伍成就（每個 +10 分）</b>' + ACHS.map(function (a) { return '<div class="sub">' + (achDone(a.k) ? '✔ ' : '🔒 ') + a.icon + '<b>' + a.name + '</b>：' + esc(a.desc) + '</div>'; }).join('') + '</div>';
  }
  function fragCount() { var n = 0; S.forEach(function (s) { if (s.frag !== undefined && prog[s.id] && prog[s.id].frag) n++; }); return n; }
  function writeScore() {
    if (!team) return; var sc = scoreOf(), key = sc + '|' + achCount() + '|' + fragCount() + '|' + team.n + '|' + modeOf() + '|' + (hqState().pk || '');
    if (key === lastScoreWritten) return; lastScoreWritten = key;
    ROOT.child((REH ? 'boardr/' : 'board/') + teamId).update({ name: teamLabel(), score: sc, frags: fragCount(), ach: achCount(), n: Object.keys(team.members || {}).length, t: nowMs(), pk: (modeOf() === 'pk' && hqState().pk) || null, mode: modeOf() });
  }
  /* 隊名：不用系名，依隊伍代號固定產生和故事有關的名字（每個人看到的一樣） */
  var NM_A = ['夜班', '月光', '提燈', '蓋章', '守夜', '迷路', '飄飄', '八億', '審查', '鐘樓', '牌樓', '涼亭'], NM_B = ['小隊', '偵探團', '巡守隊', '探險隊', '審查組', '幽靈團', '蓋章組', '守衛隊'];
  function storyName(id) { if (TWR && R0.tw) { var g = 0, j; id = String(id || ''); for (j = 0; j < id.length; j++) g = (g * 31 + id.charCodeAt(j)) >>> 0; return ['時安局', '案件', '檔案室', '守時', '校時', '鐘樓'][g % 6] + ['一組', '二組', '三組', '調查隊', '特勤組', '巡查隊'][Math.floor(g / 7) % 6]; } var h = 0, i; id = String(id || ''); for (i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return NM_A[h % NM_A.length] + NM_B[Math.floor(h / 13) % NM_B.length]; }
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
    if (view === 'task') renderTask(); if (view === 'team') renderTeam(); if (view === 'rank') renderRank(); if (view === 'hq') renderHq();
    refreshMeIcon();
    updateGoal(true);
    if (!hqChecked && team && uid && teamId) { hqChecked = true; var kk = 'walk_hq_seen_' + teamId, seen = false; try { seen = !!localStorage.getItem(kk); } catch (e) { } if (!seen) { try { localStorage.setItem(kk, '1'); } catch (e) { } setTimeout(function () { setView('hq'); }, 250); } }
  }
  /* ================= 簡報室（HQ）：任務簡報、角色、點數商店、造型 ================= */
  var SKILLS = [
    { k: 'scout', icon: '🔍', name: '偵查範圍', desc: '偵查員看得到「隱藏關卡」的距離 +20 公尺／級', max: 3, cost: [60, 120, 180] },
    { k: 'hint', icon: '📜', name: '提示折扣', desc: '要提示時扣的分數：10 → 7 → 5 → 3', max: 3, cost: [50, 100, 150] },
    { k: 'range', icon: '📍', name: '到站判定', desc: '算「到站」的範圍加大 10 公尺／級（定位不準時救命）', max: 3, cost: [40, 80, 120] }
  ];
  var GEARS = [
    { k: 'lens', icon: '🔎', name: '放大鏡', desc: '每個人的任務頁多出「資料出處」，看這一站的事實從哪來', cost: 80 },
    { k: 'kit', icon: '🩹', name: '急救包', desc: '全程有一次免費提示（不扣分）', cost: 100 },
    { k: 'radio', icon: '📻', name: '對講機', desc: '每個人都能「號召全隊集合」，不用等隊長', cost: 90 }
  ];
  var SKINS = [
    { k: 'sk_hat', e: '🕵️', n: '偵探帽' }, { k: 'sk_astro', e: '🧑‍🚀', n: '太空人' }, { k: 'sk_cat', e: '🐱', n: '貓咪' }, { k: 'sk_ghost', e: '👻', n: '小幽靈' },
    { k: 'sk_robot', e: '🤖', n: '機器人' }, { k: 'sk_ninja', e: '🥷', n: '忍者' }, { k: 'sk_mage', e: '🧙', n: '魔法師' }, { k: 'sk_dragon', e: '🐲', n: '小龍' }
  ];
  var SKIN_COST = 50;
  var hqNew = false, hqChecked = false;
  /* 每種工作各有自己的成長路線（三級）。升級由隊長或補給官在簡報室採購；效果在「隊裡有人當這個角色」時才生效 */
  var ROLE_GROW = {
    '隊長': ['其他隊員可以多換 1 次角色', '其他隊員可以多換 2 次角色', '其他隊員可以多換 3 次角色'],
    '領航員': ['任務頁多顯示「走路約幾分鐘」', '多顯示「離你最近的未完成章節」', '目標列也顯示方位箭頭'],
    '軍師': ['免費提示變成 2 則', '免費提示變成 3 則', '免費提示變成 4 則（提示用完為止）'],
    '偵查員': ['隱藏關卡獎勵 +10 分、搜索距離 +15 公尺', '獎勵 +20 分、距離 +30 公尺', '獎勵 +30 分、距離 +45 公尺'],
    '檔案官': ['每答對一題選擇題，全隊 +2 分', '每題 +4 分', '每題 +6 分'],
    '訪談員': ['問 NPC 的間隔縮短到 3 秒', '縮短到 2 秒，NPC 回答可以長一點（約 100 字）', '縮短到 1 秒，NPC 回答更完整（約 150 字）'],
    '蒐證員': ['每個拍照任務 +5 分', '每個 +10 分', '每個 +15 分'],
    '記錄官': ['每個寫字任務 +3 分', '每個 +6 分', '每個 +9 分，最後一句話再 +10 分'],
    '文化設計員': ['「文化→遊戲」那題 +5 分', '那題 +10 分', '那題 +15 分'],
    '通訊官': ['廣播求援時，同時貼到隊內訊息', '廣播多三種範本（求援、集合、報喜）', '每完成一章，自動向全場報喜'],
    '安全官': ['隊友走散超過 150 公尺，你的畫面出現紅字警示', '警示會指出隊友在哪個方位', '走散超過 200 公尺時，全隊的目標列都出現警示'],
    '補給官': ['採購打 9 折', '採購打 8 折', '採購打 7 折'],
    '鑑識員': ['觀察框架多一個例句', '寫字任務的字數門檻 −2', '字數門檻 −4，每個寫字任務再 +3 分'],
    '技術專家': ['到站判定範圍 +5 公尺', '到站判定 +10 公尺', '到站判定 +15 公尺，並顯示連線狀況'],
    '在地嚮導': ['任務頁顯示走路約幾分鐘', '多顯示路況提醒（來自現場提醒）', '多顯示預估抵達時間'],
    '扮演專員': ['NPC 回話會多一句氛圍描寫', 'NPC 回話的開頭加上動作描寫', 'NPC 回話的結尾會暗示下一站的方向（不給答案）']
  };
  var GROW_COST = [60, 120, 180];
  function rlv(role) { return ((hqState().rlv || {})[role]) || 0; }
  function rlvA(role) { return roleHolder(role) ? rlv(role) : 0; }          /* 有人當這個角色才生效 */
  function effCost(c) { return Math.round(c * (1 - 0.1 * rlvA('補給官'))); }
  function roleTaskBonus(t) {
    var b = 0, ty = t.type;
    if (t.id === 'cu') b += 5 * rlvA('文化設計員');
    else if (ty === 'ack') b += 5 * rlvA('蒐證員');
    else if (ty === 'text') { b += 3 * rlvA('記錄官'); if (rlvA('鑑識員') >= 3) b += 3; }
    if (ty === 'choice') b += 2 * rlvA('檔案官');
    return b;
  }
  function minOf(t) { var m = t.min || 2; if (t.type === 'text') m = Math.max(4, m - 2 * Math.max(0, rlvA('鑑識員') - 1)); return m; }
  function bearingText(s) {
    if (!myPos) return ''; var tr = Math.PI / 180, y = Math.sin((s.lon - myPos.lon) * tr) * Math.cos(s.lat * tr);
    var x = Math.cos(myPos.lat * tr) * Math.sin(s.lat * tr) - Math.sin(myPos.lat * tr) * Math.cos(s.lat * tr) * Math.cos((s.lon - myPos.lon) * tr);
    return BEAR[Math.round(((Math.atan2(y, x) / tr + 360) % 360) / 45) % 8];
  }
  function nearestUndone(exceptId) {
    if (!myPos) return null; var best = null, bd = 1e12;
    S.forEach(function (x) { if (x.frag === undefined || x.id === exceptId || (prog[x.id] && prog[x.id].frag)) return; var d = dist(myPos, x); if (d < bd) { bd = d; best = x; } });
    return best ? { s: best, d: Math.round(bd) } : null;
  }

  function hqState() { return (prog && prog._hq) || {}; }
  function hqLv(k) { return ((hqState().lv || {})[k]) || 0; }
  function hasGear(k) { return !!((hqState().gear || {})[k]); }
  function hqSpent() { return hqState().spent || 0; }
  function hqPoints() { return Math.max(0, scoreOf() - hqSpent()); }
  function hintPenalty(P) { var v = Math.min(0, (P.hint || 0) + [0, 3, 5, 7][Math.min(3, hqLv('hint'))]), m = modeOf(), pk = pkInfo(); return Math.round(v * (m === 'relax' ? 0.5 : m === 'timed' ? 2 : (m === 'pk' && pk && pk.mutual) ? 1.5 : 1)); }
  function canShop() { var r = myRole(); return r === '隊長' || r === '補給官'; }
  function skinOf(k) { var sk = ((hqState().skin || {})[k]); if (!sk) return null; for (var i = 0; i < SKINS.length; i++) if (SKINS[i].k === sk && (hqState().skins || {})[sk]) return SKINS[i]; return null; }
  function skinAva(k, ava, scale, walking) { var sk = skinOf(k); return sk ? '<span class="skinav">' + sk.e + '</span>' : avaHtml(ava, scale, walking); }
  function farthestMate() {
    if (!myPos) return null; var far = null;
    Object.keys(teamPos || {}).forEach(function (k) { if (k === uid || !fresh(teamPos[k])) return; var d = Math.round(dist(myPos, teamPos[k])); if (far === null || d > far) far = d; });
    return far;
  }
  function farthestDir() {
    if (!myPos) return ''; var far = null, fk = null;
    Object.keys(teamPos || {}).forEach(function (k) { if (k === uid || !fresh(teamPos[k])) return; var d = dist(myPos, teamPos[k]); if (far === null || d > far) { far = d; fk = k; } });
    return fk ? bearingText(teamPos[fk]) : '';
  }
  function hqBuy(kind, key, cost, apply, okMsg) {
    cost = effCost(cost);
    if (!canShop()) { toast('只有隊長或補給官可以採購。'); return; }
    var cur = hqPoints(); if (cost > cur) { toast('點數不夠（還差 ' + (cost - cur) + ' 點）'); return; }
    var earnedNow = scoreOf();
    ROOT.child(PR_(teamId) + '/_hq').transaction(function (c) {
      c = c || {}; if ((c.spent || 0) + cost > earnedNow) return undefined;
      if (apply(c) === false) return undefined; c.spent = (c.spent || 0) + cost; return c;
    }).then(function (r) { if (r.committed) { toast('✔ ' + okMsg); log('buy', kind, key); } else toast('買不成（點數不夠，或已經有了／被別人先買了）'); });
  }
  function worldOf() { return ((TWR && R0.tw) || !REH) ? 'tw' : (CAMP === R0.campusW ? 'night' : 'day'); }
  var SAFE = '<li>路口車多，只走人行道與斑馬線；天黑了盡量結伴。</li><li>紀念地、廟宇、校園和館內請安靜、尊重，不拍別人的臉、不拍幼兒。</li><li>找不到地點就按任務裡的 🆘，或在隊內訊息問隊友；手機快沒電先告訴隊友。</li>';
  function briefingHtml() {
    var w = worldOf(), h = '';
    if (w === 'tw') h += '<div class="bub"><b>局長（廣播）</b>：「探員，歡迎加入時安局。我們負責看守這座城市被遺忘的時間。今天有 ' + totalFrags() + ' 個案件在中西區等你，每個案件有一位線索人（NPC），他們只說一半的話，另一半要靠你到現場看。你不是超級英雄——你是一個小隊裡的專業分工。」</div>';
    else if (w === 'night') h += '<div class="bub"><b>志工站長</b>：「歡迎加入夜班審查單志工站。畢不了學姊差三格審查單就畢業，白天她已經跑過校園那一輪，今晚夜班這條路線還有三格要補蓋。你們不是來當英雄的，是來幫忙的——各自有分工，一起把單子蓋滿。」</div>';
    else h += '<div class="bub"><b>志工站長</b>：「歡迎加入審查單志工站。畢不了學姊的畢業審查單永遠差三格章，我們每個人負責一種工作，繞校園一圈幫她蓋章。你們不是來當英雄的，是來幫忙的。」</div>';
    var tot = totalFrags(), UN = w === 'tw' ? '案件章' : '審查單';
    h += '<div class="sub"><b>任務目標</b>：集滿 ' + tot + ' 格' + UN + '，回終點交單。每一站有 NPC（可以直接打字問他）、題目與一題「文化怎麼變成遊戲規則」。</div>';
    h += '<div class="sub"><b>編制</b>：下面有 ' + ROLES.length + ' 種工作，一隊一種只有一個人當，被挑走的會變灰；你們可以自己挑，隊長可以隨時換，其他人換一次。每種工作看得到的資訊不一樣，要互相報告。</div>';
    h += '<div class="sub"><b>補給</b>：每完成一個章節回來簡報室，用累積的點數升級技能、買裝備、換造型。</div>';
    h += '<div class="sub"><b>安全守則</b><ul style="margin:3px 0 0;padding-left:18px">' + SAFE + '</ul></div>';
    return h;
  }
  function shopHtml() {
    var st = hqState(), cs = canShop(), h = '<div class="card"><h2>🎒 補給站</h2><div class="sub">隊伍點數：<b>' + hqPoints() + '</b>（累積 ' + scoreOf() + '，已花 ' + hqSpent() + '）。' + (cs ? '你可以採購。' : '只有隊長或補給官可以採購，你可以先看看、跟他們討論。') + ' 花點數不會影響排行榜。</div>';
    h += '<b>技能升級</b>';
    SKILLS.forEach(function (k) {
      var lv = hqLv(k.k), max = lv >= k.max;
      h += '<div class="rolerow"><div class="rr1"><b>' + k.icon + k.name + '</b> <span class="tag">' + lv + '／' + k.max + ' 級</span></div><div class="sub">' + esc(k.desc) + '</div>' + (max ? '' : '<button class="btn2" data-buy="skill:' + k.k + '"' + (cs ? '' : ' disabled') + '>升到 ' + (lv + 1) + ' 級（' + effCost(k.cost[lv]) + ' 點）</button>') + '</div>';
    });
    h += '<b>裝備</b>';
    GEARS.forEach(function (g) {
      var own = hasGear(g.k);
      h += '<div class="rolerow' + (own ? ' mine' : '') + '"><div class="rr1"><b>' + g.icon + g.name + '</b>' + (own ? ' <span class="tag">已擁有</span>' : '') + '</div><div class="sub">' + esc(g.desc) + '</div>' + (own ? '' : '<button class="btn2" data-buy="gear:' + g.k + '"' + (cs ? '' : ' disabled') + '>購買（' + effCost(g.cost) + ' 點）</button>') + '</div>';
    });
    h += '<b>我的角色（隊伍已完成 ' + chDone() + ' 案）</b><div class="sub">隨著章節完成，更多角色慢慢開放。</div><div class="skins">';
    AVAS.forEach(function (a, i) { var need = AVA_CH[i] || 0, cur = (profile && profile.ava) === a; h += need <= chDone() ? '<button class="skinb' + (cur ? ' on' : '') + '" data-ava="' + a + '">' + avaHtml(a, 3, false) + '</button>' : '<button class="skinb lock" disabled>' + avaHtml(a, 3, false) + '<br><span class="sub">🔒 完成 ' + need + ' 案</span></button>'; });
    h += '</div>';
    h += '<b>造型（地圖上的你）</b><div class="sub">先由隊長或補給官解鎖（每款 ' + SKIN_COST + ' 點，全隊都能用），每個人再選自己要穿哪一款。</div><div class="skins">';
    var mine = (st.skin || {})[uid];
    h += '<button class="skinb' + (!mine ? ' on' : '') + '" data-skin="">預設</button>';
    SKINS.forEach(function (k) {
      var un = !!(st.skins || {})[k.k], si = SKINS.indexOf(k), need = SKIN_CH[si] || 0;
      if (!un && chDone() < need) { h += '<button class="skinb lock" disabled><span class="skinav">' + k.e + '</span>' + k.n + '<br><span class="sub">🔒 完成 ' + need + ' 案</span></button>'; return; }
      h += un ? '<button class="skinb' + (mine === k.k ? ' on' : '') + '" data-skin="' + k.k + '"><span class="skinav">' + k.e + '</span>' + k.n + '</button>'
              : '<button class="skinb lock" data-buy="skin:' + k.k + '"' + (cs ? '' : ' disabled') + '><span class="skinav">' + k.e + '</span>' + k.n + '<br><span class="sub">🔒 ' + effCost(SKIN_COST) + ' 點</span></button>';
    });
    return h + '</div></div>';
  }
  function growHtml() {
    var cs = canShop(), h = '<div class="card"><h2>🌱 角色成長</h2><div class="sub">每種工作都有自己的三級成長路線；升級由隊長或補給官採購，效果在「隊裡有人當這個角色」時生效，換人當也保留。</div>';
    ROLES.forEach(function (r) {
      var lv = rlv(r), hd = roleHolder(r), g = ROLE_GROW[r] || [];
      h += '<div class="rolerow' + (hd ? ' mine' : '') + '"><div class="rr1"><b>' + ROLE_ICON[r] + r + '</b> <span class="tag">' + lv + '／3 級</span>' + (hd ? ' <span class="sub">現任：' + esc(hd.nick || '') + '</span>' : ' <span class="sub">（目前沒人當）</span>') + '</div>';
      g.forEach(function (t, i) { h += '<div class="sub">' + (i < lv ? '✔' : '・') + ' ' + (i + 1) + ' 級：' + esc(t) + '</div>'; });
      if (lv < 3) h += '<button class="btn2" data-grow="' + r + '"' + (cs ? '' : ' disabled') + '>升到 ' + (lv + 1) + ' 級（' + effCost(GROW_COST[lv]) + ' 點）</button>';
      h += '</div>';
    });
    return h + '</div>';
  }
  function renderHq() {
    var el = $('pane-hq'); if (!el) return; hqNew = false; hqBadge();
    var h = modeHtml() + '<div class="card"><h2>🏢 任務簡報室</h2>' + briefingHtml() + '</div>' + roleCard() + orgHtml() + growHtml() + shopHtml();
    h += '<button class="btn" id="hq-go">✔ 我準備好了，出發！</button>';
    el.innerHTML = h;
    [].forEach.call(el.querySelectorAll('[data-role]'), function (b) { b.onclick = function () { switchRole(b.dataset.role); }; });
    [].forEach.call(el.querySelectorAll('[data-buy]'), function (b) {
      b.onclick = function () {
        var a = b.dataset.buy.split(':'), t = a[0], k = a[1];
        if (t === 'skill') { var sk = SKILLS.filter(function (x) { return x.k === k; })[0], lv = hqLv(k); if (!sk || lv >= sk.max) return; hqBuy('skill', k, sk.cost[lv], function (c) { c.lv = c.lv || {}; if ((c.lv[k] || 0) !== lv) return false; c.lv[k] = lv + 1; }, sk.name + ' 升到 ' + (lv + 1) + ' 級'); }
        if (t === 'gear') { var g = GEARS.filter(function (x) { return x.k === k; })[0]; if (!g || hasGear(k)) return; hqBuy('gear', k, g.cost, function (c) { c.gear = c.gear || {}; if (c.gear[k]) return false; c.gear[k] = 1; }, '買到 ' + g.name); }
        if (t === 'skin') { hqBuy('skin', k, SKIN_COST, function (c) { c.skins = c.skins || {}; if (c.skins[k]) return false; c.skins[k] = 1; }, '解鎖造型'); }
      };
    });
    [].forEach.call(el.querySelectorAll('[data-grow]'), function (b) { b.onclick = function () { var r = b.dataset.grow, lv = rlv(r); if (lv >= 3) return; hqBuy('grow', r, GROW_COST[lv], function (c) { c.rlv = c.rlv || {}; if ((c.rlv[r] || 0) !== lv) return false; c.rlv[r] = lv + 1; }, r + ' 升到 ' + (lv + 1) + ' 級'); }; });
    [].forEach.call(el.querySelectorAll('[data-skin]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/_hq/skin/' + uid).set(b.dataset.skin || null); log('skin', '', b.dataset.skin || 'default'); }; });
    [].forEach.call(el.querySelectorAll('[data-ava]'), function (b) { b.onclick = function () { var a = b.dataset.ava; if (!profile) return; profile.ava = a; try { localStorage.setItem('walk_ava', a); } catch (e) { } ROOT.child('players/' + uid + '/ava').set(a); ROOT.child('teams/' + teamId + '/members/' + uid + '/ava').set(a); renderHq(); }; });
    collapsify('pane-hq'); bindModes(el);
    var go = $('hq-go'); if (go) go.onclick = function () { setView('map'); };
  }
  function hqBadge() { var b = document.querySelector('#nav button[data-v="hq"]'); if (b) b.textContent = hqNew ? '🏢 簡報室 🆕' : '🏢 簡報室'; }
  /* ================= 遊戲模式：自在悠閒、計時賽、兩隊 PK ================= */
  function modeOf() { return hqState().mode || 'relax'; }
  function timerState() { var t = hqState().timer; return (modeOf() === 'timed' && t && t.start) ? { start: t.start, total: t.total || 90, end: t.start + (t.total || 90) * 60000 } : null; }
  function timeLeftMin() { var t = timerState(); return t ? Math.max(0, Math.ceil((t.end - nowMs()) / 60000)) : null; }
  function speedBonus(fragT) { var t = timerState(); if (!t || !fragT) return 0; var rem = (t.end - fragT) / 60000; return rem > 0 ? Math.min(40, Math.floor(rem / 2)) : 0; }
  function pkInfo() {
    var mine = hqState().pk; if (modeOf() !== 'pk' || !mine) return null; var o = board && board[mine];
    return { id: mine, name: (o && o.name) || '對手', mutual: !!(o && o.pk === teamId), their: o ? (o.score || 0) : 0, theirFrags: o ? (o.frags || 0) : 0 };
  }
  function modeHtml() {
    var m = modeOf(), cap = myRole() === '隊長', h = '<div class="card"><h2>🎮 這一趟怎麼玩</h2><div class="sub">' + (cap ? '隊長決定模式；' : '只有隊長可以改模式；') + '隨時可以換。</div>';
    h += '<div class="rolerow' + (m === 'relax' ? ' mine' : '') + '"><div class="rr1"><b>🌿 自在悠閒</b>' + (m === 'relax' ? ' <span class="tag">目前</span>' : '') + '</div><div class="sub">不計時、不比速度。慢慢逛、拍照、跟 NPC 聊。適合第一次走或想好好看建築的人。<b>得分：</b>加分題每題多 +3，提示扣分減半。</div>' + (m === 'relax' || !cap ? '' : '<button class="btn2" data-mode="relax">改成自在悠閒</button>') + '</div>';
    var tm = timerState(), left = timeLeftMin();
    h += '<div class="rolerow' + (m === 'timed' ? ' mine' : '') + '"><div class="rr1"><b>⏱ 計時賽</b>' + (m === 'timed' ? ' <span class="tag">' + (tm ? (left > 0 ? '剩 ' + left + ' 分' : '時間到') : '尚未開始') + '</span>' : '') + '</div><div class="sub">限時完成：每取得一格碎片，依剩餘時間加速度分（剩餘每 2 分鐘 +1 分，每格最多 +40）。時間到不再加分，但遊戲照玩。<b>得分：</b>速度分之外，提示扣分加倍。</div>';
    if (cap) h += [60, 90, 120].map(function (n) { return '<button class="btn2" data-timer="' + n + '">' + (tm && tm.total === n && m === 'timed' ? '重新開始 ' : '開始 ') + n + ' 分鐘</button>'; }).join(' ');
    h += '</div>';
    var pk = pkInfo(), others = Object.keys(board || {}).filter(function (k) { return k !== teamId; });
    h += '<div class="rolerow' + (m === 'pk' ? ' mine' : '') + '"><div class="rr1"><b>⚔ 兩隊 PK</b>' + (m === 'pk' ? ' <span class="tag">' + (pk ? (pk.mutual ? '對戰中' : '等對方接受') : '選對手') + '</span>' : '') + '</div><div class="sub">跟另一隊比：同樣的路線，誰的積分高、誰先集滿碎片。雙方都按下才成立，隨時可以取消。<b>得分：</b>每格碎片 +5，終點交單時分數較高的一隊再 +20，提示扣分 ×1.5。</div>';
    if (pk) h += '<div class="bub ' + (pk.mutual ? 'secret' : 'dim') + '">' + (pk.mutual ? '⚔ ' + esc(teamLabel()) + ' ' + scoreOf() + ' 分（碎片 ' + fragCount() + '）　對　' + esc(pk.name) + ' ' + pk.their + ' 分（碎片 ' + pk.theirFrags + '）' : '已向「' + esc(pk.name) + '」發出挑戰，等他們在簡報室按接受。') + '</div>';
    var inc = others.filter(function (k) { return board[k] && board[k].pk === teamId && !(pk && pk.id === k); });
    inc.forEach(function (k) { h += '<div class="bub hint">📨 「' + esc(board[k].name || k) + '」向你們下戰帖！' + (cap ? '<button class="btn2" data-pkset="' + k + '">接受挑戰</button>' : '請隊長按接受。') + '</div>'; });
    if (cap) { h += '<div class="sub">挑戰哪一隊：</div>' + (others.length ? others.map(function (k) { return '<button class="btn2" data-pkset="' + k + '">' + esc((board[k] && board[k].name) || k) + '（' + ((board[k] && board[k].score) || 0) + ' 分）</button>'; }).join(' ') : '<div class="sub">目前沒有其他隊上線。</div>'); if (m === 'pk') h += '<button class="btn2" data-mode="relax">取消 PK</button>'; }
    return h + '</div></div>';
  }
  function bindModes(el) {
    [].forEach.call(el.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/_hq').update({ mode: b.dataset.mode, pk: b.dataset.mode === 'pk' ? (hqState().pk || null) : null }); log('mode', '', b.dataset.mode); }; });
    [].forEach.call(el.querySelectorAll('[data-timer]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/_hq').update({ mode: 'timed', timer: { start: nowMs(), total: parseInt(b.dataset.timer, 10) }, pk: null }); log('mode', '', 'timed' + b.dataset.timer); toast('⏱ 開始計時 ' + b.dataset.timer + ' 分鐘！'); }; });
    [].forEach.call(el.querySelectorAll('[data-pkset]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/_hq').update({ mode: 'pk', pk: b.dataset.pkset }); log('mode', '', 'pk'); setTimeout(writeScoreForce, 300); }; });
  }
  function writeScoreForce() { lastScoreWritten = ''; writeScore(); }
  var modeTick = setInterval(function () { if (team && !document.hidden) updateGoal(true); }, 30000);
  /* 目標列：打開遊戲就知道要做什麼、現在到哪、下一步去哪 */
  function goalText() {
    if (!team || !S || !S.length) return '';
    if (REH && !tutorialOk()) { var left = R0.practice.filter(function (t) { return !pdone(t.id); }).length; return '🎯 目標：先完成教學關（還剩 ' + left + ' 項），再出發去蓋審查單。'; }
    var total = totalFrags(), got = fragCount();
    if (prog.final && prog.final.done) return '🎉 完成了！把「練習日全破」那一頁截圖交上來。';
    var nxt = null, i; for (i = 0; i < S.length; i++) { if (S[i].frag !== undefined && !(prog[S[i].id] && prog[S[i].id].frag)) { nxt = S[i]; break; } }
    if (!nxt) nxt = S.filter(function (x) { return x.final; })[0] || S[S.length - 1];
    var d = myPos ? ' ・約 ' + Math.round(dist(myPos, nxt)) + ' 公尺' + (myRole() === '領航員' && rlvA('領航員') >= 3 ? '，往' + bearingText(nxt) : '') : '';
    var wf = farthestMate(); if (rlvA('安全官') >= 3 && wf !== null && wf > 200) d += ' ・⚠ 有隊友離你 ' + wf + ' 公尺，等一等';
    var UN = (TWR && R0.tw) ? '案件章' : '審查單';
    var mx = ''; if (modeOf() === 'timed' && timerState()) { var tl = timeLeftMin(); mx = tl > 0 ? ' ・⏱ 剩 ' + tl + ' 分' : ' ・⏱ 時間到（不再加速度分）'; } if (modeOf() === 'relax') mx += ' ・🌿 悠閒模式'; var pki = pkInfo(); if (pki && pki.mutual) mx += ' ・⚔ ' + scoreOf() + ' 對 ' + pki.their + '（' + esc(pki.name) + '）';
    if (got >= total) return '🎯 目標：' + total + ' 格都蓋滿了！回「' + nxt.name + '」交' + (UN === '案件章' ? '案件檔' : '審查單') + '，寫下最後一句。' + mx;
    return '🎯 目標：集滿 ' + total + ' 格' + UN + '（已 ' + got + '/' + total + '）・下一站：' + nxt.name + d + mx;
  }
  var goalT = 0;
  function updateGoal(force) {
    var g = $('goal'); if (!g) return; var n = Date.now(); if (!force && n - goalT < 4000) return; goalT = n;
    var t = goalText(); g.textContent = t; g.style.display = t ? '' : 'none';
    g.onclick = function () { var nx = S.filter(function (x) { return x.frag !== undefined && !(prog[x.id] && prog[x.id].frag); })[0] || S[S.length - 1]; if (nx) { curStop = nx.id; setView('task'); } };
  }
  function myRole() { return (team && team.members[uid] && team.members[uid].role) || ROLES[0]; }
  function renderTask() {
    try { hiliCircles(); } catch (e) {}
    var s = stopById(curStop || S[0].id) || S[0], p = prog[s.id] || {}, h = '';
    var WR = CAMP === R0.campusW;
    if (REH && !tutorialOk()) {
      $('pane-task').innerHTML = practiceHtml() + '<div class="card">🔒 校園任務要先完成上面的教學關，完成後才會解鎖。</div>';
      [].forEach.call(document.querySelectorAll('[data-pack]'), function (b) { b.onclick = function () { pmark(b.dataset.pack); }; });
      return;
    }
    if (REH) h = (allDone() ? certHtml() : '') + practiceHtml() + '<h2>' + ((TWR && R0.tw) ? '中西區九案：' : '校園試玩：') + esc(CAMP.name) + '</h2><div class="sub">' + ((TWR && R0.tw) ? '九個案子同時在地圖上，不分先後，挑你想去的；每一案的事實都有出處，每一站都有一題「文化怎麼變成遊戲規則」。到不了現場可以按 🆘 或「我不在現場，先聊聊」。' : WR ? '從 W 棟出發，到門口繞一圈，約 10–15 分鐘；鬼故事都是工坊編的，姑婆廟是真的廟，請小聲、尊重。' : '從 E 棟出發繞一圈，約 10–15 分鐘；校史小知識都來自學校通識電子報。') + '</div>';
    h += '<div class="chips">' + S.map(function (x, i) { var st = (prog[x.id] && prog[x.id].frag) ? 'ok' : (prog[x.id] && prog[x.id].arrived ? 'half' : ''); return '<button class="chip ' + st + (x.id === s.id ? ' cur' : '') + '" data-s="' + x.id + '">' + i + '<br><span class="cd" data-cd="' + x.id + '">' + (myPos ? dTxt(dist(myPos, x)) : '') + '</span></button>'; }).join('') + '</div>';
    h += '<h2>' + esc(s.name) + '</h2><div class="sub">' + (REH ? '' : esc(s.time) + ' 起・') + '約 ' + s.min + ' 分' + (s.frag !== undefined ? '・碎片「' + esc(R.fragmentNames[s.frag]) + '」' + (p.frag ? ' ✔' : '') : '') + '</div>';
    h += '<div class="sub" id="cur-dist">' + distLine(s) + '</div>';
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
    collapsify(); bindNavSet();
    [].forEach.call(document.querySelectorAll('.chip'), function (b) { b.onclick = function () { curStop = b.dataset.s; renderTask(); }; });
    [].forEach.call(document.querySelectorAll('[data-pack]'), function (b) { b.onclick = function () { pmark(b.dataset.pack); }; });
    [].forEach.call(document.querySelectorAll('[data-arr]'), function (b) { b.onclick = function () { ROOT.child(PR_(teamId) + '/' + b.dataset.arr + '/arrived').transaction(function (c) { return c === null ? { by: uid, t: nowMs(), manual: 1 } : undefined; }); }; });
    [].forEach.call(document.querySelectorAll('[data-sos]'), function (b) { b.onclick = function () {
      var st = stopById(b.dataset.s), key = 'sos' + b.dataset.s + b.dataset.sos; sosN[key] = (sosN[key] || 0) + 1; log('sos', st.id, 'press ' + sosN[key]);
      if (sosN[key] === 1) {
        chatSend('tchat/' + teamId, { uid: uid, n: (profile && profile.nick) || '?', x: ('🆘 我找不到「' + st.name + '」，有人知道在哪嗎？').slice(0, 100), call: 1, t: nowMs() });
        toast('已通知隊友。打開地圖頁，看綠色虛線圈就是這一站；領航員能看到距離與方向。還是找不到，再按一次這顆鈕，就直接算你到了。');
      } else { toast('好，這一站先算你到了，繼續往下走～'); markTask(b.dataset.s, b.dataset.sos, { soft: true, sos: 1 }); var rr = ROOT.child(PR_(teamId) + '/' + b.dataset.s + '/arrived'); rr.transaction(function (c) { return c === null ? { by: uid, t: nowMs(), manual: 1 } : undefined; }); }
    }; });
    [].forEach.call(document.querySelectorAll('[data-secret]'), function (b) { b.onclick = function () { var sid = b.dataset.secret; ROOT.child(PR_(teamId) + '/' + sid + '/secret').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) { toast('🎉 隱藏關卡解開！全隊 +15 分'); log('secret', sid, 'found'); } }); }; });
    [].forEach.call(document.querySelectorAll('[data-ask]'), function (b) { b.onclick = function () { var st = stopById(b.dataset.s); log('npc', b.dataset.s, b.dataset.ask); toast(b.dataset.ask === 'who' ? st.npc.name + '：' + st.npc.voice : st.npc.open.join(' ')); }; });
    bindNpcBox();
    [].forEach.call(document.querySelectorAll('[data-sosall]'), function (b) { b.onclick = function () { var st = stopById(b.dataset.sosall), nm = st.name.replace(/^第 \d (案|章)｜/, ''), k = b.dataset.k || 'help', t = k === 'meet' ? ('📍 ' + teamLabel() + '在「' + nm + '」集合') : k === 'cheer' ? ('🎉 ' + teamLabel() + '完成了「' + nm + '」') : ('🆘 ' + teamLabel() + '在「' + nm + '」需要協助'); if (chatSend('gchat', { uid: uid, n: (profile && profile.nick) || '', x: t.slice(0, 40), t: nowMs() })) { if (rlvA('通訊官') >= 1) ROOT.child('tchat/' + teamId).push({ uid: uid, n: (profile && profile.nick) || '', x: ('📡 已廣播：' + t).slice(0, 100), t: nowMs() }); toast('已廣播給全場'); } }; });
    [].forEach.call(document.querySelectorAll('[data-call]'), function (b) { b.onclick = function () { var st = stopById(b.dataset.call); chatSend('tchat/' + teamId, { uid: uid, n: (profile && profile.nick) || '隊長', x: ('📣 隊長號召：大家到「' + st.name + '」集合！').slice(0, 100), call: 1, t: nowMs() }); }; });
    [].forEach.call(document.querySelectorAll('[data-hint]'), function (b) { b.onclick = function () { useHint(b.dataset.hint); }; });
    [].forEach.call(document.querySelectorAll('[data-ans]'), function (b) { b.onclick = function () { answer(b.dataset.s, b.dataset.t, b.dataset.ans); }; });
    [].forEach.call(document.querySelectorAll('[data-text]'), function (b) { b.onclick = function () { submitText(b.dataset.s, b.dataset.t); }; });
    [].forEach.call(document.querySelectorAll('[data-ack]'), function (b) { b.onclick = function () { markTask(b.dataset.s, b.dataset.ack); }; });
    [].forEach.call(document.querySelectorAll('[data-mv]'), function (b) { b.onclick = function () { moveCard(b.dataset.s, +b.dataset.i, +b.dataset.mv); }; });
    [].forEach.call(document.querySelectorAll('[data-ord]'), function (b) { b.onclick = function () { checkOrder(b.dataset.s, b.dataset.t); }; });
    var fb = document.getElementById('final-go'); if (fb) fb.onclick = submitFinal;
    var pf = $('ph-file'), pf2 = $('ph-file2'); if (pf) { pf.onchange = function () { if (pf.files && pf.files[0]) sendPhoto(pf.files[0]); pf.value = ''; }; if (pf2) pf2.onchange = function () { if (pf2.files && pf2.files[0]) sendPhoto(pf2.files[0]); pf2.value = ''; }; $('ph-wall').onclick = openWall; }
  }
  /* ---------- 照片：拍照 → 縮成原圖(老師看)＋縮圖(照片牆) → 一次寫入 ---------- */
  var photoN = 0;
  function photoCardHtml() {
    return '<div class="card"><b>📷 拍一張</b><div class="sub">拍這一站看到的東西，會放上照片牆。請不要拍到別人的臉。</div><input class="inp" id="ph-cap" maxlength="40" placeholder="一句話說明（可不寫）"><label class="btn2" style="display:inline-block">📸 拍照<input id="ph-file" type="file" accept="image/*" capture="environment" hidden></label> <label class="btn2" style="display:inline-block">🖼 從相簿選<input id="ph-file2" type="file" accept="image/*" hidden></label><button class="btn2" id="ph-wall">🖼 看照片牆</button><div class="sub" id="ph-msg"></div></div>';
  }
  function shrink(file, max, q, limit) {
    function fin(src, w, h, ok, no) {
      var k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      var d = c.toDataURL('image/jpeg', q);
      while (d.length > limit && q > 0.2) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
      d.length > limit ? no(new Error('照片太大，換一張試試')) : ok(d);
    }
    return new Promise(function (ok, no) {
      var viaImg = function () {
        var url = URL.createObjectURL(file), im = new Image();
        im.onerror = function () { URL.revokeObjectURL(url); no(new Error('讀不到這張照片（可能是 HEIC 等特殊格式）。請改按「拍照」，或選別張 JPG／PNG')); };
        im.onload = function () { URL.revokeObjectURL(url); fin(im, im.width, im.height, ok, no); };
        im.src = url;
      };
      if (window.createImageBitmap) {
        createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { fin(b, b.width, b.height, ok, no); }).catch(viaImg);
      } else viaImg();
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
    }).catch(function (e) {
      var perm = e && /PERMISSION_DENIED|permission/i.test((e.code || '') + (e.message || ''));
      msg.textContent = perm ? '傳不出去：你的隊伍資料對不上。請按右上角重新整理後再傳，還是不行請按「回報」。' : '傳不出去：' + (e.message || e);
      log('photo_err', curStop, String((e && (e.code || e.message)) || e).slice(0, 120));
    });
  }
  function openWall() {
    $('phm').hidden = false; $('ph-grid').innerHTML = '<div class="sub">載入中…</div>';
    ROOT.child('pth').orderByChild('tid').equalTo(teamId).limitToLast(40).once('value').then(function (s) {
      var v = s.val() || {}, ids = Object.keys(v).sort(function (a, b) { return v[b].t - v[a].t; });
      $('ph-grid').innerHTML = ids.length ? ids.map(function (id) { var p = v[id]; return '<figure class="phi"><img src="' + p.th + '" alt=""><figcaption><b>' + esc(p.nick || '') + '</b> ' + esc(p.cap || '') + '</figcaption></figure>'; }).join('') : '<div class="sub">你們隊還沒有照片，你來拍第一張！</div>';
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
    if (done === P.length) h += '<div class="bub done">🎉 清單完成！接著' + ((TWR && R0.tw) ? '到中西區走走，完成下面的案件。' : '出 ' + (CAMP === R0.campusW ? 'W' : 'E') + ' 棟繞一圈，完成下面的校園試玩關卡。') + '</div>';
    return h + '</div>';
  }
  var practiceHooked = false;
  /* 任務頁的小卡片可收合：點卡片標題（第一行）收起／展開；記住每張卡的狀態 */
  var clState = {};
  function collapsify(pid) {
    var pane = $(pid || 'pane-task'); if (!pane) return;
    [].forEach.call(pane.children, function (el, i) {
      if (!/(^|\s)(card|npc|task)(\s|$)/.test(el.className)) return;
      var hd = el.firstElementChild; if (!hd || el.children.length < 2) return;
      if (pid && !/^(B|H2|H3|STRONG)$/.test(hd.tagName)) return;
      var key = (pid || '') + (curStop || '') + ':' + i + ':' + el.className.split(' ')[0];
      hd.classList.add('cl-h'); if (clState[key]) el.classList.add('cl-collapsed');
      hd.onclick = function (e) { if (e.target.closest('button,a,input,textarea')) return; var c = el.classList.toggle('cl-collapsed'); clState[key] = c; };
    });
  }
  /* NPC 自由對話：電腦端常駐程式回答；心跳過期（關機／沒開）就退回預寫台詞按鈕，遊戲照玩 */
  var npcd = {}, svOff = 0, npcAns = {}, npcAsk = {};
  try { npcAsk = JSON.parse(localStorage.getItem('walk_npcask_' + (uid || '')) || '{}'); } catch (e) { npcAsk = {}; }
  function npcLive() { return !!(npcd && npcd.on && npcd.hb && (Date.now() + svOff - npcd.hb) < 90000); }
  function npcLogHtml(sid) {
    var ids = Object.keys(npcAsk).filter(function (k) { return npcAsk[k].s === sid; }).sort().slice(-4), h = '';
    ids.forEach(function (k) {
      h += '<div class="bub me">🙋 ' + esc(npcAsk[k].q) + '</div>';
      h += npcAns[k] ? '<div class="bub">' + esc(npcAns[k].a) + '</div>' : '<div class="bub dim">（想一下…）</div>';
    });
    return h;
  }
  function npcBoxHtml(s) {
    var h = '<div class="npcbox" data-box="' + s.id + '"><div class="npclog" id="npclog-' + s.id + '">' + npcLogHtml(s.id) + '</div>';
    if (npcLive()) h += '<div class="npcin"><input class="inp" id="npcq-' + s.id + '" maxlength="100" placeholder="想問' + esc(s.npc.name) + '什麼？（100 字內）"><button class="btn2" data-npcsend="' + s.id + '">送出</button></div>';
    else h += '<div class="sub">💬 ' + esc(s.npc.name) + '現在只能用上面的按鈕聊天（自由提問暫時沒開）。</div>';
    return h + '</div>';
  }
  function refreshNpcBox() {
    [].forEach.call(document.querySelectorAll('.npcbox'), function (b) {
      var sid = b.dataset.box, st = stopById(sid), lg = document.getElementById('npclog-' + sid), inp = document.getElementById('npcq-' + sid);
      if (!st) return; if (lg) { lg.innerHTML = npcLogHtml(sid); lg.scrollTop = lg.scrollHeight; }
      if (!!inp !== npcLive() && document.activeElement !== inp) { var tmp = document.createElement('div'); tmp.innerHTML = npcBoxHtml(st); b.parentNode.replaceChild(tmp.firstChild, b); bindNpcBox(); }
    });
  }
  var npcLast = 0;
  function bindNpcBox() {
    [].forEach.call(document.querySelectorAll('[data-npcsend]'), function (b) {
      var sid = b.dataset.npcsend, inp = document.getElementById('npcq-' + sid);
      function go() {
        var q = (inp.value || '').trim(); if (!q) return;
        if (Date.now() - npcLast < (myRole() === '訪談員' ? [4000, 3000, 2000, 1000][Math.min(3, rlvA('訪談員'))] : 4000)) { toast('慢一點，等 NPC 回完再問～'); return; }
        npcLast = Date.now(); inp.value = '';
        var ref = ROOT.child('npcq').push(), id = ref.key, p = prog[sid] || {};
        npcAsk[id] = { s: sid, q: q.slice(0, 100) };
        try { localStorage.setItem('walk_npcask_' + uid, JSON.stringify(npcAsk)); } catch (e) { }
        refreshNpcBox();
        ref.set({ uid: uid, q: q.slice(0, 100), stop: sid, hl: p.hints || 0, rl: myRole(), lv: rlvA(myRole()), t: nowMs() }).catch(function (e) { toast('傳不出去：' + ((e && e.message) || e)); });
        log('npcq', sid, q.length);
      }
      b.onclick = go; if (inp) inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
    });
  }
  /* 人格類型晶片（沿用急診室做法）：四碼文字＋象限色＋問法提示，顏色旁一定有字 */
  function npcTypeHtml(n) {
    var t = window.WALK_NPC_TYPE && window.WALK_NPC_TYPE(n.name); if (!t) return '';
    return '<div class="mbti" style="background:' + t.q.bg + ';border:2px solid ' + t.q.color + ';color:#1b1b1b"><b>' + t.type + '・' + esc(t.label) + '</b>　' + esc(t.q.short) + (myRole() === '訪談員' ? '<div class="sub" style="color:#333">💡 問法：' + esc(t.open) + '。<br>⚠ 容易被冷處理：' + esc(t.cold) + '。</div>' : '<div class="sub" style="color:#333">🎤 想知道怎麼問他才會開口？請隊裡的「訪談員」來看。</div>') + '</div>';
  }
  /* NPC 簡短故事與設定：一眼看懂這個人是誰、怎麼跟他說話、他能給你什麼 */
  function npcBlurbHtml(n) {
    var b = window.WALK_NPC_BLURB && window.WALK_NPC_BLURB(n.name); if (!b) return '';
    return '<div class="nblurb"><div>📖 ' + esc(b.story) + '</div><div class="sub">特色：' + esc(b.trait) + '　給你：' + esc(b.gives) + '</div><div>' + (b.tag || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join(' ') + '</div></div>';
  }
  function npcHtml(s, p) {
    var n = s.npc, used = p.hints || 0, h = '<div class="npc"><div class="nhd"><span class="nava">' + n.ava + '</span><b>' + esc(n.name) + '</b></div>' + npcBlurbHtml(n) + npcTypeHtml(n);
    if (!(p.arrived || TEST)) { h += '<div class="bub dim">（還沒走到這裡，' + esc(n.name) + '還在趕路…）</div><button class="btn2" data-arr="' + s.id + '">我不在現場，先聊聊</button></div>'; return h; }
    n.open.forEach(function (l) { h += '<div class="bub">' + esc(l) + '</div>'; });
    h += '<div class="bub clue">' + esc(n.clue) + '</div>';
    for (var i = 0; i < used && i < n.hints.length; i++) h += '<div class="bub hint">' + esc(n.hints[i]) + '</div>';
    if (p.frag || (s.final && prog.final && prog.final.done)) h += '<div class="bub done">' + esc(n.done) + '</div>';
    Object.keys(p.tasks || {}).forEach(function (k) { var t = (s.tasks || []).filter(function (x) { return x.id === k; })[0]; if (t && t.reward) h += '<div class="bub reward">' + esc(t.reward) + '</div>'; });
    if (!p.frag && used < n.hints.length) h += '<button class="btn2" data-hint="' + s.id + '">再給我一點提示（−10 分，剩 ' + (n.hints.length - used) + ' 次）</button>';
    h += '<div class="opts"><button class="btn2" data-ask="open" data-s="' + s.id + '">再聽一次開場</button><button class="btn2" data-ask="who" data-s="' + s.id + '">你是誰？</button></div>' + npcBoxHtml(s);
    return h + roleHtml(s, p) + '</div>';
  }
  var BEAR = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
  function roleHtml(s, p) {
    var r = myRole(), h = '<div class="roleskill">';
    if (s.secret) {
      if (p.secret) h += '<div class="bub secret">🔍 隱藏關卡已解開 ✔ ' + esc(s.secret) + '</div>';
      else if (r === '偵查員') {
        var dd = myPos ? Math.round(dist(myPos, s)) : null, near = TEST || (dd !== null && dd <= (s.r || 50) + 40 + 20 * hqLv('scout') + 15 * rlvA('偵查員'));
        if (near) h += '<div class="bub secret">🔍 偵查員發現隱藏關卡：' + esc(s.secret) + '</div><button class="btn2" data-secret="' + s.id + '">✔ 我找到了（全隊 +15 分）</button>';
        else h += '<div class="bub dim">🔍 這一站有隱藏關卡，走到離這裡 ' + ((s.r || 50) + 40 + 20 * hqLv('scout') + 15 * rlvA('偵查員')) + ' 公尺內才看得到' + (dd !== null ? '（你現在約 ' + dd + ' 公尺）' : '（要先允許定位）') + '。</div>';
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
    if (r === '軍師' && s.npc && s.npc.hints) { var fh = [], fi; for (fi = 0; fi <= rlvA('軍師') && fi < s.npc.hints.length; fi++) if (!/^答案/.test(s.npc.hints[fi]) && !(p.hints > fi)) fh.push(s.npc.hints[fi]); if (fh.length) h += '<div class="bub hint">📜 軍師的筆記（免費）：' + fh.map(esc).join('<br>') + '</div>'; }
    if (r === '隊長' || hasGear('radio')) h += '<button class="btn2" data-call="' + s.id + '">📣 號召全隊到這一站集合</button>';
    if (r === '檔案官' && s.note) h += '<div class="bub hint">🗂️ 檔案官：資料出處與可信度——' + esc(s.note) + '</div>';
    else if (hasGear('lens') && s.note) h += '<div class="bub hint">🔎 放大鏡：' + esc(s.note) + '</div>';
    if (r === '通訊官') h += '<button class="btn2" data-sosall="' + s.id + '" data-k="help">📡 向全場廣播求援</button>' + (rlvA('通訊官') >= 2 ? '<button class="btn2" data-sosall="' + s.id + '" data-k="meet">📡 廣播：在這裡集合</button><button class="btn2" data-sosall="' + s.id + '" data-k="cheer">📡 廣播：報喜</button>' : '');
    if (r === '安全官') {
      var far = farthestMate(), la = rlvA('安全官'), warn = far !== null && far > 150 && la >= 1;
      h += '<div class="bub ' + (warn ? 'secret' : 'hint') + '">🦺 安全官：' + (far !== null ? '離你最遠的隊友約 ' + far + ' 公尺。' + (warn ? '<b>⚠ 走散了，等一等隊友！</b>' + (la >= 2 ? '（在你的' + farthestDir() + '方）' : '') : '') : '等隊友打開定位，才算得出走散的距離。') + (s.tip ? '<br>現場提醒：' + esc(s.tip) : '') + '</div>';
    }
    if (r === '領航員' && myPos) {
      var ln = rlvA('領航員');
      if (ln >= 1) h += '<div class="bub hint">🧭 走到這一站約 ' + Math.max(1, Math.round(dist(myPos, s) * 1.3 / 80)) + ' 分鐘。</div>';
      if (ln >= 2) { var nu = nearestUndone(s.id); if (nu) h += '<div class="bub hint">🧭 離你最近的未完成章節：「' + esc(nu.s.name.replace(/^第 \d (案|章)｜/, '')) + '」，約 ' + nu.d + ' 公尺，往' + bearingText(nu.s) + '。</div>'; }
    }
    if (r === '在地嚮導' && myPos) {
      var lg = rlvA('在地嚮導'), mins = Math.max(1, Math.round(dist(myPos, s) * 1.3 / 80));
      if (lg >= 1) h += '<div class="bub hint">🗺️ 走過去約 ' + mins + ' 分鐘。</div>';
      if (lg >= 2 && s.tip) h += '<div class="bub hint">🗺️ 路況提醒：' + esc(s.tip) + '</div>';
      if (lg >= 3) { var eta = new Date(Date.now() + mins * 60000); h += '<div class="bub hint">🗺️ 現在出發，預計 ' + ('0' + eta.getHours()).slice(-2) + ':' + ('0' + eta.getMinutes()).slice(-2) + ' 抵達。</div>'; }
    }
    if (r === '技術專家' && rlvA('技術專家') >= 3) h += '<div class="bub hint">🛠️ 連線狀況：' + (navigator.onLine === false ? '離線中——先到有訊號的地方' : '正常') + '。</div>';
    if (r === '文化設計員') h += '<div class="bub hint">🎎 文化設計員：想一想這一站的文化要素屬於哪一類——物件・地點／行為・儀式／人際關係／禁忌・規矩／時間節奏。</div>';
    if (r === '鑑識員') h += '<div class="bub hint">🔬 鑑識員的觀察框架：形狀・材質・新舊・文字・數字——每一項各找一個細節，寫觀察題就有東西寫。' + (rlvA('鑑識員') >= 1 ? '<br>例句：「門框是磚砌的，顏色比旁邊的牆新，上面刻了一行看不清的字。」' : '') + '</div>';
    if (r === '技術專家') h += '<div class="bub hint">🛠️ 技術專家：' + (myPos ? '目前定位精度約 ' + Math.round(myPos.acc || 0) + ' 公尺' + ((myPos.acc || 0) > 50 ? '，偏大——請到空曠處、打開精確位置、關閉低耗電模式。' : '，狀況不錯。') : '還沒抓到定位——請允許定位、到空曠處。') + '</div>';
    if (r === '在地嚮導') h += '<div class="bub hint">🗺️ 在地嚮導：' + (myPos ? '走到「' + esc(s.name.replace(/^第 \d (案|章)｜/, '')) + '」約 ' + Math.max(1, Math.round(dist(myPos, s) * 1.3 / 80)) + ' 分鐘（直線距離估算）。路口走斑馬線，天黑走有燈的路。' : '等定位出來才算得出走路時間。') + '</div>';
    if (r === '補給官') h += '<div class="bub hint">🎒 補給官：隊伍點數 ' + hqPoints() + '，到「簡報室」採購。</div>';
    return h + '</div>';
  }
  /* 題型 → 負責角色。隊裡有這個角色的人，就由他作答；沒有這個角色（人不夠）就任何人都能答 */
  var TASK_ROLE = { choice: ['軍師'], order: ['軍師'], text: ['記錄官', '偵查員'], ack: ['蒐證員', '隊長'], cu: ['文化設計員', '記錄官', '偵查員'] };
  /* ---------- 時安局探員：16 個職務各有一位探員（名字、個性、屬性、技能、搭檔）。頭像第一次進簡報室才載入；省電模式用職務圖示 ---------- */
  function agOf(r) { return window.WALK_AGENTS ? WALK_AGENTS.get(r) : null; }
  var AG_IMG_ON = false;   /* 頭像要等重新設計（臺灣人長相、真實參考照片）後才開 */
  function agImg(r, px) {
    var g = agOf(r); if (!g || !AG_IMG_ON || ecoOn || (navigator.connection && navigator.connection.saveData)) return '';
    return '<img class="agimg" src="' + g.img + '" width="' + px + '" height="' + px + '" loading="lazy" decoding="async" alt="">';
  }
  function agStats(g) {
    if (!g || !g.stats || !window.WALK_AGENT_STATS) return '';
    return WALK_AGENT_STATS.names.map(function (n, i) { var v = g.stats[i] || 0; return n + ' ' + '●●●●●'.slice(0, v) + '○○○○○'.slice(0, 5 - v); }).join('　');
  }
  var ST_TAG = { done: '已啟用', part: '部分啟用', plan: '設計中' };
  function agSummary(r) {
    var g = agOf(r); if (!g) return '';
    var t = '<div class="agbox">' + agImg(r, 72) + '<div><b>' + esc(g.name) + '</b>（' + esc(g.nick) + '）・' + esc(g.mbti) + '・' + esc(g.dept) + '處' + (g.fl ? '<br><span class="tag">' + ({ A: '廟埕科技', B: '老街職人', C: '台江海風', D: '古蹟修復' }[g.fl[0]]) + '・' + esc(g.fl[1]) + '</span>' : '') + '<br><span class="sub">「' + esc(g.motto) + '」</span></div></div>';
    t += '<div class="sub">' + esc(g.bio || '') + '</div>';
    if (g.stats) t += '<div class="sub">屬性：' + esc(agStats(g)) + '</div>';
    if (g.active) t += '<div class="sub">主動技「' + esc(g.active.name) + '」：' + esc(g.active.desc) + (g.grow && g.grow[1] ? '（' + (ST_TAG[g.grow[1].st] || '') + '）' : '') + '</div>';
    if (g.rel) t += '<div class="sub">搭檔：' + esc(g.rel.partner || g.pair || '') + '。' + esc(g.rel.note || '') + '</div>';
    return t;
  }
  function pairActive() {
    if (!window.WALK_AGENTS) return [];
    return WALK_AGENTS.pairs().filter(function (p) { var a = roleHolder(p[0]), b = roleHolder(p[1]); return a && b && a.uid !== b.uid; });
  }
  function pairBonusN() { try { return pairActive().length; } catch (e) { return 0; } }
  function orgHtml() {
    if (!window.WALK_AGENTS) return '';
    var W = WALK_AGENTS, pa = pairActive(), h = '<div class="card"><h2>🧭 時安局編制與搭檔</h2><div class="sub">十六位探員分七個處。搭檔的兩個職務由不同的人擔任時，每取得一格碎片，全隊 +5 分（現在成立 ' + pa.length + ' 組' + (pa.length ? '：' + pa.map(function (p) { return p[0] + '＋' + p[1]; }).join('、') : '') + '）。</div>';
    Object.keys(W.depts).forEach(function (d) {
      var rs = W.order.filter(function (r) { return W.get(r).dept === d; }); if (!rs.length) return;
      h += '<div class="rolerow"><div class="rr1"><b>' + esc(d) + '處</b> <span class="sub">' + esc(W.depts[d].line) + '（上司：' + esc(W.depts[d].boss) + '）</span></div><div class="orgrow">' + rs.map(function (r) { var g = W.get(r), hd = roleHolder(r); return '<span class="orgm' + (hd ? ' on' : '') + '">' + (agImg(r, 40) || ROLE_ICON[r]) + '<br>' + esc(g.name) + '<br><span class="sub">' + r + (hd ? '・' + esc(hd.nick || '') : '') + '</span></span>'; }).join('') + '</div></div>';
    });
    return h + '</div>';
  }
  function roleHolder(role) { var m = (team && team.members) || {}, k; for (k in m) if (m[k].role === role) return { uid: k, nick: m[k].nick }; return null; }
  function blockedBy(t) {
    var list = TASK_ROLE[t.id === 'cu' ? 'cu' : t.type]; if (!list || t.bonus) return null;
    for (var i = 0; i < list.length; i++) { var h = roleHolder(list[i]); if (h) return h.uid === uid ? null : { role: list[i], nick: h.nick }; }
    return null;
  }
  function taskHtml(s, t) {
    var d = taskDone(s.id, t.id), h = '<div class="task' + (d ? ' done' : '') + (t.bonus ? ' bonus' : '') + '"><div class="tt">' + (d ? '✔ ' : '') + (t.bonus ? '<span class="tag">協力加分</span> ' : '') + esc(t.title) + '</div>';
    if (!d) {
      if (t.type === 'zone') h += '<div class="sub">走到圍欄裡就會自動完成（地圖上的綠色虛線圈）。</div><button class="btn2" data-sos="' + t.id + '" data-s="' + s.id + '">🆘 找不到這裡？</button>';
      if (t.type === 'together' || t.type === 'cross') h += '<div class="sub">隊友同時到位就會自動完成，沒做到也不影響主線。</div>';
      var zl = t.type === 'zone' ? [zoneOf(s, t.zone)] : t.type === 'cross' ? [zoneOf(s, t.zones[0]), zoneOf(s, t.zones[1])] : t.type === 'together' ? [s] : [];
      zl.forEach(function (z) { if (z) h += '<a class="btn2 gm" target="_blank" rel="noopener" href="' + navUrl(z) + '">🧭 導航到' + esc(z.name || s.name) + (myPos ? '（' + dTxt(dist(myPos, z)) + '）' : '') + '</a>'; });
      var bk = blockedBy(t);
      if (bk) h += '<div class="sub">👥 這題由 ' + ROLE_ICON[bk.role] + bk.role + '「' + esc(bk.nick || '') + '」來回答。你可以在隊內訊息提供意見，或到「隊伍」頁換角色。</div>';
      else {
      if (t.type === 'ack') h += '<button class="btn2" data-ack="' + t.id + '" data-s="' + s.id + '">我拍好了</button>';
      if (t.type === 'choice') h += '<div class="opts">' + t.options.map(function (o) { return '<button class="btn2" data-s="' + s.id + '" data-t="' + t.id + '" data-ans="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      if (t.type === 'text') h += '<input id="tx-' + t.id + '" class="inp" placeholder="寫在這裡"><button class="btn2" data-text="1" data-s="' + s.id + '" data-t="' + t.id + '">送出</button>';
      if (t.type === 'order') h += orderHtml(s, t);
      }
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
  var wrong = {}, sosN = {};
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
    if (v.length < minOf(t)) { toast('再多寫一點點（至少 ' + minOf(t) + ' 個字）。'); return; }
    log('keyword', sid, v); markTask(sid, tid, { text: v.slice(0, 60) });
  }
  function useHint(sid) {
    try { window.WalkSfx && WalkSfx.play('hint'); } catch (e) { }
    var s = stopById(sid), p = prog[sid] || {}, n = p.hints || 0; if (n >= s.npc.hints.length) return;
    ROOT.child(PR_(teamId) + '/' + sid + '/hints').transaction(function (c) { return (c || 0) === n ? n + 1 : undefined; }).then(function (r) { if (r.committed) log('hint', sid, 'level ' + (n + 1)); });
  }
  function finalHtml() {
    var ok = fragCount() >= totalFrags(), d = prog.final && prog.final.done, h = '<div class="card"><b>' + esc(R.finalTask.title) + '</b>';
    if (d) return h + '<div class="bub done">交給' + (worldOf() === 'tw' ? '時安局' : '志工站長') + '了：「' + esc(prog.final.text) + '」</div></div>';
    if (!ok) return h + '<div class="sub">還差 ' + (totalFrags() - fragCount()) + ' 塊碎片。</div></div>';
    var cap = roleHolder('記錄官') || roleHolder('隊長'); if (cap && cap.uid !== uid) return h + '<div class="sub">三格都蓋滿了！最後一句話由 ' + (roleHolder('記錄官') ? ROLE_ICON['記錄官'] + '記錄官' : ROLE_ICON['隊長'] + '隊長') + '「' + esc(cap.nick || '') + '」寫，大家可以在隊內訊息一起想。</div></div>';
    return h + '<textarea id="final-tx" class="inp" rows="3" placeholder="寫一句話"></textarea><button id="final-go" class="btn2">交給時安局</button></div>';
  }
  function submitFinal() {
    var v = ($('final-tx').value || '').trim(); if (v.length < R.finalTask.min) { toast('至少 ' + R.finalTask.min + ' 個字。'); return; }
    ROOT.child(PR_(teamId) + '/final').transaction(function (c) { return c === null ? { done: true, by: uid, t: nowMs(), text: v.slice(0, 200) } : undefined; }).then(function (r) { if (r.committed) { log('final', 's7', v); toast('🎉 完成！'); } });
  }
  function renderTeam() {
    var m = team.members, h = '<h2>隊員 ' + Object.keys(m).length + ' / 4</h2><div class="sub">' + (team.closed ? '已關門，不能再加入' : '還可以加入') + '</div>';   /* 隊名與人數頂列已經有了，這裡不再重複 */
    if (team.code) h += '<div class="card big">房碼 <b>' + esc(team.code) + '</b><div class="sub">朋友輸入這 4 碼，或開 ' + esc(location.origin + location.pathname + '?join=' + team.code) + '</div></div>';
    h += '<div class="card">' + Object.keys(m).map(function (k) { var x = m[k], p = teamPos[k]; return '<div class="mem"><span class="mava">' + skinAva(k, x.ava, 3, false) + '</span><span><b>' + esc(x.nick) + (k === uid ? '（你）' : '') + '</b><br><span class="sub">' + ROLE_ICON[x.role] + x.role + ' ・ ' + (p && fresh(p) ? '在線上' : '離線／沒開定位') + '</span></span>' + (k !== uid && p ? '<a class="btn2 gm" target="_blank" rel="noopener" href="' + navUrl(p) + '">🧭 導航' + (myPos ? '（' + dTxt(dist(myPos, p)) + '）' : '') + '</a>' : '') + (myRole() === '隊長' && k !== uid ? '<button class="btn2" data-kick="' + k + '">請出隊伍</button>' : '') + '</div>'; }).join('') + '</div>';
    h += '<div class="card"><b>🐾 療育小角落</b><div class="sub">和小精靈玩一下。點、搓、滑、按住，牠會有不同的萌反應。不計分、不用做任務，累了就來放鬆。</div><div class="opts"><button class="btn2" id="pet-open">進去玩</button></div></div>';
    h += stickerBook();
    h += achCard();
    h += roleCard();
    h += chatBox();
    h += '<div class="card"><b>帳號與語言</b><div class="opts"><button class="btn2 lo">登出，換 Google 帳號</button><button class="btn2 lang"></button></div></div>';
    h += '<div class="card"><b>開房間／加入別的房</b><div class="opts"><button class="btn2" id="mk-room">開一個臨時房間</button><button class="btn2" id="leave-team">退出這個隊伍</button></div><div class="opts"><input id="jn-code" class="inp" maxlength="4" placeholder="輸入 4 碼房碼"><button class="btn2" id="jn-go">加入</button></div>' + (team.kind === 'room' && team.owner === uid ? '<div class="opts"><button class="btn2" id="rm-open">' + (team.open === false ? '開放補位：關（按此開啟）' : '開放補位：開（按此關閉）') + '</button><button class="btn2" id="rm-close">' + (team.closed ? '重新開門' : '提早關門') + '</button></div>' : '') + '<div class="msg" id="tm-msg"></div></div>';
    h += dispCard();
    h += '<div class="card"><b>地圖風格</b><div class="sub">只改你自己看到的地圖，隊友不受影響。</div><div class="opts">' + ([{ id: 'auto', name: '自動（晚上換夜景）' }].concat(STYLES)).map(function (x) { return '<button class="btn2' + (styleSel === x.id ? ' on' : '') + '" data-style="' + x.id + '">' + esc(x.name) + '</button>'; }).join('') + '</div></div>';
    $('pane-team').innerHTML = h; bindLo(); bindChat(); bindDisp(); collapsify('pane-team'); var pb = $('pet-open'); if (pb) pb.onclick = function () { try { window.WalkPet && WalkPet.open(); } catch (e) { } };
    [].forEach.call(document.querySelectorAll('[data-style]'), function (b) { b.onclick = function () { styleSel = b.dataset.style; try { localStorage.setItem('walk_style', styleSel); } catch (e) {} applyStyle(); if (phase() === 'rehearsal') pmark('g5'); renderTeam(); }; });
    [].forEach.call(document.querySelectorAll('[data-role]'), function (b) { b.onclick = function () { switchRole(b.dataset.role); }; });
    [].forEach.call(document.querySelectorAll('[data-kick]'), function (b) { b.onclick = function () {
      if (!b.dataset.arm) { b.dataset.arm = '1'; b.textContent = '再按一次確認'; setTimeout(function () { b.dataset.arm = ''; b.textContent = '請出隊伍'; }, 6000); return; }
      kickMember(b.dataset.kick); }; });
    var lt = $('leave-team'); if (lt) lt.onclick = function () {
      if (!lt.dataset.arm) { lt.dataset.arm = '1'; lt.textContent = (myRole() === '隊長' ? '你是隊長，退出後會隨機指定新隊長。' : '') + '再按一次確認退出'; setTimeout(function () { lt.dataset.arm = ''; lt.textContent = '退出這個隊伍'; }, 6000); return; }
      leaveTeam().then(function () { try { ROOT.child('players/' + uid + '/team').remove(); } catch (e) { } log('leave', '', ''); });
    };
    $('mk-room').onclick = function () { leaveTeam().then(function () { return createTeam('room', ($('ob-dept').value || ''), ''); }).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message; }); };
    $('jn-go').onclick = function () { var c = $('jn-code').value.trim().toUpperCase(); if (c.length !== 4) { $('tm-msg').textContent = '請輸入 4 碼。'; return; } joinByCode(c).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message || '加入失敗。'; }); };
    if ($('rm-open')) $('rm-open').onclick = function () { ROOT.child('teams/' + teamId + '/open').set(team.open === false); };
    if ($('rm-close')) $('rm-close').onclick = function () { ROOT.child('teams/' + teamId + '/closed').set(!team.closed); };
  }
  /* ---------- 角色：一組一種只有一個；被挑走的變灰；隊長可無限換，其他角色只能換一次 ---------- */
  function swapsLeft() {
    var me = team && team.members && team.members[uid]; if (!me) return 0;
    if (me.role === '隊長') return Infinity;
    return Math.max(0, 1 + rlvA('隊長') - (me.swaps || 0));
  }
  function roleCard() {
    var m = team.members, owner = {}, left = swapsLeft();
    Object.keys(m).forEach(function (k) { owner[m[k].role] = k; });
    var meM = m[uid] || {}, pl = Object.keys(meM.played || {}).filter(function (r) { return r !== meM.role && ROLE_DESC[r]; });
    function abil(r) { var lv = rlv(r), g = ROLE_GROW[r] || [], t = agSummary(r) + '<div class="sub">' + esc(ROLE_DESC[r]) + '</div>'; for (var i = 0; i < 3; i++) t += '<div class="sub">' + (i < lv ? '✔ ' : '🔒 ') + (i + 1) + ' 級：' + esc(g[i] || '') + '</div>'; return t; }
    var h = '<div class="card"><b>你現在的能力：' + ROLE_ICON[myRole()] + myRole() + '（' + rlv(myRole()) + '／3 級）</b>' + abil(myRole());
    if (pl.length) h += '<b>你扮演過的所有角色與等級</b>' + pl.map(function (r) { return '<div class="rolerow"><div class="rr1"><b>' + ROLE_ICON[r] + r + '</b> <span class="tag">' + rlv(r) + '／3 級</span></div>' + abil(r) + '</div>'; }).join('');
    h += '</div><div class="card"><b>角色（每種只能一個人當，被挑走的會變灰）</b><div class="sub">你現在是 ' + ROLE_ICON[myRole()] + myRole() + '。' + (left === Infinity ? '隊長可以隨時換角色，沒有次數限制。' : left > 0 ? '你還可以換 1 次角色。' : '你已經換過一次了，不能再換（除非當上隊長）。') + '</div>';
    ROLES.forEach(function (r) {
      var o = owner[r], mine = o === uid, taken = o && !mine, can = !mine && !taken && left > 0;
      h += '<div class="rolerow' + (taken ? ' taken' : '') + (mine ? ' mine' : '') + '"><div class="rr1">' + agImg(r, 36) + '<b>' + ROLE_ICON[r] + r + '</b>' + (agOf(r) ? ' <span class="sub">' + esc(agOf(r).name) + '</span>' : '') + (mine ? ' <span class="tag">你</span>' : '') + (taken ? ' <span class="sub">' + esc((m[o] && m[o].nick) || '隊友') + ' 已選</span>' : '') + '</div><div class="sub">' + esc(ROLE_DESC[r]) + '</div>' + (can ? '<button class="btn2" data-role="' + r + '">換成' + r + '</button>' : '') + '</div>';
    });
    return h + '</div>';
  }
  function switchRole(nr) {
    var swapLim = 1 + rlvA('隊長');
    ROOT.child('teams/' + teamId + '/members').transaction(function (c) {
      if (!c || !c[uid]) return c;
      var me = c[uid], k, used = 0;
      if (me.role === nr) return undefined;
      for (k in c) if (k !== uid && c[k].role === nr) return undefined;   /* 被別人先挑走了 */
      if (me.role !== '隊長' && (me.swaps || 0) >= swapLim) return undefined;
      me.played = me.played || {}; me.played[me.role] = 1; me.played[nr] = 1;
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
      return sep + '<div class="tcm' + (m.uid === uid ? ' me' : '') + (profile && profile.nick && String(m.x).indexOf('@' + profile.nick) >= 0 ? ' at' : '') + (m.call ? ' call' : '') + '"><b style="color:' + userColor(m.uid) + '">' + esc(m.n || '?') + '</b> ' + esc(m.x) + (m.t ? ' <span class="tctime">' + hhmm(m.t) + '</span>' : '') + '</div>';
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
  var DMC = ['#c0392b', '#1e7a4c', '#2f5fb3', '#8a3fb0', '#b35a00', '#00727a', '#a0276a', '#4a5d1a', '#5b3fc0', '#0a6e9e'];   /* 白字在上面都 ≥4.5:1 */
  function userColor(id) { var h = 0, i; id = String(id || ''); for (i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return DMC[h % DMC.length]; }
  function flyDanmaku(v) {
    var box = document.getElementById('dm'); if (!box || !dmShow || box.children.length > 14) return;
    var e = document.createElement('div'); e.className = 'dmk'; e.textContent = (v.n ? v.n + '：' : '') + v.x; e.style.background = userColor(v.uid); e.style.borderColor = '#fff';
    dmLane = (dmLane + 1) % 6; e.style.top = (14 + dmLane * 9) + 'vh'; e.style.animationDuration = (8 + Math.random() * 2) + 's';
    box.appendChild(e); e.addEventListener('animationend', function () { e.remove(); }); setTimeout(function () { e.remove(); }, 14000);
  }
  /* 重疊時：被壓在後面的標記變淡（頭像蓋在站點上，後面的頭像更淡） */
  var fadeT = null;
  function fadeOverlaps() {
    if (document.hidden || !map || !map.latLngToContainerPoint) return;
    var av = [], st = [], pt = function (m) { return map.latLngToContainerPoint(m.getLatLng()); };
    if (meMarker && meMarker._icon) av.push(meMarker);
    Object.keys(mateMarkers).forEach(function (k) { if (mateMarkers[k]._icon) av.push(mateMarkers[k]); });
    Object.keys(stopMarkers).forEach(function (id) { if (stopMarkers[id]._icon) st.push(stopMarkers[id]); });
    st.forEach(function (m) { var p = pt(m); m._icon.style.opacity = av.some(function (a) { var q = pt(a); return Math.abs(p.x - q.x) < 34 && Math.abs(p.y - q.y) < 46; }) ? 0.28 : 1; m._icon.style.transition = 'opacity .25s'; });
    av.forEach(function (a, i) {
      var p = pt(a), za = a.options.zIndexOffset || 0;
      var behind = av.some(function (b, j) { if (j === i) return false; var zb = b.options.zIndexOffset || 0; var q = pt(b); return (zb > za || (zb === za && j > i)) && Math.abs(p.x - q.x) < 30 && Math.abs(p.y - q.y) < 42; });
      a._icon.style.opacity = behind ? 0.4 : 1; a._icon.style.transition = 'opacity .25s';
    });
  }
  function startChat() {
    dmStart = nowMs();
    if (!fadeT) fadeT = setInterval(fadeOverlaps, 2500);
    if (!document.getElementById('dm')) {
      var st = document.createElement('style');
      st.textContent = '#dm{position:fixed;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:2500;overflow:hidden}.dmk{position:absolute;left:100%;white-space:nowrap;font-weight:800;font-size:19px;line-height:1.3;color:#fff;background:rgba(24,12,36,.78);padding:4px 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.55);box-shadow:0 2px 8px rgba(0,0,0,.35);animation:dmkgo linear forwards}@keyframes dmkgo{to{transform:translateX(calc(-100vw - 100% - 24px))}}#dm-btn{position:fixed;left:10px;bottom:76px;z-index:2600;height:46px;padding:0 16px;border-radius:999px;border:3px solid #3a2a4a;background:#ff5c7a;color:#fff;font-size:16px;font-weight:800;box-shadow:0 4px 0 #3a2a4a,0 6px 14px rgba(0,0,0,.3);cursor:pointer}#dm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3a2a4a}#dm-bar .btn2,.tcsend{background:#ff5c7a!important;color:#fff!important;border:2px solid #3a2a4a!important;font-weight:800}#dm-bar{position:fixed;left:8px;right:8px;bottom:128px;z-index:2600;display:none;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}#dm-bar.on{display:flex}#dm-bar input{flex:1;min-width:0}.tclist{max-height:180px;overflow:auto;margin:6px 0;display:flex;flex-direction:column;gap:4px}.tcm{font-size:14px;background:rgba(127,127,127,.12);border-radius:8px;padding:4px 8px}.mate.mt b{background:#2f6690!important;color:#fff!important;border:2px solid #1b3f5c!important;cursor:pointer}.mate.me b{background:#e0821f!important;color:#fff!important;border:2px solid #7a4710!important}.mate.mt .spr{filter:drop-shadow(0 0 4px #2f6690)}.tcm.at{outline:2px solid #2f6690}.tcday{align-self:center;font-size:12px;color:#fff;background:rgba(80,60,100,.75);border-radius:999px;padding:1px 10px;margin:4px 0}.tctime{font-size:11px;opacity:.6;margin-left:4px}.tcm.me{background:rgba(255,160,60,.22)}.tcm.call{background:rgba(255,90,90,.22);font-weight:700}.cl-h{cursor:pointer;position:relative;padding-right:22px}.cl-h::after{content:"▾";position:absolute;right:4px;top:0;opacity:.55;font-size:14px}.cl-collapsed>.cl-h::after{content:"▸"}.cl-collapsed>*:not(.cl-h){display:none!important}.rolerow{border:1px solid var(--line);border-radius:10px;padding:8px;margin-top:6px}.rolerow.taken{opacity:.42;filter:grayscale(1)}.rolerow.mine{border-color:#e0821f;background:rgba(224,130,31,.1)}.bub.secret{background:#fff3c4;color:#4a3a00;border:1px dashed #c9a400}';
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
    h += arr.map(function (x, i) { return '<div class="rk' + (x.id === teamId ? ' me' : '') + '"><span class="n">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1)) + '</span><span class="nm">' + esc(/^房 /.test(x.b.name || '') ? x.b.name : storyName(x.id)) + '・' + x.b.n + ' 人' + ({ relax: ' 🌿悠閒', timed: ' ⏱計時', pk: ' ⚔PK' }[x.b.mode] || '') + '</span><span class="sc">' + x.b.score + ' 分・🧩' + x.b.frags + '</span></div>'; }).join('') || '<div class="card">還沒有分數。</div>';
    var ar = arr.slice().sort(function (a, b) { return ((b.b.ach || 0) - (a.b.ach || 0)) || (b.b.score - a.b.score); });
    h += '<h2>🏅 成就排行</h2><div class="sub">隊伍成就（' + ACHS.map(function (a) { return a.icon + a.name; }).join('、') + '）達成幾個。</div>';
    h += ar.map(function (x, i) { var n = x.b.ach || 0; return '<div class="rk' + (x.id === teamId ? ' me' : '') + '"><span class="n">' + (i < 3 && n > 0 ? ['🥇', '🥈', '🥉'][i] : (i + 1)) + '</span><span class="nm">' + esc(/^房 /.test(x.b.name || '') ? x.b.name : storyName(x.id)) + '</span><span class="sc">' + ACHS.map(function (a, j) { return j < n ? a.icon : '・'; }).join('') + ' ' + n + '／' + ACHS.length + '</span></div>'; }).join('') || '';
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
    $('ph-close').onclick = function () { $('phm').hidden = true; }; $('ph-x').onclick = function () { $('phm').hidden = true; }; $('phm').onclick = function (e) { if (e.target === $('phm')) $('phm').hidden = true; }; $('ph-ref').onclick = openWall;
    bindLo();
    if ($('btn-mapclose')) $('btn-mapclose').onclick = function () { mapFolded = true; setView('task'); };
    $('fb-send').onclick = sendFb; $('fb-close').onclick = function () { $('fbm').hidden = true; };
  });
})();
