/* 學習單單元入口：一次綁定（編號 ＋ Gmail ＋ QR）
   用法：在任何一個單元頁的 </body> 前加
     <script>window.DJ_BIND_UNIT='w2';</script>
     <script src="js/bind_gate.js"></script>
   前提：該頁已經 firebase.initializeApp 過（unit1/w2/w3/sf3k 都有）。

   🔴 踩過的坑，這裡一次擋掉：
   ① 編號 0 是合法值（楊老師本人測試編號），**不能用 !v 判斷**。
   ② qrcode-generator 的全域是小寫 `qrcode`；不要寫 if(window.QRCode) 之類的守衛，
      那在換版之後永遠是 false，QR 會靜默不出現（2026-09-22 學習單就是這樣壞了三輪）。
   ③ QR 容器要寫死尺寸，否則各頁網址長度不同→模組數不同→自然尺寸對不齊、還會撐爆卡片。
   ④ 手機一律 signInWithRedirect（popup 會被擋）；錯誤訊息絕對不能吞成空字串。
   ⑤ 綁好之後 reload，讓各頁原本讀 localStorage 的邏輯照常運作，不用改各頁程式。 */
(function () {
  'use strict';
  var UNIT = window.DJ_BIND_UNIT || 'unknown';
  var LS_ENV = 'designjam_env', LS_MAIL = 'designjam_email', LS_UID = 'designjam_uid';
  var QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.5.2/qrcode.min.js';
  var st = { email: null, uid: null, name: null, env: null, busy: false };

  /* 🔴 合法編號範圍必須跟 unit1.html / w2.html 的 validEnv 完全一致，否則某一班會整班進不來。
     0＝楊老師｜1-52 文化遊戲松學生（實體信封）｜53-61 測試/demo｜99＝駱老師｜101-130 遊戲設計學。
     ⚠ 100 是刻意跳過的，不要「順手」補回去。
     （2026-09-22：原本寫死 0-99，遊戲設計學的學生會全部被擋在門外才發現。）*/
  function validEnv(v) {
    if (v == null || isNaN(v)) return false;
    return v === 0 || (v >= 1 && v <= 98) || v === 99 || (v >= 101 && v <= 130);
  }

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  function root() { return firebase.database().ref('whgm/analysis/w3game'); }

  /* ── 樣式 ── */
  var CSS = [
'#dj-gate{position:fixed;inset:0;z-index:99999;background:rgba(32,42,48,.62);backdrop-filter:blur(3px);',
'  display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;',
'  -webkit-overflow-scrolling:touch}',
'#dj-gate .box{background:#fff;color:#202a30;max-width:520px;width:100%;border-radius:16px;padding:22px 20px 18px;',
'  margin:auto;',   /* 🔴 搭配外層 flex-start：塞得下→置中；塞不下→頂端靠上且捲得到 */
'  box-shadow:0 10px 44px rgba(32,42,48,.28);font-family:-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;',
'  font-size:16px;line-height:1.7}',
'#dj-gate .course{font-size:13px;font-weight:800;color:#7a3f92;line-height:1.75;margin:0 0 10px;',
'  padding-bottom:10px;border-bottom:1.5px solid #dbd3e2}',
'#dj-gate .course span{font-weight:400;color:#5d5566}',
'#dj-gate h2{margin:0 0 4px;font-size:20px;font-weight:800}',
'#dj-gate .sub{color:#54646e;font-size:14.5px;margin:0 0 16px;line-height:1.7}',
'#dj-gate .step{border:1.5px solid #cfdae1;border-radius:12px;padding:13px 14px;margin:10px 0;background:#f7f9fa}',
'#dj-gate .step.done{border-color:#3f7a34;background:#e9f3e3}',
'#dj-gate .stitle{font-weight:800;font-size:14.5px;display:flex;gap:7px;align-items:center}',
'#dj-gate .tick{color:#3f7a34;font-weight:800}',
'#dj-gate input{font:inherit;font-size:16px;padding:13px 15px;border:1.5px solid #cfdae1;border-radius:10px;',
'  width:100%;background:#fff;color:#202a30}',
'#dj-gate input:focus{outline:2px solid #7a3f92;border-color:#7a3f92}',
'#dj-gate button{font:inherit;font-weight:700;font-size:15px;padding:12px 18px;border-radius:10px;',
'  border:1.5px solid #cfdae1;background:#eaf0f3;color:#202a30;cursor:pointer}',
'#dj-gate button.pri{background:#f2e7f6;color:#7a3f92;border-color:#7a3f92}',
'#dj-gate button.ok{background:#e9f3e3;color:#3f7a34;border-color:#3f7a34}',
'#dj-gate button:disabled{opacity:.42;cursor:not-allowed}',
'#dj-gate .row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}',
'#dj-gate .grow{flex:1 1 auto;min-width:0}',
'#dj-gate .err{color:#b8452f;font-size:13.5px;font-weight:600;margin:8px 0 0}',
'#dj-gate .qrwrap{text-align:center;margin:14px 0 2px}',
'#dj-gate .qrbox{display:inline-block;padding:9px;background:#fff;border:1.5px solid #cfdae1;border-radius:12px;line-height:0}',
/* 容器 id 要跟 innerHTML 裡的 id 完全一致，打錯的話這條規則從加進去那一刻就是死的 */
'#dj-gate #dj-qr svg{display:block;width:132px;height:132px}',
'@media (max-height:640px){#dj-gate #dj-qr svg{width:88px;height:88px}',
'  #dj-gate .qrwrap{margin:8px 0 0}#dj-gate .box{padding:16px 16px 14px}',
'  #dj-gate .step{padding:10px 12px;margin:7px 0}}',
'#dj-gate .qrcap{font-size:13px;color:#54646e;margin-top:7px;line-height:1.6}',
'#dj-gate .tiny{font-size:13px;color:#54646e;margin-top:14px;line-height:1.7}',
'#dj-gate .tiny a{color:#2f6690}',
/* ── 單元導覽：不管 3 週還是 18 週，收起來永遠只佔一列 ──
   色票只有五個、依「單元性質」循環，不是每週一個新顏色（15 個可分辨的顏色不存在，
   硬給只會變成一堆分不出來的灰）。相鄰兩週一定不同色，這樣才認得出「我在對的那一頁」。*/
'.dj-nav{margin:0 0 16px;position:relative;',
'  font:700 13.5px/1.45 -apple-system,"PingFang TC","Microsoft JhengHei",sans-serif}',
'.dj-cur{display:flex;align-items:center;gap:9px;width:100%;text-align:left;cursor:pointer;',
'  background:#eaf0f3;border:1.5px solid #cfdae1;border-left-width:5px;border-radius:12px;',
'  padding:10px 13px;color:#54646e;font:inherit}',
'.dj-cur .dj-k{font-size:14.5px;font-weight:800;white-space:nowrap}',
'.dj-cur .dj-t{flex:1 1 auto;min-width:0;font-weight:400;font-size:12.5px;color:#7b8892;',
'  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.dj-cur .dj-c{flex:0 0 auto;font-size:12px;opacity:.7;transition:transform .15s}',
'.dj-nav.open .dj-cur .dj-c{transform:rotate(180deg)}',
'.dj-list{margin-top:6px;border:1.5px solid #cfdae1;border-radius:12px;background:#fff;',
'  overflow:auto;max-height:56vh;box-shadow:0 6px 20px rgba(32,42,48,.10)}',
'.dj-list a{display:block;text-decoration:none;padding:10px 13px;border-left:5px solid transparent;',
'  border-bottom:1px solid #eef2f4;color:#54646e;font:inherit}',
'.dj-list a:last-child{border-bottom:none}',
'.dj-list a b{display:block;font-size:14px}',
'.dj-list a span{display:block;font-weight:400;font-size:12px;color:#7b8892;margin-top:2px}',
'.dj-list a.on{font-weight:800}',
/* 五色循環：warm 橘 / cool 藍 / plum 紫 / leaf 綠 / clay 磚，另加 slate 灰給總入口。
   第 1-3 週的顏色跟已經上線的完全一樣，不要動——學生已經認得了。 */
'[data-tone=slate]{border-left-color:#9aa8b2}',
'[data-tone=warm]{border-left-color:#e0821f}',
'[data-tone=cool]{border-left-color:#2f6690}',
'[data-tone=plum]{border-left-color:#7a3f92}',
'[data-tone=leaf]{border-left-color:#3f7a34}',
'[data-tone=clay]{border-left-color:#b8452f}',
'.dj-cur[data-tone=slate]{background:#eef1f3;border-color:#9aa8b2;color:#465059}',
'.dj-cur[data-tone=warm]{background:#fbead2;border-color:#e0821f;color:#a35f14}',
'.dj-cur[data-tone=cool]{background:#e5eff6;border-color:#2f6690;color:#2f6690}',
'.dj-cur[data-tone=plum]{background:#f2e7f6;border-color:#7a3f92;color:#7a3f92}',
'.dj-cur[data-tone=leaf]{background:#e9f3e3;border-color:#3f7a34;color:#3f7a34}',
'.dj-cur[data-tone=clay]{background:#fae9e4;border-color:#b8452f;color:#b8452f}',
'.dj-cur .dj-t{color:inherit;opacity:.72}',
/* ── 全站按鈕度量：三頁原本三套（unit1 是 14px/20px 且 border:none、
   w2 的 .btn 一律 width:100%、sf3k 是 12px/18px）。統一成 sf3k 那套，
   寬度維持各頁原本的意圖（主要動作滿寬、次要動作抱文字），只把「看起來像不像同一家」對齊。*/
'.btn,.btn-primary,.btn-ghost,button.pri,button.ok,button.wide{',
'  font-family:inherit;font-weight:700;font-size:15px;line-height:1.35;',
'  padding:12px 18px;border-radius:10px;border-width:1.5px;border-style:solid;cursor:pointer}',
'button.sm,.langbtn,.dj-lang button{padding:7px 12px;font-size:13px;border-radius:8px;',
'  border-width:1.5px;border-style:solid;line-height:1.35}',
/* ── 語言切換：收進右上角身分列，不要每頁再擺一排國旗大按鈕 ── */
'#dj-langchip{position:fixed;right:12px;top:12px;z-index:9998;background:#fff;',
'  border:1.5px solid #cfdae1;border-radius:999px;padding:6px 11px;cursor:pointer;',
'  font:800 13px/1.5 -apple-system,"PingFang TC",sans-serif;color:#54646e;',
'  box-shadow:0 2px 12px rgba(32,42,48,.14)}',
'@media (max-width:560px){#dj-langchip{padding:5px 9px;font-size:12px}}',
'.dj-gatelang{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}',
'.dj-gatelang button{flex:1 1 auto;background:#f7f9fa;border:1.5px solid #cfdae1;color:#54646e;',
'  border-radius:999px;padding:6px 12px;font:700 12.5px/1.4 inherit;cursor:pointer;white-space:nowrap}',
'.dj-gatelang button.sel{background:#f2e7f6;border-color:#7a3f92;color:#7a3f92}',
'.dj-gatelang button:disabled{opacity:.45;cursor:not-allowed}',
'.dj-gatelang .dj-note{flex:1 1 100%;font-size:11.5px;font-weight:400;color:#7b8892;line-height:1.5}',
'.dj-lang{position:fixed;right:12px;top:52px;z-index:9998;background:#fff;',
'  border:1.5px solid #cfdae1;border-radius:12px;box-shadow:0 6px 20px rgba(32,42,48,.14);',
'  padding:6px;min-width:172px}',
'.dj-lang button{display:block;width:100%;text-align:left;background:#fff;border-color:transparent;',
'  color:#54646e;font-family:inherit;font-weight:700;cursor:pointer;margin:1px 0}',
'.dj-lang button.sel{background:#eef1f3;border-color:#cfdae1;color:#2f6690}',
'.dj-lang .dj-note{font-size:11.5px;font-weight:400;color:#7b8892;padding:5px 12px 3px;line-height:1.5}',
'@media (max-width:560px){.dj-lang{right:10px;left:auto;max-width:calc(100vw - 20px)}}',
'#dj-bar{position:fixed;right:66px;top:12px;z-index:9998;background:#fff;border:1.5px solid #cfdae1;',
'  border-radius:999px;padding:6px 13px;font:700 13px/1.5 -apple-system,"PingFang TC",sans-serif;color:#54646e;',
'  box-shadow:0 2px 12px rgba(32,42,48,.14);cursor:pointer;max-width:calc(100vw - 90px);overflow:hidden;',
'  text-overflow:ellipsis;white-space:nowrap}',
/* 🔴 media query 不加權重：這條一定要排在上面 #dj-bar 基準規則之後，
   排前面的話 right:66px 會在手機上照樣贏，覆寫等於沒寫（2026-09-22 當場量到）。 */
'@media (max-width:560px){#dj-bar{right:56px;max-width:calc(100vw - 76px);font-size:12px;padding:5px 11px}}'
].join('\n');

  function injectCss() {
    if (document.getElementById('dj-gate-css')) return;
    var s = document.createElement('style'); s.id = 'dj-gate-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── QR：載入 qrcode-generator 再畫。全域是小寫 qrcode ── */
  function withQr(cb) {
    if (typeof window.qrcode === 'function') return cb();
    var s = document.createElement('script');
    s.src = QR_SRC;
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error('QR 函式庫載入失敗')); };
    document.head.appendChild(s);
  }
  function drawQr(elId, text) {
    withQr(function (err) {
      var el = document.getElementById(elId);
      if (!el) return;
      if (err) { el.innerHTML = '<span style="font-size:13px;color:#b8452f">QR 載入失敗，請直接用網址</span>'; return; }
      var q = window.qrcode(0, 'M');
      q.addData(text);
      q.make();
      el.innerHTML = q.createSvgTag(5, 8);
    });
  }

  /* ── 主畫面 ── */
  function openGate(reason) {
    injectCss();
    if (document.getElementById('dj-gate')) return;
    var d = document.createElement('div');
    d.id = 'dj-gate';
    var pageUrl = location.origin + location.pathname;
    d.innerHTML =
      '<div class="box" role="dialog" aria-modal="true" aria-label="進入前先綁定">' +
      '<div class="dj-gatelang" id="dj-gate-lang"></div>' +
      '<div class="course">文化遊戲松實作　<span>通識・綜合實踐領域</span><br>' +
        '遊戲設計學　<span>夜四技多樂一甲</span></div>' +
      '<h2>進入前，先綁定一次</h2>' +
      '<p class="sub">' + (reason || '確認你的信封編號與學校 Google 帳號。綁定之後，你在所有單元留下的紀錄都會連在一起。') + '</p>' +

      '<div class="step" id="dj-s1">' +
        '<div class="stitle"><span id="dj-t1">①</span> 確認 Google 帳號</div>' +
        '<div class="row" style="margin-top:7px">' +
          '<button class="pri" id="dj-google">用 Google 登入</button>' +
          '<span class="grow" id="dj-mail" style="font-size:14px;color:#54646e">尚未登入</span>' +
        '</div>' +
      '</div>' +

      '<div class="step" id="dj-s2">' +
        '<div class="stitle"><span id="dj-t2">②</span> 輸入你的信封編號</div>' +
        '<div class="row" style="margin-top:7px">' +
          '<div class="grow"><input id="dj-env" type="number" inputmode="numeric" min="0" max="130" ' +
            'placeholder="文化遊戲松 1-52 ／ 遊戲設計學 101 起"></div>' +
        '</div>' +
      '</div>' +

      '<div class="qrwrap"><div class="qrbox"><div id="dj-qr"></div></div>' +
        '<div class="qrcap">用手機掃這個 QR，可以在手機上開同一頁</div></div>' +

      '<div class="row" style="margin-top:10px"><button class="ok grow" id="dj-go" disabled>綁定並進入</button></div>' +
      '<p class="err" id="dj-err" style="display:none"></p>' +
      '<p class="tiny">登不進 Google？<a href="#" id="dj-skip">先只用編號進去</a>，' +
        '之後在任何一頁右上角都可以補綁。</p>' +
      '</div>';
    document.body.appendChild(d);
    drawQr('dj-qr', pageUrl);
    renderLangUI();   // 登入畫面就要能選語言，不是進去之後才有
    paintGate();

    var envI = document.getElementById('dj-env');
    var saved = ls(LS_ENV);
    if (saved != null && saved !== '') envI.value = saved;

    document.getElementById('dj-google').onclick = signIn;
    envI.addEventListener('input', refresh);
    document.getElementById('dj-go').onclick = commit;
    document.getElementById('dj-skip').onclick = function (e) { e.preventDefault(); commit(true); };
    refresh();
  }

  function showErr(msg) {
    var e = document.getElementById('dj-err');
    if (!e) return;
    e.textContent = msg; e.style.display = msg ? '' : 'none';
  }

  function refresh() {
    var envI = document.getElementById('dj-env');
    if (!envI) return;
    var raw = envI.value.trim();
    var v = raw === '' ? NaN : parseInt(raw, 10);
    var envOk = validEnv(v);                        // ⚠ 0 合法；100 不合法；上限 130
    st.env = envOk ? v : null;
    document.getElementById('dj-s1').className = 'step' + (st.email ? ' done' : '');
    document.getElementById('dj-s2').className = 'step' + (envOk ? ' done' : '');
    document.getElementById('dj-t1').textContent = st.email ? '✓' : '①';
    document.getElementById('dj-t1').className = st.email ? 'tick' : '';
    document.getElementById('dj-t2').textContent = envOk ? '✓' : '②';
    document.getElementById('dj-t2').className = envOk ? 'tick' : '';
    document.getElementById('dj-mail').textContent = st.email || '尚未登入';
    document.getElementById('dj-go').disabled = !(envOk && st.email) || st.busy;
  }

  function signIn() {
    showErr('');
    var auth = firebase.auth();
    var p = new firebase.auth.GoogleAuthProvider();
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (mobile) { try { localStorage.setItem('designjam_bind_pending', UNIT); } catch (e) {}
      return auth.signInWithRedirect(p); }
    auth.signInWithPopup(p).catch(function (e) {
      var code = (e && e.code) || '';
      if (/popup|blocked/i.test(code)) {            // popup 被擋 → 退回 redirect
        try { localStorage.setItem('designjam_bind_pending', UNIT); } catch (x) {}
        return auth.signInWithRedirect(p);
      }
      // 🔴 不要吞掉：使用者要能判斷是不是該重試
      showErr('登入失敗：' + (e && (e.message || e.code) || '不明原因'));
    });
  }

  function commit(skipMail) {
    if (st.busy) return;
    var envI = document.getElementById('dj-env');
    var v = envI ? parseInt(envI.value, 10) : NaN;
    if (!validEnv(v)) { showErr('這個編號不在名單範圍內。文化遊戲松是 1-52，遊戲設計學是 101 以上。'); return; }
    if (!skipMail && !st.email) { showErr('請先用 Google 登入'); return; }
    st.busy = true; refresh();
    lset(LS_ENV, String(v));
    if (st.email) { lset(LS_MAIL, st.email); lset(LS_UID, st.uid || ''); }
    var rec = { env: v, unit: UNIT, ts: firebase.database.ServerValue.TIMESTAMP };
    if (st.email) { rec.email = st.email; rec.name = st.name || null; rec.uid = st.uid || null; }
    var jobs = [root().child('envIndex/' + v).update(rec)];
    if (st.uid) jobs.push(root().child('identity/' + st.uid).update(rec));
    if (!st.email) jobs.push(root().child('unbound').push({ env: v, unit: UNIT, ts: rec.ts }));
    Promise.all(jobs).catch(function (e) {
      // 寫不進去也要讓學生進得去；但要留痕，不要假裝成功
      console.warn('[bind_gate] 寫入失敗', e);
    }).then(function () { location.reload(); });
  }


  /* ── 語言：一把鍵、一個控制項、四頁共用 ──
     🔴 LS_LANG 只有一把。舊的 designjam_w2_lang 只在第一次載入時搬過來，之後不再讀。 */
  var LS_LANG = 'designjam_lang';
  var LANGS = [
    { k: 'zh', label: '中文',            flag: '🇹🇼', short: '中' },
    { k: 'vi', label: 'Tiếng Việt',      flag: '🇻🇳', short: 'VI' },
    { k: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', short: 'ID' }
  ];
  /* 登入畫面自己的字。這是外籍生看到的第一個畫面，所以它一定要能翻，
     不能等到「哪一週做了多語系」才有。翻譯由 Vertex 產生，不是手打的。 */
  var GATE_I18N = window.DJ_GATE_I18N || {};

  (function migrateLang() {
    try {
      if (!localStorage.getItem(LS_LANG)) {
        var old = localStorage.getItem('designjam_w2_lang');
        if (old) localStorage.setItem(LS_LANG, old);
      }
    } catch (e) {}
  })();
  function getLang() {
    try { return localStorage.getItem(LS_LANG) || 'zh'; } catch (e) { return 'zh'; }
  }
  /* 這一頁翻得了嗎？＝它有沒有自己的翻譯器。
     unit1 曝 applyLang()、w2 曝 setLang()；index／sf3k 兩個都沒有 ⇒ 選項停用。
     🔴 停用要「看得到且講得出原因」，不是把按鈕藏起來——藏起來學生會以為是自己沒找到。 */
  function pageTranslator() {
    return (typeof window.applyLang === 'function') ? window.applyLang
         : (typeof window.setLang   === 'function') ? window.setLang
         : null;
  }
  function tGate(zh) {
    var lang = getLang();
    if (lang === 'zh') return zh;
    var e = GATE_I18N[zh];
    return (e && e[lang]) || zh;
  }
  /* 登入畫面的字是 bind_gate 自己畫的，所以直接掃它自己的子樹換字，
     不用管各頁的 i18n 機制長什麼樣。切回中文靠 __djZh 存的原文，不 reload。 */
  function paintGate() {
    var root = document.getElementById('dj-gate');
    if (!root) return;
    var lang = getLang();
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) {
      if (n.__djZh == null) n.__djZh = n.nodeValue;
      var zh = n.__djZh, key = zh.trim();
      if (!key) continue;
      n.nodeValue = (lang === 'zh') ? zh
        : zh.replace(key, (GATE_I18N[key] && GATE_I18N[key][lang]) || key);
    }
    var envI = document.getElementById('dj-env');
    if (envI) {
      if (envI.__djZh == null) envI.__djZh = envI.placeholder;
      envI.placeholder = (lang === 'zh') ? envI.__djZh
        : ((GATE_I18N[envI.__djZh] && GATE_I18N[envI.__djZh][lang]) || envI.__djZh);
    }
  }
  function setLangShared(k) {
    try { localStorage.setItem(LS_LANG, k); } catch (e) {}
    var fn = pageTranslator();
    if (fn) { try { fn(k); } catch (e) { console.warn('[lang] 頁面翻譯器出錯', e); } }
    paintGate();
    renderLangUI();
  }
  /* 語言選單：登入畫面直接把三個選項攤開（那是第一個畫面，要一眼看到）；
     綁定之後收進右上角身分列旁邊的 🌐，點開才展開。位置固定，不隨週次跑。 */
  function langMenuHtml() {
    var cur = getLang(), can = !!pageTranslator();
    var h = LANGS.map(function (L) {
      var off = (L.k !== 'zh' && !can);
      return '<button type="button" data-lang="' + L.k + '"'
        + (off ? ' disabled title="這一頁還沒有翻譯"' : '')
        + ' class="' + (L.k === cur ? 'sel' : '') + '">'
        + L.flag + ' ' + L.label + (off ? '　（這頁還沒翻）' : '') + '</button>';
    }).join('');
    if (!can) h += '<div class="dj-note">這一頁還沒有翻譯版本。其他單元有翻的話，'
                 + '你選的語言會被記住，過去就會自動套用。</div>';
    return h;
  }
  function wireLangButtons(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-lang]'), function (b) {
      if (b.disabled) return;
      b.onclick = function (e) { e.stopPropagation(); setLangShared(b.dataset.lang); };
    });
  }
  function renderLangUI() {
    var inGate = document.getElementById('dj-gate-lang');
    if (inGate) { inGate.innerHTML = langMenuHtml(); wireLangButtons(inGate); }
    var chip = document.getElementById('dj-langchip');
    if (chip) {
      var cur = getLang(), L = LANGS.filter(function (x) { return x.k === cur; })[0] || LANGS[0];
      chip.textContent = '🌐 ' + L.short;
    }
    var menu = document.getElementById('dj-langmenu');
    if (menu) { menu.innerHTML = langMenuHtml(); wireLangButtons(menu); }
    /* 各頁原本那排國旗按鈕藏掉——留著就會有兩個控制項、而且它們讀的是舊的鍵。 */
    ['.langswitch', '#w2LangZh', '#w2LangNote'].forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (o) {
        var box = (sel === '#w2LangZh') ? o.parentNode : o;
        if (box && box.style) box.style.display = 'none';
      });
    });
  }
  window.DJ_setLang = setLangShared;
  window.DJ_getLang = getLang;

  /* ── 共用單元導覽：一個定義，四頁共用 ──
     原本 unit1/w2 各寫一份（只有兩週、而且 w2 還標著過期的「本週」），sf3k 又是第三套。
     這裡注入 .dj-nav 並把各頁原本的 .unitnav 藏起來，之後換週只要改這個陣列。 */
  /* 🔴 加新的一週＝在這裡加一行，其他什麼都不用動（導覽、總入口清單、配色全部從這裡生）。
     tone 依五色循環取：warm→cool→plum→leaf→clay→warm…（第 6 週回到 warm）。
     「本週」不用手動標——取最後一個有 wk 的項目，加了新的一行就自動往前推。 */
  var TONES = ['warm', 'cool', 'plum', 'leaf', 'clay'];
  var UNITS = [
    { key: 'hub',  href: 'index.html', name: '總入口', desc: '每一週的學習單都在這裡', tone: 'slate' },
    { key: 'w1',   href: 'unit1.html', wk: 1, desc: '四種角色，孵出一個點子' },
    { key: 'w2',   href: 'w2.html',    wk: 2, desc: '文化怎麼放進遊戲裡' },
    { key: 'sf3k', href: 'sf3k.html',  wk: 3, desc: 'SiSSYFiGHT 三輪試玩' }
  ];
  UNITS.forEach(function (u) {
    if (u.wk) {
      if (!u.name) u.name = '第' + u.wk + '週';
      if (!u.tone) u.tone = TONES[(u.wk - 1) % TONES.length];
    }
  });
  var NOW_KEY = (function () {
    var last = null;
    UNITS.forEach(function (u) { if (u.wk) last = u; });
    return last ? last.key : null;
  })();
  function renderNav() {
    injectCss();
    if (document.querySelector('.dj-nav')) return;
    var cur = null;
    UNITS.forEach(function (u) { if (u.key === UNIT) cur = u; });
    if (!cur) cur = UNITS[0];

    var items = UNITS.map(function (u) {
      var on = (u.key === UNIT) ? ' on' : '';
      return '<a class="' + on.trim() + '" data-tone="' + u.tone + '" href="' + u.href + '">'
        + '<b>' + u.name + (u.key === NOW_KEY ? ' · 本週' : '') + (on ? '（你在這裡）' : '') + '</b>'
        + '<span>' + u.desc + '</span></a>';
    }).join('');

    var nav = document.createElement('nav');
    nav.className = 'dj-nav';
    nav.innerHTML =
      '<button type="button" class="dj-cur" data-tone="' + cur.tone + '" aria-expanded="false">'
      + '<span class="dj-k">' + cur.name + (cur.key === NOW_KEY ? ' · 本週' : '') + '</span>'
      + '<span class="dj-t">' + cur.desc + '</span>'
      + '<span class="dj-c">▼</span></button>'
      + '<div class="dj-list" hidden>' + items + '</div>';

    // 各頁原本自己那份導覽藏掉，避免兩排
    Array.prototype.forEach.call(document.querySelectorAll('.unitnav'), function (o) { o.style.display = 'none'; });
    var host = document.querySelector('.wrap') || document.body;
    host.insertBefore(nav, host.firstChild);

    var btn = nav.querySelector('.dj-cur'), list = nav.querySelector('.dj-list');
    btn.onclick = function () {
      var open = list.hidden;
      list.hidden = !open;
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !list.hidden) {
        list.hidden = true; nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── 已綁定時的小列 ── */
  function showBar() {
    injectCss();
    if (document.getElementById('dj-bar')) return;
    var env = ls(LS_ENV), mail = ls(LS_MAIL);
    var b = document.createElement('div');
    b.id = 'dj-bar';
    b.title = '點一下可以重新綁定';
    b.textContent = '#' + env + (mail ? ' · ' + mail : ' · 未綁 Gmail');
    b.onclick = function () {
      b.remove();
      var lc = document.getElementById('dj-langchip');
      if (lc) lc.remove();
      var lm = document.getElementById('dj-langmenu');
      if (lm) lm.remove();
      openGate(mail ? '要換人或換編號就改這裡。' : '你還沒綁 Google 帳號，現在補綁。');
    };
    document.body.appendChild(b);

    /* 語言切換：每一頁都在同一個地方（身分列左邊），不隨週次搬家。
       沒翻譯的頁面仍然看得到這顆，點開才知道「這頁還沒翻」——比整顆消失清楚。 */
    var chip = document.createElement('div');
    chip.id = 'dj-langchip';
    chip.title = '切換語言 / Language';
    chip.onclick = function (e) {
      e.stopPropagation();
      var m = document.getElementById('dj-langmenu');
      if (m) { m.remove(); return; }
      m = document.createElement('div');
      m.id = 'dj-langmenu';
      m.className = 'dj-lang';
      document.body.appendChild(m);
      renderLangUI();
      setTimeout(function () {
        document.addEventListener('click', function close(ev) {
          var mm = document.getElementById('dj-langmenu');
          if (mm && !mm.contains(ev.target)) { mm.remove(); document.removeEventListener('click', close); }
        });
      }, 0);
    };
    document.body.appendChild(chip);
    renderLangUI();
    // 這一頁有自己的翻譯器的話，把記住的語言套上去（原本各頁只讀自己那把鍵）
    var saved = getLang(), fn = pageTranslator();
    if (saved !== 'zh' && fn) { try { fn(saved); } catch (e) {} }
    // 🔴 固定定位會蓋住頁面最上緣（實測蓋掉單元導覽的「第3週」）。
    //    顯示時把 body 往下推讓出它的高度——不要只調 z-index，那只是決定誰蓋誰，內容還是被擋。
    requestAnimationFrame(function () {
      var h = b.getBoundingClientRect().height || 30;
      var cur = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      if (cur < h + 20) document.body.style.paddingTop = (h + 20) + 'px';
    });
  }

  /* ── 起手 ── */
  function boot() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      return setTimeout(boot, 120);                  // 等該頁自己 initializeApp
    }
    var auth;
    try { auth = firebase.auth(); } catch (e) {
      console.warn('[bind_gate] 這頁沒載 firebase-auth-compat，只能綁編號');
    }
    if (auth) {
      auth.onAuthStateChanged(function (u) {
        if (!u) return;
        st.uid = u.uid; st.email = u.email; st.name = u.displayName || (u.email || '').split('@')[0];
        refresh();
      });
      auth.getRedirectResult().then(function (r) {
        if (r && r.user) {
          try { localStorage.removeItem('designjam_bind_pending'); } catch (e) {}
        }
      }).catch(function (e) {
        if (e) showErr('登入失敗：' + (e.message || e.code));
      });
    }
    renderNav();
    var env = ls(LS_ENV), mail = ls(LS_MAIL);
    if (env != null && env !== '' && mail) showBar();
    else openGate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DJBind = { open: openGate, env: function () { var v = ls(LS_ENV); return v == null || v === '' ? null : parseInt(v, 10); },
                    email: function () { return ls(LS_MAIL); } };
})();
