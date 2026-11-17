/* AI 助教浮動面板（學習單與十二個樣板共用的同一套外觀與開關互動；做法對齊大同工作坊學習單 sheet.html：#ta-fab／#ta-panel）。
   右下角實心膠囊鈕「問AI助教」（手機寬縮成圓鈕「助教」，有未讀徽章），展開面板 min(400px,100vw-32px)、最高 78vh：標題＋目前位置＋×、
   鎖住提示（尚未綁定編號）、暫停提示（助教沒回）、內容區 #ta-body。內容由各頁自己放（學習單＝助教討論；樣板＝助教提示），這支只管外框與互動。
   顏色：--accent（學習單，每週主色）→ --ct-accent（樣板）→ 預設。⚠ 不用 alert／confirm／prompt；文字一律 textContent。
   用法：var D = TA_DOCK.create({ onFab: function () {…} })；D.body 放內容；D.open(true)／D.setCtx('第 3 步')／D.setLock('訊息')／D.setPause(true)／D.setBadge(true)。
   助教回答裡的 [[id|文字]]：TA_DOCK.linkify(節點, 文字) 會把頁面上真的有的 id 變成位置連結，點了展開、捲到、高亮。 */
(function (root) {
  if (root.TA_DOCK) return;
  var D = null;
  function $(id) { return document.getElementById(id); }
  function css() {
    if ($('ta-dock-css')) return;
    var s = document.createElement('style'); s.id = 'ta-dock-css';
    s.textContent = ':root{--ta-ac:var(--accent,var(--ct-accent,#b5462f));--ta-on:var(--onbrand,var(--ct-on-accent,#fff));--ta-sf:var(--surface,var(--ct-panel,#fff));--ta-ink:var(--ink,var(--ct-ink,#2b2420));--ta-hair:var(--hair,var(--ct-line,#d9cbbd));--ta-soft:var(--accent-soft,var(--ct-soft,#f6ece0));--ta-mut:var(--muted,var(--ct-muted,#6f645c))}'
      + '#ta-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:60;font:inherit;font-weight:700;font-size:14px;color:var(--ta-on);background:var(--ta-ac);border:0;border-radius:99px;padding:11px 18px;min-height:44px;box-shadow:0 4px 14px rgba(0,0,0,.22);cursor:pointer}'
      + '#ta-fab .fs{display:none}#ta-fab:focus-visible,#ta-panel button:focus-visible,#ta-panel textarea:focus-visible,.askbtn:focus-visible{outline:2px solid var(--ta-ink);outline-offset:2px}'
      + '#ta-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#d33;color:#fff;font-size:11px;line-height:18px;text-align:center}#ta-badge[hidden]{display:none}'
      + '#ta-panel{position:fixed;right:16px;bottom:calc(68px + env(safe-area-inset-bottom,0px));z-index:61;width:min(400px,calc(100vw - 32px));max-height:min(78vh,640px);display:none;flex-direction:column;background:var(--ta-sf);color:var(--ta-ink);border:1px solid var(--ta-hair);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.28);overflow:hidden}'
      + '#ta-panel.open{display:flex}#ta-panel header{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--ta-ac);color:var(--ta-on)}#ta-panel header b{font-size:15px}#ta-panel header .ctx{flex:1;font-size:12.5px;opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '#ta-panel header button{min-height:36px;min-width:36px;border:0;border-radius:8px;background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer}'
      + '#ta-lockmsg,#ta-pause{margin:0;padding:8px 14px;font-size:13px;color:var(--ta-ink)}#ta-lockmsg{background:var(--ta-soft)}#ta-pause{background:#fdecc8}#ta-lockmsg[hidden],#ta-pause[hidden]{display:none}'
      + '#ta-body{overflow:auto;padding:10px 12px 12px;flex:1;min-height:0}'
      + '.askbtn{font:inherit;font-size:12.5px;font-weight:600;color:var(--ta-ac);background:var(--ta-soft);border:1px solid var(--ta-ac);border-radius:99px;padding:3px 11px;min-height:32px;cursor:pointer;margin:0 0 8px}'
      + 'a.ta-loc{color:var(--ta-ac);font-weight:700;text-decoration:underline;cursor:pointer}.ta-hl{outline:3px solid var(--ta-ac);outline-offset:3px;transition:outline-color .4s}'
      + '@media(max-width:700px){#ta-fab{right:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:52px;height:52px;padding:0;border-radius:50%;font-size:12.5px;line-height:1;display:flex;align-items:center;justify-content:center;white-space:nowrap}#ta-fab .fl{display:none}#ta-fab .fs{display:inline}#ta-panel{right:10px;width:min(400px,calc(100vw - 20px));bottom:calc(72px + env(safe-area-inset-bottom,0px));max-height:70vh}}';
    document.head.appendChild(s);
  }
  function create(o) {
    if (D) return D;
    o = o || {}; css();
    var fab = document.createElement('button'); fab.id = 'ta-fab'; fab.type = 'button'; fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'ta-panel'); fab.setAttribute('aria-label', '問AI助教');
    var fl = document.createElement('span'); fl.className = 'fl'; fl.textContent = '問AI助教'; var fs = document.createElement('span'); fs.className = 'fs'; fs.textContent = '助教';
    var bd = document.createElement('span'); bd.id = 'ta-badge'; bd.hidden = true; bd.setAttribute('aria-hidden', 'true'); bd.textContent = '1';
    fab.appendChild(fl); fab.appendChild(fs); fab.appendChild(bd);
    var p = document.createElement('div'); p.id = 'ta-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'AI助教');
    var hd = document.createElement('header'), t = document.createElement('b'), cx = document.createElement('span'), x = document.createElement('button');
    t.textContent = 'AI助教'; cx.className = 'ctx'; cx.id = 'ta-ctx'; x.id = 'ta-x'; x.type = 'button'; x.setAttribute('aria-label', '關閉AI助教'); x.textContent = '×';
    hd.appendChild(t); hd.appendChild(cx); hd.appendChild(x);
    var lock = document.createElement('p'); lock.id = 'ta-lockmsg'; lock.hidden = true;
    var pause = document.createElement('p'); pause.id = 'ta-pause'; pause.hidden = true; pause.setAttribute('role', 'status'); pause.textContent = '助教暫停中，請先看影片或舉手。你寫的字還在框裡，過一下再按送出。';
    var body = document.createElement('div'); body.id = 'ta-body';
    p.appendChild(hd); p.appendChild(lock); p.appendChild(pause); p.appendChild(body);
    document.body.appendChild(fab); document.body.appendChild(p);
    D = {
      fab: fab, panel: p, body: body,
      open: function (b) { p.classList.toggle('open', !!b); fab.setAttribute('aria-expanded', b ? 'true' : 'false'); if (b) { D.setBadge(false); if (D.onOpen) D.onOpen(); } },
      isOpen: function () { return p.classList.contains('open'); },
      setCtx: function (s) { cx.textContent = s || ''; },
      setLock: function (m) { lock.hidden = !m; lock.textContent = m || ''; p.classList.toggle('locked', !!m); },
      setPause: function (b) { pause.hidden = !b; },
      setBadge: function (b) { bd.hidden = !b; },
      onOpen: null
    };
    fab.addEventListener('click', function () { if (o.onFab) o.onFab(D); else D.open(!D.isOpen()); });
    x.addEventListener('click', function () { D.open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') D.open(false); });
    return D;
  }
  /* ---- 位置連結：[[id|文字]]，id 在頁面上真的有才變成連結 ---- */
  var LINKRE = /\[\[([A-Za-z0-9_-]{1,24})\|([^\[\]|\n]{1,40})\]\]/g;
  function linkOk(id) { var e = document.getElementById(id); return !!(e && (e.tagName === 'SECTION' || (e.tagName === 'DETAILS') || e.classList.contains('stage'))); }
  function goTo(id) {
    var el = document.getElementById(id); if (!el) return;
    var d = el.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    if (el.tagName === 'DETAILS') el.open = true;
    if (window.matchMedia('(max-width:700px)').matches && D) D.open(false);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('ta-hl'); setTimeout(function () { el.classList.remove('ta-hl'); }, 2200);
  }
  function linkify(node, text) {
    node.textContent = ''; var last = 0, m; text = String(text || ''); LINKRE.lastIndex = 0;
    while ((m = LINKRE.exec(text))) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (linkOk(m[1])) { var a = document.createElement('a'); a.className = 'ta-loc'; a.href = '#' + m[1]; a.textContent = m[2]; (function (id) { a.addEventListener('click', function (e) { e.preventDefault(); goTo(id); }); })(m[1]); node.appendChild(a); }
      else node.appendChild(document.createTextNode(m[2]));
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
  }
  root.TA_DOCK = { create: create, linkify: linkify, goTo: goTo, get: function () { return D; } };
})(typeof window !== 'undefined' ? window : this);
