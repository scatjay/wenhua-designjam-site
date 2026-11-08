/* 走讀遊戲：圖鑑畫面 WalkDexUI（圖鑑首頁、六類清單、人物卡、里程碑獎勵、稱號清單、小精靈冊）。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md 第 1、2 節；資料來自 WALK_DEX（js/walk_data_dex.js）。
   ES5 風格 IIFE，掛 window.WalkDexUI。狀態與領取一律透過 WalkStore（dex()／state()／claimMilestone()／intel()），
   像素圖用 WalkPix 畫在 canvas（整數放大、image-rendering: pixelated），不載入圖檔。
   手機優先：點擊區 ≥44px、字 ≥12px；色彩用 CSS 變數並支援深色（html.dk → .wd-dk）；沒有輪詢與 setInterval；
   沒有 alert／confirm／prompt；歷史錨點不出現，學生視角用語。
   mount(container, opts) 回傳 { unmount() }。
   opts（皆可省略）：
     store          WalkStore 實例（預設 window.WalkStore）
     onOpenSpirit(id)  點到已取得的小精靈
     onOpenRoom()      「回到房間」按鈕
     has(catId, itemId) → true／false／undefined   覆寫「是否已取得」的判斷（undefined＝用 state().dex.seen）
     onClaimed(pct, res)  領取成功後通知 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ 常數 */
  var RAR_FALLBACK = {
    '普通': { shape: 'circle', glyph: '●', label: '普通' },
    '稀有': { shape: 'diamond', glyph: '◆', label: '稀有' },
    '傳說': { shape: 'star', glyph: '★', label: '傳說' }
  };
  var ROUTE_NAME = { main: '正式主路線', campus: '校園白天路線', campusW: '夜間路線', tw: '中西區路線' };
  var CAT_ICON_FALLBACK = { people: '🧑', places: '📍', clue: '🗂️', looks: '🎭', roles: '🎖️', titles: '🏅' };
  var MS_PCTS = [25, 50, 75, 100];
  var REASON = {
    claimed: '這一份已經領過了。', locked: '還沒到這個完成度。', badpct: '找不到這一份獎勵。',
    nodata: '資料還沒載入。'
  };
  var FORM_FALLBACK = [{ id: 'care', icon: '🏠', name: '陪伴型', desc: '被照顧得很好。' }, { id: 'adv', icon: '🧭', name: '冒險型', desc: '常常跟著你出門。' }, { id: 'lore', icon: '📚', name: '學者型', desc: '常常陪你讀資料。' }];
  var NONE = '還沒遇到';
  var SIL_COLOR = '#4a4358';

  /* ------------------------------------------------------------------ 小工具 */
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function isObj(x) { return x !== null && typeof x === 'object' && !isArr(x); }
  function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); }
  function keys(o) { return isObj(o) ? Object.keys(o) : []; }
  function doc() { return root.document; }

  function el(tag, o) {
    var e = doc().createElement(tag), k;
    o = o || {};
    if (o.cls) e.className = o.cls;
    if (o.text !== undefined) e.textContent = o.text;
    if (o.type) e.setAttribute('type', o.type);
    if (o.attrs) for (k in o.attrs) if (Object.prototype.hasOwnProperty.call(o.attrs, k)) e.setAttribute(k, o.attrs[k]);
    return e;
  }
  function add(parent) {
    var i;
    for (i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function clear(node) { node.textContent = ''; }
  function addCls(n, c) { if ((' ' + n.className + ' ').indexOf(' ' + c + ' ') < 0) n.className = (n.className ? n.className + ' ' : '') + c; }
  function rmCls(n, c) { n.className = (' ' + n.className + ' ').split(' ' + c + ' ').join(' ').replace(/^\s+|\s+$/g, ''); }
  function isDark() {
    var d = doc(), re = /(^|\s)dk(\s|$)/;
    return re.test((d.documentElement && d.documentElement.className) || '') || re.test((d.body && d.body.className) || '');
  }

  var CSS = '.wd{--wd-bg:var(--card,#fffaf2);--wd-fg:var(--fg,#3b3350);--wd-mute:var(--mute,#6c6254);--wd-line:var(--line,#ddd2bd);--wd-acc:var(--acc,#b8402a);--wd-chip:var(--chip,#efe6d2);color:var(--wd-fg);font-size:14px;line-height:1.5}' +
    '.wd.wd-dk{--wd-bg:var(--card,#161d23);--wd-fg:var(--fg,#e8e4da);--wd-mute:var(--mute,#9aa6b0);--wd-line:var(--line,#2c3943);--wd-acc:var(--acc,#e0705a);--wd-chip:var(--chip,#26323b)}' +
    '.wd h2{margin:6px 0;font-size:18px}.wd h3{margin:0 0 6px;font-size:15px}' +
    '.wd-btn{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid var(--wd-line);border-radius:10px;background:var(--wd-bg);color:var(--wd-fg);font-size:14px;cursor:pointer;text-align:left}' +
    '.wd-btn:disabled{opacity:.55;cursor:default}.wd-btn.wd-go{border-color:var(--wd-acc);font-weight:700;background:var(--wd-chip)}' +
    '.wd-panel{border:1px solid var(--wd-line);border-radius:10px;background:var(--wd-bg);padding:10px 12px;margin:8px 0}' +
    '.wd-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:8px 0}' +
    '.wd-catbtn{display:block;width:100%}.wd-catbtn .wd-ico{font-size:22px;margin-right:6px}' +
    '.wd-bar{height:10px;border-radius:99px;background:var(--wd-chip);border:1px solid var(--wd-line);overflow:hidden;margin:6px 0 2px}' +
    '.wd-bar>div{height:100%;background:var(--wd-acc)}' +
    '.wd-note{font-size:12px;color:var(--wd-mute);margin:2px 0}.wd-msg{min-height:20px;font-size:13px;margin:6px 0;font-weight:700}' +
    '.wd-tile{display:block;width:100%;text-align:left;border:1px solid var(--wd-line);border-radius:10px;background:var(--wd-bg);color:var(--wd-fg);padding:8px;min-height:64px;font-size:13px}' +
    'button.wd-tile{min-height:64px;cursor:pointer}' +
    '.wd-pic{width:48px;height:48px;image-rendering:pixelated;border-radius:8px;object-fit:cover;display:block;margin:0 auto}' +
    '.wd-tile .wd-ico{display:block;font-size:26px;line-height:1.2}.wd-sil .wd-ico{filter:brightness(0);opacity:.55}' +
    '.wd-sil{background:var(--wd-chip)}.wd-px{image-rendering:pixelated;image-rendering:crisp-edges;display:block;margin-bottom:4px}' +
    '.wd-rar{display:inline-block;font-size:12px;padding:1px 8px;border-radius:99px;background:var(--wd-chip);margin:2px 0}' +
    '.wd-hint{font-size:12px;color:var(--wd-mute)}.wd-row{display:flex;gap:8px;margin:4px 0}.wd-row>b{min-width:5.5em}' +
    '.wd-done{font-weight:700;color:var(--wd-acc)}';
  var cssNode = null, cssRef = 0;
  function ensureCss() {
    if (cssRef++ > 0) return;
    var d = doc();
    cssNode = d.createElement('style');
    cssNode.textContent = CSS;
    (d.head || d.documentElement).appendChild(cssNode);
  }
  function releaseCss() {
    if (--cssRef > 0) return;
    cssRef = 0;
    if (cssNode && cssNode.parentNode) cssNode.parentNode.removeChild(cssNode);
    cssNode = null;
  }

  /* ------------------------------------------------------------------ 像素圖 */
  function silPal(sp) {
    var pal = {}, rows = (root.WalkPix && root.WalkPix.rows) ? root.WalkPix.rows(sp.rows) : (sp.rows || []), i, j, ch;
    for (i = 0; i < rows.length; i++) for (j = 0; j < rows[i].length; j++) { ch = rows[i].charAt(j); if (ch !== '.' && ch !== ' ') pal[ch] = SIL_COLOR; }
    return pal;
  }
  function pixCanvas(sp, scale, sil, label) {
    var P = root.WalkPix, cv, sc = scale || 3;
    if (!sp || !sp.rows || !P || typeof P.toCanvas !== 'function') return null;
    cv = P.toCanvas(sp.rows, sil ? silPal(sp) : sp.pal, sc);
    if (!cv) return null;
    cv.className = 'wd-px' + (sil ? ' wd-pxsil' : '');
    cv.style.width = ((sp.w || 16) * sc) + 'px';
    cv.style.height = ((sp.h || 16) * sc) + 'px';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', sil ? '還沒取得（剪影）' : (label || ''));
    return cv;
  }

  /* ------------------------------------------------------------------ 資料 */
  function dexDef() { var d = root.WALK_DEX; return isObj(d) ? d : {}; }
  function categories() { var d = dexDef(); return isArr(d.categories) ? d.categories : (isArr(d.cats) ? d.cats : []); }
  function catById(id) { var a = categories(), i; for (i = 0; i < a.length; i++) if (a[i] && a[i].id === id) return a[i]; return null; }
  function rarOf(r) {
    var d = dexDef().rarity;
    return (isObj(d) && d[r]) || RAR_FALLBACK[r] || RAR_FALLBACK['普通'];
  }
  function spiritList() {
    var d = root.WALK_SPIRITS;
    if (isObj(d) && isArr(d.list)) d = d.list;
    return isArr(d) ? d.filter(isObj) : [];
  }
  function spiritById(id) { var a = spiritList(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function intelAll() {
    var d = root.WALK_INTEL, out = [], k;
    if (isObj(d) && isArr(d.cards)) d = d.cards;
    if (isArr(d)) return d.filter(function (c) { return isObj(c) && c.id !== undefined; });
    if (isObj(d)) {
      for (k in d) if (Object.prototype.hasOwnProperty.call(d, k) && isArr(d[k])) d[k].forEach(function (c) { if (isObj(c) && c.id !== undefined) out.push(c.chapter === undefined ? { id: c.id, chapter: k, type: c.type, text: c.text, source: c.source, level: c.level, rarity: c.rarity } : c); });
    }
    return out;
  }
  function shopLookup(id) {
    var d = root.WALK_SHOP, k, arr, i;
    if (!isObj(d)) return null;
    for (k in d) {
      arr = d[k];
      if (!isArr(arr)) continue;
      for (i = 0; i < arr.length; i++) if (isObj(arr[i]) && arr[i].id === id) return arr[i];
    }
    return null;
  }
  function routeStopName(route, stop) {
    var R = root.WALK_ROUTE, r = isObj(R) ? R[route] : null, i, cat, it;
    if (r && isArr(r.stops)) for (i = 0; i < r.stops.length; i++) if (r.stops[i] && r.stops[i].id === stop && r.stops[i].name) return r.stops[i].name;
    cat = catById('places');
    if (cat && isArr(cat.items)) for (i = 0; i < cat.items.length; i++) { it = cat.items[i]; if (it.route === route && it.stop === stop) return it.name; }
    return null;
  }
  function milestoneDef(pct) {
    var a = dexDef().milestones, i;
    if (isArr(a)) for (i = 0; i < a.length; i++) if (a[i] && a[i].pct === pct) return a[i];
    return null;
  }
  function formDefs() {
    var F = root.WALK_FORMS;
    if (isObj(F) && isArr(F.list)) F = F.list;
    return isArr(F) && F.length ? F.filter(isObj) : FORM_FALLBACK;
  }
  function formItems() {
    var out = [];
    spiritList().forEach(function (sp) { formDefs().forEach(function (f) { out.push({ id: sp.id + ':' + f.id, spirit: sp, form: f }); }); });
    return out;
  }
  function firstSentence(t) { t = String(t || ''); var i = t.indexOf('。'); return i >= 0 ? t.slice(0, i + 1) : t; }
  function titleName(id) { var c = catById('titles'), i; if (c && isArr(c.items)) for (i = 0; i < c.items.length; i++) if (c.items[i].id === id) return c.items[i].name; return id; }
  function lookName(skin) { var c = catById('looks'), i; if (c && isArr(c.items)) for (i = 0; i < c.items.length; i++) if (c.items[i].skin === skin) return c.items[i].name; return skin; }
  function rewardText(reward) {
    var parts = [], it;
    if (!isObj(reward)) return '';
    if (reward.points) parts.push('點數 +' + reward.points);
    if (reward.title) parts.push('稱號「' + titleName(reward.title) + '」');
    if (reward.look) parts.push('造型「' + lookName(reward.look) + '」');
    keys(reward.items).forEach(function (k) { it = shopLookup(k); parts.push('「' + (it ? it.name : k) + '」×' + num(reward.items[k], 1)); });
    if (reward.egg) { it = spiritById(reward.egg); parts.push('小精靈蛋「' + (it ? it.name : reward.egg) + '」'); }
    return parts.join('、');
  }

  /* 取得提示（學生視角，不放歷史細節） */
  function hintFor(catId, item) {
    var d = dexDef(), i, ms, sp;
    if (catId === 'people') return '走完「' + (ROUTE_NAME[item.route] || '某條路線') + '」，就會遇到這位。';
    if (catId === 'places') return '走到「' + (ROUTE_NAME[item.route] || '某條路線') + '」的路上，會經過這裡。';
    if (catId === 'clue') return '派小精靈去勘察，或走到對應章節就會拿到。';
    if (catId === 'looks') {
      ms = isArr(d.milestones) ? d.milestones : [];
      for (i = 0; i < ms.length; i++) if (ms[i].reward && ms[i].reward.look === item.skin) return '圖鑑完成度達 ' + ms[i].pct + '%，到里程碑領取。';
      return '到商店的造型屋買。';
    }
    if (catId === 'roles') return '在隊伍裡當過這個職務，就會記進來。';
    if (catId === 'titles') return item.desc || '達成條件就會拿到。';
    if (catId === 'forms') return '讓「' + item.spirit.name + '」長到成體，' + firstSentence(item.form.desc).replace(/。$/, '') + '，就會分化成這個形態。';
    if (catId === 'spirit') {
      sp = item;
      if (isObj(d.spiritBook) && isObj(d.spiritBook.unlock) && d.spiritBook.unlock[sp.id] !== undefined) return '圖鑑完成度達 ' + d.spiritBook.unlock[sp.id] + '% 以後才會出現。';
      return '完成章節會掉蛋，孵出來就記進來。';
    }
    return '多走一走就會找到。';
  }

  /* ------------------------------------------------------------------ mount */
  function mount(container, opts) {
    opts = opts || {};
    var store = opts.store || root.WalkStore;
    var rootEl = el('div', { cls: 'wd' });
    var view = { name: 'home', cat: null, id: null };
    var msg = '';
    var dead = false;
    var S, DX;
    var newTitles = [];

    ensureCss();
    container.appendChild(rootEl);
    function onStore() { if (!dead) render(); }
    if (store && typeof store.on === 'function') store.on(onStore);

    /* ---- 是否已取得 */
    function got(catId, itemId) {
      var r, seen, k;
      if (typeof opts.has === 'function') { r = opts.has(catId, itemId); if (r !== undefined) return !!r; }
      if (catId === 'clue') {
        for (k in (S.intel || {})) if (S.intel[k] && S.intel[k][itemId]) return true;
        return false;
      }
      if (catId === 'forms') {
        seen = S.dex && S.dex.seen && S.dex.seen.form;
        return !!(seen && seen[itemId]);
      }
      if (catId === 'spirit') {
        seen = S.dex && S.dex.seen && S.dex.seen.spirit;
        if (seen && seen[itemId]) return true;
        if ((S.spirit.owned || []).some(function (o) { return o.id === itemId; })) return true;
        return (S.spirit.released || []).indexOf(itemId) >= 0;
      }
      seen = S.dex && S.dex.seen ? S.dex.seen[catId] : null;
      return !!(seen && seen[itemId]);
    }
    function catItems(catId) {
      var c;
      if (catId === 'clue') return intelAll();
      if (catId === 'spirit') return spiritList();
      if (catId === 'forms') return formItems();
      c = catById(catId);
      return c && isArr(c.items) ? c.items : [];
    }
    function stat(catId) {
      var i, c, have = 0, items;
      if (catId === 'forms') return { have: DX.forms ? DX.forms.have : 0, total: DX.forms ? DX.forms.total : formItems().length };
      if (catId === 'spirit') {
        items = spiritList();
        items.forEach(function (s) { if (got('spirit', s.id)) have++; });
        return { have: have, total: isObj(dexDef().spiritBook) ? num(dexDef().spiritBook.total, items.length) : items.length };
      }
      for (i = 0; i < DX.cats.length; i++) if (DX.cats[i].id === catId) return { have: DX.cats[i].have, total: DX.cats[i].total };
      c = catById(catId);
      items = catItems(catId);
      items.forEach(function (it) { if (got(catId, it.id)) have++; });
      return { have: have, total: num(c && c.total, items.length) };
    }
    function pctOf(s) { return s.total > 0 ? Math.floor(100 * s.have / s.total) : 0; }
    function totalText(catId, s) {
      var c = catById(catId);
      if (!s.total && c && c.approxTotal) return s.have + '／約 ' + c.approxTotal;
      return s.have + '／' + s.total;
    }
    function bar(pct) {
      var b = el('div', { cls: 'wd-bar', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) } });
      var inner = el('div');
      inner.style.width = pct + '%';
      b.setAttribute('data-pct', String(pct));
      return add(b, inner);
    }
    function rarChip(r) {
      var d = rarOf(r);
      var s = el('span', { cls: 'wd-rar wd-rar-' + d.shape, text: d.glyph + ' ' + d.label, attrs: { 'data-shape': d.shape, 'aria-label': '稀有度：' + d.label } });
      return s;
    }
    function btn(label, cls, fn) {
      var b = el('button', { cls: 'wd-btn' + (cls ? ' ' + cls : ''), type: 'button', text: label });
      if (fn) b.addEventListener('click', fn);
      return b;
    }
    function go(v, cat, id) { view = { name: v, cat: cat || null, id: id || null }; msg = ''; render(); }

    /* ---- 首頁 */
    function renderHome() {
      var top, cats = categories(), grid, ms;
      top = el('div', { cls: 'wd-panel' });
      add(top, el('h2', { text: '📖 我的圖鑑' }));
      add(top, el('div', { cls: 'wd-total', text: '已收集 ' + DX.have + '／' + DX.total + '（' + DX.pct + '%）' }));
      add(top, bar(DX.pct));
      add(top, el('div', { cls: 'wd-note', text: '六類收集合起來算完成度；小精靈冊另外記。' }));
      if (typeof opts.onOpenRoom === 'function') add(top, btn('🏠 回到房間', '', function () { opts.onOpenRoom(); }));
      add(rootEl, top);

      grid = el('div', { cls: 'wd-grid' });
      cats.forEach(function (c) {
        var s = stat(c.id), b;
        b = btn('', 'wd-catbtn', function () { go('list', c.id); });
        b.setAttribute('data-cat', c.id);
        add(b, el('span', { cls: 'wd-ico', text: c.icon || CAT_ICON_FALLBACK[c.id] || '📘' }));
        add(b, el('b', { text: c.name }));
        add(b, el('div', { cls: 'wd-count', text: totalText(c.id, s) }));
        add(b, bar(pctOf(s)));
        add(grid, b);
      });
      (function () {
        var s = stat('spirit'), b = btn('', 'wd-catbtn', function () { go('list', 'spirit'); });
        b.setAttribute('data-cat', 'spirit');
        add(b, el('span', { cls: 'wd-ico', text: '🧚' }));
        add(b, el('b', { text: '小精靈冊' }));
        add(b, el('div', { cls: 'wd-count', text: totalText('spirit', s) }));
        add(b, bar(pctOf(s)));
        add(grid, b);
      })();
      (function () {
        var s = stat('forms'), b = btn('', 'wd-catbtn', function () { go('list', 'forms'); });
        b.setAttribute('data-cat', 'forms');
        add(b, el('span', { cls: 'wd-ico', text: '🏠🧭📚' }));
        add(b, el('b', { text: '小精靈形態' }));
        add(b, el('div', { cls: 'wd-count', text: totalText('forms', s) }));
        add(b, bar(pctOf(s)));
        add(grid, b);
      })();
      add(rootEl, grid);
      if (DX.spiritBook) add(rootEl, el('div', { cls: 'wd-note wd-book', text: '小精靈圖鑑合計：' + DX.spiritBook.have + '／' + DX.spiritBook.total + '（' + DX.spiritBook.pct + '%）＝小精靈 16 隻加上每隻 3 種形態。' }));

      ms = el('div', { cls: 'wd-panel wd-ms' });
      add(ms, el('h3', { text: '🎁 里程碑獎勵' }));
      add(ms, el('div', { cls: 'wd-msg', text: msg, attrs: { 'aria-live': 'polite' } }));
      MS_PCTS.forEach(function (p) {
        var d = milestoneDef(p), st = DX.milestones[p] || 'locked', row, b, txt = d ? rewardText(d.reward) : '';
        row = el('div', { cls: 'wd-panel wd-msrow', attrs: { 'data-pct': String(p), 'data-state': st } });
        add(row, el('b', { text: '完成度 ' + p + '%' }));
        add(row, el('div', { cls: 'wd-note wd-reward', text: (st === 'claimed' ? '領到：' : '可以領：') + (txt || '（獎勵資料還沒載入）') }));
        if (st === 'claimed') add(row, el('div', { cls: 'wd-done', text: '✓ 已領取' }));
        else if (st === 'ready') {
          b = btn('領取獎勵', 'wd-go', function () { claim(p); });
          b.setAttribute('data-act', 'claim');
          add(row, b);
        } else {
          b = btn('還差 ' + (p - DX.pct) + '%', '', function () { });
          b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
          add(row, b);
        }
        add(ms, row);
      });
      add(rootEl, ms);
    }

    function claim(pct) {
      var cur, res, d;
      if (!store || typeof store.claimMilestone !== 'function') return;
      cur = store.dex().milestones[pct];
      if (cur !== 'ready') { msg = cur === 'claimed' ? REASON.claimed : REASON.locked; render(); return; }
      res = store.claimMilestone(pct);
      if (res && res.ok) {
        d = milestoneDef(pct);
        msg = '領到了！' + rewardText((res.reward && isObj(res.reward)) ? res.reward : (d ? d.reward : null));
        if (typeof opts.onClaimed === 'function') { try { opts.onClaimed(pct, res); } catch (e) { /* 忽略 */ } }
      } else {
        msg = REASON[res && res.reason] || '現在領不了，晚點再試。';
      }
      render();
    }

    /* 11-08 美術接線：人物有品檢過的像素頭像（art/ship）就用圖，沒有就維持 emoji */
    function npcPic(item) { var o = (root.WALK_ASSETS || {}).npcs_by_stop || {}, n = item && o[item.stop]; return (n && n.file && n.status === 'pass') ? n.file : ''; }

    /* ---- 清單 */
    function tile(catId, item, interactive, onClick) {
      var has = got(catId, item.id), t, ico, sp, cv, name, hintTxt;
      t = el(interactive ? 'button' : 'div', { cls: 'wd-tile' + (has ? ' wd-got' : ' wd-sil'), type: interactive ? 'button' : undefined, attrs: { 'data-id': item.id, 'data-got': has ? '1' : '0' } });
      if (interactive && onClick) t.addEventListener('click', onClick);
      if (catId === 'spirit') {
        sp = item.stages && (item.stages.adult || item.stages.baby || item.stages.awake);
        cv = pixCanvas(sp && sp.sprite, 3, !has, item.name);
        if (cv) add(t, cv); else add(t, el('span', { cls: 'wd-ico', text: '🧚', attrs: { 'aria-hidden': 'true' } }));
        name = has ? item.name + (item.nick ? '（' + item.nick + '）' : '') : '？？？';
      } else if (catId === 'forms') {
        sp = item.spirit.stages && (item.spirit.stages.adult || item.spirit.stages.baby);
        cv = pixCanvas(sp && sp.sprite, 3, !has, item.spirit.name);
        if (cv) add(t, cv); else add(t, el('span', { cls: 'wd-ico', text: item.form.icon || '🧚', attrs: { 'aria-hidden': 'true' } }));
        name = has ? (item.form.icon || '') + ' ' + item.spirit.name + '・' + item.form.name : '？？？';
      } else if (catId === 'clue') {
        add(t, el('span', { cls: 'wd-ico', text: '🗂️', attrs: { 'aria-hidden': 'true' } }));
        name = has ? ((item.type ? item.type + '：' : '') + (item.text || '')) : '？？？';
      } else {
        ico = catId === 'people' ? item.ava : (catId === 'looks' ? item.emoji : null);
        if (catId === 'people' && npcPic(item)) add(t, el('img', { cls: 'wd-ico wd-pic', attrs: { src: npcPic(item), alt: '', loading: 'lazy', decoding: 'async' } }));
        else add(t, el('span', { cls: 'wd-ico', text: ico || (catById(catId) && catById(catId).icon) || CAT_ICON_FALLBACK[catId] || '📘', attrs: { 'aria-hidden': 'true' } }));
        name = (has || catId === 'titles') ? (item.name || item.role || '') : '？？？';   /* 稱號是目標清單，名字一直看得到 */
      }
      add(t, el('b', { cls: 'wd-name', text: name }));
      if (item.rarity) add(t, rarChip(item.rarity));
      if (catId === 'titles') add(t, el('div', { cls: 'wd-hint', text: has ? item.desc : '怎麼拿：' + item.desc }));
      else if (has) {
        if (catId === 'clue') add(t, el('div', { cls: 'wd-hint', text: '出處：' + (item.source || '（未標）') + (item.level ? '・' + item.level : '') }));
        else add(t, el('div', { cls: 'wd-hint', text: '已取得 ✓' }));
      } else add(t, el('div', { cls: 'wd-hint', text: '怎麼拿：' + hintFor(catId, item) }));
      return t;
    }

    function renderList() {
      var catId = view.cat, c = catById(catId), s = stat(catId), items = catItems(catId), head, grid, title;
      title = catId === 'spirit' ? '小精靈冊' : (catId === 'forms' ? '小精靈形態' : (c ? c.name : catId));
      head = el('div', { cls: 'wd-panel' });
      add(head, btn('← 回圖鑑首頁', '', function () { go('home'); }));
      add(head, el('h2', { text: ((c && c.icon) || (catId === 'spirit' || catId === 'forms' ? '🧚' : '')) + ' ' + title }));
      add(head, el('div', { cls: 'wd-total', text: totalText(catId, s) }));
      add(head, bar(pctOf(s)));
      if (catId === 'forms') add(head, el('div', { cls: 'wd-note', text: '陪伴型 🏠、冒險型 🧭、學者型 📚：小精靈長到成體時，依你怎麼照顧牠而分化。' }));
      if (catId === 'titles') add(head, el('div', { cls: 'wd-note', text: '三足鼎立：同時養 3 隻小精靈，時期、屬性、專長都不一樣，只給稱號。' }));
      add(rootEl, head);
      grid = el('div', { cls: 'wd-grid wd-list', attrs: { 'data-cat': catId } });
      items.forEach(function (it) {
        var interactive = false, fn = null;
        if (catId === 'people') { interactive = true; fn = function () { go('card', 'people', it.id); }; }
        else if (catId === 'spirit' && typeof opts.onOpenSpirit === 'function' && got('spirit', it.id)) { interactive = true; fn = function () { opts.onOpenSpirit(it.id); }; }
        add(grid, tile(catId, it, interactive, fn));
      });
      if (!items.length) add(grid, el('div', { cls: 'wd-note', text: '這一類的資料還沒載入。' }));
      add(rootEl, grid);
    }

    /* ---- 人物卡 */
    function renderCard() {
      var items = catItems('people'), it = null, i, has, panel, blurb, ty, name, ico;
      for (i = 0; i < items.length; i++) if (items[i].id === view.id) it = items[i];
      if (!it) { go('list', 'people'); return; }
      has = got('people', it.id);
      name = has ? it.name : '？？？';
      blurb = has && typeof root.WALK_NPC_BLURB === 'function' ? root.WALK_NPC_BLURB(it.name) : null;
      ty = has && typeof root.WALK_NPC_TYPE === 'function' ? root.WALK_NPC_TYPE(it.name) : null;
      panel = el('div', { cls: 'wd-panel wd-card', attrs: { 'data-id': it.id, 'data-got': has ? '1' : '0' } });
      add(panel, btn('← 回人物清單', '', function () { go('list', 'people'); }));
      ico = npcPic(it) ? el('img', { cls: 'wd-ico wd-pic' + (has ? '' : ' wd-sil'), attrs: { src: npcPic(it), alt: '', decoding: 'async' } }) : el('span', { cls: 'wd-ico' + (has ? '' : ' wd-sil'), text: it.ava || '🧑', attrs: { 'aria-hidden': 'true' } });
      ico.style.fontSize = '40px';
      if (npcPic(it)) { ico.style.width = '72px'; ico.style.height = '72px'; }
      add(panel, ico);
      add(panel, el('h2', { text: name }));
      add(panel, rarChip(it.rarity || '普通'));
      function row(label, val) {
        var r = el('div', { cls: 'wd-row', attrs: { 'data-field': label } });
        add(r, el('b', { text: label }));
        add(r, el('span', { text: val }));
        add(panel, r);
      }
      row('名字', name);
      row('類型', has ? ((ty && ty.q && ty.q.short) || (blurb && isArr(blurb.tag) ? blurb.tag.join('・') : '路上的人')) : NONE);
      row('問法提示', has ? ((ty && ty.open) || (blurb && blurb.how) || '先打招呼，再問他做過的一件事。') : NONE);
      row('出現的站', has ? ((routeStopName(it.route, it.stop) || it.stop) + '（' + (ROUTE_NAME[it.route] || '') + '）') : NONE);
      row('他的故事', has ? ((blurb && blurb.story) || '（資料還沒補上）') : NONE);
      if (!has) add(panel, el('div', { cls: 'wd-hint', text: '怎麼拿：' + hintFor('people', it) }));
      add(rootEl, panel);
    }

    function render() {
      if (dead) return;
      S = store.state();
      DX = store.dex();
      if (typeof store.takeNewTitles === 'function') { try { (store.takeNewTitles() || []).forEach(function (id) { if (newTitles.indexOf(id) < 0) newTitles.push(id); }); } catch (e) { /* 忽略 */ } }
      clear(rootEl);
      if (isDark()) addCls(rootEl, 'wd-dk'); else rmCls(rootEl, 'wd-dk');
      if (newTitles.length && view.name === 'home') {
        (function () {
          var ban = el('div', { cls: 'wd-panel wd-newtitle', attrs: { role: 'status' } });
          add(ban, el('b', { text: '🎉 剛得到新稱號：' + newTitles.map(titleName).join('、') }));
          add(ban, btn('知道了', '', function () { newTitles = []; render(); }));
          add(rootEl, ban);
        })();
      }
      if (view.name === 'list') renderList();
      else if (view.name === 'card') renderCard();
      else renderHome();
    }

    if (!store || typeof store.state !== 'function') {
      add(rootEl, el('div', { cls: 'wd-note', text: '圖鑑還沒準備好，稍後再開。' }));
    } else {
      render();
    }

    return {
      unmount: function () {
        if (dead) return;
        dead = true;
        if (store && typeof store.off === 'function') store.off(onStore);
        if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
        releaseCss();
      },
      refresh: function () { if (!dead && store && typeof store.state === 'function') render(); }
    };
  }

  var WalkDexUI = {
    VERSION: 1,
    mount: mount,
    _logic: { hintFor: hintFor, rewardText: rewardText, rarOf: rarOf, routeStopName: routeStopName, intelAll: intelAll }
  };
  root.WalkDexUI = WalkDexUI;
  if (typeof module !== 'undefined' && module.exports) module.exports = WalkDexUI;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
