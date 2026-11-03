/* 探員 × 小精靈共鳴測試：node test_tools/test_walk_resonance.js
   涵蓋 16 位探員 × 24 隻小精靈 ＝ 384 組：屬性共鳴、補位、歷史共鳴（專精／熟悉）、專屬搭檔四種都至少各有實例，
   並印出每位探員最適合的前三隻小精靈。全過退出碼 0。 */
'use strict';
var fs = require('fs'), path = require('path');
var root = path.resolve(__dirname, '..');
global.window = global;
global.localStorage = { getItem: function () { return null; }, setItem: function () { }, removeItem: function () { } };
['js/walk_agents.js', 'js/walk_agent_skills.js', 'js/walk_data_agent_era.js', 'js/walk_data_spirit.js'].forEach(function (f) { (0, eval)(fs.readFileSync(path.join(root, f), 'utf8')); });
var WalkStore = require(path.join(root, 'js', 'walk_store.js'));
var SP = window.WALK_SPIRITS, A = window.WALK_AGENTS, ERA = window.WALK_AGENT_ERAS, PAIRS = window.WALK_SPIRIT_PAIRS, META = window.WALK_SPIRIT_META;
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } }
function eq(a, b, m) { ok(JSON.stringify(a) === JSON.stringify(b), m + '（實際 ' + JSON.stringify(a) + '，預期 ' + JSON.stringify(b) + '）'); }

var ERA_NAMES = ['西拉雅與大員前史', '荷治', '明鄭', '清領', '日治', '戰後', '當代文資'];
var ATTR = ['觀察', '溝通', '智識', '行動', '守護'];

console.log('● 探員歷史專長資料（來源 AGENT_HISTORY_1029.json）');
var hist = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'knowledge', 'tainan_walk', 'AGENT_HISTORY_1029.json'), 'utf8'));
eq(A.order.length, 16, '探員 16 位');
A.order.forEach(function (r) {
  var e = ERA[r], src = hist[r];
  ok(e && Array.isArray(e.eras) && e.eras.length === 1, r + ' 專精剛好 1 個');
  ok(e && Array.isArray(e.famEras) && e.famEras.length <= 2, r + ' 熟悉最多 2 個');
  ok(e && e.eras.concat(e.famEras).every(function (n) { return ERA_NAMES.indexOf(n) >= 0; }), r + ' 時期名稱在七個時期內');
  ok(e && e.eras.concat(e.famEras).every(function (n) { return SP.some(function (s) { return s.era === n || s.scout.era === n || (META.eras.filter(function (x) { return x.id === s.eraId; })[0] || {}).name === n; }); }), r + ' 的時期名稱與小精靈資料的時期欄一致');
  var s3 = Object.keys(src.era).filter(function (k) { return src.era[k] === 3; }).map(function (k) { return k.replace(/\(.*\)$/, ''); });
  var s2 = Object.keys(src.era).filter(function (k) { return src.era[k] === 2; }).map(function (k) { return k.replace(/\(.*\)$/, ''); });
  eq([e.eras, e.famEras], [s3, s2], r + ' 與原檔 3 級、2 級逐項相同');
  ok(A.all[r].eras === e.eras && A.all[r].famEras === e.famEras, r + ' 已掛到 WALK_AGENTS 名冊');
  ok(Array.isArray(A.all[r].stats) && A.all[r].stats.length === 5, r + ' 有五項屬性');
});

