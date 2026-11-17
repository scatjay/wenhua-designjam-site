/* 助教討論元件（W11 起）：學習單頁上和 AI 助教多輪討論，討論佔成績 30%。
   傳輸：寫 ctalk/q/{場次}/{編號}/{qid}，輪詢 ctalk/a/{場次}/{編號}/{qid}（和 tutor_core 的第二層同一個做法）；對話正本只在老師電腦本機。
   ⚠ 不用 alert／confirm／prompt。學生打的字一律用 textContent 顯示。網址 ?emu=1 只對測試編號 55–60 生效（打本機模擬器）。 */
(function () {
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', NS = 'gen-lang-client-0929530380-default-rtdb';
  var OPEN = {
    '47602': { W11: '用一句話說說你的遊戲：誰、在哪裡、要做什麼、好玩在哪？' },
    '46582': { W11: '你把走讀的畫面做成網頁，你選了哪一個畫面來還原？' }
  };
  var HINTS = window.CT_HINTS || {};
  var DAY_CAP = 20, MIN_ROUNDS = 3, MAX_ROUNDS = 8, TIMEOUT = 90000;
  var $ = function (id) { return document.getElementById(id); };
  var WID = window.CT_WID || {}, ID = false;
  function T(zh) { var t = WID[zh]; return ID && t ? zh + ' / ' + t.charAt(0).toUpperCase() + t.slice(1) : zh; }
  function idOn(env) { env = Number(env); var s = false; try { s = localStorage.getItem('gd_w11_id') === '1'; } catch (e) { s = false; } var q = new URLSearchParams(location.search).get('lang'); return q === 'id' ? true : q === 'zh' ? false : ((env >= 101 && env <= 130) || s); }
  function qparam(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tw(ms) { var d = new Date(ms + 8 * 3600 * 1000); return { ymd: d.toISOString().slice(0, 10).replace(/-/g, ''), h: d.getUTCHours() }; }
  function courseOf(env) { env = Number(env); if (env >= 55 && env <= 60) return 'test'; if (env >= 1 && env <= 52) return '47602'; if (env >= 101 && env <= 130) return '46582'; return ''; }
  function sessKey(env, ms) { var p = tw(ms), c = courseOf(env), half = p.h < 14 ? 'am' : 'pm'; if (!c) c = half === 'am' ? '47602' : '46582'; return c + '-' + p.ymd + half; }
  function openOf(env, unit) { var c = courseOf(env); if (c === 'test') c = '47602'; if (!c) c = pageCourse(); return (OPEN[c] || {})[unit] || ''; }
  function pageCourse() { return /gd_w/.test(location.pathname) ? '46582' : '47602'; }
  function hintsOf(env, unit, rounds) { var c = courseOf(env); if (c === 'test') c = '47602'; if (!c) c = pageCourse(); var u = ((HINTS[c] || {})[unit]) || {}, st = u.rounds || []; return st.length ? st[Math.min(rounds, st.length - 1)] : []; }
  function stepHintsOf(env, unit, n) { var c = courseOf(env); if (c === 'test') c = '47602'; if (!c) c = pageCourse(); var u = ((HINTS[c] || {})[unit]) || {}; return ((u.steps || {})[String(n)]) || []; }
  function curStep() { var ds = document.querySelectorAll('details.stage'), cur = 0, h = window.innerHeight * 0.55; for (var i = 0; i < ds.length; i++) { var r = ds[i].getBoundingClientRect(); if (r.top < h) cur = i + 1; } if (!ds.length) return 0; if (cur === 0) cur = 1; var sn = ds[cur - 1].querySelector('.sn'); return sn ? parseInt(sn.textContent, 10) || cur : cur; }
  function decisionOf(env, unit) { var c = courseOf(env); if (c === 'test') c = '47602'; if (!c) c = pageCourse(); return (((HINTS.decision || {})[c]) || {})[unit] || ''; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function stampNow(ms) { var d = new Date(ms || Date.now()); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function qid() { return String(Date.now()) + '_' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
  function css() {
    if ($('talkcss')) return;
    var s = document.createElement('style'); s.id = 'talkcss';
    s.textContent = '.tk{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:12px 14px;margin:10px 0}.tk .log{display:flex;flex-direction:column;gap:8px;margin:8px 0;max-height:420px;overflow:auto}'
      + '.tk .b{padding:8px 12px;border-radius:12px;max-width:92%;white-space:pre-wrap;word-break:break-word;line-height:1.6}.tk .a{background:var(--accent-soft,rgba(0,0,0,.05));align-self:flex-start}.tk .s{background:var(--accent);color:#fff;align-self:flex-end}'
      + '.tk textarea{width:100%;box-sizing:border-box;min-height:84px;font:inherit;padding:10px;border-radius:10px;border:1px solid var(--hair);background:var(--bg,#fff);color:inherit}'
      + '.tk button{min-height:44px;min-width:88px;padding:6px 16px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:inherit;cursor:pointer}.tk button.g{background:transparent;color:var(--accent)}.tk button[disabled]{opacity:.5;cursor:default}'
      + '.tk .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}.tk .cnt{font-size:13px;opacity:.8}.tk .sumbox{border:1px dashed var(--accent);border-radius:10px;padding:10px;margin-top:8px}'
      + '.tk .hints{margin-top:8px}.tk .hints .hb{display:flex;gap:6px;flex-wrap:wrap}.tk .hints button.h{min-width:0;min-height:44px;padding:6px 12px;border-radius:12px;background:transparent;color:var(--accent);text-align:left;font-size:14px;line-height:1.35}'
      + '.tk .rc{border:2px solid var(--accent);border-radius:14px;padding:12px 14px;margin-top:10px;background:var(--bg,#fff)}.tk .rc h4{margin:0 0 6px;font-size:17px}.tk .rc dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:15px;line-height:1.5}.tk .rc dt{opacity:.75}.tk .rc dd{margin:0;word-break:break-word}.tk .rc .code{font:700 26px ui-monospace,Consolas,monospace;letter-spacing:.1em}.tk .rc .tag{font-size:12px;opacity:.8}';
    document.head.appendChild(s);
  }
  var APIREF = { a: null };
  function mount(el, DK) {
    css();
    var unit = el.getAttribute('data-unit') || 'W11';
    var env = parseInt(localStorage.getItem('designjam_env'), 10);
    var qe = parseInt(qparam('env'), 10); if (isFinite(qe) && qe >= 55 && qe <= 60) env = qe;
    ID = idOn(env);
    var unbound = !isFinite(env), forced = 0, DOCK = DK || window.TA_DOCK && window.TA_DOCK.get();
    var emu = qparam('emu') === '1' && env >= 55 && env <= 60, port = qparam('emuPort') || '9012';
    var base = emu ? 'http://127.0.0.1:' + port : DB, qs = emu ? '?ns=' + NS : '';
    var sess = sessKey(env, Date.now()), LK = 'talk_' + sess + '_' + env + '_' + unit;
    var st = { rounds: 0, done: false, summary: '', confirmed: false, msgs: [] };
    try { var sv = JSON.parse(localStorage.getItem(LK) || 'null'); if (sv && sv.msgs) st = sv; } catch (e) { /* 讀不到就從頭 */ }
    var open = openOf(env, unit); if (open) open = T(open);
    el.innerHTML = '<div class="tk"><div class="log" id="tk-log" aria-live="polite"></div>'
      + '<div class="hints" id="tk-hints"></div>'
      + '<textarea id="tk-in" maxlength="600" placeholder="' + T('用你自己的話回答（一兩句就好）') + '" aria-label="' + T('用你自己的話回答（一兩句就好）') + '"></textarea>'
      + '<div class="row"><button type="button" id="tk-send">' + T('送出') + '</button><span class="cnt" id="tk-cnt"></span></div>'
      + '<p class="note" id="tk-msg" role="status"></p><div id="tk-sum"></div></div>';
    var hintBox = $('tk-hints'), log = $('tk-log'), inp = $('tk-in'), btn = $('tk-send'), msg = $('tk-msg'), cnt = $('tk-cnt'), sum = $('tk-sum');
    function save() { try { localStorage.setItem(LK, JSON.stringify(st)); } catch (e) { /* 存不下照樣可用 */ } }
    function bubble(cls, t) { var d = document.createElement('div'); d.className = 'b ' + cls; if (cls === 'a' && window.TA_DOCK) window.TA_DOCK.linkify(d, t); else d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
    function paint() {
      log.innerHTML = ''; if (open) bubble('a', open);
      st.msgs.forEach(function (m) { bubble(m.w === 's' ? 's' : 'a', m.t); });
      cnt.textContent = T('已討論 {n} 輪（至少 {m} 輪才會被評；一天最多 {d} 輪）').split('{n}').join(st.rounds).split('{m}').join(MIN_ROUNDS).split('{d}').join(DAY_CAP);
      if (st.done && !st.confirmed) showSummary();
      paintHints();
      if (st.confirmed) { paintCard(); inp.disabled = true; btn.disabled = true; }
    }
    function paintHints() {
      hintBox.innerHTML = '';
      if (st.confirmed || st.done || st.editing || st.rounds >= MAX_ROUNDS) return;
      var stp = forced || (st.rounds === 0 ? curStep() : 0), hs = stp ? stepHintsOf(env, unit, stp) : []; if (!hs.length) hs = hintsOf(env, unit, st.rounds); if (!hs.length) return;
      var p = document.createElement('p'); p.className = 'note'; p.textContent = (stp && stepHintsOf(env, unit, stp).length) ? T('你現在在第 {n} 步，可以這樣開口（點一個放進框裡，改成你自己的話再送出）：').split('{n}').join(stp) : T('不知道怎麼開口？點一個句型放進框裡，改成你自己的話再送出。'); hintBox.appendChild(p);
      var row = document.createElement('div'); row.className = 'hb';
      hs.forEach(function (h) { var b = document.createElement('button'); b.type = 'button'; b.className = 'h'; b.textContent = T(h); b.onclick = function () { inp.value = h; inp.focus(); }; row.appendChild(b); });
      hintBox.appendChild(row);
    }
    function paintCard() {
      sum.innerHTML = '';
      var card = document.createElement('div'); card.className = 'rc'; card.setAttribute('role', 'group');
      var rows = [[T('單元'), unit], [T('這週的決定點'), decisionOf(env, unit)], [T('你確認的那一句'), st.summary], [T('討論輪數'), String(st.rounds)], [T('代碼'), st.code || '—'], [T('完成時間'), st.at || '']];
      var h = document.createElement('h4'); h.textContent = T('已完成本週討論'); card.appendChild(h);
      var dl = document.createElement('dl');
      rows.forEach(function (r) { if (!r[1] && r[0] !== T('代碼')) return; var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; if (r[0] === T('代碼')) dd.className = 'code'; dl.appendChild(dt); dl.appendChild(dd); });
      card.appendChild(dl);
      var tag = document.createElement('p'); tag.className = 'tag'; tag.textContent = (st.edited ? T('那一句是你自己改寫的。') : T('那一句由助教整理，你確認過。')); card.appendChild(tag);
      var tip = document.createElement('p'); tip.className = 'note'; tip.textContent = T('請把這個畫面截圖，交到 flipclass。畫面上只有代碼，不顯示你的編號。'); card.appendChild(tip);
      sum.appendChild(card);
    }
    function showSummary() {
      sum.innerHTML = '<div class="sumbox"><b id="tk-sh"></b><div id="tk-s"></div><div class="row"><button type="button" id="tk-ok"></button><button type="button" class="g" id="tk-ed"></button></div></div>';
      $('tk-sh').textContent = T('助教幫你整理成一句：'); $('tk-ok').textContent = T('對，就這樣'); $('tk-ed').textContent = T('我改一下');
      $('tk-s').textContent = st.summary;
      $('tk-ok').onclick = function () { confirmIt(st.summary); };
      $('tk-ed').onclick = function () { inp.value = st.summary; inp.focus(); msg.textContent = T('改好之後按「送出」，就會用你改的這一句。'); st.editing = true; };
    }
    function put(kind, text) {
      var id = qid(), url = function (n) { return base + '/ctalk/' + (n === 'talkq' ? 'q' : 'a') + '/' + encodeURIComponent(sess) + '/' + encodeURIComponent(env) + '/' + id + '.json' + qs; };
      return fetch(url('talkq'), { method: 'PUT', body: JSON.stringify({ t: { '.sv': 'timestamp' }, unit: unit, text: text, kind: kind }), headers: { 'Content-Type': 'application/json' } }).then(function (r) {
        if (!r.ok) throw new Error('put-' + r.status);
        var t0 = Date.now();
        return new Promise(function (res, rej) {
          (function poll() {
            if (Date.now() - t0 > TIMEOUT) return rej(new Error('timeout'));
            fetch(url('talka')).then(function (g) { return g.ok ? g.json() : null; }).then(function (a) { if (a && a.say) res(a); else setTimeout(poll, 1200); }).catch(function () { setTimeout(poll, 1500); });
          })();
        });
      });
    }
    function confirmIt(text) {
      btn.disabled = true; msg.textContent = T('記下中…');
      put('confirm', text).then(function (a) { st.confirmed = true; st.edited = (text !== st.autoSummary); st.summary = text; st.editing = false; st.at = stampNow(); if (a && a.code) { st.code = a.code; try { localStorage.setItem('ct_code_' + unit, a.code); } catch (e) { /* 存不下照樣可用 */ } } save(); msg.textContent = ''; paint(); })
        .catch(function () { msg.textContent = T('現在送不出去，過一下再按一次。'); btn.disabled = false; });
    }
    btn.onclick = function () {
      var text = inp.value.trim();
      if (!text) { msg.textContent = T('先寫一兩句再送出。'); return; }
      if (st.editing) { confirmIt(text); inp.value = ''; return; }
      if (st.rounds >= MAX_ROUNDS) { msg.textContent = T('這次討論已經滿 8 輪了。'); return; }
      btn.disabled = true; inp.disabled = true; msg.textContent = T('助教想一下…（最多等 1 分半）');
      st.msgs.push({ w: 's', t: text }); inp.value = ''; forced = 0; paint(); save(); hintBox.innerHTML = '';
      put('talk', text).then(function (a) {
        st.msgs.push({ w: 'a', t: a.say }); if (!a.rule && !a.capped) st.rounds = a.n || (st.rounds + 1);
        if (a.code) { st.code = a.code; try { localStorage.setItem('ct_code_' + unit, a.code); } catch (e) { /* 沒存成也沒關係 */ } }
        if (a.done) { st.done = true; st.summary = a.summary || ''; st.autoSummary = st.summary; }
        if (DOCK) DOCK.setPause(false);
        save(); msg.textContent = ''; btn.disabled = false; inp.disabled = false; paint(); inp.focus();
      }).catch(function (e) {
        if (DOCK) DOCK.setPause(true);
        st.msgs.pop(); inp.value = text; save(); paint();
        msg.textContent = e && e.message === 'timeout' ? T('助教這會兒沒有回。你寫的字還在框裡，過一下再按送出。') : T('現在送不出去。你寫的字還在框裡，過一下再按送出。');
        btn.disabled = false; inp.disabled = false;
      });
    };
    paint();
    if (unbound) {
      inp.disabled = true; btn.disabled = true; msg.textContent = '';
      if (DOCK) DOCK.setLock(T('尚未綁定編號：助教先鎖住，你可以先看下面的引導問項。請點頁面右上角的小圓標，或重新整理頁面來綁定；綁好之後這裡就能和助教討論。'));
      hintBox.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      var iv = setInterval(function () { var e = parseInt(localStorage.getItem('designjam_env'), 10); if (isFinite(e)) { clearInterval(iv); if (DOCK) DOCK.setLock(''); mount(el, DOCK); } }, 2000);
    }
    APIREF.a = { ask: function (n, title) { forced = n; if (DOCK) DOCK.setCtx('第 ' + n + ' 步：' + title); paintHints(); } };
    var tmr = null; window.addEventListener('scroll', function () { if (st.rounds !== 0 || st.confirmed) return; clearTimeout(tmr); tmr = setTimeout(paintHints, 250); }, { passive: true });
  }
  window.CT_TALK = { mount: mount, _sessKey: sessKey, _courseOf: courseOf };
  function auto() {
    var el = $('talkMount'); if (!el || !window.TA_DOCK) return;
    css();
    var unit = el.getAttribute('data-unit') || 'W11';
    var env0 = parseInt(localStorage.getItem('designjam_env'), 10); ID = idOn(env0);
    var DK = window.TA_DOCK.create({}), holder = document.createElement('div'), mounted = false;
    holder.setAttribute('data-unit', unit); DK.body.appendChild(holder);
    function ensure() { if (!mounted) { mounted = true; mount(holder, DK); } }
    DK.onOpen = function () { ensure(); if (!APIREF.a || !DK.panel.querySelector('#ta-ctx').textContent) DK.setCtx('目前在：第 ' + (curStep() || 1) + ' 步'); };
    el.innerHTML = '<p class="note">' + esc(T('AI 助教在畫面右下角的「問AI助教」，還沒綁定編號也能先打開看。')) + '</p><button type="button" id="tk-open" style="min-height:44px;padding:6px 18px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:inherit;cursor:pointer">' + esc(T('打開右下角助教')) + '</button>';
    $('tk-open').onclick = function () { DK.open(true); };
    // 每一步旁邊的「問AI助教」小鈕＋給每一步一個可以被連結的 id
    document.querySelectorAll('details.stage').forEach(function (d) {
      var sn = d.querySelector('.sn'), n = sn ? parseInt(sn.textContent, 10) : 0, sb = d.querySelector('.sb'); if (!n || !sb) return;
      if (!d.id) d.id = 'step' + n;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'askbtn'; b.textContent = '問AI助教';
      b.onclick = function () { ensure(); DK.open(true); var t = d.querySelector('.st2'); if (APIREF.a) APIREF.a.ask(n, t ? t.textContent : ''); };
      sb.insertBefore(b, sb.firstChild);
    });
    window.CT_TALK_OPEN = function () { DK.open(true); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
