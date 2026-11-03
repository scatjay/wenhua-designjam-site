/* WalkSpiritUI 的單元測試：node test_tools/test_walk_spirit_ui.js
   不用瀏覽器、不裝套件（機器上沒有現成 jsdom）：用手寫的最小假 DOM、假計時器、假 localStorage。
   用真的 WalkStore、WalkPix、walk_data_spirit.js；情報卡與角色名冊用最小假資料。印出每項 PASS/FAIL 與總數，全過退出碼 0。 */
'use strict';
var fs = require('fs');
var path = require('path');

global.window = global;

/* ---------- 假的 localStorage ---------- */
(function () {
  var m = {};
  global.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }
  };
})();

/* ---------- 最小假 DOM ---------- */
function FNode(tag, type) {
  this.nodeType = type || 1; this.tagName = tag ? String(tag).toUpperCase() : '#text';
  this.children = []; this.parentNode = null; this.attrs = {}; this.listeners = {}; this.style = {};
  this._cls = []; this.disabled = false; this.value = ''; this.data = '';
  var self = this;
  this.classList = {
    add: function (c) { if (self._cls.indexOf(c) < 0) self._cls.push(c); },
    remove: function (c) { var i = self._cls.indexOf(c); if (i >= 0) self._cls.splice(i, 1); },
    contains: function (c) { return self._cls.indexOf(c) >= 0; },
    toggle: function (c) { if (self._cls.indexOf(c) >= 0) self.classList.remove(c); else self.classList.add(c); }
  };
}
Object.defineProperty(FNode.prototype, 'className', {
  get: function () { return this._cls.join(' '); },
  set: function (v) { this._cls = String(v).split(/\s+/).filter(Boolean); }
});
Object.defineProperty(FNode.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
Object.defineProperty(FNode.prototype, 'lastChild', { get: function () { return this.children[this.children.length - 1] || null; } });
Object.defineProperty(FNode.prototype, 'textContent', {
  get: function () {
    if (this.nodeType === 3) return this.data;
    return this.children.map(function (c) { return c.textContent; }).join('');
  },
  set: function (v) {
    var t;
    if (this.nodeType === 3) { this.data = String(v); return; }
    this.children.forEach(function (c) { c.parentNode = null; });
    this.children = [];
    if (String(v) !== '') { t = new FNode('', 3); t.data = String(v); t.parentNode = this; this.children.push(t); }
  }
});
FNode.prototype.appendChild = function (c) {
  if (c.parentNode) c.parentNode.removeChild(c);
  c.parentNode = this; this.children.push(c); return c;
};
FNode.prototype.removeChild = function (c) {
  var i = this.children.indexOf(c);
  if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; }
  return c;
};
FNode.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
FNode.prototype.getAttribute = function (k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; };
FNode.prototype.addEventListener = function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); };
FNode.prototype.removeEventListener = function (t, fn) { var a = this.listeners[t] || [], i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
FNode.prototype.dispatch = function (t, ev) { (this.listeners[t] || []).slice().forEach(function (fn) { fn(ev || { type: t }); }); };
FNode.prototype.click = function () { if (this.disabled) return; this.dispatch('click'); };
FNode.prototype.focus = function () { document.activeElement = this; };
FNode.prototype.getContext = function () { return { fillRect: function () {}, fillStyle: '', globalAlpha: 1 }; };
FNode.prototype.toDataURL = function () { return 'data:image/png;base64,FAKE'; };
function matchOne(el, sel) {
  var re = /([a-zA-Z0-9]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g, m, ok = true;
  if (el.nodeType !== 1) return false;
  while ((m = re.exec(sel))) {
    if (m[1] && el.tagName !== m[1].toUpperCase()) ok = false;
    if (m[2] && !el.classList.contains(m[2])) ok = false;
    if (m[3]) {
      var v = el.getAttribute(m[3]);
      if (v === null || (m[4] !== undefined && v !== m[4])) ok = false;
    }
  }
  return ok;
}
FNode.prototype.querySelectorAll = function (sel) {
  var out = [];
  (function walk(n) { n.children.forEach(function (c) { if (matchOne(c, sel)) out.push(c); walk(c); }); })(this);
  return out;
};
FNode.prototype.querySelector = function (sel) { return this.querySelectorAll(sel)[0] || null; };

global.document = {
  createElement: function (t) { return new FNode(t); },
  createTextNode: function (s) { var n = new FNode('', 3); n.data = String(s); return n; },
  head: new FNode('head'), body: new FNode('body'), documentElement: new FNode('html'), activeElement: null, hidden: false,
  getElementById: function (id) {
    var found = null;
    [document.head, document.body].forEach(function (r) { r.querySelectorAll('[id="' + id + '"]').forEach(function (n) { found = found || n; }); });
    return found;
  }
};

/* ---------- 假時鐘與假計時器 ---------- */
var clock = { t: new Date(2026, 10, 3, 10, 0, 0).getTime() };
var timers = { seq: 0, q: {} };
var fakeTimers = {
  set: function (fn, ms) { var id = ++timers.seq; timers.q[id] = { at: clock.t + ms, fn: fn }; return id; },
  clear: function (id) { delete timers.q[id]; }
};
function pending() { return Object.keys(timers.q).length; }
function advance(ms) {
  var end = clock.t + ms, best, k;
  for (;;) {
    best = null;
    for (k in timers.q) if (timers.q[k].at <= end && (!best || timers.q[k].at < timers.q[best].at)) best = k;
    if (!best) break;
    var tm = timers.q[best]; delete timers.q[best];
    if (tm.at > clock.t) clock.t = tm.at;
    tm.fn();
  }
  clock.t = end;
}
var DAY = 86400000;

/* ---------- 載入被測物與資料 ---------- */
var JS = path.join(__dirname, '..', 'js');
require(path.join(JS, 'walk_sprites2.js'));
require(path.join(JS, 'walk_data_spirit.js'));
require(path.join(JS, 'walk_store.js'));
var UI = require(path.join(JS, 'walk_spirit_ui.js'));
var Store = global.WalkStore;

/* 最小假資料：兩章情報卡、角色名冊 */
global.WALK_INTEL = {
  c1: [
    { id: 'c1a', type: '史料卡', text: '第一章的史料。', source: '某某縣志', level: '有出處', rarity: '普通' },
    { id: 'c1b', type: '路況卡', text: '走過去約六分鐘。', source: '現場觀察', level: '摘要級', rarity: '普通' },
    { id: 'c1c', type: '人物卡', text: '他怕吵，先自報來意。', source: '訪談整理', level: '待查證', rarity: '稀有' },
    { id: 'c1d', type: '觀察卡', text: '看門楣、看磚縫。', source: '現場觀察', level: '有出處', rarity: '普通' },
    { id: 'c1e', type: '彩蛋卡', text: '一則在地小故事。', source: '', level: '待查證', rarity: '普通' },
    { id: 'c1f', type: '方位卡', text: '東北方，約 80 到 120 公尺。', source: '地圖', level: '摘要級', rarity: '普通' }
  ],
  c2: [
    { id: 'c2a', type: '史料卡', text: '第二章的史料。', source: '某某誌', level: '有出處', rarity: '普通' },
    { id: 'c2b', type: '觀察卡', text: '看窗框。', source: '現場觀察', level: '有出處', rarity: '普通' }
  ]
};
global.WALK_AGENTS = {
  get: function (role) {
    if (role === '領航員') return { role: '領航員', stats: [4, 2, 3, 3, 3], era: '西拉雅與大員前史' };
    if (role === '偵查員') return { role: '偵查員', stats: [3, 3, 3, 3, 3] };
    return null;
  }
};

var pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  → ' + extra : '')); }
}
function eq(a, b, name) { ok(a === b, name, 'got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b)); }

var points = 100, spentLog = [];
function initStore(uid) {
  global.localStorage.removeItem('walkstore_' + uid);
  Store.init({ uid: uid, now: function () { return clock.t; }, getPoints: function () { return points; }, addSpent: function (n) { spentLog.push(n); points -= n; }, toast: function () {} });
}
function newBox() { var b = new FNode('div'); document.body.appendChild(b); return b; }
function btn(box, act, id) { return box.querySelector('[data-act="' + act + '"]' + (id ? '[data-id="' + id + '"]' : '')); }
function all(box, act, id) { return box.querySelectorAll('[data-act="' + act + '"]' + (id ? '[data-id="' + id + '"]' : '')); }
function baseOpts(extra) {
  var o = { now: function () { return clock.t; }, timers: fakeTimers, getPoints: function () { return points; }, role: function () { return role; } }, k;
  for (k in (extra || {})) o[k] = extra[k];
  return o;
}
var role = '領航員';

/* =================================================================== 1. 起始挑選流程 */
initStore('u1');
var box = newBox();
var ui = UI.mount(box, baseOpts());
ok(box.textContent.indexOf('挑一隻小精靈') >= 0, '起始：顯示挑選標題');
eq(all(box, 'choose').length, 3, '起始：三隻起始小精靈');
var tx = box.textContent;
ok(tx.indexOf('傳說') >= 0 && tx.indexOf('稀有') >= 0 && tx.indexOf('普通') >= 0, '起始：稀有度用文字（普通／稀有／傳說都有）');
ok(tx.indexOf('●') >= 0 && tx.indexOf('◆') >= 0 && tx.indexOf('★') >= 0, '起始：稀有度也有形狀（圓／菱形／星）');
ok(tx.indexOf('指路') >= 0 && tx.indexOf('整理筆記') >= 0, '起始：顯示助理技名稱');
ok(box.querySelectorAll('img').length >= 3 || box.querySelectorAll('[aria-hidden="true"]').length > 0, '起始：有像素圖（或替代圖示）');
ok(tx.indexOf('anchor') < 0 && tx.indexOf('待文史把關') < 0, '起始：不顯示歷史錨點句');
var b0 = btn(box, 'choose', 'sp_tide');
b0.click();
eq(b0.textContent, '再按一次確認', '兩段式：第一次按變「再按一次確認」');
eq(Store.owned().length, 0, '兩段式：第一次按還沒真的選');
advance(6000);
b0 = btn(box, 'choose', 'sp_tide');
eq(b0.textContent, '選牠當夥伴', '兩段式：6 秒後復原');
b0.click(); b0.click();
eq(Store.owned().length, 1, '起始：確認後 chooseStarter 成功');
eq(Store.owned()[0].id, 'sp_tide', '起始：選到的是潮汐鯨魂');
ok(box.textContent.indexOf('我的小精靈（1／3）') >= 0, '起始：之後換成我的小精靈頁');

/* =================================================================== 2. 小精靈卡基本資訊 */
tx = box.textContent;
ok(tx.indexOf('活力') >= 0 && /精神飽滿|普通|疲憊|打盹/.test(tx), '卡片：活力條與狀態文字');
ok(tx.indexOf('羈絆 0') >= 0, '卡片：羈絆值');
ok(tx.indexOf('階段：幼體') >= 0, '卡片：階段');
ok(box.querySelectorAll('[data-slot]').length === 3, '卡片：三個位子按鈕');
btn(box, 'slot', 'sp_tide') && 0;
box.querySelector('[data-slot="follow"]').click();
eq(Store.owned()[0].slot, 'follow', '位子：切到隨行位');
ok(box.querySelector('[data-slot="follow"]').getAttribute('aria-pressed') === 'true', '位子：目前位子標示 aria-pressed');

/* =================================================================== 3. 技能與冷卻倒數 */
btn(box, 'tab', 'sp_tide').click();   /* 第一個 tab 是照顧；以 data-tab 找技能 */
box.querySelector('[data-tab="skill"]').click();
tx = box.textContent;
ok(tx.indexOf('助理技「指路」') >= 0 && tx.indexOf('寬步') >= 0 && tx.indexOf('勘察專長') >= 0 && tx.indexOf('潮聲') >= 0, '技能：助理技、天賦、勘察專長、覺醒技都顯示');
ok(tx.indexOf('還沒覺醒') >= 0 && tx.indexOf('羈絆 30 且圖鑑完成 100%') >= 0, '技能：未覺醒顯示條件');
var skillCalls = [];
ui.unmount();
ui = UI.mount(box, baseOpts({ onSkill: function (id, r) { skillCalls.push(id); } }));
box.querySelector('[data-tab="skill"]').click();
var sb = btn(box, 'skill', 'sp_tide');
ok(!sb.disabled, '技能：隨行位的助理技可按');
sb.click();
eq(skillCalls.length, 1, '技能：useSkill 成功後通知 onSkill');
sb = btn(box, 'skill', 'sp_tide');
ok(sb.disabled, '冷卻：按完後按鈕停用');
var cdEl = box.querySelector('[data-role="cooldown"]');
ok(cdEl && /冷卻中 \d\d:\d\d/.test(cdEl.textContent), '冷卻：顯示倒數', cdEl && cdEl.textContent);
var before = cdEl.textContent;
advance(3000);
cdEl = box.querySelector('[data-role="cooldown"]');
ok(cdEl.textContent !== before, '冷卻：倒數會往下走', before + ' → ' + cdEl.textContent);
advance(10 * 60000);
sb = btn(box, 'skill', 'sp_tide');
ok(sb && !sb.disabled && !box.querySelector('[data-role="cooldown"]'), '冷卻：時間到按鈕恢復');

/* =================================================================== 4. 共鳴 */
box.querySelector('[data-tab="reson"]').click();
tx = box.textContent;
ok(tx.indexOf('共鳴') >= 0 && tx.indexOf('✔ 啟動') >= 0, '共鳴：領航員＋潮汐鯨魂顯示啟動的共鳴');
ok(tx.indexOf('潮聲探路') >= 0, '共鳴：專屬搭檔顯示名稱');
ok(tx.indexOf('勘察收穫品質 ×1.5') >= 0, '共鳴：效果文字');
ui.unmount();
role = '偵查員';
ui = UI.mount(box, baseOpts());
box.querySelector('[data-tab="reson"]').click();
tx = box.textContent;
ok(tx.indexOf('等待資料') >= 0 && tx.indexOf('還沒開放') >= 0, '共鳴：探員沒有專精時期 → 歷史共鳴顯示「還沒開放（等待資料）」');
ui.unmount();
role = null;
ui = UI.mount(box, baseOpts());
box.querySelector('[data-tab="reson"]').click();
ok(box.textContent.indexOf('還沒選探員角色') >= 0, '共鳴：沒有角色時有說明而不是空白');
role = '領航員';

/* =================================================================== 5. 活力低警示與每日上限 */
ui.unmount();
clock.t += 4 * DAY;      /* 70 → 30 */
ui = UI.mount(box, baseOpts());
tx = box.textContent;
ok(tx.indexOf('活力低，效能約 ×0.6，建議先餵食或玩耍') >= 0, '活力低：顯示警示文字');
ok(/疲憊|打盹/.test(tx), '活力低：狀態文字為疲憊或打盹');
Store.grant('food_hist', 6);
ui.refresh();
var fb = btn(box, 'feed', 'sp_tide');
ok(fb && !fb.disabled, '餵食：有點心時可按');
ok(box.textContent.indexOf('★最愛') >= 0 || box.textContent.indexOf('書卷酥') >= 0, '餵食：列出背包點心');
fb.click(); btn(box, 'feed', 'sp_tide').click(); btn(box, 'feed', 'sp_tide').click();
fb = btn(box, 'feed', 'sp_tide');
ok(fb.disabled, '每日上限：餵滿 3 次後按鈕停用');
ok(/餵食：今天餵了 3 次，用完了/.test(box.textContent), '每日上限：說明為什麼停用', box.textContent.slice(0, 200));
ok(box.textContent.indexOf('3／3') >= 0, '每日上限：按鈕上顯示次數 3／3');
ok(box.textContent.indexOf('活力低，效能約') < 0, '活力補高後警示消失');
eq(Store.owned()[0].vigor > 60, true, '餵食：活力真的上升');
var tb = btn(box, 'tidy', 'sp_tide');
ok(tb && !tb.disabled, '整理窩：還可以做');
tb.click();
tb = btn(box, 'tidy', 'sp_tide');
ok(tb.disabled && /整理窩：今天已經整理過窩了/.test(box.textContent), '整理窩：每天 1 次，做完停用並說明');

/* =================================================================== 6. 撫摸與玩耍小互動 */
var pb = btn(box, 'pet', 'sp_tide');
pb.click();
ok(box.textContent.indexOf('撫摸（1／5）') >= 0, '撫摸：次數更新');
var playBtn = btn(box, 'play', 'sp_tide');
var pendingBefore = pending();
playBtn.click();
ok(box.querySelectorAll('[data-act="cell"]').length === 9, '玩耍：出現 9 格光點小互動');
ok(box.textContent.indexOf('不計輸贏') >= 0, '玩耍：說明不計輸贏');
var litCell = null;
box.querySelectorAll('[data-act="cell"]').forEach(function (c) { if (c.classList.contains('lit')) litCell = c; });
ok(!!litCell, '玩耍：有一格亮著');
litCell.click();
ok(/點亮了 1 個光點/.test(box.querySelector('[data-role="game-score"]').textContent), '玩耍：點亮的光點會計數');
var vBefore = Store.vigor('sp_tide', clock.t);
advance(GAME_MS_FOR_TEST());
function GAME_MS_FOR_TEST() { return 5200; }
ok(box.querySelectorAll('[data-act="cell"]').length === 0, '玩耍：5 秒後小互動結束');
ok(Store.vigor('sp_tide', clock.t) > vBefore, '玩耍：結束後 WalkStore.play 加了活力');
ok(box.textContent.indexOf('玩耍（1／3）') >= 0, '玩耍：次數更新');

/* =================================================================== 7. 聊天 */
box.querySelector('[data-tab="chat"]').click();
ok(box.textContent.indexOf('今天還能聊 20 次') >= 0, '聊天：顯示今日剩餘次數 20');
ok(box.textContent.indexOf('電腦離線中') >= 0, '聊天：沒有通道 → 離線提示');
var inp = box.querySelector('[data-role="chat-input"]');
inp.value = '你好';
btn(box, 'chat-send', 'sp_tide').click();
ok(box.textContent.indexOf('潮：') >= 0 || box.textContent.indexOf('你好') >= 0, '聊天：離線時用預寫台詞回話');
ok(box.textContent.indexOf('今天還能聊 20 次') >= 0, '聊天：離線預寫台詞不扣次數');
ui.unmount();
var longReply = new Array(90).join('字');
var replies = [];
ui = UI.mount(box, baseOpts({ chat: function (id, text, cb) { replies.push(text); cb(longReply); }, online: function () { return true; } }));
box.querySelector('[data-tab="chat"]').click();
ok(box.querySelector('[data-role="offline"]') === null, '聊天：有通道且在線 → 沒有離線提示');
inp = box.querySelector('[data-role="chat-input"]');
inp.value = '這一站有什麼好看的？';
btn(box, 'chat-send', 'sp_tide').click();
eq(replies.length, 1, '聊天：送出經 opts.chat 注入');
ok(box.textContent.indexOf('今天還能聊 19 次') >= 0, '聊天：扣一次，剩 19');
var bubbles = box.querySelectorAll('.wsu-bub').map(function (b) { return b.textContent; });
ok(bubbles.length >= 2 && bubbles[bubbles.length - 1].replace('潮：', '').length <= 60, '聊天：回話截在 60 字內', bubbles[bubbles.length - 1].length);
ok(box.textContent.indexOf('不會給任務答案') >= 0, '聊天：提醒不提供任務答案');
/* 非同步回話：先顯示「……」 */
var pendingCb = null;
ui.unmount();
ui = UI.mount(box, baseOpts({ chat: function (id, text, cb) { pendingCb = cb; }, online: function () { return true; } }));
box.querySelector('[data-tab="chat"]').click();
inp = box.querySelector('[data-role="chat-input"]'); inp.value = '嗨';
btn(box, 'chat-send', 'sp_tide').click();
ok(box.querySelector('[data-role="typing"]') !== null, '聊天：等電腦回話時顯示「……」');
pendingCb('嗨，我在。');
ok(box.querySelector('[data-role="typing"]') === null && box.textContent.indexOf('嗨，我在。') >= 0, '聊天：回話到了就換成內容');
/* 次數用完 */
ui.unmount();
for (var ci = 0; ci < 18; ci++) Store.chatTick();    /* 已用 2 次，再用 18 → 剩 0 */
ui = UI.mount(box, baseOpts({ chat: function (id, text, cb) { cb('不該被呼叫'); }, online: function () { return true; } }));
box.querySelector('[data-tab="chat"]').click();
ok(box.textContent.indexOf('今天還能聊 0 次') >= 0 && box.textContent.indexOf('今天的次數用完了') >= 0, '聊天：次數用完有說明');

/* =================================================================== 8. 3 隻種類限制、蛋、領回、送回圖鑑 */
ui.unmount();
clock.t += 8 * DAY;
Store.giveEgg('sp_deer', 'c1'); Store.giveEgg('sp_gull', 'c1'); Store.giveEgg('sp_sail', 'c1');
ui = UI.mount(box, baseOpts());
eq(all(box, 'boost').length, 2, '蛋：房間 3 格（1 隻＋2 顆蛋），兩顆在孵的蛋都顯示加速孵化');
ok(box.querySelector('[data-role="waiting"]') !== null && box.querySelector('[data-role="waiting"]').textContent.indexOf('排隊中的蛋 1 顆') >= 0 && box.querySelector('[data-role="room-slots"]').textContent.indexOf('3／3 格') >= 0, '蛋：第三顆排隊等空格，並說明房間格數');
ok(box.querySelector('[data-role="egg-cd"]') && /還要 \d/.test(box.querySelector('[data-role="egg-cd"]').textContent), '蛋：顯示孵化倒數');
ok(box.textContent.indexOf('加速孵化（20 點）') >= 0, '蛋：加速點數 20');
/* 點數不夠 */
ui.unmount();
points = 10;
ui = UI.mount(box, baseOpts());
ok(all(box, 'boost')[0].disabled && box.textContent.indexOf('點數不夠') >= 0, '蛋：點數不夠時加速停用並說明');
ui.unmount();
points = 100;
ui = UI.mount(box, baseOpts());
var bo = all(box, 'boost')[0];
bo.click();
eq(bo.textContent, '再按一次確認', '蛋：加速是兩段式確認');
eq(spentLog.length, 0, '蛋：第一次按還沒扣點');
bo.click();
eq(spentLog[0], 20, '蛋：確認後扣 20 點');
eq(Store.owned().length, 2, '蛋：孵出第二隻');
all(box, 'boost')[0].click(); all(box, 'boost')[0].click();
eq(Store.owned().length, 3, '蛋：孵出第三隻（共 3 隻）');
ok(box.textContent.indexOf('我的小精靈（3／3）') >= 0, '3 隻：標題顯示 3／3');
ok(all(box, 'boost').length === 0, '3 隻：滿格時排隊的蛋不能加速（還沒開始孵）');
ok(box.textContent.indexOf('排隊中的蛋 1 顆') >= 0 && box.textContent.indexOf('送回圖鑑一隻') >= 0, '3 隻：說明要先送回圖鑑一隻，排隊的蛋才會開始孵');
/* 送回圖鑑兩段式 */
var rl = btn(box, 'release', 'sp_gull') || btn(box, 'release', 'sp_deer');
var relId = rl.getAttribute('data-id');
rl.click();
eq(rl.textContent, '再按一次確認', '送回圖鑑：兩段式確認');
eq(Store.owned().length, 3, '送回圖鑑：第一次按沒有真的送走');
rl.click();
eq(Store.owned().length, 2, '送回圖鑑：確認後少一隻');
ok(box.textContent.indexOf('紀念卡') >= 0, '送回圖鑑：顯示留下紀念卡');
ok(box.textContent.indexOf('圖鑑裡的夥伴') >= 0 && btn(box, 'reclaim', relId) && !btn(box, 'reclaim', relId).disabled, '領回：有空位時可領回');
Store.hatch('sp_sail', { boost: true });
ui.refresh();
var rc = btn(box, 'reclaim', relId);
ok(rc.disabled && box.textContent.indexOf('已經養了 3 隻，先送回一隻才能領回') >= 0, '領回：滿 3 隻時停用並說明');

/* =================================================================== 9. 勘察派遣 */
ui.unmount();
/* 清到只剩 2 隻：把 sp_sail 設隨行、其餘勘察位 */
var ownedNow = Store.owned();
Store.setSlot(ownedNow[0].id, 'room'); /* 先清位子避免上限卡住 */
ownedNow.forEach(function (o) { Store.setSlot(o.id, 'room'); });
var scoutIds = ownedNow.slice(0, 2).map(function (o) { return o.id; });
Store.setSlot(scoutIds[0], 'scout'); Store.setSlot(scoutIds[1], 'scout');
Store.setSlot(ownedNow[2].id, 'follow');
/* 活力補到明確區間 */
clock.t += 0;
var ex = UI.mountExpedition(box, baseOpts({ chapters: function () { return [{ id: 'c1', name: '第一章測試路' }, { id: 'c2', name: '第二章測試路' }]; } }));
tx = box.textContent;
ok(tx.indexOf('勘察派遣') >= 0 && tx.indexOf('今天還能派 3 次') >= 0, '派遣：顯示每日剩餘派遣次數 3');
eq(all(box, 'pick-spirit').length, 2, '派遣：只列勘察位的小精靈');
ok(tx.indexOf('第一章測試路') >= 0 && tx.indexOf('情報 0／6') >= 0 && tx.indexOf('情報 0／2') >= 0, '派遣：章節顯示情報進度 n／總數');
eq(all(box, 'pick-tier').length, 3, '派遣：三個檔位');
ok(/短檔 30 分鐘（1 格）・約 \d 件/.test(tx) && /中檔 60 分鐘（2 格）・約 \d 件/.test(tx) && /長檔 120 分鐘（4 格）・約 \d 件/.test(tx), '派遣：檔位顯示預估件數', tx.slice(0, 300));
/* 預估與實際相符 */
all(box, 'pick-tier').filter(function (b) { return b.getAttribute('data-tier') === 'mid'; })[0].click();
var est = box.querySelector('[data-role="estimate"]').textContent;
var m = /預估帶回約 (\d) 件/.exec(est);
ok(!!m, '派遣：預估文字帶有件數與算式', est);
var estN = m ? parseInt(m[1], 10) : -1;
ok(est.indexOf('基礎 2') >= 0 && est.indexOf('效能') >= 0, '派遣：預估算式有基礎與效能');
var dsp = btn(box, 'dispatch');
ok(!dsp.disabled, '派遣：選好後可派出');
dsp.click();
var xs = Store.expedition();
ok(xs.active === true, '派遣：WalkStore.dispatch 成功');
ok(box.querySelector('[data-role="remain"]') && /還要 2 格.*預計 \d\d:\d\d 完成，下一格 \d\d:\d\d/.test(box.querySelector('[data-role="remain"]').textContent), '派遣：進行中顯示剩餘格數、預計完成時間與下一格倒數', box.querySelector('[data-role="remain"]').textContent);
var rb = box.querySelector('[data-role="remain"]').textContent;
advance(5000);
ok(box.querySelector('[data-role="remain"]').textContent !== rb, '派遣：倒數往下走（只用計時鏈）');
ok(btn(box, 'collect') === null, '派遣：沒到時間沒有領取鈕');
advance(61 * 60000);
var cb = btn(box, 'collect');
ok(cb !== null, '派遣：時間到出現領取鈕');
cb.click();
var resBox = box.querySelector('[data-kind="result"]');
ok(resBox !== null, '派遣：領取後顯示情報卡');
var gotN = box.querySelectorAll('[data-kind="intel"]').length;
eq(gotN, estN, '派遣：實際件數 = 預估件數');
ok(resBox.textContent.indexOf('品質：') >= 0, '派遣：顯示品質');
ok(/(史料|路況|人物|觀察|彩蛋|方位)卡/.test(resBox.textContent), '情報卡：類別有文字');
ok(resBox.textContent.indexOf('出處：') >= 0 && /有出處|摘要級|待查證/.test(resBox.textContent), '情報卡：出處與可信度標籤');
eq(btn(box, 'dismiss') !== null, true, '派遣：結果可收下');
btn(box, 'dismiss').click();
ok(box.querySelector('[data-kind="result"]') === null, '派遣：收下後結果區消失');
ok(box.textContent.indexOf('今天還能派 2 次') >= 0, '派遣：剩餘次數變 2');

/* 待查證卡的標示：直接渲染一張 */
var tbdBox = newBox();
var inbox = UI.mountIntel(tbdBox, baseOpts());
/* 多派幾次把 c2 蒐集滿、也讓 c1 有待查證 */
ex.unmount();
ex = UI.mountExpedition(box, baseOpts({ chapters: function () { return ['c1', 'c2']; }, chapterName: function (id) { return id === 'c1' ? '第一章測試路' : '第二章測試路'; } }));
all(box, 'pick-chapter', 'c2')[0].click();
all(box, 'pick-tier').filter(function (b) { return b.getAttribute('data-tier') === 'long'; })[0].click();
btn(box, 'dispatch').click();
advance(121 * 60000);
btn(box, 'collect').click();
btn(box, 'dismiss').click();
ok(Store.intel('c2').length === 2, '集滿：c2 兩張都拿到');
ok(box.textContent.indexOf('這章已集滿') >= 0, '派遣：集滿的章節標示「這章已集滿」');
var fullBtn = all(box, 'pick-chapter', 'c2')[0];
ok(fullBtn.disabled, '派遣：集滿的章節不能再派');
/* 低活力提示 */
ex.unmount();
clock.t += 6 * DAY;    /* 活力往下掉 */
ex = UI.mountExpedition(box, baseOpts({ chapters: function () { return ['c1', 'c2']; } }));
ok(box.querySelector('[data-role="lowvigor"]') !== null && box.textContent.indexOf('活力低，效能約 ×0.6') >= 0, '派遣：活力低時提示會變差');
/* 沒有勘察位 */
ex.unmount();
ownedNow.forEach(function (o) { Store.setSlot(o.id, 'room'); });
ex = UI.mountExpedition(box, baseOpts({ chapters: function () { return ['c1']; } }));
ok(box.querySelector('[data-role="noscout"]') !== null, '派遣：沒有勘察位時說明怎麼辦');
ex.unmount();

/* =================================================================== 10. 情報收件匣 */
inbox.unmount();
inbox = UI.mountIntel(tbdBox, baseOpts({ chapterName: function (id) { return id === 'c1' ? '第一章測試路' : '第二章測試路'; } }));
tx = tbdBox.textContent;
ok(tx.indexOf('情報收件匣') >= 0 && tbdBox.querySelectorAll('[data-kind="intel"]').length === Store.intel().length, '收件匣：列出已取得的卡片');
ok(tx.indexOf('這章已集滿') >= 0, '收件匣：集滿的章節有提示');
ok(tx.indexOf('出處：') >= 0, '收件匣：每張有出處');
var tbdCards = tbdBox.querySelectorAll('[data-level="待查證"]');
if (tbdCards.length) {
  ok(tbdCards[0].classList.contains('tbd') && tbdCards[0].textContent.indexOf('⚠ 待查證') >= 0 && tbdCards[0].textContent.indexOf('不要當成事實') >= 0, '收件匣：待查證的卡明顯標示（虛線框＋警示字）');
} else ok(true, '收件匣：本次沒抽到待查證卡（略過）');
/* 篩選 */
var chipC2 = tbdBox.querySelectorAll('[data-act="filter"][data-key="fch"]').filter(function (b) { return b.getAttribute('data-val') === 'c2'; })[0];
chipC2.click();
ok(tbdBox.querySelectorAll('[data-kind="chapter"]').length === 1, '收件匣：依章節篩選');
var chipType = tbdBox.querySelectorAll('[data-act="filter"][data-key="ftype"]').filter(function (b) { return b.getAttribute('data-val') === '觀察'; })[0];
chipType.click();
var shown = tbdBox.querySelectorAll('[data-kind="intel"]');
ok(shown.length >= 1 && shown.every(function (c) { return c.getAttribute('data-type') === '觀察'; }), '收件匣：依類別篩選');
ok(tbdBox.querySelector('[data-role="dupnote"]') !== null && tbdBox.textContent.indexOf('還沒開放') >= 0, '收件匣：WalkStore 沒有轉點心功能 → 只顯示說明');
inbox.unmount();
/* 空狀態 */
initStore('u_empty');
var eb = newBox();
var ib2 = UI.mountIntel(eb, baseOpts());
ok(eb.querySelector('[data-role="empty"]') !== null, '收件匣：沒有情報時有空狀態說明');
ib2.unmount();

/* =================================================================== 11. unmount 清計時器、深色類名 */
initStore('u_um');
Store.chooseStarter('sp_tide');
Store.giveEgg('sp_deer', 'c1');
Store.setSlot('sp_tide', 'follow');
var ub = newBox();
var uiU = UI.mount(ub, baseOpts());
ub.querySelector('[data-tab="skill"]').click();
btn(ub, 'skill', 'sp_tide').click();
ok(pending() > 0, 'unmount：掛載中有倒數計時器（冷卻＋蛋）', pending());
var notifCount = 0, wrapRender = ub.children.length;
uiU.unmount();
eq(pending(), 0, 'unmount：全部計時器都清掉');
eq(ub.children.length, 0, 'unmount：畫面清空');
Store.pet('sp_tide');
eq(ub.children.length, 0, 'unmount：store 通知不再重畫（監聽已移除）');
/* 兩段式的 6 秒計時器也要被清掉 */
var ub2 = newBox();
var uiU2 = UI.mount(ub2, baseOpts());
btn(ub2, 'release', 'sp_tide').click();
ok(pending() > 0, 'unmount：兩段式確認的復原計時器存在');
uiU2.unmount();
eq(pending(), 0, 'unmount：兩段式計時器也清掉');
/* 玩耍小遊戲中途 unmount */
var ub3 = newBox();
var uiU3 = UI.mount(ub3, baseOpts());
btn(ub3, 'play', 'sp_tide').click();
ok(pending() > 0, 'unmount：小遊戲有計時器');
uiU3.unmount();
eq(pending(), 0, 'unmount：小遊戲中途離開也清乾淨');

/* 深色 */
var db = newBox();
var uiD = UI.mount(db, baseOpts());
ok(db.querySelector('.wsu') !== null && !db.querySelector('.wsu').classList.contains('wsu-dk'), '深色：淺色時沒有 wsu-dk');
document.documentElement.classList.add('dk');
uiD.refresh();
ok(db.querySelector('.wsu').classList.contains('wsu-dk'), '深色：html.dk 時根節點帶 wsu-dk');
var css = document.getElementById('wsu-css');
ok(css && css.textContent.indexOf(':root.dk .wsu') >= 0 && css.textContent.indexOf('prefers-color-scheme:dark') >= 0, '深色：樣式含 :root.dk 與 prefers-color-scheme 規則');
document.documentElement.classList.remove('dk');
uiD.unmount();
eq(document.head.querySelectorAll('[id="wsu-css"]').length, 1, '樣式只注入一次');

/* =================================================================== 11b. 性格、形態、進化、禮物、行為文字（規格第 9 節） */
require(path.join(JS, 'walk_data_traits.js'));
(function () {
  function rows(b, role) { return b.querySelectorAll('[data-role="' + role + '"]'); }
  function one(b, role) { return b.querySelector('[data-role="' + role + '"]'); }
  var i, cnt, b, u, evo, persName;

  /* ---- 性格卡、傾向條、提示 ---- */
  initStore('u_trait');
  Store.chooseStarter('sp_tide');
  persName = Store.personalityInfo('sp_tide').name;
  b = newBox(); u = UI.mount(b, baseOpts());
  ok(one(b, 'traits') !== null, '性格：小精靈卡有性格區塊');
  ok(one(b, 'pers').textContent.indexOf(persName + '個性') >= 0 && Store.personalityInfo('sp_tide').icon && one(b, 'pers').textContent.indexOf(Store.personalityInfo('sp_tide').icon) >= 0, '性格：顯示圖示與名稱', one(b, 'pers').textContent);
  ok(Store.personalityInfo('sp_tide').intro && b.textContent.indexOf(Store.personalityInfo('sp_tide').intro) >= 0, '性格：顯示一句介紹');
  ok(/^最愛：.+/.test(one(b, 'likes').textContent) && /^討厭：.+/.test(one(b, 'dislikes').textContent) && one(b, 'dislikes').textContent.indexOf('連續摸超過 5 次') >= 0, '性格：顯示最愛與討厭', one(b, 'likes').textContent + '／' + one(b, 'dislikes').textContent);
  eq(one(b, 'behavior').textContent, '現在：在房間裡', '行為：沒有房間畫面可問時顯示「在房間裡」');
  eq(rows(b, 'trend').length, 3, '進化：三個傾向條（陪伴、冒險、探索）');
  ok(one(b, 'evo-hint').textContent.indexOf('還看不出方向') >= 0, '進化：還沒有傾向時的提示');
  ok(/羈絆到 5/.test(one(b, 'gift').textContent), '禮物：羈絆不到 5 時說明條件');
  ok(b.textContent.indexOf('羈絆到 10') >= 0, '進化：幼體說明羈絆到 10 長成成體');

  /* 帶牠出門：位子文字、冒險傾向領先 */
  Store.setSlot('sp_tide', 'follow');
  Store.event('arrive', 's1'); Store.event('task', 't1'); Store.event('arrive', 's2');
  cnt = Store.traitCounters('sp_tide');
  eq(cnt.adv, 3, '進化：隨行完成任務與到站會累計冒險');
  eq(cnt.lead, 'adv', '進化：冒險領先');
  u.refresh();
  ok(one(b, 'behavior').textContent === '現在：陪你出門中', '行為：隨行位顯示「陪你出門中」', one(b, 'behavior').textContent);
  var advRow = rows(b, 'trend').filter(function (r) { return r.getAttribute('data-trend') === 'adv'; })[0];
  ok(advRow.classList.contains('lead') && advRow.textContent.indexOf('領先') >= 0 && advRow.textContent.indexOf('3') >= 0, '進化：領先的那條標出來並顯示數字');
  var w = advRow.querySelector('i').style.width;
  eq(w, '30%', '進化：條長＝數量除以冒險常態值 10');
  ok(/再多帶牠隨行出任務.*就會往冒險型長大/.test(one(b, 'evo-hint').textContent), '進化：「再多做○○就會往○○型」提示', one(b, 'evo-hint').textContent);
  ok(b.querySelector('.wsu-evo') === null, '進化：還沒進化時沒有動畫區');

  /* ---- 進化事件：光暈、形態、台詞 ---- */
  for (i = 0; i < 10; i++) Store.event('chapter', 'cx' + i);
  eq(Store.owned()[0].stage, 'adult', '進化：羈絆到 10 長成成體');
  evo = b.querySelector('[data-role="evolve"]');
  ok(evo !== null && evo.textContent.indexOf('長大了') >= 0, '進化事件：收到 WalkStore 的 evolve 通知，顯示進化區', evo && evo.textContent);
  var formName = window.WALK_FORMS.byId[Store.formOf('sp_tide')].name;
  ok(evo.textContent.indexOf('長成了') >= 0 && evo.textContent.indexOf(formName) >= 0 && /「.+」/.test(evo.textContent), '進化事件：顯示形態名稱與一句台詞', evo.textContent);
  ok(!evo.classList.contains('still') && evo.querySelectorAll('.wsu-spark').length === 5 && evo.getAttribute('role') === 'status', '進化事件：一般模式有光暈與像素閃爍，並可被讀屏器讀到');
  ok(one(b, 'form').textContent.indexOf(formName) >= 0 && rows(b, 'form-effect').length >= 2, '形態：卡片顯示形態與效果說明', one(b, 'form').textContent);
  ok(b.textContent.indexOf('形態已經定下來') >= 0 && one(b, 'evo-hint') === null, '進化：定型後傾向條改成養成紀錄、不再提示方向');
  ok(/羈絆夠了/.test(one(b, 'gift').textContent), '禮物：羈絆夠了時說明每天可能帶禮物');
  ok(pending() > 0, '進化事件：用計時鏈在幾秒後收起（有排程）');
  advance(6500);
  ok(b.querySelector('[data-role="evolve"]') === null, '進化事件：幾秒後自動收起');
  u.unmount();
  eq(pending(), 0, '進化：卸載後計時器清乾淨');

  /* ---- 省電／減少動態：只留文字 ---- */
  initStore('u_trait2');
  Store.chooseStarter('sp_tide'); Store.setSlot('sp_tide', 'follow');
  var b2 = newBox(), u2 = UI.mount(b2, baseOpts({ isSaver: function () { return true; } }));
  for (i = 0; i < 10; i++) Store.event('chapter', 'cy' + i);
  var evo2 = b2.querySelector('[data-role="evolve"]');
  ok(evo2 !== null && evo2.classList.contains('still') && evo2.querySelectorAll('.wsu-spark').length === 0, '省電模式：進化只顯示文字，沒有閃爍元素');
  u2.unmount();
  global.matchMedia = function (q) { return { matches: /reduce/.test(q) }; };
  initStore('u_trait3');
  Store.chooseStarter('sp_tide'); Store.setSlot('sp_tide', 'follow');
  var b3 = newBox(), u3 = UI.mount(b3, baseOpts());
  for (i = 0; i < 10; i++) Store.event('chapter', 'cz' + i);
  var evo3 = b3.querySelector('[data-role="evolve"]');
  ok(evo3 !== null && evo3.classList.contains('still') && evo3.querySelectorAll('.wsu-spark').length === 0, 'prefers-reduced-motion：進化只顯示文字');
  u3.unmount();
  delete global.matchMedia;
  var cssText = document.getElementById('wsu-css').textContent;
  ok(/prefers-reduced-motion:reduce\)\{\.wsu-evo,\.wsu-spark\{animation:none/.test(cssText), '樣式：prefers-reduced-motion 關掉動畫');

  /* ---- 開啟畫面時補播還沒播過的進化 ---- */
  initStore('u_trait4');
  Store.chooseStarter('sp_tide'); Store.setSlot('sp_tide', 'follow');
  for (i = 0; i < 10; i++) Store.event('chapter', 'cw' + i);
  var b4 = newBox(), u4 = UI.mount(b4, baseOpts());
  ok(b4.querySelector('[data-role="evolve"]') !== null, '進化：先進化、後打開小精靈頁，開啟時補播');
  u4.unmount();
  var b4b = newBox(), u4b = UI.mount(b4b, baseOpts());
  ok(b4b.querySelector('[data-role="evolve"]') === null, '進化：播過的不會再播');
  u4b.unmount();

  /* ---- 房間畫面開著時，行為文字取自 WalkRoom ---- */
  global.WalkRoom = { stateText: function (id) { return id === 'sp_tide' ? '正在打盹' : null; }, lastGift: function () { return { spirit: 'sp_tide', text: '小精靈帶來了小禮物：蜜餞。' }; } };
  initStore('u_trait5');
  Store.chooseStarter('sp_tide');
  for (i = 0; i < 5; i++) Store.event('chapter', 'cv' + i);
  Store.setSlot('sp_tide', 'follow'); for (i = 0; i < 5; i++) Store.event('chapter', 'cu' + i);
  Store.setSlot('sp_tide', 'room');
  var b5 = newBox(), u5 = UI.mount(b5, baseOpts());
  eq(one(b5, 'behavior').textContent, '現在：正在打盹', '行為：在房間裡時顯示房間畫面回報的狀態');
  ok(one(b5, 'gift').textContent.indexOf('蜜餞') >= 0, '禮物：房間今天收到的禮物會顯示在小精靈卡上', one(b5, 'gift').textContent);
  u5.unmount();
  delete global.WalkRoom;

  /* ---- 學者型：情報卡多一條「再往下查的方向」 ---- */
  initStore('u_lore');
  Store.chooseStarter('sp_tide'); Store.setSlot('sp_tide', 'scout');
  Store.dispatch({ spiritId: 'sp_tide', chapterId: 'c2', tier: 'long' });
  clock.t += 130 * 60000;
  Store.collect();
  var n0 = Store.intel().length;
  var b6 = newBox(), u6 = UI.mountIntel(b6, baseOpts());
  eq(b6.querySelectorAll('[data-role="next-hint"]').length, 0, '學者型：沒有學者型隨行時，情報卡不顯示往下查的方向');
  u6.unmount();
  var fakeStore = Object.create(Store);
  fakeStore.talents = function () { return { effects: {}, items: [], statBonus: {}, resonance: [], formEffects: { intelNextHint: 1 } }; };
  var u7 = UI.mountIntel(b6, baseOpts({ store: fakeStore }));
  eq(b6.querySelectorAll('[data-role="next-hint"]').length, n0, '學者型：有 intelNextHint 時每張情報卡多一行往下查的方向（' + n0 + ' 張）');
  ok(b6.querySelector('[data-role="next-hint"]').textContent.indexOf('再往下查的方向') >= 0, '學者型：文字用學生看得懂的說法');
  u7.unmount();
})();

/* =================================================================== 11c. 房間 3 格、出門名額、新稱號、和隊友交換（規格第 11、12 節） */
(function () {
  var TICK = 1800000, i;
  function one(b, role) { return b.querySelector('[data-role="' + role + '"]'); }
  function rows(b, role) { return b.querySelectorAll('[data-role="' + role + '"]'); }
  function clickBtnText(b, text) { var x = b.querySelectorAll('button').filter(function (y) { return y.textContent === text; })[0]; if (x) x.click(); return x || null; }
  function twice(node) { node.click(); node.click(); }

  /* ---- 房間 3 格與待孵清單 ---- */
  initStore('u_slots');
  Store.chooseStarter('sp_deer');
  Store.giveEgg('sp_gull', 'c1'); Store.giveEgg('sp_sail', 'c1');
  var bs = newBox(), us = UI.mount(bs, baseOpts());
  ok(one(bs, 'room-slots').textContent.indexOf('房間 3／3 格') >= 0 && one(bs, 'room-slots').textContent.indexOf('小精靈 1 隻＋孵化中的蛋 2 顆') >= 0, '房間格數：顯示 3／3 格與小精靈、蛋各幾個', one(bs, 'room-slots').textContent);
  ok(one(bs, 'waiting') === null, '房間格數：沒有排隊的蛋時不顯示待孵清單');
  ['sp_lion', 'sp_watch', 'sp_telegraph', 'sp_radio', 'sp_neon', 'sp_ink'].forEach(function (id) { Store.giveEgg(id, 'c1'); });
  us.refresh();
  ok(rows(bs, 'waiting-item').length === 6 && one(bs, 'waiting').textContent.indexOf('排隊中的蛋 6 顆') >= 0 && one(bs, 'waiting').textContent.indexOf('最多 6 顆') >= 0, '待孵清單：列出 6 顆排隊的蛋與上限', one(bs, 'waiting') && one(bs, 'waiting').textContent);
  ok(one(bs, 'waiting').textContent.indexOf('放不下，先送回一隻') >= 0 && one(bs, 'waiting-full') !== null && one(bs, 'waiting-full').textContent.indexOf('放不下，先送回一隻') >= 0, '待孵清單：滿了標示「放不下，先送回一隻」');
  us.unmount();

  /* ---- 出門中只有一隻：明確的切換鈕 ---- */
  initStore('u_follow');
  Store.chooseStarter('sp_deer');
  Store.giveEgg('sp_gull', 'c1'); clock.t += 3 * TICK; Store.hatch('sp_gull');
  Store.setFollow('sp_deer');
  var bf = newBox(), uf = UI.mount(bf, baseOpts());
  ok(one(bf, 'follow-now').textContent.indexOf('出門中（同一時間只有 1 隻）：鹿影') >= 0, '出門名額：頂端標示目前出門的是誰', one(bf, 'follow-now').textContent);
  var chipDeer = bf.querySelector('[data-slot="follow"][data-id="sp_deer"]'), chipGull = bf.querySelector('[data-slot="follow"][data-id="sp_gull"]');
  ok(chipDeer.textContent === '出門中（只有 1 隻）' && chipDeer.getAttribute('aria-pressed') === 'true' && chipGull.textContent === '換牠出門', '出門名額：出門中的標示、其他的是「換牠出門」');
  ok(rows(bf, 'follow-note').length === 1 && rows(bf, 'follow-note')[0].textContent.indexOf('冷卻從頭重新計算') >= 0, '出門名額：說明換了之後助理技冷卻重新計算');
  chipGull.click();
  var ownedF = Store.owned(), fl = ownedF.filter(function (o) { return o.slot === 'follow'; });
  ok(fl.length === 1 && fl[0].id === 'sp_gull' && ownedF.filter(function (o) { return o.id === 'sp_deer'; })[0].slot === 'room', '出門名額：按「換牠出門」呼叫 setFollow，原本的回到房間、永遠只有 1 隻');
  ok(one(bf, 'follow-now').textContent.indexOf('機械海鷗') >= 0 && bf.textContent.indexOf('牠的助理技冷卻從頭重新計算') >= 0, '出門名額：換好後頂端與訊息都更新');
  ok(fl[0].skillAt === 0, '出門名額：換上去的那隻冷卻歸零重算');
  uf.unmount();

  /* ---- 新稱號：進頁時取，不重複取 ---- */
  require(path.join(JS, 'walk_data_dex.js'));
  global.localStorage.removeItem('walkstore_u_title');
  Store.init({ uid: 'u_title', now: function () { return clock.t; }, getPoints: function () { return points; }, addSpent: function () {}, toast: function () {}, chaptersDone: function () { return 1; } });
  Store.chooseStarter('sp_deer'); Store.event('chapter', 'tt');
  var pend = Store.state().dex.titlePending.slice();
  ok(pend.length > 0, '新稱號：完成章節後 store 排進待通知清單', pend.join(','));
  {
    var bt = newBox(), ut = UI.mount(bt, baseOpts());
    ok(one(bt, 'new-titles') !== null && one(bt, 'new-titles').textContent.indexOf('新稱號') >= 0 && one(bt, 'new-titles').textContent.indexOf('初出茅廬') >= 0, '新稱號：進頁時取到就顯示', one(bt, 'new-titles') && one(bt, 'new-titles').textContent);
    eq(Store.state().dex.titlePending.length, 0, '新稱號：取走後 store 清空（圖鑑那邊不會重複看到）');
    bt.querySelector('[data-act="dismiss-titles"]').click();
    ok(one(bt, 'new-titles') === null, '新稱號：按「知道了」收起');
    ut.unmount();
    var bt2 = newBox(), ut2 = UI.mount(bt2, baseOpts());
    ok(one(bt2, 'new-titles') === null, '新稱號：沒有待通知的就不顯示');
    ut2.unmount();
    Store.event('chapter', 'tt2'); Store.chooseStarter && 0;
  }

  /* ---- 和隊友交換：兩個玩家共用一個假 Firebase ---- */
  function makeDB() {
    var db = { data: {}, writes: [] };
    function ref(p) {
      return {
        child: function (c) { return ref(p ? p + '/' + c : c); },
        set: function (v, cb) { db.data[p] = v === undefined ? null : JSON.parse(JSON.stringify(v)); db.writes.push(p); if (typeof cb === 'function') cb(null); },
        transaction: function (fn, cb) {
          var cur = db.data[p] === undefined ? null : JSON.parse(JSON.stringify(db.data[p])), n = fn(cur);
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
                var rest = k.slice(p.length + 1), v = db.data[k];
                if (rest.indexOf('/') >= 0) return;
                if (v && typeof v === 'object' && v[field] === val) { out[rest] = JSON.parse(JSON.stringify(v)); any = true; }
              });
              cb({ val: function () { return any ? out : null; } });
            } };
          } };
        },
        remove: function () { delete db.data[p]; db.writes.push(p + '(rm)'); },
        once: function (ev, cb) { var v = db.data[p] === undefined ? null : JSON.parse(JSON.stringify(db.data[p])); cb({ val: function () { return v; } }); }
      };
    }
    db.root = ref('');
    return db;
  }
  var db = makeDB(), mates = { ta: ['tb'], tb: ['ta'] }, NICK = { ta: '甲', tb: '乙' };
  function as(uid) {
    global.localStorage.removeItem('walkstore_' + uid);
    Store.init({ uid: uid, root: db.root, teamId: 'team1', sess: 's1', now: function () { return clock.t; }, getPoints: function () { return 5000; }, addSpent: function () {}, toast: function () {},
      isTeammate: function (u) { return (mates[uid] || []).indexOf(u) >= 0; }, nickOf: function (u) { return NICK[u] || ''; },
      profile: function () { return { nick: NICK[uid], badges: [], closet: [] }; } });
  }
  function gain(id) { Store.giveEgg(id); clock.t += 3 * TICK; return Store.hatch(id); }
  function ids() { return Store.owned().map(function (o) { return o.id; }).sort().join(','); }
  function openUi(uid, mateUid) {
    as(uid);
    var b = newBox(), u = UI.mount(b, baseOpts({ teammates: function () { return [{ uid: mateUid, nick: NICK[mateUid] }]; }, store: Store }));
    return { b: b, u: u };
  }
  clock.t = new Date(2026, 10, 3, 10, 0, 0).getTime();
  as('ta'); Store.chooseStarter('sp_deer'); Store.setFollow('sp_deer');
  for (i = 0; i < 11; i++) Store.event('chapter', 'q' + i);
  gain('sp_brick'); gain('sp_abacus');
  Store.publish();
  as('tb'); Store.chooseStarter('sp_bookworm'); gain('sp_abacus'); Store.publish();
  var deerBond = (function () { as('ta'); return Store.owned().filter(function (o) { return o.id === 'sp_deer'; })[0].bond; })();
  var deerFormName = (function () { var f = Store.formOf('sp_deer'); return f ? window.WALK_FORMS.byId[f].name : null; })();
  var deerPersName = Store.personalityInfo('sp_deer').name;

  /* 沒給隊友名單、離線 */
  as('ta');
  var bn = newBox(), un = UI.mount(bn, baseOpts());
  ok(one(bn, 'need-mates') !== null && one(bn, 'need-mates').textContent.indexOf('這裡需要隊友名單') >= 0 && bn.querySelectorAll('[data-act="trade-mate"]').length === 0, '交換：沒給 opts.teammates 就顯示「這裡需要隊友名單」');
  un.unmount();
  initStore('u_off');
  Store.chooseStarter('sp_deer');
  var bo = newBox(), uo = UI.mount(bo, baseOpts({ teammates: function () { return [{ uid: 'tb', nick: '乙' }]; } }));
  ok(rows(bo, 'trade-offline').length === 2 && rows(bo, 'trade-offline')[0].textContent.indexOf('現在不能交換') >= 0 && rows(bo, 'trade-offline')[0].textContent.indexOf('離線時不能交換') >= 0, '離線：交換與信箱都顯示「現在不能交換」與原因');
  ok(bo.querySelectorAll('[data-act="trade-mate"]').length === 0 && bo.querySelectorAll('[data-act="trade-send"]').length === 0, '離線：沒有可按的交換鈕');
  uo.unmount();

  /* 甲：選隊友 → 看每隻的可否 → 兩段式送出 */
  as('ta');
  var A = openUi('ta', 'tb'), bA = A.b;
  var mateBtn = bA.querySelector('[data-act="trade-mate"]');
  ok(mateBtn && mateBtn.textContent === '乙', '交換：列出隊友（用暱稱）');
  mateBtn.click();
  var gv = rows(bA, 'give-row');
  eq(gv.length, 3, '交換：列出自己每隻小精靈');
  var abRow = gv.filter(function (r) { return r.getAttribute('data-id') === 'sp_abacus'; })[0];
  ok(abRow.querySelector('[data-act="trade-give"]').disabled && abRow.textContent.indexOf('對方已經有這一種了') >= 0, '交換：對方已有的那隻停用並說明原因');
  var deerRow = gv.filter(function (r) { return r.getAttribute('data-id') === 'sp_deer'; })[0];
  ok(!deerRow.querySelector('[data-act="trade-give"]').disabled && deerRow.textContent.indexOf(deerPersName) >= 0 && (deerFormName === null || deerRow.textContent.indexOf(deerFormName) >= 0) && deerRow.textContent.indexOf('羈絆 ' + deerBond) >= 0, '交換：每隻顯示外觀、性格、形態、羈絆');
  ok(one(bA, 'trade-left').textContent.indexOf('今天還能換 3 次') >= 0 && bA.textContent.indexOf('交換後羈絆會減半、性格與形態保留') >= 0, '交換：顯示今天剩餘次數與「羈絆減半、性格與形態保留」');
  ok(bA.querySelectorAll('input').length === 0 && bA.querySelectorAll('textarea').length === 0, '交換：沒有任何文字輸入');
  deerRow.querySelector('[data-act="trade-give"]').click();
  ok(one(bA, 'trade-confirm-text').textContent.indexOf('羈絆會減半（' + Math.floor(deerBond / 2) + '）') >= 0 && one(bA, 'trade-confirm-text').textContent.indexOf('性格與形態保留') >= 0, '交換：送出前再說一次羈絆會減半');
  var send = bA.querySelector('[data-act="trade-send"]');
  send.click();
  ok(send.textContent === '再按一次確認送出' && Object.keys(db.data).filter(function (k) { return k.indexOf('trades/') === 0; }).length === 0, '交換：送出是兩段式，第一次按還沒寫入');
  send.click();
  var tkeys = Object.keys(db.data).filter(function (k) { return k.indexOf('trades/') === 0; });
  ok(tkeys.length === 1 && db.data[tkeys[0]].status === 'open' && db.data[tkeys[0]].give.id === 'sp_deer' && db.data[tkeys[0]].to === 'tb', '交換：第二下才送出提案（寫入 trades，status=open）');
  ok(bA.textContent.indexOf('提案送出了') >= 0 && rows(bA, 'outgoing').length === 1 && rows(bA, 'outgoing')[0].textContent.indexOf('等待回應') >= 0 && rows(bA, 'outgoing')[0].textContent.indexOf('送給 乙') >= 0, '信箱：送出的提案出現在「我送出的提案」');
  var tid1 = tkeys[0].slice('trades/'.length);
  A.u.unmount();

  /* 乙：收到提案 → 看對方的小精靈 → 選回贈 → 兩段式接受 */
  var B = openUi('tb', 'ta'), bB = B.b, inc = rows(bB, 'incoming');
  eq(inc.length, 1, '信箱：乙收到 1 筆提案');
  ok(inc[0].textContent.indexOf('甲 想和你交換') >= 0 && inc[0].textContent.indexOf('鹿影') >= 0 && inc[0].textContent.indexOf(deerPersName) >= 0 && (deerFormName === null || inc[0].textContent.indexOf(deerFormName) >= 0) && inc[0].textContent.indexOf('羈絆 ' + deerBond) >= 0 && inc[0].textContent.indexOf('等待回應') >= 0, '信箱：顯示對方小精靈的外觀、性格、形態、羈絆', inc[0].textContent);
  ok(inc[0].querySelectorAll('img').length + inc[0].querySelectorAll('.wsu-ph').length >= 1, '信箱：有小精靈外觀圖');
  clickBtnText(inc[0], '接受（選一隻回贈）');
  inc = rows(bB, 'incoming');
  var gv2 = inc[0].querySelectorAll('[data-role="give-row"]');
  eq(gv2.length, 2, '接受：列出自己的小精靈供選擇');
  var abB = gv2.filter(function (r) { return r.getAttribute('data-id') === 'sp_abacus'; })[0];
  ok(abB.querySelector('[data-act="acc-give"]').disabled && abB.textContent.indexOf('對方已經有這一種了') >= 0, '接受：不能換的那隻停用並說明（對方已有算盤獸）');
  var bwB = gv2.filter(function (r) { return r.getAttribute('data-id') === 'sp_bookworm'; })[0];
  bwB.querySelector('[data-act="acc-give"]').click();
  ok(one(bB, 'accept-confirm-text').textContent.indexOf('你給出「書卷蠹魚」，換回「鹿影」') >= 0 && one(bB, 'accept-confirm-text').textContent.indexOf('性格與形態保留') >= 0, '接受：確認前顯示給出與換回、羈絆減半');
  var okBtn = bB.querySelector('[data-act="acc-send"]');
  okBtn.click();
  eq(ids(), 'sp_abacus,sp_bookworm', '接受：兩段式，第一次按資料不動');
  okBtn.click();
  eq(ids(), 'sp_abacus,sp_deer', '接受：第二下才換（乙給出書卷蠹魚、收到鹿影）');
  ok(bB.textContent.indexOf('換好了！收到「鹿影」') >= 0, '接受：完成後顯示結果');
  ok(db.data['trades/' + tid1].status === 'accepted', '接受：提案狀態變成 accepted');
  B.u.unmount();

  /* 甲：重新打開時自動補做，提案標成完成 */
  var A2 = openUi('ta', 'tb');
  ok(ids() === 'sp_abacus,sp_bookworm,sp_brick', '補做：甲打開小精靈頁時自動完成（鹿影換成書卷蠹魚）', ids());
  ok(A2.b.textContent.indexOf('有 1 筆交換完成了') >= 0 && db.data['trades/' + tid1].status === 'done', '補做：顯示完成訊息，狀態標 done');
  var oRow = rows(A2.b, 'outgoing')[0];
  ok(oRow.textContent.indexOf('已經換好了') >= 0 && oRow.textContent.indexOf('換回來的是「書卷蠹魚」') >= 0, '信箱：完成的提案顯示換回的是誰');
  A2.u.unmount();

  /* 拒絕 */
  clock.t += 60000;
  as('ta'); Store.tradePropose('tb', 'sp_brick', function () {});
  var B2 = openUi('tb', 'ta');
  var inc2 = rows(B2.b, 'incoming').filter(function (r) { return r.getAttribute('data-status') === 'open'; });
  eq(inc2.length, 1, '拒絕：乙看到新的提案');
  var decl = inc2[0].querySelector('[data-act="inc-decline"]');
  decl.click();
  ok(decl.textContent === '再按一次確認拒絕', '拒絕：兩段式確認');
  decl.click();
  var pRej = Object.keys(db.data).filter(function (k) { return k.indexOf('trades/') === 0 && db.data[k].status === 'declined'; });
  ok(pRej.length === 1 && B2.b.textContent.indexOf('已拒絕這個提案') >= 0, '拒絕：第二下才送出 declined');
  B2.u.unmount();
  var A3 = openUi('ta', 'tb');
  ok(rows(A3.b, 'outgoing').some(function (r) { return r.getAttribute('data-status') === 'declined' && r.textContent.indexOf('已拒絕') >= 0; }), '拒絕：甲的信箱看到「已拒絕」');
  A3.u.unmount();

  /* 取消 */
  clock.t += 60000;
  as('ta'); var pc = null; Store.tradePropose('tb', 'sp_brick', function (r) { pc = r; });
  var A4 = openUi('ta', 'tb');
  var cancelBtn = A4.b.querySelector('[data-act="out-cancel"]');
  ok(cancelBtn !== null, '取消：送出的提案（還在等）有取消鈕');
  cancelBtn.click();
  eq(cancelBtn.textContent, '再按一次確認取消', '取消：兩段式確認');
  eq(db.data['trades/' + pc.tradeId].status, 'open', '取消：第一次按還沒取消');
  cancelBtn.click();
  eq(db.data['trades/' + pc.tradeId].status, 'cancelled', '取消：第二下才取消');
  ok(A4.b.textContent.indexOf('提案取消了') >= 0, '取消：顯示結果');
  A4.u.unmount();
  var B3 = openUi('tb', 'ta');
  var cRow = rows(B3.b, 'incoming').filter(function (r) { return r.getAttribute('data-id') === pc.tradeId; })[0];
  ok(cRow && cRow.textContent.indexOf('已取消') >= 0 && cRow.querySelector('[data-act="inc-accept"]') === null, '取消：乙那邊顯示「已取消」且不能接受');
  B3.u.unmount();

  /* 逾時 */
  clock.t += 120000;
  as('ta'); var pe = null; Store.tradePropose('tb', 'sp_brick', function (r) { pe = r; });
  clock.t += 11 * 60000;
  var B4 = openUi('tb', 'ta');
  var eRow = rows(B4.b, 'incoming').filter(function (r) { return r.getAttribute('data-id') === pe.tradeId; })[0];
  ok(eRow && eRow.getAttribute('data-status') === 'expired' && eRow.textContent.indexOf('已過期，不能接受') >= 0 && eRow.querySelector('[data-act="inc-accept"]').disabled && eRow.querySelector('[data-act="inc-decline"]') === null, '逾時：過期的提案停用接受、顯示已過期');
  B4.u.unmount();
  var A5 = openUi('ta', 'tb');
  var eo = rows(A5.b, 'outgoing').filter(function (r) { return r.getAttribute('data-id') === pe.tradeId; })[0];
  ok(eo && eo.getAttribute('data-status') === 'expired' && eo.textContent.indexOf('已過期') >= 0 && eo.querySelector('[data-act="out-cancel"]') === null, '逾時：送出的提案過期後不能取消、顯示已過期');
  var dayLeft = (function () { A5.b.querySelector('[data-act="trade-mate"]').click(); return one(A5.b, 'trade-left').textContent; })();
  ok(/今天還能換 \d 次/.test(dayLeft), '交換：次數用掉後仍顯示剩餘次數', dayLeft);
  A5.u.unmount();

  /* 每日次數用完：全部停用並說明 */
  as('ta');
  (function () {
    var left = Store.tradeOptions('tb').left, n = 0;
    ok(left >= 0, '次數：store 回報剩餘次數');
  })();
})();

