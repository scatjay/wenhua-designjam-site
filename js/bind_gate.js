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

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  function root() { return firebase.database().ref('whgm/analysis/w3game'); }

  /* ── 樣式 ── */
  var CSS = [
'#dj-gate{position:fixed;inset:0;z-index:99999;background:rgba(32,42,48,.62);backdrop-filter:blur(3px);',
'  display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}',
'#dj-gate .box{background:#fff;color:#202a30;max-width:520px;width:100%;border-radius:16px;padding:22px 20px 18px;',
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
'#dj-gate .qrcap{font-size:13px;color:#54646e;margin-top:7px;line-height:1.6}',
'#dj-gate .tiny{font-size:13px;color:#54646e;margin-top:14px;line-height:1.7}',
'#dj-gate .tiny a{color:#2f6690}',
'#dj-bar{position:fixed;right:12px;top:12px;z-index:9998;background:#fff;border:1.5px solid #cfdae1;',
'  border-radius:999px;padding:6px 13px;font:700 13px/1.5 -apple-system,"PingFang TC",sans-serif;color:#54646e;',
'  box-shadow:0 2px 12px rgba(32,42,48,.14);cursor:pointer;max-width:72vw;overflow:hidden;',
'  text-overflow:ellipsis;white-space:nowrap}'
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
          '<div class="grow"><input id="dj-env" type="number" inputmode="numeric" min="0" max="99" placeholder="0 - 99"></div>' +
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
    var envOk = !isNaN(v) && v >= 0 && v <= 99;     // ⚠ 0 合法
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
    if (isNaN(v) || v < 0 || v > 99) { showErr('請輸入 0-99 的編號'); return; }
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
      openGate(mail ? '要換人或換編號就改這裡。' : '你還沒綁 Google 帳號，現在補綁。');
    };
    document.body.appendChild(b);
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
    var env = ls(LS_ENV), mail = ls(LS_MAIL);
    if (env != null && env !== '' && mail) showBar();
    else openGate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DJBind = { open: openGate, env: function () { var v = ls(LS_ENV); return v == null || v === '' ? null : parseInt(v, 10); },
                    email: function () { return ls(LS_MAIL); } };
})();
