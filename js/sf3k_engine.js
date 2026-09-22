/* SF3K 規則引擎 v2 — 純函數，所有規則由 CFG 驅動；一張卡＝一組 CFG patch。
   規則正本：01_SF3K_Rules.doc（SiSSYFiGHT 3000，GDC Game Design Workshop 簡化版）
   卡池來源：歷屆 226 筆學生改動（4 平台 11 門課）分群成 24 類 ＋ 4 張補強卡（補學生忽略的維度）
   🔴 本檔不碰 DOM、不碰 Firebase，才能被 node 測試腳本直接跑。
   🔴 resolve() 必須是決定性的：同一組 (players, choices, cfg) 永遠得到同一結果，
      否則各 client 自己算會分歧。任何隨機都要由房主先擲好、當成 cfg 傳進來。 */
(function (root) {
  'use strict';

  var DEFAULT_CFG = {
    // ═══ 參數型：改數值/開關，選了立刻生效 ═══
    startChips: 10,            // F 起始籌碼
    soloDamage: 1,             // C SOLO 傷害
    teamDamagePerAttacker: 2,  // C TEAM 每位攻擊者的傷害
    teamMinAttackers: 2,       // D TEAM 觸發門檻
    teamCurve: 'linear',       // D 'linear'=每人×n ｜ 'square'=n² ｜ 'diminish'=遞減
    teamSoloPenalty: 0,        // D 打 TEAM 但沒人跟進 → 自扣
    defendDivisor: 2,          // E DEFEND 減傷除數
    defendIdlePenalty: 1,      // E DEFEND 但沒被指定 → 自扣
    decayPerRound: 0,          // F 每回合全體扣（縮圈）
    decayRamp: 0,              // F 每過一回合，decay 再加這麼多
    winnersRemaining: 2,       // G 剩幾人時結束
    maxRounds: 0,              // G 回合上限，0=不限；到了比籌碼
    noRepeatAction: false,     // A 不可連續出同一張行動卡
    anonymous: false,          // H 隱藏玩家名稱，只留顏色
    hideChips: false,          // H 不公開他人籌碼
    revealTargets: true,       // H 揭牌時公開誰指定誰
    discussSeconds: 0,         // I 討論倒數秒數，0=不限時
    theme: 'sf3k',             // M 換皮

    // ═══ 結構型模組：事先實作，所以也能即時勾選組合 ═══
    modComeback: false,    // E 反擊：DEFEND 指定的人若攻擊你 → 他扣 1
    modRedirect: false,    // E 嫁禍：DEFEND 指定一人，把自己這回合的傷害全轉給他
    modGuard: false,       // A 協防：DEFEND 指定一人，那人傷害減半
    modVampire: false,     // C 受擊吸血：被 TEAM 指定回血、被 SOLO 指定免傷、沒被打自扣 2
    modDrain: false,       // C 攻擊吸血：造成傷害時自己回一半
    modDrawTarget: false,  // B 固定右鄰：目標不自選
    attackRange: 0,        // K 攻擊射程（座位距離），0=不限；1=只能打鄰座；2=隔一座也行
    modGhost: false,       // L 幽靈：出局後仍可出牌干擾，但不能被打、不能獲勝
    modJury: false,        // L 陪審團：出局者每回合預測「誰傷最重」，猜中累積分數
    modElements: false,    // A 屬性相剋：開局配屬性，剋制 ×2、被剋 ×0.5
    modEvents: false,      // J 天災：每回合翻一張全域事件（房主擲，寫進 roundEvent）
    modStack: false,       // J 速度結算：依 DEFEND→SOLO→TEAM 依序結算，中途出局者的行動會被取消
    modRoles: false,       // A 角色異能：開局配角色，各有被動
    modItems: false,       // A 道具：每人一張一次性道具，出牌時可同時使用
    modFactions: false,    // H 陣營：開局暗分兩隊，最後存活者同隊即共同獲勝
    modWhisper: false,     // I 私訊：開放一對一密談（引擎不管，UI 開頻道；原版明文禁止）
    blitzSeconds: 0,       // I/J 秒出：出牌倒數秒數，0=不限；時間到自動視為空過
    shuffleSeed: 0,        // 開局配發的位移（房主擲一次，寫進 DB，全員一致）

    // 房主擲好的每回合隨機（保持決定性）
    roundEvent: null,      // {key, label, patch:{...}}
    roundNo: 1
  };

  var THEMES = {
    sf3k:  { name: 'SiSSYFiGHT', chip: '自尊', solo: 'SOLO 單挑', team: 'TEAM 聯手', defend: 'DEFEND 畏縮', out: '出局' },
    mol:   { name: '人生的意義',       chip: '論點', solo: '個人反駁',  team: '群起圍剿',  defend: '換個說法', out: '說不出話' },
    charm: { name: '魅力之爭',         chip: '魅力', solo: '單獨下套',  team: '聯合排擠',  defend: '裝無辜',   out: '失寵' },
    money: { name: '金庫爭奪',         chip: '錢',   solo: '偷一筆',    team: '聯手洗劫',  defend: '藏起來',   out: '破產' },
    office:{ name: '辦公室政治',       chip: '考績', solo: '私下打小報告', team: '聯署檢舉', defend: '裝忙',   out: '被檢討' }
  };

  var EVENTS = [
    { key: 'none',      label: '風平浪靜',     patch: {} },
    { key: 'noDefend',  label: '禁止畏縮',     patch: { defendDivisor: 1, defendIdlePenalty: 2 } },
    { key: 'doubleSolo',label: '單挑日：SOLO ×2', patch: { soloDamage: 2 } },
    { key: 'mob',       label: '暴民日：TEAM 一人也算', patch: { teamMinAttackers: 1 } },
    { key: 'famine',    label: '飢荒：全體扣 1', patch: { decayPerRound: 1 } },
    { key: 'truce',     label: '停戰：傷害減半', patch: { soloDamage: 0, teamDamagePerAttacker: 1 } }
  ];

  var ELEMENTS = ['石', '剪', '布'];           // 石剋剪、剪剋布、布剋石

  // 角色異能（modRoles）：開局依座位輪流配發，各自一個被動
  var ROLES = [
    { key: 'thick', name: '硬皮',   desc: '受到的傷害 -1（最低 0）' },
    { key: 'fang',  name: '尖牙',   desc: '你的 SOLO 傷害 +1' },
    { key: 'agit',  name: '煽動者', desc: '你參與的 TEAM，該次總傷害 +2' },
    { key: 'turtle',name: '縮頭',   desc: 'DEFEND 時額外再減 1 傷' },
    { key: 'martyr',name: '替死鬼', desc: '你出局的那一回合，打你的人各扣 2' },
    { key: 'none',  name: '路人',   desc: '沒有異能' }
  ];

  // 一次性道具（modItems）：每人開局一張，出牌時可一起使用
  var ITEMS = [
    { key: 'shield', name: '鐵布衫', desc: '本回合完全免傷' },
    { key: 'double', name: '腎上腺素', desc: '本回合你造成的傷害 ×2' },
    { key: 'heal',   name: '棒棒糖', desc: '本回合結束後回復 3 點' },
    { key: 'silence',name: '搗嘴',   desc: '指定對象本回合的行動作廢' }
  ];

  function seatDist(a, b, n) {
    var d = Math.abs(a - b);
    return Math.min(d, n - d);                  // 環狀座位距離
  }

  function cfg(patch) {
    var c = {}, k;
    for (k in DEFAULT_CFG) c[k] = DEFAULT_CFG[k];
    if (patch) for (k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) c[k] = patch[k];
    return c;
  }

  /* 把房主擲出的當回合事件疊上去（只影響這一回合） */
  function withEvent(c) {
    if (!c.modEvents || !c.roundEvent || !c.roundEvent.patch) return c;
    var out = cfg(c), k, p = c.roundEvent.patch;
    for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) out[k] = p[k];
    return out;
  }

  function label(c) { return THEMES[c && c.theme] || THEMES.sf3k; }

  /* DEFEND 的目標欄只有一個，這三張卡都要用它 → 不能同時選 */
  function defendTargetMods(c) {
    return ['modRedirect', 'modGuard', 'modComeback'].filter(function (k) { return c[k]; });
  }

  /* 合法性檢查：擋掉玩不動或規則互相打架的組合 */
  function validate(c, nPlayers) {
    var p = [], L = label(c);
    if (nPlayers != null && nPlayers <= c.winnersRemaining)
      p.push('勝利人數(' + c.winnersRemaining + ') 不小於玩家數(' + nPlayers + ')，開局就結束了');
    if (c.startChips <= 0) p.push('起始' + L.chip + '必須大於 0');
    if (c.defendDivisor < 1) p.push('DEFEND 減傷除數必須 ≥ 1（小於 1 會變成加傷）');
    if (c.teamMinAttackers < 1) p.push('TEAM 觸發門檻必須 ≥ 1');
    if (c.soloDamage <= 0 && c.teamDamagePerAttacker <= 0 && c.decayPerRound <= 0 && !c.modVampire)
      p.push('SOLO、TEAM、縮圈都是 0，沒人會' + L.out + '，遊戲不會結束');
    if (c.teamMinAttackers === 1 && c.teamDamagePerAttacker >= c.startChips)
      p.push('TEAM 一人就生效、且傷害 ≥ 起始' + L.chip + '，第一回合就會有人直接' + L.out);
    if (c.defendIdlePenalty >= c.startChips)
      p.push('DEFEND 空過懲罰 ≥ 起始' + L.chip + '，畏縮一次就' + L.out);
    if (c.decayPerRound >= c.startChips)
      p.push('每回合縮圈 ≥ 起始' + L.chip + '，第一回合全滅');
    var dt = defendTargetMods(c);
    if (dt.length > 1)
      p.push('「反擊／嫁禍／協防」都要用 DEFEND 的目標欄，一次只能選一張（目前選了 ' + dt.length + ' 張）');
    if (c.modDrawTarget && c.attackRange > 0)
      p.push('「固定右鄰」與「射程限制」都在改目標規則，只能選一張');
    if (c.modDrawTarget && nPlayers != null && nPlayers < 3)
      p.push('固定右鄰至少要 3 人才有意義');
    if (c.attackRange > 0 && nPlayers != null && nPlayers < 4)
      p.push('射程限制至少要 4 人才看得出拓樸效果');
    if (c.attackRange > 0 && nPlayers != null && c.attackRange >= Math.floor(nPlayers / 2))
      p.push('射程 ' + c.attackRange + ' 在 ' + nPlayers + ' 人時等於沒有限制');
    if (c.modItems && c.modRoles)
      p.push('道具與角色異能同時開，新手會記不住；建議一次只加一種（這是教學判斷，不是技術限制）');
    if (c.modFactions && nPlayers != null && nPlayers < 4)
      p.push('陣營至少要 4 人才分得成兩隊');
    if (c.modFactions && c.winnersRemaining > 1)
      p.push('陣營模式的勝利條件由陣營決定，請把「剩幾人結束」設為 1');
    if (c.modVampire && c.modDrawTarget)
      p.push('吸血＋固定右鄰：每回合必定被指定，吸血的「沒被打自扣」永遠不會觸發');
    if (c.modGhost && c.modJury)
      p.push('幽靈與陪審團都在處理出局者，只能選一張');
    if (c.modJury && nPlayers != null && nPlayers < 4)
      p.push('陪審團要有人出局才有意義，至少 4 人');
    if (c.maxRounds && c.maxRounds < 2) p.push('回合上限至少 2');
    return { ok: p.length === 0, problems: p };
  }

  function teamDamage(n, c) {
    if (n < c.teamMinAttackers) return 0;
    if (c.teamCurve === 'square') return n * n;
    if (c.teamCurve === 'diminish') {           // 2,3,3.5… 遞減邊際
      var d = 0;
      for (var i = 1; i <= n; i++) d += c.teamDamagePerAttacker / i;
      return Math.floor(d);
    }
    return c.teamDamagePerAttacker * n;
  }

  function elemMul(a, b) {                       // a 攻擊 b
    if (a == null || b == null || a === b) return 1;
    var ia = ELEMENTS.indexOf(a), ib = ELEMENTS.indexOf(b);
    if (ia < 0 || ib < 0) return 1;
    return (ib === (ia + 1) % 3) ? 2 : 0.5;      // a 剋下一個
  }

  /* ═══ 結算 ═══
     players: [{id,color,chips,alive,lastAction,seat,element}]
     choices: { id:{action:'SOLO'|'TEAM'|'DEFEND', target:id|null, juryPick:id|null} } */
  function resolve(players, choices, cfgIn) {
    var c = withEvent(cfgIn || cfg());
    var live = players.filter(function (p) { return p.alive; });
    var actors = c.modGhost ? players.slice() : live;        // 幽靈也能出牌
    var byId = {}; players.forEach(function (p) { byId[p.id] = p; });
    var seatOf = {};
    players.forEach(function (p, i) { seatOf[p.id] = (p.seat == null ? i : p.seat); });

    var raw = {}, targeted = {}, illegal = {}, log = [], ch = {}, jury = {};
    live.forEach(function (p) { raw[p.id] = 0; targeted[p.id] = false; });

    var liveOrder = live.slice().sort(function (a, b) { return seatOf[a.id] - seatOf[b.id]; });
    function ringIdx(id) { return liveOrder.findIndex(function (x) { return x.id === id; }); }
    function inRange(fromId, toId) {
      if (!c.attackRange) return true;
      var i = ringIdx(fromId), j = ringIdx(toId);
      if (i < 0 || j < 0) return false;
      return seatDist(i, j, liveOrder.length) <= c.attackRange;
    }

    // ── 收有效出牌
    actors.forEach(function (p) {
      var x = choices[p.id];
      var isGhost = !p.alive;
      if (!x || !x.action) { if (!isGhost) illegal[p.id] = '沒有出牌'; return; }
      if (!isGhost && c.noRepeatAction && p.lastAction && p.lastAction === x.action) {
        illegal[p.id] = '不可連續出同一張行動卡'; return;
      }
      var tgt = x.target;
      if (x.action !== 'DEFEND') {
        if (c.modDrawTarget) {                                 // 固定右鄰
          var i0 = ringIdx(p.id);
          tgt = i0 >= 0 ? liveOrder[(i0 + 1) % liveOrder.length].id : (liveOrder[0] && liveOrder[0].id);
        }
        if (!tgt || !byId[tgt] || !byId[tgt].alive || tgt === p.id) {
          if (!isGhost) illegal[p.id] = '目標無效';
          return;
        }
        if (!inRange(p.id, tgt)) {
          if (!isGhost) illegal[p.id] = '超出射程（只能打距離 ' + c.attackRange + ' 以內的座位）';
          return;
        }
      }
      ch[p.id] = { action: x.action, target: (x.action === 'DEFEND' ? (x.target || null) : tgt),
                   ghost: isGhost, item: (c.modItems ? (x.item || null) : null),
                   itemTarget: (c.modItems ? (x.itemTarget || null) : null) };
    });

    // ── 陪審團預測（出局者，不造成傷害）
    if (c.modJury) {
      players.filter(function (p) { return !p.alive; }).forEach(function (p) {
        var x = choices[p.id];
        if (x && x.juryPick && byId[x.juryPick]) jury[p.id] = x.juryPick;
      });
    }

    // ⓪ 道具「搗嘴」：讓指定對象本回合行動作廢（先於所有結算）
    var shielded = {}, healed = {}, doubled = {};
    if (c.modItems) {
      // 🔴 先把要搗嘴的對象算完再一次刪。邊迭代邊 delete 會讓後面的 ch[id] 變 undefined 直接當機
      //    （2026-09-22 線上整合測試抓到，道具卡一開就爆）
      var toSilence = [];
      Object.keys(ch).forEach(function (id) {
        var x = ch[id];
        if (x && x.item === 'silence' && x.itemTarget && ch[x.itemTarget] && x.itemTarget !== id) {
          toSilence.push([id, x.itemTarget]);
        }
      });
      toSilence.forEach(function (pair) {
        if (!ch[pair[1]]) return;                 // 已被別人搗過就不重複
        delete ch[pair[1]];
        log.push({ t: 'item-silence', from: pair[0], to: pair[1] });
      });
      Object.keys(ch).forEach(function (id) {
        var it = ch[id] && ch[id].item;
        if (it === 'shield') { shielded[id] = true; log.push({ t: 'item-shield', to: id }); }
        if (it === 'heal') { healed[id] = true; log.push({ t: 'item-heal', to: id }); }
        if (it === 'double') { doubled[id] = true; log.push({ t: 'item-double', to: id }); }
      });
    }
    function roleOf(id) { return c.modRoles ? (byId[id] && byId[id].role) : null; }
    function outAmp(id, d) { return doubled[id] ? d * 2 : d; }

    // ① 標記被指定（無效的單人 TEAM 也算）
    Object.keys(ch).forEach(function (id) {
      var x = ch[id];
      if (x.action !== 'DEFEND' && x.target) targeted[x.target] = true;
    });

    // ② SOLO
    Object.keys(ch).forEach(function (id) {
      var x = ch[id];
      if (x.action !== 'SOLO') return;
      var d = c.soloDamage;
      if (roleOf(id) === 'fang') d += 1;
      if (c.modElements) d = Math.floor(d * elemMul(byId[id].element, byId[x.target].element));
      d = outAmp(id, d);
      raw[x.target] += d;
      log.push({ t: 'solo', from: id, to: x.target, dmg: d, ghost: x.ghost });
    });

    // ②b 速度結算：SOLO 先生效。被 SOLO 打到歸零的人，本回合的 TEAM 參與作廢（先手優勢）
    var stackDead = {};
    if (c.modStack) {
      live.forEach(function (p) {
        if (raw[p.id] >= p.chips) { stackDead[p.id] = true; log.push({ t: 'stack-cancel', to: p.id }); }
      });
    }

    // ③ TEAM
    var teamOn = {};
    Object.keys(ch).forEach(function (id) {
      if (ch[id].action !== 'TEAM') return;
      if (stackDead[id]) return;                     // 已在 SOLO 階段倒下 → 這一刀砍不出去
      (teamOn[ch[id].target] = teamOn[ch[id].target] || []).push(id);
    });
    Object.keys(teamOn).forEach(function (tid) {
      var atk = teamOn[tid], d = teamDamage(atk.length, c);
      if (d > 0) {
        if (c.modElements) {
          var mul = atk.reduce(function (s, a) { return s + elemMul(byId[a].element, byId[tid].element); }, 0) / atk.length;
          d = Math.floor(d * mul);
        }
        if (c.modRoles && atk.some(function (a) { return roleOf(a) === 'agit'; })) d += 2;
        if (atk.some(function (a) { return doubled[a]; })) d *= 2;
        raw[tid] += d;
        log.push({ t: 'team', from: atk, to: tid, dmg: d, n: atk.length });
      } else {
        log.push({ t: 'team-fizzle', from: atk, to: tid, n: atk.length });
        if (c.teamSoloPenalty > 0) atk.forEach(function (a) {
          if (raw[a] != null) { raw[a] += c.teamSoloPenalty; log.push({ t: 'team-penalty', to: a, dmg: c.teamSoloPenalty }); }
        });
      }
    });

    // ④ 攻擊吸血：造成多少傷害，自己回一半
    if (c.modDrain) {
      var dealt = {};
      log.forEach(function (e) {
        if (e.t === 'solo') dealt[e.from] = (dealt[e.from] || 0) + e.dmg;
        if (e.t === 'team') e.from.forEach(function (a) { dealt[a] = (dealt[a] || 0) + Math.floor(e.dmg / e.n); });
      });
      Object.keys(dealt).forEach(function (a) {
        if (raw[a] == null) return;
        var heal = Math.floor(dealt[a] / 2);
        if (heal > 0) { raw[a] -= heal; log.push({ t: 'drain', to: a, heal: heal }); }
      });
    }

    // ⑤ 受擊吸血
    if (c.modVampire) {
      live.forEach(function (p) {
        var id = p.id, s = 0, tm = 0;
        Object.keys(ch).forEach(function (o) {
          if (ch[o].target !== id || ch[o].action === 'DEFEND') return;
          if (ch[o].action === 'SOLO') s++;
          if (ch[o].action === 'TEAM') tm++;
        });
        if (tm >= c.teamMinAttackers) {
          var h = Math.floor(tm * 1.5); raw[id] -= h;
          log.push({ t: 'vampire-heal', to: id, heal: h, n: tm });
        } else if (s > 0) {
          raw[id] -= c.soloDamage * s; log.push({ t: 'vampire-immune', to: id, n: s });
        } else if (!targeted[id]) {
          raw[id] += 2; log.push({ t: 'vampire-idle', to: id, dmg: 2 });
        }
      });
    }

    // ⑥ 協防：DEFEND 指定一人 → 那人傷害減半
    if (c.modGuard) {
      Object.keys(ch).forEach(function (id) {
        var x = ch[id];
        if (x.action !== 'DEFEND' || !x.target || raw[x.target] == null) return;
        if (raw[x.target] > 0) {
          var before = raw[x.target];
          raw[x.target] = Math.floor(before / 2);
          log.push({ t: 'guard', from: id, to: x.target, before: before, after: raw[x.target] });
        }
      });
    }

    // ⑦ DEFEND 本體（含嫁禍）
    var dmg = {};
    live.forEach(function (p) { dmg[p.id] = raw[p.id]; });
    Object.keys(ch).forEach(function (id) {
      var x = ch[id];
      if (x.action !== 'DEFEND' || x.ghost) return;
      if (c.modRedirect && x.target && raw[x.target] != null && targeted[id] && raw[id] > 0) {
        dmg[x.target] = (dmg[x.target] || 0) + raw[id];
        log.push({ t: 'redirect', from: id, to: x.target, dmg: raw[id] });
        dmg[id] = 0;
        return;
      }
      if (targeted[id]) {
        var pos = Math.max(0, raw[id]), neg = Math.min(0, raw[id]);
        dmg[id] = Math.floor(pos / c.defendDivisor) + neg;
        if (roleOf(id) === 'turtle') dmg[id] = Math.max(0, dmg[id] - 1);
        log.push({ t: 'defend', to: id, before: raw[id], after: dmg[id] });
      } else {
        dmg[id] = c.defendIdlePenalty;
        log.push({ t: 'defend-idle', to: id, dmg: c.defendIdlePenalty });
      }
    });

    // ⑧ 反擊
    if (c.modComeback) {
      Object.keys(ch).forEach(function (id) {
        var x = ch[id];
        if (x.action !== 'DEFEND' || !x.target) return;
        var o = ch[x.target];
        if (o && o.action !== 'DEFEND' && o.target === id && dmg[x.target] != null) {
          dmg[x.target] += 1;
          log.push({ t: 'comeback', from: id, to: x.target, dmg: 1 });
        }
      });
    }

    // ⑧b 角色被動與道具收尾：硬皮減傷、鐵布衫免傷、棒棒糖回血、替死鬼反噬
    if (c.modRoles || c.modItems) {
      live.forEach(function (p) {
        var id = p.id;
        if (dmg[id] == null) return;
        if (c.modRoles && roleOf(id) === 'thick' && dmg[id] > 0) {
          dmg[id] = Math.max(0, dmg[id] - 1);
          log.push({ t: 'role-thick', to: id });
        }
        if (c.modItems && shielded[id] && dmg[id] > 0) {
          log.push({ t: 'item-shield-absorb', to: id, blocked: dmg[id] });
          dmg[id] = 0;
        }
        if (c.modItems && healed[id]) { dmg[id] -= 3; log.push({ t: 'item-heal-apply', to: id, heal: 3 }); }
      });
      if (c.modRoles) {
        live.forEach(function (p) {
          if (roleOf(p.id) !== 'martyr') return;
          if ((dmg[p.id] || 0) < p.chips) return;              // 這回合沒被打死就不觸發
          Object.keys(ch).forEach(function (o) {
            if (ch[o].action !== 'DEFEND' && ch[o].target === p.id && dmg[o] != null) {
              dmg[o] += 2;
              log.push({ t: 'role-martyr', from: p.id, to: o, dmg: 2 });
            }
          });
        });
      }
    }


    // ⑨ 縮圈（全體）
    var decay = c.decayPerRound + c.decayRamp * Math.max(0, (c.roundNo || 1) - 1);
    if (decay > 0) live.forEach(function (p) {
      dmg[p.id] = (dmg[p.id] || 0) + decay;
      log.push({ t: 'decay', to: p.id, dmg: decay });
    });

    // ⑩ 沒出牌／違規 → 空過懲罰
    Object.keys(illegal).forEach(function (id) {
      if (dmg[id] == null) return;
      dmg[id] += c.defendIdlePenalty;
      log.push({ t: 'no-play', to: id, dmg: c.defendIdlePenalty, why: illegal[id] });
    });

    // ⑪ 陪審團計分：猜中「本回合傷最重」
    var juryHit = {};
    if (c.modJury && Object.keys(jury).length) {
      var top = null, best = -1;
      Object.keys(dmg).forEach(function (id) { if (dmg[id] > best) { best = dmg[id]; top = id; } });
      Object.keys(jury).forEach(function (j) {
        juryHit[j] = (best > 0 && jury[j] === top);
        log.push({ t: 'jury', from: j, pick: jury[j], hit: juryHit[j], actual: top });
      });
    }

    return { damage: dmg, targeted: targeted, log: log, illegal: illegal,
             choices: ch, jury: jury, juryHit: juryHit, effCfg: c };
  }

  function apply(players, res, cfgIn) {
    var c = withEvent(cfgIn || cfg());
    return players.map(function (p) {
      var out = {}, k;
      for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) out[k] = p[k];
      if (res.juryHit && res.juryHit[p.id]) out.juryScore = (p.juryScore || 0) + 1;
      if (!p.alive) return out;
      var d = res.damage[p.id] || 0;
      out.chips = Math.max(0, Math.min(c.startChips, p.chips - d));
      out.alive = out.chips > 0;
      out.lastAction = res.choices[p.id] ? res.choices[p.id].action : p.lastAction;
      return out;
    });
  }

  /* 結束判定。回 {over, why, winners:[id]} */
  function outcome(players, cfgIn) {
    var c = cfgIn || cfg();
    var live = players.filter(function (p) { return p.alive; });
    if (c.modFactions) {
      var fac = {};
      live.forEach(function (p) { (fac[p.faction] = fac[p.faction] || []).push(p.id); });
      var keys = Object.keys(fac);
      if (keys.length <= 1)
        return { over: true, why: 'faction', winners: keys.length ? fac[keys[0]] : [], faction: keys[0] || null };
      if (c.maxRounds && (c.roundNo || 1) >= c.maxRounds) {
        var sum = {};
        live.forEach(function (p) { sum[p.faction] = (sum[p.faction] || 0) + p.chips; });
        var best = keys.sort(function (a, b) { return sum[b] - sum[a]; })[0];
        return { over: true, why: 'faction-rounds', winners: fac[best], faction: best };
      }
      return { over: false, why: null, winners: [] };
    }
    if (live.length <= c.winnersRemaining)
      return { over: true, why: 'survivors', winners: live.map(function (p) { return p.id; }) };
    if (c.maxRounds && (c.roundNo || 1) >= c.maxRounds) {
      var top = Math.max.apply(null, live.map(function (p) { return p.chips; }));
      return { over: true, why: 'rounds',
               winners: live.filter(function (p) { return p.chips === top; }).map(function (p) { return p.id; }) };
    }
    return { over: false, why: null, winners: [] };
  }

  function isOver(players, c) { return outcome(players, c).over; }

  /* 房主每回合擲事件（只有房主呼叫，結果寫進 DB，其他人讀同一份） */
  function drawEvent(rnd) {
    var i = Math.floor((rnd == null ? Math.random() : rnd) * EVENTS.length) % EVENTS.length;
    return EVENTS[i];
  }

  /* 開局配發：屬性／角色／道具／陣營。全部依座位輪流發，決定性、不用隨機。
     shuffle 參數（房主擲的 0..1）只用來決定起始位移，讓每局不同但仍可重現。 */
  function setup(players, c) {
    c = c || cfg();
    var n = players.length;
    var off = Math.floor((c.shuffleSeed == null ? 0 : c.shuffleSeed) * n) % (n || 1);
    return players.map(function (p, i) {
      var o = {}, k;
      for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) o[k] = p[k];
      var j = (i + off) % n;
      if (c.modElements) o.element = ELEMENTS[j % ELEMENTS.length];
      if (c.modRoles) o.role = ROLES[j % ROLES.length].key;
      if (c.modItems) o.item = ITEMS[j % ITEMS.length].key;
      if (c.modFactions) o.faction = (j % 2 === 0) ? 'A' : 'B';
      return o;
    });
  }
  function assignElements(players) { return setup(players, cfg({ modElements: true })); }

  root.SF3K = {
    DEFAULT_CFG: DEFAULT_CFG, THEMES: THEMES, EVENTS: EVENTS, ELEMENTS: ELEMENTS,
    ROLES: ROLES, ITEMS: ITEMS,
    cfg: cfg, label: label, validate: validate, defendTargetMods: defendTargetMods,
    teamDamage: teamDamage, elemMul: elemMul, seatDist: seatDist, withEvent: withEvent,
    resolve: resolve, apply: apply, outcome: outcome, isOver: isOver,
    drawEvent: drawEvent, setup: setup, assignElements: assignElements
  };
})(typeof window !== 'undefined' ? window : globalThis);
