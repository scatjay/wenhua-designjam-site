/* 文化遊戲松 AI 助教・研究設定（單一設定檔）。11-12 母線轉達楊老師 23:25：「我還沒有要把最後的研究設計落地……隨時可以照我的方向感去調整」。
   所有研究相關行為都在這一份，改了不必動程式：
   · 想換整組做法：把下面 "active" 改成 "teach"（純教學版）／"allA"（全 A 版）／"cross2x2"（2×2 交叉版）。
   · 想微調：改 "presets" 裡那一組，或改 "base"（所有組共用的預設）。
   · 改完請把 "version" 換成新的代號（例如 2026-11-20a）：每筆事件都會帶這個代號，之後才分得清楚資料是在哪一種設定下收的。
   · 網址 ?cfg=teach 可暫時覆蓋 "active"（只供測試，不改檔案）。
   Python 端（tutor_policy.py／tutor_proxy.py）讀的是同一份：取下面「等號後面那一大段」(從開頭的 CFG 標記到結尾的 END 標記）的 JSON。這一段必須維持合法 JSON（不能放註解）。
   說明與每個開關的選項、預設、學生端差別、對資料可比性的影響，見 docs/workshop/AI_TUTOR_SPEC_20261112.md「研究設定開關」。 */
window.CT_CONFIG = /*CFG*/{
  "version": "2026-11-13e",
  "active": "allA",
  "base": {
    "tutor": { "mode": "A", "crossOrder": "ABAB", "maxLevel": 3, "startLevel": 0, "frustrationAfter": 3, "assign": { "groups": {}, "tool": {}, "override": {}, "walkers": [] } },
    "llm": {
      "layer": "off",
      "transport": "queue",
      "models": { "argon": "gemini-4-argon", "flash": "gemini-3.8-flash", "pro": "gemini-3.1-pro-preview" },
      "pro": { "enabled": false, "onlyLevel0": true },
      "route": {
        "orient": "rule", "handover": "rule", "predict": "rule",
        "contrast": "argon", "judge": "argon", "extract": "argon", "mechanic": "argon", "remix": "argon", "field": "argon", "fieldq": "argon", "fieldcite": "argon", "lens": "argon",
        "reason": "pro", "source": "pro", "own": "pro", "ai_review": "pro", "playtest": "pro", "intent": "pro", "meaning": "pro", "version": "pro"
      },
      "perPersonPerClass": 10,
      "perPersonPerClassTight": 6,
      "semesterBudgetTwd": 1500,
      "dailyHardTwd": 400,
      "firstWeek": 11,
      "lastWeek": 16,
      "levelEdges": [0.7, 0.9, 1.0],
      "inputMaxTokens": 3000,
      "outputMaxTokens": { "argon": 200, "flash": 1500, "pro": 2400 },
      "thinking": { "argon": null, "flash": null, "pro": "low" },
      "perCallMaxTwd": { "argon": 0.6, "flash": 0.3, "pro": 1.5 },
      "timeoutSec": 40,
      "chains": {
        "argon": [ { "tier": "argon", "sec": 20 }, { "tier": "flash", "sec": 15 } ],
        "pro":   [ { "tier": "pro", "sec": 25, "thinking": "low" }, { "tier": "flash", "sec": 15 } ]
      },
      "submitJitterSec": [0, 8],
      "prompt": { "pack": "f25_v1" },
      "guard": { "anchorRequired": false, "moveCheck": false, "repeatMax": 0, "parrotMax": 0, "maxQuestions": 0, "retryOnFail": 0 },
      "context": { "recentEvents": 0 },
      "sendStudentText": false
    },
    "term": { "firstMonday": "2026-09-07", "unitMin": 11, "unitMax": 16 },
    "unbound": { "text": "先到學習單綁定編號，助教才會出現", "href": "../../w11.html" },
    "fade": { "enabled": true, "askThrough": 12, "selfThrough": 14, "basis": "week+performance", "successN": 3 },
    "selfCheck": { "showTip": true, "tipItems": ["both", "why", "rule", "src"] },
    "hook": { "writer": "off", "show": { "judge": true, "source": true, "decider": true, "post": true, "provenance": true }, "decision": { "freq": "weekly", "keyStages": [2, 3], "lastPrompt": "aistudio", "fields": 3, "copyText": "off" } }
  },
  "presets": {
    "teach":    { "_說明": "純教學版：只有樣板與證據掛鉤，沒有助教面板、沒有 LLM。",
                  "tutor": { "mode": "off" }, "llm": { "layer": "off" }, "fade": { "enabled": false } },
    "allA":     { "_說明": "全 A 版：每個人都是判斷引導式（A）；LLM 預設關（傳輸層與 IRB 都還沒上線）。要開 LLM 把這一組的 llm.layer 改成 routed（依時刻分流）。",
                  "tutor": { "mode": "A" }, "llm": { "layer": "off" } },
    "cross2x2": { "_說明": "2×2 交叉版：A／B 組內逐週輪流（ABAB），基本款／Claude Code 兩個工具組別各自交叉；工具組別要在 tutor.assign.tool 填學生編號。",
                  "tutor": { "mode": "cross", "crossOrder": "ABAB" }, "llm": { "layer": "off" } }
  }
}/*END*/;
