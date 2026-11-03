/* 走讀：點心、玩具的圖與資料、特別搭檔、小精靈共用設定。由 gen_walk_data.js 呼叫。 */
'use strict';
var L = require('./gen_walk_lib.js'), Cv = L.Cv;
var S = require('./gen_walk_spirit.js');
var BASE = S.BASE;

function packWith(c, pal) { return S.pack(c, pal); }

/* ---------- 點心：六類各一款＋普通食物 ---------- */
var SYMBOL = {
  '史料': function (c) { c.line(6, 7, 10, 7, 'w'); c.line(6, 9, 10, 9, 'w'); c.line(6, 11, 9, 11, 'w'); },
  '路況': function (c) { c.line(5, 9, 10, 9, 'w'); c.line(8, 7, 10, 9, 'w'); c.line(8, 11, 10, 9, 'w'); },
  '人物': function (c) { c.px(6, 8, 'w'); c.px(10, 8, 'w'); c.line(6, 11, 7, 12, 'w'); c.line(7, 12, 9, 12, 'w'); c.line(9, 12, 10, 11, 'w'); },
  '觀察': function (c) { c.ell(7.5, 8.5, 2.2, 2.2, 'w'); c.ell(7.5, 8.5, 1, 1, 'a'); c.line(9, 10, 11, 12, 'w'); },
  '彩蛋': function (c) { c.px(8, 6, 'w'); c.line(8, 7, 8, 11, 'w'); c.line(6, 9, 10, 9, 'w'); c.px(6, 7, 'w'); c.px(10, 11, 'w'); },
  '方位': function (c) { c.line(8, 6, 8, 12, 'w'); c.line(5, 9, 11, 9, 'w'); c.px(8, 5, 'e'); }
};
var FOODS_DEF = [
  { id: 'food_hist', cat: '史料', name: '書卷酥', desc: '一口一頁的小點心，史料類最愛。', price: 12, col: ['#d9a878', '#a8743f', '#f2c14e'] },
  { id: 'food_road', cat: '路況', name: '路標糖', desc: '甜甜的小路標，路況類最愛。', price: 10, col: ['#7fc8a0', '#3f8d66', '#f2c14e'] },
  { id: 'food_person', cat: '人物', name: '說書糕', desc: '軟軟的米糕，人物類最愛。', price: 12, col: ['#f0a8b8', '#c4647c', '#f2c14e'] },
  { id: 'food_observe', cat: '觀察', name: '放大鏡餅', desc: '圓圓的薄餅，觀察類最愛。', price: 10, col: ['#9ac0f0', '#4b6fd6', '#f2c14e'] },
  { id: 'food_easter', cat: '彩蛋', name: '驚喜糰', desc: '咬開才知道內餡，彩蛋類最愛。', price: 15, col: ['#c8a0f0', '#7a5af8', '#f2c14e'] },
  { id: 'food_dir', cat: '方位', name: '羅盤脆片', desc: '四個方向各一口，方位類最愛。', price: 12, col: ['#f0b070', '#c4783a', '#f2c14e'] }
];
function foodSpriteFixed(def) {
  var c = new Cv(); c.ell(8, 9, 5.6, 4.6, 'b'); c.ell(8, 8.4, 5, 4, 'a'); c.px(5, 6, 'w'); c.px(6, 5, 'w');
  SYMBOL[def.cat](c); c.outline('o');
  return packWith(c, { a: def.col[0], b: def.col[1], e: def.col[2] });
}
function plainSprite() {
  var c = new Cv(); c.poly([[8, 3], [13, 12], [3, 12]], 'a'); c.ell(8, 11, 5.2, 2.6, 'a'); c.rect(6, 10, 4, 3, 'k'); c.px(8, 6, 'w'); c.px(7, 7, 'w'); c.outline('o');
  return packWith(c, { a: '#fdf6e3' });
}

