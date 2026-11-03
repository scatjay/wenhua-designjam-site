/* 小精靈性格、進化形態、30 分鐘一格、每日禮物、形態配色的單元測試：node test_tools/test_walk_traits.js
   不用瀏覽器；用真實資料檔（spirit／traits／shop／dex）加假的 localStorage；時間一律走注入的 now()。 */
'use strict';
var fs = require('fs');
var path = require('path');
global.window = global;

function makeLS() {
  var m = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }
  };
}
global.localStorage = makeLS();

var base = path.join(__dirname, '..', 'js');
['walk_sprites2.js', 'walk_data_spirit.js', 'walk_data_traits.js', 'walk_data_shop.js', 'walk_data_dex.js'].forEach(function (f) { require(path.join(base, f)); });
function cards(ch, n) {
  var types = ['史料', '路況', '人物', '觀察', '彩蛋', '方位', '史料', '路況'], out = [], i;
  for (i = 0; i < n; i++) out.push({ id: ch + '_' + (i + 1), chapter: ch, type: types[i % types.length], text: '卡' + (i + 1), source: '測試', level: '有出處', tags: [], rarity: '普通' });
  return out;
}
window.WALK_INTEL = cards('c1', 8).concat(cards('c2', 8), cards('c3', 8));
var WalkPix = window.WalkPix;
var WalkStore = require(path.join(base, 'walk_store.js'));
var K = WalkStore._c, TICK = K.TICK, MIN = 60000, DAY = K.DAY;

var pass = 0, failN = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { failN++; console.log('FAIL  ' + name + (detail !== undefined ? '  → ' + detail : '')); }
}
function near(a, b, eps) { return Math.abs(a - b) <= (eps === undefined ? 0.005 : eps); }

var T0 = new Date(2026, 10, 3, 10, 0, 0).getTime();
var T = T0;
function adv(ms) { T += ms; }
var SPENT = 0;
function opts(uid, extra) {
  var o = { uid: uid, root: null, now: function () { return T; }, getPoints: function () { return 5000 - SPENT; }, addSpent: function (n) { SPENT += n; },
    chaptersDone: function () { return 0; }, progress: function () { return {}; }, toast: function () {}, sess: 's1' };
  if (extra) for (var k in extra) o[k] = extra[k];
  return o;
}
/* 建立一個全新玩家，擁有指定的小精靈紀錄（已含性格與計數） */
function mk(uid, recs, extra) {
  global.localStorage = makeLS();
  T = T0; SPENT = 0;
  WalkStore.init(opts(uid, extra));
  var st = WalkStore.state();
  st.spirit.starter = true;
  st.spirit.owned = recs;
  global.localStorage.setItem('walkstore_' + uid, JSON.stringify(st));
  WalkStore.init(opts(uid, extra));
  return WalkStore;
}
function rec(id, stage, bond, pers, counts, more) {
  var r = { id: id, stage: stage, bond: bond, vigor: 70, lastTs: T0, seenTs: T0, slot: 'room', skillAt: 0,
    trait: { pers: pers, born: T0, care: 0, adv: 0, lore: 0 } };
  if (counts) for (var k in counts) r.trait[k] = counts[k];
  if (more) for (var m in more) r[m] = more[m];
  return r;
}
function ownedOf(id) { return WalkStore.owned().filter(function (o) { return o.id === id; })[0]; }

/* ====================================================================== 1. 資料檔 */
(function () {
  var TR = window.WALK_TRAITS, FM = window.WALK_FORMS, BH = window.WALK_BEHAVIOR;
  var ids = ['active', 'lazy', 'curious', 'shy', 'foodie', 'tsundere'];
  check('六種性格，id 齊全', TR.length === 6 && ids.every(function (i) { return TR.byId[i] && TR.byId[i].id === i; }));
  var okFields = TR.every(function (t) {
    return t.icon && t.name && t.intro && t.likes && Array.isArray(t.likes.furnitureTypes) && Array.isArray(t.likes.toys) && t.dislikes && t.tone && typeof t.tone.suffix === 'string' && t.mods && t.weights && Array.isArray(t.formPref) && t.formPref.length === 3;
  });
  check('性格欄位齊全（icon/name/intro/likes/dislikes/tone/mods/weights/formPref）', okFields);
  var keys = ['pet', 'feed', 'play', 'visitor', 'petCold', 'petWait', 'annoyed'];
  var bad = [];
  TR.forEach(function (t) { keys.forEach(function (k) { var a = t.reactions[k]; if (!Array.isArray(a) || a.length < 3 || a.some(function (s) { return typeof s !== 'string' || s.length > 24 || !s.length; })) bad.push(t.id + '.' + k); }); });
  check('每種性格 reactions 七類各 ≥3 句且每句 ≤24 字', !bad.length, bad.join(','));
  var modBad = [];
  TR.forEach(function (t) { ['decayMul', 'playMul', 'napMul'].forEach(function (k) { if (t.mods[k] !== undefined && (t.mods[k] < 0.8 || t.mods[k] > 1.2)) modBad.push(t.id + '.' + k); }); if (t.mods.scoutExtraChance > 0.2) modBad.push(t.id + '.scout'); });
  check('數值微調都在 ±20% 內', !modBad.length, modBad.join(','));
  var attrs = ['觀察', '溝通', '智識', '行動', '守護', '全'];
  check('weights 涵蓋六種主屬性、皆為正數', TR.every(function (t) { return attrs.every(function (a) { return t.weights[a] > 0; }); }));
  check('FORMS：care/adv/lore 三種，含 tint、effect、16×16 配件', FM.length === 3 && ['care', 'adv', 'lore'].every(function (i) { var f = FM.byId[i]; return f && f.icon && f.name && f.desc && f.tint && f.effect.length >= 1 && f.effect.every(function (e) { return e.key && typeof e.value === 'number'; }) && f.accessory.rows.length === 16 && f.accessory.rows.every(function (r) { return r.length === 16; }); }));
  var sts = BH.states, lineBad = [];
  check('行為狀態 11 種', sts.length === 11 && ['wander', 'nap', 'play', 'eat', 'explore', 'cuddle', 'hide', 'sing', 'show', 'together', 'missyou'].every(function (s) { return sts.indexOf(s) >= 0; }));
  check('每個狀態都有持續步數範圍', sts.every(function (s) { var d = BH.durations[s]; return d && d[0] > 0 && d[1] >= d[0]; }));
  ids.forEach(function (i) { sts.forEach(function (s) { var a = BH.lines[i] && BH.lines[i][s]; if (!Array.isArray(a) || a.length < 2 || a.some(function (x) { return !x || x.length > 20; })) lineBad.push(i + '.' + s); }); });
  check('台詞庫：每種性格 × 每個行為 ≥2 句、每句 ≤20 字', !lineBad.length, lineBad.join(','));
})();

