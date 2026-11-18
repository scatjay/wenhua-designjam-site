/* 學習單頁的區塊收合（w11–w16、gd_w11–gd_w16 共用，不用每頁各寫一份）。
   把 .wrap 底下每個「有 h2 的 section」變成可收合：標題列一直看得到，收合時標題下面顯示一句摘要；六步（#steps）本來就是卡片，維持原樣；
   已經是 details 的區塊（小封神加分、進階任務）不重複包。預設：問卷展開、其他收起；問卷送出後自動收起並在標題顯示「✓ 已完成」。
   狀態存 localStorage（讀寫都包 try/catch）；頁首「全部展開／全部收合」；頁內錨點與助教的 [[位置連結]] 會先展開目標所在的區塊再捲過去（window.COL_EXPAND）。
   鍵盤：標題是 button（Enter／空白鍵切換），aria-expanded 同步。⚠ 不用 alert／confirm／prompt。 */
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index').replace('.html', '');
  var SUM = { survey: '約 3–4 分鐘，只有今天這一次', intro: '十二種樣板，可以試玩，也有 Figma 稿', play2: '玩兩版，想四件事', talk: '和 AI 助教聊你的提案（佔 50%）', three: '存版本時填三格，聊完會自動預填',
    check: '交之前對照三點', stuck: '常見的卡住與解法', phone: '手機注意事項', overview: '要交什麼、期限、下週接什麼', next: '做完之後接哪一份' };
  var OPEN_DEFAULT = { survey: true };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 存不下也沒關係 */ } }
  function css() {
    if (document.getElementById('col-css')) return;
    var s = document.createElement('style'); s.id = 'col-css';
    s.textContent = '.col>h2{margin-bottom:0}.col>h2>.coltgl{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;width:100%;min-height:44px;margin:0;padding:6px 0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}'
      + '.col>h2>.coltgl::after{content:"▾";margin-left:auto;font-size:.8em;opacity:.7}.col.closed>h2>.coltgl::after{content:"▸"}.coltgl:focus-visible{outline:2px solid currentColor;outline-offset:2px}'
      + '.col>h2>.coltgl .colsum{display:none;flex-basis:100%;font-size:13.5px;font-weight:400;opacity:.8}.col.closed>h2>.coltgl .colsum{display:block}'
      + '.col .coldone{font-size:12.5px;font-weight:700;padding:1px 8px;border-radius:99px;border:1px solid currentColor}'
      + '.colbody[hidden]{display:none}.coltools{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.coltools button{min-height:40px;padding:4px 14px;border-radius:99px;border:1px solid var(--accent,#2f6690);background:transparent;color:var(--accent,#2f6690);font:inherit;font-size:14px;cursor:pointer}';
    document.head.appendChild(s);
  }
  var secs = [];
  function setOpen(sec, open, save) {
    var btn = sec.querySelector(':scope>h2>.coltgl'), body = sec.querySelector(':scope>.colbody');
    sec.classList.toggle('closed', !open); body.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (save) put('col_' + PAGE + '_' + sec.getAttribute('data-colid'), open ? '1' : '0');
  }
  function build() {
    css();
    var wrap = document.querySelector('.wrap'); if (!wrap) return;
    var all = Array.prototype.filter.call(wrap.children, function (e) { return e.tagName === 'SECTION'; }), idx = 0;
    all.forEach(function (sec) {
      var h2 = sec.querySelector(':scope>h2'); if (!h2 || sec.hidden || sec.id === 'steps') return;
      var kids = Array.prototype.filter.call(sec.children, function (e) { return e !== h2; });
      if (kids.length === 1 && kids[0].tagName === 'DETAILS') return;   // 本身就是可收合的 details
      idx++; var id = sec.id || ('sec' + idx);
      sec.setAttribute('data-colid', id); sec.classList.add('col');
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'coltgl';
      var title = document.createElement('span'); title.className = 'coltitle';
      while (h2.firstChild) title.appendChild(h2.firstChild);
      btn.appendChild(title);
      var sum = document.createElement('span'); sum.className = 'colsum';
      var t = SUM[id]; if (!t) { var p = sec.querySelector('.sub,p'); t = p ? p.textContent.replace(/\s+/g, ' ').trim().slice(0, 34) : ''; }
      sum.textContent = t; btn.appendChild(sum); h2.appendChild(btn);
      var body = document.createElement('div'); body.className = 'colbody'; kids.forEach(function (k) { body.appendChild(k); }); sec.appendChild(body);
      var saved = get('col_' + PAGE + '_' + id), open = saved === null ? !!OPEN_DEFAULT[id] : saved === '1';
      setOpen(sec, open, false);
      btn.addEventListener('click', function () { setOpen(sec, sec.classList.contains('closed'), true); });
      secs.push(sec);
    });
    // 頁首工具列
    var nav = document.querySelector('nav.tabs');
    if (nav && secs.length) {
      var bar = document.createElement('div'); bar.className = 'coltools'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '全部展開或收合');
      [['open', '全部展開'], ['close', '全部收合']].forEach(function (a) { var b = document.createElement('button'); b.type = 'button'; b.textContent = a[1]; b.onclick = function () { all_(a[0] === 'open'); }; bar.appendChild(b); });
      nav.parentNode.insertBefore(bar, nav);
    }
    watchSurvey(); hashOpen();
  }
  function all_(open) {
    secs.forEach(function (s) { setOpen(s, open, true); });
    document.querySelectorAll('details.stage').forEach(function (d) { d.open = open; });
  }
  function expand(el) {   // 目標所在的區塊與卡片都展開
    if (!el) return;
    var n = el;
    while (n && n !== document.body) {
      if (n.classList && n.classList.contains('col') && n.classList.contains('closed')) setOpen(n, true, true);
      if (n.tagName === 'DETAILS') n.open = true;
      n = n.parentElement;
    }
    if (el.classList && el.classList.contains('col') && el.classList.contains('closed')) setOpen(el, true, true);
  }
  window.COL_EXPAND = expand;
  function hashOpen() { if (location.hash.length > 1) { var el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) { expand(el); setTimeout(function () { el.scrollIntoView(); }, 50); } } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.classList.contains('ta-loc')) return;
    var id = a.getAttribute('href').slice(1); if (id) expand(document.getElementById(id));
  }, true);
  window.addEventListener('hashchange', hashOpen);
  // 問卷：送出（或選這次不填）出現完成卡之後自動收起，標題顯示「✓ 已完成」
  function watchSurvey() {
    var sec = document.getElementById('survey'); if (!sec || !sec.classList.contains('col')) return;
    function done() {
      if (sec.querySelector('.coldone')) return;
      var tt = sec.querySelector(':scope>h2>.coltgl>.coltitle'); if (tt) { var b = document.createElement('span'); b.className = 'coldone'; b.textContent = '✓ 已完成'; tt.appendChild(document.createTextNode(' ')); tt.appendChild(b); }
      var s = sec.querySelector(':scope>h2>.coltgl>.colsum'); if (s) s.textContent = '已完成；點開可以再看完成卡';
    }
    function check(auto) { if (sec.querySelector('#sy-done .card')) { var first = !sec.querySelector('.coldone'); done(); if (first) { if (auto) setTimeout(function () { setOpen(sec, false, true); }, 1500); else setOpen(sec, false, true); } } }
    check(false);
    var mount = document.getElementById('surveyMount') || sec;
    try { new MutationObserver(function () { check(true); }).observe(mount, { childList: true, subtree: true }); } catch (e) { /* 沒有也沒關係 */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
