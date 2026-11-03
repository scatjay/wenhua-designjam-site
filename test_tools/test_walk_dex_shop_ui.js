/* WalkDexUI／WalkShopUI 的單元測試：node test_tools/test_walk_dex_shop_ui.js
   不用瀏覽器、不裝套件：自己做最小的假 DOM／canvas／計時器；用真實的資料檔（WALK_DEX／WALK_SHOP／WALK_SPIRITS）與 WalkStore（localStorage 模式）。
   印出每項 PASS/FAIL 與總數，全過退出碼 0。 */
'use strict';
var fs = require('fs');
var path = require('path');

global.window = global;

/* ================================================================== 假 DOM */
var nodeCount = 0;
function FNode(tag) {
  this.tag = tag; this.children = []; this.parentNode = null; this.attrs = {}; this.style = {}; this.className = '';
  this._text = ''; this.listeners = {}; this.disabled = false; this.width = 0; this.height = 0; nodeCount++;
}
FNode.prototype.appendChild = function (c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; };
FNode.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; } return c; };
Object.defineProperty(FNode.prototype, 'textContent', {
  get: function () { return this._text + this.children.map(function (c) { return c.textContent; }).join(''); },
  set: function (v) { this.children.forEach(function (c) { c.parentNode = null; }); this.children = []; this._text = String(v); }
});
FNode.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
FNode.prototype.getAttribute = function (k) { return this.attrs[k] === undefined ? null : this.attrs[k]; };
FNode.prototype.addEventListener = function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); };
FNode.prototype.removeEventListener = function (t, fn) { var a = this.listeners[t] || [], i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
FNode.prototype.getContext = function () {
  if (!this._ctx) {
    var calls = { n: 0, fills: [] };
    this._ctx = new Proxy({ _calls: calls, fillRect: function () { calls.n++; calls.fills.push(this.fillStyle); } }, {
      get: function (t, k) { if (k in t) return t[k]; return function () { calls.n++; }; },
      set: function (t, k, v) { t[k] = v; return true; }
    });
  }
  return this._ctx;
};
function walk(node, fn) { fn(node); node.children.forEach(function (c) { walk(c, fn); }); }
function findAll(r, pred) { var out = []; walk(r, function (n) { if (pred(n)) out.push(n); }); return out; }
function byAttr(r, k, v) { return findAll(r, function (n) { return n.attrs[k] === v; }); }
function byId(r, id) { return byAttr(r, 'data-id', id)[0] || null; }
function btns(r) { return findAll(r, function (n) { return n.tag === 'button'; }); }
function findBtn(r, text) { return btns(r).filter(function (n) { return n.textContent.indexOf(text) >= 0; })[0] || null; }
function hasCls(n, c) { return (' ' + n.className + ' ').indexOf(' ' + c + ' ') >= 0; }
function fire(n, type) { (n.listeners[type] || []).slice().forEach(function (fn) { fn({}); }); }
function click(n) { fire(n, 'click'); }
function text(n) { return n.textContent; }

var htmlEl = new FNode('html'), bodyEl = new FNode('body'), headEl = new FNode('head');
global.document = {
  documentElement: htmlEl, body: bodyEl, head: headEl,
  createElement: function (t) { return new FNode(t); }
};

/* ---- 假計時器（手動推進） */
var T0 = new Date(2026, 10, 3, 10, 0, 0).getTime();
var T = T0, timers = {}, timerSeq = 0;
global.setTimeout = function (fn, ms) { var id = ++timerSeq; timers[id] = { fn: fn, at: T + ms }; return id; };
global.clearTimeout = function (id) { delete timers[id]; };
function timerCount() { return Object.keys(timers).length; }
function advance(ms) {
  var end = T + ms, ids, next, fn;
  while (true) {
    ids = Object.keys(timers).filter(function (k) { return timers[k].at <= end; }).sort(function (a, b) { return timers[a].at - timers[b].at; });
    if (!ids.length) break;
    next = ids[0]; T = Math.max(T, timers[next].at); fn = timers[next].fn; delete timers[next]; fn();
  }
  T = end;
}
function makeLS() {
  var m = {};
  return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; }, _m: m };
}
global.localStorage = makeLS();

/* ================================================================== 載入真實資料與模組 */
var JS = path.join(__dirname, '..', 'js');
['walk_data_dex.js', 'walk_data_shop.js', 'walk_data_spirit.js', 'walk_data_traits.js', 'walk_npc_types.js', 'walk_npc_blurbs.js'].forEach(function (f) { require(path.join(JS, f)); });
/* 線索卡資料另有人在做，這裡用 10 張假資料驗證計數 */
var CARDS = [];
(function () { var i; for (i = 1; i <= 10; i++) CARDS.push({ id: 'c' + i, chapter: i <= 5 ? 'ch1' : 'ch2', type: '史料', text: '第 ' + i + ' 張線索', source: '測試出處', level: i === 3 ? '待查證' : '有出處', rarity: '普通' }); })();
window.WALK_INTEL = CARDS;
require(path.join(JS, 'walk_sprites2.js'));
var WalkStore = require(path.join(JS, 'walk_store.js'));
var WalkDexUI = require(path.join(JS, 'walk_dex_ui.js'));
var WalkShopUI = require(path.join(JS, 'walk_shop_ui.js'));

