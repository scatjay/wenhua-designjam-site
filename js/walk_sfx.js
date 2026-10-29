/* 走讀音效：全部用 WebAudio 即時合成，不載入任何音檔（檔案只有這支 JS）。16 位元遊戲風：方波與三角波，音量小、音很短。
   與登入畫面共用同一個靜音旗標 localStorage 'walk_sfx'（'0'＝關）。瀏覽器規定要先有使用者操作才能出聲，第一次點擊或按鍵後才會響。
   用法：WalkSfx.play('ok')；WalkSfx.forToast(訊息) 會依訊息開頭自動選音效。 */
(function () {
  'use strict';
  var ctx = null, master = null, on = true, unlocked = false, last = {};
  try { on = localStorage.getItem('walk_sfx') !== '0'; } catch (e) { }
  function ensure() {
    if (ctx) return true;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination); return true; } catch (e) { return false; }
  }
  function unlock() { if (!ensure()) return; if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } } unlocked = true; }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  var N = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  /* [波形, 起始音高, 開始秒, 長度秒, 音量, 滑到的音高（可省）] */
  var FX = {
    tick:   [['square', N(88), 0, .035, .05]],
    ok:     [['square', N(72), 0, .07, .09], ['square', N(76), .07, .07, .09], ['square', N(79), .14, .14, .09]],
    frag:   [['square', N(72), 0, .08, .1], ['square', N(76), .08, .08, .1], ['square', N(79), .16, .08, .1], ['square', N(84), .24, .26, .11], ['triangle', N(60), .24, .26, .12]],
    arrive: [['triangle', N(79), 0, .1, .14], ['triangle', N(72), .1, .22, .14]],
    fail:   [['square', N(64), 0, .12, .08, N(52)], ['square', N(56), .12, .16, .08, N(45)]],
    hint:   [['triangle', N(88), 0, .06, .1], ['triangle', N(93), .06, .1, .1]],
    npc:    [['square', N(79), 0, .05, .06], ['square', N(84), .05, .08, .06]],
    buy:    [['square', N(83), 0, .06, .09], ['square', N(90), .06, .2, .09]],
    pet:    [['triangle', N(84), 0, .07, .1, N(90)], ['triangle', N(88), .08, .09, .08, N(96)]],
    hatch:  [['square', N(72), 0, .06, .08], ['square', N(79), .06, .06, .08], ['square', N(84), .12, .06, .08], ['square', N(91), .18, .22, .09]],
    start:  [['triangle', N(60), 0, .1, .12], ['triangle', N(67), .1, .1, .12], ['triangle', N(72), .2, .24, .12]]
  };
  function play(name) {
    if (!on || !unlocked || !ctx || document.hidden || !FX[name]) return;
    var now = performance.now(); if (last[name] && now - last[name] < 70) return; last[name] = now;
    try {
      var t0 = ctx.currentTime + 0.005;
      FX[name].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), s = t0 + n[2], d = n[3];
        o.type = n[0]; o.frequency.setValueAtTime(n[1], s); if (n[5]) o.frequency.exponentialRampToValueAtTime(n[5], s + d);
        g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(n[4], s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
        o.connect(g); g.connect(master); o.start(s); o.stop(s + d + 0.03);
      });
    } catch (e) { }
  }
  /* 依訊息開頭選音效；沒有對應的就不出聲 */
  function forToast(m) {
    m = String(m || '');
    if (/^🧩/.test(m)) return play('frag');
    if (/^(✔|🎉)/.test(m)) return play(/買|解鎖|升/.test(m) ? 'buy' : 'ok');
    if (/^📍/.test(m)) return play('arrive');
    if (/^⏱/.test(m)) return play('start');
    if (/^(點數不夠|買不成|還不太對|傳不出去|讀取失敗|這個角色已被挑走|只有隊長)/.test(m)) return play('fail');
    if (/^慢一點/.test(m)) return play('tick');
  }
  function setOn(v) { on = !!v; try { localStorage.setItem('walk_sfx', on ? '1' : '0'); } catch (e) { } if (on) { unlock(); play('tick'); } }
  /* 主要導覽與按鈕的輕輕一聲 */
  document.addEventListener('click', function (e) { var t = e.target && e.target.closest && e.target.closest('#nav button, .btn'); if (t) play('tick'); }, true);
  window.WalkSfx = { play: play, forToast: forToast, setOn: setOn, isOn: function () { return on; }, names: Object.keys(FX) };
})();
