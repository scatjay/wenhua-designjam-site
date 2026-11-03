/* 產生 js/walk_data_spirit.js、js/walk_data_shop.js、js/walk_data_dex.js。
   用法：node test_tools/gen_walk_data.js [spirit|shop|dex|all]
   資料檔本身是純資料（ES5、掛 window）；這支只是把像素圖與表格組好、排版後寫出。 */
'use strict';
var fs = require('fs'), path = require('path');
var L = require('./gen_walk_lib.js'), ser = L.ser, Raw = L.Raw;
var root = path.resolve(__dirname, '..');
function write(rel, text) { fs.writeFileSync(path.join(root, rel), text.replace(/\r?\n/g, '\n'), { encoding: 'utf8' }); console.log('寫出 ' + rel + '（' + text.split('\n').length + ' 行）'); }

function genSpirit() {
  var S = require('./gen_walk_spirit.js'), I = require('./gen_walk_items.js');
  var EGG_CHAPTER = { brick: 't1,s1', watch: 't2', telegraph: 't3,s2', lion: 't4,s3', neon: 't5,s4', sail: 't6,s5', deer: 't7,s6', radio: 't8', bee: 't9', parrot: 'tx',
    ufo: 'c0,y0', bookworm: 'c1,y1', ink: 'c2,y2', abacus: 'c3,ws', rubbing: 'x3', sugartrain: 'x4', snailcrab: 'x5', leopard: 'x6', ironcrab: 'w1', seahorse: 'w2', kitedragon: 'wc', gull: 'wt', tide: 'c4' };
  var eggs = {}; S.SP.forEach(function (d) { eggs[d.id] = S.egg(d.key); });
  var spirits = S.SP.map(function (d) {
    var st = S.stagesOf(d.key);
    var awakenCond = { bond: 30, dexPct: d.rarity === '傳說' ? 100 : S.AWAKE_COND[d.rarity] };
    if (d.hidden) awakenCond.dexPct = 100;
    var o = { id: d.id, no: d.no, name: d.name, nick: d.nick, era: d.era, eraId: d.eraId, genre: d.genre, anchor: d.anchor, attr: d.attr, rarity: d.rarity };
    if (EGG_CHAPTER[d.key]) o.eggChapter = EGG_CHAPTER[d.key];
    if (d.starter) o.starter = true;
    if (d.hidden) o.hidden = d.hidden;
    var as = { name: d.assist.name, desc: d.assist.desc, cd: d.assist.cd };
    if (d.assist.perChapter) as.perChapter = d.assist.perChapter;
    if (d.assist.perQuestion) as.perQuestion = d.assist.perQuestion;
    as.key = d.assist.effect.key; as.value = d.assist.effect.value;
    o.assist = as; o.talent = d.talent; o.scout = d.scout;
    var aw = { name: d.awaken.name, desc: d.awaken.desc };
    Object.keys(d.awaken.effect).forEach(function (k) { aw[k] = d.awaken.effect[k]; });
    aw.cond = { key: 'bondAndDex', bond: awakenCond.bond, dexPct: awakenCond.dexPct, desc: '羈絆 ' + awakenCond.bond + ' 且圖鑑完成 ' + awakenCond.dexPct + '%' };
    o.awaken = aw;
    o.hatchHours = { '普通': 0.5, '稀有': 1, '傳說': 2 }[d.rarity];
    if (d.hidden) o.needDexPct = 100;
    o.stages = {
      egg: { sprite: new Raw('EGGS.' + d.id), line: S.EGG_LINE[d.rarity] },
      baby: { sprite: st.baby, line: '我是' + d.nick + '，請多指教。' },
      adult: { sprite: st.adult, line: d.lines.idle[0] },
      awake: { sprite: st.awake, line: d.lines.awake[0] }
    };
    o.favFood = d.hidden ? '全' : d.scout.kind[0];
    o.lines = d.lines;
    return o;
  });
  var foods = I.FOODS_DEF.map(function (f) {
    return { id: f.id, name: f.name, cat: f.cat, kind: 'snack', price: f.price, vigor: 15, bond: 1, favBond: 1, desc: f.desc, sprite: I.foodSpriteFixed(f) };
  });
  foods.push({ id: 'food_plain', name: '清水糰子', cat: '', kind: 'plain', price: 5, vigor: 10, bond: 0, favBond: 0, desc: '最普通的白糰子，補給站隨時有。', sprite: I.plainSprite() });
  var ts = I.toySprites();
  var toys = I.TOYS_DEF.map(function (t) { return { id: t.id, name: t.name, price: t.price, play: t.play, playBonus: t.playBonus, desc: t.desc, sprite: ts[t.key] }; });
  var s = '/* 走讀：小精靈資料（24 隻）、點心、玩具、特別搭檔、共用設定。\n' +
    '   純資料（ES5、掛 window），由 test_tools/gen_walk_data.js 排版產生；數值來源見 BUILD_SPEC_ROOM_SPIRIT_1103.md 第 3 節。\n' +
    '   精靈圖＝16×16 字串矩陣 rows（\'.\' 透明）＋調色盤 pal（字元→色碼）；歷史錨點全部待文史把關。 */\n' +
    '(function () {\n  \'use strict\';\n' +
    '  /* 蛋圖：每隻小精靈各有自己的蛋（輪廓、花紋、配色獨有），以小精靈 id 為鍵 */\n  var EGGS = ' + ser(eggs, '  ') + ';\n' +
    '  /* 24 隻小精靈；效果一律 {key,value}，由 WalkStore.talents() 彙整給 walk.js 讀 */\n  var SPIRITS = ' + ser(spirits, '  ') + ';\n' +
    '  /* 點心：snack 依 cat 對應勘察專長；吃到 favFood（＝專長類別）羈絆再加 favBond。plain 不分類 */\n  var FOODS = ' + ser(foods, '  ') + ';\n' +
    '  /* 玩具：玩耍時活力額外加 playBonus */\n  var TOYS = ' + ser(toys, '  ') + ';\n' +
    '  /* 職務×小精靈特別搭檔（SPIRIT_SKILLS 第 2 節） */\n  var PAIRS = ' + ser(I.PAIRS, '  ') + ';\n' +
    '  /* 共用設定：屬性、稀有度形狀、時期、階段門檻、活力公式、每日上限 */\n  var META = ' + ser(I.META, '  ') + ';\n' +
    '  window.WALK_SPIRIT_EGGS = EGGS;\n  window.WALK_SPIRITS = SPIRITS;\n  window.WALK_FOODS = FOODS;\n  window.WALK_TOYS = TOYS;\n  window.WALK_SPIRIT_PAIRS = PAIRS;\n  window.WALK_SPIRIT_META = META;\n})();\n';
  write('js/walk_data_spirit.js', s);
}

var which = process.argv[2] || 'all';
if (which === 'spirit' || which === 'all') genSpirit();
if (which === 'shop' || which === 'all') { try { require('./gen_walk_shop.js').gen(write, ser, Raw); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; console.log('尚無 gen_walk_shop.js'); } }
if (which === 'dex' || which === 'all') { try { require('./gen_walk_dex.js').gen(write, ser, Raw); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; console.log('尚無 gen_walk_dex.js'); } }
