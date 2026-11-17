/* 十二個樣板共用的「證據掛鉤」（草稿 11-12，子線 ↳F㉕）。每個樣板只要加五行 script 與一個呼叫就掛上，不動遊戲規則：
     <script src="tutor/folk_index.js"></script><script src="tutor/tutor_templates.js"></script><script src="tutor/tutor_core.js"></script><script src="tutor/tutor_ui.js"></script><script src="tutor/tutor_hook.js"></script>
     CT_HOOK.mount({ tpl:'puzzle', unit:'W11', env:<信封編號>, table:<分派表>, adapter:{ exportState:function(){…}（選） } });
   樣板在跑完一版時呼叫 CT_HOOK.markPlayed('skin'|'rule')；樣板自己有判斷題的，學生選好後呼叫 CT_HOOK.judged('skin'|'rule', 選項位置 1–4, 理由)（都不呼叫也行，學生可以在掛鉤裡自己按／自己答）。
   掛鉤負責記錄六項證據，只記錄、不打分（素養尺度由 ↳教⑤ 定）：
     ①玩前預測與玩後判斷（W2 四選一，兩版各一次，含理由）  ②出處五類標示（原著／民間說法／工坊創作／遊戲設計／田野所得，學生自己標）
     ③改作三階版本存檔（換內容／換規則／換形式；存在學生自己的瀏覽器）  ④誰的決定（我／AI／一起）
     ⑤做出來之後的紀錄（試玩觀察、田野回饋、改或不改的理由、意圖與感受、本科系眼光、遊戲在講什麼）  ⑥掛上 AI 助教（CT_UI）
   學生打的字只留在自己的瀏覽器（localStorage），事件只送特徵與代碼（見 tutor_core.js makeEvent）。不用 alert／confirm／prompt。 */