/* ---------- 玩具 ---------- */
function toySprites() {
  var t = {};
  var c = new Cv(); c.ell(8, 8, 5, 5, 'b'); c.ell(8, 8, 3.6, 3.6, 'a'); c.ell(8, 8, 1.6, 1.6, 'w'); c.outline('o');
  [[1, 1], [14, 2], [2, 14], [14, 14]].forEach(function (p) { c.free(p[0], p[1], 'y'); });
  t.light = packWith(c, { a: '#fff27a', b: '#f2c14e' });
  c = new Cv(); c.ell(8, 8, 5.6, 5.6, 'a'); c.line(3, 8, 13, 8, 'w'); c.line(5, 4, 11, 4, 'w'); c.line(5, 12, 11, 12, 'w'); c.ell(6, 5.5, 1, 1, 'w'); c.outline('o');
  t.ball = packWith(c, { a: '#d95b43' });
  c = new Cv(); c.poly([[2, 6], [7, 2], [10, 11], [5, 13]], 'b'); c.poly([[6, 3], [12, 3], [13, 13], [7, 13]], 'a'); c.rect(8, 6, 3, 3, 'e'); c.outline('o');
  t.cards = packWith(c, { a: '#f4ecd8', b: '#7fb0e8', e: '#d95b43' });
  c = new Cv(); c.ell(8, 8, 5.4, 5.4, 'a'); c.line(4, 6, 12, 10, 'b'); c.line(4, 9, 11, 5, 'b'); c.line(5, 12, 12, 7, 'b'); c.line(10, 13, 14, 15, 'b'); c.outline('o');
  t.yarn = packWith(c, { a: '#e87fa8', b: '#b8476f' });
  return t;
}
var TOYS_DEF = [
  { id: 'toy_light', key: 'light', name: '光點球', desc: '追著光點跑的小球。', play: '追光點', price: 30, playBonus: 2 },
  { id: 'toy_ball', key: 'ball', name: '彈力球', desc: '丟出去會彈回來的球。', play: '接球', price: 45, playBonus: 3 },
  { id: 'toy_cards', key: 'cards', name: '小卡牌', desc: '拋一拋、接一接的小卡。', play: '拋小卡', price: 60, playBonus: 4 },
  { id: 'toy_yarn', key: 'yarn', name: '毛線球', desc: '滾來滾去的毛線團。', play: '撲抓', price: 80, playBonus: 5 }
];

/* ---------- 特別搭檔（SPIRIT_SKILLS 第 2 節）---------- */
var PAIRS = [
  { role: '隊長', spirit: 'sp_sail', name: '揚帆', desc: '號召集合時冷卻減半', effect: { key: 'rallyCooldownScale', value: 0.5 } },
  { role: '領航員', spirit: 'sp_tide', name: '潮聲探路', desc: '路線畫線更長', effect: { key: 'routeLineLonger', value: 1 } },
  { role: '軍師', spirit: 'sp_bookworm', name: '引經據典', desc: '免費提示附出處', effect: { key: 'freeHintWithSource', value: 1 } },
  { role: '偵查員', spirit: 'sp_deer', name: '循跡', desc: '隱藏關卡方位卡更精準', effect: { key: 'hiddenIntelPrecise', value: 1 } },
  { role: '檔案官', spirit: 'sp_abacus', name: '對帳', desc: '答對選擇題多加分一次', effect: { key: 'choiceBonusExtra', value: 1 } },
  { role: '訪談員', spirit: 'sp_radio', name: '調頻', desc: 'NPC 好感提示更清楚', effect: { key: 'npcFavorHintClear', value: 1 } },
  { role: '蒐證員', spirit: 'sp_rubbing', name: '定格', desc: '拍照任務品質提示', effect: { key: 'photoQualityHint', value: 1 } },
  { role: '記錄官', spirit: 'sp_ink', name: '文思', desc: '書寫起手式多一種', effect: { key: 'writeStarterExtra', value: 1 } },
  { role: '文化設計員', spirit: 'sp_brick', name: '構件', desc: '規則卡多抽一張', effect: { key: 'ruleCardExtraDraw', value: 1 } },
  { role: '通訊官', spirit: 'sp_telegraph', name: '同頻', desc: '廣播多一種範本', effect: { key: 'broadcastTemplateExtra', value: 1 } },
  { role: '安全官', spirit: 'sp_lion', name: '雙盾', desc: '警戒範圍加大', effect: { key: 'guardRangeUp', value: 1 } },
  { role: '補給官', spirit: 'sp_abacus', name: '精算', desc: '折扣疊加上限放寬', effect: { key: 'discountCapUp', value: 1 } },
  { role: '鑑識員', spirit: 'sp_brick', name: '放大', desc: '觀察提示多一個細節', effect: { key: 'observeExtraDetail', value: 1 } },
  { role: '技術專家', spirit: 'sp_neon', name: '微光', desc: '夜間定位更準', effect: { key: 'nightLocPrecise', value: 1 } },
  { role: '在地嚮導', spirit: 'sp_deer', name: '老路', desc: '路況卡更詳細', effect: { key: 'roadIntelDetail', value: 1 } },
  { role: '扮演專員', spirit: 'sp_radio', name: '入戲', desc: 'NPC 回話更長', effect: { key: 'npcReplyLonger', value: 1 } }
];

