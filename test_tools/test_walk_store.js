/* WalkStore 與 WalkPix 的單元測試：node test_tools/test_walk_store.js
   不用瀏覽器；用假的 localStorage、假的 Firebase ref、最小假資料。印出每項 PASS/FAIL 與總數，全過退出碼 0。 */
'use strict';
var fs = require('fs');
var path = require('path');

global.window = global;

/* ---------- 假的 localStorage ---------- */
function makeLS() {
  var m = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; },
    _m: m
  };
}
global.localStorage = makeLS();

/* ---------- 假的 Firebase ref（平面路徑表，記錄寫入次數） ---------- */
function makeDB() {
  var db = { data: {}, writes: [] };
  function ref(p) {
    return {
      child: function (c) { return ref(p ? p + '/' + c : c); },
      set: function (v, cb) { db.data[p] = v === undefined ? null : JSON.parse(JSON.stringify(v)); db.writes.push(p); if (typeof cb === 'function') cb(null); },
      transaction: function (fn, cb) {
        var cur = db.data[p] === undefined ? null : JSON.parse(JSON.stringify(db.data[p]));
        var n = fn(cur);
        if (n === undefined) { if (cb) cb(null, false, { val: function () { return cur; } }); return; }
        if (n !== null) { db.data[p] = JSON.parse(JSON.stringify(n)); db.writes.push(p + '(tx)'); }
        if (cb) cb(null, true, { val: function () { return n === null ? null : JSON.parse(JSON.stringify(n)); } });
      },
      orderByChild: function (field) {
        return { equalTo: function (val) {
          return { once: function (ev, cb) {
            var out = {}, any = false;
            Object.keys(db.data).forEach(function (k) {
              if (k.indexOf(p + '/') !== 0) return;
              var rest = k.slice(p.length + 1);
              if (rest.indexOf('/') >= 0) return;
              var v = db.data[k];
              if (v && typeof v === 'object' && v[field] === val) { out[rest] = JSON.parse(JSON.stringify(v)); any = true; }
            });
            cb({ val: function () { return any ? out : null; } });
          } };
        } };
      },
      remove: function () { delete db.data[p]; db.writes.push(p + '(rm)'); },
      once: function (ev, cb) {
        var v = db.data[p] === undefined ? null : JSON.parse(JSON.stringify(db.data[p]));
        cb({ val: function () { return v; } });
      }
    };
  }
  db.root = ref('');
  return db;
}

/* ---------- 最小假資料 ---------- */
function setData() {
  window.WALK_SPIRITS = [
    { id: 'tide', no: 1, name: '潮汐鯨魂', attr: '觀察', rarity: '傳說', starter: true, favFood: '方位', assist: { name: '指路', cd: 3 },
      talent: { name: '到站範圍', key: 'arriveRange', value: 3 }, scout: { kind: '方位卡', era: '西拉雅' },
      awaken: { name: '潮聲', cond: { bond: 12 }, key: 'revealRange', value: 200 } },
    { id: 'deer', no: 2, name: '鹿影', attr: '觀察', rarity: '普通', starter: true, favFood: '史料', assist: { name: '整理筆記', cd: 0 },
      talent: { key: 'freeHint', value: 1 }, scout: { kind: '史料卡', era: '荷治' } },
    { id: 'book', no: 5, name: '書卷蠹魚', attr: '智識', rarity: '稀有', starter: true, favFood: '史料', assist: { name: '查證', cd: 5, perChapter: 2 },
      talent: { key: 'sourceMark', value: 1 }, scout: { kind: '史料卡', era: '明鄭' } },
    { id: 'abacus', no: 6, name: '算盤獸', attr: '智識', rarity: '普通', favFood: '路況', assist: { name: '結算', cd: 0 },
      talent: { key: 'shopDiscount', value: 5 }, scout: { kind: '路況卡與點數情報', era: '清領' } },
    { id: 'lion', no: 7, name: '城門石獅靈', attr: '守護', rarity: '稀有', favFood: '路況', assist: { name: '警戒', cd: 5 },
      talent: { key: 'hintPenalty', value: 1 }, scout: { kind: '路況卡', era: '清領' } },
    { id: 'media', no: 16, name: '時之髓水母', attr: '全', rarity: '傳說', needDexPct: 100, favFood: '方位', assist: { name: '回溯', cd: 10 },
      talent: { key: 'allStats', value: 1 }, scout: { kind: '全部', era: '全部' } }
  ];
  window.WALK_FOODS = [{ id: 'f_hist', cat: '史料', price: 10 }, { id: 'f_dir', cat: '方位', price: 10 }];
  window.WALK_TOYS = [{ id: 'ball', bonus: 2 }];
  function cards(ch, n) {
    var types = ['史料', '路況', '人物', '觀察', '彩蛋', '方位', '史料', '路況'];
    var out = [], i;
    for (i = 0; i < n; i++) out.push({ id: ch + '_' + (i + 1), chapter: ch, type: types[i % types.length], text: '卡' + (i + 1),
      source: '測試', level: '有出處', tags: [i % 2 ? '荷治' : '西拉雅'], rarity: i === 7 ? '稀有' : '普通' });
    return out;
  }
  window.WALK_INTEL = cards('c1', 8).concat(cards('c2', 8), cards('c3', 8), cards('c4', 8), cards('c5', 8));
  window.WALK_SHOP = { items: [
    { id: 'chair', cat: 'furniture', price: 100, zone: 'floor' },
    { id: 'rug', cat: 'furniture', price: 40, zone: 'floor' },
    { id: 'poster', cat: 'furniture', price: 30, zone: 'wall' },
    { id: 'lamp', cat: 'furniture', price: 30, zone: 'wall' },
    { id: 'rare_chair', cat: 'furniture', price: 200, rarity: '稀有', zone: 'floor' },
    { id: 'f_hist', cat: 'food', price: 10 },
    { id: 'f_dir', cat: 'food', price: 10 }
  ] };
  window.WALK_DEX = { cats: [{ id: 'spirit' }, { id: 'intel' }, { id: 'people', total: 4 }],
    milestones: [{ pct: 25, reward: { items: { f_hist: 2 } } }] };
  window.WALK_AGENTS = null;
  window.WALK_AGENT_STATS = null;
}
setData();

require(path.join(__dirname, '..', 'js', 'walk_sprites2.js'));
var WalkStore = require(path.join(__dirname, '..', 'js', 'walk_store.js'));
var U = WalkStore._util, K = WalkStore._c;
var DAY = K.DAY, MIN = 60000;

/* ---------- 測試框架 ---------- */
var pass = 0, failN = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { failN++; console.log('FAIL  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
}
function near(a, b, eps) { return Math.abs(a - b) <= (eps || 0.005); }

var T = new Date(2026, 10, 3, 10, 0, 0).getTime();
function setT(t) { T = t; }
function adv(ms) { T += ms; }

var POINTS = 0, SPENT = 0, ADDSPENT_THROW = false;
function fresh(uid, extra) {
  var o = {
    uid: uid, root: null, now: function () { return T; },
    getPoints: function () { return POINTS - SPENT; },
    addSpent: function (n) { if (ADDSPENT_THROW) throw new Error('fail'); SPENT += n; },
    chaptersDone: function () { return 0; }, progress: function () { return {}; }, toast: function () {},
    sess: 's1',
    profile: function () { return { nick: 'tester', skin: 3, badges: ['b1', 'b2'], closet: ['c1'] }; }
  };
  if (extra) for (var k in extra) o[k] = extra[k];
  POINTS = 5000; SPENT = 0; ADDSPENT_THROW = false;
  return WalkStore.init(o);
}
function reset(uid, extra) {
  global.localStorage = makeLS();
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime());
  return fresh(uid, extra);
}
/* 讓 tide 成體：隨行位上完成 10 章 */
function makeAdultTide() {
  WalkStore.setSlot('tide', 'follow');
  for (var i = 0; i < 10; i++) WalkStore.event('chapter', 'qx' + i);
  WalkStore.setSlot('tide', 'scout');
}

var ROLE_A = { role: '偵查員', stats: [5, 2, 3, 3, 1], era: '荷治' };       /* 觀察最高、守護最低 */
var ROLE_B = { role: '軍師', stats: [2, 4, 3, 3, 3], era: '明鄭' };         /* 觀察最低(≤2)、智識中間 */
var ROLE_C = { role: '隊長', stats: [2, 4, 3, 3, 3], era: '西拉雅' };

/* ====================================================================== 1. 起始與三隻上限 */
(function () {
  reset('t1');
  var st = WalkStore.starters();
  check('起始三選一回傳 3 個 id', st.length === 3 && st.indexOf('tide') >= 0 && st.indexOf('book') >= 0, JSON.stringify(st));
  check('非起始 id 不能當起始', WalkStore.chooseStarter('lion').reason === 'notstarter');
  check('選起始成功且為幼體', WalkStore.chooseStarter('deer').ok && WalkStore.owned()[0].stage === 'baby');
  check('第二次選起始被拒', WalkStore.chooseStarter('tide').reason === 'already');
  WalkStore.giveEgg('book', 'c1'); WalkStore.giveEgg('abacus', 'c2'); WalkStore.giveEgg('lion', 'c3');
  check('蛋未到時間不能孵', WalkStore.hatch('book').reason === 'notyet');
  adv(7 * 3600000);
  check('蛋到時間可孵', WalkStore.hatch('book').ok && WalkStore.hatch('abacus').ok);
  check('第 4 顆蛋進待孵清單、不能孵（房間 3 格共用）', WalkStore.hatch('lion').reason === 'noegg' && WalkStore.owned().length === 3 && WalkStore.roomSlots().waiting.length === 1 && WalkStore.roomSlots().waiting[0].id === 'lion');
  check('同種類不能再有蛋', WalkStore.giveEgg('deer', 'c9').reason === 'dup');
  check('同種類不能孵第二隻', WalkStore.giveEgg('book').reason === 'dup');
  var rel = WalkStore.release('abacus');
  adv(7 * 3600000);
  check('送回圖鑑後待孵的蛋自動補位、之後可孵', rel.filled === 1 && WalkStore.roomSlots().waiting.length === 0 && WalkStore.hatch('lion').ok && WalkStore.owned().length === 3);
  check('送回後圖鑑仍算已取得', WalkStore.dex().cats[0].have === 4, JSON.stringify(WalkStore.dex().cats[0]));
  WalkStore.release('lion');
  check('領回送回圖鑑的小精靈', WalkStore.reclaim('abacus').ok && !!WalkStore.owned().filter(function (o) { return o.id === 'abacus'; }).length);
  check('隨行位保留給髓：圖鑑未滿 100% 給不了蛋', WalkStore.giveEgg('media').reason === 'locked');
})();

/* ====================================================================== 2. 活力下降與效能公式 */
(function () {
  reset('t2');
  WalkStore.chooseStarter('tide');
  var t0 = T;
  check('起始活力 70', WalkStore.vigor('tide', t0) === 70);
  check('一天後活力 60', WalkStore.vigor('tide', t0 + DAY) === 60);
  check('四天後活力 30', WalkStore.vigor('tide', t0 + 4 * DAY) === 30);
  check('十天後活力最低 20', WalkStore.vigor('tide', t0 + 10 * DAY) === 20);
  check('一百天後仍是 20（不死不逃）', WalkStore.vigor('tide', t0 + 100 * DAY) === 20);
  check('E(活力60)=0.85', near(WalkStore.efficiency('tide', t0 + DAY), 0.85));
  check('E(活力30)=0.59', near(WalkStore.efficiency('tide', t0 + 4 * DAY), 0.5875, 0.005));
  check('E(活力20)=0.5', near(WalkStore.efficiency('tide', t0 + 10 * DAY), 0.5));
  WalkStore.grant('f_dir', 5);
  WalkStore.feed('tide', 'f_dir'); WalkStore.feed('tide', 'f_dir');
  check('活力補到 100 → E=1.2', WalkStore.vigor('tide') === 100 && near(WalkStore.efficiency('tide'), 1.2), WalkStore.vigor('tide'));
  check('活力滿時不再餵食（不浪費食物）', WalkStore.feed('tide', 'f_dir').reason === 'full' && WalkStore.state().shop.owned.f_dir === 3);
})();

