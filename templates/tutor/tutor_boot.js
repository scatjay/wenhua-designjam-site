/* 樣板掛上助教與證據掛鉤的一行入口（11-12）。樣板頁面最後放：
     <script src="../tutor/folk_index.js"></script> … <script src="../tutor/tutor_boot.js"></script><script>CT_BOOT('puzzle');</script>
   信封編號：網址 ?env=57（測試）優先，否則讀 localStorage 的 designjam_env（學習單網站綁定後存的）；兩者都沒有或不合法就【不掛】（樣板照常運作）。
   週次由日期推算（設定檔 term.firstMonday，W11＝11/16–11/22），不看上課日。網址參數 ?env／?unit／?c／?mode／?cfg／?emu 等只對測試編號 55–60 生效，正式編號一律忽略。
   事件寫入由設定檔 hook.writer 決定（預設 off＝不寫）；測試編號的 ?emu=1 才寫本機模擬器。沒綁定編號時在右下角提示一行（可關閉、不擋操作）。
   不用 alert／confirm／prompt。 */
(function (root) {
  var BOOT_SRC = (function () { try { return document.currentScript && document.currentScript.src || ''; } catch (e) { return ''; } })();
  /* 設定檔 tutor_config.js 與本檔同資料夾。⚠ 要保留本檔網址上的 ?v=版本號（部署時 <script src="…/tutor_boot.js?v=…"> 帶的快取版本），否則改了設定檔學生端會吃到舊的快取 */
  function configSrc(src) { return String(src || '').replace(/tutor_boot\.js(\?.*)?$/, 'tutor_config.js$1'); }
  /* 設定檔載入：動態載入（file:// 也行）；載入失敗或壞掉就用程式內預設，助教不會因此掛掉 */
  function loadConfig(done) {
    if (root.CT_CONFIG || !BOOT_SRC) return done();
    var s = document.createElement('script'); s.src = configSrc(BOOT_SRC); s.onload = function () { done(); }; s.onerror = function () { done(); };
    document.head.appendChild(s);
  }
  /* 沒綁定編號：右下角一行提示（可關閉、不擋操作、不用 alert）。關閉後同一個分頁工作階段不再出現 */
  function showUnbound(eff) {
    try {
      if (!document.body || document.getElementById('ctUnbound')) return null;
      try { if (root.sessionStorage.getItem('ct_unbound_off') === '1') return null; } catch (e) { /* 無法讀取時照樣顯示 */ }
      var u = (eff && eff.unbound) || {}, d = document.createElement('div'); d.id = 'ctUnbound'; d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;right:12px;bottom:12px;left:auto;max-width:min(360px,calc(100vw - 24px));z-index:2147483000;background:#fff8e6;color:#4a3b1a;border:1.5px solid #e0b84a;border-radius:12px;padding:8px 36px 8px 12px;font:14px/1.5 system-ui,"Noto Sans TC","Microsoft JhengHei",sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);box-sizing:border-box';
      var t = document.createElement('span'); t.textContent = String(u.text || '先到學習單綁定編號，助教才會出現') + '　'; d.appendChild(t);
      if (u.href) { var a = document.createElement('a'); a.href = String(u.href); a.textContent = '去學習單'; a.style.cssText = 'color:#8a5a00;font-weight:700;text-decoration:underline'; d.appendChild(a); }
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', '關閉提示'); x.textContent = '✕';
      x.style.cssText = 'position:absolute;top:0;right:0;width:44px;height:44px;min-height:44px;margin:0;padding:0;border:0;background:transparent;color:#4a3b1a;font-size:16px;cursor:pointer;text-align:center';
      x.onclick = function () { try { root.sessionStorage.setItem('ct_unbound_off', '1'); } catch (e) { /* 略 */ } if (d.parentNode) d.parentNode.removeChild(d); };
      d.appendChild(x); document.body.appendChild(d); return d;
    } catch (e) { return null; }
  }
  function boot(tpl, opts) {
    opts = opts || {};
    if (!opts._ready) { loadConfig(function () { boot(tpl, Object.assign({}, opts, { _ready: true })); }); return null; }
    try {
      if (!root.CT_CORE || !root.CT_HOOK) return null;
      var C = root.CT_CORE, stored = null;
      try { stored = root.localStorage.getItem('designjam_env'); } catch (e) { stored = null; }
      var ov = C.urlOverrides(root.location.search, stored);   // 網址參數只對測試編號 55–60 生效；正式編號一律忽略
      var eff = C.cfgEffective(root.CT_CONFIG, ov.cfg || undefined), env = ov.env;
      if (ov.mode) eff = C.cfgEffective({ base: eff, presets: { x: { tutor: { mode: ov.mode } } } }, 'x');
      if (!isFinite(env) || !C.validEnv(env)) { if (!(eff.tutor && eff.tutor.mode === 'off')) showUnbound(eff); return null; }
      var unit = ov.unit || C.unitOfDate(Date.now(), eff.term);   // 週次由日期推算；?unit= 只留給測試編號覆寫
      return root.CT_HOOK.mount({ tpl: tpl, unit: unit, env: env, course: ov.c || undefined, cfg: eff, adapter: opts.adapter });
    } catch (e) {
      if (root.console && root.console.warn) root.console.warn('助教沒有掛上：' + (e && e.message));
      return null;   // 助教出任何錯，都不能影響樣板本身
    }
  }
  root.CT_BOOT = boot; root.CT_BOOT_CONFIG_SRC = configSrc;
})(typeof self !== 'undefined' ? self : this);
