/* 老師後台：第11週 AI 助教整合（網站側，2026-11-18 改成不靠本機也完整）。
   資料來源：
   ・綁定／上線：Firebase 公開節點 whgm/analysis（只有是否綁定、是否只用編號、是否上線，沒有信箱姓名）
   ・助教摘要：ctalk/sum/{場次}/{編號}（助教代理程式每輪處理完去文字鏡射；只有老師 Google 帳號讀得到；沒有學生原話、助教回覆、學號姓名）
   ・核准加開：老師按核准 → 寫 ctalk/grant/{場次}/{編號}（加開總數；只有老師 Google 帳號寫得進去），代理程式約 20 秒內套用
   對話全文只存在老師電腦（本機後台 127.0.0.1:8821），偵測到才多一個「看對話全文」連結。 */
(function () {
  var LOCAL = 'http://127.0.0.1:8821', FBB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app';
  var COURSES = { '47602': ['文化遊戲松', 52, function (e) { return e >= 1 && e <= 52; }], '46582': ['遊戲設計學', 30, function (e) { return e >= 101 && e <= 130; }] };
  var CELLS = [['base', '樣板'], ['moment', '好玩的一刻'], ['loop', '一直在做的事'], ['tainan', '台南的東西'], ['winlose', '輸贏'], ['screens', '三個畫面']];
  var SYM = { c: '●', v: '◐', e: '○' }, STX = { c: '清楚', v: '模糊', e: '還沒有' };
  var SEL = { sess: '', unit: 'W11', only: false }, STATE = { sessions: [], timer: null, localOk: false };
  function $(i) { return document.getElementById(i); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function jpub(p) { return fetch(FBB + '/' + p.split('?')[0] + '.json' + (p.indexOf('?') > 0 ? '?' + p.split('?')[1] : '')).then(function (r) { return r.json(); }); }
  function token() { var u = window.firebase && firebase.auth && firebase.auth().currentUser; return u ? u.getIdToken() : Promise.resolve(null); }
  function jauth(path, method, body, extra) {
    return token().then(function (t) {
      if (!t) throw new Error('no-auth');
      return fetch(FBB + '/' + path + '.json?auth=' + encodeURIComponent(t) + (extra ? '&' + extra : ''), { method: method || 'GET', body: body === undefined ? undefined : JSON.stringify(body) }).then(function (r) {
        if (!r.ok) throw new Error('http-' + r.status); return r.json();
      });
    });
  }
  function sessDate(s) { var m = /-(20\d\d)(\d\d)(\d\d)(am|pm)$/.exec(s); return m ? m[1] + m[2] + m[3] + (m[4] === 'pm' ? '2' : '1') : '0'; }
  function sessLabel(s) { var m = /^(\w+)-(20\d\d)(\d\d)(\d\d)(am|pm)$/.exec(s); if (!m) return s; var n = m[1] === 'test' ? '測試場次' : (COURSES[m[1]] ? COURSES[m[1]][0] : m[1]); return n + ' ' + (+m[3]) + '/' + (+m[4]) + (m[5] === 'am' ? ' 上午' : ' 下午'); }
  function parseTs(s) { var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : 0; }
  function ago(ts) { if (!ts) return '—'; var m = Math.round((Date.now() - ts) / 60000); var hh = new Date(ts); var t = ('0' + hh.getHours()).slice(-2) + ':' + ('0' + hh.getMinutes()).slice(-2); return t + (m >= 0 && m < 600 ? '（' + m + ' 分前）' : ''); }
  function tally(o) { var k = Object.keys(o || {}).sort(); return k.map(function (x) { return x + '×' + o[x]; }).join(' '); }

  function say(h) { var b = $('w11web'); if (b) b.innerHTML = h; }
  function needLogin() {
    return '<div class="w47box" style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;line-height:1.8"><b>看不到助教摘要：目前不是用老師的 Google 帳號登入。</b><br>助教摘要與加開核准只開給老師帳號（scatjay@gmail.com）。用備援密碼進來的，請按右上角「登出」，再用 Google 登入一次。</div>';
  }

  function loadSessions() {
    return jauth('ctalk/sum', 'GET', undefined, 'shallow=true').then(function (o) {
      var ks = Object.keys(o || {}).filter(function (s) { return /^(47602|46582|test)-20\d{6}(am|pm)$/.test(s); });
      ks.sort(function (a, b) { return sessDate(b) < sessDate(a) ? -1 : sessDate(b) > sessDate(a) ? 1 : 0; });
      STATE.sessions = ks;
      if (!SEL.sess || ks.indexOf(SEL.sess) < 0) SEL.sess = ks.filter(function (s) { return s.indexOf('test-') !== 0; })[0] || ks[0] || '';
      return ks;
    });
  }

  function render(pub, sum, grant, ledger) {
    var sess = SEL.sess, unit = SEL.unit, course = sess.split('-')[0], isTest = course === 'test';
    var idx = pub.idx || {}, unb = {}, on = pub.on || {}, now = Date.now();
    Object.keys(pub.ub || {}).forEach(function (k) { var v = pub.ub[k]; if (v && v.env != null) unb[String(v.env)] = 1; });
    var ids;
    if (isTest) ids = Object.keys(sum).map(Number).sort(function (a, b) { return a - b; });
    else { ids = []; for (var e = 1; e <= 130; e++) if (COURSES[course][2](e)) ids.push(e); }
    var od = on[course] || {};
    var rows = ids.map(function (e) {
      var s = String(e), d = sum[s] || {}, u = (d.u || {})[unit] || {}, t = od[s] && od[s].t;
      return { e: e, bound: !!idx[s], login: !!idx[s] && !unb[s], online: !!(t && now - t < 240000), d: d, u: u, started: (u.n || 0) > 0, last: parseTs(d.last) };
    });
    var started = rows.filter(function (r) { return r.started; }), res = rows.filter(function (r) { return r.u.res; });
    var rounds = rows.reduce(function (a, r) { return a + (r.d.today || 0); }, 0), twd = rows.reduce(function (a, r) { return a + (r.d.twd || 0); }, 0);
    var reqs = rows.filter(function (r) { return r.d.req; });
    var unlimited = rows.every(function (r) { return !r.d.cap; });   // 每日輪數不設上限（11-18 11:43 起）；申請加開與核准流程保留，日後恢復上限就會再出現
    var nb = rows.filter(function (r) { return r.bound; }).length, no = rows.filter(function (r) { return r.online; }).length;
    var total = isTest ? rows.length : COURSES[course][1];
    var h = '<div class="stats">' + [
      [started.length + ' / ' + total, '開始跟助教聊的人'], [res.length, '拿到結果卡的人'], [rounds, '今天助教總輪數（所有單元）'], ['NT$ ' + twd.toFixed(1), '今天助教花費（只給老師看）'],
      [unlimited && !reqs.length ? '不設' : reqs.length, unlimited && !reqs.length ? '每日輪數上限（目前不設）' : '申請加開待處理'], [nb + ' / ' + total, '已綁定編號'], [no, '目前上線']].map(function (x) { return '<div class="stat"><div class="n">' + x[0] + '</div><div class="l">' + x[1] + '</div></div>'; }).join('') + '</div>';
    // 今天最常被問的 3 類問題（只有分類與次數，沒有原話）
    var qt = {}, unsure = 0;
    rows.forEach(function (r) { var q = r.d.qt || {}; Object.keys(q).forEach(function (k) { qt[k] = (qt[k] || 0) + q[k]; }); unsure += r.d.unsure || 0; });
    var top3 = Object.keys(qt).sort(function (a, b) { return qt[b] - qt[a]; }).slice(0, 3);
    h += '<div style="font-size:14px;margin:0 0 10px">❓ 今天最常被問的 3 類問題：' + (top3.length ? top3.map(function (k) { return esc(k) + ' ' + qt[k] + ' 次'; }).join('、') : '還沒有人問任務說明') + (unsure ? '　<span style="color:var(--warn,#b8860b)">助教說「不確定、請問老師」' + unsure + ' 次（可補進知識庫）</span>' : '') + '</div>';
    if (ledger && typeof ledger.pct === 'number') {
      var hot = ledger.pct >= 80;
      h += '<div style="font-size:14px;margin:0 0 10px;' + (hot ? 'color:var(--warn,#b8860b);font-weight:700' : '') + '">💰 今日助教費用 NT$ ' + ledger.today_twd + ' / ' + ledger.cap_twd + '（' + ledger.pct + '%）' + (hot ? '　⚠ 接近日上限，超過後助教會顯示「今天太忙了」' : '') + '</div>';
    }
    // 申請加開
    if (reqs.length) {
      h += '<div class="w47box" style="background:var(--panel);border:1.5px solid var(--warn,#b8860b);border-radius:12px;padding:10px 14px;margin:0 0 12px"><b>🙋 申請加開（' + reqs.length + '）</b><br>' + reqs.map(function (r) {
        return '<div style="margin:6px 0">#' + r.e + '　今天 ' + (r.d.today || 0) + (r.d.cap ? ' / ' + r.d.cap : '') + ' 輪　<select id="gsel' + r.e + '"><option>10</option><option selected>20</option><option>30</option><option>50</option></select> 輪　<button type="button" data-grant="' + r.e + '">核准加開</button> <span id="gmsg' + r.e + '" style="font-size:12px;color:var(--ink-soft)"></span></div>';
      }).join('') + '<div style="font-size:12px;color:var(--ink-soft)">按下去會寫到網站，老師電腦上的助教代理程式約 20 秒內套用（需要代理程式開著）。核准後這位的上限會變大，申請標記自動消失。</div></div>';
    }
    // 已核准但代理程式還沒套用
    var wait = ids.filter(function (e) { var g = grant[String(e)]; return typeof g === 'number' && g > ((sum[String(e)] || {}).grant || 0); });
    if (wait.length) h += '<div style="font-size:13px;color:var(--warn,#b8860b);margin:0 0 8px">⏳ 已核准、等代理程式套用：' + wait.map(function (e) { return '#' + e + '（總加開 ' + grant[String(e)] + '）'; }).join('、') + '。超過 1 分鐘沒變，請確認老師電腦的助教代理程式有開著。</div>';
    // 全班表
    h += '<div class="w3scroll" style="max-height:520px"><table class="w3tbl"><thead><tr><th>編號</th><th>綁定</th><th>上線</th><th title="今天已用輪數／今天上限（所有單元合計）">今天</th><th title="●清楚 ◐模糊 ○還沒有">' + CELLS.map(function (c) { return c[1]; }).join('｜') + '</th><th>結果卡</th><th>狀態</th><th>最後</th><th title="追問類型 MV、提示強度 H（次數）">追問／提示</th></tr></thead><tbody>' + rows.filter(function (r) { return !SEL.only || r.started; }).map(function (r) {
      var u = r.u, c = u.cells || {};
      var dots = CELLS.map(function (x) { var st = started.indexOf(r) >= 0 || r.started ? (c[x[0]] || 'e') : 'e'; return '<span title="' + esc(x[1] + '：' + STX[st]) + '" style="color:' + (st === 'c' ? 'var(--ok,#2f6b55)' : st === 'v' ? 'var(--warn,#b8860b)' : 'var(--ink-soft)') + '">' + SYM[st] + '</span>'; }).join(' ');
      var stt = [];
      if (r.d.req) stt.push('🙋申請加開'); if (r.d.full) stt.push('用完'); if (r.d.grant) stt.push('加開 ' + r.d.grant); if (u.rule) stt.push('規則句 ' + u.rule); if (u.fig) stt.push('有 Figma');
      var gray = !r.started && !r.bound;
      return '<tr' + (gray ? ' style="opacity:.55"' : '') + '><td><b>#' + r.e + '</b></td><td>' + (r.bound ? (r.login ? '✓' : '編號') : '—') + '</td><td>' + (r.online ? '🟢' : '') + '</td><td>' + (r.started || r.d.today ? (r.d.today || 0) + (r.d.cap ? ' / ' + r.d.cap : '') + (u.n != null ? '　<span style="color:var(--ink-soft)">此單元 ' + u.n + '</span>' : '') : '<span style="color:var(--ink-soft)">還沒開始</span>') + '</td><td style="white-space:nowrap">' + dots + '</td><td>' + (u.res ? '✓ 已確認' : u.sum ? '已整理待確認' : '—') + '</td><td>' + stt.map(esc).join('、') + '</td><td>' + (r.last ? ago(r.last) : '—') + '</td><td style="font-size:12px">' + esc(tally(u.mv)) + (u.h ? '｜' + esc(tally(u.h)) : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    h += '<div style="font-size:12px;color:var(--ink-soft);margin-top:6px">資料每 30 秒更新一次（助教每回答一輪就更新該位的摘要）。這裡沒有學生原話與助教回覆；對話全文只在老師電腦。花費是每輪估計值加總，只給老師看。' + (STATE.localOk ? '' : '') + '</div>';
    say(h);
    document.querySelectorAll('[data-grant]').forEach(function (b) { b.onclick = function () { approve(b.getAttribute('data-grant')); }; });
  }

  function approve(env) {
    var sess = SEL.sess, sel = $('gsel' + env), msg = $('gmsg' + env), add = +(sel && sel.value || 20);
    if (!/^(47602|46582|test)-20\d{6}(am|pm)$/.test(sess) || !(add >= 1 && add <= 100)) return;
    if (msg) msg.textContent = '送出中…';
    jauth('ctalk/grant/' + sess + '/' + env, 'GET').then(function (cur) {
      var base = typeof cur === 'number' ? cur : 0, total = Math.min(200, base + add);
      return jauth('ctalk/grant/' + sess + '/' + env, 'PUT', total).then(function () { return total; });
    }).then(function (total) { if (msg) msg.textContent = '✓ 已核准，總加開 ' + total + ' 輪，等代理程式套用（約 20 秒）'; setTimeout(function () { window.loadW11(true); }, 25000); })
      .catch(function (e) { if (msg) msg.textContent = '✗ 送不出去（' + e.message + '）。請確認是用老師的 Google 帳號登入。'; });
  }

  function controls() {
    var ss = STATE.sessions.map(function (s) { return '<option value="' + s + '"' + (s === SEL.sess ? ' selected' : '') + '>' + esc(sessLabel(s)) + '</option>'; }).join('');
    var us = ['W11', 'W12', 'W13', 'W14', 'W15', 'W16'].map(function (u) { return '<option' + (u === SEL.unit ? ' selected' : '') + '>' + u + '</option>'; }).join('');
    return '<div style="margin:0 0 10px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><label>場次 <select id="w11sess">' + ss + '</select></label><label>單元 <select id="w11unit">' + us + '</select></label><label><input type="checkbox" id="w11only"' + (SEL.only ? ' checked' : '') + '> 只看已開始的人</label><button type="button" id="w11refresh">重新整理</button></div>';
  }

  window.loadW11 = function (quiet) {
    var box = $('w11web'), ctl = $('w11ctl'); if (!box) return;
    if (!quiet) box.textContent = '載入中…';
    Promise.all([jpub('whgm/analysis/w3game/envIndex?shallow=true'), jpub('whgm/analysis/w3game/unbound'), jpub('whgm/analysis/online')]).then(function (a) {
      var pub = { idx: a[0] || {}, ub: a[1] || {}, on: a[2] || {} };
      return loadSessions().then(function (ks) {
        if (ctl) { ctl.innerHTML = controls(); wire(); }
        if (!ks.length) { say('<div style="color:var(--ink-soft)">ctalk/sum 還沒有任何場次的摘要（助教代理程式更新後第一個學生聊完一輪就會出現）。</div>'); return; }
        return Promise.all([jauth('ctalk/sum/' + SEL.sess), jauth('ctalk/grant/' + SEL.sess).catch(function () { return {}; }), jauth('ctalk/ledger').catch(function () { return null; })]).then(function (b) { render(pub, b[0] || {}, b[1] || {}, b[2]); });
      });
    }).catch(function (e) {
      if (e && e.message === 'no-auth') say(needLogin());
      else if (e && /http-401/.test(e.message)) say(needLogin());
      else say('讀不到 Firebase 資料（' + esc(e && e.message) + '）。');
    });
    localCheck();
    clearInterval(STATE.timer);
    STATE.timer = setInterval(function () { var t = $('tabW11'); if (t && !t.hidden && !document.hidden) window.loadW11(true); }, 30000);
  };

  function wire() {
    var s = $('w11sess'), u = $('w11unit'), o = $('w11only'), r = $('w11refresh');
    if (s) s.onchange = function () { SEL.sess = s.value; window.loadW11(); };
    if (u) u.onchange = function () { SEL.unit = u.value; window.loadW11(); };
    if (o) o.onchange = function () { SEL.only = o.checked; window.loadW11(true); };
    if (r) r.onclick = function () { window.loadW11(); };
  }

  function localCheck() {
    var st = $('w11local'), pend = $('w11pend'), lk = $('w11localLink');
    if (!st) return;
    fetch(LOCAL + '/api/pending', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      STATE.localOk = true; if (lk) lk.hidden = false;
      st.innerHTML = '<span style="color:var(--ok)">🟢 偵測到本機後台（這台是老師電腦）</span>';
      if (pend) pend.textContent = (d.pending > 0 || d.attention > 0) ? '本機有 ' + (d.pending || 0) + ' 筆申請加開、' + (d.attention || 0) + ' 位學生需要看。' : '';
    }).catch(function () { STATE.localOk = false; if (lk) lk.hidden = true; st.innerHTML = '<span style="color:var(--ink-soft)">沒有偵測到本機後台（不影響上面的表；要看對話全文才需要在老師電腦開它）</span>'; if (pend) pend.textContent = ''; });
  }
})();
