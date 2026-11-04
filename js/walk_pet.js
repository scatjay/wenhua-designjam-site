/* 走讀「療育小角落」：和小精靈玩，不計分。小精靈在各景點有機率遇到並收養；對牠不好（粗魯對待、很久不理牠）牠會難過，嚴重時離家出走或放棄主人。存在這台裝置（localStorage），不連網。
   手勢：點一下（彈跳）、來回搓揉（變開心冒愛心）、左右滑（被推著滾一下）、長按（呼嚕呼嚕）、放著不管（打瞌睡）。
   只用 emoji 與 CSS 動畫，不載入任何圖檔。用法：WalkPet.open()。 */
(function () {
  'use strict';
  /* 物種表：id、emoji、名字、台詞；where＝在哪個景點有機會遇到（站點 id；沒列的是通用池）。lion 是見面禮 */
  var KINDS = [
    { id: 'lion', e: '🦁', n: '石獅寶寶', say: ['嗷嗚～', '再摸一下嘛', '我是來看門的…才怪', '好舒服喔'], where: ['t6'] },
    { id: 'fish', e: '🐟', n: '魚丸團子', say: ['咕嚕咕嚕', '我是軟綿綿的魚丸', '摸摸頭我就不刺人了', '啵啵啵'], where: [] },
    { id: 'bird', e: '🐤', n: '鳳凰花小鳥', say: ['啾啾！', '紅紅的花都開了', '我想睡了…', '再來再來'], where: ['tx'] },
    { id: 'cat', e: '🐱', n: '牛奶糖貓', say: ['喵嗚～', '嚕嚕嚕嚕', '這裡這裡', '你好溫柔'], where: ['t5'] },
    { id: 'owl', e: '🦉', n: '州會小貓頭鷹', say: ['咕咕～', '我在看書，你也一起嗎', '噓…我在聽', '翻頁翻頁'], where: ['t1'] },
    { id: 'dove', e: '🕊️', n: '圓環白鴿', say: ['咕咕咕', '飛一下再回來', '你坐旁邊就好', '安靜也很好'], where: ['t2'] },
    { id: 'hog', e: '🦔', n: '磚牆小刺蝟', say: ['縮成一團', '我其實很軟', '別怕，我不扎人', '摸背可以'], where: ['t3'] },
    { id: 'crane', e: '🦢', n: '武德小白鵝', say: ['昂～', '站直直的', '今天也練功', '慢慢來'], where: ['t4'] },
    { id: 'turtle', e: '🐢', n: '赤崁小龜', say: ['慢慢走～', '我背著一座樓', '不急不急', '曬太陽好舒服'], where: ['t7'] },
    { id: 'squirrel', e: '🐿️', n: '吳園松鼠', say: ['沙沙沙', '藏起來藏起來', '這顆給你', '尾巴蓬蓬的'], where: ['t8'] },
    { id: 'butterfly', e: '🦋', n: '婦人館蝴蝶', say: ['輕輕輕輕', '停在你手上', '翅膀軟軟的', '花香香'], where: ['t9'] }
  ];
  var MAXPETS = 6, CAP_P = 0.45, SHINY_P = 0.05, HAP0 = 70;
  var U = { uid: '', toast: null }, S = null;
  function kind(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i]; return KINDS[0]; }
  function lsKey() { return 'walk_pets_' + (U.uid || 'guest'); }
  function load() {
    if (S) return S;
    try { S = JSON.parse(localStorage.getItem(lsKey()) || 'null'); } catch (e) { S = null; }
    if (!S || !S.pets) S = { pets: [], tried: {}, left: [], note: [] };
    return S;
  }
  function save() { try { localStorage.setItem(lsKey(), JSON.stringify(S)); } catch (e) { } }
  function say0(m) { try { U.toast && U.toast(m); } catch (e) { } }
  function dayNow() { return Math.floor(Date.now() / 86400000); }
  /* 每次打開／回到遊戲時結算：久沒理牠會慢慢難過；太低可能離家出走；離家的過了一天，有機會自己回來，否則就放棄主人了 */
  function tick() {
    var s = load(), now = Date.now(), msgs = [];
    s.pets.slice().forEach(function (p) {
      var k = kind(p.sp), nm = (p.shiny ? '✨' : '') + k.n;
      if (p.away) {
        if (now - p.away >= 86400000) {
          if (Math.random() < 0.6) { p.away = 0; p.hap = 50; p.last = now; msgs.push('🏠 ' + nm + ' 自己回來了，有點不好意思。對牠好一點喔。'); }
          else { s.pets.splice(s.pets.indexOf(p), 1); s.left.push({ sp: p.sp, t: now, why: '放棄主人' }); msgs.push('💔 ' + nm + ' 不回來了…牠找到新的主人了。'); }
        }
        return;
      }
      var days = Math.max(0, dayNow() - (p.lastDay === undefined ? dayNow() : p.lastDay));
      if (days > 0) { p.hap = Math.max(0, p.hap - 12 * days); p.lastDay = dayNow(); }
      var age = (now - p.born) / 86400000;
      if (p.hap === 0 && days >= 5 && age >= 3) { s.pets.splice(s.pets.indexOf(p), 1); s.left.push({ sp: p.sp, t: now, why: '放棄主人' }); msgs.push('💔 ' + nm + ' 等了好久，離開了。牠放棄了主人。'); return; }
      if (p.hap <= 20 && age >= 2 && Math.random() < 0.4) { p.away = now; msgs.push('🧳 ' + nm + ' 離家出走了！留了張紙條：「我需要靜一靜」。過一天牠也許會回來。'); return; }
      if (p.hap <= 40 && !p.warned) { p.warned = 1; msgs.push('🥺 ' + nm + ' 看起來有點難過，來摸摸牠吧。'); }
      if (p.hap > 40) p.warned = 0;
    });
    save(); msgs.forEach(say0); return msgs;
  }
  /* 抵達景點時擲骰：這一站每人只擲一次；機率抓到本站物種（已養過就不再抓）。小機率閃亮版 */
  function roll(stationId) {
    var s = load(); if (!stationId || s.tried[stationId]) return null; s.tried[stationId] = Date.now();
    var pool = KINDS.filter(function (k) { return k.where.indexOf(stationId) >= 0; });
    if (!pool.length) { var gen = KINDS.filter(function (k) { return !k.where.length; }); pool = gen.length ? gen : [KINDS[1]]; }
    var k = pool[0], got = null;
    if (!s.pets.some(function (p) { return p.sp === k.id; }) && s.pets.length < MAXPETS && Math.random() < CAP_P) {
      got = { sp: k.id, hap: HAP0, born: Date.now(), last: Date.now(), lastDay: dayNow(), shiny: Math.random() < SHINY_P ? 1 : 0, away: 0, warned: 0, rolls: [] };
      s.pets.push(got); say0('🐾 遇到了「' + (got.shiny ? '✨閃亮的' : '') + k.n + '」，牠跟上你了！到隊伍頁的療育小角落看牠。'); try { window.WalkSfx && WalkSfx.play('hatch'); } catch (e) { }
    } else if (s.pets.some(function (p) { return p.sp === k.id; })) { var mine = s.pets.filter(function (p) { return p.sp === k.id; })[0]; mine.hap = Math.min(100, mine.hap + 6); say0('🐾 ' + k.n + ' 在這裡跟你打招呼。'); }
    save(); return got;
  }
  function init(o) { U.uid = (o && o.uid) || U.uid; if (o && o.toast) U.toast = o.toast; S = null; load(); if (!S.pets.length && !S.gift) { S.gift = 1; S.pets.push({ sp: 'lion', hap: HAP0, born: Date.now(), last: Date.now(), lastDay: dayNow(), shiny: 0, away: 0, warned: 0, rolls: [] }); save(); } return tick(); }
  function owned() { return load().pets.filter(function (p) { return !p.away; }); }
  var st = { k: 0, sel: null, open: false, rub: 0, idleT: null, holdT: null, purrT: null, lastX: 0, lastY: 0, lastDir: 0, path: 0, t0: 0, sx: 0, sy: 0, moved: 0 };
  var root = null, body = null, say = null, heartBox = null, room = null, actor = null;
  function snd(n) { try { window.WalkSfx && WalkSfx.play(n); } catch (e) { } }
  function vib(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function cur() { var o = owned(); if (!o.length) return null; if (st.k >= o.length) st.k = 0; return o[st.k]; }
  function K() { var c = cur(); return c ? kind(c.sp) : KINDS[0]; }
  function css() {
    if (document.getElementById('walkPetCss')) return;
    var s = document.createElement('style'); s.id = 'walkPetCss';
    s.textContent = '#walkPet{position:fixed;inset:0;z-index:5000;background:linear-gradient(#fff4e0,#ffe0ec);display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;color:#5a3a3a}'
      + '#walkPet .wp-top{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;justify-content:space-between;gap:8px}'
      + '#walkPet button{border:2px solid #5a3a3a;background:#fff;border-radius:999px;padding:6px 14px;font-size:14px;color:#5a3a3a}'
      + '#walkPet .wp-body{font-size:min(46vw,200px);line-height:1;cursor:grab;transition:transform .18s ease,scale .15s ease,translate .22s ease,rotate .22s ease;filter:drop-shadow(0 10px 8px rgba(120,60,60,.25));will-change:transform;animation:wpBreath 4s ease-in-out infinite;transform-origin:50% 90%}'
      + '#walkPet .wp-body[data-press="1"]{scale:.94}'
      + '#walkPet .wp-shadow{width:min(32vw,130px);height:14px;border-radius:50%;background:rgba(90,50,50,.2);margin-top:-4px;filter:blur(3px);transition:transform .2s ease}'
      + '#walkPet .wp-actor:has(.wp-body.bounce) .wp-shadow,#walkPet .wp-actor:has(.wp-body.jump) .wp-shadow{animation:wpShHop .6s ease}#walkPet .wp-actor:has(.wp-body.happy) .wp-shadow{animation:wpShSway .6s ease-in-out infinite}'
      + '#walkPet .wp-room{position:relative;width:100%;max-width:560px;height:min(50vh,400px);overflow:hidden;border-radius:18px;background:linear-gradient(#ffeccf 0,#ffe3c2 58%,#d9a46a 58%,#c68b50 100%);box-shadow:inset 0 -10px 24px rgba(90,50,30,.18)}'
      + '#walkPet .wp-room:before{content:"";position:absolute;left:0;right:0;top:58%;bottom:0;background:repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 2px,transparent 2px 56px)}'
      + '#walkPet .wp-room:after{content:"";position:absolute;left:0;right:0;top:57%;height:6px;background:#a9743f;opacity:.55}'
      + '#walkPet .wp-deco{position:absolute;line-height:1;pointer-events:none;translate:-50% -100%}'
      + '#walkPet .wp-actor{position:absolute;display:flex;flex-direction:column;align-items:center;translate:-50% -100%;transform-origin:50% 100%;transition:scale .3s ease}'
      + '#walkPet .wp-flip{transform:scaleX(var(--dir,1));transition:transform .2s ease}#walkPet .wp-bob{display:block}'
      + '#walkPet .wp-actor.walking .wp-bob{animation:wpWalk .42s ease-in-out infinite}'
      + '#walkPet .wp-room .wp-body{font-size:min(28vw,120px)}'
      + '@keyframes wpWalk{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}'
      + '#walkPet .wp-body.pat{animation:wpPat .7s ease}#walkPet .wp-body.tickle{animation:wpTickle .7s ease}#walkPet .wp-body.shy{animation:wpShy 1.1s ease}#walkPet .wp-body.wakeup{animation:wpWake 1s ease}#walkPet .wp-body.jump{animation:wpJump .9s cubic-bezier(.3,1.6,.5,1)}#walkPet .wp-body.look{animation:wpLook 2.2s ease-in-out}#walkPet .wp-body.yawn{animation:wpYawn 2s ease-in-out}#walkPet .wp-body.sad{animation:wpSad 4s ease-in-out infinite;filter:saturate(.6) drop-shadow(0 10px 8px rgba(120,60,60,.2))}'
      + '#walkPet .wp-body.bounce{animation:wpBounce .5s ease}#walkPet .wp-body.happy{animation:wpHappy .6s ease-in-out infinite}#walkPet .wp-body.roll{animation:wpRoll .8s ease}#walkPet .wp-body.purr{animation:wpPurr .12s linear infinite}#walkPet .wp-body.sleep{animation:wpSleep 3s ease-in-out infinite;opacity:.85}'
      + '#walkPet .wp-say{margin-top:14px;min-height:28px;font-size:18px;font-weight:700;text-align:center;padding:0 16px}'
      + '#walkPet .wp-hint{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;font-size:13px;opacity:.7;padding:0 16px}'
      + '#walkPet .wp-heart{position:absolute;pointer-events:none;font-size:26px;animation:wpHeart 1.2s ease-out forwards}'
      + '@keyframes wpBounce{0%{transform:scale(1,1)}25%{transform:scale(1.18,.82)}55%{transform:scale(.9,1.14) translateY(-26px)}100%{transform:scale(1,1)}}'
      + '@keyframes wpHappy{0%,100%{transform:rotate(-6deg) scale(1.04)}50%{transform:rotate(6deg) scale(1.1)}}'
      + '@keyframes wpRoll{0%{transform:translateX(0) rotate(0)}50%{transform:translateX(var(--wpdx,40px)) rotate(var(--wpr,180deg))}100%{transform:translateX(0) rotate(var(--wpr2,360deg))}}'
      + '@keyframes wpPurr{0%{transform:translate(0,0)}25%{transform:translate(1.5px,-1px)}50%{transform:translate(-1.5px,1px)}75%{transform:translate(1px,1px)}100%{transform:translate(0,0)}}'
      + '@keyframes wpSleep{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97)}}'
      + '@keyframes wpHeart{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translateY(-110px) scale(1.2)}}'
      + '@keyframes wpBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.975)}}'
      + '@keyframes wpShHop{0%,100%{transform:scale(1)}50%{transform:scale(.6);opacity:.6}}@keyframes wpShSway{0%,100%{transform:translateX(-5px)}50%{transform:translateX(5px)}}'
      + '@keyframes wpPat{0%{transform:scale(1,1)}30%{transform:scale(1.08,.8) translateY(8px)}60%{transform:scale(.97,1.05)}100%{transform:scale(1,1)}}'
      + '@keyframes wpTickle{0%,100%{transform:rotate(0)}15%{transform:rotate(-9deg) scale(1.05)}30%{transform:rotate(9deg) scale(1.05)}45%{transform:rotate(-7deg)}60%{transform:rotate(7deg)}80%{transform:rotate(-3deg)}}'
      + '@keyframes wpShy{0%{transform:scale(1)}25%{transform:scale(.82,.88) translateX(-10px)}60%{transform:scale(.86,.9) translateX(-10px)}100%{transform:scale(1)}}'
      + '@keyframes wpWake{0%{transform:scale(1,.9)}20%{transform:scale(1.12,1.12) translateY(-22px)}45%{transform:scale(.95,1.1)}70%{transform:scale(1.06,.94)}100%{transform:scale(1,1)}}'
      + '@keyframes wpJump{0%{transform:scale(1,1)}20%{transform:scale(1.15,.8)}50%{transform:scale(.9,1.15) translateY(-60px) rotate(8deg)}80%{transform:scale(1.1,.88) rotate(-4deg)}100%{transform:scale(1,1)}}'
      + '@keyframes wpLook{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-14px) rotate(-5deg)}60%{transform:translateX(14px) rotate(5deg)}}'
      + '@keyframes wpYawn{0%,100%{transform:scale(1)}40%,60%{transform:scale(1.1,1.06) translateY(-6px)}}'
      + '@keyframes wpSad{0%,100%{transform:scale(1,.96) translateY(6px)}50%{transform:scale(1,.94) translateY(9px)}}'
      + '@media (prefers-reduced-motion:reduce){#walkPet .wp-body,#walkPet .wp-shadow{animation:none!important}}';
    document.head.appendChild(s);
  }
  function heart(n, x, y, ch) {
    var box = heartBox.getBoundingClientRect();
    for (var i = 0; i < n; i++) {
      var h = document.createElement('span'); h.className = 'wp-heart'; h.textContent = ch || pick(['💗', '💖', '✨', '🌸']);
      h.style.left = (x - box.left + (Math.random() * 60 - 30)) + 'px'; h.style.top = (y - box.top - 10) + 'px'; h.style.animationDelay = (i * 80) + 'ms';
      heartBox.appendChild(h); (function (el) { setTimeout(function () { el.remove(); }, 1500); })(h);
    }
  }
  function has(c) { return body.className.indexOf(c) > 0; }
  function cls(c) { body.className = 'wp-body' + (c ? ' ' + c : ''); }
  function speak(t) { say.textContent = t; }
  function hearts(h) { var n = Math.round(h / 20), o = ''; for (var i = 0; i < 5; i++) o += i < n ? '❤️' : '🤍'; return o; }
  function mood(h) { return h >= 80 ? '超開心' : h >= 55 ? '心情不錯' : h >= 40 ? '普通' : h >= 21 ? '有點難過' : '很難過，快理牠'; }
  function showHap() { var c = cur(), el = root.querySelector('.wp-hap'); if (!c) { el.textContent = ''; return; } el.textContent = hearts(c.hap) + '　' + mood(c.hap); }
  /* 連續狂點遞減：十秒內互動越多次，每次加的心情越少（避免一直戳就刷滿）；同時累積「親密連擊」，夠多會有一次特別的開心 */
  function care(d) { var c = cur(); if (!c) return; var now = Date.now(); st.recent = (st.recent || []).filter(function (t) { return now - t < 10000; }); if (d > 0) { d = Math.max(0.3, d * (1 - st.recent.length * 0.12)); st.recent.push(now); combo(); } c.hap =Math.max(0, Math.min(100, c.hap + d)); c.last = Date.now(); c.lastDay = dayNow(); save(); showHap(); }
  /* 粗魯對待：一分鐘內被甩（滑動滾）超過三次，牠會暈、會生氣，心情大扣 */
  function rough() { var c = cur(); if (!c) return false; var now = Date.now(); c.rolls = (c.rolls || []).filter(function (t) { return now - t < 60000; }); c.rolls.push(now); if (c.rolls.length > 3) { care(-10); return true; } care(1); return false; }
  /* 親密連擊：八秒內溫柔互動滿 6 次，小精靈跳起來灑一圈愛心，之後冷卻 20 秒 */
  function combo() {
    var now = Date.now(); st.cb = (st.cb || []).filter(function (t) { return now - t < 8000; }); st.cb.push(now);
    if (st.cb.length >= 6 && now - (st.cbAt || 0) > 20000) {
      st.cbAt = now; st.cb = []; var r = body.getBoundingClientRect();
      setTimeout(function () { if (!st.open) return; cls('jump'); speak(pick(['最喜歡你了！', '我今天超幸福～', '再陪我一下下好不好'])); snd('hatch'); vib([20, 40, 20]); heart(8, r.left + r.width / 2, r.top + r.height / 3); setTimeout(function () { if (has('jump')) cls(''); }, 950); }, 350);
    }
  }
  /* 房間裡走動：actor 的 left／top 是腳底位置（百分比），越靠上（越遠）越小；走路時身體上下彈、依方向翻面。
     自己會逛、走到碗邊吃、走到床邊睡；點地板牠會走過來；被碰到就停下來。心情差時走得慢、不太想動 */
  var SPOTS = [{ x: 78, y: 86, tag: 'bowl' }, { x: 26, y: 86, tag: 'bed' }, { x: 50, y: 70, tag: 'mid' }, { x: 84, y: 68, tag: 'plant' }];
  var BED = { x: 26, y: 86 };
  function walking() { return !!(actor && actor.classList.contains('walking')); }
  function setPos(x, y, ms) {
    actor.style.transition = ms ? 'left ' + ms + 'ms linear,top ' + ms + 'ms linear,scale .3s ease' : 'scale .3s ease';
    actor.style.left = x + '%'; actor.style.top = y + '%'; actor.style.scale = (0.72 + 0.28 * Math.max(0, Math.min(1, (y - 62) / 30))).toFixed(2); actor.style.zIndex = Math.round(y); st.pos = { x: x, y: y };
  }
  function walkTo(x, y, done) {
    var rr = room.getBoundingClientRect(), dx = (x - st.pos.x) / 100 * rr.width, dy = (y - st.pos.y) / 100 * rr.height, dist = Math.sqrt(dx * dx + dy * dy), low = hapNow() <= 40;
    var ms = Math.max(450, dist / (low ? 38 : 80) * 1000);
    if (Math.abs(dx) > 6) actor.querySelector('.wp-flip').style.setProperty('--dir', dx > 0 ? 1 : -1);
    if (st.walkT) clearTimeout(st.walkT);
    actor.classList.add('walking'); setPos(x, y, ms);
    st.walkT = setTimeout(function () { st.walkT = null; actor.classList.remove('walking'); if (done) done(); }, ms);
  }
  /* 被碰到：停在原地（把動畫中的位置量下來固定住） */
  function freeze() {
    if (!actor) return; if (st.walkT) { clearTimeout(st.walkT); st.walkT = null; }
    if (walking()) {
      var a = actor.getBoundingClientRect(), r = room.getBoundingClientRect();
      var x = Math.max(6, Math.min(94, (a.left + a.width / 2 - r.left) / r.width * 100)), y = Math.max(62, Math.min(94, (a.bottom - r.top) / r.height * 100));
      actor.classList.remove('walking'); setPos(x, y, 0);
    }
  }
  function wander() {
    if (st.wanderT) clearTimeout(st.wanderT);
    st.wanderT = setTimeout(function () {
      if (!st.open) return;
      var busy = st.still || st.t0 || walking() || has('sleep') || body.className !== 'wp-body' && !has('sad');
      if (!busy) {
        var sp = Math.random() < 0.35 ? SPOTS[Math.floor(Math.random() * SPOTS.length)] : null;
        var x = sp ? sp.x : 14 + Math.random() * 72, y = sp ? sp.y : 64 + Math.random() * 26;
        walkTo(x, y, function () {
          if (sp && sp.tag === 'bowl') { cls('bounce'); speak(pick(['ㄘㄨㄘㄨ…好吃', '吃飽飽', '碗碗碗'])); snd('tick'); setTimeout(function () { cls(hapNow() <= 40 ? 'sad' : ''); }, 520); }
          else if (sp && sp.tag === 'bed') { cls('yawn'); speak('窩一下下…'); setTimeout(function () { if (has('yawn')) cls(hapNow() <= 40 ? 'sad' : ''); }, 2100); }
          else if (sp && sp.tag === 'plant') { cls('look'); speak('這盆草好香'); setTimeout(function () { if (has('look')) cls(hapNow() <= 40 ? 'sad' : ''); }, 2200); }
        });
      }
      wander();
    }, 2500 + Math.random() * 3500);
  }
  /* 閒置：有時東張西望、打哈欠、小跳一下；15 秒後打瞌睡，睡著時飄 Z。碰牠會先嚇一跳再伸懶腰 */
  function idleLife() {
    if (st.lifeT) clearTimeout(st.lifeT);
    st.lifeT = setTimeout(function () {
      if (!st.open) return;
      if (!has('sleep') && !has('sad') && !st.t0 && !walking() && body.className === 'wp-body') {
        var a = pick(['look', 'look', 'yawn', 'bounce']); cls(a); var h = hapNow();
        speak(a === 'look' ? pick(['咦？那是什麼', '東看看西看看']) : a === 'yawn' ? '啊～好想睡' : pick(K().say));
        setTimeout(function () { if (has(a)) cls(h <= 40 ? 'sad' : ''); }, a === 'bounce' ? 520 : 2100);
      }
      idleLife();
    }, 5000 + Math.random() * 4000);
  }
  function hapNow() { var c = cur(); return c ? c.hap : 100; }
  function wake() {
    if (st.idleT) clearTimeout(st.idleT); if (st.zT) { clearInterval(st.zT); st.zT = null; }
    st.idleT = setTimeout(function () {
      if (!st.open) return;
      /* 累了：自己走回床邊再睡（心情太差就直接原地睡） */
      if (!st.still && hapNow() > 20 && room) { freeze(); walkTo(BED.x, BED.y, function () { if (st.open && !st.t0) fallAsleep(); }); return; }
      fallAsleep();
    }, 15000);
  }
  function fallAsleep() {
      cls('sleep'); speak('zzZ…');
      st.zT = setInterval(function () { if (!st.open || !has('sleep')) return; var r = body.getBoundingClientRect(); heart(1, r.left + r.width * 0.7, r.top + r.height * 0.25, pick(['💤', 'Z', 'z'])); }, 1400);
  }
  function stopHold() { if (st.holdT) { clearTimeout(st.holdT); st.holdT = null; } if (st.purrT) { clearInterval(st.purrT); st.purrT = null; } }
  function down(ev) {
    if (!st.open) return; ev.preventDefault();
    try { body.setPointerCapture(ev.pointerId); } catch (e) { }
    st.sx = st.lastX = ev.clientX; st.sy = st.lastY = ev.clientY; st.t0 = Date.now(); st.path = 0; st.moved = 0; st.lastDir = 0; st.rub = 0;
    freeze(); st.woke = has('sleep'); body.dataset.press = '1';
    if (st.woke) { cls('wakeup'); speak('ㄏ！？'); snd('npc'); vib(25); }
    wake();
    stopHold();
    st.holdT = setTimeout(function () {
      if (st.moved > 14) { st.holdT = null; return; }
      cls('purr'); speak(pick(['呼嚕呼嚕呼嚕…', '嚕嚕嚕…好安心'])); care(4);
      st.purrT = setInterval(function () { vib(18); snd('tick'); heart(1, st.lastX, st.lastY - 40, '💤'); }, 700);
    }, 650);
  }
  function move(ev) {
    if (!st.open || !st.t0) return;
    var dx = ev.clientX - st.lastX, dy = ev.clientY - st.lastY, d = Math.sqrt(dx * dx + dy * dy);
    st.lastX = ev.clientX; st.lastY = ev.clientY; st.path += d; st.moved = Math.max(st.moved, Math.abs(ev.clientX - st.sx) + Math.abs(ev.clientY - st.sy));
    var dir = dx > 1 ? 1 : (dx < -1 ? -1 : 0);
    if (dir && st.lastDir && dir !== st.lastDir) st.rub++;
    if (dir) st.lastDir = dir;
    if (st.moved > 14 && st.holdT) { stopHold(); if (has('purr')) cls(''); }
    if (st.woke) return;
    /* 身體跟著手指微微傾斜、靠過去（用獨立的 translate／rotate 屬性，不跟動畫打架） */
    var r0 = body.getBoundingClientRect(), cx = r0.left + r0.width / 2 - parseFloat(body.style.translate || 0), ox = Math.max(-1, Math.min(1, (ev.clientX - cx) / (r0.width / 2)));
    body.style.translate = (ox * 10).toFixed(1) + 'px 0'; body.style.rotate = (ox * 4).toFixed(1) + 'deg';
    if (st.rub >= 3 && !has('happy')) { cls('happy'); speak(pick(K().say)); snd('pet'); vib(25); care(3); }
    /* 搓得越快，愛心冒得越密；加上輕輕的震動 */
    var need = Math.max(24, 70 - d * 4);
    if (st.rub >= 3 && st.path > need) { st.path = 0; heart(d > 14 ? 2 : 1, ev.clientX, ev.clientY); if (Math.random() < 0.3) vib(8); }
  }
  function up(ev) {
    if (!st.open || !st.t0) return;
    var dt = Date.now() - st.t0, dx = ev.clientX - st.sx, dy = ev.clientY - st.sy, dist = Math.sqrt(dx * dx + dy * dy);
    stopHold(); body.style.transform = ''; delete body.dataset.press; body.style.translate = ''; body.style.rotate = '';
    var wasHappy = has('happy'), wasPurr = has('purr'), woke = st.woke; st.t0 = 0; st.woke = false; wake();
    if (woke) { setTimeout(function () { if (!st.open) return; cls(''); speak(pick(['嗯…你來啦', '啊～睡得好舒服', '剛剛夢到你了'])); }, 1000); return; }
    if (wasPurr) { cls(''); speak(pick(['欸嘿嘿～', '再摸一下下嘛', '好想睡喔…'])); heart(2, ev.clientX, ev.clientY - 30, '💗'); return; }
    if (wasHappy) { setTimeout(function () { cls(''); speak(pick(['好滿足～', '還要還要', '開心！'])); }, 700); return; }
    if (dist > 60 && dt < 450 && st.rub < 3) {
      body.style.setProperty('--wpdx', (dx > 0 ? 36 : -36) + 'px'); body.style.setProperty('--wpr', (dx > 0 ? 180 : -180) + 'deg'); body.style.setProperty('--wpr2', (dx > 0 ? 360 : -360) + 'deg');
      var bad = rough(); cls('roll'); setTimeout(function () { cls(''); speak(bad ? pick(['頭好暈…不要再甩我了', '你這樣我會生氣喔', '嗚…好用力']) : pick(['暈暈的～', '哇啊啊啊轉圈圈', '再丟一次！'])); }, 820); snd(bad ? 'fail' : 'hatch'); vib(30); return;
    }
    if (dist < 14 && dt < 400) {
      var rb = body.getBoundingClientRect(), fy = (ev.clientY - rb.top) / rb.height, c = cur(), low = c && c.hap <= 40, k = K();
      /* 心情低落：先縮一下，不太敢靠近；多摸幾次才慢慢放鬆 */
      if (low && Math.random() < 0.6) { cls('shy'); setTimeout(function () { cls('sad'); }, 1100); speak(pick(['…（往後縮了一下）', '…你是來摸我的嗎', '我現在不太想說話'])); snd('tick'); vib(10); care(2); return; }
      if (fy < 0.33) { cls('pat'); setTimeout(function () { cls(low ? 'sad' : ''); }, 720); speak(pick(['頭頂最舒服了', '嗯～摸頭', '別把我頭髮弄亂啦']).replace('頭髮', k.id === 'fish' ? '圓圓的頭' : '毛')); snd('pet'); vib([12, 30, 12]); heart(2, ev.clientX, ev.clientY, '💗'); care(2); return; }
      if (fy > 0.7) { cls('tickle'); setTimeout(function () { cls(low ? 'sad' : ''); }, 720); speak(pick(['哈哈哈好癢！', '那裡不行啦～', '噗哈哈哈'])); snd('hatch'); vib([10, 20, 10, 20, 10]); heart(3, ev.clientX, ev.clientY, '✨'); care(2); return; }
      cls('bounce'); setTimeout(function () { cls(low ? 'sad' : ''); }, 520); speak(pick(k.say)); snd('npc'); vib(15); heart(1, ev.clientX, ev.clientY); care(1); return;
    }
    cls('');
  }
  function build() {
    css(); root = document.createElement('div'); root.id = 'walkPet'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '療育小角落');
    root.innerHTML = '<div class="wp-top"><button type="button" data-a="close">← 回遊戲</button><button type="button" data-a="next"></button></div><div class="wp-heartbox" style="position:absolute;inset:0;pointer-events:none"></div><div class="wp-room" aria-label="小精靈的房間，點地板牠會走過來"><span class="wp-deco" style="left:22%;top:44%;width:54px;height:62px;border:5px solid #b98b5a;border-radius:6px;background:linear-gradient(#bfe6ff,#e8f6ff);box-shadow:inset 0 0 0 2px #fff8"></span><span class="wp-deco" style="left:80%;top:36%;font-size:34px">🖼️</span><span class="wp-deco" style="left:14%;top:93%;font-size:46px;z-index:50">🛏️</span><span class="wp-deco" style="left:90%;top:70%;font-size:40px">🌿</span><span class="wp-deco" style="left:80%;top:91%;font-size:28px;z-index:50">🥣</span><div class="wp-actor"><div class="wp-flip"><div class="wp-bob"><div class="wp-body" tabindex="0" aria-label="小精靈，可以點、搓、滑、長按"></div></div></div><div class="wp-shadow"></div></div></div><div class="wp-hap" style="margin-top:8px;font-size:14px"></div><div class="wp-say"></div><div class="wp-hint">點一下、來回搓揉、左右滑、按住不放，都有不一樣的反應。不計分、不用做任務，放鬆一下就好。</div>';
    room = root.querySelector('.wp-room'); actor = root.querySelector('.wp-actor');
    /* 點地板：小精靈走過來（睡著或被固定時不理） */
    room.addEventListener('pointerdown', function (e) {
      if (e.target === body || body.contains(e.target) || !st.open || st.still || has('sleep') || st.t0) return;
      var r = room.getBoundingClientRect(), x = Math.max(8, Math.min(92, (e.clientX - r.left) / r.width * 100)), y = Math.max(64, Math.min(92, (e.clientY - r.top) / r.height * 100));
      freeze(); wake(); speak(pick(['來了來了～', '你在叫我嗎？', '等等我！']));
      walkTo(x, y, function () { if (!st.open || st.t0) return; cls('bounce'); setTimeout(function () { cls(hapNow() <= 40 ? 'sad' : ''); }, 520); speak(pick(K().say)); snd('npc'); heart(1, e.clientX, e.clientY - 60); care(1); });
    });
    body = root.querySelector('.wp-body'); say =root.querySelector('.wp-say'); heartBox = root.querySelector('.wp-heartbox');
    body.addEventListener('pointerdown', down); body.addEventListener('pointermove', move); body.addEventListener('pointerup', up); body.addEventListener('pointercancel', up);
    body.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cls('bounce'); setTimeout(function () { cls(''); }, 520); speak(pick(K().say)); snd('npc'); var r = body.getBoundingClientRect(); heart(1, r.left + r.width / 2, r.top + r.height / 3); wake(); }
    });
    root.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a === 'close') close(); else if (a === 'next') { st.k = st.k + 1; paint(); } });
    document.addEventListener('keydown', function (e) { if (st.open && e.key === 'Escape') close(); });
    document.body.appendChild(root);
  }
  function paint() {
    var c = cur(), o = owned(), nx = root.querySelector('[data-a=next]');
    if (!c) { body.textContent = '🏠'; cls(''); nx.style.display = 'none'; speak('小精靈們都出去玩了。到各個景點走走，也許會遇到新朋友。'); root.querySelector('.wp-hap').textContent = ''; return; }
    body.textContent = (c.shiny ? '✨' : '') + K().e; cls(c.hap <= 20 ? 'sleep' : c.hap <= 40 ? 'sad' : ''); nx.style.display = ''; nx.textContent = (o.length > 1 ? '換一隻（' : '（') + K().n + '，共 ' + o.length + ' 隻）';
    speak(c.hap <= 40 ? '…（牠看起來有點難過）' : pick(K().say)); showHap(); wake(); idleLife(); if (!actor.style.left) setPos(50, 78, 0); wander();
  }
  function open(uid) { if (uid) U.uid = uid; load(); tick(); if (!root) build(); st.open = true; root.hidden = false; root.style.display = 'flex'; paint(); snd('start'); }
  function close() { st.open = false; stopHold(); if (st.idleT) clearTimeout(st.idleT); if (st.lifeT) clearTimeout(st.lifeT); if (st.wanderT) clearTimeout(st.wanderT); freeze(); if (st.zT) { clearInterval(st.zT); st.zT = null; } if (root) { root.style.display = 'none'; root.hidden = true; } }
  window.WalkPet = { open: open, close: close, kinds: KINDS, init: init, roll: roll, tick: tick, owned: owned, _still: function (v) { st.still = !!v; }, _walking: walking, _state: function () { return load(); } };
})();
