/* 走讀遊戲：小精靈畫面 WalkSpiritUI（ES5 IIFE，純 DOM 建構，不用 innerHTML）。
   三個入口：
     mount(container, opts)           小精靈頁：挑起始夥伴、照顧、技能、角色共鳴、聊天、蛋
     mountExpedition(container, opts) 勘察派遣：選小精靈／章節／檔位、倒數、領取情報卡
     mountIntel(container, opts)      情報收件匣：依章節與類別篩選
   都回傳 { refresh(), unmount(), view }。資料與規則一律走 WalkStore（js/walk_store.js），圖用 WalkPix（js/walk_sprites2.js）。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md；SPIRIT_SKILLS_EXPEDITION_1029.md 第 1、2、3、5 節。
   介面守則：手機優先（點擊區 ≥44px、字 ≥12px）；稀有度＝形狀＋文字；所有確認都是頁內兩段式（6 秒復原）；
   不用 alert／confirm／prompt；沒有輪詢，倒數只用單一 setTimeout 鏈，unmount 全部清掉；深色看 html.dk。
   opts（皆可省略）：
     now()            毫秒時間，請和 WalkStore.init 用同一個
     role()           目前探員角色（名稱字串，或 {role, stats, era}）；共鳴與預估都讀它
     chapterId()      目前所在章節（助理技「每章次數」用）
     chapters()       勘察可選的章節 [{id,name}] 或 [id]（應只含已到過／已完成的）；沒給就列情報資料裡有的全部章節
     chapterName(id)  章節名稱
     chat(spiritId, text, cb)  接小精靈聊天通道；cb(回話字串 或 {ok,text})；沒給就用預寫台詞
     online()         聊天通道是否在線（心跳）；沒給且有 chat 時視為在線
     getPoints()      目前點數（孵蛋加速判斷用）
     toast(msg)       頁外提示
     onSkill(spiritId, result)  助理技成功後通知 walk.js 套用效果
     onChoose(spiritId)/onCollect(result)  選起始夥伴、領取情報後的通知
     timers {set,clear}  測試用的計時器；store  測試用的 WalkStore */