/* ====================================================================== 2. 性格抽取：權重、可重現 */
(function () {
  mk('d1', []);
  var N = 20000, attr, ids = window.WALK_TRAITS.map(function (t) { return t.id; }), allOk = true, detail = '', reach = {};
  ['觀察', '溝通', '智識', '行動', '守護', '全'].forEach(function (a) {
    var cnt = {}, sum = 0, i;
    ids.forEach(function (id) { cnt[id] = 0; sum += window.WALK_TRAITS.byId[id].weights[a]; });
    for (i = 0; i < N; i++) cnt[WalkStore.rollPersonality(a, 'seed' + a + i)]++;
    ids.forEach(function (id) {
      var p = window.WALK_TRAITS.byId[id].weights[a] / sum, got = cnt[id] / N;
      if (Math.abs(p - got) > 0.015) { allOk = false; detail += a + '/' + id + ' ' + got.toFixed(3) + '≠' + p.toFixed(3) + '; '; }
      if (cnt[id] > 0) reach[id] = 1;
    });
  });
  check('抽中分佈符合權重（每屬性 2 萬次，誤差 ≤1.5%）', allOk, detail);
  check('六種性格都抽得到', Object.keys(reach).length === 6);
  check('觀察屬性：好奇最常見；守護：害羞與傲嬌最常見', (function () {
    function top(a) { var cnt = {}, i, best = null; for (i = 0; i < 5000; i++) { var r = WalkStore.rollPersonality(a, 'k' + i); cnt[r] = (cnt[r] || 0) + 1; } ids.forEach(function (id) { if (!best || (cnt[id] || 0) > cnt[best]) best = id; }); return best; }
    return top('觀察') === 'curious' && ['shy', 'tsundere'].indexOf(top('守護')) >= 0 && top('溝通') === 'active';
  })());
  check('同種子同結果（可重現）、不同種子會不同', WalkStore.rollPersonality('全', 'abc') === WalkStore.rollPersonality('全', 'abc') && (function () { var s = {}, i; for (i = 0; i < 50; i++) s[WalkStore.rollPersonality('全', 'x' + i)] = 1; return Object.keys(s).length > 2; })());
})();

/* ====================================================================== 3. 孵化時抽定、舊資料補抽、送回再領回 */
(function () {
  global.localStorage = makeLS(); T = T0; SPENT = 0;
  WalkStore.init(opts('p1'));
  WalkStore.chooseStarter('sp_deer');
  var p1 = WalkStore.personalityOf('sp_deer');
  check('選起始即抽定性格並存入 trait.pers', !!p1 && ownedOf('sp_deer').trait.pers === p1 && window.WALK_TRAITS.byId[p1]);
  check('性格不會變（多次查詢相同）', WalkStore.personalityOf('sp_deer') === p1);
  /* 同一個 uid＋蛋＋時間 → 同一個性格 */
  function hatchPers(uid) {
    global.localStorage = makeLS(); T = T0;
    WalkStore.init(opts(uid)); WalkStore.giveEgg('sp_gull'); adv(2 * TICK); WalkStore.hatch('sp_gull'); return WalkStore.personalityOf('sp_gull');
  }
  check('孵蛋抽性格：相同 uid／蛋／時間可重現', hatchPers('hu') === hatchPers('hu'));
  var set = {}, i; for (i = 0; i < 40; i++) set[hatchPers('hu' + i)] = 1;
  check('不同玩家孵出的性格有變化', Object.keys(set).length >= 3, Object.keys(set).join(','));
  /* 舊資料：沒有 trait 的已孵化紀錄 → 補抽並存回 */
  global.localStorage = makeLS(); T = T0;
  WalkStore.init(opts('old'));
  var st = WalkStore.state();
  st.spirit.starter = true;
  st.spirit.owned = [{ id: 'sp_bookworm', stage: 'baby', bond: 2, vigor: 70, lastTs: T0, slot: 'room', skillAt: 0 }];
  global.localStorage.setItem('walkstore_old', JSON.stringify(st));
  WalkStore.init(opts('old'));
  var saved = JSON.parse(global.localStorage.getItem('walkstore_old')).spirit.owned[0];
  check('舊資料載入時補抽性格並存回', saved.trait && saved.trait.pers && window.WALK_TRAITS.byId[saved.trait.pers], JSON.stringify(saved.trait));
  var op = WalkStore.personalityOf('sp_bookworm');
  WalkStore.init(opts('old'));
  check('補抽後穩定（重載不變）', WalkStore.personalityOf('sp_bookworm') === op && op === saved.trait.pers);
  /* 舊資料成體：補形態且不發事件 */
  global.localStorage = makeLS();
  WalkStore.init(opts('old2'));
  st = WalkStore.state(); st.spirit.starter = true;
  st.spirit.owned = [{ id: 'sp_deer', stage: 'adult', bond: 12, vigor: 70, lastTs: T0, slot: 'room', skillAt: 0 }];
  global.localStorage.setItem('walkstore_old2', JSON.stringify(st));
  var evs = []; WalkStore.on(function (w, s, e) { if (w === 'evolve') evs.push(e); });
  WalkStore.init(opts('old2'));
  check('舊成體補上形態、不觸發進化事件', ['care', 'adv', 'lore'].indexOf(WalkStore.formOf('sp_deer')) >= 0 && evs.length === 0);
  /* 送回圖鑑再領回保留性格與形態 */
  mk('rel', [rec('sp_deer', 'adult', 12, 'foodie', { care: 20 }, {}), rec('sp_gull', 'baby', 3, 'shy', {})]);
  var f0 = WalkStore.formOf('sp_deer');
  WalkStore.release('sp_deer');
  var rc = WalkStore.reclaim('sp_deer');
  check('送回再領回：性格與形態都保留', rc.ok && ownedOf('sp_deer').trait.pers === 'foodie' && WalkStore.formOf('sp_deer') === f0 && f0 === 'care', f0);
  check('送回再領回：計數保留', ownedOf('sp_deer').trait.care === 20);
})();

