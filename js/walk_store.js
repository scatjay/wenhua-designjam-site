/* 走讀遊戲：房間、圖鑑、小精靈、派遣、商店、訪客的資料與規則核心 WalkStore。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md 第 2 節；規則出處 ROOM_SPIRIT_DESIGN／SPIRIT_SKILLS_EXPEDITION／SHOP_ROOM_LIFE（1029）。
   純邏輯、無畫面；所有 UI 模組只透過它讀寫。
   持久化：有 Firebase ref（init 的 root）就寫 players/{uid}/{spirit|room|expedition|intel|dex|shop|chat}，沒有就用 localStorage（key walkstore_{uid}）。
   只在動作發生時寫一次，不輪詢。時間一律走 init 傳入的 now()；隨機一律是種子化的 mulberry32。
   資料來源（純資料，由別的檔提供）：window.WALK_SPIRITS／WALK_FOODS／WALK_TOYS／WALK_INTEL／WALK_SHOP／WALK_DEX，缺少時一律防呆。 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ 常數 */
  var DAY = 86400000;
  var MINUTE = 60000;
  var MAX_OWNED = 3;
  var SLOT_CAP = { follow: 1, scout: 2 };
  var VIGOR_MIN = 20, VIGOR_MAX = 100, VIGOR_START = 70, VIGOR_DECAY_PER_DAY = 10;
  var REST_CAP = 60;                 /* 單隻每日房間互動可回補的活力上限 */
  var BOND_ADULT = 10;
  var ACT = {                        /* 房間互動：活力增量、每日次數 */
    feed: { vigor: 15, cap: 3, key: 'fed' },
    play: { vigor: 10, cap: 3, key: 'played' },
    pet: { vigor: 3, cap: 5, key: 'petted' },
    tidy: { vigor: 5, cap: 1, key: 'tidied' }
  };
  var TICK = 1800000;                /* 規格第 10 節：寵物狀態以 30 分鐘為一格 */
  var TICKS_PER_DAY = 48;
  var ABSENT_TICKS = 48;             /* 距上次互動 >= 48 格 ＝ 超過一天沒來 */
  var TIERS = {                      /* 勘察檔位：分鐘、格數、基礎件數 */
    short: { min: 30, ticks: 1, base: 1 },
    mid: { min: 60, ticks: 2, base: 2 },
    long: { min: 120, ticks: 4, base: 3 }
  };
  var SHY_WINDOW = 10 * 60000;       /* 害羞：兩次撫摸的最大間隔 */
  var PET_ANNOY_STREAK = 5;          /* 連續撫摸超過 5 次（第 6 次）會被討厭一次 */
  var GIFT_BOND = 5;
  var ROOM_TOTAL = 3;                /* 規格第 11 節：房間 3 格，蛋與小精靈共用 */
  var WAIT_MAX = 6;                  /* 待孵清單上限（不佔格、不計時） */
  var TRADE_EXP = 10 * MINUTE;       /* 規格第 12 節：提案 10 分鐘內有效 */
  var TRADE_DAILY = 3;
  var TRADE_LOG_KEEP = 40;
  var STAT_CAP = 300;
  var NIGHT_FROM = 18, NIGHT_TO = 5;
  var FORM_IDS = ['care', 'adv', 'lore'];
  var FORM_NORM = { care: 12, adv: 10, lore: 8 };
  var COUNTER_MAX = 9999;
  var EXPEDITION_MAX_CARDS = 5;
  var EXPEDITION_DAILY = 3;
  var CHAT_DAILY = 20;
  var HATCH_MS = 6 * 3600000;        /* 蛋預設孵化時間（資料可用 hatchHours 覆蓋；實際換成格數） */
  var HATCH_BOOST_COST = 20;
  var FURNITURE_DAILY = 3, FOOD_DAILY = 10;
  var FIRST_BUY_DISCOUNT = 0.5;
  var SNAPSHOT_MAX_BYTES = 4096;
  var FOOTPRINT_HOSTS_DAILY = 10;
  var VISITED_KEEP = 20;
  var STICKERS = ['like', 'wow', 'learn', 'pass'];   /* 讚、好厲害、想借鏡、路過（固定貼圖代碼，沒有文字輸入） */
  var SPOTS = ['wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6',
    'floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6',
    'window1', 'window2', 'window3'];
  var MILESTONES = [25, 50, 75, 100];
  var ATTR_NAMES = ['觀察', '溝通', '智識', '行動', '守護'];

  /* 角色＋小精靈「特別搭檔」（手寫，每個職務一個示例；以小精靈名稱比對） */
  var SPECIALS = [
    { role: '隊長', spirit: '帆影', label: '揚帆', desc: '號召集合時冷卻減半' },
    { role: '領航員', spirit: '潮汐鯨魂', label: '潮聲探路', desc: '路線畫線更長' },
    { role: '軍師', spirit: '書卷蠹魚', label: '引經據典', desc: '免費提示附出處' },
    { role: '偵查員', spirit: '鹿影', label: '循跡', desc: '隱藏關卡方位卡更精準' },
    { role: '檔案官', spirit: '算盤獸', label: '對帳', desc: '答對選擇題多加分一次' },
    { role: '訪談員', spirit: '老收音機妖', label: '調頻', desc: 'NPC 好感提示更清楚' },
    { role: '蒐證員', spirit: '數位拓印魚', label: '定格', desc: '拍照任務品質提示' },
    { role: '記錄官', spirit: '墨靈', label: '文思', desc: '書寫起手式多一種' },
    { role: '文化設計員', spirit: '紅磚貓', label: '構件', desc: '規則卡多抽一張' },
    { role: '通訊官', spirit: '電報鳥', label: '同頻', desc: '廣播多一種範本' },
    { role: '安全官', spirit: '城門石獅靈', label: '雙盾', desc: '警戒範圍加大' },
    { role: '補給官', spirit: '算盤獸', label: '精算', desc: '折扣疊加上限放寬' },
    { role: '鑑識員', spirit: '紅磚貓', label: '放大', desc: '觀察提示多一個細節' },
    { role: '技術專家', spirit: '霓虹蛾', label: '微光', desc: '夜間定位更準' },
    { role: '在地嚮導', spirit: '鹿影', label: '老路', desc: '路況卡更詳細' },
    { role: '扮演專員', spirit: '老收音機妖', label: '入戲', desc: 'NPC 回話更長' }
  ];

  /* ------------------------------------------------------------------ 小工具 */
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function isObj(x) { return x !== null && typeof x === 'object' && !isArr(x); }
  function cl(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function keys(o) { return isObj(o) ? Object.keys(o) : []; }
  function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function r2(v) { return Math.round(v * 100) / 100; }

  var imul = Math.imul || function (a, b) {
    var ah = (a >>> 16) & 0xffff, al = a & 0xffff, bh = (b >>> 16) & 0xffff, bl = b & 0xffff;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
  };
  function hashStr(s) {
    s = String(s);
    var h = 1779033703 ^ s.length, i;
    for (i = 0; i < s.length; i++) { h = imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = imul(h ^ (h >>> 16), 2246822507);
    h = imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = imul(a ^ (a >>> 15), 1 | a);
      t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(ts) {             /* 當地日期 YYYY-MM-DD */
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function byteLen(s) {              /* UTF-8 位元組數 */
    var n = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }
  function fail(reason, extra) {
    var o = { ok: false, reason: reason };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    return o;
  }
  function win() { return root; }

  /* ------------------------------------------------------------------ 資料來源（防呆） */
  /* 陣列或 id→物件的對照表，統一成陣列（補上 id） */
  function listOf(x) {
    var out = [], k, v;
    if (!x) return out;
    if (isArr(x)) return x.filter(function (v2) { return isObj(v2); });
    if (isObj(x)) {
      for (k in x) {
        if (!Object.prototype.hasOwnProperty.call(x, k)) continue;
        v = x[k];
        if (isObj(v)) { if (v.id === undefined) { v = cl(v); v.id = k; } out.push(v); }
      }
    }
    return out;
  }
  function spirits() { var d = win().WALK_SPIRITS; if (isObj(d) && isArr(d.list)) d = d.list; if (isObj(d) && isArr(d.items)) d = d.items; return listOf(d); }
  function spiritDef(id) { var a = spirits(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function foods() { var d = win().WALK_FOODS; if (isObj(d) && isArr(d.items)) d = d.items; return listOf(d); }
  function foodDef(id) { var a = foods(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function foodCat(f) { return f ? (f.cat || f.kind || f.type || f.category || '') : ''; }
  function toys() { var d = win().WALK_TOYS; if (isObj(d) && isArr(d.items)) d = d.items; return listOf(d); }
  function toyDef(id) { var a = toys(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  /* 商店目錄：可以是陣列、{items:[]}、{catalog:[]}、或 {分類:[…]}、或 id→物件 */
  function shopItems() {
    var d = win().WALK_SHOP, out = [], k, arr;
    if (!d) return out;
    if (isArr(d)) return d.filter(isObj);
    if (isArr(d.items)) return d.items.filter(isObj);
    if (isArr(d.catalog)) return d.catalog.filter(isObj);
    if (isObj(d.items)) return listOf(d.items);
    for (k in d) {
      if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
      arr = d[k];
      if (isArr(arr)) {
        arr.forEach(function (it) { if (isObj(it)) { var c = cl(it); if (!c.cat) c.cat = k; out.push(c); } });
      }
    }
    return out;
  }
  function shopDef(id) { var a = shopItems(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function itemGroup(it) {           /* 家具／食材 兩個有每日上限的類別，其餘回傳 null */
    var c = String(it.cat || it.kind || it.type || it.category || '');
    if (/furn|家具|套裝|suit|set/i.test(c)) return 'furniture';
    if (/food|食|snack|點心/i.test(c)) return 'food';
    return null;
  }
  function itemZone(it) {
    var z = String(it.spot || it.slot || it.zone || '');
    if (/pet|窩|小精靈/i.test(z)) return 'pet';
    if (/wall|牆/i.test(z)) return 'wall';
    if (/floor|地/i.test(z)) return 'floor';
    if (/window|窗/i.test(z)) return 'window';
    return null;
  }
  function rarityLocked(it) { if (it.noBuy) return true; var r = String(it.rarity || ''); return r === '稀有' || r === '傳說' || r === 'rare' || r === 'legendary'; }

  /* 情報卡：陣列（帶 chapter）或 {chapterId:[cards]} */
  function intelAll() {
    var d = win().WALK_INTEL, out = [], k;
    if (!d) return out;
    if (isObj(d) && isArr(d.cards)) d = d.cards;
    if (isArr(d)) return d.filter(function (c) { return isObj(c) && c.id !== undefined; });
    if (isObj(d)) {
      for (k in d) {
        if (!Object.prototype.hasOwnProperty.call(d, k) || !isArr(d[k])) continue;
        d[k].forEach(function (c) { if (isObj(c) && c.id !== undefined) { if (c.chapter === undefined) { c = cl(c); c.chapter = k; } out.push(c); } });
      }
    }
    return out;
  }
  function intelByChapter(ch) { return intelAll().filter(function (c) { return c.chapter === ch; }); }
  function normKind(s) { return String(s || '').replace(/卡/g, ''); }
  function kindMatches(sp, card) {   /* 小精靈勘察專長是否涵蓋該卡的類別 */
    var kind = sp && sp.scout ? sp.scout.kind : null;
    if (!kind) return false;
    var t = normKind(card.type), kinds = isArr(kind) ? kind : [kind], i;
    if (!t.length) return false;
    for (i = 0; i < kinds.length; i++) {
      var k = String(kinds[i]);
      if (/^(全部|全|all)$/i.test(k)) return true;
      if (normKind(k).indexOf(t) >= 0) return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ 性格與形態資料（walk_data_traits.js，缺少時一律中性） */
  var tCache = { src: null, list: [], map: {} }, fCache = { src: null, list: [], map: {} };
  function refreshCache(c, src) {
    if (c.src === src) return;
    c.src = src; c.list = []; c.map = {};
    var d = src;
    if (isObj(d) && isArr(d.list)) d = d.list;
    c.list = listOf(d);
    c.list.forEach(function (x) { c.map[x.id] = x; });
  }
  function traitList() { refreshCache(tCache, win().WALK_TRAITS); return tCache.list; }
  function traitDef(id) { traitList(); return tCache.map[id] || null; }
  function formList() { refreshCache(fCache, win().WALK_FORMS); return fCache.list; }
  function formDef(id) { formList(); return fCache.map[id] || null; }
  function formsOn() { return formList().length > 0; }
  function traitsActive() { return traitList().length > 0 || formList().length > 0; }
  function tdOf(o) { return o && isObj(o.trait) && o.trait.pers ? traitDef(o.trait.pers) : null; }
  function fdOf(o) {
    if (!o || !isObj(o.trait) || !o.trait.form) return null;
    if (o.stage !== 'adult' && o.stage !== 'awake') return null;
    return formDef(o.trait.form);
  }
  function modOf(o, key, def) { var td = tdOf(o); return td && isObj(td.mods) && typeof td.mods[key] === 'number' ? td.mods[key] : def; }
  function feffOf(o, key, def) {
    var fd = fdOf(o), i;
    if (fd && isArr(fd.effect)) for (i = 0; i < fd.effect.length; i++) if (isObj(fd.effect[i]) && fd.effect[i].key === key && typeof fd.effect[i].value === 'number') return fd.effect[i].value;
    return def;
  }
  function decayMul(o) { return modOf(o, 'decayMul', 1) * feffOf(o, 'vigorDecayMul', 1); }

  /* ------------------------------------------------------------------ 狀態 */
  var C = null;                      /* init 傳入的設定 */
  var S = null;                      /* 狀態 */
  var listeners = [];
  var loaded = true;
  var readyCbs = [];
  var visited = {};                  /* 本次造訪過的房間快照（記憶體） */

  function defaults() {
    return {
      spirit: { v: 1, owned: [], eggs: [], starter: false, released: [] },
      room: { v: 1, spots: {}, window: 'auto', open: 'team', guestBook: true, photosPublic: false },
      expedition: {},
      intel: {},
      dex: { claimed: {}, seen: {}, visited: {} },
      shop: { owned: {}, daily: {}, firstBuy: false },
      chat: {}
    };
  }
  var SECTIONS = ['spirit', 'room', 'expedition', 'intel', 'dex', 'shop', 'chat'];

  /* Firebase 會吃掉空陣列與空物件，載入後補回預設 */
  function normalize(st) {
    var d = defaults(), k, sec;
    st = isObj(st) ? st : {};
    for (k = 0; k < SECTIONS.length; k++) {
      sec = SECTIONS[k];
      if (!isObj(st[sec])) st[sec] = d[sec];
    }
    var sp = st.spirit;
    if (!isArr(sp.owned)) sp.owned = [];
    if (!isArr(sp.eggs)) sp.eggs = [];
    if (!isArr(sp.released)) sp.released = [];
    if (sp.v === undefined) sp.v = 1;
    sp.starter = !!sp.starter;
    sp.owned = sp.owned.filter(isObj);
    sp.eggs = sp.eggs.filter(isObj);
    if (!isArr(sp.waiting)) sp.waiting = [];
    sp.waiting = sp.waiting.filter(isObj);
    if (!isObj(sp.tradeLog)) sp.tradeLog = {};
    (function () { var seenF = false; sp.owned.forEach(function (o) { if (o.slot === 'follow') { if (seenF) o.slot = 'room'; else seenF = true; } }); })();   /* 隨行位保證只有 1 隻 */
    if (!isObj(st.dex.stat)) st.dex.stat = {};
    var stt = st.dex.stat;
    if (!isObj(stt.stops)) stt.stops = {};
    if (!isObj(stt.ever)) stt.ever = {};
    stt.night = num(stt.night); stt.expeditions = num(stt.expeditions);
    if (!isArr(st.dex.titlePending)) st.dex.titlePending = [];
    if (!isObj(st.shop.shards)) st.shop.shards = {};
    var r = st.room;
    if (!isObj(r.spots)) r.spots = {};
    if (!r.window) r.window = 'auto';
    if (r.open !== 'closed' && r.open !== 'team' && r.open !== 'all') r.open = 'team';
    if (r.guestBook === undefined) r.guestBook = true;
    r.photosPublic = !!r.photosPublic;
    if (!isObj(st.dex.claimed)) st.dex.claimed = {};
    if (!isObj(st.dex.seen)) st.dex.seen = {};
    if (!isObj(st.dex.visited)) st.dex.visited = {};
    if (!isObj(st.dex.vinfo)) st.dex.vinfo = {};
    if (!isObj(st.dex.titles)) st.dex.titles = {};
    if (!isObj(st.shop.looks)) st.shop.looks = {};
    if (!isObj(st.shop.owned)) st.shop.owned = {};
    if (!isObj(st.shop.daily)) st.shop.daily = {};
    st.shop.firstBuy = !!st.shop.firstBuy;
    return st;
  }

  function now() { return C && typeof C.now === 'function' ? C.now() : Date.now(); }
  function today() { return dateStr(now()); }
  function toast(m) { try { if (C && typeof C.toast === 'function') C.toast(m); } catch (e) { /* 忽略 */ } }
  function emit(what, extra) {
    var i;
    for (i = 0; i < listeners.length; i++) { try { listeners[i](what, WalkStore, extra); } catch (e) { /* 單一監聽失敗不影響其他 */ } }
  }

  /* ---- 持久化 */
  function lsKey() { return 'walkstore_' + (C ? C.uid : ''); }
  function lsGet(k) { try { return root.localStorage ? root.localStorage.getItem(k) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { if (root.localStorage) root.localStorage.setItem(k, v); } catch (e) { /* 忽略 */ } }
  function lsDel(k) { try { if (root.localStorage) root.localStorage.removeItem(k); } catch (e) { /* 忽略 */ } }

  function refAt(path) {
    var r = C && C.root, parts, i;
    if (!r) return null;
    try {
      /* 優先用一次 child(path)；不支援多層的 ref 退回逐層 */
      return r.child(path);
    } catch (e) {
      parts = path.split('/');
      for (i = 0; i < parts.length; i++) r = r.child(parts[i]);
      return r;
    }
  }
  function fbSet(path, val) {
    var ref = refAt(path);
    if (!ref) return;
    try {
      var v = val === null || val === undefined ? null : cl(val);
      if (v === null && typeof ref.remove === 'function') ref.remove();
      else ref.set(v);
    } catch (e) { toast('存檔失敗，稍後再試'); }
  }

  function persist(secs) {
    var i;
    if (!C) return;
    if (C.root) {
      for (i = 0; i < secs.length; i++) fbSet('players/' + C.uid + '/' + secs[i], S[secs[i]]);
    } else {
      lsSet(lsKey(), JSON.stringify(S));
    }
  }
  var evq = [];                      /* 本次動作產生的進化事件 */
  var lastEv = null;
  var inAward = false;
  function commit(secs, what) {
    if (!inAward && S) {
      var more = false, pass;
      inAward = true;
      try { for (pass = 0; pass < 3; pass++) { if (!awardTitles()) break; more = true; } } catch (e) { /* 稱號判斷失敗不影響主流程 */ }
      inAward = false;
      if (more && secs.indexOf('dex') < 0) secs = secs.concat(['dex']);
    }
    persist(secs); emit(what || secs.join(','));
    if (evq.length) {
      var q = evq; evq = []; lastEv = (lastEv || []).concat(q);
      q.forEach(function (ev) { emit('evolve', ev); });
    }
  }

  /* ------------------------------------------------------------------ 每日桶 */
  function bucket() {
    var d = S.shop.daily, t = today(), k;
    if (!isObj(d[t])) {
      for (k in d) if (Object.prototype.hasOwnProperty.call(d, k) && k !== t) delete d[k];   /* 只留今天，資料量維持在數十位元組 */
      d[t] = {};
    }
    return d[t];
  }
  function sub(b, key) { if (!isObj(b[key])) b[key] = {}; return b[key]; }

  /* ------------------------------------------------------------------ 小精靈：基本查詢 */
  function rec(id) {
    var a = S.spirit.owned, i;
    for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function ticksBetween(a, b) { var d = num(b) - num(a); return d > 0 ? Math.floor(d / TICK) : 0; }
  function vigorAt(o, t) {
    var v = num(o.vigor, VIGOR_START), last = num(o.lastTs, t);
    var ticks = ticksBetween(last, t);
    if (v <= VIGOR_MIN) return v;
    /* 每格 −10÷48，性格與形態的倍率照乘，先乘再算（整格累積，不足一格不變） */
    return r2(Math.max(VIGOR_MIN, v - r2(ticks * VIGOR_DECAY_PER_DAY / TICKS_PER_DAY * decayMul(o))));
  }
  function eff(v) { return r2(0.5 + 0.7 * (clamp(v, VIGOR_MIN, VIGOR_MAX) - VIGOR_MIN) / 80); }
  function settle(o) {              /* 基準只前進整格；seenTs 記最後互動時間 */
    var t = now(), n = ticksBetween(num(o.lastTs, t), t);
    o.vigor = vigorAt(o, t);
    o.lastTs = n > 0 ? num(o.lastTs, t) + n * TICK : num(o.lastTs, t);
    o.seenTs = t;
  }

  function markSeen(cat, id) {
    if (!isObj(S.dex.seen[cat])) S.dex.seen[cat] = {};
    if (!S.dex.seen[cat][id]) { S.dex.seen[cat][id] = 1; return true; }
    return false;
  }

  function chaptersCount() { try { var c = C && C.chaptersDone ? C.chaptersDone() : 0; return isArr(c) ? c.length : num(c, 0); } catch (e) { return 0; } }
  function pointsNow() { try { return C && C.getPoints ? num(C.getPoints(), 0) : 0; } catch (e) { return 0; } }
  function intelCount() { var n = 0; keys(S.intel).forEach(function (ch) { n += keys(S.intel[ch]).length; }); return n; }

  /* ------------------------------------------------------------------ 圖鑑 */
  function dexInfo() {
    var def = win().WALK_DEX, cats = [], sumHave = 0, sumTotal = 0, out = [], i;
    if (isObj(def) && isArr(def.cats)) cats = def.cats; else if (isObj(def) && isArr(def.categories)) cats = def.categories; else if (isArr(def)) cats = def;
    cats.forEach(function (c) {
      if (!isObj(c)) return;
      var id = c.id, have, total;
      if (id === 'intel' || id === 'clue') have = intelCount();
      else have = keys(S.dex.seen[id]).length;
      total = num(c.total, 0) || (isArr(c.ids) ? c.ids.length : 0);
      if (!total) {
        if (id === 'spirit') total = spirits().length;
        else if (id === 'intel' || id === 'clue') total = intelAll().length || num(c.approxTotal, 0);
      }
      if (total && have > total) have = total;
      sumHave += have; sumTotal += total;
      out.push({ id: id, name: c.name || id, have: have, total: total });
    });
    var pct = sumTotal > 0 ? Math.floor(100 * sumHave / sumTotal) : 0;
    var ms = {};
    for (i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      ms[m] = S.dex.claimed[m] ? 'claimed' : (pct >= m ? 'ready' : 'locked');
    }
    var spN = spirits().length, fPer = formList().length || 3, fTot = spN * fPer, fHave = keys(S.dex.seen.form).length, sHave = keys(S.dex.seen.spirit).length;
    if (fHave > fTot) fHave = fTot;
    if (sHave > spN) sHave = spN;
    var forms = { have: fHave, total: fTot, pct: fTot ? Math.floor(100 * fHave / fTot) : 0 };
    var book = { have: sHave + fHave, total: spN + fTot, pct: spN + fTot ? Math.floor(100 * (sHave + fHave) / (spN + fTot)) : 0 };
    return { cats: out, have: sumHave, total: sumTotal, pct: pct, milestones: ms, forms: forms, spiritBook: book };
  }

  /* ------------------------------------------------------------------ 階段 */
  function awakenCond(sp) {
    var cond = sp && sp.awaken ? sp.awaken.cond : null, meta = win().WALK_SPIRIT_META, pct = { '普通': 15, '稀有': 30, '傳說': 50 };
    if (isObj(cond)) return cond;
    if (!sp || !sp.awaken) return null;
    if (isObj(meta) && isObj(meta.awaken)) { if (isObj(meta.awaken.dexPct)) pct = meta.awaken.dexPct; }
    return { bond: isObj(meta) && isObj(meta.awaken) && meta.awaken.bond !== undefined ? meta.awaken.bond : 30, dexPct: pct[sp.rarity] !== undefined ? pct[sp.rarity] : 15 };
  }
  function hatchTicks(sp) { return Math.max(1, Math.ceil(hatchMs(sp) / TICK - 1e-9)); }
  function hatchMs(sp) {
    var meta = win().WALK_SPIRIT_META;
    if (sp && sp.hatchHours !== undefined) return num(sp.hatchHours) * 3600000;
    if (sp && isObj(meta) && isObj(meta.hatch) && meta.hatch[sp.rarity] !== undefined) return num(meta.hatch[sp.rarity]) * MINUTE;
    return HATCH_MS;
  }
  function awakenOK(sp, o) {
    var cond = awakenCond(sp);
    if (!isObj(cond)) return false;
    if (cond.bond !== undefined && num(o.bond) < cond.bond) return false;
    if (cond.dexPct !== undefined && dexInfo().pct < cond.dexPct) return false;
    if (cond.intel !== undefined && intelCount() < cond.intel) return false;
    if (cond.chapters !== undefined && chaptersCount() < cond.chapters) return false;
    return true;
  }
  function restage(o) {
    var sp = spiritDef(o.id), on = formsOn();
    if (o.stage === 'baby' && num(o.bond) >= BOND_ADULT) {
      o.stage = 'adult';
      if (on) { settle(o); pushEvolve(o, 'baby', 'adult', true); }
    }
    if (o.stage === 'adult' && sp && awakenOK(sp, o)) {
      o.stage = 'awake';
      if (on) { settle(o); pushEvolve(o, 'adult', 'awake', false); }
    }
  }
  function addBond(o, n) { o.bond = num(o.bond) + n; restage(o); }

  /* ------------------------------------------------------------------ 共鳴 */
  function roleObj(role) {
    var w = win(), r = null, A, st, era;
    if (isObj(role)) r = role;
    else if (typeof role === 'string' && w.WALK_AGENTS && typeof w.WALK_AGENTS.get === 'function') {
      A = w.WALK_AGENTS.get(role);
      if (A) r = A;
    }
    if (!r && typeof role === 'string') r = { role: role };
    if (!r) return null;
    st = r.stats;
    if (!isArr(st) && typeof role === 'string' && w.WALK_AGENT_STATS) {
      /* 屬性值若不在名冊上，退回 WALK_AGENT_STATS 的 byRole 表（若存在） */
      var br = w.WALK_AGENT_STATS.byRole;
      if (isObj(br) && isArr(br[role])) st = br[role];
    }
    era = r.era !== undefined ? r.era : (r.eras !== undefined ? r.eras : (r.spec !== undefined ? r.spec : (r.specialty !== undefined ? r.specialty : null)));
    var fam = r.famEras !== undefined ? r.famEras : null, rn = r.role || (typeof role === 'string' ? role : '');
    if ((era === null || era === undefined) && fam === null && rn && isObj(w.WALK_AGENT_ERAS) && isObj(w.WALK_AGENT_ERAS[rn])) {   /* 探員歷史專長資料檔：專精＝eras（3 級）、熟悉＝famEras（2 級） */
      era = w.WALK_AGENT_ERAS[rn].eras; fam = w.WALK_AGENT_ERAS[rn].famEras;
    }
    return { role: rn, stats: isArr(st) ? st : null, era: era, fam: fam };
  }
  function attrIndex(sp) {
    if (!sp) return -1;
    return ATTR_NAMES.indexOf(sp.attr);
  }
  /* 小精靈的時期名：資料欄 scout.era，以及 eraId 對應 WALK_SPIRIT_META.eras 的基本時期名（例如「戰後與文學」也算「戰後」） */
  function spiritEraNames(sp) {
    var out = [], m = win().WALK_SPIRIT_META, i;
    if (sp && sp.scout && sp.scout.era) out.push(String(sp.scout.era));
    if (sp && sp.era) out.push(String(sp.era));
    if (sp && sp.eraId && isObj(m) && isArr(m.eras)) for (i = 0; i < m.eras.length; i++) if (m.eras[i].id === sp.eraId) out.push(String(m.eras[i].name));
    return out;
  }
  function eraMatch(sp, era) {
    var names = spiritEraNames(sp), i, j;
    if (!names.length || era === null || era === undefined) return false;
    if (isArr(era)) { for (i = 0; i < era.length; i++) for (j = 0; j < names.length; j++) if (String(era[i]) === names[j]) return true; return false; }
    return names.indexOf(String(era)) >= 0;
  }
  function computeResonance(sp, role) {
    var res = { kinds: [], primary: '平常', resonance: false, fill: false, history: false, special: null,
      cdMul: 1, qualityMul: 1, extraItems: 0, statBonus: null, role: '', spirit: sp ? sp.id : null };
    var ro = roleObj(role);
    if (!sp || !ro) return res;
    res.role = ro.role;
    var ai = attrIndex(sp), st = ro.stats, max, min;
    if (sp.attr === '全') {
      res.resonance = true;
    } else if (isArr(st) && ai >= 0 && ai < st.length) {
      max = Math.max.apply(null, st); min = Math.min.apply(null, st);
      if (st[ai] === max) res.resonance = true;
      else if (st[ai] === min && st[ai] <= 2) res.fill = true;
    }
    if (eraMatch(sp, ro.era)) { res.history = true; res.historyLevel = 'expert'; }       /* 專精時期（3 級）＝小精靈時期 → 歷史共鳴 */
    else if (eraMatch(sp, ro.fam)) { res.history = true; res.historyLevel = 'familiar'; } /* 熟悉時期（2 級）→ 較弱的歷史共鳴，效果減半 */
    if (res.resonance) { res.kinds.push('共鳴'); res.qualityMul = 1.5; res.cdMul = 0.8; }
    if (res.fill) { res.kinds.push('補位'); res.statBonus = {}; res.statBonus[ai] = 1; }
    if (res.history) { res.kinds.push('歷史共鳴'); res.extraItems = res.historyLevel === 'familiar' ? 0.5 : 1; res.expertUnlock = res.historyLevel === 'expert'; }
    var i, pairs = win().WALK_SPIRIT_PAIRS;
    if (isArr(pairs)) {
      for (i = 0; i < pairs.length; i++) {
        if (isObj(pairs[i]) && pairs[i].role === ro.role && (pairs[i].spirit === sp.id || pairs[i].spirit === sp.name)) {
          res.special = { label: pairs[i].name || '', desc: pairs[i].desc || '', effect: pairs[i].effect ? cl(pairs[i].effect) : null };
          res.kinds.push('專屬'); break;
        }
      }
    } else {
      for (i = 0; i < SPECIALS.length; i++) {
        if (SPECIALS[i].role === ro.role && SPECIALS[i].spirit === sp.name) { res.special = { label: SPECIALS[i].label, desc: SPECIALS[i].desc, effect: null }; res.kinds.push('專屬'); break; }
      }
    }
    res.primary = res.kinds.length ? res.kinds[0] : '平常';
    return res;
  }

  /* ------------------------------------------------------------------ 公開介面 */
  var WalkStore = {
    VERSION: 1,
    SPOTS: SPOTS,
    STICKERS: STICKERS,
    MILESTONES: MILESTONES,
    TIERS: TIERS,
    _c: { TICK: TICK, TICKS_PER_DAY: TICKS_PER_DAY, ABSENT_TICKS: ABSENT_TICKS, DAY: DAY, REST_CAP: REST_CAP, MAX_OWNED: MAX_OWNED, HATCH_MS: HATCH_MS, EXPEDITION_DAILY: EXPEDITION_DAILY, CHAT_DAILY: CHAT_DAILY,
      SNAPSHOT_MAX_BYTES: SNAPSHOT_MAX_BYTES, FURNITURE_DAILY: FURNITURE_DAILY, FOOD_DAILY: FOOD_DAILY, HATCH_BOOST_COST: HATCH_BOOST_COST },
    _util: { mulberry32: mulberry32, hashStr: hashStr, dateStr: dateStr, byteLen: byteLen },

    init: function (opts) {
      var raw, parsed, cnt = 0, i, sec, self = this;
      C = opts || {};
      if (!C.uid) C.uid = 'anon';
      visited = {};
      peerCache = {};
      tradeCache = { incoming: [], outgoing: [] };
      readyCbs = readyCbs.slice();
      if (C.root) {
        S = normalize(defaults());
        loaded = false;
        for (i = 0; i < SECTIONS.length; i++) {
          (function (secName) {
            var ref = refAt('players/' + C.uid + '/' + secName);
            if (!ref) { cnt++; if (cnt >= SECTIONS.length) finishLoad(); return; }
            ref.once('value', function (snap) {
              var v = snap && typeof snap.val === 'function' ? snap.val() : null;
              if (v !== null && v !== undefined) S[secName] = v;
              cnt++;
              if (cnt >= SECTIONS.length) finishLoad();
            }, function () { cnt++; if (cnt >= SECTIONS.length) finishLoad(); });
          })(SECTIONS[i]);
        }
      } else {
        raw = lsGet(lsKey());
        parsed = null;
        if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
        S = normalize(parsed || defaults());
        loaded = true;
        backfillAll();
        if (fillSlots()) persist(['spirit']);
      }
      function finishLoad() {
        S = normalize(S);
        loaded = true;
        backfillAll();
        if (fillSlots()) persist(['spirit']);
        var cbs = readyCbs; readyCbs = [];
        for (var j = 0; j < cbs.length; j++) { try { cbs[j](self); } catch (e) { /* 忽略 */ } }
        emit('loaded');
      }
      return this;
    },

    /* 載入完成時呼叫（Firebase 模式為非同步；localStorage 模式立即呼叫） */
    ready: function (fn) {
      if (typeof fn !== 'function') return;
      if (loaded) fn(this); else readyCbs.push(fn);
    },
    isReady: function () { return loaded; },

    state: function () { return cl(S); },
    on: function (fn) { if (typeof fn === 'function' && listeners.indexOf(fn) < 0) listeners.push(fn); },
    off: function (fn) { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); },

    /* ---------------------------------------------------------------- 小精靈 */
    starters: function () {
      var a = spirits().filter(function (s) { return s.starter; }).map(function (s) { return s.id; });
      if (a.length >= 3) return a.slice(0, 3);
      /* 資料沒標 starter 時，依名稱退回規格的三選一 */
      var names = ['鹿影', '書卷蠹魚', '潮汐鯨魂'], out = [];
      spirits().forEach(function (s) { if (names.indexOf(s.name) >= 0) out.push(s.id); });
      return out.length ? out.slice(0, 3) : a;
    },

    chooseStarter: function (id) {
      if (S.spirit.starter) return fail('already');
      if (this.starters().indexOf(id) < 0) return fail('notstarter');
      var sp = spiritDef(id);
      if (!sp) return fail('nodata');
      S.spirit.owned.push(newOwned(id, 'baby', 0, now()));
      S.spirit.starter = true;
      markSeen('spirit', id);
      commit(['spirit', 'dex'], 'spirit');
      return { ok: true, id: id };
    },

    owned: function () {
      var t = now();
      return S.spirit.owned.map(function (o) {
        var c = cl(o);
        c.vigor = vigorAt(o, t);
        c.efficiency = eff(c.vigor);
        return c;
      });
    },

    setSlot: function (id, slot) {
      var o = rec(id), n = 0;
      if (!o) return fail('nospirit');
      if (o.stage === 'egg') return fail('egg');
      if (slot !== 'follow' && slot !== 'scout' && slot !== 'room') return fail('badslot');
      if (expeditionActive() && S.expedition.spiritId === id && slot !== 'scout') return fail('onexpedition');
      if (slot !== 'room') {
        S.spirit.owned.forEach(function (x) { if (x.id !== id && x.slot === slot) n++; });
        if (n >= SLOT_CAP[slot]) return fail('slotfull', { cap: SLOT_CAP[slot] });
      }
      if (o.slot !== slot) {
        o.slot = slot;
        if (slot === 'follow') o.skillAt = 0;   /* 換隨行位冷卻重新計算 */
      }
      commit(['spirit'], 'slot');
      return { ok: true, slot: slot };
    },

    release: function (id) {
      var o = rec(id), i;
      if (!o) return fail('nospirit');
      if (expeditionActive() && S.expedition.spiritId === id) return fail('onexpedition');
      for (i = 0; i < S.spirit.owned.length; i++) if (S.spirit.owned[i].id === id) { S.spirit.owned.splice(i, 1); break; }
      if (S.spirit.released.indexOf(id) < 0) S.spirit.released.push(id);
      /* 圖鑑仍算已取得（seen 不移除）；紀念卡存在 dex.seen.memorial，記階段與羈絆 */
      if (!isObj(S.dex.seen.memorial)) S.dex.seen.memorial = {};
      S.dex.seen.memorial[id] = { stage: o.stage, bond: num(o.bond) };
      if (isObj(o.trait)) S.dex.seen.memorial[id].trait = cl(o.trait);
      var filled = fillSlots();                       /* 空出格位：待孵清單先進先出補位，補位時才開始計時 */
      commit(['spirit', 'dex'], 'release');
      return { ok: true, memorial: cl(S.dex.seen.memorial[id]), filled: filled };
    },

    /* 把送回圖鑑的小精靈領回（保留當時的階段與羈絆） */
    reclaim: function (id) {
      var i = S.spirit.released.indexOf(id), mem, kindDup = !!rec(id);
      if (i < 0) return fail('notreleased');
      if (kindDup) return fail('dup');
      if (usedSlots() >= ROOM_TOTAL) return fail('full');
      mem = isObj(S.dex.seen.memorial) && S.dex.seen.memorial[id] ? S.dex.seen.memorial[id] : { stage: 'baby', bond: 0 };
      var ro2 = newOwned(id, mem.stage || 'baby', num(mem.bond), now());
      if (isObj(mem.trait)) ro2.trait = cl(mem.trait);          /* 送回再領回：保留性格與形態 */
      S.spirit.owned.push(ro2);
      S.spirit.released.splice(i, 1);
      commit(['spirit'], 'reclaim');
      return { ok: true };
    },

    vigor: function (id, t) {
      var o = rec(id);
      if (!o) return null;
      return vigorAt(o, t === undefined ? now() : t);
    },
    efficiency: function (id, t) {
      var v = this.vigor(id, t);
      return v === null ? null : eff(v);
    },

    feed: function (id, foodId) {
      var o = rec(id), b, cnt, used, restU, f, d, favorite = false, sp, t;
      if (!o || o.stage === 'egg') return fail('nospirit');
      f = foodDef(foodId);
      if (!f) return fail('nofood');
      if (num(S.shop.owned[foodId]) < 1) return fail('nostock');
      b = bucket();
      cnt = sub(b, ACT.feed.key); used = num(cnt[id]);
      if (used >= ACT.feed.cap) return fail('daily_cap', { cap: ACT.feed.cap });
      restU = num(sub(b, 'rest')[id]);
      if (restU >= REST_CAP) return fail('rest_cap');
      t = now();
      if (vigorAt(o, t) >= VIGOR_MAX) return fail('full');
      settle(o);
      d = Math.min(num(f.vigor, ACT.feed.vigor) + feffOf(o, 'feedVigorBonus', 0), REST_CAP - restU, VIGOR_MAX - o.vigor);
      o.vigor = r2(o.vigor + d);
      sp = spiritDef(id);
      careHit(o, false);
      if (modOf(o, 'feedBond', 0) > 0) addBond(o, modOf(o, 'feedBond', 0));
      if (num(f.bond) > 0) addBond(o, num(f.bond));
      if (sp && sp.favFood !== undefined && (sp.favFood === '全' || (foodCat(f) !== '' && foodCat(f) === sp.favFood))) { favorite = true; addBond(o, num(f.favBond, 1)); }
      cnt[id] = used + 1;
      sub(b, 'rest')[id] = restU + d;
      S.shop.owned[foodId] = num(S.shop.owned[foodId]) - 1;
      if (S.shop.owned[foodId] <= 0) delete S.shop.owned[foodId];
      commit(['spirit', 'shop'], 'feed');
      var fr = { ok: true, delta: d, vigor: o.vigor, favorite: favorite, bond: o.bond };
      var rx = reactionFor(o, 'feed'); if (rx !== undefined) fr.reaction = rx;
      return fr;
    },

    play: function (id, toyId) {
      var toy = toyId ? toyDef(toyId) : null, bonus = 0;
      if (toy && num(S.shop.owned[toyId]) >= 1) bonus = num(toy.bonus !== undefined ? toy.bonus : (toy.playBonus !== undefined ? toy.playBonus : toy.vigorBonus));
      return roomAct(id, ACT.play, bonus);
    },
    pet: function (id) { return petAct(id); },
    tidy: function (id) { return roomAct(id, ACT.tidy, 0); },

    /* ---------------------------------------------------------------- 性格、形態（規格第 9 節） */
    personalityOf: function (id) {
      var o = rec(id);
      if (!o || o.stage === 'egg') return null;
      if (ensureTrait(o)) persist(['spirit']);
      return o.trait && o.trait.pers ? o.trait.pers : null;
    },
    personalityInfo: function (id) { var p = this.personalityOf(id); return p ? cl(traitDef(p)) : null; },
    rollPersonality: function (attr, seed) { return rollPers(attr, seed); },
    traitCounters: function (id) {
      var o = rec(id), tr, c, max, lead = null;
      if (!o) return null;
      tr = o.trait || {};
      c = { care: num(tr.care), adv: num(tr.adv), lore: num(tr.lore), lead: null };
      max = Math.max(c.care / FORM_NORM.care, c.adv / FORM_NORM.adv, c.lore / FORM_NORM.lore);
      if (max > 0) lead = chooseForm({ trait: tr, id: o.id }).form;
      c.lead = lead;
      if (tr.form) c.form = tr.form;
      return c;
    },
    formOf: function (id) {
      var o = rec(id);
      if (!o || (o.stage !== 'adult' && o.stage !== 'awake') || !formsOn()) return null;
      if (!isObj(o.trait) || !o.trait.form) { ensureTrait(o); applyForm(o); persist(['spirit', 'dex']); }
      return o.trait.form;
    },
    formInfo: function (id) { var f = this.formOf(id); return f ? cl(formDef(f)) : null; },
    /* 手動檢查進化：成體且還沒定形態才會有事件（平常由羈絆變化時自動觸發） */
    evolve: function (id) {
      var o = rec(id), ev;
      if (!o || o.stage === 'egg' || o.stage === 'baby' || !formsOn() || (isObj(o.trait) && o.trait.form)) return null;
      settle(o);
      pushEvolve(o, 'baby', o.stage === 'awake' ? 'awake' : 'adult', true);
      ev = evq.length ? evq[evq.length - 1] : null;
      commit(['spirit', 'dex'], 'spirit');
      return ev;
    },
    /* 取走還沒播過的進化事件（UI 開啟時呼叫一次） */
    takeEvolutions: function () {
      var out = [], ch = false;
      S.spirit.owned.forEach(function (o) {
        if (!isObj(o.trait) || !isArr(o.trait.evoPending) || !o.trait.evoPending.length) return;
        o.trait.evoPending.forEach(function (to) { out.push({ type: 'evolve', id: o.id, from: to === 'awake' ? 'adult' : 'baby', to: to, form: o.trait.form || null }); });
        delete o.trait.evoPending; ch = true;
      });
      if (ch) persist(['spirit']);
      return out;
    },
    tone: function (id, text) {
      var o = rec(id), td = o ? tdOf(o) : null, suf = td && isObj(td.tone) && td.tone.suffix ? String(td.tone.suffix) : '', s2 = String(text === undefined ? '' : text);
      if (!suf) return s2;
      s2 = s2.replace(/[。]$/, '');
      return s2.slice(-suf.length) === suf ? s2 : s2 + suf;
    },
    /* 進房間時呼叫：回傳超過一天沒來（距上次互動 >= 48 格）的小精靈，並把互動時間更新為現在 */
    checkIn: function () {
      var t = now(), missed = [], ticks = {};
      S.spirit.owned.forEach(function (o) {
        if (o.stage === 'egg') return;
        var n = ticksBetween(num(o.seenTs, num(o.lastTs, t)), t);
        ticks[o.id] = n;
        if (n >= ABSENT_TICKS) missed.push(o.id);
        o.seenTs = t;
      });
      persist(['spirit']);
      return { missed: missed, ticks: ticks };
    },
    absentTicks: function (id) { var o = rec(id); return o ? ticksBetween(num(o.seenTs, num(o.lastTs)), now()) : null; },
    giftToday: function () {
      var b = bucket(), done = sub(b, 'gift'), gifts = [], eligible = 0, already = 0, changed = false;
      S.spirit.owned.forEach(function (o) {
        var td, chance, rng, g;
        if (o.stage === 'egg' || num(o.bond) < GIFT_BOND) return;
        eligible++;
        if (done[o.id]) { already++; return; }
        if (ensureTrait(o)) changed = true;
        done[o.id] = 1; changed = true;
        td = tdOf(o);
        chance = td && typeof td.giftChance === 'number' ? td.giftChance : 0.5;
        rng = mulberry32(hashStr(C.uid + '|gift|' + today() + '|' + o.id));
        if (rng() >= chance) return;
        g = pickGift(o, rng);
        if (g) gifts.push({ id: o.id, gift: g });
      });
      if (changed) commit(['shop', 'spirit'], 'gift');
      if (!eligible) return fail('nobond');
      if (!gifts.length) return fail(already === eligible ? 'already' : 'none');
      return { ok: true, id: gifts[0].id, gift: gifts[0].gift, gifts: gifts };
    },

    /* ---------------------------------------------------------------- 房間格數與待孵清單（規格第 11 節） */
    roomSlots: function () {
      return {
        used: usedSlots(), total: ROOM_TOTAL, free: Math.max(0, ROOM_TOTAL - usedSlots()), waitMax: WAIT_MAX,
        eggs: this.eggs(), spirits: this.owned(),
        waiting: S.spirit.waiting.map(function (w, i) { return { id: w.id, chapter: w.chapter === undefined ? null : w.chapter, gotTs: w.gotTs, pos: i + 1 }; })
      };
    },
    waiting: function () { return this.roomSlots().waiting; },
    /* 換隨行位：同一時間只有 1 隻；原本的回到房間，新的助理技冷卻重置 */
    setFollow: function (id) {
      var o = rec(id), prev = null;
      if (!o) return fail('nospirit');
      if (o.stage === 'egg') return fail('egg');
      if (expeditionActive() && S.expedition.spiritId === id) return fail('onexpedition');
      if (o.slot === 'follow') return { ok: true, slot: 'follow', prev: null };
      S.spirit.owned.forEach(function (x) { if (x.slot === 'follow') { prev = x; x.slot = 'room'; } });
      o.slot = 'follow'; o.skillAt = 0;
      commit(['spirit'], 'slot');
      return { ok: true, slot: 'follow', prev: prev ? prev.id : null };
    },

    /* 蛋 */
    eggs: function () {
      var t = now();
      return S.spirit.eggs.map(function (e) {
        var c = cl(e), r = eggRemain(e, t);
        c.ready = r.ticks === 0; c.remainTicks = r.ticks; c.totalTicks = r.total; c.remainMs = r.ticks * TICK; c.nextTickMs = r.next;
        return c;
      });
    },
    giveEgg: function (spiritId, chapterId) {
      var sp = spiritDef(spiritId), i;
      if (!sp) return fail('nodata');
      if (sp.needDexPct !== undefined && dexInfo().pct < sp.needDexPct) return fail('locked');
      if (rec(spiritId)) return fail('dup');
      for (i = 0; i < S.spirit.eggs.length; i++) if (S.spirit.eggs[i].id === spiritId) return fail('dup');
      if (inWaiting(spiritId)) return fail('dup');
      if (usedSlots() >= ROOM_TOTAL) {                 /* 滿格：進待孵清單，不佔格、不計時 */
        if (S.spirit.waiting.length >= WAIT_MAX) return fail('waitfull', { max: WAIT_MAX });
        S.spirit.waiting.push({ id: spiritId, chapter: chapterId === undefined ? null : chapterId, gotTs: now() });
        commit(['spirit'], 'egg');
        return { ok: true, id: spiritId, waiting: true, pos: S.spirit.waiting.length };
      }
      S.spirit.eggs.push({ id: spiritId, chapter: chapterId === undefined ? null : chapterId, gotTs: now(), hatchTs: now() + hatchTicks(sp) * TICK });
      commit(['spirit'], 'egg');
      return { ok: true, id: spiritId };
    },
    hatch: function (eggId, opts) {
      var i, e = null, boost = opts && opts.boost, t = now();
      for (i = 0; i < S.spirit.eggs.length; i++) if (S.spirit.eggs[i].id === eggId) { e = S.spirit.eggs[i]; break; }
      if (!e) return fail('noegg');
      if (S.spirit.owned.length >= MAX_OWNED) return fail('full');
      if (rec(eggId)) return fail('dup');
      if (t < num(e.hatchTs)) {
        if (!boost) { var er = eggRemain(e, t); return fail('notyet', { remainMs: er.ticks * TICK, remainTicks: er.ticks, nextTickMs: er.next }); }
        if (pointsNow() < HATCH_BOOST_COST) return fail('nopoints');
        var rr = spend(HATCH_BOOST_COST);
        if (rr === false) return fail('nopoints');
      }
      S.spirit.eggs.splice(i, 1);
      S.spirit.owned.push(newOwned(eggId, 'baby', 0, t));
      markSeen('spirit', eggId);
      fillSlots();
      commit(['spirit', 'dex', 'shop'], 'hatch');
      return { ok: true, id: eggId };
    },

    /* 事件：到站、任務、隱藏關卡、章節完成。只影響隨行位的小精靈。 */
    event: function (kind, arg) {
      var o = null, self = this, add = 0, bond = 0, egg = null;
      S.spirit.owned.forEach(function (x) { if (x.slot === 'follow' && x.stage !== 'egg') o = x; });
      if (kind === 'task') add = 3;
      else if (kind === 'arrive') add = 5;
      else if (kind === 'hidden') add = 8;
      else if (kind === 'chapter') bond = 1;
      else if (kind === 'culture') add = 0;      /* 文化→遊戲題完成：只記探索計數 */
      else return fail('badkind');
      if (o) {
        settle(o);
        if (kind === 'task' || kind === 'arrive' || kind === 'chapter') bump(o, 'adv', 1);
        else if (kind === 'hidden' || kind === 'culture') bump(o, 'lore', 1);
        if (add) o.vigor = r2(Math.min(VIGOR_MAX, o.vigor + add));
        if (bond) addBond(o, bond);
      }
      if (kind === 'arrive') {
        var stt = S.dex.stat, hr = new Date(now()).getHours();
        if (arg !== undefined && keys(stt.stops).length < STAT_CAP) stt.stops[String(arg)] = 1;
        if (hr >= NIGHT_FROM || hr < NIGHT_TO) stt.night = num(stt.night) + 1;
      }
      if (kind === 'chapter') {
        spirits().forEach(function (s) { if (!egg && s.eggChapter !== undefined && (s.eggChapter === arg || String(s.eggChapter).split(',').indexOf(String(arg)) >= 0)) egg = s.id; });   /* eggChapter 可寫成情報卡章節 id（如 't1,s1'），任一段相符即算 */
        if (egg) self.giveEgg(egg, arg);
      }
      commit(['spirit', 'dex'], 'event');
      return { ok: true, spirit: o ? o.id : null, egg: egg };
    },
    onArrive: function (stopId) { return this.event('arrive', stopId); },
    onChapterDone: function (chapterId) { return this.event('chapter', chapterId); },

    useSkill: function (id, opts) {
      var o = rec(id), sp, t = now(), v, e, cd, cdMs, until, res, chapter, uses, per;
      opts = opts || {};
      if (!o || o.stage === 'egg') return fail('nospirit');
      if (o.slot !== 'follow') return fail('notfollow');
      sp = spiritDef(id);
      if (!sp || !sp.assist) return fail('nodata');
      if (num(o.skillAt) > t) return fail('cooldown', { cooldownUntil: o.skillAt, remainMs: o.skillAt - t });
      per = sp.assist.perChapter;
      if (per !== undefined) per += feffOf(o, 'assistExtraUse', 0);
      chapter = opts.chapterId;
      if (per !== undefined && chapter !== undefined) {
        if (!isObj(o.skillUse)) o.skillUse = {};
        uses = num(o.skillUse[chapter]);
        if (uses >= per) return fail('chapter_cap', { cap: per });
      }
      v = vigorAt(o, t); e = eff(v);
      cd = num(sp.assist.cd);
      res = opts.role ? computeResonance(sp, opts.role) : null;
      var mul = (res ? res.cdMul : 1) * feffOf(o, 'assistCdMul', 1);
      if (o.stage === 'awake' && sp.awaken && sp.awaken.cdMul !== undefined) mul *= num(sp.awaken.cdMul, 1);
      cdMs = cd > 0 ? (cd * MINUTE * mul) / e : 0;
      until = cdMs > 0 ? Math.round(t + cdMs) : 0;
      o.skillAt = until;
      if (per !== undefined && chapter !== undefined) o.skillUse[chapter] = num(o.skillUse[chapter]) + 1;
      settle(o);
      commit(['spirit'], 'skill');
      return { ok: true, effect: cl(sp.assist), efficiency: e, cooldownUntil: until, cooldownMs: Math.round(cdMs),
        stageLevel: o.stage === 'adult' || o.stage === 'awake' ? 2 : 1, resonance: res ? res.kinds : [] };
    },

    /* 目前隨行位的天賦總和（效果鍵 → 數值），數值乘以 min(1, E)。role 給了才算補位。 */
    talents: function (role) {
      var effects = {}, items = [], t = now(), statBonus = {}, res = [], self = this, formEffects = {};
      S.spirit.owned.forEach(function (o) {
        if (o.slot !== 'follow' || o.stage === 'egg') return;
        var sp = spiritDef(o.id);
        if (!sp) return;
        var e = Math.min(1, eff(vigorAt(o, t)));
        var rr = role ? computeResonance(sp, role) : null;
        function put(src, scale) {
          if (!src || src.key === undefined) return;
          var val = num(src.value) * scale;
          effects[src.key] = r2(num(effects[src.key]) + val);
          items.push({ id: o.id, key: src.key, value: r2(val), base: src.value });
        }
        put(sp.talent, e);
        var fdo = fdOf(o);
        if (fdo && isArr(fdo.effect)) fdo.effect.forEach(function (fe) { if (isObj(fe) && fe.key !== undefined) formEffects[fe.key] = r2(num(formEffects[fe.key]) + num(fe.value)); });
        if (o.stage === 'awake') put(sp.awaken, 1);
        if (rr) {
          res.push(rr);
          if (rr.statBonus) keys(rr.statBonus).forEach(function (k) { statBonus[k] = num(statBonus[k]) + rr.statBonus[k]; });
          if (rr.special && rr.special.effect && rr.special.effect.key !== undefined) {
            effects[rr.special.effect.key] = r2(num(effects[rr.special.effect.key]) + num(rr.special.effect.value) * e);
            items.push({ id: o.id, key: rr.special.effect.key, value: r2(num(rr.special.effect.value) * e), special: rr.special.label });
          }
        }
      });
      return { effects: effects, items: items, statBonus: statBonus, resonance: res, formEffects: formEffects };
    },

    resonance: function (spiritId, role) { return computeResonance(spiritDef(spiritId), role); },

    /* ---------------------------------------------------------------- 勘察 */
    dispatch: function (p) {
      var o, sp, tier, t = now(), b, ro, res, e, seed;
      p = p || {};
      o = rec(p.spiritId);
      if (!o || o.stage === 'egg') return fail('nospirit');
      sp = spiritDef(p.spiritId);
      tier = TIERS[p.tier];
      if (!tier) return fail('badtier');
      if (o.slot === 'follow') return fail('onfollow');
      if (expeditionActive()) return fail('busy');
      b = bucket();
      if (num(b.dispatch) >= EXPEDITION_DAILY) return fail('daily_cap', { cap: EXPEDITION_DAILY });
      var last = S.expedition.last;
      if (p.tier === 'short' && isObj(last) && last.tier === 'short' && last.chapterId === p.chapterId && dateStr(num(last.ts)) === today()) return fail('repeat_short');
      var pool = intelByChapter(p.chapterId);
      if (!pool.length) return fail('nochapter');
      var got = S.intel[p.chapterId] || {};
      if (!pool.some(function (c) { return !got[c.id]; })) return fail('complete');
      var role = p.role !== undefined ? p.role : (C && typeof C.role === 'function' ? C.role() : null);
      res = role ? computeResonance(sp, role) : null;
      e = eff(vigorAt(o, t));
      seed = C.uid + '|' + t + '|' + p.chapterId + '|' + p.spiritId;
      S.expedition = {
        spiritId: p.spiritId, chapterId: p.chapterId, tier: p.tier, startTs: t, endTs: t + tier.ticks * TICK, ticks: tier.ticks,
        seed: seed, e: e, res: res ? { resonance: res.resonance, history: res.history, extraItems: res.extraItems || 0, kinds: res.kinds } : { resonance: false, history: false, kinds: [] },
        last: S.expedition.last
      };
      b.dispatch = num(b.dispatch) + 1;
      bump(o, 'adv', 1);
      commit(['expedition', 'shop', 'spirit'], 'dispatch');
      return { ok: true, endTs: S.expedition.endTs, ticks: tier.ticks, efficiency: e, lowVigorWarning: vigorAt(o, t) < 40 };
    },

    expedition: function () {
      var x = S.expedition, t = now();
      if (!expeditionActive()) return { active: false, last: x && x.last ? cl(x.last) : null, dailyLeft: Math.max(0, EXPEDITION_DAILY - num(bucket().dispatch)) };
      var tk = TIERS[x.tier] ? TIERS[x.tier].ticks : Math.max(1, Math.round((x.endTs - x.startTs) / TICK));
      var remT = t >= x.endTs ? 0 : Math.max(1, tk - ticksBetween(x.startTs, t));
      return { active: true, spiritId: x.spiritId, chapterId: x.chapterId, tier: x.tier, startTs: x.startTs, endTs: x.endTs,
        ticks: tk, remainTicks: remT, remainMs: remT * TICK, nextTickMs: remT > 0 ? TICK - ((t - x.startTs) % TICK) : 0, etaTs: x.endTs,
        ready: t >= x.endTs, dailyLeft: Math.max(0, EXPEDITION_DAILY - num(bucket().dispatch)) };
    },

    collect: function () {
      var x = S.expedition, t = now(), o, sp, tier, raw, n, pool, got, cards = [], rng, i, adult, quality = '普通';
      if (!expeditionActive()) return fail('noexpedition');
      if (t < x.endTs) { var rt = Math.max(1, x.ticks - ticksBetween(x.startTs, t)); return fail('notyet', { remainMs: rt * TICK, remainTicks: rt, etaTs: x.endTs }); }
      tier = TIERS[x.tier];
      o = rec(x.spiritId); sp = spiritDef(x.spiritId);
      adult = o && (o.stage === 'adult' || o.stage === 'awake') ? 1 : 0;
      raw = (tier.base + adult) * (x.res && x.res.resonance ? 1.5 : 1) + (x.res ? (x.res.extraItems !== undefined ? num(x.res.extraItems) : (x.res.history ? 1 : 0)) : 0);
      raw = Math.min(EXPEDITION_MAX_CARDS, raw);
      n = Math.min(EXPEDITION_MAX_CARDS, Math.max(1, Math.round(raw * num(x.e, 1))));
      pool = intelByChapter(x.chapterId);
      got = S.intel[x.chapterId] || {};
      pool = pool.filter(function (c) { return !got[c.id]; });
      rng = mulberry32(hashStr(x.seed));
      var exChance = o ? modOf(o, 'scoutExtraChance', 0) + feffOf(o, 'scoutExtraChance', 0) : 0;
      if (exChance > 0 && rng() < exChance) n = Math.min(EXPEDITION_MAX_CARDS, n + 1);
      var era = sp && sp.scout ? sp.scout.era : null;
      for (i = 0; i < n && pool.length; i++) {
        var weights = pool.map(function (c) {
          var w = 1;
          if (kindMatches(sp, c)) w += 2;
          if (era && isArr(c.tags) && c.tags.indexOf(era) >= 0) w += 1;
          return w;
        });
        var sum = 0; weights.forEach(function (w) { sum += w; });
        var pick = rng() * sum, acc = 0, idx = 0, j;
        for (j = 0; j < pool.length; j++) { acc += weights[j]; if (pick < acc) { idx = j; break; } idx = j; }
        cards.push(pool[idx]);
        pool.splice(idx, 1);
      }
      var surplus = n - cards.length, shardGain = null;
      if (surplus > 0) {                               /* 章節卡已不夠發：多出來的變成該小精靈專長類別的碎屑 */
        shardGain = {}; shardGain[shardCatOf(sp)] = surplus;
        S.shop.shards[shardCatOf(sp)] = num(S.shop.shards[shardCatOf(sp)]) + surplus;
      }
      S.dex.stat.expeditions = num(S.dex.stat.expeditions) + 1;
      if (!isObj(S.intel[x.chapterId])) S.intel[x.chapterId] = {};
      cards.forEach(function (c) { S.intel[x.chapterId][c.id] = t; if (c.rarity === '稀有' || c.rarity === '傳說') quality = '稀有'; });
      if (quality !== '稀有' && x.res && x.res.resonance) quality = '精良';
      if (o) { settle(o); o.vigor = r2(Math.min(VIGOR_MAX, o.vigor + 10)); bump(o, 'lore', cards.length); addBond(o, 1); }
      S.expedition = { last: { tier: x.tier, chapterId: x.chapterId, ts: t } };
      commit(['expedition', 'intel', 'spirit', 'shop', 'dex'], 'collect');
      return { ok: true, cards: cl(cards), count: cards.length, quality: quality, spiritId: x.spiritId, chapterId: x.chapterId, shards: shardGain };
    },

    intel: function (chapterId) {
      var out = [], idx = {};
      intelAll().forEach(function (c) { idx[c.chapter + '|' + c.id] = c; });
      keys(S.intel).forEach(function (ch) {
        if (chapterId !== undefined && ch !== String(chapterId)) return;
        keys(S.intel[ch]).forEach(function (cid) {
          var c = idx[ch + '|' + cid] || { id: cid, chapter: ch };
          var cc = cl(c); cc.ts = S.intel[ch][cid]; out.push(cc);
        });
      });
      return out;
    },

    /* ---------------------------------------------------------------- 圖鑑 */
    dex: function () { return dexInfo(); },
    markSeen: function (cat, id) { var r = markSeen(cat, id); if (r) commit(['dex'], 'dex'); return r; },
    claimMilestone: function (pct) {
      var info = dexInfo(), def = win().WALK_DEX, reward = null, ms, i, got = { points: 0, title: null, look: null, items: [], egg: null };
      if (MILESTONES.indexOf(pct) < 0) return fail('badpct');
      if (S.dex.claimed[pct]) return fail('claimed');
      if (info.pct < pct) return fail('locked');
      if (isObj(def) && def.milestones) {
        ms = def.milestones;
        if (isArr(ms)) { for (i = 0; i < ms.length; i++) if (ms[i] && (ms[i].pct === pct || ms[i].at === pct)) reward = ms[i].reward || ms[i]; }
        else if (isObj(ms)) reward = ms[pct] ? (ms[pct].reward || ms[pct]) : null;
      }
      S.dex.claimed[pct] = true;
      if (isObj(reward)) {
        if (num(reward.points) > 0) { grantPoints(num(reward.points)); got.points = num(reward.points); }
        if (reward.title) { S.dex.titles[reward.title] = now(); markSeen('titles', reward.title); got.title = reward.title; }
        if (reward.look) { S.shop.looks[reward.look] = 1; markSeen('looks', reward.look); got.look = reward.look; }
        if (isObj(reward.items)) keys(reward.items).forEach(function (k) { S.shop.owned[k] = num(S.shop.owned[k]) + num(reward.items[k], 1); got.items.push(k); });
        if (reward.egg) { var ge = this.giveEgg(reward.egg, 'milestone' + pct); got.egg = ge.ok ? reward.egg : { fail: ge.reason }; }
      }
      commit(['dex', 'shop', 'spirit'], 'milestone');
      return { ok: true, reward: cl(reward), granted: got.items, got: got };
    },
    titles: function () { return keys(S.dex.titles); },
    looks: function () { return keys(S.shop.looks); },
    eggSprite: function (spiritId) {
      var sp = spiritDef(spiritId), E = win().WALK_SPIRIT_EGGS, k;
      if (!sp || !isObj(E)) return null;
      if (E[spiritId]) return E[spiritId];            /* 每種小精靈各有自己的蛋 */
      k = sp.rarity === '傳說' ? 'legend' : (sp.rarity === '稀有' ? 'rare' : 'common');   /* 舊資料：依稀有度共用 */
      return E[k] || E.common || null;
    },
    /* 套裝集滿小加成（純裝飾，不加分） */
    setBonuses: function () {
      var d = win().WALK_SHOP, sets = isObj(d) && isArr(d.sets) ? d.sets : [], out = [], active = [];
      sets.forEach(function (st) {
        if (!isObj(st) || !isArr(st.items)) return;
        var have = st.items.filter(function (id) { return num(S.shop.owned[id]) > 0; }).length;
        var complete = st.items.length > 0 && have === st.items.length;
        var row = { id: st.id, name: st.name, have: have, total: st.items.length, complete: complete, bonus: isObj(st.bonus) ? cl(st.bonus) : null, decorOnly: true };
        out.push(row);
        if (complete && row.bonus) active.push({ id: st.id, name: st.name, bonus: row.bonus.name, desc: row.bonus.desc, fx: row.bonus.fx });
      });
      return { sets: out, active: active };
    },
    speedEgg: function (eggId) {
      var i, e = null, t = now(), d = shopDef('egg_speedup'), f = d && d.value !== undefined ? num(d.value, 0.5) : 0.5;
      for (i = 0; i < S.spirit.eggs.length; i++) if (S.spirit.eggs[i].id === eggId) { e = S.spirit.eggs[i]; break; }
      if (!e) return fail('noegg');
      if (t >= num(e.hatchTs)) return fail('ready');
      if (num(S.shop.owned.egg_speedup) < 1) return fail('nostock');
      var er2 = eggRemain(e, t), newRem = Math.max(1, Math.floor(er2.ticks * f));
      e.hatchTs = num(e.gotTs, t) + (er2.total - er2.ticks + newRem) * TICK;
      S.shop.owned.egg_speedup -= 1;
      if (S.shop.owned.egg_speedup <= 0) delete S.shop.owned.egg_speedup;
      commit(['spirit', 'shop'], 'egg');
      return { ok: true, remainMs: newRem * TICK, remainTicks: newRem };
    },

    /* ---------------------------------------------------------------- 房間 */
    room: function () { return cl(S.room); },
    place: function (spotId, itemId) {
      var it = shopDef(itemId), z, have, placed = 0;
      if (SPOTS.indexOf(spotId) < 0) return fail('badspot');
      have = num(S.shop.owned[itemId]);
      if (have < 1) return fail('notowned');
      if (it) {
        z = itemZone(it);
        var lay = win().WALK_SHOP && win().WALK_SHOP.layout, pre = spotId.replace(/\d+$/, ''), acc = lay && isObj(lay.accepts) && isArr(lay.accepts[pre]) ? lay.accepts[pre] : [pre];
        if (z && acc.indexOf(z) < 0) return fail('wrongzone');
        if (isArr(it.items)) return fail('wrongzone');   /* 套裝是整組，要擺的是裡面的單件 */
      }
      keys(S.room.spots).forEach(function (s) { if (S.room.spots[s] === itemId && s !== spotId) placed++; });
      if (placed >= have) return fail('allplaced');
      S.room.spots[spotId] = itemId;
      commit(['room'], 'room');
      this._publishQuiet();
      return { ok: true };
    },
    unplace: function (spotId) {
      if (!S.room.spots[spotId]) return fail('empty');
      delete S.room.spots[spotId];
      commit(['room'], 'room');
      this._publishQuiet();
      return { ok: true };
    },
    setWindow: function (w) { S.room.window = String(w || 'auto').slice(0, 16); commit(['room'], 'room'); this._publishQuiet(); return { ok: true }; },
    setOpen: function (v) {
      if (v !== 'closed' && v !== 'team' && v !== 'all') return fail('badvalue');
      S.room.open = v;
      commit(['room'], 'room');
      this._publishQuiet();
      return { ok: true, open: v };
    },
    setGuestBook: function (b) { S.room.guestBook = !!b; commit(['room'], 'room'); this._publishQuiet(); return { ok: true }; },
    setPhotosPublic: function (b) { S.room.photosPublic = !!b; commit(['room'], 'room'); this._publishQuiet(); return { ok: true }; },

    /* ---------------------------------------------------------------- 商店 */
    shop: function () {
      var b = bucket(), items = [], self = this;
      shopItems().forEach(function (it) {
        var q = priceQuote(it, 1, b);
        items.push({ id: it.id, cat: it.cat || it.kind || it.type || '', rarity: it.rarity || '普通', price: num(it.price), finalPrice: q.price,
          owned: num(S.shop.owned[it.id]), canBuy: q.ok, reason: q.reason || null });
      });
      return { items: items, firstBuyAvailable: !S.shop.firstBuy,
        daily: { furniture: { used: num(b.furniture), max: FURNITURE_DAILY }, food: { used: num(b.food), max: FOOD_DAILY } },
        points: pointsNow(), owned: cl(S.shop.owned) };
    },

    buy: function (itemId, qty) {
      var it = shopDef(itemId), q, n = qty === undefined ? 1 : Math.floor(num(qty, 1)), b, g, r, eggPick = null, half;
      if (!it) return fail('noitem');
      if (n < 1) return fail('badqty');
      if (isArr(it.items) || it.skin !== undefined) n = 1;            /* 套裝與造型一次一件 */
      if (it.skin !== undefined && S.shop.looks[it.skin]) return fail('owned');
      if (isArr(it.items) && setBuyable(it).every(function (x) { return num(S.shop.owned[x]) > 0; })) return fail('owned');
      b = bucket();
      q = priceQuote(it, n, b);
      if (!q.ok) return fail(q.reason, { price: q.price });
      if (it.id === 'egg_common' || it.needChapterDone) {
        if (chaptersCount() < 1) return fail('nochapter');
        eggPick = pickCommonEgg();
        if (!eggPick) return fail('noegg');
      }
      /* 交易式：先扣點（成功才改持有物）；扣點失敗或丟例外就整筆作廢 */
      r = spend(q.price);
      if (r === false) return fail('nopoints', { price: q.price });
      g = itemGroup(it);
      if (eggPick) {
        if (!this.giveEgg(eggPick, 'shop').ok) { grantPoints(q.price); return fail('noegg'); }
      } else if (isArr(it.items)) {
        setBuyable(it).forEach(function (x) { if (num(S.shop.owned[x]) < 1) S.shop.owned[x] = 1; });   /* 稀有成員(noBuy)不隨套裝發放，要另外取得 */
        S.shop.owned[itemId] = 1;
      } else {
        S.shop.owned[itemId] = num(S.shop.owned[itemId]) + n;
        if (it.skin !== undefined) { S.shop.looks[it.skin] = 1; markSeen('looks', it.skin); }
      }
      if (g) b[g] = num(b[g]) + n;
      half = !S.shop.firstBuy;
      S.shop.firstBuy = true;
      commit(['shop', 'spirit', 'dex'], 'buy');
      return { ok: true, price: q.price, firstBuyDiscount: half, owned: num(S.shop.owned[itemId]), egg: eggPick };
    },

    /* 由任務、收藏換物所、里程碑等管道取得的物品（不扣點） */
    grant: function (itemId, n) {
      n = Math.floor(num(n, 1));
      if (n < 1) return fail('badqty');
      S.shop.owned[itemId] = num(S.shop.owned[itemId]) + n;
      commit(['shop'], 'grant');
      return { ok: true, owned: S.shop.owned[itemId] };
    },

    /* ---------------------------------------------------------------- 碎屑、收藏換物所、老闆任務板 */
    /* 重複的情報卡自動轉碎屑（按類別計）；回傳 {類別: 張數}（只列大於 0 的），通用碎屑（禮物來的）歸在「通用」 */
    shards: function () {
      var out = {};
      keys(S.shop.shards).forEach(function (k) { if (num(S.shop.shards[k]) > 0) out[k] = num(S.shop.shards[k]); });
      if (num(S.shop.owned.intel_shard) > 0) out['通用'] = num(S.shop.owned.intel_shard);
      return out;
    },
    shardTotal: function () { var o = this.shards(), n = 0; keys(o).forEach(function (k) { n += o[k]; }); return n; },
    /* 取得一張情報卡；已經有的就轉成該類別的碎屑 */
    addIntel: function (chapterId, cardId) {
      var card = null, cats = intelAll().filter(function (c) { return c.chapter === chapterId && c.id === cardId; });
      if (cats.length) card = cats[0];
      if (!card) return fail('nocard');
      if (!isObj(S.intel[chapterId])) S.intel[chapterId] = {};
      if (S.intel[chapterId][cardId]) {
        var cat = normKind(card.type) || '通用';
        S.shop.shards[cat] = num(S.shop.shards[cat]) + 1;
        commit(['shop'], 'shards');
        return { ok: true, duplicate: true, shard: cat };
      }
      S.intel[chapterId][cardId] = now();
      commit(['intel', 'dex'], 'intel');
      return { ok: true, duplicate: false };
    },
    /* 收藏換物所：id 可以是限定家具、稱號邊框，或點心（食物 id 或 'snack:類別'） */
    exchange: function (id) {
      var d = win().WALK_SHOP, ex = isObj(d) && isObj(d.exchange) ? d.exchange : null, rate = ex && isObj(ex.rate) ? ex.rate : {}, i, cost, fr, food, cat, got;
      if (!ex) return fail('nodata');
      if (isArr(ex.furniture) && ex.furniture.indexOf(id) >= 0) {
        cost = num(rate.furniture, 10);
        if (num(S.shop.owned[id]) >= 1) return fail('owned');
        if (shardsTotal() < cost) return fail('noshards', { need: cost, have: shardsTotal() });
        spendShards(cost, null);
        S.shop.owned[id] = 1;
        commit(['shop'], 'exchange');
        return { ok: true, cost: cost, got: id };
      }
      if (isArr(ex.frames)) for (i = 0; i < ex.frames.length; i++) if (ex.frames[i].id === id) {
        fr = ex.frames[i];
        if (num(S.shop.owned[id]) >= 1) return fail('owned');
        if (shardsTotal() < num(fr.shards)) return fail('noshards', { need: num(fr.shards), have: shardsTotal() });
        spendShards(num(fr.shards), null);
        S.shop.owned[id] = 1;
        commit(['shop'], 'exchange');
        return { ok: true, cost: num(fr.shards), got: id };
      }
      if (/^snack:/.test(String(id))) { cat = String(id).slice(6); food = foods().filter(function (f) { return f.cat === cat; })[0]; }
      else { food = foodDef(id); cat = food && typeof food.cat === 'string' ? food.cat : ''; }
      if (food && cat) {
        cost = num(rate.snack, 3);
        if (catShards(cat) < cost) return fail('noshards', { need: cost, have: catShards(cat) });
        spendShards(cost, cat);
        S.shop.owned[food.id] = num(S.shop.owned[food.id]) + 1;
        commit(['shop'], 'exchange');
        return { ok: true, cost: cost, got: food.id };
      }
      return fail('unknown');
    },

    /* 老闆任務板：每天從任務池挑 perDay 個（種子＝日期＋uid），進度由 report(event,n) 或店內動作驅動 */
    board: function () {
      var bd = boardToday(), pool = boardPool(), out = [];
      bd.ids.forEach(function (id) {
        var q = pool.filter(function (x) { return x.id === id; })[0];
        if (!q) return;
        var n = Math.max(1, num(q.n, 1)), p = Math.min(n, num(bd.p[id]));
        out.push({ id: id, text: q.text, event: q.event, n: n, progress: p, done: p >= n, claimed: !!bd.c[id], reward: cl(q.reward) });
      });
      return out;
    },
    report: function (event, n) {
      var ch = reportBoard(event, n === undefined ? 1 : n);
      return { ok: true, changed: ch };
    },
    claimBoard: function (id) {
      var bd = boardToday(), q = boardPool().filter(function (x) { return x.id === id; })[0], got = [], rw, f;
      if (!q || bd.ids.indexOf(id) < 0) return fail('noid');
      if (bd.c[id]) return fail('claimed');
      if (num(bd.p[id]) < Math.max(1, num(q.n, 1))) return fail('notyet');
      bd.c[id] = 1;
      rw = isObj(q.reward) ? q.reward : {};
      if (num(rw.points) > 0) { grantPoints(num(rw.points)); got.push('點數 +' + num(rw.points)); }
      if (rw.food) {
        S.shop.owned[rw.food] = num(S.shop.owned[rw.food]) + 1;
        f = foodDef(rw.food);
        got.push('「' + (f && f.name ? f.name : rw.food) + '」×1');
      }
      commit(['shop'], 'board');
      return { ok: true, got: got, points: num(rw.points), food: rw.food || null };
    },

    /* ---------------------------------------------------------------- 稱號 */
    takeNewTitles: function () {
      var out = S.dex.titlePending.slice();
      if (out.length) { S.dex.titlePending = []; persist(['dex']); }
      return out;
    },

    /* ---------------------------------------------------------------- 和隊友交換小精靈（規格第 12 節；只有 Firebase 模式可用） */
    tradeOptions: function (toUid, cb) {
      var self = this;
      function compute() {
        var res = { ok: true, reason: null, why: '', give: [], peerKnown: !!peerCache[toUid], left: Math.max(0, TRADE_DAILY - num(bucket().trade)) };
        if (!C.root) { res.ok = false; res.reason = 'offline'; }
        else if (!toUid || toUid === C.uid) { res.ok = false; res.reason = 'self'; }
        else if (!(typeof C.isTeammate === 'function' && C.isTeammate(toUid))) { res.ok = false; res.reason = 'notteam'; }
        else if (num(bucket().trade) >= TRADE_DAILY) { res.ok = false; res.reason = 'daily_cap'; }
        S.spirit.owned.forEach(function (o) {
          var r = giveReason(o);
          if (!r && isArr(peerCache[toUid]) && peerCache[toUid].indexOf(o.id) >= 0) r = 'peerhas';
          res.give.push({ id: o.id, ok: !r, reason: r, why: r ? TRADE_WHY[r] || r : '' });
        });
        if (res.ok && !res.give.some(function (g) { return g.ok; })) { res.ok = false; res.reason = 'nogive'; }
        if (res.reason) res.why = TRADE_WHY[res.reason] || res.reason;
        return res;
      }
      if (typeof cb === 'function' && C.root && toUid) {
        prefetchPeer(toUid, function () { cb(compute()); });
      }
      return compute();
    },

    tradePropose: function (toUid, spiritId, cb) {
      var self = this;
      function done(r) { if (typeof cb === 'function') cb(r); return r; }
      if (!C.root) return done(fail('offline'));
      prefetchPeer(toUid, function () {
        var opt = self.tradeOptions(toUid), g, o, t = now(), id, tr, ref, pend;
        if (!opt.ok) return done(fail(opt.reason, { why: opt.why }));
        o = rec(spiritId);
        if (!o) return done(fail('nospirit'));
        g = opt.give.filter(function (x) { return x.id === spiritId; })[0];
        if (g && !g.ok) return done(fail(g.reason, { why: g.why }));
        pend = tradeCache.outgoing.filter(function (x) { return x.status === 'open' && x.to === toUid && x.give && x.give.id === spiritId && t < num(x.exp); });
        if (pend.length) return done(fail('pending'));
        id = 't' + hashStr(C.uid + '|' + toUid + '|' + spiritId + '|' + t).toString(36) + t.toString(36);
        tr = { tid: teamIdNow(), from: C.uid, to: toUid, fromNick: myNick(), toNick: nickOf(toUid), give: snapshotOf(o), status: 'open', ts: t, exp: t + TRADE_EXP };
        ref = refAt('trades/' + id);
        if (!ref) return done(fail('offline'));
        ref.set(cl(tr), function (err) {
          if (err) return done(fail('error'));
          var rec2 = cl(tr); rec2.id = id;
          tradeCache.outgoing.push(rec2);
          done({ ok: true, tradeId: id, trade: rec2 });
        });
        return undefined;
      });
      return undefined;
    },

    /* 我收到與我送出的提案。無參數：回傳目前快取；給 cb 會先從 Firebase 重讀一次 */
    tradeInbox: function (cb) {
      var self = this;
      function view() {
        var t = now();
        function dec(x, mine) {
          var c = cl(x);
          c.expired = x.status === 'open' && t >= num(x.exp);
          if (mine) { c.canCancel = x.status === 'open' && !c.expired; c.needsApply = x.status === 'accepted' && !S.spirit.tradeLog[x.id]; }
          else { c.canAccept = x.status === 'open' && !c.expired; c.applied = !!S.spirit.tradeLog[x.id]; }
          return c;
        }
        return { offline: !C.root,
          incoming: tradeCache.incoming.map(function (x) { return dec(x, false); }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 30),
          outgoing: tradeCache.outgoing.map(function (x) { return dec(x, true); }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 30) };
      }
      if (typeof cb === 'function') {
        if (!C.root) cb(view());
        else loadTrades(function () { cb(view()); });
      }
      return view();
    },

    tradeAccept: function (tradeId, myGiveSpiritId, cb) {
      function done(r) { if (typeof cb === 'function') cb(r); return r; }
      if (!C.root) return done(fail('offline'));
      readTrade(tradeId, function (tr) {
        var mine, why;
        if (!tr) return done(fail('notfound'));
        if (tr.to !== C.uid) return done(fail('notyours'));
        if (S.spirit.tradeLog[tradeId]) return done(fail('done'));
        if (tr.status !== 'open') return done(fail(tr.status));
        if (now() >= num(tr.exp)) return done(fail('expired'));
        if (!(typeof C.isTeammate === 'function' && C.isTeammate(tr.from))) return done(fail('notteam'));
        if (num(bucket().trade) >= TRADE_DAILY) return done(fail('daily_cap'));
        mine = rec(myGiveSpiritId);
        if (!mine) return done(fail('nospirit'));
        why = giveReason(mine);
        if (why) return done(fail(why, { why: TRADE_WHY[why] }));
        if (rec(tr.give.id)) return done(fail('mine_has', { why: TRADE_WHY.mine_has }));
        prefetchPeer(tr.from, function () {
          var ids = peerCache[tr.from];
          if (isArr(ids) && ids.indexOf(myGiveSpiritId) >= 0 && myGiveSpiritId !== tr.give.id) return done(fail('peerhas', { why: TRADE_WHY.peerhas }));
          var get = snapshotOf(mine);
          casTrade(tradeId, ['open'], { get: get, status: 'accepted', acceptedTs: now() }, function (res) {
            if (!res.ok) return done(res);
            var ap = applyTrade(tradeId, myGiveSpiritId, tr.give);
            if (!ap.ok) return done(ap);
            done({ ok: true, tradeId: tradeId, got: cl(tr.give), gave: myGiveSpiritId });
          });
        });
      });
      return undefined;
    },

    tradeDecline: function (tradeId, cb) {
      function done(r) { if (typeof cb === 'function') cb(r); return r; }
      if (!C.root) return done(fail('offline'));
      readTrade(tradeId, function (tr) {
        if (!tr) return done(fail('notfound'));
        if (tr.to !== C.uid) return done(fail('notyours'));
        casTrade(tradeId, ['open'], { status: 'declined' }, function (res) {
          if (!res.ok && res.reason === 'conflict') return readTrade(tradeId, function (t2) { done(fail(t2 ? t2.status : 'conflict')); });
          done(res);
        });
      });
      return undefined;
    },

    tradeCancel: function (tradeId, cb) {
      function done(r) { if (typeof cb === 'function') cb(r); return r; }
      if (!C.root) return done(fail('offline'));
      readTrade(tradeId, function (tr) {
        if (!tr) return done(fail('notfound'));
        if (tr.from !== C.uid) return done(fail('notyours'));
        casTrade(tradeId, ['open'], { status: 'cancelled' }, function (res) {
          if (!res.ok && res.reason === 'conflict') return readTrade(tradeId, function (t2) { done(fail(t2 ? t2.status : 'conflict')); });
          done(res);
        });
      });
      return undefined;
    },

    /* 開啟時補做未完成的交換（冪等：已記在 spirit.tradeLog 的不再重做）。cb({ok, applied:[id], pending:[id], failed:[{id,reason}]}) */
    tradeApply: function (cb) {
      function done(r) { if (typeof cb === 'function') cb(r); return r; }
      if (!C.root) return done(fail('offline'));
      loadTrades(function (err) {
        var applied = [], pending = [], failed = [], todo = [];
        if (err) return done(fail('error'));
        tradeCache.incoming.forEach(function (tr) {
          if ((tr.status === 'accepted' || tr.status === 'done') && !S.spirit.tradeLog[tr.id] && isObj(tr.get) && isObj(tr.give)) todo.push({ tr: tr, out: tr.get.id, inn: tr.give, mine: false });
        });
        tradeCache.outgoing.forEach(function (tr) {
          if ((tr.status === 'accepted' || tr.status === 'done') && !S.spirit.tradeLog[tr.id] && isObj(tr.get) && isObj(tr.give)) todo.push({ tr: tr, out: tr.give.id, inn: tr.get, mine: true });
        });
        todo.forEach(function (w) {
          var r = applyTrade(w.tr.id, w.out, w.inn);
          if (r.ok) applied.push(w.tr.id);
          else if (r.reason === 'expedition' || r.reason === 'full') pending.push(w.tr.id);
          else failed.push({ id: w.tr.id, reason: r.reason });
        });
        /* 甲端完成後把狀態標成 done（已套用過的 accepted 也補標，冪等） */
        var marks = tradeCache.outgoing.filter(function (tr) { return tr.status === 'accepted' && S.spirit.tradeLog[tr.id]; });
        var left = marks.length;
        function fin() { done({ ok: true, applied: applied, pending: pending, failed: failed }); }
        if (!left) return fin();
        marks.forEach(function (tr) {
          casTrade(tr.id, ['accepted'], { status: 'done', doneTs: now() }, function () { tr.status = 'done'; left--; if (left === 0) fin(); });
        });
        return undefined;
      });
      return undefined;
    },

    /* ---------------------------------------------------------------- 對話額度 */
    chatLeft: function () { return Math.max(0, CHAT_DAILY - num(S.chat[today()])); },
    chatTick: function () {
      var t = today(), k;
      if (num(S.chat[t]) >= CHAT_DAILY) return fail('daily_cap', { cap: CHAT_DAILY });
      for (k in S.chat) if (Object.prototype.hasOwnProperty.call(S.chat, k) && k !== t) delete S.chat[k];
      S.chat[t] = num(S.chat[t]) + 1;
      commit(['chat'], 'chat');
      return { ok: true, left: CHAT_DAILY - S.chat[t] };
    },

    /* ---------------------------------------------------------------- 公開快照與房間街 */
    snapshotPublic: function () {
      var prof = C && typeof C.profile === 'function' ? (C.profile() || {}) : {};
      var info = dexInfo();
      var snap = {
        nick: String(prof.nick || '').slice(0, 12),
        skin: prof.skin === undefined ? null : prof.skin,
        badges: isArr(prof.badges) ? prof.badges.slice(0, 12) : [],
        dexPct: info.pct,
        closet: isArr(prof.closet) ? prof.closet.slice(0, 8) : [],
        spots: cl(S.room.spots),
        spirits: S.spirit.owned.map(function (o) {
          var r = { id: o.id, stage: o.stage };
          if (isObj(o.trait)) { if (o.trait.form) r.form = o.trait.form; if (o.trait.pers) r.pers = o.trait.pers; }
          return r;
        }).slice(0, MAX_OWNED),
        window: S.room.window,
        open: S.room.open,
        guestBook: !!S.room.guestBook,
        updated: now()
      };
      if (S.room.photosPublic && isArr(prof.photos)) snap.photos = prof.photos.slice(0, 6);
      /* 超過 4 KB 時依序縮：照片 → 徽章 → 造型 → 陳列 */
      var guard = 0;
      while (byteLen(JSON.stringify(snap)) > SNAPSHOT_MAX_BYTES && guard < 40) {
        guard++;
        if (snap.photos && snap.photos.length) snap.photos.pop();
        else if (snap.badges.length) snap.badges.pop();
        else if (snap.closet.length) snap.closet.pop();
        else { var ks = keys(snap.spots); if (ks.length) delete snap.spots[ks[ks.length - 1]]; else break; }
      }
      return snap;
    },

    /* 寫出公開快照與索引摘要；open === 'closed' 時兩處都不寫（並清掉舊的） */
    publish: function () {
      var snap = this.snapshotPublic(), sess = C && C.sess ? C.sess : 'default', uid = C.uid, idx;
      if (S.room.open === 'closed') {
        if (C.root) { fbSet('rooms/' + uid, null); fbSet('roomsIndex/' + sess + '/' + uid, null); }
        else { lsDel('walkstore_pub_' + uid); lsDel('walkstore_idx_' + sess + '_' + uid); }
        return { ok: true, written: false };
      }
      var rare = 0, ntTs = 0;
      snap.spirits.forEach(function (x) { var d = spiritDef(x.id); if (d && (d.rarity === '稀有' || d.rarity === '傳說')) rare++; });
      keys(S.dex.titles).forEach(function (k) { if (S.dex.titles[k] > ntTs) ntTs = S.dex.titles[k]; });
      idx = { nick: snap.nick, skin: snap.skin, dexPct: snap.dexPct, n: snap.spirits.length, open: snap.open, updated: snap.updated, rare: rare, nt: ntTs };
      if (C.root) {
        /* rooms/{uid} 只寫快照欄位；guests、hidden 是別人／老師寫的，不能整份覆蓋 */
        var ks = keys(snap), i;
        for (i = 0; i < ks.length; i++) fbSet('rooms/' + uid + '/' + ks[i], snap[ks[i]]);
        fbSet('roomsIndex/' + sess + '/' + uid, idx);
      } else {
        lsSet('walkstore_pub_' + uid, JSON.stringify(snap));
        lsSet('walkstore_idx_' + sess + '_' + uid, JSON.stringify(idx));
      }
      return { ok: true, written: true, bytes: byteLen(JSON.stringify(snap)) };
    },
    _publishQuiet: function () {
      /* 已經公開過（或有 sess）才同步；第一次由 UI 明確呼叫 publish() */
      if (C && C.autoPublish === false) return;
      try { this.publish(); } catch (e) { /* 忽略 */ }
    },

    /* 讀對方公開快照：cb(result)。result = {ok, snap} 或 {ok:false, reason} */
    visit: function (uid, cb) {
      var done = function (r) { if (typeof cb === 'function') cb(r); return r; };
      if (!uid || uid === C.uid) return done(fail('self'));
      var handle = function (snap, hidden) {
        if (hidden) return done(fail('hidden'));
        if (!isObj(snap)) return done(fail('noroom'));
        if (snap.open === 'closed') return done(fail('closed'));
        if (snap.open === 'team' && !(C && typeof C.isTeammate === 'function' && C.isTeammate(uid))) return done(fail('teamonly'));
        visited[uid] = snap;
        peerCache[uid] = spiritIds(snap.spirits);
        if (keys(S.dex.stat.ever).length < STAT_CAP) S.dex.stat.ever[uid] = 1;
        S.dex.visited[uid] = now();
        S.dex.vinfo[uid] = { nick: String(snap.nick || ''), dexPct: num(snap.dexPct), n: isArr(snap.spirits) ? snap.spirits.length : 0, skin: snap.skin === undefined ? null : snap.skin };
        var ks = keys(S.dex.visited);
        if (ks.length > VISITED_KEEP) {
          ks.sort(function (a, b) { return S.dex.visited[a] - S.dex.visited[b]; });
          delete S.dex.visited[ks[0]];
          delete S.dex.vinfo[ks[0]];
        }
        commit(['dex'], 'visit');
        reportBoard('visit', 1);
        return done({ ok: true, snap: cl(snap) });
      };
      if (C.root) {
        var ref = refAt('rooms/' + uid);
        if (!ref) return done(fail('noroom'));
        ref.once('value', function (s) {
          var v = s && typeof s.val === 'function' ? s.val() : null;
          var hidden = isObj(v) && v.hidden ? true : false;
          handle(v, hidden);
        }, function () { done(fail('error')); });
        return undefined;
      }
      var raw = lsGet('walkstore_pub_' + uid), snap = null;
      if (raw) { try { snap = JSON.parse(raw); } catch (e) { snap = null; } }
      return handle(snap, lsGet('walkstore_hidden_' + uid) === '1');
    },

    /* 房間街列表：tab = team|all|rec|visited；cb([{uid, nick, dexPct, n, skin}])。
       Firebase 只讀 roomsIndex/{sess} 摘要；離線模式除了「我去過的」一律回空陣列。 */
    listRooms: function (tab, cb) {
      var done = function (a) { if (typeof cb === 'function') cb(a); return a; };
      var self = this;
      if (tab === 'visited') {
        var vs = keys(S.dex.visited).sort(function (a, b) { return S.dex.visited[b] - S.dex.visited[a]; });
        return done(vs.map(function (u) { var v = S.dex.vinfo[u] || {}; return { uid: u, nick: v.nick || '', dexPct: num(v.dexPct), n: num(v.n), skin: v.skin === undefined ? null : v.skin }; }));
      }
      if (tab !== 'team' && tab !== 'all' && tab !== 'rec') return done([]);
      if (!C.root) return done([]);
      var ref = refAt('roomsIndex/' + (C.sess || 'default'));
      if (!ref) return done([]);
      ref.once('value', function (snap) {
        var m = snap && typeof snap.val === 'function' ? snap.val() : null, rows = [];
        if (isObj(m)) keys(m).forEach(function (u) {
          var v = m[u];
          if (!isObj(v) || u === C.uid || v.hidden || v.open === 'closed') return;
          var mate = typeof C.isTeammate === 'function' && C.isTeammate(u);
          if (tab === 'team' && !(mate && (v.open === 'team' || v.open === 'all'))) return;
          if (tab === 'all' && v.open !== 'all') return;
          if (tab === 'rec' && !(v.open === 'all' || (v.open === 'team' && mate))) return;
          rows.push({ uid: u, nick: String(v.nick || ''), dexPct: num(v.dexPct), n: num(v.n), skin: v.skin === undefined ? null : v.skin,
            _rare: num(v.rare), _nt: num(v.nt), _up: num(v.updated) });
        });
        function strip(list) { return list.map(function (r) { return { uid: r.uid, nick: r.nick, dexPct: r.dexPct, n: r.n, skin: r.skin }; }); }
        function byUid(a, b) { return a.uid < b.uid ? -1 : (a.uid > b.uid ? 1 : 0); }
        if (tab !== 'rec') {
          rows.sort(function (a, b) { return b._up - a._up || byUid(a, b); });
          return done(strip(rows));
        }
        /* 推薦約 10 間：完成度高＋少見小精靈 4、最近有新稱號或剛更新 4、新手友善（完成度低）2，去重 */
        var pick = [], used = {};
        function take(list, k) {
          var i;
          for (i = 0; i < list.length && k > 0; i++) if (!used[list[i].uid] && pick.length < 10) { used[list[i].uid] = 1; pick.push(list[i]); k--; }
        }
        take(rows.slice().sort(function (a, b) { return (b.dexPct + b._rare * 5) - (a.dexPct + a._rare * 5) || byUid(a, b); }), 4);
        take(rows.slice().sort(function (a, b) { return b._nt - a._nt || b._up - a._up || byUid(a, b); }), 4);
        take(rows.slice().sort(function (a, b) { return a.dexPct - b.dexPct || byUid(a, b); }), 2);
        take(rows.slice().sort(function (a, b) { return b._up - a._up || byUid(a, b); }), 10 - pick.length);
        return done(strip(pick));
      }, function () { done([]); });
      return undefined;
    },

    /* 留貼圖足跡：只接受固定代碼；每間每天 1 次、每天最多 10 間；必須先 visit 過 */
    footprint: function (hostUid, sticker) {
      var b = bucket(), fp, n, snap;
      if (STICKERS.indexOf(sticker) < 0) return fail('badsticker');
      if (!hostUid || hostUid === C.uid) return fail('self');
      snap = visited[hostUid];
      if (!snap) return fail('visitfirst');
      if (snap.guestBook === false) return fail('noguestbook');
      fp = sub(b, 'fp');
      if (fp[hostUid]) return fail('host_once');
      n = keys(fp).length;
      if (n >= FOOTPRINT_HOSTS_DAILY) return fail('daily_cap', { cap: FOOTPRINT_HOSTS_DAILY });
      fp[hostUid] = 1;
      if (C.root) fbSet('rooms/' + hostUid + '/guests/' + C.uid, sticker);
      else {
        var g = {}, raw = lsGet('walkstore_guests_' + hostUid);
        if (raw) { try { g = JSON.parse(raw) || {}; } catch (e) { g = {}; } }
        g[C.uid] = sticker;
        lsSet('walkstore_guests_' + hostUid, JSON.stringify(g));
      }
      commit(['shop'], 'footprint');
      return { ok: true };
    },

    /* 摸對方的小精靈：每間每天 1 次；本機給一份小獎勵（第一個食物）。對方活力 +1 沒有可跨人寫入的路徑，不實作。 */
    stroke: function (hostUid) {
      var b = bucket(), st, f, rewardId = null;
      if (!hostUid || hostUid === C.uid) return fail('self');
      if (!visited[hostUid]) return fail('visitfirst');
      if (!isArr(visited[hostUid].spirits) || !visited[hostUid].spirits.length) return fail('nospirit');
      st = sub(b, 'strokes');
      if (st[hostUid]) return fail('host_once');
      st[hostUid] = 1;
      f = foods();
      if (f.length) {
        rewardId = f[0].id;
        for (var i = 0; i < f.length; i++) if (f[i].basic) { rewardId = f[i].id; break; }
        S.shop.owned[rewardId] = num(S.shop.owned[rewardId]) + 1;
      }
      commit(['shop'], 'stroke');
      return { ok: true, reward: rewardId };
    }
  };

  /* ------------------------------------------------------------------ 蛋：整格倒數 */
  function eggRemain(e, t) {
    var got = num(e.gotTs, num(e.hatchTs) - TICK), hat = num(e.hatchTs);
    var total = Math.max(1, Math.round((hat - got) / TICK));
    if (t >= hat) return { ticks: 0, total: total, next: 0 };
    var el = ticksBetween(got, t);
    return { ticks: Math.max(1, total - el), total: total, next: TICK - ((t - got) % TICK) };
  }

  /* ------------------------------------------------------------------ 性格、形態、計數 */
  function rollPers(attr, seed) {
    var list = traitList(), rng, ws, sum = 0, i, pick, acc = 0;
    if (!list.length) return null;
    ws = list.map(function (td) {
      var w = isObj(td.weights) ? td.weights : {};
      var v = typeof w[attr] === 'number' ? w[attr] : (typeof w['全'] === 'number' ? w['全'] : 1);
      return v > 0 ? v : 0;
    });
    ws.forEach(function (w) { sum += w; });
    if (sum <= 0) return list[0].id;
    rng = mulberry32(hashStr(seed));
    pick = rng() * sum;
    for (i = 0; i < list.length; i++) { acc += ws[i]; if (pick < acc) return list[i].id; }
    return list[list.length - 1].id;
  }
  function ensureTrait(o) {
    var ch = false, tr, sp;
    if (!traitsActive() || !o) return false;
    if (!isObj(o.trait)) { o.trait = {}; ch = true; }
    tr = o.trait;
    FORM_IDS.forEach(function (k) { if (typeof tr[k] !== 'number') { tr[k] = 0; ch = true; } });
    if (!tr.pers && traitList().length && o.stage !== 'egg') {
      sp = spiritDef(o.id);
      tr.pers = rollPers(sp ? sp.attr : '全', (C ? C.uid : '') + '|' + o.id + '|legacy');
      ch = true;
    }
    return ch;
  }
  function bump(o, key, n) {
    if (!o || !traitsActive() || !(n > 0)) return;
    ensureTrait(o);
    o.trait[key] = Math.min(COUNTER_MAX, num(o.trait[key]) + n);
  }
  function careHit(o, isPet) {
    if (!o || !traitsActive()) return;
    bump(o, 'care', 1);
    if (isPet) o.trait.petStreak = num(o.trait.petStreak) + 1;
    else { o.trait.petStreak = 0; o.trait.lastAct = 'x'; }
  }
  function chooseForm(o) {
    var tr = o.trait || {}, sc = {}, max = -1, tied, td = tdOf(o), pref, i;
    var ids = FORM_IDS.filter(function (f) { return !formsOn() || !!formDef(f); });
    if (!ids.length) ids = FORM_IDS;
    ids.forEach(function (f) { sc[f] = num(tr[f]) / FORM_NORM[f]; if (sc[f] > max) max = sc[f]; });
    tied = ids.filter(function (f) { return Math.abs(sc[f] - max) < 1e-9; });
    if (tied.length === 1) return { form: tied[0], scores: sc, tie: false };
    pref = td && isArr(td.formPref) ? td.formPref : ids;
    for (i = 0; i < pref.length; i++) if (tied.indexOf(pref[i]) >= 0) return { form: pref[i], scores: sc, tie: true };
    return { form: tied[0], scores: sc, tie: true };
  }
  function applyForm(o) {
    var c = chooseForm(o);
    o.trait.form = c.form;
    markSeen('form', o.id + ':' + c.form);
    return c;
  }
  function pushEvolve(o, from, to, decide) {
    var c = null, ev;
    ensureTrait(o);
    if (!isObj(o.trait)) o.trait = {};
    if (!o.trait.form) c = applyForm(o);
    ev = { type: 'evolve', id: o.id, from: from, to: to, form: o.trait.form || null };
    if (c) { ev.scores = c.scores; ev.tie = c.tie; }
    if (!isArr(o.trait.evoPending)) o.trait.evoPending = [];
    o.trait.evoPending.push(to);
    evq.push(ev);
  }
  function reactionFor(o, key) {
    var td = tdOf(o), arr, rng;
    if (!td || !isObj(td.reactions)) return undefined;
    arr = td.reactions[key];
    if (!isArr(arr) || !arr.length) return undefined;
    rng = mulberry32(hashStr((C ? C.uid : '') + '|' + o.id + '|' + key + '|' + now()));
    return arr[Math.floor(rng() * arr.length)];
  }
  function petAct(id) {
    var o = rec(id), td, b, cnt, used, tr, t, restU, rest, d, res, coldFirst, kind = 'normal', respond = true, happy = false, before, rx;
    if (!o || o.stage === 'egg') return fail('nospirit');
    ensureTrait(o);
    td = tdOf(o);
    if (!td) return roomAct(id, ACT.pet, 0);
    b = bucket(); cnt = sub(b, 'petted'); used = num(cnt[id]); tr = o.trait; t = now();
    if (used >= ACT.pet.cap) return fail('daily_cap', { cap: ACT.pet.cap });
    if (num(tr.petStreak) >= PET_ANNOY_STREAK) {       /* 連續撫摸太多次：被討厭一次 */
      settle(o); before = o.vigor;
      o.vigor = r2(Math.max(VIGOR_MIN, o.vigor - 2));
      cnt[id] = used + 1; tr.petStreak = 0; tr.lastAct = 'x';
      commit(['spirit', 'shop'], 'care');
      res = { ok: true, delta: r2(o.vigor - before), vigor: o.vigor, annoyed: true, responded: false };
      rx = reactionFor(o, 'annoyed'); if (rx !== undefined) res.reaction = rx;
      return res;
    }
    rest = sub(b, 'rest'); restU = num(rest[id]);
    if (restU >= REST_CAP) return fail('rest_cap');
    if (vigorAt(o, t) >= VIGOR_MAX) return fail('full');
    coldFirst = modOf(o, 'petColdFirst', 0);
    if (used < coldFirst) { respond = false; kind = 'cold'; }
    else if (modOf(o, 'petPair', 0) > 0) {
      if (!(tr.lastAct === 'pet' && num(tr.lastPetTs) > 0 && t - num(tr.lastPetTs) <= SHY_WINDOW)) { respond = false; kind = 'wait'; }
    }
    settle(o);
    cnt[id] = used + 1;
    careHit(o, true); tr.lastAct = 'pet'; tr.lastPetTs = t;
    if (!respond) {
      commit(['spirit', 'shop'], 'care');
      res = { ok: true, delta: 0, vigor: o.vigor, responded: false };
      res[kind] = true;
      rx = reactionFor(o, kind === 'cold' ? 'petCold' : 'petWait'); if (rx !== undefined) res.reaction = rx;
      return res;
    }
    d = Math.min(ACT.pet.vigor, REST_CAP - restU, VIGOR_MAX - o.vigor);
    o.vigor = r2(o.vigor + d);
    rest[id] = restU + d;
    if (coldFirst > 0 && used === coldFirst && modOf(o, 'petHappyBond', 0) > 0) { addBond(o, modOf(o, 'petHappyBond', 0)); happy = true; }
    commit(['spirit', 'shop'], 'care');
    res = { ok: true, delta: d, vigor: o.vigor, responded: true, bond: o.bond };
    if (happy) res.happy = true;
    rx = reactionFor(o, 'pet'); if (rx !== undefined) res.reaction = rx;
    return res;
  }
  function newOwned(id, stage, bond, t) {
    var sp = spiritDef(id), r = { id: id, stage: stage, bond: bond, vigor: VIGOR_START, lastTs: t, seenTs: t, slot: 'room', skillAt: 0 };
    if (traitsActive()) {
      r.trait = { born: t, care: 0, adv: 0, lore: 0 };
      if (traitList().length) r.trait.pers = rollPers(sp ? sp.attr : '全', (C ? C.uid : '') + '|' + id + '|' + t);
    }
    return r;
  }
  function backfillAll() {
    var ch = false, dx = false;
    if (!traitsActive() || !S) return;
    S.spirit.owned.forEach(function (o) {
      if (o.stage === 'egg') return;
      if (ensureTrait(o)) ch = true;
      if (formsOn() && (o.stage === 'adult' || o.stage === 'awake') && !o.trait.form) { applyForm(o); ch = true; dx = true; }
    });
    if (ch) persist(dx ? ['spirit', 'dex'] : ['spirit']);
  }
  function pickGift(o, rng) {
    var fl = foods().slice().sort(function (a, b) { return num(a.price) - num(b.price); }), cand, fav, sp = spiritDef(o.id), pick;
    if (intelCount() > 0 && (rng() < 0.35 || !fl.length)) {
      S.shop.owned.intel_shard = num(S.shop.owned.intel_shard) + 1;
      return { kind: 'shard', id: 'intel_shard' };
    }
    if (!fl.length) return null;
    cand = fl.slice(0, Math.max(1, Math.ceil(fl.length / 2)));
    fav = sp ? cand.filter(function (f) { return foodCat(f) === sp.favFood; }) : [];
    if (fav.length && rng() < 0.5) cand = fav;
    pick = cand[Math.floor(rng() * cand.length)];
    S.shop.owned[pick.id] = num(S.shop.owned[pick.id]) + 1;
    return { kind: 'food', id: pick.id, name: pick.name || pick.id };
  }

  /* ------------------------------------------------------------------ 房間格數 */
  function usedSlots() { return S.spirit.owned.length + S.spirit.eggs.length; }
  function inWaiting(id) { return S.spirit.waiting.some(function (w) { return w.id === id; }); }
  function inEggs(id) { return S.spirit.eggs.some(function (e) { return e.id === id; }); }
  /* 空格補位：待孵清單先進先出，補位的蛋從補位這一刻才開始計時（整格） */
  function fillSlots() {
    var n = 0, t, w, sp;
    if (!S || !isArr(S.spirit.waiting)) return 0;
    t = now();
    while (S.spirit.waiting.length && usedSlots() < ROOM_TOTAL) {
      w = S.spirit.waiting.shift();
      sp = spiritDef(w.id);
      if (!sp || rec(w.id) || inEggs(w.id)) continue;
      S.spirit.eggs.push({ id: w.id, chapter: w.chapter === undefined ? null : w.chapter, gotTs: t, hatchTs: t + hatchTicks(sp) * TICK, waitedSince: num(w.gotTs, t) });
      n++;
    }
    return n;
  }

  /* ------------------------------------------------------------------ 稱號登記（條件在 WALK_DEX 的 titles 類別，每個稱號有 cond:{key,value}） */
  function titleDefs() {
    var def = win().WALK_DEX, cats = isObj(def) ? (isArr(def.categories) ? def.categories : (isArr(def.cats) ? def.cats : [])) : [], i;
    for (i = 0; i < cats.length; i++) if (isObj(cats[i]) && cats[i].id === 'titles' && isArr(cats[i].items)) return cats[i].items.filter(isObj);
    return [];
  }
  function furnitureOwnedCount() {
    var d = win().WALK_SHOP, arr = isObj(d) && isArr(d.furniture) ? d.furniture : [], n = 0;
    arr.forEach(function (f) { if (isObj(f) && num(S.shop.owned[f.id]) > 0) n++; });
    return n;
  }
  function tripodOK() {
    var def = win().WALK_DEX, tp = isObj(def) ? def.tripod : null, size = tp && tp.size ? tp.size : 3, fields = tp && isArr(tp.distinct) ? tp.distinct : ['eraId', 'attr', 'scoutKind0'], list;
    if (S.spirit.owned.length < size) return false;
    list = S.spirit.owned.map(function (o) { return spiritDef(o.id); });
    if (list.some(function (x) { return !x; })) return false;
    return fields.every(function (f) {
      var seen = {}, ok = true;
      list.forEach(function (sp) {
        var v = f === 'scoutKind0' ? (sp.scout && isArr(sp.scout.kind) ? sp.scout.kind[0] : (sp.scout ? sp.scout.kind : undefined)) : sp[f];
        if (v === undefined || seen[v]) ok = false; else seen[v] = 1;
      });
      return ok;
    });
  }
  function condMet(cond, ctx) {
    var v = num(cond.value, 1), k = cond.key, st = S.dex.stat;
    if (k === 'chaptersDone') return chaptersCount() >= v;
    if (k === 'stopsArrived') return keys(st.stops).length >= v;
    if (k === 'spiritsHatched') return keys(S.dex.seen.spirit).length >= v;
    if (k === 'roomsVisited') return keys(st.ever).length >= v;
    if (k === 'nightArrive') return num(st.night) >= v;
    if (k === 'furnitureOwned') return furnitureOwnedCount() >= v;
    if (k === 'dexPct') { if (ctx.pct === undefined) ctx.pct = dexInfo().pct; return ctx.pct >= v; }
    if (k === 'tripod') return tripodOK();
    if (k === 'spiritsAwake') return S.spirit.owned.filter(function (o) { return o.stage === 'awake'; }).length >= v;
    if (k === 'expeditions') return num(st.expeditions) >= v;
    if (k === 'setComplete') return WalkStore.setBonuses().sets.filter(function (x) { return x.complete; }).length >= v;
    if (k === 'intelCards') return intelCount() >= v;
    return false;
  }
  /* 達成條件的稱號寫進 dex.titles（時間）與 dex.seen.titles（圖鑑計數），並排進待通知清單。回傳這次有沒有新增。 */
  function awardTitles() {
    var defs = titleDefs(), ctx = {}, ch = false;
    defs.forEach(function (t) {
      if (S.dex.titles[t.id] || !isObj(t.cond)) return;
      if (condMet(t.cond, ctx)) {
        S.dex.titles[t.id] = now(); markSeen('titles', t.id); S.dex.titlePending.push(t.id); ch = true; ctx.pct = undefined;
      }
    });
    return ch;
  }

  /* ------------------------------------------------------------------ 碎屑與老闆任務板 */
  function shardCatOf(sp) {
    var k = sp && sp.scout ? sp.scout.kind : null;
    if (isArr(k)) k = k[0];
    return k ? normKind(k) : '通用';
  }
  function catShards(cat) { return num(S.shop.shards[cat]) + num(S.shop.owned.intel_shard); }
  function shardsTotal() { var n = num(S.shop.owned.intel_shard); keys(S.shop.shards).forEach(function (k) { n += num(S.shop.shards[k]); }); return n; }
  /* 扣碎屑：cat 給了先扣該類，不夠用通用補；沒給就從最多的類別開始扣 */
  function spendShards(n, cat) {
    var left = n, ks, take;
    function from(k) { take = Math.min(left, num(S.shop.shards[k])); if (take > 0) { S.shop.shards[k] -= take; left -= take; if (S.shop.shards[k] <= 0) delete S.shop.shards[k]; } }
    if (cat) from(cat);
    else { ks = keys(S.shop.shards).sort(function (a, b) { return num(S.shop.shards[b]) - num(S.shop.shards[a]) || (a < b ? -1 : 1); }); ks.forEach(function (k) { if (left > 0) from(k); }); }
    if (left > 0) {
      take = Math.min(left, num(S.shop.owned.intel_shard));
      S.shop.owned.intel_shard = num(S.shop.owned.intel_shard) - take; left -= take;
      if (S.shop.owned.intel_shard <= 0) delete S.shop.owned.intel_shard;
    }
    if (left > 0 && !cat) { keys(S.shop.shards).forEach(function (k) { if (left > 0) from(k); }); }
    return left === 0;
  }
  function boardPool() { var d = win().WALK_SHOP, b = isObj(d) ? d.board : null; return isObj(b) && isArr(b.pool) ? b.pool.filter(isObj) : []; }
  function boardPerDay() { var d = win().WALK_SHOP, b = isObj(d) ? d.board : null; return isObj(b) ? num(b.perDay, 3) : 3; }
  function boardToday() {
    var b = bucket(), pool, d, sorted;
    if (!isObj(b.board) || !isArr(b.board.ids)) {
      d = today(); pool = boardPool();
      sorted = pool.slice().sort(function (x, y) { return hashStr(d + '|' + C.uid + '|' + x.id) - hashStr(d + '|' + C.uid + '|' + y.id); });
      b.board = { ids: sorted.slice(0, boardPerDay()).map(function (q) { return q.id; }), p: {}, c: {} };
    }
    if (!isObj(b.board.p)) b.board.p = {};
    if (!isObj(b.board.c)) b.board.c = {};
    return b.board;
  }
  function reportBoard(event, n) {
    var bd = boardToday(), pool = boardPool(), ch = false;
    if (!(n > 0)) return false;
    bd.ids.forEach(function (id) {
      var q = pool.filter(function (x) { return x.id === id; })[0];
      if (!q || q.event !== event || bd.c[id]) return;
      var cap = Math.max(1, num(q.n, 1)), nv = Math.min(cap, num(bd.p[id]) + n);
      if (nv !== num(bd.p[id])) { bd.p[id] = nv; ch = true; }
    });
    if (ch) persist(['shop']);
    return ch;
  }

  /* ------------------------------------------------------------------ 交換 */
  var TRADE_WHY = {
    offline: '離線時不能交換，連上網路再試。', self: '不能和自己交換。', notteam: '只能和同隊的隊友交換。', daily_cap: '今天已經換過 3 次了，明天再來。',
    nogive: '你現在沒有可以交換的小精靈。', egg: '蛋不能交換。', legend: '傳說的小精靈不能交換。', expedition: '這隻正在勘察，先領回情報再換。',
    peerhas: '對方已經有這一種了。', mine_has: '你已經有這一種了。', nospirit: '找不到這隻小精靈。', expired: '這個提案已經過期。', nodata: '資料還沒準備好。'
  };
  var peerCache = {};
  var tradeCache = { incoming: [], outgoing: [] };
  function teamIdNow() { var t = C ? C.teamId : null; try { return typeof t === 'function' ? t() : (t === undefined ? null : t); } catch (e) { return null; } }
  function nickOf(uid) {
    var v;
    if (C && typeof C.nickOf === 'function') { try { v = C.nickOf(uid); if (v) return String(v).slice(0, 12); } catch (e) { /* 忽略 */ } }
    return visited[uid] && visited[uid].nick ? String(visited[uid].nick).slice(0, 12) : '';
  }
  function myNick() { var p = C && typeof C.profile === 'function' ? (C.profile() || {}) : {}; return String(p.nick || '').slice(0, 12); }
  function spiritIds(v) {
    var out = [];
    if (isArr(v)) v.forEach(function (x) { if (isObj(x) && x.id !== undefined) out.push(x.id); });
    else if (isObj(v)) keys(v).forEach(function (k) { if (isObj(v[k]) && v[k].id !== undefined) out.push(v[k].id); });
    return out;
  }
  function giveReason(o) {
    var sp = spiritDef(o.id);
    if (!sp) return 'nodata';
    if (o.stage === 'egg') return 'egg';
    if (sp.rarity === '傳說') return 'legend';
    if (expeditionActive() && S.expedition.spiritId === o.id) return 'expedition';
    return null;
  }
  function snapshotOf(o) {
    var tr = isObj(o.trait) ? cl(o.trait) : {};
    delete tr.evoPending;
    return { id: o.id, stage: o.stage, bond: num(o.bond), vigor: vigorAt(o, now()), trait: tr, form: tr.form || null };
  }
  function prefetchPeer(uid, cb) {
    var ref;
    if (!C.root || !uid) return cb();
    ref = refAt('rooms/' + uid + '/spirits');
    if (!ref) return cb();
    ref.once('value', function (s) {
      var v = s && typeof s.val === 'function' ? s.val() : null;
      if (v !== null && v !== undefined) peerCache[uid] = spiritIds(v);
      cb();
    }, function () { cb(); });
    return undefined;
  }
  function readTrade(id, cb) {
    var ref = refAt('trades/' + id);
    if (!ref) return cb(null);
    ref.once('value', function (s) {
      var v = s && typeof s.val === 'function' ? s.val() : null;
      if (isObj(v)) { v = cl(v); v.id = id; cb(v); } else cb(null);
    }, function () { cb(null); });
    return undefined;
  }
  /* 只在狀態仍符合時才更新（有 transaction 用 transaction，沒有就讀了再寫） */
  function casTrade(id, expect, patch, cb) {
    var ref = refAt('trades/' + id);
    if (!ref) return cb(fail('error'));
    if (typeof ref.transaction === 'function') {
      ref.transaction(function (cur) {
        var n;
        if (cur === null || cur === undefined) return cur === undefined ? null : cur;
        if (!isObj(cur) || expect.indexOf(cur.status) < 0) return undefined;
        n = cl(cur); keys(patch).forEach(function (k) { n[k] = patch[k]; });
        return n;
      }, function (err, committed, snap) {
        var v;
        if (err) return cb(fail('error'));
        if (!committed) return cb(fail('conflict'));
        v = snap && typeof snap.val === 'function' ? snap.val() : null;
        if (!isObj(v)) return cb(fail('notfound'));
        cb({ ok: true, trade: v });
      }, false);
      return undefined;
    }
    ref.once('value', function (s) {
      var cur = s && typeof s.val === 'function' ? s.val() : null, n;
      if (!isObj(cur)) return cb(fail('notfound'));
      if (expect.indexOf(cur.status) < 0) return cb(fail('conflict'));
      n = cl(cur); keys(patch).forEach(function (k) { n[k] = patch[k]; });
      ref.set(n, function (err) { cb(err ? fail('error') : { ok: true, trade: n }); });
    }, function () { cb(fail('error')); });
    return undefined;
  }
  /* 讀我收到與我送出的提案，更新快取 */
  function loadTrades(cb) {
    var base = refAt('trades'), pend = 2, inc = {}, out = {}, bad = false;
    if (!base) return cb(true);
    function fin() {
      pend--;
      if (pend > 0) return;
      tradeCache.incoming = keys(inc).map(function (k) { var v = cl(inc[k]); v.id = k; return v; });
      tradeCache.outgoing = keys(out).map(function (k) { var v = cl(out[k]); v.id = k; return v; });
      cb(bad ? true : null);
    }
    function q(field, bag) {
      var qr;
      try { qr = base.orderByChild(field).equalTo(C.uid); } catch (e) { bad = true; return fin(); }
      qr.once('value', function (s) {
        var v = s && typeof s.val === 'function' ? s.val() : null;
        if (isObj(v)) keys(v).forEach(function (k) { if (isObj(v[k])) bag[k] = v[k]; });
        fin();
      }, function () { bad = true; fin(); });
      return undefined;
    }
    q('to', inc); q('from', out);
    return undefined;
  }
  /* 把一筆交換套用到自己這端：移除給出去的、加入收到的（用提案裡的不可變快照）。冪等：已記在 tradeLog 的不再重做；任何一步失敗都不改資料。 */
  function applyTrade(tid, outId, inSnap) {
    var o = rec(outId), i, keysL, b, no;
    if (S.spirit.tradeLog[tid]) return { ok: true, already: true };
    if (!isObj(inSnap) || inSnap.id === undefined || !spiritDef(inSnap.id)) return fail('nodata');
    if (o && expeditionActive() && S.expedition.spiritId === outId) return fail('expedition');
    if (rec(inSnap.id) && inSnap.id !== outId) return fail('dup');
    if (!o && usedSlots() >= ROOM_TOTAL) return fail('full');
    if (o) for (i = 0; i < S.spirit.owned.length; i++) if (S.spirit.owned[i].id === outId) { S.spirit.owned.splice(i, 1); break; }
    no = { id: inSnap.id, stage: inSnap.stage || 'baby', bond: Math.floor(num(inSnap.bond) / 2), vigor: num(inSnap.vigor, VIGOR_START), lastTs: now(), seenTs: now(), slot: 'room', skillAt: 0 };
    if (isObj(inSnap.trait) && keys(inSnap.trait).length) no.trait = cl(inSnap.trait);
    else if (traitsActive()) no.trait = { born: now(), care: 0, adv: 0, lore: 0 };
    if (no.trait && inSnap.form && !no.trait.form) no.trait.form = inSnap.form;
    S.spirit.owned.push(no);
    markSeen('spirit', no.id);
    if (no.trait && no.trait.form) markSeen('form', no.id + ':' + no.trait.form);
    S.spirit.tradeLog[tid] = now();
    keysL = keys(S.spirit.tradeLog);
    if (keysL.length > TRADE_LOG_KEEP) { keysL.sort(function (a, c) { return S.spirit.tradeLog[a] - S.spirit.tradeLog[c]; }); delete S.spirit.tradeLog[keysL[0]]; }
    b = bucket(); b.trade = num(b.trade) + 1;
    commit(['spirit', 'dex', 'shop'], 'trade');
    return { ok: true, in: no.id, out: outId };
  }

  /* ------------------------------------------------------------------ 內部函式（需要 WalkStore 已宣告） */
  function expeditionActive() { return isObj(S.expedition) && S.expedition.spiritId !== undefined && S.expedition.spiritId !== null; }

  function spend(n) {
    if (!C || typeof C.addSpent !== 'function') return true;
    try {
      var r = C.addSpent(n);
      return r === false ? false : true;
    } catch (e) { return false; }
  }

  function setBuyable(set) {
    return set.items.filter(function (x) { var d = shopDef(x); return !(d && d.noBuy); });
  }
  /* 點數發放：與 walk.js 的 hqPoints＝總分−已花 對得上，表達成「負的 addSpent」；init 若提供 grantPoints(n) 則優先用 */
  function grantPoints(n) {
    if (!C || n <= 0) return;
    try {
      if (typeof C.grantPoints === 'function') C.grantPoints(n);
      else if (typeof C.addSpent === 'function') C.addSpent(-n);
    } catch (e) { /* 忽略 */ }
    S.shop.bonusPts = num(S.shop.bonusPts) + n;
  }
  /* 普通蛋：從尚未擁有、沒有蛋、沒有送回的普通小精靈中，用種子挑一隻 */
  function pickCommonEgg() {
    var pool = spirits().filter(function (sp) {
      if (sp.rarity !== '普通' || sp.needDexPct !== undefined || rec(sp.id) || S.spirit.released.indexOf(sp.id) >= 0) return false;
      return !S.spirit.eggs.some(function (e) { return e.id === sp.id; }) && !inWaiting(sp.id);
    });
    if (!pool.length) return null;
    var rng = mulberry32(hashStr(C.uid + '|egg|' + now() + '|' + pool.length));
    return pool[Math.floor(rng() * pool.length)].id;
  }

  function roomAct(id, cfg, extra) {
    var o = rec(id), b, cnt, used, rest, restU, d, t;
    if (!o || o.stage === 'egg') return fail('nospirit');
    b = bucket();
    cnt = sub(b, cfg.key); used = num(cnt[id]);
    if (used >= cfg.cap) return fail('daily_cap', { cap: cfg.cap });
    rest = sub(b, 'rest'); restU = num(rest[id]);
    if (restU >= REST_CAP) return fail('rest_cap');
    t = now();
    if (vigorAt(o, t) >= VIGOR_MAX) return fail('full');
    settle(o);
    var gmul = cfg === ACT.play ? modOf(o, 'playMul', 1) : (cfg === ACT.tidy ? modOf(o, 'napMul', 1) : 1);
    d = Math.min(r2((cfg.vigor + num(extra)) * gmul), REST_CAP - restU, VIGOR_MAX - o.vigor);
    o.vigor = r2(o.vigor + d);
    cnt[id] = used + 1;
    rest[id] = restU + d;
    careHit(o, cfg === ACT.pet);
    commit(['spirit', 'shop'], 'care');
    var rr = { ok: true, delta: d, vigor: o.vigor };
    var rx = reactionFor(o, cfg === ACT.play ? 'play' : 'pet'); if (rx !== undefined) rr.reaction = rx;
    return rr;
  }

  /* 價格與可買判斷（不改狀態） */
  function priceQuote(it, n, b) {
    var base = num(it.price), g = itemGroup(it), total, cap;
    if (rarityLocked(it)) return { ok: false, reason: 'rare_locked', price: base * n };
    if (it.buyable === false) return { ok: false, reason: 'not_for_sale', price: base * n };
    total = base * n;
    /* 新手首購半價：只有「第一次購買」的第一件；補給官折扣不適用商店 */
    if (!S.shop.firstBuy && base > 0) total = total - base + Math.max(1, Math.round(base * FIRST_BUY_DISCOUNT));
    if (g) {
      cap = g === 'furniture' ? FURNITURE_DAILY : FOOD_DAILY;
      if (num(b[g]) + n > cap) return { ok: false, reason: 'daily_cap', price: total };
    }
    if (pointsNow() < total) return { ok: false, reason: 'nopoints', price: total };
    return { ok: true, price: total };
  }

  /* 會增加羈絆的動作：把這一次產生的進化事件附在回傳值（evolved／evolutions）；commit 也會對 on() 訂閱者發 'evolve'（第三個參數是事件） */
  ['feed', 'play', 'pet', 'tidy', 'event', 'collect', 'dispatch'].forEach(function (k) {
    var f = WalkStore[k];
    WalkStore[k] = function () {
      lastEv = null;
      var r = f.apply(this, arguments);
      if (r && r.ok && k !== 'tidy') reportBoard(k === 'event' ? String(arguments[0]) : k, 1);
      if (r && r.ok && lastEv && lastEv.length) { r.evolved = lastEv[0]; r.evolutions = lastEv.slice(); }
      lastEv = null;
      return r;
    };
  });

  root.WalkStore = WalkStore;
  if (typeof module !== 'undefined' && module.exports) module.exports = WalkStore;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
