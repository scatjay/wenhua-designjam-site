/* 學習單內問卷元件：課程自我檢核問卷（W11 前測，11-17 楊老師：問卷直接放學習單裡、不用 Google 表單；配分 3%，貼完成畫面截圖就好）。
   題本＝教學實踐線 Q1–Q4 原句＋課程線母線 11-17 19:3x 定稿 Q5–Q15（15 題、4 構面、五點）。
   v3（11-17 夜）：構面順序與題序依信封編號固定偽隨機；B4、C2 為反向鍵（flags.rev）；D5 為檢核題（flags.attn，不計分）；送出改 S2 格式（含 o＝實際顯示順序、t0／t1＝開始與送出時間）。
   送出：寫 ctalk/q（kind=survey）→ 本機代理程式封存到 _scan/_survey_w11_sealed/（gitignore）；不寫進公開資料庫。
   完成碼學生端本來就拿得到：不填也能拿碼，網路送不出去也能拿碼。完成畫面不顯示信封編號，適合手機一張截圖。⚠ 不用 alert／confirm／prompt。 */
(function () {
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', NS = 'gen-lang-client-0929530380-default-rtdb';
  var SURVEY = /*SVY*/{
    "ready": true, "version": "v3", "unit": "W11", "code": "GPS1118",
    "title": "課程自我檢核問卷（約 4 分鐘）",
    "intro": "這份問卷想了解你平常怎麼用 AI。答案沒有對錯，你怎麼回答都不影響成績；填完（或選這次不填）就拿到 W11-1 的 3%。每一句請照你平常的情況選一個：「主要為了學分」「卡住就直接問 AI」都是很常見的答案。只用你的編號作答，不寫名字。大約 4 分鐘。",
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
        "修這門課之前，我寫過程式，或用過遊戲製作工具（例如 Unity、Unreal、RPG Maker、Scratch）。",
        "這一題請直接選「不太符合」，用來確認畫面有正常顯示。"]}
    ],
    "flags": {"B4": {"rev": true, "pair": "B3"}, "C2": {"rev": true, "pair": "C1"}, "D5": {"attn": true, "want": 2}}
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
  function hseed(s) { var h = 1779033703 ^ s.length; for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^ h >>> 16) >>> 0; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuf(arr, r) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* 順序：依種子（信封編號）固定的偽隨機。構面順序與構面內題序各洗一次；檢核題落在第 9–14 個位置（不會排第一），不合就用同一種子的下一個子序列重洗，結果仍固定。 */
  function makeOrder(seed) {
    var ids = SURVEY.dims.map(function (d) { return d.id; }), attn = null, F = SURVEY.flags || {};
    Object.keys(F).forEach(function (k) { if (F[k].attn) attn = k; });
    var res = null;
    for (var at = 0; at < 300; at++) {
      var r = rng(hseed(seed + '#' + at)), dord = shuf(ids, r), flat = [], per = {};
      dord.forEach(function (id) { var d = SURVEY.dims.filter(function (x) { return x.id === id; })[0], ks = d.items.map(function (t, i) { return id + (i + 1); }); per[id] = shuf(ks, r); flat = flat.concat(per[id]); });
      res = { dims: dord, flat: flat, per: per, attempt: at };
      var p = attn ? flat.indexOf(attn) : 9; if (p >= 8 && p <= 13) break;
    }
    return res;
  }
  function seedFor(env) {
    if (isFinite(env) && env >= 0 && env <= 130) return 'svy|e' + env;
    var k = 'survey_seed', v = null; try { v = localStorage.getItem(k); } catch (e) { v = null; }
    if (!v) { v = 'r' + Math.floor(Math.random() * 4294967296); try { localStorage.setItem(k, v); } catch (e) { /* 存不下就只在這一次固定 */ } }
    return 'svy|' + v;
  }
  function plain(n) { return String(n).replace(/^(\d+\.\s*|[一二三四五六七八九十]+、\s*)/, ''); }
  function qid() { return String(Date.now()) + '_' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
  function css() {
    if ($('svycss')) return;
    var s = document.createElement('style'); s.id = 'svycss';
    s.textContent = '.sy .it{margin:12px 0;padding:10px 12px;border:1px solid var(--hair);border-radius:12px;background:var(--surface)}.sy .it .q{margin:0 0 4px}.sy .it .ask{margin:0 0 6px;font-size:13px;opacity:.75}.sy .sc{display:flex;gap:6px;flex-wrap:wrap}'
      + '.sy .sc label{flex:1 1 56px;min-height:44px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px solid var(--hair);border-radius:10px;padding:4px 6px;cursor:pointer;font-size:14px;line-height:1.3}'
      + '.sy .sc input{position:absolute;opacity:0;pointer-events:none}'
      /* 構面＝軸向，每個構面一個色相；五點量尺＝強度，同一色相由淺到深（楊老師 11-17 20:30–20:31） */
      + '.sy{--dA:#2b8a3e;--dB:#1c64c8;--dC:#7c3aed;--dD:#b45309}'
      + '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .sy{--dA:#69db7c;--dB:#74b0ff;--dC:#b79bff;--dD:#ffb454}}'
      + ':root[data-theme="dark"] .sy{--dA:#69db7c;--dB:#74b0ff;--dC:#b79bff;--dD:#ffb454}'
      + '.sy .dim{--c:var(--accent);margin:18px 0;padding:4px 12px 8px;border-left:6px solid var(--c);border-radius:0 14px 14px 0;background:color-mix(in srgb,var(--c) 6%,transparent)}'
      + '.sy .dim[data-d="A"]{--c:var(--dA)}.sy .dim[data-d="B"]{--c:var(--dB)}.sy .dim[data-d="C"]{--c:var(--dC)}.sy .dim[data-d="D"]{--c:var(--dD)}'
      + '.sy .dim>h3{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--c);margin:8px 0 4px}.sy .dim>h3 .tag{font-size:12px;font-weight:800;color:#fff;background:var(--c);border-radius:6px;padding:3px 8px}.sy .dim>h3 .cnt{font-size:12.5px;font-weight:600;opacity:.8}'
      + '.sy .dim .it{border-color:color-mix(in srgb,var(--c) 35%,transparent)}'
      + '.sy .sc label{border-color:color-mix(in srgb,var(--c) var(--b),transparent);background:color-mix(in srgb,var(--c) var(--f),var(--surface))}'
      + '.sy .sc label[data-v="1"]{--f:4%;--b:25%}.sy .sc label[data-v="2"]{--f:9%;--b:38%}.sy .sc label[data-v="3"]{--f:15%;--b:52%}.sy .sc label[data-v="4"]{--f:23%;--b:68%}.sy .sc label[data-v="5"]{--f:32%;--b:85%}'
      + '.sy .sc label.on{color:#fff;border-color:var(--c);font-weight:700}'
      + '.sy .sc label[data-v="1"].on{background:color-mix(in srgb,var(--c) 45%,#888)}.sy .sc label[data-v="2"].on{background:color-mix(in srgb,var(--c) 62%,#777)}.sy .sc label[data-v="3"].on{background:color-mix(in srgb,var(--c) 78%,#555)}.sy .sc label[data-v="4"].on{background:var(--c)}.sy .sc label[data-v="5"].on{background:color-mix(in srgb,var(--c) 75%,#000)}'
      + '.sy .svkey{display:flex;align-items:center;gap:8px;font-size:12.5px;opacity:.85;margin:2px 0 6px}.sy .svkey i{flex:1;height:8px;border-radius:99px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 12%,var(--surface)),var(--c))}'
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
    var ORD = makeOrder(seedFor(env)), t0 = 0;
    var TXT = {}, DIM = {}; SURVEY.dims.forEach(function (d) { DIM[d.id] = d; d.items.forEach(function (t, i) { TXT[d.id + (i + 1)] = t; }); });
    var ans = {}, html = ['<div class="sy"><p class="note" id="sy-intro"></p><div id="sy-open" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button type="button" id="sy-yes">' + esc(T('願意填')) + '</button><button type="button" class="g" id="sy-no">' + esc(T('這次不填（照樣拿完成卡）')) + '</button></div><div id="sy-form" hidden>'];
    ORD.dims.forEach(function (id, di) {
      var d = DIM[id], ks = ORD.per[id];
      html.push('<div class="dim" data-d="' + d.id + '"><h3><span class="tag">' + esc(T('第')) + ' ' + (di + 1) + '／' + SURVEY.dims.length + ' ' + esc(T('部分')) + '</span>' + esc(plain(T(d.name))) + '<span class="cnt">' + ks.length + ' ' + esc(T('題')) + '</span></h3>');
      html.push('<p class="svkey" aria-hidden="true"><span>' + esc(T(SURVEY.scale[0])) + '</span><i></i><span>' + esc(T(SURVEY.scale[4])) + '</span></p>');
      ks.forEach(function (k) {
        var t = TXT[k];
        html.push('<div class="it" data-k="' + k + '"><p class="q">' + esc(T(t)) + '</p><p class="ask">' + esc(T(SURVEY.ask)) + '</p><div class="sc" role="radiogroup" aria-label="' + esc(t) + '">');
        SURVEY.scale.forEach(function (lab, v) { html.push('<label data-v="' + (v + 1) + '"><input type="radio" name="' + k + '" value="' + (v + 1) + '">' + (v + 1) + ' ' + esc(T(lab)) + '</label>'); });
        html.push('</div></div>');
      });
      html.push('</div>');
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
      var h = document.createElement('h4'); h.textContent = T('問卷完成卡（已完成課程自我檢核問卷）'); card.appendChild(h);
      var dl = document.createElement('dl');
      [[T('完成碼'), SURVEY.code, 'code'], [T('完成時間'), at, '']].forEach(function (r) { var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; if (r[2]) dd.className = r[2]; dl.appendChild(dt); dl.appendChild(dd); });
      card.appendChild(dl); box.appendChild(card);
      var tip = document.createElement('p'); tip.className = 'note'; tip.textContent = T('請把這張「問卷完成卡」截圖，交到 flipclass 的 W11-1。'); box.appendChild(tip);
      var sn = document.createElement('p'); sn.className = 'note'; sn.textContent = sent === 'skip' ? T('這次不填也算完成，不影響你。') : (sent ? T('已收到你的回答。') : T('你的回答這次沒有送出去（可能是網路問題）。完成碼照樣有效，不影響你的分數。')); box.appendChild(sn);
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
    yes.onclick = function () { if (!t0) t0 = Date.now(); $('sy-open').hidden = true; $('sy-form').hidden = false; $('sy-msg').textContent = ''; };
    no.onclick = function () { $('sy-msg').textContent = ''; finish(['S2', SURVEY.unit, SURVEY.version, 'skip', 't0=' + (t0 || Date.now()), 't1=' + Date.now()].join('|'), [yes, no], true); };
    go.onclick = function () {
      var miss = [], csv = []; SURVEY.dims.forEach(function (d) { d.items.forEach(function (t, i) { var v = ans[d.id + (i + 1)]; if (!v) miss.push(d.id + (i + 1)); csv.push(v); }); });
      if (miss.length) { $('sy-msg').textContent = T('還有 {n} 題沒選。').split('{n}').join(miss.length); return; }
      $('sy-msg').textContent = ''; finish(['S2', SURVEY.unit, SURVEY.version, csv.join(','), 'o=' + ORD.flat.join('.'), 't0=' + (t0 || Date.now()), 't1=' + Date.now()].join('|'), [go], false);
    };
    var done = null; try { done = localStorage.getItem(DK); } catch (e) { /* 沒有就當沒填 */ }
    if (done) { var o = null; try { o = JSON.parse(done); } catch (e) { o = null; } showCard(o && o.sent !== undefined ? o.sent : true, (o && o.at) || ''); }
  }
  window.CT_SURVEY = { mount: mount, _cfg: SURVEY, _order: makeOrder };
  function auto() { var el = $('surveyMount'); if (el) mount($('survey'), el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
