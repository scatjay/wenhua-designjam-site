/* 助教討論元件（W11 起）：學習單頁上和 AI 助教多輪討論，討論佔作業 30%。
   傳輸：寫 ctalk/q/{場次}/{編號}/{qid}，輪詢 ctalk/a/{場次}/{編號}/{qid}（和 tutor_core 的第二層同一個做法）；對話正本只在老師電腦本機。
   ⚠ 不用 alert／confirm／prompt。學生打的字一律用 textContent 顯示。網址 ?emu=1 只對測試編號 55–60 生效（打本機模擬器）。 */
(function () {
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', NS = 'gen-lang-client-0929530380-default-rtdb';
  var OPEN = {
    '47602': { W11: '兩版都玩完了，你選哪一個樣板？' },
    '46582': { W11: '你把走讀的畫面做成網頁，你選了哪一個畫面來還原？' }
  };
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
  function openOf(env, unit) { var c = courseOf(env); if (c === 'test') c = '47602'; if (!c) c = tw(Date.now()).h < 14 ? '47602' : '46582'; return (OPEN[c] || {})[unit] || ''; }
  function qid() { return String(Date.now()) + '_' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
  function css() {
    if ($('talkcss')) return;
    var s = document.createElement('style'); s.id = 'talkcss';
    s.textContent = '.tk{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:12px 14px;margin:10px 0}.tk .log{display:flex;flex-direction:column;gap:8px;margin:8px 0;max-height:420px;overflow:auto}'
      + '.tk .b{padding:8px 12px;border-radius:12px;max-width:92%;white-space:pre-wrap;word-break:break-word;line-height:1.6}.tk .a{background:var(--accent-soft,rgba(0,0,0,.05));align-self:flex-start}.tk .s{background:var(--accent);color:#fff;align-self:flex-end}'
      + '.tk textarea{width:100%;box-sizing:border-box;min-height:84px;font:inherit;padding:10px;border-radius:10px;border:1px solid var(--hair);background:var(--bg,#fff);color:inherit}'
      + '.tk button{min-height:44px;min-width:88px;padding:6px 16px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:inherit;cursor:pointer}.tk button.g{background:transparent;color:var(--accent)}.tk button[disabled]{opacity:.5;cursor:default}'
      + '.tk .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}.tk .cnt{font-size:13px;opacity:.8}.tk .sumbox{border:1px dashed var(--accent);border-radius:10px;padding:10px;margin-top:8px}';
    document.head.appendChild(s);
  }
  function mount(el) {
    css();
    var unit = el.getAttribute('data-unit') || 'W11';
    var env = parseInt(localStorage.getItem('designjam_env'), 10);
    var qe = parseInt(qparam('env'), 10); if (isFinite(qe) && qe >= 55 && qe <= 60) env = qe;
    ID = idOn(env);
    if (!isFinite(env)) { el.innerHTML = '<p class="note">' + T('先在上面綁定你的編號，助教討論才會出現。') + '</p>'; return; }
    var emu = qparam('emu') === '1' && env >= 55 && env <= 60, port = qparam('emuPort') || '9012';
    var base = emu ? 'http://127.0.0.1:' + port : DB, qs = emu ? '?ns=' + NS : '';
    var sess = sessKey(env, Date.now()), LK = 'talk_' + sess + '_' + env + '_' + unit;
    var st = { rounds: 0, done: false, summary: '', confirmed: false, msgs: [] };
    try { var sv = JSON.parse(localStorage.getItem(LK) || 'null'); if (sv && sv.msgs) st = sv; } catch (e) { /* 讀不到就從頭 */ }
    var open = openOf(env, unit); if (open) open = T(open);
    el.innerHTML = '<div class="tk"><div class="log" id="tk-log" aria-live="polite"></div>'
      + '<textarea id="tk-in" maxlength="600" placeholder="' + T('用你自己的話回答（一兩句就好）') + '" aria-label="' + T('用你自己的話回答（一兩句就好）') + '"></textarea>'
      + '<div class="row"><button type="button" id="tk-send">' + T('送出') + '</button><span class="cnt" id="tk-cnt"></span></div>'
      + '<p class="note" id="tk-msg" role="status"></p><div id="tk-sum"></div></div>';
    var log = $('tk-log'), inp = $('tk-in'), btn = $('tk-send'), msg = $('tk-msg'), cnt = $('tk-cnt'), sum = $('tk-sum');
    function save() { try { localStorage.setItem(LK, JSON.stringify(st)); } catch (e) { /* 存不下照樣可用 */ } }
    function bubble(cls, t) { var d = document.createElement('div'); d.className = 'b ' + cls; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
    function paint() {
      log.innerHTML = ''; if (open) bubble('a', open);
      st.msgs.forEach(function (m) { bubble(m.w === 's' ? 's' : 'a', m.t); });
      cnt.textContent = T('已討論 {n} 輪（至少 {m} 輪才會被評；一天最多 {d} 輪）').split('{n}').join(st.rounds).split('{m}').join(MIN_ROUNDS).split('{d}').join(DAY_CAP);
      if (st.done && !st.confirmed) showSummary();
      if (st.confirmed) { sum.innerHTML = ''; var p = document.createElement('p'); p.className = 'note'; p.textContent = T('已記下：') + st.summary; sum.appendChild(p); inp.disabled = true; btn.disabled = true; }
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
      put('confirm', text).then(function () { st.confirmed = true; st.summary = text; st.editing = false; save(); msg.textContent = ''; paint(); })
        .catch(function () { msg.textContent = T('現在送不出去，過一下再按一次。'); btn.disabled = false; });
    }
    btn.onclick = function () {
      var text = inp.value.trim();
      if (!text) { msg.textContent = T('先寫一兩句再送出。'); return; }
      if (st.editing) { confirmIt(text); inp.value = ''; return; }
      if (st.rounds >= MAX_ROUNDS) { msg.textContent = T('這次討論已經滿 8 輪了。'); return; }
      btn.disabled = true; inp.disabled = true; msg.textContent = T('助教想一下…（最多等 1 分半）');
      st.msgs.push({ w: 's', t: text }); inp.value = ''; paint(); save();
      put('talk', text).then(function (a) {
        st.msgs.push({ w: 'a', t: a.say }); if (!a.rule && !a.capped) st.rounds = a.n || (st.rounds + 1);
        if (a.done) { st.done = true; st.summary = a.summary || ''; }
        save(); msg.textContent = ''; btn.disabled = false; inp.disabled = false; paint(); inp.focus();
      }).catch(function (e) {
        st.msgs.pop(); inp.value = text; save(); paint();
        msg.textContent = e && e.message === 'timeout' ? T('助教這會兒沒有回。你寫的字還在框裡，過一下再按送出。') : T('現在送不出去。你寫的字還在框裡，過一下再按送出。');
        btn.disabled = false; inp.disabled = false;
      });
    };
    paint();
  }
  window.CT_TALK = { mount: mount, _sessKey: sessKey, _courseOf: courseOf };
  function auto() { var el = $('talkMount'); if (el) mount(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
