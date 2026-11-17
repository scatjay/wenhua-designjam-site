/* 文化遊戲松 AI 助教・第一層（純規則，跑在瀏覽器，不呼叫模型、不花錢、不新增任何監聽）。草稿 11-12。
   三重角色：①學習的鷹架（先問不先答、不替學生做）②形成式回饋 ③隱形評量的觀測點（每次互動留下可分析的事件，不另加問卷）。
   這支檔分兩半：
     上半：純函式（Node 可測，test_tutor.js）——判斷卡在哪、選鷹架、提示分層與撤除、讀學生回應的特徵、組事件、算場次鍵、彙整報表。
     下半：只在瀏覽器——把事件寫到 RTDB（REST 單次寫入，不訂閱），本機模擬器用 ?emu=1。
   學生打的字「不上傳」：事件只存特徵（長度級距、有沒有講到規則…），原文留在學生自己的瀏覽器。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tutor_templates.js'), require('./folk_index.js'));
  else root.CT_CORE = factory(root.CT_TPL, root.CT_FOLK);
})(typeof self !== 'undefined' ? self : this, function (TPL, FOLK) {
  'use strict';
  var SCHEMA_VER = 1;
  var TEMPLATES = TPL.TEMPLATES, TPL_BY_ID = {};
  TEMPLATES.forEach(function (t) { TPL_BY_ID[t.id] = t; });
  var FOLK_BY_ID = {};
  (FOLK || []).forEach(function (f) { FOLK_BY_ID[f.id] = f; });

  /* W2 判斷題四選一（代碼固定，事件裡只存代碼） */
  var W2 = { 1: '決定不會變', 2: '感覺變了，決定沒變', 3: '決定會變', 4: '說不準' };
  var W2_EXPECT = { skin: [1, 2], rule: [3] };   // 換皮版應落在 1（或 2）；玩法版應落在 3（規劃稿第五節的驗收）

  /* ———— 卡在哪（狀態碼）：順序就是優先序 ———— */
  var STUCK = {
    NO_PREDICT: '還沒玩、也還沒先猜兩版會差在哪',
    NO_PLAY: '還沒玩任何一版',
    ONE_VER: '只玩了一版',
    NO_W2: '兩版都玩了，還沒回答判斷題',
    NO_REASON: '答了判斷題，還沒寫理由',
    W2_SAME: '兩版答案一樣（沒看出差異）',
    W2_FLIP: '玩法版答「決定不會變」或換皮版答「決定會變」',
    PRED_GAP: '玩之前的猜測和玩完的判斷不同，還沒說為什麼',
    REASON_LOOK: '理由只講畫面或故事，沒講到規則',
    NO_SOURCE: '理由講到文化，但還沒回去讀任何出處',
    FIELD_CITE: '用了現場拍到／聽到／問到的素材，還沒說來源與意義',
    OWN_UNMARKED: 'AI 做出原型後，還沒分出哪部分是自己決定的',
    AI_ALL_ACCEPT: 'AI 建議全部照單全收',
    AI_UNREVIEWED: '用了 AI 建議，還沒回看',
    REMIX_SKIN: '改作停在換內容，規則沒動',
    VER_NO_REASON: '存了新版本，還沒寫是什麼讓你改的',
    ITER_NO_EXTRACT: '這一輪改作還沒重新問「把文化卡換成別的東西，你的決定還一樣嗎」',
    NO_PLAYTEST: '做出來了，還沒有人試玩',
    INTENT_UNCOMPARED: '試玩過了，還沒比對自己的意圖和玩家的感受',
    FIELD_Q: '還沒寫下要帶回田野問的問題',
    NO_LENS: '還沒用自己本科系的眼光看一次',
    NO_FIELD: '田野那一格還空著',
    NO_MEANING: '還沒說出這個遊戲在講什麼',
    READY: '主要步驟都有了，準備交'
  };
  var STUCK_ORDER = Object.keys(STUCK);

  /* ———— 鷹架類型：每種一個代碼，事件只存代碼 ———— */
  var SCAFFOLD = {
    orient:    { code: 'orient',    name: '帶入任務',     fn: '說清楚這一步要做到什麼' },
    contrast:  { code: 'contrast',  name: '兩版對照',     fn: '標出要比較的關鍵差異' },
    judge:     { code: 'judge',     name: '請你下判斷',   fn: '把判斷交給學生' },
    reason:    { code: 'reason',    name: '說出理由',     fn: '要學生把判斷的依據說出來' },
    extract:   { code: 'extract',   name: '換掉測試',     fn: '用一個「如果把…換成…」的問題讓學生自己發現矛盾' },
    mechanic:  { code: 'mechanic',  name: '指出規則',     fn: '把注意力從畫面移到規則' },
    source:    { code: 'source',    name: '回原始材料',   fn: '指出去讀哪一回哪一頁，不替學生摘要' },
    remix:     { code: 'remix',     name: '改一條規則',   fn: '把改作從換內容推到換規則' },
    ai_review: { code: 'ai_review', name: 'AI 協作回看',  fn: '要學生說出接受、改了、否決了 AI 哪些建議' },
    field:     { code: 'field',     name: '田野那一格',   fn: '指出 AI 做不到、要自己去看去問的部分' },
    handover:  { code: 'handover',  name: '自己檢核',     fn: '把檢核的責任交還學生' },
    predict:   { code: 'predict',   name: '先猜再玩',     fn: '候選⑤：玩之前預測、玩完比對' },
    own:       { code: 'own',       name: '誰的決定',     fn: '候選①：AI 做出原型後分出自己的決定與 AI 的' },
    version:   { code: 'version',   name: '版本差異',     fn: '候選⑦：把自己的 v1／v2 攤開問是什麼讓你改的' },
    lens:      { code: 'lens',      name: '本科系的眼光', fn: '候選⑥：用自己科系的專業看會改哪裡' },
    playtest:  { code: 'playtest',  name: '安排試玩',     fn: '做出來之後：找人玩、記下觀察' },
    intent:    { code: 'intent',    name: '意圖與感受',   fn: '做出來之後：比對設計意圖與玩家感受' },
    fieldq:    { code: 'fieldq',    name: '帶回田野',     fn: '做出來之後：準備回田野要問的問題' },
    fieldcite: { code: 'fieldcite', name: '現場素材',     fn: '真實情境取材：追問素材的來源與意義' },
    meaning:   { code: 'meaning',   name: '遊戲在講什麼', fn: '做出來之後：說得出這個遊戲在講什麼' }
  };
  /* 候選引導動作（母線 11-12 提出、楊老師尚未逐項確認）：①own ②ai_review ③extract（每輪改作）④source ⑤predict ⑥lens ⑦version */
  var CANDIDATE = { own: '①', ai_review: '②', extract: '③', source: '④', predict: '⑤', lens: '⑥', version: '⑦' };
  var STUCK_TO_SC = { NO_PLAY: 'orient', ONE_VER: 'contrast', NO_W2: 'judge', NO_REASON: 'reason', W2_SAME: 'extract', W2_FLIP: 'extract',
    REASON_LOOK: 'mechanic', NO_SOURCE: 'source', REMIX_SKIN: 'remix', AI_UNREVIEWED: 'ai_review', AI_ALL_ACCEPT: 'ai_review', NO_FIELD: 'field', READY: 'handover',
    NO_PREDICT: 'predict', PRED_GAP: 'predict', FIELD_CITE: 'fieldcite', OWN_UNMARKED: 'own', VER_NO_REASON: 'version', ITER_NO_EXTRACT: 'extract',
    NO_PLAYTEST: 'playtest', INTENT_UNCOMPARED: 'intent', FIELD_Q: 'fieldq', NO_LENS: 'lens', NO_MEANING: 'meaning' };

  /* ———— 讀學生回應的特徵（不存原文） ———— */
  var RULE_WORDS = /規則|代價|不能|不可以|要先|順序|輪到|回合|機率|結果|狀態|扣|鎖|重來|重新|錯過|等下一|限制|條件|一定要|才能|決定|選擇|機制|會變|變重|用光|出局|失敗|成功|得分/;
  /* 11-12 離線回放後新增（只用 80 則調整樣本裡出現的通用玩法詞；另外 40 則保留樣本只拿來驗證）：學生描述玩法時常用的動詞與系統名詞，不含任何作品專名 */
  var MECH_WORDS = /戰鬥|打怪|升級|提升|養成|經營|解謎|謎題|探索|配對|裝備|密碼|切換|重生|吞噬|操作|扮演|關卡|數值|能力|法術|符咒|攻擊|防守|收集|道具|任務|開放世界|談判|躲避|格擋|抉擇|選項|猜|傳話|畫出來|過關|通關|跑圖|模擬|建造|資源|點擊|拖曳|玩法|機關|招募|獎勵|層/;
  var IDK_SOFT = /不了解|不確定|不知道|不清楚|沒玩過|沒怎麼玩|思考ing|看過其他人/;
  var LOOK_WORDS = /畫面|好看|顏色|圖|名字|名稱|故事|氣氛|感覺|背景|角色長|造型|音樂|貼圖|換皮|外觀|風格/;
  var CAUSE_WORDS = /因為|所以|如果|就會|否則|不然|才會|導致|結果是|於是|只要|一旦|之後|隨著|影響|迫使|造成|的時候|就能|才能|就可以|就不|就直接|會變得|不再/;   // 11-12 離線回放：後半段是從 80 則調整樣本補的通用條件詞
  var IDK = /^(不知道|不清楚|不懂|沒想法|隨便|都可以|\?|？)+$/;
  var AI_WORDS = /AI|ai|Gemini|gemini|Claude|claude|ChatGPT|助教|它說|它建議/;
  var SRC_WORDS = /第.{1,3}回|原著|出處|資料卡|條目|頁/;
  function lenBucket(n) { return n === 0 ? 0 : n < 15 ? 1 : n < 50 ? 2 : 3; }
  /* 門檻（11-12 離線回放後調整，前後數字見 docs/workshop/AI_TUTOR_REPLAY_20261112.md）：echo 0.35→0.25、rep 0.7→0.5；貼上事件 40 字不變，輸入一次跳增改為 60 字 */
  var THRESH = { echo: 0.25, rep: 0.5, pasteEvent: 40, pasteJump: 60 };
  /* 字元二元組相似度（判斷「重複助教用語」與「跟上次理由雷同」，不存原文） */
  function bigrams(x) { x = String(x || '').replace(/[\s，。、！？「」：；,.!?]/g, ''); var o = {}; for (var i = 0; i < x.length - 1; i += 1) o[x.substr(i, 2)] = 1; return o; }
  function sim(a, b) { var A = bigrams(a), B = bigrams(b), n = 0, u = 0, k; for (k in A) { u += 1; if (B[k]) n += 1; } for (k in B) if (!A[k]) u += 1; return u ? n / u : 0; }
  /* ctx（選）：{ lastTutor: 助教上一句, prevText: 這一欄上次的內容, pasted: 是否一次貼上大段 } */
  function featurize(text, tplId, ctx) {
    ctx = ctx || {};
    var s = String(text || '').trim(), t = TPL_BY_ID[tplId] || {}, names = cardNames(t);
    var sr = s.replace(/(文化)?(長在)?規則(裡)?(那|這)?(一)?版|皮(那|這)?(一)?版|文化只是皮|換皮(那|這)?(一)?版|玩法(那|這)?(一)?版/g, '');   // 版本名稱裡的「規則」不算講到規則（11-12 驗收抓到的誤判）
    var cardHit = names.some(function (w) { return w && s.indexOf(w) >= 0; });
    var folkHit = (t.folk || []).some(function (id) { var f = FOLK_BY_ID[id]; return f && s.indexOf(f.name) >= 0; });
    var ownHit = (t.elems || []).some(function (w) { return s.indexOf(w) >= 0; }) || /第.{1,2}(格|關|回合|層|波|塊|張|段|版)|v[0-9]/.test(sr);
    var ruleHit = RULE_WORDS.test(sr) || MECH_WORDS.test(sr);
    return { len: lenBucket(s.length), rule: ruleHit ? 1 : 0, look: (LOOK_WORDS.test(sr) && !ruleHit) ? 1 : 0, cause: CAUSE_WORDS.test(sr) ? 1 : 0,
      card: cardHit ? 1 : 0, src: (SRC_WORDS.test(s) || folkHit) ? 1 : 0, idk: (s === '' || IDK.test(s.replace(/\s/g, '')) || (s.length <= 25 && IDK_SOFT.test(s) && !ruleHit)) ? 1 : 0, ai: AI_WORDS.test(s) ? 1 : 0,
      own: ownHit ? 1 : 0, echo: (ctx.lastTutor && s.length >= 6 && sim(s, ctx.lastTutor) >= THRESH.echo) ? 1 : 0,
      rep: (ctx.prevText && s.length >= 6 && sim(s, ctx.prevText) >= THRESH.rep) ? 1 : 0, pst: ctx.pasted ? 1 : 0 };
  }
  /* 理由具體度（規則層，0–4）：講到規則、有因果、指涉自己作品的具體元素、回到出處各 1 分；重複助教用語或跟上次雷同各扣 1 */
  function specificity(f) { if (!f) return 0; return Math.max(0, (f.rule | 0) + (f.cause | 0) + (f.own | 0) + (f.src | 0) - (f.echo | 0) - (f.rep | 0)); }
  function cardNames(t) { return [t.card].concat((t.card || '').split(/[・、]/)); }
  /* 理由分級：empty／idk／look（只講外觀）／rule（講到規則）／rule_cause（講到規則且有因果） */
  function reasonLevel(f) {
    if (!f || f.len === 0) return 'empty';
    if (f.idk) return 'idk';
    if (f.rule && f.cause) return 'rule_cause';
    if (f.rule) return 'rule';
    if (f.len === 1) return 'short';
    return 'look';
  }

  /* ———— 判斷卡在哪 ———— */
  /* st（樣板或示範頁回報的當下狀態，全部是數字或布林）：
     { tpl, played:{skin,rule}, w2:{skin,rule}(代碼 0–4), reason:{skin,rule}(學生原文，只在本機), remix:{stage,contentEdits,ruleEdits},
       ai:{suggested,accepted,modified,rejected,reviewed}, folkOpened:[id], field:bool } */
  function diagnose(st) {
    st = st || {}; var p = st.played || {}, w = st.w2 || {}, rs = st.reason || {}, rx = st.remix || {}, ai = st.ai || {};
    var out = [];
    var pr = st.predict || {}, bd = st.build || {};
    if (!p.skin && !p.rule) out.push(pr.skin && pr.rule ? 'NO_PLAY' : 'NO_PREDICT');
    else if (!p.skin || !p.rule) out.push('ONE_VER');
    if (p.skin && p.rule) {
      if (!w.skin || !w.rule) out.push('NO_W2');
      else {
        var w2open = !!(TPL_BY_ID[st.tpl] || {}).w2open;
        var fs = featurize(rs.skin, st.tpl), fr = featurize(rs.rule, st.tpl);
        var ls = reasonLevel(fs), lr = reasonLevel(fr);
        if (ls === 'empty' || ls === 'idk' || lr === 'empty' || lr === 'idk') out.push('NO_REASON');
        else if (!w2open && w.skin === w.rule) out.push('W2_SAME');   // w2open（#12 runner）：W2 是開放題、不預設答案，不判「兩版一樣」「答案翻轉」，其餘照常
        else if (!w2open && (W2_EXPECT.rule.indexOf(w.rule) < 0 || W2_EXPECT.skin.indexOf(w.skin) < 0)) out.push('W2_FLIP');
        else if (pr.skin && pr.rule && (pr.skin !== w.skin || pr.rule !== w.rule) && !st.predGapNoted) out.push('PRED_GAP');
        else if (lr !== 'rule' && lr !== 'rule_cause') out.push('REASON_LOOK');
        else if (!(st.folkOpened || []).length && !fr.src) out.push('NO_SOURCE');
      }
    }
    if (st.fieldCited && !st.fieldCiteExplained) out.push('FIELD_CITE');
    if (bd.aiGenerated && !bd.ownership) out.push('OWN_UNMARKED');
    if ((rx.stage || 0) >= 2 && (rx.ruleEdits || 0) === 0 && (rx.contentEdits || 0) > 0) out.push('REMIX_SKIN');
    var nv = bd.versions || 0;
    if (nv >= 2 && (bd.versionNotes || 0) < nv - 1) out.push('VER_NO_REASON');
    if (nv >= 2 && (bd.extractChecks || 0) < nv - 1) out.push('ITER_NO_EXTRACT');
    if (nv >= 1 && !(bd.playtests > 0)) out.push('NO_PLAYTEST');
    if (bd.playtests > 0 && !bd.intentCompared) out.push('INTENT_UNCOMPARED');
    if (bd.playtests > 0 && !(bd.fieldQs > 0)) out.push('FIELD_Q');
    if (nv >= 2 && !bd.lens) out.push('NO_LENS');
    if ((ai.suggested || 0) > 0) {
      var touched = (ai.modified || 0) + (ai.rejected || 0);
      if ((ai.accepted || 0) >= 3 && touched === 0) out.push('AI_ALL_ACCEPT');
      else if (!ai.reviewed) out.push('AI_UNREVIEWED');
    }
    if ((rx.stage || 0) >= 1 && !st.field) out.push('NO_FIELD');
    if ((bd.versions || 0) >= 1 && !bd.meaning) out.push('NO_MEANING');
    if (!out.length) out.push('READY');
    out.sort(function (a, b) { return STUCK_ORDER.indexOf(a) - STUCK_ORDER.indexOf(b); });
    return out;
  }

  /* ———— 提示分層：L0 只問一個問題／L1 指出看哪裡／L2 給句型框架／L3 用別的樣板示範同樣的結構（永遠不替學生寫他自己的） ———— */
  var MAX_LV = 3;
  function folkPointer(t, opened) {
    var ids = (t.folk || []).filter(function (id) { return FOLK_BY_ID[id] && (opened || []).indexOf(id) < 0; });
    var f = FOLK_BY_ID[ids[0] || (t.folk || [])[0]];
    if (!f) return null;
    var m = /第[一二三四五六七八九十]+回/.exec(f.loc || '');
    return { id: f.id, name: f.name, where: m ? '原著' + m[0] : '小封神資料卡', wc: f.wc };
  }
  function otherTpl(t) { // 示範用另一個樣板，避免替學生寫他自己的
    for (var i = 0; i < TEMPLATES.length; i += 1) if (TEMPLATES[i].id !== t.id && TEMPLATES[i].kind !== t.kind) return TEMPLATES[i];
    return TEMPLATES[0];
  }
  function say(sc, lv, t, st, mode, code) {
    if (mode === 'B') return sayB(sc, lv, t, st, code);
    var o = otherTpl(t), fp = folkPointer(t, st.folkOpened), w = st.w2 || {}, pr = st.predict || {};
    var M = {
      orient: [
        '你猜好了。先玩哪一版？玩的時候特別注意：哪一步的做法可能會不一樣？',
        '畫面上方有「換皮版」和「玩法版」兩個按鈕，兩版都要玩到結束。',
        '可以照這個順序：先玩一版到結束 → 再玩另一版 → 寫下「兩版最不一樣的一刻是＿＿＿」。',
        '例如在「' + o.name + '」，有人先玩換皮版，再玩玩法版，記下「' + o.card + '」出現時自己的做法有沒有變。'
      ],
      contrast: [
        '你玩了一版，另一版還沒玩。你覺得換一版之後，哪一步的做法會變？',
        '去玩另一版，特別注意「' + t.card + '」出現的那一刻。',
        '玩完後寫：在換皮版，「' + t.card + '」只是＿＿＿；在玩法版，它會讓我＿＿＿。',
        '例如「' + o.name + '」：換皮版裡「' + o.card + '」只是一個名字；玩法版裡它決定了你能不能做某件事。'
      ],
      judge: [
        '兩版都玩完了。回到剛才猶豫最久（或最想再玩）的那一刻：把那裡的東西換掉（例如把廟換成便利商店、把擲筊換成丟硬幣），你當時的決定會變嗎？兩版各選一個答案。',
        '判斷題在畫面最下面，兩版要各答一次。四個選項沒有標準答案，選你玩的感覺。',
        '可以先問自己：把「' + t.card + '」換成別的東西之後，我還需要做同一個決定嗎？',
        '例如「' + o.name + '」：有人覺得換皮版「決定不會變」，玩法版「決定會變」——但你的判斷可以不一樣。'
      ],
      reason: [
        '你選了答案，為什麼？說說你玩的時候哪一刻讓你這樣覺得。',
        '理由寫在判斷題下面的框裡，兩版各寫一句就好。',
        '可以照這個句型：我選＿＿＿，因為玩到＿＿＿的時候，「' + t.card + '」讓我＿＿＿。',
        '例如「' + o.name + '」：我選「決定會變」，因為把「' + o.card + '」換掉之後，我不用再決定先做哪一步。'
      ],
      extract: [
        t.extractQ,
        '你兩版答的是「' + (W2[w.skin] || '？') + '」和「' + (W2[w.rule] || '？') + '」。回到玩法版，找出「' + t.card + '」改變你做法的那一步。',
        '試著把句子寫完：如果把「' + t.card + '」換成「' + t.swap + '」，那一步我會＿＿＿。',
        '例如「' + o.name + '」：' + o.extractQ + '——有人的答案是「會，整個策略都不用了」，所以他改選了另一個選項。'
      ],
      mechanic: [
        '你的理由講到了畫面或故事。那這一版的「規則」呢——哪一條規則因為文化而存在？',
        '回到玩法版，找一個「不照著做就有代價」的地方，那就是文化長進規則的位置。',
        '可以照這個句型：在這一版，「' + t.card + '」是一條規則：如果＿＿＿，就會＿＿＿。',
        '例如「' + o.name + '」：「' + o.card + '」是一條規則——' + o.extractQ.replace(/？$/, '') + '，答案決定了玩法。'
      ],
      source: fp ? [
        '你說的「' + t.card + '」，在原本的材料裡是怎麼寫的？你讀過嗎？',
        '去讀「' + fp.name + '」那一段（' + fp.where + '），讀完用自己的話說一個你沒想到的細節。',
        '讀完寫一句：原本的材料寫＿＿＿，我的遊戲裡是＿＿＿，差在＿＿＿。',
        '提醒：資料卡上標「工坊創作」的部分不是原著，寫的時候要分清楚哪些是原著、哪些是工坊編的、哪些是你加的。'
      ] : ['這一個文化元素，你從哪裡知道的？', '回去看你 W2 的文化卡說明，再找一個可以查的來源。', '寫一句：我是從＿＿＿知道的，它說＿＿＿。', '如果找不到出處，就把它寫成「我自己的理解」，不要寫成事實。'],
      remix: [
        '你改了內容（文字、名字、顏色）。還有哪一條規則，你想讓它跟著文化改？',
        '打開樣板的 JSON，找規則那一段（不是文字那一段），只改一個數字或一個條件就好。',
        '可以照這個句型：我把規則從＿＿＿改成＿＿＿，因為在真實的「' + t.card + '」裡，＿＿＿。',
        '例如「' + o.name + '」：有人把「錯了可以重來」改成「錯了要等下一輪」，因為真實的「' + o.card + '」錯過就要再等。'
      ],
      ai_review: [
        '你用了 AI 給的建議。哪一個你照用、哪一個你改了、哪一個你沒用？',
        '在「AI 建議紀錄」那一欄，每一條標「照用／改了再用／不用」，各寫一句為什麼。',
        '至少找一條你不同意的，寫：AI 建議＿＿＿，我沒用，因為＿＿＿（我玩過／我問過／原著寫的是＿＿＿）。',
        '例如有人寫：AI 建議讓擲筊連續三次聖筊才過關，我改成兩次，因為我在廟裡看到的是問到聖筊就停。'
      ],
      field: [
        '這一格是 AI 幫不了你的：' + t.field + '。你打算去哪裡看、去問誰？',
        '這一格只要寫你自己看到或問到的，寫一兩句就好，可以附一張照片。',
        '可以照這個句型：我在＿＿＿（地點／時間）看到或聽到＿＿＿，這讓我想把遊戲的＿＿＿改成＿＿＿。',
        '例如有人寫：我在廟口看到擲筊的人連續兩次陰筊就換一個問法，所以把遊戲改成可以換問法、但要付一點代價。'
      ],
      predict: code === 'PRED_GAP' ? [
        '你玩之前猜玩法版會「' + (W2[pr.rule] || '？') + '」，玩完選了「' + (W2[w.rule] || '？') + '」。是玩到哪一刻讓你改變想法？',
        '回想那一刻：你做了什麼決定，結果怎樣？把它記在比對欄。',
        '可以照這個句型：我原本以為＿＿，玩到＿＿的時候發現＿＿。',
        '例如「' + o.name + '」：有人原本猜「決定不會變」，玩到「' + o.card + '」那一步才發現不照著做就走不下去。'
      ] : [
        '玩之前先猜：「換皮版」和「玩法版」這兩版，把文化的東西換掉之後，你的決定各會落在判斷題的哪一個答案？',
        '預測欄在兩版按鈕上面，兩版各選一個。猜錯沒關係，玩完會拿來比對。',
        '先想一句：我猜把「' + t.card + '」換掉之後，＿＿會變得不需要。',
        '例如「' + o.name + '」：有人先猜換皮版「決定不會變」、玩法版「說不準」，玩完再看自己猜得準不準。'
      ],
      own: [
        'AI 幫你做出了這一版。哪些部分是你決定的、哪些是 AI 決定的？答案去「紀錄欄」寫一句。',
        '打開你的作品，一個地方一個地方看：規則、文字、畫面、數字，哪些是你決定的？一句話寫在「紀錄欄」。',
        '可以照這個句型：＿＿是我決定的，因為＿＿；＿＿是 AI 給的，我保留它是因為＿＿。',
        '例如「' + o.name + '」：有人標出「' + o.card + '」那條規則是自己決定的，畫面配色是 AI 的。'
      ],
      version: [
        '把你的上一版和這一版放在一起看：是什麼讓你改的？',
        '打開「版本紀錄」，在新版本下面寫一句改了什麼。',
        '可以照這個句型：上一版是＿＿，這一版改成＿＿，因為（試玩時看到／讀到／自己發現）＿＿。',
        '例如有人寫：上一版陰筊只扣血，這一版改成要換問法，因為試玩的同學說「扣血跟擲筊沒關係」。'
      ],
      lens: [
        '用你本科系的眼光看這個遊戲，你會改哪裡？',
        '想一件你本科系最在意的事（例如動線、色彩、成本、故事結構、程式效率），拿它看一次你的遊戲。',
        '可以照這個句型：從＿＿（科系）的角度，我會把＿＿改成＿＿，因為＿＿。',
        '例如有讀觀光的同學說：從導覽動線看，廟埕那一關應該放在入口，不是終點。'
      ],
      playtest: [
        '遊戲做出來了。你最想從試玩的人身上看到什麼？',
        '找一位同學玩一輪，不要解釋，只看他在哪裡停下來、說了什麼。',
        '記三件事：他玩了多久、在哪一步停住、他說的一句原話。',
        '例如有人記：同學在第二層停了很久，說「笑筊是什麼意思？」——這就是下一版要處理的地方。'
      ],
      intent: [
        '你原本想讓玩家感受到什麼？試玩的人實際感受到的是什麼？',
        '把你的設計意圖寫一句，再把試玩紀錄裡玩家的原話放在旁邊。',
        '可以照這個句型：我想讓玩家感到＿＿，他實際上＿＿，差別可能是因為＿＿。',
        '例如有人寫：我想讓玩家感到欠人情的壓力，同學卻覺得是在存錢，因為人情不會變重。'
      ],
      fieldq: [
        '試玩之後，你多了哪些不確定的地方？回到現場時，你想問誰、問什麼？',
        '從試玩紀錄挑一個玩家看不懂、或你自己也不確定的地方，把它變成一個問題。',
        '可以照這個句型：我想問＿＿（誰）：「＿＿？」因為遊戲裡的＿＿我不確定是不是真的這樣。',
        '例如有人寫：想問廟祝「連續三次陰筊時，大家通常怎麼辦？」'
      ],
      fieldcite: [
        '你用了現場拍到、聽到或問到的素材。它是在哪裡、從誰那裡來的？對當地人來說它代表什麼？',
        '在素材旁邊寫上時間、地點、來源（自己拍的／誰說的）。',
        '可以照這個句型：這是我在＿＿（地點）＿＿（看到／聽到／問到）的，對＿＿來說它的意思是＿＿，我把它放進遊戲的＿＿。',
        '例如有人寫：這是我在廟口聽阿伯說的「筊杯不能用丟的」，所以遊戲裡擲筊太快會被扣香火。'
      ],
      meaning: [
        '如果只能用一句話，你這個遊戲在講什麼？',
        '不要講玩法，講玩完的人會帶走什麼。',
        '可以照這個句型：這個遊戲在講＿＿，玩的人會在＿＿的時候感受到。',
        '例如有人寫：這個遊戲在講「人情是會變重的」，玩的人會在拖太久沒還的時候發現。'
      ],
      handover: [
        '看起來主要的步驟你都有了。交出去之前，你自己覺得哪一項最沒把握？',
        '打開「自己檢核」，一項一項勾，每勾一項就指出它在你的作品哪裡。',
        '最後寫一句給自己：如果再給我一小時，我最想改的是＿＿＿。',
        '檢核是你自己做的；助教不打分數，但討論會被評分、老師會讀。'
      ]
    };
    if (sc === 'extract' && code === 'ITER_NO_EXTRACT') M.extract[0] = '這一輪你又改了東西。把「' + t.card + '」換成別的東西，這一版你的決定還一樣嗎？';
    var arr = M[sc] || ['你現在卡在哪一步？'];
    return arr[Math.max(0, Math.min(MAX_LV, lv))];
  }

  /* ———— B 檢核功能式：同樣的卡點、同樣的時機，只說「還缺什麼、下一步做什麼」，不問判斷題（積極對照組，仍然有用） ———— */
  var SAY_B = {
    orient: ['還沒開始：兩版都要玩到結束。下一步：先玩任一版。', '兩版的按鈕在頁面上方。', '步驟：1. 玩換皮版到結束 2. 玩玩法版到結束 3. 回答判斷題。'],
    predict: ['還缺：玩之前的預測。下一步：在預測欄兩版各選一個答案。', '預測欄在兩版按鈕上面。', '步驟：1. 換皮版選一個 2. 玩法版選一個 3. 按「我猜好了」。'],
    predict_gap: ['還缺：預測和結果不同的說明。下一步：在比對欄寫一句。', '比對欄在判斷題下面。', '步驟：1. 看預測和判斷哪一版不同 2. 寫一句 3. 按送出。'],
    contrast: ['還缺：另一版還沒玩。下一步：玩另一版到結束。', '另一版的按鈕在頁面上方。', '步驟：1. 按另一版 2. 玩到結束 3. 回答判斷題。'],
    judge: ['還缺：判斷題。下一步：兩版各選一個答案。', '判斷題在兩版按鈕下面。', '步驟：1. 換皮版選一個 2. 玩法版選一個 3. 寫理由 4. 按「我答好了」。'],
    reason: ['還缺：判斷題的理由。下一步：兩版各寫一句。', '理由欄在每一題選項下面。', '步驟：1. 換皮版寫一句 2. 玩法版寫一句 3. 按「我答好了」。'],
    extract: ['判斷題需要再確認一次。下一步：回到玩法版重玩文化卡出現的那一步，再選一次。', '判斷題在兩版按鈕下面。', '步驟：1. 重玩玩法版 2. 重選答案 3. 按「我答好了」。'],
    extract_iter: ['這一輪改作還缺：用新版本重新回答判斷題。下一步：玩新版本，再答一次。', '判斷題在兩版按鈕下面。', '步驟：1. 玩新版本 2. 重選答案 3. 按「我答好了」。'],
    mechanic: ['理由還缺：規則的部分。下一步：在玩法版的理由加一句講到哪一條規則。', '理由欄在玩法版選項下面。', '步驟：1. 找出玩法版裡和文化卡有關的規則 2. 寫進理由 3. 按「我答好了」。'],
    source: ['還缺：出處。下一步：打開一張資料卡。', '資料卡在「原本的材料」那一區。', '步驟：1. 打開一張資料卡 2. 讀那一段 3. 回到理由欄補一句。'],
    remix: ['改作還缺：一條規則的修改。下一步：在 JSON 的規則段改一個數字或條件。', '規則段在樣板 JSON 的 rules 欄位。', '步驟：1. 打開 JSON 2. 找 rules 3. 改一個值 4. 重新整理看結果。'],
    ai_review: ['AI 建議紀錄還沒標完。下一步：每一條標照用／改了再用／不用。', '紀錄在「AI 建議紀錄」那一區。', '步驟：1. 每條標一個 2. 按「我回看完了」。'],
    field: ['還缺：田野那一格。下一步：寫一兩句你看到或問到的。', '田野欄在改作區下面。', '步驟：1. 寫地點或對象 2. 寫看到什麼 3. 按「寫好了」。'],
    handover: ['主要步驟都完成了。下一步：打開自己檢核，逐項勾選。', '自己檢核在頁面最下面。', '步驟：1. 逐項勾選 2. 按「送出我的檢核」。'],
    own: ['還缺：寫下哪些是你決定的、哪些是 AI 的。下一步：在「改作版本存檔」下面的「紀錄欄」寫。', '欄位在「改作版本存檔」那一區的「紀錄欄」。', '步驟：1. 勾這一版交給 AI 的部分 2. 寫自己決定的一兩處 3. 寫本週重點 4. 按「存成新版本」。'],
    version: ['還缺：新版本的修改說明。下一步：在版本紀錄寫一句改了什麼。', '版本紀錄在「做出來之後」那一區。', '步驟：1. 寫改了什麼 2. 按送出。'],
    lens: ['還缺：本科系角度的一項修改建議。下一步：在「本科系眼光」欄寫一句。', '欄位在「做出來之後」那一區。', '步驟：1. 寫一句 2. 按送出。'],
    playtest: ['還缺：試玩紀錄。下一步：找一位同學玩一輪，填試玩欄。', '試玩欄在「做出來之後」那一區。', '步驟：1. 請同學玩 2. 記玩了多久、停在哪、說了什麼 3. 按送出。'],
    intent: ['還缺：設計意圖與玩家感受的對照。下一步：在對照欄各寫一句。', '對照欄在試玩欄下面。', '步驟：1. 寫你的意圖 2. 寫玩家的感受 3. 按送出。'],
    fieldq: ['還缺：帶回田野的問題。下一步：寫一個要問的問題。', '欄位在「做出來之後」那一區。', '步驟：1. 寫要問誰 2. 寫問題 3. 按送出。'],
    fieldcite: ['素材還缺：來源標示。下一步：寫上時間、地點、來源。', '欄位在素材旁邊。', '步驟：1. 寫時間地點 2. 寫來源 3. 按送出。'],
    meaning: ['還缺：一句話說明這個遊戲。下一步：在「這個遊戲在講什麼」欄寫一句。', '欄位在「做出來之後」那一區。', '步驟：1. 寫一句 2. 按送出。']
  };
  function sayB(sc, lv, t, st, code) {
    var key = sc === 'predict' && code === 'PRED_GAP' ? 'predict_gap' : sc === 'extract' && code === 'ITER_NO_EXTRACT' ? 'extract_iter' : sc;
    var arr = SAY_B[key] || ['還缺一項，請看頁面上的提示。'];
    var i = Math.min(lv, arr.length - 1), txt = arr[i];
    return lv >= 3 ? txt + ' 做完後按該欄的送出鈕。' : txt;
  }

  /* ———— A 模式的週次撤除（候選動作）：W11–12 助教問／W13–14 改成學生自己標／W15–16 只在學生按求助時出現 ———— */
  var FADE = { ask: 12, self: 14 };   // 週次上限；W17 以後同 quiet。可由分派表覆寫
  var SELF_TAG = {
    predict: '這一週換你自己來：玩之前，在預測欄先選好，再開始玩。',
    own: '這一週換你自己標：這一版哪些是你決定的、哪些是 AI 的，直接在「紀錄欄」寫出來。',
    ai_review: '這一週換你自己標：每一條 AI 建議，標照用、改了再用或不用，至少一條寫為什麼。',
    extract: '這一週換你自己檢查：把「文化卡」換成別的東西，你的決定還一樣嗎？在判斷題重答一次。',
    source: '這一週換你自己做：你引用的文化，自己標出它從哪裡來。',
    lens: '這一週換你自己寫：用本科系的眼光，寫一個你會改的地方。',
    version: '這一週換你自己記：每存一版，自己在版本紀錄寫一句是什麼讓你改的。'
  };
  function unitNum(unit) { var m = /^W(\d+)$/.exec(unit || ''); return m ? Number(m[1]) : 0; }
  function fadePhase(unit, fade) { fade = fade || FADE; var n = unitNum(unit); if (n <= fade.ask) return 'ask'; if (n <= fade.self) return 'self'; return 'quiet'; }

  /* ———— 撤除（fading）與責任轉移 ———— */
  /* mem：{ ok:{sc:次數}, lv:{sc:目前層級}, n:{sc:提示次數} }——同一種鷹架學生自己解決 ≥3 次，就不再主動跳出（withdrawn），只在學生主動求助時出現，而且從 L0 開始 */
  var WITHDRAW_AFTER = 3;
  function newMem() { return { ok: {}, lv: {}, n: {} }; }
  /* 第 1 級研究開關（設定檔 fade.basis／fade.successN／tutor.maxLevel／startLevel／frustrationAfter／selfCheck.*）：預設值＝原本行為。o＝cfgToTable 產生的 table.opts，缺項用 OPT_DEFAULTS */
  var OPT_DEFAULTS = { basis: 'week+performance', successN: WITHDRAW_AFTER, maxLevel: 3, startLevel: 0, frustrationAfter: 3, showTip: true, tipItems: ['both', 'why', 'rule', 'src', 'ai', 'field'] };
  function optOf(o) {
    o = o || {}; var d = OPT_DEFAULTS, bases = ['week', 'performance', 'week+performance', 'student_control'], num = function (v, lo, hi, dv) { v = Number(v); return (isFinite(v) && v >= lo && v <= hi) ? Math.floor(v) : dv; };
    return { basis: bases.indexOf(o.basis) >= 0 ? o.basis : d.basis, successN: num(o.successN, 0, 9, d.successN), maxLevel: num(o.maxLevel, 0, MAX_LV, d.maxLevel), startLevel: num(o.startLevel, 0, 2, d.startLevel),
      frustrationAfter: num(o.frustrationAfter, 0, 9, d.frustrationAfter), showTip: o.showTip !== false, tipItems: Array.isArray(o.tipItems) ? o.tipItems.map(String) : d.tipItems.slice() };
  }
  function isWithdrawn(mem, sc, n) { n = (n === undefined) ? WITHDRAW_AFTER : n; return n > 0 && ((mem.ok || {})[sc] || 0) >= n; }
  function startLevel(mem, sc, base) {
    var ok = (mem.ok || {})[sc] || 0;
    if (base) return base;
    return 0;   // 一律先問（L0）；撤除靠「不主動出現」與措辭轉移，不靠降級
  }
  function phrasing(mem, sc, text) {
    var ok = (mem.ok || {})[sc] || 0;
    if (ok >= 2) return '你之前自己處理過這種情況。' + text;
    return text;
  }

  /* 主入口：給當下狀態與記憶，回一則助教的話（或不說話） */
  function nextMove(st, mem, opt) {
    opt = opt || {}; mem = mem || newMem();
    var t = TPL_BY_ID[st.tpl] || TEMPLATES[0], list = diagnose(st), code = list[0], sc = STUCK_TO_SC[code];
    var asked = !!opt.askedByStudent, mode = opt.mode === 'B' ? 'B' : 'A', O = optOf(opt.o);
    var useWeek = O.basis === 'week' || O.basis === 'week+performance', usePerf = O.basis === 'performance' || O.basis === 'week+performance';
    var phase = (mode === 'A' && CANDIDATE[sc] && useWeek) ? fadePhase(opt.unit, opt.fade) : 'ask';
    if (!asked && O.basis === 'student_control' && code !== 'READY') return { silent: true, stuck: code, sc: sc, mode: mode, reason: 'student-control' };
    if (!asked && phase === 'quiet') return { silent: true, stuck: code, sc: sc, mode: mode, reason: 'fade-week' };
    if (!asked && usePerf && isWithdrawn(mem, sc, O.successN) && code !== 'READY') return { silent: true, stuck: code, sc: sc, mode: mode, reason: 'withdrawn' };
    var lv = typeof opt.lv === 'number' ? opt.lv : startLevel(mem, sc, O.startLevel);
    var frustrated = O.frustrationAfter > 0 && (opt.sameStuckCount || 0) >= O.frustrationAfter;
    if (frustrated && lv < 1) lv = 1;   // 同一處卡第 N 次（預設 3）：不再只問問題，直接指出看哪裡（減少挫折），仍不代做
    lv = Math.min(O.maxLevel, lv);
    var text = (phase === 'self' && lv === 0 && SELF_TAG[sc]) ? SELF_TAG[sc] : say(sc, lv, t, st, mode, code);
    if (mode === 'A') text = phrasing(mem, sc, text);
    if (frustrated) text = '這一步卡住很正常，先只做一小步就好。' + text;
    return { silent: false, stuck: code, stuckLabel: STUCK[code], all: list, sc: sc, scName: SCAFFOLD[sc].name, lv: lv, text: text, frustrated: frustrated, mode: mode, phase: phase };
  }
  function escalate(move, o) { return Math.min(optOf(o).maxLevel, (move.lv || 0) + 1); }
  function recordResolved(mem, sc, lv) {
    mem.ok[sc] = (mem.ok[sc] || 0) + 1; mem.lv[sc] = lv; return mem;
  }

  /* ———— 自己檢核（責任轉移）：學生自己勾，助教只比對訊號、不打分 ———— */
  var SELF_CHECK = [
    { id: 'both', text: '兩版我都玩到結束了' },
    { id: 'why', text: '判斷題兩版的理由，各講到一條規則' },
    { id: 'rule', text: '我的改作至少改了一條規則，不只換內容' },
    { id: 'src', text: '我回去讀過至少一個原本的出處' },
    { id: 'ai', text: 'AI 的建議我至少改過或否決過一條' },
    { id: 'field', text: '田野那一格是我自己看到或問到的' }
  ];
  function signalOf(st, id) {
    var p = st.played || {}, rx = st.remix || {}, ai = st.ai || {}, rs = st.reason || {};
    switch (id) {
      case 'both': return !!(p.skin && p.rule);
      case 'why': var a = reasonLevel(featurize(rs.skin, st.tpl)), b = reasonLevel(featurize(rs.rule, st.tpl)); return a !== 'empty' && a !== 'idk' && /rule/.test(b);   // 換皮版的理由常是「換成 X 也能玩」，不一定有規則詞；玩法版一定要講到規則
      case 'rule': return (rx.ruleEdits || 0) > 0;
      case 'src': return (st.folkOpened || []).length > 0;
      case 'ai': return (ai.suggested || 0) === 0 || ((ai.modified || 0) + (ai.rejected || 0)) > 0;
      case 'field': return !!st.field;
    }
    return false;
  }
  /* 自評與訊號的落差：勾了但訊號沒有（高估）、沒勾但訊號有（低估）。給學生看的只是一句提醒，研究用的是落差數 */
  /* 分兩類報告（F㉖ §5）：behavior4＝訊號是頁面行為（both／why／rule／src）；selflog2＝訊號本身是學生自己登記的（ai／field），「勾了但看不到」更可能是沒登記，不能當不誠實 */
  var CAL_SELFLOG = ['ai', 'field'];
  function calibrate(st, ticked, o) {
    var over = [], under = [], O = optOf(o);
    SELF_CHECK.forEach(function (c) { var t = (ticked || []).indexOf(c.id) >= 0, s = signalOf(st, c.id); if (t && !s) over.push(c.id); if (!t && s) under.push(c.id); });
    var sl = function (id) { return CAL_SELFLOG.indexOf(id) >= 0; };
    var split = { overB: over.filter(function (x) { return !sl(x); }).length, overS: over.filter(sl).length, underB: under.filter(function (x) { return !sl(x); }).length, underS: under.filter(sl).length };
    var showOver = over.filter(function (x) { return O.tipItems.indexOf(x) >= 0; });
    var tip = !O.showTip ? '' : showOver.length ? '你勾了「' + SELF_CHECK.filter(function (c) { return c.id === showOver[0]; })[0].text + '」，但這次的紀錄裡還看不到。要不要再確認一下它在你作品的哪裡？' : (under.length ? '有一項你做到了卻沒勾，自己再看一次。' : '你的檢核跟紀錄對得上。');
    return { over: over, under: under, tip: tip, split: split };
  }

  /* ———— 場次鍵：<課程代碼>-<當地日期><am|pm>，測試編號 55–60 一律 test-…（本線 CLAUDE.md 的分區配方） ———— */
  function twParts(ms) { var d = new Date(ms + 8 * 3600 * 1000); return { ymd: d.toISOString().slice(0, 10).replace(/-/g, ''), h: d.getUTCHours() }; }
  function courseOf(env, cParam) {
    if (cParam && /^\d{5}$/.test(cParam)) return cParam;
    env = Number(env);
    if (env >= 55 && env <= 60) return 'test';
    if (env >= 1 && env <= 52) return '47602';
    if (env >= 101 && env <= 130) return '46582';
    return '';   // 老師 0／98／99 不綁課，走時段
  }
  function sessKey(env, ms, cParam) {
    var p = twParts(ms), c = courseOf(env, cParam), half = p.h < 14 ? 'am' : 'pm';
    if (!c) c = half === 'am' ? '47602' : '46582';   // 時段預設：早上那班是文化遊戲松、晚上是遊戲設計學
    return c + '-' + p.ymd + half;
  }
  /* ———— 部署前必修（母線 11-13 11:46）：網址參數只對測試編號 55–60 生效；週次由日期推算 ———— */
  function isTestEnv(e) { e = Number(e); return e >= 55 && e <= 60; }
  /* 純函式：從網址與 localStorage 的編號決定「這次用哪個編號、哪些網址參數算數」。
     ?env= 只有值在 55–60 才採用，否則一律用 localStorage 的編號；最後用到的編號是測試編號時，?unit／?mode／?cfg／?c 才生效，正式編號全部忽略。 */
  function urlOverrides(search, stored) {
    var q = new URLSearchParams(search || ''), se = parseInt(stored, 10), qe = parseInt(q.get('env'), 10);
    var env = (isFinite(qe) && isTestEnv(qe)) ? qe : (isFinite(se) ? se : NaN), test = isFinite(env) && isTestEnv(env);
    var u = q.get('unit'), m = q.get('mode'), c = q.get('c');
    return { env: env, test: test, ignoredEnv: isFinite(qe) && !isTestEnv(qe),
      unit: test && /^W(1[0-8]|[1-9])$/.test(u || '') ? u : null, mode: test && (m === 'A' || m === 'B') ? m : null,
      cfg: test && q.get('cfg') ? q.get('cfg') : null, c: test && /^\d{5}$/.test(c || '') ? c : null };
  }
  /* 週次由日期推算：term.firstMonday＝學期第一週的週一（預設 2026-09-07，使 W11＝11/16–11/22）；取台灣時間的日期，不看上課日；夾在 [unitMin, unitMax]（預設 11–16） */
  function unitOfDate(ms, term) {
    term = term || {}; var fm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(term.firstMonday || '2026-09-07'), p = twParts(ms), d = /^(\d{4})(\d{2})(\d{2})$/.exec(p.ymd);
    var lo = Math.max(1, Math.min(18, +term.unitMin || 11)), hi = Math.max(lo, Math.min(18, +term.unitMax || 16));
    var days = (Date.UTC(+d[1], +d[2] - 1, +d[3]) - Date.UTC(+fm[1], +fm[2] - 1, +fm[3])) / 86400000, n = Math.floor(days / 7) + 1;
    return 'W' + Math.max(lo, Math.min(hi, n));
  }
  var URL_GATE = false;   // 瀏覽器端 ?emu／?llm／?llmTimeout／?llmJitter 等測試參數也只對測試編號生效：mount 時由編號決定
  function setUrlGate(on) { URL_GATE = !!on; }
  function qparam(name) { if (!URL_GATE || typeof location === 'undefined') return null; try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function validEnv(env) { env = Number(env); return env === 0 || env === 98 || env === 99 || (env >= 1 && env <= 60) || (env >= 101 && env <= 130); }

  /* ———— 分派表（老師端設定；學生端看不到自己是哪一組） ————
     table = { enabled: false（IRB 確認前一律 false）, default: 'A'|'B'（停用時全部用這個，由楊老師決定）,
               groups: { 信封編號: 0|1 }（沒列的用編號奇偶）, tool: { 信封編號: 'basic'|'cc' }（工具組別，老師設定，不由學生自填）,
               override: { 信封編號: 'A'|'B' }, walkers: [信封編號…]（參加走讀；不影響分派、不給學生看）, fade: {ask, self} }
     組內交叉：同一人不同週輪流 A／B；group 0 在偶數週拿 A、group 1 在奇數週拿 A，順序對半抵銷。兩個工具組別各自照同一規則分派（＝各組內各做一次 A/B）。 */
  function assignMode(env, unit, table) {
    table = table || {}; env = String(env);
    if (!table.enabled) return table.default === 'B' ? 'B' : 'A';   // 11-12 楊老師定案：IRB 確認前預設全部 A（判斷引導）；分派 enabled=false
    if (table.override && (table.override[env] === 'A' || table.override[env] === 'B')) return table.override[env];
    var g = table.groups && (table.groups[env] === 0 || table.groups[env] === 1) ? table.groups[env] : Number(env) % 2;
    return ((unitNum(unit) + g + (table.crossOrder === 'BABA' ? 1 : 0)) % 2 === 0) ? 'A' : 'B';   // crossOrder：ABAB（預設）或 BABA，只是把輪流的起點對調
  }
  function toolGroup(env, table) { var v = ((table || {}).tool || {})[String(env)]; return v === 'cc' || v === 'basic' ? v : 'na'; }
  function isWalker(env, table) { return ((table || {}).walkers || []).map(String).indexOf(String(env)) >= 0; }

  /* ———— 研究設定（單一設定檔 tutor_config.js；改設定不必改程式） ———— */
  var CFG_DEFAULTS = {
    tutor: { mode: 'A', crossOrder: 'ABAB', maxLevel: 3, startLevel: 0, frustrationAfter: 3, assign: { groups: {}, tool: {}, override: {}, walkers: [] } },
    llm: { layer: 'off', transport: 'queue', timeoutSec: 30, submitJitterSec: [0, 8] },
    term: { firstMonday: '2026-09-07', unitMin: 11, unitMax: 16 },
    unbound: { text: '先到學習單綁定編號，助教才會出現', href: '../../w11.html' },
    fade: { enabled: true, askThrough: 12, selfThrough: 14, basis: 'week+performance', successN: 3 },
    selfCheck: { showTip: true, tipItems: ['both', 'why', 'rule', 'src', 'ai', 'field'] },
    hook: { writer: 'off', show: { judge: true, source: true, decider: true, post: true } }
  };
  function deepMerge(a, b) {
    var out = {}; Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      var v = b[k]; out[k] = (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) ? deepMerge(out[k], v) : v;
    });
    return out;
  }
  /* 有效設定＝程式內預設 ＋ 檔案的 base ＋ 所選 preset（name 省略就用檔案的 active）；raw 缺少或壞掉就全用預設（助教不能因設定檔而掛掉） */
  function cfgEffective(raw, name) {
    raw = raw && typeof raw === 'object' ? raw : {}; var pn = name || raw.active || '', p = (raw.presets || {})[pn] || {};
    var e = deepMerge(deepMerge(CFG_DEFAULTS, raw.base || {}), p); e._preset = pn; e._version = raw.version || 'none'; return e;
  }
  /* 設定 → 分派表＋撤除界線＋助教是否開著 */
  function cfgToTable(eff) {
    var t = eff.tutor || {}, a = t.assign || {}, mode = t.mode;
    var table = { enabled: mode === 'cross', default: mode === 'B' ? 'B' : 'A', crossOrder: t.crossOrder === 'BABA' ? 'BABA' : 'ABAB', groups: a.groups || {}, tool: a.tool || {}, override: a.override || {}, walkers: a.walkers || [] };
    var f = eff.fade || {}; table.fade = f.enabled === false ? { ask: 99, self: 99 } : { ask: +f.askThrough || 12, self: +f.selfThrough || 14 };
    var sc = eff.selfCheck || {};
    table.opts = optOf({ basis: f.basis, successN: f.successN, maxLevel: t.maxLevel, startLevel: t.startLevel, frustrationAfter: t.frustrationAfter, showTip: sc.showTip, tipItems: sc.tipItems });
    return { table: table, off: mode === 'off', forceMode: (mode === 'A' || mode === 'B') ? mode : null };
  }

  /* 「誰的決定」三項要不要填（設定 hook.decision）：freq＝weekly（預設）每單元至少填一次，加上關鍵階段（keyStages，預設換規則、換形式）的版本必填；every＝每版都填；off＝不收、不顯示。
     回傳 { req: 這一版要不要填, why: 原因代碼 }。純函式，不碰畫面。 */
  function decisionRequired(dc, unit, decisions, stg) {
    dc = dc || {}; var freq = (dc.freq === 'every' || dc.freq === 'off') ? dc.freq : 'weekly';
    if (freq === 'off') return { req: false, why: 'off' };
    if (freq === 'every') return { req: true, why: 'every' };
    var keys = Array.isArray(dc.keyStages) ? dc.keyStages : [2, 3];
    if (keys.indexOf(stg) >= 0) return { req: true, why: 'key' };
    var done = (decisions || []).some(function (d) { return d && d.unit === unit; });
    return { req: !done, why: done ? 'weekly_done' : 'weekly_first' };
  }

  /* 紀錄欄的兩個開關（設定 hook.decision，母線 11-13 12:12，教學實踐線紅隊稽核風險 1、3）：
     fields＝3（預設，現狀：交給 AI／自己決定／理由）或 2（只留前兩項，理由留給訪談）；
     lastPrompt＝'aistudio'（預設，只在 AI Studio 週出現：W12、W14、W16）／'always'／'off'，多一格「最後一句指令」，只存學生自己的瀏覽器，不進事件。
     週次 unit 由 unitOfDate 推算（boot 傳進來），這裡不另外算。 */
  var AISTUDIO_WEEKS = ['W12', 'W14', 'W16'];
  function decisionFields(dc, unit) {
    dc = dc || {}; var lp = (dc.lastPrompt === 'always' || dc.lastPrompt === 'off') ? dc.lastPrompt : 'aistudio';
    return { fields: Number(dc.fields) === 2 ? 2 : 3, lastPrompt: lp === 'always' || (lp === 'aistudio' && AISTUDIO_WEEKS.indexOf(unit) >= 0) };
  }

  /* ———— 事件（研究與教學共用的最小紀錄） ———— */
  var ACTS = ['offer', 'escalate', 'reply', 'resolved', 'dismiss', 'self_check', 'ai_log', 'folk_open', 'reason', 'predict', 'version', 'playtest', 'own', 'lens', 'intent', 'field_q', 'field_cite', 'meaning', 'claim', 'follow', 'item', 'field_fb', 'change', 'play', 'draw', 'swap', 'open', 'cfg', 'llm'];
  var UNITS = /^W(1[0-8]|[1-9])$/;
  function bit(x) { return x ? 1 : 0; }
  function makeEvent(o) {
    o = o || {};
    var e = { v: SCHEMA_VER, act: ACTS.indexOf(o.act) >= 0 ? o.act : 'offer', unit: UNITS.test(o.unit || '') ? o.unit : 'W0', tpl: TPL_BY_ID[o.tpl] ? o.tpl : 'none',
      st: STUCK[o.stuck] ? o.stuck : 'READY', sc: SCAFFOLD[o.sc] ? o.sc : 'orient', lv: Math.max(0, Math.min(MAX_LV, Number(o.lv) || 0)), by: o.by === 'student' ? 'student' : 'tutor' };
    if (o.ver === 'skin' || o.ver === 'rule') e.ver = o.ver;
    e.mode = o.mode === 'A' ? 'A' : 'B';
    e.tg = o.tg === 'cc' || o.tg === 'basic' ? o.tg : 'na';
    if (o.cat >= 1 && o.cat <= 6) e.cat = o.cat | 0;           // 出處五類：1 原著 2 民間說法 3 工坊創作 4 遊戲設計 5 田野所得（學生自己標）
    if (/^(47602|46582|test)$/.test(o.crs || '')) e.crs = o.crs;   // 課別（路徑的場次鍵也有，這裡再放一份，匯出時不必拆路徑）
    if (/^[a-z0-9_]{1,12}:(skin|rule|pair)$/.test(o.q || '')) e.q = o.q;   // 題目 ID：樣板 id＋哪一版（pair＝兩版一起的預測）
    if (o.ph === 'pre' || o.ph === 'post') e.ph = o.ph;          // 時點：玩前／玩後
    if (/^[a-z0-9_]{1,30}$/.test(o.cd || '')) e.cd = o.cd;       // 抽到或換掉的文化卡 id（只放卡片代碼，不放學生文字）
    if (o.model === 'rule' || o.model === 'argon' || o.model === 'flash' || o.model === 'pro') e.model = o.model;   // 這一句是誰說的：規則層、Argon、Flash（接力）、Pro
    if (o.dg >= 0 && o.dg <= 3) e.dg = o.dg | 0;               // 經費降級層級 0 正常 1 吃緊 2 求助才呼叫 3 全規則句
    if (o.nth >= 1 && o.nth <= 99) e.nth = o.nth | 0;          // 該生本堂第幾次 LLM 句
    if (o.cp === 1) e.cp = 1;                                  // 因每人上限改用規則句
    if (/^[A-Za-z0-9_.-]{1,16}$/.test(o.cv || '')) e.cv = o.cv;      // 設定檔版本代號（tutor_config.js 的 version）：中途改設定時分得清資料是在哪一種設定下收的
    if (o.lay === 'off' || o.lay === 'rules' || o.lay === 'routed') e.lay = o.lay;   // LLM 層開關
    if (o.who === 'ai' || o.who === 'self' || o.who === 'both') e.who = o.who;   // 誰的決定
    if (typeof o.ro === 'number') e.ro = Math.max(0, Math.min(4095, o.ro | 0));   // 這一版交給 AI 的角色（位元遮罩，第 n 位＝第 n 個角色；0＝沒用 AI；只放代碼，不放學生文字）
    if (o.stg >= 1 && o.stg <= 3) e.stg = o.stg | 0;           // 改作階段：1 換內容 2 換規則 3 換形式
    if (o.ch === 0 || o.ch === 1) e.ch = o.ch;                 // 改或不改：1 改、0 不改
    if (o.ini) e.ini = 1;                                   // 超出要求的主動（學生自己發起、當下沒有對應提示）
    if (o.gap === 0 || o.gap === 1) e.gap = o.gap;          // 預測與判斷不同＝1
    if (typeof o.el === 'number') e.el = Math.max(0, Math.min(19, o.el | 0));   // 學生說要改的作品元素（樣板 elems 的索引）
    if (o.fo === 0 || o.fo === 1) e.fo = o.fo;              // 言行一致：下一版有落實＝1、沒有＝0
    if (typeof o.vn === 'number') e.vn = Math.max(0, Math.min(99, o.vn | 0));   // 第幾版
    if (o.rf) { var f = o.rf; e.rf = { len: Math.max(0, Math.min(3, f.len | 0)), rule: bit(f.rule), look: bit(f.look), cause: bit(f.cause), card: bit(f.card), src: bit(f.src), idk: bit(f.idk), ai: bit(f.ai), own: bit(f.own), echo: bit(f.echo), rep: bit(f.rep), pst: bit(f.pst) }; e.spec = specificity(e.rf); }
    if (o.w2) e.w2 = { s: Math.max(0, Math.min(4, o.w2.skin | 0)), r: Math.max(0, Math.min(4, o.w2.rule | 0)) };
    if (o.ai) e.ai = { sug: Math.min(99, o.ai.suggested | 0), acc: Math.min(99, o.ai.accepted | 0), mod: Math.min(99, o.ai.modified | 0), rej: Math.min(99, o.ai.rejected | 0) };
    if (o.cal) { e.cal = { tick: Math.min(9, o.cal.tick | 0), over: Math.min(9, o.cal.over | 0), under: Math.min(9, o.cal.under | 0) }; if (o.cal.ob !== undefined) { e.cal.ob = Math.min(9, o.cal.ob | 0); e.cal.os = Math.min(9, o.cal.os | 0); e.cal.ub = Math.min(9, o.cal.ub | 0); e.cal.us = Math.min(9, o.cal.us | 0); } }
    if (o.folk && FOLK_BY_ID[o.folk]) e.folk = o.folk.replace(/\./g, '_');
    if (typeof o.sec === 'number') e.sec = Math.max(0, Math.min(86400, Math.round(o.sec)));
    return e;
  }
  function eventKey(ms, rnd) { return String(ms) + '_' + String(rnd || Math.floor(Math.random() * 1e6)).padStart(6, '0'); }

  /* ———— 彙整（給老師與研究用；吃事件陣列，吐每人的鷹架歷程） ———— */
  function summarize(events) {
    var by = {};
    (events || []).forEach(function (x) {
      var k = x.env, s = by[k] || (by[k] = { offers: 0, escalations: 0, resolvedAt: [], maxLv: 0, scUsed: {}, selfChecks: 0, calOver: 0, calOverB: 0, calOverS: 0, aiLogs: 0, aiRejMod: 0, folkOpens: 0, studentAsked: 0 });
      if (x.act === 'offer') { s.offers += 1; s.scUsed[x.sc] = (s.scUsed[x.sc] || 0) + 1; if (x.by === 'student') s.studentAsked += 1; }
      if (x.act === 'escalate') s.escalations += 1;
      if (x.act === 'resolved') s.resolvedAt.push(x.sc + '@L' + x.lv);
      if (x.lv > s.maxLv) s.maxLv = x.lv;
      if (x.act === 'self_check') { s.selfChecks += 1; s.calOver += (x.cal || {}).over || 0; s.calOverB += (x.cal || {}).ob || 0; s.calOverS += (x.cal || {}).os || 0; }
      if (x.act === 'ai_log') { s.aiLogs += 1; s.aiRejMod = ((x.ai || {}).mod || 0) + ((x.ai || {}).rej || 0); }
      if (x.act === 'folk_open') s.folkOpens += 1;
    });
    return by;
  }

  /* ———— 依變項（直接從事件算；依「編號×模式」分格，可用走讀標記篩選） ————
     rejAI：否決 AI 的最大累計數｜srcChecks：回源查證次數｜spec：理由與回覆具體度平均（0–4）｜predGap：預測與判斷不同的次數｜iters：存版次數
     follow：言行一致落實率｜ini：主動次數｜paste：貼上次數｜echo：重複助教用語次數 */
  function dependentVars(events, table, opt) {
    opt = opt || {}; var out = {};
    (events || []).forEach(function (x) {
      if (opt.walkersOnly && !isWalker(x.env, table)) return;
      if (opt.excludeWalkers && isWalker(x.env, table)) return;
      var k = x.env + '|' + (x.mode || '?') + '|' + (x.tg || 'na'), d = out[k] || (out[k] = { env: x.env, mode: x.mode, tg: x.tg, walker: isWalker(x.env, table), rejAI: 0, srcChecks: 0, specSum: 0, specN: 0, predGap: 0, iters: 0, followOk: 0, followN: 0, ini: 0, paste: 0, echo: 0 });
      if (x.act === 'ai_log' && x.ai) d.rejAI = Math.max(d.rejAI, x.ai.rej || 0);
      if (x.act === 'folk_open') d.srcChecks += 1;
      if (typeof x.spec === 'number') { d.specSum += x.spec; d.specN += 1; }
      if (x.act === 'predict' && (x.gap === 0 || x.gap === 1)) d.predGap = x.gap;   // 以最後一次判斷為準（同一人會重答好幾次）
      if (x.act === 'version') d.iters += 1;
      if (x.act === 'follow') { d.followN += 1; d.followOk += x.fo === 1 ? 1 : 0; }
      if (x.ini) d.ini += 1;
      if (x.rf && x.rf.pst) d.paste += 1;
      if (x.rf && x.rf.echo) d.echo += 1;
    });
    Object.keys(out).forEach(function (k) { var d = out[k]; d.spec = d.specN ? Math.round(d.specSum / d.specN * 100) / 100 : null; d.follow = d.followN ? d.followOk / d.followN : null; });
    return out;
  }

  /* 送出前的隨機等待（秒）：全班同一秒發問時把請求攤開（設定 llm.submitJitterSec＝[下限, 上限]，預設 [0, 8]；網址 ?llmJitter=秒 只供測試，0＝不等）。純函式，rnd 可注入以便單元測試 */
  function jitterSec(cfg, rnd, override) {
    var j = (cfg && cfg.submitJitterSec), lo = 0, hi = 0;
    if (Array.isArray(j) && j.length === 2) { lo = Math.max(0, Number(j[0]) || 0); hi = Math.min(30, Math.max(lo, Number(j[1]) || 0)); }
    if (override !== undefined && override !== null && override !== '') { lo = 0; hi = Math.min(30, Math.max(0, Number(override) || 0)); }
    return lo + (hi - lo) * (typeof rnd === 'function' ? rnd() : Math.random());
  }

  var pure = { SCHEMA_VER: SCHEMA_VER, W2: W2, W2_EXPECT: W2_EXPECT, STUCK: STUCK, SCAFFOLD: SCAFFOLD, STUCK_TO_SC: STUCK_TO_SC, SELF_CHECK: SELF_CHECK, TEMPLATES: TEMPLATES, TPL_BY_ID: TPL_BY_ID, FOLK_BY_ID: FOLK_BY_ID, MAX_LV: MAX_LV, WITHDRAW_AFTER: WITHDRAW_AFTER, ACTS: ACTS,
    featurize: featurize, specificity: specificity, sim: sim, assignMode: assignMode, toolGroup: toolGroup, isWalker: isWalker, fadePhase: fadePhase, optOf: optOf, OPT_DEFAULTS: OPT_DEFAULTS, THRESH: THRESH, dependentVars: dependentVars, CANDIDATE: CANDIDATE, SAY_B: SAY_B, FADE: FADE, reasonLevel: reasonLevel, diagnose: diagnose, say: say, nextMove: nextMove, escalate: escalate, newMem: newMem, recordResolved: recordResolved, isWithdrawn: isWithdrawn,
    isTestEnv: isTestEnv, urlOverrides: urlOverrides, unitOfDate: unitOfDate, setUrlGate: setUrlGate,
    cfgEffective: cfgEffective, cfgToTable: cfgToTable, decisionFields: decisionFields, AISTUDIO_WEEKS: AISTUDIO_WEEKS, decisionRequired: decisionRequired, calibrate: calibrate, signalOf: signalOf, sessKey: sessKey, courseOf: courseOf, validEnv: validEnv, makeEvent: makeEvent, eventKey: eventKey, summarize: summarize, folkPointer: folkPointer };
  pure.jitterSec = jitterSec;
  if (typeof document === 'undefined') return pure;

  /* ═════════ 瀏覽器：事件寫入（REST 單次 PUT，不訂閱、不讀） ═════════ */
  var DB = 'https://gen-lang-client-0929530380-default-rtdb.asia-southeast1.firebasedatabase.app';
  var NS = 'gen-lang-client-0929530380-default-rtdb';
  function writer(cfg) {
    cfg = cfg || {};
    var emu = qparam('emu') === '1', port = qparam('emuPort') || '9010';
    var mode = cfg.mode || (emu ? 'emu' : 'off');   // cfg.mode＝設定檔 hook.writer（off／emu／live）；沒設定時只有測試編號的 ?emu=1 會寫本機模擬器   // 草稿階段正式環境一律不寫（off）；上線前要先加規則區塊（見 rules_draft.json）
    var base = mode === 'emu' ? 'http://127.0.0.1:' + port : DB;
    var sent = [], failed = 0;
    function put(sess, env, ev) {
      var key = eventKey(Date.now());
      var body = Object.assign({ t: { '.sv': 'timestamp' } }, ev);
      sent.push({ path: 'whgm/tutor/' + sess + '/' + env + '/' + key, ev: ev });
      if (mode === 'off') return Promise.resolve({ ok: true, skipped: true });
      var url = base + '/whgm/tutor/' + encodeURIComponent(sess) + '/' + encodeURIComponent(env) + '/' + key + '.json' + (mode === 'emu' ? '?ns=' + NS : '');
      return fetch(url, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
        .then(function (r) { if (!r.ok) failed += 1; return { ok: r.ok, status: r.status }; })
        .catch(function () { failed += 1; return { ok: false }; });
    }
    return { mode: mode, put: put, sent: sent, failed: function () { return failed; } };
  }
  pure.writer = writer;

  /* ═════════ 瀏覽器：第二層（LLM）的傳輸。學生端 → 本機代理程式，兩種路：
     queue：寫問題到 whgm/tutorq/{場次}/{編號}/{qid}，輪詢 whgm/tutora/…/{qid} 的答案（學生裝置不必連到老師電腦；代理程式在老師電腦上讀佇列、回寫答案、刪掉問題）
     http ：直接 POST 本機代理（只供老師電腦上的本機測試，學生裝置連不到）
     逾時（預設 30 秒，網址 ?llmTimeout=毫秒 可縮短測試）就放棄，學生看到的永遠是規則層基準句。 ═════════ */
  function llmClient(cfg) {
    cfg = cfg || {};
    var emu = qparam('emu') === '1', port = qparam('emuPort') || '9010';
    var transport = qparam('llm') === 'http' ? 'http' : (cfg.transport || 'queue'), timeout = +qparam('llmTimeout') || (cfg.timeoutSec || 30) * 1000, jitter = function () { return jitterSec(cfg, null, qparam('llmJitter')); };
    var base = emu ? 'http://127.0.0.1:' + port : DB, qs = emu ? '?ns=' + NS : '';
    function ask(sess, env, req) {
      if (transport === 'http') {
        var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, timeout);
        return fetch('http://127.0.0.1:' + (qparam('llmPort') || '18930') + '/ask', { method: 'POST', body: JSON.stringify(Object.assign({ sess: sess, env: env }, req)), signal: ctl.signal, headers: { 'Content-Type': 'application/json' } })
          .then(function (r) { clearTimeout(tm); return r.json(); });
      }
      var qid = eventKey(Date.now()), t0 = Date.now(), url = function (n) { return base + '/whgm/' + n + '/' + encodeURIComponent(sess) + '/' + encodeURIComponent(env) + '/' + qid + '.json' + qs; };
      return fetch(url('tutorq'), { method: 'PUT', body: JSON.stringify(Object.assign({ t: { '.sv': 'timestamp' } }, req)), headers: { 'Content-Type': 'application/json' } }).then(function (r) {
        if (!r.ok) throw new Error('queue-put-' + r.status);
        return new Promise(function (resolve, reject) {
          (function poll() {
            if (Date.now() - t0 > timeout) return reject(new Error('timeout'));
            fetch(url('tutora')).then(function (g) { return g.ok ? g.json() : null; }).then(function (a) { if (a && a.say) resolve(a); else setTimeout(poll, 1200); }).catch(function () { setTimeout(poll, 1500); });
          })();
        });
      });
    }
    return { transport: transport, timeout: timeout, ask: ask, jitter: jitter };
  }
  pure.llmClient = llmClient;
  return pure;
});