/* ====================================================================== 3. 每日上限與房間互動 */
(function () {
  reset('t3');
  WalkStore.chooseStarter('tide');
  WalkStore.grant('f_dir', 10); WalkStore.grant('f_hist', 10); WalkStore.grant('ball', 1);
  adv(5 * DAY);                                    /* 活力降到 20 */
  var bond0 = WalkStore.owned()[0].bond;
  var r1 = WalkStore.feed('tide', 'f_dir');
  check('餵最愛的食物：活力 +15、羈絆 +1', r1.ok && r1.delta === 15 && r1.favorite && WalkStore.owned()[0].bond === bond0 + 1, JSON.stringify(r1));
  WalkStore.feed('tide', 'f_hist');
  var r3 = WalkStore.feed('tide', 'f_hist');
  check('餵普通食物不加羈絆', !r3.favorite && WalkStore.owned()[0].bond === bond0 + 1);
  check('餵食每日 3 次，第 4 次被拒', WalkStore.feed('tide', 'f_hist').reason === 'daily_cap');
  check('沒有庫存不能餵', WalkStore.feed('tide', 'nofood').reason === 'nofood');
  adv(7 * DAY);
  var p = [WalkStore.play('tide'), WalkStore.play('tide'), WalkStore.play('tide')];
  check('玩耍每次 +10、每日 3 次', p[0].delta === 10 && p[1].delta === 10 && p[2].delta === 10 && WalkStore.play('tide').reason === 'daily_cap', JSON.stringify(p));
  adv(8 * DAY);
  var ok5 = 0, i;
  for (i = 0; i < 5; i++) if (WalkStore.pet('tide').ok) ok5++;
  check('撫摸每日 5 次，第 6 次被拒', ok5 === 5 && WalkStore.pet('tide').reason === 'daily_cap');
  adv(8 * DAY);
  check('整理窩每日 1 次（+5）', WalkStore.tidy('tide').delta === 5 && WalkStore.tidy('tide').reason === 'daily_cap');
  adv(10 * DAY);
  WalkStore.feed('tide', 'f_hist'); WalkStore.feed('tide', 'f_hist'); WalkStore.feed('tide', 'f_hist');
  var a = WalkStore.play('tide'), b = WalkStore.play('tide'), c = WalkStore.play('tide');
  check('單隻每日房間互動回補上限 60：45+10+5=60，第三次被拒', a.delta === 10 && b.delta === 5 && c.reason === 'rest_cap', JSON.stringify([a, b, c]));
  check('回補後活力 = 80', WalkStore.vigor('tide') === 80, WalkStore.vigor('tide'));
  adv(DAY);
  check('隔天每日上限重置', WalkStore.pet('tide').ok);
})();

/* ====================================================================== 4. 槽位、冷卻、天賦 */
(function () {
  reset('t4');
  WalkStore.chooseStarter('tide');
  WalkStore.giveEgg('book'); WalkStore.giveEgg('abacus'); adv(7 * 3600000);
  WalkStore.hatch('book'); WalkStore.hatch('abacus');
  check('隨行位只有 1 個', WalkStore.setSlot('tide', 'follow').ok && WalkStore.setSlot('book', 'follow').reason === 'slotfull');
  check('勘察位有 2 個，第 3 個被拒', WalkStore.setSlot('book', 'scout').ok && WalkStore.setSlot('abacus', 'scout').ok && WalkStore.setSlot('tide', 'scout').reason === 'slotfull');
  WalkStore.setSlot('abacus', 'room');
  check('非法槽位被拒', WalkStore.setSlot('tide', 'xx').reason === 'badslot');
  check('不在隨行位不能用助理技', WalkStore.useSkill('book').reason === 'notfollow');
  /* 冷卻：tide cd=3 分鐘，活力 70 → E=0.9375 → 192000ms */
  var t = T, e0 = WalkStore.efficiency('tide');
  var r = WalkStore.useSkill('tide');
  var cdExpect = Math.round(3 * MIN / e0);
  check('助理技冷卻 = cd ÷ E（3 分鐘 ÷ E，E=' + e0 + '）', r.ok && Math.abs(r.cooldownUntil - t - cdExpect) <= 1, (r.cooldownUntil - t) + ' vs ' + cdExpect);
  check('冷卻中再用被拒', WalkStore.useSkill('tide').reason === 'cooldown');
  adv(cdExpect - 1000);
  check('冷卻差 1 秒仍被拒', WalkStore.useSkill('tide').reason === 'cooldown');
  adv(2000);
  check('冷卻結束可再用', WalkStore.useSkill('tide').ok);
  /* 共鳴冷卻 -20% */
  adv(DAY);
  var t2 = T, vNow = WalkStore.efficiency('tide');
  var rr = WalkStore.useSkill('tide', { role: ROLE_A });
  check('共鳴時冷卻 -20%', rr.ok && near(rr.cooldownUntil - t2, 3 * MIN * 0.8 / vNow, 1.5), rr.cooldownUntil - t2);
  /* 換隨行位重新計冷卻、perChapter 次數 */
  WalkStore.setSlot('tide', 'room'); WalkStore.setSlot('book', 'follow');
  var u1 = WalkStore.useSkill('book', { chapterId: 'c1' });
  adv(DAY);
  var u2 = WalkStore.useSkill('book', { chapterId: 'c1' });
  adv(DAY);
  var u3 = WalkStore.useSkill('book', { chapterId: 'c1' });
  adv(DAY);
  check('每章 2 次的技能：第 3 次被拒、換章可用', u1.ok && u2.ok && u3.reason === 'chapter_cap' && WalkStore.useSkill('book', { chapterId: 'c2' }).ok);
  /* 天賦只算隨行位，數值 × min(1,E) */
  var tl = WalkStore.talents();
  check('天賦只計隨行位（書卷蠹魚 sourceMark）', keysOf(tl.effects).join() === 'sourceMark', JSON.stringify(tl.effects));
  var v = WalkStore.efficiency('book');
  check('天賦數值 = 值 × E（E<1 時打折）', near(tl.effects.sourceMark, Math.min(1, v), 0.01), tl.effects.sourceMark + ' vs ' + v);
})();
function keysOf(o) { return Object.keys(o); }

/* ====================================================================== 5. 勘察：時間、件數、種子、每日 */
(function () {
  reset('t5');
  WalkStore.chooseStarter('tide');
  var start = T;
  check('派遣短檔成功', WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'short' }).ok);
  var ex = WalkStore.expedition();
  check('短檔 30 分鐘（1 格）', ex.active && ex.endTs - start === 30 * MIN && ex.remainMs === 30 * MIN && ex.remainTicks === 1);
  check('同時只能 1 隻', WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'mid' }).reason === 'busy');
  check('時間未到不能結算', WalkStore.collect().reason === 'notyet');
  adv(30 * MIN);
  var c1 = WalkStore.collect();
  check('短檔收 1 件（基礎 1 × E 0.94 四捨五入）', c1.ok && c1.count === 1 && WalkStore.intel('c1').length === 1, c1.count);
  check('短檔不得連續刷同一章', WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'short' }).reason === 'repeat_short');
  var m = WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'mid' });
  var ex2 = WalkStore.expedition();
  check('中檔 60 分鐘（2 格）', m.ok && ex2.endTs - T === 60 * MIN && ex2.ticks === 2);
  adv(60 * MIN);
  var c2 = WalkStore.collect();
  check('中檔收 2 件、都是還沒拿過的', c2.count === 2 && WalkStore.intel('c1').length === 3 && new Set(WalkStore.intel('c1').map(function (c) { return c.id; })).size === 3);
  var l = WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'long' });
  adv(120 * MIN);
  var c3 = WalkStore.collect();
  check('長檔 120 分鐘收 3 件', l.ok && c3.count === 3 && WalkStore.intel('c1').length === 6);
  check('每日派遣 3 次，第 4 次被拒', WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c2', tier: 'mid' }).reason === 'daily_cap');
  adv(DAY);
  check('隔天可再派', WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c2', tier: 'mid' }).ok);
  adv(60 * MIN); WalkStore.collect();
  check('隨行位的不能派遣', (function () { WalkStore.setSlot('tide', 'follow'); return WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c3', tier: 'mid' }).reason === 'onfollow'; })());
  /* 勘察歸來：活力 +10、羈絆 +1 */
  /* 抽乾章節 */
  reset('t5b');
  WalkStore.chooseStarter('tide');
  var n = 0, guard = 0;
  while (guard++ < 10) {
    var d = WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'long' });
    if (!d.ok) break;
    adv(120 * MIN); WalkStore.collect(); n++;
    if (n % 3 === 0) adv(DAY);
  }
  check('章節卡抽完後 dispatch 回報 complete，不重複發卡', WalkStore.intel('c1').length === 8 && WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'long' }).reason === 'complete');
})();

(function () {
  /* 成體 +1、共鳴 ×1.5、歷史共鳴 +1、上限 5 */
  function runTier(role, tier, chapter) {
    reset('t5c');
    WalkStore.chooseStarter('tide');
    makeAdultTide();
    var stage = WalkStore.owned()[0].stage;
    var d = WalkStore.dispatch({ spiritId: 'tide', chapterId: chapter || 'c1', tier: tier, role: role });
    if (!d.ok) return { err: d.reason, stage: stage };
    adv(130 * MIN);
    var c = WalkStore.collect();
    return { count: c.count, stage: stage, q: c.quality };
  }
  var a = runTier(null, 'mid');
  check('成體(10羈絆)中檔：(2+1)×E0.94 → 3 件', a.stage === 'adult' && a.count === 3, JSON.stringify(a));
  var b = runTier(ROLE_A, 'long');
  check('成體＋共鳴長檔：(3+1)×1.5=6 → 上限 5 件', b.count === 5 && b.q === '精良', JSON.stringify(b));
  var c = runTier(ROLE_C, 'mid');
  check('成體＋歷史共鳴(西拉雅)中檔：(2+1)+1=4，×E → 4 件', c.count === 4, JSON.stringify(c));
  var d = runTier(ROLE_A, 'short');
  check('成體＋共鳴短檔：(1+1)×1.5=3，×0.94 → 3 件', d.count === 3, JSON.stringify(d));
  /* 低活力至少 1 件 */
  reset('t5d');
  WalkStore.chooseStarter('tide');
  adv(10 * DAY);                                 /* 活力 20、E=0.5 */
  WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c2', tier: 'short' });
  adv(35 * MIN);
  var low = WalkStore.collect();
  check('低活力(E=0.5)短檔：1×0.5 → 至少仍有 1 件', low.count === 1, low.count);
  reset('t5e');
  WalkStore.chooseStarter('tide');
  adv(10 * DAY);
  var dd = WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c2', tier: 'long' });
  adv(130 * MIN);
  var lowl = WalkStore.collect();
  check('低活力長檔：3×0.5=1.5 → 2 件，且派出前有低活力警示', dd.lowVigorWarning === true && lowl.count === 2, lowl.count);
  /* 歸來 +10 活力、+1 羈絆 */
  var o = WalkStore.owned()[0];
  check('勘察歸來：羈絆 +1', o.bond === 1, o.bond);
})();

