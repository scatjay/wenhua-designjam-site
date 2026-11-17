/* 學習單內問卷元件：課程自我檢核問卷（W11 前測，11-17 楊老師：問卷直接放學習單裡、不用 Google 表單；配分 3%，貼完成畫面截圖就好）。
   題本＝教學實踐線 Q1–Q4 原句＋課程線母線 11-17 19:3x 定稿 Q5–Q15（15 題、4 構面、五點）。
   送出：寫 ctalk/q（kind=survey）→ 本機代理程式封存到 _scan/_survey_w11_sealed/（gitignore）；不寫進公開資料庫。
   完成碼學生端本來就拿得到：不填也能拿碼，網路送不出去也能拿碼。完成畫面不顯示信封編號，適合手機一張截圖。⚠ 不用 alert／confirm／prompt。 */
(function () {
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', NS = 'gen-lang-client-0929530380-default-rtdb';
  var SURVEY = /*SVY*/{
    "ready": true, "version": "v2", "unit": "W11", "code": "GPS1118",
    "title": "課程自我檢核問卷（約 4 分鐘）",
    "intro": "這份問卷想了解你平常怎麼用 AI。不計分，跟成績無關，也沒有標準答案。每一句請照你平常的情況選一個：「主要為了學分」「卡住就直接問 AI」都是很常見、很正常的答案，填了不會有任何影響。只用你的編號作答，不寫名字。大約 4 分鐘。",
    "ask": "這句話跟你平常的情況有多符合？",
    "scale": ["完全不符合", "不太符合", "有點符合", "相當符合", "非常符合"],
    "dims": [
      {"id": "A", "name": "一、你為什麼在這門課做事", "items": [
        "我會在這門課認真做作品，是因為要拿到學分和成績。",
        "我會照著老師或 AI 助教的建議做，是因為照做比自己想容易。",
        "我會在這門課認真做作品，是因為把文化放進遊戲，對我來說是重要的。",
        "我會在這門課認真做作品，是因為做這個遊戲很有意思。"]},
      {"id": "B", "name": "二、平常你怎麼用 AI", "items": [
        "平常查資料、整理筆記、排版這類事，我會直接交給 AI 做。",
        "需要做決定的事（例如內容合不合適、作品要怎麼呈現），我會自己想，不會全部交給 AI。",
        "AI 給我的回答，我通常會先挑過、改過才用。",
        "AI 給我的回答，我常常直接複製貼上就用。"]},
      {"id": "C", "name": "三、遇到不會的事", "items": [
        "遇到不會的事，我會先自己想一想或查一查，再去問 AI。",
        "遇到不會的事，我會直接請 AI 給我答案。",
        "AI 回答之後，我會想一想它為什麼這樣說、說得對不對。"]},
      {"id": "D", "name": "四、平常的經驗", "items": [
        "我一個星期裡有好幾天都會用 AI（例如 ChatGPT、Gemini、Claude）。",
        "我平常也會用 AI 做課業以外的事（例如生活、興趣、打工）。",
        "修這門課之前，我做過完整的遊戲或互動作品（課堂作業、比賽或自己做的都算）。",
        "修這門課之前，我寫過程式，或用過遊戲製作工具（例如 Unity、Unreal、RPG Maker、Scratch）。"]}
    ]
  }/*END*/;
  var $ = function (id) { return document.getElementById(id); };
  var WID = window.CT_WID || {}, ID = false;
  function T(zh) { var t = WID[zh]; return ID && t ? zh + ' / ' + t.charAt(0).toUpperCase() + t.slice(1) : zh; }
  function idOn(env) { env = Number(env); var q = new URLSearchParams(location.search).get('lang'); return q === 'id' ? true : q === 'zh' ? false : (env >= 101 && env <= 130); }
  function qparam(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function stampNow(ms) { var d = new Date(ms || Date.now()); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function tw(ms) { var d = new Date(ms + 8 * 3600 * 1000); return { ymd: d.toISOString().slice(0, 10).replace(/-/g, ''), h: d.getUTCHours() }; }
  function courseOf(env) { env = Number(env); if (env >= 55 && env <= 60) return 'test'; if (env >= 1 && env <= 52) return '47602'; if (env >= 101 && env <= 130) return '46582'; return ''; }
  function sessKey(env, ms) { var p = tw(ms), c = courseOf(env), half = p.h < 14 ? 'am' : 'pm'; if (!c) c = half === 'am' ? '47602' : '46582'; return c + '-' + p.ymd + half; }
  function qid() { return String(Date.now()) + '_' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
  function css() {
    if ($('svycss')) return;
    var s = document.createElement('style'); s.id = 'svycss';
    s.textContent = '.sy .it{margin:12px 0;padding:10px 12px;border:1px solid var(--hair);border-radius:12px;background:var(--surface)}.sy .it .q{margin:0 0 4px}.sy .it .ask{margin:0 0 6px;font-size:13px;opacity:.75}.sy .sc{display:flex;gap:6px;flex-wrap:wrap}'
      + '.sy .sc label{flex:1 1 56px;min-height:44px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px solid var(--hair);border-radius:10px;padding:4px 6px;cursor:pointer;font-size:14px;line-height:1.3}'
      + '.sy .sc input{position:absolute;opacity:0;pointer-events:none}.sy .sc label.on{background:var(--accent);color:#fff;border-color:var(--accent)}'
      + '.sy button{min-height:44px;min-width:88px;padding:6px 16px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:inherit;cursor:pointer}.sy button.g{background:transparent;color:var(--accent)}'
      + '.sy .card{border:2px solid var(--accent);border-radius:14px;padding:14px 16px;margin-top:10px;background:var(--bg,#fff);max-width:420px}.sy .card h4{margin:0 0 8px;font-size:18px}'
      + '.sy .card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:15px}.sy .card dt{opacity:.75}.sy .card dd{margin:0}'
      + '.sy .code{font:700 28px ui-monospace,Consolas,monospace;letter-spacing:.1em}';
    document.head.appendChild(s);
  }
  function mount(sec, el) {
    if (!SURVEY.ready) { if (sec) sec.hidden = true; return; }
    if (sec) sec.hidden = false; var nav = $('nav-survey'); if (nav) nav.hidden = false;
    css();
    var env = parseInt(localStorage.getItem('designjam_env'), 10), qe = parseInt(qparam('env'), 10); if (isFinite(qe) && qe >= 55 && qe <= 60) env = qe;
    ID = idOn(env);
    var emu = qparam('emu') === '1' && env >= 55 && env <= 60, port = qparam('emuPort') || '9012';
    var base = emu ? 'http://127.0.0.1:' + port : DB, qs = emu ? '?ns=' + NS : '';
    var DK = 'survey_' + SURVEY.unit + '_done';
    var ans = {}, html = ['<div class="sy"><p class="note" id="sy-intro"></p><div id="sy-open" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button type="button" id="sy-yes">' + esc(T('願意填')) + '</button><button type="button" class="g" id="sy-no">' + esc(T('這次不填')) + '</button></div><div id="sy-form" hidden>'];
    SURVEY.dims.forEach(function (d) {
      html.push('<h3>' + esc(T(d.name)) + '</h3>');
      d.items.forEach(function (t, i) {
        var k = d.id + (i + 1);
        html.push('<div class="it" data-k="' + k + '"><p class="q">' + esc(T(t)) + '</p><p class="ask">' + esc(T(SURVEY.ask)) + '</p><div class="sc" role="radiogroup" aria-label="' + esc(t) + '">');
        SURVEY.scale.forEach(function (lab, v) { html.push('<label><input type="radio" name="' + k + '" value="' + (v + 1) + '">' + (v + 1) + ' ' + esc(T(lab)) + '</label>'); });
        html.push('</div></div>');
      });
    });
    html.push('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" id="sy-go">' + esc(T('送出')) + '</button></div></div><p class="note" id="sy-msg" role="status"></p><div id="sy-done"></div></div>');
    el.innerHTML = html.join('');
    $('sy-intro').textContent = T(SURVEY.intro);
    el.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.onchange = function () { var it = r.closest('.it'); it.querySelectorAll('label').forEach(function (l) { l.classList.remove('on'); }); r.parentNode.classList.add('on'); ans[r.name] = r.value; };
    });
    function showCard(sent, at) {
      $('sy-open').hidden = true; $('sy-form').hidden = true; $('sy-intro').hidden = true;
      var box = $('sy-done'); box.innerHTML = '';
      var card = document.createElement('div'); card.className = 'card'; card.setAttribute('role', 'group');
      var h = document.createElement('h4'); h.textContent = T('已完成課程自我檢核問卷'); card.appendChild(h);
      var dl = document.createElement('dl');
      [[T('完成碼'), SURVEY.code, 'code'], [T('完成時間'), at, '']].forEach(function (r) { var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; if (r[2]) dd.className = r[2]; dl.appendChild(dt); dl.appendChild(dd); });
      card.appendChild(dl); box.appendChild(card);
      var tip = document.createElement('p'); tip.className = 'note'; tip.textContent = T('請把這個畫面截圖，交到 flipclass 的 W11-1。'); box.appendChild(tip);
      var sn = document.createElement('p'); sn.className = 'note'; sn.textContent = sent === 'skip' ? T('這次不填也算完成，不影響你。') : (sent ? T('已收到你的回答。') : T('你的回答這次沒送出去（網路或老師電腦沒開），完成碼照樣有效，不影響你。')); box.appendChild(sn);
    }
    function remember(sent) { var at = stampNow(); try { localStorage.setItem(DK, JSON.stringify({ at: at, sent: sent })); } catch (e) { /* 存不下也沒關係 */ } return at; }
    function send(text) {
      if (!isFinite(env)) return Promise.reject(new Error('no-env'));
      var sess = sessKey(env, Date.now()), id = qid(), url = base + '/ctalk/q/' + encodeURIComponent(sess) + '/' + encodeURIComponent(env) + '/' + id + '.json' + qs;
      return fetch(url, { method: 'PUT', body: JSON.stringify({ t: { '.sv': 'timestamp' }, unit: SURVEY.unit, text: text, kind: 'survey' }), headers: { 'Content-Type': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('put-' + r.status); });
    }
    function finish(text, btns, skipped) {
      btns.forEach(function (b) { b.disabled = true; });
      send(text).then(function () { showCard(skipped ? 'skip' : true, remember(skipped ? 'skip' : true)); }).catch(function () { showCard(skipped ? 'skip' : false, remember(skipped ? 'skip' : false)); });
    }
    var go = $('sy-go'), yes = $('sy-yes'), no = $('sy-no');
    yes.onclick = function () { $('sy-open').hidden = true; $('sy-form').hidden = false; $('sy-msg').textContent = ''; };
    no.onclick = function () { $('sy-msg').textContent = ''; finish('S1|' + SURVEY.unit + '|' + SURVEY.version + '|skip', [yes, no], true); };
    go.onclick = function () {
      var miss = [], csv = []; SURVEY.dims.forEach(function (d) { d.items.forEach(function (t, i) { var v = ans[d.id + (i + 1)]; if (!v) miss.push(d.id + (i + 1)); csv.push(v); }); });
      if (miss.length) { $('sy-msg').textContent = T('還有 {n} 題沒選。').split('{n}').join(miss.length); return; }
      $('sy-msg').textContent = ''; finish('S1|' + SURVEY.unit + '|' + SURVEY.version + '|' + csv.join(','), [go], false);
    };
    var done = null; try { done = localStorage.getItem(DK); } catch (e) { /* 沒有就當沒填 */ }
    if (done) { var o = null; try { o = JSON.parse(done); } catch (e) { o = null; } showCard(o && o.sent !== undefined ? o.sent : true, (o && o.at) || ''); }
  }
  window.CT_SURVEY = { mount: mount, _cfg: SURVEY };
  function auto() { var el = $('surveyMount'); if (el) mount($('survey'), el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