(function (root) {
  'use strict';
  var C = root.CT_CORE, UI = root.CT_UI, $ = function (id) { return document.getElementById(id); };
  var CATS = [[1, '原著'], [2, '民間說法'], [3, '工坊創作'], [4, '遊戲設計'], [5, '田野所得'], [6, '待查']];
  var STAGES = [[1, '換內容'], [2, '換規則'], [3, '換形式']];
  /* 繳交時填的「交給 AI 的部分」：角色名照授課計畫書表 2（10 個）；第 11 位＝其他；沒用 AI＝0。位元遮罩進事件的 ro 欄。 */
  var ROLES = [[1, '案例庫導航員', '找案例、整理手法'], [2, '穿越時空抓包機', '故意做錯讓你找碴'], [3, '採集標記師', '把田野看到的整理成關鍵字'], [4, '文本對話員', '讀文本、補背景知識'], [5, '觀點模擬器', '寫人物的內心獨白'],
    [6, '風格鍊金術師', '改成另一種風格'], [7, '技術助教', '給你指令範例、幫你寫素材'], [8, '腳本優化師', '檢查對話邏輯、除錯'], [9, '企劃視覺化助手', '把文字整理成分鏡草圖'], [10, '進度管家', '排進度、提醒檢核'], [11, '其他', '在下面寫']];
  function roMask(ids) { return ids.reduce(function (m, i) { return m | (1 << (i - 1)); }, 0); }
  var WHO = [['self', '我決定'], ['ai', 'AI 給的'], ['both', '一起']];
  var H = null, O = null;
  /* 印尼文（遊戲設計學 101–130 自動中文＋印尼文並列；?lang=id 強制、?lang=zh 強制只有中文）。只涵蓋 ③ 的「誰的決定」表單；中文原文與行為不變，印尼文只是中文下方的小字灰色一行。
     譯文由 Vertex（gemini-3.7-flash，經 vertex_cap）依 glossary_id.json 產生，尚無母語者審稿。角色名稱保留中文（授課計畫書表 2 的正式名稱），括號附印尼文說明。 */
  var I18N = {
    legend: ["紀錄欄", "Kolom keterangan sumber"],
    q1: ["① 這一版裡，哪些部分交給了 AI？（可複選）", "① Di versi ini, bagian mana saja yang diserahkan ke AI? (bisa pilih lebih dari satu)"],
    q2: ["② 這一版裡，哪一兩處是我自己決定的？", "② Di versi ini, satu atau dua bagian mana yang saya putuskan sendiri?"],
    q3: ["③ 其中一處，我為什麼這樣決定？（一句話）", "③ Untuk salah satu bagian tersebut, mengapa saya memutuskan demikian? (satu kalimat)"],
    noai: ["這一版沒有用 AI", "Versi ini tidak menggunakan AI"],
    hint_every: ["每交一版都要填這一欄。", "Setiap kali mengumpulkan versi baru, wajib mengisi kolom ini."],
    hint_weekly_done: ["這一週已經填過；這一版可以略過，但換規則或換形式的版本一定要填。", "Minggu ini sudah pernah diisi; versi ini boleh dilewati, tetapi versi yang berganti aturan atau berganti format wajib diisi."],
    hint_weekly_first: ["這一週還沒填過，這一版要填。", "Minggu ini belum pernah diisi, versi ini harus diisi."],
    err_ai: ["請勾選這一版交給 AI 的部分；沒有用 AI 就勾「沒有用 AI」。", "Silakan centang bagian yang diserahkan ke AI pada versi ini; jika tidak menggunakan AI, centang 「tidak menggunakan AI」."],
    err_both: ["「沒有用 AI」不能和其他選項一起勾。", "「Tidak menggunakan AI」 tidak boleh dicentang bersamaan dengan pilihan lain."],
    err_mine: ["請寫出這一版裡你自己決定的一兩處。", "Silakan tulis satu atau dua bagian di versi ini yang Anda putuskan sendiri."],
    err_why: ["請用一句話寫：其中一處為什麼這樣決定。", "Silakan tulis dalam satu kalimat: mengapa salah satu bagian diputuskan demikian."],
    saved: ["存好了。交這一版時，把下面這段複製，貼到 flipclass 的繳交留言：", "Sudah tersimpan. Saat mengumpulkan versi ini, salin teks di bawah ini, lalu tempel ke komentar pengumpulan flipclass:"],
    copy: ["複製這段", "Salin bagian ini"],
    copied: ["已複製", "Sudah disalin"],
    manual: ["請手動複製上面的字", "Silakan salin teks di atas secara manual"],
    title: ["紀錄欄", "Kolom keterangan sumber"],
    note1: ["這一欄不計分，照實寫就好。", "Kolom ini tidak dinilai, silakan tulis apa adanya."],
    note2: ["請不要寫同學或家人的名字。", "Harap jangan menulis nama teman sekelas atau keluarga."],
    qlast: ["最後一句指令：你貼給 AI 的最後一句話（只貼一句，200 字以內；這一版沒有用 AI 就留空）", "Instruksi terakhir: Kalimat terakhir yang Anda tempel ke AI (tempel satu kalimat saja, maksimal 200 karakter; jika versi ini tidak menggunakan AI, biarkan kosong)"],
    outlast: ["最後一句指令", "Instruksi terakhir"],
    ck_title: ["交件檢查", "Pemeriksaan Pengumpulan"], ck_tip: ["這是你這一版的紀錄，不用另外截圖：助教討論完的「結果卡」會帶上這份檢核，W11-2 只交結果卡。畫面只顯示代碼與完成狀態，不顯示你寫的內容。", "Ini catatan versi ini, tidak perlu tangkapan layar terpisah: 「結果卡」 (kartu hasil) dari diskusi dengan asisten akan memuat pemeriksaan ini, W11-2 cukup mengumpulkan kartu hasil. Layar hanya menampilkan kode dan status, bukan isi tulisanmu."], ck_env: ["代碼", "Kode"], ck_unit: ["單元", "Unit"], ck_ver: ["第 {n} 版", "Versi ke-{n}"], ck_time: ["時間", "Waktu"],
    ck_ai: ["交給 AI 的部分", "Bagian yang diserahkan ke AI"], ck_mine: ["自己決定的一兩處", "Satu atau dua bagian yang ditentukan sendiri"], ck_why: ["其中一處的理由", "Alasan untuk salah satu bagian"], ck_last: ["最後一句指令", "Kalimat instruksi terakhir"], ck_empty: ["未填", "Belum diisi"],
    err_feel: ["請填「本週重點」，一句話就好；想不到就寫「沒有」。", "Tolong isi 「本週重點」(kalimat minggu ini), cukup satu kalimat saja. Kalau tidak terpikirkan, tulis saja 「沒有」(tidak ada)."], sv_label: ["問卷完成碼（填了問卷才有；沒填問卷就空著）", "Kode penyelesaian kuesioner (hanya ada kalau sudah isi kuesioner; kalau tidak isi, kosongkan saja)"], sv_bad: ["完成碼不對，請再檢查一次。", "Kode penyelesaian salah, silakan periksa lagi ya."], more: ["更多紀錄（選填，不填也可以）", "Catatan tambahan (opsional, boleh tidak diisi)"], ck_survey: ["問卷完成碼", "Kode penyelesaian kuesioner"],
    feel_title: ["本週重點", "Satu kalimat minggu ini"], ck_feel: ["本週重點", "Satu kalimat minggu ini"], devcount: ["這台裝置上有 {n} 筆紀錄；空的話，請回到你填寫的那台裝置。", "Ada {n} catatan di perangkat ini. Kalau kosong, silakan kembali ke perangkat tempat kamu mengisinya."]
  }, ROLES_ID = [
    ["Navigator basis kasus", "Mencari contoh kasus dan merangkum metode"],
    ["Pencari celah lintas waktu", "Sengaja membuat kesalahan agar Anda menemukan kejanggalan"],
    ["Penanda data lapangan", "Merangkum hasil observasi lapangan menjadi kata kunci"],
    ["Rekan dialog teks", "Membaca teks dan melengkapi latar belakang pengetahuan"],
    ["Simulator sudut pandang", "Menulis monolog batin karakter"],
    ["Alkemis gaya tulisan", "Mengubah ke gaya penulisan lain"],
    ["Asisten pengajar teknis", "Memberikan contoh perintah dan membantu menulis materi"],
    ["Pengoptimal naskah dialog", "Memeriksa logika percakapan dan mengatasi eror"],
    ["Asisten visualisasi proyek", "Menyusun teks menjadi draf papan cerita"],
    ["Pengelola jadwal progres", "Mengatur jadwal dan mengingatkan pemeriksaan"],
    ["Peran lainnya", "Tuliskan di bawah"]];
  var WEEK_LINE = {
    W11: ["用一句話寫：你想讓玩的人有什麼感覺？", "Tulis dalam satu kalimat: kamu ingin pemain merasakan apa?"],
    W12: ["玩完你的版本。跟你寫的那句話比，玩起來的感覺一樣嗎？哪裡不一樣？", "Coba mainkan versimu. Dibandingkan dengan kalimat yang kamu tulis, apakah rasanya sama saat dimainkan? Bagian mana yang berbeda?"],
    W13: ["想一個你想問當地人的問題。如果你能去現場，你想問誰、問什麼？", "Pikirkan satu pertanyaan yang ingin kamu tanyakan ke warga lokal. Kalau kamu bisa datang langsung ke sana, siapa yang ingin kamu tanyai dan apa yang ingin kamu tanyakan?"],
    W14: ["請同學玩你的版本，不教他。記三件事：他卡在哪、他笑了沒、他說了什麼。", "Minta temanmu memainkan versimu tanpa kamu beri tahu caranya. Catat 3 hal: dia macet di mana, apakah dia tertawa, dan apa yang dia katakan."],
    W15: ["你放進作品的現場細節，是在哪裡看到、聽到或問到的？對當地人來說，它代表什麼？", "Detail lapangan yang kamu masukkan ke karyamu, kamu dapat dari melihat, mendengar, atau bertanya di mana? Bagi warga lokal, apa arti hal tersebut?"],
    W16: ["如果只能用一句話，你的遊戲在講什麼？", "Kalau cuma boleh pakai satu kalimat, game-mu menceritakan tentang apa?"]
  };
  var ID = false;
  function wantId() { var m = /[?&]lang=(id|zh)/.exec(typeof location !== 'undefined' ? location.search : ''); if (m) return m[1] === 'id'; var e = +O.env; return e >= 101 && e <= 130; }
  function tz(k) { return I18N[k][0]; }
  function idl(t) { return ID ? '<span class="idl" lang="id">' + esc(t) + '</span>' : ''; }
  function th(k) { return esc(tz(k)) + idl(I18N[k][1]); }
  /* 寫入層：所有「存在學生自己瀏覽器」的東西都經這一個介面。預設後端是 localStorage；要換成別的（例如老師端的非公開儲存）用 CT_HOOK.setStore({ put: function (key, str) {}, get: function (key) { return str|null; } })。
     學生打的自由文字（誰的決定的②③、試玩觀察…）目前只准在本機後端；換後端前要先確認儲存位置與誰讀得到。 */
  var Store = { kind: 'local',
    put: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 存不下時照樣可用，只是不記得 */ } },
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } } };
  function setStore(st) { if (st && typeof st.put === 'function' && typeof st.get === 'function') Store = st; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function key() { return 'ct_hook_' + O.tpl + '_' + O.env; }
  /* 共用的出處紀錄簿：樣板頁（每個樣板各有自己的紀錄）和學習單頁共用同一個 key（ct_prov_<編號>），從哪一頁填都找得到同一筆；
     「每週至少填一次」也用這本簿子算。學生寫的字只在學生自己的瀏覽器（Store）。 */
  function PKEY() { return 'ct_prov_' + O.env; }
  function loadLedger() { try { var d = JSON.parse(Store.get(PKEY()) || 'null'); if (d && d.entries) { d.feel = d.feel || {}; return d; } } catch (e) { /* 讀不到就當空的 */ } return { entries: [], feel: {} }; }
  function saveLedger(L) { Store.put(PKEY(), JSON.stringify(L)); }
  function decisionsAll() { var a = ((H && H.decisions) || []).slice(); loadLedger().entries.forEach(function (e) { if (e.pv) a.push({ unit: e.unit, vn: e.vn, key: !!e.key }); }); return a; }
  function ledgerPv() { return loadLedger().entries.filter(function (e) { return e.pv; }).map(function (e) { return e.pv; }); }
  function feelLabel() { var w = WEEK_LINE[O.unit] || WEEK_LINE.W11; return esc(w[0]) + idl(w[1]); }
  function fresh() {
    return { predict: { skin: 0, rule: 0 }, played: { skin: false, rule: false }, w2: { skin: 0, rule: 0 }, reason: { skin: '', rule: '' }, items: [], versions: [], decisions: [],
      post: { playtest: 0, fieldfb: 0, change: 0, intent: false, lens: false, meaning: false, fieldq: 0 }, ai: { suggested: 0, accepted: 0, modified: 0, rejected: 0, reviewed: false },
      folkOpened: [], predGapNoted: false, extractChecks: 0 };
  }
  function load() { try { var d = JSON.parse(Store.get(key()) || 'null'); if (d && d.items) { d.decisions = d.decisions || []; return d; } } catch (e) { /* 無法讀取時照樣可用，只是不記得 */ } return fresh(); }
  function save() { Store.put(key(), JSON.stringify(H)); }

  /* 給助教的狀態：由學生在掛鉤裡留下的紀錄推出來 */
  function state() {
    var it = H.items, vs = H.versions, rx = { stage: 0, contentEdits: 0, ruleEdits: 0 };
    vs.forEach(function (v) { if (v.stg === 1) rx.contentEdits += 1; else rx.ruleEdits += 1; rx.stage = Math.max(rx.stage, v.stg === 1 ? 1 : 2); });
    return { tpl: O.tpl, played: H.played, w2: H.w2, reason: H.reason, predict: H.predict, predGapNoted: H.predGapNoted, remix: rx, ai: H.ai, folkOpened: H.folkOpened, field: H.post.fieldfb > 0,
      fieldCited: it.some(function (x) { return x.cat === 5; }), fieldCiteExplained: it.some(function (x) { return x.cat === 5 && x.text.length >= 6; }),
      build: { aiGenerated: it.some(function (x) { return x.who === 'ai'; }) || ledgerPv().some(function (p) { return p.ro > 0 || (p.ai && p.ai.length && p.ai.indexOf('none') < 0); }), ownership: it.some(function (x) { return x.who === 'self' || x.who === 'both'; }) || ledgerPv().some(function (p) { return !!p.mine; }), versions: vs.length,
        versionNotes: vs.filter(function (v, i) { return i > 0 && v.note.length >= 4; }).length, extractChecks: H.extractChecks, playtests: H.post.playtest, intentCompared: H.post.intent,
        fieldQs: H.post.fieldq, lens: H.post.lens, meaning: H.post.meaning } };
  }

  function css() {
    if ($('chCss')) return; var s = document.createElement('style'); s.id = 'chCss';
    s.textContent = '#ctHook{display:none!important}' +   /* 11-17 21:06／21:08 母線裁示：「📒 我的紀錄」（紀錄欄、內容出處五類、先猜／判斷）整個從學生畫面拿掉；程式與資料結構先保留（樣板會呼叫），只是不顯示 */
      '#ctHook{--ch-bg:#fffaf3;--ch-panel:#fff;--ch-ink:#2b2420;--ch-line:#d9cbbd;--ch-soft:#f6ece0;--ch-acc:#b5462f;--ch-on:#fff;max-width:720px;margin:24px auto 96px;padding:0 16px;font:16px/1.6 system-ui,"Noto Sans TC","Microsoft JhengHei",sans-serif;color:var(--ch-ink)}' +
      '@media (prefers-color-scheme:dark){#ctHook{--ch-bg:#1d1916;--ch-panel:#27211d;--ch-ink:#f3ebe3;--ch-line:#4a3f37;--ch-soft:#352c26;--ch-acc:#e0795f;--ch-on:#1d1916}}' +
      '#ctHook #chMore>summary{min-height:44px;display:flex;align-items:center;font-weight:700;cursor:pointer;margin:8px 0}' +
      '#ctHook>summary{min-height:48px;display:flex;align-items:center;font-weight:700;cursor:pointer;background:var(--ch-panel);border:1px solid var(--ch-line);border-radius:12px;padding:0 14px}' +
      '#ctHook .sec{background:var(--ch-panel);border:1px solid var(--ch-line);border-radius:12px;padding:12px 14px;margin:10px 0}#ctHook h3{margin:0 0 6px;font-size:16px}#ctHook p.m{margin:2px 0 8px;font-size:13px;opacity:.75}' +
      '#ctHook select,#ctHook button,#ctHook input[type=text]{min-height:44px;font-size:15px;border-radius:10px;border:1px solid var(--ch-line);background:var(--ch-bg);color:var(--ch-ink);padding:0 12px}#ctHook button.on{background:var(--ch-soft);font-weight:700}#ctHook button.pri{background:var(--ch-acc);color:var(--ch-on);border-color:var(--ch-acc)}' +
      '#ctHook textarea{width:100%;box-sizing:border-box;min-height:60px;font-size:16px;border:1px solid var(--ch-line);border-radius:10px;padding:8px;background:var(--ch-bg);color:var(--ch-ink)}#ctHook .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}#ctHook label{font-size:14px;display:block;margin-top:6px}' +
      '#ctHook .item{border-top:1px dashed var(--ch-line);padding:6px 0;font-size:14px;word-break:break-all}#ctHook .idl{display:block;font-size:12px;line-height:1.4;font-weight:400}#ctHook .m .idl{opacity:1}#ctHook fieldset.ctid #chRoles label{min-height:44px;display:flex;flex-wrap:wrap;align-items:center;column-gap:4px}#ctHook fieldset.ctid #chRoles label .idl{flex-basis:100%}#ctHook label .idl,#ctHook legend .idl{opacity:.7}' +
      '#ctHook .tag{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;background:var(--ch-soft);margin-right:4px}';
    document.head.appendChild(s);
  }
  function opts(list, first) { return '<option value="0">' + (first || '（選一個）') + '</option>' + list.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join(''); }
  function w2opts(first) { return opts(Object.keys(C.W2).map(function (k) { return [k, C.W2[k]]; }), first); }
  function post(id, label) { return '<label for="' + id + '">' + label + '</label><textarea id="' + id + '" maxlength="300"></textarea><div class="row"><button type="button" data-post="' + id + '">送出</button></div>'; }

  /* 研究設定 hook.show：各區學生端可單獨關閉顯示（證據掛鉤本身一律掛著、事件照常；關掉的只是那一格表單不給學生看） */
  function sectionOf(id) { var e = $(id); while (e && !(e.classList && e.classList.contains('sec'))) e = e.parentNode; return e; }
  function applyShow() {
    var sh = ((O.cfg || {}).hook || {}).show || {}, hide = function (el) { if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); } };
    if (sh.judge === false) hide(sectionOf('chPrS'));
    if (sh.post === false) hide(sectionOf('chPt'));
    if (sh.source === false) { hide($('chCat')); hide($('chFolk')); }
    if (sh.provenance === false || (((O.cfg || {}).hook || {}).decision || {}).freq === 'off') hide($('chPv'));
    if (sh.source === false) hide(sectionOf('chIt'));
    if (!((((O.cfg || {}).hook || {}).survey || {}).code)) hide($('chSurveyBox'));
    var df = C.decisionFields(((O.cfg || {}).hook || {}).decision, O.unit);   // 欄位數與「最後一句指令」開關（見 tutor_core decisionFields）
    if ($('chWhyBox') && df.fields === 2) hide($('chWhyBox'));
    if ($('chLastBox') && !df.lastPrompt) hide($('chLastBox'));
  }
  var AI7 = [['none', '沒有用 AI'], ['search', '找資料'], ['idea', '想點子'], ['write', '寫文字'], ['image', '做圖'], ['code', '寫或改程式'], ['other', '其他']];
  function lev(a, b) {   // 字元差異數（Levenshtein）
    a = String(a || ''); b = String(b || ''); if (a === b) return 0; if (!a) return b.length; if (!b) return a.length;
    var prev = [], cur = [], i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  function pfKey() { return 'ct_pf_' + O.env; }
  function pfGet() { try { var d = JSON.parse(localStorage.getItem(pfKey()) || 'null'); return d && d.unit === O.unit ? d : null; } catch (e) { return null; } }
  function prefillNow() {   // 助教討論結束後，把「你自己決定的那一處」和「本週重點」預先填進第 2、3 格（只在格子是空的時候填；學生看過可以改）
    if (typeof O === 'undefined' || !O) return; var d = pfGet(); if (!d || !$('chMine')) return;
    [['chMine', d.mine], ['chFeel', d.feel]].forEach(function (x) {
      var el = $(x[0]); if (!el || !x[1]) return;
      if (!el.value.trim() || el.getAttribute('data-pf') === el.value) { el.value = x[1]; el.setAttribute('data-pf', x[1]); }
    });
    if ($('chPfNote')) $('chPfNote').style.display = 'block';
  }
  function provHtml() {
    return '<div class="sec"><p class="m" id="chPvNote">存版本時填三格，很短就好；跟助教聊完會自動幫你填好，看過再存。</p>' +
      '<div style="display:none"><select id="chStg" aria-label="改作階段"><option value="1" selected>1</option></select><textarea id="chVn"></textarea></div>' +
      '<p class="m" id="chPvHint"></p><label>① 這一版，哪些部分交給了 AI？（可多選）</label><div id="chAiRow" class="row" role="group" aria-label="交給 AI 的部分">' +
      AI7.map(function (a) { return '<button type="button" data-ai7="' + a[0] + '" aria-pressed="false">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<label for="chMine">② 你自己決定的那一處是什麼？</label><textarea id="chMine" maxlength="200"></textarea>' +
      '<div id="chFeelBox"><label for="chFeel">③ 本週重點</label><textarea id="chFeel" maxlength="120"></textarea></div>' +
      '<p class="m" id="chPfNote" style="display:none">②③ 是助教幫你填的，看過、想改就改，再按存檔。</p><p id="chPvMsg" class="m" role="status"></p>' +
      '<div class="row"><button type="button" id="chVb" class="pri">存檔</button></div>' +
      '<div id="chSurveyBox" style="display:none"><input type="text" id="chSurvey"><p id="chSvMsg" class="m"></p></div>' +
      '<div id="chPvOutBox" style="display:none"><div id="chPvCheck" role="status" aria-live="polite" style="border:2px solid #2f6690;border-radius:10px;padding:10px 12px;margin:8px 0;background:#fff"></div>' +
      '<div id="chPvCopyBox" style="display:none"><textarea id="chPvOut" readonly rows="4"></textarea><div class="row"><button type="button" id="chPvCp">' + th('copy') + '</button></div></div></div>' +
      '<div id="chVers" class="m"></div></div>';
  }
  function build() {
    css();
    var d = document.createElement('details'); d.id = 'ctHook';
    var t = C.TPL_BY_ID[O.tpl] || {};
    var s1 = '<div class="sec"><h3>玩之前先猜，玩完再判斷</h3><p class="m">問題：把那裡的東西換掉（例如把廟換成便利商店），你當時的決定會變嗎？</p>' +
      '<div class="row"><span>先猜</span><select id="chPrS" aria-label="先猜：換皮版">' + w2opts('換皮版（先猜）') + '</select><select id="chPrR" aria-label="先猜：玩法版">' + w2opts('玩法版（先猜）') + '</select><button type="button" id="chPrB">我猜好了</button></div>' +
      '<div class="row"><button type="button" id="chPlS">我玩完「換皮版」了</button><button type="button" id="chPlR">我玩完「玩法版」了</button></div>' +
      '<div class="row"><span>判斷</span><select id="chJS" aria-label="判斷：換皮版">' + w2opts('換皮版（判斷）') + '</select><select id="chJR" aria-label="判斷：玩法版">' + w2opts('玩法版（判斷）') + '</select></div>' +
      '<label for="chRS">為什麼（換皮版）</label><textarea id="chRS" maxlength="200"></textarea><label for="chRR">為什麼（玩法版）</label><textarea id="chRR" maxlength="200"></textarea><div class="row"><button type="button" id="chJB" class="pri">我答好了</button></div></div>',
      s2 = '<div class="sec"><h3>內容出處（選填）：我的作品用到的內容</h3><p class="m">這一項是從哪來的？不確定就選「待查」，不要硬選。</p>' +
      '<label for="chIt">內容（一次一項）</label><input type="text" id="chIt" maxlength="60" style="width:100%"><div class="row"><select id="chCat" aria-label="出處類別">' + opts(CATS, '出處類別') + '</select><button type="button" id="chItB">加入</button></div><div id="chItems"></div>' +
      '<p class="m">讀過的資料卡：</p><div class="row" id="chFolk">' + ((t.folk || []).map(function (id) { var f = C.FOLK_BY_ID[id]; return f ? '<button type="button" data-folk="' + id + '">📖 ' + esc(f.name) + '</button>' : ''; }).join(' ')) + '</div></div>',
      s4 = '<div class="sec"><h3>AI 的建議</h3><div class="row"><button type="button" data-ai="accepted">照用一條</button><button type="button" data-ai="modified">改了再用一條</button><button type="button" data-ai="rejected">不用一條</button><button type="button" id="chAiR">我回看完了</button></div><p class="m" id="chAi">還沒有紀錄。</p></div>',
      s5 = '<div class="sec"><h3>做出來之後</h3>' + post('chPt', '試玩觀察（誰玩、玩多久、停在哪、說了什麼）') + post('chIn', '我原本想讓玩家感到什麼／玩家實際感受到的') + post('chFf', '田野回饋（到現場問到、看到、聽到的）') + post('chFq', '回到現場時，我想問誰、問什麼') + post('chCh', '這一輪我改或不改的理由') + post('chLn', '用我本科系的眼光，我會改哪裡') + post('chMe', '一句話：這個遊戲在講什麼') + '</div>';
    d.innerHTML = '<summary>📒 我的紀錄（紀錄欄、版本）</summary>' + s2 + provHtml() + '<details id="chMore"><summary>' + th('more') + '</summary>' + s1 + s4 + s5 + '</details>';
    document.body.appendChild(d);
    applyShow();
    wire();
  }

  /* 交件檢查畫面（楊老師 11-13 12:14：資料輸入都在學習單裡，flipclass 只收去識別化的檢核截圖）：只列編號、單元、第幾版、時間、完成了哪幾項（打勾），
     不顯示學生寫的任何文字。複製那一段文字預設關閉（hook.decision.copyText＝'on' 才有，以防萬一）。 */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function ckCode(un) { var c = ''; try { c = localStorage.getItem('ct_code_' + un) || ''; } catch (e) { c = ''; } return c || '—'; }   // 交件檢查不顯示信封編號：顯示助教討論發的一次性代碼（還沒討論就是 —）
  function checkHtml(v, L) {
    var pv = v.pv || {}, un = v.unit || O.unit, rows = [['ck_ai', !!((pv.ai && pv.ai.length) || (pv.roNames && pv.roNames.length))], ['ck_mine', !!pv.mine]];
    rows.push(['ck_feel', !!((L && L.feel && L.feel[un]) || '')]);
    if (L && L.survey) rows.push(['ck_survey', L.survey === ((((O.cfg || {}).hook || {}).survey || {}).code)]);
    return '<div style="font-weight:700;font-size:16px">' + th('ck_title') + '</div><p class="m" style="margin:4px 0 8px">' + th('ck_tip') + '</p>' +
      '<div style="font-size:15px">' + th('ck_env') + '：<b>' + esc(ckCode(un)) + '</b>｜' + th('ck_unit') + '：<b>' + esc(un) + '</b>｜' + esc(tz('ck_ver').replace('{n}', v.n || v.vn)) + (ID ? idl(I18N.ck_ver[1].replace('{n}', v.n || v.vn)) : '') + '｜' + th('ck_time') + '：' + esc(stamp(v.t)) + '</div>' +
      rows.map(function (x) { return '<div style="font-size:16px;padding:3px 0">' + (x[1] ? '<b style="color:#1b6b3a">✓</b> ' : '<span style="color:#7a6a55">－</span> ') + th(x[0]) + (x[1] ? '' : ' <span class="m">' + th('ck_empty') + '</span>') + '</div>'; }).join('');
  }
  function showCheck() {   // 顯示最近一次有填紀錄欄的版本（重新整理後也找得回來；樣板頁與學習單頁看到同一筆）
    var L = loadLedger(), v = null;
    for (var i = L.entries.length - 1; i >= 0; i--) if (L.entries[i].pv) { v = L.entries[i]; break; }
    if ($('chSurvey') && L.survey && document.activeElement !== $('chSurvey')) $('chSurvey').value = L.survey;
    if (!v) return; $('chPvCheck').innerHTML = checkHtml(v, L); $('chPvOutBox').style.display = 'block';
  }
  function renderHint() {
    var dcf = ((O.cfg || {}).hook || {}).decision || {}, dd = C.decisionRequired(dcf, O.unit, decisionsAll(), 0);
    var hk = dd.why === 'every' ? 'hint_every' : dd.why === 'weekly_done' ? 'hint_weekly_done' : dd.why === 'weekly_first' ? 'hint_weekly_first' : '';
    $('chPvHint').innerHTML = hk ? th(hk) : '';
  }
  function renderLite() {   // 學習單頁（只有紀錄欄）用的簡版
    var n = loadLedger().entries.length;
    $('chVers').innerHTML = esc(tz('devcount').replace('{n}', n)) + (ID ? idl(I18N.devcount[1].replace('{n}', n)) : ''); renderHint();
  }
  function renderLists() {
    $('chItems').innerHTML = H.items.map(function (x) {
      return '<div class="item"><span class="tag">' + esc((CATS.filter(function (c) { return c[0] === x.cat; })[0] || [0, '?'])[1]) + '</span>' + esc(x.text) + '</div>';
    }).join('') || '<p class="m">還沒有項目。</p>';
    $('chVers').innerHTML = H.versions.length ? H.versions.map(function (v) { return '第 ' + v.vn + ' 版｜' + esc((STAGES.filter(function (s) { return s[0] === v.stg; })[0] || [0, '?'])[1]) + '｜' + esc(v.note.slice(0, 40)); }).join('<br>') : '還沒有版本。';
    var a = H.ai; $('chAi').textContent = '共 ' + a.suggested + ' 條：照用 ' + a.accepted + '、改了再用 ' + a.modified + '、不用 ' + a.rejected + (a.reviewed ? '（已回看）' : '');
    $('chPlS').className = H.played.skin ? 'on' : ''; $('chPlR').className = H.played.rule ? 'on' : '';
    renderHint();
  }
  function after(a) { save(); renderLists(); UI.notify(a); }

  function onSaveVersion() {
      var stg = +$('chStg').value, note = $('chVn').value.trim(), hasUI = !O.provOnly, L0 = loadLedger(), feel = $('chFeel') ? $('chFeel').value.trim().slice(0, 120) : ''; if (!stg) return;
      var shw = ((O.cfg || {}).hook || {}).show || {}, dc = ((O.cfg || {}).hook || {}).decision || {}, dr = C.decisionRequired(dc, O.unit, decisionsAll(), stg), pv = null;
      if (shw.provenance !== false && dr.why !== 'off') {
        var ai = [].map.call(document.querySelectorAll('#chAiRow [data-ai7][aria-pressed="true"]'), function (b) { return b.getAttribute('data-ai7'); }), mine = $('chMine').value.trim(), msg = '', pf = pfGet(),
          feelv = (feel || (L0.feel[O.unit] || '')).trim(), df = C.decisionFields(dc, O.unit);
        if (dr.req || ai.length || mine || feelv) {
          if (!ai.length) msg = 'err_ai';
          else if (ai.indexOf('none') >= 0 && ai.length > 1) msg = 'err_both';
          else if (mine.length < 2) msg = 'err_mine';
          else if (feelv.length < 2) msg = 'err_feel';
          $('chPvMsg').innerHTML = msg ? th(msg) : ''; if (msg) return;
          var pm = ($('chMine').getAttribute('data-pf') || '') && pf ? ($('chMine').getAttribute('data-pf') || '') : '', pfe = ($('chFeel').getAttribute('data-pf') || '') && pf ? ($('chFeel').getAttribute('data-pf') || '') : '';
          var labels = ai.map(function (c) { return (AI7.filter(function (a) { return a[0] === c; })[0] || [c, c])[1]; });
          pv = { ai: ai, ro: 0, roNames: labels, mine: mine, why: '', last: '', why2: dr.why, f: df.fields, lp: false,
            prefill: !!(pm || pfe),
            mine_pf: { prefill_text: pm, saved_text: mine, edited: !!pm && mine !== pm, edit_chars: pm ? lev(pm, mine) : 0 },
            feel_pf: { prefill_text: pfe, saved_text: feelv, edited: !!pfe && feelv !== pfe, edit_chars: pfe ? lev(pfe, feelv) : 0 }, saved_at: new Date().toISOString() };
        }
      }
      var snap = null; try { snap = O.adapter && O.adapter.exportState ? JSON.stringify(O.adapter.exportState()) : null; } catch (e) { snap = null; }
      var vn = H.versions.length + 1, L = loadLedger(); H.versions.push({ vn: vn, stg: stg, note: note, bytes: snap ? snap.length : 0, t: Date.now(), pv: pv });
      if (snap) Store.put(key() + '_v' + vn, snap);
      if (hasUI) { UI.versionSaved(vn, [], note); UI.record('version', pv ? { vn: vn, stg: stg, ro: pv.ro } : { vn: vn, stg: stg }); }
      $('chVn').value = ''; if (feel) { L.feel[O.unit] = feel; $('chFeel').value = ''; }
      if (pv) {
        H.decisions.push({ unit: O.unit, vn: vn, key: pv.why2 === 'key' });
        L.entries.push({ n: L.entries.length + 1, unit: O.unit, tpl: O.tpl, vn: vn, stg: stg, t: Date.now(), key: pv.why2 === 'key', pv: pv });
        saveLedger(L);
        showCheck();
        var cp = ((dc || {}).copyText === 'on');   // 預設 off：不出現可複製的文字（內容只在學生自己的瀏覽器）
        $('chPvCopyBox').style.display = cp ? 'block' : 'none';
        $('chPvOut').value = cp ? '【第 ' + vn + ' 版的' + tz('title') + '】' + (ID ? '(' + I18N.title[1] + ', versi ke-' + vn + ')' : '') + '交給 AI 的部分：' + pv.roNames.join('、') + '｜我自己決定的：' + pv.mine + (pv.why ? '｜我為什麼這樣決定：' + pv.why : '') + (pv.last ? '｜' + tz('outlast') + '：' + pv.last : '') : '';
        [].forEach.call(document.querySelectorAll('#chAiRow [data-ai7]'), function (b) { b.setAttribute('aria-pressed', 'false'); b.className = ''; }); $('chMine').value = ''; $('chMine').removeAttribute('data-pf'); $('chFeel').removeAttribute('data-pf'); $('chPvMsg').innerHTML = '';
      }
      if (!pv && feel) saveLedger(L);
      if (hasUI) after('version'); else { save(); renderLite(); }
    }

  function wireProvCore() {
    $('chVb').onclick = onSaveVersion;
    $('chPvCp').onclick = function () { var t = $('chPvOut'); t.select(); try { if (navigator.clipboard) navigator.clipboard.writeText(t.value); else document.execCommand('copy'); $('chPvCp').innerHTML = th('copied'); } catch (e) { $('chPvCp').innerHTML = th('manual'); } };
    $('chSurvey').oninput = function () {
      var v = this.value.trim().toUpperCase().slice(0, 12), L = loadLedger(), code = ((((O.cfg || {}).hook || {}).survey || {}).code) || '';
      L.survey = v; saveLedger(L); $('chSvMsg').innerHTML = (v && v !== code) ? th('sv_bad') : ''; showCheck();
    };
    [].forEach.call(document.querySelectorAll('#chAiRow [data-ai7]'), function (b) {
      b.onclick = function () {
        var on = b.getAttribute('aria-pressed') !== 'true', c = b.getAttribute('data-ai7');
        if (on && c === 'none') [].forEach.call(document.querySelectorAll('#chAiRow [data-ai7]'), function (o) { o.setAttribute('aria-pressed', 'false'); o.className = ''; });
        if (on && c !== 'none') { var n0 = document.querySelector('#chAiRow [data-ai7="none"]'); if (n0) { n0.setAttribute('aria-pressed', 'false'); n0.className = ''; } }
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.className = on ? 'on' : '';
      };
    });
    prefillNow();
  }
  function wire() {
    ['chRS', 'chRR', 'chVn', 'chPt', 'chIn', 'chFf', 'chFq', 'chCh', 'chLn', 'chMe'].forEach(function (id) { UI.watchPaste($(id)); });
    $('chPrB').onclick = function () { H.predict.skin = +$('chPrS').value; H.predict.rule = +$('chPrR').value; UI.record('predict', { w2: H.predict, ph: 'pre', q: O.tpl + ':pair' }); after('predict'); };
    $('chPlS').onclick = function () { markPlayed('skin'); };
    $('chPlR').onclick = function () { markPlayed('rule'); };
    $('chJB').onclick = function () {
      H.w2.skin = +$('chJS').value; H.w2.rule = +$('chJR').value; H.reason.skin = $('chRS').value; H.reason.rule = $('chRR').value;
      if (H.versions.length >= 2) H.extractChecks = H.versions.length - 1;
      UI.record('reason', { ver: 'skin', text: H.reason.skin, field: 'chRS', pasted: $('chRS').dataset.pasted === '1', w2: H.w2, ph: 'post', q: O.tpl + ':skin' });
      UI.record('reason', { ver: 'rule', text: H.reason.rule, field: 'chRR', pasted: $('chRR').dataset.pasted === '1', w2: H.w2, ph: 'post', q: O.tpl + ':rule' });
      $('chRS').dataset.pasted = ''; $('chRR').dataset.pasted = '';
      if (H.predict.skin && H.predict.rule) UI.record('predict', { w2: H.w2, gap: (H.predict.skin !== H.w2.skin || H.predict.rule !== H.w2.rule) ? 1 : 0, ph: 'post', q: O.tpl + ':pair' });
      after('w2');
    };
    $('chItB').onclick = function () {
      var sh = ((O.cfg || {}).hook || {}).show || {}, tx = $('chIt').value.trim(), cat = sh.source === false ? 0 : +$('chCat').value;
      if (tx.length < 2 || (sh.source !== false && !cat)) return;
      H.items.push({ text: tx, cat: cat }); $('chIt').value = '';
      UI.record('item', { cat: cat || undefined, text: tx, field: 'chIt' }); after('item');
    };
    Array.prototype.forEach.call(document.querySelectorAll('#ctHook [data-folk]'), function (b) {
      b.onclick = function () { var id = b.getAttribute('data-folk'); if (H.folkOpened.indexOf(id) < 0) H.folkOpened.push(id); b.className = 'on'; UI.folkOpen(id); after('folk'); };
    });
    wireProvCore();
    Array.prototype.forEach.call(document.querySelectorAll('#ctHook [data-ai]'), function (b) {
      b.onclick = function () { var k = b.getAttribute('data-ai'); H.ai.suggested += 1; H.ai[k] += 1; H.ai.reviewed = false; UI.aiLog(); after('ai'); };
    });
    $('chAiR').onclick = function () { H.ai.reviewed = true; after('ai'); };
    var P = { chPt: ['playtest', function () { H.post.playtest += 1; }], chIn: ['intent', function () { H.post.intent = true; }], chFf: ['field_fb', function () { H.post.fieldfb += 1; }], chFq: ['field_q', function () { H.post.fieldq += 1; }],
      chCh: ['change', function () { H.post.change += 1; }], chLn: ['lens', function () { H.post.lens = true; }], chMe: ['meaning', function () { H.post.meaning = true; }] };
    Array.prototype.forEach.call(document.querySelectorAll('#ctHook [data-post]'), function (b) {
      var id = b.getAttribute('data-post'), p = P[id];
      b.onclick = function () {
        var v = $(id).value.trim(); if (v.length < 4) return; p[1]();
        var ex = { text: v, field: id, pasted: $(id).dataset.pasted === '1' }; if (p[0] === 'change') ex.ch = /不改|不用改|維持|保留/.test(v) ? 0 : 1;
        UI.record(p[0], ex); $(id).dataset.pasted = ''; $(id).value = ''; after(p[0]);
      };
    });
  }

  function markPlayed(ver) { if (!H) return; if (ver === 'skin' || ver === 'rule') { H.played[ver] = true; UI.record('play', { ver: ver }); after('play'); } }

  /* 樣板自己有判斷題時，在學生選好之後呼叫這個（code＝選項的位置 1–4，與 W2 四選一同序：決定不會變／感覺變了決定沒變／決定會變／說不準；reason 可省略）。
     這樣學生不用在掛鉤裡再答一次；兩邊的選項字面不同也沒關係，記的是位置。 */
  function judged(ver, code, reason) {
    if (!H || (ver !== 'skin' && ver !== 'rule') || !(code >= 1 && code <= 4)) return;
    H.w2[ver] = code | 0; if (reason != null) H.reason[ver] = String(reason);
    if (H.versions.length >= 2) H.extractChecks = H.versions.length - 1;
    UI.record('reason', { ver: ver, text: H.reason[ver], field: 'tplJudge_' + ver, w2: H.w2, ph: 'post', q: O.tpl + ':' + ver });
    if (H.predict.skin && H.predict.rule && H.w2.skin && H.w2.rule) UI.record('predict', { w2: H.w2, gap: (H.predict.skin !== H.w2.skin || H.predict.rule !== H.w2.rule) ? 1 : 0 });
    $('chJS').value = H.w2.skin; $('chJR').value = H.w2.rule; after('w2');
  }
  /* 學生抽文化卡、換一批卡：樣板在動作成功後呼叫。cardId 只放卡片代碼（小寫英數底線），不放學生打的字。 */
  function drew(cardId) { if (!H) return; H.draws = (H.draws || 0) + 1; UI.record('draw', { cd: String(cardId || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30) }); after('draw'); }
  function swapped(cardId) { if (!H) return; H.swaps = (H.swaps || 0) + 1; UI.record('swap', { cd: String(cardId || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30) }); after('swap'); }
  function mount(o) {
    O = o || {}; O.env = O.env == null ? 57 : O.env; O.unit = O.unit || 'W11'; ID = wantId(); H = load();
    build(); renderLists(); showCheck();
    $('chPrS').value = H.predict.skin; $('chPrR').value = H.predict.rule; $('chJS').value = H.w2.skin; $('chJR').value = H.w2.rule; $('chRS').value = H.reason.skin; $('chRR').value = H.reason.rule;
    var info = UI.mount({ env: O.env, unit: O.unit, course: O.course, table: O.table, forceMode: O.forceMode, writer: O.writer, getState: state, cfg: O.cfg });
    UI.notify('load'); return info;
  }
  /* 學習單頁用：只放「改作版本存檔＋紀錄欄」那一段，不連助教、不載樣板；紀錄與樣板頁共用同一本紀錄簿（ct_prov_<編號>）。 */
  function mountProv(el, o) {
    O = o || {}; O.env = O.env == null ? 57 : O.env; O.unit = O.unit || C.unitOfDate(Date.now()); O.tpl = 'sheet'; O.provOnly = true; ID = wantId(); H = load();
    css(); var d = document.createElement('div'); d.id = 'ctHook'; d.innerHTML = provHtml();
    el.appendChild(d); applyShow(); wireProvCore(); renderLite(); showCheck();
    return { env: O.env, unit: O.unit, lang: ID ? 'id' : 'zh' };
  }
  root.CT_HOOK = { prefill: prefillNow, setStore: setStore, mount: mount, mountProv: mountProv, markPlayed: markPlayed, judged: judged, drew: drew, swapped: swapped, state: function () { return H ? state() : null; }, evidence: function () { return H ? JSON.parse(JSON.stringify(H)) : null; } };
})(typeof self !== 'undefined' ? self : this);