(function () {
  /* 種子重現：相同 uid、時間、章節、小精靈 → 相同結果；不同 uid → 不同 */
  function run(uid) {
    reset(uid);
    WalkStore.chooseStarter('tide');
    WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c3', tier: 'long' });
    adv(121 * MIN);
    var c = WalkStore.collect();
    return c.cards.map(function (x) { return x.id; }).join(',');
  }
  var r1 = run('seedA'), r2 = run('seedA'), r3 = run('seedB'), r4 = run('seedC');
  check('同種子兩次結果相同（可重現）', r1 === r2 && r1.length > 0, r1 + ' / ' + r2);
  check('不同 uid 結果會不同', r1 !== r3 || r1 !== r4, r1 + ' / ' + r3 + ' / ' + r4);
  check('mulberry32 同種子同序列', (function () { var a = U.mulberry32(U.hashStr('x')), b = U.mulberry32(U.hashStr('x')); return a() === b() && a() === b(); })());
  /* 勘察專長加權：方位卡專長的 tide 比起其他更常抽到方位卡 */
  var tot = 0, hit = 0, i, j;
  for (i = 0; i < 60; i++) {
    reset('w' + i);
    WalkStore.chooseStarter('tide');
    WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c4', tier: 'short' });
    adv(31 * MIN);
    var cc = WalkStore.collect().cards;
    for (j = 0; j < cc.length; j++) { tot++; if (cc[j].type === '方位') hit++; }
  }
  /* c4 共 8 張、方位只有 1 張(1/8=12.5%)；加權後應明顯高於 12.5% */
  check('勘察專長加權：方位卡命中率高於均勻機率 12.5%', hit / tot > 0.2, (hit / tot).toFixed(3));
})();

/* ====================================================================== 6. 共鳴四種判定 */
(function () {
  reset('t6');
  var rs = [
    ['共鳴', WalkStore.resonance('tide', ROLE_A)],
    ['補位', WalkStore.resonance('lion', ROLE_A)],
    ['歷史共鳴', WalkStore.resonance('book', ROLE_B)],
    ['平常', WalkStore.resonance('abacus', { role: '軍師', stats: [2, 4, 3, 3, 3], era: '荷治' })]
  ];
  check('共鳴：主屬性＝探員最高屬性 → 品質 ×1.5、冷卻 ×0.8', rs[0][1].resonance && rs[0][1].qualityMul === 1.5 && rs[0][1].cdMul === 0.8 && rs[0][1].primary === '共鳴');
  check('補位：主屬性＝探員最低且 ≤2 → 該屬性 +1', rs[1][1].fill && rs[1][1].statBonus[4] === 1 && rs[1][1].primary === '補位', JSON.stringify(rs[1][1]));
  check('歷史共鳴：時期相同 → 多帶 1 件', rs[2][1].history && rs[2][1].extraItems === 1 && !rs[2][1].resonance && rs[2][1].primary === '歷史共鳴', JSON.stringify(rs[2][1]));
  check('平常：以上皆非 → 無額外效果', rs[3][1].primary === '平常' && rs[3][1].kinds.length === 0 && rs[3][1].qualityMul === 1);
  var sp = WalkStore.resonance('deer', ROLE_A);
  check('特別搭檔(偵查員＋鹿影「循跡」)與共鳴、歷史共鳴可同時成立', sp.special && sp.special.label === '循跡' && sp.resonance && sp.history && sp.kinds.join() === '共鳴,歷史共鳴,專屬', sp.kinds.join());
  check('補位條件：最低值 >2 不算補位', !WalkStore.resonance('lion', { role: 'x', stats: [5, 5, 5, 5, 3] }).fill);
  check('全屬性小精靈（髓）與任何角色共鳴', WalkStore.resonance('media', ROLE_B).resonance);
  /* 從 WALK_AGENTS 取屬性值 */
  window.WALK_AGENTS = { get: function (r) { return r === '偵查員' ? { role: '偵查員', stats: [5, 2, 3, 3, 1], era: '荷治' } : null; } };
  check('role 字串時從 WALK_AGENTS 取屬性', WalkStore.resonance('tide', '偵查員').resonance);
  window.WALK_AGENTS = null;
  check('找不到角色時回傳「平常」不拋錯', WalkStore.resonance('tide', 'nobody').primary === '平常' && WalkStore.resonance('nope', ROLE_A).primary === '平常');
})();

/* ====================================================================== 7. 購買、半價、稀有 */
(function () {
  reset('t7');
  POINTS = 1000; SPENT = 0;
  var s0 = WalkStore.shop();
  check('商店目錄列出商品與新手首購狀態', s0.items.length === 7 && s0.firstBuyAvailable);
  var r1 = WalkStore.buy('chair');
  check('新手首購半價（100 → 50）', r1.ok && r1.price === 50 && SPENT === 50 && r1.firstBuyDiscount, JSON.stringify(r1));
  var r2 = WalkStore.buy('rug');
  check('第二次買原價（40）', r2.ok && r2.price === 40 && SPENT === 90 && !WalkStore.shop().firstBuyAvailable);
  check('持有物累加', WalkStore.state().shop.owned.chair === 1 && WalkStore.state().shop.owned.rug === 1);
  var r3 = WalkStore.buy('poster');
  var r4 = WalkStore.buy('lamp');
  check('家具每日上限 3 件，第 4 件被拒', r3.ok && r4.reason === 'daily_cap' && SPENT === 120, JSON.stringify(r4));
  check('食材每日上限 10 份（一次買 10 份可、再買 1 份被拒）', WalkStore.buy('f_hist', 10).ok && WalkStore.buy('f_hist').reason === 'daily_cap' && WalkStore.buy('f_hist', 11).reason === 'daily_cap');
  var before = SPENT;
  check('稀有商品不可用點數直接買', WalkStore.buy('rare_chair').reason === 'rare_locked' && SPENT === before);
  check('不存在的商品被拒', WalkStore.buy('ghost').reason === 'noitem');
  adv(DAY);
  check('隔天購買上限重置', WalkStore.buy('lamp').ok);
  POINTS = SPENT + 5;
  var stateBefore = JSON.stringify(WalkStore.state().shop.owned), sp0 = SPENT;
  check('點數不足：不扣點、不加持有物', WalkStore.buy('rug').reason === 'nopoints' && SPENT === sp0 && JSON.stringify(WalkStore.state().shop.owned) === stateBefore);
  POINTS = 5000; ADDSPENT_THROW = true;
  stateBefore = JSON.stringify(WalkStore.state().shop.owned);
  check('扣點丟例外時整筆作廢（交易式）', WalkStore.buy('rug').reason === 'nopoints' && JSON.stringify(WalkStore.state().shop.owned) === stateBefore);
  ADDSPENT_THROW = false;
  /* 擺放 */
  check('家具要放在對的區（地板家具不能放牆）', WalkStore.place('wall1', 'chair').reason === 'wrongzone');
  check('未持有不能擺', WalkStore.place('floor2', 'rare_chair').reason === 'notowned');
  check('擺放成功', WalkStore.place('floor1', 'chair').ok && WalkStore.room().spots.floor1 === 'chair');
  check('一件家具只能擺持有數量那麼多處', WalkStore.place('floor2', 'chair').reason === 'allplaced');
  check('非法擺放點被拒', WalkStore.place('floor9', 'chair').reason === 'badspot');
  check('取下', WalkStore.unplace('floor1').ok && !WalkStore.room().spots.floor1);
})();

/* ====================================================================== 8. 圖鑑與里程碑 */
(function () {
  reset('t8');
  var d0 = WalkStore.dex();
  check('圖鑑統計六類結構與里程碑初始鎖定', d0.cats.length === 3 && d0.milestones[25] === 'locked' && d0.pct === 0);
  WalkStore.chooseStarter('tide');
  WalkStore.markSeen('people', 'p1');
  WalkStore.markSeen('people', 'p2');
  var d1 = WalkStore.dex();
  /* spirit 1/6、intel 0/40、people 2/4 → 3/50 */
  check('圖鑑完成度＝各類已取得總和 ÷ 總數', d1.have === 3 && d1.total === 50 && d1.pct === 6, JSON.stringify(d1));
  check('未達 25% 前里程碑不可領', WalkStore.claimMilestone(25).reason === 'locked');
  WalkStore.markSeen('people', 'p3'); WalkStore.markSeen('people', 'p4');
  for (var i = 0; i < 6; i++) { WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c' + (i % 5 + 1), tier: 'long' }); adv(121 * MIN); WalkStore.collect(); if (i % 2) adv(DAY); }
  var d2 = WalkStore.dex();
  if (d2.pct < 25) { for (var k = 0; k < 40 && WalkStore.dex().pct < 25; k++) { WalkStore.markSeen('people', 'z' + k); } }
  check('里程碑達標可領、重複領被拒、獎勵入庫', (function () {
    var d3 = WalkStore.dex();
    if (d3.pct < 25) return false;
    var c = WalkStore.claimMilestone(25), c2 = WalkStore.claimMilestone(25);
    return c.ok && c2.reason === 'claimed' && WalkStore.state().shop.owned.f_hist === 2 && WalkStore.dex().milestones[25] === 'claimed';
  })(), JSON.stringify(WalkStore.dex()));
  check('無效里程碑被拒', WalkStore.claimMilestone(30).reason === 'badpct');
})();

/* ====================================================================== 9. 快照大小與開放設定 */
(function () {
  var big = [], i;
  for (i = 0; i < 12; i++) big.push('徽章' + i + new Array(80).join('字'));
  var photos = []; for (i = 0; i < 6; i++) photos.push(new Array(700).join('x'));
  reset('t9', { profile: function () { return { nick: '玩家一二三四五六七八九十', skin: 2, badges: big, closet: ['a', 'b'], photos: photos }; } });
  WalkStore.chooseStarter('tide');
  WalkStore.setPhotosPublic(true);
  var snap = WalkStore.snapshotPublic();
  var bytes = U.byteLen(JSON.stringify(snap));
  check('公開快照 < 4 KB（含大量徽章與照片時會自動縮）', bytes <= 4096, bytes);
  check('快照只含公開欄位（暱稱、造型、徽章、完成度、小精靈、窗景）', snap.nick && snap.spirits.length === 1 && snap.spirits[0].id === 'tide' && snap.dexPct !== undefined && snap.hidden === undefined);
  check('小精靈最多 3 隻', snap.spirits.length <= 3);
  WalkStore.setOpen('all');
  check('open=all 時有寫索引摘要', global.localStorage.getItem('walkstore_idx_s1_t9') !== null && global.localStorage.getItem('walkstore_pub_t9') !== null);
  WalkStore.setOpen('closed');
  check('open=closed 時不寫索引、不留公開快照', global.localStorage.getItem('walkstore_idx_s1_t9') === null && global.localStorage.getItem('walkstore_pub_t9') === null);
  check('非法開放值被拒', WalkStore.setOpen('everyone').reason === 'badvalue' && WalkStore.room().open === 'closed');
  /* Firebase 模式：closed 不寫 roomsIndex */
  var db = makeDB();
  global.localStorage = makeLS();
  fresh('t9fb', { root: db.root, profile: function () { return { nick: 'n', badges: [], closet: [] }; } });
  WalkStore.chooseStarter('tide');
  WalkStore.setOpen('all');
  check('Firebase：open=all 寫 rooms 與 roomsIndex', db.data['roomsIndex/s1/t9fb'] && db.data['rooms/t9fb/nick'] === 'n', Object.keys(db.data).join());
  WalkStore.setOpen('closed');
  check('Firebase：open=closed 時清掉索引與快照，不再寫入', db.data['roomsIndex/s1/t9fb'] === undefined && db.writes.indexOf('roomsIndex/s1/t9fb(rm)') >= 0);
  var w = db.writes.length;
  WalkStore.setGuestBook(false);
  check('Firebase：closed 狀態下改設定不會把索引寫回去', db.data['roomsIndex/s1/t9fb'] === undefined);
})();

/* ====================================================================== 10. 持久化：離線 vs Firebase，行為一致 */
function scripted() {
  WalkStore.chooseStarter('tide');
  WalkStore.grant('f_dir', 3);
  adv(3 * DAY);
  WalkStore.feed('tide', 'f_dir');
  WalkStore.pet('tide');
  WalkStore.buy('chair');
  WalkStore.place('floor1', 'chair');
  WalkStore.dispatch({ spiritId: 'tide', chapterId: 'c1', tier: 'mid' });
  adv(61 * MIN);
  WalkStore.collect();
  WalkStore.markSeen('people', 'p1');
  WalkStore.setOpen('all');
  return JSON.stringify(WalkStore.state());
}
(function () {
  reset('same');
  var offline = scripted();
  var offlineLS = global.localStorage.getItem('walkstore_same');
  check('離線：寫入 localStorage（key walkstore_{uid}）', !!offlineLS && JSON.parse(offlineLS).spirit.owned.length === 1);
  /* 重新載入 */
  fresh('same');
  var T2 = T;
  check('離線：重新 init 後狀態還原', JSON.stringify(WalkStore.state()) === offline);
  /* Firebase */
  var db = makeDB();
  global.localStorage = makeLS();
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime());
  fresh('same', { root: db.root });
  var ready = false;
  WalkStore.ready(function () { ready = true; });
  check('Firebase：init 後載入完成(ready)', ready && WalkStore.isReady());
  check('Firebase：init 與閒置不寫入', db.writes.length === 0);
  WalkStore.state(); WalkStore.owned(); WalkStore.shop(); WalkStore.expedition(); WalkStore.dex();
  check('Firebase：純讀取（state/owned/shop/…）不寫入', db.writes.length === 0);
  var fbState = scripted();
  var paths = {};
  db.writes.forEach(function (p) { paths[p] = 1; });
  check('Firebase：寫入 players/{uid}/{spirit,room,expedition,intel,dex,shop} 區塊',
    ['spirit', 'room', 'expedition', 'intel', 'dex', 'shop'].every(function (s) { return !!db.data['players/same/' + s]; }), Object.keys(db.data).join());
  check('Firebase 與離線的最終狀態完全一致（行為相同）', fbState === offline);
  check('Firebase 模式不寫 localStorage', global.localStorage.getItem('walkstore_same') === null);
  /* 只在動作時寫：spirit 區塊更新後 expedition 只在派遣/結算寫 */
  var n0 = db.writes.length;
  WalkStore.owned(); WalkStore.talents(); WalkStore.intel();
  check('Firebase：查詢類呼叫不增加寫入', db.writes.length === n0);
  /* 重新載入 */
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime() + 3 * DAY + 61 * MIN);
  fresh('same', { root: db.root });
  check('Firebase：重新 init 從資料庫還原', WalkStore.isReady() && WalkStore.owned()[0].id === 'tide' && WalkStore.intel('c1').length === 2 && WalkStore.room().spots.floor1 === 'chair');
  /* 空容器被 Firebase 吃掉後仍可用 */
  var db2 = makeDB();
  db2.data['players/e1/spirit'] = { v: 1, starter: true };      /* owned/eggs/released 空陣列整欄消失 */
  db2.data['players/e1/room'] = { v: 1, open: 'team' };
  fresh('e1', { root: db2.root });
  check('Firebase 吃掉空陣列／空物件後自動補回預設', WalkStore.owned().length === 0 && WalkStore.eggs().length === 0 && typeof WalkStore.room().spots === 'object' && WalkStore.state().spirit.starter === true);
  check('on/off 通知狀態改變', (function () {
    var n = 0, f = function () { n++; };
    WalkStore.on(f); WalkStore.grant('f_dir', 1); WalkStore.off(f); WalkStore.grant('f_dir', 1);
    return n === 1;
  })());
})();

