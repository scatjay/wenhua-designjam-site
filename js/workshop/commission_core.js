/* 局部修圖委託：前端核心（純函式＋Firebase 讀寫）。設計：docs/workshop/COMMISSION_QUEUE_v1_20261021.md 第 2、4 節。
   🔴 配額由 worker 端裁決；這裡的「還剩幾張」只是顯示，前端被改也不影響實際張數。
   🔴 只讀寫自己那一層 commissions/{場次}/{編號}（逐場次 once 讀，不訂閱整包）＋ 帳本 commission_ledger/{週}/{編號}。
   🔴 場次與週次一律用台灣時間（UTC+8），與 night_worker／commission_queue.py 同規則。
   純函式部分 node 可測：COMM_CORE；COMM_STORE 只在瀏覽器且有 firebase 時才建立。 */
(function (root) {
  'use strict';
  var LIM = 3, TW = 8 * 3600000, DAY = 86400000, KEEP_DAYS = 14;
  var ASCII_TARGET = /^[A-Za-z0-9 ,.'\-_()]{1,60}$/, ASCII_PROMPT = /^[\x20-\x7e]{1,300}$/, IMAGE_NAME = /^[A-Za-z0-9_\-.]{1,120}$/, REF_RX = /^https:\/\/[^\s]{4,280}$/;
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tw(ms) { return new Date(ms + TW); }
  function dateKey(ms) { var d = tw(ms); return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
  function sessKey(course, ms) { return course + '-' + dateKey(ms) + (tw(ms).getUTCHours() < 14 ? 'am' : 'pm'); }
  function weekKey(ms) {
    var d = tw(ms), dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), n = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - n);
    var y = dt.getUTCFullYear(), w = Math.ceil(((dt - Date.UTC(y, 0, 1)) / DAY + 1) / 7);
    return y + '-W' + pad(w);
  }
  /* 近 days 天（含今天）所有場次鍵，新到舊 */
  function recentSessions(course, nowMs, days) {
    var out = [];
    for (var i = 0; i < (days || KEEP_DAYS); i++) { var ms = nowMs - i * DAY, k = dateKey(ms); out.push(course + '-' + k + 'pm'); out.push(course + '-' + k + 'am'); }
    return out;
  }
  function courseOf(env, search, pick) {
    var m = /[?&]c=(\d{4,6})/.exec(search || '');
    if (m && (m[1] === '47602' || m[1] === '46582' || m[1] === '47618')) return m[1];
    if (env != null && env >= 55 && env <= 60) return 'test';
    if (env != null && env >= 201 && env <= 299) return '47618';
    if (env != null && env >= 101 && env <= 199) return '46582';
    if (env != null && env >= 1 && env <= 52) return '47602';
    return pick || '47602';
  }
  function envOk(course, code) {
    if (!/^(0|[1-9]\d{0,2})$/.test(String(code))) return false;
    var n = Number(code);
    if (n === 0 || n === 99) return true;
    if (course === 'test') return n >= 55 && n <= 60;
    if (course === '47602') return n >= 1 && n <= 52;
    if (course === '46582') return n >= 101 && n <= 199;
    if (course === '47618') return n >= 201 && n <= 299;
    return false;
  }
  /* 送出前檢查（與 worker 的 validate_item 同規則；回 {ok, msg}）。msg 是學生看得懂的話。 */
  function validate(f) {
    var t = (f.target || '').trim(), p = (f.prompt || '').trim(), im = f.image || '', ref = (f.ref || '').trim();
    if (!im) return { ok: false, msg: '先放一張原圖。' };
    if (!IMAGE_NAME.test(im) || im.indexOf('..') >= 0) return { ok: false, msg: '圖檔名稱只能用英文、數字、底線（例：hammer.png），請先改檔名。' };
    if (!t || !p) return { ok: false, msg: '「要改哪裡」和「改成什麼」都要寫。' };
    if (!ASCII_TARGET.test(t)) return { ok: false, msg: '「要改哪裡」請用英文短詞（60 字以內，例：hammer）。' };
    if (!ASCII_PROMPT.test(p)) return { ok: false, msg: '「改成什麼」請用英文寫（300 字以內）。' };
    if (ref && !REF_RX.test(ref)) return { ok: false, msg: '參考圖連結要用 https:// 開頭。' };
    return { ok: true, msg: '' };
  }
  /* ── 圖片通道：縮圖規格與檢查（與 worker 的 commission_files.py 同規則：JPEG、最長邊 768、≤200KB） ── */
  var IMG_EDGE = 768, IMG_MAX_BYTES = 200 * 1024, IMG_FILE_MAX = 20 * 1024 * 1024, DATA_RX = /^data:image\/jpeg;base64,[A-Za-z0-9+\/]+={0,2}$/;
  function fitSize(w, h, max) { var s = Math.min(1, (max || IMG_EDGE) / Math.max(w, h)); return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) }; }
  function dataUrlBytes(s) { var i = String(s).indexOf(','); if (i < 0) return 0; var b = String(s).slice(i + 1), pad = /=+$/.exec(b); return Math.floor(b.length * 3 / 4) - (pad ? pad[0].length : 0); }
  function validImageData(s) { return typeof s === 'string' && s.length <= IMG_MAX_BYTES * 4 / 3 + 64 && DATA_RX.test(s) && dataUrlBytes(s) <= IMG_MAX_BYTES; }
  /* 原檔名 → 合乎規則的英文數字檔名（中文檔名、空白、特殊字元都換成底線；副檔名一律 .jpg，因為送出的是縮過的 JPEG） */
  function safeImageName(name) {
    var b = String(name || '').replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[^A-Za-z0-9_\-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
    return (b || 'photo') + '.jpg';
  }
  var FINAL = { done: 1, failed: 1, cancelled: 1, rejected: 1 };
  function isFinal(st) { return !!FINAL[st]; }
  /* 本週用掉幾張：帳本裡的 id ＋ 還沒入帳（worker 還沒掃到）的新委託。rejected 不算。 */
  function quotaUsed(ledgerIds, items, wk) {
    var set = {}; (ledgerIds || []).forEach(function (i) { set[i] = 1; });
    (items || []).forEach(function (x) {
      if (set[x.id]) return;
      if (x.week ? x.week !== wk : (typeof x.created === 'number' && weekKey(x.created) !== wk)) return;
      if (x.status === 'pending' || x.status === 'mask_ready' || x.status === 'approved' || x.status === 'done') set[x.id] = 1;
    });
    return Object.keys(set).length;
  }
  var REASONS = {
    quota: '這週 3 張已經用完了，下週再送。',
    created_out_of_range: '你的裝置時間和電腦對不上，請重新整理後再送一次。',
    target_not_english_short: '「要改哪裡」請改用英文短詞。',
    prompt_not_english: '「改成什麼」請改用英文。',
    bad_image_name: '圖檔名稱不能用，請改成英文數字的檔名。',
    bad_ref: '參考圖連結要用 https:// 開頭。',
    bad_code: '這個信封編號不能送委託。',
    code_path_mismatch: '編號對不上，請重新整理後再送。',
    no_mask_yet: '這張還沒出過遮罩預覽，請先等預覽。',
    not_in_ledger: '這張沒有入帳，請重新送一張。',
    no_orig: '原圖沒有傳成功，請重新送一張。',
    bad_orig: '原圖格式不對，請重新選一張圖再送。',
    orig_too_big: '原圖太大了，請重新選一張圖再送。'
  };
  function reasonText(r) { return REASONS[r] || '這張沒通過檢查，請重新送一張（代碼：' + String(r || '?').slice(0, 40) + '）。'; }
  var NAMES = {
    pending: ['排隊中，等夜裡的電腦畫遮罩預覽', ''], mask_ready: ['遮罩預覽好了，請你確認', 'ask'], approved: ['已確認，等電腦重畫', ''],
    done: ['完成了', 'ok'], failed: ['這張沒畫成（張數已退回），請改說法再送', 'bad'], cancelled: ['已取消', ''], rejected: ['沒有收件', 'bad']
  };
  function statusText(x) {
    if (x.status === 'pending' && !x.verdict) return ['剛送出，等電腦收件', ''];
    if (x.status === 'rejected') return ['沒有收件：' + reasonText(x.reason), 'bad'];
    return NAMES[x.status] || [String(x.status), ''];
  }
  root.COMM_CORE = { IMG_EDGE: IMG_EDGE, IMG_MAX_BYTES: IMG_MAX_BYTES, IMG_FILE_MAX: IMG_FILE_MAX, fitSize: fitSize, dataUrlBytes: dataUrlBytes, validImageData: validImageData, safeImageName: safeImageName, LIM: LIM, KEEP_DAYS: KEEP_DAYS, dateKey: dateKey, sessKey: sessKey, weekKey: weekKey, recentSessions: recentSessions, courseOf: courseOf, envOk: envOk, validate: validate, isFinal: isFinal, quotaUsed: quotaUsed, reasonText: reasonText, statusText: statusText };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.COMM_CORE;

  /* ───────── Firebase 讀寫（只在瀏覽器且 firebase 已載入） ───────── */
  if (typeof firebase === 'undefined' || typeof document === 'undefined') return;
  var db = null, course = null, env = null;
  function base() { return 'whgm/analysis/workshop/' + course; }
  function ipath(sess, id) { return base() + '/commissions/' + sess + '/' + env + (id ? '/' + id : ''); }
  function init(database, courseKey, e) { db = database; course = courseKey; env = String(e); }
  function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  /* 讀自己近兩週的委託（逐場次一次讀取）＋本週帳本。sessList 可只傳要重讀的場次。 */
  function loadMine(sessList) {
    var now = Date.now(), wk = weekKey(now);
    var reads = (sessList || recentSessions(course, now, KEEP_DAYS)).map(function (s) {
      return db.ref(ipath(s)).once('value').then(function (snap) {
        var v = snap.val() || [], out = [];
        Object.keys(v).forEach(function (id) { var o = v[id]; if (o && typeof o === 'object') { o.id = id; o.sess = s; out.push(o); } });
        return out;
      });
    });
    var led = db.ref(base() + '/commission_ledger/' + wk + '/' + env).once('value').then(function (s) { return Object.keys(s.val() || {}); });
    return Promise.all([Promise.all(reads), led]).then(function (r) {
      var items = [].concat.apply([], r[0]);
      items.sort(function (a, b) { return (a.created || 0) - (b.created || 0) || (a.id < b.id ? -1 : 1); });
      return { items: items, ledgerIds: r[1], week: wk };
    });
  }
  /* 圖片節點（獨立於 commissions，清單訂閱不會下載圖）：只讀寫自己那一層 …/commission_files/{場次}/{編號}/{委託id}/{欄位} */
  function fpath(sess, id, field) { return base() + '/commission_files/' + sess + '/' + env + '/' + id + (field ? '/' + field : ''); }
  var FIELDS = { orig: 1, maskThumb: 1, resultThumb: 1 };
  function loadFile(sess, id, field) {
    if (!FIELDS[field]) return Promise.reject(new Error('bad field'));
    return db.ref(fpath(sess, id, field)).once('value').then(function (s) { var v = s.val(); return validImageData(v) ? v : null; });
  }
  /* 送出：先寫圖（f.origData 是縮好的 JPEG dataURL），圖寫成功才寫委託——worker 不會看到「有委託、沒有圖」 */
  function send(f) {
    var v = validate(f); if (!v.ok) return Promise.reject(new Error(v.msg));
    if (!validImageData(f.origData)) return Promise.reject(new Error('原圖還沒處理好，請重新選一張圖。'));
    var id = newId(), sess = sessKey(course, Date.now());
    var o = { code: env, target: f.target.trim(), prompt: f.prompt.trim(), image: f.image, status: 'pending', created: firebase.database.ServerValue.TIMESTAMP };
    if ((f.ref || '').trim()) o.ref = f.ref.trim();
    return db.ref(fpath(sess, id, 'orig')).set(f.origData).then(function () { return db.ref(ipath(sess, id)).set(o); }).then(function () { return { id: id, sess: sess }; });
  }
  /* 把選到的圖縮成最長邊 768、JPEG（q0.8，超過 200KB 就降品質、再不行就縮小）。檔案超過 20MB 或打不開都擋下。 */
  function shrinkImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('先放一張原圖。'));
      if (file.size > IMG_FILE_MAX) return reject(new Error('這張圖檔太大了（超過 20 MB），請換一張小一點的。'));
      var url = URL.createObjectURL(file), im = new Image();
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('這個檔案打不開，請換一張圖（jpg 或 png）。')); };
      im.onload = function () {
        URL.revokeObjectURL(url);
        var sz = fitSize(im.naturalWidth || im.width, im.naturalHeight || im.height, IMG_EDGE);
        for (var round = 0; round < 8; round++) {
          var c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h; var g = c.getContext('2d');
          g.fillStyle = '#fff'; g.fillRect(0, 0, sz.w, sz.h); g.drawImage(im, 0, 0, sz.w, sz.h);
          for (var q = 0.8; q >= 0.3; q -= 0.1) { var d = c.toDataURL('image/jpeg', q); if (dataUrlBytes(d) <= IMG_MAX_BYTES) return resolve(d); }
          sz = { w: Math.max(1, Math.round(sz.w * 0.85)), h: Math.max(1, Math.round(sz.h * 0.85)) };
        }
        reject(new Error('這張圖壓不小，請換一張。'));
      };
      im.src = url;
    });
  }
  function patch(sess, id, p) { return db.ref(ipath(sess, id)).update(p); }
  root.COMM_STORE = { init: init, loadMine: loadMine, send: send, loadFile: loadFile, shrinkImage: shrinkImage, filePath: fpath, approve: function (s, id) { return patch(s, id, { status: 'approved' }); },
    redo: function (s, id, target) { if (!ASCII_TARGET.test((target || '').trim())) return Promise.reject(new Error('請用英文短詞。')); return patch(s, id, { status: 'pending', target: target.trim() }); },
    cancel: function (s, id) { return patch(s, id, { status: 'cancelled' }); }, course: function () { return course; } };
})(typeof window !== 'undefined' ? window : globalThis);