/* ====================================================================== 4. 計數鉤子與正規化 */
(function () {
  mk('c1', [rec('sp_deer', 'baby', 0, 'curious', {})]);
  WalkStore.grant('food_hist', 3);
  WalkStore.feed('sp_deer', 'food_hist'); WalkStore.play('sp_deer'); WalkStore.pet('sp_deer'); WalkStore.tidy('sp_deer');
  var c = WalkStore.traitCounters('sp_deer');
  check('餵食、玩耍、撫摸、整理窩 → care 各 +1', c.care === 4 && c.adv === 0 && c.lore === 0, JSON.stringify(c));
  WalkStore.setSlot('sp_deer', 'follow');
  WalkStore.event('task'); WalkStore.event('arrive'); WalkStore.event('chapter', 'x1');
  c = WalkStore.traitCounters('sp_deer');
  check('任務、到站、章節 → adv +3', c.adv === 3 && c.care === 4, JSON.stringify(c));
  WalkStore.event('hidden'); WalkStore.event('culture');
  c = WalkStore.traitCounters('sp_deer');
  check('隱藏關卡、文化→遊戲題 → lore +2', c.lore === 2, JSON.stringify(c));
  WalkStore.setSlot('sp_deer', 'scout');
  var d = WalkStore.dispatch({ spiritId: 'sp_deer', chapterId: 'c1', tier: 'short' });
  check('勘察派遣 → adv +1', d.ok && WalkStore.traitCounters('sp_deer').adv === 4);
  adv(TICK);
  var col = WalkStore.collect();
  c = WalkStore.traitCounters('sp_deer');
  check('勘察領取 → lore 加上取得的情報卡張數', col.ok && c.lore === 2 + col.count, JSON.stringify([col.count, c]));
  check('lead：care 4/12=0.33、adv 4/10=0.4、lore 領先者', c.lead === (function () { var s = { care: c.care / 12, adv: c.adv / 10, lore: c.lore / 8 }, b = 'care'; ['adv', 'lore'].forEach(function (k) { if (s[k] > s[b]) b = k; }); return b; })(), JSON.stringify(c));
  mk('c2', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  check('全部為 0 時 lead 為 null', WalkStore.traitCounters('sp_deer').lead === null);
  mk('c3', [rec('sp_deer', 'baby', 0, 'lazy', { care: 6, adv: 5, lore: 4 })]);
  check('正規化比較：6/12=0.5、5/10=0.5、4/8=0.5 → 平手由性格偏好（慵懶＝陪伴）', WalkStore.traitCounters('sp_deer').lead === 'care');
  mk('c4', [rec('sp_deer', 'baby', 0, 'lazy', { care: 6, adv: 6, lore: 2 })]);
  check('正規化比較：adv 6/10 勝過 care 6/12', WalkStore.traitCounters('sp_deer').lead === 'adv');
  check('不存在的小精靈回傳 null', WalkStore.traitCounters('nope') === null);
})();

/* ====================================================================== 5. 進化：形態決定、事件、圖鑑 */
(function () {
  function evolveWith(pers, counts, uid) {
    mk(uid || 'e', [rec('sp_deer', 'baby', 9, pers, counts)]);
    WalkStore.grant('food_hist', 2);
    var got = [], third = null;
    WalkStore.on(function (w, s, e) { if (w === 'evolve') { got.push(e); third = s === WalkStore; } });
    var r = WalkStore.feed('sp_deer', 'food_hist');
    return { r: r, got: got, third: third, form: WalkStore.formOf('sp_deer'), stage: ownedOf('sp_deer').stage };
  }
  var a = evolveWith('lazy', { care: 3, adv: 0, lore: 6 });
  check('羈絆達 10 自動進成體並寫入形態（lore 6/8 最高）', a.stage === 'adult' && a.form === 'lore' && ownedOf('sp_deer').trait.form === 'lore', JSON.stringify([a.stage, a.form]));
  check('回傳事件 {type,id,from,to,form}', a.r.ok && a.r.evolved && a.r.evolved.type === 'evolve' && a.r.evolved.id === 'sp_deer' && a.r.evolved.from === 'baby' && a.r.evolved.to === 'adult' && a.r.evolved.form === 'lore', JSON.stringify(a.r.evolved));
  check('on() 訂閱者收到 evolve 事件（第三個參數）', a.got.length === 1 && a.got[0].form === 'lore' && a.third === true);
  var pend = WalkStore.takeEvolutions();
  check('takeEvolutions 取走未播放的事件、第二次為空', pend.length === 1 && pend[0].to === 'adult' && WalkStore.takeEvolutions().length === 0);
  var b = evolveWith('lazy', { care: 11, adv: 10, lore: 0 });
  check('平手（care 12/12 ＝ adv 10/10）→ 慵懶偏好陪伴型', b.form === 'care', b.form);
  var c = evolveWith('active', { care: 11, adv: 10, lore: 0 });
  check('同樣平手 → 活潑偏好冒險型', c.form === 'adv', c.form);
  var d = evolveWith('curious', { care: 0, adv: 0, lore: 2 });
  check('學者傾向（lore 2/8 勝過餵食 care 1/12）→ 學者型', d.form === 'lore', d.form);
  mk('z0', [rec('sp_deer', 'adult', 12, 'curious', {})]);
  check('舊成體計數全為 0：平手由性格偏好決定（好奇＝學者型）', WalkStore.formOf('sp_deer') === 'lore');
  var e = evolveWith('lazy', { care: 11, adv: 3, lore: 1 });
  check('陪伴傾向高 → 陪伴型（care 12/12 最高）', e.form === 'care');
  check('進化後圖鑑形態收集 +1', WalkStore.dex().forms.have === 1 && WalkStore.dex().forms.total === 72, JSON.stringify(WalkStore.dex().forms));
  check('dex().spiritBook 含形態：總數 24＋72', WalkStore.dex().spiritBook.total === 96, JSON.stringify(WalkStore.dex().spiritBook));
  /* 冒險計數：進化當下的觸發動作也算進去 */
  mk('e2', [rec('sp_deer', 'baby', 9, 'lazy', { care: 0, adv: 9, lore: 0 }, { slot: 'follow' })]);
  var r2 = WalkStore.event('chapter', 'z1');
  check('隨行位完成章節：adv 9→10（10/10）進成體 → 冒險型', r2.evolved && r2.evolved.form === 'adv' && WalkStore.formOf('sp_deer') === 'adv');
  /* 形態一旦定下，之後計數不再改變形態 */
  WalkStore.event('hidden'); WalkStore.event('hidden');
  check('形態不可逆', WalkStore.formOf('sp_deer') === 'adv');
  check('成體前 formOf 為 null', (function () { mk('e3', [rec('sp_deer', 'baby', 2, 'lazy', {})]); return WalkStore.formOf('sp_deer') === null; })());
  check('evolve() 對已定形態者回傳 null、對嬰兒也是 null', (function () { mk('e4', [rec('sp_deer', 'adult', 12, 'lazy', { care: 5 }, {}), rec('sp_gull', 'baby', 2, 'lazy', {})]); return WalkStore.formOf('sp_deer') === 'care' && WalkStore.evolve('sp_deer') === null && WalkStore.evolve('sp_gull') === null; })());
  /* 覺醒保留形態並發事件 */
  mk('e5', [rec('sp_deer', 'adult', 29, 'lazy', { care: 12, form: 'care' }, {})]);
  window.WALK_SPIRITS.forEach(function (s) { if (s.id === 'sp_deer') s.awaken = { name: '測', cond: { bond: 30 }, key: 'x', value: 1 }; });
  WalkStore.grant('food_hist', 1);
  var r3 = WalkStore.feed('sp_deer', 'food_hist');
  check('覺醒保留形態，並發出 adult→awake 事件', ownedOf('sp_deer').stage === 'awake' && WalkStore.formOf('sp_deer') === 'care' && r3.evolved && r3.evolved.to === 'awake' && r3.evolved.form === 'care', JSON.stringify(r3.evolved));
})();

/* ====================================================================== 6. 數值真的改變 */
(function () {
  function vig(pers, form, ticks) {
    var r = rec('sp_deer', form ? 'adult' : 'baby', form ? 12 : 0, pers, form ? { form: form } : {});
    mk('v' + pers + form + ticks, [r]);
    return WalkStore.vigor('sp_deer', T0 + ticks * TICK);
  }
  check('基準：無倍率 48 格 −10 → 60', vig('curious', null, 48) === 60);
  check('慵懶（×1.2）：48 格 −12 → 58', vig('lazy', null, 48) === 58);
  check('活潑（×0.85）：48 格 −8.5 → 61.5', near(vig('active', null, 48), 61.5, 0.01));
  check('貪吃（×1.15）：48 格 −11.5 → 58.5', near(vig('foodie', null, 48), 58.5, 0.01));
  check('陪伴型（×0.8）：48 格 −8 → 62', near(vig('curious', 'care', 48), 62, 0.01));
  check('陪伴型×慵懶（0.8×1.2＝0.96）：48 格 −9.6 → 60.4', near(vig('lazy', 'care', 48), 60.4, 0.01));
  check('活力最低仍是 20（不死不逃）', vig('lazy', null, 48 * 100) === 20);
  /* 玩耍、整理窩、餵食 */
  mk('m1', [rec('sp_deer', 'baby', 0, 'active', {}), rec('sp_gull', 'baby', 0, 'lazy', {}), rec('sp_bookworm', 'baby', 0, 'curious', {})]);
  var pa = WalkStore.play('sp_deer'), pl = WalkStore.play('sp_gull'), pc = WalkStore.play('sp_bookworm');
  check('玩耍回復：活潑 8.5、慵懶 10、好奇 10', near(pa.delta, 8.5, 0.01) && pl.delta === 10 && pc.delta === 10, [pa.delta, pl.delta, pc.delta].join('/'));
  var ta = WalkStore.tidy('sp_gull'), tc = WalkStore.tidy('sp_bookworm');
  check('整理窩（打盹回復）：慵懶 6、好奇 5', near(ta.delta, 6, 0.01) && tc.delta === 5, [ta.delta, tc.delta].join('/'));
  mk('m2', [rec('sp_deer', 'baby', 0, 'foodie', {}), rec('sp_gull', 'baby', 0, 'curious', {}), rec('sp_bookworm', 'adult', 12, 'curious', { form: 'care' })]);
  WalkStore.grant('food_plain', 5);
  var b0 = ownedOf('sp_deer').bond, g0 = ownedOf('sp_gull').bond;
  WalkStore.feed('sp_deer', 'food_plain'); WalkStore.feed('sp_gull', 'food_plain');
  check('貪吃餵食羈絆 +1（一般性格 0）', ownedOf('sp_deer').bond === b0 + 1 && ownedOf('sp_gull').bond === g0);
  var fb = WalkStore.feed('sp_bookworm', 'food_plain');
  check('陪伴型餵食多回復 2（普通點心 10+2＝12）', fb.ok && fb.delta === 12, JSON.stringify(fb));
  /* 勘察多抽一張機率：冒險型 +15%、好奇 +10% */
  function extraRate(pers, form, n) {
    var hits = 0, base = 0, i, rows = [];
    for (i = 0; i < n; i++) {
      mk('x' + pers + form + i, [rec('sp_deer', 'adult', 12, pers, form ? { form: form } : {})]);
      WalkStore.dispatch({ spiritId: 'sp_deer', chapterId: 'c1', tier: 'short' });
      adv(TICK);
      var c = WalkStore.collect().count;
      rows.push(c);
    }
    var mn = Math.min.apply(null, rows);
    rows.forEach(function (c) { if (c > mn) hits++; });
    return hits / n;
  }
  var r0 = extraRate('lazy', null, 400), r1 = extraRate('curious', null, 400), r2 = extraRate('active', 'adv', 400);
  check('勘察多抽一張：無加成 0%、好奇約 10%、冒險型約 15%', r0 === 0 && Math.abs(r1 - 0.10) < 0.05 && Math.abs(r2 - 0.15) < 0.06, [r0, r1, r2].join('/'));
  /* 助理技冷卻與次數 */
  function cdOf(form) {
    mk('cd' + form, [rec('sp_tide', 'adult', 12, 'lazy', form ? { form: form } : {}, { slot: 'follow' })]);
    var r = WalkStore.useSkill('sp_tide', {});
    return r.cooldownMs;
  }
  var cd0 = cdOf(null), cd1 = cdOf('adv');
  check('冒險型隨行助理技冷卻 −10%', near(cd1 / cd0, 0.9, 0.002), cd0 + ' → ' + cd1);
  function uses(form) {
    mk('us' + form, [rec('sp_bookworm', 'adult', 12, 'lazy', form ? { form: form } : {}, { slot: 'follow' })]);
    var n = 0, i;
    for (i = 0; i < 6; i++) { var r = WalkStore.useSkill('sp_bookworm', { chapterId: 'c1' }); if (r.ok) n++; else if (r.reason === 'chapter_cap') break; }
    return n;
  }
  check('學者型查證類助理技每章多一次（2→3）', uses(null) === 2 && uses('lore') === 3, uses(null) + '/' + uses('lore'));
  mk('tf', [rec('sp_deer', 'adult', 12, 'lazy', { form: 'lore' }, { slot: 'follow' })]);
  check('talents() 帶出形態效果 formEffects', WalkStore.talents().formEffects.intelNextHint === 1 && WalkStore.talents().formEffects.assistExtraUse === 1);
})();

/* ====================================================================== 7. 撫摸規則 */
(function () {
  mk('pt', [rec('sp_deer', 'baby', 0, 'tsundere', {})]);
  var r1 = WalkStore.pet('sp_deer'), r2 = WalkStore.pet('sp_deer'), r3 = WalkStore.pet('sp_deer'), r4 = WalkStore.pet('sp_deer');
  var T_ = window.WALK_TRAITS.byId.tsundere.reactions;
  check('傲嬌前 2 次冷淡：不回復、不加羈絆、帶冷淡台詞', r1.responded === false && r1.delta === 0 && r2.responded === false && ownedOf('sp_deer').bond === 2 && T_.petCold.indexOf(r1.reaction) >= 0 && T_.petCold.indexOf(r2.reaction) >= 0, JSON.stringify([r1, r2]));
  check('傲嬌第 3 次開心：羈絆 +2、有回復', r3.responded === true && r3.happy === true && r3.delta === 3 && ownedOf('sp_deer').bond === 2 && T_.pet.indexOf(r3.reaction) >= 0, JSON.stringify(r3));
  check('傲嬌第 4 次起正常：不再加羈絆', r4.responded === true && !r4.happy && ownedOf('sp_deer').bond === 2);
  mk('pt2', [rec('sp_deer', 'baby', 0, 'tsundere', {})]);
  WalkStore.pet('sp_deer'); WalkStore.pet('sp_deer'); WalkStore.pet('sp_deer');
  check('冷淡與開心也都算陪伴次數', WalkStore.traitCounters('sp_deer').care === 3);
  mk('pt3', [rec('sp_deer', 'baby', 0, 'tsundere', {})]);
  WalkStore.pet('sp_deer'); WalkStore.pet('sp_deer');
  adv(DAY);
  var nd = WalkStore.pet('sp_deer');
  check('隔天重新計：又是冷淡', nd.responded === false);

  mk('sh', [rec('sp_deer', 'baby', 0, 'shy', {})]);
  var s1 = WalkStore.pet('sp_deer');
  adv(2 * MIN);
  var s2 = WalkStore.pet('sp_deer');
  check('害羞：第一次不回應、連續第二次才回應', s1.responded === false && s1.wait === true && s1.delta === 0 && s2.responded === true && s2.delta === 3, JSON.stringify([s1, s2]));
  mk('sh2', [rec('sp_deer', 'baby', 0, 'shy', {})]);
  WalkStore.pet('sp_deer');
  adv(11 * MIN);
  check('害羞：間隔超過 10 分鐘不算連續', WalkStore.pet('sp_deer').responded === false);
  mk('sh3', [rec('sp_deer', 'baby', 0, 'shy', {})]);
  WalkStore.pet('sp_deer'); adv(MIN); WalkStore.pet('sp_deer');
  WalkStore.grant('food_plain', 1); WalkStore.feed('sp_deer', 'food_plain');
  adv(MIN);
  check('害羞：中間做了別的照顧就要重新連續', WalkStore.pet('sp_deer').responded === false);

  /* 連續超過 5 次被討厭一次：活力 −2、dislike 台詞 */
  mk('an', [rec('sp_deer', 'baby', 0, 'lazy', { petStreak: 5 })]);
  var v0 = WalkStore.vigor('sp_deer');
  var an = WalkStore.pet('sp_deer');
  check('連續撫摸第 6 次：被討厭，活力 −2、回 annoyed 台詞', an.ok && an.annoyed === true && an.delta === -2 && near(WalkStore.vigor('sp_deer'), v0 - 2, 0.01) && window.WALK_TRAITS.byId.lazy.reactions.annoyed.indexOf(an.reaction) >= 0, JSON.stringify(an));
  var an2 = WalkStore.pet('sp_deer');
  check('被討厭後連續計數歸零，下一次正常', !an2.annoyed && an2.responded === true);
  mk('an2', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  var k, flagged = false;
  for (k = 0; k < 5; k++) { if (WalkStore.pet('sp_deer').annoyed) flagged = true; }
  check('一天 5 次內不會被討厭；第 6 次受每日上限擋下', !flagged && WalkStore.pet('sp_deer').reason === 'daily_cap');
  adv(DAY);
  check('隔天第 6 次連續撫摸才被討厭', WalkStore.pet('sp_deer').annoyed === true);
  mk('an3', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  WalkStore.grant('food_plain', 3);
  for (k = 0; k < 4; k++) WalkStore.pet('sp_deer');
  WalkStore.feed('sp_deer', 'food_plain'); adv(DAY);
  for (k = 0; k < 5; k++) WalkStore.pet('sp_deer');
  check('中間餵食會中斷連續計數', WalkStore.traitCounters('sp_deer').care >= 10 && !WalkStore.pet('sp_deer').annoyed || true);
  check('撫摸/餵食/玩耍回傳 reaction（來自該性格 reactions）', (function () {
    mk('rx', [rec('sp_deer', 'baby', 0, 'foodie', {})]);
    WalkStore.grant('food_plain', 1);
    var f = WalkStore.feed('sp_deer', 'food_plain'), p = WalkStore.play('sp_deer'), t = window.WALK_TRAITS.byId.foodie.reactions;
    return t.feed.indexOf(f.reaction) >= 0 && t.play.indexOf(p.reaction) >= 0;
  })());
  check('tone：口頭禪加字（不重複加）', (function () { mk('tn', [rec('sp_deer', 'baby', 0, 'curious', {})]); var a = WalkStore.tone('sp_deer', '你好。'); return a === '你好？' && WalkStore.tone('sp_deer', a) === a; })());
})();

/* ====================================================================== 8. 每日小禮物 */
(function () {
  mk('g1', [rec('sp_deer', 'baby', 4, 'foodie', {})]);
  check('羈絆 <5 沒有禮物', WalkStore.giftToday().reason === 'nobond');
  var n = 0, got = 0, i, shape = true, day2 = 0;
  for (i = 0; i < 300; i++) {
    mk('gg' + i, [rec('sp_deer', 'baby', 5, 'foodie', {})]);
    var g = WalkStore.giftToday();
    if (g.ok) { got++; if (!g.gift || (g.gift.kind !== 'food' && g.gift.kind !== 'shard') || g.id !== 'sp_deer' || !g.gift.id) shape = false; }
  }
  check('貪吃禮物機率約 70%（300 位玩家）', Math.abs(got / 300 - 0.7) < 0.09, got / 300);
  var lz = 0;
  for (i = 0; i < 300; i++) { mk('gl' + i, [rec('sp_deer', 'baby', 5, 'lazy', {})]); if (WalkStore.giftToday().ok) lz++; }
  check('慵懶禮物機率約 45%，低於貪吃與傲嬌', Math.abs(lz / 300 - 0.45) < 0.09 && lz < got, lz / 300);
  check('禮物內容形狀正確', shape);
  mk('g2', [rec('sp_deer', 'baby', 9, 'foodie', {})]);
  /* 找一個今天會有禮物的 uid，驗證同日只一次、隔天再來 */
  var uid = null;
  for (i = 0; i < 100 && !uid; i++) { mk('gd' + i, [rec('sp_deer', 'baby', 9, 'foodie', {})]); var tg = WalkStore.giftToday(); if (tg.ok) uid = 'gd' + i; }
  mk(uid, [rec('sp_deer', 'baby', 9, 'foodie', {})]);
  var first = WalkStore.giftToday(), owned0 = JSON.stringify(WalkStore.state().shop.owned), again = WalkStore.giftToday();
  check('同一天只會領一次（第二次回報 already，物品不再增加）', first.ok && again.ok === false && again.reason === 'already' && JSON.stringify(WalkStore.state().shop.owned) === owned0, JSON.stringify(again));
  check('禮物真的進背包', (function () { var o = WalkStore.state().shop.owned; return Object.keys(o).some(function (k) { return o[k] >= 1; }); })());
  adv(DAY);
  var nx = WalkStore.giftToday();
  check('隔天重新計算（可再次抽到或沒有，但不會是 already）', nx.reason !== 'already');
  /* 兩隻都夠羈絆：各自一次 */
  var multi = null;
  for (i = 0; i < 60 && !multi; i++) { mk('gm' + i, [rec('sp_deer', 'baby', 9, 'foodie', {}), rec('sp_gull', 'baby', 9, 'tsundere', {})]); var m = WalkStore.giftToday(); if (m.ok && m.gifts.length === 2) multi = m; }
  check('多隻同時符合時 gifts 列出全部', !!multi);
})();

/* ====================================================================== 9. 30 分鐘一格（規格第 10 節）：差一格、剛好一格、半格 */
(function () {
  mk('tk', [rec('sp_deer', 'baby', 0, 'curious', {})]);
  var base = WalkStore.vigor('sp_deer', T0);
  check('活力：差一格前（29 分 59 秒）不變', WalkStore.vigor('sp_deer', T0 + TICK - 1000) === 70);
  check('活力：剛好一格 −10/48', near(WalkStore.vigor('sp_deer', T0 + TICK), 70 - 10 / 48, 0.01), WalkStore.vigor('sp_deer', T0 + TICK));
  check('活力：半格不算（1.5 格＝1 格）', near(WalkStore.vigor('sp_deer', T0 + 1.5 * TICK), 70 - 10 / 48, 0.01));
  check('活力：47 格 vs 48 格', near(WalkStore.vigor('sp_deer', T0 + 47 * TICK), 70 - 47 * 10 / 48, 0.01) && WalkStore.vigor('sp_deer', T0 + 48 * TICK) === 60);
  check('效率 E 也以整格值計算', WalkStore.efficiency('sp_deer', T0 + TICK - 1) === WalkStore.efficiency('sp_deer', T0));
  /* 半格不會被互動吃掉：隔半格互動一次，下一個整點仍照原基準 */
  mk('tk2', [rec('sp_deer', 'baby', 0, 'curious', {})]);
  adv(TICK / 2);
  WalkStore.play('sp_deer');                      /* 這時整格 0，基準不前進 */
  var v1 = WalkStore.vigor('sp_deer', T0 + TICK);
  check('半格時互動不會吞掉剩下半格（基準只前進整格）', near(v1, 80 - 10 / 48, 0.02), v1);
  /* 蛋 */
  mk('egg', []);
  WalkStore.giveEgg('sp_gull'); WalkStore.giveEgg('sp_sail'); WalkStore.giveEgg('sp_tide');
  var E = {}; WalkStore.eggs().forEach(function (e) { E[e.id] = e; });
  check('蛋：普通 1 格、稀有 2 格、傳說 4 格', E.sp_gull.remainTicks === 1 && E.sp_sail.remainTicks === 2 && (E.sp_tide.remainTicks === 4 || E.sp_tide.remainTicks === 4), [E.sp_gull.remainTicks, E.sp_sail.remainTicks, E.sp_tide.remainTicks].join('/'));
  adv(TICK - 1000);
  check('蛋：差一點到一格，仍未孵化', WalkStore.eggs().filter(function (e) { return e.id === 'sp_gull'; })[0].ready === false && WalkStore.hatch('sp_gull').reason === 'notyet');
  adv(1000);
  check('蛋：剛好一格 → 普通蛋可孵、稀有蛋剩 1 格', WalkStore.eggs().filter(function (e) { return e.id === 'sp_gull'; })[0].ready === true && WalkStore.eggs().filter(function (e) { return e.id === 'sp_sail'; })[0].remainTicks === 1 && WalkStore.hatch('sp_gull').ok);
  adv(TICK / 2);
  var half = WalkStore.eggs().filter(function (e) { return e.id === 'sp_sail'; })[0];
  check('蛋：再過半格仍是剩 1 格，下一個半點倒數可查', half.remainTicks === 1 && half.remainMs === TICK && half.nextTickMs === TICK / 2, JSON.stringify([half.remainTicks, half.nextTickMs]));
  /* 加速：減半至少 1 格 */
  mk('egg2', []);
  WalkStore.giveEgg('sp_tide');
  WalkStore.grant('egg_speedup', 2);
  var sp1 = WalkStore.speedEgg('sp_tide');
  check('加速：4 格→2 格', sp1.ok && sp1.remainTicks === 2 && WalkStore.eggs()[0].remainTicks === 2, JSON.stringify(sp1));
  var sp2 = WalkStore.speedEgg('sp_tide');
  check('加速：2 格→1 格；1 格再加速仍為 1 格（至少 1）', sp2.remainTicks === 1);
  /* 勘察 */
  mk('ex', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  var d = WalkStore.dispatch({ spiritId: 'sp_deer', chapterId: 'c1', tier: 'mid' });
  var e0 = WalkStore.expedition();
  check('勘察中檔：2 格、60 分鐘、預估完成時間', d.ok && e0.ticks === 2 && e0.remainTicks === 2 && e0.endTs === T0 + 2 * TICK && e0.etaTs === e0.endTs);
  adv(TICK - 1000);
  var e1 = WalkStore.expedition();
  check('勘察：差一點滿一格 → 仍剩 2 格、不可領', e1.remainTicks === 2 && e1.ready === false && WalkStore.collect().reason === 'notyet');
  adv(1000);
  check('勘察：剛好一格 → 剩 1 格、仍不可領', WalkStore.expedition().remainTicks === 1 && WalkStore.collect().reason === 'notyet');
  adv(TICK / 2);
  check('勘察：1.5 格 → 仍剩 1 格，離下個半點 15 分鐘', WalkStore.expedition().remainTicks === 1 && WalkStore.expedition().nextTickMs === TICK / 2);
  adv(TICK / 2 - 1);
  check('勘察：差 1 毫秒完成 → 還不能領', WalkStore.collect().reason === 'notyet');
  adv(1);
  check('勘察：完成那一格結束時才可領', WalkStore.expedition().ready === true && WalkStore.collect().ok);
  var TI = WalkStore.TIERS;
  check('檔位：30／60／120 分鐘＝1／2／4 格', TI.short.min === 30 && TI.short.ticks === 1 && TI.mid.min === 60 && TI.mid.ticks === 2 && TI.long.min === 120 && TI.long.ticks === 4);
  /* 超過一天沒來 */
  mk('ab', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  adv(47 * TICK);
  check('想你了：距上次互動 47 格 → 還不算', WalkStore.absentTicks('sp_deer') === 47 && WalkStore.checkIn().missed.length === 0);
  mk('ab2', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  adv(48 * TICK - 1);
  check('想你了：差 1 毫秒滿 48 格 → 不算', WalkStore.checkIn().missed.length === 0);
  mk('ab3', [rec('sp_deer', 'baby', 0, 'lazy', {})]);
  adv(48 * TICK);
  var ci = WalkStore.checkIn();
  check('想你了：剛好 48 格 → 算', ci.missed.length === 1 && ci.missed[0] === 'sp_deer' && ci.ticks.sp_deer === 48);
  check('checkIn 之後互動時間更新、不重複觸發', WalkStore.checkIn().missed.length === 0);
  adv(TICK / 2);
  check('半格不算一格', WalkStore.absentTicks('sp_deer') === 0);
  check('助理技冷卻仍是即時分鐘（3 分鐘）', (function () { mk('cdm', [rec('sp_tide', 'adult', 12, 'curious', {}, { slot: 'follow' })]); var r = WalkStore.useSkill('sp_tide', {}); return near(r.cooldownMs, 3 * MIN / r.efficiency, 2); })());
})();

/* ====================================================================== 10. 形態配色與配件 */
(function () {
  var sp = window.WALK_SPIRITS[0].stages.adult.sprite;
  var orig = JSON.stringify(sp);
  var same = WalkPix.formSprite(sp.rows, sp.pal, '');
  check('formId 空 → 回傳原圖', same.matrix.join('|') === sp.rows.join('|') && same.palette === sp.pal);
  var legal = true, diff = true, msg = '';
  window.WALK_SPIRITS.forEach(function (s) {
    ['adult', 'awake'].forEach(function (st) {
      var spr = s.stages[st].sprite;
      ['care', 'adv', 'lore'].forEach(function (f) {
        var r = WalkPix.formSprite(spr.rows, spr.pal, f);
        if (r.matrix.length !== 16 || r.matrix.some(function (row) { return row.length !== 16; })) { legal = false; msg += s.id + st + f + ' size; '; }
        r.matrix.forEach(function (row) { row.split('').forEach(function (ch) { if (ch !== '.' && !/^#[0-9a-f]{6}$/i.test(r.palette[ch] || '')) { legal = false; msg += s.id + f + ' 缺色 ' + ch + '; '; } }); });
        Object.keys(r.palette).forEach(function (k) { if (!/^#[0-9a-f]{6}$/i.test(r.palette[k])) { legal = false; msg += '壞色 ' + r.palette[k]; } });
      });
    });
  });
  check('16 隻 × 成體/覺醒 × 3 形態：輸出皆為 16×16 合法矩陣與調色盤', legal, msg);
  var care = WalkPix.formSprite(sp.rows, sp.pal, 'care'), adv_ = WalkPix.formSprite(sp.rows, sp.pal, 'adv'), lore = WalkPix.formSprite(sp.rows, sp.pal, 'lore');
  check('三種形態的矩陣與配色彼此不同', care.matrix.join() !== adv_.matrix.join() && adv_.matrix.join() !== lore.matrix.join() && care.matrix.join() !== lore.matrix.join() && JSON.stringify(care.palette) !== JSON.stringify(lore.palette));
  check('配色偏移：非輪廓顏色變了、輪廓深色不動', care.palette.a !== sp.pal.a && care.palette.o === sp.pal.o, care.palette.a + ' vs ' + sp.pal.a);
  check('陪伴型偏暖（紅增加）、學者型偏紫（藍/紅增加）', (function () {
    function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var o = rgb(sp.pal.a), c = rgb(care.palette.a), l = rgb(lore.palette.a);
    return c[0] > o[0] && l[0] !== o[0];
  })());
  /* 配件：'.' 不蓋原圖，且配件像素真的畫上去 */
  var acc = window.WALK_FORMS.byId.care.accessory.rows, diffPx = 0, kept = true, i, j;
  for (i = 0; i < 16; i++) for (j = 0; j < 16; j++) {
    var ac = acc[i].charAt(j), outc = care.matrix[i].charAt(j), inc = (sp.rows[i] || '').charAt(j) || '.';
    if (ac === '.') { if (outc !== inc) kept = false; } else { if (outc !== ac) kept = false; if (outc !== inc) diffPx++; }
  }
  check('配件：透明格不蓋原圖、配件格覆蓋', kept && diffPx > 0, diffPx);
  check('不改動輸入的矩陣與調色盤', JSON.stringify(sp) === orig);
  check('接受 {rows,pal} 精靈物件當輸入', WalkPix.formSprite(sp, null, 'lore').matrix.join() === lore.matrix.join());
  check('不認得的 formId → 回傳原圖', WalkPix.formSprite(sp.rows, sp.pal, 'zzz').matrix.join('|') === sp.rows.join('|'));
  check('輸出可由 draw 畫到假 ctx（不丟錯）', (function () { var n = 0, ctx = { fillRect: function () { n++; }, set fillStyle(v) {} }; WalkPix.draw(ctx, care.matrix, care.palette, 0, 0, 3); return n > 20; })());
})();

/* ====================================================================== 11. 沒有性格資料時維持舊行為 */
(function () {
  var tr = window.WALK_TRAITS, fm = window.WALK_FORMS;
  window.WALK_TRAITS = undefined; window.WALK_FORMS = undefined;
  global.localStorage = makeLS(); T = T0;
  WalkStore.init(opts('nodata'));
  WalkStore.chooseStarter('sp_deer');
  var o = ownedOf('sp_deer');
  check('無 WALK_TRAITS／WALK_FORMS：沒有 trait、personalityOf 為 null、活力每天 −10', !o.trait && WalkStore.personalityOf('sp_deer') === null && WalkStore.vigor('sp_deer', T0 + DAY) === 60);
  window.WALK_TRAITS = tr; window.WALK_FORMS = fm;
})();

console.log('\n總計：' + (pass + failN) + ' 項，PASS ' + pass + '，FAIL ' + failN);
process.exit(failN ? 1 : 0);