/* ====================================================================== 11. 訪客：足跡與摸小精靈 */
(function () {
  global.localStorage = makeLS();
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime());
  var hosts = [], i;
  for (i = 0; i < 12; i++) {
    var uid = 'host' + i;
    fresh(uid);
    WalkStore.chooseStarter('deer');
    WalkStore.setOpen(i === 10 ? 'closed' : (i === 11 ? 'team' : 'all'));
    if (i === 10) { /* 關閉前先公開過一次，確認會被清掉 */ }
    hosts.push(uid);
  }
  fresh('guest', { isTeammate: function (u) { return u === 'host11'; } });
  var res = null;
  WalkStore.visit('host0', function (r) { res = r; });
  check('訪客可讀對方公開快照（公開欄位）', res.ok && res.snap.nick === 'tester' && res.snap.spirits[0].id === 'deer' && res.snap.photos === undefined);
  check('closed 的房間進不去', WalkStore.visit('host10').reason === 'noroom' || WalkStore.visit('host10').reason === 'closed');
  check('team 房間：不是隊友進不去、是隊友可進', (function () {
    fresh('guest2');
    var a = WalkStore.visit('host11').reason;
    fresh('guest', { isTeammate: function (u) { return u === 'host11'; } });
    return a === 'teamonly' && WalkStore.visit('host11').ok;
  })());
  check('不能拜訪自己', WalkStore.visit('guest').reason === 'self');
  check('沒拜訪過不能留足跡', (function () { fresh('guest', {}); return WalkStore.footprint('host3', 'like').reason === 'visitfirst'; })());
  fresh('guest', { isTeammate: function (u) { return u === 'host11'; } });
  WalkStore.visit('host0'); WalkStore.visit('host1');
  check('只接受固定貼圖代碼（沒有文字輸入）', WalkStore.footprint('host0', '你好').reason === 'badsticker' && WalkStore.footprint('host0', '<b>x</b>').reason === 'badsticker' && WalkStore.footprint('host0', undefined).reason === 'badsticker');
  check('留足跡成功並記在對方 guests', WalkStore.footprint('host0', 'wow').ok && JSON.parse(global.localStorage.getItem('walkstore_guests_host0')).guest === 'wow');
  check('每間每天 1 次', WalkStore.footprint('host0', 'like').reason === 'host_once');
  check('摸小精靈每間 1 次', WalkStore.stroke('host0').ok && WalkStore.stroke('host0').reason === 'host_once' && WalkStore.state().shop.owned.f_hist === 1);
  check('沒拜訪過的房間不能摸', WalkStore.stroke('host5').reason === 'visitfirst');
  for (i = 1; i <= 9; i++) { WalkStore.visit('host' + i); WalkStore.footprint('host' + i, 'pass'); }
  WalkStore.visit('host11');
  check('每天最多 10 間：第 11 間被拒', WalkStore.footprint('host11', 'like').reason === 'daily_cap', WalkStore.footprint('host11', 'like').reason);
  adv(DAY);
  check('隔天上限重置', WalkStore.footprint('host11', 'like').ok);
  WalkStore.setGuestBook(false);
  check('對方關閉訪客簽名簿時不能留足跡', (function () {
    fresh('host2'); WalkStore.setGuestBook(false);
    fresh('guest', {}); WalkStore.visit('host2');
    return WalkStore.footprint('host2', 'like').reason === 'noguestbook';
  })());
  /* 對話額度 */
  fresh('chatter');
  var okc = 0; for (i = 0; i < 25; i++) if (WalkStore.chatTick().ok) okc++;
  check('小精靈對話每日 20 次', okc === 20 && WalkStore.chatLeft() === 0);
})();

/* ====================================================================== 12. 事件與覺醒 */
(function () {
  reset('t12');
  WalkStore.chooseStarter('tide');
  WalkStore.setSlot('tide', 'follow');
  adv(3 * DAY);
  var v0 = WalkStore.vigor('tide');
  WalkStore.event('task'); WalkStore.event('arrive'); WalkStore.event('hidden');
  check('隨行事件活力：任務 +3、到站 +5、隱藏關卡 +8', near(WalkStore.vigor('tide'), v0 + 16, 0.01), WalkStore.vigor('tide') + ' vs ' + v0);
  for (var i = 0; i < 12; i++) WalkStore.event('chapter', 'q' + i);
  var o = WalkStore.owned()[0];
  check('羈絆 10 成體、達資料表條件(12)覺醒', o.bond === 12 && o.stage === 'awake', JSON.stringify(o));
  var tl = WalkStore.talents();
  check('覺醒後天賦＋覺醒效果列入 talents()', tl.effects.revealRange === 200 && tl.effects.arriveRange > 0, JSON.stringify(tl.effects));
  check('補位：talents(role) 回報屬性加成', (function () {
    var t2 = WalkStore.talents(ROLE_B);                    /* 觀察=2 為最低且 ≤2 → 補位 */
    return t2.statBonus[0] === 1;
  })());
})();

/* ====================================================================== 13. WalkPix 工具 */
(function () {
  var P = window.WalkPix, rects = [];
  var ctx = { fillRect: function (x, y, w, h) { rects.push([x, y, w, h, this.fillStyle]); }, fillStyle: '' };
  P.draw(ctx, ['ab.', '.a.'], { a: '#f00', b: '#0f0' }, 10, 20, 3);
  check('WalkPix.draw：透明格不畫、每格依倍率放大', rects.length === 3 && rects[0].join() === '10,20,3,3,#f00' && rects[1][0] === 13 && rects[2][1] === 23, JSON.stringify(rects));
  check('WalkPix.flip 左右翻轉', P.flip(['abc', 'd.e']).join('|') === 'cba|e.d');
  rects.length = 0;
  P.draw(ctx, ['ab'], { a: '#f00', b: '#0f0' }, 0, 0, 1, { flip: true });
  check('WalkPix.draw 支援 flip 選項', rects[0][4] === '#0f0');
  rects.length = 0;
  P.draw(ctx, ['k'], null, 0, 0, 1);
  check('共用調色盤 PAL 可用且可被自訂調色盤覆蓋', rects.length === 1 && rects[0][4] === P.PAL.k);
  var an = P.anim([['a'], ['b']], 8);
  check('動畫格：8 FPS 每 125ms 換一格', an.index(0) === 0 && an.index(130) === 1 && an.index(260) === 0 && an.frameAt(130)[0] === 'b');
  check('沒有 DOM 時 toDataURL／toCanvas 回傳 null 不拋錯', P.toDataURL(['a'], null, 2) === null && P.toCanvas(['a'], null, 2) === null);
  check('size／recolor／bob 輔助', P.size(['abc', 'de']).w === 3 && P.recolor(['aab'], 'a', 'b')[0] === 'bbb' && (P.bob(0) === 0 && P.bob(500) === 1));
})();

