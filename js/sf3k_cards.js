/* SF3K 改動卡池（封閉卡池）
   來源：歷屆 226 筆學生改動（flipclass 現行／flip 舊站／my 數位學習，共 11 門課）
        經分群成 24 類，再補 4 張「學生忽略的維度」補強卡。
   每張卡 = 一組 CFG patch。online:true 的卡選了就即時生效；online:false 是本質上線上做不到的，
   當成「規則卡・人工執行」發給桌上那組。
   dim 對照設計維度：A 行動集合 / B 目標機制 / C 傷害數值 / D TEAM 曲線 / E DEFEND /
                    F 籌碼 / G 勝負條件 / H 資訊揭露 / I 溝通規則 / J 回合結構 /
                    K 座位 / L 出局處置 / M 主題外皮 */
(function (root) {
  'use strict';

  var CARDS = [
    // ───────── 參數型：改數值／開關 ─────────
    // ⚠ 起始 1 點時必須同時把空過懲罰歸零，否則「畏縮一次就死」＝這張卡自己跟自己打架
    //   （窮舉測試抓到的：它一張就擋掉 26 組組合）
    { id: 'chips_1', name: '一擊必殺', dim: 'F', kind: '參數', online: true, from: 'student', seen: 3,
      patch: { startChips: 1, defendIdlePenalty: 0 }, desc: '起始自尊只有 1 點，被打中就出局；畏縮不再自扣。',
      mda: 'M→D：容錯歸零時，玩家從「經營消耗」變成「不敢出手」，觀望成為主流。' },
    { id: 'chips_20', name: '拉長對局', dim: 'F', kind: '參數', online: true, from: 'student', seen: 3,
      patch: { startChips: 20 }, desc: '起始自尊 20 點，局勢變化更慢。',
      mda: 'M→D：血量池變厚，單次失誤不致命，玩家更敢實驗與背叛。' },
    { id: 'solo_hard', name: '單挑更痛', dim: 'C', kind: '參數', online: true, from: 'student', seen: 5,
      patch: { soloDamage: 3 }, desc: 'SOLO 從扣 1 變成扣 3。',
      mda: 'M→D：單幹變得划算，聯手的誘因下降，結盟談判會明顯變少。' },
    { id: 'team_hard', name: '聯手更痛', dim: 'C', kind: '參數', online: true, from: 'student', seen: 5,
      patch: { teamDamagePerAttacker: 4 }, desc: 'TEAM 每位攻擊者讓目標扣 4。',
      mda: 'M→D：圍剿收益暴增，場上會迅速形成「集火同一人」的共識。' },
    { id: 'team_mob', name: '一人也算聯手', dim: 'D', kind: '參數', online: true, from: 'student', seen: 5,
      patch: { teamMinAttackers: 1 }, desc: 'TEAM 不再需要有人跟進，一個人打也生效。',
      mda: 'M→D：拿掉「需要協調」這個前提，TEAM 退化成加強版 SOLO，社交層直接消失。' },
    { id: 'team_square', name: '非線性霸凌曲線', dim: 'D', kind: '參數', online: true, from: 'gap', seen: 0,
      patch: { teamCurve: 'square' }, desc: 'TEAM 傷害改成人數的平方：2 人 4、3 人 9、4 人 16。',
      mda: 'M→D：協同效應從線性變指數，公開討論時的從眾與恐慌性跟風會被極端放大。' },
    { id: 'team_diminish', name: '人多反而沒效率', dim: 'D', kind: '參數', online: true, from: 'gap', seen: 0,
      patch: { teamCurve: 'diminish' }, desc: 'TEAM 傷害邊際遞減，加入的人越多、每個人貢獻越小。',
      mda: 'M→D：獎勵「剛好足夠的小團體」而非全體圍剿，會長出多個小聯盟而不是一面倒。' },
    { id: 'team_penalty', name: '空放要付代價', dim: 'D', kind: '參數', online: true, from: 'student', seen: 2,
      patch: { teamSoloPenalty: 2 }, desc: '打了 TEAM 卻沒人跟進，自己扣 2。',
      mda: 'M→D：把「喊話結盟」變成有風險的行為，逼出真正的事前溝通。' },
    { id: 'defend_strong', name: '畏縮更有效', dim: 'E', kind: '參數', online: true, from: 'student', seen: 14,
      patch: { defendDivisor: 4 }, desc: 'DEFEND 把傷害除以 4（原本除以 2）。',
      mda: 'M→D：防禦變強勢解，場面會慢下來，逼攻方改用多回合消耗。' },
    { id: 'defend_weak', name: '畏縮沒什麼用', dim: 'E', kind: '參數', online: true, from: 'student', seen: 14,
      patch: { defendDivisor: 1 }, desc: 'DEFEND 不再減傷，只剩「不被空過懲罰」的功能。',
      mda: 'M→D：移除安全選項，每回合都必須表態，衝突密度上升。' },
    { id: 'no_turtle', name: '不准龜', dim: 'E', kind: '參數', online: true, from: 'student', seen: 14,
      patch: { defendIdlePenalty: 3 }, desc: 'DEFEND 但沒人指定你 → 自扣 3。',
      mda: 'M→D：重罰縮頭，玩家被迫參與衝突，但也會製造「互相指定以免空過」的假打。' },
    { id: 'no_repeat', name: '不可連續出同一張', dim: 'A', kind: '參數', online: true, from: 'student', seen: 2,
      patch: { noRepeatAction: true }, desc: '相鄰兩回合不能打出同一張行動卡。',
      mda: 'M→D：破壞「一直防守」與「一直單挑」的定式，強制節奏變化。' },
    { id: 'decay', name: '縮圈', dim: 'F', kind: '參數', online: true, from: 'student', seen: 5,
      patch: { decayPerRound: 1, decayRamp: 1 }, desc: '每回合全體扣血，且越後面扣越多。',
      mda: 'M→D：給整局裝上碼表，拖延變成負收益，殘局會被強制推進。' },
    { id: 'round_cap', name: '回合上限比大小', dim: 'G', kind: '參數', online: true, from: 'student', seen: 3,
      patch: { maxRounds: 8 }, desc: '打滿 8 回合就結束，自尊最高的人獲勝。',
      mda: 'M→D：勝利條件從「活到最後」變成「保住最多」，防禦的價值整個翻轉。' },
    { id: 'last_one', name: '只有一個人能贏', dim: 'G', kind: '參數', online: true, from: 'student', seen: 9,
      patch: { winnersRemaining: 1 }, desc: '必須打到只剩一人。',
      mda: 'M→D：拿掉「並列生還」的出口，最後兩人一定要互相了結，背叛被強制發生。' },
    { id: 'anonymous', name: '匿名', dim: 'H', kind: '參數', online: true, from: 'student', seen: 8,
      patch: { anonymous: true }, desc: '不顯示玩家名字，只看得到顏色。',
      mda: 'M→A：拿掉人際包袱，出手變輕鬆——這正是學長姐說「跟不熟的人玩放不開」的解法。' },
    { id: 'fog', name: '盲打黑盒子', dim: 'H', kind: '結構', online: true, from: 'gap', seen: 0,
      patch: { hideChips: true, revealTargets: false }, desc: '自尊不公開，結算時也不告訴你誰打了誰。',
      mda: 'M→A：資訊不對稱直接長出猜疑美學；你只知道自己痛了，不知道被誰打。' },
    { id: 'timed_talk', name: '限時發言', dim: 'I', kind: '參數', online: true, from: 'student', seen: 3,
      patch: { discussSeconds: 30 }, desc: '每回合只有 30 秒討論時間，時間到就強制出牌。',
      mda: 'M→D：壓縮協商視窗，結盟只能靠喊短句，深度談判被排除。' },

    // ───────── 結構型模組：事先實作、可勾選 ─────────
    { id: 'comeback', name: '反擊', dim: 'E', kind: '結構', online: true, from: 'student', seen: 6,
      patch: { modComeback: true }, desc: 'DEFEND 時指定一人；若那人這回合正好攻擊你，他扣 1。',
      mda: 'M→D：防禦帶上讀心賭注，變成主動行為，「猜誰會打我」成為新的決策層。' },
    { id: 'redirect', name: '嫁禍', dim: 'E', kind: '結構', online: true, from: 'student', seen: 8,
      patch: { modRedirect: true }, desc: 'DEFEND 時指定一人，把自己這回合承受的傷害全部轉給他（不吃對方的減免）。',
      mda: 'M→D：被圍剿不再是死路，反而能借刀殺人，場上會出現「故意當靶」的策略。' },
    { id: 'guard', name: '協防', dim: 'A', kind: '結構', online: true, from: 'student', seen: 5,
      patch: { modGuard: true }, desc: 'DEFEND 時指定一人，那人這回合傷害減半。',
      mda: 'M→D：出現真正的利他行為，同盟從口頭承諾變成可驗證的動作。' },
    { id: 'vampire', name: '受擊吸血', dim: 'C', kind: '結構', online: true, from: 'student', seen: 5,
      patch: { modVampire: true }, desc: '被 TEAM 圍剿反而回血、被單人 SOLO 免傷、整回合沒被指定則自扣 2。',
      mda: 'M→D：把「被圍剿」從懲罰變成獎勵，徹底反轉集火邏輯，逼所有人重新學怎麼打。' },
    { id: 'drain', name: '攻擊吸血', dim: 'C', kind: '結構', online: true, from: 'student', seen: 5,
      patch: { modDrain: true }, desc: '造成傷害時，自己回復一半。',
      mda: 'M→D：攻擊變成續航手段，落後者更難翻盤，領先優勢被放大。' },
    { id: 'draw_target', name: '固定打右鄰', dim: 'B', kind: '結構', online: true, from: 'student', seen: 4,
      patch: { modDrawTarget: true }, desc: '不能自選目標，一律攻擊右邊那位。',
      mda: 'M→D：這張把「同時出牌＋自選目標」的猜心整個拿掉——學長姐叫它「抽鬼牌」。社交層歸零。' },
    { id: 'seat_ring', name: '座位權力環', dim: 'K', kind: '結構', online: true, from: 'gap', seen: 0,
      patch: { attackRange: 1 }, desc: '只能攻擊左右鄰座，隔座打不到。',
      mda: 'M→D：不加地圖，光是給座位拓樸意義，混亂的多人外交就收斂成局部博弈。' },
    { id: 'ghost', name: '幽靈', dim: 'L', kind: '結構', online: true, from: 'student', seen: 3,
      patch: { modGhost: true }, desc: '出局後不離場，仍可每回合出牌干擾，但不能被打、不能獲勝。',
      mda: 'M→A：消滅淘汰制的等待垃圾時間，但也讓殘局被無利害關係者攪動。' },
    { id: 'jury', name: '敗者陪審團', dim: 'L', kind: '結構', online: true, from: 'gap', seen: 0,
      patch: { modJury: true }, desc: '出局者每回合秘密預測「誰這回合傷最重」，猜中累積分數。',
      mda: 'M→A：把死者變成有自身利益的第三方觀眾，出局後仍有事可做、仍會喊話影響場面。' },
    { id: 'elements', name: '屬性相剋', dim: 'A', kind: '結構', online: true, from: 'student', seen: 3,
      patch: { modElements: true }, desc: '開局配石／剪／布，剋制對方傷害 ×2、被剋 ×0.5。',
      mda: 'M→D：加入一層與社交無關的硬計算，玩家開始「挑軟柿子」而非「挑討厭的人」。' },
    { id: 'events', name: '天災牌', dim: 'J', kind: '結構', online: true, from: 'student', seen: 6,
      patch: { modEvents: true }, desc: '每回合開場翻一張全域事件（禁止畏縮／單挑日／暴民日／飢荒／停戰）。',
      mda: 'M→D：規則本身每回合變動，長期策略失效，玩家被迫短線應變。' },

    // ───────── 換皮（只換字，不動規則） ─────────
    { id: 'theme_mol', name: '換皮：人生的意義', dim: 'M', kind: '參數', online: true, from: 'reference', seen: 7,
      patch: { theme: 'mol' }, desc: '小孩爭論人生意義，自尊變「論點」。取自 GDC 2010 的官方改編版。',
      mda: '換皮不動 D：結算完全一樣，但同一個動作從「抓花對方的臉」變成「反駁對方」，感受不同。' },
    { id: 'theme_charm', name: '換皮：魅力之爭', dim: 'M', kind: '參數', online: true, from: 'student', seen: 7,
      patch: { theme: 'charm' }, desc: '自尊變「魅力值」，武器變社交資產。學長姐的主題化作業。',
      mda: '換皮不動 D：驗證「只換敘事不換機制」時，玩家行為其實不會改變。' },
    { id: 'theme_money', name: '換皮：金庫爭奪', dim: 'M', kind: '參數', online: true, from: 'student', seen: 7,
      patch: { theme: 'money' }, desc: '自尊變「錢」，攻擊變偷竊。學長姐的主題化作業。',
      mda: '換皮不動 D：好的換皮會讓規則更好懂；壞的換皮會讓人以為規則變了。' },
    { id: 'theme_office', name: '換皮：辦公室政治', dim: 'M', kind: '參數', online: true, from: 'student', seen: 7,
      patch: { theme: 'office' }, desc: '自尊變「考績」，圍剿變聯署檢舉。',
      mda: '換皮不動 D：拿這張跟「魅力之爭」比，可以問學生為什麼有的皮比較貼。' },

    // ───────── 原本以為線上做不到、實際做得到的 7 張（2026-09-22 全部補上線上實作）─────────
    { id: 'blitz', name: '秒出', dim: 'I', kind: '參數', online: true, from: 'student', seen: 3,
      patch: { blitzSeconds: 5 }, desc: '倒數 5 秒內必須出牌，來不及就當空過。',
      mda: 'M→A：把思考時間壓到反射層，猜心退場、直覺上場——實體版「321 同時比手勢」的線上等價物。' },
    { id: 'whisper', name: '密謀私訊', dim: 'I', kind: '結構', online: true, from: 'student', seen: 4,
      patch: { modWhisper: true }, desc: '開放一對一私訊——直接違反原版「只能公開溝通」的限制。',
      mda: '原版明文禁止私下溝通，那是 SissyFight 的靈魂。拿掉之後才知道它撐住了什麼。' },
    { id: 'roles', name: '角色異能', dim: 'A', kind: '結構', online: true, from: 'student', seen: 12,
      patch: { modRoles: true }, desc: '開局配角色：硬皮／尖牙／煽動者／縮頭／替死鬼／路人，各有被動。',
      mda: '⚠ 這是學生最常提的一類（12 次），也是最典型的「內容加法」：加東西很爽，但底層動態常常沒變。值得當反例討論。' },
    { id: 'range2', name: '射程限制', dim: 'B', kind: '結構', online: true, from: 'student', seen: 4,
      patch: { attackRange: 2 }, desc: '只能攻擊座位距離 2 以內的人，遠的打不到。',
      mda: '把社交距離換成物理距離——問學生：這樣還是 SissyFight 嗎？' },
    { id: 'factions', name: '暗分兩隊', dim: 'H', kind: '結構', online: true, from: 'student', seen: 8,
      patch: { modFactions: true, winnersRemaining: 1 }, desc: '開局秘密分成 A／B 兩隊，最後場上只剩一隊時該隊全員獲勝。',
      mda: '⚠ 這是「硬塞成熟桌遊套路」的代表（狼人殺）。問學生：你是在改這個遊戲，還是換成另一個遊戲？' },
    { id: 'items', name: '一次性道具', dim: 'A', kind: '結構', online: true, from: 'student', seen: 8,
      patch: { modItems: true }, desc: '每人開局一張：鐵布衫（免傷）／腎上腺素（傷害×2）／棒棒糖（回 3）／搗嘴（作廢對方行動）。',
      mda: '同樣是內容加法。可以問：拿掉道具之後，這個改動還剩下什麼？' },
    { id: 'stack', name: '速度結算順序', dim: 'J', kind: '結構', online: true, from: 'student', seen: 2,
      patch: { modStack: true }, desc: '不再同時結算：依 DEFEND → SOLO → TEAM 依序套用，中途被打死的人攻擊會被取消。',
      mda: '⚠ 這張把「同時出牌」拆了——而同時出牌正是猜心的來源。看起來只是順序，影響卻最大。' }
  ];

  var DIM_NAMES = {
    A: '行動集合', B: '目標機制', C: '傷害數值', D: 'TEAM 曲線', E: 'DEFEND 機制',
    F: '籌碼', G: '勝負條件', H: '資訊揭露', I: '溝通規則', J: '回合結構',
    K: '座位結構', L: '出局處置', M: '主題外皮'
  };

  function byId(id) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i]; return null; }

  /* 把選到的卡合併成一組 CFG patch（後選的覆蓋先選的） */
  function merge(ids) {
    var patch = {};
    (ids || []).forEach(function (id) {
      var c = byId(id);
      if (!c || !c.online) return;
      for (var k in c.patch) if (Object.prototype.hasOwnProperty.call(c.patch, k)) patch[k] = c.patch[k];
    });
    return patch;
  }

  /* 卡與卡之間直接衝突（同一個 CFG key 被兩張卡設成不同值） */
  function conflicts(ids) {
    var seen = {}, out = [];
    (ids || []).forEach(function (id) {
      var c = byId(id);
      if (!c || !c.online) return;
      for (var k in c.patch) {
        if (!Object.prototype.hasOwnProperty.call(c.patch, k)) continue;
        if (seen[k] && seen[k].v !== c.patch[k])
          out.push('「' + seen[k].n + '」和「' + c.name + '」都在改同一個設定（' + k + '），後選的會蓋掉前面的');
        seen[k] = { n: c.name, v: c.patch[k] };
      }
    });
    return out;
  }

  root.SF3K_CARDS = { CARDS: CARDS, DIM_NAMES: DIM_NAMES, byId: byId, merge: merge, conflicts: conflicts };
})(typeof window !== 'undefined' ? window : globalThis);
