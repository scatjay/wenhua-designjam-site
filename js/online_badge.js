/* 「目前上線 N 位」小標籤（2026-10-21 楊老師要求，像 UX 學習單一樣直接顯示在頁面上）
   用法：在 bind_gate.js 之後加
     <script src="js/online_badge.js?v=202610210935"></script>
   資料：whgm/analysis/online/<課程>/<編號> = {t: 伺服器時間}（whgm/analysis 底下可寫，不必改規則）。
   - 只有已綁定編號的學生才寫入；老師與外部老師（0、97、98、99）與測試編號（53–61）只讀、不計入。
   - 每 90 秒寫一次心跳；分頁離線時 onDisconnect 自動移除；分頁隱藏時先移除。
   - 讀取用 REST 每 60 秒一次，只算 4 分鐘內有心跳的人（防殘留）。節點很小（≤52 筆），流量可忽略。
   - 任何一步失敗都不影響頁面：標籤不出現而已。 */
(function () {
  'use strict';
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app';
  var BEAT_MS = 90000, POLL_MS = 60000, FRESH_MS = 4 * 60000;

  function course(env) {
    if (env >= 1 && env <= 52) return '47602';
    if (env >= 101 && env <= 130) return '46582';
    if (env >= 201 && env <= 299) return '47618';
    return null;               // 老師、外部老師、測試編號：不計入
  }
  function myEnv() {
    try { return window.DJBind && window.DJBind.env ? window.DJBind.env() : null; } catch (e) { return null; }
  }
  function ref(c, env) { return firebase.database().ref('whgm/analysis/online/' + c + '/' + env); }

  var badge = null, timers = [], writing = null;

  function mount() {
    if (badge) return badge;
    badge = document.createElement('div');
    badge.id = 'dj-online';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    badge.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9997;background:#fff;color:#23201b;' +
      'border:1.5px solid #cfdae1;border-radius:999px;padding:5px 12px;font:700 13px/1.5 -apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.12);display:none';
    document.body.appendChild(badge);
    return badge;
  }
  function show(n) {
    var b = mount();
    b.textContent = '🟢 目前上線 ' + n + ' 位';
    b.style.display = 'block';
  }

  function beat() {
    var env = myEnv(), c = env == null ? null : course(env);
    if (c == null || document.hidden) return;
    try {
      var r = ref(c, env);
      if (writing !== r.toString()) { r.onDisconnect().remove(); writing = r.toString(); }
      r.set({ t: firebase.database.ServerValue.TIMESTAMP });
    } catch (e) { /* 靜默：不影響頁面 */ }
  }
  function leave() {
    var env = myEnv(), c = env == null ? null : course(env);
    if (c == null) return;
    try { ref(c, env).remove(); writing = null; } catch (e) {}
  }

  function poll() {
    var env = myEnv(), c = env == null ? null : course(env);
    if (c == null && env != null) c = '47602';          // 老師看文化遊戲松
    if (c == null) return;
    fetch(DB + '/whgm/analysis/online/' + c + '.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d === null || typeof d !== 'object') { if (d === null) show(0); return; }
        var now = Date.now(), n = 0;
        Object.keys(d).forEach(function (k) { var t = d[k] && d[k].t; if (t && now - t < FRESH_MS) n++; });
        show(n);
      })
      .catch(function () { /* 靜默 */ });
  }

  function start() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    if (myEnv() == null) { setTimeout(start, 3000); return; }   // 還沒綁定：等一下再看
    beat(); poll();
    timers.push(setInterval(beat, BEAT_MS), setInterval(poll, POLL_MS));
    document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); else { beat(); poll(); } });
    window.addEventListener('pagehide', leave);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 800);
  window.DJOnline = { poll: poll, beat: beat, _course: course };
})();