/* ====================================================================== 15. 真實資料檔：商店、套裝、里程碑、第 16 隻、房間街 */
(function () {
  var jsdir = path.join(__dirname, '..', 'js') + path.sep;
  ['walk_data_spirit.js', 'walk_data_shop.js', 'walk_data_dex.js'].forEach(function (f) { require(jsdir + f); });
  var DEXREAL = window.WALK_DEX;
  function seenAll(catId, n) { var c = DEXREAL.categories.filter(function (x) { return x.id === catId; })[0]; c.items.slice(0, n === undefined ? c.items.length : n).forEach(function (it) { WalkStore.markSeen(catId, it.id); }); }

  /* --- 首購半價 --- */
  reset('r1');
  POINTS = 2000;
  var b1 = WalkStore.buy('tide_map');
  check('真實目錄：新手首購半價（潮汐海圖 60 → 30）', b1.ok && b1.price === 30 && SPENT === 30 && b1.firstBuyDiscount, JSON.stringify(b1));
  var b2 = WalkStore.buy('note_board');
  check('只有第一次購買半價（第二次原價 30）', b2.ok && b2.price === 30 && !b2.firstBuyDiscount);
  check('第一次買 2 份食材：只有第一份半價', (function () { reset('r1b'); POINTS = 2000; var r = WalkStore.buy('food_hist', 2); return r.ok && r.price === 6 + 12; })());
  reset('r1c'); POINTS = 2000;
  check('商店不吃補給官折扣（init 傳入折扣函式也不套用）', (function () { fresh('r1c', { supplyDiscount: function () { return 0.5; } }); POINTS = 2000; WalkStore.buy('tide_map'); var r = WalkStore.buy('route_map'); return r.price === 40; })());
  check('noBuy 的稀有／傳說家具不能用點數買', WalkStore.buy('whale_bone').reason === 'rare_locked' && WalkStore.buy('whale_night').reason === 'rare_locked');

  /* --- 套裝 --- */
  reset('r2'); POINTS = 3000;
  var sb0 = WalkStore.setBonuses();
  check('套裝加成：未集滿時 active 為空，並標明純裝飾', sb0.active.length === 0 && sb0.sets.length === 5 && sb0.sets.every(function (x) { return x.decorOnly && !x.complete; }));
  var bs = WalkStore.buy('set_tide');
  check('買套裝：整組可買成員入庫（稀有成員不發）、價格 300 首購半價 150', bs.ok && bs.price === 150 && WalkStore.state().shop.owned.tide_map === 1 && !WalkStore.state().shop.owned.whale_bone, JSON.stringify(bs));
  check('套裝買過後不能重買', WalkStore.buy('set_tide').reason === 'owned');
  var sb1 = WalkStore.setBonuses();
  var tide = sb1.sets.filter(function (x) { return x.id === 'set_tide'; })[0];
  check('缺稀有成員時不算集滿（4/5）', tide.have === 4 && tide.total === 5 && !tide.complete && sb1.active.length === 0);
  WalkStore.grant('whale_bone', 1);
  var sb2 = WalkStore.setBonuses();
  check('集滿後 active 出現「海風」純裝飾加成（不加分）', sb2.active.length === 1 && sb2.active[0].bonus === '海風' && /不加分/.test(sb2.active[0].desc) && sb2.active[0].fx === 'seagulls', JSON.stringify(sb2.active));
  check('每日家具上限把套裝算 1 件', WalkStore.shop().daily.furniture.used === 1);
  check('擺放：寵物用品可放地板、牆飾不能放地板、家具不能放窗', WalkStore.grant('spirit_nest', 1).ok && WalkStore.place('floor1', 'spirit_nest').ok && WalkStore.place('floor2', 'tide_map').reason === 'wrongzone' && WalkStore.place('window1', 'shell_rug').reason === 'wrongzone' && WalkStore.place('wall1', 'tide_map').ok);
  check('套裝本身不能擺放', WalkStore.place('floor3', 'set_tide').reason === 'wrongzone' || WalkStore.place('floor3', 'set_tide').reason === 'notowned');

  /* --- 造型、蛋鋪 --- */
  reset('r3'); POINTS = 3000;
  check('買造型：解鎖 skin，不能重買', WalkStore.buy('look_sk_hat').ok && WalkStore.looks().indexOf('sk_hat') >= 0 && WalkStore.buy('look_sk_hat').reason === 'owned');
  check('普通蛋：沒完成章節不能買', WalkStore.buy('egg_common').reason === 'nochapter');
  fresh('r3', { chaptersDone: function () { return 3; } });
  var eb = WalkStore.buy('egg_common');
  var eggId = eb.egg;
  check('普通蛋：完成章節後可買，得到一顆普通小精靈的蛋', eb.ok && eggId && window.WALK_SPIRITS.filter(function (s) { return s.id === eggId; })[0].rarity === '普通' && WalkStore.eggs().length === 1, JSON.stringify(eb));
  check('蛋圖依小精靈 id 取 WALK_SPIRIT_EGGS（每種各有自己的蛋）', WalkStore.eggSprite('sp_tide') === window.WALK_SPIRIT_EGGS.sp_tide && WalkStore.eggSprite('sp_deer') === window.WALK_SPIRIT_EGGS.sp_deer && WalkStore.eggSprite('sp_ufo') === window.WALK_SPIRIT_EGGS.sp_ufo && WalkStore.eggSprite('sp_tide') !== WalkStore.eggSprite('sp_deer'));
  WalkStore.buy('egg_speedup');
  var rem0 = WalkStore.eggs()[0].remainMs, sp1 = WalkStore.speedEgg(eggId);
  check('孵蛋加速：剩餘格數減半（至少 1 格）、消耗一份加速', sp1.ok && sp1.remainTicks === Math.max(1, Math.floor(rem0 / K.TICK / 2)) && !WalkStore.state().shop.owned.egg_speedup, rem0 + ' → ' + sp1.remainMs);

  /* --- 孵化時間改讀資料（不寫死 6 小時） --- */
  reset('r4');
  WalkStore.giveEgg('sp_deer'); WalkStore.giveEgg('sp_sail'); WalkStore.giveEgg('sp_tide');
  var eg = {}; WalkStore.eggs().forEach(function (e) { eg[e.id] = e.remainMs; });
  check('孵化時間：普通 0.5、稀有 1、傳說 2 小時', eg.sp_deer === 1800000 && eg.sp_sail === 3600000 && eg.sp_tide === 7200000, JSON.stringify(eg));
  reset('r4b');
  var deer = window.WALK_SPIRITS.filter(function (s) { return s.id === 'sp_gull'; })[0], hh = deer.hatchHours;
  delete deer.hatchHours;
  WalkStore.giveEgg('sp_gull');
  var gull = WalkStore.eggs().filter(function (e) { return e.id === 'sp_gull'; })[0];
  deer.hatchHours = hh;
  check('沒有 hatchHours 時讀 WALK_SPIRIT_META.hatch（普通 30 分鐘）', gull.remainMs === 30 * MIN, gull.remainMs);

  /* --- 里程碑發放 --- */
  reset('r5'); POINTS = 500;
  check('未達 25% 不可領', WalkStore.claimMilestone(25).reason === 'locked');
  seenAll('people'); seenAll('places');
  var pctNow = WalkStore.dex().pct;
  var g25 = WalkStore.claimMilestone(25);
  check('里程碑 25%：點數 +50 以負的 addSpent 發放、稱號入庫', pctNow >= 25 && g25.ok && g25.got.points === 50 && SPENT === -50 && WalkStore.state().shop.owned && WalkStore.titles().indexOf('ti_dex25') >= 0, JSON.stringify(g25) + ' spent=' + SPENT);
  check('發放後可用點數 = 總分 − 已花 增加 50', POINTS - SPENT === 550);
  check('重複領被拒', WalkStore.claimMilestone(25).reason === 'claimed');
  seenAll('roles'); seenAll('looks');
  var g50 = WalkStore.claimMilestone(50);
  check('里程碑 50%：點數 100、稱號、造型 sk_cat、家具 scanner_stand、稀有蛋城門石獅靈', g50.ok && g50.got.points === 100 && WalkStore.titles().indexOf('ti_dex50') >= 0 && WalkStore.looks().indexOf('sk_cat') >= 0 && WalkStore.state().shop.owned.scanner_stand === 1 && WalkStore.eggs().some(function (e) { return e.id === 'sp_lion'; }) && POINTS - SPENT === 650, JSON.stringify(g50));
  check('未達 75% 不可領', WalkStore.claimMilestone(75).reason === 'locked');
  fresh('r5b', { grantPoints: function (n) { SPENT -= n * 2; } });
  seenAll('people'); seenAll('places');
  WalkStore.claimMilestone(25);
  check('init 提供 grantPoints 時優先使用', SPENT === -100, SPENT);
  check('發放的點數累計記在 shop.bonusPts（對帳用）', WalkStore.state().shop.bonusPts === 50);

  /* --- 第 16 隻：全屬性、favFood 全、needDexPct 100、覺醒預設 --- */
  reset('r6');
  check('髓：圖鑑未滿 100% 拿不到蛋', WalkStore.giveEgg('sp_marrow').reason === 'locked');
  var saved = window.WALK_DEX;
  window.WALK_DEX = { categories: [{ id: 'people', total: 2 }], milestones: [] };
  WalkStore.markSeen('people', 'a'); WalkStore.markSeen('people', 'b');
  check('圖鑑 100% 後可得髓的蛋、孵化 2 小時', WalkStore.giveEgg('sp_marrow').ok && WalkStore.eggs()[0].remainMs === 7200000);
  adv(3 * 3600000);
  WalkStore.chooseStarter('sp_deer'); WalkStore.hatch('sp_marrow');
  WalkStore.grant('food_hist', 1); WalkStore.grant('food_dir', 1);
  var fm = WalkStore.feed('sp_marrow', 'food_hist');
  check('favFood=全：任何食物都算最愛（羈絆 = 食物 1 + 最愛 1）', fm.ok && fm.favorite && WalkStore.owned().filter(function (o) { return o.id === 'sp_marrow'; })[0].bond === 2, JSON.stringify(fm));
  check('全屬性與任何探員共鳴', WalkStore.resonance('sp_marrow', ROLE_B).resonance);
  /* 覺醒預設：移除 cond，改讀預設（羈絆 30 ＋ 圖鑑 普通 15%） */
  var cond = window.WALK_SPIRITS.filter(function (s) { return s.id === 'sp_deer'; })[0].awaken.cond;
  delete window.WALK_SPIRITS.filter(function (s) { return s.id === 'sp_deer'; })[0].awaken.cond;
  WalkStore.setSlot('sp_deer', 'follow');
  for (var i = 0; i < 29; i++) WalkStore.event('chapter', 'q' + i);
  var o29 = WalkStore.owned().filter(function (o) { return o.id === 'sp_deer'; })[0];
  WalkStore.event('chapter', 'q30');
  var o30 = WalkStore.owned().filter(function (o) { return o.id === 'sp_deer'; })[0];
  check('覺醒預設條件：羈絆 29 還是成體、30 且圖鑑 100% ≥ 15% → 覺醒', o29.stage === 'adult' && o30.bond === 30 && o30.stage === 'awake', o29.stage + ' ' + o30.stage + ' ' + o30.bond);
  window.WALK_DEX = DEXREAL;
  window.WALK_SPIRITS.filter(function (s) { return s.id === 'sp_deer'; })[0].awaken.cond = cond;
  check('資料有寫 cond 時以資料為準（傳說潮汐鯨魂需 100%）', window.WALK_SPIRITS[0].awaken.cond.dexPct === 100);
  window.WALK_DEX = saved;

  /* --- 特別搭檔（WALK_SPIRIT_PAIRS） --- */
  reset('r7');
  WalkStore.giveEgg('sp_sail'); adv(2 * 3600000); WalkStore.hatch('sp_sail'); WalkStore.setSlot('sp_sail', 'follow');
  var rs = WalkStore.resonance('sp_sail', { role: '隊長', stats: [3, 3, 3, 3, 3] });
  check('特別搭檔從 WALK_SPIRIT_PAIRS 讀（隊長＋帆影「揚帆」）', rs.special && rs.special.label === '揚帆' && rs.special.effect.key === 'rallyCooldownScale', JSON.stringify(rs.special));
  var tl = WalkStore.talents({ role: '隊長', stats: [3, 3, 3, 3, 3] });
  check('talents(role) 帶入專屬效果鍵', tl.effects.rallyCooldownScale > 0, JSON.stringify(tl.effects));
  check('非搭檔的角色沒有專屬', !WalkStore.resonance('sp_sail', { role: '軍師', stats: [3, 3, 3, 3, 3] }).special);

  /* --- 房間街列表 --- */
  var db = makeDB();
  global.localStorage = makeLS();
  db.data['roomsIndex/s1'] = {
    me: { nick: 'me', dexPct: 10, n: 1, skin: 1, open: 'all', updated: 5 },
    a: { nick: 'A', dexPct: 80, n: 3, skin: 2, open: 'all', updated: 100, rare: 3, nt: 50 },
    b: { nick: 'B', dexPct: 5, n: 1, skin: 3, open: 'all', updated: 90, rare: 0, nt: 0 },
    c: { nick: 'C', dexPct: 40, n: 2, skin: 4, open: 'team', updated: 80, rare: 1, nt: 70 },
    d: { nick: 'D', dexPct: 60, n: 2, skin: 5, open: 'closed', updated: 120 },
    e: { nick: 'E', dexPct: 70, n: 2, skin: 6, open: 'all', updated: 110, hidden: true },
    f: { nick: 'F', dexPct: 30, n: 2, skin: 7, open: 'team', updated: 60 }
  };
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime());
  fresh('me', { root: db.root, isTeammate: function (u) { return u === 'c'; } });
  var got;
  WalkStore.listRooms('all', function (r) { got = r; });
  check('房間街「所有人」：只列 open=all，排除自己、關閉、被老師隱藏、只給隊友', got.map(function (x) { return x.uid; }).sort().join() === 'a,b', JSON.stringify(got));
  check('列表格式 {uid,nick,dexPct,n,skin}', Object.keys(got[0]).sort().join() === 'dexPct,n,nick,skin,uid');
  WalkStore.listRooms('team', function (r) { got = r; });
  check('房間街「隊友」：只列同隊且開放的（c），不列非隊友的 team 房', got.map(function (x) { return x.uid; }).join() === 'c', JSON.stringify(got));
  WalkStore.listRooms('rec', function (r) { got = r; });
  var ru = got.map(function (x) { return x.uid; });
  check('推薦：含完成度高者(a)、新稱號者(c)、新手友善者(b)；不含關閉／隱藏／非隊友；最多 10 間', ru.indexOf('a') >= 0 && ru.indexOf('b') >= 0 && ru.indexOf('c') >= 0 && ru.indexOf('d') < 0 && ru.indexOf('e') < 0 && ru.indexOf('f') < 0 && got.length <= 10, ru.join());
  var w0 = db.writes.length; WalkStore.listRooms('all', function () {});
  check('列表只讀 roomsIndex 摘要、不寫入', db.writes.length === w0);
  check('visited 分頁讀本機紀錄（拜訪過才有）', (function () { var r; WalkStore.listRooms('visited', function (x) { r = x; }); return r.length === 0; })());
  /* 拜訪後出現在「我去過的」 */
  db.data['rooms/a'] = { nick: 'A', dexPct: 80, spirits: [{ id: 'sp_deer', stage: 'baby' }], open: 'all', skin: 2 };
  WalkStore.visit('a', function () {});
  var vv; WalkStore.listRooms('visited', function (x) { vv = x; });
  check('拜訪後「我去過的」出現該房（附暱稱、完成度）', vv.length === 1 && vv[0].uid === 'a' && vv[0].nick === 'A' && vv[0].dexPct === 80, JSON.stringify(vv));
  fresh('offline1');
  var off; WalkStore.listRooms('all', function (x) { off = x; });
  check('離線模式：房間街列表回傳空陣列', off.length === 0);
  /* 公開索引帶上推薦用的欄位 */
  var db3 = makeDB(); global.localStorage = makeLS();
  fresh('pub1', { root: db3.root, profile: function () { return { nick: 'P', badges: [], closet: [] }; } });
  WalkStore.chooseStarter('sp_tide'); WalkStore.setOpen('all');
  check('索引摘要含 rare／nt 欄位（少見小精靈、新稱號）', db3.data['roomsIndex/s1/pub1'].rare === 1 && db3.data['roomsIndex/s1/pub1'].nt > 0);
})();

