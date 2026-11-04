/* showcase_deid.js — 輪播展示頁的去識別化與卡片組裝（純函式，瀏覽器與 node 共用）
 * 原則：寧可少顯示，不可多洩漏。
 *  1. 來自測試編號（0、55–60、98、99）、非數字編號、示範資料 → 整筆跳過
 *  2. 內文含網址、或清掉個資後太短（< 4 字）→ 整筆跳過
 *  3. 姓名樣式、學號、信箱、電話、IP、帳號名、暱稱、信封編號 → 把那段字遮成「◼◼」
 *  4. 作者一律顯示成「同學 ▲37」這種代號；代號 = 雜湊(本機隨機鹽 + 作者鍵 + 內容)，
 *     鹽只存在這台電腦的 localStorage，原始碼裡沒有，所以無法從代號反推編號或 uid
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShowcaseDeid = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MASK = '◼◼';
  var MIN_LEN = 4;
  var SYMS = ['▲', '●', '■', '◆', '★', '♥', '♣', '☾'];
  var SURN = '陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴徐周葉蘇莊呂江何蕭羅高潘簡朱鍾鐘彭游詹胡施沈余盧梁趙顏柯翁魏孫戴范方宋鄧杜傅侯曹薛丁卓阮馬董溫温唐藍石蔣古紀姚連馮歐程湯黎田康汪白尤巫涂';
  // 姓氏開頭但是常見詞的三字詞（整欄就是這個詞時放行）
  var NAME3_OK = ['古曼童', '高難度', '連線時', '白蛇傳', '石敢當', '黃金樹', '馬車夫', '高塔上', '林投姐', '白無常', '黑白無常', '周杰倫', '田野調', '王爺公', '王爺廟', '石獅子', '白手套', '江湖味', '朱雀門', '何必當'];
  var NAME_EXCL = ['高年級', '低年級', '中年級', '白老鼠', '高中', '國中', '國小', '大學', '白天', '方法', '田野', '石頭', '古早', '連結', '馬上', '方向', '古蹟', '周圍', '林間'];

  // ---------- 編號 ----------
  function envNum(env) {
    if (env === null || env === undefined) return NaN;
    var s = String(env).trim();
    if (!/^\d{1,3}$/.test(s)) return NaN;
    return parseInt(s, 10);
  }
  // 測試與老師編號：0（楊）、99（駱）、98（外校老師）、55–60（測試員／示範）
  function isBlockedEnv(env) {
    var n = envNum(env);
    if (isNaN(n)) return true;               // 'demo'、'test-…'、空值一律不收
    if (n === 0 || n === 98 || n === 99) return true;
    if (n >= 55 && n <= 60) return true;
    return false;
  }
  function isDemoFlag(o) {
    if (!o || typeof o !== 'object') return false;
    if (o.demo || o.isDemo || o.test) return true;
    if (o.meta && (o.meta.demo || o.meta.test)) return true;
    return false;
  }

  // ---------- 雜湊 ----------
  function fnv(str, seed) {
    var h = (seed === undefined ? 0x811c9dc5 : seed) >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  function normText(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function hashStr(s) {
    s = normText(s);
    return fnv(s).toString(16).padStart(8, '0') + fnv(s, 0x9747b28c).toString(16).padStart(8, '0');
  }
  function cardKey(type, text) { return 'k' + hashStr(type + '|' + text); }
  function authorCode(salt, authorKey, text) {
    var h = fnv(String(salt) + '|' + String(authorKey) + '|' + normText(text));
    var sym = SYMS[h % SYMS.length];
    var num = 1 + (Math.floor(h / SYMS.length) % 99);
    return '同學 ' + sym + num;
  }

  // ---------- 個資規則 ----------
  var RULES = [
    ['email',   /[A-Za-z0-9._%+\-]+\s?@\s?[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+/g],
    ['phone',   /(?:\+?886[\s\-]?)?\(?0?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{3}/g],
    ['phone2',  /\(?0\d{1,2}\)?[\s\-]\d{6,8}/g],
    ['phone3',  /(?<![\d.])\d{2,4}[\s\-]\d{3,4}[\s\-]\d{3,4}(?![\d.])/g],
    ['studentid', /(?<![A-Za-z0-9])[0-9][A-Za-z][0-9][A-Za-z]\d{4}(?![A-Za-z0-9])/g],
    ['studentid2', /(?<![A-Za-z0-9])[A-Za-z]\d{7,9}(?![A-Za-z0-9])/g],
    ['longdigits', /(?<![\d.])\d{8,12}(?![\d.])/g],
    ['ip',      /(?<![\d.])\d{1,3}(?:\.\d{1,3}){3}(?![\d.])/g],
    ['token',   /(?<![A-Za-z0-9_\-])[A-Za-z0-9_\-]{24,}(?![A-Za-z0-9_\-])/g],
    ['handle',  /@[A-Za-z0-9._]{3,}/g],
    ['envref',  /#\s?\d{1,3}(?!\d)/g],
    ['envref2', /(?:信封|編號|號碼|座號)\s*[:：#]?\s*\d{1,3}(?!\d)/g],
    ['envref3', /(?<!\d)\d{1,3}\s*號(?:同學|組員|玩家|信封)/g]
  ];
  // 需要「保留前綴、只遮後面那段」的規則：[名稱, 正則, 要遮的群組編號]
  var CAPTURE_RULES = [
    ['account', /(?:帳號名?稱?|賬號|account|username|user\s?name|\bIG\b|instagram|LINE\s?ID|\bFB\b)[\s:：是為叫@]*([A-Za-z0-9][A-Za-z0-9._\-]{2,})/gi, 1],
    ['selfname', /(?:我叫|我姓|叫我|名字是|名字叫|名字為|暱稱是|暱稱叫|綽號是|綽號叫|綽號|暱稱|本人是|本人叫)[\s：:]*([一-鿿A-Za-z][一-鿿A-Za-z._\-]{1,9})/g, 1],
    ['selfname2', new RegExp('(?:我是)([' + SURN + '][\\u4e00-\\u9fff]{1,2})(?=[，。,.!！?？\\s、；;]|同學|$)', 'g'), 1],
    ['selfname3', /我是([一-鿿]{2,3})(?=[，。,.!！?？\s、；;]|$)/g, 1, /^(學生|玩家|老師|同學|設計師|新手|工程師|行銷|製作人|創意總監|台南人|臺南人|外國人|大人|小孩|人類|貓|狗|認真|好人|壞人|隊長|組長|組員|路人|觀眾|旁觀者|主角|反派|英雄|勇者|怪物|魔王|神明|土地公|媽祖|男的|女的|第一|第二|第三|新生|大一|大二|大三|大四|學長|學姐|粉絲|宅男|宅女|AI)$/],
    ['engname', /(?:my name is|i am called|call me|i'm called)\s+([A-Za-z][A-Za-z\-']{1,20}(?:\s[A-Z][a-z]+)?)/gi, 1]
  ];
  var NAME_TITLE = new RegExp('([' + SURN + '][\\u4e00-\\u9fff]{1,2})(?=同學|學長|學姐|學弟|學妹|組長|助教|同事)', 'g');
  var NAME_TITLE2 = new RegExp('([' + SURN + '][\u4e00-\u9fff]{2})(?=老師|教授|博士|醫師|先生|小姐|導師|校長|主任)', 'g');
  var URL_RE = /(?:https?:\/\/|ftp:\/\/|www\.)\S+|(?<![A-Za-z0-9])[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.(?:com|net|org|edu|io|tw|gov|app|dev|co|me|ly|ai|tv|jp|cn)(?:\/\S*)?(?![A-Za-z0-9])/i;

  function hasUrl(text) { return URL_RE.test(String(text == null ? '' : text)); }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function buildNameRe(names) {
    var list = [];
    (names || []).forEach(function (n) {
      n = normText(n);
      if (n.length >= 2 && !/^\d{1,3}$/.test(n) && list.indexOf(n) < 0) list.push(n);
    });
    if (!list.length) return null;
    list.sort(function (a, b) { return b.length - a.length; });
    return new RegExp(list.map(escapeRe).join('|'), 'g');
  }

  // 回傳 {text: 遮蔽後, hits: [類型…]}
  function maskPII(text, opts) {
    var s = String(text == null ? '' : text);
    var hits = [];
    var nameRe = opts && opts.nameRe;
    function sub(re, type, grp, skipRe) {
      re.lastIndex = 0;
      s = s.replace(re, function () {
        if (!grp) hits.push(type);
        if (grp) {
          var m = arguments[grp];
          if (skipRe && skipRe.test(m)) return arguments[0];
          hits.push(type);
          return arguments[0].replace(m, MASK);
        }
        return MASK;
      });
    }
    sub(RULES[0][1], RULES[0][0]); // 信箱先遮，避免被帳號規則切一半
    CAPTURE_RULES.forEach(function (r) { sub(r[1], r[0], r[2], r[3]); });
    sub(NAME_TITLE, 'nametitle', 1);
    sub(NAME_TITLE2, 'nametitle', 1);
    RULES.slice(1).forEach(function (r) { sub(r[1], r[0]); });
    if (nameRe) sub(nameRe, 'nickname');
    return { text: s, hits: hits };
  }

  // NAME_TITLE 的誤傷處理：先把常見詞暫換成佔位，遮完再換回
  function maskSafe(text, opts) {
    var s = String(text == null ? '' : text);
    var holds = [];
    NAME_EXCL.forEach(function (w) {
      if (s.indexOf(w) < 0) return;
      holds.push(w);
      s = s.split(w).join('' + (holds.length - 1) + '');
    });
    var r = maskPII(s, opts);
    r.text = r.text.replace(/\u0001(\d+)\u0002/g, function (_, i) { return holds[+i]; });
    return r;
  }

  // 只掃不改（給頁面全文做洩漏檢查，也給測試用）
  function scanPII(text) {
    var s = String(text == null ? '' : text), found = [];
    function scan(re, type) {
      var r = new RegExp(re.source, re.flags.indexOf('g') < 0 ? re.flags + 'g' : re.flags), m;
      while ((m = r.exec(s))) { found.push({ type: type, match: m[0] }); if (m[0] === '') r.lastIndex++; }
    }
    RULES.forEach(function (r) { scan(r[1], r[0]); });
    CAPTURE_RULES.forEach(function (r) { scan(r[1], r[0]); });
    scan(NAME_TITLE, 'nametitle');
    scan(NAME_TITLE2, 'nametitle');
    return found;
  }

  function truncate(text, max) {
    var chars = Array.from(text);
    if (chars.length <= max) return text;
    var cut = chars.slice(0, max).join('');
    var m = cut.match(/^[\s\S]*[。！？!?；;\n]/);
    if (m && Array.from(m[0]).length >= max * 0.5) return m[0].trim();
    return cut.replace(/[，,、\s]+$/, '') + '…';
  }

  // 清理一段文字。回傳 {ok, text, reason}
  function cleanText(text, opts) {
    opts = opts || {};
    var raw = normText(text);
    if (!raw) return { ok: false, text: '', reason: 'empty' };
    var r = maskSafe(raw, opts);   // 先遮個資（信箱的網域不要被當成網址）
    var t = r.text;
    if (hasUrl(t)) return { ok: false, text: '', reason: 'url' };
    // 整欄就只是「姓氏開頭的三個字」→ 很可能是人名（例：把自己的名字填在遊戲名稱欄），整則跳過
    if (new RegExp('^[' + SURN + '][\u4e00-\u9fff]{2}$').test(t) && NAME3_OK.indexOf(t) < 0)
      return { ok: false, text: '', reason: 'name-like' };
    var visible = Array.from(t.split(MASK).join('')).filter(function (c) { return /\S/.test(c); }).length;
    var total = Array.from(t).length;
    if (r.hits.length && visible < MIN_LEN) return { ok: false, text: '', reason: 'mostly-masked' };
    if (r.hits.length && (total - visible) / total > 0.5) return { ok: false, text: '', reason: 'mostly-masked' };
    if (!opts.allowShort && Array.from(t).length < MIN_LEN) return { ok: false, text: '', reason: 'short' };
    if (opts.max) t = truncate(t, opts.max);
    return { ok: true, text: t, reason: r.hits.length ? 'masked' : '', hits: r.hits };
  }

  // ---------- 週次 ----------
  var WEEK0 = Date.UTC(2026, 8, 6, 16, 0, 0); // 2026-09-07 00:00（臺北時間）週一
  function weekOfTs(ms) {
    if (!ms || isNaN(ms)) return 0;
    return 1 + Math.floor((ms - WEEK0) / 604800000);
  }

  // ---------- 卡片 ----------
  var ROLE_LABEL = { producer: '製作人', engineer: '工程師', marketing: '行銷', creative: '創意總監' };
  var ROLE_ICON = { producer: '🎬', engineer: '🔧', marketing: '📣', creative: '🎨' };
  var KIND_LABEL = { obj: '物件・地點', act: '行為・儀式', rel: '人際關係', tabu: '禁忌・規矩', time: '時間節奏' };
  var VERDICT_LABEL = { skin: '把文化抽掉，玩起來一樣', story: '少了文化就沒意思，但還玩得下去', mech: '文化抽掉，遊戲就不成立', unsure: '還說不準' };

  function eachNested(node, fn) { // {env:{pushId:rec}} 或 [null, {...}] 都能走
    if (!node) return;
    var keys = Array.isArray(node) ? node.map(function (_, i) { return String(i); }) : Object.keys(node);
    keys.forEach(function (k) {
      var group = node[k];
      if (!group || typeof group !== 'object') return;
      Object.keys(group).forEach(function (pk) { fn(k, group[pk], pk); });
    });
  }
  function eachFlat(node, fn) {
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(function (k) { if (node[k] && typeof node[k] === 'object') fn(node[k], k); });
  }

  /* data 形狀：
   *  rounds, custom{creative,engineer,marketing,producer}, w2culture, jams, w2cards, feedback, cardDesigns
   * opts: {salt}
   * 回傳 {cards:[…], skipped:{原因:數量}}
   */
  function buildCards(data, opts) {
    opts = opts || {};
    data = data || {};
    var salt = opts.salt || 'no-salt';
    var cards = [], skipped = {};
    function skip(why) { skipped[why] = (skipped[why] || 0) + 1; }

    // 暱稱黑名單：從 rounds 的 players 收，只用來遮字，不顯示、不保存
    var nicks = [];
    eachFlat(data.rounds, function (r) {
      eachFlat(r.players, function (p) { if (p && p.nickname) nicks.push(p.nickname); });
    });
    var nameRe = buildNameRe(nicks);
    var co = { nameRe: nameRe };

    function add(c) {
      var texts = [c.title].concat(c.lines ? c.lines.map(function (l) { return l.text; }) : [c.body]).join('|');
      c.key = cardKey(c.type, texts);
      c.author = authorCode(salt, c.authorKey, texts);
      delete c.authorKey;
      cards.push(c);
    }
    // 回傳清理後文字或 null（並記跳過原因）
    function clean(text, extra) {
      var o = { nameRe: nameRe, max: 140 };
      if (extra) for (var k in extra) o[k] = extra[k];
      var r = cleanText(text, o);
      if (!r.ok) { skip(r.reason); return null; }
      return r.text;
    }

    // 第 1 週：抽到的四張卡
    eachFlat(data.rounds, function (r, id) {
      if (isDemoFlag(r)) return skip('demo');
      var envs = Object.keys(r.players || {});
      if (!envs.length || envs.some(isBlockedEnv)) return skip('test-env');
      var lines = [], bad = false;
      ['producer', 'engineer', 'marketing', 'creative'].forEach(function (role) {
        var c = r.cards && r.cards[role];
        if (!c || !c.v) return;
        var t = clean(c.v, { allowShort: true, max: 60 });
        if (t === null) { bad = true; return; }
        lines.push({ label: ROLE_ICON[role] + ' ' + ROLE_LABEL[role], text: t });
      });
      if (bad || lines.length < 2) return skip('round-incomplete');
      add({ type: 'round', week: 1, src: 'rounds', title: '抽到這一組', lines: lines,
        chips: [{ t: '第1週', cls: 'wk' }, { t: '配對組合', cls: 'blue' }],
        authorKey: envs.sort().join(','), t: r.createdAt });
    });

    // 第 1 週：同學加進卡池的卡
    ['producer', 'engineer', 'marketing', 'creative'].forEach(function (role) {
      eachFlat(data.custom && data.custom[role], function (c) {
        if (isBlockedEnv(c.addedBy)) return skip('test-env');
        if (isDemoFlag(c)) return skip('demo');
        var title = clean(c.v, { allowShort: true, max: 60 });
        var note = clean(c.note || '', {});
        if (title === null || note === null) return;
        add({ type: 'deckcard', week: 1, src: 'customCards/' + role, title: title, body: note,
          chips: [{ t: '第1週', cls: 'wk' }, { t: ROLE_ICON[role] + ' ' + ROLE_LABEL[role] + '卡', cls: 'green' }],
          authorKey: c.addedBy, t: c.t });
      });
    });

    // 第 2 週：文化卡
    eachFlat(data.w2culture, function (c) {
      if (isBlockedEnv(c.addedBy)) return skip('test-env');
      if (isDemoFlag(c)) return skip('demo');
      if (!KIND_LABEL[c.d]) return skip('unknown-kind');
      var title = clean(c.v, { allowShort: true, max: 60 });
      var note = clean(c.note || '', {});
      if (title === null || note === null) return;
      add({ type: 'culture', week: 2, src: 'customCards/w2culture', title: title, body: note,
        chips: [{ t: '第2週', cls: 'wk' }, { t: '文化卡 · ' + KIND_LABEL[c.d], cls: 'red' }],
        authorKey: c.addedBy, t: c.t });
    });

    // 第 2 週：文化要素混進遊戲
    eachFlat(data.jams, function (j) {
      if (isBlockedEnv(j.by)) return skip('test-env');
      if (isDemoFlag(j)) return skip('demo');
      var play = clean(j.play || '', { allowShort: true, max: 60 });
      var cult = clean(j.cult || '', { allowShort: true, max: 60 });
      var line = clean(j.line || '', {});
      if (play === null || cult === null || line === null) return;
      add({ type: 'jam', week: 2, src: 'analysis/w2/jams', title: play + ' × ' + cult, body: line,
        chips: [{ t: '第2週', cls: 'wk' }, { t: '混搭', cls: 'purple' }].concat(
          KIND_LABEL[j.cultKind] ? [{ t: KIND_LABEL[j.cultKind], cls: 'red' }] : []),
        authorKey: j.by, t: j.t });
    });

    // 第 2 週：看過／玩過的遊戲
    eachNested(data.w2cards, function (env, c) {
      if (isBlockedEnv(env)) return skip('test-env');
      if (isDemoFlag(c)) return skip('demo');
      var game = clean(c.game || '', { allowShort: true, max: 60 });
      var line = clean(c.line || '', { max: 120 });
      if (game === null || line === null) return;
      add({ type: 'game', week: 2, src: 'analysis/w2/cards', title: game, body: line,
        chips: [{ t: '第2週', cls: 'wk' }, { t: c.mode === 'play' ? '自己玩過' : '看實況', cls: 'blue' }].concat(
          VERDICT_LABEL[c.v] ? [{ t: VERDICT_LABEL[c.v], cls: 'plain' }] : []),
        authorKey: env, t: c.t });
    });

    // 第 3 週：同學設計的規則卡
    eachNested(data.cardDesigns, function (env, c) {
      if (isBlockedEnv(env)) return skip('test-env');
      if (isDemoFlag(c)) return skip('demo');
      var name = clean(c.name || '', { allowShort: true, max: 40 });
      var rule = clean(c.rule || '', { max: 100 });
      var why = c.why ? clean(c.why, { max: 100 }) : '';
      if (name === null || rule === null || why === null) return;
      var lines = [{ label: '規則', text: rule }];
      if (why) lines.push({ label: '為什麼', text: why });
      add({ type: 'design', week: 3, src: 'analysis/w3game/cardDesigns', title: name, lines: lines,
        chips: [{ t: '第3週', cls: 'wk' }, { t: '自己設計的規則卡', cls: 'green' }],
        authorKey: env, t: c.ts });
    });

    // 回饋（依時間歸週）
    eachFlat(data.feedback, function (f) {
      if (isBlockedEnv(f.env)) return skip('test-env');
      if (isDemoFlag(f)) return skip('demo');
      var raw = normText(f.text);
      if (Array.from(raw).length > 200) return skip('too-long');
      var t = clean(raw, { max: 140 });
      if (t === null) return;
      var wk = weekOfTs(f.t) || 1;
      add({ type: 'feedback', week: wk, src: 'feedback', title: '一則回饋', body: t,
        chips: [{ t: '第' + wk + '週', cls: 'wk' }, { t: '同學的話', cls: 'purple' }],
        authorKey: f.env, t: f.t });
    });

    // 同內容去重（重複按送出會產生一模一樣的紀錄）
    var seen = {}, uniq = [];
    cards.forEach(function (c) {
      if (seen[c.key]) return skip('duplicate');
      seen[c.key] = 1; uniq.push(c);
    });
    return { cards: uniq, skipped: skipped };
  }

  // 排序：各類型輪流，相鄰兩張盡量不同類，同類內依雜湊（穩定）排列
  function interleave(cards) {
    var by = {};
    cards.forEach(function (c) { (by[c.type] = by[c.type] || []).push(c); });
    Object.keys(by).forEach(function (t) {
      by[t].sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
    });
    var types = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
    var out = [], i = 0, left = cards.length;
    while (left > 0) {
      types.forEach(function (t) { if (by[t].length > i) { out.push(by[t][i]); left--; } });
      i++;
    }
    return out;
  }

  return {
    MASK: MASK, MIN_LEN: MIN_LEN,
    isBlockedEnv: isBlockedEnv, isDemoFlag: isDemoFlag,
    hashStr: hashStr, cardKey: cardKey, authorCode: authorCode,
    hasUrl: hasUrl, maskPII: maskSafe, scanPII: scanPII, cleanText: cleanText,
    buildNameRe: buildNameRe, weekOfTs: weekOfTs, truncate: truncate,
    buildCards: buildCards, interleave: interleave
  };
});
