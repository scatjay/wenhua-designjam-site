/* 把文史顧問的 AGENT_HISTORY_1029.json（16 位探員的歷史專長）轉成 js/walk_data_agent_era.js。
   用法：node test_tools/gen_walk_agent_era.js
   只取時期名與熟悉度：3＝專精（eras，每人 1 個）、2＝熟悉（famEras，每人最多 2 個）；
   「待查證」的專長與歷史說法不進遊戲資料，畫面只顯示時期名。 */
'use strict';
var fs = require('fs'), path = require('path');
var root = path.resolve(__dirname, '..');
var src = path.resolve(root, '..', 'knowledge', 'tainan_walk', 'AGENT_HISTORY_1029.json');
var d = JSON.parse(fs.readFileSync(src, 'utf8'));
var ORDER = ['隊長', '領航員', '軍師', '偵查員', '檔案官', '訪談員', '蒐證員', '記錄官', '文化設計員', '通訊官', '安全官', '補給官', '鑑識員', '技術專家', '在地嚮導', '扮演專員'];
var out = {};
ORDER.forEach(function (r) {
  var a = d[r]; if (!a) throw new Error('缺探員 ' + r);
  var exp = [], fam = [];
  Object.keys(a.era).forEach(function (k) {
    var name = k.replace(/\(.*\)$/, ''), lv = a.era[k];
    if (lv === 3) exp.push(name); else if (lv === 2) fam.push(name);
  });
  if (exp.length !== 1) throw new Error(r + ' 專精應剛好 1 個：' + exp.length);
  if (fam.length > 2) throw new Error(r + ' 熟悉最多 2 個');
  out[r] = { eras: exp, famEras: fam };
});
var lines = ORDER.map(function (r) { return '    ' + JSON.stringify(r) + ': ' + JSON.stringify(out[r]); });
var s = '/* 走讀：探員歷史專長（資料來源 knowledge/tainan_walk/AGENT_HISTORY_1029.json，文史顧問第一版；由 test_tools/gen_walk_agent_era.js 產生）。\n' +
  '   eras＝專精時期（3 級，每人 1 個）、famEras＝熟悉時期（2 級，每人最多 2 個）；名稱與小精靈資料的時期名一致\n' +
  '   （小精靈 eraId 對應 WALK_SPIRIT_META.eras 的基本時期名，例如「戰後與文學」也算「戰後」）。\n' +
  '   小精靈時期＝探員專精 → 歷史共鳴（勘察多帶 1 件）；＝熟悉 → 較弱的歷史共鳴（多帶 0.5 件，效果減半）。\n' +
  '   遊戲畫面只顯示時期名，不顯示原檔裡「待查證」的歷史說法。 */\n' +
  '(function () {\n  \'use strict\';\n  var T = {\n' + lines.join(',\n') + '\n  };\n' +
  '  window.WALK_AGENT_ERAS = T;\n' +
  '  var A = window.WALK_AGENTS;   /* 有名冊就順手把資料掛到每位探員上（walk_agents.js 要先載入） */\n' +
  '  if (A && A.all) Object.keys(T).forEach(function (r) { if (A.all[r]) { A.all[r].eras = T[r].eras; A.all[r].famEras = T[r].famEras; } });\n' +
  '})();\n';
fs.writeFileSync(path.join(root, 'js', 'walk_data_agent_era.js'), s, 'utf8');
console.log('寫出 js/walk_data_agent_era.js（' + s.split('\n').length + ' 行）');