(function (root) {
  'use strict';

  var VERSION = 1;
  var CSS_ID = 'wsu-css';
  var CSS = [
    '.wsu{--wsu-card:var(--card,#fffdf7);--wsu-fg:var(--fg,#262019);--wsu-mute:var(--mute,#6c6254);--wsu-line:var(--line,#ddd2bd);--wsu-acc:var(--acc,#b8402a);--wsu-acc2:var(--acc2,#1f6f68);--wsu-chip:var(--chip,#efe6d2);--wsu-warn:#8a4b00;--wsu-warnbg:#fff1d6;color:var(--wsu-fg);font-size:15px;line-height:1.6;max-width:640px;margin:0 auto}',
    ':root.dk .wsu,.wsu.wsu-dk{--wsu-card:var(--card,#161d23);--wsu-fg:var(--fg,#e8e4da);--wsu-mute:var(--mute,#9aa6b0);--wsu-line:var(--line,#2c3943);--wsu-acc:var(--acc,#e0705a);--wsu-acc2:var(--acc2,#4fd1bc);--wsu-chip:var(--chip,#26323b);--wsu-warn:#ffcf70;--wsu-warnbg:#3a2e12}',
    '@media (prefers-color-scheme:dark){:root:not(.lt) .wsu{--wsu-card:var(--card,#161d23);--wsu-fg:var(--fg,#e8e4da);--wsu-mute:var(--mute,#9aa6b0);--wsu-line:var(--line,#2c3943);--wsu-acc:var(--acc,#e0705a);--wsu-acc2:var(--acc2,#4fd1bc);--wsu-chip:var(--chip,#26323b);--wsu-warn:#ffcf70;--wsu-warnbg:#3a2e12}}',
    '.wsu *{box-sizing:border-box}',
    '.wsu-card{background:var(--wsu-card);border:1px solid var(--wsu-line);border-radius:12px;padding:12px;margin:10px 0}',
    '.wsu-h{font-size:16px;font-weight:700;margin:12px 0 4px}',
    '.wsu-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
    '.wsu-head{display:flex;gap:10px;align-items:center}',
    '.wsu-name{font-size:17px;font-weight:700}',
    '.wsu-pix{image-rendering:pixelated;flex:none;background:var(--wsu-chip);border-radius:10px}',
    '.wsu-ph{display:inline-flex;width:64px;height:64px;align-items:center;justify-content:center;background:var(--wsu-chip);border-radius:10px;flex:none}',
    '.wsu-btn,.wsu-chip,.wsu-tab{min-height:44px;min-width:44px;padding:8px 14px;border:1px solid var(--wsu-line);border-radius:10px;background:var(--wsu-chip);color:var(--wsu-fg);font:inherit;font-size:14px;cursor:pointer}',
    '.wsu-btn.main{background:var(--wsu-acc2);color:#fff;border-color:var(--wsu-acc2);font-weight:700}',
    '.wsu-btn[disabled],.wsu-chip[disabled]{opacity:.5;cursor:not-allowed}',
    '.wsu-btn.armed{background:var(--wsu-warnbg);color:var(--wsu-warn);border:2px solid var(--wsu-warn);font-weight:700}',
    '.wsu-chip.on,.wsu-tab.on{border:2px solid var(--wsu-acc);font-weight:700}',
    '.wsu-tabs{display:flex;gap:6px;margin:10px 0 6px;flex-wrap:wrap}',
    '.wsu-rar,.wsu-tag{display:inline-block;font-size:12px;padding:1px 8px;border-radius:99px;border:1px solid var(--wsu-line);background:var(--wsu-chip)}',
    '.wsu-note{font-size:12px;color:var(--wsu-mute);margin:2px 0}',
    '.wsu-msg{border-left:4px solid var(--wsu-acc2);background:var(--wsu-chip);padding:8px 10px;border-radius:8px;margin:8px 0;font-size:14px}',
    '.wsu-msg.warn{border-left-color:var(--wsu-warn);background:var(--wsu-warnbg);color:var(--wsu-warn)}',
    '.wsu-warn{border:1px solid var(--wsu-warn);background:var(--wsu-warnbg);color:var(--wsu-warn);border-radius:8px;padding:6px 10px;font-size:13px;margin:6px 0}',
    '.wsu-bar{height:12px;background:var(--wsu-chip);border:1px solid var(--wsu-line);border-radius:99px;overflow:hidden}',
    '.wsu-bar i{display:block;height:100%;background:var(--wsu-acc2)}',
    '.wsu-quote{font-size:14px;color:var(--wsu-mute);margin:6px 0}',
    '.wsu-sec{border-top:1px dashed var(--wsu-line);margin-top:8px;padding-top:6px}',
    '.wsu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:240px;margin:8px 0}',
    '.wsu-cell{min-height:56px;border:1px solid var(--wsu-line);border-radius:10px;background:var(--wsu-chip);font-size:22px;color:var(--wsu-fg);cursor:pointer}',
    '.wsu-cell.lit{background:var(--wsu-acc);color:#fff;border-color:var(--wsu-acc)}',
    '.wsu-log{max-height:220px;overflow-y:auto;margin:6px 0}',
    '.wsu-bub{border:1px solid var(--wsu-line);border-radius:12px;padding:6px 10px;margin:4px 0;background:var(--wsu-card);font-size:14px}',
    '.wsu-bub.me{background:var(--wsu-chip);margin-left:36px;text-align:right}',
    '.wsu-in{flex:1;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--wsu-line);border-radius:10px;background:var(--wsu-card);color:var(--wsu-fg);font:inherit;font-size:15px}',
    '.wsu-icard{border:1px solid var(--wsu-line);border-radius:10px;padding:8px 10px;margin:6px 0;background:var(--wsu-card)}',
    '.wsu-icard.tbd{border:2px dashed var(--wsu-warn);background:var(--wsu-warnbg)}',
    '.wsu-lv{display:inline-block;font-size:12px;font-weight:700;padding:1px 8px;border-radius:6px;border:1px solid var(--wsu-line)}',
    '.wsu-lv.tbd{color:var(--wsu-warn);border:1px solid var(--wsu-warn)}',
    '.wsu-pick{display:block;width:100%;text-align:left;margin:6px 0}',
    '.wsu-trait{border-top:1px dashed var(--wsu-line);margin-top:8px;padding-top:6px}',
    '.wsu-prog{display:flex;align-items:center;gap:8px;margin:3px 0;font-size:13px}',
    '.wsu-prog .lbl{flex:none;width:6.5em}.wsu-prog .wsu-bar{flex:1}.wsu-prog .num{flex:none;width:3.2em;text-align:right;color:var(--wsu-mute)}',
    '.wsu-prog.lead .lbl{font-weight:700}.wsu-prog.lead .wsu-bar i{background:var(--wsu-acc)}',
    '.wsu-evo{border:2px solid var(--wsu-acc);border-radius:12px;padding:10px 12px;margin:10px 0;background:var(--wsu-chip);animation:wsu-glow 1.2s ease-in-out 3}',
    '.wsu-evo.still{animation:none}',
    '.wsu-spark{display:inline-block;width:8px;height:8px;background:var(--wsu-acc2);margin:0 3px;animation:wsu-blink .5s steps(2) infinite}',
    '.wsu-evo.still .wsu-spark{animation:none}',
    '@keyframes wsu-glow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 18px 6px var(--wsu-acc)}}',
    '@keyframes wsu-blink{50%{opacity:.15}}',
    '@media (prefers-reduced-motion:reduce){.wsu-evo,.wsu-spark{animation:none}}',
    '.wsu-full{display:inline-block;font-size:12px;font-weight:700;padding:1px 8px;border-radius:6px;border:2px solid var(--wsu-acc2);color:var(--wsu-acc2)}'
  ].join('\n');

  var STAGE = { egg: '蛋', baby: '幼體', adult: '成體', awake: '覺醒' };
  var RAR = { '普通': '●', '稀有': '◆', '傳說': '★' };
  var ATTR_GLYPH = { '觀察': '◎', '溝通': '✦', '智識': '▣', '行動': '➤', '守護': '⬢', '全': '✪' };
  var TYPE_ICON = { '史料': '📜', '路況': '🚦', '人物': '🗣', '觀察': '🔍', '彩蛋': '🎁', '方位': '🧭' };
  var TYPES = ['史料', '路況', '人物', '觀察', '彩蛋', '方位'];
  var TIER_DEF = { short: { min: 30, ticks: 1, base: 1, name: '短' }, mid: { min: 60, ticks: 2, base: 2, name: '中' }, long: { min: 120, ticks: 4, base: 3, name: '長' } };
  var TICK_MIN = 30;                       /* 寵物狀態與倒數都以 30 分鐘為一格 */
  var TIER_KEYS = ['short', 'mid', 'long'];
  var ARM_MS = 6000;
  var GAME_MS = 5000, GAME_STEP = 700;
  var LOW_VIGOR = 40;
  var CHAT_MAX = 60, CHAT_IN = 40;
  var DAILY = { feed: 3, play: 3, pet: 5, tidy: 1, chat: 20, rest: 60, dispatch: 3 };

  var WHY = {
    already: '已經選過起始夥伴了', notstarter: '這隻不能當起始夥伴', nodata: '資料還沒準備好，等一下再試',
    nospirit: '找不到這隻小精靈', egg: '蛋還沒孵出來', badslot: '沒有這個位子', onexpedition: '牠正在外面勘察，等牠回來',
    slotfull: '這個位子已經有小精靈了，先把牠換走', nofood: '沒有這種點心', nostock: '背包裡沒有這個點心了',
    daily_cap: '今天這項做滿了', rest_cap: '今天在房間補的活力已經夠多了，帶牠出去走走吧', full: '活力已經是滿的了',
    nopoints: '點數不夠', dup: '已經有同一種小精靈了', notyet: '還沒到時間', noegg: '找不到這顆蛋', locked: '還沒解鎖',
    notfollow: '要先放到隨行位才能用', cooldown: '還在冷卻', chapter_cap: '這一章的次數用完了',
    badtier: '沒有這個檔位', onfollow: '隨行位的小精靈不能去勘察，先換到勘察位', busy: '已經有小精靈在外面勘察了',
    repeat_short: '短檔不能連續派去同一章，換一章或換檔位', nochapter: '這一章還沒有情報', complete: '這一章的情報已經集滿了',
    noexpedition: '現在沒有小精靈在外面', notreleased: '這隻不在圖鑑裡', badpct: '沒有這個進度'
  };

  /* ---------------------------------------------------------------- 小工具 */
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function isObj(x) { return x !== null && typeof x === 'object' && !isArr(x); }
  function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function doc() { return typeof document !== 'undefined' && document && typeof document.createElement === 'function' ? document : null; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtHM(ts) { var d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function tierOf(ctx, k) { var st = ctx.store && ctx.store.TIERS && ctx.store.TIERS[k] ? ctx.store.TIERS[k] : {}, d = TIER_DEF[k] || {}; return { name: d.name, min: num(st.min, d.min), ticks: num(st.ticks, d.ticks), base: num(st.base, d.base) }; }
  function fmtClock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return hh > 0 ? hh + ':' + pad2(mm) + ':' + pad2(ss) : pad2(mm) + ':' + pad2(ss);
  }
  function why(r, ctx) {
    var k = r && r.reason;
    if (k === 'full' && ctx === 'hatch') return '已經養了 3 隻，先送回圖鑑一隻才能孵新的';
    if (k === 'full' && ctx === 'reclaim') return '已經養了 3 隻，先送回圖鑑一隻才能領回';
    return WHY[k] || '這次沒成功，等一下再試';
  }
  /* ---- 性格、形態、進化（規格第 9 節）；資料或 store 缺少時整塊略過 */
  var FORM_NORM = { care: 12, adv: 10, lore: 8 };
  var TREND_LABEL = { care: '陪伴', adv: '冒險', lore: '探索' };
  var TREND_TODO = { care: '餵食、撫摸、玩耍、整理窩', adv: '帶牠隨行出任務、走到新的站、派去勘察', lore: '蒐集情報卡、找隱藏關卡、完成文化→遊戲題' };
  var FURN_LABEL = { floor: '地面家具', wall: '牆飾', window: '窗景', pet: '小精靈用品' };
  var SLOT_STATE = { follow: '陪你出門中', scout: '在勘察位待命' };
  function arrList(x) { return isArr(x) ? x : (isObj(x) && isArr(x.list) ? x.list : []); }
  function formDefOf(fid) {
    var F = root.WALK_FORMS, i;
    if (!fid) return null;
    if (isObj(F) && isObj(F.byId) && F.byId[fid]) return F.byId[fid];
    F = arrList(F);
    for (i = 0; i < F.length; i++) if (F[i] && F[i].id === fid) return F[i];
    return null;
  }
  function toyName(id) { var a = toyList(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i].name || id; return id; }
  function likesText(info) {
    var L = isObj(info.likes) ? info.likes : {}, out = [];
    (isArr(L.furnitureTypes) ? L.furnitureTypes : []).forEach(function (t) { out.push(FURN_LABEL[t] || t); });
    (isArr(L.toys) ? L.toys : []).forEach(function (t) { out.push(toyName(t)); });
    return out.join('、');
  }
  function dislikesText(info) {
    var D = isObj(info.dislikes) ? info.dislikes : {}, out = [];
    if (num(D.petStreak) > 0) out.push('連續摸超過 ' + D.petStreak + ' 次');
    if (D.neglect) out.push('被冷落');
    if (D.text) out.push(String(D.text));
    return out.join('、');
  }
  function reducedMotion(ctx) {
    var o = ctx.opts;
    try { if (typeof o.isSaver === 'function' && o.isSaver()) return true; } catch (e) { /* 忽略 */ }
    try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e2) { return false; }
  }
  /* 目前在做什麼：隨行／勘察位看位子；在房間裡就問房間畫面或 store，都沒有就說「在房間裡」 */
  function behaviorText(ctx, o) {
    var st = ctx.store, t = null, ex;
    if (o.slot === 'follow' || o.slot === 'scout') {
      if (o.slot === 'scout' && typeof st.expedition === 'function') { try { ex = st.expedition(); } catch (e) { ex = null; } if (ex && ex.active && ex.spiritId === o.id) return '在外面勘察'; }
      return SLOT_STATE[o.slot];
    }
    try { if (typeof st.stateOf === 'function') t = st.stateOf(o.id); } catch (e3) { t = null; }
    if (!t && root.WalkRoom && typeof root.WalkRoom.stateText === 'function') t = root.WalkRoom.stateText(o.id);
    return t || '在房間裡';
  }
  function renderTraitBlock(ctx, card, o, def) {
    var st = ctx.store, info = null, cnt = null, finfo = null, box, lead, fid, row, maxN = 0, k, hintTo, gift, nm;
    if (o.stage === 'egg') return;
    try { if (typeof st.personalityInfo === 'function') info = st.personalityInfo(o.id); } catch (e) { info = null; }
    try { if (typeof st.traitCounters === 'function') cnt = st.traitCounters(o.id); } catch (e2) { cnt = null; }
    box = h('div', { class: 'wsu-trait', 'data-role': 'traits', 'data-id': o.id });
    box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'behavior', text: '現在：' + behaviorText(ctx, o) }));
    if (info) {
      box.appendChild(h('div', { class: 'wsu-row' }, [h('span', { class: 'wsu-tag', 'data-role': 'pers', text: (info.icon || '') + ' ' + (info.name || '') + '個性' }), h('span', { class: 'wsu-note', text: info.intro || '' })]));
      if (likesText(info)) box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'likes', text: '最愛：' + likesText(info) }));
      if (dislikesText(info)) box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'dislikes', text: '討厭：' + dislikesText(info) }));
    }
    fid = cnt && cnt.form ? cnt.form : null;
    if (!fid && typeof st.formOf === 'function' && (o.stage === 'adult' || o.stage === 'awake')) { try { fid = st.formOf(o.id); } catch (e3) { fid = null; } }
    if (fid) {
      finfo = formDefOf(fid);
      box.appendChild(h('div', { class: 'wsu-h', 'data-role': 'form', text: (finfo ? (finfo.icon || '') + ' ' + finfo.name : '已定型') }));
      if (finfo && finfo.desc) box.appendChild(h('p', { class: 'wsu-note', text: finfo.desc }));
      if (finfo && isArr(finfo.effect)) finfo.effect.forEach(function (fe) { if (fe && fe.desc) box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'form-effect', text: '・' + fe.desc })); });
    }
    if (cnt) {
      for (k in FORM_NORM) if (Object.prototype.hasOwnProperty.call(FORM_NORM, k)) maxN = Math.max(maxN, num(cnt[k]) / FORM_NORM[k]);
      lead = cnt.lead || null;
      box.appendChild(h('div', { class: 'wsu-note', text: fid ? '養成紀錄（形態已經定下來，不會再變）：' : '長大的方向（成體時，傾向最高的那一種會決定形態）：' }));
      ['care', 'adv', 'lore'].forEach(function (key) {
        var n = num(cnt[key]), pct = Math.max(0, Math.min(100, Math.round(n / FORM_NORM[key] * 100))), fill = h('i');
        fill.style.width = pct + '%';
        row = h('div', { class: 'wsu-prog' + (lead === key ? ' lead' : ''), 'data-role': 'trend', 'data-trend': key }, [
          h('span', { class: 'lbl', text: TREND_LABEL[key] + (lead === key ? '（領先）' : '') }),
          h('div', { class: 'wsu-bar', role: 'img', 'aria-label': TREND_LABEL[key] + ' ' + n }, [fill]),
          h('span', { class: 'num', text: String(n) })
        ]);
        box.appendChild(row);
      });
      if (!fid) {
        if (lead && maxN > 0) {
          hintTo = formDefOf(lead);
          box.appendChild(h('p', { class: 'wsu-note', 'data-role': 'evo-hint', text: '目前領先：' + (hintTo ? hintTo.icon + ' ' + hintTo.name : TREND_LABEL[lead]) + '。再多' + TREND_TODO[lead] + '，就會往' + (hintTo ? hintTo.name : TREND_LABEL[lead] + '型') + '長大。' }));
        } else box.appendChild(h('p', { class: 'wsu-note', 'data-role': 'evo-hint', text: '還看不出方向。多陪牠、帶牠出去走、蒐集情報，牠會慢慢長出自己的樣子。' }));
        if (o.stage === 'baby') box.appendChild(h('p', { class: 'wsu-note', text: '羈絆到 10，牠就會長成成體並定下形態。' }));
      }
    }
    /* 每日小禮物 */
    gift = root.WalkRoom && typeof root.WalkRoom.lastGift === 'function' ? root.WalkRoom.lastGift() : null;
    if (num(o.bond) >= 5) {
      nm = gift && (gift.spirit === undefined || gift.spirit === o.id) ? gift.text : '';
      box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'gift', text: nm ? '🎁 ' + nm : '🎁 羈絆夠了：進房間時，牠每天可能帶一份小禮物給你。' }));
    } else box.appendChild(h('div', { class: 'wsu-note', 'data-role': 'gift', text: '🎁 羈絆到 5，牠就會偶爾帶小禮物給你（現在 ' + num(o.bond) + '）。' }));
    card.appendChild(box);
  }
  /* 進化動畫：光暈與像素閃爍加一句台詞；尊重 prefers-reduced-motion 與省電（只留文字） */
  function playEvolve(ctx, ev) {
    var def, fd, line, key, stg;
    if (!isObj(ev) || ev.id === undefined) return;
    key = ev.id + '>' + ev.to;
    if (ctx.view.evo && ctx.view.evo.key === key) return;
    def = spiritDef(ev.id) || { name: '小精靈' }; fd = formDefOf(ev.form);
    stg = ev.to === 'awake' ? 'awake' : 'adult';
    line = def.stages && def.stages[stg] ? def.stages[stg].line : '';
    ctx.view.evo = { key: key, id: ev.id, name: def.nick || def.name, to: ev.to, form: fd, line: line || (ev.to === 'awake' ? '我覺醒了！' : '我長大了！'), still: reducedMotion(ctx) };
    if (ctx.view.evoH) ctx.cancel(ctx.view.evoH);
    ctx.view.evoH = ctx.after(function () { ctx.view.evo = null; ctx.view.evoH = null; ctx.render(); }, 6000);
    ctx.toast(ctx.view.evo.name + (ev.to === 'awake' ? ' 覺醒了' : ' 長大了'));
  }
  function renderEvolve(ctx, rootEl) {
    var e = ctx.view.evo, kids = [], i;
    if (!e) return;
    if (!e.still) for (i = 0; i < 5; i++) kids.push(h('span', { class: 'wsu-spark', 'aria-hidden': 'true' }));
    rootEl.appendChild(h('div', { class: 'wsu-evo' + (e.still ? ' still' : ''), role: 'status', 'aria-live': 'polite', 'data-role': 'evolve', 'data-id': e.id }, [
      h('div', { class: 'wsu-row' }, kids),
      h('div', { class: 'wsu-name', text: '🌟 ' + e.name + (e.to === 'awake' ? ' 覺醒了！' : ' 長大了！') }),
      e.form ? h('div', { 'data-role': 'evolve-form', text: '長成了 ' + (e.form.icon || '') + ' ' + e.form.name + '。' + (e.form.desc || '') }) : null,
      h('p', { class: 'wsu-quote', text: '「' + e.line + '」' })
    ]));
  }
  /* 學者型：情報卡多一條「再往下查的方向」 */
  function nextHint(c) {
    var lv = levelOf(c);
    if (c.next) return String(c.next);
    if (lv === '待查證') return '找官方網頁或第二個獨立來源，確認這件事是真的。';
    if (lv === '摘要級') return '打開原始頁面讀一遍，或再找一個獨立來源互相對照。';
    return '想想這個出處引用的更早紀錄，原始資料在哪裡。';
  }
  function cut(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

  /* h(標籤, 屬性, 子節點)：class／text／on／disabled 另外處理，data-／aria- 走 setAttribute */
  function h(tag, props, kids) {
    var d = doc(), el = d.createElement(tag), k, v, e;
    if (props) {
      for (k in props) {
        if (!has(props, k)) continue;
        v = props[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = String(v);
        else if (k === 'on') { for (e in v) if (has(v, e)) el.addEventListener(e, v[e]); }
        else if (k === 'disabled') { el.disabled = true; el.setAttribute('aria-disabled', 'true'); }
        else if (k.indexOf('data-') === 0 || k.indexOf('aria-') === 0 || k === 'role' || k === 'title' || k === 'alt' || k === 'for' || k === 'id') el.setAttribute(k, String(v));
        else el[k] = v;
      }
    }
    addKids(el, kids);
    return el;
  }
  function addKids(el, kids) {
    var i;
    if (kids === undefined || kids === null || kids === false) return;
    if (!isArr(kids)) kids = [kids];
    for (i = 0; i < kids.length; i++) {
      if (kids[i] === undefined || kids[i] === null || kids[i] === false) continue;
      if (isArr(kids[i])) addKids(el, kids[i]);
      else if (typeof kids[i] === 'string' || typeof kids[i] === 'number') el.appendChild(doc().createTextNode(String(kids[i])));
      else el.appendChild(kids[i]);
    }
  }
  function clearNode(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function injectCss() {
    var d = doc(), st;
    if (!d || !d.head) return;
    if (d.getElementById && d.getElementById(CSS_ID)) return;
    st = d.createElement('style');
    st.setAttribute('id', CSS_ID);
    st.textContent = CSS;
    d.head.appendChild(st);
  }
  function isDark() {
    var d = doc();
    try { return !!(d && d.documentElement && d.documentElement.classList && d.documentElement.classList.contains('dk')); } catch (e) { return false; }
  }

  /* ---------------------------------------------------------------- 資料來源（純資料檔，缺少時防呆） */
  function listOf(x) { if (isObj(x) && isArr(x.list)) x = x.list; if (isObj(x) && isArr(x.items)) x = x.items; return isArr(x) ? x.filter(isObj) : []; }
  function spiritList() { return listOf(root.WALK_SPIRITS); }
  function spiritDef(id) { var a = spiritList(), i; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function foodList() { return listOf(root.WALK_FOODS); }
  function toyList() { return listOf(root.WALK_TOYS); }
  function meta() { return isObj(root.WALK_SPIRIT_META) ? root.WALK_SPIRIT_META : {}; }
  function cap(key) { var m = meta(); return isObj(m.daily) && typeof m.daily[key] === 'number' ? m.daily[key] : DAILY[key]; }
  function intelDefs() {
    var d = root.WALK_INTEL, out = [], k;
    if (!d) return out;
    if (isObj(d) && isArr(d.cards)) d = d.cards;
    if (isArr(d)) return d.filter(function (c) { return isObj(c) && c.id !== undefined; });
    if (isObj(d)) {
      for (k in d) {
        if (!has(d, k) || !isArr(d[k])) continue;
        d[k].forEach(function (c) { if (isObj(c) && c.id !== undefined) out.push(c.chapter === undefined ? mergeCh(c, k) : c); });
      }
    }
    return out;
  }
  function mergeCh(c, ch) { var o = {}, k; for (k in c) if (has(c, k)) o[k] = c[k]; o.chapter = ch; return o; }
  function intelTotal(ch) { var n = 0; intelDefs().forEach(function (c) { if (String(c.chapter) === String(ch)) n++; }); return n; }
  function normType(t) { return String(t || '').replace(/卡/g, ''); }
  function stageSprite(def, stage) { return def && def.stages && def.stages[stage] ? def.stages[stage].sprite : null; }

  function pixImg(sprite, scale, alt) {
    var url = null, px;
    try { if (root.WalkPix && sprite && sprite.rows) url = root.WalkPix.toDataURL(sprite.rows, sprite.pal, scale); } catch (e) { url = null; }
    if (!url) return h('span', { class: 'wsu-ph', 'aria-hidden': 'true', text: '✦' });
    px = (sprite.w || 16) * scale;
    return h('img', { class: 'wsu-pix', src: url, alt: alt || '', width: px, height: (sprite.h || 16) * scale });
  }
  function rarityBadge(r) {
    r = RAR[r] ? r : '普通';
    return h('span', { class: 'wsu-rar', title: '稀有度：' + r }, [h('span', { 'aria-hidden': 'true', text: RAR[r] }), ' ' + r]);
  }
  function attrBadge(a) { return h('span', { class: 'wsu-tag' }, [h('span', { 'aria-hidden': 'true', text: ATTR_GLYPH[a] || '◎' }), ' ' + (a || '')]); }
  function vigorState(v) { return v >= 80 ? '精神飽滿' : (v >= 50 ? '普通' : (v >= 30 ? '疲憊' : '打盹')); }

  function roleEra(role, ctxRoot) {
    var r = null, A;
    if (isObj(role)) r = role;
    else if (typeof role === 'string' && root.WALK_AGENTS && typeof root.WALK_AGENTS.get === 'function') {
      try { A = root.WALK_AGENTS.get(role); } catch (e) { A = null; }
      if (isObj(A)) r = A;
    }
    if (!r) return null;
    var era = r.era !== undefined ? r.era : (r.eras !== undefined ? r.eras : (r.spec !== undefined ? r.spec : r.specialty));
    if ((era === undefined || era === null) && (r.role || typeof role === 'string') && isObj(root.WALK_AGENT_ERAS)) {   /* 探員歷史專長資料檔 */
      var T = root.WALK_AGENT_ERAS[r.role || role];
      if (isObj(T)) era = T.eras;
    }
    if (era === undefined || era === null || era === '' || (isArr(era) && !era.length)) return null;
    return era;
  }
  /* 探員熟悉的時期（2 級）；沒有資料回傳空陣列 */
  function roleFam(role) {
    var r = null, f, T;
    if (isObj(role)) r = role;
    else if (typeof role === 'string' && root.WALK_AGENTS && typeof root.WALK_AGENTS.get === 'function') { try { r = root.WALK_AGENTS.get(role); } catch (e) { r = null; } }
    f = r && r.famEras !== undefined ? r.famEras : null;
    if (f === null && isObj(root.WALK_AGENT_ERAS)) { T = root.WALK_AGENT_ERAS[(r && r.role) || role]; if (isObj(T)) f = T.famEras; }
    return isArr(f) ? f : [];
  }

  /* ---------------------------------------------------------------- 共用情境（計時器、倒數、兩段式確認、渲染） */
  function makeCtx(container, opts, renderFn) {
    var ctx = { opts: opts || {}, container: container, dead: false, hold: 0, dirty: false, view: {}, armed: null, cd: [], cdH: null, seq: 0, T: {}, counter: 0 };
    var tm = ctx.opts.timers;
    var setT = tm && tm.set ? tm.set : function (fn, ms) { return setTimeout(fn, ms); };
    var clrT = tm && tm.clear ? tm.clear : function (id) { clearTimeout(id); };
    ctx.store = ctx.opts.store || root.WalkStore;
    ctx.now = function () { return typeof ctx.opts.now === 'function' ? ctx.opts.now() : Date.now(); };
    ctx.after = function (fn, ms) {
      var key = ++ctx.seq;
      ctx.T[key] = setT(function () { delete ctx.T[key]; if (!ctx.dead) fn(); }, ms);
      return key;
    };
    ctx.cancel = function (key) { if (key !== null && key !== undefined && has(ctx.T, key)) { clrT(ctx.T[key]); delete ctx.T[key]; } };
    ctx.toast = function (m) { try { if (typeof ctx.opts.toast === 'function') ctx.opts.toast(m); } catch (e) { /* 忽略 */ } };
    ctx.role = function () { return typeof ctx.opts.role === 'function' ? ctx.opts.role() : ctx.opts.role; };
    ctx.chapterNow = function () { return typeof ctx.opts.chapterId === 'function' ? ctx.opts.chapterId() : undefined; };
    ctx.rand = function (arr) { if (!isArr(arr) || !arr.length) return ''; ctx.counter++; return arr[(ctx.counter + Math.floor(ctx.now() / 1000)) % arr.length]; };

    /* 倒數：一條 setTimeout 鏈更新全部倒數字樣，沒有倒數時鏈就停 */
    ctx.countdown = function (el, endTs, prefix, done) {
      ctx.cd.push({ el: el, end: endTs, prefix: prefix || '', done: done });
      el.textContent = (prefix || '') + fmtClock(endTs - ctx.now());
      if (ctx.cdH === null) ctx.cdH = ctx.after(ctx.cdTick, 1000);
    };
    ctx.cdTick = function () {
      var t = ctx.now(), keep = [], fin = [], i, c;
      ctx.cdH = null;
      for (i = 0; i < ctx.cd.length; i++) {
        c = ctx.cd[i];
        if (t >= c.end) fin.push(c); else { c.el.textContent = c.prefix + fmtClock(c.end - t); keep.push(c); }
      }
      ctx.cd = keep;
      if (keep.length) ctx.cdH = ctx.after(ctx.cdTick, 1000);
      for (i = 0; i < fin.length; i++) { if (typeof fin[i].done === 'function') fin[i].done(); else fin[i].el.textContent = ''; }
    };
    ctx.resetCd = function () { ctx.cancel(ctx.cdH); ctx.cdH = null; ctx.cd = []; };

    /* 兩段式確認：第一下變「再按一次確認」，6 秒沒按就復原 */
    ctx.confirmBtn = function (cls, label, armedLabel, fn, extra) {
      var btn = h('button', { type: 'button', class: cls, text: label, 'data-label': label }), props = extra || {}, k;
      for (k in props) if (has(props, k)) btn.setAttribute(k, String(props[k]));
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        if (ctx.armed && ctx.armed.btn === btn) { ctx.disarm(); fn(); return; }
        ctx.disarm();
        btn.textContent = armedLabel || '再按一次確認';
        btn.className = cls + ' armed';
        btn.setAttribute('data-armed', '1');
        ctx.armed = { btn: btn, cls: cls, label: label, h: ctx.after(function () { ctx.disarm(); }, ARM_MS) };
      });
      return btn;
    };
    ctx.disarm = function () {
      var a = ctx.armed;
      if (!a) return;
      ctx.cancel(a.h);
      a.btn.textContent = a.label;
      a.btn.className = a.cls;
      a.btn.setAttribute('data-armed', '');
      ctx.armed = null;
    };

    /* 自己的動作：store 通知會先被擋住，做完再統一渲染一次 */
    ctx.act = function (fn) { var r; ctx.hold++; try { r = fn(); } finally { ctx.hold--; } return r; };
    ctx.say = function (text, kind, id) { ctx.view.msg = { text: text, kind: kind || 'ok', id: id === undefined ? null : id }; };
    ctx.render = function () {
      if (ctx.dead) return;
      if (ctx.hold > 0) { ctx.dirty = true; return; }
      ctx.dirty = false;
      ctx.resetCd();
      if (ctx.armed) { ctx.cancel(ctx.armed.h); ctx.armed = null; }
      var d = doc(), draft = ctx.view.chatInput ? ctx.view.chatInput.value : null, hadFocus = ctx.view.chatInput && d && d.activeElement === ctx.view.chatInput;
      if (draft !== null) ctx.view.draft = draft;
      clearNode(container);
      var rootEl = h('div', { class: 'wsu' + (isDark() ? ' wsu-dk' : ''), role: 'region', 'aria-label': ctx.label || '小精靈' });
      ctx.root = rootEl;
      ctx.view.chatInput = null;
      if (!ctx.store) rootEl.appendChild(h('p', { class: 'wsu-note', text: '小精靈系統還沒載入，重新整理看看。' }));
      else renderFn(ctx, rootEl);
      container.appendChild(rootEl);
      if (hadFocus && ctx.view.chatInput && ctx.view.chatInput.focus) ctx.view.chatInput.focus();
    };
    ctx.onStore = function (what, st, extra) { if (what === 'evolve' && ctx.playEvolve) ctx.playEvolve(extra); ctx.render(); };
    ctx.unmount = function () {
      var k;
      if (ctx.dead) return;
      ctx.dead = true;
      for (k in ctx.T) if (has(ctx.T, k)) clrT(ctx.T[k]);
      ctx.T = {}; ctx.cd = []; ctx.cdH = null; ctx.armed = null;
      if (ctx.store && typeof ctx.store.off === 'function') ctx.store.off(ctx.onStore);
      clearNode(container);
    };
    injectCss();
    if (ctx.store && typeof ctx.store.on === 'function') ctx.store.on(ctx.onStore);
    return ctx;
  }
  function controller(ctx) {
    ctx.render();
    return { refresh: function () { ctx.render(); }, unmount: ctx.unmount, view: ctx.view, ctx: ctx };
  }

  function msgBox(ctx, parent, id) {
    var m = ctx.view.msg;
    if (!m || (m.id === undefined ? null : m.id) !== (id === undefined ? null : id)) return;
    parent.appendChild(h('div', { class: 'wsu-msg' + (m.kind === 'warn' ? ' warn' : ''), role: 'status', 'aria-live': 'polite', text: m.text }));
  }

  function sayO(ctx, id, text, kind) { ctx.say(text, kind, id); }

  function dailyUsed(ctx, key, id) {
    var st = ctx.state, dd = st && st.shop && st.shop.daily, store = ctx.store, k, b;
    if (!dd) return 0;
    k = store._util && store._util.dateStr ? store._util.dateStr(ctx.now()) : null;
    b = k && dd[k];
    if (!isObj(b) || !isObj(b[key])) return 0;
    return num(b[key][id]);
  }

  /* ================================================================ 房間格數、出門名額、和隊友交換、新稱號（規格第 11、12 節） */
  var TW = {
    offline: '離線時不能交換，連上網路再試。', self: '不能和自己交換。', notteam: '只能和同隊的隊友交換。', daily_cap: '今天已經換過 3 次了，明天再來。',
    nogive: '你現在沒有可以交換的小精靈。', egg: '蛋不能交換。', legend: '傳說的小精靈不能交換。', expedition: '這隻正在勘察，先領回情報再換。',
    peerhas: '對方已經有這一種了。', mine_has: '你已經有這一種了。', nospirit: '找不到這隻小精靈。', expired: '這個提案已經過期。', nodata: '資料還沒準備好。',
    pending: '這隻已經送過一個提案給對方了，等對方回應或先取消。', notfound: '找不到這個提案。', notyours: '這個提案不是給你的。', done: '這個提案已經處理完了。',
    declined: '對方已經拒絕了。', cancelled: '提案已經被取消了。', accepted: '對方已經接受了，不能再取消。', conflict: '剛剛狀態變了，重新整理看看。', error: '現在連不上，稍後再試。',
    open: '這個提案還在等待。', full: '房間放不下，先送回一隻再來。'
  };
  function tradeWhy(r) { return (r && (r.why || TW[r.reason])) || '這次沒成功，等一下再試'; }
  function traitDefOf(id) {
    var T = root.WALK_TRAITS, i;
    if (!id) return null;
    if (isObj(T) && isObj(T.byId) && T.byId[id]) return T.byId[id];
    T = arrList(T);
    for (i = 0; i < T.length; i++) if (T[i] && T[i].id === id) return T[i];
    return null;
  }
  function titleName(id) {
    var D = root.WALK_DEX, cats = isObj(D) ? (isArr(D.categories) ? D.categories : (isArr(D.cats) ? D.cats : [])) : [], i, j, it;
    for (i = 0; i < cats.length; i++) if (isObj(cats[i]) && cats[i].id === 'titles' && isArr(cats[i].items)) for (j = 0; j < cats[i].items.length; j++) { it = cats[i].items[j]; if (isObj(it) && it.id === id) return it.name || id; }
    return String(id);
  }
  /* 小精靈外觀（含形態配件）：snap 是 {id, stage, form} */
  function spriteWithForm(def, stage, form) {
    var sp = stageSprite(def, stage), fs, WP = root.WalkPix;
    if (sp && form && WP && typeof WP.formSprite === 'function') {
      try { fs = WP.formSprite(sp.rows, sp.pal, form); if (fs && fs.matrix) return { rows: fs.matrix, pal: fs.palette, w: 16, h: 16 }; } catch (e) { /* 用原圖 */ }
    }
    return sp;
  }
  function snapDesc(snap) {
    var def = spiritDef(snap.id) || { name: snap.id }, tr = isObj(snap.trait) ? snap.trait : {}, pd = traitDefOf(tr.pers), fd = formDefOf(snap.form || tr.form), bits = [];
    bits.push(STAGE[snap.stage] || '');
    if (pd) bits.push((pd.icon || '') + ' ' + pd.name + '個性');
    if (fd) bits.push((fd.icon || '') + ' ' + fd.name);
    bits.push('羈絆 ' + num(snap.bond));
    return { name: def.name, nick: def.nick || '', text: bits.filter(Boolean).join('・'), def: def };
  }
  function snapRow(snap, extra) {
    var d = snapDesc(snap);
    return h('div', { class: 'wsu-head', 'data-role': 'snap', 'data-id': snap.id }, [
      pixImg(spriteWithForm(d.def, snap.stage, snap.form || (snap.trait && snap.trait.form)), 3, d.name),
      h('div', null, [h('div', { class: 'wsu-name', text: d.name + (d.nick ? '（' + d.nick + '）' : '') }), h('div', { class: 'wsu-note', text: d.text }), extra || null])
    ]);
  }
  function ownedSnap(o) { var tr = isObj(o.trait) ? o.trait : {}; return { id: o.id, stage: o.stage, bond: o.bond, trait: tr, form: tr.form || null }; }
  function tradeOffline(store) {
    var ib = null;
    try { ib = store.tradeInbox(); } catch (e) { ib = null; }
    return !!(ib && ib.offline);
  }
  function mateList(ctx) {
    var t = typeof ctx.opts.teammates === 'function' ? ctx.opts.teammates() : ctx.opts.teammates;
    return isArr(t) ? t.filter(function (x) { return isObj(x) && x.uid !== undefined; }) : null;
  }
  function loadInbox(ctx, withApply) {
    var store = ctx.store, V = ctx.view;
    if (typeof store.tradeInbox !== 'function' || ctx.dead) return;
    V.inboxBusy = true;
    function getInbox() {
      store.tradeInbox(function (ib) {
        if (ctx.dead) return;
        V.inbox = ib; V.inboxBusy = false; ctx.render();
      });
    }
    if (withApply && typeof store.tradeApply === 'function') {
      store.tradeApply(function (ap) {
        if (ctx.dead) return;
        V.applied = ap || null;
        if (ap && ap.ok && isArr(ap.applied) && ap.applied.length) ctx.say('有 ' + ap.applied.length + ' 筆交換完成了，新的小精靈已經在房間裡。', 'ok', 'trade');
        else if (ap && ap.ok && isArr(ap.pending) && ap.pending.length) ctx.say('有 ' + ap.pending.length + ' 筆交換還在等你空出位子（先領回勘察的小精靈，或送回圖鑑一隻）。', 'warn', 'trade');
        else if (ap && ap.ok && isArr(ap.failed) && ap.failed.length) ctx.say('有 ' + ap.failed.length + ' 筆交換沒辦法完成。', 'warn', 'trade');
        getInbox();
      });
    } else getInbox();
  }

  /* ---- 房間格數與出門名額 */
  function renderRoomSlots(ctx, rootEl, owned) {
    var store = ctx.store, rs = null, w, follow = null, line;
    if (typeof store.roomSlots !== 'function') return;
    try { rs = store.roomSlots(); } catch (e) { rs = null; }
    if (!rs) return;
    owned.forEach(function (o) { if (o.slot === 'follow') follow = o; });
    w = isArr(rs.waiting) ? rs.waiting : [];
    line = h('div', { class: 'wsu-card', 'data-role': 'room-card' });
    line.appendChild(h('p', { 'data-role': 'room-slots', text: '房間 ' + num(rs.used) + '／' + num(rs.total, 3) + ' 格（小精靈 ' + (isArr(rs.spirits) ? rs.spirits.length : owned.length) + ' 隻＋孵化中的蛋 ' + (isArr(rs.eggs) ? rs.eggs.length : 0) + ' 顆，共用這 3 格）' }));
    line.appendChild(h('p', { class: 'wsu-note', 'data-role': 'follow-now', text: follow ? '出門中（同一時間只有 1 隻）：' + ((spiritDef(follow.id) || {}).name || follow.id) + '。只有出門的那隻，助理技、天賦和共鳴會在走讀時生效。' : '現在沒有小精靈出門。在小精靈卡上按「換牠出門」，牠的助理技、天賦和共鳴就會在走讀時生效（同一時間只有 1 隻）。' }));
    if (w.length) {
      line.appendChild(h('p', { class: 'wsu-note', 'data-role': 'waiting', text: '排隊中的蛋 ' + w.length + ' 顆（待孵清單最多 ' + num(rs.waitMax, 6) + ' 顆，排隊的蛋不孵化、不計時）。放不下，先送回一隻：房間滿了時，送回圖鑑一隻，排隊的蛋才會依順序放進房間開始孵。' }));
      w.forEach(function (x) { line.appendChild(h('div', { class: 'wsu-note', 'data-role': 'waiting-item', text: '第 ' + num(x.pos) + ' 顆：' + ((spiritDef(x.id) || {}).rarity ? '（' + spiritDef(x.id).rarity + '）' : '') + '神祕的蛋，排隊中' })); });
    }
    if (w.length >= num(rs.waitMax, 6)) line.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'waiting-full', text: '待孵清單滿了（' + w.length + ' 顆）。新拿到的蛋放不下，先送回一隻。' }));
    rootEl.appendChild(line);
  }

  /* ---- 和隊友交換 */
  function renderTradeNew(ctx, rootEl) {
    var store = ctx.store, V = ctx.view, card, mates, T = V.trade, opt, list, backBtn;
    if (typeof store.tradeOptions !== 'function' || typeof store.tradePropose !== 'function') return;
    card = h('section', { class: 'wsu-card', 'data-kind': 'trade-new' });
    card.appendChild(h('div', { class: 'wsu-h', text: '和隊友交換小精靈' }));
    if (tradeOffline(store)) {
      card.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'trade-offline', text: '現在不能交換：' + TW.offline }));
      rootEl.appendChild(card);
      return;
    }
    card.appendChild(h('p', { class: 'wsu-note', text: '一次一隻換一隻。交換後羈絆會減半、性格與形態保留。蛋和傳說的小精靈不能換，每天最多換 3 次。' }));
    mates = mateList(ctx);
    msgBox(ctx, card, 'trade');
    if (!mates) { card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'need-mates', text: '這裡需要隊友名單。' })); rootEl.appendChild(card); return; }
    if (!mates.length) { card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'no-mates', text: '隊伍裡還沒有其他隊友。' })); rootEl.appendChild(card); return; }
    if (!T) {
      card.appendChild(h('div', { class: 'wsu-note', text: '先選一位隊友：' }));
      list = h('div', { class: 'wsu-row' });
      mates.forEach(function (m) {
        list.appendChild(h('button', {
          type: 'button', class: 'wsu-chip', 'data-act': 'trade-mate', 'data-uid': m.uid, text: String(m.nick || '隊友').slice(0, 12),
          on: { click: function () {
            var t0 = { uid: m.uid, nick: String(m.nick || '隊友').slice(0, 12), opt: null, give: null };
            V.trade = t0; ctx.view.msg = null;
            t0.opt = store.tradeOptions(m.uid, function (o2) { if (ctx.dead || V.trade !== t0) return; t0.opt = o2; ctx.render(); });
            ctx.render();
          } }
        }));
      });
      card.appendChild(list);
      rootEl.appendChild(card);
      return;
    }
    opt = T.opt || { ok: false, give: [] };
    backBtn = h('button', { type: 'button', class: 'wsu-chip', 'data-act': 'trade-back', text: '← 換一位隊友', on: { click: function () { V.trade = null; ctx.render(); } } });
    card.appendChild(h('div', { class: 'wsu-row' }, [h('span', { class: 'wsu-name', text: '和 ' + T.nick + ' 交換' }), backBtn]));
    if (typeof opt.left === 'number') card.appendChild(h('div', { class: 'wsu-note', 'data-role': 'trade-left', text: '今天還能換 ' + opt.left + ' 次。' }));
    if (!opt.ok && opt.reason && opt.reason !== 'nogive') card.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'trade-block', text: opt.why || TW[opt.reason] || '現在不能換。' }));
    if (!opt.ok && opt.reason === 'nogive') card.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'trade-block', text: TW.nogive }));
    card.appendChild(h('div', { class: 'wsu-note', text: '選你要給出去的那一隻：' }));
    (isArr(opt.give) ? opt.give : []).forEach(function (g) {
      var o = null, canGive = !!g.ok && (opt.ok || opt.reason === 'nogive' ? !!g.ok : false), row;
      ctx.store.owned().forEach(function (x) { if (x.id === g.id) o = x; });
      if (!o) return;
      if (!opt.ok) canGive = false;
      row = h('div', { class: 'wsu-icard', 'data-role': 'give-row', 'data-id': g.id });
      row.appendChild(snapRow(ownedSnap(o)));
      if (!g.ok) row.appendChild(h('div', { class: 'wsu-note', 'data-role': 'give-why', text: '不能換：' + (g.why || TW[g.reason] || '') }));
      row.appendChild(h('button', {
        type: 'button', class: 'wsu-btn' + (T.give === g.id ? ' main' : ''), 'data-act': 'trade-give', 'data-id': g.id, disabled: !canGive, text: T.give === g.id ? '已選這隻' : '選這隻去換',
        on: { click: function () { T.give = g.id; ctx.render(); } }
      }));
      card.appendChild(row);
    });
    if (T.give) {
      var mine = null;
      ctx.store.owned().forEach(function (x) { if (x.id === T.give) mine = x; });
      if (mine) {
        card.appendChild(h('div', { class: 'wsu-msg', 'data-role': 'trade-confirm-text', text: '要把「' + snapDesc(ownedSnap(mine)).name + '」（羈絆 ' + num(mine.bond) + '）送給 ' + T.nick + ' 嗎？對方接受後，牠到對方那邊羈絆會減半（' + Math.floor(num(mine.bond) / 2) + '），性格與形態保留。提案 10 分鐘內有效，對方接受前你可以取消。' }));
        card.appendChild(ctx.confirmBtn('wsu-btn main', '送出提案', '再按一次確認送出', function () {
          store.tradePropose(T.uid, T.give, function (r) {
            if (ctx.dead) return;
            if (r && r.ok) { V.trade = null; ctx.say('提案送出了，等 ' + T.nick + ' 回應（10 分鐘內有效）。', 'ok', 'trade'); loadInbox(ctx, false); }
            else { T.give = null; ctx.say(tradeWhy(r), 'warn', 'trade'); }
            ctx.render();
          });
        }, { 'data-act': 'trade-send' }));
      }
    }
    rootEl.appendChild(card);
  }

  /* ---- 交換信箱 */
  var ST_TEXT = { open: '等待回應', accepted: '對方已接受', done: '已經換好了', declined: '已拒絕', cancelled: '已取消' };
  function renderTradeInbox(ctx, rootEl) {
    var store = ctx.store, V = ctx.view, card, ib = V.inbox, inc, out;
    if (typeof store.tradeInbox !== 'function') return;
    card = h('section', { class: 'wsu-card', 'data-kind': 'trade-inbox' });
    card.appendChild(h('div', { class: 'wsu-row' }, [
      h('span', { class: 'wsu-h', text: '交換信箱' }),
      h('button', { type: 'button', class: 'wsu-chip', 'data-act': 'inbox-refresh', disabled: !!V.inboxBusy, text: V.inboxBusy ? '整理中…' : '重新整理', on: { click: function () { loadInbox(ctx, true); ctx.render(); } } })
    ]));
    if (tradeOffline(store) || (ib && ib.offline)) {
      card.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'trade-offline', text: '現在不能交換：' + TW.offline }));
      rootEl.appendChild(card);
      return;
    }
    if (!ib) { card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'inbox-loading', text: '正在整理信箱…' })); rootEl.appendChild(card); return; }
    inc = isArr(ib.incoming) ? ib.incoming.slice(0, 10) : []; out = isArr(ib.outgoing) ? ib.outgoing.slice(0, 10) : [];
    if (!inc.length && !out.length) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'inbox-empty', text: '信箱是空的。隊友送來提案，或你送出提案，都會出現在這裡。' }));
    if (inc.length) card.appendChild(h('div', { class: 'wsu-note', text: '收到的提案：' }));
    inc.forEach(function (x) { renderIncoming(ctx, card, x); });
    if (out.length) card.appendChild(h('div', { class: 'wsu-note', text: '我送出的提案：' }));
    out.forEach(function (x) { renderOutgoing(ctx, card, x); });
    msgBox(ctx, card, 'trade-inbox');
    rootEl.appendChild(card);
  }
  function statusLabel(x) { return x.expired ? '已過期' : (ST_TEXT[x.status] || x.status); }
  function renderIncoming(ctx, parent, x) {
    var store = ctx.store, V = ctx.view, row = h('div', { class: 'wsu-icard', 'data-role': 'incoming', 'data-id': x.id, 'data-status': x.expired ? 'expired' : x.status }), acc = V.acc && V.acc.id === x.id ? V.acc : null, mineHas = false, opt, give;
    store.owned().forEach(function (o) { if (o.id === x.give.id) mineHas = true; });
    row.appendChild(h('div', { class: 'wsu-row' }, [h('span', { class: 'wsu-tag', 'data-role': 'status', text: statusLabel(x) }), h('span', { text: (x.fromNick || '隊友') + ' 想和你交換' })]));
    row.appendChild(snapRow(x.give));
    if (x.canAccept) {
      if (mineHas) row.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'mine-has', text: TW.mine_has + '這個提案只能拒絕。' }));
      row.appendChild(h('button', {
        type: 'button', class: 'wsu-btn main', 'data-act': 'inc-accept', 'data-id': x.id, disabled: mineHas, text: acc ? '收起' : '接受（選一隻回贈）',
        on: { click: function () {
          if (acc) { V.acc = null; ctx.render(); return; }
          var a0 = { id: x.id, opt: null, give: null };
          V.acc = a0;
          a0.opt = store.tradeOptions(x.from, function (o2) { if (ctx.dead || V.acc !== a0) return; a0.opt = o2; ctx.render(); });
          ctx.render();
        } }
      }));
      row.appendChild(ctx.confirmBtn('wsu-btn', '拒絕', '再按一次確認拒絕', function () {
        store.tradeDecline(x.id, function (r) {
          if (ctx.dead) return;
          ctx.say(r && r.ok ? '已拒絕這個提案。' : tradeWhy(r), r && r.ok ? 'ok' : 'warn', 'trade-inbox');
          loadInbox(ctx, false); ctx.render();
        });
      }, { 'data-act': 'inc-decline', 'data-id': x.id }));
      if (acc && !mineHas) {
        opt = acc.opt || { ok: false, give: [] };
        row.appendChild(h('div', { class: 'wsu-note', text: '選一隻回贈給 ' + (x.fromNick || '對方') + '（交換後羈絆會減半、性格與形態保留）：' }));
        if (!opt.ok && opt.reason && opt.reason !== 'nogive') row.appendChild(h('div', { class: 'wsu-warn', role: 'status', 'data-role': 'trade-block', text: opt.why || TW[opt.reason] }));
        (isArr(opt.give) ? opt.give : []).forEach(function (g) {
          var o = null, r2;
          store.owned().forEach(function (y) { if (y.id === g.id) o = y; });
          if (!o) return;
          r2 = h('div', { class: 'wsu-icard', 'data-role': 'give-row', 'data-id': g.id });
          r2.appendChild(snapRow(ownedSnap(o)));
          if (!g.ok) r2.appendChild(h('div', { class: 'wsu-note', 'data-role': 'give-why', text: '不能換：' + (g.why || TW[g.reason] || '') }));
          r2.appendChild(h('button', { type: 'button', class: 'wsu-btn' + (acc.give === g.id ? ' main' : ''), 'data-act': 'acc-give', 'data-id': g.id, disabled: !g.ok || (!opt.ok && opt.reason !== 'nogive'), text: acc.give === g.id ? '已選這隻' : '回贈這隻', on: { click: function () { acc.give = g.id; ctx.render(); } } }));
          row.appendChild(r2);
        });
        if (acc.give) {
          give = null;
          store.owned().forEach(function (y) { if (y.id === acc.give) give = y; });
          if (give) {
            row.appendChild(h('div', { class: 'wsu-msg', 'data-role': 'accept-confirm-text', text: '你給出「' + snapDesc(ownedSnap(give)).name + '」，換回「' + snapDesc(x.give).name + '」。換回來的羈絆會減半（' + Math.floor(num(x.give.bond) / 2) + '），性格與形態保留。' }));
            row.appendChild(ctx.confirmBtn('wsu-btn main', '確定交換', '再按一次確認交換', function () {
              store.tradeAccept(x.id, acc.give, function (r) {
                if (ctx.dead) return;
                V.acc = null;
                if (r && r.ok) ctx.say('換好了！收到「' + snapDesc(x.give).name + '」，牠已經在你的房間裡。', 'ok', 'trade-inbox');
                else ctx.say(tradeWhy(r), 'warn', 'trade-inbox');
                loadInbox(ctx, false); ctx.render();
              });
            }, { 'data-act': 'acc-send' }));
          }
        }
      }
    } else if (x.expired) {
      row.appendChild(h('div', { class: 'wsu-note', 'data-role': 'expired', text: '已過期，不能接受。' }));
      row.appendChild(h('button', { type: 'button', class: 'wsu-btn', 'data-act': 'inc-accept', 'data-id': x.id, disabled: true, text: '接受（已過期）' }));
    } else if (x.status === 'accepted' || x.status === 'done') {
      row.appendChild(h('div', { class: 'wsu-note', text: x.applied ? '已經換好了，新的小精靈在你的房間裡。' : '已接受，開啟時會自動完成。' }));
    }
    parent.appendChild(row);
  }
  function renderOutgoing(ctx, parent, x) {
    var store = ctx.store, row = h('div', { class: 'wsu-icard', 'data-role': 'outgoing', 'data-id': x.id, 'data-status': x.expired ? 'expired' : x.status });
    row.appendChild(h('div', { class: 'wsu-row' }, [h('span', { class: 'wsu-tag', 'data-role': 'status', text: statusLabel(x) }), h('span', { text: '送給 ' + (x.toNick || '隊友') })]));
    row.appendChild(snapRow(x.give));
    if (x.canCancel) {
      row.appendChild(ctx.confirmBtn('wsu-btn', '取消提案', '再按一次確認取消', function () {
        store.tradeCancel(x.id, function (r) {
          if (ctx.dead) return;
          ctx.say(r && r.ok ? '提案取消了。' : tradeWhy(r), r && r.ok ? 'ok' : 'warn', 'trade-inbox');
          loadInbox(ctx, false); ctx.render();
        });
      }, { 'data-act': 'out-cancel', 'data-id': x.id }));
    } else if (x.expired) row.appendChild(h('div', { class: 'wsu-note', 'data-role': 'expired', text: '已過期，沒有換成。' }));
    else if (x.needsApply) row.appendChild(h('div', { class: 'wsu-note', 'data-role': 'needs-apply', text: '對方已接受！按「重新整理」就會完成這次交換。' }));
    else if ((x.status === 'done' || x.status === 'accepted') && isObj(x.get)) row.appendChild(h('div', { class: 'wsu-note', text: '換回來的是「' + snapDesc(x.get).name + '」。' }));
    parent.appendChild(row);
  }

  /* ---- 新稱號 */
  function renderTitles(ctx, rootEl) {
    var list = ctx.view.titles;
    if (!isArr(list) || !list.length) return;
    rootEl.appendChild(h('div', { class: 'wsu-msg', role: 'status', 'aria-live': 'polite', 'data-role': 'new-titles' }, [
      h('div', { class: 'wsu-name', text: '🏅 新稱號：' + list.map(titleName).join('、') }),
      h('button', { type: 'button', class: 'wsu-chip', 'data-act': 'dismiss-titles', text: '知道了', on: { click: function () { ctx.view.titles = null; ctx.render(); } } })
    ]));
  }

  /* ================================================================ 小精靈頁 */
  function mount(container, opts) {
    var ctx = makeCtx(container, opts, renderSpiritPage);
    ctx.label = '小精靈';
    ctx.view.tab = {}; ctx.view.food = {}; ctx.view.chat = {};
    ctx.playEvolve = function (ev) { playEvolve(ctx, ev); };
    /* 新稱號：圖鑑那邊用同一個來源（store.takeNewTitles），先看有沒有還沒被取走的，有才取 */
    if (ctx.store && typeof ctx.store.takeNewTitles === 'function') {
      try {
        var stt = ctx.store.state();
        if (stt && stt.dex && isArr(stt.dex.titlePending) && stt.dex.titlePending.length) ctx.view.titles = ctx.store.takeNewTitles();
      } catch (e0) { /* 忽略 */ }
    }
    if (ctx.store && typeof ctx.store.takeEvolutions === 'function') { try { (ctx.store.takeEvolutions() || []).forEach(ctx.playEvolve); } catch (e) { /* 忽略 */ } }
    var ctl = controller(ctx);
    loadInbox(ctx, true);                       /* 開啟時先補做沒完成的交換，再讀信箱 */
    return ctl;
  }

  function renderSpiritPage(ctx, rootEl) {
    var store = ctx.store, st = ctx.state = store.state(), owned = store.owned();
    renderEvolve(ctx, rootEl);
    renderTitles(ctx, rootEl);
    msgBox(ctx, rootEl);
    if (!st.spirit.starter && owned.length === 0) { renderStarter(ctx, rootEl); return; }
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '我的小精靈（' + owned.length + '／3）' }));
    rootEl.appendChild(h('p', { class: 'wsu-note', text: '最多同時養 3 隻，而且 3 隻的種類要不同。隨行位 1 隻、勘察位 2 隻。' }));
    if (!owned.length) rootEl.appendChild(h('p', { text: '現在沒有小精靈在身邊。孵一顆蛋，或把圖鑑裡的夥伴領回來。' }));
    renderRoomSlots(ctx, rootEl, owned);
    owned.forEach(function (o) { renderSpiritCard(ctx, rootEl, o, owned); });
    renderEggs(ctx, rootEl, owned);
    renderReleased(ctx, rootEl, st, owned);
    renderTradeNew(ctx, rootEl);
    renderTradeInbox(ctx, rootEl);
  }

  /* ---- 起始三選一 */
  function renderStarter(ctx, rootEl) {
    var store = ctx.store, ids = store.starters();
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '挑一隻小精靈當你的夥伴' }));
    rootEl.appendChild(h('p', { class: 'wsu-note', text: '牠會陪你走這條路。之後還能孵出更多，最多同時養 3 隻（種類要不同）。' }));
    if (!ids.length) { rootEl.appendChild(h('p', { text: '小精靈還在準備中，等一下再來。' })); return; }
    ids.forEach(function (id) {
      var def = spiritDef(id), card, btn;
      if (!def) return;
      card = h('section', { class: 'wsu-card', 'data-kind': 'starter', 'data-id': id });
      card.appendChild(h('div', { class: 'wsu-head' }, [
        pixImg(stageSprite(def, 'baby'), 5, def.name),
        h('div', null, [
          h('div', { class: 'wsu-name', text: def.name + (def.nick ? '（' + def.nick + '）' : '') }),
          h('div', { class: 'wsu-row' }, [rarityBadge(def.rarity), attrBadge(def.attr), h('span', { class: 'wsu-tag', text: def.era || '' })])
        ])
      ]));
      card.appendChild(h('p', { class: 'wsu-quote', text: '「' + (def.stages && def.stages.baby ? def.stages.baby.line : '') + '」' }));
      if (def.assist) card.appendChild(h('p', { class: 'wsu-note', text: '助理技「' + def.assist.name + '」：' + def.assist.desc }));
      btn = ctx.confirmBtn('wsu-btn main', '選牠當夥伴', '再按一次確認', function () {
        var r = ctx.act(function () { return store.chooseStarter(id); });
        if (r && r.ok) { ctx.say('「' + (def.nick || def.name) + '」成為你的夥伴了！', 'ok'); ctx.toast('新夥伴：' + def.name); if (typeof ctx.opts.onChoose === 'function') ctx.opts.onChoose(id); }
        else ctx.say(why(r), 'warn');
        ctx.render();
      }, { 'data-act': 'choose', 'data-id': id });
      card.appendChild(btn);
      rootEl.appendChild(card);
    });
  }

  /* ---- 單隻小精靈卡 */
  function renderSpiritCard(ctx, rootEl, o, owned) {
    var store = ctx.store, def = spiritDef(o.id) || { id: o.id, name: o.id }, v = num(o.vigor), card, fill, tab, x, i, tabs = ['care', 'skill', 'reson', 'chat'], names = { care: '照顧', skill: '技能', reson: '共鳴', chat: '聊天' };
    var line = def.stages && def.stages[o.stage] ? def.stages[o.stage].line : '';
    card = h('section', { class: 'wsu-card', 'data-kind': 'spirit', 'data-id': o.id });
    card.appendChild(h('div', { class: 'wsu-head' }, [
      pixImg(stageSprite(def, o.stage), 4, def.name + '（' + (STAGE[o.stage] || '') + '）'),
      h('div', null, [
        h('div', { class: 'wsu-name', text: def.name + (def.nick ? '（' + def.nick + '）' : '') }),
        h('div', { class: 'wsu-row' }, [rarityBadge(def.rarity), attrBadge(def.attr), h('span', { class: 'wsu-tag', text: def.era || '' })]),
        h('div', { class: 'wsu-note', text: '階段：' + (STAGE[o.stage] || o.stage) + '　羈絆 ' + num(o.bond) + bondHint(o) })
      ])
    ]));
    fill = h('i');
    fill.style.width = Math.max(0, Math.min(100, Math.round(v))) + '%';
    card.appendChild(h('div', { class: 'wsu-bar', role: 'img', 'aria-label': '活力 ' + Math.round(v) + '／100' }, [fill]));
    card.appendChild(h('div', { class: 'wsu-note', 'data-role': 'vigor', text: '活力 ' + Math.round(v) + '／100・' + vigorState(v) + '・效能 ×' + num(o.efficiency, 1).toFixed(2) }));
    if (v < LOW_VIGOR) card.appendChild(h('div', { class: 'wsu-warn', role: 'status', text: '活力低，效能約 ×0.6，建議先餵食或玩耍' }));
    if (line) card.appendChild(h('p', { class: 'wsu-quote', text: '「' + line + '」' }));
    renderTraitBlock(ctx, card, o, def);
    renderSlots(ctx, card, o);

    tab = ctx.view.tab[o.id] || 'care';
    x = h('div', { class: 'wsu-tabs', role: 'tablist' });
    for (i = 0; i < tabs.length; i++) (function (key) {
      x.appendChild(h('button', {
        type: 'button', class: 'wsu-tab' + (tab === key ? ' on' : ''), role: 'tab', 'aria-selected': tab === key ? 'true' : 'false',
        'data-act': 'tab', 'data-tab': key, 'data-id': o.id, text: names[key],
        on: { click: function () { ctx.view.tab[o.id] = key; ctx.view.msg = null; ctx.render(); } }
      }));
    })(tabs[i]);
    card.appendChild(x);
    msgBox(ctx, card, o.id);
    if (tab === 'care') renderCare(ctx, card, o, def);
    else if (tab === 'skill') renderSkill(ctx, card, o, def);
    else if (tab === 'reson') renderReson(ctx, card, o, def);
    else renderChat(ctx, card, o, def);

    card.appendChild(h('div', { class: 'wsu-sec' }, [
      ctx.confirmBtn('wsu-btn', '送回圖鑑', '再按一次確認', function () {
        var r = ctx.act(function () { return store.release(o.id); });
        if (r && r.ok) ctx.say('「' + (def.nick || def.name) + '」回到圖鑑了，留下了一張紀念卡。想牠時可以再領回來。', 'ok');
        else sayO(ctx, o.id, why(r), 'warn');
        ctx.render();
      }, { 'data-act': 'release', 'data-id': o.id }),
      h('span', { class: 'wsu-note', text: ' 圖鑑裡還是算你有這隻，之後可以領回。' })
    ]));
    rootEl.appendChild(card);
  }
  function bondHint(o) {
    var b = num(o.bond);
    if (o.stage === 'baby') return '（到 10 長成成體）';
    if (o.stage === 'adult') return b < 30 ? '（到 30 再加上圖鑑進度可能覺醒）' : '';
    return '';
  }

  function renderSlots(ctx, card, o) {
    var store = ctx.store, row = h('div', { class: 'wsu-row', role: 'group', 'aria-label': '位子' }), defs = [['follow', o.slot === 'follow' ? '出門中（只有 1 隻）' : '換牠出門'], ['scout', '勘察位（2）'], ['room', '待在窩裡']];
    row.appendChild(h('span', { class: 'wsu-note', text: '位子：' }));
    defs.forEach(function (d) {
      row.appendChild(h('button', {
        type: 'button', class: 'wsu-chip' + (o.slot === d[0] ? ' on' : ''), 'aria-pressed': o.slot === d[0] ? 'true' : 'false', 'data-act': 'slot', 'data-slot': d[0], 'data-id': o.id, text: d[1],
        on: {
          click: function () {
            if (o.slot === d[0]) return;
            var r = ctx.act(function () { return d[0] === 'follow' && typeof store.setFollow === 'function' ? store.setFollow(o.id) : store.setSlot(o.id, d[0]); });
            if (r && r.ok && d[0] === 'follow') sayO(ctx, o.id, '牠出門了' + (r.prev ? '，原本出門的「' + ((spiritDef(r.prev) || {}).name || r.prev) + '」回到房間' : '') + '。牠的助理技冷卻從頭重新計算。', 'ok');
            else if (r && r.ok) sayO(ctx, o.id, '換好了：' + d[1].replace(/（\d）/, ''), 'ok'); else sayO(ctx, o.id, why(r), 'warn');
            ctx.render();
          }
        }
      }));
    });
    card.appendChild(row);
    if (o.slot !== 'follow') card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'follow-note', text: '同一時間只有 1 隻能出門。按「換牠出門」，原本出門的會回到房間，牠的助理技冷卻從頭重新計算。' }));
    if (o.slot === 'follow') card.appendChild(h('p', { class: 'wsu-note', text: '出門中：助理技、天賦和共鳴會在走讀時生效。' }));
    else if (o.slot === 'scout') card.appendChild(h('p', { class: 'wsu-note', text: '勘察位：可以派去勘察，帶回情報。' }));
  }

  /* ---- 照顧 */
  function renderCare(ctx, card, o, def) {
    var store = ctx.store, st = ctx.state, id = o.id, foods = [], sel, row, blocked = {}, restU, v = num(o.vigor), toy = null, usedFeed, usedPlay, usedPet, usedTidy;
    foodList().forEach(function (f) { if (num(st.shop.owned[f.id]) >= 1) foods.push(f); });
    sel = ctx.view.food[id];
    if (!sel || !foods.some(function (f) { return f.id === sel; })) sel = foods.length ? foods[0].id : null;
    ctx.view.food[id] = sel;
    toyList().forEach(function (t) { if (num(st.shop.owned[t.id]) >= 1 && (!toy || num(t.playBonus) > num(toy.playBonus))) toy = t; });

    usedFeed = dailyUsed(ctx, 'fed', id); usedPlay = dailyUsed(ctx, 'played', id); usedPet = dailyUsed(ctx, 'petted', id); usedTidy = dailyUsed(ctx, 'tidied', id);
    restU = dailyUsed(ctx, 'rest', id);
    if (usedFeed >= cap('feed')) blocked.feed = '今天餵了 ' + usedFeed + ' 次，用完了（每天 ' + cap('feed') + ' 次）';
    else if (!foods.length) blocked.feed = '背包沒有點心，到商店買，或靠勘察換';
    else if (v >= 100) blocked.feed = '活力已經滿了';
    else if (restU >= cap('rest')) blocked.feed = '今天在房間補的活力已經夠多了，帶牠出去走走吧';
    if (usedPlay >= cap('play')) blocked.play = '今天玩了 ' + usedPlay + ' 次，用完了（每天 ' + cap('play') + ' 次）';
    else if (v >= 100) blocked.play = '活力已經滿了';
    else if (restU >= cap('rest')) blocked.play = '今天在房間補的活力已經夠多了，帶牠出去走走吧';
    if (usedPet >= cap('pet')) blocked.pet = '今天摸了 ' + usedPet + ' 次，用完了（每天 ' + cap('pet') + ' 次）';
    else if (v >= 100) blocked.pet = '活力已經滿了';
    else if (restU >= cap('rest')) blocked.pet = '今天在房間補的活力已經夠多了，帶牠出去走走吧';
    if (usedTidy >= cap('tidy')) blocked.tidy = '今天已經整理過窩了（每天 ' + cap('tidy') + ' 次）';
    else if (v >= 100) blocked.tidy = '活力已經滿了';
    else if (restU >= cap('rest')) blocked.tidy = '今天在房間補的活力已經夠多了，帶牠出去走走吧';

    card.appendChild(h('div', { class: 'wsu-note', text: '點心（點一個選它）：' }));
    row = h('div', { class: 'wsu-row' });
    if (!foods.length) row.appendChild(h('span', { class: 'wsu-note', text: '背包裡沒有點心' }));
    foods.forEach(function (f) {
      var fav = def.favFood !== undefined && (f.cat === def.favFood);
      row.appendChild(h('button', {
        type: 'button', class: 'wsu-chip' + (sel === f.id ? ' on' : ''), 'aria-pressed': sel === f.id ? 'true' : 'false', 'data-act': 'food', 'data-food': f.id, 'data-id': id,
        text: f.name + ' ×' + num(st.shop.owned[f.id]) + (fav ? ' ★最愛' : ''),
        on: { click: function () { ctx.view.food[id] = f.id; ctx.render(); } }
      }));
    });
    card.appendChild(row);

    var acts = h('div', { class: 'wsu-row' });
    acts.appendChild(h('button', {
      type: 'button', class: 'wsu-btn main', 'data-act': 'feed', 'data-id': id, disabled: !!blocked.feed, text: '餵食（' + usedFeed + '／' + cap('feed') + '）',
      on: { click: function () {
        var r = ctx.act(function () { return store.feed(id, sel); }), f;
        if (r && r.ok) { f = ctx.rand(def.lines && def.lines.feed); sayO(ctx, o.id, (f ? '「' + f + '」' : '吃得很開心。') + ' 活力 +' + r.delta + (r.favorite ? '，牠最愛這個，羈絆 +1' : ''), 'ok'); }
        else sayO(ctx, o.id, why(r), 'warn');
        ctx.render();
      } }
    }));
    acts.appendChild(h('button', {
      type: 'button', class: 'wsu-btn main', 'data-act': 'play', 'data-id': id, disabled: !!blocked.play, text: '玩耍（' + usedPlay + '／' + cap('play') + '）',
      on: { click: function () { startGame(ctx, o, toy); } }
    }));
    acts.appendChild(h('button', {
      type: 'button', class: 'wsu-btn', 'data-act': 'pet', 'data-id': id, disabled: !!blocked.pet, text: '撫摸（' + usedPet + '／' + cap('pet') + '）',
      on: { click: function () {
        var r = ctx.act(function () { return store.pet(id); }), f;
        if (r && r.ok) { f = ctx.rand(def.lines && def.lines.pet); sayO(ctx, o.id, (f ? '「' + f + '」' : '牠很舒服。') + ' 活力 +' + r.delta, 'ok'); } else sayO(ctx, o.id, why(r), 'warn');
        ctx.render();
      } }
    }));
    acts.appendChild(h('button', {
      type: 'button', class: 'wsu-btn', 'data-act': 'tidy', 'data-id': id, disabled: !!blocked.tidy, text: '整理窩（' + usedTidy + '／' + cap('tidy') + '）',
      on: { click: function () {
        var r = ctx.act(function () { return store.tidy(id); });
        if (r && r.ok) sayO(ctx, o.id, '窩整理得乾乾淨淨。 活力 +' + r.delta, 'ok'); else sayO(ctx, o.id, why(r), 'warn');
        ctx.render();
      } }
    }));
    card.appendChild(acts);
    ['feed', 'play', 'pet', 'tidy'].forEach(function (k) { if (blocked[k]) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'blocked-' + k, text: ({ feed: '餵食', play: '玩耍', pet: '撫摸', tidy: '整理窩' })[k] + '：' + blocked[k] })); });
    card.appendChild(h('p', { class: 'wsu-note', text: '房間裡每天最多補回約 ' + cap('rest') + ' 點活力；帶牠出任務、到站、勘察回來也會補。' }));

    if (ctx.view.game && ctx.view.game.id === id) renderGame(ctx, card);
  }

  /* ---- 玩耍小互動：5 秒，點亮跳動的光點，不計輸贏 */
  function startGame(ctx, o, toy) {
    var g = { id: o.id, score: 0, lit: -1, seed: (ctx.now() % 9973) + 7, cells: [], toy: toy ? toy.id : null, toyName: toy ? toy.name : null, stepH: null, endH: null, scoreEl: null };
    ctx.view.tab[o.id] = 'care';
    ctx.view.game = g;
    nextLit(g);
    g.stepH = ctx.after(function stepFn() { nextLit(g); paintGame(g); g.stepH = ctx.after(stepFn, GAME_STEP); }, GAME_STEP);
    g.endH = ctx.after(function () { finishGame(ctx, g); }, GAME_MS);
    ctx.view.msg = null;
    ctx.render();
  }
  function nextLit(g) {
    var n;
    g.seed = (g.seed * 1103515245 + 12345) % 2147483648;
    n = g.seed % 9;
    if (n === g.lit) n = (n + 1 + (g.seed % 7)) % 9;
    g.lit = n;
  }
  function paintGame(g) {
    var i;
    for (i = 0; i < g.cells.length; i++) {
      g.cells[i].className = 'wsu-cell' + (i === g.lit ? ' lit' : '');
      g.cells[i].textContent = i === g.lit ? '✦' : '';
    }
    if (g.scoreEl) g.scoreEl.textContent = '點亮了 ' + g.score + ' 個光點';
  }
  function renderGame(ctx, card) {
    var g = ctx.view.game, grid, i, box;
    box = h('div', { class: 'wsu-sec', role: 'group', 'aria-label': '玩耍小遊戲' });
    box.appendChild(h('p', { class: 'wsu-note', text: '5 秒內點亮跳動的光點，不計輸贏，玩得開心就好。' + (g.toyName ? '（用上了「' + g.toyName + '」）' : '') }));
    g.scoreEl = h('div', { 'data-role': 'game-score', text: '點亮了 ' + g.score + ' 個光點' });
    box.appendChild(g.scoreEl);
    grid = h('div', { class: 'wsu-grid' });
    g.cells = [];
    for (i = 0; i < 9; i++) (function (idx) {
      var c = h('button', { type: 'button', class: 'wsu-cell', 'data-act': 'cell', 'data-idx': idx, 'aria-label': '格子 ' + (idx + 1), on: { click: function () {
        if (g.lit === idx) { g.score++; nextLit(g); paintGame(g); }
      } } });
      g.cells.push(c);
      grid.appendChild(c);
    })(i);
    box.appendChild(grid);
    card.appendChild(box);
    paintGame(g);
  }
  function finishGame(ctx, g) {
    var r, f, def = spiritDef(g.id);
    ctx.cancel(g.stepH); ctx.cancel(g.endH);
    ctx.view.game = null;
    r = ctx.act(function () { return ctx.store.play(g.id, g.toy || undefined); });
    if (r && r.ok) { f = ctx.rand(def && def.lines && def.lines.idle); sayO(ctx, g.id, '玩得很開心，點亮了 ' + g.score + ' 個光點。 活力 +' + r.delta + (f ? '　「' + f + '」' : ''), 'ok'); }
    else sayO(ctx, g.id, why(r), 'warn');
    ctx.render();
  }

  /* ---- 技能 */
  function renderSkill(ctx, card, o, def) {
    var store = ctx.store, a = def.assist, t = def.talent, sc = def.scout, aw = def.awaken, e = num(o.efficiency, 1), now = ctx.now(), cdLeft = num(o.skillAt) - now, role = ctx.role(), res = null, mul = 1, btn, line, cdEl, effCd;
    if (a) {
      if (role) { try { res = store.resonance(o.id, role); } catch (er) { res = null; } if (res) mul = num(res.cdMul, 1); }
      if (o.stage === 'awake' && aw && aw.cdMul !== undefined) mul *= num(aw.cdMul, 1);
      effCd = num(a.cd) > 0 ? (num(a.cd) * mul) / Math.max(0.5, e) : 0;
      card.appendChild(h('div', { class: 'wsu-h', text: '助理技「' + a.name + '」' }));
      card.appendChild(h('p', { text: a.desc }));
      line = (num(a.cd) > 0 ? '冷卻 ' + a.cd + ' 分鐘（現在約 ' + effCd.toFixed(1) + ' 分鐘，活力越高越快）' : '沒有冷卻') + (a.perChapter ? '・每章 ' + a.perChapter + ' 次' : '');
      card.appendChild(h('p', { class: 'wsu-note', text: line }));
      var off = o.slot !== 'follow', cooling = cdLeft > 0;
      btn = h('button', {
        type: 'button', class: 'wsu-btn main', 'data-act': 'skill', 'data-id': o.id, disabled: off || cooling,
        text: cooling ? '冷卻中' : '使用「' + a.name + '」',
        on: { click: function () {
          var r = ctx.act(function () { return store.useSkill(o.id, { role: role, chapterId: ctx.chapterNow() }); });
          if (r && r.ok) { sayO(ctx, o.id, '用了「' + a.name + '」：' + a.desc, 'ok'); ctx.toast('助理技：' + a.name); if (typeof ctx.opts.onSkill === 'function') ctx.opts.onSkill(o.id, r); }
          else if (r && r.reason === 'chapter_cap') sayO(ctx, o.id, '這一章的「' + a.name + '」用完了（每章 ' + (a.perChapter || '') + ' 次）', 'warn');
          else sayO(ctx, o.id, why(r), 'warn');
          ctx.render();
        } }
      });
      card.appendChild(btn);
      if (cooling) { cdEl = h('span', { class: 'wsu-note', 'data-role': 'cooldown' }); card.appendChild(cdEl); ctx.countdown(cdEl, num(o.skillAt), ' 冷卻中 ', function () { ctx.render(); }); }
      if (off) card.appendChild(h('p', { class: 'wsu-note', text: '要放在隨行位才能使用。' }));
    }
    if (t) {
      card.appendChild(h('div', { class: 'wsu-h', text: '天賦「' + t.name + '」' }));
      card.appendChild(h('p', { text: t.desc }));
      card.appendChild(h('p', { class: 'wsu-note', text: o.slot === 'follow' ? '目前發揮 ' + Math.round(Math.min(1, e) * 100) + '%（活力低會打折）' : '放在隨行位才會生效。' }));
    }
    if (sc) {
      card.appendChild(h('div', { class: 'wsu-h', text: '勘察專長' }));
      card.appendChild(h('p', { text: (isArr(sc.kind) ? sc.kind.join('、') : String(sc.kind || '')) + '情報・' + (sc.era || '') }));
    }
    if (aw) {
      card.appendChild(h('div', { class: 'wsu-h', text: '覺醒技「' + aw.name + '」' }));
      card.appendChild(h('p', { text: aw.desc }));
      card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'awaken', text: o.stage === 'awake' ? '已覺醒，可以使用。' : '還沒覺醒。' + (aw.cond && aw.cond.desc ? '條件：' + aw.cond.desc : '') }));
    }
    card.appendChild(h('p', { class: 'wsu-note', text: '小精靈只給方向、出處和小提示，不會直接幫你完成任務。' }));
  }

  /* ---- 角色共鳴 */
  function renderReson(ctx, card, o, def) {
    var store = ctx.store, role = ctx.role(), res, rows = [], era;
    card.appendChild(h('div', { class: 'wsu-h', text: '和探員角色的搭配' }));
    if (!role) { card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'noRole', text: '還沒選探員角色，選好之後這裡會顯示共鳴。' })); return; }
    try { res = store.resonance(o.id, role); } catch (er) { res = null; }
    if (!res) { card.appendChild(h('p', { class: 'wsu-note', text: '共鳴資料還沒準備好。' })); return; }
    card.appendChild(h('p', { class: 'wsu-note', text: '角色：' + (res.role || (isObj(role) ? role.role : role)) + '　小精靈屬性：' + (def.attr || '') }));
    era = roleEra(role);
    rows.push(resRow('共鳴', res.resonance, '勘察收穫品質 ×1.5；助理技冷卻 −20%', '小精靈的屬性要和探員最高的屬性一樣'));
    rows.push(resRow('補位', res.fill, '探員在這項屬性視為 +1，補足短板', '小精靈的屬性要剛好是探員最低（2 以下）的那項'));
    if (era === null) rows.push(h('li', { 'data-state': 'wait' }, [h('b', { text: '歷史共鳴' }), '：還沒開放（等待資料）']));
    else {
      var eraTxt = isArr(era) ? era.join('、') : String(era), fam = roleFam(role);
      rows.push(resRow('歷史共鳴', res.history, res.historyLevel === 'familiar' ? '探員熟悉這個時期：每趟勘察多帶 0.5 件情報（效果減半）' : '探員專精這個時期：每趟勘察多帶 1 件情報，專家補充解鎖',
        '小精靈的時期要和探員專精（或熟悉）的時期一樣；這位探員專精「' + eraTxt + '」' + (fam.length ? '、熟悉「' + fam.join('、') + '」' : '')));
    }
    rows.push(resRow('專屬', !!res.special, res.special ? '「' + res.special.label + '」' + res.special.desc : '', '這個組合沒有特別搭檔'));
    card.appendChild(h('ul', { class: 'wsu-note' }, rows));
    if (era !== null) { var fam2 = roleFam(role); card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'eraInfo', text: '探員的歷史時期：專精「' + (isArr(era) ? era.join('、') : String(era)) + '」' + (fam2.length ? '、熟悉「' + fam2.join('、') + '」' : '') + '；小精靈的時期：' + ((def.scout && def.scout.era) || def.era || '') })); }
    card.appendChild(h('p', { text: res.kinds && res.kinds.length ? '現在的搭配：' + res.kinds.join('、') : '現在的搭配：平常（小精靈自己的技能照樣有效）' }));
  }
  function resRow(name, on, onText, offText) {
    return h('li', { 'data-state': on ? 'on' : 'off' }, [h('b', { text: name }), on ? '　✔ 啟動：' + onText : '　－ 未啟動：' + offText]);
  }

  /* ---- 聊天 */
  function renderChat(ctx, card, o, def) {
    var store = ctx.store, id = o.id, log = ctx.view.chat[id] || (ctx.view.chat[id] = []), left = store.chatLeft(), live = typeof ctx.opts.chat === 'function' && (typeof ctx.opts.online === 'function' ? !!ctx.opts.online() : true), box, input, send, wrap;
    card.appendChild(h('div', { class: 'wsu-h', text: '跟 ' + (def.nick || def.name) + ' 說說話' }));
    card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'chatleft', text: '今天還能聊 ' + left + ' 次（每天最多 ' + cap('chat') + ' 次）。小精靈只給方向和小提示，不會給任務答案。' }));
    if (!live) card.appendChild(h('div', { class: 'wsu-warn', 'data-role': 'offline', text: '電腦離線中，小精靈先用預寫好的話回你（這樣不扣次數）。' }));
    box = h('div', { class: 'wsu-log', role: 'log', 'aria-live': 'polite' });
    log.forEach(function (m) { box.appendChild(h('div', { class: 'wsu-bub' + (m.who === 'me' ? ' me' : ''), text: (m.who === 'me' ? '' : (def.nick || def.name) + '：') + m.text })); });
    if (!log.length) box.appendChild(h('div', { class: 'wsu-note', text: '還沒說過話。' }));
    if (ctx.view.wait && ctx.view.wait[id]) box.appendChild(h('div', { class: 'wsu-bub', 'data-role': 'typing', text: (def.nick || def.name) + '：……' }));
    card.appendChild(box);
    input = h('input', { type: 'text', class: 'wsu-in', maxLength: CHAT_IN, placeholder: '想跟牠說什麼？', 'aria-label': '對小精靈說的話', 'data-role': 'chat-input' });
    input.value = ctx.view.draft || '';
    ctx.view.chatInput = input;
    function pushReply(text) {
      var tx;
      if (ctx.view.wait) ctx.view.wait[id] = false;
      tx = cut(String(text || '').replace(/\s+/g, ' '), CHAT_MAX);
      if (!tx) tx = fallback(ctx, def);
      log.push({ who: 'sp', text: tx });
      while (log.length > 12) log.shift();
      ctx.render();
    }
    function doSend() {
      var text = cut(String(input.value || '').replace(/^\s+|\s+$/g, ''), CHAT_IN), tk, called = false;
      if (!text) return;
      ctx.view.draft = '';
      log.push({ who: 'me', text: text });
      if (live && left > 0) {
        tk = ctx.act(function () { return store.chatTick(); });
        if (!tk || !tk.ok) { pushReply(fallback(ctx, def)); return; }
        if (!ctx.view.wait) ctx.view.wait = {};
        ctx.view.wait[id] = true;
        try {
          ctx.opts.chat(id, text, function (reply) {
            if (called || ctx.dead) return;
            called = true;
            pushReply(isObj(reply) ? (reply.ok === false ? '' : reply.text) : reply);
          });
        } catch (er) { if (!called) { called = true; pushReply(fallback(ctx, def)); } return; }
        if (!called) ctx.render();      /* 等電腦回話：先顯示自己的話和「……」 */
      } else pushReply(fallback(ctx, def));
    }
    send = h('button', { type: 'button', class: 'wsu-btn main', 'data-act': 'chat-send', 'data-id': id, text: '送出', on: { click: doSend } });
    input.addEventListener('keydown', function (ev) { if (ev && (ev.key === 'Enter' || ev.keyCode === 13)) doSend(); });
    wrap = h('div', { class: 'wsu-row' }, [input, send]);
    card.appendChild(wrap);
    if (live && left <= 0) card.appendChild(h('p', { class: 'wsu-note', text: '今天的次數用完了，牠還是會用老話回你。' }));
  }
  function fallback(ctx, def) {
    var l = def && def.lines;
    return ctx.rand((l && l.idle && l.idle.length ? l.idle.concat(l.pet || []) : null)) || '嗯嗯，我在聽。';
  }

  /* ---- 蛋與領回 */
  function renderEggs(ctx, rootEl, owned) {
    var store = ctx.store, eggs = store.eggs(), cost = store._c && store._c.HATCH_BOOST_COST ? store._c.HATCH_BOOST_COST : 20, full = owned.length >= 3;
    if (!eggs.length) return;
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '蛋（' + eggs.length + '）' }));
    eggs.forEach(function (e) {
      var def = spiritDef(e.id) || {}, card = h('section', { class: 'wsu-card', 'data-kind': 'egg', 'data-id': e.id }), body, pts, cdEl;
      body = h('div', null, [h('div', { class: 'wsu-name', text: '神祕的蛋' }), h('div', { class: 'wsu-row' }, [rarityBadge(def.rarity)])]);
      card.appendChild(h('div', { class: 'wsu-head' }, [pixImg(stageSprite(def, 'egg'), 4, '蛋'), body]));
      if (e.ready) {
        body.appendChild(h('div', { class: 'wsu-note', text: '蛋殼在動，可以孵了！' }));
        card.appendChild(h('button', {
          type: 'button', class: 'wsu-btn main', 'data-act': 'hatch', 'data-id': e.id, disabled: full, text: '孵化',
          on: { click: function () {
            var r = ctx.act(function () { return store.hatch(e.id); });
            if (r && r.ok) ctx.say('孵出來了：' + (def.name || '新夥伴') + '！', 'ok'); else ctx.say(why(r, 'hatch'), 'warn');
            ctx.render();
          } }
        }));
        if (full) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'hatch-blocked', text: '已經養了 3 隻，先送回圖鑑一隻才能孵新的。' }));
      } else {
        cdEl = h('div', { class: 'wsu-note', 'data-role': 'egg-cd' });
        body.appendChild(cdEl);
        ctx.countdown(cdEl, ctx.now() + num(e.nextTickMs, 0), '還要 ' + num(e.remainTicks) + ' 格（約 ' + num(e.remainTicks) * TICK_MIN + ' 分鐘），下一格 ', function () { ctx.render(); });
        pts = typeof ctx.opts.getPoints === 'function' ? num(ctx.opts.getPoints(), 0) : null;
        var poor = pts !== null && pts < cost;
        card.appendChild(ctx.confirmBtn('wsu-btn', '加速孵化（' + cost + ' 點）', '再按一次確認', function () {
          var r = ctx.act(function () { return store.hatch(e.id, { boost: true }); });
          if (r && r.ok) ctx.say('用 ' + cost + ' 點加速，孵出來了：' + (def.name || '新夥伴') + '！', 'ok'); else ctx.say(why(r, 'hatch'), 'warn');
          ctx.render();
        }, { 'data-act': 'boost', 'data-id': e.id }));
        if (poor || full) card.lastChild.disabled = true;
        if (poor) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'boost-blocked', text: '點數不夠（需要 ' + cost + ' 點，現在 ' + pts + ' 點）。' }));
        if (full) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'hatch-blocked', text: '已經養了 3 隻，先送回圖鑑一隻才能孵新的。' }));
      }
      rootEl.appendChild(card);
    });
  }
  function renderReleased(ctx, rootEl, st, owned) {
    var store = ctx.store, rel = st.spirit.released || [];
    if (!rel.length || typeof store.reclaim !== 'function') return;
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '圖鑑裡的夥伴' }));
    rel.forEach(function (id) {
      var def = spiritDef(id) || { name: id }, dup = owned.some(function (o) { return o.id === id; }), full = owned.length >= 3, card = h('section', { class: 'wsu-card', 'data-kind': 'released', 'data-id': id }), reason = full ? '已經養了 3 隻，先送回一隻才能領回。' : (dup ? '已經有同一種了。' : '');
      card.appendChild(h('div', { class: 'wsu-row' }, [h('b', { text: def.name }), rarityBadge(def.rarity)]));
      card.appendChild(h('button', {
        type: 'button', class: 'wsu-btn', 'data-act': 'reclaim', 'data-id': id, disabled: full || dup, text: '領回',
        on: { click: function () {
          var r = ctx.act(function () { return store.reclaim(id); });
          if (r && r.ok) ctx.say('把「' + def.name + '」領回來了。', 'ok'); else ctx.say(why(r, 'reclaim'), 'warn');
          ctx.render();
        } }
      }));
      if (reason) card.appendChild(h('p', { class: 'wsu-note', 'data-role': 'reclaim-blocked', text: reason }));
      rootEl.appendChild(card);
    });
  }

  /* ================================================================ 情報卡（兩個入口共用） */
  function hintOn(ctx) {
    var tl = null;
    try { if (typeof ctx.store.talents === 'function') tl = ctx.store.talents(); } catch (e) { tl = null; }
    return !!(tl && tl.formEffects && num(tl.formEffects.intelNextHint) > 0);
  }
  function levelOf(c) { var l = c.level; return l === '有出處' || l === '摘要級' || l === '待查證' ? l : '待查證'; }
  function intelCard(c, chName, withHint) {
    var lv = levelOf(c), tbd = lv === '待查證', type = normType(c.type), src = c.source ? String(c.source) : '';
    var el = h('article', { class: 'wsu-icard' + (tbd ? ' tbd' : ''), 'data-kind': 'intel', 'data-id': c.id, 'data-level': lv, 'data-type': type });
    el.appendChild(h('div', { class: 'wsu-row' }, [
      h('span', { class: 'wsu-tag' }, [h('span', { 'aria-hidden': 'true', text: TYPE_ICON[type] || '📄' }), ' ' + (type || '情報') + '卡']),
      rarityBadge(c.rarity),
      h('span', { class: 'wsu-lv' + (tbd ? ' tbd' : ''), text: (tbd ? '⚠ ' : '') + lv })
    ]));
    if (chName) el.appendChild(h('div', { class: 'wsu-note', text: chName }));
    el.appendChild(h('p', { text: c.text || '' }));
    el.appendChild(h('div', { class: 'wsu-note', text: '出處：' + (src || '還沒補上') }));
    if (withHint) el.appendChild(h('div', { class: 'wsu-note', 'data-role': 'next-hint', text: '📚 再往下查的方向：' + nextHint(c) }));
    if (tbd) el.appendChild(h('div', { class: 'wsu-note', 'data-role': 'tbd-note', text: '待查證：還沒有找到可靠的出處，先當作線索，不要當成事實。' }));
    return el;
  }
  function chapterEntries(ctx) {
    var raw = typeof ctx.opts.chapters === 'function' ? ctx.opts.chapters() : ctx.opts.chapters, out = [], seen = {};
    if (isArr(raw)) {
      raw.forEach(function (c) {
        var id = isObj(c) ? c.id : c;
        if (id === undefined || id === null || seen[id]) return;
        seen[id] = 1;
        out.push({ id: id, name: isObj(c) && c.name ? c.name : null });
      });
    } else {
      intelDefs().forEach(function (c) { if (!seen[c.chapter]) { seen[c.chapter] = 1; out.push({ id: c.chapter, name: null }); } });
    }
    return out;
  }
  function chapterName(ctx, id, listed) {
    var n = listed && listed.name;
    if (!n && typeof ctx.opts.chapterName === 'function') { try { n = ctx.opts.chapterName(id); } catch (e) { n = null; } }
    return n || String(id);
  }

  /* ================================================================ 勘察派遣 */
  function mountExpedition(container, opts) {
    var ctx = makeCtx(container, opts, renderExpedition);
    ctx.label = '勘察派遣';
    ctx.view.tier = 'mid';
    return controller(ctx);
  }

  function estimate(ctx, o, tierKey, res, remaining) {
    var tiers = ctx.store.TIERS || TIER_DEF, tier = tiers[tierKey] || TIER_DEF[tierKey], adult = o.stage === 'adult' || o.stage === 'awake' ? 1 : 0, e = num(o.efficiency, 1);
    var raw = (tier.base + adult) * (res && res.resonance ? 1.5 : 1) + (res ? (res.extraItems !== undefined ? num(res.extraItems) : (res.history ? 1 : 0)) : 0), n;
    raw = Math.min(5, raw);
    n = Math.min(5, Math.max(1, Math.round(raw * e)));
    if (remaining !== undefined) n = Math.max(0, Math.min(n, remaining));
    return { n: n, base: tier.base, adult: adult, e: e, res: res, min: tier.min };
  }

  function renderExpedition(ctx, rootEl) {
    var store = ctx.store, st = ctx.state = store.state(), x = store.expedition(), view = ctx.view;
    msgBox(ctx, rootEl);
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '勘察派遣' }));
    rootEl.appendChild(h('p', { class: 'wsu-note', text: '派小精靈去已經到過的章節找情報。任何時間都能派，不用在現場；牠不會空手回來。' }));
    rootEl.appendChild(h('p', { class: 'wsu-note', 'data-role': 'dailyleft', text: '今天還能派 ' + num(x.dailyLeft) + ' 次（每天最多 ' + cap('dispatch') + ' 次）' }));
    if (view.result) renderResult(ctx, rootEl);
    if (x.active) renderActive(ctx, rootEl, x); else renderPlan(ctx, rootEl, x);
  }

  function renderActive(ctx, rootEl, x) {
    var store = ctx.store, def = spiritDef(x.spiritId) || { name: x.spiritId }, o = null, card = h('section', { class: 'wsu-card', 'data-kind': 'active' }), cdEl, tier = tierOf(ctx, x.tier);
    store.owned().forEach(function (s) { if (s.id === x.spiritId) o = s; });
    card.appendChild(h('div', { class: 'wsu-head' }, [
      pixImg(stageSprite(def, o ? o.stage : 'baby'), 4, def.name),
      h('div', null, [
        h('div', { class: 'wsu-name', text: (def.nick || def.name) + ' 正在勘察' }),
        h('div', { class: 'wsu-note', text: '地點：' + chapterName(ctx, x.chapterId) + '・' + (tier.name || '') + '檔（' + (tier.min || '') + ' 分鐘）' })
      ])
    ]));
    if (x.ready || x.remainMs <= 0) {
      card.appendChild(h('p', { text: '牠回來了，好像帶了東西！' }));
      card.appendChild(h('button', {
        type: 'button', class: 'wsu-btn main', 'data-act': 'collect', text: '領取情報',
        on: { click: function () {
          var r = ctx.act(function () { return store.collect(); });
          if (r && r.ok) {
            ctx.view.result = r; ctx.say('帶回了 ' + r.count + ' 張情報卡。', 'ok'); ctx.toast('勘察回來了：' + r.count + ' 張情報');
            if (typeof ctx.opts.onCollect === 'function') ctx.opts.onCollect(r);
          } else ctx.say(why(r), 'warn');
          ctx.render();
        } }
      }));
    } else {
      cdEl = h('p', { 'data-role': 'remain' });
      card.appendChild(cdEl);
      ctx.countdown(cdEl, ctx.now() + num(x.nextTickMs, 0), '還要 ' + num(x.remainTicks) + ' 格（每格 ' + TICK_MIN + ' 分鐘）・預計 ' + fmtHM(num(x.etaTs, num(x.endTs))) + ' 完成，下一格 ', function () { ctx.render(); });
      card.appendChild(h('p', { class: 'wsu-note', text: '可以先去做別的，時間到再回來領。' }));
    }
    rootEl.appendChild(card);
  }

  function renderResult(ctx, rootEl) {
    var r = ctx.view.result, def = spiritDef(r.spiritId) || { name: '小精靈' }, box = h('section', { class: 'wsu-card', 'data-kind': 'result' });
    box.appendChild(h('div', { class: 'wsu-h', text: (def.nick || def.name) + ' 帶回了 ' + r.count + ' 張情報卡（品質：' + (r.quality || '普通') + '）' }));
    box.appendChild(h('p', { class: 'wsu-note', text: '地點：' + chapterName(ctx, r.chapterId) + '。牠也回復了一點活力，和你更親了。' }));
    (r.cards || []).forEach(function (c) { box.appendChild(intelCard(c, null, hintOn(ctx))); });
    box.appendChild(h('button', { type: 'button', class: 'wsu-btn', 'data-act': 'dismiss', text: '收下了', on: { click: function () { ctx.view.result = null; ctx.render(); } } }));
    rootEl.appendChild(box);
  }

  function renderPlan(ctx, rootEl, x) {
    var store = ctx.store, view = ctx.view, owned = store.owned(), scouts = owned.filter(function (o) { return o.slot === 'scout' && o.stage !== 'egg'; });
    var chapters = chapterEntries(ctx), sp, chosen = null, role = ctx.role(), res = null, rows, box;
    /* 1 選小精靈 */
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '1. 派誰去' }));
    if (!scouts.length) {
      rootEl.appendChild(h('p', { class: 'wsu-note', 'data-role': 'noscout', text: '還沒有小精靈在勘察位。到「小精靈」頁把一隻放到勘察位，就能派牠出門。' }));
      return;
    }
    if (!view.spirit || !scouts.some(function (s) { return s.id === view.spirit; })) view.spirit = scouts[0].id;
    rows = h('div', { class: 'wsu-row' });
    scouts.forEach(function (s) {
      var d = spiritDef(s.id) || { name: s.id };
      rows.appendChild(h('button', {
        type: 'button', class: 'wsu-chip' + (view.spirit === s.id ? ' on' : ''), 'aria-pressed': view.spirit === s.id ? 'true' : 'false', 'data-act': 'pick-spirit', 'data-id': s.id,
        text: (d.nick || d.name) + '・活力 ' + Math.round(s.vigor) + '・' + vigorState(s.vigor),
        on: { click: function () { view.spirit = s.id; ctx.render(); } }
      }));
      if (view.spirit === s.id) chosen = s;
    });
    rootEl.appendChild(rows);
    sp = chosen;
    if (num(sp.vigor) < LOW_VIGOR) rootEl.appendChild(h('div', { class: 'wsu-warn', 'data-role': 'lowvigor', role: 'status', text: '活力低，效能約 ×0.6，建議先餵食或玩耍；活力低會讓帶回的情報變少。' }));
    if (role) { try { res = store.resonance(sp.id, role); } catch (er) { res = null; } }

    /* 2 選章節（先決定選了哪一章，再畫） */
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '2. 去哪一章' }));
    var info = {}, sel = null;
    chapters.forEach(function (c) {
      var total = intelTotal(c.id), got = store.intel(c.id).length;
      info[c.id] = { total: total, got: got, off: total === 0 || got >= total, done: total > 0 && got >= total };
      if (view.chapter === c.id && !info[c.id].off) sel = c;
    });
    if (!sel) {
      for (var i = 0; i < chapters.length; i++) if (!info[chapters[i].id].off) { sel = chapters[i]; break; }
    }
    view.chapter = sel ? sel.id : undefined;
    if (!chapters.length) rootEl.appendChild(h('p', { class: 'wsu-note', text: '還沒有到過的章節。先去走一站，回來就能派牠去那裡。' }));
    chapters.forEach(function (c) {
      var f = info[c.id], on = !!sel && sel.id === c.id;
      rootEl.appendChild(h('button', {
        type: 'button', class: 'wsu-chip wsu-pick' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-act': 'pick-chapter', 'data-id': c.id, disabled: f.off,
        text: chapterName(ctx, c.id, c) + '　情報 ' + f.got + '／' + f.total + (f.done ? '　這章已集滿' : (f.total === 0 ? '　還沒有情報' : '')),
        on: { click: function () { view.chapter = c.id; ctx.render(); } }
      }));
    });
    var remaining = sel ? info[sel.id].total - info[sel.id].got : undefined;

    /* 3 選檔位 */
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '3. 去多久' }));
    box = h('div', { class: 'wsu-row' });
    TIER_KEYS.forEach(function (k) {
      var t = tierOf(ctx, k), est = estimate(ctx, sp, k, res, remaining);
      box.appendChild(h('button', {
        type: 'button', class: 'wsu-chip' + (view.tier === k ? ' on' : ''), 'aria-pressed': view.tier === k ? 'true' : 'false', 'data-act': 'pick-tier', 'data-tier': k,
        text: t.name + '檔 ' + t.min + ' 分鐘（' + t.ticks + ' 格）・約 ' + est.n + ' 件',
        on: { click: function () { view.tier = k; ctx.render(); } }
      }));
    });
    rootEl.appendChild(box);
    rootEl.appendChild(h('p', { class: 'wsu-note', text: '長檔也可以是「走完一站就回報」。件數是預估，實際看這章還剩幾張。' }));
    var est2 = estimate(ctx, sp, view.tier, res, remaining);
    rootEl.appendChild(h('p', { 'data-role': 'estimate', text: '預估帶回約 ' + est2.n + ' 件（基礎 ' + est2.base + (est2.adult ? ' ＋成體 1' : '') + ' × 效能 ' + est2.e.toFixed(2) + (res && res.resonance ? ' × 共鳴 1.5' : '') + (res && res.history ? ' ＋歷史共鳴 1' : '') + '）' }));

    /* 派出 */
    var left = num(x.dailyLeft), block = null;
    if (left <= 0) block = '今天派了 ' + cap('dispatch') + ' 次，用完了，明天再派。';
    else if (!sel) block = chapters.length ? '請先選一個還沒集滿的章節。' : '還沒有可以去的章節。';
    rootEl.appendChild(h('button', {
      type: 'button', class: 'wsu-btn main', 'data-act': 'dispatch', disabled: !!block, text: '派出去',
      on: { click: function () {
        var p = { spiritId: sp.id, chapterId: sel.id, tier: view.tier };
        if (role) p.role = role;
        var r = ctx.act(function () { return store.dispatch(p); });
        if (r && r.ok) ctx.say((spiritDef(sp.id).nick || spiritDef(sp.id).name) + ' 出發了！' + (r.lowVigorWarning ? ' （活力低，帶回的會比較少）' : ''), 'ok'); else ctx.say(why(r), 'warn');
        ctx.render();
      } }
    }));
    if (block) rootEl.appendChild(h('p', { class: 'wsu-note', 'data-role': 'dispatch-blocked', text: block }));
  }

  /* ================================================================ 情報收件匣 */
  function mountIntel(container, opts) {
    var ctx = makeCtx(container, opts, renderIntel);
    ctx.label = '情報收件匣';
    ctx.view.fch = 'all'; ctx.view.ftype = 'all';
    return controller(ctx);
  }

  function renderIntel(ctx, rootEl) {
    var store = ctx.store, view = ctx.view, cards = store.intel(), byCh = {}, order = [], row;
    cards.forEach(function (c) { var k = String(c.chapter); if (!byCh[k]) { byCh[k] = []; order.push(k); } byCh[k].push(c); });
    rootEl.appendChild(h('div', { class: 'wsu-h', text: '情報收件匣（' + cards.length + ' 張）' }));
    if (!cards.length) {
      rootEl.appendChild(h('p', { 'data-role': 'empty', text: '還沒有情報。派小精靈去勘察，帶回來的卡片會收在這裡。' }));
    } else {
      row = h('div', { class: 'wsu-row', role: 'group', 'aria-label': '章節' });
      row.appendChild(filterChip(ctx, 'fch', 'all', '全部章節'));
      order.forEach(function (k) { row.appendChild(filterChip(ctx, 'fch', k, chapterName(ctx, k))); });
      rootEl.appendChild(row);
      row = h('div', { class: 'wsu-row', role: 'group', 'aria-label': '類別' });
      row.appendChild(filterChip(ctx, 'ftype', 'all', '全部類別'));
      TYPES.forEach(function (t) { row.appendChild(filterChip(ctx, 'ftype', t, (TYPE_ICON[t] || '') + ' ' + t + '卡')); });
      rootEl.appendChild(row);
      order.forEach(function (k) {
        if (view.fch !== 'all' && view.fch !== k) return;
        var list = byCh[k].filter(function (c) { return view.ftype === 'all' || normType(c.type) === view.ftype; }), total = intelTotal(k), got = byCh[k].length, sec;
        list.sort(function (a, b) { return num(b.ts) - num(a.ts); });
        sec = h('section', { class: 'wsu-card', 'data-kind': 'chapter', 'data-id': k });
        sec.appendChild(h('div', { class: 'wsu-row' }, [
          h('b', { text: chapterName(ctx, k) }),
          h('span', { class: 'wsu-note', text: '已收集 ' + got + (total ? '／' + total : '') }),
          total > 0 && got >= total ? h('span', { class: 'wsu-full', 'data-role': 'full', text: '這章已集滿' }) : null
        ]));
        if (!list.length) sec.appendChild(h('p', { class: 'wsu-note', text: '這個類別在這章還沒有卡。' }));
        list.forEach(function (c) { sec.appendChild(intelCard(c, null, hintOn(ctx))); });
        rootEl.appendChild(sec);
      });
    }
    if (typeof store.convertDuplicates === 'function') {
      rootEl.appendChild(h('button', {
        type: 'button', class: 'wsu-btn', 'data-act': 'convert', text: '把重複的情報換成點心',
        on: { click: function () {
          var r = ctx.act(function () { return store.convertDuplicates(); });
          ctx.say(r && r.ok ? '換好了。' : why(r), r && r.ok ? 'ok' : 'warn'); ctx.render();
        } }
      }));
    } else {
      rootEl.appendChild(h('p', { class: 'wsu-note', 'data-role': 'dupnote', text: '重複拿到的情報會換成同類的點心：還沒開放。集滿的章節再派牠去，也不會有新卡。' }));
    }
    msgBox(ctx, rootEl);
  }
  function filterChip(ctx, key, val, label) {
    var on = ctx.view[key] === val;
    return h('button', {
      type: 'button', class: 'wsu-chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-act': 'filter', 'data-key': key, 'data-val': val, text: label,
      on: { click: function () { ctx.view[key] = val; ctx.render(); } }
    });
  }

  root.WalkSpiritUI = {
    VERSION: VERSION,
    mount: mount,
    mountExpedition: mountExpedition,
    mountIntel: mountIntel,
    _css: CSS,
    _fmtClock: fmtClock,
    _behaviorText: behaviorText,
    _estimate: estimate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WalkSpiritUI;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
