/* W8-9 期中作業頁：四單元提交、檢核進度、預掃建議、回報、AI 助教。
   資料（全在 whgm/analysis/ 底下，沿用既有可寫區）：
   midsub/{課}/{編號}/{單元}/{pushId}   學生每次提交（不覆蓋，保留歷程）
   midscan/47602/{編號}/{單元}          預掃建議 items{} 與歷次審核重點 hist{}（由老師端寫入，學生唯讀）
   midfb/{課}/{編號}/{pushId}           bug／意見回報；老師回覆寫在 reply
   midchat/{課}/{編號}/{pushId}         AI 助教提問佇列與回答
   midcfg                               { chatEnabled, dailyCap }
   只記編號，不記姓名。 */
(function () {
  'use strict';
  var db = firebase.database();
  var BASE = 'whgm/analysis/';
  var VER = 'mid-1';

  var UNITS = [
    { key: 'u1', n: 1, name: 'Deep Research', sub: 'R1、R2、R3', when: '第 8 週 · 前置：W3 試玩已完成',
      prev: 'W3 回放畫面最上面的「這一場改了：卡◯◯、卡◯◯」，和你們寫的 3 則回饋。',
      todo: ['起點：寫下你這款遊戲要改的是哪一張卡（卡號卡名）、一句改動句（40 字內），和三人例子草稿（A、B、C 各 10 點，先用原版算一次、再用改動後算一次）。主題可以自訂，不一定要沿用 W3 那一組',
             '用 Deep Research 做出文件。R1、R2、R3 不用全交，至少交一份就可以，有幾份交幾份'],
      ok: ['起點：卡號卡名寫得清楚（沿用 W3 的話要和回放一模一樣）；三人例子在原版與改動後結果不同',
           '交的文件如果是 R1：卡號卡名和起點一樣；3–5 個真實案例、連結點得開；至少 1 個寫了「對我們有什麼用」',
           '交的文件如果是 R2：100–150 字短文點名卡號卡名，改動句同字面（改了就標「修訂」）；引用 R1 至少 1 個案例名；三人例子定案、寫出最後各人自尊值；處理平手與同時出局',
           '交的文件如果是 R3：畫面對照表，每個畫面對得到 R2 的一步；三種行動名稱和 R2 一致；標出改動規則出現在哪個畫面'],
      bridge: '有交幾份文件，就照這幾份之間的順序對：起點 → R1：找案例的方向就是那句改動句。R1 → R2：R2 引用 R1 的案例。R2 → R3：R3 不能新增 R2 沒有的規則。只交其中一份也可以，三個要對上的東西（卡號卡名、改動句、三人例子數字）仍然要寫出來。',
      links: [['dr', 'Deep Research 對話連結（不一定同一串）'], ['r1', 'R1 文件連結（選填）'], ['r2', 'R2 文件連結（選填）'], ['r3', 'R3 文件連結（選填）']],
      texts: [['change', '改動句（40 字內）', 1], ['gold', '三人例子最終自尊值，例：A7 B5 C0', 1]],
      chk: ['卡號卡名寫清楚了（沿用 W3 的話和回放一模一樣）', '改動句不超過 40 字，且有寫出發生在結算第幾步', '我交的文件裡的案例連結我都點開確認過', '文件裡的改動句和起點同字面（改了有標「修訂」）', '三人例子定案，最終自尊值已寫在下面', '至少交了一份 Deep Research 文件（R1、R2、R3 其中一份）', '文件和對話串都開了分享，我用無痕視窗開過'] },
    { key: 'u2', n: 2, name: 'Canvas', sub: '視覺化企劃', when: '第 8–9 週 · 前置：單元 1 的 R2、R3',
      prev: 'R2 的規則與三人例子，R3 的畫面對照表。',
      todo: ['用 Canvas 把流程、畫面、改動規則畫出來', '圖裡要放三人例子，逐輪的自尊值'],
      ok: ['流程步驟數和 R2 一樣', '改動規則被框出，標在第幾步', '圖上最終自尊值和單元 1 的 R2 一樣', '沒有 R2 以外的規則'],
      bridge: '圖上的三人例子數字要和 R2 逐一核對。不一樣就要修，不是「差不多」。',
      note: '這個單元有<b>兩種不同的連結</b>，請分開貼，不要貼成同一個：<br>① <b>Canvas 成品連結</b>：在 Canvas 畫面右上角按「分享」拿到的連結，打開看到的是你做出來的那張圖或文件。<br>② <b>建立 Canvas 的對話連結</b>：在 Gemini 左側的對話記錄，對那一串對話按「分享對話」拿到的連結，打開看到的是你和 AI 一來一往下了哪些指令。老師要看你下的指令，主要看這個。<br>⚠ Canvas 成品連結<b>有時候會打不開或分享不出來</b>（這是 Gemini 的狀況，不是你的錯）。這時候請不用硬撐：<b>把 Canvas 畫面存成 2 張以上的截圖（或匯出成 PDF），上傳到雲端硬碟開分享，貼在③</b>，並且一定要貼②和指令全文。',
      links: [['canvas', '① Canvas 成品連結（右上角「分享」；出不來就留白）'], ['canvasChat', '② 建立這個 Canvas 的 Gemini 對話分享連結（「分享對話」）'], ['shots', '③ 備案：Canvas 截圖（2 張以上）或 PDF 的雲端連結（①出不來時才需要）']],
      texts: [['gold', '圖上看到的最終自尊值，例：A7 B5 C0', 1]],
      chk: ['流程步驟數和 R2 一樣', '改動規則有框出並標第幾步', '圖上的最終自尊值和 R2 一樣', '圖上沒有 R2 以外的規則'] },
    { key: 'u3', n: 3, name: 'AI Studio', sub: '能玩的原型', when: '第 9 週起 · 前置：單元 1；單元 2 建議先完成',
      prev: 'R2、R3，和 Canvas 的圖。',
      todo: ['做成可以按的網頁原型，能手動設定 A、B、C 的出牌，重現三人例子', '左側指令要保留，不要刪'],
      ok: ['照三人例子出牌，原型算出的最終自尊值和 R2 一樣', '改動規則真的在結算時被用到', '有 30 秒以上操作影片，或 2 張截圖'],
      bridge: '你填的數字會和 R2 比對，不一樣只會提醒你。不一樣就在差異登記寫原因：是原型算錯，還是 R2 寫錯。',
      links: [['aistudio', 'AI Studio 專案分享連結'], ['demo', '操作影片或截圖連結']],
      texts: [['gold', '原型跑出的最終自尊值，例：A7 B5 C0', 1], ['diff', '差異登記：企劃寫的、成品實際的、原因（沒有差異就寫「無」）', 3]],
      chk: ['用三人例子的出牌跑過一遍', '原型的最終自尊值和 R2 一樣（不一樣已在差異登記說明）', '改動規則真的有被用到', '左側指令沒有刪', '專案已開分享，我用另一個帳號開過', '有影片或截圖'] },
    { key: 'u4', n: 4, name: 'NotebookLM', sub: '三樣成果與回頭對一次', when: '第 9–11 週（期限 11/18）· 前置：單元 1–3',
      prev: 'R1–R3、Canvas 的文字、原型的結果。',
      todo: ['把來源加進筆記本：R1–R3、Canvas 文字，加上原型的規則說明、跑三人例子的結果、差異登記', '先貼「5 句話確認」，再做資訊圖表、語音摘要、簡報', '最後填一次一致性表'],
      ok: ['5 句確認的卡號卡名、改動句和 R2 一樣', '三樣成果都放進三人例子，數字是成品實際跑出的結果；和 R2 不同的地方寫了「和企劃的差異」', '講錯的地方已改，自訂說明已貼', '一致性表每格都說得出出處；不一致的有說明或已修好'],
      bridge: 'NotebookLM 只能整理你給它的東西；它講得跟 R2 不一樣，通常是來源給少了。一致性表是把前三個單元再對一次，誠實標出不一致，比假裝全部一致更好。',
      links: [['nblm', 'NotebookLM 筆記本分享連結'], ['files', '三樣成果檔案連結（資訊圖表、語音、簡報；筆記本看不到時用）']],
      texts: [['gold', '成果裡講的最終自尊值，例：A7 B5 C0', 1], ['custom', '三樣成果各自的「自訂」說明全文', 4], ['consist', '一致性表：卡號卡名、改動句、最終自尊值、三種行動名稱、流程步驟數，各在哪裡看得到；不同就寫「不同：……」', 5], ['p4a', '改過的指令①：第一次怎麼問、改過怎麼問、一句話說改了什麼', 3], ['p4b', '改過的指令②（選填）', 3]],
      chk: ['5 句話確認和 R2 一樣', '三樣成果都有放三人例子，數字是成品實際跑出的', '有寫「和企劃的差異」', '講錯的地方已改', '自訂說明已貼在下面', '一致性表每格都填了'] }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function today() { var d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function fmt(ts) { var d = new Date(ts); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function envNow() { try { var v = window.DJBind && window.DJBind.env(); return (v == null || isNaN(v)) ? null : v; } catch (e) { return null; } }
  function courseOf(e) {
    var m = /[?&]c=(\d{4,6})/.exec(location.search);
    if (m && ['47602', '46582', '47618'].indexOf(m[1]) >= 0) return m[1];
    if (e >= 55 && e <= 60) return 'test';
    if (e >= 201 && e <= 299) return '47618';
    if (e >= 101) return '46582';
    if (e >= 1 && e <= 52) return '47602';
    return 'teacher';
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function normGold(s) { return String(s || '').toUpperCase().replace(/[^A-C0-9]/g, ''); }
  function isUrl(s) { return /^https?:\/\/\S+$/i.test(s); }
  function mask(s) { return String(s).replace(/\b[0-9][A-Za-z0-9]{7,9}\b/g, '[學號]'); }

  var ENV = null, COURSE = null;
  var SUBS = {};      /* unit -> [{id, ...rec}] 由新到舊 */
  var SCAN = {};      /* unit -> {items, hist} */
  var DRAFT = {};     /* unit -> {chk:{i:true}} 目前頁面上勾的 */

  /* ───────── 渲染單元 ───────── */
  function buildUnits() {
    var host = $('units');
    UNITS.forEach(function (u) {
      var sec = document.createElement('section');
      sec.id = u.key; sec.className = 'unit';
      var h = '<h2>單元 ' + u.n + ' · ' + esc(u.name) + '<span class="tag">' + esc(u.sub) + '</span></h2>' +
        '<p class="sub" style="margin-bottom:6px">' + esc(u.when) + '</p>' +
        '<div class="box"><div class="meta">' +
        '<div><b>上一關給你</b>' + esc(u.prev) + '</div>' +
        '<div><b>這一關要做</b><ul>' + u.todo.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>' +
        '<div class="meta" style="grid-template-columns:1fr"><div><b>過關的樣子</b><ul>' + u.ok.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>' +
        '<div class="ok" style="margin:8px 0"><b>跟前一關的銜接：</b>' + esc(u.bridge) + '</div>' +
        '<div class="hist" id="rev_' + u.key + '" style="border-top:0;margin-top:0"></div>' +
        '<h3>銜接自查 <small style="font-weight:400;color:var(--ink-soft)">（<span id="cn_' + u.key + '">0</span>/' + u.chk.length + ' 已勾）</small></h3>' +
        '<div id="chk_' + u.key + '">' + u.chk.map(function (t, i) { return '<label class="chk"><input type="checkbox" data-u="' + u.key + '" data-i="' + i + '"><span>' + esc(t) + '</span></label>'; }).join('') + '</div>' +
        '<div id="sg_' + u.key + '"></div>';
      if (u.note) h += '<div class="warn" style="line-height:1.8">' + u.note + '</div>';
      u.links.forEach(function (L) { h += '<label class="f">' + esc(L[1]) + '</label><input type="url" id="l_' + u.key + '_' + L[0] + '" placeholder="https://">'; });
      u.texts.forEach(function (T) {
        h += '<label class="f">' + esc(T[1]) + '</label>' + (T[2] === 1 ? '<input type="text" id="t_' + u.key + '_' + T[0] + '">' : '<textarea id="t_' + u.key + '_' + T[0] + '" style="min-height:' + (T[2] * 30) + 'px"></textarea>');
      });
      h += '<label class="f">指令全文 <small>（連結看不到指令時一定要貼；看得到也鼓勵貼，老師端才有東西可以看。不要放真名、學號）</small></label><textarea id="pr_' + u.key + '" style="min-height:120px"></textarea>' +
        '<div id="warn_' + u.key + '"></div>' +
        '<div class="sub" style="margin:8px 0 0;font-size:13px">這個單元每天只能送出一次（四個單元各算各的）；AI 預掃審核每天晚上跑一輪，今天送出的，明天看得到審核結果。</div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap"><button data-send="' + u.key + '">送出單元 ' + u.n + '</button><span class="sub" style="margin:0" id="cnt_' + u.key + '"></span></div>' +
        '<div class="msg" id="msg_' + u.key + '"></div>' +
        '<div class="hist" id="hist_' + u.key + '"></div></div>';
      sec.innerHTML = h;
      host.appendChild(sec);
    });
    host.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t && t.type === 'checkbox' && t.dataset.u) { saveDraft(t.dataset.u); refreshProgress(); }
    });
    host.addEventListener('input', function (ev) { var t = ev.target; if (t && t.id && /^(t|l|pr)_/.test(t.id)) { saveDraft(t.id.split('_')[1]); checkGold(); } });
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button[data-send]');
      if (b) send(b.dataset.send);
    });
    if (window.twemoji) try { twemoji.parse(document.body); } catch (e) {}
  }

  function readForm(u) {
    var r = { links: {}, texts: {}, chk: {}, chkN: 0 };
    u.links.forEach(function (L) { var v = $('l_' + u.key + '_' + L[0]).value.trim(); if (v) r.links[L[0]] = v; });
    u.texts.forEach(function (T) { var v = $('t_' + u.key + '_' + T[0]).value.trim(); if (v) r.texts[T[0]] = v; });
    r.prompt = $('pr_' + u.key).value.trim();
    Array.prototype.forEach.call(document.querySelectorAll('input[data-u="' + u.key + '"]'), function (c) { r.chk[c.dataset.i] = c.checked; if (c.checked) r.chkN++; });
    return r;
  }
  function saveDraft(k) {
    if (ENV == null) return;
    var u = UNITS.filter(function (x) { return x.key === k; })[0]; if (!u) return;
    lsSet('mid_draft_' + ENV + '_' + k, readForm(u));
  }
  function fillForm(u, r) {
    if (!r) return;
    u.links.forEach(function (L) { if (r.links && r.links[L[0]]) $('l_' + u.key + '_' + L[0]).value = r.links[L[0]]; });
    u.texts.forEach(function (T) { if (r.texts && r.texts[T[0]]) $('t_' + u.key + '_' + T[0]).value = r.texts[T[0]]; });
    if (r.prompt) $('pr_' + u.key).value = r.prompt;
    Array.prototype.forEach.call(document.querySelectorAll('input[data-u="' + u.key + '"]'), function (c) { c.checked = !!(r.chk && r.chk[c.dataset.i]); });
  }

  /* ───────── 進度條與銜接提醒 ───────── */
  function ticked(u) { return document.querySelectorAll('input[data-u="' + u.key + '"]:checked').length; }
  function refreshProgress() {
    var h = '';
    UNITS.forEach(function (u) {
      var n = ticked(u), tot = u.chk.length, subs = (SUBS[u.key] || []).length;
      $('cn_' + u.key).textContent = n;
      var done = (n === tot && subs > 0);
      h += '<div class="p' + (done ? ' done' : '') + '"><b>' + (done ? '✓ ' : '') + '單元 ' + u.n + ' ' + esc(u.name) + '</b>勾選 ' + n + '/' + tot + '<br>已提交 ' + subs + ' 次</div>';
    });
    $('progRows').innerHTML = h;
    if (window.twemoji) try { twemoji.parse($('progRows')); } catch (e) {}
  }
  function latestGold(k) { var a = SUBS[k] || []; return a.length && a[0].texts ? a[0].texts.gold : ''; }
  function checkGold() {
    var vals = {};
    UNITS.forEach(function (u) {
      var el = $('t_' + u.key + '_gold'); var cur = el ? el.value.trim() : '';
      vals[u.key] = normGold(cur || latestGold(u.key));
    });
    var set = {}, seen = [];
    UNITS.forEach(function (u) { if (vals[u.key]) { seen.push(u.n); set[vals[u.key]] = (set[vals[u.key]] || []).concat(u.n); } });
    var keys = Object.keys(set);
    UNITS.forEach(function (u) {
      var w = $('warn_' + u.key); if (!w) return;
      if (keys.length > 1 && vals[u.key]) w.innerHTML = '<div class="warn">提醒：各單元填的最終自尊值不一樣（' + keys.map(function (k) { return '單元 ' + set[k].join('、') + ' 是 ' + esc(k); }).join('；') + '）。要送出也可以；若是原型算錯或 R2 寫錯，請在差異登記或一致性表說明。</div>';
      else w.innerHTML = '';
    });
  }

  /* ───────── 歷程、審核重點、預掃建議 ───────── */
  function renderUnit(u) {
    var subs = SUBS[u.key] || [];
    $('cnt_' + u.key).textContent = '這個單元已提交 ' + subs.length + ' 次';
    var sentToday = subs.length && subs[0].id === today();
    var sb2 = document.querySelector('button[data-send="' + u.key + '"]');
    if (sb2) { sb2.disabled = !!sentToday; sb2.textContent = sentToday ? '今天已送出，明天可以再送' : '送出單元 ' + u.n; }
    var h = '<b>提交紀錄（共 ' + subs.length + ' 次）</b>';
    if (!subs.length) h += '<div class="sub" style="margin:4px 0">還沒有提交。</div>';
    subs.forEach(function (r, i) {
      var ln = Object.keys(r.links || {}).map(function (k) { return '<a href="' + esc(r.links[k]) + '" target="_blank" rel="noopener">' + esc(k) + '</a>'; }).join(' ');
      h += '<div>第 ' + (subs.length - i) + ' 次 · ' + fmt(r.ts) + ' · 勾 ' + (r.chkN || 0) + '/' + u.chk.length + (r.fixN ? ' · 回應建議 ' + r.fixN + ' 條' : '') + '<br>' + ln + '</div>';
    });
    $('hist_' + u.key).innerHTML = h;

    var sc = SCAN[u.key] || {};
    var hist = sc.hist ? Object.keys(sc.hist).sort().reverse() : [];
    var rv = '<b>歷次審核重點</b>';
    if (!hist.length) rv += '<div class="sub" style="margin:4px 0">還沒有審核紀錄。老師或預掃審過之後，重點會列在這裡。</div>';
    hist.forEach(function (k) {
      var x = sc.hist[k] || {};
      rv += '<div>' + fmt(Number(k)) + ' · ' + (x.by === 'teacher' ? '老師' : 'AI 預掃') + '<ul style="margin:2px 0">' + (x.points ? Object.keys(x.points).map(function (q) { return '<li>' + esc(x.points[q]) + '</li>'; }).join('') : '') + '</ul></div>';
    });
    $('rev_' + u.key).innerHTML = '<div class="box tight" style="background:var(--panel2)">' + rv + '</div>';

    var items = sc.items ? Object.keys(sc.items).map(function (k) { var o = sc.items[k]; o._id = k; return o; }) : [];
    var sg = $('sg_' + u.key);
    if (!items.length) { sg.innerHTML = ''; return; }
    var prevFix = lsGet('mid_fix_' + ENV + '_' + u.key) || {};
    sg.innerHTML = '<h3>預掃建議 <small style="font-weight:400;color:var(--ink-soft)">（每條請選一個，再次送出時會一起記錄）</small></h3>' + items.map(function (it) {
      var f = prevFix[it._id] || {};
      return '<div class="sg" data-sg="' + esc(it._id) + '"><div class="t">' + esc(it.check || '') + (it.status ? ' <span class="tag" style="font-size:11px;background:var(--panel2);padding:2px 7px;border-radius:5px">' + esc(it.status) + '</span>' : '') + '</div>' +
        '<div class="why">為什麼：' + esc(it.why || '') + '</div><div class="how">可以怎麼改：' + esc(it.how || '') + '</div>' +
        '<div class="resp"><label><input type="radio" name="fx_' + u.key + '_' + esc(it._id) + '" value="done"' + (f.s === 'done' ? ' checked' : '') + '> 已改</label>' +
        '<label><input type="radio" name="fx_' + u.key + '_' + esc(it._id) + '" value="notyet"' + (f.s === 'notyet' ? ' checked' : '') + '> 還沒改</label>' +
        '<label><input type="radio" name="fx_' + u.key + '_' + esc(it._id) + '" value="disagree"' + (f.s === 'disagree' ? ' checked' : '') + '> 不同意</label>' +
        '<input type="text" placeholder="一句話：改了什麼，或為什麼不同意" value="' + esc(f.note || '') + '"></div></div>';
    }).join('');
  }
  function renderAdvice() {
    var parts = UNITS.map(function (u) {
      var sc = SCAN[u.key] || {}, n = sc.items ? Object.keys(sc.items).length : 0;
      return '<div>單元 ' + u.n + ' · ' + esc(u.name) + '：' + (n ? '<a href="#sg_' + u.key + '">' + n + ' 條建議</a>' : '還沒有建議') + '</div>';
    });
    $('adviceBox').innerHTML = ENV == null ? '綁定編號後會顯示你的建議。' : parts.join('');
  }
  function collectFix(u) {
    var out = {}, n = 0;
    Array.prototype.forEach.call(document.querySelectorAll('#sg_' + u.key + ' .sg'), function (d) {
      var id = d.dataset.sg, r = d.querySelector('input[type=radio]:checked'), note = d.querySelector('input[type=text]').value.trim();
      if (r) { out[id] = { s: r.value, note: note }; n++; }
    });
    return { fix: out, n: n };
  }

  /* ───────── 送出 ───────── */
  function ref(path) { return db.ref(BASE + path); }
  function send(k) {
    var u = UNITS.filter(function (x) { return x.key === k; })[0];
    var msg = $('msg_' + k);
    function say(t, bad) { msg.textContent = t; msg.style.color = bad ? 'var(--red)' : 'var(--green)'; }
    if (ENV == null) { say('先在頁面最上方綁定你的編號', true); return; }
    var r = readForm(u), bad = [];
    Object.keys(r.links).forEach(function (a) { if (!isUrl(r.links[a])) bad.push(a); });
    if (bad.length) { say('連結要以 https:// 開頭', true); return; }
    if (!Object.keys(r.links).length && !r.prompt && !Object.keys(r.texts).length) { say('至少要貼一個連結，或貼指令全文', true); return; }
    var softWarn = '';
    if (k === 'u1' && !(r.links.r1 || r.links.r2 || r.links.r3 || r.links.dr)) softWarn = '（提醒：單元 1 還沒有貼任何 Deep Research 文件或對話連結，至少交一份老師才掃得到）';
    var fx = collectFix(u);
    var rec = { ts: firebase.database.ServerValue.TIMESTAMP, links: r.links, texts: r.texts, prompt: r.prompt || null, chk: r.chk, chkN: r.chkN, chkTotal: u.chk.length, fix: fx.n ? fx.fix : null, fixN: fx.n, ver: VER };
    var nth = (SUBS[k] || []).length + 1;
    var btn = document.querySelector('button[data-send="' + k + '"]'); btn.disabled = true; say('送出中…');
    ref('midsub/' + COURSE + '/' + ENV + '/' + k).child(today()).transaction(function (cur) { return cur === null ? rec : undefined; }).then(function (res) {
      if (!res.committed) { btn.disabled = true; say('這個單元今天已經送出過了，明天可以再送（四個單元各算各的）', true); return; }
      lsSet('mid_fix_' + ENV + '_' + k, fx.fix);
      Object.keys(fx.fix).forEach(function (id) {
        if (fx.fix[id].s === 'disagree') ref('midfb/' + COURSE + '/' + ENV).push({ ts: firebase.database.ServerValue.TIMESTAMP, type: 'judge', unit: k, sg: id, text: mask(fx.fix[id].note || '（未寫說明）'), ver: VER, ua: navigator.userAgent.slice(0, 100) });
      });
      var tail = r.chkN < u.chk.length ? '（自查還有 ' + (u.chk.length - r.chkN) + ' 項沒勾，系統只是提醒，已照常收下）' : '';
      say('已送出 ✓ 這是第 ' + nth + ' 次提交。這個單元今天不能再送，明天可以再送。' + tail + softWarn);
      btn.disabled = true;
    }).catch(function (e) { btn.disabled = false; say('送出失敗，請再按一次：' + (e && e.message || e), true); });
  }

  /* ───────── 讀資料 ───────── */
  var listening = null;
  function listen() {
    if (listening === ENV) return; listening = ENV;
    UNITS.forEach(function (u) {
      ref('midsub/' + COURSE + '/' + ENV + '/' + u.key).on('value', function (s) {
        var v = s.val() || {}; SUBS[u.key] = Object.keys(v).map(function (id) { var o = v[id]; o.id = id; return o; }).sort(function (a, b) { return b.ts - a.ts; });
        renderUnit(u); refreshProgress(); checkGold(); renderAch();
      });
      ref('midscan/' + COURSE + '/' + ENV + '/' + u.key).on('value', function (s) { SCAN[u.key] = s.val() || {}; renderUnit(u); renderAdvice(); });
      var d = lsGet('mid_draft_' + ENV + '_' + u.key);
      if (d) fillForm(u, d);
    });
    /* 第一次沒有草稿時，用最近一次提交預填 */
    setTimeout(function () {
      UNITS.forEach(function (u) { if (!lsGet('mid_draft_' + ENV + '_' + u.key) && SUBS[u.key] && SUBS[u.key][0]) fillForm(u, SUBS[u.key][0]); });
      refreshProgress(); checkGold();
    }, 1800);
    listenChat(); listenFb(); loadW47();
  }

  /* ───────── 回報 ───────── */
  function listenFb() {
    ref('midfb/' + COURSE + '/' + ENV).limitToLast(20).on('value', function (s) {
      var v = s.val() || {}, ks = Object.keys(v).sort().reverse();
      var box = $('fbList'); if (!box) return;
      box.innerHTML = ks.length ? '<b>我的回報</b>' + ks.map(function (k) { var o = v[k]; return '<div style="padding:5px 0;border-bottom:1px dashed var(--line);font-size:13.5px">' + fmt(o.ts) + ' · ' + esc(o.text) + (o.reply ? '<div class="ok" style="margin:4px 0">老師回覆：' + esc(o.reply.text || '') + (o.reply.verdict ? '（' + esc(o.reply.verdict) + '）' : '') + '</div>' : '<div class="sub" style="margin:2px 0;font-size:12.5px">老師還沒回覆</div>') + '</div>'; }).join('') : '';
    });
  }
  function initFb() {
    var dlg = $('fbDlg');
    var box = document.createElement('div'); box.id = 'fbList'; box.style.marginTop = '12px'; dlg.querySelector('.in').appendChild(box);
    $('fbBtn').onclick = function () { dlg.hidden = false; };
    $('fbClose').onclick = function () { dlg.hidden = true; };
    $('fbSend').onclick = function () {
      var m = $('fbMsg');
      if (ENV == null) { m.textContent = '先綁定你的編號'; m.style.color = 'var(--red)'; return; }
      var t = $('fbText').value.trim(); if (t.length < 4) { m.textContent = '請寫一下發生了什麼'; m.style.color = 'var(--red)'; return; }
      var lk = $('fbLink').value.trim(); if (lk && !isUrl(lk)) { m.textContent = '連結要以 https:// 開頭'; m.style.color = 'var(--red)'; return; }
      var snap = {}; UNITS.forEach(function (u) { snap[u.key] = { subs: (SUBS[u.key] || []).length, chk: ticked(u) }; });
      ref('midfb/' + COURSE + '/' + ENV).push({ ts: firebase.database.ServerValue.TIMESTAMP, type: $('fbType').value, unit: $('fbUnit').value || null, text: mask(t), link: lk || null, snap: snap, ver: VER, ua: navigator.userAgent.slice(0, 100) }).then(function () {
        $('fbText').value = ''; $('fbLink').value = ''; m.textContent = '已送出 ✓ 老師看得到'; m.style.color = 'var(--green)';
      }).catch(function (e) { m.textContent = '送出失敗：' + (e && e.message || e); m.style.color = 'var(--red)'; });
    };
  }

  /* ───────── AI 助教 ───────── */
  var CFG = { chatEnabled: false, dailyCap: 20 }, CHAT = {};
  var OFFLINE = '助教目前還沒開放。先用下面的檢查清單自己對一遍：① 卡號卡名每一份都一樣嗎？② 改動句有原文引用嗎？③ 三人例子的最終自尊值在 R2、Canvas、原型、成果裡一樣嗎？④ 不一樣的地方有寫原因嗎？';
  function chatLeft() { var n = 0, t = today(); Object.keys(CHAT).forEach(function (k) { if (CHAT[k].day === t) n++; }); return Math.max(0, CFG.dailyCap - n); }
  function renderChat() {
    var ks = Object.keys(CHAT).sort(); var box = $('chatLog');
    box.innerHTML = ks.length ? ks.slice(-30).map(function (k) { var o = CHAT[k]; return '<div class="bub q">' + esc(o.q) + '</div>' + (o.a ? '<div class="bub a">' + esc(o.a) + '</div>' : '<div class="bub a" style="opacity:.6">' + (o.status === 'capped' ? '今天的次數用完了' : '助教想一下…') + '</div>'); }).join('') : '<div class="sub" style="margin:0">還沒有對話。</div>';
    box.scrollTop = box.scrollHeight;
    $('chatLeft').textContent = ENV == null ? '' : '今天還剩 ' + chatLeft() + ' 次';
    $('capN').textContent = CFG.dailyCap;
    $('chatState').textContent = CFG.chatEnabled ? '' : OFFLINE;
    var left = ENV == null ? null : chatLeft();
    var badge = !CFG.loaded ? '讀取中…' : !CFG.chatEnabled ? '⚪ 尚未開放' : (left == null ? '🟢 已開放' : (left > 0 ? '🟢 已開放 · 今天還剩 ' + left + '/' + CFG.dailyCap + ' 次' : '🟠 今天的 ' + CFG.dailyCap + ' 次用完了，明天再問'));
    if ($('chatBadge')) $('chatBadge').textContent = badge;
    if ($('progChat')) { $('progChat').textContent = 'AI 助教：' + (!CFG.loaded ? '讀取中…' : !CFG.chatEnabled ? '⚪ 尚未開放（先用單元裡的自查清單）' : badge.replace(/^🟢 |^🟠 /, '')); $('progChat').style.color = (CFG.loaded && CFG.chatEnabled && left !== 0) ? 'var(--green)' : 'var(--ink-soft)'; }
    if (window.twemoji) try { twemoji.parse($('chatBadge')); twemoji.parse($('progChat')); } catch (e) {}
    $('chatSend').disabled = !CFG.chatEnabled || ENV == null || chatLeft() <= 0;
  }
  function listenChat() {
    ref('midchat/' + COURSE + '/' + ENV).limitToLast(60).on('value', function (s) { CHAT = s.val() || {}; renderChat(); renderAch(); });
  }
  function initChat() {
    ref('midcfg').on('value', function (s) { var v = s.val() || {}; CFG.loaded = true; CFG.chatEnabled = !!v.chatEnabled; CFG.dailyCap = Number(v.dailyCap) > 0 ? Number(v.dailyCap) : 20; renderChat(); });
    $('chatSend').onclick = function () {
      var m = $('chatMsg'), q = $('chatQ').value.trim();
      if (ENV == null) { m.textContent = '先綁定編號'; return; }
      if (q.length < 4) { m.textContent = '請寫完整一點的問題'; m.style.color = 'var(--red)'; return; }
      if (chatLeft() <= 0) { m.textContent = '今天的次數用完了，明天再問'; m.style.color = 'var(--red)'; return; }
      $('chatSend').disabled = true;
      ref('midchat/' + COURSE + '/' + ENV).push({ ts: firebase.database.ServerValue.TIMESTAMP, day: today(), unit: $('chatUnit').value, q: mask(q).slice(0, 1200), status: 'queued', ver: VER }).then(function () {
        $('chatQ').value = ''; m.textContent = '';
      }).catch(function (e) { m.textContent = '送出失敗：' + (e && e.message || e); m.style.color = 'var(--red)'; $('chatSend').disabled = false; });
    };
  }

  /* ───────── 成就 ───────── */
  var W47 = null;
  var MBADGES = [
    { k: 'start', name: '期中起手', desc: '在這一頁送出過任何一個單元', f: function () { return UNITS.some(function (u) { return (SUBS[u.key] || []).length; }); } },
    { k: 'four', name: '四關都交', desc: '四個單元都送出過至少一次', f: function () { return UNITS.every(function (u) { return (SUBS[u.key] || []).length; }); } },
    { k: 'checked', name: '自查全勾', desc: '某個單元最近一次提交時，自查全部勾完', f: function () { return UNITS.some(function (u) { var a = SUBS[u.key] || []; return a.length && a[0].chkN === u.chk.length; }); } },
    { k: 'same', name: '數字對得上', desc: '至少三個單元的最終自尊值寫得一樣', f: function () {
        var c = {}, n = 0; UNITS.forEach(function (u) { var g = normGold(latestGold(u.key)); if (g) { c[g] = (c[g] || 0) + 1; } });
        Object.keys(c).forEach(function (k) { if (c[k] > n) n = c[k]; }); return n >= 3; } },
    { k: 'diff', name: '誠實登記', desc: '填了差異登記或一致性表（不一致也寫出來）', f: function () {
        function has(k, t) { return (SUBS[k] || []).some(function (r) { return r.texts && r.texts[t] && r.texts[t].length >= 4; }); }
        return has('u3', 'diff') || has('u4', 'consist'); } },
    { k: 'again', name: '再來一次', desc: '同一個單元送出過兩次以上', f: function () { return UNITS.some(function (u) { return (SUBS[u.key] || []).length >= 2; }); } },
    { k: 'fixed', name: '依據建議修正', desc: '再次提交時，回應過預掃建議', f: function () { return UNITS.some(function (u) { return (SUBS[u.key] || []).some(function (r) { return r.fixN > 0; }); }); } },
    { k: 'ask', name: '勇於發問', desc: '向 AI 助教問過問題', f: function () { return Object.keys(CHAT).length > 0; } }
  ];
  function renderAch() {
    var bd = $('midBadges'); if (!bd) return;
    bd.innerHTML = '';
    MBADGES.forEach(function (x) {
      var on = false; try { on = !!x.f(); } catch (e) {}
      var t = document.createElement('span'); t.className = 'bd' + (on ? ' on' : '');
      t.textContent = (on ? '🏅 ' : '○ ') + x.name;
      var d = document.createElement('span'); d.className = 'bdd'; d.textContent = x.desc; t.appendChild(d); bd.appendChild(t);
    });
    if (window.twemoji) try { twemoji.parse(bd); } catch (e) {}
    var sb = $('skillBox');
    if (sb && window.W47Skills) {
      if (W47) { try { window.W47Skills.render(sb, window.W47Skills.compute(W47, '20261028')); } catch (e) { sb.textContent = '技能暫時算不出來'; } }
      else sb.textContent = ENV == null ? '綁定編號後會顯示。' : '你在 W4–W7 還沒有提交紀錄，交過之後這裡會出現五項技能。';
    }
  }
  function loadW47() {
    ref('w47sub/' + COURSE + '/' + ENV).once('value').then(function (s) { W47 = s.val(); renderAch(); }).catch(function () { renderAch(); });
  }

  /* ───────── 啟動 ───────── */
  buildUnits(); initFb(); initChat(); refreshProgress(); renderAdvice(); renderChat(); renderAch();
  var last;
  setInterval(function () {
    var e = envNow(); if (e === last) return; last = e; ENV = e;
    var w = $('who');
    if (e == null) { w.textContent = '先在頁面最上方綁定你的編號，才能提交。'; return; }
    COURSE = courseOf(e);
    w.textContent = '你的編號：#' + e + '（提交只記編號，不記姓名）';
    listen(); renderAdvice(); renderChat();
  }, 1500);
})();
