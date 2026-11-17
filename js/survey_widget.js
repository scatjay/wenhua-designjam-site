/* 學習單內問卷元件（W11 前測，11-17 楊老師 19:24：問卷直接放學習單裡、不用 Google 表單）。
   題本由教學實踐線交（12–15 題、3–4 構面、五點）；題目還是占位字樣時整個區塊不顯示（ready=false）。
   送出：寫 ctalk/q（kind=survey）→ 本機代理程式封存到 _scan/_survey_w11_sealed/（gitignore）；不寫進公開資料庫。
   完成碼學生端本來就拿得到：不填也能拿碼，網路送不出去也能拿碼。⚠ 不用 alert／confirm／prompt。 */
(function () {
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app', NS = 'gen-lang-client-0929530380-default-rtdb';
  var SURVEY = /*SVY*/{
    "ready": false, "version": "v1", "unit": "W11", "code": "GPS1118",
    "title": "課程自我檢核（約 3 分鐘）",
    "intro": "這份問卷不計分、跟成績無關，也沒有標準答案。請照你實際的情況填。",
    "note": "（指導語待定：見 SURVEY_INSTRUCTION_TWO_VERSIONS）",
    "scale": ["非常不同意", "不同意", "普通", "同意", "非常同意"],
    "dims": [
      {"id": "A", "name": "（構面一）", "items": ["（題目待填 A1）", "（題目待填 A2）", "（題目待填 A3）", "（題目待填 A4）"]},
      {"id": "B", "name": "（構面二）", "items": ["（題目待填 B1）", "（題目待填 B2）", "（題目待填 B3）", "（題目待填 B4）"]},
      {"id": "C", "name": "（構面三）", "items": ["（題目待填 C1）", "（題目待填 C2）", "（題目待填 C3）", "（題目待填 C4）"]}
    ]
  }/*END*/;
  var $ = function (id) { return document.getElementById(id); };
  var WID = window.CT_WID || {}, ID = false;
  function T(zh) { var t = WID[zh]; return ID && t ? zh + ' / ' + t.charAt(0).toUpperCase() + t.slice(1) : zh; }
  function idOn(env) { env = Number(env); var q = new URLSearchParams(location.search).get('lang'); return q === 'id' ? true : q === 'zh' ? false : (env >= 101 && env <= 130); }
  function qparam(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function tw(ms) { var d = new Date(ms + 8 * 3600 * 1000); return { ymd: d.toISOString().slice(0, 10).replace(/-/g, ''), h: d.getUTCHours() }; }
  function courseOf(env) { env = Number(env); if (env >= 55 && env <= 60) return 'test'; if (env >= 1 && env <= 52) return '47602'; if (env >= 101 && env <= 130) return '46582'; return ''; }
  function sessKey(env, ms) { var p = tw(ms), c = courseOf(env), half = p.h < 14 ? 'am' : 'pm'; if (!c) c = half === 'am' ? '47602' : '46582'; return c + '-' + p.ymd + half; }
  function qid() { return String(Date.now()) + '_' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
  function hasPlaceholder() { return SURVEY.dims.some(function (d) { return d.items.some(function (t) { return t.indexOf('題目待填') >= 0; }); }); }
  function css() {
    if ($('svycss')) return;
    var s = document.createElement('style'); s.id = 'svycss';
    s.textContent = '.sy .it{margin:12px 0;padding:10px 12px;border:1px solid var(--hair);border-radius:12px;background:var(--surface)}.sy .it .q{margin:0 0 6px}.sy .sc{display:flex;gap:6px;flex-wrap:wrap}'
      + '.sy .sc label{flex:1 1 56px;min-height:44px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px solid var(--hair);border-radius:10px;padding:4px 6px;cursor:pointer;font-size:14px;line-height:1.3}'
      + '.sy .sc input{position:absolute;opacity:0;pointer-events:none}.sy .sc label.on{background:var(--accent);color:#fff;border-color:var(--accent)}'
      + '.sy button{min-height:44px;min-width:88px;padding:6px 16px;border-radius:999px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:inherit;cursor:pointer}.sy button.g{background:transparent;color:var(--accent)}'
      + '.sy .code{font:700 28px ui-monospace,Consolas,monospace;letter-spacing:.1em;padding:10px 14px;border:2px dashed var(--accent);border-radius:12px;display:inline-block;margin:8px 0}';
    document.head.appendChild(s);
  }
  function mount(sec, el) {
    if (!SURVEY.ready || hasPlaceholder()) { if (sec) sec.hidden = true; return; }
    if (sec) sec.hidden = false; var nav = $('nav-survey'); if (nav) nav.hidden = false;
    css();
    var env = parseInt(localStorage.getItem('designjam_env'), 10), qe = parseInt(qparam('env'), 10); if (isFinite(qe) && qe >= 55 && qe <= 60) env = qe;
    ID = idOn(env);
    var emu = qparam('emu') === '1' && env >= 55 && env <= 60, port = qparam('emuPort') || '9012';
    var base = emu ? 'http://127.0.0.1:' + port : DB, qs = emu ? '?ns=' + NS : '';
    var DK = 'survey_' + SURVEY.unit + '_done';
    var ans = {}, html = ['<div class="sy"><p class="note">', SURVEY.intro, '</p><p class="note"><b>', SURVEY.note, '</b></p>'];
    SURVEY.dims.forEach(function (d) {
      html.push('<h3>' + d.name + '</h3>');
      d.items.forEach(function (t, i) {
        var k = d.id + (i + 1);
        html.push('<div class="it" data-k="' + k + '"><p class="q">' + t + '</p><div class="sc" role="radiogroup" aria-label="' + t + '">');
        SURVEY.scale.forEach(function (lab, v) { html.push('<label><input type="radio" name="' + k + '" value="' + (v + 1) + '">' + (v + 1) + ' ' + T(lab) + '</label>'); });
        html.push('</div></div>');
      });
    });
    html.push('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" id="sy-go">' + T('送出，拿完成碼') + '</button><button type="button" class="g" id="sy-skip">' + T('這次不填，直接拿完成碼') + '</button></div><p class="note" id="sy-msg" role="status"></p><div id="sy-done"></div></div>');
    el.innerHTML = html.join('');
    el.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.onchange = function () { var it = r.closest('.it'); it.querySelectorAll('label').forEach(function (l) { l.classList.remove('on'); }); r.parentNode.classList.add('on'); ans[r.name] = r.value; };
    });
    function showCode(sent) {
      try { localStorage.setItem(DK, '1'); } catch (e) { /* 存不下也沒關係 */ }
      $('sy-done').innerHTML = '<p><b>' + T('完成碼') + '</b> ' + T('（把它貼進下面「出處標示欄」那一區的「問卷完成碼」格）') + '</p><div class="code" id="sy-code"></div><p class="note" id="sy-sent"></p>';
      $('sy-code').textContent = SURVEY.code;
      $('sy-sent').textContent = sent ? T('已收到你的回答。') : T('你的回答這次沒送出去（網路或老師電腦沒開），完成碼照樣有效，不影響你。');
    }
    function send(text) {
      if (!isFinite(env)) return Promise.reject(new Error('no-env'));
      var sess = sessKey(env, Date.now()), id = qid(), url = base + '/ctalk/q/' + encodeURIComponent(sess) + '/' + encodeURIComponent(env) + '/' + id + '.json' + qs;
      return fetch(url, { method: 'PUT', body: JSON.stringify({ t: { '.sv': 'timestamp' }, unit: SURVEY.unit, text: text, kind: 'survey' }), headers: { 'Content-Type': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('put-' + r.status); });
    }
    function finish(text, btns) {
      btns.forEach(function (b) { b.disabled = true; });
      send(text).then(function () { showCode(true); }).catch(function () { showCode(false); });
    }
    var go = $('sy-go'), skip = $('sy-skip');
    go.onclick = function () {
      var miss = []; SURVEY.dims.forEach(function (d) { d.items.forEach(function (t, i) { if (!ans[d.id + (i + 1)]) miss.push(d.id + (i + 1)); }); });
      if (miss.length) { $('sy-msg').textContent = '還有 ' + miss.length + ' 題沒選。不想填的話，可以按「這次不填」。'; return; }
      var csv = []; SURVEY.dims.forEach(function (d) { d.items.forEach(function (t, i) { csv.push(ans[d.id + (i + 1)]); }); });
      $('sy-msg').textContent = ''; finish('S1|' + SURVEY.unit + '|' + SURVEY.version + '|' + csv.join(','), [go, skip]);
    };
    skip.onclick = function () { $('sy-msg').textContent = ''; finish('S1|' + SURVEY.unit + '|' + SURVEY.version + '|skip', [go, skip]); };
    var done = null; try { done = localStorage.getItem(DK); } catch (e) { /* 沒有就當沒填 */ }
    if (done) { showCode(true); $('sy-sent').textContent = T('你之前已經填過了；完成碼在這裡。'); }
  }
  window.CT_SURVEY = { mount: mount, _cfg: SURVEY };
  function auto() { var el = $('surveyMount'); if (el) mount($('survey'), el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
