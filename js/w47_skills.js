/* 指令技能與成就（第4–7週）。從這位學生所有的提交現算，不另外存。
   五項技能對齊教學實踐計畫書的指令四個面向（脈絡化／精確度／設計意象性／迭代性）＋本單元的工具接力；
   學生畫面只用白話名稱。判定是關鍵字與結構的粗略規則，是給學生下一步的提示，不是成績。 */
window.W47Skills = (function(){
  var SK = [
    { k:'ctx', name:'給足資料', icon:'📎',
      lv:['還沒看到你貼自己的資料','指令裡有你們的卡號或卡名','貼了上一步的全文或回饋','清楚說明貼的是哪一份（例如「這是 R2 規則定案」）'],
      next:['在指令裡寫出你們這場的卡號和卡名','把上一步的文件全文或 W3 回饋貼進指令','貼之前加一句「這是我們的 R2 規則定案」，讓 AI 知道手上拿的是什麼',''] },
    { k:'prec', name:'講得精準', icon:'🎯',
      lv:['還看不出任務、限制和格式','有說「不要什麼／只能怎樣」','也指定了交出來的格式（條列、幾頁、幾個區塊）','任務分成編號的小步驟，限制和格式都講清楚'],
      next:['加一句限制：「只用來源的內容」或「不要加新規則」','指定格式：條列、幾頁、幾個區塊','把要它做的事拆成 1. 2. 3. 編號小步驟',''] },
    { k:'img', name:'說得出畫面', icon:'🖼️',
      lv:['指令裡還沒描述畫面','提到了一種畫面元素','描述了好幾種畫面元素（畫面、配色、圖示……）','畫面、配色、版面、角色、按鈕都講得出來'],
      next:['描述你想要的畫面：有哪幾個畫面、每個畫面有什麼','再講清楚配色、圖示或版面','補上角色、按鈕、字的大小這些細節',''] },
    { k:'iter', name:'越改越準', icon:'🔁',
      lv:['還沒有改過的指令','交了一則「第一次→改過」的指令','兩則都交了，而且說得出改了什麼','提交過兩天以上，指令一次比一次準'],
      next:['挑一則指令，貼上第一次和改過之後的版本','第 2 則也補上，並各用一句話說改了什麼、為什麼','隔天再改一次、再提交一次',''] },
    { k:'relay', name:'工具接力', icon:'🔗',
      lv:['還沒有交任何工具的連結','交了 1 個工具的連結','交了 2–3 個工具的連結','Deep Research、Canvas、AI Studio、NotebookLM 四棒都交了'],
      next:['先交 Deep Research 對話的分享連結','把 Canvas 或 AI Studio 的連結也交上來','補齊四個工具的連結',''] }
  ];
  var BADGES = [
    { k:'first',  name:'第一棒', desc:'第一次提交' },
    { k:'ontime', name:'準時交棒', desc:'在第8週上課前交過「階段進度」' },
    { k:'all4',   name:'四棒全交', desc:'四個工具的連結都交了' },
    { k:'days3',  name:'三天有進度', desc:'在三個不同的日子提交' },
    { k:'beyond', name:'工具探險家', desc:'用了 Gemini 以外的工具，也交了分享連結' }
  ];
  function txt(p){ return p ? [p.v2||'', p.v1||''].join('\n') : ''; }
  function distinct(s, words){ var n=0; words.forEach(function(w){ if (s.indexOf(w)>=0) n++; }); return n; }

  function compute(all, progressDeadline){
    var keys=Object.keys(all||{}).sort(), recs=keys.map(function(k){ return all[k]; });
    var latest = recs[recs.length-1] || {};
    var pairs=[]; recs.forEach(function(r){ if(r.p1) pairs.push(r.p1); if(r.p2) pairs.push(r.p2); });
    var lp=[latest.p1, latest.p2].filter(Boolean);
    var T = lp.map(function(p){ return p.v2||''; }).join('\n') + '\n' + (latest.nblmPrompt||'');
    var lv={};
    // 給足資料
    var c=0;
    if (/卡\s*\d+|卡號|卡名/.test(T)) c=1;
    if (c>=1 && (lp.some(function(p){ return (p.v2||'').length>=200; }) || /回饋|全文|如下/.test(T))) c=2;
    if (c>=2 && /R[123]|規則定案|介面與美術設定|上一步|來源/.test(T)) c=3;
    lv.ctx=c;
    // 講得精準
    var hasLimit=/不要|只用|只能|不能|不超過|以內|不准/.test(T), hasFmt=/條列|頁|區塊|表格|格式|字以內|步驟|段/.test(T), hasNum=/(^|\n)\s*\d+\s*[.、．)]/.test(T);
    lv.prec = hasLimit ? (hasFmt ? (hasNum ? 3 : 2) : 1) : 0;
    // 說得出畫面
    var d=distinct(T,['畫面','介面','配色','顏色','圖示','版面','風格','角色','按鈕','字體','字要大','圖表']);
    lv.img = d>=5 ? 3 : d>=3 ? 2 : d>=1 ? 1 : 0;
    // 越改越準
    var changed=lp.filter(function(p){ return p.v1 && p.v2 && p.v1!==p.v2; });
    var i=0;
    if (changed.length>=1) i=1;
    if (changed.length>=2 && changed.every(function(p){ return (p.why||'').length>=4; })) i=2;
    if (i>=2 && keys.length>=2) i=3;
    lv.iter=i;
    // 工具接力（所有提交合起來）
    var tools={}; recs.forEach(function(r){ Object.keys(r.links||{}).forEach(function(t){ tools[t.replace(/\d+$/,'')]=1; }); });   // dr2／dr3 算同一個工具
    var nt=Object.keys(tools).length;
    lv.relay = nt>=4 ? 3 : nt>=2 ? 2 : nt>=1 ? 1 : 0;
    var got={
      first: recs.length>=1,
      ontime: keys.some(function(k){ return all[k].kind==='progress' && (!progressDeadline || k<=progressDeadline); }),
      all4: nt>=4,
      days3: keys.length>=3,
      beyond: recs.some(function(r){ return r.other && /https?:\/\//.test(r.other); })
    };
    return { lv:lv, got:got, n:recs.length, pairs:pairs.length };
  }

  function render(box, res){
    box.innerHTML='';
    var g=document.createElement('div'); g.className='skgrid';
    SK.forEach(function(s){
      var L=res.lv[s.k]||0, c=document.createElement('div'); c.className='skcard';
      var h=document.createElement('div'); h.className='skh';
      h.textContent=s.icon+' '+s.name; var b=document.createElement('span'); b.className='sklv'; b.textContent=L?('Lv '+L+' / 3'):'未開始'; h.appendChild(b);
      var bar=document.createElement('div'); bar.className='skbar'; var f=document.createElement('i'); f.style.width=(L/3*100)+'%'; bar.appendChild(f);
      var now=document.createElement('div'); now.className='sknow'; now.textContent=s.lv[L];
      c.appendChild(h); c.appendChild(bar); c.appendChild(now);
      if (L<3){ var nx=document.createElement('div'); nx.className='sknext'; nx.textContent='下一級：'+s.next[L]; c.appendChild(nx); }
      else { var ok=document.createElement('div'); ok.className='sknext'; ok.textContent='已到最高級，維持這樣的寫法'; c.appendChild(ok); }
      g.appendChild(c);
    });
    box.appendChild(g);
    var bd=document.createElement('div'); bd.className='bdrow';
    BADGES.forEach(function(x){
      var t=document.createElement('span'); t.className='bd'+(res.got[x.k]?' on':'');
      t.textContent=(res.got[x.k]?'🏅 ':'○ ')+x.name; t.title=x.desc; bd.appendChild(t);
      var d=document.createElement('span'); d.className='bdd'; d.textContent=x.desc; t.appendChild(d);
    });
    box.appendChild(bd);
  }
  return { SK:SK, BADGES:BADGES, compute:compute, render:render };
})();