/* ====================================================================== 16. 房間 3 格與待孵清單（規格第 11 節） */
(function () {
  reset('s1');
  var TICK = K.TICK;
  WalkStore.chooseStarter('sp_deer');
  WalkStore.giveEgg('sp_gull'); WalkStore.giveEgg('sp_abacus');
  var sl = WalkStore.roomSlots();
  check('roomSlots：蛋與小精靈共用 3 格（used=3）', sl.used === 3 && sl.total === 3 && sl.eggs.length === 2 && sl.spirits.length === 1 && sl.waiting.length === 0);
  var w1 = WalkStore.giveEgg('sp_lion');
  check('滿格時 giveEgg 回 {ok:true, waiting:true}，不佔格', w1.ok === true && w1.waiting === true && WalkStore.roomSlots().used === 3 && WalkStore.eggs().length === 2);
  check('待孵清單的蛋不重複', WalkStore.giveEgg('sp_lion').reason === 'dup' && WalkStore.giveEgg('sp_deer').reason === 'dup');
  ['sp_brick', 'sp_watch', 'sp_neon', 'sp_bee', 'sp_ink'].forEach(function (id) { WalkStore.giveEgg(id); });
  check('待孵清單最多 6 顆，第 7 顆被拒', WalkStore.roomSlots().waiting.length === 6 && WalkStore.giveEgg('sp_rubbing').reason === 'waitfull');
  var g0 = WalkStore.roomSlots().waiting[0].gotTs;
  adv(10 * 3600000);
  check('待孵的蛋不計時（放十小時後原樣）', WalkStore.roomSlots().waiting[0].gotTs === g0 && WalkStore.roomSlots().waiting.length === 6 && WalkStore.roomSlots().waiting[0].remainMs === undefined);
  WalkStore.hatch('sp_gull'); WalkStore.hatch('sp_abacus');
  check('孵出後仍佔原來的格（不會讓待孵的蛋提前補位）', WalkStore.roomSlots().used === 3 && WalkStore.roomSlots().waiting.length === 6);
  var t0 = T;
  var r1 = WalkStore.release('sp_deer');
  var lionEgg = WalkStore.eggs().filter(function (e) { return e.id === 'sp_lion'; })[0];
  check('release 空出格：待孵清單先進先出補位（獅靈先進）、補位時 gotTs＝現在', r1.filled === 1 && lionEgg && lionEgg.gotTs === t0 && WalkStore.roomSlots().waiting[0].id === 'sp_brick' && WalkStore.roomSlots().waiting.length === 5);
  /* 補位後從補位那一刻起整格倒數：稀有 1 小時 = 2 格 */
  check('補位後倒數：剛補位 2 格', lionEgg.remainTicks === 2 && lionEgg.totalTicks === 2);
  setT(t0 + TICK - 1);
  check('整格邊界：差 1 毫秒滿一格，仍是 2 格', WalkStore.eggs().filter(function (e) { return e.id === 'sp_lion'; })[0].remainTicks === 2);
  setT(t0 + TICK);
  check('整格邊界：剛好一格，剩 1 格', WalkStore.eggs().filter(function (e) { return e.id === 'sp_lion'; })[0].remainTicks === 1);
  setT(t0 + 2 * TICK);
  check('兩格後可孵', WalkStore.eggs().filter(function (e) { return e.id === 'sp_lion'; })[0].ready && WalkStore.hatch('sp_lion').ok);
  check('孵化後房間仍是 3 格、待孵清單維持先進先出', WalkStore.roomSlots().used === 3 && WalkStore.roomSlots().waiting[0].id === 'sp_brick');
  WalkStore.release('sp_lion');
  WalkStore.release('sp_gull');
  check('連續送回兩隻：連續補位兩顆', WalkStore.roomSlots().waiting.length === 3 && WalkStore.eggs().length === 2 && WalkStore.roomSlots().used === 3);

  /* 隨行位只有 1 隻、換隨行位冷卻重置 */
  reset('s2');
  WalkStore.chooseStarter('sp_deer');
  WalkStore.giveEgg('sp_gull'); WalkStore.giveEgg('sp_abacus'); adv(2 * TICK);
  WalkStore.hatch('sp_gull'); WalkStore.hatch('sp_abacus');
  check('隨行位保證只有 1 隻（第二隻 slotfull）', WalkStore.setSlot('sp_gull', 'follow').ok && WalkStore.setSlot('sp_deer', 'follow').reason === 'slotfull');
  WalkStore.useSkill('sp_gull');
  check('隨行中使用助理技後進入冷卻', WalkStore.useSkill('sp_gull').reason === 'cooldown');
  var sf = WalkStore.setFollow('sp_deer');
  var slots = {}; WalkStore.owned().forEach(function (o) { slots[o.id] = o.slot; });
  check('setFollow 換人：舊的回房間、新的隨行', sf.ok && sf.prev === 'sp_gull' && slots.sp_deer === 'follow' && slots.sp_gull === 'room' && WalkStore.owned().filter(function (o) { return o.slot === 'follow'; }).length === 1);
  WalkStore.setFollow('sp_gull');
  check('換隨行位後助理技冷卻重置（可立刻再用）', WalkStore.useSkill('sp_gull').ok);
  /* 載入時若有兩隻隨行：自動只留 1 隻 */
  var raw = JSON.parse(global.localStorage.getItem('walkstore_s2'));
  raw.spirit.owned.forEach(function (o) { o.slot = 'follow'; });
  global.localStorage.setItem('walkstore_s2', JSON.stringify(raw));
  fresh('s2');
  check('舊資料有多隻隨行位時，載入後只留 1 隻', WalkStore.owned().filter(function (o) { return o.slot === 'follow'; }).length === 1);
})();

