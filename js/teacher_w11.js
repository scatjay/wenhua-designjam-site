/* 老師後台：第11週 AI 助教整合（網站側）。只讀 Firebase 公開節點的「是否綁定、是否只用編號、是否上線」，不讀信箱、姓名。
   助教對話全文、問卷判定、申請核准都在老師電腦的本機頁（http://127.0.0.1:8821/teacher_w11），不上雲。 */
(function () {
  var LOCAL = 'http://127.0.0.1:8821', FBB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app';
  var COURSES = [['47602', '文化遊戲松', 52, function (e) { return e >= 1 && e <= 52; }], ['46582', '遊戲設計學', 30, function (e) { return e >= 101 && e <= 130; }]];
  function $(i) { return document.getElementById(i); }
  function j(p) { var q = p.split('?'); return fetch(FBB + '/' + q[0] + '.json' + (q[1] ? '?' + q[1] : '')).then(function (r) { return r.json(); }); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  window.loadW11 = function () {
    var box = $('w11web'); if (!box) return; box.textContent = '載入中…';
    Promise.all([j('whgm/analysis/w3game/envIndex?shallow=true'), j('whgm/analysis/w3game/unbound'), j('whgm/analysis/online')]).then(function (a) {
      var idx = a[0] || {}, ub = a[1] || {}, on = a[2] || {}, unb = {}, now = Date.now();
      Object.keys(ub).forEach(function (k) { if (ub[k] && ub[k].env != null) unb[String(ub[k].env)] = 1; });
      var h = '';
      COURSES.forEach(function (c) {
        var ids = []; for (var e = 1; e <= 130; e++) if (c[3](e)) ids.push(e);
        var od = on[c[0]] || {}, rows = ids.map(function (e) {
          var s = String(e), b = !!idx[s], t = od[s] && od[s].t;
          return { e: e, b: b, l: b && !unb[s], o: !!(t && now - t < 240000) };
        });
        var nb = rows.filter(function (r) { return r.b; }).length, nl = rows.filter(function (r) { return r.l; }).length, no = rows.filter(function (r) { return r.o; }).length;
        h += '<h3 style="margin:14px 0 6px">' + c[1] + ' ' + c[0] + '</h3><div class="stats"><div class="stat"><div class="n">' + nb + ' / ' + c[2] + '</div><div class="l">已綁定編號</div></div><div class="stat"><div class="n">' + nl + '</div><div class="l">有 Google 登入（推定：綁定且沒走「只用編號」）</div></div><div class="stat"><div class="n">' + no + '</div><div class="l">目前上線</div></div></div>';
        h += '<div class="w3scroll" style="max-height:360px"><table class="w3tbl"><thead><tr><th>編號</th><th>綁定</th><th>Google 登入</th><th>上線</th></tr></thead><tbody>' + rows.map(function (r) {
          return '<tr><td><b>#' + r.e + '</b></td><td>' + (r.b ? '✓' : '<span style="color:var(--ink-soft)">—</span>') + '</td><td>' + (r.l ? '✓' : r.b ? '只用編號' : '—') + '</td><td>' + (r.o ? '🟢' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      });
      box.innerHTML = h;
    }).catch(function () { box.textContent = '讀不到 Firebase 資料。'; });
    var st = $('w11local'), pend = $('w11pend');
    st.innerHTML = '偵測本機後台…';
    fetch(LOCAL + '/api/pending', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      st.innerHTML = '<span style="color:var(--ok)">🟢 本機後台在線</span>';
      pend.innerHTML = (d.pending > 0 || d.attention > 0) ? '本機有 <b>' + (d.pending || 0) + '</b> 筆申請加開待核准、<b>' + (d.attention || 0) + '</b> 位學生需要過去看，到本機頁處理。' : '本機目前沒有待處理的事。';
    }).catch(function () {
      st.innerHTML = '<span style="color:var(--warn)">未偵測到本機後台（不在老師電腦，或沒啟動，或瀏覽器擋了本機連線）</span>';
      pend.textContent = '';
    });
  };
})();
