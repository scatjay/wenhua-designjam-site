/* WalkRoom 的單元測試：node test_tools/test_walk_room.js
   不用瀏覽器、不裝套件：自己做最小的假 DOM／canvas／計時器／rAF；用 WalkStore（localStorage 模式）與最小假資料。
   印出每項 PASS/FAIL 與總數，全過退出碼 0。 */
'use strict';
var fs = require('fs');
var path = require('path');

global.window = global;

/* ================================================================== 假 DOM */
var docListeners = {};           /* type → [fn] */
var nodeCount = 0;
function FNode(tag) {
  this.tag = tag; this.children = []; this.parentNode = null; this.attrs = {}; this.style = {}; this.className = '';
  this._text = ''; this.listeners = {}; this.disabled = false; this.width = 0; this.height = 0; nodeCount++;
}
FNode.prototype.appendChild = function (c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; };
FNode.prototype.insertBefore = function (c, ref) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; var i = this.children.indexOf(ref); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; };
FNode.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; } return c; };
Object.defineProperty(FNode.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
Object.defineProperty(FNode.prototype, 'textContent', {
  get: function () { return this._text + this.children.map(function (c) { return c.textContent; }).join(''); },
  set: function (v) { this.children.forEach(function (c) { c.parentNode = null; }); this.children = []; this._text = String(v); }
});
FNode.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
FNode.prototype.getAttribute = function (k) { return this.attrs[k] === undefined ? null : this.attrs[k]; };
FNode.prototype.addEventListener = function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); };
FNode.prototype.removeEventListener = function (t, fn) { var a = this.listeners[t] || [], i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
FNode.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: this.width || 100, height: this.height || 100 }; };
FNode.prototype.getContext = function () {
  var self = this;
  if (!this._ctx) {
    var calls = { n: 0, text: [] };
    this._ctx = new Proxy({ _calls: calls, fillText: function (t) { calls.text.push(t); calls.n++; } }, {
      get: function (t, k) { if (k in t) return t[k]; return function () { calls.n++; }; },
      set: function (t, k, v) { t[k] = v; return true; }
    });
  }
  return this._ctx;
};
function walk(node, fn) { fn(node); node.children.forEach(function (c) { walk(c, fn); }); }
function findAll(rootNode, pred) { var out = []; walk(rootNode, function (n) { if (pred(n)) out.push(n); }); return out; }
function findBtn(rootNode, text) { var r = findAll(rootNode, function (n) { return n.tag === 'button' && n.textContent.indexOf(text) >= 0; }); return r[0] || null; }
function allBtn(rootNode, text) { return findAll(rootNode, function (n) { return n.tag === 'button' && n.textContent.indexOf(text) >= 0; }); }
function fire(node, type, ev) { (node.listeners[type] || []).slice().forEach(function (fn) { fn(ev || {}); }); }
function click(node) { fire(node, 'click', { clientX: 0, clientY: 0 }); }

var htmlEl = new FNode('html'), bodyEl = new FNode('body'), headEl = new FNode('head');
var fakeDoc = {
  hidden: false, documentElement: htmlEl, body: bodyEl, head: headEl,
  createElement: function (t) { return new FNode(t); },
  addEventListener: function (t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); },
  removeEventListener: function (t, fn) { var a = docListeners[t] || [], i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }
};
global.document = fakeDoc;
function docListenerCount() { var n = 0; Object.keys(docListeners).forEach(function (k) { n += docListeners[k].length; }); return n; }

/* ---- 假計時器與 rAF（手動推進） */
var T0 = new Date(2026, 10, 3, 10, 0, 0).getTime();
var T = T0;
var timers = {}, timerSeq = 0, rafs = {}, rafSeq = 0;
global.setTimeout = function (fn, ms) { var id = ++timerSeq; timers[id] = { fn: fn, at: T + ms }; return id; };
global.clearTimeout = function (id) { delete timers[id]; };
global.requestAnimationFrame = function (fn) { var id = ++rafSeq; rafs[id] = fn; return id; };
global.cancelAnimationFrame = function (id) { delete rafs[id]; };
function timerCount() { return Object.keys(timers).length; }
function rafCount() { return Object.keys(rafs).length; }
function advance(ms) {          /* 推進假時間並執行到期的計時器 */
  var end = T + ms, ids, i, next;
  while (true) {
    ids = Object.keys(timers).filter(function (k) { return timers[k].at <= end; }).sort(function (a, b) { return timers[a].at - timers[b].at; });
    if (!ids.length) break;
    next = ids[0];
    T = Math.max(T, timers[next].at);
    var fn = timers[next].fn; delete timers[next]; fn();
  }
  T = end;
}
function flushRaf(ts) { var ids = Object.keys(rafs), fns = ids.map(function (k) { var f = rafs[k]; delete rafs[k]; return f; }); fns.forEach(function (f) { f(ts); }); }

/* ---- localStorage */
function makeLS() {
  var m = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }, _m: m
  };
}
global.localStorage = makeLS();

/* ================================================================== 假資料 */
function sprite(c) { return { w: 16, h: 16, rows: ['................', '..kkkkkkkkkkkk..', '..kXXXXXXXXXXk..', '..kXXXXXXXXXXk..', '..kkkkkkkkkkkk..'], pal: { X: c } }; }
function setData() {
  window.WALK_SPIRITS = [
    { id: 'sp_a', name: '鹿影', attr: '觀察', starter: true, stages: { baby: { sprite: sprite('#e58fb5') }, adult: { sprite: sprite('#6ccbd9') } } },
    { id: 'sp_b', name: '書卷蠹魚', attr: '智識', starter: true, stages: {} },
    { id: 'sp_c', name: '潮汐鯨魂', attr: '觀察', starter: true }
  ];
  window.WALK_FOODS = [{ id: 'f1', name: '蜜餞', cat: '史料', price: 10, basic: true }];
  window.WALK_TOYS = [];
  window.WALK_INTEL = [];
  window.WALK_DEX = { cats: [{ id: 'spirit' }, { id: 'people', total: 4 }] };
  window.WALK_SHOP = { items: [
    { id: 'chair', name: '木椅', cat: 'furniture', zone: 'floor', price: 50, sprite: sprite('#a0673c') },
    { id: 'rug', name: '地毯', cat: 'furniture', zone: 'floor', price: 40 },
    { id: 'poster', name: '海報', cat: 'furniture', zone: 'wall', price: 30, sprite: sprite('#f0953a') },
    { id: 'frame', name: '獎狀框', cat: 'furniture', zone: 'wall', price: 30 },
    { id: 'win_arch', name: '拱窗', cat: 'furniture', zone: 'window', price: 60 },
    { id: 'toy_ball', name: '小皮球', cat: '小精靈用品', zone: 'floor', kind: 'toy', price: 30 },
    { id: 'nest2', name: '軟窩', cat: '小精靈用品', zone: 'pet', price: 60 },
    { id: 'f1', name: '蜜餞', cat: 'food', price: 10 }
  ] };
}
setData();

require(path.join(__dirname, '..', 'js', 'walk_sprites2.js'));
var WalkStore = require(path.join(__dirname, '..', 'js', 'walk_store.js'));
var WalkRoom = require(path.join(__dirname, '..', 'js', 'walk_room.js'));
var L = WalkRoom._logic;

