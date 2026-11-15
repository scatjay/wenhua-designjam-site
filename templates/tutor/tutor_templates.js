/* 十二個樣板給助教用的資料（草稿 11-12）。
   欄位：id、name（學生看得到的名字，暫名）、genre、kind（對應 W2 文化卡五類 obj/act/rel/tabu/time）、card（示範文化卡，取自 W2 卡池原字）、
   swap（「文化只是皮」那一版把文化換成什麼）、extractQ（抽掉測試：助教問學生的那一題，一定是問句）、
   folk（可推回去讀的小封神資料條目 id；沒有對得上的就空著，改推田野）、field（AI 做不到、要自己去看或去問的那一格）。
   原六個的 name 取自規劃稿；新六個（7–12）是暫名，樣板尚未做完，資料先寫好讓助教能接。 */
(function (r) {
  var T = [
    { id: 'avg', elems: ['選項', '旗標', '結局', '場景', '門檻', '面子'], name: '通天冠（故事）', genre: '故事導向 AVG', kind: 'rel', card: '面子',
      swap: '面子換成一個普通的好感度數字', extractQ: '如果把「面子」換成好感度數字，你在第二個選擇時還會猶豫嗎？為什麼？',
      folk: ['object.tongtianguan', 'place.tongyu_pawn', 'deity.xiao_shangdi'], field: '你自己看過或聽過「為了面子不能開口」的一次場面，寫一句當時的情況' },
    { id: 'walk', elems: ['地點', '路線', '順序', '線索', '任務', '停留'], name: '通天冠去哪了（走讀）', genre: '走讀定位任務', kind: 'obj', card: '廟埕',
      swap: '地點換成地圖上任意幾個點', extractQ: '如果停留的順序可以隨便換，這條路線還有哪一段非走不可？',
      folk: ['place.tianhou_gong', 'place.beiji_dian', 'place.tongyu_pawn'], field: '你走到的一個地點，現場看到的一個動線或擺設（拍照或畫下來）' },
    { id: 'puzzle', elems: ['線索', '道具', '謎題', '提示', '答案', '組合'], name: '冠不見了（解謎）', genre: '解謎推理', kind: 'obj', card: '神明的金身',
      swap: '線索換成數字密碼鎖', extractQ: '不知道這段故事的人，能不能只靠猜數字解開這一關？',
      folk: ['object.tongtianguan', 'char.qianliyan_shunfeng', 'deity.kuixing'], field: '你在廟裡實際看到的一個細節（匾、聯、擺設），能當成下一條線索的' },
    { id: 'sim', elems: ['人情', '香火', '回合', '事件', '資源', '還'], name: '小上帝廟的半年（經營）', genre: '經營模擬', kind: 'rel', card: '欠人情',
      swap: '人情換成金幣，可以隨時用掉', extractQ: '如果欠的人情不會越來越重，你還需要決定先還誰嗎？',
      folk: ['deity.xiao_shangdi', 'object.xianghuobu', 'deity.da_shangdi'], field: '你問到的一個真實的「人情怎麼還」的例子（家裡、廟裡或社團）' },
    { id: 'cards', elems: ['卡', '輩分', '出牌', '相剋', '加成', '手牌'], name: '封神廟牌局（卡牌）', genre: '卡牌對戰', kind: 'rel', card: '輩分',
      swap: '輩分換成卡片的等級數字', extractQ: '把輩分換成等級之後，哪一張牌出牌的時機會變得無所謂？',
      folk: ['place.fengshen_temple', 'deity.li_jing', 'deity.nezha'], field: '你觀察到的一次「誰先講話、誰不能拒絕誰」的場面' },
    { id: 'rhythm', elems: ['鼓點', '節拍', '判定', '場', '順序', '錯拍'], name: '三場鼓（節奏）', genre: '節奏反應', kind: 'act', card: '拜拜的順序',
      swap: '鼓點換成一般音遊的音符，打錯只扣分', extractQ: '打錯一拍之後，這一場接下來的玩法有沒有改變？還是只少了分數？',
      folk: ['deity.xiao_shangdi', 'deity.zhao_yuanshuai', 'deity.kang_yuanshuai'], field: '你在現場聽到的一段鑼鼓或儀式節奏，記下它什麼時候停、什麼時候變' },
    { id: 'sneak', elems: ['門檻', '線', '巡', '地圖', '代價', '忌諱'], name: '夜巡不踩線（潛行）', genre: '潛行躲避', kind: 'tabu', card: '不能踩門檻',
      swap: '禁忌換成碰到紅色方塊扣血', extractQ: '如果踩到線可以重來，你走這張地圖的方式會不一樣嗎？',
      folk: ['place.tianhou_gong', 'char.qianliyan_shunfeng'], field: '你問到的一條真實的忌諱，和違反之後大家會怎麼做' },
    { id: 'social', elems: ['中間人', '面子', '人情', '輩分', '結盟', '開口'], name: '人情與面子（談判）', genre: '社交博弈', kind: 'rel', card: '喬事情',
      swap: '面子換成金幣，輩分換成等級', extractQ: '如果誰都可以直接開口，找中間人這一步還有存在的理由嗎？',
      folk: ['deity.da_shangdi', 'deity.xiao_shangdi', 'deity.anhai_tudi'], field: '你看過的一次「找人喬事情」，中間人是誰、為什麼找他' },
    // 文史審查 11-12：原書全文檢索普渡、擲筊、收驚皆 0 筆。下面兩個樣板的 folk 只是借小封神的神明當入口，文案不得寫成「原著的普渡／擲筊」。
    { id: 'towerdef', elems: ['波', '供品', '法器', '日期', '訪客', '七天'], name: '普渡七日（塔防）', genre: '塔防波次', kind: 'time', card: '普渡',
      swap: '波次換成第 N 波，訪客換成怪物', extractQ: '如果錯過這一波可以馬上補，日期這件事在遊戲裡還重要嗎？',
      folk: ['deity.linshui_furen', 'object.xianghuobu'], field: '你家或附近普渡實際準備了什麼、什麼時候擺、什麼時候收' },
    { id: 'roguelike', elems: ['聖筊', '笑筊', '陰筊', '路線', '獎勵', '換問法', '收驚', '層'], name: '擲筊問路（爬塔）', genre: '肉鴿爬塔', kind: 'act', card: '擲筊',
      swap: '擲筊換成骰子，三種結果換成成功失敗', extractQ: '把擲筊換成骰子之後，「笑筊」那個結果要怎麼處理？它還有意義嗎？',
      folk: ['deity.xiao_shangdi', 'deity.guansheng'], field: '你親眼看過的一次擲筊：問了什麼、連續幾次、陰筊時對方怎麼做' },
    { id: 'tiles', elems: ['板塊', '水道', '廟埕', '攤位', '相鄰', '得分'], name: '五條港接水道（拼接）', genre: '板塊拼接', kind: 'obj', card: '五條港',
      swap: '同樣的板塊，相鄰只影響好不好看', extractQ: '如果廟埕放在哪裡都可以得分，這張地圖還需要你想先放哪一塊嗎？',
      folk: ['place.tianhou_gong', 'place.lingyou_temple', 'place.beiji_dian'], field: '你走過的一段老街，哪一種店或廟一定挨著哪一種，寫下你看到的' },
    { id: 'runner', w2open: true, elems: ['神轎', '接駕', '補給', '起駕', '路線', '停'], name: '遶境不能停（跑酷）', genre: '橫向捲軸跑酷', kind: 'act', card: '遶境',
      swap: '路線換成隨機跑道，接駕換成撿金幣', extractQ: '如果停下來不用重新起駕，你還會在意每一個接駕點嗎？',
      folk: ['deity.baosheng_dadi', 'deity.guansheng'], field: '你看過的一次遶境或陣頭：在哪裡停、誰在路邊接、停多久' }
  ];
  var KINDS = { obj: '物件・地點', act: '行為・儀式', rel: '人際關係', tabu: '禁忌・規矩', time: '時間節奏' };
  var D = { TEMPLATES: T, KINDS: KINDS };
  if (typeof module === 'object' && module.exports) module.exports = D; else r.CT_TPL = D;
})(typeof self !== 'undefined' ? self : this);