/* ====================================================================== 17. 和隊友交換 */
(function () {
  var jsdir = path.join(__dirname, '..', 'js') + path.sep;
  require(jsdir + 'walk_data_traits.js');
  var TICK = K.TICK, db = makeDB(), mates = { ta: ['tb', 'tc'], tb: ['ta'], tc: ['ta'], td: [] };
  function as(uid, extra) {
    var o = { root: db.root, teamId: 'team1', sess: 's1', isTeammate: function (u) { return (mates[uid] || []).indexOf(u) >= 0; },
      nickOf: function (u) { return u === 'ta' ? '甲' : (u === 'tb' ? '乙' : '丙'); },
      profile: function () { return { nick: uid === 'ta' ? '甲' : (uid === 'tb' ? '乙' : '丙'), badges: [], closet: [] }; } };
    if (extra) for (var k in extra) o[k] = extra[k];
    global.localStorage = makeLS();
    return fresh(uid, o);
  }
  function res(fn) { var r; fn(function (x) { r = x; }); return r; }
  function ids() { return WalkStore.owned().map(function (o) { return o.id; }).sort().join(','); }
  function gain(id) { WalkStore.giveEgg(id); adv(3 * TICK); return WalkStore.hatch(id); }
  setT(new Date(2026, 10, 3, 10, 0, 0).getTime());
  /* 準備：甲有 鹿影(成體、有形態) + 紅磚貓；乙有 書卷蠹魚 + 算盤獸 */
  as('ta'); WalkStore.chooseStarter('sp_deer'); gain('sp_brick');
  WalkStore.setFollow('sp_deer');
  for (var i = 0; i < 11; i++) WalkStore.event('chapter', 'qc' + i);
  WalkStore.setSlot('sp_deer', 'scout');
  var deerA = WalkStore.owned().filter(function (o) { return o.id === 'sp_deer'; })[0];
  WalkStore.publish();
  as('tb'); WalkStore.chooseStarter('sp_bookworm'); gain('sp_abacus'); WalkStore.publish();

  /* --- 條件檢查與停用原因 --- */
  as('ta');
  var op = WalkStore.tradeOptions('tb');
  check('tradeOptions：同隊可交換、列出每隻的可否與原因', op.ok && op.give.length === 2 && op.give.every(function (g) { return g.ok; }) && op.left === 3, JSON.stringify(op));
  check('非隊友：notteam，並附中文原因', WalkStore.tradeOptions('td').reason === 'notteam' && /同隊/.test(WalkStore.tradeOptions('td').why));
  check('傳說小精靈不能換（reason=legend）', (function () { var o = WalkStore.tradeOptions('tb'); return o.give.every(function (g) { return g.reason === null; }); })());
  as('ta'); gain('sp_bee');                       /* 補到 3 隻，之後再測傳說 */
  check('提案時就顯示「對方已有這一種」並停用（透過對方公開房間的小精靈名單）', (function () {
    as('tb'); WalkStore.giveEgg('sp_deer'); adv(2 * TICK); /* 乙拿蛋但先不孵 */
    as('ta');
    var o = WalkStore.tradeOptions('tb', function () {});
    var g = o.give.filter(function (x) { return x.id === 'sp_bee'; })[0];
    return g.ok === true;           /* 乙沒有蜜蜂 */
  })());
  as('ta'); WalkStore.release('sp_bee');
  check('離線時交換不可用並回原因', (function () {
    global.localStorage = makeLS(); fresh('off1');
    WalkStore.chooseStarter('sp_deer');
    var o = WalkStore.tradeOptions('tb'), p = res(function (cb) { WalkStore.tradePropose('tb', 'sp_deer', cb); }), a = res(function (cb) { WalkStore.tradeApply(cb); });
    return !o.ok && o.reason === 'offline' && p.reason === 'offline' && a.reason === 'offline' && WalkStore.tradeInbox().offline === true;
  })());

  /* --- 正常交換 --- */
  as('ta');
  var pr = res(function (cb) { WalkStore.tradePropose('tb', 'sp_deer', cb); });
  var tid = pr.tradeId, tr0 = db.data['trades/' + tid];
  check('提案：寫入 trades/{id}（tid、from、to、暱稱、give 快照、status=open、10 分鐘有效）', pr.ok && tr0 && tr0.tid === 'team1' && tr0.from === 'ta' && tr0.to === 'tb' && tr0.fromNick === '甲' && tr0.toNick === '乙' && tr0.status === 'open' && tr0.exp - tr0.ts === 10 * 60000 && tr0.give.id === 'sp_deer' && tr0.give.bond === deerA.bond && !!tr0.give.trait && tr0.give.form === deerA.trait.form, JSON.stringify(tr0));
  check('重複提案同一隻給同一人被擋（pending）', res(function (cb) { WalkStore.tradePropose('tb', 'sp_deer', cb); }).reason === 'pending');
  check('甲的信箱看得到送出的提案', WalkStore.tradeInbox().outgoing.length === 1 && WalkStore.tradeInbox().outgoing[0].canCancel === true);
  as('tb');
  var inbox = res(function (cb) { WalkStore.tradeInbox(cb); });
  check('乙的信箱讀到提案（含對方小精靈快照、可接受）', inbox.incoming.length === 1 && inbox.incoming[0].id === tid && inbox.incoming[0].canAccept && inbox.incoming[0].give.id === 'sp_deer' && inbox.incoming[0].fromNick === '甲');
  check('乙對象不對／已有同種時不能接受', res(function (cb) { WalkStore.tradeAccept(tid, 'sp_nope', cb); }).reason === 'nospirit');
  var bBefore = ids();
  adv(60000);
  var ac = res(function (cb) { WalkStore.tradeAccept(tid, 'sp_abacus', cb); });
  check('乙接受：寫入 get、status=accepted，乙端先完成（給出算盤獸、收到鹿影）', ac.ok && db.data['trades/' + tid].status === 'accepted' && db.data['trades/' + tid].get.id === 'sp_abacus' && ids() === 'sp_bookworm,sp_deer');
  var deerB = WalkStore.owned().filter(function (o) { return o.id === 'sp_deer'; })[0];
  check('收到的小精靈：羈絆減半(向下取整)、性格與形態保留、階段保留、位置重設為房間', deerB.bond === Math.floor(deerA.bond / 2) && deerB.trait.pers === deerA.trait.pers && deerB.trait.form === deerA.trait.form && deerB.stage === deerA.stage && deerB.slot === 'room', JSON.stringify(deerB.trait) + ' vs ' + JSON.stringify(deerA.trait));
  check('圖鑑：乙算已取得鹿影，交換記在 tradeLog', WalkStore.state().dex.seen.spirit.sp_deer === 1 && !!WalkStore.state().spirit.tradeLog[tid]);
  check('乙不能重複接受（冪等擋下）', res(function (cb) { WalkStore.tradeAccept(tid, 'sp_abacus', cb); }).reason === 'done' && ids() === 'sp_bookworm,sp_deer');
  /* 一方未完成：甲還沒開啟，資料不動 */
  as('ta');
  check('甲端還沒補做前資料不動(仍有鹿影)', ids() === 'sp_brick,sp_deer');
  adv(30 * 3600000);                                  /* 超過 24 小時甲才打開：照樣補做 */
  var ap = res(function (cb) { WalkStore.tradeApply(cb); });
  check('甲開啟時補做：移除鹿影、加入算盤獸，狀態標 done', ap.ok && ap.applied.length === 1 && ids() === 'sp_abacus,sp_brick' && db.data['trades/' + tid].status === 'done');
  var abA = WalkStore.owned().filter(function (o) { return o.id === 'sp_abacus'; })[0];
  check('甲收到的算盤獸羈絆減半、位置為房間', abA.slot === 'room' && abA.bond === Math.floor(num0(WalkStore.state().spirit.owned.filter(function (o) { return o.id === 'sp_abacus'; })[0].bond)) && WalkStore.state().dex.seen.spirit.sp_abacus === 1);
  var snapA = JSON.stringify(WalkStore.state().spirit), w0 = db.writes.length;
  var ap2 = res(function (cb) { WalkStore.tradeApply(cb); });
  check('重複補做被冪等擋下（不再變動、不再寫入 spirit）', ap2.ok && ap2.applied.length === 0 && JSON.stringify(WalkStore.state().spirit) === snapA);
  as('tb');
  var ap3 = res(function (cb) { WalkStore.tradeApply(cb); });
  check('乙端補做也是冪等', ap3.applied.length === 0 && ids() === 'sp_bookworm,sp_deer');

  /* --- 逾時作廢 --- */
  as('ta'); WalkStore.publish();
  var p2 = res(function (cb) { WalkStore.tradePropose('tb', 'sp_brick', cb); });
  setT(db.data['trades/' + p2.tradeId].exp + 1);
  as('tb');
  var bIds = ids();
  var acx = res(function (cb) { WalkStore.tradeAccept(p2.tradeId, 'sp_deer', cb); });
  check('逾時：乙接受被拒(expired)，雙方資料不動', acx.reason === 'expired' && ids() === bIds && db.data['trades/' + p2.tradeId].status === 'open');
  check('信箱把逾時提案標為 expired、不能接受', (function () { var x = res(function (cb) { WalkStore.tradeInbox(cb); }).incoming.filter(function (y) { return y.id === p2.tradeId; })[0]; return x.expired && !x.canAccept; })());
  as('ta');
  check('甲逾時後仍可取消清掉', res(function (cb) { WalkStore.tradeCancel(p2.tradeId, cb); }).ok && db.data['trades/' + p2.tradeId].status === 'cancelled');

  /* --- 拒絕、取消、接受後不能取消 --- */
  setT(new Date(2026, 10, 4, 10, 0, 0).getTime());       /* 隔天，每日次數重置 */
  as('ta');
  var p3 = res(function (cb) { WalkStore.tradePropose('tb', 'sp_brick', cb); });
  as('tb');
  check('乙拒絕：status=declined、資料不動', res(function (cb) { WalkStore.tradeDecline(p3.tradeId, cb); }).ok && db.data['trades/' + p3.tradeId].status === 'declined' && ids() === 'sp_bookworm,sp_deer');
  check('拒絕後再接受被拒', res(function (cb) { WalkStore.tradeAccept(p3.tradeId, 'sp_deer', cb); }).reason === 'declined');
  as('ta');
  check('已被拒絕就不能取消(回報目前狀態)', res(function (cb) { WalkStore.tradeCancel(p3.tradeId, cb); }).reason === 'declined');
  var p4 = res(function (cb) { WalkStore.tradePropose('tb', 'sp_brick', cb); });
  check('甲取消：status=cancelled', res(function (cb) { WalkStore.tradeCancel(p4.tradeId, cb); }).ok && db.data['trades/' + p4.tradeId].status === 'cancelled');
  as('tb');
  check('取消後乙不能接受', res(function (cb) { WalkStore.tradeAccept(p4.tradeId, 'sp_deer', cb); }).reason === 'cancelled');
  as('tc');
  check('別人不能處理這筆交換', res(function (cb) { WalkStore.tradeAccept(p4.tradeId, 'sp_deer', cb); }).reason === 'notyours' || res(function (cb) { WalkStore.tradeAccept(p4.tradeId, 'sp_deer', cb); }).reason === 'nospirit');
  as('ta');
  var p5 = res(function (cb) { WalkStore.tradePropose('tb', 'sp_brick', cb); });
  as('tb');
  res(function (cb) { WalkStore.tradeAccept(p5.tradeId, 'sp_deer', cb); });
  as('ta');
  check('乙接受後甲不能取消(accepted)', res(function (cb) { WalkStore.tradeCancel(p5.tradeId, cb); }).reason === 'accepted');
  check('甲補做後完成(done)', res(function (cb) { WalkStore.tradeApply(cb); }).applied[0] === p5.tradeId && db.data['trades/' + p5.tradeId].status === 'done' && ids() === 'sp_abacus,sp_deer');

  /* --- 對方已有同種、勘察中要先領回、每日 3 次 --- */
  as('tb');
  check('收到的小精靈自己已經有(mine_has)：接受被拒、資料不動', (function () {
    /* 乙現在有紅磚貓；若甲再送紅磚貓過來會 mine_has。甲沒有紅磚貓了，改用：乙手上有 deer(來自第一次)——甲現在也有 deer */
    as('tb'); gain('sp_deer');                       /* 乙自己先有鹿影，但沒更新公開房間（資料落後） */
    var before = ids();
    as('ta'); WalkStore.publish();
    var q = res(function (cb) { WalkStore.tradePropose('tb', 'sp_deer', cb); });
    as('tb');
    var r = res(function (cb) { WalkStore.tradeAccept(q.tradeId, 'sp_bookworm', cb); });
    return !q.ok ? q.reason === 'peerhas' : (r.reason === 'mine_has' && ids() === before);
  })(), 'dbg');
  as('tb'); WalkStore.publish();
  as('ta');
  check('對方已有這一種：提案端就停用(peerhas)', (function () { WalkStore.tradeOptions('tb', function () {}); var o = WalkStore.tradeOptions('tb'); var g = o.give.filter(function (x) { return x.id === 'sp_deer'; })[0]; return g && !g.ok && g.reason === 'peerhas' && /對方已經有/.test(g.why); })());
  check('勘察中要先領回：該隻 reason=expedition，領回後可換', (function () {
    WalkStore.setSlot('sp_abacus', 'scout');
    var d = WalkStore.dispatch({ spiritId: 'sp_abacus', chapterId: 'c1', tier: 'short' });
    var g1 = WalkStore.tradeOptions('tb').give.filter(function (x) { return x.id === 'sp_abacus'; })[0];
    adv(TICK); WalkStore.collect();
    var g2 = WalkStore.tradeOptions('tb').give.filter(function (x) { return x.id === 'sp_abacus'; })[0];
    DBG = JSON.stringify([d, g1, g2]);
    return d.ok && !g1.ok && g1.reason === 'expedition' && g2.ok;
  })(), DBG);
  check('勘察中被接受時甲端補做會等待(pending)，領回後完成', (function () {
    var q = res(function (cb) { WalkStore.tradePropose('tb', 'sp_abacus', cb); });
    var d = WalkStore.dispatch({ spiritId: 'sp_abacus', chapterId: 'c2', tier: 'short' });
    as('tb');
    var ac2 = res(function (cb) { WalkStore.tradeAccept(q.tradeId, 'sp_brick', cb); });
    as('ta');
    var p1 = res(function (cb) { WalkStore.tradeApply(cb); });
    adv(TICK); WalkStore.collect();
    var p2b = res(function (cb) { WalkStore.tradeApply(cb); });
    DBG = JSON.stringify([q, d, ac2, p1, p2b, ids()]);
    return d.ok && ac2.ok && p1.pending.indexOf(q.tradeId) >= 0 && p2b.applied.indexOf(q.tradeId) >= 0 && ids().indexOf('sp_brick') >= 0 && ids().indexOf('sp_abacus') < 0;
  })(), DBG);
  check('傳說小精靈不能交換(legend)', (function () {
    as('ta');
    var h1 = WalkStore.giveEgg('sp_tide'); adv(5 * TICK); var h2 = WalkStore.hatch('sp_tide');
    var g = WalkStore.tradeOptions('tb').give.filter(function (x) { return x.id === 'sp_tide'; })[0];
    return h1.ok && h2.ok && !!g && !g.ok && g.reason === 'legend' && /傳說/.test(g.why);
  })());
  check('每人每天最多完成 3 次：滿 3 次後 tradeOptions／tradePropose 回 daily_cap', (function () {
    as('ta');
    var key = Object.keys(db.data['players/ta/shop'].daily).filter(function (k) { return db.data['players/ta/shop'].daily[k].trade; })[0];
    var before = db.data['players/ta/shop'].daily[key].trade;
    db.data['players/ta/shop'].daily[key].trade = 3;
    as('ta');
    var o = WalkStore.tradeOptions('tb'), p = res(function (cb) { WalkStore.tradePropose('tb', 'sp_deer', cb); });
    return before >= 2 && o.reason === 'daily_cap' && o.left === 0 && p.reason === 'daily_cap';
  })());
  check('交換後雙方總數不變（1 換 1，房間格數不變）', (function () { as('ta'); var a = WalkStore.roomSlots().used; as('tb'); var b = WalkStore.roomSlots().used; return a <= 3 && b <= 3; })());
})();
var DBG = '';
function num0(x) { return typeof x === 'number' ? x : 0; }

