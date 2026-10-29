/* 走讀「療育小角落」：和小精靈玩，不計分、不存檔、不連網。
   手勢：點一下（彈跳）、來回搓揉（變開心冒愛心）、左右滑（被推著滾一下）、長按（呼嚕呼嚕）、放著不管（打瞌睡）。
   只用 emoji 與 CSS 動畫，不載入任何圖檔。用法：WalkPet.open()。 */
(function () {
  'use strict';
  var KINDS = [
    { id: 'lion', e: '🦁', n: '石獅寶寶', say: ['嗷嗚～', '再摸一下嘛', '我是來看門的…才怪', '好舒服喔'] },
    { id: 'fish', e: '🐟', n: '魚丸團子', say: ['咕嚕咕嚕', '我是軟綿綿的魚丸', '摸摸頭我就不刺人了', '啵啵啵'] },
    { id: 'bird', e: '🐤', n: '鳳凰花小鳥', say: ['啾啾！', '紅紅的花都開了', '我想睡了…', '再來再來'] },
    { id: 'cat', e: '🐱', n: '牛奶糖貓', say: ['喵嗚～', '嚕嚕嚕嚕', '這裡這裡', '你好溫柔'] }
  ];
  var st = { k: 0, open: false, rub: 0, idleT: null, holdT: null, purrT: null, lastX: 0, lastY: 0, lastDir: 0, path: 0, t0: 0, sx: 0, sy: 0, moved: 0 };
  var root = null, body = null, say = null, heartBox = null;
  function snd(n) { try { window.WalkSfx && WalkSfx.play(n); } catch (e) { } }
  function vib(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function K() { return KINDS[st.k]; }
  function css() {
    if (document.getElementById('walkPetCss')) return;
    var s = document.createElement('style'); s.id = 'walkPetCss';
    s.textContent = '#walkPet{position:fixed;inset:0;z-index:5000;background:linear-gradient(#fff4e0,#ffe0ec);display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;color:#5a3a3a}'
      + '#walkPet .wp-top{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;justify-content:space-between;gap:8px}'
      + '#walkPet button{border:2px solid #5a3a3a;background:#fff;border-radius:999px;padding:6px 14px;font-size:14px;color:#5a3a3a}'
      + '#walkPet .wp-body{font-size:min(46vw,200px);line-height:1;cursor:grab;transition:transform .18s ease;filter:drop-shadow(0 10px 8px rgba(120,60,60,.25));will-change:transform}'
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
      + '@media (prefers-reduced-motion:reduce){#walkPet .wp-body{animation:none!important}}';
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
  function wake() { if (st.idleT) clearTimeout(st.idleT); st.idleT = setTimeout(function () { if (!st.open) return; cls('sleep'); speak('zzZ…'); }, 15000); }
  function stopHold() { if (st.holdT) { clearTimeout(st.holdT); st.holdT = null; } if (st.purrT) { clearInterval(st.purrT); st.purrT = null; } }
  function down(ev) {
    if (!st.open) return; ev.preventDefault();
    try { body.setPointerCapture(ev.pointerId); } catch (e) { }
    st.sx = st.lastX = ev.clientX; st.sy = st.lastY = ev.clientY; st.t0 = Date.now(); st.path = 0; st.moved = 0; st.lastDir = 0; st.rub = 0; wake();
    stopHold();
    st.holdT = setTimeout(function () {
      if (st.moved > 14) { st.holdT = null; return; }
      cls('purr'); speak(pick(['呼嚕呼嚕呼嚕…', '嚕嚕嚕…好安心']));
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
    if (st.rub >= 3 && !has('happy')) { cls('happy'); speak(pick(K().say)); snd('pet'); vib(25); }
    if (st.rub >= 3 && st.path > 40) { st.path = 0; heart(1, ev.clientX, ev.clientY); }
    if (has('happy')) body.style.transform = 'translate(' + Math.max(-12, Math.min(12, (ev.clientX - st.sx) / 8)) + 'px,0)';
  }
  function up(ev) {
    if (!st.open || !st.t0) return;
    var dt = Date.now() - st.t0, dx = ev.clientX - st.sx, dy = ev.clientY - st.sy, dist = Math.sqrt(dx * dx + dy * dy);
    stopHold(); body.style.transform = '';
    var wasHappy = has('happy'), wasPurr = has('purr'); st.t0 = 0; wake();
    if (wasPurr) { cls(''); speak('欸嘿嘿～'); return; }
    if (wasHappy) { setTimeout(function () { cls(''); speak(pick(['好滿足～', '還要還要', '開心！'])); }, 700); return; }
    if (dist > 60 && dt < 450 && st.rub < 3) {
      body.style.setProperty('--wpdx', (dx > 0 ? 36 : -36) + 'px'); body.style.setProperty('--wpr', (dx > 0 ? 180 : -180) + 'deg'); body.style.setProperty('--wpr2', (dx > 0 ? 360 : -360) + 'deg');
      cls('roll'); setTimeout(function () { cls(''); speak(pick(['暈暈的～', '哇啊啊啊轉圈圈', '再丟一次！'])); }, 820); snd('hatch'); vib(30); return;
    }
    if (dist < 14 && dt < 400) { cls('bounce'); setTimeout(function () { cls(''); }, 520); speak(pick(K().say)); snd('npc'); vib(15); heart(1, ev.clientX, ev.clientY); return; }
    cls('');
  }
  function build() {
    css(); root = document.createElement('div'); root.id = 'walkPet'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '療育小角落');
    root.innerHTML = '<div class="wp-top"><button type="button" data-a="close">← 回遊戲</button><button type="button" data-a="next"></button></div><div class="wp-heartbox" style="position:absolute;inset:0;pointer-events:none"></div><div class="wp-body" tabindex="0" aria-label="小精靈，可以點、搓、滑、長按"></div><div class="wp-say"></div><div class="wp-hint">點一下、來回搓揉、左右滑、按住不放，都有不一樣的反應。不計分、不用做任務，放鬆一下就好。</div>';
    body = root.querySelector('.wp-body'); say = root.querySelector('.wp-say'); heartBox = root.querySelector('.wp-heartbox');
    body.addEventListener('pointerdown', down); body.addEventListener('pointermove', move); body.addEventListener('pointerup', up); body.addEventListener('pointercancel', up);
    body.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cls('bounce'); setTimeout(function () { cls(''); }, 520); speak(pick(K().say)); snd('npc'); var r = body.getBoundingClientRect(); heart(1, r.left + r.width / 2, r.top + r.height / 3); wake(); }
    });
    root.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a === 'close') close(); else if (a === 'next') { st.k = (st.k + 1) % KINDS.length; paint(); } });
    document.addEventListener('keydown', function (e) { if (st.open && e.key === 'Escape') close(); });
    document.body.appendChild(root);
  }
  function paint() { body.textContent = K().e; cls(''); root.querySelector('[data-a=next]').textContent = '換一隻（' + K().n + '）'; speak(pick(K().say)); wake(); }
  function open() { if (!root) build(); st.open = true; root.hidden = false; root.style.display = 'flex'; paint(); snd('start'); }
  function close() { st.open = false; stopHold(); if (st.idleT) clearTimeout(st.idleT); if (root) { root.style.display = 'none'; root.hidden = true; } }
  window.WalkPet = { open: open, close: close, kinds: KINDS };
})();
