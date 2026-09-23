/* SF3K 遊玩統計 — 從每回合的 choices + result.log 累計，純函數、可測試。
   這些數字就是 MDA 裡的 D（動態）：規則改了之後，大家實際上怎麼玩。
   學生寫回饋時要講「行為怎麼變」，這張表就是證據。 */
(function (root) {
  'use strict';

  /* rounds: { "1": {choices:{id:{action,target}}, result:{damage:{}, log:[]}}, "2": {...} }
     players: [{id,env,name,...}]
     回 { perPlayer:{id:{...}}, totals:{...}, highlights:[...] } */
  function tally(rounds, players) {
    var per = {}, totals = {
      roundsPlayed: 0, damageTotal: 0,
      solo: 0, team: 0, defend: 0,
      teamSuccess: 0, teamFizzle: 0,
      comeback: 0, redirect: 0, guard: 0, silence: 0, shield: 0
    };
    /* 🔴 taken 只算「別人打的」。DEFEND 空過自扣、沒出牌罰、縮圈 都要分開算，
       否則一直龜的人會被標成「挨最多／最常被集火」，那是假的（測試抓到過）。 */
    function blank(id, nm) {
      return { id: String(id), name: nm || ('#' + id),
        solo: 0, team: 0, defend: 0, noPlay: 0,
        dealt: 0, taken: 0, selfLoss: 0, envLoss: 0, healed: 0,
        targetedBy: 0, targetedOthers: 0,
        teamJoined: 0, teamFizzled: 0,
        focusedRounds: 0 };          // 這回合「被攻擊」掉最多的人
    }
    (players || []).forEach(function (p) { per[String(p.id)] = blank(p.id, p.name); });
    function touch(id) {
      id = String(id);
      if (!per[id]) per[id] = blank(id);
      return per[id];
    }

    Object.keys(rounds || {}).sort(function (a, b) { return (+a) - (+b); }).forEach(function (rn) {
      var R = rounds[rn];
      if (!R || !R.result) return;
      totals.roundsPlayed++;
      var ch = R.choices || {}, log = (R.result && R.result.log) || [], dmg = (R.result && R.result.damage) || {};

      Object.keys(ch).forEach(function (id) {
        var a = ch[id] && ch[id].action, p = touch(id);
        if (a === 'SOLO') { p.solo++; totals.solo++; }
        else if (a === 'TEAM') { p.team++; totals.team++; }
        else if (a === 'DEFEND') { p.defend++; totals.defend++; }
        if (ch[id] && ch[id].target && a !== 'DEFEND') {
          p.targetedOthers++;
          touch(ch[id].target).targetedBy++;
        }
      });

      var hitBy = {};                 // 這一回合「被攻擊」掉的量（不含自扣與縮圈）
      function hit(id, n) { id = String(id); hitBy[id] = (hitBy[id] || 0) + n; }

      log.forEach(function (e) {
        switch (e.t) {
          case 'solo':
            touch(e.from).dealt += e.dmg; hit(e.to, e.dmg); break;
          case 'team':
            totals.teamSuccess++;
            (e.from || []).forEach(function (a) {
              var q = touch(a); q.dealt += Math.floor(e.dmg / (e.n || 1)); q.teamJoined++;
            });
            hit(e.to, e.dmg);
            break;
          case 'team-fizzle':
            totals.teamFizzle++;
            (e.from || []).forEach(function (a) { touch(a).teamFizzled++; });
            break;
          case 'team-penalty': touch(e.to).selfLoss += e.dmg; break;
          case 'comeback': totals.comeback++; touch(e.from).dealt += e.dmg; hit(e.to, e.dmg); break;
          case 'redirect': totals.redirect++; touch(e.from).dealt += e.dmg; hit(e.to, e.dmg); break;
          case 'role-martyr': touch(e.from).dealt += e.dmg; hit(e.to, e.dmg); break;
          case 'guard': totals.guard++; break;
          case 'item-silence': totals.silence++; break;
          case 'item-shield-absorb': totals.shield++; break;
          case 'defend-idle': touch(e.to).selfLoss += e.dmg; break;
          case 'vampire-idle': touch(e.to).selfLoss += e.dmg; break;
          case 'no-play': touch(e.to).noPlay++; touch(e.to).selfLoss += e.dmg; break;
          case 'decay': touch(e.to).envLoss += e.dmg; break;
          case 'vampire-heal': case 'drain': case 'item-heal-apply':
            touch(e.to).healed += (e.heal || 0); break;
        }
      });

      // DEFEND 減傷之後實際掉的量，用 dmg 校正「被攻擊」的數字（上限不超過實際掉血）
      var top = null, best = 0;
      Object.keys(hitBy).forEach(function (id) {
        var actual = Math.max(0, dmg[id] || 0);
        var self = (per[id] ? per[id].selfLoss : 0);
        var fromAttack = Math.min(hitBy[id], actual);
        touch(id).taken += fromAttack;
        if (fromAttack > best) { best = fromAttack; top = id; }
      });
      Object.keys(dmg).forEach(function (id) { totals.damageTotal += Math.max(0, dmg[id] || 0); });
      if (top && best > 0) touch(top).focusedRounds++;
    });

    /* 🔴 有給 players 名單的話，只回報名單上的人（2026-09-23 觀戰者稽核）：touch() 會幫
       choices／log 裡出現的任何 id 自動開一列，所以「只把下場的人傳進來」原本擋不住觀戰者。
       被打的觀戰者不可能存在，但被當成目標的 id 若不在名單上，也不該出現在表上。 */
    if (players && players.length) {
      var keep = {};
      players.forEach(function (p) { keep[String(p.id != null ? p.id : p.env)] = 1; });
      Object.keys(per).forEach(function (k) { if (!keep[k]) delete per[k]; });
    }
    var arr = Object.keys(per).map(function (k) { return per[k]; });
    var hl = [];
    function top1(key, label, unit) {
      var s = arr.slice().filter(function (p) { return p[key] > 0; })
        .sort(function (a, b) { return b[key] - a[key]; });
      if (s.length) hl.push({ key: key, label: label, who: s[0].name, value: s[0][key], unit: unit || '' });
    }
    top1('dealt', '打最痛', '點');
    top1('taken', '挨最多', '點');
    top1('focusedRounds', '最常被集火', '回合');
    top1('defend', '最愛畏縮', '次');
    top1('teamJoined', '最常參與聯手', '次');
    top1('teamFizzled', '最常喊沒人跟', '次');

    totals.avgDamagePerRound = totals.roundsPlayed
      ? Math.round(totals.damageTotal / totals.roundsPlayed * 10) / 10 : 0;
    totals.teamTryTotal = totals.teamSuccess + totals.teamFizzle;
    totals.teamSuccessRate = totals.teamTryTotal
      ? Math.round(totals.teamSuccess / totals.teamTryTotal * 100) : null;
    var acts = totals.solo + totals.team + totals.defend;
    if (acts) {                                   // 最後一項用 100 減，避免四捨五入變成 101%
      var ps = Math.round(totals.solo / acts * 100);
      var pt = Math.round(totals.team / acts * 100);
      totals.actionMix = { solo: ps, team: pt, defend: 100 - ps - pt };
    } else totals.actionMix = { solo: 0, team: 0, defend: 0 };

    return { perPlayer: per, list: arr, totals: totals, highlights: hl };
  }

  /* 一句話總結，給學生當寫回饋的起點（不是替他們寫結論，是指出數字在哪） */
  function readOut(st, L) {
    L = L || { solo: 'SOLO', team: 'TEAM', defend: 'DEFEND' };
    var t = st.totals, out = [];
    if (!t.roundsPlayed) return [];
    out.push('打了 ' + t.roundsPlayed + ' 回合，場上總共掉了 ' + t.damageTotal +
             ' 點（平均每回合 ' + t.avgDamagePerRound + ' 點）。');
    out.push('出牌比例：' + L.solo + ' ' + t.actionMix.solo + '%、' +
             L.team + ' ' + t.actionMix.team + '%、' + L.defend + ' ' + t.actionMix.defend + '%。');
    if (t.teamTryTotal) {
      out.push('聯手喊了 ' + t.teamTryTotal + ' 次，' + t.teamSuccess + ' 次真的湊到人（成功率 ' +
               t.teamSuccessRate + '%）' + (t.teamSuccessRate <= 50 ? '——大家講歸講，沒真的配合。' : '——串通得還不錯。'));
    }
    var selfTot = st.list.reduce(function (s, p) { return s + p.selfLoss; }, 0);
    if (selfTot) out.push('其中 ' + selfTot + ' 點是自己扣的（畏縮沒人理、或沒出牌）。');
    if (t.comeback) out.push('反擊成功 ' + t.comeback + ' 次。');
    if (t.redirect) out.push('嫁禍成功 ' + t.redirect + ' 次。');
    if (t.guard) out.push('有人幫別人擋了 ' + t.guard + ' 次。');
    return out;
  }

  root.SF3K_STATS = { tally: tally, readOut: readOut };
})(typeof window !== 'undefined' ? window : globalThis);
