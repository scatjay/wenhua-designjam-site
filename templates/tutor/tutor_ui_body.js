/* 文化遊戲松 AI 助教・面板（瀏覽器）。任何樣板都可以掛：
     CT_UI.mount({ env, unit, getState: function(){ return 樣板當下狀態 }, table: 分派表 })
     模式（A 判斷引導／B 檢核功能）由分派表決定，學生端看不到；面板外觀兩種模式完全一樣。
     樣板在「有意義的動作」之後呼叫 CT_UI.notify('動作名')（玩完一版、作答、改了規則…），助教才判斷要不要開口；打字中不打擾。
   不用 alert／confirm／prompt；所有按鈕 ≥44px；事件寫入見 tutor_core.js 的 writer（預設不寫，?emu=1 寫本機模擬器）。 */
(function (root) {
  'use strict';
  var C = root.CT_CORE, $ = function (id) { return document.getElementById(id); };
  var S = { env: 57, unit: 'W11', getState: null, mem: null, cur: null, lastCode: '', same: 0, w: null, sess: '', log: [], quietUntil: 0, mode: 'B', tg: 'na', table: {}, prev: {}, claims: [] };

  function memKey() { return 'ct_mem_' + S.env; }
  function loadMem() { try { var m = JSON.parse(localStorage.getItem(memKey()) || 'null'); if (m && m.ok) return m; } catch (e) { /* 私密視窗或封鎖儲存：照樣可用，只是不記得 */ } return C.newMem(); }
  function saveMem() { try { localStorage.setItem(memKey(), JSON.stringify(S.mem)); } catch (e) { /* 同上 */ } }

  var AFTER_ACT = { reply: '回覆了', escalate: '按了還是卡住', resolved: '自己解開了', dismiss: '關掉了' };
  function emit(o) {
    if (AFTER_ACT[o.act] && S.hist && S.hist.length) S.hist[S.hist.length - 1].after = AFTER_ACT[o.act];   // 【前情】：助教說完之後學生做了什麼（只記動作名稱，不含學生文字）
    var st = S.getState() || {};
    var ev = C.makeEvent(Object.assign({ unit: S.unit, tpl: st.tpl, mode: S.mode, tg: S.tg, crs: String(S.sess || '').split('-')[0], cv: S.cv, lay: S.layer }, o));
    S.log.push(ev);
    S.w.put(S.sess, S.env, ev);
    renderDebug();
    return ev;
  }

  function css() {
    if ($('ctCss')) return;
    var s = document.createElement('style'); s.id = 'ctCss';
    s.textContent = '#ctPanel{background:transparent;color:var(--ta-ink,#2b2420)}'+
      '#ctPanel[hidden]{display:none}#ctPanel h3{display:none}#ctPanel .ctTag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:var(--ta-soft,#f6ece0);margin:0 4px 6px 0}' +
      '#ctMsg{font-size:16px;line-height:1.6;margin:6px 0 10px;padding:10px 12px;border-radius:12px;background:var(--ta-soft,#f6ece0)}' +
      '#ctPanel textarea{width:100%;box-sizing:border-box;min-height:64px;font-size:16px;border:1px solid var(--ta-hair,#d9cbbd);border-radius:10px;padding:8px;background:var(--ta-sf,#fffaf3);color:var(--ta-ink,#2b2420)}' +
      '#ctPanel .ctRow{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}#ctPanel button{min-height:44px;padding:0 14px;font-size:15px;border-radius:10px;border:1px solid var(--ta-hair,#d9cbbd);background:var(--ta-sf,#fffaf3);color:var(--ta-ink,#2b2420);flex:1 1 auto}' +
      '#ctPanel button.pri{background:var(--ta-ac,#b5462f);color:var(--ta-on,#fff);border-color:var(--ta-ac,#b5462f)}#ctNote{font-size:13px;color:var(--ta-mut,#6f645c);margin-top:8px}';
    document.head.appendChild(s);
  }
  function build() {
    css();
    var D = window.TA_DOCK.create({ onFab: function (d) { if (d.isOpen()) d.open(false); else askHelp(); } });
    var p = document.createElement('section'); p.id = 'ctPanel'; p.setAttribute('aria-live', 'polite'); p.setAttribute('aria-label', '助教');
    p.innerHTML = '<div id="ctTags"></div><div id="ctMsg">還沒有提示。玩一玩，卡住時助教會開口；也可以隨時按「問AI助教」要一個提示。</div>' +
      '<label for="ctReply" style="font-size:14px">想回答助教的話寫這裡（只存在你的瀏覽器）</label><textarea id="ctReply" maxlength="300"></textarea>' +
      '<div class="ctRow"><button type="button" class="pri" id="ctSend">回答</button><button type="button" id="ctMore">還是卡住，多一點提示</button><button type="button" id="ctSelf">我自己想想</button></div>' +
      '<div id="ctNote">助教只會問你問題、指出去哪裡看，不會替你寫答案。要和助教討論你的企劃，請回學習單右下角的「問AI助教」。</div>';
    D.body.appendChild(p); D.setCtx('樣板：' + (S.unit || ''));
    $('ctSend').onclick = reply; $('ctMore').onclick = more; $('ctSelf').onclick = dismiss;
  }
  function show(move) {
    if (S.off) return;
    S.cur = move; (S.hist = S.hist || []).push({ sc: move.scName || '', lv: move.lv | 0, text: String(move.text || '').slice(0, 60), after: '還沒有動作' }); if (S.hist.length > 6) S.hist.shift();
    if (window.TA_DOCK.get()) { window.TA_DOCK.get().open(true); window.TA_DOCK.get().setBadge(false); }
    emit({ act: 'open', stuck: move.code, sc: move.sc, lv: move.lv, by: 'student' });   // 面板被打開（D11-04）
    $('ctTags').innerHTML = '<span class="ctTag">' + move.scName + '</span><span class="ctTag">提示 ' + (move.lv + 1) + '／' + (S.maxLv + 1) + '</span>';
    $('ctMsg').textContent = move.text; if ($('ctThink')) $('ctThink').textContent = '';
    askLLM(move);
    $('ctMore').disabled = move.lv >= S.maxLv; $('ctMore').textContent = move.lv >= S.maxLv ? '已經是最多的提示了' : '還是卡住，多一點提示';
  }
  function hide() { if (window.TA_DOCK && window.TA_DOCK.get()) window.TA_DOCK.get().open(false); }

  /* 第二層（LLM）面板替換流程：先顯示規則層基準句（0 秒），請求送出後，LLM 句好了再替換；逾時放棄、留基準句。
     每一次都記一筆 llm 事件（model＝rule／argon／flash／pro、dg 降級層級、nth 本堂第幾次、cp 因上限改規則句），學生端不顯示任何「降級」字樣。 */
  var STUDENT_KEEP = 300;
  function stateBullets(st) {
    var p = st.played || {}, w = st.w2 || {}, ai = st.ai || {}, b = st.build || {}, out = [];
    out.push('玩過：' + (p.skin ? '皮版' : '') + (p.rule ? '規則版' : '') + (!p.skin && !p.rule ? '還沒玩' : ''));
    if (w.skin || w.rule) out.push('判斷代碼：皮版 ' + (w.skin || 0) + '、規則版 ' + (w.rule || 0));
    if (ai.suggested) out.push('AI 建議 ' + ai.suggested + ' 條：照用 ' + (ai.accepted || 0) + '、改了 ' + (ai.modified || 0) + '、不用 ' + (ai.rejected || 0));
    if (b.versions) out.push('已存 ' + b.versions + ' 版');
    return out.slice(0, 8).map(function (x) { return x.slice(0, 80); });
  }
  /* 學生自由文字只在本機處理：預設（含 queue 傳輸）不把原文放進請求，只送特徵描述（字數級距、提到哪些作品元素、有無因果詞、有無指向出處）。
     原文只在 transport=http（老師電腦本機測試）且設定檔 llm.sendStudentText=true 時才會帶。 */
  function textFeat(txt, t) {
    var n = txt.replace(/\s/g, '').length; if (!n) return '（還沒寫）';
    var hit = (t.elems || []).filter(function (e) { return txt.indexOf(e) >= 0; }).slice(0, 4);
    var cause = /因為|所以|如果|才會|導致|結果|拿掉|換成|變成/.test(txt), src = /原著|資料卡|出處|廟|書上|回到/.test(txt);
    return ('（原文不離開本機）字數約' + (n < 15 ? '十幾字以內' : n < 50 ? '數十字' : '五十字以上') + '；提到作品元素：' + (hit.length ? hit.join('、') : '無') + '；有因果說法：' + (cause ? '有' : '無') + '；指向出處：' + (src ? '有' : '無')).slice(0, 200);
  }
  function llmCtx(mv, st) {
    var t = C.TPL_BY_ID[st.tpl] || {}, rs = st.reason || {};
    return { tplName: String(t.name || '').slice(0, 40), genre: String(t.genre || '').slice(0, 20), card: String(t.card || '').slice(0, 20), kind: String(t.kind || 'obj').slice(0, 10),
      recent: S.recentN > 0 ? (S.hist || []).slice(0, -1).slice(-S.recentN).map(function (h) { return ('L' + h.lv + ' ' + h.sc + '：「' + h.text + '」→ 學生之後：' + h.after).slice(0, 140); }) : undefined,
      stuckLabel: String(mv.stuckLabel || '').slice(0, 40), sc: mv.sc, lv: Math.max(0, Math.min(3, mv.lv | 0)), baseline: String(mv.text || '').slice(0, 300),
      studentText: S.sendText ? String(rs.rule || rs.skin || S.prev.ctReply || '').slice(0, STUDENT_KEEP) : textFeat(String(rs.rule || rs.skin || S.prev.ctReply || ''), t), state: stateBullets(st),
      folk: (t.folk || []).slice(0, 3).map(function (id) { var f = C.FOLK_BY_ID[id]; return f ? { id: f.id, name: String(f.name).slice(0, 40), where: String(/第[一二三四五六七八九十]+回/.exec(f.loc || '') ? '原著' + /第[一二三四五六七八九十]+回/.exec(f.loc)[0] : '小封神資料卡').slice(0, 40), wc: !!f.wc } : null; }).filter(Boolean) };
  }
  function askLLM(mv) {
    if (!S.llm || !mv || mv.silent) return;
    var token = ++S.llmSeq, st = S.getState() || {}, started = Date.now();
    var req = { mode: S.mode, unit: S.unit, sc: mv.sc, initiated: mv.initiated ? 1 : 0, base: String(mv.text || '').slice(0, 300), ctx: llmCtx(mv, st) };
    var wait = Math.round(S.llm.jitter() * 1000), think = $('ctThink');   // 先隨機等 0–8 秒再送，全班同一秒發問時不會擠成一團；等的時候面板顯示「助教思考中」，規則句照舊在上面
    if (!think && $('ctMsg')) { think = document.createElement('div'); think.id = 'ctThink'; think.className = 'ctThink'; think.style.cssText = 'font-size:13px;color:#7a6a55;margin:-4px 0 8px'; $('ctMsg').parentNode.insertBefore(think, $('ctMsg').nextSibling); }
    if (think) think.textContent = '助教思考中…';
    var finish = function () { var t = $('ctThink'); if (t && token === S.llmSeq) t.textContent = ''; };
    new Promise(function (res) { setTimeout(res, wait); }).then(function () { return token === S.llmSeq ? S.llm.ask(S.sess, S.env, req) : { model: 'rule' }; }).then(function (a) { finish();
      var model = (a && (a.model === 'argon' || a.model === 'flash' || a.model === 'pro')) ? a.model : 'rule';
      if (token === S.llmSeq && S.cur === mv && model !== 'rule' && a.say && $('ctMsg')) { $('ctMsg').textContent = String(a.say); S.cur.text = String(a.say); }   // 好了才替換
      emit({ act: 'llm', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'tutor', model: model, dg: a && a.dg, nth: a && a.nth, cp: a && a.cp ? 1 : 0, sec: Math.round((Date.now() - started) / 1000) });
    }).catch(function () { finish();
      emit({ act: 'llm', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'tutor', model: 'rule', sec: Math.round((Date.now() - started) / 1000) });   // 逾時或失敗：留基準句
    });
  }

  /* 樣板通知「發生了有意義的動作」→ 判斷要不要開口 */
  function notify(action) {
    if (S.off) return;   // 研究設定 tutor.mode = off：只有樣板與證據掛鉤，沒有助教面板
    var st = S.getState(), list = C.diagnose(st), code = list[0];
    if (S.cur && S.cur.stuck !== 'READY' && list.indexOf(S.cur.stuck) < 0) {   // 上一個卡點已不在清單裡＝學生自己解開了：記下是在第幾層解開的
      emit({ act: 'resolved', stuck: S.cur.stuck, sc: S.cur.sc, lv: S.cur.lv, by: 'student' });
      C.recordResolved(S.mem, S.cur.sc, S.cur.lv); saveMem(); S.cur = null; hide();
    }
    var fp = JSON.stringify(st);
    S.same = (code === S.lastCode && action === S.lastAct && fp === S.lastFp) ? S.same + 1 : 1; S.lastCode = code; S.lastAct = action; S.lastFp = fp;   // 挫折＝同一個動作在同一處反覆、而且狀態沒有前進（照用 AI 四次會改變狀態，不算）
    if (Date.now() < S.quietUntil) return;   // 學生按了「我自己想想」：60 秒內不主動打擾
    var mv = C.nextMove(st, S.mem, { sameStuckCount: S.same, mode: S.mode, unit: S.unit, fade: S.table.fade, o: S.table.opts });
    if (mv.silent) return;
    if (S.cur && S.cur.stuck === code) {   // 同一個卡點已經在講了，不重複；但第 3 次還在同一處且仍在 L0，就主動往下指一步（減少挫折）
      if (mv.frustrated && S.cur.lv === 0 && !S.cur.frustrated) { emit({ act: 'escalate', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'tutor' }); show(mv); }
      return;
    }
    if ((code === 'READY' && action !== 'ready') || action === 'load') { if (window.TA_DOCK.get()) window.TA_DOCK.get().setBadge(true); return; }   // 準備交、或剛打開頁面時只亮小點，不跳出來蓋住遊戲（11-12 掛鉤相容性測試發現：載入時就彈出的面板會蓋住頁面下方）
    emit({ act: 'offer', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'tutor' });
    show(mv);
  }
  function askHelp() {
    if (S.off) return;
    var st = S.getState(), list = C.diagnose(st);
    var mv = C.nextMove(st, S.mem, { askedByStudent: true, sameStuckCount: S.same, mode: S.mode, unit: S.unit, fade: S.table.fade, o: S.table.opts });
    emit({ act: 'offer', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'student' });
    mv.initiated = true;   // 學生主動求助（降級到「求助才呼叫」時，只有這種會送 LLM）
    show(mv);
  }
  function more() {
    if (!S.cur) return;
    var st = S.getState(), lv = C.escalate(S.cur, S.table.opts);
    var mv = C.nextMove(st, S.mem, { askedByStudent: true, lv: lv, sameStuckCount: 0, mode: S.mode, unit: S.unit, fade: S.table.fade, o: S.table.opts });   // 減壓句只在第一次挫折時說，不每層都重複
    emit({ act: 'escalate', stuck: mv.stuck, sc: mv.sc, lv: mv.lv, by: 'student' });
    mv.initiated = true;
    show(mv);
  }
  function reply() {
    if (!S.cur) return;
    var st = S.getState(), txt = $('ctReply').value, f = C.featurize(txt, st.tpl, { lastTutor: S.cur.text, prevText: S.prev.ctReply, pasted: $('ctReply').dataset.pasted === '1' });
    S.prev.ctReply = txt; $('ctReply').dataset.pasted = '';
    emit({ act: 'reply', stuck: S.cur.stuck, sc: S.cur.sc, lv: S.cur.lv, by: 'student', rf: f });
    var lvR = C.reasonLevel(f);
    $('ctReply').value = '';
    /* 形成式回饋（只回應「有沒有講到規則／有沒有因果／有沒有回到出處」，不評好壞、不給答案）。B 模式只回「已記下＋下一步」。
       防順從的特徵（重複助教用語、雷同、貼上）只記錄、不顯示、不影響回饋。 */
    if (S.mode === 'B') { $('ctMsg').textContent = '已記下。' + C.nextMove(st, S.mem, { askedByStudent: true, mode: 'B', unit: S.unit }).text; return; }
    var POST_SC = ['own', 'version', 'lens', 'playtest', 'intent', 'fieldq', 'fieldcite', 'meaning'];
    var fb = /＿/.test(txt) ? '句子裡的空格要換成你作品裡的具體東西：哪一層、哪一張、哪個數字。' :
      S.cur.sc === 'own' ? '那有沒有哪一個地方，是你看了之後決定保留或不要的？那就是你的決定，把它放進「② 內容出處」，誰決定選「我」。' :
      POST_SC.indexOf(S.cur.sc) >= 0 && lvR !== 'rule_cause' ? '寫一個你作品裡具體的地方（哪一層、哪一張、哪個數字），再寫你為什麼這樣決定。' :
      lvR === 'rule_cause' ? '你講到了一條規則，也講出了「因為…所以…」。把這句放進你的判斷理由裡。' :
      lvR === 'rule' ? '你講到了規則。再補一句「因為…所以…」，說明它怎麼改變你的做法。' :
      f.idk ? '說「不知道」也可以。先回去玩一次，只看「' + ((C.TPL_BY_ID[st.tpl] || {}).card || '文化') + '」出現的那一刻。' :
      (S.cur.sc === 'ai_review' || f.ai) ? '你提到 AI 的建議。挑一條，你怎麼確認它是對的？自己玩過、問過人，還是讀過出處？' :
      S.cur.sc === 'source' ? '先去讀那一段，讀完用自己的話說一個你沒想到的細節。' :
      S.cur.sc === 'field' ? '這一格要寫你自己看到或問到的。寫下地點或對象，再寫一句你看到什麼。' :
      '你講的比較像畫面或故事。那一刻有沒有哪條規則讓你不得不那樣做？';
    if (f.src) fb += ' 你也回到了出處，很好——記得標明哪些是原著、哪些是你加的。';
    $('ctMsg').textContent = fb;
  }
  function dismiss() {
    if (S.cur) emit({ act: 'dismiss', stuck: S.cur.stuck, sc: S.cur.sc, lv: S.cur.lv, by: 'student' });
    S.quietUntil = Date.now() + 60000; hide();
  }
  /* 自己檢核：樣板交勾選結果進來，助教回一句比對提醒 */
  function selfCheck(ticked) {
    var st = S.getState(), cal = C.calibrate(st, ticked, S.table.opts);
    emit({ act: 'self_check', stuck: 'READY', sc: 'handover', lv: 0, by: 'student', cal: { tick: ticked.length, over: cal.over.length, under: cal.under.length, ob: cal.split.overB, os: cal.split.overS, ub: cal.split.underB, us: cal.split.underS } });
    if (cal.tip) { S.cur = { stuck: 'READY', sc: 'handover', scName: C.SCAFFOLD.handover.name, lv: 0, text: cal.tip };   // 面板會蓋住頁面下方，檢核提醒也放進面板（selfCheck.showTip=false 時不顯示，只記落差數）
      show(S.cur); }
    return cal;
  }
  /* 樣板回報的作品事件（預測、存版、試玩、誰的決定、本科系眼光、意圖對照、田野問題、現場素材、遊戲在講什麼、判斷理由）。
     ini＝超出要求的主動：當下助教沒有在提示這一件事，學生自己做了。 */
  var ACT_SC = { item: 'own', field_fb: 'field', change: 'version', play: 'contrast', draw: 'own', swap: 'own', open: 'orient', claim: 'version', folk_open: 'source', playtest: 'playtest', version: 'version', own: 'own', lens: 'lens', intent: 'intent', field_q: 'fieldq', field_cite: 'fieldcite', meaning: 'meaning', predict: 'predict', reason: 'reason' };
  function record(act, extra) {
    extra = extra || {}; var st = S.getState(), sc = ACT_SC[act] || 'orient';
    var o = Object.assign({ act: act, stuck: C.diagnose(st)[0], sc: sc, lv: 0, by: 'student' }, extra);
    if (!(S.cur && S.cur.sc === sc) && ['folk_open', 'playtest', 'field_q', 'field_cite', 'lens', 'meaning'].indexOf(act) >= 0) o.ini = 1;   // 存版是必要步驟，不算主動
    if (extra.text !== undefined) {   // 有文字的動作：只存特徵
      var id = extra.field || act;
      o.rf = C.featurize(extra.text, st.tpl, { lastTutor: S.cur && S.cur.text, prevText: S.prev[id], pasted: !!extra.pasted });
      S.prev[id] = extra.text; delete o.text; delete o.field; delete o.pasted;
    }
    return emit(o);
  }
  /* 言行一致：學生說要改作品的哪個元素（樣板 elems 的索引）→ 下一次存版時比對有沒有真的改到 */
  function claim(el) { S.claims.push(el); saveClaims(); return record('claim', { el: el }); }
  function versionSaved(vn, changedEls, note) {
    var out = [];
    S.claims.forEach(function (el) { out.push(emit({ act: 'follow', stuck: C.diagnose(S.getState())[0], sc: 'version', lv: 0, by: 'student', el: el, fo: (changedEls || []).indexOf(el) >= 0 ? 1 : 0, vn: vn })); });
    S.claims = []; saveClaims();
    record('version', { vn: vn, text: note || '', field: 'version' });
    return out;
  }
  function saveClaims() { try { localStorage.setItem('ct_claims_' + S.env, JSON.stringify(S.claims)); } catch (e) { /* 無法儲存時只留在本頁 */ } }
  function loadClaims() { try { var c = JSON.parse(localStorage.getItem('ct_claims_' + S.env) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; } }
  /* 偵測貼上：一次出現 ≥40 字（貼上事件或一次輸入大量）就標記，不阻擋 */
  function watchPaste(el) {
    if (!el || el.dataset.ctWatch) return; el.dataset.ctWatch = '1'; var last = el.value.length;
    el.addEventListener('paste', function (e) { var t = (e.clipboardData && e.clipboardData.getData('text')) || ''; if (t.length >= C.THRESH.pasteEvent) el.dataset.pasted = '1'; });
    el.addEventListener('input', function () { if (el.value.length - last >= C.THRESH.pasteJump) el.dataset.pasted = '1'; last = el.value.length; });
  }
  function aiLog() { var st = S.getState(); emit({ act: 'ai_log', stuck: C.diagnose(st)[0], sc: 'ai_review', lv: 0, by: 'student', ai: st.ai }); }
  function folkOpen(id) { return record('folk_open', { folk: id }); }

  function renderDebug() {
    var d = $('ctDebug'); if (!d) return;
    d.textContent = S.log.map(function (e) { return JSON.stringify(e); }).join('\n');
  }
  /* 設定 hook.writer：off（預設，W11 先不收助教使用紀錄）／emu（本機模擬器）／live（寫正式資料庫，需要的條件見規格 §18.4）。off 回 undefined，讓測試編號的 ?emu=1 仍可寫模擬器 */
  function writerMode(eff) { var w = eff && eff.hook && eff.hook.writer; return (w === 'emu' || w === 'live') ? w : undefined; }
  function mount(o) {
    S.env = o.env; S.unit = o.unit; S.getState = o.getState; S.mem = loadMem(); S.claims = loadClaims();
    var eff = o.cfg || null, ct = eff ? C.cfgToTable(eff) : null;
    S.table = ct ? ct.table : (o.table || {}); S.maxLv = C.optOf(S.table.opts).maxLevel; S.off = !!(ct && ct.off); S.cv = eff ? String(eff._version || 'none').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 16) : undefined;
    var fm = ct ? ct.forceMode : o.forceMode;
    S.mode = fm === 'A' || fm === 'B' ? fm : C.assignMode(S.env, S.unit, S.table); S.tg = C.toolGroup(S.env, S.table);
    C.setUrlGate(C.isTestEnv(S.env));   // 網址測試參數只對測試編號生效
    var qLlm = (function () { try { return C.isTestEnv(S.env) ? new URLSearchParams(location.search).get('llm') : null; } catch (e) { return null; } })(), layer = qLlm === 'off' ? 'off' : (qLlm === 'rules' ? 'rules' : ((qLlm === 'queue' || qLlm === 'http') ? 'routed' : (eff && eff.llm ? eff.llm.layer : 'off')));
    S.layer = layer; S.llmSeq = 0; S.llm = layer !== 'off' ? C.llmClient(eff && eff.llm) : null; S.recentN = Math.max(0, Math.min(5, +(((eff && eff.llm) || {}).context || {}).recentEvents || 0)); S.hist = []; S.sendText = !!(S.llm && S.llm.transport === 'http' && eff && eff.llm && eff.llm.sendStudentText === true);
    S.sess = C.sessKey(S.env, Date.now(), o.course);
    S.w = C.writer(Object.assign({}, o.writer, { mode: (o.writer && o.writer.mode) || writerMode(eff) }));
    if (!S.off) { build(); watchPaste($('ctReply')); }
    if (eff) emit({ act: 'cfg', stuck: 'READY', sc: 'orient', lv: 0, by: 'tutor' });   // 每次開頁記一筆：設定版本、LLM 層、模式（emit 自動帶）
    return { sess: S.sess, mode: S.w.mode, tutorMode: S.mode, tg: S.tg };
  }
  root.CT_UI = { mount: mount, notify: notify, askHelp: askHelp, more: more, reply: reply, dismiss: dismiss, selfCheck: selfCheck, aiLog: aiLog, folkOpen: folkOpen, record: record, claim: claim, versionSaved: versionSaved, watchPaste: watchPaste,
    _state: S };
})(typeof self !== 'undefined' ? self : this);
