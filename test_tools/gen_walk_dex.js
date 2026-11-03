/* 走讀圖鑑：六類收集定義、稀有度、里程碑、稱號。人物與地點從路線資料抽出（資料驅動，用路線 id 對應）。輸出 js/walk_data_dex.js。 */
'use strict';
var fs = require('fs'), path = require('path');
var root = path.resolve(__dirname, '..');

function loadRoute() {
  var saved = global.window; global.window = {};
  ['js/walk_route.js', 'js/walk_route_tw.js', 'js/walk_agents.js'].forEach(function (f) { (0, eval)(fs.readFileSync(path.join(root, f), 'utf8')); });
  var W = global.window; global.window = saved; return W;
}
function stopsOf(W, route) { return route === 'main' ? W.WALK_ROUTE.stops : W.WALK_ROUTE[route].stops; }
function find(W, route, id) { var s = stopsOf(W, route).filter(function (x) { return x.id === id; })[0]; if (!s) throw new Error('路線 ' + route + ' 找不到站 ' + id); return s; }
function clean(n) { return n.replace(/^第 \d+ [章案]｜/, '').replace(/^出發：/, ''); }

/* 人物 20：路線 NPC（同一人物在多條路線只算一次；便條與廣播聲音不算） */
var PEOPLE = [
  ['main', 's1'], ['main', 's2'], ['main', 's5'], ['main', 's6'],
  ['campus', 'c1'], ['campus', 'c2'], ['campus', 'c3'], ['campus', 'x3'], ['campus', 'x4'], ['campus', 'x5'], ['campus', 'x6'], ['campus', 'c4'],
  ['campusW', 'w1'], ['campusW', 'w2'],
  ['tw', 't2'], ['tw', 't4'], ['tw', 't5'], ['tw', 't8'], ['tw', 't9'], ['tw', 'tx']
];
var PEOPLE_RARE = { s5: 1, s6: 1, c2: 1, x5: 1, t8: 1, tx: 1 }, PEOPLE_LEGEND = { c4: 1 };
/* 地點 17：中西區九案 9 ＋ 校園 8 */
var PLACES = [['tw', 't1'], ['tw', 't2'], ['tw', 't3'], ['tw', 't4'], ['tw', 't5'], ['tw', 't6'], ['tw', 't7'], ['tw', 't8'], ['tw', 't9'],
  ['campus', 'c0'], ['campus', 'c1'], ['campus', 'c2'], ['campus', 'c3'], ['campus', 'x3'], ['campus', 'x4'], ['campus', 'x5'], ['campus', 'x6']];
var PLACE_RARE = { t8: 1, t9: 1, x5: 1, x6: 1 };

var LOOKS = [['sk_hat', '🕵️', '偵探帽'], ['sk_astro', '🧑‍🚀', '太空人'], ['sk_cat', '🐱', '貓咪'], ['sk_ghost', '👻', '小幽靈'], ['sk_robot', '🤖', '機器人'], ['sk_ninja', '🥷', '忍者'], ['sk_mage', '🧙', '魔法師'], ['sk_dragon', '🐲', '小龍']];
var LOOK_RARE = { sk_mage: 1, sk_dragon: 1 };
var ROLE_RARE = { '隊長': 1, '軍師': 1 };

var TITLES = [
  ['ti_first', '初出茅廬', '普通', '完成第一個章節。', { key: 'chaptersDone', value: 1 }],
  ['ti_walker', '府城行者', '普通', '走到 10 個不同的站點。', { key: 'stopsArrived', value: 10 }],
  ['ti_owner', '小精靈夥伴', '普通', '孵出你的第一隻小精靈。', { key: 'spiritsHatched', value: 1 }],
  ['ti_visitor', '房間街常客', '普通', '拜訪 10 間別人的房間。', { key: 'roomsVisited', value: 10 }],
  ['ti_night', '夜行者', '普通', '在夜間走到一個站點。', { key: 'nightArrive', value: 1 }],
  ['ti_collector', '小小收藏家', '普通', '擁有 5 件家具。', { key: 'furnitureOwned', value: 5 }],
  ['ti_dex25', '圖鑑學徒', '普通', '圖鑑完成度達 25%。', { key: 'dexPct', value: 25 }],
  ['ti_dex50', '圖鑑達人', '稀有', '圖鑑完成度達 50%。', { key: 'dexPct', value: 50 }],
  ['ti_dex75', '圖鑑名士', '稀有', '圖鑑完成度達 75%。', { key: 'dexPct', value: 75 }],
  ['ti_tripod', '三足鼎立', '稀有', '同時養 3 隻小精靈，牠們的時期、屬性、專長都不一樣。', { key: 'tripod', value: 1, fields: ['eraId', 'attr', 'scoutKind0'] }],
  ['ti_awake', '喚醒者', '稀有', '讓一隻小精靈覺醒。', { key: 'spiritsAwake', value: 1 }],
  ['ti_scout', '老練勘察家', '稀有', '完成 10 次勘察。', { key: 'expeditions', value: 10 }],
  ['ti_decor', '房間設計師', '稀有', '集滿一套主題套裝。', { key: 'setComplete', value: 1 }],
  ['ti_intel', '情報蒐集家', '稀有', '取得 50 張情報卡。', { key: 'intelCards', value: 50 }],
  ['ti_dex100', '時安局圖鑑館長', '傳說', '圖鑑完成度達 100%。', { key: 'dexPct', value: 100 }]
];

