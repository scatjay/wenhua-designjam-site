/* 走讀遊戲：印尼文介面（字典 js/walk_i18n_id.js，Vertex Batch 翻譯）。
   換字方式：整段相符優先，其次用最長片段取代；每個文字節點只換一次（WeakMap 記住換好的值），MutationObserver 追動態畫面。
   切換語言＝存 localStorage 後重新載入（換回中文時原文才會回來）。使用者輸入的值不動。 */
(function () {
  'use strict';
  var LS = 'designjam_lang', lang = 'zh';   /* 與其他學習單頁共用同一把鍵：選過印尼文，每一頁都跟著 */
  try { lang = localStorage.getItem(LS) === 'id' ? 'id' : 'zh'; } catch (e) {}
  var CJK = /[㐀-鿿]/;
  var D = window.WALK_I18N_ID || {}, keys = Object.keys(D).sort(function (a, b) { return b.length - a.length; });
  var done = new WeakMap();

  function tr(s) {
    if (!CJK.test(s)) return s;
    var t = s.trim();
    if (D[t] !== undefined) return s.replace(t, function () { return D[t]; });
    var out = s;
    for (var i = 0; i < keys.length; i++) { var k = keys[i]; if (k.length >= 2 && out.indexOf(k) >= 0) out = out.split(k).join(D[k]); }
    /* 單字量詞（字典只收 2 字以上，免得誤換到暱稱）：數字後面的「次」「人」 */
    out = out.replace(/(\d+)\s*次/g, '$1×').replace(/(\d+)\s*人/g, '$1 orang');
    return out;
  }
  function textNode(n) {
    var v = n.nodeValue; if (done.get(n) === v) return;
    var nv = tr(v); if (nv !== v) n.nodeValue = nv; done.set(n, nv);
  }
  function attrs(el) {
    ['placeholder', 'title', 'aria-label', 'alt'].forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v && CJK.test(v)) { var nv = tr(v); if (nv !== v) el.setAttribute(a, nv); } });
  }
  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1) return;
    var tag = root.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') { if (tag === 'TEXTAREA') attrs(root); return; }
    if (tag === 'OPTION' && !root.hasAttribute('value')) root.setAttribute('value', root.textContent);   /* 先把原文固定成 value，翻了選項文字也不會改到程式拿到的值 */
    attrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  function labelBtns() {
    [].forEach.call(document.querySelectorAll('.lang'), function (b) {
      var tx = lang === 'id' ? '🌐 中文' : '🌐 Indonesia';
      if (b.textContent !== tx) b.textContent = tx;   /* 只在不同時才寫，避免觸發 MutationObserver 迴圈 */
      b.onclick = function () { try { localStorage.setItem(LS, lang === 'id' ? 'zh' : 'id'); } catch (e) {} location.reload(); };
    });
  }
  function init() {
    labelBtns();
    if (lang !== 'id' || !keys.length) return;
    document.documentElement.lang = 'id';
    document.title = tr(document.title);
    walk(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
        else [].forEach.call(m.addedNodes, walk);
      });
      labelBtns();
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.WalkLang = { lang: function () { return lang; }, bind: labelBtns };
})();
