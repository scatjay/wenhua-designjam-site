/* 驗證 js/walk_data_intel_b.js（南臺校園情報卡 B）。node test_tools/test_walk_data_intel_b.js
   全過退出碼 0，有任何一項失敗退出碼 1。每一項都印數字。 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var fails = 0;
function ok(cond, label, detail) {
  if (cond) { console.log('  OK   ' + label + (detail !== undefined ? '  → ' + detail : '')); }
  else { fails++; console.log('  FAIL ' + label + (detail !== undefined ? '  → ' + detail : '')); }
}
function load(rel) {
  var box = {}; box.window = box;
  vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), box, { filename: rel });
  return box;
}

var intel = load('js/walk_data_intel_b.js').WALK_INTEL_B;
var route = load('js/walk_route.js').WALK_ROUTE;
console.log('卡片總數 ' + (intel ? intel.length : 'undefined'));
ok(Array.isArray(intel) && intel.length > 0, 'WALK_INTEL_B 是非空陣列', intel && intel.length);

var TYPES = ['史料', '路況', '人物', '觀察', '彩蛋', '方位'];
var ABBR = { '史料': 's', '路況': 'r', '人物': 'p', '觀察': 'o', '彩蛋': 'e', '方位': 'd' };
var LEVELS = ['有出處', '摘要級', '待查證'];
var RARITY = ['普通', '精良', '稀有'];
function chs(c) { return Array.isArray(c.chapter) ? c.chapter : [c.chapter]; }

console.log('\n[1] 欄位與合法值');
var badField = [], badType = [], badLevel = [], badRar = [], badLen = [], badTags = [], badId = [], badAbbr = [];
var seen = {}, dup = [];
intel.forEach(function (c) {
  ['id', 'chapter', 'type', 'text', 'source', 'level', 'tags', 'rarity'].forEach(function (k) {
    if (c[k] === undefined || c[k] === null || c[k] === '' || (Array.isArray(c[k]) && !c[k].length)) badField.push(c.id + ':' + k);
  });
  if (seen[c.id]) dup.push(c.id); seen[c.id] = 1;
  if (TYPES.indexOf(c.type) < 0) badType.push(c.id);
  if (LEVELS.indexOf(c.level) < 0) badLevel.push(c.id);
  if (RARITY.indexOf(c.rarity) < 0) badRar.push(c.id);
  if (typeof c.text !== 'string' || c.text.length > 60) badLen.push(c.id + '(' + (c.text && c.text.length) + ')');
  if (!Array.isArray(c.tags) || c.tags.some(function (t) { return typeof t !== 'string' || !t; })) badTags.push(c.id);
  var m = /^i_([a-z0-9]+)_([srpoed])_(\d+)$/.exec(c.id || '');
  if (!m) badId.push(c.id);
  else if (ABBR[c.type] !== m[2] || chs(c).indexOf(m[1]) < 0) badAbbr.push(c.id);
});
ok(!dup.length, 'id 唯一', dup.length ? dup.join(',') : intel.length + ' 個 id 全不重複');
ok(!badField.length, '八個欄位齊全', badField.length ? badField.join(',') : '0 個缺漏');
ok(!badId.length, 'id 格式 i_<章>_<類別縮寫>_<序號>', badId.length ? badId.join(',') : '0 個不符');
ok(!badAbbr.length, 'id 的類別縮寫與 type 一致、章碼在 chapter 內', badAbbr.length ? badAbbr.join(',') : '0 個不符');
ok(!badType.length, 'type 只用六類', badType.length ? badType.join(',') : '0 個不合法');
ok(!badLevel.length, 'level 只用 有出處／摘要級／待查證', badLevel.length ? badLevel.join(',') : '0 個不合法');
ok(!badRar.length, 'rarity 只用 普通／精良／稀有', badRar.length ? badRar.join(',') : '0 個不合法');
ok(!badLen.length, 'text ≤ 60 字', badLen.length ? badLen.join(',') : '最長 ' + Math.max.apply(null, intel.map(function (c) { return c.text.length; })) + ' 字');
ok(!badTags.length, 'tags 是非空字串陣列', badTags.length ? badTags.join(',') : '0 個不合法');

console.log('\n[2] 出處與可信度');
var noSrcShi = intel.filter(function (c) { return c.type === '史料' && !(c.source && c.source.length >= 8); }).map(function (c) { return c.id; });
ok(!noSrcShi.length, '史料卡都有出處說明', noSrcShi.length ? noSrcShi.join(',') : intel.filter(function (c) { return c.type === '史料'; }).length + ' 張史料卡全有 source');
var upgraded = intel.filter(function (c) { return c.level === '有出處' && /僅讀/.test(c.source); }).map(function (c) { return c.id; });
ok(!upgraded.length, '「有出處」的 source 不含「僅讀（摘要）」字樣（防止升級）', upgraded.length ? upgraded.join(',') : '0 張');
var sumNoMark = intel.filter(function (c) { return c.level === '摘要級' && !/摘要/.test(c.source); }).map(function (c) { return c.id; });
ok(!sumNoMark.length, '「摘要級」的 source 都註明只讀摘要', sumNoMark.length ? sumNoMark.join(',') : '0 張');
var unv = /西淮|水力加工坊|天圓地方|八億|T 棟|T棟/;
var unvBad = intel.filter(function (c) {
  return unv.test(c.text) && c.type === '史料' && c.level === '有出處' && !/(手冊|事略)/.test(c.source);
}).map(function (c) { return c.id; });
ok(!unvBad.length, '已標 unverified 的主題沒有被標成「有出處」的史料事實', unvBad.length ? unvBad.join(',') : '0 張');

console.log('\n[3] 站覆蓋與張數');
var TASK = [['c0', 'y0'], ['c1', 'y1'], ['c2', 'y2'], ['c3', 'ws'], ['x3'], ['x4'], ['x5'], ['x6'], ['w1'], ['w2'], ['w3']];
var PLAIN = [['cg'], ['w0'], ['wt'], ['wc'], ['w4'], ['c4']];
function key(a) { return a.slice().sort().join('+'); }
var byKey = {};
intel.forEach(function (c) { var k = key(chs(c)); (byKey[k] = byKey[k] || []).push(c); });
var allKeys = TASK.concat(PLAIN).map(key);
var orphan = Object.keys(byKey).filter(function (k) { return allKeys.indexOf(k) < 0; });
ok(!orphan.length, '所有卡片都屬於指定的站', orphan.length ? orphan.join(',') : '0 張孤兒');
TASK.forEach(function (g) {
  var arr = byKey[key(g)] || [];
  var types = {}; arr.forEach(function (c) { types[c.type] = 1; });
  ok(arr.length === 8 && Object.keys(types).length === 6, '有任務的站 ' + g.join('/') + ' ＝ 8 張且六類齊全', arr.length + ' 張，類別 ' + Object.keys(types).length + '/6');
});
PLAIN.forEach(function (g) {
  var arr = byKey[key(g)] || [];
  var types = {}; arr.forEach(function (c) { types[c.type] = 1; });
  ok(arr.length >= 4 && arr.length <= 6, '其餘站 ' + g.join('/') + ' 4～6 張', arr.length + ' 張，類別 ' + Object.keys(types).length + '/6');
});

console.log('\n[4] chapter 對得到路線檔站 id');
var campusIds = route.campus.stops.map(function (s) { return s.id; });
var nightIds = route.campusW.stops.map(function (s) { return s.id; });
var allIds = campusIds.concat(nightIds);
var badCh = [];
intel.forEach(function (c) { chs(c).forEach(function (x) { if (allIds.indexOf(x) < 0) badCh.push(c.id + ':' + x); }); });
ok(!badCh.length, '每個 chapter 都是 campus 或 campusW 的站 id', badCh.length ? badCh.join(',') : '路線檔共 ' + campusIds.length + '＋' + nightIds.length + ' 站，0 個對不上');
var withTask = {};
route.campus.stops.concat(route.campusW.stops).forEach(function (s) { if (s.tasks && s.tasks.length && !s.final && !s.plain) withTask[s.id] = 1; });
var coveredIds = {};
intel.forEach(function (c) { chs(c).forEach(function (x) { coveredIds[x] = 1; }); });
var uncovered = Object.keys(withTask).filter(function (id) { return !coveredIds[id]; });
ok(!uncovered.length, '路線檔裡「有任務的站」都有情報卡', uncovered.length ? '缺 ' + uncovered.join(',') : Object.keys(withTask).length + ' 個有任務的站全有卡');
var shared = { c0: 'y0', c1: 'y1', c2: 'y2', c3: 'ws' };
var sharedBad = intel.filter(function (c) {
  var a = chs(c); return a.some(function (x) { return shared[x]; }) && !(a.length === 2 && shared[a[0]] === a[1]);
}).map(function (c) { return c.id; });
ok(!sharedBad.length, '白天與夜間 id 不同的共用站，chapter 都寫成成對陣列', sharedBad.length ? sharedBad.join(',') : '0 個不符');

console.log('\n[5] 硬規則');
var coord = intel.filter(function (c) { return c.type === '方位' && /\d{2,3}\.\d{3,}/.test(c.text); }).map(function (c) { return c.id; });
ok(!coord.length, '方位卡沒有精確座標', coord.length ? coord.join(',') : '0 張');
var noRange = intel.filter(function (c) { return c.type === '方位' && !/約/.test(c.text); }).map(function (c) { return c.id; });
ok(!noRange.length, '方位卡都是「約」＋區間（不是單點數字）', noRange.length ? noRange.join(',') : intel.filter(function (c) { return c.type === '方位'; }).length + ' 張方位卡');
var timeBad = intel.filter(function (c) { return c.type === '路況' && /營業|開放時間|\d{1,2}[:：]\d{2}|點至|點到|週[一二三四五六日]|週末/.test(c.text); }).map(function (c) { return c.id; });
ok(!timeBad.length, '路況卡不寫會過期的營業／開放時間', timeBad.length ? timeBad.join(',') : '0 張');
var BAN = /我們|統計|備課|學習單|學年|產學案|洞見|範式|形成式|泛論|通論|概論|歷年|[AB] ?類|11[0-9]-[12]|作業 ?\d|Slido|審稿|我們(把|看|檢視)/;
var banBad = intel.filter(function (c) { return BAN.test(c.text); }).map(function (c) { return c.id + ':' + BAN.exec(c.text)[0]; });
ok(!banBad.length, 'text 沒有統計／備課／老師行政用語', banBad.length ? banBad.join(',') : '0 張');
var pii = intel.filter(function (c) { return /\d{4}-\d{3}-\d{3}|@[a-z0-9.-]+\.[a-z]{2,}|身分證|電話|手機號/i.test(c.text + c.source); }).map(function (c) { return c.id; });
ok(!pii.length, '沒有電話、信箱等個資樣式', pii.length ? pii.join(',') : '0 張');
var god = intel.filter(function (c) { return c.type === '人物' && /(姑婆祖|陳靖姑|媽祖)/.test(c.text); }).map(function (c) { return c.id; });
ok(!god.length, '人物卡沒有把神明做成角色', god.length ? god.join(',') : '0 張');
var lore = intel.filter(function (c) { return /姑婆|陳靖姑|媽祖|寧靖王/.test(c.text) && c.type === '史料' && c.level === '有出處' && /傳說|據傳|相傳/.test(c.text); }).map(function (c) { return c.id; });
ok(!lore.length, '姑婆廟的傳說說法沒有標成「有出處」（只能摘要級或待查證）', lore.length ? lore.join(',') : '0 張');
var loreNoMark = intel.filter(function (c) { return /寧靖王|據傳|相傳|說法/.test(c.text) && /^i_w3_/.test(c.id) && c.type === '史料' && !/說法|據傳|相傳/.test(c.text); }).map(function (c) { return c.id; });
ok(!loreNoMark.length, '傳說卡的 text 有寫出「說法／據傳」字樣', loreNoMark.length ? loreNoMark.join(',') : '0 張');

console.log('\n[6] 不洩漏任務答案（依站檢查 text）');
function textsOf(ids) { return intel.filter(function (c) { return chs(c).some(function (x) { return ids.indexOf(x) >= 0; }); }); }
var LEAK = [
  { ids: ['c1', 'y1'], re: /校慶|開學典禮/, why: '校史館：校慶紀念的是哪件事' },
  { ids: ['x6'], re: /校慶|開學典禮|宇宙觀|圓的|方的/, why: '天圓地方：校慶題與宇宙觀題' },
  { ids: ['c3', 'ws', 'x3'], re: /董事長|校長/, why: '吳三連的職位／第一任董事長' },
  { ids: ['c2', 'y2'], re: /父親|爸爸|尊翁|家父/, why: '西淮是誰' },
  { ids: ['w2'], re: /明鄭|鄭成功|寧靖王/, why: '姑婆祖的時代' },
  { ids: ['w1'], re: /工業區|工廠/, why: '牌樓外是什麼' },
  { ids: ['x4'], re: /吳修齊|修齊大樓/, why: '修齊大樓命名' },
  { ids: ['x5'], re: /1999|1996|1969|科技大學/, why: '改名科技大學的年份' }
];
LEAK.forEach(function (L) {
  var bad = textsOf(L.ids).filter(function (c) { return L.re.test(c.text); }).map(function (c) { return c.id + ':' + L.re.exec(c.text)[0]; });
  ok(!bad.length, L.ids.join('/') + ' 不含「' + L.why + '」的答案字眼', bad.length ? bad.join(',') : textsOf(L.ids).length + ' 張檢查過');
});

console.log('\n[7] 簡體字');
var SIMP = '这个们为实时间发开关门问题务认识说话读书东车长学习单应该选总结备课统计层级数据软网络质对错误测试页类别场边头灯带过来还与专业乐优势队员视觉观点记录区环节举办获奖纪际历资讯馆圆线图块现';
var simpHit = [];
intel.forEach(function (c) {
  var s = c.text + c.source + c.tags.join('');
  for (var i = 0; i < s.length; i++) { if (SIMP.indexOf(s.charAt(i)) >= 0) simpHit.push(c.id + ':' + s.charAt(i)); }
});
var simpTool = 'skip';
try {
  var py = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'lib', 'check_no_simplified.py');
  if (fs.existsSync(py)) {
    var out = cp.spawnSync('python', ['-I', py, path.join(ROOT, 'js', 'walk_data_intel_b.js')], { encoding: 'utf8' });
    simpTool = 'exit ' + out.status + ' ' + String(out.stdout || '').trim().split('\n').slice(-1)[0];
    ok(out.status === 0, 'check_no_simplified.py 通過', simpTool);
  } else { console.log('  --   找不到 check_no_simplified.py，略過工具檢查'); }
} catch (e) { console.log('  --   工具檢查略過：' + e.message); }
ok(!simpHit.length, '內建簡體字表掃描', simpHit.length ? simpHit.slice(0, 10).join(',') : '0 個命中（表內 ' + SIMP.length + ' 字）');

console.log('\n[8] 分布');
var lv = {}, ty = {}, ra = {};
intel.forEach(function (c) { lv[c.level] = (lv[c.level] || 0) + 1; ty[c.type] = (ty[c.type] || 0) + 1; ra[c.rarity] = (ra[c.rarity] || 0) + 1; });
console.log('  level  ' + JSON.stringify(lv));
console.log('  type   ' + JSON.stringify(ty));
console.log('  rarity ' + JSON.stringify(ra));

console.log('\n' + (fails ? 'FAILED ' + fails + ' 項' : 'ALL OK') + '（卡片 ' + intel.length + ' 張）');
process.exit(fails ? 1 : 0);