function gen(write, ser) {
  var W = loadRoute();
  var people = PEOPLE.map(function (p) {
    var s = find(W, p[0], p[1]);
    return { id: 'np_' + p[0] + '_' + p[1], route: p[0], stop: p[1], name: s.npc.name, ava: s.npc.ava, rarity: PEOPLE_LEGEND[p[1]] ? '傳說' : (PEOPLE_RARE[p[1]] ? '稀有' : '普通') };
  });
  var places = PLACES.map(function (p) {
    var s = find(W, p[0], p[1]);
    return { id: 'pl_' + p[0] + '_' + p[1], route: p[0], stop: p[1], name: clean(s.name), rarity: PLACE_RARE[p[1]] ? '稀有' : '普通' };
  });
  var roles = W.WALK_AGENTS.order.map(function (r, i) {
    var en = (W.WALK_AGENTS.all[r].img.match(/\d+_([a-z]+)_/) || [])[1];
    return { id: 'ro_' + en, role: r, rarity: ROLE_RARE[r] ? '稀有' : '普通' };
  });
  var looks = LOOKS.map(function (l) { return { id: 'lk_' + l[0], skin: l[0], emoji: l[1], name: l[2], rarity: LOOK_RARE[l[0]] ? '稀有' : '普通' }; });
  var titles = TITLES.map(function (t) { return { id: t[0], name: t[1], rarity: t[2], desc: t[3], cond: t[4] }; });
  var dex = {
    version: 1,
    note: '六類收集；人物與地點用路線 id 對應（route＝main｜campus｜campusW｜tw，stop＝該路線的站 id），名稱以路線資料為準。完成度＝六類已取得數合計 ÷ 總數合計，線索卡總數取 WALK_INTEL 筆數。',
    rarity: {
      '普通': { shape: 'circle', glyph: '●', label: '普通' },
      '稀有': { shape: 'diamond', glyph: '◆', label: '稀有' },
      '傳說': { shape: 'star', glyph: '★', label: '傳說' }
    },
    categories: [
      { id: 'people', name: '人物', icon: '🧑', total: people.length, items: people },
      { id: 'places', name: '地點', icon: '📍', total: places.length, items: places },
      { id: 'clue', name: '線索卡', icon: '🗂️', total: null, source: 'WALK_INTEL', approxTotal: 225, note: '總數＝情報卡筆數；每章 8～10 張，約 25 章' },
      { id: 'looks', name: '造型', icon: '🎭', total: looks.length, items: looks },
      { id: 'roles', name: '職務', icon: '🎖️', total: roles.length, items: roles },
      { id: 'titles', name: '稱號', icon: '🏅', total: titles.length, items: titles }
    ],
    spiritBook: { total: 24, forms: 72, note: '小精靈另有自己的圖鑑冊（24 隻，每隻 3 種形態共 72 項），不算在六類完成度內；第 16 隻只在圖鑑 100% 出現。', unlock: { 'sp_marrow': 100 } },
    milestones: [
      { pct: 25, once: true, reward: { points: 50, title: 'ti_dex25' } },
      { pct: 50, once: true, reward: { points: 100, title: 'ti_dex50', look: 'sk_cat', items: { scanner_stand: 1 }, egg: 'sp_lion' } },
      { pct: 75, once: true, reward: { points: 150, title: 'ti_dex75', look: 'sk_dragon', egg: 'sp_rubbing' } },
      { pct: 100, once: true, reward: { points: 300, title: 'ti_dex100', look: 'sk_mage', items: { whale_night: 1 }, egg: 'sp_marrow' } }
    ],
    tripod: { titleId: 'ti_tripod', size: 3, distinct: ['eraId', 'attr', 'scoutKind0'], note: '三隻的歷史時期、屬性、勘察專長（第一類）各不相同；只給稱號，不加分。' }
  };
  var s = '/* 走讀：圖鑑資料（六類收集、稀有度、里程碑、稱號）。\n' +
    '   純資料（ES5、掛 window.WALK_DEX），由 test_tools/gen_walk_data.js 排版產生；人物 20 與地點 17 用路線 id 對應 walk_route.js／walk_route_tw.js。\n' +
    '   稀有度一律形狀加文字（圓＝普通、菱形＝稀有、星＝傳說），不單靠顏色。 */\n' +
    '(function () {\n  \'use strict\';\n  window.WALK_DEX = ' + ser(dex, '  ') + ';\n})();\n';
  write('js/walk_data_dex.js', s);
}
module.exports = { gen: gen };