/* ---------- 共用設定 ---------- */
var META = {
  version: 1,
  note: '數字來自 SPIRIT_SKILLS_EXPEDITION_1029 與 ROOM_SPIRIT_DESIGN_1029；標「假設」者為建置時補的預設值，等楊老師或模擬後調整。',
  scoutKinds: ['史料', '路況', '人物', '觀察', '彩蛋', '方位'],
  attrs: [
    { id: '觀察', glyph: '◎' }, { id: '溝通', glyph: '✦' }, { id: '智識', glyph: '▣' },
    { id: '行動', glyph: '➤' }, { id: '守護', glyph: '⬢' }, { id: '全', glyph: '✪' }
  ],
  rarity: { '普通': { shape: 'circle', glyph: '●' }, '稀有': { shape: 'diamond', glyph: '◆' }, '傳說': { shape: 'star', glyph: '★' } },
  eras: [
    { id: 'pre', name: '西拉雅與大員前史' }, { id: 'dutch', name: '荷治' }, { id: 'zheng', name: '明鄭' }, { id: 'qing', name: '清領' },
    { id: 'japan', name: '日治' }, { id: 'postwar', name: '戰後' }, { id: 'heritage', name: '當代文資' }, { id: 'core', name: '時安局核心' }
  ],
  stages: [
    { id: 'egg', name: '蛋' }, { id: 'baby', name: '幼體', bond: 0 }, { id: 'adult', name: '成體', bond: 10 },
    { id: 'awake', name: '覺醒', bond: 30, note: '假設：羈絆 30，加上圖鑑完成度（見各隻 awaken.cond）' }
  ],
  slots: { follow: 1, scout: 2 },
  maxOwned: 3,
  vigor: { min: 20, max: 100, dailyDrop: 10, eMin: 0.5, eSlope: 0.7, lowWarn: 40 },
  daily: { feed: 3, play: 3, pet: 5, tidy: 1, chat: 20 },
  roomGain: { feed: 15, play: 10, pet: 3, tidy: 5 },
  hatch: { '普通': 30, '稀有': 60, '傳說': 120, note: '假設：孵化所需分鐘；加速用點數（蛋鋪）' },
  thresholdTalk: '提醒：數值在此一處，改這裡即可，不需動程式。'
};

module.exports = { FOODS_DEF: FOODS_DEF, foodSpriteFixed: foodSpriteFixed, plainSprite: plainSprite, toySprites: toySprites, TOYS_DEF: TOYS_DEF, PAIRS: PAIRS, META: META };