var pass = 0, failN = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { failN++; console.log('FAIL  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
}

var POINTS = 0, SPENT = 0, CH = 1;
function freshStore(uid, seed) {
  global.localStorage = makeLS();
  if (seed) global.localStorage.setItem('walkstore_' + uid, JSON.stringify(seed));
  POINTS = 5000; SPENT = 0; T = T0; timers = {};
  WalkStore.init({
    uid: uid, root: null, now: function () { return T; },
    getPoints: function () { return POINTS - SPENT; }, addSpent: function (n) { SPENT += n; },
    chaptersDone: function () { return CH; }, toast: function () {}
  });
  return WalkStore;
}
function container() { var c = new FNode('div'); bodyEl.appendChild(c); return c; }
function resetDom() { htmlEl.className = ''; bodyEl.className = ''; }
function seeds(cat, ids) { ids.forEach(function (id) { WalkStore.markSeen(cat, id); }); }
function allIds(cat) { return window.WALK_DEX.categories.filter(function (c) { return c.id === cat; })[0].items.map(function (i) { return i.id; }); }

/* ================================================================== 1. 原始碼規則 */
(function () {
  ['walk_dex_ui.js', 'walk_shop_ui.js'].forEach(function (f) {
    var src = fs.readFileSync(path.join(JS, f), 'utf8');
    var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
    check(f + '：沒有 alert／confirm／prompt 呼叫', (code.match(/(^|[^.\w])(alert|confirm|prompt)\s*\(/g) || []).length === 0);
    check(f + '：沒有 setInterval', code.indexOf('setInterval') < 0);
    check(f + '：點擊區 min-height:44px、最小字 12px', /min-height:44px/.test(code) && !/font-size:(?:[0-9]|1[01])px/.test(code));
    check(f + '：CSS 用變數並有深色類名', /var\(--card/.test(code) && /-dk/.test(code));
    check(f + '：沒有載入圖檔', !/new Image|\.png|\.jpg|\.gif/i.test(code));
  });
})();

/* ================================================================== 2. 圖鑑 */
(function () {
  freshStore('d1');
  resetDom();
  var c = container(), ui = WalkDexUI.mount(c, {});
  var root0 = c.children[0];
  var D = window.WALK_DEX, tot = {};
  D.categories.forEach(function (x) { tot[x.id] = x.total; });
  check('資料：人物 20、地點 17、造型 8、職務 16、稱號 15', tot.people === 20 && tot.places === 17 && tot.looks === 8 && tot.roles === 16 && tot.titles === 15);
  check('首頁六類 + 小精靈冊 + 小精靈形態共 8 顆按鈕', btns(root0).filter(function (b) { return b.attrs['data-cat']; }).length === 8);
  function countOf(cat) { return text(byAttr(root0, 'data-cat', cat)[0]); }
  check('首頁初始：人物 0／20、地點 0／17、造型 0／8、職務 0／16、稱號 0／15',
    /0／20/.test(countOf('people')) && /0／17/.test(countOf('places')) && /0／8/.test(countOf('looks')) && /0／16/.test(countOf('roles')) && /0／15/.test(countOf('titles')));
  check('線索卡總數＝WALK_INTEL 筆數（0／10）', /0／10/.test(countOf('clue')));
  check('小精靈冊 0／24', /0／24/.test(countOf('spirit')));

  seeds('people', allIds('people').slice(0, 5));
  seeds('places', allIds('places').slice(0, 3));
  seeds('looks', ['lk_sk_hat']);
  seeds('titles', ['ti_first', 'ti_walker']);
  root0 = c.children[0];
  countOf = function (cat) { return text(byAttr(root0, 'data-cat', cat)[0]); };
  var dx = WalkStore.dex();
  check('收集後進度數字對得上資料：人物 5／20、地點 3／17、造型 1／8、稱號 2／15',
    /5／20/.test(countOf('people')) && /3／17/.test(countOf('places')) && /1／8/.test(countOf('looks')) && /2／15/.test(countOf('titles')));
  var bar = findAll(byAttr(root0, 'data-cat', 'people')[0], function (n) { return n.attrs.role === 'progressbar'; })[0];
  check('進度條 aria-valuenow＝25（5／20）', bar && bar.attrs['aria-valuenow'] === '25' && bar.children[0].style.width === '25%');
  var allTxt = text(root0);
  check('首頁總完成度文字＝store.dex() 的數字', allTxt.indexOf('已收集 ' + dx.have + '／' + dx.total + '（' + dx.pct + '%）') >= 0, dx.have + '/' + dx.total + '/' + dx.pct);
  check('六類合計 86 項；已收集數＝六類各自數字加總（稱號自動頒發也算在內）', dx.total === 86 && dx.have === dx.cats.reduce(function (a, x) { return a + x.have; }, 0) && dx.have >= 11, dx.have + '/' + dx.total);

  /* ---- 人物清單：已取得 vs 剪影＋取得提示 */
  click(byAttr(root0, 'data-cat', 'people')[0]);
  root0 = c.children[0];
  var tile0 = byId(root0, 'np_main_s1'), tileLock = byId(root0, 'np_campus_c2');
  check('人物清單共 20 格', byAttr(root0, 'data-cat', 'people').length === 1 && findAll(root0, function (n) { return n.attrs['data-id'] && /^np_/.test(n.attrs['data-id']); }).length === 20);
  check('已取得的人物顯示名稱與 ✓、沒有剪影', text(tile0).indexOf('州知事的祕書') >= 0 && !hasCls(tile0, 'wd-sil') && tile0.attrs['data-got'] === '1');
  check('未取得的人物是剪影、名稱隱藏、有取得提示', hasCls(tileLock, 'wd-sil') && text(tileLock).indexOf('西淮館的夜班管理員') < 0 && text(tileLock).indexOf('？？？') >= 0 && text(tileLock).indexOf('怎麼拿：') >= 0, text(tileLock));
  /* ---- 稀有度：形狀加文字 */
  var chips = findAll(root0, function (n) { return hasCls(n, 'wd-rar'); });
  var circ = chips.filter(function (n) { return n.attrs['data-shape'] === 'circle'; }), dia = chips.filter(function (n) { return n.attrs['data-shape'] === 'diamond'; }), star = chips.filter(function (n) { return n.attrs['data-shape'] === 'star'; });
  check('稀有度：圓＝● 普通、菱形＝◆ 稀有、星＝★ 傳說（形狀加文字）',
    circ.length === 13 && dia.length === 6 && star.length === 1 && text(circ[0]) === '● 普通' && text(dia[0]) === '◆ 稀有' && text(star[0]) === '★ 傳說', [circ.length, dia.length, star.length].join('/'));
  check('稀有度標籤有 aria-label', chips.every(function (n) { return /^稀有度：/.test(n.attrs['aria-label']); }));

  /* ---- 人物卡 */
  click(tile0);
  root0 = c.children[0];
  var card = findAll(root0, function (n) { return hasCls(n, 'wd-card'); })[0];
  function field(f) { return text(findAll(card, function (n) { return n.attrs['data-field'] === f; })[0]); }
  check('已取得的人物卡：名字、類型、問法提示、出現的站都有內容', card && field('名字').indexOf('州知事的祕書') >= 0 && field('類型').indexOf('還沒遇到') < 0 && field('問法提示').indexOf('還沒遇到') < 0 && field('出現的站').indexOf('還沒遇到') < 0,
    ['名字', '類型', '問法提示', '出現的站'].map(field).join(' | '));
  click(findBtn(root0, '回人物清單'));
  root0 = c.children[0];
  click(byId(root0, 'np_campus_c2'));
  root0 = c.children[0];
  card = findAll(root0, function (n) { return hasCls(n, 'wd-card'); })[0];
  check('未取得的人物卡：欄位都顯示「還沒遇到」', card.attrs['data-got'] === '0' && field('名字').indexOf('？？？') >= 0 && field('類型').indexOf('還沒遇到') >= 0 && field('問法提示').indexOf('還沒遇到') >= 0 && field('出現的站').indexOf('還沒遇到') >= 0 && field('他的故事').indexOf('還沒遇到') >= 0);
  click(findBtn(root0, '回人物清單'));
  click(findBtn(c.children[0], '回圖鑑首頁'));

  /* ---- 線索卡 */
  root0 = c.children[0];
  click(byAttr(root0, 'data-cat', 'clue')[0]);
  root0 = c.children[0];
  var clueTiles = findAll(root0, function (n) { return n.attrs['data-id'] && /^c\d+$/.test(n.attrs['data-id']); });
  check('線索卡清單 10 格，全部是剪影（還沒取得）', clueTiles.length === 10 && clueTiles.every(function (t) { return hasCls(t, 'wd-sil'); }));
  click(findBtn(root0, '回圖鑑首頁'));

  /* ---- 稱號清單含三足鼎立 */
  root0 = c.children[0];
  click(byAttr(root0, 'data-cat', 'titles')[0]);
  root0 = c.children[0];
  var tri = byId(root0, 'ti_tripod');
  check('稱號清單 15 個，含「三足鼎立」與取得條件', findAll(root0, function (n) { return n.attrs['data-id'] && /^ti_/.test(n.attrs['data-id']); }).length === 15 && tri && text(tri).indexOf('三足鼎立') >= 0 && text(tri).indexOf('怎麼拿：同時養 3 隻小精靈') >= 0, tri && text(tri));
  check('稱號是目標清單：已取得與未取得都看得到名稱，未取得標剪影與取得條件', text(byId(root0, 'ti_first')).indexOf('初出茅廬') >= 0 && !hasCls(byId(root0, 'ti_first'), 'wd-sil') && text(byId(root0, 'ti_dex25')).indexOf('圖鑑學徒') >= 0 && hasCls(byId(root0, 'ti_dex25'), 'wd-sil') && text(byId(root0, 'ti_dex25')).indexOf('怎麼拿：圖鑑完成度達 25%') >= 0);
  check('稱號清單附三足鼎立說明', text(root0).indexOf('三足鼎立') >= 0);
  click(findBtn(root0, '回圖鑑首頁'));

  /* ---- 小精靈冊：剪影畫在 canvas、已取得可開啟 */
  var opened = null;
  ui.unmount();
  freshStore('d1b');
  resetDom();
  c = container();
  ui = WalkDexUI.mount(c, { onOpenSpirit: function (id) { opened = id; }, onOpenRoom: function () { opened = 'room'; } });
  WalkStore.chooseStarter('sp_deer');
  root0 = c.children[0];
  click(byAttr(root0, 'data-cat', 'spirit')[0]);
  root0 = c.children[0];
  var spTiles = findAll(root0, function (n) { return n.attrs['data-id'] && /^sp_/.test(n.attrs['data-id']); });
  check('小精靈冊 24 格', spTiles.length === 24);
  var gotTile = byId(root0, 'sp_deer'), lockTile = byId(root0, 'sp_tide');
  var gotCv = findAll(gotTile, function (n) { return n.tag === 'canvas'; })[0], lockCv = findAll(lockTile, function (n) { return n.tag === 'canvas'; })[0];
  check('已取得的小精靈用像素圖（canvas、整數放大），未取得的是剪影', gotCv && lockCv && gotCv.style.width === '48px' && !hasCls(gotCv, 'wd-pxsil') && hasCls(lockCv, 'wd-pxsil') && hasCls(lockTile, 'wd-sil'));
  var silFills = lockCv.getContext('2d')._calls.fills;
  check('剪影只用單一顏色', silFills.length > 0 && silFills.every(function (f) { return f === silFills[0]; }));
  click(gotTile);
  check('點已取得的小精靈 → onOpenSpirit', opened === 'sp_deer');
  click(findBtn(c.children[0], '回圖鑑首頁'));
  click(findBtn(c.children[0], '回到房間'));
  check('「回到房間」→ onOpenRoom', opened === 'room');
  ui.unmount();
})();

/* ================================================================== 3. 里程碑 */
(function () {
  freshStore('d2', { dex: { claimed: {}, seen: {}, visited: {} } });
  resetDom();
  var c = container(), claimCalls = 0, claimedCb = null;
  var orig = WalkStore.claimMilestone;
  WalkStore.claimMilestone = function (p) { claimCalls++; return orig.call(WalkStore, p); };
  var ui = WalkDexUI.mount(c, { onClaimed: function (p) { claimedCb = p; } });
  function row(p) { return byAttr(c.children[0], 'data-pct', String(p)).filter(function (n) { return n.attrs['data-state']; })[0]; }
  check('完成度 0%：四個里程碑都鎖著、領取按鈕不存在', [25, 50, 75, 100].every(function (p) { return row(p).attrs['data-state'] === 'locked'; }) && findAll(c.children[0], function (n) { return n.attrs['data-act'] === 'claim'; }).length === 0);
  check('鎖住的里程碑顯示「還差 N%」且按鈕停用', text(row(25)).indexOf('還差 25%') >= 0 && btns(row(25))[0].disabled);
  seeds('people', allIds('people'));        /* 20 */
  seeds('places', allIds('places').slice(0, 3)); /* +3 = 23 → 23/86 = 26% */
  var st = WalkStore.dex();
  check('完成度（讀回 store.dex().pct，含稱號自動頒發）：25% 可領、50% 仍鎖', st.pct >= 25 && st.pct < 50 && row(25).attrs['data-state'] === 'ready' && row(50).attrs['data-state'] === 'locked', st.pct);
  var cb = findAll(row(25), function (n) { return n.attrs['data-act'] === 'claim'; })[0];
  click(cb);
  check('領取呼叫 WalkStore.claimMilestone 一次，狀態變已領取', claimCalls === 1 && row(25).attrs['data-state'] === 'claimed' && text(row(25)).indexOf('已領取') >= 0);
  check('領後顯示獎勵與「領到了」', text(c.children[0]).indexOf('領到了！') >= 0 && text(row(25)).indexOf('點數 +50') >= 0 && text(row(25)).indexOf('稱號「圖鑑學徒」') >= 0);
  check('onClaimed 回呼收到 25', claimedCb === 25);
  click(cb);          /* 舊按鈕再點一次（真瀏覽器中按鈕已被換掉） */
  check('每個里程碑只能領一次：再點不再呼叫 claimMilestone', claimCalls === 1 && WalkStore.state().dex.claimed[25] === true);
  check('已領取的里程碑沒有領取按鈕', findAll(row(25), function (n) { return n.attrs['data-act'] === 'claim'; }).length === 0);
  var r2 = orig.call(WalkStore, 25);
  check('store 端也拒絕重複領取', r2.ok === false && r2.reason === 'claimed');
  /* 補到 50%：43 個 */
  seeds('places', allIds('places').slice(3));            /* 20+17 = 37 */
  seeds('looks', allIds('looks'));                        /* +8 = 45 */
  st = WalkStore.dex();
  check('50% 里程碑獎勵文字含造型與小精靈蛋', st.pct >= 50 && row(50).attrs['data-state'] === 'ready' && text(row(50)).indexOf('造型「貓咪」') >= 0 && text(row(50)).indexOf('城門石獅靈') >= 0, text(row(50)));
  ui.unmount();
  WalkStore.claimMilestone = orig;
})();

/* ================================================================== 3b. 新稱號提示、小精靈形態收集 */
(function () {
  /* 進入圖鑑時顯示「剛得到的新稱號」 */
  freshStore('d4', { dex: { claimed: {}, seen: { titles: { ti_first: 1 } }, visited: {}, titles: { ti_first: T0 }, titlePending: ['ti_first'] } });
  resetDom();
  var c = container(), ui = WalkDexUI.mount(c, {});
  var ban = findAll(c.children[0], function (n) { return hasCls(n, 'wd-newtitle'); })[0];
  check('進入圖鑑：顯示剛得到的新稱號（初出茅廬）', ban && text(ban).indexOf('剛得到新稱號：初出茅廬') >= 0, ban && text(ban));
  check('顯示後 store 的待通知清單已清空（takeNewTitles 取走）', WalkStore.state().dex.titlePending.length === 0 && WalkStore.takeNewTitles().length === 0);
  click(findBtn(ban, '知道了'));
  check('按「知道了」橫幅消失', findAll(c.children[0], function (n) { return hasCls(n, 'wd-newtitle'); }).length === 0);
  ui.unmount();
  var c1 = container(), u1 = WalkDexUI.mount(c1, {});
  check('再次進入圖鑑不再重複提示', findAll(c1.children[0], function (n) { return hasCls(n, 'wd-newtitle'); }).length === 0);
  u1.unmount();

  /* 圖鑑開著的時候得到新稱號（store 自動頒發）→ 立刻提示 */
  freshStore('d4b');
  var c2 = container(), u2 = WalkDexUI.mount(c2, {});
  var gotTitles = !!(WalkStore.state().dex.titles.ti_first);
  WalkStore.markSeen('people', 'np_main_s1');
  var b2 = findAll(c2.children[0], function (n) { return hasCls(n, 'wd-newtitle'); })[0];
  check('開著圖鑑時自動頒發的稱號（章節完成 → 初出茅廬）立即顯示', !gotTitles && b2 && text(b2).indexOf('初出茅廬') >= 0, b2 && text(b2));
  u2.unmount();

  /* 稱號已算進完成度：畫面的數字等於 store.dex() */
  freshStore('d4c');
  WalkStore.markSeen('people', 'np_main_s1');
  var c3 = container(), u3 = WalkDexUI.mount(c3, {}), dx = WalkStore.dex();
  check('完成度數字等於 store.dex()（含稱號自動頒發）', text(c3.children[0]).indexOf('已收集 ' + dx.have + '／' + dx.total + '（' + dx.pct + '%）') >= 0 && /1／15/.test(text(byAttr(c3.children[0], 'data-cat', 'titles')[0])), dx.have);
  u3.unmount();

  /* 小精靈形態：24 隻 × 3 形態 = 72 */
  freshStore('d5', { dex: { claimed: {}, seen: { spirit: { sp_deer: 1 }, form: { 'sp_deer:care': 1 } }, visited: {} } });
  resetDom();
  var c4 = container(), u4 = WalkDexUI.mount(c4, {}), fx = WalkStore.dex();
  var fcard = text(byAttr(c4.children[0], 'data-cat', 'forms')[0]);
  check('store.dex().forms 與 spiritBook：形態 1／72、冊合計 2／96', fx.forms.have === 1 && fx.forms.total === 72 && fx.spiritBook.total === 96 && fx.spiritBook.have === 2, JSON.stringify(fx.forms));
  check('首頁「小精靈形態」卡：1／72，並顯示圖鑑合計 2／96', /1／72/.test(fcard) && text(c4.children[0]).indexOf('小精靈圖鑑合計：2／96') >= 0, fcard);
  click(byAttr(c4.children[0], 'data-cat', 'forms')[0]);
  var root4 = c4.children[0];
  var ftiles = findAll(root4, function (n) { return n.attrs['data-id'] && /^sp_[a-z]+:(care|adv|lore)$/.test(n.attrs['data-id']); });
  check('形態清單 72 格（24 隻 × 陪伴型🏠、冒險型🧭、學者型📚）', ftiles.length === 72 && text(root4).indexOf('陪伴型 🏠') >= 0 && text(root4).indexOf('冒險型 🧭') >= 0 && text(root4).indexOf('學者型 📚') >= 0);
  var gt = byId(root4, 'sp_deer:care'), lt = byId(root4, 'sp_deer:adv');
  check('已取得的形態顯示「🏠 鹿影・陪伴型」', hasCls(gt, 'wd-got') === true && text(gt).indexOf('🏠 鹿影・陪伴型') >= 0 && !hasCls(gt, 'wd-sil'));
  var lcv = findAll(lt, function (n) { return n.tag === 'canvas'; })[0];
  check('未取得的形態是剪影（單色 canvas）並附怎麼取得的提示', hasCls(lt, 'wd-sil') && lcv && hasCls(lcv, 'wd-pxsil') && text(lt).indexOf('？？？') >= 0 && text(lt).indexOf('怎麼拿：讓「鹿影」長到成體') >= 0 && text(lt).indexOf('就會分化成這個形態') >= 0, text(lt));
  check('形態清單頂端進度＝1／72', /1／72/.test(text(root4)));
  u4.unmount();
})();

/* ================================================================== 4. 深色與 unmount（圖鑑） */
(function () {
  freshStore('d3');
  resetDom();
  var c = container(), before = headEl.children.length;
  htmlEl.className = 'dk';
  var ui = WalkDexUI.mount(c, {});
  check('深色模式：html.dk → 圖鑑根節點帶 wd-dk', hasCls(c.children[0], 'wd-dk'));
  check('mount 注入一份樣式', headEl.children.length === before + 1);
  ui.unmount();
  check('unmount：容器清空、樣式移除', c.children.length === 0 && headEl.children.length === before);
  var n0 = nodeCount;
  WalkStore.markSeen('people', 'np_main_s1');
  check('unmount 後狀態改變不再重畫（監聽已清）', nodeCount === n0);
  check('圖鑑沒有任何計時器', timerCount() === 0);
  resetDom();
  var c2 = container(), ui2 = WalkDexUI.mount(c2, {});
  check('淺色模式：沒有 wd-dk', !hasCls(c2.children[0], 'wd-dk'));
  ui2.unmount();
})();

/* ================================================================== 5. 商店 */
function zoneTab(c, z) { return findAll(c.children[0], function (n) { return n.tag === 'button' && n.attrs['data-zone'] === z; })[0]; }
function rowOf(c, id) { return findAll(c.children[0], function (n) { return n.attrs['data-id'] === id && n.attrs['data-zone']; })[0]; }
function buyBtn(c, id) { return findAll(rowOf(c, id), function (n) { return n.tag === 'button'; })[0]; }
function shopBuyViaUI(c, id) { var b = buyBtn(c, id); click(b); b = buyBtn(c, id); click(b); }

(function () {
  freshStore('s1');
  resetDom();
  var c = container(), ui = WalkShopUI.mount(c, { uid: 's1', now: function () { return T; }, chaptersDone: function () { return CH; } });
  var S = window.WALK_SHOP, z;
  var tabs = findAll(c.children[0], function (n) { return n.tag === 'button' && n.attrs['data-zone']; });
  check('商店七區分頁：家具鋪、食材舖、玩具與用品、造型屋、蛋鋪、收藏換物所、老闆任務板',
    tabs.length === 7 && ['家具鋪', '食材舖', '玩具與用品', '造型屋', '蛋鋪', '收藏換物所', '老闆任務板'].every(function (n, i) { return text(tabs[i]).indexOf(n) >= 0; }), tabs.map(text).join('/'));
  check('分頁按鈕有 aria-pressed，現在是家具鋪', tabs[0].attrs['aria-pressed'] === 'true' && tabs[1].attrs['aria-pressed'] === 'false');

  /* 價格與新手首購半價 */
  var r = rowOf(c, 'tide_map');
  check('商品顯示像素圖（canvas）、名稱、持有數', findAll(r, function (n) { return n.tag === 'canvas' && hasCls(n, 'ws-px'); }).length === 1 && text(r).indexOf('潮汐海圖') >= 0 && text(r).indexOf('持有 0') >= 0);
  check('新手首購半價：顯示 30 點與「原價 60 點」', text(r).indexOf('30 點') >= 0 && text(r).indexOf('新手首購半價（原價 60 點）') >= 0, text(r));
  check('頁首說明第一次購買半價與補給官折扣不適用', text(c.children[0]).indexOf('第一次購買半價') >= 0 && text(c.children[0]).indexOf('補給官的折扣只在簡報室採購有用，商店不適用') >= 0);
  check('頁首顯示持有點數 5000', text(c.children[0]).indexOf('你有 5000 點') >= 0);
  check('家具列顯示每日剩餘（今天還能買 3 件）', text(r).indexOf('今天還能買 3 件') >= 0);
  check('取得條件商品（鯨骨標本掛飾）：顯示「取得條件」與說明、沒有買鈕', text(rowOf(c, 'whale_bone')).indexOf('取得條件：') >= 0 && text(rowOf(c, 'whale_bone')).indexOf('10 張重複的情報碎屑') >= 0 && findAll(rowOf(c, 'whale_bone'), function (n) { return n.tag === 'button'; }).length === 0);
  check('noBuy 商品沒有價格欄', findAll(rowOf(c, 'bureau_badge'), function (n) { return hasCls(n, 'ws-price'); }).length === 0 && findAll(rowOf(c, 'bureau_badge'), function (n) { return n.tag === 'button'; }).length === 0 && text(rowOf(c, 'bureau_badge')).indexOf('取得條件：完成一整條走讀路線') >= 0);

  /* 兩段式確認 */
  var b = buyBtn(c, 'tide_map');
  check('買鈕初始：「買（30 點）」', text(b).indexOf('買（30 點）') >= 0);
  click(b);
  b = buyBtn(c, 'tide_map');
  check('第一次按：變「再按一次確認」、還沒扣點、持有仍是 0', text(b) === '再按一次確認' && hasCls(b, 'ws-armed') && SPENT === 0 && WalkStore.state().shop.owned.tide_map === undefined);
  check('只有一個 6 秒計時器在等', timerCount() === 1);
  advance(5900);
  check('5.9 秒：仍在確認狀態', text(buyBtn(c, 'tide_map')) === '再按一次確認');
  advance(200);
  b = buyBtn(c, 'tide_map');
  check('6 秒後自動復原成「買（30 點）」、沒買到', text(b).indexOf('買（30 點）') >= 0 && SPENT === 0 && timerCount() === 0);
  click(b);
  click(buyBtn(c, 'lantern_string'));
  check('按了別的商品：前一個復原、新的進入確認', text(buyBtn(c, 'tide_map')).indexOf('買（') >= 0 && text(buyBtn(c, 'lantern_string')) === '再按一次確認' && timerCount() === 1);
  click(buyBtn(c, 'lantern_string'));
  check('第二次按才真的買：扣 25 點（50 的半價）、持有 1、顯示剩餘點數', SPENT === 25 && WalkStore.state().shop.owned.lantern_string === 1 && text(c.children[0]).indexOf('買好了「老街燈籠串」') >= 0 && text(c.children[0]).indexOf('新手首購半價') >= 0 && text(c.children[0]).indexOf('還剩 4975 點') >= 0, text(c.children[0]).slice(0, 200));
  check('買完後計時器清掉、首購半價標示消失、價格回原價 60', timerCount() === 0 && text(rowOf(c, 'tide_map')).indexOf('60 點') >= 0 && text(rowOf(c, 'tide_map')).indexOf('新手首購半價') < 0 && text(c.children[0]).indexOf('第一次購買半價') < 0);
  check('家具剩餘更新為 2 件', text(rowOf(c, 'tide_map')).indexOf('今天還能買 2 件') >= 0);

  /* 每日上限 */
  shopBuyViaUI(c, 'tide_map');
  shopBuyViaUI(c, 'arch_sketch');
  var capBtn = buyBtn(c, 'radio_schedule');
  check('家具買滿 3 件後，其他家具按鈕停用並寫明原因', capBtn.disabled && text(capBtn) === '今天買夠了' && text(rowOf(c, 'radio_schedule')).indexOf('家具一天最多買 3 件，明天再來') >= 0 && text(rowOf(c, 'radio_schedule')).indexOf('今天還能買 0 件') >= 0, text(rowOf(c, 'radio_schedule')));
  click(capBtn);
  check('停用的按鈕點了也不會買', WalkStore.state().shop.owned.radio_schedule === undefined && timerCount() === 0);
  click(zoneTab(c, 'food'));
  var foods = S.foods, i;
  for (i = 0; i < 10; i++) shopBuyViaUI(c, foods[i % foods.length].id);
  check('食材買滿 10 份後，按鈕停用並寫明原因', buyBtn(c, 'food_hist').disabled && text(buyBtn(c, 'food_hist')) === '今天買夠了' && text(rowOf(c, 'food_hist')).indexOf('食材一天最多買 10 份') >= 0 && text(rowOf(c, 'food_hist')).indexOf('今天還能買 0 份') >= 0);
  /* 隔天復原 */
  T += 86400000;
  ui.refresh();
  click(zoneTab(c, 'food'));
  check('隔天：每日上限重算、按鈕恢復', !buyBtn(c, 'food_hist').disabled && text(rowOf(c, 'food_hist')).indexOf('今天還能買 10 份') >= 0);
  ui.unmount();
})();

/* ---- 點數不夠 */
(function () {
  freshStore('s2');
  resetDom();
  var c = container(), ui = WalkShopUI.mount(c, { uid: 's2', now: function () { return T; } });
  POINTS = 20; SPENT = 0;
  ui.refresh();
  var b = buyBtn(c, 'tide_map');   /* 首購半價 30 點、只有 20 */
  check('買不起：按鈕停用，原因寫出「還差 10 點」', b.disabled && text(b) === '點數不夠' && text(rowOf(c, 'tide_map')).indexOf('還差 10 點') >= 0, text(rowOf(c, 'tide_map')));
  click(b);
  check('買不起時按了也沒扣點', SPENT === 0);
  ui.unmount();
})();

/* ---- 造型、蛋鋪、玩具、套裝 */
(function () {
  freshStore('s3');
  resetDom();
  var c = container(), chap = 0;
  var ui = WalkShopUI.mount(c, { uid: 's3', now: function () { return T; }, chaptersDone: function () { return chap; } });
  click(zoneTab(c, 'looks'));
  check('造型屋列出 11 項（8 款造型 + 3 個登入畫面主題）', findAll(c.children[0], function (n) { return n.attrs['data-id'] && n.attrs['data-zone'] === 'looks'; }).length === 11);
  check('登入畫面主題顯示色塊', findAll(rowOf(c, 'theme_dusk'), function (n) { return hasCls(n, 'ws-swatch'); }).length === 2);
  WalkStore.grant('look_sk_hat', 1);
  ui.refresh();
  check('已有的造型：按鈕停用「已經有了」', buyBtn(c, 'look_sk_hat').disabled && text(buyBtn(c, 'look_sk_hat')) === '已經有了');

  click(zoneTab(c, 'eggs'));
  check('蛋鋪：還沒完成章節時，普通蛋停用並說明原因', buyBtn(c, 'egg_common').disabled && text(rowOf(c, 'egg_common')).indexOf('蛋鋪只賣你完成過章節的蛋') >= 0);
  check('蛋鋪：孵蛋加速可買', !buyBtn(c, 'egg_speedup').disabled);
  check('蛋鋪說明稀有與傳說不能用點數買', text(c.children[0]).indexOf('稀有和傳說的蛋不能用點數買') >= 0);
  chap = 1;
  ui.refresh();
  check('完成章節後普通蛋可買', !buyBtn(c, 'egg_common').disabled);

  click(zoneTab(c, 'toys'));
  check('玩具與用品：4 個玩具 + 6 個小精靈用品，窩的升級有標示',
    findAll(c.children[0], function (n) { return n.attrs['data-id'] && n.attrs['data-zone'] === 'toys'; }).length === 10 && text(rowOf(c, 'plush_nest')).indexOf('窩的升級款') >= 0);
  check('玩具從 WALK_TOYS 取得像素圖與說明', findAll(rowOf(c, 'toy_light'), function (n) { return n.tag === 'canvas'; }).length === 1 && text(rowOf(c, 'toy_light')).indexOf('追著光點跑的小球') >= 0);

  click(zoneTab(c, 'furniture'));
  var setRow = rowOf(c, 'set_tide');
  check('套裝列：整套價格、集到 0／5 件、集滿加成預告（純裝飾）', setRow && text(setRow).indexOf('整套 150 點') >= 0 && text(setRow).indexOf('集到 0／5 件') >= 0 && text(setRow).indexOf('集滿會有「海風」') >= 0 && text(setRow).indexOf('純裝飾，不加分') >= 0, text(setRow));
  check('套裝未集滿：沒有加成成就標記', setRow.attrs['data-complete'] === '0' && text(setRow).indexOf('這一套集滿了') < 0);
  ['tide_map', 'whale_bone', 'shell_rug', 'sampan_table'].forEach(function (id) { WalkStore.grant(id, 1); });
  ui.refresh();
  check('集到 4／5 件', text(rowOf(c, 'set_tide')).indexOf('集到 4／5 件') >= 0);
  WalkStore.grant('sea_window', 1);
  ui.refresh();
  setRow = rowOf(c, 'set_tide');
  check('集滿 5 件：顯示加成已生效、按鈕停用「已集滿」', setRow.attrs['data-complete'] === '1' && text(setRow).indexOf('集滿加成「海風」') >= 0 && text(setRow).indexOf('✓ 這一套集滿了') >= 0 && buyBtn(c, 'set_tide').disabled && text(buyBtn(c, 'set_tide')) === '已集滿');
  check('家具鋪的取得條件商品顯示「已經擁有」', text(rowOf(c, 'whale_bone')).indexOf('✓ 已經擁有') >= 0);
  ui.unmount();
})();

/* ---- 收藏換物所（真的 store：碎屑與兌換都走 WalkStore） */
function shardSeed(by) { return { shop: { owned: {}, daily: {}, firstBuy: false, shards: by } }; }
(function () {
  freshStore('s4', shardSeed({ '史料': 4 }));
  resetDom();
  var c = container(), ui = WalkShopUI.mount(c, { uid: 's4', now: function () { return T; } });
  click(zoneTab(c, 'exchange'));
  check('store.shards() 與 shardTotal() 可用', WalkStore.shardTotal() === 4 && WalkStore.shards()['史料'] === 4);
  check('換物所顯示碎屑數（取自 store）與兌換比例', text(c.children[0]).indexOf('你的情報碎屑：4 張') >= 0 && text(c.children[0]).indexOf('3 張同類碎屑換 1 份該類點心，10 張換 1 件限定家具') >= 0);
  check('限定家具 2 件 + 邊框 3 款', ['whale_bone', 'kiln_model', 'frame_bamboo', 'frame_brick', 'frame_neon'].every(function (id) { return rowOf(c, id); }));
  check('碎屑不夠：停用，寫出「還差 6 張」', buyBtn(c, 'whale_bone').disabled && text(rowOf(c, 'whale_bone')).indexOf('還差 6 張') >= 0 && text(rowOf(c, 'whale_bone')).indexOf('要 10 張碎屑') >= 0);
  check('碎屑 4 張，竹編邊框要 5 張：還差 1 張', buyBtn(c, 'frame_bamboo').disabled && text(rowOf(c, 'frame_bamboo')).indexOf('還差 1 張') >= 0);
  check('點心換物：史料類 3 張可換（按鈕可按）', !buyBtn(c, 'snack:史料').disabled && text(rowOf(c, 'snack:史料')).indexOf('要 3 張碎屑') >= 0 && buyBtn(c, 'snack:路況').disabled);
  click(buyBtn(c, 'snack:史料'));
  click(buyBtn(c, 'snack:史料'));
  check('換點心：扣 3 張碎屑、史料點心 +1', WalkStore.shardTotal() === 1 && WalkStore.state().shop.owned.food_hist === 1);
  ui.unmount();

  freshStore('s4a', shardSeed({ '史料': 12 }));
  var ca = container(), ua = WalkShopUI.mount(ca, { uid: 's4a', now: function () { return T; } });
  click(zoneTab(ca, 'exchange'));
  var eb = buyBtn(ca, 'whale_bone');
  check('碎屑 12 張：鯨骨標本可換', !eb.disabled && text(eb).indexOf('換（10 張）') >= 0);
  click(eb);
  check('兌換也是兩段式：第一次按只進入確認、store 沒變', text(buyBtn(ca, 'whale_bone')) === '再按一次確認' && WalkStore.shardTotal() === 12 && !WalkStore.state().shop.owned.whale_bone);
  advance(6000);
  check('兌換確認 6 秒後復原、沒換', text(buyBtn(ca, 'whale_bone')).indexOf('換（') >= 0 && WalkStore.shardTotal() === 12 && timerCount() === 0);
  click(buyBtn(ca, 'whale_bone'));
  click(buyBtn(ca, 'whale_bone'));
  check('第二次按才兌換：碎屑 12→2、持有 whale_bone、顯示換好了', WalkStore.shardTotal() === 2 && WalkStore.state().shop.owned.whale_bone === 1 && text(ca.children[0]).indexOf('換好了') >= 0);
  check('換過的限定家具：按鈕停用「已經有了」', buyBtn(ca, 'whale_bone').disabled && text(buyBtn(ca, 'whale_bone')) === '已經有了');
  ua.unmount();

  freshStore('s4b', shardSeed({ '史料': 8, '路況': 6 }));
  var c2 = container(), ui2 = WalkShopUI.mount(c2, { uid: 's4b', now: function () { return T; } });
  click(zoneTab(c2, 'exchange'));
  check('碎屑按類別：合計 14 張並列出各類', text(c2.children[0]).indexOf('你的情報碎屑：14 張') >= 0 && text(c2.children[0]).indexOf('史料 8') >= 0 && text(c2.children[0]).indexOf('路況 6') >= 0);
  ui2.unmount();

  /* 備援：store 沒有 shards／exchange 時，用 opts.shards／opts.exchange；兩者都沒有就停用 */
  var fake = Object.create(WalkStore); fake.shards = undefined; fake.shardTotal = undefined; fake.exchange = undefined;
  var shards = 12, exchanged = [];
  var c3 = container(), ui3 = WalkShopUI.mount(c3, { store: fake, uid: 's4c', now: function () { return T; }, shards: function () { return shards; }, exchange: function (id) { exchanged.push(id); return { ok: true }; } });
  click(zoneTab(c3, 'exchange'));
  click(buyBtn(c3, 'kiln_model'));
  click(buyBtn(c3, 'kiln_model'));
  check('備援：opts.shards／opts.exchange 仍可用', exchanged.length === 1 && exchanged[0] === 'kiln_model');
  ui3.unmount();
  var fake2 = Object.create(WalkStore); fake2.shards = undefined; fake2.shardTotal = undefined; fake2.exchange = undefined;
  var c4 = container(), ui4 = WalkShopUI.mount(c4, { store: fake2, uid: 's4d', now: function () { return T; }, shards: function () { return 14; } });
  click(zoneTab(c4, 'exchange'));
  check('備援：兩邊都沒有兌換介面時，夠碎屑也停用並說明「兌換的窗口還沒開」', buyBtn(c4, 'whale_bone').disabled && text(rowOf(c4, 'whale_bone')).indexOf('兌換的窗口還沒開') >= 0);
  ui4.unmount();
})();

/* ---- 套裝：買一整套 → 每件可購買成員都進 owned */
(function () {
  freshStore('s4e');
  resetDom();
  var c = container(), ui = WalkShopUI.mount(c, { uid: 's4e', now: function () { return T; } });
  click(buyBtn(c, 'set_tide'));
  click(buyBtn(c, 'set_tide'));
  var ow = WalkStore.state().shop.owned, set = window.WALK_SHOP.sets[0], buyable = set.items.filter(function (id) { return !window.WALK_SHOP.furniture.filter(function (f) { return f.id === id; })[0].noBuy; });
  check('買整套：每件可購買成員都在 owned 裡（鯨骨標本要另外取得）', buyable.length === 4 && buyable.every(function (id) { return ow[id] >= 1; }) && !ow.whale_bone, JSON.stringify(ow));
  var sr = rowOf(c, 'set_tide');
  check('集到 4／5 件、還沒集滿（缺的是取得條件商品）、套裝按鈕改成「已買過」', text(sr).indexOf('集到 4／5 件') >= 0 && sr.attrs['data-complete'] === '0' && buyBtn(c, 'set_tide').disabled && text(buyBtn(c, 'set_tide')) === '已買過');
  WalkStore.grant('whale_bone', 1);
  ui.refresh();
  check('補上最後一件後：用 owned 的每件成員判定集滿，加成生效', rowOf(c, 'set_tide').attrs['data-complete'] === '1' && text(rowOf(c, 'set_tide')).indexOf('集滿加成「海風」') >= 0 && text(buyBtn(c, 'set_tide')) === '已集滿');
  ui.unmount();
})();

/* ---- 老闆任務板（真的 store.board／claimBoard） */
(function () {
  freshStore('s5');
  resetDom();
  var c = container();
  var ui = WalkShopUI.mount(c, { uid: 's5', now: function () { return T; } });
  click(zoneTab(c, 'board'));
  var tasks = findAll(c.children[0], function (n) { return n.attrs['data-zone'] === 'board' && n.attrs['data-state']; });
  check('任務板顯示 store.board() 的每日 3 個任務、都是「進行中」', WalkStore.board().length === 3 && tasks.length === 3 && tasks.every(function (t) { return t.attrs['data-state'] === 'doing'; }));
  check('任務板顯示進度與獎勵、說明不累積', text(tasks[0]).indexOf('進度 0／') >= 0 && text(tasks[0]).indexOf('獎勵：') >= 0 && text(c.children[0]).indexOf('沒做完也不會累積') >= 0);
  var q0 = WalkStore.board()[0];
  check('同日同人任務可重現', JSON.stringify(WalkStore.board().map(function (q) { return q.id; })) === JSON.stringify(WalkStore.board().map(function (q) { return q.id; })));
  check('還沒做完時：領獎勵按鈕不存在、狀態按鈕停用', findAll(c.children[0], function (n) { return n.attrs['data-act'] === 'claim'; }).length === 0);
  WalkStore.report(q0.event, q0.n);
  ui.refresh();   /* report 只存檔不通知，要畫面重畫由主線呼叫 refresh() */
  var t0 = byId(c.children[0], q0.id);
  check('事件回報後（refresh）任務變成「可以領獎勵」，進度＝N／N', t0.attrs['data-state'] === 'ready' && text(t0).indexOf('進度 ' + q0.n + '／' + q0.n) >= 0 && findAll(t0, function (n) { return n.attrs['data-act'] === 'claim'; }).length === 1, t0.attrs['data-state']);
  var heldBefore = JSON.stringify(WalkStore.state().shop.owned), ptsBefore = POINTS - SPENT;
  click(findAll(t0, function (n) { return n.attrs['data-act'] === 'claim'; })[0]);
  t0 = byId(c.children[0], q0.id);
  check('領獎勵走 store.claimBoard：任務變「已完成」、顯示領到了', t0.attrs['data-state'] === 'claimed' && text(t0).indexOf('✓ 已完成') >= 0 && text(c.children[0]).indexOf('領到了！') >= 0);
  check('獎勵入帳：點數或點心有變化', (POINTS - SPENT) !== ptsBefore || JSON.stringify(WalkStore.state().shop.owned) !== heldBefore, (POINTS - SPENT) + '/' + ptsBefore);
  var after = JSON.stringify(WalkStore.state().shop.owned);
  var r2 = WalkStore.claimBoard(q0.id);
  WalkStore.report(q0.event, 5);
  ui.refresh();
  check('已領過的任務不能重領', r2.ok === false && r2.reason === 'claimed' && JSON.stringify(WalkStore.state().shop.owned) === after && byId(c.children[0], q0.id).attrs['data-state'] === 'claimed');
  T += 86400000;
  ui.refresh();
  check('隔天任務重算、進度歸零（3 個都在進行中）', findAll(c.children[0], function (n) { return n.attrs['data-zone'] === 'board' && n.attrs['data-state'] === 'doing'; }).length === 3);
  ui.unmount();

  /* 備援一：opts.board */
  freshStore('s5b');
  var f1 = Object.create(WalkStore); f1.board = undefined; f1.claimBoard = undefined;
  var c3 = container(), claimedId = null;
  var ui3 = WalkShopUI.mount(c3, { store: f1, uid: 's5b', board: {
    list: function () { return [{ id: 'x1', text: '測試任務', n: 2, progress: 2, done: true, claimed: false, reward: { points: 7 } }]; },
    claim: function (id) { claimedId = id; return { ok: true, got: ['點數 +7'] }; } } });
  click(zoneTab(c3, 'board'));
  click(findAll(c3.children[0], function (n) { return n.attrs['data-act'] === 'claim'; })[0]);
  check('備援：store 沒有任務板時使用 opts.board 並呼叫 claim', claimedId === 'x1' && text(c3.children[0]).indexOf('領到了！點數 +7') >= 0);
  ui3.unmount();

  /* 備援二：本機（localStorage）任務板 */
  freshStore('s5c');
  var f2 = Object.create(WalkStore); f2.board = undefined; f2.claimBoard = undefined;
  var added = 0, c5 = container();
  var ui5 = WalkShopUI.mount(c5, { store: f2, uid: 's5c', now: function () { return T; }, addPoints: function (n) { added += n; } });
  click(zoneTab(c5, 'board'));
  var picked = WalkShopUI._logic.pickToday('s5c', T), qq = picked[0];
  check('備援：本機任務板每天 3 個、可重現', picked.length === 3 && findAll(c5.children[0], function (n) { return n.attrs['data-zone'] === 'board' && n.attrs['data-state']; }).length === 3);
  WalkShopUI.report(qq.event, qq.n, 's5c', T);
  ui5.refresh();
  click(findAll(byId(c5.children[0], qq.id), function (n) { return n.attrs['data-act'] === 'claim'; })[0]);
  check('備援：領獎勵後任務完成、點數經 opts.addPoints 入帳', byId(c5.children[0], qq.id).attrs['data-state'] === 'claimed' && added === (qq.reward.points || 0));
  ui5.unmount();
})();

/* ---- 深色、unmount、監聽清乾淨（商店） */
(function () {
  freshStore('s6');
  resetDom();
  htmlEl.className = 'dk';
  var c = container(), before = headEl.children.length;
  var ui = WalkShopUI.mount(c, { uid: 's6', now: function () { return T; } });
  check('深色模式：html.dk → 商店根節點帶 ws-dk', hasCls(c.children[0], 'ws-dk'));
  resetDom();
  bodyEl.className = 'dk';
  ui.refresh();
  check('body.dk 也算深色；改回淺色就拿掉 ws-dk', hasCls(c.children[0], 'ws-dk'));
  bodyEl.className = '';
  ui.refresh();
  check('淺色：沒有 ws-dk', !hasCls(c.children[0], 'ws-dk'));
  click(buyBtn(c, 'tide_map'));
  check('進入確認狀態時有 1 個計時器', timerCount() === 1);
  ui.unmount();
  check('unmount：計時器清掉、容器清空、樣式移除', timerCount() === 0 && c.children.length === 0 && headEl.children.length === before);
  var n0 = nodeCount;
  WalkStore.grant('plant', 1);
  check('unmount 後狀態改變不再重畫（store 監聽已移除）', nodeCount === n0);
  ui.unmount();
  check('重複 unmount 不出錯', true);
  /* 沒有 store 資料時不爆 */
  var c2 = container(), saved = window.WALK_SHOP;
  window.WALK_SHOP = undefined;
  var ok = true;
  try { var u2 = WalkShopUI.mount(c2, { uid: 's6' }); u2.unmount(); } catch (e) { ok = false; console.log(e.stack); }
  window.WALK_SHOP = saved;
  check('商店資料缺少時不會丟例外', ok);
  var ok2 = true, saved2 = window.WALK_DEX;
  window.WALK_DEX = undefined;
  try { var c3 = container(), u3 = WalkDexUI.mount(c3, {}); u3.unmount(); } catch (e2) { ok2 = false; console.log(e2.stack); }
  window.WALK_DEX = saved2;
  check('圖鑑資料缺少時不會丟例外', ok2);
})();

console.log('\n' + pass + ' 項通過，' + failN + ' 項失敗');
process.exit(failN ? 1 : 0);
