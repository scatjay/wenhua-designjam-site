/* 時安局探員名冊：16 個職務 ＝ 16 位有名字、有個性、有人際關係的探員。
   職務的功能在 walk.js（ROLE_DESC／ROLE_GROW）；這裡放「人」：名字、處別、個性類型、口頭禪、簡介、組織關係與搭檔。
   全部是虛構人物，與真實人物無關。img 是像素頭像（art/agents/NN_<en>.png），沒有圖時畫面退回職務圖示。
   搭檔（pair）：兩個職務同隊且由不同人擔任時，每取得一格碎片，全隊 +5 分（walk.js 的 pairBonus）。 */
(function () {
  var DEPTS = {
    '指揮': { boss: '局長', line: '現場最高指揮，向局長回報' },
    '分析': { boss: '隊長', line: '把線索算成方向' },
    '調度': { boss: '隊長', line: '路線、時間與位置' },
    '情報': { boss: '軍師', line: '找得到、看得準、驗得出' },
    '行動': { boss: '隊長', line: '第一線：問、拍、寫、設計、入戲' },
    '聯絡': { boss: '隊長', line: '對內對外的聲音' },
    '後勤': { boss: '隊長', line: '讓大家走得安全、走得久' }
  };
  var A = {
    '隊長': { name: '周定遠', nick: '老錨', mbti: 'ENTJ', dept: '指揮', motto: '船沒有方向，風再大也是白費。', bio: '資深外勤，時安局最會「下決定」的人。話不多，但每次開口，大家都會停下手邊的事。', look: 'confident middle-aged field commander, navy coat, captain cap, brass anchor pin, calm stern smile', rel: { boss: '局長（廣播）', partner: '軍師', note: '和軍師是老搭檔：一個負責決定，一個負責算清楚為什麼。' }, pair: '軍師' },
    '領航員': { name: '簡北辰', nick: '北辰', mbti: 'ISTJ', dept: '調度', motto: '路線不會騙人，會騙人的是腳。', bio: '地圖與時刻表的化身，包包裡永遠有三份不同比例尺的地圖。', look: 'neat young navigator, compass hanging from neck, folded map, backpack, serious focused eyes', rel: { boss: '隊長', partner: '在地嚮導', note: '和在地嚮導常鬥嘴：他信地圖，她信巷子。' }, pair: '在地嚮導' },
    '軍師': { name: '蘇寄雲', nick: '寄雲', mbti: 'INTP', dept: '分析', motto: '先別急，答案通常躲在題目的第二行。', bio: '愛想、愛喝茶、愛把線索排成表。每次都能提早一步，但從不說自己怎麼知道的。', look: 'thoughtful scholar in round glasses, long scarf, holding a teacup and folded notes, gentle smirk', rel: { boss: '隊長', partner: '隊長', note: '隊長做決定的時候，會先看他一眼。' }, pair: '隊長' },
    '偵查員': { name: '柯小野', nick: '小野', mbti: 'ESTP', dept: '情報', motto: '別人看路，我看路邊。', bio: '閒不下來的搜索專家，專門找「地圖上沒有」的東西，成功率高得讓人懷疑他有作弊。', look: 'energetic scout, headband, binoculars, light vest with pockets, grin', rel: { boss: '軍師', partner: '鑑識員', note: '他負責找，鑑識員負責驗，兩個人常為「這算不算線索」吵起來。' }, pair: '鑑識員' },
    '檔案官': { name: '賴墨卿', nick: '墨卿', mbti: 'ISFJ', dept: '情報', motto: '沒有出處的話，我只當它是聽說。', bio: '檔案室的守護者，說話會先報檔號。對「聽說」兩個字特別敏感。', look: 'gentle archivist, sleeve covers, thin glasses, stack of folders, ink stained finger', rel: { boss: '軍師', partner: '記錄官', note: '舊檔案與新紀錄，是同一條線的兩端。' }, pair: '記錄官' },
    '訪談員': { name: '方知音', nick: '知音', mbti: 'ENFJ', dept: '行動', motto: '人不是不想說，是還沒遇到對的問題。', bio: '最會讓人開口的探員。她的筆記本寫的不是答案，是「對方剛剛笑了一下」。', look: 'warm interviewer, microphone, notebook, soft cardigan, kind attentive expression', rel: { boss: '隊長', partner: '扮演專員', note: '一個問、一個演，NPC 常被他們兩個攻陷。' }, pair: '扮演專員' },
    '蒐證員': { name: '顏快門', nick: '快門', mbti: 'ESFP', dept: '行動', motto: '一張照片，勝過十句「我記得」。', bio: '相機不離身，連吃飯都先拍。拍照前一定會說「三、二、……」然後不數一。', look: 'cheerful photographer, camera around neck, bucket hat, bright jacket, playful wink', rel: { boss: '隊長', partner: '鑑識員', note: '他拍的照片，常被鑑識員放大到只剩像素。' }, pair: '鑑識員' },
    '記錄官': { name: '魏一筆', nick: '一筆', mbti: 'INFP', dept: '行動', motto: '把一整天，寫成一句話。', bio: '安靜、愛發呆，但最後交出來的那句話，常讓全隊安靜三秒。', look: 'quiet dreamy recorder, fountain pen, leather journal, oversized sweater, soft smile', rel: { boss: '隊長', partner: '檔案官', note: '喜歡待在檔案室旁邊，因為那裡最安靜。' }, pair: '檔案官' },
    '文化設計員': { name: '吳玩意', nick: '玩意', mbti: 'ENFP', dept: '行動', motto: '歷史不是用來背的，是用來改成規則的。', bio: '看到一座廟，想到三種遊戲機制。話題常常跑掉，但跑掉的方向通常有趣。', look: 'colorful creative game designer, dice earring, sketchbook, patchwork jacket, excited expression', rel: { boss: '隊長', partner: '檔案官', note: '設計靈感都要先過檔案官那一關：有出處嗎？' }, pair: '檔案官' },
    '通訊官': { name: '洪傳聲', nick: '傳聲', mbti: 'ENTP', dept: '聯絡', motto: '訊號好不好，要看你有沒有開口。', bio: '耳機不離頭，最愛廣播。喜歡把壞消息講成好笑的事，把好消息講得全場都聽見。', look: 'lively radio operator, big headset, antenna badge, mischievous smile, bright scarf', rel: { boss: '隊長', partner: '技術專家', note: '和技術專家是「訊號搭檔」：他說，她修。' }, pair: '技術專家' },
    '安全官': { name: '葉護航', nick: '護航', mbti: 'ISFJ', dept: '後勤', motto: '平安回來，才算完成任務。', bio: '背包裡有OK繃、哨子和反光背心。每一次出發前都會點一次人數。', look: 'caring safety officer, reflective vest, whistle, first aid pouch, warm protective eyes', rel: { boss: '隊長', partner: '補給官', note: '和補給官是後勤雙壁：一個管人，一個管物。' }, pair: '補給官' },
    '補給官': { name: '陳囤囤', nick: '囤囤', mbti: 'ESFJ', dept: '後勤', motto: '點數要花，但要花在刀口上。', bio: '背包永遠鼓鼓的，裡面什麼都有。很會殺價，連局裡的補給站老闆都怕他。', look: 'friendly supply officer, huge backpack, many pouches, round cheeks, cheerful smile', rel: { boss: '隊長', partner: '安全官', note: '安全官說要，他就能變出來。' }, pair: '安全官' },
    '鑑識員': { name: '傅細查', nick: '細查', mbti: 'INTJ', dept: '情報', motto: '形狀、材質、新舊、文字、數字，五樣看完再說。', bio: '放大鏡不離手，講話冷冷的，但每次都是第一個發現「哪裡不對勁」的人。', look: 'sharp forensic examiner, lab coat, magnifying glass, tweezers, cool analytical gaze', rel: { boss: '軍師', partner: '偵查員', note: '偵查員找到的東西，一定要經過他的放大鏡。' }, pair: '偵查員' },
    '技術專家': { name: '鍾訊號', nick: '訊號', mbti: 'ISTP', dept: '後勤', motto: '手機定位不準？先到空曠的地方再說。', bio: '修得好任何壞掉的東西，除了自己的作息。口袋裡永遠有一條備用線。', look: 'laid-back tech specialist, goggles on forehead, tool belt, cable in pocket, sleepy half smile', rel: { boss: '隊長', partner: '通訊官', note: '通訊官一喊，他就知道哪裡訊號又掉了。' }, pair: '通訊官' },
    '在地嚮導': { name: '林巷仔', nick: '巷仔', mbti: 'ESFJ', dept: '調度', motto: '近路不是地圖畫的，是阿嬤走出來的。', bio: '在這座城市長大，每條巷子都有一個小故事。最討厭有人說「地圖上沒有」。', look: 'friendly local guide, straw hat, cloth bag, comfortable slippers style shoes, warm talkative smile', rel: { boss: '隊長', partner: '領航員', note: '和領航員拌嘴十年，從沒真正輸過。' }, pair: '領航員' },
    '扮演專員': { name: '余假面', nick: '假面', mbti: 'ENFP', dept: '行動', motto: '入了戲，NPC 就會多說一句。', bio: '出身戲班，什麼角色都接得住。喜歡在訪談時偷偷加一句臺詞，看對方會不會接。', look: 'theatrical actor, half mask on side of head, costume vest, dramatic pose, playful eyes', rel: { boss: '隊長', partner: '訪談員', note: '訪談員問什麼，他就演什麼。' }, pair: '訪談員' }
  };
  var ORDER = ['隊長', '領航員', '軍師', '偵查員', '檔案官', '訪談員', '蒐證員', '記錄官', '文化設計員', '通訊官', '安全官', '補給官', '鑑識員', '技術專家', '在地嚮導', '扮演專員'];
  var EN = { '隊長': 'captain', '領航員': 'navigator', '軍師': 'strategist', '偵查員': 'scout', '檔案官': 'archivist', '訪談員': 'interviewer', '蒐證員': 'photographer', '記錄官': 'recorder', '文化設計員': 'designer', '通訊官': 'radio', '安全官': 'safety', '補給官': 'supply', '鑑識員': 'forensic', '技術專家': 'tech', '在地嚮導': 'local_guide', '扮演專員': 'actor' };
  ORDER.forEach(function (r, i) { var a = A[r]; a.role = r; a.idx = i + 1; a.img = 'art/agents/' + (i < 9 ? '0' : '') + (i + 1) + '_' + EN[r] + '.png'; });
  /* 同隊的搭檔配對（去重）：兩個職務由不同人擔任時成立 */
  function pairs() { var seen = {}, out = []; ORDER.forEach(function (r) { var p = A[r].pair; if (!p) return; var k = [r, p].sort().join('|'); if (!seen[k]) { seen[k] = 1; out.push([r, p]); } }); return out; }
  window.WALK_AGENTS = { all: A, order: ORDER, depts: DEPTS, pairs: pairs, get: function (r) { return A[r] || null; } };
})();
