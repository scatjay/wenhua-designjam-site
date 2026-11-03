/* 走讀：探員歷史專長（資料來源 knowledge/tainan_walk/AGENT_HISTORY_1029.json，文史顧問第一版；由 test_tools/gen_walk_agent_era.js 產生）。
   eras＝專精時期（3 級，每人 1 個）、famEras＝熟悉時期（2 級，每人最多 2 個）；名稱與小精靈資料的時期名一致
   （小精靈 eraId 對應 WALK_SPIRIT_META.eras 的基本時期名，例如「戰後與文學」也算「戰後」）。
   小精靈時期＝探員專精 → 歷史共鳴（勘察多帶 1 件）；＝熟悉 → 較弱的歷史共鳴（多帶 0.5 件，效果減半）。
   遊戲畫面只顯示時期名，不顯示原檔裡「待查證」的歷史說法。 */
(function () {
  'use strict';
  var T = {
    "隊長": {"eras":["明鄭"],"famEras":["荷治"]},
    "領航員": {"eras":["清領"],"famEras":["日治"]},
    "軍師": {"eras":["清領"],"famEras":["明鄭"]},
    "偵查員": {"eras":["西拉雅與大員前史"],"famEras":["荷治"]},
    "檔案官": {"eras":["荷治"],"famEras":["清領"]},
    "訪談員": {"eras":["戰後"],"famEras":["西拉雅與大員前史","當代文資"]},
    "蒐證員": {"eras":["當代文資"],"famEras":["日治","戰後"]},
    "記錄官": {"eras":["日治"],"famEras":["清領"]},
    "文化設計員": {"eras":["日治"],"famEras":["清領","當代文資"]},
    "通訊官": {"eras":["戰後"],"famEras":["清領","日治"]},
    "安全官": {"eras":["日治"],"famEras":["戰後"]},
    "補給官": {"eras":["清領"],"famEras":["日治","當代文資"]},
    "鑑識員": {"eras":["當代文資"],"famEras":["日治"]},
    "技術專家": {"eras":["當代文資"],"famEras":["荷治"]},
    "在地嚮導": {"eras":["清領"],"famEras":["西拉雅與大員前史","日治"]},
    "扮演專員": {"eras":["日治"],"famEras":["戰後"]}
  };
  window.WALK_AGENT_ERAS = T;
  var A = window.WALK_AGENTS;   /* 有名冊就順手把資料掛到每位探員上（walk_agents.js 要先載入） */
  if (A && A.all) Object.keys(T).forEach(function (r) { if (A.all[r]) { A.all[r].eras = T[r].eras; A.all[r].famEras = T[r].famEras; } });
})();
