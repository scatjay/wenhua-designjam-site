/* 走讀情報卡總表：合併 walk_data_intel_a.js（中西區九案）與 walk_data_intel_b.js（南臺校園），並統一讀取程度標籤。
   四種可信度：有出處（官方或新聞頁，已讀）、摘要級（只讀工具摘要）、待查證（查無、單一來源、互相矛盾，或方位未現場核對）、
   工坊創作（人物問法、觀察提示等遊戲設計內容，沒有史實主張）。 */
(function () {
  'use strict';
  var A = window.WALK_INTEL_A || [], B = window.WALK_INTEL_B || [], out = [], seen = {}, i, c, made;
  function norm(x) {
    made = x.type === '人物' || /^工坊創作/.test(x.source || '') || /工坊創作人物|路線檔便條台詞/.test(x.source || '');
    return {
      id: x.id, chapter: x.chapter, type: x.type, text: x.text, source: x.source,
      level: made ? '工坊創作' : x.level, tags: x.tags, rarity: x.rarity
    };
  }
  for (i = 0; i < A.length; i++) { c = norm(A[i]); if (!seen[c.id]) { seen[c.id] = 1; out.push(c); } }
  for (i = 0; i < B.length; i++) { c = norm(B[i]); if (!seen[c.id]) { seen[c.id] = 1; out.push(c); } }
  window.WALK_INTEL = out;
})();
