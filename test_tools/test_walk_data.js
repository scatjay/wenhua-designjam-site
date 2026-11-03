/* 走讀三個資料檔的 Node 測試：node test_tools/test_walk_data.js （不需瀏覽器；全過退出碼 0）
   驗證 js/walk_data_spirit.js、js/walk_data_shop.js、js/walk_data_dex.js，並對照設計稿表格與路線資料。 */
'use strict';
var fs = require('fs'), path = require('path');
var root = path.resolve(__dirname, '..');
var docDir = path.resolve(root, '..', 'knowledge', 'tainan_walk');
var pass = 0, fail = 0, skip = 0, group = '';
function G(n) { group = n; console.log('\n● ' + n); }
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } }
function eq(a, b, m) { ok(JSON.stringify(a) === JSON.stringify(b), m + '（實際 ' + JSON.stringify(a) + '，預期 ' + JSON.stringify(b) + '）'); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

/* ---------- 載入 ---------- */
global.window = {};
['js/walk_route.js', 'js/walk_route_tw.js', 'js/walk_agents.js', 'js/walk_data_spirit.js', 'js/walk_data_shop.js', 'js/walk_data_dex.js'].forEach(function (f) { (0, eval)(read(f)); });
var W = global.window, SP = W.WALK_SPIRITS, FOODS = W.WALK_FOODS, TOYS = W.WALK_TOYS, PAIRS = W.WALK_SPIRIT_PAIRS, META = W.WALK_SPIRIT_META, EGGS = W.WALK_SPIRIT_EGGS, SHOP = W.WALK_SHOP, DEX = W.WALK_DEX;
var ROUTE = W.WALK_ROUTE, AGENTS = W.WALK_AGENTS;

var KINDS = ['史料', '路況', '人物', '觀察', '彩蛋', '方位'];
var ATTRS = ['觀察', '溝通', '智識', '行動', '守護', '全'], RAR = ['普通', '稀有', '傳說'];
var SENSITIVE = /二二八|湯德章|噍吧哖|成大|成功大學|NCKU/;
function isStr(x) { return typeof x === 'string' && x.length > 0; }
function isHex(x) { return /^#[0-9a-fA-F]{6}$/.test(x); }
function spriteOk(sp, label, minPx) {
  if (!sp || sp.w !== 16 || sp.h !== 16 || !Array.isArray(sp.rows) || sp.rows.length !== 16) { ok(false, label + ' 不是 16×16 矩陣'); return; }
  var bad = [], px = 0;
  sp.rows.forEach(function (r, y) {
    if (typeof r !== 'string' || r.length !== 16) bad.push('第 ' + y + ' 列長度 ' + (r && r.length));
    else for (var x = 0; x < 16; x++) { var ch = r[x]; if (ch === '.') continue; px++; if (!sp.pal || !isHex(sp.pal[ch] || '')) bad.push('字元 ' + ch + ' 不在調色盤'); }
  });
  ok(bad.length === 0, label + '：' + bad.slice(0, 3).join('；'));
  ok(px >= (minPx || 20), label + ' 不透明像素太少（' + px + '）');
}
function rowsKey(sp) { return sp.rows.join('/'); }

/* ---------- 設計稿表格抽成期望值 ---------- */
function mdRows(file) {
  var p = path.join(docDir, file);
  if (!fs.existsSync(p)) return null;
  var out = {};
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach(function (ln) {
    if (ln.charAt(0) !== '|') return;
    var c = ln.split('|').map(function (x) { return x.trim(); });
    var n = parseInt(c[1], 10);
    if (!(n >= 1 && n <= 24) || String(n) !== c[1] || /^[\d.]+$/.test(c[2]) || c.length < 8) return;
    out[n] = c;
  });
  return out;
}
var ROOMMD = mdRows('ROOM_SPIRIT_DESIGN_1029.md'), SKILLMD = mdRows('SPIRIT_SKILLS_EXPEDITION_1029.md');
var KMAP = { '史料卡': '史料', '路況卡': '路況', '人物卡': '人物', '觀察卡': '觀察', '彩蛋卡': '彩蛋', '方位卡': '方位' };
function cdText(a) { if (a.cd > 0) return '（' + a.cd + ' 分）'; if (a.perChapter) return '（每章 ' + a.perChapter + ' 次）'; if (a.perQuestion) return '（每題 ' + a.perQuestion + ' 次）'; return '（無冷卻）'; }

/* ================= 小精靈 ================= */
G('小精靈：欄位與圖');
ok(Array.isArray(SP) && SP.length === 24, '應有 24 隻，實際 ' + (SP && SP.length));
var ids = {}, names = {};
SP.forEach(function (s, i) {
  var L = '#' + (i + 1) + ' ' + s.name;
  ['id', 'name', 'nick', 'era', 'eraId', 'anchor', 'attr', 'rarity', 'favFood'].forEach(function (k) { ok(isStr(s[k]), L + ' 缺欄位 ' + k); });
  ok(s.no === i + 1, L + ' no 應為 ' + (i + 1));
  ok(!ids[s.id], L + ' id 重複'); ids[s.id] = 1; ok(!names[s.name], L + ' 名稱重複'); names[s.name] = 1;
  ok(/^sp_[a-z]+$/.test(s.id), L + ' id 格式'); ok(['fantasy', 'scifi', 'cute', 'relic'].indexOf(s.genre) >= 0, L + ' genre 欄');
  ok(ATTRS.indexOf(s.attr) >= 0, L + ' 屬性不合法'); ok(RAR.indexOf(s.rarity) >= 0, L + ' 稀有度不合法');
  ok(s.anchor.indexOf('待文史把關') >= 0 && s.anchor.length <= 48, L + ' anchor 要含「待文史把關」且 ≤48 字');
  ok(!SENSITIVE.test(JSON.stringify(s)), L + ' 含敏感題材或真實院名');
  ok(s.assist && isStr(s.assist.name) && isStr(s.assist.desc) && typeof s.assist.cd === 'number' && s.assist.cd >= 0 && isStr(s.assist.key) && typeof s.assist.value === 'number', L + ' assist 結構（含 key／value）');
  ok(s.talent && isStr(s.talent.name) && isStr(s.talent.desc) && isStr(s.talent.key) && typeof s.talent.value === 'number', L + ' talent 結構');
  ok(s.scout && Array.isArray(s.scout.kind) && s.scout.kind.length >= 1 && s.scout.kind.every(function (k) { return KINDS.indexOf(k) >= 0; }) && isStr(s.scout.era), L + ' scout 結構');
  ok(s.awaken && isStr(s.awaken.name) && isStr(s.awaken.desc) && isStr(s.awaken.key) && typeof s.awaken.value === 'number' && s.awaken.cond && s.awaken.cond.bond > 0, L + ' awaken 結構（含 key／value 與覺醒條件）');
  ok(typeof s.hatchHours === 'number' && s.hatchHours > 0, L + ' hatchHours'); ok((s.needDexPct === 100) === (s.no === 16), L + ' 只有第 16 隻需圖鑑 100% 才能拿蛋');
  ok(s.favFood === '全' ? s.no === 16 : s.favFood === s.scout.kind[0], L + ' favFood 應為勘察專長第一類');
  ['egg', 'baby', 'adult', 'awake'].forEach(function (st) {
    var x = s.stages && s.stages[st];
    ok(x && isStr(x.line) && x.line.length <= 24, L + ' ' + st + ' line 缺或超過 24 字');
    spriteOk(x && x.sprite, L + ' ' + st + ' 精靈圖', st === 'baby' ? 20 : 40);
  });
  ok(rowsKey(s.stages.adult.sprite) !== rowsKey(s.stages.awake.sprite), L + ' 成體與覺醒圖不應相同');
  ok(rowsKey(s.stages.adult.sprite) !== rowsKey(s.stages.baby.sprite), L + ' 成體與幼體圖不應相同');
  ok(s.stages.egg.sprite === EGGS[s.id], L + ' 蛋圖是自己的蛋（WALK_SPIRIT_EGGS[id]）');
});
SP.forEach(function (s) { spriteOk(EGGS[s.id], '蛋 ' + s.name, 40); });
eq(Object.keys(EGGS).sort(), SP.map(function (s) { return s.id; }).sort(), '24 種各有自己的蛋');
ok(new Set(SP.map(function (s) { return rowsKey(EGGS[s.id]); })).size === 24, '24 張蛋圖彼此不同');
ok(new Set(SP.map(function (s) { return rowsKey(s.stages.baby.sprite); })).size === 24, '24 張幼體圖彼此不同');
var advPx = {}; SP.forEach(function (s) { var k = rowsKey(s.stages.adult.sprite); ok(!advPx[k], s.name + ' 成體圖與別隻重複'); advPx[k] = 1; });

G('小精靈：稀有度分佈與起始（對照設計稿）');
var cnt = { '普通': 0, '稀有': 0, '傳說': 0 }; SP.forEach(function (s) { cnt[s.rarity]++; });
eq(cnt, { '普通': 12, '稀有': 10, '傳說': 2 }, '稀有度分佈（普通 12、稀有 10、傳說 2：普通多、稀有次之、傳說最少）');
eq(SP.filter(function (s) { return s.starter; }).map(function (s) { return s.no; }), [1, 2, 5], '起始可選＝潮汐鯨魂、鹿影、書卷蠹魚');
eq(SP.filter(function (s) { return s.hidden; }).map(function (s) { return s.no; }), [16], '只有第 16 隻在圖鑑 100% 出現');
eq(SP.filter(function (s) { return s.rarity === '傳說'; }).map(function (s) { return s.no; }), [1, 16], '傳說＝潮與髓');
var eraCnt = {}; SP.forEach(function (s) { eraCnt[s.eraId] = (eraCnt[s.eraId] || 0) + 1; });
eq(eraCnt, { pre: 3, dutch: 3, zheng: 3, qing: 3, japan: 4, postwar: 4, heritage: 3, core: 1 }, '各時期物種數（七個時期各 ≥3，時安局核心 1 隻）');
var gCnt = {}; SP.forEach(function (s) { gCnt[s.genre] = (gCnt[s.genre] || 0) + 1; });
ok(['fantasy', 'scifi', 'cute', 'relic'].every(function (g) { return gCnt[g] >= 5 && gCnt[g] <= 10; }), '各 genre 至少 5 種、不超過 45%：' + JSON.stringify(gCnt));
eq(SP.slice(16).map(function (s) { return s.name + '/' + s.genre + '/' + s.era; }), ['螺殼蟹/cute/西拉雅與大員前史', '雲豹幼靈/fantasy/西拉雅與大員前史', '風帆海馬/fantasy/荷治', '鐵蟹機甲/scifi/明鄭', '風箏小龍/fantasy/清領', '糖鐵小汽笛/cute/日治', '唱盤鸚鵡/scifi/戰後', '點雲幽浮/scifi/當代文資'], '新增 8 隻的名稱、類型、時期照 BUILD_SPEC 第 13 節');
eq(SP.filter(function (s) { return s.attr === '全'; }).map(function (s) { return s.no; }), [16], '只有第 16 隻是全屬性');

if (ROOMMD && SKILLMD) {
  G('小精靈：技能表與名冊逐項對照設計稿（' + Object.keys(SKILLMD).length + ' 列技能表、' + Object.keys(ROOMMD).length + ' 列名冊）');
  eq(Object.keys(ROOMMD).length, 24, '名冊表應抽到 24 列'); eq(Object.keys(SKILLMD).length, 24, '技能表應抽到 24 列');
  SP.forEach(function (s) {
    var r = ROOMMD[s.no], k = SKILLMD[s.no], L = '#' + s.no + ' ' + s.name;
    var m = r[2].match(/^(.+)（(.+)）$/);
    eq([s.name, s.nick], [m[1], m[2]], L + ' 名稱與暱稱');
    eq(s.era, r[3], L + ' 時期'); eq(s.attr, r[5] === '全屬性' ? '全' : r[5], L + ' 屬性');
    eq(s.rarity, r[7].match(/^(普通|稀有|傳說)/)[1], L + ' 稀有度'); eq(!!s.starter, r[7].indexOf('起始可選') >= 0, L + ' 起始可選');
    eq(k[2], s.name, L + ' 技能表小精靈名稱');
    eq(s.assist.name + '：' + s.assist.desc + cdText(s.assist), k[3], L + ' 助理技（含冷卻或次數）');
    eq(s.talent.desc, k[4], L + ' 天賦');
    var sc = k[5].split('，'), kinds = [];
    if (sc[0] === '全部種類') kinds = KINDS.slice(); else Object.keys(KMAP).forEach(function (w) { if (sc[0].indexOf(w) >= 0) kinds.push(KMAP[w]); });
    eq(s.scout.kind.slice().sort(), kinds.slice().sort(), L + ' 勘察專長類別'); eq(s.scout.era, sc[1], L + ' 勘察專長時期');
    ok((sc[0].indexOf('點數情報') >= 0) === (s.scout.extra === '點數情報'), L + ' 點數情報標記');
    ok((sc[0].indexOf('（安全）') >= 0) === (s.scout.note === '安全'), L + ' 安全標記');
    eq(s.awaken.name + '：' + s.awaken.desc, k[6], L + ' 覺醒技');
  });
} else { skip++; console.log('\n○ 找不到設計稿，略過表格對照：' + docDir); }

G('小精靈：台詞（每類 3～4 句、≤24 字）');
SP.forEach(function (s) {
  ['idle', 'pet', 'feed', 'awake'].forEach(function (k) {
    var a = s.lines && s.lines[k];
    ok(Array.isArray(a) && a.length >= 3 && a.length <= 4, s.name + ' ' + k + ' 應 3～4 句');
    (a || []).forEach(function (t) { ok(isStr(t) && t.length <= 24, s.name + ' ' + k + ' 台詞超過 24 字或為空：' + t); ok(!SENSITIVE.test(t), s.name + ' 台詞含敏感詞'); });
  });
  var all = [].concat(s.lines.idle, s.lines.pet, s.lines.feed, s.lines.awake); ok(new Set(all).size === all.length, s.name + ' 台詞有重複');
});
var nickSet = {}; SP.forEach(function (s) { nickSet[s.lines.idle.join()] = 1; }); ok(Object.keys(nickSet).length === 24, '每隻待機台詞各不相同');
var allLines = {}, dupLines = 0; SP.forEach(function (s) { ['idle', 'pet', 'feed', 'awake'].forEach(function (k) { s.lines[k].forEach(function (t) { if (allLines[t]) dupLines++; allLines[t] = 1; }); }); });
eq(dupLines, 0, '24 隻之間台詞沒有重複');

G('章節蛋（eggChapter）涵蓋新物種');
var chapIds = {}; (function () {
  ['js/walk_data_intel_a.js', 'js/walk_data_intel_b.js', 'js/walk_data_intel.js'].forEach(function (f) { (0, eval)(read(f)); });
  (global.window.WALK_INTEL || []).forEach(function (c) { chapIds[c.chapter] = 1; }); })();
var egged = SP.filter(function (s) { return s.eggChapter !== undefined; });
eq(egged.length, 23, '除了第 16 隻，23 隻都有章節蛋');
ok(new Set(egged.map(function (s) { return s.eggChapter; })).size === 23, '每章只掉一種蛋，章節不重複');
egged.forEach(function (s) { ok(chapIds[s.eggChapter], s.name + ' 的 eggChapter 要是情報卡裡真實存在的章節：' + s.eggChapter); });
ok(SP.slice(16).every(function (s) { return s.eggChapter !== undefined; }), '新增 8 隻都分配到章節');
ok(SP.filter(function (s) { return s.hidden; }).every(function (s) { return s.eggChapter === undefined && s.needDexPct === 100; }), '第 16 隻不掉章節蛋');

G('點心、玩具、特別搭檔、共用設定');
var snacks = FOODS.filter(function (f) { return f.kind === 'snack'; }), plain = FOODS.filter(function (f) { return f.kind === 'plain'; });
eq(snacks.map(function (f) { return f.cat; }).sort(), KINDS.slice().sort(), '六類點心各一款');
eq(plain.length, 1, '普通食物一款'); var fid = {};
FOODS.forEach(function (f) {
  ok(!fid[f.id], f.id + ' 重複'); fid[f.id] = 1;
  ok(f.price >= 5 && f.price <= 20, f.name + ' 價格應 5～20：' + f.price); ok(f.vigor > 0 && f.bond >= 0 && f.favBond >= 0, f.name + ' 活力與羈絆'); spriteOk(f.sprite, f.name + ' 圖', 20);
  ok(isStr(f.desc) && f.desc.length <= 30, f.name + ' 說明');
});
ok(plain[0].price === 5, '普通食物 5 點'); ok(snacks.every(function (f) { return f.vigor === 15; }), '點心活力 +15（設計稿：餵食 +15）');
SP.forEach(function (s) { ok(s.favFood === '全' || snacks.some(function (f) { return f.cat === s.favFood; }), s.name + ' 最愛的點心類別要有商品'); });
var tid = {};
TOYS.forEach(function (t) { ok(!tid[t.id], t.id + ' 重複'); tid[t.id] = 1; ok(t.price >= 30 && t.price <= 80, t.name + ' 價格應 30～80'); ok(t.playBonus > 0, t.name + ' 玩耍加成'); spriteOk(t.sprite, t.name + ' 圖', 20); });
ok(TOYS.length >= 3, '玩具至少 3 種（追光點、接球、拋小卡）');
eq(PAIRS.map(function (p) { return p.role; }), AGENTS.order, '特別搭檔涵蓋 16 職務且順序同名冊');
PAIRS.forEach(function (p) { ok(ids[p.spirit], p.role + ' 搭檔小精靈 id 存在'); ok(isStr(p.name) && isStr(p.desc) && p.effect && isStr(p.effect.key) && typeof p.effect.value === 'number', p.role + ' 搭檔欄位'); });
eq([META.count, META.forms], [24, 72], 'META 小精靈 24、形態 72'); eq(META.maxOwned, 3, '最多養 3 隻'); eq(META.slots, { follow: 1, scout: 2 }, '隨行位 1、勘察位 2'); eq(META.vigor.min, 20, '活力下限 20'); eq(META.vigor.dailyDrop, 10, '每日自然下降 10');
eq(META.daily, { feed: 3, play: 3, pet: 5, tidy: 1, chat: 20 }, '每日互動上限');
eq(META.scoutKinds, KINDS, '情報六類'); SP.forEach(function (s) { ok(META.eras.some(function (e) { return e.id === s.eraId; }), s.name + ' 時期 id 在 META.eras'); });
eq(Object.keys(META.rarity), RAR, '稀有度形狀表');
var triples = 0;
for (var a = 0; a < 24; a++) for (var b = a + 1; b < 24; b++) for (var c = b + 1; c < 24; c++) {
  var t3 = [SP[a], SP[b], SP[c]];
  if (['eraId', 'attr'].every(function (f) { return new Set(t3.map(function (x) { return x[f]; })).size === 3; }) && new Set(t3.map(function (x) { return x.scout.kind[0]; })).size === 3) triples++;
}
ok(triples > 0, '至少存在一組「時期、屬性、專長各異」的三足鼎立組合（共 ' + triples + ' 組）');

/* ================= 商店 ================= */
G('商店：家具與分區');
var FU = SHOP.furniture, spots = { wall: 0, floor: 0, window: 0, pet: 0 }, fids = {};
ok(FU.length >= 36, '家具至少 36 件，實際 ' + FU.length);
FU.forEach(function (f) {
  var L = f.name;
  ['id', 'name', 'zone', 'spot', 'rarity', 'desc'].forEach(function (k) { ok(isStr(f[k]), L + ' 缺欄位 ' + k); }); ok(typeof f.set === 'string', L + ' set 欄位');
  ok(!fids[f.id], L + ' id 重複'); fids[f.id] = 1; ok(spots[f.spot] !== undefined, L + ' spot 不合法'); spots[f.spot]++;
  ok(f.zone.indexOf(f.spot === 'pet' ? '玩具與用品' : '家具鋪') === 0, L + ' 分區：' + f.zone); ok(f.cat === (f.spot === 'pet' ? '小精靈用品' : '家具'), L + ' 商品大類'); ok(RAR.indexOf(f.rarity) >= 0, L + ' 稀有度');
  spriteOk(f.sprite, L + ' 圖', 30);
  if (f.rarity === '普通') {
    ok(!f.noBuy, L + ' 普通品應可購買'); var lo = 30, hi = f.spot === 'pet' ? 80 : 150;
    ok(f.price >= lo && f.price <= hi, L + ' 價格應 ' + lo + '～' + hi + '：' + f.price);
  } else { ok(f.noBuy === true && isStr(f.cond) && f.unlock && isStr(f.unlock.type), L + ' 稀有或傳說要 noBuy 並寫條件'); }
});
eq(spots, { wall: 12, floor: 14, window: 4, pet: 6 }, '家具分類數量（牆飾 12、地面 14、窗景 4、小精靈用品 6）');
ok(FU.filter(function (f) { return f.rarity !== '普通'; }).length >= 3, '要有稀有或傳說家具');
eq(SHOP.zoneOrder.map(function (z) { return SHOP.zones[z].name; }), ['家具鋪', '食材舖', '玩具與用品', '造型屋', '蛋鋪', '收藏換物所', '老闆任務板'], '商店七個分區');
eq([SHOP.limits.furniturePerDay, SHOP.limits.foodPerDay, SHOP.limits.firstBuyHalf, SHOP.limits.supplyOfficerDiscountApplies], [3, 10, true, false], '每日購買上限與新手半價');

G('商店：套裝');
eq(SHOP.sets.map(function (s) { return s.name; }), ['台江海', '府城老街', '日治紅磚', '戰後廣播', '文資修復室'], '五個主題套裝');
SHOP.sets.forEach(function (s) {
  ok(s.items.length >= 4 && s.items.length <= 5, s.name + ' 件數應 4～5：' + s.items.length);
  ok(s.items.every(function (i) { var f = FU.filter(function (x) { return x.id === i; })[0]; return f && f.set === s.id; }), s.name + ' 成員與家具 set 欄位一致');
  eq(FU.filter(function (x) { return x.set === s.id; }).length, s.items.length, s.name + ' 沒有漏列成員');
  var sum = s.items.reduce(function (a, i) { var f = FU.filter(function (x) { return x.id === i; })[0]; return a + f.price; }, 0);
  ok(s.bundlePrice >= 300 && s.bundlePrice <= 600 && s.price === s.bundlePrice, s.name + ' 套裝價應 300～600：' + s.bundlePrice); ok(s.bundlePrice <= sum, s.name + ' 套裝價不應高於單買總和（' + sum + '）');
  ok(s.bonus && isStr(s.bonus.fx) && /純裝飾/.test(s.bonus.desc) && !/加分|點數|倍/.test(s.bonus.desc.replace('不加分', '')), s.name + ' 集滿加成應是純裝飾');
});
eq(FU.filter(function (x) { return x.set; }).length, SHOP.sets.reduce(function (a, s) { return a + s.items.length; }, 0), '所有有套裝的家具都被套裝列入');

G('商店：任務板、換物所、蛋鋪、造型屋');
eq(SHOP.board.pool.length, 8, '任務池 8 則'); eq(SHOP.board.perDay, 3, '每日 3 則');
var bid = {}; SHOP.board.pool.forEach(function (q) { ok(!bid[q.id], q.id + ' 重複'); bid[q.id] = 1; ok(isStr(q.text) && q.text.length <= 24 && isStr(q.event) && q.n > 0 && q.reward.points > 0, q.id + ' 欄位'); ok(!q.reward.food || fid[q.reward.food], q.id + ' 獎勵食材存在'); });
ok(['arrive', 'feed', 'visit'].every(function (e) { return SHOP.board.pool.some(function (q) { return q.event === e; }); }), '任務池要含走過某站、餵牠、拜訪一間房');
SHOP.exchange.furniture.forEach(function (i) { var f = FU.filter(function (x) { return x.id === i; })[0]; ok(f && f.noBuy && f.unlock.type === 'shards', i + ' 換物所家具要是 noBuy 且以碎屑換取'); });
eq(SHOP.exchange.rate, { snack: 3, furniture: 10 }, '碎屑兌換率');
ok(SHOP.exchange.frames.length >= 3 && SHOP.exchange.frames.every(function (f) { return f.shards > 0 && isHex(f.color); }), '稱號邊框');
var common12 = SP.filter(function (s) { return s.rarity === '普通'; }).map(function (s) { return s.id; });
var speed = SHOP.eggs.filter(function (e) { return e.id === 'egg_speedup'; })[0], egg1 = SHOP.eggs.filter(function (e) { return e.id === 'egg_common'; })[0];
eq([speed.price, egg1.price, egg1.rarity], [20, 100, '普通'], '蛋鋪：加速 20、普通蛋 100、不賣稀有與傳說'); eq(egg1.pool, common12, '蛋鋪普通蛋只從 12 種普通小精靈裡出（含新物種）');
var wk = read('js/walk.js'), skinIds = []; wk.replace(/\{ k: '(sk_[a-z]+)', e: '[^']+', n: '([^']+)' \}/g, function (m, k) { skinIds.push(k); return m; });
var skinsShop = SHOP.looks.filter(function (l) { return l.skin; }), themesShop = SHOP.looks.filter(function (l) { return l.theme; });
eq(skinsShop.map(function (s) { return s.skin; }), skinIds, '造型屋 8 款與 walk.js 的 SKINS 一致'); ok(themesShop.length >= 3 && SHOP.looks.every(function (s) { return s.price >= 50; }), '造型 50 點起、登入畫面主題至少 3 款');

G('商店：頂層商品陣列（WalkStore 會逐一讀取）');
var allShopIds = {}, shopN = 0;
['furniture', 'sets', 'foods', 'toys', 'looks', 'eggs'].forEach(function (k) {
  ok(Array.isArray(SHOP[k]) && SHOP[k].length > 0, 'WALK_SHOP.' + k + ' 應為陣列');
  SHOP[k].forEach(function (it) { shopN++; ok(isStr(it.id) && isStr(it.name) && isStr(it.zone) && isStr(it.cat), k + ' 項目欄位：' + it.id); ok(!allShopIds[it.id], '商品 id 重複：' + it.id); allShopIds[it.id] = 1; if (!it.noBuy) ok(it.price > 0, it.id + ' 價格'); });
});
ok(!Array.isArray(SHOP.zones) && !Array.isArray(SHOP.layout), 'zones 與 layout 不是陣列（避免被當成商品）');
FOODS.forEach(function (f) { var x = SHOP.foods.filter(function (y) { return y.id === f.id; })[0]; ok(x && x.price === f.price && /食/.test(x.cat), f.id + ' 商店價格同 WALK_FOODS'); });
eq(SHOP.foods.length, FOODS.length, '商店食材與 WALK_FOODS 筆數一致');
TOYS.forEach(function (f) { var x = SHOP.toys.filter(function (y) { return y.id === f.id; })[0]; ok(x && x.price === f.price, f.id + ' 商店價格同 WALK_TOYS'); });
eq(SHOP.toys.length, TOYS.length, '商店玩具與 WALK_TOYS 筆數一致');
ok(SHOP.nestUpgrade && fids2(SHOP.nestUpgrade.from) && fids2(SHOP.nestUpgrade.to), '窩的升級指向兩件小精靈用品');
function fids2(i) { var f = FU.filter(function (x) { return x.id === i; })[0]; return f && f.spot === 'pet'; }
console.log('  · 可購買商品共 ' + shopN + ' 項');

G('房間格局');
var R = SHOP.layout;
eq([R.cols, R.rows, R.tile, R.scale, R.wallRows], [12, 8, 16, 3, 3], '12×8 格、每格 16 像素、放大 3 倍、牆面 3 列');
ok(R.walk.length === 8 && R.walk.every(function (r) { return r.length === 12 && /^[#.]+$/.test(r); }), '可走格地圖 12×8');
var SPOT_IDS = ['wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6', 'floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'window1', 'window2', 'window3'];
eq(Object.keys(R.spots), SPOT_IDS, '擺放點 15 個（id 與房間程式一致）'); var kc = { wall: 0, floor: 0, window: 0 }, seen = {};
function inArea(a, x, y) { return x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h; }
SPOT_IDS.forEach(function (id) {
  var p = R.spots[id], kind = id.replace(/\d+$/, '');
  kc[kind]++; ok(p.x >= 0 && p.x < 12 && p.y >= 0 && p.y < 8, id + ' 在格內'); ok(!seen[p.x + ',' + p.y], id + ' 座標重複'); seen[p.x + ',' + p.y] = 1;
  var walk = R.walk[p.y][p.x] === '.'; ok(kind === 'floor' ? walk : !walk, id + ' ' + kind + ' 位置與可走格相符');
  ok(kind === 'wall' ? p.y < 3 && p.y >= 1 : (kind === 'window' ? p.y < 3 : p.y >= 3), id + ' 所在列合理');
  Object.keys(R.areas).forEach(function (an) { ok(!inArea(R.areas[an], p.x, p.y), id + ' 不應壓在區域 ' + an + ' 上'); });
});
eq(kc, { wall: 6, floor: 6, window: 3 }, '牆 6、地 6、窗 3');
eq(Object.keys(R.areas).sort(), ['achieve', 'closet', 'map', 'nest', 'photos', 'shelf'], '固定區域：成就牆、照片牆、書櫃、衣櫃、地圖桌、窩');
Object.keys(R.areas).forEach(function (an) { var a = R.areas[an]; ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= 12 && a.y + a.h <= 8, an + ' 在格內'); });
ok(R.blocking.every(function (k) { return !!R.areas[k]; }), 'blocking 都是已定義的區域');
(function () {
  var blocked = {}; SPOT_IDS.forEach(function (id) { if (id.indexOf('floor') === 0) blocked[R.spots[id].x + ',' + R.spots[id].y] = 1; });
  var free = [], q, vis = {}, n = 0;
  for (var y = 0; y < 8; y++) for (var x = 0; x < 12; x++) if (R.walk[y][x] === '.' && !blocked[x + ',' + y]) free.push([x, y]);
  q = [free[0]]; vis[free[0].join()] = 1;
  while (q.length) { var c = q.shift(); n++; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nx = c[0] + d[0], ny = c[1] + d[1], k = nx + ',' + ny; if (nx >= 0 && ny >= 0 && nx < 12 && ny < 8 && R.walk[ny][nx] === '.' && !blocked[k] && !vis[k]) { vis[k] = 1; q.push([nx, ny]); } }); }
  eq(n, free.length, '六件地面家具都擺滿時，可走格仍全部連通（' + free.length + ' 格）');
})();
eq(R.accepts.floor, ['floor', 'pet'], '地面擺放點可放小精靈用品');

/* ================= 圖鑑 ================= */
G('圖鑑：六類與路線對應');
eq(DEX.categories.map(function (c) { return c.id; }), ['people', 'places', 'clue', 'looks', 'roles', 'titles'], '六類收集');
function cat(id) { return DEX.categories.filter(function (c) { return c.id === id; })[0]; }
eq([cat('people').items.length, cat('places').items.length, cat('looks').items.length, cat('roles').items.length], [20, 17, 8, 16], '人物 20、地點 17、造型 8、職務 16');
ok(cat('clue').total === null && cat('clue').source === 'WALK_INTEL', '線索卡（id＝clue）總數取自 WALK_INTEL');
eq(cat('titles').total, cat('titles').items.length, '稱號 total 與清單一致');
function routeStops(r) { return r === 'main' ? ROUTE.stops : ROUTE[r] && ROUTE[r].stops; }
function clean(n) { return n.replace(/^第 \d+ [章案]｜/, '').replace(/^出發：/, ''); }
var allId = {}, npcName = {}, stopSeen = {};
DEX.categories.forEach(function (c) { (c.items || []).forEach(function (i) { ok(!allId[i.id], '圖鑑 id 重複：' + i.id); allId[i.id] = 1; ok(!i.rarity || RAR.indexOf(i.rarity) >= 0, i.id + ' 稀有度'); }); });
cat('people').items.forEach(function (p) {
  var st = (routeStops(p.route) || []).filter(function (s) { return s.id === p.stop; })[0];
  ok(st && st.npc, p.id + ' 對不到路線 NPC（' + p.route + '/' + p.stop + '）');
  if (st && st.npc) { eq(p.name, st.npc.name, p.id + ' 名稱同路線資料'); eq(p.ava, st.npc.ava, p.id + ' 頭像同路線資料'); }
  ok(!npcName[p.name], p.name + ' 人物重複'); npcName[p.name] = 1;
});
cat('places').items.forEach(function (p) {
  var st = (routeStops(p.route) || []).filter(function (s) { return s.id === p.stop; })[0];
  ok(!!st, p.id + ' 對不到路線站點（' + p.route + '/' + p.stop + '）'); if (st) eq(p.name, clean(st.name), p.id + ' 名稱同路線資料');
  ok(!stopSeen[p.route + p.stop], p.id + ' 重複'); stopSeen[p.route + p.stop] = 1;
});
eq(cat('roles').items.map(function (r) { return r.role; }), AGENTS.order, '職務 16 與名冊一致'); eq(cat('looks').items.map(function (l) { return l.skin; }), skinIds, '造型 8 與 walk.js 一致');
['普通', '稀有', '傳說'].forEach(function (r) { var x = DEX.rarity[r]; ok(x && x.shape && x.glyph && x.label === r, '稀有度 ' + r + ' 要有形狀與文字'); });
eq([DEX.rarity['普通'].shape, DEX.rarity['稀有'].shape, DEX.rarity['傳說'].shape], ['circle', 'diamond', 'star'], '圓＝普通、菱形＝稀有、星＝傳說');
ok(['people', 'places', 'looks', 'roles', 'titles'].every(function (id) { return cat(id).items.some(function (i) { return i.rarity === '稀有'; }); }), '各類都有稀有項目');

G('圖鑑：里程碑與稱號');
eq(DEX.milestones.map(function (m) { return m.pct; }), [25, 50, 75, 100], '里程碑 25／50／75／100%');
var titleIds = {}; cat('titles').items.forEach(function (t) { titleIds[t.id] = 1; ok(isStr(t.name) && isStr(t.desc) && t.cond && isStr(t.cond.key) && t.cond.value > 0, t.id + ' 欄位'); ok(!/學年|統計|產學案|洞見/.test(t.name + t.desc), t.id + ' 學生視角'); });
ok(new Set(cat('titles').items.map(function (t) { return t.name; })).size === cat('titles').items.length, '稱號名稱不重複');
var lastPts = 0;
DEX.milestones.forEach(function (m) {
  ok(m.once === true, m.pct + '% 只能領一次'); ok(m.reward.points > lastPts, m.pct + '% 點數應遞增'); lastPts = m.reward.points; ok(titleIds[m.reward.title], m.pct + '% 稱號存在');
  if (m.reward.look) ok(skinIds.indexOf(m.reward.look) >= 0, m.pct + '% 造型存在');
  Object.keys(m.reward.items || {}).forEach(function (id) { var f = FU.filter(function (x) { return x.id === id; })[0]; ok(f && f.noBuy && f.unlock.type === 'dexPct' && f.unlock.n === m.pct && m.reward.items[id] === 1, m.pct + '% 家具 ' + id + ' 要對應商店的取得條件'); });
  if (m.reward.egg) { var e = SP.filter(function (x) { return x.id === m.reward.egg; })[0]; ok(e && (m.pct === 100 ? e.hidden === 'dex100' : e.rarity === '稀有' && !e.starter), m.pct + '% 的蛋：稀有蛋（100% 為第 16 隻），且不是起始三選一'); }
});
FU.filter(function (f) { return f.unlock && f.unlock.type === 'dexPct'; }).forEach(function (f) { ok(DEX.milestones.some(function (m) { return m.pct === f.unlock.n && m.reward.items && m.reward.items[f.id] === 1; }), f.name + ' 的圖鑑取得條件要在里程碑裡領得到'); });
eq(DEX.spiritBook.unlock, { sp_marrow: 100 }, '第 16 隻在圖鑑 100% 解鎖');
var tri = cat('titles').items.filter(function (t) { return t.id === DEX.tripod.titleId; })[0];
ok(tri && tri.name === '三足鼎立' && tri.cond.key === 'tripod', '含三足鼎立稱號'); eq(DEX.tripod.distinct, ['eraId', 'attr', 'scoutKind0'], '三足鼎立：時期、屬性、專長各異'); eq(DEX.tripod.size, 3, '三隻');
eq([DEX.spiritBook.total, DEX.spiritBook.forms], [24, 72], '小精靈冊 24 隻、形態 72 項（24×3）');

/* ================= 通用 ================= */
G('檔案：ES5 與禁用項');
['js/walk_data_spirit.js', 'js/walk_data_shop.js', 'js/walk_data_dex.js'].forEach(function (f) {
  var src = read(f), body = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, ''), noStr = body.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  ok(!/(^|[^.\w$])(alert|confirm|prompt)\s*\(/.test(noStr), f + ' 不得有 alert／confirm／prompt');
  ok(!/=>|`|\blet\b|\bconst\b|\bclass\b/.test(noStr), f + ' 須為 ES5 語法'); ok(/\(function \(\) \{/.test(src) && /window\.WALK_/.test(src), f + ' 為 IIFE 並掛 window');
  ok(!/\r/.test(src), f + ' 使用 LF 換行'); ok(Buffer.byteLength(src) < 400000, f + ' 大小 ' + Buffer.byteLength(src) + ' 位元組');
  console.log('  · ' + f + '：' + src.split('\n').length + ' 行、' + Buffer.byteLength(src) + ' 位元組');
});

console.log('\n==== 通過 ' + pass + '、失敗 ' + fail + (skip ? '、略過 ' + skip : '') + ' ====');
process.exit(fail ? 1 : 0);
