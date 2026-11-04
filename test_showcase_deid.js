// node test_showcase_deid.js — 去識別化函式測試（每項印結果，最後印通過數）
const D = require('./showcase_deid.js');
let pass = 0, total = 0;
function t(name, cond, detail) {
  total++; if (cond) pass++;
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  → ' + detail : ''));
}
const M = (s, o) => D.maskPII(s, o);
const has = (s) => s.indexOf(D.MASK) >= 0;

// --- 姓名樣式
let r = M('我叫王小明，喜歡玩遊戲'); t('姓名：我叫＋名字', has(r.text) && !/王小明/.test(r.text), r.text);
r = M('我是陳大文，這是我的想法'); t('姓名：我是＋姓氏開頭', !/陳大文/.test(r.text), r.text);
r = M('林小美同學說可以換成廟埕'); t('姓名：姓名＋同學', !/林小美/.test(r.text), r.text);
r = M('my name is John Smith and I like it'); t('姓名：英文自我介紹', !/John/.test(r.text), r.text);
r = M('高中同學一起玩這款遊戲'); t('誤傷防護：高中同學不被遮', r.text === '高中同學一起玩這款遊戲', r.text);
r = M('我是想把廟會放進去'); t('誤傷防護：「我是想」不被遮', r.text === '我是想把廟會放進去', r.text);
r = M('我是家豪'); t('姓名：只有名字的自我介紹（我是家豪）', !/家豪/.test(r.text), r.text);
r = M('我是學生，想玩這個'); t('誤傷防護：「我是學生」不被遮', r.text === '我是學生，想玩這個', r.text);
r = M('鄭永康老師 我還記得你'); t('姓名：三字姓名＋老師', !/鄭永康/.test(r.text), r.text);
r = M('楊老師說可以'); t('誤傷防護：「楊老師」（只有姓）不被遮', r.text === '楊老師說可以', r.text);
// --- 學號
r = M('學號 4B4K0001 交了'); t('學號：4B4K0001', !/4B4K0001/i.test(r.text), r.text);
r = M('4b2k0127 和 4B4K0030'); t('學號：小寫與兩筆', !/4b[0-9]k\d{4}/i.test(r.text), r.text);
r = M('他的學號是 B10912345'); t('學號：字母＋8 碼', !/B10912345/.test(r.text), r.text);
// --- 信箱
r = M('寄到 someone.name+x@office.stust.edu.tw 就好'); t('信箱：校信箱', !/@/.test(r.text), r.text);
r = M('abc @ gmail.com'); t('信箱：有空白', !/gmail/.test(r.text), r.text);
// --- 電話
r = M('打 0912-345-678 找我'); t('電話：手機含連字號', !/345/.test(r.text), r.text);
r = M('0912345678'); t('電話：手機連續', !/0912/.test(r.text), r.text);
r = M('電話 06-2533131'); t('電話：市話', !/2533131/.test(r.text), r.text);
r = M('+886 912 345 678'); t('電話：國碼', !/912/.test(r.text), r.text);
// --- 網址
t('網址：https', D.hasUrl('看 https://example.com/a 這裡'));
t('網址：www', D.hasUrl('www.example.com'));
t('網址：裸網域', D.hasUrl('去 youtube.com 看'));
t('網址：一般句子不誤判', !D.hasUrl('廟會的遊戲，把香火換成分數。'));
let c = D.cleanText('看這個 https://x.com/abc 很有趣', {}); t('網址：整則跳過', !c.ok && c.reason === 'url', c.reason);
// --- Google 帳號名／社群帳號
r = M('我的 Google 帳號名是 wang.xm2024'); t('Google 帳號名', !/wang\.xm2024/.test(r.text), r.text);
r = M('IG: pretty_cat99 追蹤我'); t('IG 帳號', !/pretty_cat99/.test(r.text), r.text);
r = M('加我 @cool_guy88'); t('@handle', !/cool_guy88/.test(r.text), r.text);
// --- 信封編號、IP、uid
r = M('我是 #56 號，信封 12'); t('信封編號 #56／信封 12', !/#56/.test(r.text) && !/信封 12/.test(r.text), r.text);
r = M('來自 192.168.1.20'); t('IP 位址', !/192/.test(r.text), r.text);
r = M('uid AbCdEfGhIjKlMnOpQrStUvWxYz012345'); t('uid／長 token', !/AbCdEf/.test(r.text), r.text);
// --- 暱稱黑名單
const nre = D.buildNameRe(['小花貓', '阿德']);
r = M('小花貓說要加規則', { nameRe: nre }); t('暱稱黑名單', !/小花貓/.test(r.text), r.text);
// --- 測試編號、示範
[0, '0', 98, 99, 55, 57, 60, 'demo', 'test-1', '', null, undefined].forEach(e =>
  t('測試編號擋下：' + JSON.stringify(e), D.isBlockedEnv(e) === true));
[1, 52, 54, 61, 101, 130, '7'].forEach(e =>
  t('一般編號放行：' + e, D.isBlockedEnv(e) === false));
t('示範旗標 demo', D.isDemoFlag({ demo: true }) && D.isDemoFlag({ meta: { demo: 1 } }) && !D.isDemoFlag({ meta: {} }));
// --- 短內容
c = D.cleanText('好玩', {}); t('短內容 < 4 字跳過', !c.ok && c.reason === 'short', c.reason);
c = D.cleanText('   沒有  ', {}); t('短內容（含空白）跳過', !c.ok, c.reason);
c = D.cleanText('這個很有趣喔', {}); t('4 字以上放行', c.ok, c.text);
c = D.cleanText('4B4K0001', {}); t('遮完幾乎不剩東西 → 跳過', !c.ok, c.reason);
c = D.cleanText('魏仲廷', { allowShort: true }); t('整欄是三字人名 → 跳過', !c.ok && c.reason === 'name-like', c.reason);
c = D.cleanText('古曼童', { allowShort: true }); t('整欄是常見詞（古曼童）→ 放行', c.ok, c.text);
c = D.cleanText('鍾馗', { allowShort: true }); t('兩字神明名（鍾馗）→ 放行', c.ok, c.text);
c = D.cleanText('返校', { allowShort: true }); t('一般遊戲名（返校）→ 放行', c.ok, c.text);
// --- 作者代號
const SALT = 'salt-A';
const a1 = D.authorCode(SALT, 12, '把香火換成分數');
const a2 = D.authorCode(SALT, 12, '把香火換成分數');
t('同一人同一內容 → 代號穩定', a1 === a2, a1);
const people = []; for (let i = 1; i <= 52; i++) people.push(D.authorCode(SALT, i, '把香火換成分數'));
t('不同人 → 代號不同（52 人至少 45 種）', new Set(people).size >= 45, new Set(people).size + ' 種');
t('相鄰兩人代號不同', D.authorCode(SALT, 12, 'x內容內容') !== D.authorCode(SALT, 13, 'x內容內容'));
t('換鹽 → 代號改變（無法由原始碼反推編號）', D.authorCode('salt-B', 12, '把香火換成分數') !== a1);
t('代號格式「同學 ▲37」', /^同學 [▲●■◆★♥♣☾]\d{1,2}$/.test(a1), a1);
t('代號不含信封編號字串', !/12/.test(D.authorCode(SALT, 12, '內容').replace(/\d+$/, '')));
t('雜湊鍵穩定', D.cardKey('jam', 'abc') === D.cardKey('jam', 'abc') && D.cardKey('jam', 'abc') !== D.cardKey('jam', 'abd'));
// --- 週次
t('週次：09-09 為第1週', D.weekOfTs(Date.UTC(2026, 8, 9, 3)) === 1);
t('週次：09-16 為第2週', D.weekOfTs(Date.UTC(2026, 8, 16, 3)) === 2);
t('週次：09-23 為第3週', D.weekOfTs(Date.UTC(2026, 8, 23, 3)) === 3);

// --- 整條流程：假資料
const fx = {
  rounds: {
    r1: { createdAt: 1788875788418, players: { 3: { nickname: '小花貓', role: 'engineer' }, 5: { nickname: '阿德', role: 'creative' } },
      cards: { engineer: { v: '教室黑板真人版' }, creative: { v: '節奏音樂 × 度小月／小吃' } } },
    r2: { createdAt: 1788875788418, players: { 59: { nickname: '測試員乙', role: 'engineer' }, 60: { role: 'creative' } },
      cards: { engineer: { v: '測試用卡牌甲乙' }, creative: { v: '測試用卡牌丙丁' } } }
  },
  custom: { creative: { a: { addedBy: 42, d: '類型 × 台南文化元素', v: '卡牌', note: '用小花貓的名字來配對卡牌' }, b: { addedBy: 99, v: '管理員卡', note: '老師的測試卡牌內容' } } },
  w2culture: { c1: { addedBy: 7, d: 'tabu', v: '不能踩門檻', note: '踩到就要重來一回合' }, c2: { addedBy: 58, d: 'obj', v: '示範卡', note: '這是測試編號的卡片' }, c3: { addedBy: 9, d: '測試', v: '測試分類', note: '分類是測試所以跳過' } },
  jams: {
    j1: { by: 35, play: '返校', cult: '擲筊', cultKind: 'act', line: '玩家丟筊決定能不能開門', t: 1789525000000 },
    j2: { by: 1, play: '迴紋針', cult: '夜市', cultKind: 'obj', line: '看這個 https://a.com/x 很有趣', t: 1789525000000 },
    j3: { by: 99, play: '老師', cult: '示範', cultKind: 'obj', line: '老師自己的測試混搭內容', t: 1789525000000 },
    j4: { by: 2, play: '太短', cult: '短', cultKind: 'obj', line: '好', t: 1789525000000 },
    j5: { by: 4, play: '返校', cult: '擲筊', cultKind: 'act', line: '我是陳大文，寄 abc@gmail.com 給我', t: 1789525000000 }
  },
  w2cards: { 0: { x: { game: '返校', line: '老師測試的內容', mode: 'play', v: 'skin', t: 1789525000000 } },
    5: { y: { game: '小封神藏寶圖', line: '用手機邊走邊逛解謎的台南實境遊戲', mode: 'watch', v: 'story', t: 1789525000000 } } },
  cardDesigns: { 1: { z: { name: '鬼魂', rule: '出局以後還能出牌干擾別人', why: '讓被淘汰的人也有事做', ts: 1790131481190, nick: '#1', sess: '47602-20260923am', map_note: '系統備註不顯示' } },
    demo: { w: { name: '示範卡', rule: '範例規則內容很長', ts: 1790131481190 } } },
  feedback: { f1: { env: 4, text: '可以多一點角色讓我選', t: 1788921029177 }, f2: { env: 45, text: '沒有', t: 1788921029177 }, f3: { env: 98, text: '外校老師的回饋內容', t: 1788921029177 } }
};
const out = D.buildCards(fx, { salt: SALT });
const all = JSON.stringify(out.cards);
t('流程：保留合格卡片', out.cards.length === 8, out.cards.length + ' 張；跳過 ' + JSON.stringify(out.skipped));
t('流程：不含任何測試編號卡', !/老師的測試|測試用卡牌|示範卡|外校老師|老師測試/.test(all));
t('流程：網址卡被跳過', !/a\.com/.test(all));
t('流程：太短被跳過', !/"太短"/.test(all));
t('流程：個資被遮', !/陳大文|abc@gmail/.test(all) && /◼◼/.test(all));
t('流程：暱稱被遮', !/小花貓|阿德/.test(all));
t('流程：不含作者原始編號欄位', !/authorKey|addedBy|"by"|"env"|nick|sess|uid/.test(all));
t('流程：所有卡片都有「同學 …」代號', out.cards.every(c => /^同學 /.test(c.author)));
t('流程：掃描輸出無個資殘留', D.scanPII(out.cards.map(c => c.title + ' ' + (c.body || '') + ' ' + (c.lines || []).map(l => l.text).join(' ')).join('\n')).length === 0);
t('流程：同內容重複送出只留一張', (() => {
  const o = D.buildCards({ jams: { a: { by: 3, play: '返校', cult: '擲筊', cultKind: 'act', line: '重複送出的一模一樣內容', t: 1 }, b: { by: 3, play: '返校', cult: '擲筊', cultKind: 'act', line: '重複送出的一模一樣內容', t: 2 } } }, { salt: SALT });
  return o.cards.length === 1 && o.skipped.duplicate === 1;
})());
t('排序：相鄰盡量不同類型', (() => {
  const L = D.interleave(out.cards); let same = 0;
  for (let i = 1; i < L.length; i++) if (L[i].type === L[i - 1].type) same++;
  return same <= 2;
})());

console.log('\n去識別化測試通過 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