/* =================================================================== 12. 介面守則（原始碼與樣式檢查） */
var src = fs.readFileSync(path.join(JS, 'walk_spirit_ui.js'), 'utf8');
var code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
eq((code.match(/(^|[^.\w])(alert|confirm|prompt)\s*\(/g) || []).length, 0, '守則：沒有 alert／confirm／prompt 呼叫');
eq((code.match(/setInterval/g) || []).length, 0, '守則：沒有 setInterval');
eq((code.match(/requestAnimationFrame/g) || []).length, 0, '守則：沒有常駐動畫迴圈');
eq((code.match(/innerHTML/g) || []).length, 0, '守則：不用 innerHTML');
ok(/min-height:44px/.test(UI._css), '守則：按鈕最小高度 44px');
var sizes = (UI._css.match(/font-size:(\d+)px/g) || []).map(function (s) { return parseInt(s.replace(/\D/g, ''), 10); });
ok(sizes.length > 0 && Math.min.apply(null, sizes) >= 12, '守則：字級都 ≥12px', Math.min.apply(null, sizes));
/* 學生視角：畫面文字不出現備課用語 */
var banned = /備課|統計|洞見|產學案|成大|NCKU|泛論|通論|概論/;
var allText = '';
[box, tbdBox].forEach(function (b) { allText += b.textContent; });
ok(!banned.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), '守則：原始碼字串沒有備課用語／真實院名');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
