/* 走讀遊戲：商店畫面 WalkShopUI（家具鋪、食材舖、玩具與用品、造型屋、蛋鋪、收藏換物所、老闆任務板）。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md；SHOP_ROOM_LIFE_1029.md 第 3 節；資料來自 WALK_SHOP（js/walk_data_shop.js）。
   ES5 風格 IIFE，掛 window.WalkShopUI。價格、可買狀態、每日上限、新手首購半價一律讀 WalkStore.shop()，購買呼叫 WalkStore.buy()；
   像素圖用 WalkPix 畫在 canvas（整數放大），不載入圖檔。購買用頁內兩段式確認（第一次按變「再按一次確認」，6 秒復原），
   沒有輪詢、沒有 setInterval、沒有 alert／confirm／prompt。手機優先：點擊區 ≥44px、字 ≥12px；深色：html.dk → .ws-dk。
   mount(container, opts) 回傳 { unmount() }。
   opts（皆可省略）：
     store            WalkStore 實例（預設 window.WalkStore）
     uid              玩家 id（老闆任務板的本機備援用）
     now()            毫秒時間（預設 Date.now）
     chaptersDone()   已完成章節數或陣列（蛋鋪「普通蛋」要有完成章節才能買）
     canBuy(item)     回傳字串＝不能買的原因（停用按鈕並顯示該文字）
     shards()         情報碎屑數量（數字或 {類別:數量}）；WalkStore.shards() 存在時優先
     exchange(id)     兌換（回傳 {ok, reason}）；WalkStore.exchange(id) 存在時優先
     board            { list() → [{id,text,n,progress,done,claimed,reward}], claim(id) → {ok} }；WalkStore.board()／claimBoard(id) 存在時優先
     addPoints(n)     任務板發點數用（備援實作需要）
     onBought(item, res)  買成功後通知
     onOpenRoom()     「去房間擺擺看」按鈕 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ 常數 */
  var CONFIRM_MS = 6000;
  var ZONES_FALLBACK = ['furniture', 'food', 'toys', 'looks', 'eggs', 'exchange', 'board'];
  var ZONE_NAME_FALLBACK = { furniture: '家具鋪', food: '食材舖', toys: '玩具與用品', looks: '造型屋', eggs: '蛋鋪', exchange: '收藏換物所', board: '老闆任務板' };
  var ZONE_ICON = { furniture: '🪑', food: '🍡', toys: '🧶', looks: '🎭', eggs: '🥚', exchange: '♻️', board: '📋' };
  var RAR = {
    '普通': { shape: 'circle', glyph: '●', label: '普通' },
    '稀有': { shape: 'diamond', glyph: '◆', label: '稀有' },
    '傳說': { shape: 'star', glyph: '★', label: '傳說' }
  };
  var SPOT_TITLE = { wall: '牆飾', floor: '地面', window: '窗景' };
  var DAY_CAP_TEXT = { furniture: '家具一天最多買 3 件，明天再來。', food: '食材一天最多買 10 份，明天再來。' };

  /* ------------------------------------------------------------------ 小工具 */
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function isObj(x) { return x !== null && typeof x === 'object' && !isArr(x); }
  function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); }
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
  function add(parent) { var i; for (i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function clear(n) { n.textContent = ''; }
  function addCls(n, c) { if ((' ' + n.className + ' ').indexOf(' ' + c + ' ') < 0) n.className = (n.className ? n.className + ' ' : '') + c; }
  function rmCls(n, c) { n.className = (' ' + n.className + ' ').split(' ' + c + ' ').join(' ').replace(/^\s+|\s+$/g, ''); }
  function isDark() {
    var d = doc(), re = /(^|\s)dk(\s|$)/;
    return re.test((d.documentElement && d.documentElement.className) || '') || re.test((d.body && d.body.className) || '');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function hash(s) { var h = 5381, i; s = String(s); for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h; }
  function lsGet(k) { try { return root.localStorage ? root.localStorage.getItem(k) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { if (root.localStorage) root.localStorage.setItem(k, v); } catch (e) { /* 忽略 */ } }

  var CSS = '.ws{--ws-bg:var(--card,#fffaf2);--ws-fg:var(--fg,#3b3350);--ws-mute:var(--mute,#6c6254);--ws-line:var(--line,#ddd2bd);--ws-acc:var(--acc,#b8402a);--ws-chip:var(--chip,#efe6d2);color:var(--ws-fg);font-size:14px;line-height:1.5}' +
    '.ws.ws-dk{--ws-bg:var(--card,#161d23);--ws-fg:var(--fg,#e8e4da);--ws-mute:var(--mute,#9aa6b0);--ws-line:var(--line,#2c3943);--ws-acc:var(--acc,#e0705a);--ws-chip:var(--chip,#26323b)}' +
    '.ws h2{margin:6px 0;font-size:18px}.ws h3{margin:10px 0 4px;font-size:15px}' +
    '.ws-tabs,.ws-bar{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}' +
    '.ws-btn{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid var(--ws-line);border-radius:10px;background:var(--ws-bg);color:var(--ws-fg);font-size:14px;cursor:pointer}' +
    '.ws-btn[aria-pressed=true]{border-color:var(--ws-acc);font-weight:700;background:var(--ws-chip)}' +
    '.ws-btn:disabled{opacity:.55;cursor:default}.ws-btn.ws-armed{border-color:var(--ws-acc);background:var(--ws-acc);color:#fff;opacity:1}' +
    '.ws-panel,.ws-item{border:1px solid var(--ws-line);border-radius:10px;background:var(--ws-bg);padding:10px 12px;margin:8px 0}' +
    '.ws-item{display:flex;gap:10px;align-items:flex-start}.ws-main{flex:1;min-width:0}' +
    '.ws-pic{flex:none;width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;font-size:30px}' +
    '.ws-px{image-rendering:pixelated;image-rendering:crisp-edges;display:block}.ws-pxsil{opacity:.7}' +
    '.ws-note{font-size:12px;color:var(--ws-mute);margin:2px 0}.ws-msg{min-height:20px;font-size:13px;font-weight:700;margin:6px 0}' +
    '.ws-price{font-weight:700}.ws-half{display:inline-block;font-size:12px;padding:1px 8px;border-radius:99px;background:var(--ws-chip);margin-left:6px}' +
    '.ws-rar{display:inline-block;font-size:12px;padding:1px 8px;border-radius:99px;background:var(--ws-chip);margin-left:6px}' +
    '.ws-cond{font-size:13px;border-left:3px solid var(--ws-acc);padding-left:8px;margin:4px 0}' +
    '.ws-swatch{display:inline-block;width:20px;height:20px;border:1px solid var(--ws-line);border-radius:4px}' +
    '.ws-done{font-weight:700;color:var(--ws-acc)}.ws-why{font-size:12px;color:var(--ws-mute);margin:2px 0}';
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
  function pixCanvas(sp, scale, label) {
    var P = root.WalkPix, cv, sc = scale || 3;
    if (!sp || !sp.rows || !P || typeof P.toCanvas !== 'function') return null;
    cv = P.toCanvas(sp.rows, sp.pal, sc);
    if (!cv) return null;
    cv.className = 'ws-px';
    cv.style.width = ((sp.w || 16) * sc) + 'px';
    cv.style.height = ((sp.h || 16) * sc) + 'px';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', label || '');
    return cv;
  }

  /* ------------------------------------------------------------------ 資料 */
  function shopData() { return isObj(root.WALK_SHOP) ? root.WALK_SHOP : {}; }
  function arr(k) { var d = shopData()[k]; return isArr(d) ? d.filter(isObj) : []; }
  function listBy(globalName) {
    var d = root[globalName];
    if (isObj(d) && isArr(d.items)) d = d.items;
    return isArr(d) ? d.filter(isObj) : [];
  }
  function byId(list, id) { var i; for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function zoneOrder() { var z = shopData().zoneOrder; return isArr(z) && z.length ? z : ZONES_FALLBACK; }
  function zoneName(z) { var d = shopData().zones; return (isObj(d) && isObj(d[z]) && d[z].name) || ZONE_NAME_FALLBACK[z] || z; }
  function zoneDesc(z) { var d = shopData().zones; return isObj(d) && isObj(d[z]) ? (d[z].desc || '') : ''; }
  /* 與 WalkStore 的 itemGroup 同判斷：家具／食材有每日上限 */
  function groupOf(it) {
    var c = String(it.cat || it.kind || it.type || it.category || '');
    if (/furn|家具|套裝|suit|set/i.test(c)) return 'furniture';
    if (/food|食|snack|點心/i.test(c)) return 'food';
    return null;
  }
  function rarOf(r) { return RAR[r] || RAR['普通']; }
  /* 食材與玩具的圖、說明在 WALK_FOODS／WALK_TOYS；商店目錄只有 id、價格 */
  function enrich(it) {
    var o = {}, k, ref = null;
    if (it.ref === 'WALK_FOODS') ref = byId(listBy('WALK_FOODS'), it.id);
    else if (it.ref === 'WALK_TOYS') ref = byId(listBy('WALK_TOYS'), it.id);
    if (ref) for (k in ref) if (Object.prototype.hasOwnProperty.call(ref, k)) o[k] = ref[k];
    for (k in it) if (Object.prototype.hasOwnProperty.call(it, k)) o[k] = it[k];
    return o;
  }
  function eggSprite(id, it) {
    var e = root.WALK_SPIRIT_EGGS, pool;
    if (id !== 'egg_common' || !isObj(e)) return null;
    if (e.common) return e.common;                          /* 舊資料：共用普通蛋 */
    pool = it && Array.isArray(it.pool) ? it.pool : [];
    return pool.length && e[pool[0]] ? e[pool[0]] : null;   /* 每種各有自己的蛋：商店示意圖取池中第一種 */
  }
  function dayKeyBoard(uid) { return 'walkshopui_board_' + (uid || 'anon'); }

  /* 老闆任務板的本機備援（WalkStore.board／opts.board 都沒有時用）：每天從任務池挑 perDay 個，進度存 localStorage。 */
  function boardPool() { var b = shopData().board; return isObj(b) && isArr(b.pool) ? b.pool.filter(isObj) : []; }
  function boardPerDay() { var b = shopData().board; return isObj(b) ? num(b.perDay, 3) : 3; }
  function pickToday(uid, ts) {
    var d = dateStr(ts), pool = boardPool().slice();
    pool.sort(function (a, b) { return hash(d + '|' + uid + '|' + a.id) - hash(d + '|' + uid + '|' + b.id); });
    return pool.slice(0, boardPerDay());
  }
  function loadRec(uid, ts) {
    var raw = lsGet(dayKeyBoard(uid)), rec = null, d = dateStr(ts);
    if (raw) { try { rec = JSON.parse(raw); } catch (e) { rec = null; } }
    if (!isObj(rec) || rec.date !== d) rec = { date: d, p: {}, c: {} };
    if (!isObj(rec.p)) rec.p = {};
    if (!isObj(rec.c)) rec.c = {};
    return rec;
  }
  var lastUid = 'anon';
  /* 主線在發生事件時呼叫：WalkShopUI.report('arrive', 1, uid)。只動今天挑中的任務。 */
  function report(event, n, uid, ts) {
    var u = uid || lastUid, t = ts === undefined ? Date.now() : ts, rec = loadRec(u, t);
    pickToday(u, t).forEach(function (q) {
      if (q.event !== event || rec.c[q.id]) return;
      rec.p[q.id] = Math.min(num(q.n, 1), num(rec.p[q.id]) + num(n, 1));
    });
    lsSet(dayKeyBoard(u), JSON.stringify(rec));
    return rec;
  }

  /* ------------------------------------------------------------------ mount */
  function mount(container, opts) {
    opts = opts || {};
    var store = opts.store || root.WalkStore;
    var uid = opts.uid || 'anon';
    var rootEl = el('div', { cls: 'ws' });
    var zones = zoneOrder();
    var tab = zones[0];
    var armed = null, armT = 0;
    var msg = '';
    var dead = false;
    var S, SH, MAP;

    lastUid = uid;
    ensureCss();
    container.appendChild(rootEl);
    function onStore() { if (!dead) render(); }
    if (store && typeof store.on === 'function') store.on(onStore);

    function nowMs() { return typeof opts.now === 'function' ? opts.now() : Date.now(); }
    function disarm() { if (armT) { clearTimeout(armT); armT = 0; } armed = null; }
    function arm(id) {
      disarm();
      armed = id;
      armT = setTimeout(function () { armT = 0; armed = null; if (!dead) render(); }, CONFIRM_MS);
    }

    function btn(label, cls, fn) {
      var b = el('button', { cls: 'ws-btn' + (cls ? ' ' + cls : ''), type: 'button', text: label });
      if (fn) b.addEventListener('click', function () { if (b.disabled) return; fn(b); });
      return b;
    }
    function rarChip(r) {
      var d = rarOf(r);
      return el('span', { cls: 'ws-rar ws-rar-' + d.shape, text: d.glyph + ' ' + d.label, attrs: { 'data-shape': d.shape, 'aria-label': '稀有度：' + d.label } });
    }

    /* ---- 圖 */
    function picOf(it) {
      var pic = el('div', { cls: 'ws-pic' }), cv, sp = it.sprite || eggSprite(it.id, it), sw;
      cv = sp ? pixCanvas(sp, 3, it.name) : null;
      if (cv) { add(pic, cv); return pic; }
      if (it.theme && isArr(it.colors)) {
        sw = el('span', { cls: 'ws-swatch', attrs: { 'aria-hidden': 'true' } });
        sw.style.background = it.colors[0];
        add(pic, sw);
        sw = el('span', { cls: 'ws-swatch', attrs: { 'aria-hidden': 'true' } });
        sw.style.background = it.colors[1];
        add(pic, sw);
        return pic;
      }
      pic.textContent = it.emoji || (it.id === 'egg_speedup' ? '⏩' : (ZONE_ICON[tab] || '🎁'));
      pic.setAttribute('aria-hidden', 'true');
      return pic;
    }

    /* ---- 為什麼不能買 */
    function owned(it) { return num(S.shop.owned[it.id]); }
    /* 集滿＝每件成員都在 owned 裡（買套裝時 store 把可購買的成員逐件放進 owned，稀有成員要另外取得） */
    function setDone(set) {
      return isArr(set.items) && set.items.length > 0 && set.items.every(function (id) { return num(S.shop.owned[id]) >= 1; });
    }
    function setBought(set) {
      var b = (set.items || []).filter(function (id) { var f = byId(arr('furniture'), id); return !f || !f.noBuy; });
      return b.length > 0 && b.every(function (id) { return num(S.shop.owned[id]) >= 1; });
    }
    function blocker(it) {
      var m = MAP[it.id], g = groupOf(it), extra, n, cd;
      if (it.cat === '造型' && owned(it) >= 1) return { short: '已經有了', why: '這一款你已經有了。' };
      if (it.cat === '套裝' && setDone(it)) return { short: '已集滿', why: '這一套你已經集滿了。' };
      if (it.cat === '套裝' && setBought(it)) return { short: '已買過', why: '這一套能買的都在你手上了，其餘的要靠取得條件。' };
      if (typeof opts.canBuy === 'function') { extra = opts.canBuy(it); if (typeof extra === 'string' && extra) return { short: '現在不能買', why: extra }; }
      if (it.needChapterDone && typeof opts.chaptersDone === 'function') {
        cd = opts.chaptersDone(); n = isArr(cd) ? cd.length : num(cd);
        if (n < 1) return { short: '先完成章節', why: '蛋鋪只賣你完成過章節的蛋，先去完成一個章節吧。' };
      }
      if (m && !m.canBuy) {
        if (m.reason === 'nopoints') return { short: '點數不夠', why: '還差 ' + Math.max(1, m.finalPrice - SH.points) + ' 點。' };
        if (m.reason === 'daily_cap') return { short: '今天買夠了', why: DAY_CAP_TEXT[g] || '今天買夠了，明天再來。' };
        if (m.reason === 'rare_locked') return { short: '買不到', why: '這個要達成條件才拿得到，不能用點數買。' };
        if (m.reason === 'not_for_sale') return { short: '非賣品', why: '這個不在店裡賣。' };
        return { short: '現在不能買', why: '現在買不了，晚點再試。' };
      }
      return null;
    }

    /* ---- 購買 */
    function buy(it) {
      var res, name = it.name;
      disarm();
      res = store.buy(it.id);
      if (res && res.ok) {
        msg = '買好了「' + name + '」！' + (res.firstBuyDiscount ? '（新手首購半價）' : '') + '還剩 ' + store.shop().points + ' 點。';
        if (typeof opts.onBought === 'function') { try { opts.onBought(it, res); } catch (e) { /* 忽略 */ } }
      } else {
        msg = reasonMsg(res && res.reason, res);
      }
      render();
    }
    function reasonMsg(r, res) {
      if (r === 'nopoints') return '點數不夠' + (res && res.price ? '（需要 ' + res.price + ' 點）' : '') + '。';
      if (r === 'daily_cap') return '今天買夠了，明天再來。';
      if (r === 'rare_locked') return '這個要達成條件才拿得到。';
      if (r === 'not_for_sale') return '這個不在店裡賣。';
      return '現在買不了，晚點再試。';
    }

    /* ---- 單一商品列 */
    function itemRow(it, o) {
      var m = MAP[it.id], g = groupOf(it), row, main, blk, b, price, line, left, half;
      o = o || {};
      row = el('div', { cls: 'ws-item', attrs: { 'data-id': it.id, 'data-zone': tab } });
      add(row, picOf(it));
      main = el('div', { cls: 'ws-main' });
      line = el('div');
      add(line, el('b', { cls: 'ws-name', text: it.name }));
      if (it.rarity && it.rarity !== '普通') add(line, rarChip(it.rarity));
      add(main, line);
      if (it.desc) add(main, el('div', { cls: 'ws-note ws-desc', text: it.desc }));
      if (o.extra) add(main, el('div', { cls: 'ws-note', text: o.extra }));
      add(main, el('div', { cls: 'ws-note ws-owned', text: '持有 ' + owned(it) }));
      if (g) {
        left = Math.max(0, SH.daily[g].max - SH.daily[g].used);
        add(main, el('div', { cls: 'ws-note ws-left', text: '今天還能買 ' + left + (g === 'food' ? ' 份' : ' 件') }));
      }
      if (it.noBuy) {
        add(main, el('div', { cls: 'ws-cond', text: '取得條件：' + (it.cond || '達成條件後取得') }));
        if (owned(it) >= 1) add(main, el('div', { cls: 'ws-done', text: '✓ 已經擁有' }));
        add(row, main);
        return row;
      }
      price = m ? m.finalPrice : num(it.price);
      half = m && SH.firstBuyAvailable && m.finalPrice < m.price;
      line = el('div');
      add(line, el('span', { cls: 'ws-price', text: price + ' 點' }));
      if (half) add(line, el('span', { cls: 'ws-half', text: '新手首購半價（原價 ' + m.price + ' 點）' }));
      add(main, line);
      blk = blocker(it);
      if (blk) {
        b = btn(blk.short, '', null);
        b.disabled = true;
        b.setAttribute('aria-disabled', 'true');
        add(main, b);
        add(main, el('div', { cls: 'ws-why', text: blk.why }));
      } else {
        b = btn(armed === it.id ? '再按一次確認' : '買（' + price + ' 點）', armed === it.id ? 'ws-armed' : '', function () {
          if (armed !== it.id) { arm(it.id); render(); return; }
          buy(it);
        });
        b.setAttribute('data-act', 'buy');
        add(main, b);
        if (armed === it.id) add(main, el('div', { cls: 'ws-why', text: '6 秒內再按一次才會買。' }));
      }
      add(row, main);
      return row;
    }

    /* ---- 套裝 */
    function setRow(set) {
      var done = setDone(set), got = 0, main, row, names = [], bonus = isObj(set.bonus) ? set.bonus : null, b = null, blk, price, m = MAP[set.id], half, line;
      (set.items || []).forEach(function (id) { var f = byId(arr('furniture'), id); if (num(S.shop.owned[id]) >= 1) got++; names.push((num(S.shop.owned[id]) >= 1 ? '✓ ' : '・') + (f ? f.name : id)); });
      row = el('div', { cls: 'ws-item ws-set', attrs: { 'data-id': set.id, 'data-zone': tab, 'data-complete': done ? '1' : '0' } });
      add(row, el('div', { cls: 'ws-pic', text: '🎁', attrs: { 'aria-hidden': 'true' } }));
      main = el('div', { cls: 'ws-main' });
      add(main, el('b', { cls: 'ws-name', text: '套裝・' + set.name }));
      if (set.desc) add(main, el('div', { cls: 'ws-note ws-desc', text: set.desc }));
      add(main, el('div', { cls: 'ws-note ws-setprog', text: '集到 ' + got + '／' + (set.items || []).length + ' 件：' + names.join(' ') }));
      if (bonus) add(main, el('div', { cls: 'ws-cond ws-bonus' + (done ? ' ws-on' : ''), text: (done ? '集滿加成「' : '集滿會有「') + bonus.name + '」：' + (bonus.desc || '') }));
      if (done) add(main, el('div', { cls: 'ws-done', text: '✓ 這一套集滿了' }));
      price = m ? m.finalPrice : num(set.bundlePrice !== undefined ? set.bundlePrice : set.price);
      half = m && SH.firstBuyAvailable && m.finalPrice < m.price;
      line = el('div');
      add(line, el('span', { cls: 'ws-price', text: '整套 ' + price + ' 點' }));
      if (half) add(line, el('span', { cls: 'ws-half', text: '新手首購半價（原價 ' + m.price + ' 點）' }));
      add(main, line);
      blk = blocker(set);
      if (blk) {
        b = btn(blk.short, '', null);
        b.disabled = true;
        b.setAttribute('aria-disabled', 'true');
        add(main, b);
        add(main, el('div', { cls: 'ws-why', text: blk.why }));
      } else {
        b = btn(armed === set.id ? '再按一次確認' : '整套買（' + price + ' 點）', armed === set.id ? 'ws-armed' : '', function () {
          if (armed !== set.id) { arm(set.id); render(); return; }
          buy(set);
        });
        b.setAttribute('data-act', 'buy');
        add(main, b);
      }
      add(row, main);
      return row;
    }

    /* ---- 收藏換物所 */
    function shardTotal() {
      var v, k, n = 0;
      if (store && typeof store.shards === 'function') v = store.shards(); else if (typeof opts.shards === 'function') v = opts.shards(); else v = 0;
      if (isObj(v)) { for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) n += num(v[k]); return { total: n, by: v }; }
      return { total: num(v), by: null };
    }
    function canExchange() { return (store && typeof store.exchange === 'function') || typeof opts.exchange === 'function'; }
    function doExchange(id) {
      var res;
      disarm();
      if (store && typeof store.exchange === 'function') res = store.exchange(id);
      else if (typeof opts.exchange === 'function') res = opts.exchange(id);
      msg = res && res.ok ? '換好了！' : '現在換不了，晚點再試。';
      render();
    }
    function exchangeRow(label, pic, cost, id, doneFlag, desc, haveN) {
      var row = el('div', { cls: 'ws-item', attrs: { 'data-id': id, 'data-zone': 'exchange' } }), main = el('div', { cls: 'ws-main' }), sh = shardTotal(), b, why = null;
      if (haveN !== undefined) sh = { total: haveN };
      add(row, pic);
      add(main, el('b', { cls: 'ws-name', text: label }));
      if (desc) add(main, el('div', { cls: 'ws-note', text: desc }));
      add(main, el('div', { cls: 'ws-price', text: '要 ' + cost + ' 張碎屑' }));
      if (doneFlag) why = ['已經有了', '這一件你已經換過了。'];
      else if (sh.total < cost) why = ['碎屑不夠', '你有 ' + sh.total + ' 張，還差 ' + (cost - sh.total) + ' 張。'];
      else if (!canExchange()) why = ['還不能換', '兌換的窗口還沒開。'];
      if (why) {
        b = btn(why[0], '', null);
        b.disabled = true;
        b.setAttribute('aria-disabled', 'true');
        add(main, b);
        add(main, el('div', { cls: 'ws-why', text: why[1] }));
      } else {
        b = btn(armed === id ? '再按一次確認' : '換（' + cost + ' 張）', armed === id ? 'ws-armed' : '', function () {
          if (armed !== id) { arm(id); render(); return; }
          doExchange(id);
        });
        b.setAttribute('data-act', 'exchange');
        add(main, b);
      }
      add(row, main);
      return row;
    }
    function renderExchange(box) {
      var ex = isObj(shopData().exchange) ? shopData().exchange : {}, sh = shardTotal(), rate = isObj(ex.rate) ? ex.rate : {}, pan, k, list = [];
      pan = el('div', { cls: 'ws-panel ws-shards' });
      add(pan, el('b', { text: '你的情報碎屑：' + sh.total + ' 張' }));
      if (sh.by) for (k in sh.by) if (Object.prototype.hasOwnProperty.call(sh.by, k)) list.push(k + ' ' + num(sh.by[k]));
      if (list.length) add(pan, el('div', { cls: 'ws-note', text: list.join('、') }));
      add(pan, el('div', { cls: 'ws-note', text: '重複拿到的情報卡會自動變成碎屑：' + num(rate.snack, 3) + ' 張同類碎屑換 1 份該類點心，' + num(rate.furniture, 10) + ' 張換 1 件限定家具。' }));
      add(box, pan);
      add(box, el('h3', { text: '限定家具' }));
      (isArr(ex.furniture) ? ex.furniture : []).forEach(function (id) {
        var f = byId(arr('furniture'), id), it = f ? enrich(f) : { id: id, name: id };
        add(box, exchangeRow(it.name, picOf(it), num(rate.furniture, 10), id, num(S.shop.owned[id]) >= 1, it.desc));
      });
      add(box, el('h3', { text: '點心' }));
      (function () {
        var seen = {};
        listBy('WALK_FOODS').forEach(function (f) {
          var by, haveN;
          if (!f.cat || seen[f.cat]) return;
          seen[f.cat] = 1;
          by = sh.by || {};
          haveN = num(by[f.cat]) + num(by['通用']);
          add(box, exchangeRow(f.cat + '類點心：' + f.name, picOf(f), num(rate.snack, 3), 'snack:' + f.cat, false, '用' + f.cat + '類（或通用）碎屑換 1 份。', haveN));
        });
      })();
      add(box, el('h3', { text: '稱號邊框' }));
      (isArr(ex.frames) ? ex.frames : []).forEach(function (fr) {
        var pic = el('div', { cls: 'ws-pic' }), sw = el('span', { cls: 'ws-swatch', attrs: { 'aria-hidden': 'true' } });
        sw.style.background = fr.color || '#ccc';
        add(pic, sw);
        add(box, exchangeRow(fr.name, pic, num(fr.shards), fr.id, num(S.shop.owned[fr.id]) >= 1, '套在稱號外面的小邊框，純裝飾。'));
      });
    }

    /* ---- 老闆任務板 */
    function boardList() {
      var b, t = nowMs(), rec;
      if (store && typeof store.board === 'function') { b = store.board(); return { tasks: isArr(b) ? b : (b && b.tasks) || [], claim: function (id) { return typeof store.claimBoard === 'function' ? store.claimBoard(id) : { ok: false }; } }; }
      if (isObj(opts.board) && typeof opts.board.list === 'function') return { tasks: opts.board.list() || [], claim: function (id) { return opts.board.claim(id); } };
      rec = loadRec(uid, t);
      return {
        tasks: pickToday(uid, t).map(function (q) {
          var p = num(rec.p[q.id]), n = num(q.n, 1);
          return { id: q.id, text: q.text, n: n, progress: Math.min(p, n), done: p >= n, claimed: !!rec.c[q.id], reward: q.reward };
        }),
        claim: function (id) {
          var q = byId(pickToday(uid, t), id), r = loadRec(uid, t), got = [];
          if (!q) return { ok: false };
          if (r.c[id]) return { ok: false, reason: 'claimed' };
          if (num(r.p[id]) < num(q.n, 1)) return { ok: false, reason: 'notyet' };
          r.c[id] = 1;
          lsSet(dayKeyBoard(uid), JSON.stringify(r));
          if (q.reward && q.reward.points && typeof opts.addPoints === 'function') { opts.addPoints(q.reward.points); got.push('點數 +' + q.reward.points); }
          if (q.reward && q.reward.food && store && typeof store.grant === 'function') {
            store.grant(q.reward.food, 1);
            got.push('「' + ((byId(listBy('WALK_FOODS'), q.reward.food) || {}).name || q.reward.food) + '」×1');
          }
          return { ok: true, got: got };
        }
      };
    }
    function rewardLine(rw) {
      var p = [];
      if (!isObj(rw)) return '';
      if (rw.points) p.push('點數 +' + rw.points);
      if (rw.food) p.push('「' + ((byId(listBy('WALK_FOODS'), rw.food) || {}).name || rw.food) + '」×1');
      return p.join('、');
    }
    function renderBoard(box) {
      var bl = boardList(), tasks = bl.tasks, pan;
      pan = el('div', { cls: 'ws-panel' });
      add(pan, el('div', { cls: 'ws-note', text: '每天 3 個小任務，沒做完也不會累積，明天換新的。' }));
      add(box, pan);
      tasks.forEach(function (q) {
        var row = el('div', { cls: 'ws-item ws-task', attrs: { 'data-id': q.id, 'data-zone': 'board', 'data-state': q.claimed ? 'claimed' : (q.done ? 'ready' : 'doing') } }), main = el('div', { cls: 'ws-main' }), b;
        add(row, el('div', { cls: 'ws-pic', text: q.claimed ? '✅' : '📋', attrs: { 'aria-hidden': 'true' } }));
        add(main, el('b', { cls: 'ws-name', text: q.text }));
        add(main, el('div', { cls: 'ws-note ws-prog', text: '進度 ' + num(q.progress) + '／' + num(q.n, 1) }));
        add(main, el('div', { cls: 'ws-note', text: '獎勵：' + (rewardLine(q.reward) || '（沒有）') }));
        if (q.claimed) add(main, el('div', { cls: 'ws-done', text: '✓ 已完成' }));
        else if (q.done) {
          b = btn('領獎勵', '', function () {
            var r = bl.claim(q.id);
            msg = r && r.ok ? '領到了！' + (isArr(r.got) && r.got.length ? r.got.join('、') : rewardLine(q.reward)) : '現在領不了，晚點再試。';
            render();
          });
          b.setAttribute('data-act', 'claim');
          add(main, b);
        } else {
          b = btn('還沒完成', '', null);
          b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
          add(main, b);
        }
        add(row, main);
        add(box, row);
      });
      if (!tasks.length) add(box, el('div', { cls: 'ws-note', text: '今天的任務還沒準備好。' }));
    }

    /* ---- 各分頁內容 */
    function renderZone(box) {
      var fl, spots, sets, pets;
      if (tab === 'furniture') {
        sets = arr('sets');
        if (sets.length) { add(box, el('h3', { text: '主題套裝' })); sets.forEach(function (s) { add(box, setRow(s)); }); }
        fl = arr('furniture').filter(function (f) { return f.spot !== 'pet'; });
        spots = ['wall', 'floor', 'window'];
        spots.forEach(function (sp) {
          var li = fl.filter(function (f) { return f.spot === sp; });
          if (!li.length) return;
          add(box, el('h3', { text: SPOT_TITLE[sp] }));
          li.forEach(function (f) { add(box, itemRow(enrich(f))); });
        });
        if (typeof opts.onOpenRoom === 'function') add(box, btn('🏠 去房間擺擺看', '', function () { opts.onOpenRoom(); }));
      } else if (tab === 'food') {
        arr('foods').forEach(function (f) { add(box, itemRow(enrich(f))); });
      } else if (tab === 'toys') {
        arr('toys').forEach(function (f) { add(box, itemRow(enrich(f))); });
        pets = arr('furniture').filter(function (f) { return f.spot === 'pet'; });
        if (pets.length) add(box, el('h3', { text: '小精靈的用品' }));
        pets.forEach(function (f) {
          var up = isObj(shopData().nestUpgrade) && shopData().nestUpgrade.to === f.id;
          add(box, itemRow(enrich(f), { extra: up ? '窩的升級款。' : null }));
        });
      } else if (tab === 'looks') {
        arr('looks').forEach(function (f) { add(box, itemRow(enrich(f))); });
      } else if (tab === 'eggs') {
        arr('eggs').forEach(function (f) { add(box, itemRow(enrich(f))); });
        add(box, el('div', { cls: 'ws-note', text: '稀有和傳說的蛋不能用點數買，要靠走讀和圖鑑慢慢拿。' }));
      } else if (tab === 'exchange') {
        renderExchange(box);
      } else if (tab === 'board') {
        renderBoard(box);
      }
    }

    function render() {
      var head, tabs, box, i;
      if (dead) return;
      S = store.state();
      SH = store.shop();
      MAP = {};
      SH.items.forEach(function (x) { MAP[x.id] = x; });
      clear(rootEl);
      if (isDark()) addCls(rootEl, 'ws-dk'); else rmCls(rootEl, 'ws-dk');

      head = el('div', { cls: 'ws-panel' });
      add(head, el('h2', { text: '🏪 商店' }));
      add(head, el('div', { cls: 'ws-points', text: '你有 ' + SH.points + ' 點' }));
      if (SH.firstBuyAvailable) add(head, el('div', { cls: 'ws-note ws-firstbuy', text: '第一次購買半價！' }));
      add(head, el('div', { cls: 'ws-note ws-supply', text: '補給官的折扣只在簡報室採購有用，商店不適用。' }));
      add(rootEl, head);

      tabs = el('div', { cls: 'ws-tabs', attrs: { role: 'tablist' } });
      for (i = 0; i < zones.length; i++) (function (z) {
        var b = btn((ZONE_ICON[z] || '') + ' ' + zoneName(z), '', function () { if (tab !== z) { disarm(); tab = z; msg = ''; render(); } });
        b.setAttribute('aria-pressed', tab === z ? 'true' : 'false');
        b.setAttribute('data-zone', z);
        add(tabs, b);
      })(zones[i]);
      add(rootEl, tabs);

      add(rootEl, el('div', { cls: 'ws-msg', text: msg, attrs: { 'aria-live': 'polite' } }));
      if (zoneDesc(tab)) add(rootEl, el('div', { cls: 'ws-note', text: zoneDesc(tab) }));
      box = el('div', { cls: 'ws-zone', attrs: { 'data-zone': tab } });
      renderZone(box);
      add(rootEl, box);
    }

    if (!store || typeof store.shop !== 'function') add(rootEl, el('div', { cls: 'ws-note', text: '商店還沒準備好，稍後再開。' }));
    else render();

    return {
      unmount: function () {
        if (dead) return;
        dead = true;
        disarm();
        if (store && typeof store.off === 'function') store.off(onStore);
        if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
        releaseCss();
      },
      refresh: function () { if (!dead && store && typeof store.shop === 'function') render(); }
    };
  }

  var WalkShopUI = {
    VERSION: 1,
    mount: mount,
    report: report,
    _logic: { groupOf: groupOf, pickToday: pickToday, enrich: enrich }
  };
  root.WalkShopUI = WalkShopUI;
  if (typeof module !== 'undefined' && module.exports) module.exports = WalkShopUI;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