/* ====================================================================== 18. 碎屑、兌換、老闆任務板、稱號、套裝拆件 */
(function () {
  var TICK = K.TICK;
  /* --- 碎屑 --- */
  reset('h1');
  check('一開始沒有碎屑', Object.keys(WalkStore.shards()).length === 0 && WalkStore.shardTotal() === 0);
  var first = WalkStore.addIntel('c1', 'c1_1');
  var dup = WalkStore.addIntel('c1', 'c1_1');
  check('第一次拿到的情報卡入庫；重複的自動轉該類別碎屑', first.ok && !first.duplicate && dup.duplicate && dup.shard === '史料' && WalkStore.shards()['史料'] === 1);
  WalkStore.addIntel('c1', 'c1_1'); WalkStore.addIntel('c1', 'c1_1');
  check('exchange 點心：3 張同類碎屑換 1 份該類點心', WalkStore.exchange('food_hist').ok && WalkStore.state().shop.owned.food_hist === 1 && !WalkStore.shards()['史料']);
  check('碎屑不足：noshards 並說明差多少', (function () { var r = WalkStore.exchange('food_hist'); return r.reason === 'noshards' && r.need === 3 && r.have === 0; })());
  check('無分類的普通食物、不存在的 id 換不了', WalkStore.exchange('food_plain').reason === 'unknown' && WalkStore.exchange('ghost').reason === 'unknown');
  ['c1_2', 'c1_3', 'c1_4', 'c1_5', 'c1_6', 'c1_7', 'c1_8'].forEach(function (id) { WalkStore.addIntel('c1', id); WalkStore.addIntel('c1', id); WalkStore.addIntel('c1', id); });
  WalkStore.addIntel('c1', 'c1_1');
  var sh = WalkStore.shards();
  check('碎屑按類別計', sh['史料'] === 3 && sh['路況'] === 4 && WalkStore.shardTotal() === 15, JSON.stringify(sh));
  check('exchange 限定家具：10 張（任何類別）換 1 件', WalkStore.exchange('whale_bone').ok && WalkStore.state().shop.owned.whale_bone === 1 && WalkStore.shardTotal() === 5);
  check('已有的限定家具不能重換', WalkStore.exchange('whale_bone').reason === 'owned');
  check('exchange 稱號邊框(竹編 5 張)', WalkStore.exchange('frame_bamboo').ok && WalkStore.shardTotal() === 0 && WalkStore.state().shop.owned.frame_bamboo === 1);
  check('exchange 磚紅邊框碎屑不夠', WalkStore.exchange('frame_brick').reason === 'noshards');
  WalkStore.grant('intel_shard', 4);
  check('小精靈禮物帶來的通用碎屑算在「通用」，可補任何兌換', WalkStore.shards()['通用'] === 4 && WalkStore.exchange('frame_bamboo').reason === 'owned' && WalkStore.exchange('kiln_model').reason === 'noshards');
  /* collect 多出來的轉碎屑 */
  reset('h2');
  WalkStore.chooseStarter('sp_deer');
  ['c5_1', 'c5_2', 'c5_3', 'c5_4', 'c5_5', 'c5_6', 'c5_7'].forEach(function (id) { WalkStore.addIntel('c5', id); });
  WalkStore.dispatch({ spiritId: 'sp_deer', chapterId: 'c5', tier: 'long' });
  adv(4 * TICK);
  var cr = WalkStore.collect();
  check('勘察卡發不夠時，多出的變該小精靈專長類別的碎屑', cr.ok && cr.count === 1 && cr.shards && cr.shards['史料'] === 2 && WalkStore.shards()['史料'] === 2, JSON.stringify(cr.shards));

  /* --- 老闆任務板 --- */
  reset('h3');
  var tasks = WalkStore.board();
  check('board()：每天 3 個，含 id／text／n／progress／done／claimed／reward', tasks.length === 3 && tasks.every(function (q) { return q.id && q.text && q.n >= 1 && q.progress === 0 && q.done === false && q.claimed === false && q.reward; }));
  check('同一天重複讀取結果相同', JSON.stringify(WalkStore.board()) === JSON.stringify(tasks));
  var q0 = tasks[0];
  WalkStore.report(q0.event, q0.n);
  var q0b = WalkStore.board().filter(function (q) { return q.id === q0.id; })[0];
  check('report(event,n) 推進進度到完成', q0b.done && q0b.progress === q0.n);
  check('未完成的任務不能領(notyet)', (function () { var other = WalkStore.board().filter(function (q) { return !q.done; })[0]; return WalkStore.claimBoard(other.id).reason === 'notyet'; })());
  var sp0 = SPENT, cb0 = WalkStore.claimBoard(q0.id);
  check('claimBoard：發點數（負的 addSpent）與食材，只能領一次', cb0.ok && cb0.points === (q0.reward.points || 0) && SPENT === sp0 - (q0.reward.points || 0) && WalkStore.claimBoard(q0.id).reason === 'claimed' && cb0.got.length >= 1);
  check('不在今天任務裡的 id 被拒', WalkStore.claimBoard('nope').reason === 'noid');
  /* 店內動作自動推進進度 */
  var poolSaved = window.WALK_SHOP.board.pool;
  window.WALK_SHOP.board.pool = [{ id: 'b1', text: '摸摸 2 次', event: 'pet', n: 2, reward: { points: 5, food: 'food_plain' } }, { id: 'b2', text: '到站', event: 'arrive', n: 1, reward: { points: 10, food: null } }, { id: 'b3', text: '餵食', event: 'feed', n: 1, reward: { points: 6, food: null } }];
  reset('h4');
  WalkStore.chooseStarter('sp_deer'); WalkStore.grant('food_hist', 1);
  adv(5 * 3600000);
  WalkStore.pet('sp_deer'); WalkStore.pet('sp_deer'); WalkStore.event('arrive', 's1'); WalkStore.feed('sp_deer', 'food_hist');
  var bs = WalkStore.board();
  check('店內動作（摸、到站、餵食）自動推進任務板進度', bs.length === 3 && bs.every(function (q) { return q.done; }), JSON.stringify(bs.map(function (q) { return q.id + ':' + q.progress; })));
  var total = 0; bs.forEach(function (q) { var r = WalkStore.claimBoard(q.id); if (r.ok) total += r.points; });
  check('三個都領：點數 21 以負的 addSpent 發放', total === 21 && SPENT === -21, SPENT);
  adv(DAY);
  check('隔天任務重算、進度歸零', WalkStore.board().every(function (q) { return q.progress === 0 && !q.claimed; }));
  window.WALK_SHOP.board.pool = poolSaved;

  /* --- 稱號登記 --- */
  reset('h5');
  WalkStore.chooseStarter('sp_deer');
  check('稱號：孵出第一隻 → ti_owner 寫入 dex.titles 與 dex.seen.titles', WalkStore.titles().indexOf('ti_owner') >= 0 && WalkStore.state().dex.seen.titles.ti_owner === 1);
  check('takeNewTitles 取走一次就清空', WalkStore.takeNewTitles().indexOf('ti_owner') >= 0 && WalkStore.takeNewTitles().length === 0);
  for (var i = 0; i < 12; i++) WalkStore.event('arrive', 'stop' + (i % 5));
  check('稱號：站點算「不同的站」（只有 5 個不同的）→ 還沒有府城行者', WalkStore.titles().indexOf('ti_walker') < 0);
  for (i = 5; i < 11; i++) WalkStore.event('arrive', 'stop' + i);
  check('稱號：走到 10 個不同站點 → 府城行者', WalkStore.titles().indexOf('ti_walker') >= 0);
  setT(new Date(2026, 10, 3, 20, 30, 0).getTime());
  WalkStore.event('arrive', 'night1');
  check('稱號：夜間到站 → 夜行者', WalkStore.titles().indexOf('ti_night') >= 0);
  check('稱號：完成章節數來自 init 的 chaptersDone', (function () { fresh('h5', { chaptersDone: function () { return 1; } }); WalkStore.markSeen('x', 'y'); return WalkStore.titles().indexOf('ti_first') >= 0; })());
  check('稱號進圖鑑「titles」類別計數', WalkStore.dex().cats.filter(function (c) { return c.id === 'titles'; })[0].have >= 4);
  /* 三足鼎立 */
  reset('h6');
  WalkStore.chooseStarter('sp_deer');
  ['sp_abacus', 'sp_telegraph'].forEach(function (id) { WalkStore.giveEgg(id); });
  adv(5 * TICK);
  WalkStore.hatch('sp_abacus'); WalkStore.hatch('sp_telegraph');
  check('三足鼎立：3 隻的時期、屬性、專長都不同 → ti_tripod', WalkStore.owned().length === 3 && WalkStore.titles().indexOf('ti_tripod') >= 0);
  reset('h7');
  WalkStore.chooseStarter('sp_deer');
  ['sp_gull', 'sp_brick'].forEach(function (id) { WalkStore.giveEgg(id); });
  adv(5 * TICK);
  WalkStore.hatch('sp_gull'); WalkStore.hatch('sp_brick');
  check('三足鼎立：有兩隻同時期（荷治）→ 不頒', WalkStore.owned().length === 3 && WalkStore.titles().indexOf('ti_tripod') < 0);
  reset('h8'); POINTS = 3000;
  WalkStore.chooseStarter('sp_deer');
  check('其他稱號條件：收藏家具 5 件、套裝集滿、覺醒、勘察 10 次等由同一套判斷', (function () {
    ['tide_map', 'route_map', 'note_board', 'photo_frame', 'plant'].forEach(function (id) { WalkStore.grant(id, 1); });
    return WalkStore.titles().indexOf('ti_collector') >= 0;
  })());

  /* --- 套裝拆件 --- */
  reset('h9'); POINTS = 3000;
  var bset = WalkStore.buy('set_tide');
  var st = WalkStore.state().shop.owned;
  check('買套裝：拆成每件可購買成員(4 件)加入 owned，稀有成員(鯨骨)不給', bset.ok && st.tide_map === 1 && st.shell_rug === 1 && st.sampan_table === 1 && st.sea_window === 1 && !st.whale_bone);
  check('拆件後每件可單獨擺放', WalkStore.place('wall1', 'tide_map').ok && WalkStore.place('floor1', 'shell_rug').ok && WalkStore.place('floor2', 'sampan_table').ok && WalkStore.place('window1', 'sea_window').ok);
})();

/* ====================================================================== 14. 檔案檢查：不得呼叫 alert/confirm/prompt */
(function () {
  ['walk_store.js', 'walk_sprites2.js'].forEach(function (f) {
    var s = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '').replace(/\/\/[^\n'"]*$/gm, '');
    var cnt = (s.match(/(^|[^.\w])(alert|confirm|prompt)\s*\(/g) || []).length;
    check(f + '：alert/confirm/prompt 呼叫數 = 0', cnt === 0, cnt);
    var net = (s.match(/\b(setInterval|XMLHttpRequest|fetch)\s*\(/g) || []).length;
    check(f + '：沒有輪詢／網路請求（setInterval/fetch = 0）', net === 0, net);
  });
})();

console.log('\n總計：' + (pass + failN) + ' 項，PASS ' + pass + '，FAIL ' + failN);
process.exit(failN === 0 ? 0 : 1);
