/* 教師後台「第8–9週 · 期中作業」分頁。由 teacher.html 切到 Mid 分頁時呼叫 window.loadMid()。
   讀（一次性）：whgm/analysis/midsub|midscan|midfb|midchat/47602、midcfg、w47sub/47602
   寫：midfb/47602/{編號}/{id}/reply（老師回覆）、midcfg（助教開關與每日上限）
   只用編號，不顯示姓名，不反查身分（IRB）。 */
(function () {
  'use strict';
  var BASE = 'whgm/analysis/';
  var COURSE = window.MID_COURSE || '47602';
  var UN = [['u1', '單元1 DR'], ['u2', '單元2 Canvas'], ['u3', '單元3 AIS'], ['u4', '單元4 NBLM']];
  var CHKTOT = { u1: 7, u2: 4, u3: 6, u4: 6 };
  var D = null, SEL = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function fmt(ts) { var d = new Date(Number(ts)); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function today() { var d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-C0-9]/g, ''); }
  function get(p) { return firebase.database().ref(BASE + p).once('value').then(function (s) { return s.val(); }).catch(function () { return null; }); }
  function arr(o) { return o ? Object.keys(o).map(function (k) { var v = o[k]; if (v && typeof v === 'object') v._id = k; return v; }) : []; }
  function $(id) { return document.getElementById(id); }

  function load() {
    var box = $('tabMid'); if (!box) return;
    box.innerHTML = '<p class="mini">讀取中…</p>';
    Promise.all([get('midsub/' + COURSE), get('midscan/' + COURSE), get('midfb/' + COURSE), get('midchat/' + COURSE), get('midcfg'), get('w47sub/' + COURSE)]).then(function (r) {
      D = { sub: r[0] || {}, scan: r[1] || {}, fb: r[2] || {}, chat: r[3] || {}, cfg: r[4] || {}, w47: r[5] || {}, at: Date.now() };
      render();
    });
  }

  function subsOf(env, u) { var o = (D.sub[env] || {})[u]; return arr(o).sort(function (a, b) { return b.ts - a.ts; }); }
  function scanOf(env, u) { return ((D.scan[env] || {})[u]) || {}; }
  function fbsOf(env) { var o = D.fb[env]; return o ? Object.keys(o).map(function (k) { var v = o[k]; v._id = k; v._env = env; return v; }) : []; }
  function goldMismatch(env) {
    var vals = {}; UN.forEach(function (u) { var s = subsOf(env, u[0])[0]; var g = s && s.texts && norm(s.texts.gold); if (g) vals[u[0]] = g; });
    var set = {}; Object.keys(vals).forEach(function (k) { set[vals[k]] = 1; }); return Object.keys(set).length > 1;
  }
  function pendingFb(env) { return fbsOf(env).filter(function (f) { return !f.reply; }).length; }

  function cell(env, u) {
    var s = subsOf(env, u), n = s.length, sc = scanOf(env, u), items = sc.items ? Object.keys(sc.items).length : 0;
    var bg = 'var(--panel)', txt = '未交', col = 'var(--ink-soft)';
    if (n) { var last = s[0]; var done = last.chkN === (last.chkTotal || CHKTOT[u]); bg = done ? '#dff0e3' : '#f3ecc8'; txt = '已交 ' + n + ' 次 · 勾 ' + (last.chkN || 0) + '/' + (last.chkTotal || CHKTOT[u]); col = 'var(--ink)'; }
    var tail = (items ? '<br><small>建議 ' + items + '</small>' : '');
    return '<td style="background:' + bg + ';color:' + col + ';font-size:12px;line-height:1.5">' + txt + tail + '</td>';
  }


  /* ───────── 助教發問總覽與整體分析（全班，只用編號） ───────── */
  var TOPICS = [['改動句', /改動句|40\s*字|縮短|一句話/], ['三人例子／自尊值', /自尊|三人|A7|黃金|最終/], ['卡號卡名', /卡號|卡名|卡\s*\d+/], ['連結／分享權限', /連結|分享|權限|打不開|無痕/],
                ['指令怎麼寫', /指令|提示詞|prompt|怎麼問|怎麼下/], ['Canvas', /canvas/i], ['AI Studio／原型', /ai\s*studio|原型|遊戲|能玩/], ['NotebookLM', /notebook|nblm|簡報|語音|資訊圖表/],
                ['前後銜接', /銜接|對不上|不一致|一樣|一致/], ['Deep Research／R1-R3', /deep\s*research|R1|R2|R3|案例/i], ['檢核／交什麼', /檢核|交什麼|怎麼交|期限|繳交|自查/]];
  function allChats() {
    var out = [];
    Object.keys(D.chat || {}).forEach(function (env) { arr(D.chat[env]).forEach(function (m) { m._env = env; out.push(m); }); });
    return out.sort(function (a, b) { return b.ts - a.ts; });
  }
  function chatStats(list) {
    var n = list.length, people = {}, byUnit = {}, len = 0, yn = 0, withData = 0, follow = 0, topic = {}, byEnv = {};
    list.forEach(function (m) {
      var q = String(m.q || ''); people[m._env] = 1; byUnit[m.unit || 'all'] = (byUnit[m.unit || 'all'] || 0) + 1; len += q.length;
      if (q.length <= 22 && /嗎|是不是|對不對|可不可以|能不能|要不要/.test(q)) yn++;
      if (/卡\s*\d+|「[^」]{2,}」|A\d\s*B\d|\d{2,}/.test(q) || q.length >= 60) withData++;
      TOPICS.forEach(function (t) { if (t[1].test(q)) topic[t[0]] = (topic[t[0]] || 0) + 1; });
      (byEnv[m._env] = byEnv[m._env] || []).push(m);
    });
    Object.keys(byEnv).forEach(function (e) {
      var a = byEnv[e].sort(function (x, y) { return x.ts - y.ts; });
      for (var i = 1; i < a.length; i++) if (a[i].ts - a[i - 1].ts <= 15 * 60 * 1000 && a[i].unit === a[i - 1].unit) follow++;
    });
    return { n: n, people: Object.keys(people).length, byUnit: byUnit, avgLen: n ? Math.round(len / n) : 0, yn: yn, withData: withData, follow: follow, topic: topic };
  }
  function chatOverview() {
    var list = allChats(), st = chatStats(list);
    var h = '<h2 style="font-size:16px;margin:22px 0 8px">助教發問總覽與整體分析<span class="mini" style="font-weight:400"> · 共 ' + st.n + ' 則、' + st.people + ' 人（資料同時是指令工程分析材料，只記編號）</span></h2>';
    if (!st.n) return h + '<div class="mini">還沒有人發問。學生開始問之後，這裡會出現整體分析與每一則提問。</div>';
    var pct = function (x) { return Math.round(x / st.n * 100) + '%'; };
    var UNN = { u1: '單元1', u2: '單元2', u3: '單元3', u4: '單元4', all: '整體銜接' };
    var topics = Object.keys(st.topic).sort(function (a, b) { return st.topic[b] - st.topic[a]; });
    h += '<div class="stats"><div class="stat"><div class="n">' + st.avgLen + '</div><div class="l">平均提問字數</div></div>' +
      '<div class="stat"><div class="n">' + pct(st.withData) + '</div><div class="l">有附自己的內容或數字</div></div>' +
      '<div class="stat"><div class="n">' + pct(st.yn) + '</div><div class="l">只是簡短是非題</div></div>' +
      '<div class="stat"><div class="n">' + st.follow + '</div><div class="l">15 分鐘內追問</div></div></div>';
    h += '<div class="box" style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;font-size:13.5px;margin:8px 0">' +
      '<b>各單元：</b>' + Object.keys(st.byUnit).map(function (u) { return (UNN[u] || u) + ' ' + st.byUnit[u]; }).join('　') +
      '<br><b>被問最多的主題：</b>' + (topics.length ? topics.slice(0, 6).map(function (t) { return esc(t) + ' ' + st.topic[t]; }).join('　') : '（還分不出主題）') +
      '<br><b>觀察：</b>' + obs(st).map(esc).join('；') + '</div>';
    h += '<details open><summary class="mini" style="cursor:pointer"><b>最近的提問（最多 60 則，點「答」展開）</b></summary><div class="w3scroll"><table class="w3tbl"><thead><tr><th>時間</th><th>編號</th><th>單元</th><th>問</th><th>答</th></tr></thead><tbody>' +
      list.slice(0, 60).map(function (m, i) { return '<tr><td class="small">' + fmt(m.ts) + '</td><td><a href="#" data-mid="' + esc(m._env) + '">#' + esc(m._env) + '</a></td><td>' + esc(UNN[m.unit] || m.unit || '') + '</td><td>' + esc(m.q) + '</td><td>' + (m.a ? '<details><summary class="mini">展開</summary><div class="mini" style="white-space:pre-wrap;max-width:420px">' + esc(m.a) + '</div></details>' : '<span class="mini">' + esc(m.status || '') + '</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>';
    return h;
  }
  function obs(st) {
    var o = [], n = st.n;
    if (n < 5) o.push('提問還少，樣本不足，先看個別提問');
    if (n >= 5 && st.avgLen < 25) o.push('提問偏短，多半沒有附上自己的內容；可以提醒學生「貼出你寫的那句話或數字再問」');
    if (n >= 5 && st.yn / n >= 0.4) o.push('近四成以上是簡短是非題，建議引導改問「怎麼改」「差在哪」');
    if (n >= 5 && st.withData / n < 0.3) o.push('附上具體內容的提問不到三成，助教很難給精準建議');
    if (st.follow === 0 && n >= 5) o.push('幾乎沒有人在同一單元追問，可能是答案看完就走，或不知道可以接著問');
    if (st.follow / Math.max(1, n) >= 0.3) o.push('追問比例高，學生有在對話式修正');
    if (!o.length) o.push('目前沒有明顯的偏誤，持續觀察');
    return o;
  }

  function render() {
    var box = $('tabMid'), envs = []; for (var i = 1; i <= 52; i++) envs.push(String(i));
    [D.sub, D.fb, D.chat].forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (/^\d+$/.test(k) && envs.indexOf(k) < 0) envs.push(k); }); });
    envs.sort(function (a, b) { return a - b; });
    var nSub = {}, anySub = 0, pend = 0, gm = 0;
    UN.forEach(function (u) { nSub[u[0]] = 0; });
    envs.forEach(function (e) { var any = false; UN.forEach(function (u) { if (subsOf(e, u[0]).length) { nSub[u[0]]++; any = true; } }); if (any) anySub++; pend += pendingFb(e); if (goldMismatch(e)) gm++; });
    var chatCount = {}, chatToday = 0, t = today(), capped = 0, cap = Number(D.cfg.dailyCap) > 0 ? Number(D.cfg.dailyCap) : 20;
    Object.keys(D.chat).forEach(function (e) { var n = 0; arr(D.chat[e]).forEach(function (m) { if (m.day === t) { n++; chatToday++; } }); chatCount[e] = n; if (n >= cap) capped++; });
    var chatPeople = Object.keys(chatCount).filter(function (e) { return chatCount[e] > 0; }).length;
    var h = '<div class="stats">' +
      '<div class="stat"><div class="n">' + anySub + '/52</div><div class="l">有提交期中作業的人</div></div>' +
      UN.map(function (u) { return '<div class="stat"><div class="n">' + nSub[u[0]] + '</div><div class="l">' + u[1] + ' 已交</div></div>'; }).join('') +
      '<div class="stat"><div class="n" style="color:' + (pend ? '#b8452f' : 'inherit') + '">' + pend + '</div><div class="l">待處理的回報</div></div>' +
      '<div class="stat"><div class="n">' + gm + '</div><div class="l">各單元自尊值不一致</div></div></div>';
    h += '<div style="display:flex;gap:10px;align-items:center;margin:8px 0;flex-wrap:wrap"><button id="midReload">重新載入</button><span class="mini">讀取於 ' + fmt(D.at) + '（不自動更新）</span></div>';

    h += '<h2 style="font-size:16px;margin:18px 0 8px">AI 助教<span class="mini" style="font-weight:400"> · 今日 ' + chatToday + ' 則、' + chatPeople + ' 人、撞上限 ' + capped + ' 人</span></h2>' +
      '<div class="box" style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;font-size:13.5px">' +
      '狀態：<b style="color:' + (D.cfg.chatEnabled ? '#2f6b55' : '#b8452f') + '">' + (D.cfg.chatEnabled ? '已開放' : '關閉中') + '</b>　' +
      '每人每日上限：<input id="midCap" type="number" min="1" max="100" value="' + cap + '" style="width:64px"> 次　' +
      '<button id="midCapSave" class="sm">存上限</button> <button id="midToggle" class="sm">' + (D.cfg.chatEnabled ? '關閉助教' : '開放助教') + '</button>' +
      '<div class="mini" style="margin-top:6px">開關寫到 whgm/analysis/midcfg；後端常駐程式要在跑，學生提問才會有回答。' + (D.cfg.chatEnabled ? '' : '目前關閉時學生看到的是自助檢查清單。') + '</div>' +
      '<div id="midChatTop" class="mini" style="margin-top:6px"></div></div>';

    h += chatOverview();
    h += '<h2 style="font-size:16px;margin:18px 0 8px">進度矩陣（點編號看詳情）</h2><div class="w3scroll"><table class="w3tbl"><thead><tr><th>編號</th><th>W4–7 提交天數</th>' + UN.map(function (u) { return '<th>' + u[1] + '</th>'; }).join('') + '<th>回報</th><th>提醒</th></tr></thead><tbody>';
    envs.forEach(function (e) {
      var days = D.w47[e] ? Object.keys(D.w47[e]).length : 0, fb = fbsOf(e), pf = pendingFb(e), flags = [];
      if (goldMismatch(e)) flags.push('自尊值不一致');
      var anyHere = UN.some(function (u) { return subsOf(e, u[0]).length; });
      if (!anyHere) flags.push('還沒交');
      h += '<tr><td><a href="#" data-mid="' + e + '"><b>#' + e + '</b></a></td><td class="num">' + days + '</td>' + UN.map(function (u) { return cell(e, u[0]); }).join('') +
        '<td>' + (fb.length ? (pf ? '<b style="color:#b8452f">● ' + pf + ' 待處理</b>' : fb.length + ' 則已回') : '<span class="mini">—</span>') + '</td><td class="mini">' + esc(flags.join('、')) + '</td></tr>';
    });
    h += '</tbody></table></div><div id="midDetail" style="margin-top:14px"></div>';
    box.innerHTML = h;

    var rk = Object.keys(chatCount).filter(function (e) { return chatCount[e]; }).sort(function (a, b) { return chatCount[b] - chatCount[a]; }).slice(0, 8);
    $('midChatTop').textContent = rk.length ? '今日提問排行：' + rk.map(function (e) { return '#' + e + ' ' + chatCount[e] + ' 次'; }).join('、') : '今天還沒有提問。';
    $('midReload').onclick = load;
    $('midCapSave').onclick = function () { var v = Number($('midCap').value); if (!(v > 0)) return; firebase.database().ref(BASE + 'midcfg/dailyCap').set(v).then(function () { D.cfg.dailyCap = v; $('midCapSave').textContent = '已存 ✓'; }); };
    var tg = $('midToggle'), armed = null;
    tg.onclick = function () {
      if (!armed) { armed = setTimeout(function () { armed = null; tg.textContent = D.cfg.chatEnabled ? '關閉助教' : '開放助教'; }, 6000); tg.textContent = '再按一次確認'; return; }
      clearTimeout(armed); armed = null;
      var nv = !D.cfg.chatEnabled; firebase.database().ref(BASE + 'midcfg/chatEnabled').set(nv).then(function () { D.cfg.chatEnabled = nv; render(); });
    };
    Array.prototype.forEach.call(box.querySelectorAll('[data-mid]'), function (a) { a.onclick = function (ev) { ev.preventDefault(); SEL = a.dataset.mid; detail(SEL); $('midDetail').scrollIntoView({ behavior: 'smooth' }); }; });
    if (SEL) detail(SEL);
  }

  function detail(env) {
    var h = '<div class="box" style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 18px"><h3 style="margin:0 0 8px">#' + esc(env) + ' 的詳情</h3>';
    UN.forEach(function (u) {
      var ss = subsOf(env, u[0]), sc = scanOf(env, u[0]);
      h += '<h4 style="margin:12px 0 4px">' + u[1] + '（提交 ' + ss.length + ' 次）</h4>';
      if (!ss.length) h += '<div class="mini">還沒交。</div>';
      ss.forEach(function (s, i) {
        var ln = Object.keys(s.links || {}).map(function (k) { return '<a href="' + esc(s.links[k]) + '" target="_blank" rel="noopener">' + esc(k) + '</a>'; }).join(' ');
        var tx = Object.keys(s.texts || {}).map(function (k) { return '<div class="mini"><b>' + esc(k) + '：</b>' + esc(s.texts[k]) + '</div>'; }).join('');
        h += '<div style="border-top:1px dashed var(--line);padding:6px 0"><span class="mini">第 ' + (ss.length - i) + ' 次 · ' + fmt(s.ts) + ' · 勾 ' + (s.chkN || 0) + '/' + (s.chkTotal || CHKTOT[u[0]]) + (s.fixN ? ' · 回應建議 ' + s.fixN + ' 條' : '') + '</span><br>' + ln + tx +
          (s.prompt ? '<details><summary class="mini">指令全文</summary><pre style="white-space:pre-wrap;font-size:12px;margin:4px 0">' + esc(s.prompt) + '</pre></details>' : '') +
          (s.fix ? '<div class="mini"><b>對建議的回應：</b>' + Object.keys(s.fix).map(function (k) { return esc(k) + '＝' + esc({ done: '已改', notyet: '還沒改', disagree: '不同意' }[s.fix[k].s] || s.fix[k].s) + (s.fix[k].note ? '（' + esc(s.fix[k].note) + '）' : ''); }).join('；') + '</div>' : '') + '</div>';
      });
      var items = sc.items ? Object.keys(sc.items).map(function (k) { return sc.items[k]; }) : [];
      if (items.length) h += '<div class="mini" style="margin-top:4px"><b>預掃建議：</b><ul style="margin:2px 0">' + items.map(function (it) { return '<li>' + esc(it.check) + '（' + esc(it.status || '') + '）</li>'; }).join('') + '</ul></div>';
    });
    var fbs = fbsOf(env).sort(function (a, b) { return b.ts - a.ts; });
    h += '<h4 style="margin:14px 0 4px">回報與意見（' + fbs.length + '）</h4>';
    if (!fbs.length) h += '<div class="mini">沒有。</div>';
    fbs.forEach(function (f) {
      h += '<div style="border-top:1px dashed var(--line);padding:6px 0"><span class="mini">' + fmt(f.ts) + ' · ' + esc({ bug: '頁面或功能壞了', judge: '系統判斷不對', unclear: '建議看不懂', other: '其他' }[f.type] || f.type) + (f.unit ? ' · ' + esc(f.unit) : '') + '</span><br>' + esc(f.text) + (f.link ? ' <a href="' + esc(f.link) + '" target="_blank" rel="noopener">連結</a>' : '') +
        (f.reply ? '<div class="mini" style="background:#e6f4ef;padding:4px 8px;border-radius:6px;margin-top:4px"><b>已回覆（' + esc(f.reply.verdict || '') + '）：</b>' + esc(f.reply.text || '') + '</div>' :
          '<div style="margin-top:4px"><input type="text" id="rp_' + f._id + '" placeholder="回覆一句話" style="width:100%;padding:6px 9px;border:1px solid var(--line);border-radius:8px"><div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">' +
          ['採納改判', '維持原判', '已修 bug', '只回覆'].map(function (v) { return '<button class="sm" data-reply="' + esc(f._id) + '" data-v="' + v + '">' + v + '</button>'; }).join('') + '</div></div>') + '</div>';
    });
    var cs = arr(D.chat[env]).sort(function (a, b) { return a.ts - b.ts; });
    h += '<h4 style="margin:14px 0 4px">AI 助教對話（' + cs.length + ' 則，指令工程分析材料）</h4>';
    if (!cs.length) h += '<div class="mini">沒有。</div>';
    cs.slice(-20).forEach(function (m) { h += '<div style="border-top:1px dashed var(--line);padding:5px 0"><span class="mini">' + fmt(m.ts) + ' · ' + esc(m.unit || '') + '</span><br><b>問：</b>' + esc(m.q) + (m.a ? '<br><b>答：</b>' + esc(m.a) : '<br><span class="mini">（' + esc(m.status || '') + '）</span>') + '</div>'; });
    h += '</div>';
    var host = $('midDetail'); host.innerHTML = h;
    Array.prototype.forEach.call(host.querySelectorAll('[data-reply]'), function (b) {
      b.onclick = function () {
        var id = b.dataset.reply, tx = ($('rp_' + id).value || '').trim();
        firebase.database().ref(BASE + 'midfb/' + COURSE + '/' + env + '/' + id + '/reply').set({ text: tx, verdict: b.dataset.v, at: firebase.database.ServerValue.TIMESTAMP }).then(function () {
          D.fb[env][id].reply = { text: tx, verdict: b.dataset.v, at: Date.now() }; render();
        });
      };
    });
  }

  window.loadMid = load;
})();
