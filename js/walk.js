/* 11/14 走讀 app（學生端）。
   登入：Google（Firebase Auth）；?test=1 時走測試模式（不登入、資料寫 walk1114test）。
   資料：whgm/analysis/walk1114/*（編號/uid 為鍵，不存 email 與姓名）。
   隱私：系／班只在分隊當下使用，隊伍只留「標籤」（建隊者的系），個人不存；位置只給同隊與老師，結束後清除。 */
(function () {
  'use strict';
  var R = window.WALK_ROUTE, S = R.stops;
  var qs = new URLSearchParams(location.search);
  var TEST = qs.get('test') === '1';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ROLES = ['隊長', '領航員', '軍師', '偵查員'];
  var ROLE_ICON = { '隊長': '👑', '領航員': '🧭', '軍師': '📜', '偵查員': '🔍' };
  var ROLE_DESC = { '隊長': '分工調節：決定誰去哪、何時用提示', '領航員': '空間方位：看得到方位與距離提示', '軍師': '推理知識：看得到年代與排序提示', '偵查員': '觀察比對：看得到現場特徵提示' };
  var AVAS = ['🦊', '🐯', '🐼', '🐸', '🦉', '🐙', '🦄', '🐧', '🐢', '🦁', '🐰', '🐻'];
  var DEPTS = ['多樂', '資工', '資管', '半導體', '電機', '電子', '化材', '機械', '企管', '工管', '流音', '應日', '資傳', '視傳', '永續', '其他'];

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
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 3200); }
  function stopById(id) { for (var i = 0; i < S.length; i++) if (S[i].id === id) return S[i]; return null; }
  function mkcode() { var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function on(ref, ev, fn) { ref.on(ev, fn); listeners.push([ref, ev, fn]); }
  function offAll() { listeners.forEach(function (l) { l[0].off(l[1], l[2]); }); listeners = []; }
  function log(kind, stop, text) { if (!uid) return; ROOT.child('log/' + uid).push({ t: nowMs(), team: teamId || '', stop: stop || '', kind: kind, text: String(text || '').slice(0, 300) }); }

  /* ---------- 啟動與登入 ---------- */
  function boot() {
    firebase.initializeApp({ apiKey: 'AIzaSyBwPR0oE5VK0eBlqq8JY1B56UXy3R9cyng', authDomain: 'gen-lang-client-0929530380.firebaseapp.com', databaseURL: 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', projectId: 'gen-lang-client-0929530380' });
    db = firebase.database(); auth = firebase.auth();
    ROOT = db.ref('whgm/analysis/' + (TEST ? 'walk1114test' : 'walk1114'));
    buildOnboarding();
    $('btn-google').onclick = googleLogin;
    if (TEST) { $('btn-test').hidden = false; $('btn-test').onclick = function () { startUser(qs.get('uid') || ('dev-' + Math.random().toString(36).slice(2, 8))); }; if (qs.get('uid')) startUser(qs.get('uid')); }
    auth.getRedirectResult().catch(loginErr);
    auth.onAuthStateChanged(function (u) { if (u && !uid) startUser(u.uid); });
  }
  function loginErr(e) { $('login-msg').textContent = '登入沒完成（' + ((e && e.code) || 'unknown') + '）。可以換瀏覽器或重試一次。'; }
  function googleLogin() {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    $('login-msg').textContent = mobile ? '轉到 Google 登入頁…登入完會自動回來。' : '開啟 Google 登入視窗…';
    if (mobile) { auth.signInWithRedirect(p).catch(loginErr); return; }
    auth.signInWithPopup(p).catch(function (e) {
      var c = (e && e.code) || '';
      if (c === 'auth/popup-blocked' || c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') { $('login-msg').textContent = '視窗被擋掉了，改用轉頁登入…'; auth.signInWithRedirect(p).catch(loginErr); return; }
      loginErr(e);
    });
  }
  function startUser(u) {
    uid = u; $('screen-login').hidden = true;
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

  /* ---------- 加入畫面（暱稱、系／班、同意） ---------- */
  function buildOnboarding() {
    var d = $('ob-dept'); d.innerHTML = '<option value="">請選擇</option>' + DEPTS.map(function (x) { return '<option>' + x + '</option>'; }).join('');
    var g = $('ob-ava'); g.innerHTML = AVAS.map(function (a, i) { return '<button type="button" class="ava' + (i === 0 ? ' on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('');
    g.onclick = function (e) { var b = e.target.closest('.ava'); if (!b) return; [].forEach.call(g.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
    $('ob-go').onclick = onboardGo;
    var j = qs.get('join'); if (j) $('ob-code').value = j.toUpperCase();
  }
  function showOnboarding() { $('screen-ob').hidden = false; }
  function onboardGo() {
    var nick = $('ob-nick').value.trim(), dept = $('ob-dept').value, cls = $('ob-cls').value;
    var ava = ($('ob-ava').querySelector('.on') || {}).dataset ? $('ob-ava').querySelector('.on').dataset.a : AVAS[0];
    if (!nick) { $('ob-msg').textContent = '請取一個暱稱（不是真實姓名）。'; return; }
    if (!$('ob-ok').checked) { $('ob-msg').textContent = '請先勾選同意。'; return; }
    var code = $('ob-code').value.trim().toUpperCase();
    if (!code && !dept) { $('ob-msg').textContent = '請選你的系（只用來分隊）。'; return; }
    profile = { nick: nick.slice(0, 12), ava: ava, ts: nowMs() };
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
    teamId = id; offAll();
    ROOT.child('players/' + uid).update({ team: id }); if (profile) profile.team = id;
    $('app').hidden = false; $('screen-ob').hidden = true; $('screen-login').hidden = true;
    initMap(); wireTabs(); startLocation();
    on(ROOT.child('teams/' + id), 'value', function (s) {
      team = s.val();
      if (!team || !team.members || !team.members[uid]) { toast('你已不在這個隊了。'); $('app').hidden = true; showOnboarding(); return; }
      render();
    });
    on(ROOT.child('players/' + uid + '/team'), 'value', function (sn) { var nt = sn.val(); if (nt && nt !== teamId) { toast('你的隊伍被整併了，已切到新隊。'); enterGame(nt); } });
    on(ROOT.child('prog/' + id), 'value', function (s) { prog = s.val() || {}; render(); checkTasks(); });
    on(ROOT.child('pos/' + id), 'value', function (s) { teamPos = s.val() || {}; renderMates(); checkTasks(); });
    on(ROOT.child('board'), 'value', function (s) { board = s.val() || {}; if (view === 'rank') render(); });
    schedLoop();
  }
  var board = {};

  /* ---------- 地圖與定位 ---------- */
  function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView([S[0].lat, S[0].lon], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    S.forEach(function (s, i) {
      var ic = L.divIcon({ className: '', html: '<div class="stopdot">' + i + '</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
      stopMarkers[s.id] = L.marker([s.lat, s.lon], { icon: ic }).addTo(map).on('click', function () { curStop = s.id; setView('task'); });
      L.circle([s.lat, s.lon], { radius: s.r, color: '#b8402a', weight: 1, fillOpacity: 0.05 }).addTo(map);
      if (s.zones) Object.keys(s.zones).forEach(function (k) { var z = s.zones[k]; L.circle([z.lat, z.lon], { radius: z.r, color: '#1f6f68', weight: 1, dashArray: '4', fillOpacity: 0.08 }).addTo(map).bindTooltip(z.name); });
    });
  }
  function startLocation() {
    var sim = qs.get('sim');
    if (sim) { var p = sim.split(',').map(Number); gotPos({ coords: { latitude: p[0], longitude: p[1], accuracy: 5 } }); window.__walkSim = function (lat, lon) { gotPos({ coords: { latitude: lat, longitude: lon, accuracy: 5 } }); }; return; }
    if (!navigator.geolocation) { $('gps').textContent = '這個瀏覽器不支援定位。'; return; }
    watchId = navigator.geolocation.watchPosition(gotPos, function (e) { $('gps').textContent = '定位失敗：' + (e.code === 1 ? '請允許定位權限' : e.message); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    if (!posTimer) posTimer = setInterval(uploadPos, 25000);
  }
  window.__walkSim2 = function () { };
  function gotPos(p) {
    myPos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 0, t: nowMs() };
    $('gps').textContent = '定位精度約 ' + Math.round(myPos.acc) + ' 公尺';
    if (!meMarker) { meMarker = L.circleMarker([myPos.lat, myPos.lon], { radius: 8, color: '#fff', weight: 2, fillColor: '#2f6690', fillOpacity: 1 }).addTo(map); map.setView([myPos.lat, myPos.lon], 17); }
    else meMarker.setLatLng([myPos.lat, myPos.lon]);
    if (!uploadPos._last || nowMs() - uploadPos._last > 15000) uploadPos();
    checkTasks();
  }
  function uploadPos() {
    if (!myPos || !teamId || !uid) return; uploadPos._last = nowMs();
    ROOT.child('pos/' + teamId + '/' + uid).set({ lat: +myPos.lat.toFixed(5), lon: +myPos.lon.toFixed(5), acc: Math.round(myPos.acc), t: myPos.t, nick: profile.nick, ava: profile.ava });
  }
  function renderMates() {
    Object.keys(mateMarkers).forEach(function (k) { if (!teamPos[k] || !showMates) { map.removeLayer(mateMarkers[k]); delete mateMarkers[k]; } });
    if (!showMates) return;
    Object.keys(teamPos).forEach(function (k) {
      if (k === uid) return; var p = teamPos[k];
      var html = '<div class="mate">' + esc(p.ava || '🙂') + '<b>' + esc(p.nick || '') + '</b></div>';
      var ic = L.divIcon({ className: '', html: html, iconSize: [48, 34], iconAnchor: [24, 17] });
      if (mateMarkers[k]) mateMarkers[k].setLatLng([p.lat, p.lon]).setIcon(ic); else mateMarkers[k] = L.marker([p.lat, p.lon], { icon: ic }).addTo(map);
    });
  }

  /* ---------- 時程（自動模式：依時鐘提示現在該在哪） ---------- */
  function stopStartMs(s) { var m = /(\d{1,2}):(\d{2})/.exec(s.time); var d = new Date(R.date + 'T00:00:00+08:00'); return d.getTime() + (+m[1] * 3600 + +m[2] * 60) * 1000; }
  function schedNow() {
    var t = nowMs(), cur = null;
    for (var i = 0; i < S.length; i++) if (stopStartMs(S[i]) <= t) cur = S[i];
    return cur;
  }
  function schedLoop() { renderBanner(); setInterval(renderBanner, 20000); }
  function renderBanner() {
    var c = schedNow(), b = $('banner');
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
    ROOT.child('prog/' + teamId + '/' + stopId + '/tasks/' + tid).transaction(function (c) { return c === null ? rec : undefined; }).then(function (r) { if (r.committed) { log('task', stopId, tid + (extra && extra.soft ? ' (soft)' : '')); toast('✔ 完成：' + (taskTitle(stopId, tid) || tid)); } });
  }
  function taskTitle(sid, tid) { var s = stopById(sid); if (!s || !s.tasks) return ''; for (var i = 0; i < s.tasks.length; i++) if (s.tasks[i].id === tid) return s.tasks[i].title; return ''; }
  function zoneOf(s, key) { return s.zones && s.zones[key]; }
  function fresh(p) { return p && nowMs() - p.t < 90000; }
  function checkTasks() {
    if (!teamId || !uid || !team) return;
    S.forEach(function (s) {
      // 到點打卡
      if (myPos && dist(myPos, s) <= s.r && !(prog[s.id] && prog[s.id].arrived)) {
        ROOT.child('prog/' + teamId + '/' + s.id + '/arrived').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) toast('📍 到達：' + s.name); });
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
      ROOT.child('prog/' + teamId + '/' + s.id + '/frag').transaction(function (c) { return c === null ? { by: uid, t: nowMs() } : undefined; }).then(function (r) { if (r.committed) { toast('🧩 取得碎片：' + R.fragmentNames[s.frag]); log('frag', s.id, R.fragmentNames[s.frag]); } });
    }
  }
  function scoreOf() {
    var sc = 0, P = R.score;
    S.forEach(function (s) {
      var p = prog[s.id] || {}; if (p.arrived) sc += P.arrive;
      (s.tasks || []).forEach(function (t) { if (p.tasks && p.tasks[t.id]) sc += t.bonus ? P.bonus : P.task; });
      if (p.frag) sc += P.frag; sc += P.hint * (p.hints || 0);
    });
    if (prog.final && prog.final.done) sc += P.final;
    return Math.max(0, sc);
  }
  function fragCount() { var n = 0; S.forEach(function (s) { if (s.frag !== undefined && prog[s.id] && prog[s.id].frag) n++; }); return n; }
  function writeScore() {
    if (!team) return; var sc = scoreOf(), key = sc + '|' + fragCount() + '|' + team.n;
    if (key === lastScoreWritten) return; lastScoreWritten = key;
    ROOT.child('board/' + teamId).set({ name: teamLabel(), score: sc, frags: fragCount(), n: Object.keys(team.members || {}).length, t: nowMs() });
  }
  function teamLabel() { return (team.kind === 'room' ? '房 ' + team.code : team.name) || '隊'; }

  /* ---------- 介面渲染 ---------- */
  function wireTabs() {
    if (wireTabs.done) return; wireTabs.done = true;
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.onclick = function () { setView(b.dataset.v); }; });
    $('btn-mates').onclick = function () { showMates = !showMates; $('btn-mates').classList.toggle('off', !showMates); renderMates(); };
    $('btn-locate').onclick = function () { if (myPos) map.setView([myPos.lat, myPos.lon], 18); };
  }
  function setView(v) {
    view = v; [].forEach.call(document.querySelectorAll('.pane'), function (p) { p.hidden = p.id !== 'pane-' + v; });
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('on', b.dataset.v === v); });
    if (v === 'map' && map) setTimeout(function () { map.invalidateSize(); }, 50);
    render();
  }
  function render() {
    if (!team) return;
    $('hd-team').textContent = teamLabel() + '・' + Object.keys(team.members).length + ' 人';
    $('hd-score').textContent = scoreOf() + ' 分・碎片 ' + fragCount() + '/4';
    if (view === 'task') renderTask(); if (view === 'team') renderTeam(); if (view === 'rank') renderRank();
  }
  function myRole() { return (team && team.members[uid] && team.members[uid].role) || ROLES[0]; }
  function renderTask() {
    var s = stopById(curStop || S[0].id) || S[0], p = prog[s.id] || {}, h = '';
    h += '<div class="chips">' + S.map(function (x, i) { var st = (prog[x.id] && prog[x.id].frag) ? 'ok' : (prog[x.id] && prog[x.id].arrived ? 'half' : ''); return '<button class="chip ' + st + (x.id === s.id ? ' cur' : '') + '" data-s="' + x.id + '">' + i + '</button>'; }).join('') + '</div>';
    h += '<h2>' + esc(s.name) + '</h2><div class="sub">' + esc(s.time) + ' 起・約 ' + s.min + ' 分' + (s.frag !== undefined ? '・碎片「' + esc(R.fragmentNames[s.frag]) + '」' + (p.frag ? ' ✔' : '') : '') + '</div>';
    if (s.plain) { h += '<div class="card">' + esc(s.tip || '') + '</div>'; if (s.id === 's0') h += '<div class="card">你的角色：<b>' + ROLE_ICON[myRole()] + myRole() + '</b><br><span class="sub">' + esc(ROLE_DESC[myRole()]) + '</span></div>'; }
    if (s.final) h += finalHtml();
    if (s.npc) h += npcHtml(s, p);
    if (s.tasks) {
      h += '<h3>任務</h3>';
      s.tasks.forEach(function (t) { h += taskHtml(s, t); });
    }
    if (s.note) h += '<details class="card"><summary>給老師看的備註</summary><div class="sub">' + esc(s.note) + '</div></details>';
    $('pane-task').innerHTML = h;
    [].forEach.call(document.querySelectorAll('.chip'), function (b) { b.onclick = function () { curStop = b.dataset.s; renderTask(); }; });
    [].forEach.call(document.querySelectorAll('[data-hint]'), function (b) { b.onclick = function () { useHint(b.dataset.hint); }; });
    [].forEach.call(document.querySelectorAll('[data-ans]'), function (b) { b.onclick = function () { answer(b.dataset.s, b.dataset.t, b.dataset.ans); }; });
    [].forEach.call(document.querySelectorAll('[data-text]'), function (b) { b.onclick = function () { submitText(b.dataset.s, b.dataset.t); }; });
    [].forEach.call(document.querySelectorAll('[data-ack]'), function (b) { b.onclick = function () { markTask(b.dataset.s, b.dataset.ack); }; });
    [].forEach.call(document.querySelectorAll('[data-mv]'), function (b) { b.onclick = function () { moveCard(b.dataset.s, +b.dataset.i, +b.dataset.mv); }; });
    [].forEach.call(document.querySelectorAll('[data-ord]'), function (b) { b.onclick = function () { checkOrder(b.dataset.s, b.dataset.t); }; });
    var fb = document.getElementById('final-go'); if (fb) fb.onclick = submitFinal;
  }
  function npcHtml(s, p) {
    var n = s.npc, used = p.hints || 0, h = '<div class="npc"><div class="nhd"><span class="nava">' + n.ava + '</span><b>' + esc(n.name) + '</b></div>';
    if (!(p.arrived || TEST)) { h += '<div class="bub dim">（還沒走到這裡，' + esc(n.name) + '還在趕路…）</div></div>'; return h; }
    n.open.forEach(function (l) { h += '<div class="bub">' + esc(l) + '</div>'; });
    h += '<div class="bub clue">' + esc(n.clue) + '</div>';
    for (var i = 0; i < used && i < n.hints.length; i++) h += '<div class="bub hint">' + esc(n.hints[i]) + '</div>';
    if (p.frag) h += '<div class="bub done">' + esc(n.done) + '</div>';
    Object.keys(p.tasks || {}).forEach(function (k) { var t = (s.tasks || []).filter(function (x) { return x.id === k; })[0]; if (t && t.reward) h += '<div class="bub reward">' + esc(t.reward) + '</div>'; });
    if (!p.frag && used < n.hints.length) h += '<button class="btn2" data-hint="' + s.id + '">再給我一點提示（−10 分，剩 ' + (n.hints.length - used) + ' 次）</button>';
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
    else { var n = (checkOrder['n' + sid] = (checkOrder['n' + sid] || 0) + 1); log('answer', sid, 'order wrong ' + a.join('>')); toast(n >= 3 ? '還差一點。提示：想想「這塊地先給誰用」。' : '順序不太對，再想想。'); if (n >= 4) markTask(sid, tid, { soft: true }); }
  }
  var wrong = {};
  function answer(sid, tid, a) {
    var s = stopById(sid), t = s.tasks.filter(function (x) { return x.id === tid; })[0]; log('answer', sid, tid + '=' + a);
    if (a === t.answer) { markTask(sid, tid); return; }
    var k = sid + tid; wrong[k] = (wrong[k] || 0) + 1;
    if (wrong[k] >= 2 && t.unverified) { toast('這題老師會看你的答案，先往下走。'); markTask(sid, tid, { soft: true, ans: a }); } else toast('再看一次現場，再想想。');
  }
  function submitText(sid, tid) {
    var s = stopById(sid), t = s.tasks.filter(function (x) { return x.id === tid; })[0], v = ($('tx-' + tid).value || '').trim();
    if (v.length < (t.min || 2)) { toast('再多寫一點點（至少 ' + (t.min || 2) + ' 個字）。'); return; }
    log('keyword', sid, v); markTask(sid, tid, { text: v.slice(0, 60) });
  }
  function useHint(sid) {
    var s = stopById(sid), p = prog[sid] || {}, n = p.hints || 0; if (n >= s.npc.hints.length) return;
    ROOT.child('prog/' + teamId + '/' + sid + '/hints').transaction(function (c) { return (c || 0) === n ? n + 1 : undefined; }).then(function (r) { if (r.committed) log('hint', sid, 'level ' + (n + 1)); });
  }
  function finalHtml() {
    var ok = fragCount() >= 4, d = prog.final && prog.final.done, h = '<div class="card"><b>' + esc(R.finalTask.title) + '</b>';
    if (d) return h + '<div class="bub done">交給時安局了：「' + esc(prog.final.text) + '」</div></div>';
    if (!ok) return h + '<div class="sub">還差 ' + (4 - fragCount()) + ' 塊碎片。</div></div>';
    return h + '<textarea id="final-tx" class="inp" rows="3" placeholder="寫一句話"></textarea><button id="final-go" class="btn2">交給時安局</button></div>';
  }
  function submitFinal() {
    var v = ($('final-tx').value || '').trim(); if (v.length < R.finalTask.min) { toast('至少 ' + R.finalTask.min + ' 個字。'); return; }
    ROOT.child('prog/' + teamId + '/final').transaction(function (c) { return c === null ? { done: true, by: uid, t: nowMs(), text: v.slice(0, 200) } : undefined; }).then(function (r) { if (r.committed) { log('final', 's7', v); toast('🎉 完成！'); } });
  }
  function renderTeam() {
    var m = team.members, h = '<h2>' + esc(teamLabel()) + '</h2><div class="sub">' + Object.keys(m).length + ' / 4 人' + (team.closed ? '・已關門' : '・可加入') + '</div>';
    if (team.code) h += '<div class="card big">房碼 <b>' + esc(team.code) + '</b><div class="sub">朋友輸入這 4 碼，或開 ' + esc(location.origin + location.pathname + '?join=' + team.code) + '</div></div>';
    h += '<div class="card">' + Object.keys(m).map(function (k) { var x = m[k], p = teamPos[k]; return '<div class="mem"><span class="mava">' + esc(x.ava) + '</span><span><b>' + esc(x.nick) + (k === uid ? '（你）' : '') + '</b><br><span class="sub">' + ROLE_ICON[x.role] + x.role + ' ・ ' + (p && fresh(p) ? '在線上' : '離線／沒開定位') + '</span></span></div>'; }).join('') + '</div>';
    h += '<div class="card"><b>你的角色：' + ROLE_ICON[myRole()] + myRole() + '</b><div class="sub">' + esc(ROLE_DESC[myRole()]) + '。角色只是看到的提示不同，缺人也不影響過關。</div><div class="opts">' + ROLES.map(function (r) { return '<button class="btn2" data-role="' + r + '">' + ROLE_ICON[r] + r + '</button>'; }).join('') + '</div></div>';
    h += '<div class="card"><b>開房間／加入別的房</b><div class="opts"><button class="btn2" id="mk-room">開一個臨時房間</button></div><div class="opts"><input id="jn-code" class="inp" maxlength="4" placeholder="輸入 4 碼房碼"><button class="btn2" id="jn-go">加入</button></div>' + (team.kind === 'room' && team.owner === uid ? '<div class="opts"><button class="btn2" id="rm-open">' + (team.open === false ? '開放補位：關（按此開啟）' : '開放補位：開（按此關閉）') + '</button><button class="btn2" id="rm-close">' + (team.closed ? '重新開門' : '提早關門') + '</button></div>' : '') + '<div class="msg" id="tm-msg"></div></div>';
    $('pane-team').innerHTML = h;
    [].forEach.call(document.querySelectorAll('[data-role]'), function (b) { b.onclick = function () { ROOT.child('teams/' + teamId + '/members/' + uid + '/role').set(b.dataset.role); }; });
    $('mk-room').onclick = function () { leaveTeam().then(function () { return createTeam('room', ($('ob-dept').value || ''), ''); }).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message; }); };
    $('jn-go').onclick = function () { var c = $('jn-code').value.trim().toUpperCase(); if (c.length !== 4) { $('tm-msg').textContent = '請輸入 4 碼。'; return; } joinByCode(c).then(function (id) { enterGame(id); }).catch(function (e) { $('tm-msg').textContent = e.message || '加入失敗。'; }); };
    if ($('rm-open')) $('rm-open').onclick = function () { ROOT.child('teams/' + teamId + '/open').set(team.open === false); };
    if ($('rm-close')) $('rm-close').onclick = function () { ROOT.child('teams/' + teamId + '/closed').set(!team.closed); };
  }
  function renderRank() {
    var arr = Object.keys(board).map(function (k) { return { id: k, b: board[k] }; }).sort(function (a, b) { return b.b.score - a.b.score; });
    var h = '<h2>排行榜</h2><div class="sub">隊與隊競爭積分；落單的人也有完整的單人路徑。</div>';
    h += arr.map(function (x, i) { return '<div class="rk' + (x.id === teamId ? ' me' : '') + '"><span class="n">' + (i + 1) + '</span><span class="nm">' + esc(x.b.name) + '・' + x.b.n + ' 人</span><span class="sc">' + x.b.score + ' 分・🧩' + x.b.frags + '</span></div>'; }).join('') || '<div class="card">還沒有分數。</div>';
    $('pane-rank').innerHTML = h;
  }

  window.addEventListener('load', boot);
})();