/* ================================================================== 測試框架 */
var pass = 0, failN = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { failN++; console.log('FAIL  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
}

var POINTS = 0, SPENT = 0;
function freshStore(uid, extra) {
  global.localStorage = makeLS();
  var o = {
    uid: uid, root: null, now: function () { return T; }, sess: 's1',
    getPoints: function () { return POINTS - SPENT; }, addSpent: function (n) { SPENT += n; },
    chaptersDone: function () { return 0; }, toast: function () {},
    profile: function () { return { nick: '測試員', skin: 2, badges: ['b1'], closet: ['c1'] }; },
    isTeammate: function (u) { return u === 'mate'; }
  };
  if (extra) for (var k in extra) o[k] = extra[k];
  POINTS = 5000; SPENT = 0;
  WalkStore.init(o);
  return WalkStore;
}
function resetDom() {
  docListeners = {}; htmlEl.className = ''; bodyEl.className = ''; fakeDoc.hidden = false;
  timers = {}; rafs = {}; T = T0;
}
function container() { var c = new FNode('div'); bodyEl.appendChild(c); return c; }
function giveItems(map) { Object.keys(map).forEach(function (id) { WalkStore.grant(id, map[id]); }); }
function isAdj(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }

/* ================================================================== 1. 格局 */
(function () {
  var lay = L.DEFAULT_LAYOUT, ids = WalkRoom.SPOTS, ok = true, wallOk = true, floorOk = true;
  check('擺放點共 15 個（牆 6、地 6、窗 3）', ids.length === 15 &&
    ids.filter(function (s) { return /^wall/.test(s); }).length === 6 && ids.filter(function (s) { return /^floor/.test(s); }).length === 6 && ids.filter(function (s) { return /^window/.test(s); }).length === 3);
  ids.forEach(function (s) {
    var p = lay.spots[s];
    if (!p || p.x < 0 || p.x >= lay.cols || p.y < 0 || p.y >= lay.rows) ok = false;
    if (/^wall|^window/.test(s) && p.y >= lay.wallRows) wallOk = false;
    if (/^floor/.test(s) && p.y < lay.wallRows) floorOk = false;
  });
  check('格局 12×8、15 個點都在範圍內', lay.cols === 12 && lay.rows === 8 && ok);
  check('牆與窗的點在牆面列、地面的點在地面列', wallOk && floorOk);
  var seen = {}, dup = false;
  ids.forEach(function (s) { var k = lay.spots[s].x + ',' + lay.spots[s].y; if (seen[k]) dup = true; seen[k] = 1; });
  check('15 個擺放點座標互不重疊', !dup);
})();

/* ================================================================== 2. 可走格鄰接與避障 */
(function () {
  var lay = L.DEFAULT_LAYOUT, g = L.buildGrid(lay, {}, null), x, y, wallWalk = 0, sym = true, bad = 0, blockedWalk = 0;
  for (y = 0; y < g.h; y++) for (x = 0; x < g.w; x++) {
    if (y < lay.wallRows && g.isWalk(x, y)) wallWalk++;
    if (g.isWalk(x, y)) g.neighbors(x, y).forEach(function (n) {
      if (!isAdj({ x: x, y: y }, n)) bad++;
      if (!g.isWalk(n.x, n.y)) bad++;
      if (!g.neighbors(n.x, n.y).some(function (m) { return m.x === x && m.y === y; })) sym = false;
    });
  }
  check('牆面列沒有可走格', wallWalk === 0);
  check('鄰居都是上下左右相鄰的可走格', bad === 0);
  check('鄰接是對稱的', sym);
  lay.blocking.forEach(function (k) {
    var a = lay.areas[k], xx, yy;
    for (yy = a.y; yy < a.y + a.h; yy++) for (xx = a.x; xx < a.x + a.w; xx++) if (g.isWalk(xx, yy)) blockedWalk++;
  });
  check('衣櫃、書櫃、地圖桌的格子不可走', blockedWalk === 0);
  check('小精靈窩那格可走', g.isWalk(lay.areas.nest.x, lay.areas.nest.y));
  var cnt = 0; for (y = 0; y < g.h; y++) for (x = 0; x < g.w; x++) if (g.isWalk(x, y)) cnt++;
  check('空房間可走格數量合理（地面 5 列×12 減去家具）', cnt === 5 * 12 - 2 - 2 - 2, cnt);

  /* 地面家具擋路；小精靈用品不擋；不認得的物品 id 保守擋路 */
  var f1 = lay.spots.floor1, f2 = lay.spots.floor2, f3 = lay.spots.floor3;
  var g2 = L.buildGrid(lay, { floor1: 'chair', floor2: 'toy_ball', floor3: 'mystery' }, function (id) {
    var a = window.WALK_SHOP.items, i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null;
  });
  check('地面家具所在格不可走', !g2.isWalk(f1.x, f1.y));
  check('小精靈玩具所在格仍可走，且成為吸引點', g2.isWalk(f2.x, f2.y) && g2.attractors.length === 1 && g2.attractors[0].x === f2.x);
  check('不認得的物品當家具擋路', !g2.isWalk(f3.x, f3.y));
  var n1 = g2.neighbors(f1.x + 1, f1.y);
  check('家具格不會出現在鄰居名單', !n1.some(function (n) { return n.x === f1.x && n.y === f1.y; }));
  /* 最短路徑避開被佔格 */
  var from = { x: 1, y: 7 }, to = { x: 4, y: 7 }, occ = {};
  occ['2,7'] = 1;
  var step = L.bfsNext(g, from, to, occ);
  check('繞開被佔的格子再前進', step && isAdj(from, step) && !(step.x === 2 && step.y === 7), JSON.stringify(step));
  var boxed = L.bfsNext(g, { x: 1, y: 3 }, { x: 4, y: 7 }, (function () { var o = {}; o['2,3'] = 1; o['1,4'] = 1; return o; })());
  check('被圍住時回傳 null（不穿過去）', boxed === null);
})();

/* ================================================================== 3. 漫步 */
(function () {
  var lay = L.DEFAULT_LAYOUT, g = L.buildGrid(lay, { floor1: 'chair', floor4: 'chair' }, function (id) { return id === 'chair' ? { id: 'chair', zone: 'floor', cat: 'furniture' } : null; });
  var rng = L.mulberry32(L.hashStr('walk1')), sp = L.newWalker('sp_a', 'baby', 4, 6), t = 1000, i, inFurniture = 0, jumpSteps = 0, bad = 0, moves = 0, naps = 0, seen = {}, prev;
  sp.vigor = 90;
  for (i = 0; i < 3000; i++) {
    prev = { x: sp.x, y: sp.y };
    var act = L.stepWalker(sp, { grid: g, occupied: {} }, t, rng);
    if (!g.isWalk(sp.x, sp.y)) inFurniture++;
    if (act === 'move') { moves++; if (!isAdj(prev, sp)) bad++; } else if (sp.x !== prev.x || sp.y !== prev.y) bad++;
    if (act === 'jump') jumpSteps++;
    if (act === 'nap') naps++;
    seen[sp.x + ',' + sp.y] = 1;
    t += 500;
  }
  check('漫步 3000 步從不踩進家具或牆', inFurniture === 0);
  check('每一步只移動到相鄰一格', bad === 0 && moves > 300, 'moves=' + moves + ' bad=' + bad);
  check('活力高：會跳、不打盹、走過很多格', jumpSteps > 20 && naps === 0 && Object.keys(seen).length > 15, 'jump=' + jumpSteps + ' cells=' + Object.keys(seen).length);

  /* 間隔 1～3 秒 */
  var sp2 = L.newWalker('sp_a', 'baby', 4, 6), rng2 = L.mulberry32(5), gaps = [], last = null, tt = 0;
  sp2.vigor = 90;
  for (i = 0; i < 400; i++) {
    var a = L.stepWalker(sp2, { grid: g, occupied: {} }, tt, rng2);
    if (a === 'move' || a === 'jump') { if (last !== null) gaps.push(tt - last); last = tt; }
    tt += 50;
  }
  var mn = Math.min.apply(null, gaps), mx = Math.max.apply(null, gaps);
  check('相鄰兩次行動間隔落在 1～3 秒', gaps.length > 5 && mn >= 1000 && mx <= 3100, mn + '~' + mx);

  /* 活力低：回窩打盹，窩在 nest */
  var sp3 = L.newWalker('sp_a', 'baby', 1, 7), rng3 = L.mulberry32(9), nest = lay.areas.nest, naps3 = 0;
  sp3.vigor = 30;
  for (i = 0; i < 200; i++) { var a3 = L.stepWalker(sp3, { grid: g, occupied: {} }, i * 1500, rng3); if (a3 === 'nap') naps3++; }
  check('活力低：走回窩並打盹', sp3.mode === 'nap' && sp3.x === nest.x && sp3.y === nest.y && naps3 > 10, sp3.mode + '@' + sp3.x + ',' + sp3.y);
  /* 活力恢復：醒來又開始走 */
  sp3.vigor = 80;
  var woke = false, moved = false, rng4 = L.mulberry32(11), t4 = 400000;
  for (i = 0; i < 60; i++) { var a4 = L.stepWalker(sp3, { grid: g, occupied: {} }, t4 + i * 1500, rng4); if (a4 === 'wake') woke = true; if (a4 === 'move') moved = true; }
  check('活力恢復後醒來再漫步', woke && moved && sp3.mode !== 'nap');

  /* 玩具：走過去並停留玩 */
  var gt = L.buildGrid(lay, { floor5: 'toy_ball' }, function (id) { return window.WALK_SHOP.items.filter(function (x) { return x.id === id; })[0] || null; });
  var sp5 = L.newWalker('sp_a', 'baby', 7, 4), rng5 = L.mulberry32(21), toy = lay.spots.floor5, played = 0, reached = false;
  sp5.vigor = 60;
  for (i = 0; i < 400; i++) { var a5 = L.stepWalker(sp5, { grid: gt, occupied: {} }, i * 1200, rng5); if (a5 === 'play') played++; if (sp5.x === toy.x && sp5.y === toy.y) reached = true; }
  check('有玩具：會走過去並停下來玩', reached && played > 3, 'played=' + played);

  /* 不踩別隻小精靈所在格 */
  var spA = L.newWalker('a', 'baby', 2, 5), spB = L.newWalker('b', 'baby', 3, 5), rng6 = L.mulberry32(3), clash = 0, t6 = 0;
  spA.vigor = 80; spB.vigor = 80;
  for (i = 0; i < 500; i++) {
    t6 += 1100;
    L.stepWalker(spA, { grid: g, occupied: (function () { var o = {}; o[spB.x + ',' + spB.y] = 1; return o; })() }, t6, rng6);
    L.stepWalker(spB, { grid: g, occupied: (function () { var o = {}; o[spA.x + ',' + spA.y] = 1; return o; })() }, t6, rng6);
    if (spA.x === spB.x && spA.y === spB.y) clash++;
  }
  check('兩隻小精靈不會疊在同一格', clash === 0, clash);

  /* 同樣的種子 → 同樣的路線（可重現） */
  function route(seed) { var s = L.newWalker('x', 'baby', 4, 6), r = L.mulberry32(seed), out = [], k; s.vigor = 90; for (k = 0; k < 120; k++) { L.stepWalker(s, { grid: g, occupied: {} }, k * 700, r); out.push(s.x + ',' + s.y); } return out.join(';'); }
  check('種子相同路線相同、種子不同路線不同', route(77) === route(77) && route(77) !== route(78));
})();

/* ================================================================== 4. 擺放點類型限制 */
(function () {
  var wall = { id: 'p', zone: 'wall' }, floor = { id: 'c', zone: 'floor', cat: 'furniture' }, win = { id: 'w', zone: 'window' }, pet = { id: 'toy', cat: '小精靈用品', zone: 'floor' }, petZone = { id: 'n', zone: 'pet' }, unknown = { id: 'u' };
  check('牆飾只能放牆面點', L.canPlace('wall3', wall).ok && !L.canPlace('floor1', wall).ok && !L.canPlace('window1', wall).ok);
  check('地面家具只能放地面點', L.canPlace('floor2', floor).ok && !L.canPlace('wall1', floor).ok && !L.canPlace('window2', floor).ok);
  check('窗景只能放窗邊點', L.canPlace('window3', win).ok && !L.canPlace('wall1', win).ok && !L.canPlace('floor6', win).ok);
  check('小精靈用品放地面點，不能掛牆或窗', L.canPlace('floor4', pet).ok && L.canPlace('floor4', petZone).ok && !L.canPlace('wall2', pet).ok && !L.canPlace('window1', petZone).ok);
  check('類型不明的物品不限制；不存在的擺放點被拒', L.canPlace('wall1', unknown).ok && L.canPlace('wall9', wall).reason === 'badspot');
  check('itemKind 分辨 carpet 不是小精靈用品', L.itemKind({ cat: 'carpet', zone: 'floor' }) === 'floor' && L.itemKind({ cat: 'pet', zone: 'floor' }) === 'pet');
})();

/* ================================================================== 5. 窗外 */
(function () {
  function at(h) { return new Date(2026, 10, 3, h, 30, 0).getTime(); }
  check('日夜依時間：清晨／白天／黃昏／夜晚', L.skyPhase(6) === 'dawn' && L.skyPhase(12) === 'day' && L.skyPhase(18) === 'dusk' && L.skyPhase(23) === 'night' && L.skyPhase(3) === 'night');
  check('窗外設定：固定時段與天氣', L.resolveWindow('night', at(12)).phase === 'night' && L.resolveWindow('rain', at(12)).weather === 'rain' && L.resolveWindow('cloud', at(12)).weather === 'cloud');
  var w1 = L.resolveWindow('auto', at(9)), w2 = L.resolveWindow('auto', at(15));
  check('自動：同一天天氣固定，時段跟著時間走', w1.weather === w2.weather && w1.phase === 'day' && L.resolveWindow('auto', at(22)).phase === 'night');
  check('窗外文字可讀', L.windowText('night', at(12)) === '夜晚・晴' && L.windowText('rain', at(12)).indexOf('下雨') > 0);
})();

/* ================================================================== 6. 自己的房間：畫面與步進 */
var lastAreaCalls = [];
function mountOwn(uid, opts, setup) {
  resetDom();
  freshStore(uid);
  if (setup) setup();
  var c = container(), o = opts || {};
  o.now = function () { return T; };
  o.seed = o.seed || 'tseed';
  o.onArea = function (n, d) { lastAreaCalls.push([n, d]); };
  var inst = WalkRoom.mount(c, o);
  return { inst: inst, c: c, opts: o };
}
(function () {
  var m = mountOwn('u1', {}, function () { WalkStore.chooseStarter('sp_a'); WalkStore.chooseStarter('sp_b'); });
  var inst = m.inst, cv = inst.view.canvas;
  check('mount 畫出單一 canvas，邏輯 192×128、放大 3 倍（576×384）', findAll(m.c, function (n) { return n.tag === 'canvas'; }).length === 1 && cv.width === 576 && cv.height === 384);
  check('房間有六個區域按鈕（成就牆、圖鑑書櫃、衣櫃、小精靈窩、照片牆、地圖桌）', ['成就牆', '圖鑑書櫃', '衣櫃', '小精靈窩', '照片牆', '地圖桌'].every(function (s) { return !!findBtn(m.c, s); }));
  var order = inst.view.order();
  check('房內小精靈：隨行位以外的都在房間（起始一隻）', order.length === 1 && order[0] === 'sp_a');
  var ctxn0 = cv.getContext('2d')._calls.n;
  inst.tick(T); inst.tick(T + 500);
  check('tick 會重畫（canvas 有繪圖呼叫）', cv.getContext('2d')._calls.n > ctxn0 + 20);

  /* 區域按鈕與畫面點擊 → onArea */
  lastAreaCalls = [];
  click(findBtn(m.c, '衣櫃'));
  click(findBtn(m.c, '圖鑑書櫃'));
  check('按鈕呼叫 onArea(closet)、onArea(dex)', lastAreaCalls.length === 2 && lastAreaCalls[0][0] === 'closet' && lastAreaCalls[1][0] === 'dex');
  var lay = inst.view.layout, a = lay.areas;
  lastAreaCalls = [];
  inst.view.clickAt(a.closet.x * 16 + 4, a.closet.y * 16 + 4);
  inst.view.clickAt(a.achieve.x * 16 + 4, a.achieve.y * 16 + 4);
  inst.view.clickAt(a.photos.x * 16 + 4, a.photos.y * 16 + 4);
  inst.view.clickAt(a.map.x * 16 + 4, a.map.y * 16 + 4);
  inst.view.clickAt(a.nest.x * 16 + 4, a.nest.y * 16 + 4);
  inst.view.clickAt(a.shelf.x * 16 + 6, a.shelf.y * 16 + 3 + 12.4 * 2 + 3);
  var names = lastAreaCalls.map(function (x) { return x[0]; }).join(',');
  check('點畫面上的區域回報 closet/achievements/photos/map/nest/dex', names === 'closet,achievements,photos,map,nest,dex', names);
  check('點圖鑑書櫃第 3 排＝第 3 冊（線索卡）', lastAreaCalls[5][1].book === 'clue', JSON.stringify(lastAreaCalls[5]));
  inst.unmount();
})();

/* ================================================================== 7. 點小精靈：撫摸、活力提示、次數用完 */
(function () {
  var m = mountOwn('u2', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var inst = m.inst, w = inst.view.walkers()['sp_a'];
  var before = WalkStore.vigor('sp_a');
  var pos = { x: w.x * 16 + 8, y: w.y * 16 + 8 };
  var hit = inst.view.clickAt(pos.x, pos.y);
  check('點到小精靈：轉成撒嬌（cuddle）並呼叫 WalkStore.pet', hit && hit.kind === 'spirit' && w.mode === 'cuddle' && WalkStore.vigor('sp_a') > before, JSON.stringify(hit) + ' ' + before + '→' + WalkStore.vigor('sp_a'));
  check('顯示 +活力 提示（畫面浮字與訊息）', inst.view.floatsCount() === 1 && /活力 \+3/.test(inst.message()), inst.message());
  var before2 = inst.view.walkers()['sp_a'].x + ',' + inst.view.walkers()['sp_a'].y;
  inst.tick(T + 100); inst.tick(T + 600);
  check('回應期間不走動', (inst.view.walkers()['sp_a'].x + ',' + inst.view.walkers()['sp_a'].y) === before2);
  inst.tick(T + 2600); inst.tick(T + 5600);
  check('回應結束後恢復漫步（不再是 cuddle）', inst.view.walkers()['sp_a'].mode !== 'cuddle');
  for (var i = 0; i < 5; i++) inst.view.clickAt(pos.x, pos.y);
  var w2 = inst.view.walkers()['sp_a'];
  inst.view.clickAt(w2.x * 16 + 8, w2.y * 16 + 8);
  check('今天摸滿次數：顯示友善提示', /明天再來|休息夠了|精神滿滿/.test(inst.message()), inst.message());
  inst.unmount();
})();

/* ================================================================== 8. 佈置模式 */
(function () {
  var m = mountOwn('u3', {}, function () { giveItems({ chair: 1, rug: 1, poster: 2, win_arch: 1, toy_ball: 1, f1: 3 }); });
  var inst = m.inst, S = WalkStore;
  var eb = findBtn(m.c, '佈置模式');
  check('佈置模式預設關，擺放點清單不顯示', eb.textContent.indexOf('關') > 0 && eb.getAttribute('aria-pressed') === 'false');
  click(eb);
  check('進入佈置模式後列出 15 個擺放點按鈕', eb.getAttribute('aria-pressed') === 'true' && allBtn(m.c, '：空').length === 15, allBtn(m.c, '：空').length);

  /* 牆面點：只列牆飾（海報），不列地面家具或食物 */
  click(findBtn(m.c, '牆面 1'));
  var pick = findAll(m.c, function (n) { return n.tag === 'button' && /還有 \d+ 件可放/.test(n.textContent); });
  var names = pick.map(function (b) { return b.textContent; }).join('|');
  check('牆面點只列牆飾（海報），沒有椅子、窗景、食物', pick.length === 1 && names.indexOf('海報') === 0, names);
  click(pick[0]);
  check('選一件放下：寫進 WalkStore.room().spots', S.room().spots.wall1 === 'poster' && /已放好/.test(inst.message()));

  click(findBtn(m.c, '地面 1'));
  names = findAll(m.c, function (n) { return n.tag === 'button' && /還有 \d+ 件可放/.test(n.textContent); }).map(function (b) { return b.textContent; }).join('|');
  check('地面點列地面家具與小精靈用品，不列牆飾與窗景', /木椅/.test(names) && /地毯/.test(names) && /小皮球/.test(names) && !/海報/.test(names) && !/拱窗/.test(names), names);
  click(findAll(m.c, function (n) { return n.tag === 'button' && /木椅/.test(n.textContent) && /還有/.test(n.textContent); })[0]);
  check('椅子放到地面 1', S.room().spots.floor1 === 'chair');
  inst.tick(T);
  var g = inst.view.grid(), p1 = inst.view.layout.spots.floor1;
  check('放下椅子後該格從可走格移除', !g.isWalk(p1.x, p1.y));

  click(findBtn(m.c, '窗邊 2'));
  names = findAll(m.c, function (n) { return n.tag === 'button' && /還有 \d+ 件可放/.test(n.textContent); }).map(function (b) { return b.textContent; }).join('|');
  check('窗邊點只列窗景', /拱窗/.test(names) && !/木椅/.test(names) && !/海報/.test(names), names);

  /* 同一件持有 1 件，已放過：另一個地面點顯示可放 0、按鈕停用 */
  click(findBtn(m.c, '地面 3'));
  var chairBtn = findAll(m.c, function (n) { return n.tag === 'button' && /木椅/.test(n.textContent) && /還有/.test(n.textContent); })[0];
  check('持有量用完：已全部擺出的家具按鈕停用（還有 0 件）', chairBtn && chairBtn.disabled === true && /還有 0 件/.test(chairBtn.textContent), chairBtn && chairBtn.textContent);

  /* 直接呼叫 store 也擋：類型錯誤 */
  check('WalkStore 也拒絕不合類型的擺放（雙重保險）', S.place('wall2', 'chair').reason === 'wrongzone');

  /* 收回 */
  click(findBtn(m.c, '地面 1'));
  click(findBtn(m.c, '收回這件'));
  check('收回後該點變空、格子恢復可走', !S.room().spots.floor1 && inst.view.grid().isWalk(p1.x, p1.y));
  /* 關閉佈置模式 */
  click(eb);
  check('關閉佈置模式後收起清單與選單', eb.getAttribute('aria-pressed') === 'false');
  inst.unmount();
})();

/* ================================================================== 9. 房間設定與公開快照 */
(function () {
  var uid = 'u4';
  var m = mountOwn(uid, {}, function () { giveItems({ poster: 1 }); });
  var inst = m.inst, S = WalkStore, LS = global.localStorage;
  function pub() { var raw = LS.getItem('walkstore_pub_' + uid); return raw ? JSON.parse(raw) : null; }
  click(findBtn(m.c, '房間設定'));
  check('設定頁有三個開放選項與說明文字', !!findBtn(m.c, '不開放') && !!findBtn(m.c, '只給隊友') && !!findBtn(m.c, '所有人') && findAll(m.c, function (n) { return /同一個場次的玩家/.test(n.textContent) && n.tag === 'div'; }).length > 0);
  check('預設：只給隊友、簽名簿開、照片牆不公開', S.room().open === 'team' && S.room().guestBook === true && S.room().photosPublic === false);
  check('預設選中「只給隊友」', findBtn(m.c, '只給隊友').getAttribute('aria-pressed') === 'true');

  /* 不開放：立刻生效，公開快照與索引被清掉 */
  click(findBtn(m.c, '不開放'));
  check('改成不開放：store 與公開快照連動（不寫快照）', S.room().open === 'closed' && pub() === null && LS.getItem('walkstore_idx_s1_' + uid) === null);

  /* 回到只給隊友：快照出現 */
  click(findBtn(m.c, '只給隊友'));
  check('改回只給隊友：公開快照寫出，open=team', pub() && pub().open === 'team' && pub().guestBook === true, JSON.stringify(pub()));

  /* 所有人：兩段式 */
  var allBtnEl = findBtn(m.c, '所有人');
  click(allBtnEl);
  check('改「所有人」第一次按只進入確認狀態（尚未生效）', S.room().open === 'team' && /再按一次確認/.test(allBtnEl.textContent));
  advance(6100);
  check('6 秒後自動復原成原本的字', allBtnEl.textContent === '所有人' && S.room().open === 'team' && timerCount() === 0);
  click(allBtnEl); click(allBtnEl);
  check('第二次按才生效，公開快照 open=all', S.room().open === 'all' && pub().open === 'all');
  check('生效後按鈕狀態更新（所有人被選中）', findBtn(m.c, '所有人').getAttribute('aria-pressed') === 'true');

  /* 簽名簿 */
  click(findBtn(m.c, '簽名簿'));
  check('簽名簿關閉：store 與快照 guestBook=false', S.room().guestBook === false && pub().guestBook === false);
  click(findBtn(m.c, '簽名簿'));
  check('簽名簿再開：guestBook=true', S.room().guestBook === true && pub().guestBook === true);

  /* 照片牆公開：兩段式 */
  var pb = findBtn(m.c, '照片牆：');
  click(pb);
  check('照片牆公開要兩段式確認', S.room().photosPublic === false && /再按一次確認/.test(pb.textContent));
  click(pb);
  check('確認後照片牆公開', S.room().photosPublic === true);
  click(findBtn(m.c, '照片牆：'));
  check('改回不公開不需要確認', S.room().photosPublic === false);

  /* 擺放也會同步進快照 */
  click(findBtn(m.c, '佈置模式'));
  click(findBtn(m.c, '牆面 2'));
  click(findAll(m.c, function (n) { return n.tag === 'button' && /海報/.test(n.textContent) && /還有/.test(n.textContent); })[0]);
  check('擺放家具後公開快照的陳列同步', pub().spots.wall2 === 'poster');

  /* 窗外 */
  click(findBtn(m.c, '夜晚'));
  check('窗外設定寫入 store 並進快照', S.room().window === 'night' && pub().window === 'night');
  inst.unmount();
})();

/* ================================================================== 10. 房間街、訪客、足跡與摸精靈 */
(function () {
  resetDom();
  freshStore('guest1');
  WalkStore.chooseStarter('sp_a');
  var LS = global.localStorage;
  var snapOk = { nick: '阿花', skin: 3, badges: ['路過達人'], dexPct: 40, closet: [], spots: { wall1: 'poster', floor1: 'chair' }, spirits: [{ id: 'sp_a', stage: 'baby' }, { id: 'sp_b', stage: 'adult' }], window: 'dusk', open: 'all', guestBook: true, updated: 1 };
  LS.setItem('walkstore_pub_hostA', JSON.stringify(snapOk));
  LS.setItem('walkstore_pub_hostB', JSON.stringify({ nick: '小明', dexPct: 10, spots: {}, spirits: [], window: 'auto', open: 'all', guestBook: false }));
  LS.setItem('walkstore_pub_hostC', JSON.stringify({ nick: '隱藏', spots: {}, spirits: [], open: 'all', guestBook: true }));
  LS.setItem('walkstore_hidden_hostC', '1');
  LS.setItem('walkstore_pub_hostD', JSON.stringify({ nick: '封閉', spots: {}, spirits: [], open: 'closed', guestBook: true }));
  LS.setItem('walkstore_pub_hostE', JSON.stringify({ nick: '隊友甲', dexPct: 55, spots: {}, spirits: [{ id: 'sp_a', stage: 'baby' }], window: 'day', open: 'team', guestBook: true }));
  LS.setItem('walkstore_pub_hostF', JSON.stringify({ nick: '只給隊友', spots: {}, spirits: [], open: 'team', guestBook: true }));
  var calls = [];
  var lists = {
    team: [{ uid: 'hostE', nick: '隊友甲', dexPct: 55, n: 1 }],
    all: [{ uid: 'hostA', nick: '阿花', dexPct: 40, n: 2 }, { uid: 'hostB', nick: '小明', dexPct: 10, n: 0 }, { uid: 'hostC', nick: '隱藏' }, { uid: 'hostD', nick: '封閉' }, { uid: 'hostF', nick: '只給隊友' }],
    rec: [{ uid: 'hostA', nick: '阿花', dexPct: 40, n: 2 }]
  };
  var c = container(), opts = { now: function () { return T; }, seed: 's', listRooms: function (tab, cb) { calls.push(tab); cb(lists[tab] || []); } };
  /* 讓 store 用 isTeammate：freshStore 設定 mate；這裡 hostE 要算隊友 */
  WalkStore.init({ uid: 'guest1', root: null, now: function () { return T; }, sess: 's1', getPoints: function () { return 5000; }, addSpent: function () {}, chaptersDone: function () { return 0; }, toast: function () {}, profile: function () { return { nick: 'g' }; }, isTeammate: function (u) { return u === 'hostE'; } });
  WalkStore.chooseStarter('sp_a');
  var st = WalkRoom.mountStreet(c, opts);
  check('房間街有四個分頁', ['隊友', '所有人', '推薦', '我去過的'].every(function (s) { return !!findBtn(c, s); }));
  check('進入先載入「隊友」分頁，列出摘要按鈕', calls[0] === 'team' && !!findBtn(c, '隊友甲'));
  click(findBtn(c, '所有人'));
  check('切到所有人：呼叫 listRooms("all")，列表有 5 間', calls[calls.length - 1] === 'all' && findAll(c, function (n) { return n.tag === 'button' && /wr-item/.test(n.className); }).length === 5 && !!findBtn(c, '阿花'));
  click(findBtn(c, '推薦'));
  check('推薦分頁可用', calls[calls.length - 1] === 'rec' && !!findBtn(c, '阿花'));

  /* 隱藏／封閉／只給隊友 */
  click(findBtn(c, '所有人'));
  click(findBtn(c, '隱藏'));
  check('被隱藏的房間顯示「這間房暫時不開放」', findAll(c, function (n) { return n.textContent === '這間房暫時不開放。'; }).length >= 1);
  click(findBtn(c, '回到房間街'));
  click(findBtn(c, '封閉'));
  check('不開放的房間同樣顯示暫時不開放', findAll(c, function (n) { return n.textContent === '這間房暫時不開放。'; }).length >= 1);
  click(findBtn(c, '回到房間街'));
  click(findBtn(c, '只給隊友'));
  check('只給隊友的房間，非隊友進不去', findAll(c, function (n) { return /只給隊友參觀/.test(n.textContent); }).length >= 1);
  click(findBtn(c, '回到房間街'));

  /* 進入阿花的房間 */
  click(findBtn(c, '阿花'));
  check('唯讀房間顯示暱稱、造型、徽章、圖鑑完成度、窗外、小精靈與階段', (function () {
    var t = c.textContent;
    return /阿花 的房間/.test(t) && /造型 3/.test(t) && /路過達人/.test(t) && /圖鑑 40%/.test(t) && /黃昏・晴/.test(t) && /鹿影（幼體）/.test(t) && /書卷蠹魚（成體）/.test(t);
  })(), c.textContent.slice(0, 200));
  check('訪客畫面沒有任何文字輸入欄位', findAll(c, function (n) { return n.tag === 'input' || n.tag === 'textarea' || n.tag === 'select'; }).length === 0);
  check('訪客房間有 canvas，且小精靈最多 3 隻在走', findAll(c, function (n) { return n.tag === 'canvas'; }).length === 1 && st.detail().view.order().length === 2);
  var info = function () { return findAll(c, function (n) { return /今天還能留足跡的房間/.test(n.textContent) && n.children.length === 0; })[0].textContent; };
  check('顯示今日剩餘次數：足跡 10 間、這間還沒留、還沒摸', /還能留足跡的房間：10 間/.test(info()) && /足跡還沒留/.test(info()) && /摸小精靈還沒摸/.test(info()), info());
  check('貼圖只有固定四個（讚、好厲害、想借鏡、路過）', ['讚', '好厲害', '想借鏡', '路過'].every(function (s) { return !!findBtn(c, s); }));

  click(findBtn(c, '好厲害'));
  check('留足跡：寫入對方訪客簿、剩餘次數 9、這間已留', /已留下足跡：好厲害/.test(c.textContent) && /還能留足跡的房間：9 間/.test(info()) && /足跡已留/.test(info()), info());
  var guests = JSON.parse(LS.getItem('walkstore_guests_hostA') || '{}');
  check('足跡寫的是固定代碼 wow', guests.guest1 === 'wow');
  click(findBtn(c, '讚'));
  check('同一間同一天不能再留第二次', /今天已經留過足跡/.test(c.textContent));
  click(findBtn(c, '摸摸牠們'));
  check('摸小精靈：得到小點心，剩餘狀態變已摸過', /牠很開心/.test(c.textContent) && /蜜餞/.test(c.textContent) && /摸小精靈已摸過/.test(info()), c.textContent.slice(-120));
  click(findBtn(c, '摸摸牠們'));
  check('同一間同一天第二次摸被擋', /今天已經摸過/.test(c.textContent));

  /* 沒開簽名簿的房間 */
  click(findBtn(c, '回到房間街'));
  click(findBtn(c, '小明'));
  click(findBtn(c, '路過'));
  check('沒開簽名簿的房間：留足跡被擋，並提示', /沒有開簽名簿/.test(c.textContent));
  click(findBtn(c, '摸摸牠們'));
  check('沒有小精靈的房間摸不到', /沒有小精靈/.test(c.textContent));

  /* 每天最多 10 間 */
  click(findBtn(c, '回到房間街'));
  var big = [], ii;
  for (ii = 0; ii < 12; ii++) { var u = 'bulk' + ii; LS.setItem('walkstore_pub_' + u, JSON.stringify({ nick: 'B' + ii, spots: {}, spirits: [], open: 'all', guestBook: true })); big.push({ uid: u, nick: 'B' + ii }); }
  lists.all = big;
  click(findBtn(c, '推薦')); click(findBtn(c, '所有人'));
  var okN = 0, capHit = false;
  for (ii = 0; ii < 12; ii++) {
    click(findBtn(c, 'B' + ii + (ii < 10 ? '' : '')));
    click(findBtn(c, '路過'));
    if (/已留下足跡/.test(c.textContent)) okN++;
    if (/逛的房間夠多/.test(c.textContent)) capHit = true;
    click(findBtn(c, '回到房間街'));
  }
  /* 前面已用掉 1 間（阿花），所以這 12 間裡只剩 9 間可留 */
  check('一天最多 10 間：之後被擋並提示', okN === 9 && capHit, 'ok=' + okN + ' cap=' + capHit);
  check('剩餘次數歸零', WalkRoom._logic.footprintLeft({ now: function () { return T; } }) === 0);

  /* 我去過的：沒有 listRooms 的備援 */
  var st2 = WalkRoom.mountStreet(container(), { now: function () { return T; } });
  click(findBtn(st2.root, '我去過的'));
  check('沒接 listRooms 時「我去過的」用本機造訪紀錄', allBtn(st2.root, '你去過的房間').length >= 3, allBtn(st2.root, '你去過的房間').length);
  click(findBtn(st2.root, '所有人'));
  check('沒接 listRooms 的其他分頁顯示空狀態而不報錯', /還沒有可以逛的房間/.test(st2.root.textContent));
  st2.unmount();

  /* 卸載乾淨 */
  click(findBtn(c, '推薦')); click(findBtn(c, '阿花')); /* 打開一個詳細頁再卸載 */
  var p1 = st.pending();
  st.unmount();
  check('房間街卸載後無殘留計時器／rAF／文件監聽', timerCount() === 0 && rafCount() === 0 && docListenerCount() === 0, 'timers=' + timerCount() + ' raf=' + rafCount() + ' doc=' + docListenerCount() + ' before=' + JSON.stringify(p1));
})();

/* ================================================================== 11. 動畫迴圈：8 FPS、背景與省電暫停 */
(function () {
  var m = mountOwn('u5', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var inst = m.inst, v = inst.view;
  check('mount 後已排程一個 rAF', rafCount() === 1);
  /* 模擬 60Hz 的 rAF，1 秒內大約只畫 8 格 */
  var f0 = v.frames(), ts = 1000, k;
  for (k = 0; k < 60; k++) { flushRaf(ts); ts += 16.67; T += 17; }
  var frames = v.frames() - f0;
  check('60Hz 的 rAF 被節流到約 8 FPS', frames >= 7 && frames <= 9, frames);

  /* 背景分頁：visibilitychange 後停止 */
  fakeDoc.hidden = true;
  (docListeners['visibilitychange'] || []).forEach(function (fn) { fn(); });
  check('分頁在背景：rAF 與輪詢都停止', rafCount() === 0 && timerCount() === 0 && !v.isRunning());
  var f1 = v.frames();
  flushRaf(5000);
  check('背景時不會再畫', v.frames() === f1);
  fakeDoc.hidden = false;
  (docListeners['visibilitychange'] || []).forEach(function (fn) { fn(); });
  check('回到前景：重新排程', rafCount() === 1 && v.isRunning());
  inst.unmount();

  /* 省電模式 */
  var saver = true;
  var m2 = mountOwn('u6', { isSaver: function () { return saver; } }, function () { WalkStore.chooseStarter('sp_a'); });
  var v2 = m2.inst.view;
  check('省電模式：不排 rAF，只有一個慢速檢查計時器', rafCount() === 0 && timerCount() === 1);
  var f2 = v2.frames();
  advance(2100);
  check('省電模式持續停止（不畫）', v2.frames() === f2 && rafCount() === 0);
  saver = false;
  advance(2100);
  check('省電解除後自動恢復動畫', rafCount() === 1 && v2.isRunning());
  m2.inst.unmount();
})();

/* ================================================================== 12. 深色模式 */
(function () {
  var m = mountOwn('u7', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var inst = m.inst;
  check('淺色時沒有 wr-dk 類名', (' ' + inst.root.className + ' ').indexOf(' wr-dk ') < 0 && /(^| )wr( |$)/.test(inst.root.className));
  htmlEl.className = 'dk';
  inst.tick(T + 200);
  check('html.dk 時房間根節點加上 wr-dk', (' ' + inst.root.className + ' ').indexOf(' wr-dk ') >= 0, inst.root.className);
  htmlEl.className = '';
  inst.tick(T + 400);
  check('回到淺色時類名移除', (' ' + inst.root.className + ' ').indexOf(' wr-dk ') < 0);
  /* 樣式表用 CSS 變數、字級與點擊區 */
  var css = findAll(headEl, function (n) { return n.tag === 'style'; })[0];
  var cssText = css ? css.textContent : '';
  check('樣式表存在，使用 CSS 變數與深色變數', /var\(--card/.test(cssText) && /\.wr\.wr-dk/.test(cssText) && /var\(--fg/.test(cssText));
  check('按鈕最小 44px、字級不小於 12px', /\.wr-btn\{min-height:44px;min-width:44px/.test(cssText) && !/font-size:(?:[0-9]|1[01])px/.test(cssText));
  inst.unmount();
  check('卸載後樣式表移除', findAll(headEl, function (n) { return n.tag === 'style'; }).length === 0);
})();

/* ================================================================== 13. 卸載無殘留 */
(function () {
  var m = mountOwn('u8', {}, function () { giveItems({ poster: 1 }); WalkStore.chooseStarter('sp_a'); });
  var inst = m.inst;
  click(findBtn(m.c, '房間設定'));
  click(findBtn(m.c, '所有人'));              /* 留一個進行中的兩段式計時器 */
  click(findBtn(m.c, '佈置模式'));
  var p = inst.pending();
  check('卸載前確實有東西登記著（計時器、監聽、rAF）', p.timers >= 1 && p.listeners >= 2 && p.raf === 1, JSON.stringify(p));
  var rc = inst.refreshCount();
  inst.unmount();
  check('卸載後計時器、rAF、文件監聽全為 0', timerCount() === 0 && rafCount() === 0 && docListenerCount() === 0, 'timers=' + timerCount() + ' raf=' + rafCount() + ' doc=' + docListenerCount());
  check('卸載後 DOM 節點被移除', m.c.children.length === 0);
  WalkStore.grant('chair', 1);
  WalkStore.setGuestBook(false);
  check('卸載後不再收 store 事件（無監聽洩漏）', inst.refreshCount() === rc);
  inst.unmount();
  check('重複呼叫 unmount 不出錯', true);
  /* 連續 mount／unmount 20 次不累積 */
  var i, baseNodes = docListenerCount();
  for (i = 0; i < 20; i++) { var mm = mountOwn('u9', {}, null); mm.inst.unmount(); }
  check('連續 mount/unmount 20 次後仍為 0 個監聽、0 個計時器', docListenerCount() === baseNodes && timerCount() === 0 && rafCount() === 0);
})();

/* ================================================================== 13c. 行為狀態機（規格 9.3）：純邏輯 */
setData();
var BEH = (function () {
  var lay = L.DEFAULT_LAYOUT, saveBeh = window.WALK_BEHAVIOR;
  delete window.WALK_BEHAVIOR;                 /* 這一節用內建備用資料；用真資料的整合測試在 13d */
  var DEFS = {
    toy_ball: { id: 'toy_ball', zone: 'floor', cat: '小精靈用品', name: '小皮球' },
    food_bowl: { id: 'food_bowl', zone: 'pet', cat: '小精靈用品', name: '食碗' },
    chair: { id: 'chair', zone: 'floor', cat: 'furniture', name: '木椅' }
  };
  function defOf(id) { return DEFS[id] || null; }
  function gridWith(spots) { return L.buildGrid(lay, spots || {}, defOf); }
  var gToy = gridWith({ floor5: 'toy_ball' }), gBowl = gridWith({ floor4: 'food_bowl' }), gNone = gridWith({}), gAll = gridWith({ floor5: 'toy_ball', floor4: 'food_bowl', floor1: 'chair' });
  function mkBeh(over) {
    var b = { cfg: L.behCfg(), hour: 12, night: false, visitor: false, away: false, newThing: null, others: [], events: {} }, k;
    for (k in (over || {})) b[k] = over[k];
    return b;
  }
  function mkW(id, pers, x, y, vigor) {
    var w = L.newWalker(id, 'baby', x, y);
    w.vigor = vigor === undefined ? 70 : vigor; w.pers = pers; w.arch = L.archOf(pers); w.mode = 'wander';
    return w;
  }
  function occOf(list, except) { var o = {}; list.forEach(function (w) { if (w !== except) o[w.x + ',' + w.y] = 1; }); return o; }
  function share(pers, vigor, beh, g, n, seed) {
    var rng = L.mulberry32(seed), cnt = {}, i, k, sp = mkW('s', pers, 4, 6, vigor);
    for (i = 0; i < n; i++) { k = L.pickState(sp, { grid: g, occupied: {}, beh: beh }, T0, rng); cnt[k] = (cnt[k] || 0) + 1; }
    Object.keys(cnt).forEach(function (kk) { cnt[kk] /= n; });
    return cnt;
  }
  function g0(o, k) { return o[k] || 0; }

  /* ---- 權重：時段、活力、家具、性格 */
  var N = 6000;
  var day = share(null, 90, mkBeh({ night: false }), gNone, N, 1), night = share(null, 90, mkBeh({ night: true, hour: 23 }), gNone, N, 1);
  check('夜晚比白天更常打盹（打盹占比 ≥ 1.5 倍）', g0(night, 'nap') > g0(day, 'nap') * 1.5, g0(day, 'nap').toFixed(3) + '→' + g0(night, 'nap').toFixed(3));
  check('白天比夜晚更常探索', g0(day, 'explore') > g0(night, 'explore') * 1.5, g0(day, 'explore').toFixed(3) + ' vs ' + g0(night, 'explore').toFixed(3));
  var tired = share(null, 30, mkBeh(), gNone, N, 2), fresh = share(null, 90, mkBeh(), gNone, N, 2);
  check('活力低（30）比活力高（90）更常打盹，且少玩', g0(tired, 'nap') > g0(fresh, 'nap') * 2 && g0(tired, 'play') < g0(fresh, 'play'), g0(tired, 'nap').toFixed(3) + ' vs ' + g0(fresh, 'nap').toFixed(3));
  var withToy = share('active', 70, mkBeh(), gToy, N, 3), noToy = share('active', 70, mkBeh(), gNone, N, 3);
  check('房間有玩具：更常玩耍（占比 ≥ 1.4 倍）', g0(withToy, 'play') > g0(noToy, 'play') * 1.4, g0(noToy, 'play').toFixed(3) + '→' + g0(withToy, 'play').toFixed(3));
  var wBowl = share('foodie', 70, mkBeh(), gBowl, N, 4), wNoBowl = share('foodie', 70, mkBeh(), gNone, N, 4);
  check('沒有食碗就不會進食；有食碗才會', g0(wNoBowl, 'eat') === 0 && g0(wBowl, 'eat') > 0.1, g0(wBowl, 'eat').toFixed(3));
  var lazy = share('lazy', 70, mkBeh(), gNone, N, 5), act = share('active', 70, mkBeh(), gNone, N, 5), cur = share('curious', 70, mkBeh(), gNone, N, 5), shy = share('shy', 70, mkBeh(), gNone, N, 5);
  check('慵懶比活潑更常打盹（≥ 3 倍）', g0(lazy, 'nap') > g0(act, 'nap') * 3, g0(lazy, 'nap').toFixed(3) + ' vs ' + g0(act, 'nap').toFixed(3));
  check('好奇比害羞更常探索；活潑比慵懶更常玩', g0(cur, 'explore') > g0(shy, 'explore') * 1.5 && g0(act, 'play') > g0(lazy, 'play') * 2);
  var fd = share('foodie', 70, mkBeh(), gBowl, N, 6), ac2 = share('active', 70, mkBeh(), gBowl, N, 6);
  check('貪吃比活潑更常進食', g0(fd, 'eat') > g0(ac2, 'eat') * 1.8, g0(fd, 'eat').toFixed(3) + ' vs ' + g0(ac2, 'eat').toFixed(3));
  var nightAct = share('active', 70, mkBeh({ night: true }), gNone, N, 7), nightLazy = share('lazy', 70, mkBeh({ night: true }), gNone, N, 7), dayAct = share('active', 70, mkBeh(), gNone, N, 7);
  check('唱歌只在夜晚，且只有愛唱的性格（活潑會、慵懶不會）', g0(nightAct, 'sing') > 0.02 && g0(nightLazy, 'sing') === 0 && g0(dayAct, 'sing') === 0, g0(nightAct, 'sing').toFixed(3));
  var allFinite = true, combos = 0;
  [null, 'active', 'lazy', 'curious', 'shy', 'foodie', 'tsundere', 'tsun'].forEach(function (pe) { [20, 55, 90].forEach(function (v) { [false, true].forEach(function (ng) { [gNone, gToy, gBowl, gAll].forEach(function (gg) {
    var w = L.stateWeights(mkW('q', pe, 4, 6, v), { grid: gg, occupied: {}, beh: mkBeh({ night: ng, visitor: ng }) }, T0); combos++;
    Object.keys(w).forEach(function (k) { if (typeof w[k] !== 'number' || !isFinite(w[k]) || w[k] < 0) allFinite = false; });
  }); }); }); });
  check('各種組合下的權重都是有限的非負數（' + combos + ' 組）', allFinite);
  check('只有遊蕩會挑下一件事：其他狀態結束都回到遊蕩', (function () { var w = mkW('r', 'active', 4, 6, 80); w.mode = 'play'; return L.pickState(w, { grid: gNone, occupied: {}, beh: mkBeh() }, T0, L.mulberry32(1)) === 'wander'; })());

  /* ---- 害羞遇訪客躲 */
  function runSteps(sp, beh, g, n, dt, t0, rng, others) {
    var t = t0, i, acts = [], list = others || [sp];
    for (i = 0; i < n; i++) {
      beh.others = list;
      acts.push(L.stepWalker(sp, { grid: g, occupied: occOf(list, sp), beh: beh }, t, rng));
      t += dt;
    }
    return { acts: acts, t: t };
  }
  var shyW = mkW('a', 'shy', 1, 7, 80), shyRng = L.mulberry32(9), nestC = lay.areas.nest;
  var r1 = runSteps(shyW, mkBeh({ visitor: true }), gNone, 1, 500, 1000, shyRng);
  check('有訪客時害羞的立刻轉成躲藏', r1.acts[0] === 'enter:hide' && shyW.mode === 'hide', shyW.mode);
  var r2 = runSteps(shyW, mkBeh({ visitor: true }), gNone, 120, 500, r1.t, shyRng);
  check('躲到窩裡，訪客還在就一直躲（超過原本的持續時間也不出來）', shyW.mode === 'hide' && shyW.x === nestC.x && shyW.y === nestC.y && r2.t - 1000 > 30000, shyW.mode + '@' + shyW.x + ',' + shyW.y);
  var r3 = runSteps(shyW, mkBeh({ visitor: false }), gNone, 60, 1000, r2.t, shyRng);
  check('訪客走了之後會出來（不再躲藏）', r3.acts.some(function (a) { return /^enter:/.test(a); }) && shyW.mode !== 'hide', shyW.mode);
  var boldW = mkW('b', 'active', 1, 7, 80), rb = runSteps(boldW, mkBeh({ visitor: true }), gNone, 300, 700, 1000, L.mulberry32(10)), everHid = false;
  check('不害羞的有訪客也不躲', boldW.mode !== 'hide' && !rb.acts.some(function (a) { return a === 'enter:hide'; }) && !everHid);

  /* ---- 同房兩隻：一起玩 */
  function togetherRun(vA, vB, seed) {
    var a = mkW('a', null, 2, 5, vA), b = mkW('b', null, 3, 5, vB), rng = L.mulberry32(seed), beh = mkBeh({ others: [a, b] }), t = 1000, i, seen = null, clash = 0, sideAdj = false, chaseMoves = 0, lastA = a.x + ',' + a.y;
    for (i = 0; i < 6000; i++) {
      L.stepWalker(a, { grid: gNone, occupied: occOf([a, b], a), beh: beh }, t, rng);
      L.stepWalker(b, { grid: gNone, occupied: occOf([a, b], b), beh: beh }, t, rng);
      if (a.x === b.x && a.y === b.y) clash++;
      if (a.mode === 'together' && b.mode === 'together' && a.partner === 'b' && b.partner === 'a') {
        seen = seen || { style: a.style, at: i };
        if (a.style === 'side' && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) sideAdj = true;
        if (a.style === 'chase' && (a.x + ',' + a.y) !== lastA) chaseMoves++;
      }
      lastA = a.x + ',' + a.y;
      t += 500;
    }
    return { seen: seen, clash: clash, sideAdj: sideAdj, chaseMoves: chaseMoves };
  }
  var tg1 = togetherRun(80, 80, 21), tg2 = togetherRun(45, 45, 22);
  check('同房兩隻靠近時會一起玩（互相指定對方、同時進入 together）', tg1.seen && tg2.seen, JSON.stringify([tg1.seen, tg2.seen]));
  check('活力夠：追逐（有在跑）；活力偏低：並排靠著休息（相鄰）', tg1.seen && tg1.seen.style === 'chase' && tg1.chaseMoves > 0 && tg2.seen && tg2.seen.style === 'side' && tg2.sideAdj, JSON.stringify([tg1, tg2]));
  check('一起玩的時候兩隻從不疊在同一格', tg1.clash === 0 && tg2.clash === 0);

  /* ---- 離開一天回來：想你了 */
  var missW = mkW('m', 'tsundere', 1, 7, 80), missBeh = mkBeh({ away: true }), missRng = L.mulberry32(31), enters = 0, tM = 1000, k2;
  var atPlayer = false, saidAt = null;
  for (k2 = 0; k2 < 300; k2++) { var a2 = L.stepWalker(missW, { grid: gNone, occupied: {}, beh: missBeh }, tM, missRng); if (a2 === 'enter:missyou') enters++; tM += 500; if (!atPlayer && missW.mode === 'missyou' && missW.x === gNone.player.x && missW.y === gNone.player.y) { atPlayer = true; saidAt = missW.say && missW.say.text; } }
  check('玩家離開超過一天回來：先跑向玩家，到了說一句話（不責備）', enters === 1 && atPlayer && !!saidAt && !/(怎麼|為什麼|都不)/.test(String(saidAt)), enters + ' ' + atPlayer + ' ' + saidAt);
  check('想你了只發生一次，之後回到平常的樣子', missW.mode !== 'missyou' && missW.missDone === true);

  /* ---- 新東西：炫耀一次 */
  var showW = mkW('sh', 'curious', 4, 6, 80), showBeh = mkBeh({ newThing: { key: 'item:1' } }), showRng = L.mulberry32(32), shows = 0, tS = 1000, k3;
  for (k3 = 0; k3 < 120; k3++) { if (L.stepWalker(showW, { grid: gNone, occupied: {}, beh: showBeh }, tS, showRng) === 'enter:show') shows++; tS += 500; }
  check('有新家具或新情報：炫耀一次（原地轉圈），同一件不重複炫耀', shows === 1 && showW.shownKey === 'item:1');

  /* ---- 活力太低一定回窩睡，到恢復才醒 */
  var tiredW = mkW('t', 'active', 9, 5, 30), tRng = L.mulberry32(33), rt = runSteps(tiredW, mkBeh(), gNone, 100, 700, 1000, tRng);
  check('活力 30：立刻去窩裡打盹，而且睡到活力恢復', tiredW.mode === 'nap' && tiredW.x === nestC.x && tiredW.y === nestC.y && rt.acts[0] === 'enter:nap');
  tiredW.vigor = 85;
  var rt2 = runSteps(tiredW, mkBeh(), gNone, 80, 1000, rt.t, tRng);
  check('活力恢復後醒來去做別的事', tiredW.mode !== 'nap' || rt2.acts.some(function (a) { return /^enter:(?!nap)/.test(a); }));

  /* ---- 玩具與食碗：走過去 */
  var pl = mkW('p', 'active', 8, 3, 85), plRng = L.mulberry32(34), plBeh = mkBeh();
  L.enterState(pl, 'play', { grid: gToy, occupied: {}, beh: plBeh }, 1000, plRng);
  var toyPos = lay.spots.floor5, onToy = false, tq = 1100, q1;
  for (q1 = 0; q1 < 60; q1++) { L.stepWalker(pl, { grid: gToy, occupied: {}, beh: plBeh }, tq, plRng); tq += 700; if (pl.mode === 'play' && pl.x === toyPos.x && pl.y === toyPos.y) onToy = true; }
  check('進入玩耍：走到玩具上玩（停在玩具那一格）', onToy);
  var ea = mkW('e', 'foodie', 1, 6, 85), eaRng = L.mulberry32(35), eaBeh = mkBeh();
  L.enterState(ea, 'eat', { grid: gBowl, occupied: {}, beh: eaBeh }, 1000, eaRng);
  var bowlPos = lay.spots.floor4, onBowl = false, tb = 1100, q2;
  for (q2 = 0; q2 < 80; q2++) { L.stepWalker(ea, { grid: gBowl, occupied: {}, beh: eaBeh }, tb, eaRng); tb += 700; if (ea.mode === 'eat' && ea.x === bowlPos.x && ea.y === bowlPos.y) onBowl = true; }
  check('進入進食：走到食碗旁吃', onBowl);
  var noToy = mkW('nt', 'lively', 4, 6, 85), ntRng = L.mulberry32(36);
  L.enterState(noToy, 'play', { grid: gNone, occupied: {}, beh: mkBeh() }, 1000, ntRng);
  var seenCells = {}; runSteps(noToy, mkBeh(), gNone, 40, 600, 1100, ntRng, [noToy]);
  check('沒玩具的玩耍：追一個會換位置的光點', !!noToy.dot && noToy.target === null);
  var ex = mkW('x', 'curious', 4, 6, 85), exRng = L.mulberry32(37);
  L.enterState(ex, 'explore', { grid: gNone, occupied: {}, beh: mkBeh() }, 1000, exRng);
  runSteps(ex, mkBeh(), gNone, 60, 700, 1100, exRng, [ex]);
  check('探索：走到窗邊或家具旁停下看', ex.mode === 'explore' && ex.arrived === true && !!ex.target && ex.x === ex.target.x && ex.y === ex.target.y);

  /* ---- 種子可重現、所有狀態、不穿牆不疊格 */
  function trace(seed) {
    var a = mkW('a', 'curious', 4, 5, 75), b = mkW('b', 'foodie', 6, 6, 65), c = mkW('c', 'tsundere', 9, 6, 90), list = [a, b, c], rng = L.mulberry32(seed), beh = mkBeh({ others: list }), t = 1000, i, out = [];
    for (i = 0; i < 800; i++) {
      list.forEach(function (w) { L.stepWalker(w, { grid: gAll, occupied: occOf(list, w), beh: beh }, t, rng); });
      out.push(list.map(function (w) { return w.mode + w.x + w.y; }).join('/'));
      t += 500;
    }
    return out.join(';');
  }
  check('固定種子可重現：同種子同軌跡、不同種子不同軌跡', trace(7) === trace(7) && trace(7) !== trace(8));
  (function () {
    var list = [mkW('a', 'active', 4, 5, 80), mkW('b', 'lazy', 6, 6, 60), mkW('c', 'shy', 9, 6, 90)], rng = L.mulberry32(41), beh, t = 1000, i, modes = {}, clash = 0, badCell = 0, badJump = 0, prev = {};
    for (i = 0; i < 9000; i++) {
      beh = mkBeh({ others: list, night: Math.floor(i / 700) % 2 === 1, visitor: i % 3000 > 2400 });
      list.forEach(function (w) {
        var p0 = w.x + ',' + w.y;
        L.stepWalker(w, { grid: gAll, occupied: occOf(list, w), beh: beh }, t, rng);
        modes[w.mode] = (modes[w.mode] || 0) + 1;
        if (!gAll.isWalk(w.x, w.y)) badCell++;
        if (p0 !== w.x + ',' + w.y && Math.abs(w.x - parseInt(p0.split(',')[0], 10)) + Math.abs(w.y - parseInt(p0.split(',')[1], 10)) !== 1) badJump++;
      });
      if (list[0].x === list[1].x && list[0].y === list[1].y || list[0].x === list[2].x && list[0].y === list[2].y || list[1].x === list[2].x && list[1].y === list[2].y) clash++;
      t += 500;
    }
    var need = ['wander', 'nap', 'play', 'eat', 'explore', 'sing', 'together', 'hide'], miss = need.filter(function (k) { return !modes[k]; });
    check('長時間模擬：遊蕩、打盹、玩耍、進食、探索、唱歌、一起玩、躲藏都出現過', miss.length === 0, miss.join(',') + ' ' + JSON.stringify(modes));
    check('長時間模擬（9000 步×3 隻）：不踩進家具、不疊格、每次只移動一格', badCell === 0 && clash === 0 && badJump === 0, badCell + '/' + clash + '/' + badJump);
  })();

  /* ---- 台詞：依性格與狀態 */
  var ids6 = ['active', 'lazy', 'curious', 'shy', 'foodie', 'tsundere'], emptyLine = [], pools = {};
  ids6.forEach(function (pi) { L.STATE_NAMES.forEach(function (st) { var set = {}, k4, rg = L.mulberry32(5); for (k4 = 0; k4 < 30; k4++) set[L.pickLine(pi, st, rg)] = 1; if (!Object.keys(set).length || Object.keys(set).some(function (x) { return !x; })) emptyLine.push(pi + '/' + st); pools[pi + '/' + st] = Object.keys(set).sort().join('|'); }); });
  check('六種性格 × 十一個狀態都取得到台詞（每格至少 2 句）', emptyLine.length === 0 && ids6.every(function (pi) { return L.STATE_NAMES.every(function (st) { return pools[pi + '/' + st].split('|').length >= 2; }); }), emptyLine.join(','));
  check('同一個狀態：不同性格的台詞不一樣', ids6.every(function (a1, ia) { return ids6.every(function (b1, ib) { return ib <= ia || pools[a1 + '/nap'] !== pools[b1 + '/nap']; }); }));
  check('同一個性格：不同狀態的台詞不一樣', pools['active/nap'] !== pools['active/play'] && pools['tsundere/eat'] !== pools['tsundere/hide']);
  window.WALK_BEHAVIOR = { lines: { active: { nap: ['資料甲', '資料乙'] }, tsundere: { nap: ['資料丙'] } } };
  var dl = {}, rgl = L.mulberry32(3), kk;
  for (kk = 0; kk < 30; kk++) dl[L.pickLine('active', 'nap', rgl)] = 1;
  check('有 WALK_BEHAVIOR 台詞庫時以資料為準（沒有的格子才用備用）', Object.keys(dl).sort().join('|') === '資料乙|資料甲' && L.pickLine('tsundere', 'nap', rgl) === '資料丙' && /[一-鿿]/.test(L.pickLine('lazy', 'nap', rgl)));
  window.WALK_BEHAVIOR = { fps: 8, durations: { nap: [80, 200], play: [40, 100] }, transitions: { wander: { nap: 5, play: 1 } }, labels: { nap: '睡著了' } };
  var cf = L.behCfg(), nw = mkW('d', null, 4, 6, 70);
  L.enterState(nw, 'nap', { grid: gNone, occupied: {}, beh: mkBeh({ cfg: cf }) }, 5000, L.mulberry32(1));
  check('WALK_BEHAVIOR 的持續步數（8 FPS）換算成毫秒、權重照資料', cf.dur.nap[0] === 10000 && cf.dur.nap[1] === 25000 && cf.dur.play[0] === 5000 && cf.weights.nap === 5 && cf.weights.eat === undefined && nw.stateUntil - 5000 >= 10000 && nw.stateUntil - 5000 <= 25000);
  nw.mode = 'nap';
  check('狀態文字讀資料的 labels（沒有才用備用）', L.stateTextOf(nw) === '睡著了' && L.stateTextOf({ mode: 'sing' }) === '在哼歌');
  if (saveBeh === undefined) delete window.WALK_BEHAVIOR; else window.WALK_BEHAVIOR = saveBeh;
  return { gridWith: gridWith, mkW: mkW, mkBeh: mkBeh };
})();

/* ================================================================== 13d. 房間畫面：形態配件、點擊、禮物、離開一天、省電、卸載 */
(function () {
  var saved = { p: WalkStore.personalityOf, f: WalkStore.formOf, pet: WalkStore.pet, gift: WalkStore.giftToday, ci: WalkStore.checkIn, fs: WalkPix.formSprite, draw: WalkPix.draw };
  function restore() { WalkStore.personalityOf = saved.p; WalkStore.formOf = saved.f; WalkStore.pet = saved.pet; WalkStore.giftToday = saved.gift; WalkStore.checkIn = saved.ci; WalkPix.formSprite = saved.fs; WalkPix.draw = saved.draw; }
  function ctxText(cv) { return cv.getContext('2d')._calls.text; }

  /* 形態配件 */
  WalkStore.personalityOf = function () { return 'curious'; };
  WalkStore.formOf = function () { return 'care'; };
  var fsCalls = [], drawn = [], fakeOut = { matrix: ['................', '..11111111111...'], palette: { '1': '#e0405a' } };
  WalkPix.formSprite = function (m, pal, id) { fsCalls.push([m, pal, id]); return fakeOut; };
  WalkPix.draw = function (c, matrix, pal) { drawn.push(matrix); return saved.draw.apply(this, arguments); };
  var m1 = mountOwn('f1', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var i;
  for (i = 0; i < 20; i++) m1.inst.tick(T + i * 130);
  check('有形態：繪製時呼叫 WalkPix.formSprite(矩陣, 調色盤, 形態 id)', fsCalls.length >= 1 && fsCalls[0][2] === 'care' && Array.isArray(fsCalls[0][0]));
  check('形態圖只算一次，之後重複使用（不是每格重算）', fsCalls.length <= 2, fsCalls.length);
  check('畫到畫面上的是 formSprite 回傳的圖', drawn.indexOf(fakeOut.matrix) >= 0);
  WalkStore.formOf = function () { return null; };
  fsCalls.length = 0;
  m1.inst.refresh();
  for (i = 0; i < 5; i++) m1.inst.tick(T + 5000 + i * 130);
  check('沒有形態（還沒成體）時不呼叫 formSprite', fsCalls.length === 0);
  m1.inst.unmount();
  restore();

  /* 點擊：撒嬌、台詞氣泡、狀態文字 */
  WalkStore.personalityOf = function () { return 'tsundere'; };
  var m2 = mountOwn('f2', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var w2 = m2.inst.view.walkers()['sp_a'], petN = 0, origPet = WalkStore.pet;
  WalkStore.pet = function (id) { petN++; return origPet.call(WalkStore, id); };
  m2.inst.tick(T + 300);
  check('狀態文字顯示小精靈名稱與目前在做什麼', /鹿影：/.test(m2.inst.statusText()) && m2.inst.statusText().length > 4, m2.inst.statusText());
  m2.inst.view.clickAt(w2.x * 16 + 8, w2.y * 16 + 8);
  check('被點到：呼叫 pet、轉成撒嬌、狀態文字變「想讓你摸摸」', petN === 1 && w2.mode === 'cuddle' && /想讓你摸摸/.test(m2.inst.statusText()) && WalkRoom.stateText('sp_a') === '想讓你摸摸', m2.inst.statusText());
  m2.inst.tick(T + 400);
  var said = w2.say && w2.say.text;
  check('氣泡台詞畫在畫面上（canvas 文字）', !!said && ctxText(m2.inst.view.canvas).indexOf(String(said).slice(0, 14)) >= 0, said);
  m2.inst.tick(T + 9000);
  check('撒嬌結束後回到平常的狀態', w2.mode !== 'cuddle');
  WalkStore.pet = function () { return { ok: true, delta: 0, vigor: 70, responded: false, cold: true, reaction: '哼，別碰我' }; };
  var w2b = m2.inst.view.walkers()['sp_a'];
  m2.inst.view.clickAt(w2b.x * 16 + 8, w2b.y * 16 + 8);
  check('傲嬌前幾次冷淡：用 store 回的反應當台詞，不顯示愛心也不加活力', w2b.say.text === '哼，別碰我' && w2b.cold === true && /哼，別碰我/.test(m2.inst.message()) && m2.inst.view.floatsCount() === 0, m2.inst.message());
  WalkStore.pet = function () { return { ok: true, delta: -2, vigor: 60, annoyed: true, responded: false, reaction: '摸太多啦' }; };
  var w2c = m2.inst.view.walkers()['sp_a'];
  m2.inst.view.clickAt(w2c.x * 16 + 8, w2c.y * 16 + 8);
  check('連摸太多次（store 回 annoyed）：小精靈跑去躲', w2c.mode === 'hide' && w2c.say.text === '摸太多啦');
  m2.inst.unmount();
  check('卸載後狀態登記清掉', WalkRoom.stateText('sp_a') === null && WalkRoom.stateOf('sp_a') === null);
  restore();

  /* 空地點擊：附近的小精靈走過來 */
  WalkStore.personalityOf = function () { return 'active'; };
  var m3 = mountOwn('f3', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var w3 = m3.inst.view.walkers()['sp_a'], gr = m3.inst.view.grid(), target = null, cx, cy;
  w3.x = 1; w3.y = 7; w3.fromX = 1; w3.fromY = 7; w3.mode = 'wander'; w3.vigor = 80;
  for (cx = 0; cx < gr.w && !target; cx++) for (cy = 0; cy < gr.h && !target; cy++) if (gr.isWalk(cx, cy) && Math.abs(cx - 1) + Math.abs(cy - 7) === 5) target = { x: cx, y: cy };
  m3.inst.view.clickAt(target.x * 16 + 8, target.y * 16 + 8);
  var reached3 = false;
  for (i = 0; i < 40; i++) { m3.inst.tick(T + 200 + i * 600); if (w3.mode === 'cuddle' && w3.x === target.x && w3.y === target.y) reached3 = true; }
  check('點空地：小精靈走過去撒嬌', reached3, w3.mode + '@' + w3.x + ',' + w3.y);
  m3.inst.unmount();
  restore();

  /* 每日小禮物 */
  var giftCalls = 0;
  WalkStore.personalityOf = function () { return 'foodie'; };
  WalkStore.giftToday = function () { giftCalls++; return { ok: true, id: 'sp_a', gift: { kind: 'food', id: 'f1', name: '蜜餞' }, gifts: [{ id: 'sp_a', gift: { kind: 'food', id: 'f1', name: '蜜餞' } }] }; };
  var m4 = mountOwn('f4', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var w4 = m4.inst.view.walkers()['sp_a'];
  for (i = 0; i < 30; i++) m4.inst.tick(T + i * 150);
  check('進房間時問一次每日小禮物，有禮物就顯示小圖示與一句話', giftCalls === 1 && /蜜餞/.test(m4.inst.message()) && /🎁/.test(m4.inst.message()) && w4.giftUntil > T && !!w4.say && /蜜餞/.test(WalkRoom.lastGift().text), m4.inst.message());
  m4.inst.unmount();
  check('卸載後不再保留今天的禮物資訊', WalkRoom.lastGift() === null);
  WalkStore.giftToday = function () { giftCalls++; return { ok: false, reason: 'already' }; };
  var m4b = mountOwn('f4b', {}, function () { WalkStore.chooseStarter('sp_a'); });
  check('沒有禮物（今天領過或機率沒中）：不顯示禮物', m4b.inst.gift() === null && !/🎁/.test(m4b.inst.message()));
  m4b.inst.unmount();
  var m4c = mountOwn('f4c', { noGift: true }, function () { WalkStore.chooseStarter('sp_a'); }), before = giftCalls;
  check('opts.noGift 可關掉領禮物', giftCalls === before);
  m4c.inst.unmount();
  restore();

  /* 離開超過一天再回來 */
  WalkStore.personalityOf = function () { return 'tsundere'; };
  var m5 = mountOwn('f5', { lastSeen: function () { return T - 2 * 86400000; } }, function () { WalkStore.chooseStarter('sp_a'); });
  var w5 = m5.inst.view.walkers()['sp_a'];
  m5.inst.tick(T + 100);
  check('離開兩天再進房間：小精靈跑來想你', m5.inst.away() === true && w5.mode === 'missyou' && /想找你玩/.test(m5.inst.statusText()), w5.mode);
  for (i = 0; i < 60; i++) m5.inst.tick(T + 200 + i * 500);
  var pl5 = m5.inst.view.grid().player;
  check('跑到玩家那邊並說話，之後回到平常', w5.missDone === true && w5.mode !== 'missyou');
  m5.inst.unmount();
  var m6 = mountOwn('f6', { lastSeen: function () { return T - 3600000; } }, function () { WalkStore.chooseStarter('sp_a'); });
  m6.inst.tick(T + 100);
  check('才離開一小時：不會想你了', m6.inst.away() === false && m6.inst.view.walkers()['sp_a'].mode !== 'missyou');
  m6.inst.unmount();
  WalkStore.checkIn = function () { return { missed: ['sp_a'], ticks: { sp_a: 60 } }; };
  var m7 = mountOwn('f7', {}, function () { WalkStore.chooseStarter('sp_a'); });
  m7.inst.tick(T + 100);
  check('用 WalkStore.checkIn 回報的「很久沒來」小精靈來決定誰想你', m7.inst.view.walkers()['sp_a'].mode === 'missyou');
  m7.inst.unmount();
  restore();

  /* 訪客在：害羞的躲起來（參觀別人的房間） */
  (function () {
    resetDom();
    freshStore('guest2');
    WalkStore.chooseStarter('sp_a');
    global.localStorage.setItem('walkstore_pub_hostS', JSON.stringify({ nick: '小害羞', dexPct: 5, spots: {}, spirits: [{ id: 'sp_a', stage: 'baby', pers: 'shy' }, { id: 'sp_b', stage: 'adult', pers: 'active', form: 'adv' }], window: 'day', open: 'all', guestBook: true }));
    var c = container(), st = WalkRoom.mountStreet(c, { now: function () { return T; }, seed: 'vs', listRooms: function (tab, cb) { cb([{ uid: 'hostS', nick: '小害羞' }]); } });
    click(findBtn(c, '小害羞'));
    var v = st.detail().view, wa = v.walkers()['sp_a'], wb = v.walkers()['sp_b'];
    v.tick(T + 100); v.tick(T + 600);
    check('參觀別人的房間：害羞的小精靈躲起來，活潑的照常', wa.mode === 'hide' && wb.mode !== 'hide', wa.mode + '/' + wb.mode);
    st.unmount();
  })();

  /* 省電：文字狀態保留、動畫停止；卸載乾淨 */
  WalkStore.personalityOf = function () { return 'lazy'; };
  var saver = false;
  var m8 = mountOwn('f8', { isSaver: function () { return saver; } }, function () { WalkStore.chooseStarter('sp_a'); });
  for (i = 0; i < 6; i++) m8.inst.tick(T + i * 200);
  var txt = m8.inst.statusText(), calls0 = ctxText(m8.inst.view.canvas).length, fr0 = m8.inst.view.frames();
  saver = true;
  m8.inst.view.stop(); m8.inst.view.start();
  advance(6000);
  check('省電模式：動畫停止（不畫、不排 rAF），但狀態文字還在', m8.inst.view.frames() === fr0 && rafCount() === 0 && m8.inst.statusText() === txt && txt.length > 0, txt);
  m8.inst.unmount();
  check('卸載後無殘留（計時器、rAF、監聽、狀態登記）', timerCount() === 0 && rafCount() === 0 && docListenerCount() === 0 && WalkRoom.stateText('sp_a') === null);
  restore();
})();

/* ================================================================== 13d2. 進房間時補播進化 */
(function () {
  var orig = WalkStore.takeEvolutions, calls = 0, pers = WalkStore.personalityOf;
  WalkStore.takeEvolutions = function () { calls++; return [{ type: 'evolve', id: 'sp_a', from: 'baby', to: 'adult', form: 'care' }]; };
  var m = mountOwn('ev1', {}, function () { WalkStore.chooseStarter('sp_a'); });
  var w = m.inst.view.walkers()['sp_a'];
  check('進房間：問一次還沒播過的進化，顯示訊息並讓該隻閃光', calls === 1 && /進化了/.test(m.inst.message()) && w.flashUntil > T, m.inst.message());
  m.inst.tick(T + 100);
  check('進化閃光期間畫面照常繪製（不出錯）', m.inst.view.frames() >= 1);
  m.inst.unmount();
  WalkStore.takeEvolutions = orig;
  var m2 = mountOwn('ev2', {}, function () { WalkStore.chooseStarter('sp_a'); });
  check('沒有待播進化時沒有進化訊息', !/進化了/.test(m2.inst.message()));
  m2.inst.unmount();
})();

/* ================================================================== 13e. 用真資料檔整合（walk_data_traits.js 存在才跑） */
(function () {
  var f = path.join(__dirname, '..', 'js', 'walk_data_traits.js');
  if (!fs.existsSync(f)) { console.log('SKIP  walk_data_traits.js 還不存在，略過行為資料整合'); return; }
  require(f);
  var B = window.WALK_BEHAVIOR, cf = L.behCfg();
  check('真資料：持續時間用 durations（8 FPS 步數）換算成毫秒', cf.fromData && cf.dur.wander[0] === 3000 && cf.dur.wander[1] === 10000 && cf.dur.nap[1] === 25000, JSON.stringify(cf.dur.wander));
  var tids = window.WALK_TRAITS.map(function (t) { return t.id; }), missing = [];
  tids.forEach(function (pi) { L.STATE_NAMES.forEach(function (st) { var rg = L.mulberry32(1), s1 = L.pickLine(pi, st, rg); if (!B.lines[pi] || !B.lines[pi][st] || B.lines[pi][st].indexOf(s1) < 0) missing.push(pi + '/' + st); }); });
  check('真資料：六種性格 × 十一個狀態的台詞都取自 WALK_BEHAVIOR.lines', tids.length === 6 && missing.length === 0, missing.join(','));
  check('真資料：傲嬌的性格 id（tsundere）歸類成傲嬌，活潑（active）歸類成活潑', L.archOf('tsundere') === 'tsun' && L.archOf('active') === 'lively' && L.archOf('shy') === 'shy');
  /* 用真資料與真的 WalkStore（性格、形態、禮物、撫摸規則）跑一遍 */
  resetDom();
  freshStore('real2', { now: function () { return T; } });
  WalkStore.chooseStarter('sp_a');
  var pers = WalkStore.personalityOf('sp_a'), c2 = container(), inst = WalkRoom.mount(c2, { now: function () { return T; }, seed: 'real2' }), w = inst.view.walkers()['sp_a'], j, bad = 0;
  check('真資料：房間裡的小精靈拿到 WalkStore.personalityOf 的性格', !!pers && w.pers === pers && w.arch !== 'plain', pers + '/' + (w && w.arch));
  for (j = 0; j < 400; j++) { inst.tick(T + j * 700); if (!inst.view.grid().isWalk(w.x, w.y)) bad++; }
  check('真資料：跑 400 步沒有踩進家具，狀態文字用資料的 labels', bad === 0 && inst.statusText().indexOf('鹿影：') === 0, inst.statusText());
  var r = null;
  T += 400 * 700 + 5000;
  for (j = 0; j < 12 && !(r && r.kind === 'happy'); j++) { w = inst.view.walkers()['sp_a']; r = { kind: null }; inst.view.clickAt(w.x * 16 + 8, w.y * 16 + 8); if (w.lastTapKey === 'cuddle' || w.lastTapKey === 'tapcold' || w.lastTapKey === 'tapshy') break; }
  check('真資料：點小精靈有反應（撒嬌或性格反應）並顯示台詞', ['cuddle', 'tapcold', 'tapshy', 'tapannoyed'].indexOf(w.lastTapKey) >= 0 && !!w.say && !!w.say.text, w.lastTapKey);
  inst.unmount();
  check('真資料：卸載乾淨', timerCount() === 0 && rafCount() === 0 && docListenerCount() === 0);
})();

/* ================================================================== 13b. 用真資料檔整合（資料檔存在才跑） */
(function () {
  var base = path.join(__dirname, '..', 'js'), files = ['walk_data_spirit.js', 'walk_data_shop.js', 'walk_data_dex.js'], have = files.every(function (f) { return fs.existsSync(path.join(base, f)); });
  if (!have) { console.log('SKIP  真資料檔不齊，略過整合測試'); return; }
  delete global.WALK_ROOM_LAYOUT;
  files.forEach(function (f) { require(path.join(base, f)); });
  var lay = L.getLayout(), SH = window.WALK_SHOP, ids = WalkRoom.SPOTS, same = true;
  ids.forEach(function (s) { if (!lay.spots[s] || lay.spots[s].x !== L.DEFAULT_LAYOUT.spots[s].x || lay.spots[s].y !== L.DEFAULT_LAYOUT.spots[s].y) same = false; });
  check('真資料：WALK_SHOP.room 的 15 個擺放點（w1／f1／n1）對應成 wall1／floor1／window1', same && lay.walkRows && lay.wallRows === 3 && lay.cols === 12 && lay.rows === 8);
  var bad = [], kinds = { wall: 0, floor: 0, window: 0, pet: 0 };
  SH.furniture.forEach(function (it) { var k = L.itemKind(it); if (k !== it.spot) bad.push(it.id + ':' + k); else kinds[k]++; });
  check('真資料：36 件家具的類型都和資料的 spot 一致', bad.length === 0 && SH.furniture.length === 36 && kinds.wall === 12 && kinds.floor === 14 && kinds.window === 4 && kinds.pet === 6, bad.join(',') + JSON.stringify(kinds));
  var grid = L.buildGrid(lay, {}, null), start = grid.nest, seen = {}, q = [start], n = 0, total = 0, x, y;
  seen[start.x + ',' + start.y] = 1;
  while (q.length) { var c = q.shift(); n++; grid.neighbors(c.x, c.y).forEach(function (nb) { var k = nb.x + ',' + nb.y; if (!seen[k]) { seen[k] = 1; q.push(nb); } }); }
  for (y = 0; y < grid.h; y++) for (x = 0; x < grid.w; x++) if (grid.isWalk(x, y)) total++;
  check('真資料：空房間所有可走格連成一片（窩可達）', n === total && total === 54, n + '/' + total);

  /* 固定家具區不壓到任何擺放點 */
  var clash = [];
  keysOfObj(lay.areas).forEach(function (k) {
    var a = lay.areas[k];
    ids.forEach(function (sid) { var p = lay.spots[sid]; if (p.x >= a.x && p.x < a.x + a.w && p.y >= a.y && p.y < a.y + a.h) clash.push(k + '/' + sid); });
  });
  check('真資料：區域（成就牆、書櫃…）沒有壓到擺放點', clash.length === 0, clash.join(','));

  /* 真的掛上去：每種擺放點放一件，小精靈漫步 */
  resetDom();
  freshStore('real1');
  var starters = WalkStore.starters();
  WalkStore.chooseStarter(starters[0]);
  var w1 = SH.furniture.filter(function (i) { return i.spot === 'wall'; })[0], f1 = SH.furniture.filter(function (i) { return i.spot === 'floor'; }).slice(0, 2), win = SH.furniture.filter(function (i) { return i.spot === 'window'; })[0], pet = SH.furniture.filter(function (i) { return i.spot === 'pet'; })[0];
  [w1, f1[0], f1[1], win, pet].forEach(function (i) { WalkStore.grant(i.id, 1); });
  var c2 = container(), o = { now: function () { return T; }, seed: 'real' };
  var inst = WalkRoom.mount(c2, o);
  check('真資料：能放進對應擺放點', WalkStore.place('wall1', w1.id).ok && WalkStore.place('floor1', f1[0].id).ok && WalkStore.place('floor2', f1[1].id).ok && WalkStore.place('window1', win.id).ok && WalkStore.place('floor4', pet.id).ok);
  var g = inst.view.grid(), p1 = lay.spots.floor1, p4 = lay.spots.floor4;
  check('真資料：地面家具擋路、小精靈用品不擋路', !g.isWalk(p1.x, p1.y) && g.isWalk(p4.x, p4.y));
  var settings = ['auto', 'day', 'dusk', 'night', 'cloud', 'rain'], thrown = 0, i2;
  settings.forEach(function (sv) { WalkStore.setWindow(sv); try { for (i2 = 0; i2 < 30; i2++) inst.tick(T + i2 * 125); } catch (e) { thrown++; console.log(e.stack); } });
  check('真資料：窗外各種設定畫面都能畫（含窗景家具上的日夜蓋層）', thrown === 0);
  var w = inst.view.walkers()[starters[0]], badCell = 0, gg;
  for (i2 = 0; i2 < 800; i2++) { inst.tick(T + 100000 + i2 * 700); gg = inst.view.grid(); if (!gg.isWalk(w.x, w.y)) badCell++; }
  check('真資料：真的小精靈圖與家具圖下，漫步 800 步沒有踩進家具', badCell === 0 && w.sprite === undefined);
  inst.unmount();
  check('真資料：卸載乾淨', timerCount() === 0 && rafCount() === 0 && docListenerCount() === 0);
})();
function keysOfObj(o) { return Object.keys(o); }

/* ================================================================== 14. 檔案層面：沒有 alert/confirm/prompt、沒有輪詢 */
(function () {
  var src = fs.readFileSync(path.join(__dirname, '..', 'js', 'walk_room.js'), 'utf8');
  var stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  var n = (stripped.match(/(^|[^.\w])(alert|confirm|prompt)\s*\(/g) || []).length;
  check('walk_room.js 沒有 alert/confirm/prompt 呼叫', n === 0, n);
  check('沒有 setInterval（不輪詢、不持續寫）', !/setInterval\s*\(/.test(stripped));
  check('沒有 innerHTML（他人的暱稱只用 textContent 顯示）', !/innerHTML/.test(stripped));
  check('沒有 let/const/箭頭函式/模板字串（ES5）', !/(^|[^\w.])(let|const)\s+\w/.test(stripped) && !/=>/.test(stripped) && !/`/.test(stripped));
  var banned = ['備課', '產學案', '洞見', '形成式', '統計', '成大', '成功大學', 'NCKU', '泛論', '通論', '概論'];
  var found = banned.filter(function (w) { return src.indexOf(w) >= 0; });
  check('學生看得到的字沒有備課用語或真實院名', found.length === 0, found.join(','));
})();

console.log('\n共 ' + (pass + failN) + ' 項，通過 ' + pass + '，失敗 ' + failN);
process.exit(failN === 0 ? 0 : 1);
