/* 走讀：小精靈的性格、進化形態、行為狀態機（純資料，ES5，掛 window）。
   規格：knowledge/tainan_walk/BUILD_SPEC_ROOM_SPIRIT_1103.md 第 9 節。邏輯在 js/walk_store.js（性格抽取、計數、進化、撫摸規則）、js/walk_sprites2.js（形態配色與配件）。
   WALK_TRAITS／WALK_FORMS 是「陣列」，另附 .byId 對照表；WALK_BEHAVIOR 是物件。
   台詞與反應一律不涉及史實；數值微調不超過 ±20%，只影響趣味、不影響計分。 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- 六種性格
     mods 的鍵（walk_store.js 實際讀取）：
       decayMul 活力自然下降倍率｜playMul 玩耍回復倍率｜napMul 整理窩（睡眠）回復倍率｜scoutExtraChance 勘察多抽一張的機率
       feedBond 每次餵食額外羈絆｜petColdFirst 每天前 N 次撫摸冷淡｜petHappyBond 第 N+1 次開心時的羈絆｜petPair 需連續兩次撫摸才回應（1）｜visitorHide 有訪客時躲起來（1）
     weights：依小精靈主屬性（觀察、溝通、智識、行動、守護、全）的抽中權重。
     formPref：進化三項計數平手時的形態偏好順序。giftChance：每日小禮物機率（羈絆 >= 5）。 */
  var TRAITS = [
    {
      id: 'active', icon: '🔥', name: '活潑', intro: '閒不下來，什麼都想試試看。',
      likes: { furnitureTypes: ['floor', 'window'], toys: ['toy_light'] },
      dislikes: { petStreak: 5, neglect: true, text: '被冷落會悶悶的' },
      tone: { suffix: '！' },
      mods: { decayMul: 0.85, playMul: 0.85 },
      weights: { '觀察': 1, '溝通': 4, '智識': 1, '行動': 4, '守護': 1, '全': 2 },
      formPref: ['adv', 'care', 'lore'], giftChance: 0.5,
      reactions: {
        pet: ['再摸再摸！', '好癢，哈哈！', '跳起來了！'],
        feed: ['好吃！還要！', '吃飽才有力氣跑！', '一口就沒了！'],
        play: ['再玩一次！', '追到了！', '我們比賽吧！'],
        visitor: ['有人來了，一起玩！', '歡迎歡迎！', '快來看我跳！'],
        petCold: ['等一下，我在忙。', '嗯？現在不行。', '先讓我跑一圈。'],
        petWait: ['咦，剛剛是你嗎？', '再來一次？', '我沒注意到。'],
        annoyed: ['摸太多啦，頭暈。', '讓我喘口氣！', '停一下停一下！']
      }
    },
    {
      id: 'lazy', icon: '😴', name: '慵懶', intro: '最愛窩著，慢慢來比較快。',
      likes: { furnitureTypes: ['pet', 'floor'], toys: [] },
      dislikes: { petStreak: 5, neglect: true, text: '被吵醒會不太開心' },
      tone: { suffix: '…' },
      mods: { decayMul: 1.2, napMul: 1.2 },
      weights: { '觀察': 1, '溝通': 1, '智識': 1, '行動': 1, '守護': 2, '全': 2 },
      formPref: ['care', 'lore', 'adv'], giftChance: 0.45,
      reactions: {
        pet: ['嗯…舒服…', '再靠近一點…', '呼…好暖…'],
        feed: ['慢慢吃…', '嗯，不錯…', '吃飽了想睡…'],
        play: ['好吧…一下下…', '動一動也行…', '呼，累了…'],
        visitor: ['嗯？有人？', '小聲一點…', '打個招呼…'],
        petCold: ['讓我再睡一下…', '嗯…等等…', '先不要…'],
        petWait: ['……zzz', '嗯？', '好像有人…'],
        annoyed: ['吵醒我了…', '別一直摸…', '我要睡了…']
      }
    },
    {
      id: 'curious', icon: '🔍', name: '好奇', intro: '什麼都想看，什麼都想問。',
      likes: { furnitureTypes: ['window', 'wall'], toys: ['toy_light'] },
      dislikes: { petStreak: 5, neglect: true, text: '沒新鮮事會有點無聊' },
      tone: { suffix: '？' },
      mods: { scoutExtraChance: 0.1 },
      weights: { '觀察': 4, '溝通': 1, '智識': 3, '行動': 1, '守護': 1, '全': 2 },
      formPref: ['lore', 'adv', 'care'], giftChance: 0.5,
      reactions: {
        pet: ['這是什麼感覺？', '哇，好特別？', '再摸一次看看？'],
        feed: ['這是什麼口味？', '我想記下這味道？', '還有別種嗎？'],
        play: ['這個怎麼玩？', '讓我試試看？', '有什麼祕密嗎？'],
        visitor: ['你從哪裡來？', '帶了什麼新鮮事？', '讓我看看你？'],
        petCold: ['等等，我在看。', '先讓我研究一下。', '那邊有東西。'],
        petWait: ['剛剛是什麼？', '誰在那裡？', '咦？'],
        annoyed: ['頭都暈了。', '別摸了，我想看。', '好了好了。']
      }
    },
    {
      id: 'shy', icon: '🙈', name: '害羞', intro: '慢熱，熟了以後會很黏你。',
      likes: { furnitureTypes: ['pet', 'wall'], toys: [] },
      dislikes: { petStreak: 5, neglect: true, text: '人多的時候會躲起來' },
      tone: { suffix: '…（小聲）' },
      mods: { petPair: 1, visitorHide: 1 },
      weights: { '觀察': 1, '溝通': 1, '智識': 3, '行動': 1, '守護': 4, '全': 2 },
      formPref: ['care', 'lore', 'adv'], giftChance: 0.5,
      reactions: {
        pet: ['嗯…好舒服…', '你的手好暖…', '再一下下…'],
        feed: ['謝謝你…', '偷偷吃一口…', '好好吃…'],
        play: ['我、我也想玩…', '小聲說，很開心…', '再一次好嗎…'],
        visitor: ['有人…我躲一下…', '不要看我…', '我在窩裡…'],
        petCold: ['嗯…不好意思…', '我有點緊張…', '等一下…'],
        petWait: ['（縮了一下）', '（偷偷看你）', '（沒有動）'],
        annoyed: ['太多了…我躲起來…', '我有點怕…', '先停一下…']
      }
    },
    {
      id: 'foodie', icon: '🍙', name: '貪吃', intro: '為了點心什麼都肯做。',
      likes: { furnitureTypes: ['floor', 'pet'], toys: [] },
      dislikes: { petStreak: 5, neglect: true, text: '肚子餓會碎碎念' },
      tone: { suffix: '～' },
      mods: { decayMul: 1.15, feedBond: 1 },
      weights: { '觀察': 2, '溝通': 2, '智識': 1, '行動': 2, '守護': 1, '全': 2 },
      formPref: ['care', 'adv', 'lore'], giftChance: 0.7,
      reactions: {
        pet: ['摸摸可以，點心呢～', '嘿嘿，好舒服～', '摸完要吃東西～'],
        feed: ['太好吃了～', '再來一份～', '我的最愛～'],
        play: ['玩完會餓喔～', '贏了有點心嗎～', '動一動更想吃～'],
        visitor: ['你有帶吃的嗎～', '一起分享吧～', '聞到香味了～'],
        petCold: ['先給我點心～', '肚子在叫～', '等我吃完～'],
        petWait: ['咦，有東西吃嗎～', '剛剛是食物的聲音～', '嗯～'],
        annoyed: ['別摸了，我要吃～', '摸多了會餓～', '夠了夠了～']
      }
    },
    {
      id: 'tsundere', icon: '😤', name: '傲嬌', intro: '嘴上說不要，其實很在意你。',
      likes: { furnitureTypes: ['wall', 'window'], toys: ['toy_light'] },
      dislikes: { petStreak: 5, neglect: true, text: '被當成普通寵物會不高興' },
      tone: { suffix: '哼' },
      mods: { petColdFirst: 2, petHappyBond: 2 },
      weights: { '觀察': 1, '溝通': 1, '智識': 1, '行動': 1, '守護': 4, '全': 2 },
      formPref: ['adv', 'lore', 'care'], giftChance: 0.65,
      reactions: {
        pet: ['才、才沒有很開心哼', '好啦，這次特別允許', '只准這一下哼'],
        feed: ['勉強收下哼', '才不是特別喜歡哼', '下次也要這個哼'],
        play: ['陪你玩而已哼', '我才沒輸哼', '再一局也不是不行哼'],
        visitor: ['隨便看看就好哼', '別碰我的東西哼', '來就來吧哼'],
        petCold: ['哼，別碰我。', '我才不要。', '走開啦。'],
        petWait: ['哼。', '才沒在等你。', '隨便。'],
        annoyed: ['夠了！別摸了！', '真的生氣了哼', '手拿開！']
      }
    }
  ];
  TRAITS.byId = {};
  TRAITS.forEach(function (t) { TRAITS.byId[t.id] = t; });

  /* ---------------------------------------------------------------- 三種形態
     tint：配色偏移（把調色盤往 color 混合 amount，深色輪廓不動）。accessory：16×16 稀疏配件（'.' 不蓋原圖），pal 的字元用數字避開精靈用字。
     effect：[{key, value, desc}]；walk_store.js 讀 vigorDecayMul、feedVigorBonus、scoutExtraChance、assistCdMul、assistExtraUse；intelNextHint 給畫面用。 */
  var FORMS = [
    {
      id: 'care', icon: '🏠', name: '陪伴型', desc: '被照顧得很好，偏暖色，戴著小蝴蝶結。活力不容易掉，吃東西更有精神。',
      tint: { color: '#ff9a5a', amount: 0.28 },
      accessory: {
        rows: [
          '................',
          '................',
          '.........11.11..',
          '.........11211..',
          '.........11.11..',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................'
        ],
        pal: { '1': '#e0405a', '2': '#ffd0d8' }
      },
      effect: [
        { key: 'vigorDecayMul', value: 0.8, desc: '活力自然下降變慢（×0.8）' },
        { key: 'feedVigorBonus', value: 2, desc: '餵食多回復 2 點活力' }
      ]
    },
    {
      id: 'adv', icon: '🧭', name: '冒險型', desc: '常常跟著你出門，偏亮藍綠，背著小背包。勘察更容易多找到一件，隨行技冷卻較短。',
      tint: { color: '#3ad0c8', amount: 0.28 },
      accessory: {
        rows: [
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '............333.',
          '............343.',
          '............343.',
          '............333.',
          '................',
          '................',
          '................',
          '................'
        ],
        pal: { '3': '#8a5a2c', '4': '#e8c27a' }
      },
      effect: [
        { key: 'scoutExtraChance', value: 0.15, desc: '勘察多找到 1 件的機率 +15%' },
        { key: 'assistCdMul', value: 0.9, desc: '隨行助理技冷卻 −10%' }
      ]
    },
    {
      id: 'lore', icon: '📚', name: '學者型', desc: '愛看愛查，偏紫色，戴著小眼鏡。情報卡會多一條「再往下查的方向」，查證類助理技多一次。',
      tint: { color: '#8a5aa8', amount: 0.30 },
      accessory: {
        rows: [
          '................',
          '................',
          '................',
          '................',
          '................',
          '....7777.7777...',
          '....766777667...',
          '....7777.7777...',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................'
        ],
        pal: { '6': '#bfe8ff', '7': '#3a2a4a' }
      },
      effect: [
        { key: 'intelNextHint', value: 1, desc: '情報卡多顯示「再往下查的方向」' },
        { key: 'assistExtraUse', value: 1, desc: '查證類助理技每章多用一次' }
      ]
    }
  ];
  FORMS.byId = {};
  FORMS.forEach(function (f) { FORMS.byId[f.id] = f; });

  /* ---------------------------------------------------------------- 行為狀態機（房間內；動畫 8 FPS，轉移判斷在進房間時依整格後的活力與時段重算）
     durations：狀態持續步數範圍 [最少, 最多]（8 FPS 的步數）。
     transitions：只有 wander 會挑下一個狀態（權重）；其他狀態結束後回到 wander。
     modifiers：活力、時段、家具、性格、事件對權重的倍率。events：事件觸發的強制狀態。
     lines：性格 × 行為的台詞（每句 <= 20 字）。 */
  var STATES = ['wander', 'nap', 'play', 'eat', 'explore', 'cuddle', 'hide', 'sing', 'show', 'together', 'missyou'];
  var BEHAVIOR = {
    fps: 8,
    states: STATES,
    labels: { wander: '在散步', nap: '正在打盹', play: '在玩耍', eat: '在吃東西', explore: '在探索', cuddle: '想找你玩', hide: '躲起來了', sing: '在哼歌', show: '在炫耀', together: '和夥伴一起', missyou: '想你了' },
    durations: {
      wander: [24, 80], nap: [80, 200], play: [40, 100], eat: [40, 80], explore: [40, 100], cuddle: [32, 64],
      hide: [48, 120], sing: [48, 96], show: [24, 48], together: [48, 120], missyou: [48, 80]
    },
    transitions: {
      wander: { nap: 2, play: 2, eat: 1, explore: 2, sing: 0.5, together: 0.5 }
    },
    modifiers: {
      vigorLow: { below: 40, mul: { nap: 3, play: 0.3, explore: 0.5 } },
      vigorHigh: { atLeast: 80, mul: { play: 2, explore: 1.5 } },
      night: { from: 20, to: 6, mul: { nap: 2, sing: 2, explore: 0.5, play: 0.7 } },
      day: { from: 6, to: 20, mul: { explore: 1.5, nap: 0.8 } },
      furniture: { toy: { play: 2 }, bowl: { eat: 2 }, window: { explore: 2 }, nest: { nap: 2 } },
      trait: {
        active: { play: 2, explore: 1.2, nap: 0.6 },
        lazy: { nap: 3, play: 0.5, explore: 0.6 },
        curious: { explore: 3, play: 1.2 },
        shy: { hide: 2, explore: 0.7, together: 0.6 },
        foodie: { eat: 3, nap: 1.2 },
        tsundere: { cuddle: 0.5, nap: 1.2, sing: 0.5 }
      },
      singers: ['active', 'curious', 'foodie']
    },
    events: {
      pet: 'cuddle', feed: 'eat', play: 'play', visitor: 'hide', visitorHideTraits: ['shy'],
      newItem: 'show', newIntel: 'show', absentTicks: 48, absent: 'missyou', nearOther: 'together'
    },
    lines: {
      active: {
        wander: ['出去跑一圈！', '腳癢了！'], nap: ['先睡五分鐘！', '充電中！'],
        play: ['看我厲害！', '再來再來！'], eat: ['開動！', '好吃好吃！'],
        explore: ['那裡有什麼！', '我先去看看！'], cuddle: ['來玩嘛！', '摸摸我！'],
        hide: ['等等再出來！', '嘿，躲貓貓！'], sing: ['啦啦啦！', '心情超好！'],
        show: ['快看快看！', '我有新東西！'], together: ['一起跑！', '追你囉！'],
        missyou: ['你終於來了！', '我等好久！']
      },
      lazy: {
        wander: ['慢慢晃…', '走一步就好…'], nap: ['呼…', '再睡一下…'],
        play: ['動一下就好…', '陪你玩…'], eat: ['慢慢嚼…', '嗯，好吃…'],
        explore: ['看一眼就好…', '窗邊有光…'], cuddle: ['靠一下…', '給我抱抱…'],
        hide: ['窩裡最舒服…', '別吵我…'], sing: ['嗯嗯…哼…', '小小聲…'],
        show: ['看…新的…', '嗯，不錯吧…'], together: ['並排睡…', '你也來…'],
        missyou: ['你回來了…', '等你好久…']
      },
      curious: {
        wander: ['那是什麼？', '去看看？'], nap: ['夢裡也在找？', '先休息一下？'],
        play: ['這個怎麼玩？', '再試一次？'], eat: ['這是什麼味？', '好特別？'],
        explore: ['這裡有線索？', '好多東西？'], cuddle: ['陪我看？', '一起找？'],
        hide: ['我在觀察？', '等一下？'], sing: ['這旋律好玩？', '哼哼？'],
        show: ['發現新東西？', '你看這個？'], together: ['你在看什麼？', '一起研究？'],
        missyou: ['你去哪了？', '有新鮮事嗎？']
      },
      shy: {
        wander: ['輕輕走…', '不要看我…'], nap: ['縮成一團…', '安靜睡…'],
        play: ['偷偷玩…', '只玩一下…'], eat: ['小口小口…', '謝謝你…'],
        explore: ['偷偷看窗外…', '好像沒人…'], cuddle: ['靠近一點點…', '可以摸摸…'],
        hide: ['我躲起來了…', '不要找我…'], sing: ['很小聲地…', '別聽啦…'],
        show: ['給你看…', '小小的…'], together: ['一起…好嗎…', '靠在旁邊…'],
        missyou: ['你回來了…', '我有點想你…']
      },
      foodie: {
        wander: ['找找有沒有吃的～', '聞到香味了～'], nap: ['吃飽好睏～', '夢到點心～'],
        play: ['玩完要吃～', '贏了有獎勵～'], eat: ['開動～', '太幸福了～'],
        explore: ['廚房在哪～', '那邊有香味～'], cuddle: ['有點心嗎～', '摸摸再給吃～'],
        hide: ['我躲著吃～', '別搶喔～'], sing: ['吃吃吃之歌～', '哼～'],
        show: ['看我找到的～', '好東西～'], together: ['分你一半～', '一起吃～'],
        missyou: ['你帶吃的嗎～', '好想你～']
      },
      tsundere: {
        wander: ['才不是在等你。', '隨便走走哼'], nap: ['別吵我哼', '才沒睡著'],
        play: ['陪你而已哼', '別誤會哼'], eat: ['勉強吃哼', '還不錯哼'],
        explore: ['順便看看哼', '才沒好奇哼'], cuddle: ['就這一下哼', '別告訴別人'],
        hide: ['別看哼', '走開啦'], sing: ['沒、沒在唱哼', '不准聽'],
        show: ['不是炫耀哼', '隨便你看哼'], together: ['別靠太近哼', '好吧一起'],
        missyou: ['哼，終於來了。', '才沒想你。']
      }
    }
  };

  window.WALK_TRAITS = TRAITS;
  window.WALK_FORMS = FORMS;
  window.WALK_BEHAVIOR = BEHAVIOR;
})();