console.log('\n● 384 組共鳴：與獨立重算逐組比對');
function eraNames(s) { var n = [s.era, s.scout.era]; META.eras.forEach(function (x) { if (x.id === s.eraId) n.push(x.name); }); return n; }
var table = {}, cnt = { 共鳴: 0, 補位: 0, 專家: 0, 熟悉: 0, 專屬: 0, 平常: 0 }, sample = {};
A.order.forEach(function (role) {
  var st = A.all[role].stats, mx = Math.max.apply(null, st), mn = Math.min.apply(null, st), rows = [];
  SP.forEach(function (s) {
    var r = WalkStore.resonance(s.id, role), ai = ATTR.indexOf(s.attr);
    var exResonance = s.attr === '全' || (ai >= 0 && st[ai] === mx), exFill = s.attr !== '全' && ai >= 0 && st[ai] === mn && mn <= 2 && st[ai] !== mx;
    var names = eraNames(s), exp = names.indexOf(ERA[role].eras[0]) >= 0, fam = !exp && ERA[role].famEras.some(function (n) { return names.indexOf(n) >= 0; });
    var sp = PAIRS.filter(function (p) { return p.role === role && p.spirit === s.id; })[0];
    ok(!!r.resonance === exResonance, role + '×' + s.name + ' 屬性共鳴');
    ok(!!r.fill === exFill, role + '×' + s.name + ' 補位');
    ok(!!r.history === (exp || fam) && (!r.history || r.historyLevel === (exp ? 'expert' : 'familiar')), role + '×' + s.name + ' 歷史共鳴等級');
    ok(r.extraItems === (exp ? 1 : (fam ? 0.5 : 0)), role + '×' + s.name + ' 勘察加成件數 ' + r.extraItems);
    ok(!!r.special === !!sp, role + '×' + s.name + ' 專屬搭檔');
    ok(!r.resonance || (r.qualityMul === 1.5 && r.cdMul === 0.8), role + '×' + s.name + ' 共鳴效果 ×1.5、冷卻 −20%');
    var score = (r.resonance ? 3 : 0) + (r.fill ? 1 : 0) + (exp ? 2 : (fam ? 1 : 0)) + (r.special ? 2 : 0);
    if (r.resonance) { cnt.共鳴++; sample.共鳴 = sample.共鳴 || role + '×' + s.name; }
    if (r.fill) { cnt.補位++; sample.補位 = sample.補位 || role + '×' + s.name + '（探員' + s.attr + ' ' + st[ai] + ' 是最低）'; }
    if (exp) { cnt.專家++; sample.專家 = sample.專家 || role + '（專精' + ERA_NAMES.filter(function (n) { return names.indexOf(n) >= 0; })[0] + '）×' + s.name; }
    if (fam) { cnt.熟悉++; sample.熟悉 = sample.熟悉 || role + '（熟悉' + ERA_NAMES.filter(function (n) { return names.indexOf(n) >= 0; })[0] + '）×' + s.name; }
    if (r.special) { cnt.專屬++; sample.專屬 = sample.專屬 || role + '×' + s.name + '「' + r.special.label + '」'; }
    if (!r.kinds.length) cnt.平常++;
    rows.push({ s: s, score: score, kinds: r.kinds, level: r.historyLevel });
  });
  rows.sort(function (a, b) { return b.score - a.score || a.s.no - b.s.no; });
  table[role] = rows.slice(0, 3);
  ok(rows[0].score > 0, role + ' 至少有一隻合適的小精靈');
  ok(rows.some(function (x) { return x.level === 'expert'; }), role + ' 至少有一隻小精靈與專精時期對上');
});
ok(cnt.共鳴 > 0 && cnt.補位 > 0 && cnt.專家 > 0 && cnt.熟悉 > 0 && cnt.專屬 > 0, '四種共鳴（含歷史共鳴專精與熟悉兩級）都至少一組實例');
console.log('  實例數：' + JSON.stringify(cnt) + '（共 ' + (16 * 24) + ' 組）');
Object.keys(sample).forEach(function (k) { console.log('  · ' + k + '：' + sample[k]); });

console.log('\n● 每位探員最適合的前三隻小精靈（分數＝共鳴 3＋補位 1＋歷史專精 2／熟悉 1＋專屬 2）');
A.order.forEach(function (role) {
  console.log('  ' + role + '（專精' + ERA[role].eras[0] + '；熟悉' + (ERA[role].famEras.join('、') || '無') + '）：' + table[role].map(function (x) { return x.s.name + '[' + x.score + ' ' + (x.kinds.join('+') || '平常') + (x.level === 'familiar' ? '·熟悉' : '') + ']'; }).join('、'));
});

console.log('\n● 特殊情況');
var ink = WalkStore.resonance('sp_ink', '訪談員');
ok(ink.history && ink.historyLevel === 'expert', '墨靈（時期「戰後與文學」）與專精戰後的訪談員 → 歷史共鳴（以基本時期名「戰後」對上）');
var tide = WalkStore.resonance('sp_tide', '偵查員');
ok(tide.history && tide.historyLevel === 'expert' && tide.extraItems === 1, '潮汐鯨魂（西拉雅與大員前史）×偵查員（專精前史）→ 專精歷史共鳴，勘察多帶 1 件');
var deer = WalkStore.resonance('sp_deer', '偵查員');
ok(deer.history && deer.historyLevel === 'familiar' && deer.extraItems === 0.5 && deer.special && deer.special.label === '循跡', '鹿影（荷治）×偵查員（熟悉荷治）→ 熟悉等級（0.5 件），且同時有專屬「循跡」');
var none = WalkStore.resonance('sp_ufo', '隊長');
ok(!none.history && none.extraItems === 0, '點雲幽浮（當代文資）×隊長（不熟當代文資）→ 沒有歷史共鳴');
var unk = WalkStore.resonance('sp_tide', { role: '路人', stats: [3, 3, 3, 3, 3] });
ok(!unk.history && unk.extraItems === 0, '沒有時期資料的探員 → 沒有歷史共鳴，也不出錯');

console.log('\n==== 通過 ' + pass + '、失敗 ' + fail + ' ====');
process.exit(fail ? 1 : 0);
