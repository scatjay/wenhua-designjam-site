/* 走讀遊戲：房間 WalkRoom（房間畫面、小精靈漫步、擺放與設定、房間街與訪客）。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md 第 2、5、6 節；設計稿 ROOM_SPIRIT_DESIGN_1029 第 1、4.5 節、SHOP_ROOM_LIFE_1029 第 1、2 節。
   ES5 風格 IIFE，掛 window.WalkRoom。資料與狀態一律透過 WalkStore（讀寫）、WalkPix（畫像素）、WALK_SPIRITS／WALK_SHOP（資料，缺少時畫占位）。
   單一 canvas：12×8 格、每格 16 邏輯像素、整數放大 3 倍；8 FPS 步進；分頁在背景或省電模式停止；unmount 清掉計時器與監聽。
   學生視角用語；沒有任何文字輸入；需要確認的動作用頁內兩段式（第一次按變「再按一次確認」，6 秒復原）。
   11-03 追加（規格第 9 節）：小精靈行為狀態機（遊蕩、打盹、玩耍、進食、探索、撒嬌、害羞躲藏、唱歌、炫耀、一起玩、想你了），
   讀 WALK_BEHAVIOR（缺少時用內建備用）、WalkStore.personalityOf／formOf／giftToday、WalkPix.formSprite；全部缺少時退回舊的隨機漫步。 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ 常數 */
  var CELL = 16, SC = 3;
  var FRAME_MS = 125;                       /* 8 FPS */
  var MOVE_MS = 500;                        /* 一步的位移動畫 */
  var LOW_VIGOR = 40, HIGH_VIGOR = 70;
  var ARM_MS = 6000;
  var MODEL_REFRESH_MS = 30000;
  var FOOTPRINT_HOSTS = 10;
  var AWAY_MS = 24 * 3600 * 1000;          /* 離開超過一天算「很久沒來」 */
  var SPOT_IDS = ['wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6',
    'floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6',
    'window1', 'window2', 'window3'];
  var STICKERS = ['like', 'wow', 'learn', 'pass'];
  var STICKER_LABEL = { like: '讚', wow: '好厲害', learn: '想借鏡', pass: '路過' };
  var STAGE_LABEL = { egg: '蛋', baby: '幼體', adult: '成體', awake: '覺醒' };
  var DEX_BOOKS = [['people', '人物'], ['place', '地點'], ['clue', '線索卡'], ['agent', '探員'], ['spirit', '小精靈']];
  var AREA_PUBLIC = { achieve: 'achievements', shelf: 'dex', closet: 'closet', photos: 'photos', map: 'map', nest: 'nest' };
  var AREA_LABEL = { achieve: '成就牆', shelf: '圖鑑書櫃', closet: '衣櫃', photos: '照片牆', map: '地圖桌', nest: '小精靈窩' };
  var AREA_ORDER = ['achieve', 'shelf', 'closet', 'nest', 'photos', 'map'];
  var WINDOW_CHOICES = [['auto', '自動'], ['day', '白天'], ['dusk', '黃昏'], ['night', '夜晚'], ['cloud', '多雲'], ['rain', '下雨']];
  var OPEN_CHOICES = [
    ['closed', '不開放', '誰都不能進來，房間街也看不到這間。'],
    ['team', '只給隊友', '只有同隊的夥伴可以來逛（預設）。'],
    ['all', '所有人', '同一個場次的玩家都可以來逛。']
  ];

  /* 預設格局：與 js/walk_data_shop.js 的 WALK_SHOP.layout 相同（資料檔存在且格式完整時以資料檔為準；這份只是備用）。
     牆面列 0～2；成就牆、照片牆、書櫃在牆面，衣櫃、地圖桌擋路，小精靈窩可走。 */
  var DEFAULT_LAYOUT = {
    cols: 12, rows: 8, wallRows: 3, walkRows: null,
    spots: {
      wall1: { x: 0, y: 2 }, wall2: { x: 1, y: 2 }, wall3: { x: 3, y: 2 }, wall4: { x: 6, y: 2 }, wall5: { x: 7, y: 2 }, wall6: { x: 8, y: 2 },
      floor1: { x: 2, y: 5 }, floor2: { x: 3, y: 3 }, floor3: { x: 8, y: 3 }, floor4: { x: 8, y: 5 }, floor5: { x: 3, y: 7 }, floor6: { x: 6, y: 7 },
      window1: { x: 3, y: 0 }, window2: { x: 6, y: 0 }, window3: { x: 9, y: 0 }
    },
    areas: {
      achieve: { x: 0, y: 0, w: 2, h: 2 }, photos: { x: 4, y: 0, w: 2, h: 2 }, shelf: { x: 10, y: 0, w: 2, h: 4 },
      closet: { x: 0, y: 3, w: 1, h: 2 }, map: { x: 5, y: 4, w: 2, h: 1 }, nest: { x: 10, y: 6, w: 1, h: 1 }
    },
    blocking: ['closet', 'shelf', 'map']
  };

  /* 配色：亮／暗各一組（canvas 用） */
  var THEMES = {
    light: { wall: '#f6e3c8', trim: '#d9b98a', baseboard: '#b98a5a', floorA: '#e8c9a0', floorB: '#dfbd92', ph: '#8a7d98', phFill: 'rgba(255,255,255,0.45)', shadow: 'rgba(43,34,51,0.18)' },
    dark: { wall: '#3a3350', trim: '#2b2233', baseboard: '#241f33', floorA: '#4a3f5e', floorB: '#43385a', ph: '#b8aacb', phFill: 'rgba(255,255,255,0.12)', shadow: 'rgba(0,0,0,0.3)' }
  };
  var SKY = {
    day: { bg: '#8fd3ff', cloud: '#ffffff', sun: '#f6d55c' },
    dawn: { bg: '#ffc7a0', cloud: '#fff0e0', sun: '#ffe08a' },
    dusk: { bg: '#f08a5d', cloud: '#ffd2b0', sun: '#d9534f' },
    night: { bg: '#1b2447', cloud: '#4a5278', sun: '#fff4c8' }
  };

  /* 占位與備用像素圖 */
  var BLOB = ['...kkkk...', '..kXXXXk..', '.kXXXXXXk.', '.kXkXXkXXk', '.kXXXXXXXk', '.kXXXXXXXk', '..kXXXXXk.', '..kkXXkk..', '....kk....'];
  var EGG = ['..kkkk..', '.kwwXXk.', 'kwwXXXXk', 'kwXXXXXk', 'kXXXXXXk', 'kXXXXXXk', '.kXXXXk.', '..kkkk..'];
  var GLYPH_Z = ['ZZZ', '.Z.', 'ZZZ'];
  var GLYPH_HEART = ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'];
  var GLYPH_NOTE = ['..nnn', '..n.n', '..n..', 'nnn..', 'nnn..'];
  var GLYPH_Q = ['qqq', '..q', '.qq', '...', '.q.'];
  var GLYPH_BANG = ['.e.', '.e.', '.e.', '...', '.e.'];
  var GLYPH_GIFT = ['.g.g.', '..g..', 'ggggg', 'gyyyg', 'ggggg', 'ggggg'];
  var GLYPH_NOM = ['o.o', '.o.', 'o.o'];

  /* ------------------------------------------------------------------ 小工具 */
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function isObj(x) { return x !== null && typeof x === 'object' && !isArr(x); }
  function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); }
  function keysOf(o) { return isObj(o) ? Object.keys(o) : []; }
  function hashStr(s) {
    var h = 5381, i;
    s = String(s);
    for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h >>> 0;
  }
  var imul = Math.imul || function (a, b) {
    var ah = (a >>> 16) & 0xffff, al = a & 0xffff, bh = (b >>> 16) & 0xffff, bl = b & 0xffff;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
  };
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = imul(a ^ (a >>> 15), 1 | a);
      t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function hasCls(e, c) { return (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0; }
  function addCls(e, c) { if (!hasCls(e, c)) e.className = ((e.className || '') + ' ' + c).replace(/^\s+/, ''); }
  function rmCls(e, c) { e.className = (' ' + (e.className || '') + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }
  function store() { return root.WalkStore || null; }
  function pix() { return root.WalkPix || null; }
  function nowOf(opts) { return opts && typeof opts.now === 'function' ? opts.now() : Date.now(); }
  function isDark() {
    try {
      var d = root.document;
      if (!d) return false;
      return /(^|\s)dk(\s|$)/.test((d.documentElement && d.documentElement.className) || '') || /(^|\s)dk(\s|$)/.test((d.body && d.body.className) || '');
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ 資料來源（防呆） */
  function listOf(x) {
    var out = [], k, v;
    if (!x) return out;
    if (isArr(x)) return x.filter(isObj);
    if (isObj(x)) {
      for (k in x) {
        if (!Object.prototype.hasOwnProperty.call(x, k)) continue;
        v = x[k];
        if (isObj(v)) { if (v.id === undefined) { v = JSON.parse(JSON.stringify(v)); v.id = k; } out.push(v); }
      }
    }
    return out;
  }
  function shopItems() {
    var d = root.WALK_SHOP, out = [], k, arr;
    if (!d) return out;
    if (isArr(d)) return d.filter(isObj);
    if (isArr(d.items)) return d.items.filter(isObj);
    if (isArr(d.catalog)) return d.catalog.filter(isObj);
    if (isObj(d.items)) return listOf(d.items);
    for (k in d) {
      if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
      arr = d[k];
      if (isArr(arr)) arr.forEach(function (it) { if (isObj(it)) out.push(it); });
    }
    return out;
  }
  function itemDef(id) {
    var a = shopItems(), i, t = root.WALK_TOYS, c;
    for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    if (isObj(t) && isArr(t.items)) t = t.items;
    a = listOf(t);
    for (i = 0; i < a.length; i++) if (a[i].id === id) { c = {}; for (var k in a[i]) if (Object.prototype.hasOwnProperty.call(a[i], k)) c[k] = a[i][k]; if (!c.spot) c.spot = 'pet'; return c; }
    return null;
  }
  function spiritList() {
    var d = root.WALK_SPIRITS;
    if (isObj(d) && isArr(d.list)) d = d.list;
    if (isObj(d) && isArr(d.items)) d = d.items;
    return listOf(d);
  }
  function spiritDef(id) { var a = spiritList(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function foodName(id) {
    var d = root.WALK_FOODS, a, i;
    if (isObj(d) && isArr(d.items)) d = d.items;
    a = listOf(d);
    for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i].name || id;
    return id;
  }

  /* 矩陣：字串陣列、換行字串，或 {rows, pal} 物件 */
  function matrixOf(m) {
    if (!m) return null;
    if (isObj(m) && (m.rows || m.matrix)) return { rows: m.rows || m.matrix, pal: m.pal || m.palette || null };
    if (isArr(m) || typeof m === 'string') return { rows: m, pal: null };
    return null;
  }
  function itemSprite(def) {
    var m;
    if (!def) return null;
    m = matrixOf(def.sprite || def.px || def.pix || def.art);
    if (m && !m.pal && (def.pal || def.palette)) m.pal = def.pal || def.palette;
    return m;
  }
  function spiritSprite(def, stage) {
    var st, m;
    if (!def || !isObj(def.stages)) return null;
    st = def.stages[stage] || (stage === 'awake' ? def.stages.adult : null) || def.stages.baby;
    if (!st) return null;
    m = matrixOf(st.sprite !== undefined ? st.sprite : st);
    if (m && !m.pal && st.pal) m.pal = st.pal;
    return m;
  }

  /* 家具／擺放點類型 */
  var PET_RE = /(^|[^a-z])pet([^a-z]|$)|小精靈|窩|玩具|食碗|nest|toy|bowl/i;
  function itemKind(def) {
    var sp, z, c;
    if (!def) return null;
    sp = String(def.spot || def.slot || '');
    z = String(def.zone || '');
    c = String(def.cat || def.kind || def.type || def.category || '');
    if (PET_RE.test(sp)) return 'pet';
    if (/wall|牆/i.test(sp)) return 'wall';
    if (/floor|地/i.test(sp)) return 'floor';
    if (/window|窗/i.test(sp)) return 'window';
    if (PET_RE.test(z) || PET_RE.test(c)) return 'pet';
    if (/wall|牆/i.test(z)) return 'wall';
    if (/floor|地/i.test(z)) return 'floor';
    if (/window|窗/i.test(z)) return 'window';
    if (/wall|牆/i.test(c)) return 'wall';
    if (/floor|地/i.test(c)) return 'floor';
    if (/window|窗/i.test(c)) return 'window';
    return null;
  }
  function isFoodDef(def) { return !!def && /food|食|snack|點心/i.test(String(def.cat || def.kind || def.type || def.category || '')) && itemKind(def) !== 'pet'; }
  function spotType(spotId) { return String(spotId).replace(/\d+$/, ''); }
  function spotLabel(spotId) {
    var n = String(spotId).replace(/^\D+/, ''), t = spotType(spotId);
    return (t === 'wall' ? '牆面 ' : (t === 'floor' ? '地面 ' : '窗邊 ')) + n;
  }
  /* 這件家具能不能放在這個擺放點：牆↔牆、窗↔窗、地面可放地面家具與小精靈用品；類型不明的不限 */
  function canPlace(spotId, def) {
    var st = spotType(spotId), k = itemKind(def);
    if (SPOT_IDS.indexOf(spotId) < 0) return { ok: false, reason: 'badspot' };
    if (!def || k === null) return { ok: true };
    if (st === 'wall') return k === 'wall' ? { ok: true } : { ok: false, reason: 'wrongzone' };
    if (st === 'window') return k === 'window' ? { ok: true } : { ok: false, reason: 'wrongzone' };
    return k === 'floor' || k === 'pet' ? { ok: true } : { ok: false, reason: 'wrongzone' };
  }

  /* ------------------------------------------------------------------ 格局與可走格 */
  /* 外部格局的擺放點可能是 [{id:'w1',kind:'wall',x,y}…] 或 {wall1:{x,y}…}：統一成 wall1／floor1／window1 */
  function spotKeyOf(e) {
    var kind = String(e.kind || ''), n = String(e.id || '').replace(/^\D+/, '');
    if (SPOT_IDS.indexOf(e.id) >= 0) return e.id;
    if (!/^(wall|floor|window)$/.test(kind)) { var c = String(e.id || '').charAt(0); kind = c === 'w' ? 'wall' : (c === 'f' ? 'floor' : (c === 'n' ? 'window' : '')); }
    return kind && n ? kind + n : null;
  }
  function normSpots(raw) {
    var out = {}, k;
    if (isArr(raw)) raw.forEach(function (e) { if (isObj(e) && typeof e.x === 'number' && typeof e.y === 'number') { var key = spotKeyOf(e); if (key) out[key] = { x: e.x, y: e.y }; } });
    else if (isObj(raw)) for (k in raw) if (Object.prototype.hasOwnProperty.call(raw, k) && isObj(raw[k]) && typeof raw[k].x === 'number') out[k] = { x: raw[k].x, y: raw[k].y };
    return out;
  }
  function getLayout() {
    var Lr = root.WALK_ROOM_LAYOUT || (isObj(root.WALK_SHOP) ? (root.WALK_SHOP.room || root.WALK_SHOP.layout) : null), sp, i, ok = true, wr = 0, walk = null;
    if (!isObj(Lr)) return DEFAULT_LAYOUT;
    sp = normSpots(Lr.spots);
    for (i = 0; i < SPOT_IDS.length; i++) if (!sp[SPOT_IDS[i]]) ok = false;
    if (!ok) return DEFAULT_LAYOUT;
    if (isArr(Lr.walk) && Lr.walk.length) {
      walk = Lr.walk;
      while (wr < walk.length && /^#+$/.test(walk[wr])) wr++;
    }
    return { cols: Lr.cols || DEFAULT_LAYOUT.cols, rows: Lr.rows || DEFAULT_LAYOUT.rows, wallRows: walk ? wr : (Lr.wallRows || DEFAULT_LAYOUT.wallRows), walkRows: walk,
      spots: sp, areas: isObj(Lr.areas) && Lr.areas.nest ? Lr.areas : DEFAULT_LAYOUT.areas, blocking: isArr(Lr.blocking) ? Lr.blocking : DEFAULT_LAYOUT.blocking };
  }

  function cellKey(x, y) { return x + ',' + y; }
  function isPetSpotItem(def) { return itemKind(def) === 'pet'; }

  /* 建立格子表：牆列、固定大型家具、擺在地面擺放點的家具（小精靈用品不擋路）都不可走 */
  function buildGrid(layout, spots, defOf) {
    var w = layout.cols, h = layout.rows, walk = [], x, y, i, a, id, pos, def, attractors = [], nest = layout.areas.nest, nestItem = false;
    for (y = 0; y < h; y++) { walk.push([]); for (x = 0; x < w; x++) walk[y].push(layout.walkRows ? !!layout.walkRows[y] && layout.walkRows[y].charAt(x) !== '#' && layout.walkRows[y].charAt(x) !== '' : y >= layout.wallRows); }
    for (i = 0; i < layout.blocking.length; i++) {
      a = layout.areas[layout.blocking[i]];
      if (!a) continue;
      for (y = a.y; y < a.y + a.h; y++) for (x = a.x; x < a.x + a.w; x++) if (walk[y] && walk[y][x] !== undefined) walk[y][x] = false;
    }
    keysOf(spots).forEach(function (sid) {
      pos = layout.spots[sid];
      if (!pos || spotType(sid) !== 'floor' || !walk[pos.y] || walk[pos.y][pos.x] === undefined) return;
      def = defOf ? defOf(spots[sid]) : null;
      if (def && isPetSpotItem(def)) {
        if (/nest|窩/i.test(String(def.id) + String(def.name || ''))) nestItem = true;
        else attractors.push({ x: pos.x, y: pos.y, kind: String(def.id), cls: /bowl|碗|食|food|feed/i.test(String(def.id) + String(def.name || '')) ? 'bowl' : 'toy' });
      } else {
        walk[pos.y][pos.x] = false;
      }
    });
    if (nest && walk[nest.y] && walk[nest.y][nest.x] !== undefined) walk[nest.y][nest.x] = true;
    var cells = [], nearest = function (tx, ty) {
      var bx = null, bd = 1e9, cx, cy, d;
      for (cy = 0; cy < h; cy++) for (cx = 0; cx < w; cx++) if (walk[cy][cx] === true) { d = Math.abs(cx - tx) + Math.abs(cy - ty); if (d < bd) { bd = d; bx = { x: cx, y: cy }; } }
      return bx;
    }, windowCells = [], furnCells = [], seenW = {}, seenF = {}, sk, wp, fc, dd, nx2, ny2;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (walk[y][x] === true) cells.push({ x: x, y: y });
    keysOf(layout.spots).forEach(function (sid) {                       /* 窗邊：每個窗景擺放點下方最近的可走格 */
      if (spotType(sid) !== 'window') return;
      wp = nearest(layout.spots[sid].x, layout.spots[sid].y);
      if (wp && !seenW[cellKey(wp.x, wp.y)]) { seenW[cellKey(wp.x, wp.y)] = 1; windowCells.push(wp); }
    });
    for (y = layout.wallRows; y < h; y++) for (x = 0; x < w; x++) if (walk[y][x] === false) {   /* 家具旁：不可走的地面格旁邊的可走格 */
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dv) {
        nx2 = x + dv[0]; ny2 = y + dv[1]; sk = cellKey(nx2, ny2);
        if (ny2 >= 0 && ny2 < h && nx2 >= 0 && nx2 < w && walk[ny2][nx2] === true && !seenF[sk]) { seenF[sk] = 1; furnCells.push({ x: nx2, y: ny2 }); }
      });
    }
    fc = nearest(Math.floor(w / 2), h - 1); dd = fc;
    return {
      w: w, h: h, walk: walk, attractors: attractors, nest: nest ? { x: nest.x, y: nest.y } : { x: 0, y: h - 1 },
      cells: cells, nestItem: nestItem, windowCells: windowCells, furnCells: furnCells, player: dd || { x: Math.floor(w / 2), y: h - 1 },
      isWalk: function (cx, cy) { return cy >= 0 && cy < h && cx >= 0 && cx < w && walk[cy][cx] === true; },
      neighbors: function (cx, cy) {
        var d = [[1, 0], [-1, 0], [0, 1], [0, -1]], out = [], k, nx, ny;
        for (k = 0; k < d.length; k++) { nx = cx + d[k][0]; ny = cy + d[k][1]; if (this.isWalk(nx, ny)) out.push({ x: nx, y: ny }); }
        return out;
      }
    };
  }

  /* 廣度優先：回傳 from 走向 to 的第一步（從 occupied 的格子繞開）；到不了回傳 null */
  function bfsNext(grid, from, to, occupied) {
    var q = [{ x: from.x, y: from.y }], prev = {}, head = 0, cur, ns, i, k;
    prev[cellKey(from.x, from.y)] = null;
    if (from.x === to.x && from.y === to.y) return null;
    while (head < q.length) {
      cur = q[head++];
      ns = grid.neighbors(cur.x, cur.y);
      for (i = 0; i < ns.length; i++) {
        k = cellKey(ns[i].x, ns[i].y);
        if (prev[k] !== undefined) continue;
        if (occupied && occupied[k]) continue;
        prev[k] = cellKey(cur.x, cur.y);
        if (ns[i].x === to.x && ns[i].y === to.y) {
          var step = k, p = prev[step];
          while (p !== null && p !== cellKey(from.x, from.y)) { step = p; p = prev[step]; }
          var parts = step.split(',');
          return { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
        }
        q.push(ns[i]);
      }
    }
    return null;
  }
  function bfsDist(grid, from, occupied) {
    var q = [{ x: from.x, y: from.y }], dist = {}, head = 0, cur, ns, i, k;
    dist[cellKey(from.x, from.y)] = 0;
    while (head < q.length) {
      cur = q[head++];
      ns = grid.neighbors(cur.x, cur.y);
      for (i = 0; i < ns.length; i++) {
        k = cellKey(ns[i].x, ns[i].y);
        if (dist[k] !== undefined || (occupied && occupied[k])) continue;
        dist[k] = dist[cellKey(cur.x, cur.y)] + 1;
        q.push(ns[i]);
      }
    }
    return dist;
  }

  /* ------------------------------------------------------------------ 小精靈漫步（純邏輯，可單獨測） */
  function newWalker(id, stage, x, y) {
    return { id: id, stage: stage, x: x, y: y, fromX: x, fromY: y, moveT0: -99999, mode: 'idle', nextAt: null, jumpAt: -99999,
      reactUntil: 0, dir: 1, vigor: HIGH_VIGOR };
  }
  function moveWalker(sp, to, t) {
    sp.fromX = sp.x; sp.fromY = sp.y; sp.moveT0 = t;
    if (to.x !== sp.x) sp.dir = to.x > sp.x ? 1 : -1;
    sp.x = to.x; sp.y = to.y;
  }
  /* 回傳這一步做了什麼：wait／move／jump／nap／wake／play／react */
  function stepLegacy(sp, env, t, rng) {
    var delay, nest = env.grid.nest, nx, dist, best, bestD, i, a, d, ns, opts, k;
    if (sp.nextAt === null) sp.nextAt = t + 1000 + Math.floor(rng() * 2001);
    if (sp.mode === 'react') {
      if (t < sp.reactUntil) return 'react';
      sp.mode = 'idle'; sp.nextAt = t + 1000 + Math.floor(rng() * 2001);
    }
    if (t < sp.nextAt) return 'wait';
    delay = 1000 + Math.floor(rng() * 2001);                /* 1～3 秒 */
    if (sp.vigor < LOW_VIGOR) {                              /* 累了：回窩打盹 */
      if (sp.mode === 'nap' || (sp.x === nest.x && sp.y === nest.y)) { sp.mode = 'nap'; sp.nextAt = t + delay; return 'nap'; }
      nx = bfsNext(env.grid, sp, nest, env.occupied);
      if (nx) { moveWalker(sp, nx, t); sp.mode = 'idle'; sp.nextAt = t + delay; return 'move'; }
      sp.mode = 'nap'; sp.nextAt = t + delay; return 'nap';  /* 回不了窩就原地睡 */
    }
    if (sp.mode === 'nap') { sp.mode = 'idle'; sp.nextAt = t + delay; return 'wake'; }
    if (sp.vigor >= HIGH_VIGOR && rng() < 0.15) { sp.jumpAt = t; sp.nextAt = t + delay; return 'jump'; }
    if (env.grid.attractors.length && rng() < 0.5) {         /* 有玩具或食碗：走過去 */
      dist = bfsDist(env.grid, sp, env.occupied);
      best = null; bestD = 1e9;
      for (i = 0; i < env.grid.attractors.length; i++) {
        a = env.grid.attractors[i]; d = dist[cellKey(a.x, a.y)];
        if (d !== undefined && d < bestD) { bestD = d; best = a; }
      }
      if (best) {
        if (bestD === 0) { sp.mode = 'play'; sp.nextAt = t + 2500; return 'play'; }
        nx = bfsNext(env.grid, sp, best, env.occupied);
        if (nx) { moveWalker(sp, nx, t); sp.mode = 'idle'; sp.nextAt = t + delay; return 'move'; }
      }
    }
    sp.mode = 'idle';
    ns = env.grid.neighbors(sp.x, sp.y);
    opts = [];
    for (i = 0; i < ns.length; i++) { k = cellKey(ns[i].x, ns[i].y); if (!(env.occupied && env.occupied[k])) opts.push(ns[i]); }
    sp.nextAt = t + delay;
    if (!opts.length) return 'wait';
    moveWalker(sp, opts[Math.floor(rng() * opts.length)], t);
    return 'move';
  }

  /* ------------------------------------------------------------------ 行為狀態機（規格第 9.3 節） */
  /* 資料來源 WALK_BEHAVIOR 缺少或格式不符時，用下面的內建備用；有資料就以資料為準（時間長短、權重、台詞）。 */
  var STATE_NAMES = ['wander', 'nap', 'play', 'eat', 'explore', 'cuddle', 'hide', 'sing', 'show', 'together', 'missyou'];
  var STATE_ALIAS = {
    wander: ['wander', 'idle', 'roam', '遊蕩'], nap: ['nap', 'sleep', '打盹'], play: ['play', '玩耍'], eat: ['eat', '進食'], explore: ['explore', '探索'],
    cuddle: ['cuddle', '撒嬌'], hide: ['hide', '害羞躲藏', '躲藏'], sing: ['sing', '唱歌'], show: ['show', '炫耀'], together: ['together', '一起玩'],
    missyou: ['missyou', 'miss', '想你了'], gift: ['gift', '禮物'], tapcold: ['tapcold', 'cold', '冷淡'], tapshy: ['tapshy', '害羞回應'], tapannoyed: ['tapannoyed', 'annoyed', '厭煩']
  };
  var DEF_DUR = {                                       /* 毫秒；資料檔 durations 是 8 FPS 的步數（24～80 步＝3～10 秒） */
    wander: [3000, 10000], nap: [10000, 25000], play: [5000, 12500], eat: [5000, 10000], explore: [5000, 12500], cuddle: [2500, 4500],
    hide: [6000, 15000], sing: [6000, 12000], show: [3000, 6000], together: [6000, 15000], missyou: [6000, 10000]
  };
  /* 只有遊蕩結束時才會挑下一件事；其他狀態結束都回到遊蕩（和資料檔 transitions.wander 同一個設計） */
  var DEF_WEIGHT = { nap: 2, play: 2, eat: 1, explore: 2, sing: 0.5, together: 0.5 };
  var DEF_MODS = {
    vigorLow: { below: 40, mul: { nap: 3, play: 0.3, explore: 0.5 } },
    vigorHigh: { atLeast: 80, mul: { play: 2, explore: 1.5 } },
    night: { from: 20, to: 6, mul: { nap: 2, sing: 2, explore: 0.5, play: 0.7 } },
    day: { from: 6, to: 20, mul: { explore: 1.5, nap: 0.8 } },
    furniture: { toy: { play: 2 }, bowl: { eat: 2 }, window: { explore: 2 }, nest: { nap: 2 } },
    trait: {
      active: { play: 2, explore: 1.2, nap: 0.6 }, lazy: { nap: 3, play: 0.5, explore: 0.6 }, curious: { explore: 3, play: 1.2 },
      shy: { hide: 2, explore: 0.7, together: 0.6 }, foodie: { eat: 3, nap: 1.2 }, tsundere: { cuddle: 0.5, nap: 1.2, sing: 0.5 }
    },
    singers: ['active', 'curious', 'foodie']
  };
  var ARCH_TRAIT = { lively: 'active', lazy: 'lazy', curious: 'curious', shy: 'shy', foodie: 'foodie', tsun: 'tsundere' };
  var ARCH_RE = [
    ['lively', /lively|active|energetic|活潑|🔥/i], ['lazy', /lazy|sleepy|慵懶|😴/i], ['curious', /curious|好奇|🔍/i],
    ['shy', /shy|害羞|🙈/i], ['foodie', /foodie|greedy|glutton|貪吃|🍙/i], ['tsun', /tsun|proud|傲嬌|😤/i]
  ];
  var ARCH_DECOR = { lively: ['', '！'], lazy: ['', '……'], curious: ['咦，', ''], shy: ['（小聲）', ''], foodie: ['', '～有吃的嗎'], tsun: ['哼，', ''], plain: ['', ''] };
  var SAY_PROB = { wander: 0.12, nap: 0.5, play: 0.6, eat: 0.6, explore: 0.6, cuddle: 1, hide: 0.8, sing: 0.9, show: 1, together: 0.7, missyou: 1 };
  var STATE_TEXT = {
    wander: '在房間裡晃晃', nap: '正在打盹', play: '正在玩', eat: '正在吃東西', explore: '在到處看看', cuddle: '想讓你摸摸',
    hide: '躲起來了', sing: '在哼歌', show: '想給你看新東西', together: '正和夥伴一起玩', missyou: '想找你玩'
  };
  var DEF_LINES = {
    wander: ['今天的房間真舒服', '到處走走'], nap: ['好想睡一下', '呼……'], play: ['一起玩吧', '好好玩'], eat: ['開動了', '好吃'],
    explore: ['那是什麼', '外面好熱鬧'], cuddle: ['摸摸我', '好舒服'], hide: ['先躲一下', '別看我'], sing: ['啦啦啦', '哼哼哼'],
    show: ['你看你看', '我有新東西'], together: ['來追我', '靠在一起'], missyou: ['你回來了', '好久不見'], gift: ['給你的小禮物', '今天帶了這個'],
    tapcold: ['哼，才沒有要你摸', '別、別亂碰'], tapshy: ['（縮了一下）', '……'], tapannoyed: ['夠了啦', '我想自己靜靜']
  };
  var NEAR_PARTNER = 3;
  var PARTNER_OK = ['idle', 'wander', 'nap', 'play', 'explore', 'sing', 'eat'];
  var STEP_MS = 600;                                    /* 朝目的地走：比一步位移動畫（500 毫秒）略長 */

  function msOf(v) { return v < 200 ? v * 1000 : v; }
  function firstOf(src, aliases) { var i; if (!isObj(src)) return undefined; for (i = 0; i < aliases.length; i++) if (src[aliases[i]] !== undefined) return src[aliases[i]]; return undefined; }
  function validRange(d) { return isArr(d) && d.length >= 2 && num(d[0], -1) > 0 && num(d[1], -1) >= num(d[0]); }
  /* 讀 WALK_BEHAVIOR：durations（8 FPS 步數）、transitions.wander（權重）、modifiers、events、labels；也接受 states.{名稱}.dur（毫秒）。缺的欄位用內建備用 */
  function behCfg() {
    var B = root.WALK_BEHAVIOR, cfg = { dur: {}, weights: {}, mods: DEF_MODS, hideTraits: ['shy'], labels: null, fromData: false }, src, wsrc, stepMs, tr;
    STATE_NAMES.forEach(function (n) { cfg.dur[n] = DEF_DUR[n]; });
    for (tr in DEF_WEIGHT) if (Object.prototype.hasOwnProperty.call(DEF_WEIGHT, tr)) cfg.weights[tr] = DEF_WEIGHT[tr];
    if (!isObj(B)) return cfg;
    stepMs = 1000 / (num(B.fps, 8) || 8);
    src = isObj(B.states) ? B.states : {};
    STATE_NAMES.forEach(function (n) {
      var e = firstOf(src, STATE_ALIAS[n]), d = null, st = firstOf(B.durations, STATE_ALIAS[n]);
      if (isArr(e)) d = e;
      else if (isObj(e)) { d = e.dur || e.duration || e.range || (e.min !== undefined ? [e.min, e.max] : null); if (typeof e.weight === 'number') cfg.weights[n] = e.weight; }
      if (validRange(d)) { cfg.dur[n] = [msOf(d[0]), msOf(d[1])]; cfg.fromData = true; }
      else if (validRange(st)) { cfg.dur[n] = [Math.round(st[0] * stepMs), Math.round(st[1] * stepMs)]; cfg.fromData = true; }
    });
    wsrc = isObj(B.transitions) ? B.transitions.wander : (isObj(B.weights) ? B.weights : null);
    if (isObj(wsrc)) { cfg.weights = {}; STATE_NAMES.forEach(function (n) { var w = firstOf(wsrc, STATE_ALIAS[n]); if (typeof w === 'number' && w >= 0) cfg.weights[n] = w; }); cfg.fromData = true; }
    if (isObj(B.modifiers)) cfg.mods = B.modifiers;
    if (isObj(B.events) && isArr(B.events.visitorHideTraits)) cfg.hideTraits = B.events.visitorHideTraits;
    if (isObj(B.labels)) cfg.labels = B.labels;
    return cfg;
  }
  function inHours(h, from, to) { return from <= to ? (h >= from && h < to) : (h >= from || h < to); }

  /* 性格：id／名稱／圖示任一個對得上就歸類（資料檔的 id 怎麼取都能認） */
  function persKeys(p) {
    var out = [];
    if (typeof p === 'string') out.push(p);
    else if (isObj(p)) ['id', 'key', 'name', 'icon'].forEach(function (k) { if (typeof p[k] === 'string' && p[k]) out.push(p[k]); });
    return out;
  }
  function archOf(p) {
    var s = persKeys(p).join(' '), i;
    for (i = 0; i < ARCH_RE.length; i++) if (ARCH_RE[i][1].test(s)) return ARCH_RE[i][0];
    return 'plain';
  }
  function linesFromData(p, state) {
    var B = root.WALK_BEHAVIOR, L = isObj(B) ? (B.lines || B.quotes || B.speech) : null, keys = persKeys(p), als = STATE_ALIAS[state] || [state], i, j, v, a = archOf(p);
    if (!isObj(L)) return null;
    if (a !== 'plain') keys.push(a);
    for (i = 0; i < keys.length; i++) for (j = 0; j < als.length; j++) {
      v = isObj(L[keys[i]]) ? L[keys[i]][als[j]] : undefined;
      if (isArr(v) && v.length) return v;
      v = isObj(L[als[j]]) ? L[als[j]][keys[i]] : undefined;
      if (isArr(v) && v.length) return v;
    }
    return null;
  }
  /* 依性格與狀態取一句台詞（資料優先，沒有就用內建備用加上性格語氣） */
  function pickLine(p, state, rng) {
    var a = linesFromData(p, state), base, t, d;
    if (a) return String(a[Math.floor(rng() * a.length)]);
    base = DEF_LINES[state] || ['……'];
    t = String(base[Math.floor(rng() * base.length)]);
    if (/^tap/.test(state)) return t;
    d = ARCH_DECOR[archOf(p)] || ARCH_DECOR.plain;
    return d[0] + t.replace(/[。！…]+$/, '') + d[1];
  }

  function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function nearestAttr(env, sp, cls) {
    var dist = bfsDist(env.grid, sp, env.occupied), best = null, bd = 1e9, i, a, d;
    for (i = 0; i < env.grid.attractors.length; i++) {
      a = env.grid.attractors[i];
      if ((a.cls || 'toy') !== cls) continue;
      d = dist[cellKey(a.x, a.y)];
      if (d !== undefined && d < bd) { bd = d; best = a; }
    }
    return best;
  }
  function hasAttr(grid, cls) { var i; for (i = 0; i < grid.attractors.length; i++) if ((grid.attractors[i].cls || 'toy') === cls) return true; return false; }
  function shyToVisitor(sp, B) {
    var list = B.cfg && isArr(B.cfg.hideTraits) ? B.cfg.hideTraits : ['shy'], keys = persKeys(sp.pers), i;
    for (i = 0; i < keys.length; i++) if (list.indexOf(keys[i]) >= 0) return true;
    return list.indexOf(ARCH_TRAIT[sp.arch]) >= 0;
  }
  function partnerFor(sp, env) {
    var others = env.beh.others || [], best = null, bd = 99, i, o, d;
    for (i = 0; i < others.length; i++) {
      o = others[i];
      if (o.id === sp.id || PARTNER_OK.indexOf(o.mode) < 0) continue;
      if (env.beh.visitor && shyToVisitor(o, env.beh)) continue;
      d = manhattan(o, sp);
      if (d <= NEAR_PARTNER && d < bd) { bd = d; best = o; }
    }
    return best;
  }

  /* 這隻小精靈在 modifiers.trait 裡對應的鍵（資料檔的性格 id；認不得就用歸類後的名稱） */
  function traitKeyOf(sp, mods) {
    var keys = persKeys(sp.pers), i, tr = isObj(mods) && isObj(mods.trait) ? mods.trait : {};
    for (i = 0; i < keys.length; i++) if (tr[keys[i]] !== undefined) return keys[i];
    return ARCH_TRAIT[sp.arch] || (keys[0] || '');
  }
  function scaleW(w, k, f) { if (typeof w[k] === 'number') w[k] *= f; }
  function mulInto(w, m) { var k; if (!isObj(m)) return; for (k in m) if (Object.prototype.hasOwnProperty.call(m, k) && typeof m[k] === 'number') w[k] = (w[k] === undefined ? 0 : w[k]) * m[k]; }
  /* 遊蕩結束時各狀態被挑中的權重＝transitions.wander 的底 × modifiers（活力、時段、家具、性格）× 近期事件；回傳 {狀態: 權重} */
  function stateWeights(sp, env, t) {
    var B = env.beh, cfg = B.cfg, M = cfg.mods || DEF_MODS, w = {}, v = num(sp.vigor, HIGH_VIGOR), g = env.grid, ev = B.events || {}, tk = traitKeyOf(sp, M), singers = M.singers;
    STATE_NAMES.forEach(function (k) { if (k !== 'wander' && typeof cfg.weights[k] === 'number') w[k] = cfg.weights[k]; });
    if (!hasAttr(g, 'bowl')) w.eat = 0;
    if (!(g.windowCells && g.windowCells.length) && !(g.furnCells && g.furnCells.length)) w.explore = 0;
    if (isObj(M.vigorLow) && v < num(M.vigorLow.below, 40)) mulInto(w, M.vigorLow.mul);
    if (isObj(M.vigorHigh) && v >= num(M.vigorHigh.atLeast, 80)) mulInto(w, M.vigorHigh.mul);
    if (B.night) mulInto(w, isObj(M.night) ? M.night.mul : null); else mulInto(w, isObj(M.day) ? M.day.mul : null);
    if (isObj(M.furniture)) {
      if (hasAttr(g, 'toy')) mulInto(w, M.furniture.toy);
      if (hasAttr(g, 'bowl')) mulInto(w, M.furniture.bowl);
      if (g.windowCells && g.windowCells.length) mulInto(w, M.furniture.window);
      if (g.nestItem) mulInto(w, M.furniture.nest);
    }
    if (isObj(M.trait)) mulInto(w, M.trait[tk]);
    if (isArr(singers) && singers.indexOf(tk) < 0) w.sing = 0;
    if (w.sing > 0 && !B.night) w.sing = 0;                                   /* 唱歌只在夜晚 */
    if (typeof sp.careAt === 'number' && t - sp.careAt < 60000) { scaleW(w, 'eat', 0.4); scaleW(w, 'nap', 1.4); scaleW(w, 'play', 1.2); }
    if (typeof ev.newItemAt === 'number' && ev.newItemAt > 0 && t - ev.newItemAt < 30000) scaleW(w, 'explore', 3);
    if (B.visitor) scaleW(w, 'sing', 0.3);
    if (!partnerFor(sp, env)) w.together = 0;
    return w;
  }
  /* 挑下一件事：只有遊蕩結束時才挑（依權重）；其他狀態結束都回到遊蕩 */
  function pickState(sp, env, t, rng) {
    var w, tot = 0, k, r, acc = 0;
    if (sp.mode !== 'wander' && STATE_NAMES.indexOf(sp.mode) >= 0) return 'wander';
    w = stateWeights(sp, env, t);
    for (k in w) if (Object.prototype.hasOwnProperty.call(w, k)) tot += w[k];
    if (tot <= 0) return 'wander';
    r = rng() * tot;
    for (k in w) if (Object.prototype.hasOwnProperty.call(w, k)) { acc += w[k]; if (r < acc) return k; }
    return 'wander';
  }

  function sayLine(sp, key, env, t, rng, ms) {
    sp.say = { text: pickLine(sp.pers, key, rng), until: t + (ms || 3200) };
    if (env.onSay) env.onSay(sp);
  }
  function startTogether(sp, env, t, rng) {
    var p = partnerFor(sp, env), d = env.beh.cfg.dur.together, len, style;
    if (!p) return false;
    len = d[0] + Math.floor(rng() * (d[1] - d[0] + 1));
    style = num(sp.vigor, 80) >= 50 && num(p.vigor, 80) >= 50 ? 'chase' : 'side';
    [sp, p].forEach(function (x, i) {
      x.mode = 'together'; x.stateT0 = t; x.stateUntil = t + len; x.nextAt = t + 200; x.target = null;
      x.partner = i === 0 ? p.id : sp.id; x.style = style; x.role = i === 0 ? 'chaser' : 'chased';
    });
    if (rng() < SAY_PROB.together) sayLine(sp, 'together', env, t, rng);
    return true;
  }
  function enterState(sp, name, env, t, rng) {
    var cfg = env.beh.cfg, d, len, g = env.grid, a, cands, nestKey;
    if (name === 'together' && startTogether(sp, env, t, rng)) return 'together';
    if (name === 'together') name = 'wander';
    d = cfg.dur[name] || DEF_DUR[name];
    len = d[0] + Math.floor(rng() * (d[1] - d[0] + 1));
    sp.prevMode = sp.mode; sp.mode = name; sp.stateT0 = t; sp.stateUntil = t + len; sp.nextAt = t + 200; sp.target = null; sp.arrived = false; sp.dot = null; sp.cold = false; sp.partner = null;
    if (name === 'nap') { sp.napHome = num(sp.vigor, HIGH_VIGOR) < LOW_VIGOR || rng() < 0.5; if (sp.napHome) sp.target = g.nest; }
    else if (name === 'play') { a = nearestAttr(env, sp, 'toy'); if (a) sp.target = { x: a.x, y: a.y }; }
    else if (name === 'eat') { a = nearestAttr(env, sp, 'bowl'); if (a) sp.target = { x: a.x, y: a.y }; else sp.stateUntil = t; }
    else if (name === 'explore') {
      cands = (g.windowCells || []).concat(g.furnCells || []);
      if (env.beh.events && env.beh.events.newItemAt && t - env.beh.events.newItemAt < 30000 && (g.furnCells || []).length) cands = g.furnCells;
      if (cands.length) sp.target = cands[Math.floor(rng() * cands.length)];
    }
    else if (name === 'hide') {
      sp.target = g.nest; nestKey = cellKey(g.nest.x, g.nest.y);
      if (env.occupied && env.occupied[nestKey] && (g.furnCells || []).length) sp.target = g.furnCells[Math.floor(rng() * g.furnCells.length)];
    }
    else if (name === 'show') { if (env.beh.newThing) sp.shownKey = env.beh.newThing.key; }
    else if (name === 'missyou') { sp.target = g.player; sp.missDone = true; }
    if (rng() < (SAY_PROB[name] === undefined ? 0 : SAY_PROB[name])) sayLine(sp, name, env, t, rng);
    return name;
  }

  /* 不管現在在做什麼都要立刻轉去的事（訪客、離開一天再回來、有新東西、累了） */
  function forcedState(sp, env, t) {
    var B = env.beh;
    if (sp.mode === 'cuddle' && t < sp.stateUntil) return null;
    if (B.visitor && shyToVisitor(sp, B)) return sp.mode === 'hide' ? null : 'hide';
    if ((B.away || sp.missWanted) && !sp.missDone && sp.mode !== 'hide') return 'missyou';
    if (B.newThing && sp.shownKey !== B.newThing.key && num(sp.vigor, HIGH_VIGOR) >= LOW_VIGOR && ['nap', 'hide', 'missyou', 'together', 'cuddle', 'show'].indexOf(sp.mode) < 0) return 'show';
    if (num(sp.vigor, HIGH_VIGOR) < LOW_VIGOR && ['nap', 'hide', 'missyou', 'cuddle'].indexOf(sp.mode) < 0) return 'nap';
    return null;
  }
  function stepToward(sp, env, dest, t, ms) {
    var nx;
    if (!dest || (sp.x === dest.x && sp.y === dest.y)) return false;
    nx = bfsNext(env.grid, sp, dest, env.occupied);
    if (!nx) return false;
    moveWalker(sp, nx, t); sp.nextAt = t + ms;
    return true;
  }
  function wanderAct(sp, env, t, rng) {
    var ns = env.grid.neighbors(sp.x, sp.y), opts = [], i, k;
    sp.nextAt = t + 1000 + Math.floor(rng() * 2001);
    if (num(sp.vigor, HIGH_VIGOR) >= HIGH_VIGOR && rng() < 0.12) { sp.jumpAt = t; return 'jump'; }
    for (i = 0; i < ns.length; i++) { k = cellKey(ns[i].x, ns[i].y); if (!(env.occupied && env.occupied[k])) opts.push(ns[i]); }
    if (!opts.length) return 'wait';
    moveWalker(sp, opts[Math.floor(rng() * opts.length)], t);
    return 'move';
  }
  function runTogether(sp, env, t, rng) {
    var p = null, i, d, ns, best = null, bd = -1, occ = {}, k, others = env.beh.others || [], sub;
    for (i = 0; i < others.length; i++) if (others[i].id === sp.partner) p = others[i];
    if (!p || p.mode !== 'together' || p.partner !== sp.id) { sp.stateUntil = t; sp.partner = null; sp.nextAt = t; return 'wait'; }
    d = manhattan(sp, p);
    for (k in env.occupied) if (Object.prototype.hasOwnProperty.call(env.occupied, k)) occ[k] = env.occupied[k];
    delete occ[cellKey(p.x, p.y)];
    sub = { grid: env.grid, occupied: occ };
    if (sp.style === 'side') {
      if (d > 1 && sp.id < p.id && stepToward(sp, sub, p, t, STEP_MS)) return 'move';
      sp.nextAt = t + 1000 + Math.floor(rng() * 1500);
      return d <= 1 ? 'nap' : 'wait';
    }
    if (sp.role === 'chaser') {
      if (d <= 1) { sp.role = 'chased'; p.role = 'chaser'; sp.nextAt = t + 700; return 'play'; }
      if (stepToward(sp, sub, p, t, 550)) return 'move';
      sp.nextAt = t + 500; return 'wait';
    }
    ns = env.grid.neighbors(sp.x, sp.y);
    for (i = 0; i < ns.length; i++) {
      if (env.occupied && env.occupied[cellKey(ns[i].x, ns[i].y)]) continue;
      if (manhattan(ns[i], p) > bd) { bd = manhattan(ns[i], p); best = ns[i]; }
    }
    sp.nextAt = t + 600;
    if (best && d < 4 && bd > d) { moveWalker(sp, best, t); return 'move'; }
    return 'wait';
  }
  function actState(sp, env, t, rng) {
    var m = sp.mode, g = env.grid, cells;
    if (m === 'wander') return wanderAct(sp, env, t, rng);
    if (m === 'together') return runTogether(sp, env, t, rng);
    if (m === 'nap') {
      if (sp.napHome && sp.target && stepToward(sp, env, sp.target, t, STEP_MS)) return 'move';
      sp.nextAt = t + 1000 + Math.floor(rng() * 2001); return 'nap';
    }
    if (m === 'play') {
      if (sp.target) { if (stepToward(sp, env, sp.target, t, STEP_MS)) return 'move'; sp.nextAt = t + 500; return 'play'; }
      cells = g.cells || [];                                                  /* 沒玩具：追一個會換位置的光點 */
      if (!sp.dot || t >= (sp.dotAt || 0) || (sp.x === sp.dot.x && sp.y === sp.dot.y)) {
        if (cells.length) sp.dot = cells[Math.floor(rng() * cells.length)];
        sp.dotAt = t + 2500;
      }
      if (sp.dot && stepToward(sp, env, sp.dot, t, 520)) return 'move';
      sp.nextAt = t + 500; return 'play';
    }
    if (m === 'eat' || m === 'explore' || m === 'hide' || m === 'cuddle' || m === 'missyou') {
      if (sp.target && stepToward(sp, env, sp.target, t, m === 'missyou' ? 450 : STEP_MS)) return 'move';
      if (m === 'missyou' && !sp.arrived) { sp.arrived = true; sayLine(sp, 'missyou', env, t, rng, 3800); }
      sp.arrived = true;
      sp.nextAt = t + 500 + Math.floor(rng() * 400);
      return m;
    }
    if (m === 'show') { sp.dir = -sp.dir; sp.nextAt = t + 300; return 'show'; }
    sp.nextAt = t + 800;                                                      /* sing 等原地動作 */
    return m;
  }
  /* 新版：一次呼叫做一件事。env 要有 grid、occupied、beh（{cfg,night,visitor,away,newThing,others,events}）；回傳 wait／move／jump／enter:狀態／狀態名 */
  function stepBehavior(sp, env, t, rng) {
    var f, nxt;
    if (sp.nextAt === null || sp.nextAt === undefined) sp.nextAt = t + 400 + Math.floor(rng() * 1200);
    f = forcedState(sp, env, t);
    if (f) { enterState(sp, f, env, t, rng); return 'enter:' + f; }
    if (STATE_NAMES.indexOf(sp.mode) < 0) {
      if (t < sp.nextAt) return 'wait';
      enterState(sp, 'wander', env, t, rng); return 'enter:wander';
    }
    if (typeof sp.stateUntil !== 'number') { sp.stateT0 = t; sp.stateUntil = t + (env.beh.cfg.dur[sp.mode] || DEF_DUR.wander)[0]; }
    if (t >= sp.stateUntil) {
      if (sp.mode === 'hide' && env.beh.visitor && shyToVisitor(sp, env.beh)) sp.stateUntil = t + 3000;
      else if (sp.mode === 'nap' && num(sp.vigor, HIGH_VIGOR) < LOW_VIGOR) sp.stateUntil = t + 3000;
      else if (sp.mode === 'missyou' && !sp.arrived && t < sp.stateT0 + 20000) sp.stateUntil = t + 2000;
      else { nxt = enterState(sp, pickState(sp, env, t, rng), env, t, rng); return 'enter:' + nxt; }
    }
    if (t < sp.nextAt) return 'wait';
    return actState(sp, env, t, rng);
  }
  function stateTextOf(sp) {
    var B = root.WALK_BEHAVIOR, lb = isObj(B) && isObj(B.labels) ? B.labels : null;
    if (sp.mode === 'together' && sp.style === 'side') return '正和夥伴靠在一起打盹';
    return (lb && typeof lb[sp.mode] === 'string' && lb[sp.mode]) || STATE_TEXT[sp.mode] || '在房間裡';
  }

  /* 對外：小精靈目前在做什麼（小精靈頁的「行為狀態」文字用）；只有房間畫面開著時才有值 */
  var STATE_REG = {};
  var GIFT_REG = null;

  /* 新版與舊版共用的入口：env 帶 beh 走新版狀態機，沒有就走舊的隨機漫步 */
  function stepWalker(sp, env, t, rng) {
    return env && env.beh ? stepBehavior(sp, env, t, rng) : stepLegacy(sp, env, t, rng);
  }

  /* ------------------------------------------------------------------ 窗外：日夜與天氣 */
  function skyPhase(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  }
  function autoWeather(day) { var h = hashStr('w' + day) % 10; return h < 6 ? 'clear' : (h < 8 ? 'cloud' : 'rain'); }
  function resolveWindow(setting, ms) {
    var d = new Date(ms), phase = skyPhase(d.getHours()), s = String(setting || 'auto');
    if (s === 'day' || s === 'dusk' || s === 'night') return { phase: s, weather: 'clear' };
    if (s === 'cloud' || s === 'rain') return { phase: phase, weather: s };
    return { phase: phase, weather: autoWeather(dateStr(ms)) };
  }
  function windowText(setting, ms) {
    var w = resolveWindow(setting, ms);
    var p = { day: '白天', dawn: '清晨', dusk: '黃昏', night: '夜晚' }[w.phase];
    var wt = { clear: '晴', cloud: '多雲', rain: '下雨' }[w.weather];
    return p + '・' + wt;
  }

  /* ------------------------------------------------------------------ DOM 小工具 */
  function el(tag, attrs, kids) {
    var e = root.document.createElement(tag), k, i;
    attrs = attrs || {};
    for (k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      if (k === 'cls') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'disabled') { e.disabled = !!attrs[k]; }
      else e.setAttribute(k, attrs[k]);
    }
    if (kids) for (i = 0; i < kids.length; i++) if (kids[i]) e.appendChild(kids[i]);
    return e;
  }
  function clear(node) { node.textContent = ''; }
  function btn(label, cls, fn) {
    var b = el('button', { cls: 'wr-btn' + (cls ? ' ' + cls : ''), type: 'button', text: label });
    if (fn) b.addEventListener('click', fn);
    return b;
  }

  var CSS = '.wr{--wr-bg:var(--card,#fffaf2);--wr-fg:var(--fg,#3b3350);--wr-mute:var(--mute,#8a7d98);--wr-line:var(--line,#f0d9c0);--wr-acc:var(--acc,#ff7a8a);--wr-chip:var(--chip,#ffe6d0);color:var(--wr-fg);font-size:14px;line-height:1.5}' +
    '.wr.wr-dk{--wr-bg:var(--card,#161d23);--wr-fg:var(--fg,#e8e4da);--wr-mute:var(--mute,#9aa6b0);--wr-line:var(--line,#2c3943);--wr-chip:var(--chip,#26323b)}' +
    '.wr-stage{width:100%;max-width:576px;margin:0 auto;border:2px solid var(--wr-line);border-radius:10px;overflow:hidden;background:#000}' +
    '.wr-cv{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:manipulation}' +
    '.wr-bar,.wr-areas,.wr-row,.wr-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}' +
    '.wr-btn{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid var(--wr-line);border-radius:10px;background:var(--wr-bg);color:var(--wr-fg);font-size:14px;cursor:pointer}' +
    '.wr-btn.on,.wr-btn[aria-pressed=true]{border-color:var(--wr-acc);font-weight:700;background:var(--wr-chip)}' +
    '.wr-btn:disabled{opacity:.5;cursor:default}' +
    '.wr-btn.wr-armed{border-color:var(--wr-acc);background:var(--wr-acc);color:#fff}' +
    '.wr-panel{border:1px solid var(--wr-line);border-radius:10px;background:var(--wr-bg);padding:10px 12px;margin:8px 0}' +
    '.wr-panel h3{margin:0 0 6px;font-size:15px}' +
    '.wr-note{font-size:12px;color:var(--wr-mute);margin:2px 0 6px}' +
    '.wr-status{font-size:13px;color:var(--wr-mute);margin:6px 0 0;min-height:20px}' +
    '.wr-msg{min-height:20px;font-size:13px;margin:6px 0}' +
    '.wr-optrow{margin:4px 0 8px}.wr-optrow .wr-btn{width:100%;text-align:left}' +
    '.wr-chip{display:inline-block;font-size:12px;padding:2px 8px;border-radius:99px;background:var(--wr-chip);margin:2px 4px 2px 0}' +
    '.wr-item{display:block;width:100%;text-align:left;min-height:56px;margin:4px 0}' +
    '.wr-spots{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}' +
    '.wr-spots .wr-btn{font-size:13px;padding:6px}';
  var cssNode = null, cssRef = 0;
  function ensureCss() {
    if (cssRef++ > 0) return;
    var d = root.document;
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

  /* 範圍：計時器與監聽統一登記，cleanup 一次清乾淨 */
  function makeScope() {
    var timers = {}, ls = [], rafId = 0, dead = false;
    var sc = {
      setT: function (fn, ms) {
        var id;
        if (dead) return 0;
        id = setTimeout(function () { delete timers[id]; fn(); }, ms);
        timers[id] = 1;
        return id;
      },
      clearT: function (id) { if (id) { clearTimeout(id); delete timers[id]; } },
      on: function (target, type, fn) { target.addEventListener(type, fn); ls.push([target, type, fn]); },
      raf: function (fn) {
        if (dead) return 0;
        var r = root.requestAnimationFrame;
        rafId = r ? r.call(root, fn) : setTimeout(fn, 16);
        return rafId;
      },
      cancelRaf: function () {
        if (!rafId) return;
        if (root.cancelAnimationFrame) root.cancelAnimationFrame(rafId); else clearTimeout(rafId);
        rafId = 0;
      },
      clearRafMark: function () { rafId = 0; },
      pending: function () { return { timers: keysOf(timers).length, listeners: ls.length, raf: rafId ? 1 : 0 }; },
      cleanup: function () {
        var i, k;
        dead = true;
        sc.cancelRaf();
        for (k in timers) if (Object.prototype.hasOwnProperty.call(timers, k)) clearTimeout(k);
        timers = {};
        for (i = 0; i < ls.length; i++) { try { ls[i][0].removeEventListener(ls[i][1], ls[i][2]); } catch (e) { /* 忽略 */ } }
        ls = [];
      },
      isDead: function () { return dead; }
    };
    return sc;
  }

  /* 兩段式：第一次按變「再按一次確認」，6 秒復原，第二次才執行 */
  function armable(scope, button, label, action) {
    var armed = false, tid = 0;
    function disarm() {
      if (tid) { scope.clearT(tid); tid = 0; }
      armed = false; button.textContent = label; rmCls(button, 'wr-armed');
    }
    button.addEventListener('click', function () {
      if (!armed) {
        armed = true; button.textContent = '再按一次確認：' + label; addCls(button, 'wr-armed');
        tid = scope.setT(function () { tid = 0; disarm(); }, ARM_MS);
      } else { disarm(); action(); }
    });
    return button;
  }

  /* ------------------------------------------------------------------ 房間畫面（自己的房間與訪客共用） */
  /* cfg: { opts, scope, getSpots(), getSpirits() → [{id,stage,vigor}], getWindow(), getEggs(), onSpiritTap(id) → {float,msg}, onArea(key,detail), say(msg), readOnly, seed } */
  function createView(container, cfg) {
    var opts = cfg.opts || {}, scope = cfg.scope, layout = getLayout(), rng = mulberry32(hashStr(cfg.seed !== undefined ? cfg.seed : (opts.seed !== undefined ? opts.seed : 'room')));
    var cv = el('canvas', { cls: 'wr-cv', role: 'img', 'aria-label': cfg.label || '房間' });
    var stage = el('div', { cls: 'wr-stage' }, [cv]);
    var ctx = cv.getContext ? cv.getContext('2d') : null;
    var walkers = {}, order = [], grid = null, spotsNow = {}, windowNow = 'auto', eggsNow = 0, floats = [], lastFrame = -1, lastModel = -1e9;
    var editMode = false, selected = null, frameCount = 0, rafOn = false, pollId = 0, dead = false, themeDark = false, lastT = 0;
    var self, pendingMiss = {}, behCfgNow = behCfg(), events = { newItemAt: 0 }, prevSpotsSeen = null, spriteCache = {}, awayOn = !!cfg.away, statusStr = '', lastBubbleText = '';
    cv.width = layout.cols * CELL * SC;
    cv.height = layout.rows * CELL * SC;
    container.appendChild(stage);

    function theme() { return themeDark ? THEMES.dark : THEMES.light; }
    function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x * SC, y * SC, w * SC, h * SC); }
    function P(matrix, pal, x, y, flip, alpha) {
      var WP = pix(), o = { flip: !!flip };
      if (!WP || !matrix) return false;
      if (alpha !== undefined && alpha !== null) o.alpha = alpha;
      WP.draw(ctx, matrix, pal, Math.round(x) * SC, Math.round(y) * SC, SC, o);
      return true;
    }
    function dyn(m, flip, x, y, alpha) { return m ? P(m.rows, m.pal, x, y, flip, alpha) : false; }
    /* 形態：有 WalkPix.formSprite 就在原像素圖上加配色與配件（只算一次，同一隻同一形態重複使用） */
    function spriteOf(sp, def) {
      var key = sp.id + '|' + sp.stage + '|' + (sp.form || ''), c = spriteCache[key], m, fs, WP = pix();
      if (c) return c;
      m = spiritSprite(def, sp.stage);
      if (m && sp.form && WP && typeof WP.formSprite === 'function') {
        try {
          fs = WP.formSprite(m.rows, m.pal, sp.form);
          if (fs && (fs.matrix || fs.rows)) m = { rows: fs.matrix || fs.rows, pal: fs.palette || fs.pal || m.pal };
        } catch (e) { /* 配件畫不出來就用原圖 */ }
      }
      if (m) spriteCache[key] = m;
      return m;
    }
    function idOfForm(f) { if (isObj(f)) f = f.id || f.key || f.form || f.name; return f && f !== 'none' ? String(f) : ''; }

    /* ---- 資料同步 */
    function syncSpots() {
      var nextSpots = isObj(cfg.getSpots()) ? cfg.getSpots() : {}, k;
      if (prevSpotsSeen && !cfg.readOnly) {
        for (k in nextSpots) if (Object.prototype.hasOwnProperty.call(nextSpots, k) && nextSpots[k] && prevSpotsSeen[k] !== nextSpots[k]) events.newItemAt = nowOf(opts);
      }
      prevSpotsSeen = {}; for (k in nextSpots) if (Object.prototype.hasOwnProperty.call(nextSpots, k)) prevSpotsSeen[k] = nextSpots[k];
      spotsNow = nextSpots;
      grid = buildGrid(layout, spotsNow, itemDef);
      keysOf(walkers).forEach(function (id) { fixPosition(walkers[id]); });
    }
    function occupiedBy(except) {
      var o = {};
      order.forEach(function (id) { if (id !== except) o[cellKey(walkers[id].x, walkers[id].y)] = 1; });
      return o;
    }
    function fixPosition(sp) {                        /* 站的格子被家具蓋住了：移到最近的可走格 */
      var occ, best = null, bestD = 1e9, x, y, d;
      if (grid.isWalk(sp.x, sp.y)) return;
      occ = occupiedBy(sp.id);
      for (y = 0; y < grid.h; y++) for (x = 0; x < grid.w; x++) {
        if (!grid.isWalk(x, y) || occ[cellKey(x, y)]) continue;
        d = Math.abs(x - sp.x) + Math.abs(y - sp.y);
        if (d < bestD) { bestD = d; best = { x: x, y: y }; }
      }
      if (best) { sp.x = best.x; sp.y = best.y; sp.fromX = best.x; sp.fromY = best.y; }
    }
    function placeRandom(sp) {
      var occ = occupiedBy(sp.id), cells = [], x, y, c;
      for (y = 0; y < grid.h; y++) for (x = 0; x < grid.w; x++) if (grid.isWalk(x, y) && !occ[cellKey(x, y)]) cells.push({ x: x, y: y });
      c = cells.length ? cells[Math.floor(rng() * cells.length)] : grid.nest;
      sp.x = c.x; sp.y = c.y; sp.fromX = c.x; sp.fromY = c.y;
    }
    function syncSpirits() {
      var list = cfg.getSpirits() || [], next = {}, ord = [];
      list.slice(0, 3).forEach(function (s) {
        if (!s || s.id === undefined || s.stage === 'egg') return;
        var w = walkers[s.id], vg = typeof s.vigor === 'number' ? s.vigor : HIGH_VIGOR, nowMs = nowOf(opts);
        if (!w) { w = newWalker(s.id, s.stage, 0, 0); walkers[s.id] = w; next[s.id] = w; ord.push(s.id); placeRandom(w); w.vigorSeen = null; }
        else { next[s.id] = w; ord.push(s.id); }
        if (w.stage && w.stage !== s.stage && !cfg.readOnly) w.flashUntil = nowMs + 1800;                /* 進化了：閃一下 */
        w.stage = s.stage;
        if (typeof w.vigorSeen === 'number' && vg > w.vigorSeen + 0.5) w.careAt = nowMs;                  /* 活力往上＝剛被照顧過 */
        w.vigorSeen = vg;
        w.vigor = vg;
        w.pers = s.pers !== undefined ? s.pers : null;
        w.arch = archOf(w.pers);
        w.form = idOfForm(s.form);
        w.bond = num(s.bond);
        if (pendingMiss[s.id]) { w.missWanted = true; delete pendingMiss[s.id]; }
      });
      walkers = next; order = ord;
      eggsNow = num(cfg.getEggs ? cfg.getEggs() : 0);
    }
    function refreshModel() {
      behCfgNow = behCfg();
      windowNow = String(cfg.getWindow() || 'auto');
      syncSpots(); syncSpirits();
    }

    /* ---- 繪圖 */
    function drawBackdrop() {
      var T = theme(), x, y, wr = layout.wallRows;
      R(0, 0, layout.cols * CELL, wr * CELL, T.wall);
      R(0, (wr - 1) * CELL + 12, layout.cols * CELL, 4, T.trim);
      R(0, wr * CELL - 2, layout.cols * CELL, 2, T.baseboard);
      for (y = wr; y < layout.rows; y++) for (x = 0; x < layout.cols; x++) R(x * CELL, y * CELL, CELL, CELL, ((x + y) % 2) ? T.floorB : T.floorA);
    }
    function drawWindowCell(cx, cy, t) {
      var px = cx * CELL, py = cy * CELL, w = resolveWindow(windowNow, lastT), s = SKY[w.phase], f = Math.floor(t / FRAME_MS), i, frame = '#a0673c';
      R(px + 1, py + 1, 14, 14, frame);
      R(px + 2, py + 2, 12, 12, s.bg);
      if (w.phase === 'night') {
        [[4, 4], [11, 3], [7, 10], [12, 9]].forEach(function (p, k) { if ((f + k) % 5 !== 0) R(px + p[0], py + p[1], 1, 1, '#ffffff'); });
        R(px + 10, py + 4, 3, 3, s.sun);
      } else { R(px + 10, py + 4, 3, 3, s.sun); }
      if (w.weather === 'cloud' || w.weather === 'rain') {
        R(px + 3 + (Math.floor(f / 8) % 6), py + 5, 6, 3, s.cloud);
        R(px + 5 + (Math.floor(f / 8) % 6), py + 4, 4, 1, s.cloud);
      }
      if (w.weather === 'rain') for (i = 0; i < 4; i++) R(px + 3 + i * 3, py + 3 + ((f + i * 2) % 9), 1, 2, '#cfe8ff');
      R(px + 7, py + 2, 2, 12, frame);
      R(px + 2, py + 7, 12, 2, frame);
    }
    function drawPlaceholder(cx, cy, kind, label) {
      var col = { wall: '#c58b5a', floor: '#8a5aa8', window: '#6ccbd9', pet: '#f6d55c' }[kind] || '#9aa0a6';
      R(cx * CELL + 1, cy * CELL + 1, 14, 14, '#2b2233');
      R(cx * CELL + 2, cy * CELL + 2, 12, 12, col);
      R(cx * CELL + 5, cy * CELL + 5, 6, 6, 'rgba(255,255,255,0.55)');
    }
    function drawAreas(t) {
      var A = layout.areas, a, i, GOLD = '#f6d55c';
      a = A.achieve;                                              /* 成就牆：木框＋三枚徽章 */
      R(a.x * CELL + 2, a.y * CELL + 2, a.w * CELL - 4, a.h * CELL - 4, '#a0673c');
      R(a.x * CELL + 4, a.y * CELL + 4, a.w * CELL - 8, a.h * CELL - 8, '#fff4e0');
      [[8, 9, GOLD], [16, 9, '#e58fb5'], [12, 18, '#6ccbd9']].forEach(function (b) {
        R(a.x * CELL + b[0], a.y * CELL + b[1], 5, 5, b[2]); R(a.x * CELL + b[0] + 1, a.y * CELL + b[1] + 5, 3, 3, '#d9534f');
      });
      a = A.photos;                                               /* 照片牆：四張小相框 */
      R(a.x * CELL + 2, a.y * CELL + 2, a.w * CELL - 4, a.h * CELL - 4, '#5a3a3a');
      [[5, 5, '#8fd3ff'], [17, 5, '#8bc34a'], [5, 17, '#ffe0ec'], [17, 17, GOLD]].forEach(function (p) {
        R(a.x * CELL + p[0], a.y * CELL + p[1], 9, 9, '#fff4e0'); R(a.x * CELL + p[0] + 1, a.y * CELL + p[1] + 1, 7, 7, p[2]);
      });
      a = A.shelf;                                                /* 圖鑑書櫃：五排書＝五冊 */
      R(a.x * CELL, a.y * CELL, a.w * CELL, a.h * CELL, '#5a3a3a');
      R(a.x * CELL + 2, a.y * CELL + 2, a.w * CELL - 4, a.h * CELL - 4, '#a0673c');
      ['#d9534f', '#3c6fc4', '#3f8f4e', '#f0953a', '#8a5aa8'].forEach(function (c, k) {
        var sy = Math.round(a.y * CELL + 3 + k * 12.4);
        for (i = 0; i < 5; i++) R(a.x * CELL + 4 + i * 5, sy, 4, 10, i % 2 ? c : '#fff4e0');
        R(a.x * CELL + 3, sy + 10, a.w * CELL - 6, 1, '#5a3a3a');
      });
      a = A.closet;                                               /* 衣櫃 */
      R(a.x * CELL + 1, a.y * CELL + 1, a.w * CELL - 2, a.h * CELL - 2, '#5a3a3a');
      R(a.x * CELL + 3, a.y * CELL + 3, a.w * CELL - 6, a.h * CELL - 6, '#a0673c');
      R(a.x * CELL + 8, a.y * CELL + 3, 1, a.h * CELL - 6, '#5a3a3a');
      R(a.x * CELL + 6, a.y * CELL + 15, 1, 3, GOLD); R(a.x * CELL + 10, a.y * CELL + 15, 1, 3, GOLD);
      a = A.map;                                                  /* 地圖桌：桌面＋攤開的地圖與足跡點 */
      R(a.x * CELL + 1, a.y * CELL + 3, a.w * CELL - 2, CELL - 5, '#5a3a3a');
      R(a.x * CELL + 3, a.y * CELL + 4, a.w * CELL - 6, CELL - 9, '#e8dcb0');
      R(a.x * CELL + 8, a.y * CELL + 6, 2, 2, '#d9534f'); R(a.x * CELL + 15, a.y * CELL + 7, 2, 2, '#d9534f'); R(a.x * CELL + 22, a.y * CELL + 6, 2, 2, '#d9534f');
      a = A.nest;                                                 /* 小精靈窩 */
      R(a.x * CELL + 1, a.y * CELL + 7, 14, 8, '#5a3a3a');
      R(a.x * CELL + 2, a.y * CELL + 6, 12, 8, '#a0673c');
      R(a.x * CELL + 4, a.y * CELL + 8, 8, 4, '#e8c9a0');
      if (eggsNow > 0 && pix()) P(EGG, { X: '#f3e6c8' }, a.x * CELL + 4, a.y * CELL + 3 + (Math.floor(t / 400) % 2), false);
    }
    /* 窗景家具自帶畫好的窗外圖：依時間與設定在上面蓋一層日夜色與簡單天氣 */
    function drawSkyOverlay(cx, cy, t) {
      var px = cx * CELL, py = cy * CELL, w = resolveWindow(windowNow, lastT), f = Math.floor(t / FRAME_MS), i;
      if (w.phase === 'night') {
        R(px + 2, py + 2, 12, 12, 'rgba(20,30,80,0.5)');
        [[4, 4], [11, 3], [7, 10], [12, 9]].forEach(function (p, k) { if ((f + k) % 5 !== 0) R(px + p[0], py + p[1], 1, 1, '#ffffff'); });
      } else if (w.phase === 'dusk') R(px + 2, py + 2, 12, 12, 'rgba(240,120,60,0.28)');
      else if (w.phase === 'dawn') R(px + 2, py + 2, 12, 12, 'rgba(255,190,150,0.22)');
      if (w.weather === 'cloud' || w.weather === 'rain') {
        R(px + 3 + (Math.floor(f / 8) % 6), py + 4, 6, 3, 'rgba(255,255,255,0.6)');
        R(px + 5 + (Math.floor(f / 8) % 6), py + 3, 4, 1, 'rgba(255,255,255,0.6)');
      }
      if (w.weather === 'rain') for (i = 0; i < 4; i++) R(px + 3 + i * 3, py + 3 + ((f + i * 2) % 9), 1, 2, '#cfe8ff');
    }
    function drawSpots(t) {
      keysOf(layout.spots).forEach(function (sid) {
        var pos = layout.spots[sid], itemId = spotsNow[sid], def, m, kind = spotType(sid);
        if (!itemId) { if (sid === 'window2') drawWindowCell(pos.x, pos.y, t); return; }
        def = itemDef(itemId);
        m = itemSprite(def);
        if (!m || !dyn(m, false, pos.x * CELL, pos.y * CELL)) {
          if (kind === 'window') drawWindowCell(pos.x, pos.y, t); else drawPlaceholder(pos.x, pos.y, itemKind(def) || kind);
        } else if (kind === 'window') drawSkyOverlay(pos.x, pos.y, t);
      });
    }
    function drawEditOverlay() {
      if (!editMode) return;
      var T = theme();
      keysOf(layout.spots).forEach(function (sid) {
        var pos = layout.spots[sid], x = pos.x * CELL, y = pos.y * CELL, sel = sid === selected;
        if (!spotsNow[sid]) { R(x + 1, y + 1, 14, 14, T.phFill); R(x + 7, y + 4, 2, 8, T.ph); R(x + 4, y + 7, 8, 2, T.ph); }
        ctx.strokeStyle = sel ? '#ff7a8a' : T.ph;
        ctx.lineWidth = (sel ? 2 : 1) * SC;
        if (ctx.setLineDash) ctx.setLineDash(sel ? [] : [2 * SC, 2 * SC]);
        ctx.strokeRect(x * SC + SC, y * SC + SC, (CELL - 2) * SC, (CELL - 2) * SC);
        if (ctx.setLineDash) ctx.setLineDash([]);
      });
    }
    function walkerPos(sp, t) {
      var p = Math.min(1, Math.max(0, (t - sp.moveT0) / MOVE_MS)), x = sp.fromX + (sp.x - sp.fromX) * p, y = sp.fromY + (sp.y - sp.fromY) * p;
      return { x: x * CELL, y: y * CELL, moving: p < 1 };
    }
    function drawWalker(sp, t) {
      var def = spiritDef(sp.id), m = spriteOf(sp, def), pos = walkerPos(sp, t), x = pos.x, y = pos.y, dy = 0, f = Math.floor(t / FRAME_MS), mode = sp.mode;
      var jump = t - sp.jumpAt, flip = sp.dir < 0, alpha = null, sleepy = mode === 'nap' || (mode === 'together' && sp.style === 'side' && !pos.moving), gx = x + 11, gy = y - 2;
      if (sleepy) dy = 1;
      else if (jump >= 0 && jump < 400) dy = -Math.round(Math.sin((jump / 400) * Math.PI) * 5);
      else if (mode === 'play' || (mode === 'together' && sp.style === 'chase')) dy = -(f % 4 === 0 ? 2 : 0);
      else if (mode === 'eat' && !pos.moving) dy = (f % 3 === 0 ? 1 : 0);
      else if (mode === 'sing') dy = -(Math.floor(f / 2) % 2);
      else if (!pos.moving) dy = (Math.floor(t / 400) % 2) ? 0 : -1;
      if (mode === 'show') flip = (f % 4) < 2;
      if (mode === 'hide' && !pos.moving) alpha = 0.45;
      if (sp.dot && mode === 'play' && (f % 2 === 0)) R(sp.dot.x * CELL + 7, sp.dot.y * CELL + 7, 2, 2, '#fff8c0');
      R(x + 3, y + 13, 10, 2, theme().shadow);
      if (!m || !dyn(m, flip, x, y + dy, alpha)) {
        P(BLOB, { X: ['#e58fb5', '#6ccbd9', '#f6d55c', '#8bc34a', '#f0953a'][hashStr(sp.id) % 5] }, x + 3, y + 5 + dy, flip, alpha);
      }
      if (sleepy) {
        P(GLYPH_Z, { Z: '#ffffff' }, gx, gy - (f % 6 < 3 ? 0 : 1), false);
        if (f % 6 >= 3) P(GLYPH_Z, { Z: '#ffffff' }, x + 13, y - 6, false);
      } else if (mode === 'sing') P(GLYPH_NOTE, { n: '#ffffff' }, x + 11 - (f % 4), y - 4 - (f % 3), false);
      else if (mode === 'explore' && sp.arrived) P(GLYPH_Q, { q: '#ffffff' }, x + 12, y - 4 - (f % 2), false);
      else if (mode === 'eat' && sp.arrived && f % 2 === 0) P(GLYPH_NOM, { o: '#f6d55c' }, x + 11, y - 3, false);
      else if (mode === 'show') P(GLYPH_BANG, { e: '#f6d55c' }, x + 12, y - 5 - (f % 2), false);
      else if (mode === 'missyou' || (mode === 'cuddle' && !sp.cold) || (mode === 'react' && t < sp.reactUntil)) P(GLYPH_HEART, null, x + 5, y - 6 - (f % 2), false);
      else if (mode === 'cuddle' && sp.cold) P(GLYPH_BANG, { e: '#ffffff' }, x + 12, y - 5, false);
      if (sp.giftUntil && t < sp.giftUntil) P(GLYPH_GIFT, { g: '#e58fb5', y: '#f6d55c' }, x - 5, y - 4 - (f % 2), false);
      if (sp.flashUntil && t < sp.flashUntil) {                                      /* 進化：光暈與閃爍的小方塊 */
        var rr = 6 + (f % 4) * 2, k2;
        for (k2 = 0; k2 < 4; k2++) R(x + 8 + Math.round(Math.cos(f / 2 + k2 * 1.57) * rr), y + 8 + Math.round(Math.sin(f / 2 + k2 * 1.57) * rr), 2, 2, k2 % 2 ? '#fff8c0' : '#f6d55c');
        R(x + 2, y + 14, 12, 1, 'rgba(255,248,192,0.7)');
      }
    }
    function drawBubble(sp, t) {
      var s = sp.say, pos, text, fs = 7 * SC, pad = 3 * SC, bw, bh, bx, by;
      if (!s || t >= s.until) return;
      pos = walkerPos(sp, t);
      text = String(s.text).slice(0, 14);
      bw = text.length * fs + pad * 2; bh = fs + pad * 2;
      bx = Math.round(pos.x * SC + 8 * SC - bw / 2);
      bx = Math.max(2, Math.min(cv.width - bw - 2, bx));
      by = Math.round((pos.y - 6) * SC - bh);
      if (by < 2) by = Math.round((pos.y + CELL + 2) * SC);
      ctx.fillStyle = '#2b2233'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, bw, bh);
      ctx.font = 'bold ' + fs + 'px sans-serif';
      ctx.fillStyle = '#2b2233'; ctx.fillText(text, bx + pad, by + pad + Math.round(fs * 0.82));
    }
    function drawFloats(t) {
      var i, fl, rise;
      floats = floats.filter(function (x) { return t < x.until; });
      for (i = 0; i < floats.length; i++) {
        fl = floats[i]; rise = (t - fl.t0) / 1200 * 8;
        ctx.font = 'bold ' + (5 * SC) + 'px sans-serif';
        ctx.fillStyle = '#2b2233'; ctx.fillText(fl.text, (fl.x + 1) * SC, (fl.y - rise + 1) * SC);
        ctx.fillStyle = '#ffffff'; ctx.fillText(fl.text, fl.x * SC, (fl.y - rise) * SC);
      }
    }
    function draw(t) {
      if (!ctx) return;
      lastT = t;
      if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;
      drawBackdrop();
      drawAreas(t);
      drawSpots(t);
      order.slice().sort(function (a, b) { return walkers[a].y - walkers[b].y; }).forEach(function (id) { drawWalker(walkers[id], t); });
      order.forEach(function (id) { drawBubble(walkers[id], t); });
      drawEditOverlay();
      drawFloats(t);
    }

    /* ---- 步進 */
    /* 這一刻的環境：夜晚、有沒有訪客、玩家離開很久再回來、有沒有新東西、同房的夥伴 */
    function behCtx(t) {
      var d = new Date(t), ev = {}, e2 = cfg.getEvents ? cfg.getEvents() : null, k, nt = null, others = order.map(function (id) { return walkers[id]; });
      if (isObj(e2)) for (k in e2) if (Object.prototype.hasOwnProperty.call(e2, k)) ev[k] = e2[k];
      ev.newItemAt = Math.max(num(events.newItemAt), num(ev.newItemAt));
      if (ev.newItemAt > 0 && t - ev.newItemAt < 25000) nt = { key: 'item:' + ev.newItemAt };
      if (num(ev.newIntelAt) > 0 && t - num(ev.newIntelAt) < 25000 && (!nt || ev.newIntelAt > ev.newItemAt)) nt = { key: 'intel:' + ev.newIntelAt };
      var M = behCfgNow.mods && isObj(behCfgNow.mods.night) ? behCfgNow.mods.night : DEF_MODS.night;
      return { cfg: behCfgNow, hour: d.getHours(), night: inHours(d.getHours(), num(M.from, 20), num(M.to, 6)), visitor: !!cfg.readOnly || !!ev.visitor, away: awayOn, newThing: nt, others: others, events: ev };
    }
    function onSay(sp) { if (sp.say) { lastBubbleText = String(sp.say.text); if (cfg.onBubble) cfg.onBubble(sp, lastBubbleText); } }
    function behEnv(sp, beh) { return { grid: grid, occupied: occupiedBy(sp.id), onSay: onSay, beh: opts.legacyWalk ? null : beh }; }
    function statusText(t) {
      var parts = order.map(function (id) { var d = spiritDef(id); return ((d && d.name) || '小精靈') + '：' + stateTextOf(walkers[id]); }), bub = '', i, sp;
      for (i = 0; i < order.length; i++) { sp = walkers[order[i]]; if (sp.say && t < sp.say.until) { bub = String(sp.say.text); break; } }
      return parts.join('　') + (bub ? '　「' + bub + '」' : '');
    }
    function publishStatus(t) {
      var str = statusText(t);
      if (cfg.register) order.forEach(function (id) { STATE_REG[id] = { state: walkers[id].mode, text: stateTextOf(walkers[id]), at: t }; });
      if (str !== statusStr) { statusStr = str; if (cfg.onStatus) cfg.onStatus(str); }
    }
    function tick(t) {
      var i, sp, env, beh;
      if (dead) return;
      themeDark = isDark();
      if (cfg.onTheme) cfg.onTheme(themeDark);
      if (t - lastModel > MODEL_REFRESH_MS) { lastModel = t; refreshModel(); }
      beh = behCtx(t);
      for (i = 0; i < order.length; i++) {
        sp = walkers[order[i]];
        stepWalker(sp, behEnv(sp, beh), t, rng);
      }
      if (awayOn && order.every(function (id) { return walkers[id].missDone; })) awayOn = false;
      publishStatus(t);
      frameCount++;
      draw(t);
    }

    /* ---- 動畫迴圈：rAF 節流到 8 FPS；背景分頁停止；省電模式降為慢速檢查 */
    function paused() {
      var d = root.document;
      return !!((d && d.hidden) || (opts.isSaver && opts.isSaver()));
    }
    function loop(ts) {
      scope.clearRafMark();
      rafOn = false;
      if (dead) return;
      if (paused()) { start(); return; }
      if (lastFrame < 0 || ts - lastFrame >= FRAME_MS) { lastFrame = ts; tick(nowOf(opts)); }
      rafOn = true; scope.raf(loop);
    }
    function start() {
      if (dead || rafOn || pollId) return;
      if (root.document && root.document.hidden) return;                   /* 等 visibilitychange 再喚醒 */
      if (opts.isSaver && opts.isSaver()) {
        pollId = scope.setT(function () { pollId = 0; start(); }, 2000);
        return;
      }
      rafOn = true; scope.raf(loop);
    }
    function stop() {
      scope.cancelRaf(); rafOn = false;
      if (pollId) { scope.clearT(pollId); pollId = 0; }
    }
    function onVisibility() {
      if (root.document.hidden) stop(); else { lastFrame = -1; start(); }
    }
    if (root.document && root.document.addEventListener) scope.on(root.document, 'visibilitychange', onVisibility);

    /* ---- 點擊 */
    function toLogical(ev) {
      var r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0, width: cv.width, height: cv.height };
      if (!r.width || !r.height) return null;
      return { x: (ev.clientX - r.left) * (layout.cols * CELL) / r.width, y: (ev.clientY - r.top) * (layout.rows * CELL) / r.height };
    }
    /* 被點到：任何狀態都轉成撒嬌並呼叫 pet（呼叫在 clickAt）；連點太多次會煩、跑去躲；傲嬌前兩次冷淡、害羞第一次縮起來 */
    function tapSpirit(sp, t, res) {
      var key = 'cuddle', env = behEnv(sp, behCtx(t)), kind = res && res.kind, line = res && res.line;
      sp.tapRun = (t - num(sp.lastTapAt, -1e9) < 20000) ? num(sp.tapRun) + 1 : 1;
      sp.lastTapAt = t; sp.careAt = t;
      if (!kind && cfg.readOnly) {                                  /* 參觀別人的房間：store 不管，這裡自己判斷性格反應 */
        if (sp.tapRun > 5) kind = 'annoyed';
        else if (sp.arch === 'tsun' && sp.tapRun < 3) kind = 'cold';
        else if (sp.arch === 'shy' && sp.tapRun < 2) kind = 'wait';
      }
      if (kind === 'annoyed') { enterState(sp, 'hide', env, t, rng); key = 'tapannoyed'; sp.cold = true; }
      else {
        if (kind === 'cold') key = 'tapcold'; else if (kind === 'wait') key = 'tapshy';
        enterState(sp, 'cuddle', env, t, rng);
        sp.cold = key !== 'cuddle';
      }
      sp.say = { text: line ? String(line) : pickLine(sp.pers, key, rng), until: t + 2800 };
      onSay(sp);
      sp.lastTapKey = key;
    }
    /* 點到空地：離得近、有精神的小精靈走過來撒嬌（傲嬌的不一定理你） */
    function callNearest(cx, cy, t) {
      var best = null, bd = 99, i, sp, d;
      if (!grid.isWalk(cx, cy)) return false;
      for (i = 0; i < order.length; i++) {
        sp = walkers[order[i]];
        if (['hide', 'missyou', 'cuddle'].indexOf(sp.mode) >= 0 || (sp.mode === 'nap' && num(sp.vigor, HIGH_VIGOR) < LOW_VIGOR)) continue;
        d = manhattan(sp, { x: cx, y: cy });
        if (d < bd) { bd = d; best = sp; }
      }
      if (!best || bd > 8) return false;
      if (best.arch === 'tsun' && rng() < 0.6) return false;
      enterState(best, 'cuddle', behEnv(best, behCtx(t)), t, rng);
      best.target = { x: cx, y: cy };
      return true;
    }
    function clickAt(lx, ly) {
      var t = nowOf(opts), i, sp, pos, cx = Math.floor(lx / CELL), cy = Math.floor(ly / CELL), sid, a, key, res, hit = null;
      if (editMode) {
        for (sid in layout.spots) if (Object.prototype.hasOwnProperty.call(layout.spots, sid)) {
          if (layout.spots[sid].x === cx && layout.spots[sid].y === cy) { if (cfg.onSpot) cfg.onSpot(sid); return { kind: 'spot', id: sid }; }
        }
        return null;
      }
      for (i = order.length - 1; i >= 0; i--) {                                  /* 先找小精靈（站在前面的優先） */
        sp = walkers[order[i]]; pos = walkerPos(sp, t);
        if (lx >= pos.x - 1 && lx < pos.x + CELL + 1 && ly >= pos.y - 2 && ly < pos.y + CELL + 1) { if (!hit || sp.y >= hit.y) hit = sp; }
      }
      if (hit) {
        res = cfg.onSpiritTap ? cfg.onSpiritTap(hit.id) : null;
        tapSpirit(hit, t, res);
        if (res && res.float) floats.push({ text: res.float, x: walkerPos(hit, t).x, y: walkerPos(hit, t).y, t0: t, until: t + 1200 });
        if (res && res.msg && cfg.say) cfg.say(res.msg);
        publishStatus(t);
        draw(t);
        return { kind: 'spirit', id: hit.id };
      }
      if (cfg.readOnly || !cfg.onArea) return null;
      for (key in layout.areas) if (Object.prototype.hasOwnProperty.call(layout.areas, key)) {
        a = layout.areas[key];
        if (cx >= a.x && cx < a.x + a.w && cy >= a.y && cy < a.y + a.h) {
          if (key === 'shelf') {
            i = Math.max(0, Math.min(DEX_BOOKS.length - 1, Math.floor((ly - a.y * CELL - 3) / 12.4)));
            cfg.onArea('dex', { book: DEX_BOOKS[i][0] });
          } else cfg.onArea(AREA_PUBLIC[key] || key, {});
          return { kind: 'area', id: key };
        }
      }
      if (callNearest(cx, cy, t)) draw(t);
      return null;
    }
    scope.on(cv, 'click', function (ev) { var p = toLogical(ev); if (p) clickAt(p.x, p.y); });

    refreshModel();
    themeDark = isDark();
    if (cfg.onTheme) cfg.onTheme(themeDark);
    lastModel = nowOf(opts);
    publishStatus(nowOf(opts));
    if (ctx) draw(nowOf(opts));
    self = {
      canvas: cv, stage: stage, layout: layout,
      tick: tick, refresh: function () { lastModel = nowOf(opts); refreshModel(); publishStatus(nowOf(opts)); if (ctx) draw(nowOf(opts)); },
      clickAt: clickAt, start: start, stop: stop,
      setEdit: function (b) { editMode = !!b; if (!editMode) selected = null; if (ctx) draw(nowOf(opts)); },
      select: function (sid) { selected = sid; if (ctx) draw(nowOf(opts)); },
      walkers: function () { return walkers; }, order: function () { return order.slice(); },
      grid: function () { return grid; }, frames: function () { return frameCount; },
      floatsCount: function () { return floats.length; },
      isRunning: function () { return rafOn || !!pollId; },
      status: function () { return statusStr; },
      setAway: function (b) { awayOn = !!b; },
      flash: function (id) { var w = walkers[id]; if (!w) return false; w.flashUntil = nowOf(opts) + 3000; if (ctx) draw(nowOf(opts)); return true; },
      setMissed: function (ids) { (ids || []).forEach(function (id) { if (walkers[id]) walkers[id].missWanted = true; else pendingMiss[id] = 1; }); },
      events: function () { return events; },
      /* 小精靈帶來每日小禮物：圖示在牠頭上停幾秒，加一句話 */
      showGift: function (spiritId, text) {
        var t = nowOf(opts), sp = spiritId !== undefined && spiritId !== null ? walkers[spiritId] : null, i, w, bestB = -1;
        if (!sp) for (i = 0; i < order.length; i++) { w = walkers[order[i]]; if (num(w.bond) > bestB) { bestB = num(w.bond); sp = w; } }
        if (!sp) return false;
        sp.giftUntil = t + 6000;
        sp.say = { text: pickLine(sp.pers, 'gift', rng), until: t + 4500 };
        onSay(sp);
        if (ctx) draw(t);
        return true;
      },
      unregister: function () { order.forEach(function (id) { delete STATE_REG[id]; }); },
      destroy: function () { dead = true; stop(); order.forEach(function (id) { delete STATE_REG[id]; }); if (stage.parentNode) stage.parentNode.removeChild(stage); }
    };
    return self;
  }

  /* ------------------------------------------------------------------ 自己的房間 */
  var PET_FAIL = { daily_cap: '今天摸得夠多了，明天再來吧。', rest_cap: '牠今天休息夠了。', full: '牠現在精神滿滿。', nospirit: '' };
  var PLACE_FAIL = { notowned: '你還沒有這件家具。', wrongzone: '這件放不到這個位置。', allplaced: '這件已經全部擺出來了，先收回一件再放。', badspot: '找不到這個位置。' };

  function mount(container, opts) {
    var scope = makeScope(), S = store(), rootEl, barEl, msgEl, statusEl, areasEl, spotsEl, pickEl, setEl, view, editBtn, setBtn, editOn = false, setOn = false, selSpot = null, dead = false, refreshCount = 0, away = false, missedIds = [];
    opts = opts || {};
    if (!S || !root.document) return null;
    ensureCss();
    rootEl = el('div', { cls: 'wr' });
    statusEl = el('div', { cls: 'wr-status', role: 'status', 'aria-live': 'off' });
    barEl = el('div', { cls: 'wr-bar' });
    msgEl = el('div', { cls: 'wr-msg', role: 'status', 'aria-live': 'polite' });
    areasEl = el('div', { cls: 'wr-areas' });
    spotsEl = el('div', { cls: 'wr-spots' });
    pickEl = el('div', { cls: 'wr-panel' });
    setEl = el('div', { cls: 'wr-panel' });
    spotsEl.style.display = 'none'; pickEl.style.display = 'none'; setEl.style.display = 'none';
    container.appendChild(rootEl);

    function say(m) { msgEl.textContent = m || ''; }

    /* 玩家離開超過一天再進房間：小精靈跑來說想你（不責備）。最後一次進房間的時間由 opts.lastSeen() 提供，沒給就記在這台裝置的 localStorage */
    (function () {
      var nowMs = nowOf(opts), last = 0, key = 'walkroom_last_' + (opts.uid || ''), ci = null;
      try {
        if (typeof opts.lastSeen === 'function') last = num(opts.lastSeen());
        else if (typeof S.checkIn === 'function') ci = S.checkIn();            /* WalkStore 自己記每隻最後一次互動；回傳超過一天沒來的小精靈 */
        else if (root.localStorage) { last = num(parseInt(root.localStorage.getItem(key), 10)); root.localStorage.setItem(key, String(nowMs)); }
        if (typeof opts.markSeen === 'function') opts.markSeen(nowMs);
      } catch (e) { last = 0; ci = null; }
      if (ci && isArr(ci.missed)) missedIds = ci.missed.slice();
      away = last > 0 && nowMs - last >= AWAY_MS;
    })();
    view = createView(rootEl, {
      opts: opts, scope: scope, seed: opts.seed !== undefined ? opts.seed : 'room', label: '你的房間',
      getSpots: function () { return S.room().spots; },
      getWindow: function () { return S.room().window; },
      getSpirits: function () {
        return S.owned().filter(function (o) { return o.slot !== 'follow' && o.stage !== 'egg'; }).map(function (o) {
          return { id: o.id, stage: o.stage, vigor: o.vigor, bond: o.bond,
            pers: typeof S.personalityOf === 'function' ? S.personalityOf(o.id) : null,
            form: typeof S.formOf === 'function' ? S.formOf(o.id) : null };
        });
      },
      getEggs: function () { return S.eggs().length; },
      getEvents: function () { return typeof opts.events === 'function' ? opts.events() : null; },
      away: away, register: true,
      onStatus: function (str) { statusEl.textContent = str; },
      onBubble: function (sp, text) { if (typeof opts.onBubble === 'function') opts.onBubble(sp.id, text); },
      onTheme: function (dk) { if (dk) addCls(rootEl, 'wr-dk'); else rmCls(rootEl, 'wr-dk'); },
      onSpiritTap: function (id) {
        var r = S.pet(id), kind = null;
        if (r && r.ok) {
          kind = r.annoyed ? 'annoyed' : (r.cold ? 'cold' : (r.wait ? 'wait' : (r.happy ? 'happy' : 'ok')));
          if (num(r.delta) > 0 || (r.responded !== false && !r.reaction)) return { float: '+' + (r.delta || 0) + ' 活力', msg: '小精靈很開心（活力 +' + (r.delta || 0) + '）。' + (r.reaction ? '「' + r.reaction + '」' : ''), kind: kind, line: r.reaction || null };
          return { float: null, msg: r.reaction ? '「' + r.reaction + '」' : '牠還沒準備好讓你摸。', kind: kind, line: r.reaction || null };
        }
        return { float: null, msg: PET_FAIL[r && r.reason] !== undefined ? PET_FAIL[r.reason] : '牠現在不想動。' };
      },
      onArea: function (name, detail) { if (typeof opts.onArea === 'function') opts.onArea(name, detail); },
      onSpot: function (sid) { openPicker(sid); },
      say: say
    });
    /* 工具列 */
    editBtn = btn('佈置模式：關', '', function () { toggleEdit(); });
    editBtn.setAttribute('aria-pressed', 'false');
    setBtn = btn('房間設定', '', function () { toggleSettings(); });
    setBtn.setAttribute('aria-pressed', 'false');
    barEl.appendChild(editBtn); barEl.appendChild(setBtn);
    rootEl.appendChild(statusEl);
    rootEl.appendChild(barEl);
    rootEl.appendChild(msgEl);
    rootEl.appendChild(areasEl);
    rootEl.appendChild(spotsEl);
    rootEl.appendChild(pickEl);
    rootEl.appendChild(setEl);
    AREA_ORDER.forEach(function (key) {
      areasEl.appendChild(btn(AREA_LABEL[key], '', function () {
        if (key === 'shelf') opts.onArea && opts.onArea('dex', {}); else opts.onArea && opts.onArea(AREA_PUBLIC[key], {});
      }));
    });
    areasEl.appendChild(el('div', { cls: 'wr-note', text: '點房間裡的家具區也可以進去。' }));

    function toggleEdit() {
      editOn = !editOn;
      editBtn.textContent = '佈置模式：' + (editOn ? '開' : '關');
      editBtn.setAttribute('aria-pressed', editOn ? 'true' : 'false');
      view.setEdit(editOn);
      spotsEl.style.display = editOn ? '' : 'none';
      if (!editOn) { pickEl.style.display = 'none'; selSpot = null; say(''); }
      else { say('點一個擺放點，再選要放的家具。'); renderSpots(); }
    }
    function toggleSettings() {
      setOn = !setOn;
      setBtn.setAttribute('aria-pressed', setOn ? 'true' : 'false');
      setEl.style.display = setOn ? '' : 'none';
      if (setOn) renderSettings();
    }

    function renderSpots() {
      var spots = S.room().spots;
      clear(spotsEl);
      SPOT_IDS.forEach(function (sid) {
        var id = spots[sid], def = id ? itemDef(id) : null, b = btn(spotLabel(sid) + (id ? '：' + ((def && def.name) || id) : '：空'), sid === selSpot ? 'on' : '', function () { openPicker(sid); });
        spotsEl.appendChild(b);
      });
    }
    function placedCount(id) { var sp = S.room().spots, n = 0; keysOf(sp).forEach(function (k) { if (sp[k] === id) n++; }); return n; }
    function openPicker(sid) {
      var owned = S.shop().owned, spots = S.room().spots, cur = spots[sid], defCur = cur ? itemDef(cur) : null, any = false;
      selSpot = sid; view.select(sid);
      pickEl.style.display = '';
      clear(pickEl);
      pickEl.appendChild(el('h3', { text: spotLabel(sid) }));
      if (cur) {
        pickEl.appendChild(el('div', { cls: 'wr-note', text: '現在放著：' + ((defCur && defCur.name) || cur) }));
        pickEl.appendChild(btn('收回這件', '', function () {
          var r = S.unplace(sid);
          say(r.ok ? '已收回。' : '這裡本來就是空的。');
          selSpot = null; view.select(null); pickEl.style.display = 'none';
        }));
      }
      keysOf(owned).forEach(function (id) {
        var def = itemDef(id), free, chk;
        if (!def || isFoodDef(def) || itemKind(def) === null || num(owned[id]) < 1) return;
        chk = canPlace(sid, def);
        if (!chk.ok) return;
        free = num(owned[id]) - placedCount(id) + (cur === id ? 1 : 0);
        any = true;
        pickEl.appendChild(btn((def.name || id) + '（還有 ' + Math.max(0, free) + ' 件可放）', 'wr-item', function () {
          var r = S.place(sid, id);
          if (r.ok) { say('已放好：' + (def.name || id)); selSpot = null; view.select(null); pickEl.style.display = 'none'; }
          else say(PLACE_FAIL[r.reason] || '放不下去，換個位置試試。');
        })).disabled = free < 1 && cur !== id;
      });
      if (!any) pickEl.appendChild(el('div', { cls: 'wr-note', text: '還沒有可以放在這裡的家具，去商店逛逛吧。' }));
      pickEl.appendChild(btn('關閉', '', function () { pickEl.style.display = 'none'; selSpot = null; view.select(null); renderSpots(); }));
      renderSpots();
    }

    function renderSettings() {
      var r = S.room();
      clear(setEl);
      setEl.appendChild(el('h3', { text: '房間設定' }));
      setEl.appendChild(el('div', { cls: 'wr-note', text: '誰可以來逛你的房間？改了馬上生效，房間街的資料也會一起更新。' }));
      OPEN_CHOICES.forEach(function (c) {
        var b = btn(c[1], r.open === c[0] ? 'on' : '', null), row = el('div', { cls: 'wr-optrow' });
        b.setAttribute('aria-pressed', r.open === c[0] ? 'true' : 'false');
        if (r.open !== c[0]) {
          if (c[0] === 'all') armable(scope, b, c[1], function () { setOpen(c[0]); });
          else b.addEventListener('click', function () { setOpen(c[0]); });
        }
        row.appendChild(b); row.appendChild(el('div', { cls: 'wr-note', text: c[2] }));
        setEl.appendChild(row);
      });
      var gb = btn('簽名簿：' + (r.guestBook ? '開（訪客可以留貼圖）' : '關'), '', function () {
        S.setGuestBook(!r.guestBook);
        say(r.guestBook ? '已關閉簽名簿。' : '已開啟簽名簿，訪客只能留固定貼圖。');
      });
      gb.setAttribute('aria-pressed', r.guestBook ? 'true' : 'false');
      setEl.appendChild(el('div', { cls: 'wr-optrow' }, [gb, el('div', { cls: 'wr-note', text: '訪客只能留貼圖，不能打字。' })]));
      var pb = btn('照片牆：' + (r.photosPublic ? '公開給訪客' : '不公開'), '', null);
      pb.setAttribute('aria-pressed', r.photosPublic ? 'true' : 'false');
      if (r.photosPublic) pb.addEventListener('click', function () { S.setPhotosPublic(false); say('照片牆已改成不公開。'); });
      else armable(scope, pb, '照片牆：公開給訪客', function () { S.setPhotosPublic(true); say('照片牆現在訪客也看得到。'); });
      setEl.appendChild(el('div', { cls: 'wr-optrow' }, [pb, el('div', { cls: 'wr-note', text: '照片牆預設不公開，只放你自己的照片。' })]));
      setEl.appendChild(el('div', { cls: 'wr-note', text: '窗外的天氣與時間：' }));
      var wrow = el('div', { cls: 'wr-row' });
      WINDOW_CHOICES.forEach(function (c) {
        var b = btn(c[1], r.window === c[0] ? 'on' : '', function () { S.setWindow(c[0]); say('窗外改成「' + c[1] + '」。'); });
        b.setAttribute('aria-pressed', r.window === c[0] ? 'true' : 'false');
        wrow.appendChild(b);
      });
      setEl.appendChild(wrow);
    }
    function setOpen(v) {
      var res = S.setOpen(v);
      if (res && res.ok) say(v === 'closed' ? '已設成不開放，房間街看不到這間了。' : (v === 'all' ? '現在同場次的所有人都可以來逛。' : '現在只有隊友可以來逛。'));
    }

    function formNameOf(fid) {
      var F = root.WALK_FORMS, i, f = null;
      if (!fid) return '';
      if (F && F.byId && F.byId[fid]) f = F.byId[fid];
      else if (isArr(F)) for (i = 0; i < F.length; i++) if (F[i] && F[i].id === fid) f = F[i];
      return f && f.name ? String(f.name) : '';
    }
    function announceEvolve(ev) {
      var d, fn;
      if (!isObj(ev) || ev.id === undefined) return;
      d = spiritDef(ev.id); fn = formNameOf(ev.form);
      view.flash(ev.id);
      msgEl.textContent = '🌟 ' + ((d && d.name) || '小精靈') + ' 進化了！' + (fn ? '長成了' + fn + '。' : '');
    }
    function onStore(what, _s, extra) {
      if (dead) return;
      refreshCount++;
      view.refresh();
      if (what === 'evolve') announceEvolve(extra);
      if (editOn) renderSpots();
      if (setOn) renderSettings();
    }
    S.on(onStore);

    if (opts.publishOnMount) { try { S.publish(); } catch (e) { /* 忽略 */ } }
    /* 進房間：先播還沒播過的進化，再看禮物，再讓很久沒來的小精靈跑來想你 */
    if (typeof S.takeEvolutions === 'function') { try { (S.takeEvolutions() || []).forEach(announceEvolve); } catch (e) { /* 忽略 */ } }
    if (missedIds.length) view.setMissed(missedIds);
    statusEl.textContent = view.status();
    /* 每日小禮物：進房間時問 WalkStore（一天最多一次，沒有懲罰機制） */
    var giftRes = null;
    (function () {
      var r = null, list, names = [], sid;
      if (opts.noGift || typeof S.giftToday !== 'function') return;
      try { r = S.giftToday(); } catch (e) { r = null; }
      if (!r || r.ok === false) return;
      list = isArr(r.gifts) && r.gifts.length ? r.gifts : [{ id: r.id !== undefined ? r.id : r.spirit, gift: r.gift }];
      list.forEach(function (it) {
        var g = it && it.gift, nm;
        if (!isObj(g)) return;
        nm = g.kind === 'shard' ? '情報卡碎屑' : (g.name || foodName(g.id) || '');
        if (nm) names.push(nm);
      });
      if (!names.length) return;
      sid = list[0] ? list[0].id : undefined;
      giftRes = { text: '小精靈帶來了小禮物：' + names.join('、') + '。', spirit: sid, raw: r, at: nowOf(opts) };
      GIFT_REG = giftRes;
      view.showGift(sid, giftRes.text);
      msgEl.textContent = '🎁 ' + giftRes.text;
      if (typeof opts.onGift === 'function') { try { opts.onGift(r); } catch (e2) { /* 忽略 */ } }
    })();
    view.start();

    var inst = {
      root: rootEl, view: view, scope: scope,
      tick: function (t) { view.tick(t); },
      refresh: function () { onStore(); },
      toggleEdit: toggleEdit, toggleSettings: toggleSettings, openPicker: openPicker, renderSettings: renderSettings,
      message: function () { return msgEl.textContent; },
      statusText: function () { return statusEl.textContent; },
      gift: function () { return giftRes; },
      away: function () { return away; },
      refreshCount: function () { return refreshCount; },
      pending: function () { return scope.pending(); },
      unmount: function () {
        if (dead) return;
        dead = true;
        S.off(onStore);
        scope.cleanup();
        view.destroy();
        if (GIFT_REG === giftRes) GIFT_REG = null;
        if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
        releaseCss();
      }
    };
    return inst;
  }

  /* ------------------------------------------------------------------ 房間街與訪客 */
  var VISIT_FAIL = {
    hidden: '這間房暫時不開放。', closed: '這間房暫時不開放。', teamonly: '這間房只給隊友參觀。',
    noroom: '找不到這間房。', self: '這是你自己的房間。', error: '現在連不上，稍後再試。'
  };
  var FP_FAIL = {
    host_once: '這間今天已經留過足跡了。', daily_cap: '今天逛的房間夠多了，明天再來吧。', visitfirst: '先進到房間裡才能留足跡。',
    noguestbook: '這間房沒有開簽名簿。', badsticker: '這個貼圖不能用。', self: '這是你自己的房間。'
  };
  var STROKE_FAIL = { host_once: '今天已經摸過這間的小精靈了。', nospirit: '這間房沒有小精靈。', visitfirst: '先進到房間裡才能摸。', self: '這是你自己的房間。' };
  var TAB_DEFS = [['team', '隊友'], ['all', '所有人'], ['rec', '推薦'], ['visited', '我去過的']];

  /* 今日剩餘次數（由 WalkStore.state() 推出，不另外存） */
  function dailyBucket(opts) {
    var S = store(), st = S ? S.state() : null, d = st && st.shop ? st.shop.daily : null, t = dateStr(nowOf(opts));
    return isObj(d) && isObj(d[t]) ? d[t] : {};
  }
  function footprintLeft(opts) { return Math.max(0, num(opts.footprintHostsDaily, FOOTPRINT_HOSTS) - keysOf(dailyBucket(opts).fp).length); }

  function mountStreet(container, opts) {
    var scope = makeScope(), S = store(), rootEl, tabsEl, listEl, detailEl, tab = 'team', token = 0, dead = false, detail = null, tabBtns = {};
    opts = opts || {};
    if (!S || !root.document) return null;
    ensureCss();
    rootEl = el('div', { cls: 'wr wr-street' });
    tabsEl = el('div', { cls: 'wr-tabs', role: 'tablist' });
    listEl = el('div', { cls: 'wr-list' });
    detailEl = el('div', { cls: 'wr-detail' });
    detailEl.style.display = 'none';
    rootEl.appendChild(tabsEl); rootEl.appendChild(listEl); rootEl.appendChild(detailEl);
    container.appendChild(rootEl);
    function syncTheme() { if (isDark()) addCls(rootEl, 'wr-dk'); else rmCls(rootEl, 'wr-dk'); }
    syncTheme();

    TAB_DEFS.forEach(function (d) {
      var b = btn(d[1], '', function () { showTab(d[0]); });
      b.setAttribute('role', 'tab');
      tabBtns[d[0]] = b;
      tabsEl.appendChild(b);
    });

    function setTabState() {
      TAB_DEFS.forEach(function (d) {
        tabBtns[d[0]].setAttribute('aria-selected', d[0] === tab ? 'true' : 'false');
        tabBtns[d[0]].setAttribute('aria-pressed', d[0] === tab ? 'true' : 'false');
      });
    }
    function visitedFallback() {
      var v = S.state().dex.visited, ids = keysOf(v);
      ids.sort(function (a, b) { return v[b] - v[a]; });
      return ids.map(function (uid, i) { return { uid: uid, nick: '你去過的房間 ' + (i + 1) }; });
    }
    function showTab(t) {
      var my = ++token;
      tab = t; setTabState(); syncTheme();
      closeDetail();
      clear(listEl);
      listEl.appendChild(el('div', { cls: 'wr-note', text: '載入中…' }));
      function render(list) {
        if (dead || my !== token) return;
        clear(listEl);
        list = isArr(list) ? list.slice(0, 30) : [];
        if (!list.length) { listEl.appendChild(el('div', { cls: 'wr-note', text: '這裡還沒有可以逛的房間。' })); return; }
        list.forEach(function (it) {
          if (!isObj(it) || !it.uid) return;
          var bits = [String(it.nick || '無名旅人').slice(0, 12)];
          if (typeof it.dexPct === 'number') bits.push('圖鑑 ' + it.dexPct + '%');
          if (typeof it.n === 'number') bits.push('小精靈 ' + it.n + ' 隻');
          listEl.appendChild(btn(bits.join('・'), 'wr-item', function () { openRoom(it.uid, it); }));
        });
      }
      if (typeof opts.listRooms === 'function') {
        try { opts.listRooms(t, render); } catch (e) { render([]); }
      } else if (t === 'visited') render(visitedFallback());
      else render([]);
    }
    function closeDetail() {
      if (detail) { detail.destroy(); detail = null; }
      clear(detailEl); detailEl.style.display = 'none'; listEl.style.display = ''; tabsEl.style.display = '';
    }
    function openRoom(uid, summary) {
      var my = ++token, done = false;
      function got(res) {
        if (done || dead || my !== token) return;
        done = true;
        if (!res || !res.ok) {
          clear(detailEl); detailEl.style.display = '';
          detailEl.appendChild(el('div', { cls: 'wr-panel', text: VISIT_FAIL[res && res.reason] || '這間房暫時不開放。' }));
          detailEl.appendChild(btn('回到房間街', '', function () { closeDetail(); }));
          return;
        }
        showDetail(uid, res.snap, summary);
      }
      S.visit(uid, got);
    }
    function showDetail(uid, snap, summary) {
      var child, msg, fpRow, info, strokeBtn, spirits, w = windowText(snap.window, nowOf(opts)), nick = String((snap && snap.nick) || (summary && summary.nick) || '無名旅人').slice(0, 12);
      closeDetail();
      listEl.style.display = 'none'; tabsEl.style.display = 'none'; detailEl.style.display = '';
      detailEl.appendChild(btn('回到房間街', '', function () { closeDetail(); }));
      detailEl.appendChild(el('h3', { text: nick + ' 的房間' }));
      var chips = el('div', {});
      chips.appendChild(el('span', { cls: 'wr-chip', text: '造型 ' + (snap.skin === null || snap.skin === undefined ? '—' : (typeof opts.skinLabel === 'function' ? opts.skinLabel(snap.skin) : snap.skin)) }));
      chips.appendChild(el('span', { cls: 'wr-chip', text: '圖鑑 ' + num(snap.dexPct) + '%' }));
      chips.appendChild(el('span', { cls: 'wr-chip', text: '窗外：' + w }));
      (isArr(snap.badges) ? snap.badges : []).slice(0, 12).forEach(function (b) {
        chips.appendChild(el('span', { cls: 'wr-chip', text: '🏅 ' + String(typeof opts.badgeName === 'function' ? opts.badgeName(b) : b).slice(0, 12) }));
      });
      detailEl.appendChild(chips);
      msg = el('div', { cls: 'wr-msg', role: 'status', 'aria-live': 'polite' });
      var sub = makeScope();
      child = createView(detailEl, {
        opts: opts, scope: sub, seed: uid, readOnly: true, label: nick + ' 的房間',
        getSpots: function () { return isObj(snap.spots) ? snap.spots : {}; },
        getWindow: function () { return snap.window || 'auto'; },
        getSpirits: function () { return (isArr(snap.spirits) ? snap.spirits : []).slice(0, 3).map(function (s) { return { id: s && s.id, stage: s && s.stage, vigor: HIGH_VIGOR, pers: s && (s.pers !== undefined ? s.pers : s.personality), form: s && s.form }; }); },
        getEggs: function () { return 0; },
        onTheme: function (dk) { if (dk) addCls(rootEl, 'wr-dk'); else rmCls(rootEl, 'wr-dk'); },
        onSpiritTap: function () { return doStroke(); },
        say: function (m) { msg.textContent = m; }
      });
      detail = { destroy: function () { sub.cleanup(); child.destroy(); }, view: child, uid: uid, scope: sub };
      child.start();
      spirits = (isArr(snap.spirits) ? snap.spirits : []).slice(0, 3);
      var sline = spirits.map(function (s) {
        var d = spiritDef(s && s.id);
        return ((d && d.name) || '小精靈') + '（' + (STAGE_LABEL[s && s.stage] || '幼體') + '）';
      }).join('、');
      detailEl.appendChild(el('div', { cls: 'wr-note', text: spirits.length ? '陪著的小精靈：' + sline : '這間房現在沒有小精靈。' }));
      detailEl.appendChild(msg);
      info = el('div', { cls: 'wr-note' });
      fpRow = el('div', { cls: 'wr-row' });
      STICKERS.forEach(function (code) {
        var b = btn(STICKER_LABEL[code], '', function () {
          var r = S.footprint(uid, code);
          msg.textContent = r.ok ? '已留下足跡：' + STICKER_LABEL[code] : (FP_FAIL[r.reason] || '現在留不了足跡。');
          refreshInfo();
        });
        fpRow.appendChild(b);
      });
      strokeBtn = btn('摸摸牠們', '', function () { var r = doStroke(); msg.textContent = r.msg || ''; });
      detailEl.appendChild(el('div', { cls: 'wr-note', text: '只能留固定貼圖，沒有文字輸入。' }));
      detailEl.appendChild(fpRow);
      detailEl.appendChild(strokeBtn);
      detailEl.appendChild(info);
      function doStroke() {
        var r = S.stroke(uid), name;
        refreshInfo();
        if (r.ok) {
          name = r.reward ? foodName(r.reward) : '';
          return { float: '摸摸', msg: '牠很開心！' + (name ? '你得到一份小點心：' + name + '。' : '') };
        }
        return { float: null, msg: STROKE_FAIL[r.reason] || '現在摸不到。' };
      }
      function refreshInfo() {
        var b = dailyBucket(opts), fp = isObj(b.fp) ? b.fp : {}, st = isObj(b.strokes) ? b.strokes : {};
        info.textContent = '今天還能留足跡的房間：' + footprintLeft(opts) + ' 間。這間：足跡' + (fp[uid] ? '已留' : '還沒留') + '，摸小精靈' + (st[uid] ? '已摸過' : '還沒摸') + '。';
      }
      refreshInfo();
    }

    showTab('team');
    var inst = {
      root: rootEl, scope: scope, showTab: showTab, openRoom: openRoom,
      currentTab: function () { return tab; },
      detail: function () { return detail; },
      pending: function () { var p = scope.pending(); if (detail) { var q = detail.scope.pending(); p.timers += q.timers; p.listeners += q.listeners; p.raf += q.raf; } return p; },
      unmount: function () {
        if (dead) return;
        dead = true;
        closeDetail();
        scope.cleanup();
        if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
        releaseCss();
      }
    };
    return inst;
  }

  /* ------------------------------------------------------------------ 對外 */
  var WalkRoom = {
    VERSION: 1,
    mount: mount,
    mountStreet: mountStreet,
    SPOTS: SPOT_IDS,
    /* 小精靈目前的行為文字（房間畫面開著時才有；沒有就回 null）與今天收到的小禮物 */
    stateOf: function (id) { return STATE_REG[id] ? STATE_REG[id].state : null; },
    stateText: function (id) { return STATE_REG[id] ? STATE_REG[id].text : null; },
    lastGift: function () { return GIFT_REG; },
    STATE_TEXT: STATE_TEXT,
    /* 純邏輯（單元測試用，不屬於穩定介面） */
    _logic: {
      DEFAULT_LAYOUT: DEFAULT_LAYOUT, getLayout: getLayout, buildGrid: buildGrid, bfsNext: bfsNext, newWalker: newWalker, stepWalker: stepWalker,
      canPlace: canPlace, itemKind: itemKind, spotType: spotType, skyPhase: skyPhase, resolveWindow: resolveWindow, windowText: windowText,
      stepBehavior: stepBehavior, stepLegacy: stepLegacy, stateWeights: stateWeights, pickState: pickState, enterState: enterState, pickLine: pickLine, archOf: archOf,
      behCfg: behCfg, stateTextOf: stateTextOf, DEF_LINES: DEF_LINES, STATE_NAMES: STATE_NAMES, AWAY_MS: AWAY_MS,
      mulberry32: mulberry32, hashStr: hashStr, LOW_VIGOR: LOW_VIGOR, HIGH_VIGOR: HIGH_VIGOR, FRAME_MS: FRAME_MS, footprintLeft: footprintLeft
    }
  };
  root.WalkRoom = WalkRoom;
  if (typeof module !== 'undefined' && module.exports) module.exports = WalkRoom;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
