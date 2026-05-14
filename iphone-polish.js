(function(){
  const VERSION='iphone-polish-2026-05-14-1';
  function $(id){return document.getElementById(id)}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
  function appState(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.entries))return state}catch(e){} return null}
  function yearFromText(text){
    const s=String(text||'');
    let m=s.match(/a[nñ]o\s+renta\s+(20\d{2})/i); if(m) return Number(m[1]);
    m=s.match(/renta\s+(20\d{2})/i); if(m) return Number(m[1]);
    m=s.match(/(20\d{2})/); return m?Number(m[1]):null;
  }
  function yearFromEntry(e){
    if(e.taxYear) return Number(e.taxYear);
    if(e.rentaYear) return Number(e.rentaYear);
    if(e.anoRenta) return Number(e.anoRenta);
    const txt=[e.description,e.desc,e.date,e.paymentDate,e.pensionMonth,e.period].filter(Boolean).join(' ');
    return yearFromText(txt);
  }
  function selectedAppYear(){
    return Number(($('#dashYear')&&$('#dashYear').value)||($('#taxYear')&&$('#taxYear').value)||new Date().getFullYear());
  }
  function collectEntryYears(){
    const years=new Set([selectedAppYear(),new Date().getFullYear()]);
    const s=appState();
    if(s){(s.entries||[]).forEach(e=>{const y=yearFromEntry(e); if(y) years.add(y);});}
    const list=$('allEntries');
    if(list){Array.from(list.children).forEach(node=>{const y=yearFromText(node.textContent); if(y) years.add(y);});}
    return Array.from(years).filter(Boolean).sort((a,b)=>b-a);
  }
  function ensureStyle(){
    if($('iphonePolishStyle')) return;
    const style=document.createElement('style');
    style.id='iphonePolishStyle';
    style.textContent=`
      html,body{max-width:100%;overflow-x:hidden;background:#f6f7f4;}
      body{touch-action:manipulation;}
      .app{max-width:520px;margin:0 auto;min-height:100dvh;padding-bottom:calc(104px + env(safe-area-inset-bottom))!important;}
      header{border-bottom:1px solid #dfe7e2!important;padding:calc(14px + env(safe-area-inset-top)) 16px 12px!important;}
      main{padding:14px 14px 0!important;max-width:520px!important;}
      h1{font-size:25px!important;letter-spacing:-.4px;}
      .subtitle{font-size:13px!important;}
      .year-select{min-height:48px;border-radius:14px!important;font-size:18px!important;text-align:center;}
      .tabs{position:sticky;top:calc(86px + env(safe-area-inset-top));z-index:15;background:#f6f7f4;padding:10px 0 8px;margin:0 -2px 14px!important;}
      .tab{min-height:48px!important;border-radius:14px!important;font-size:14px!important;box-shadow:0 1px 3px rgba(0,0,0,.04);}
      .card{border-radius:16px!important;padding:16px!important;margin-bottom:14px!important;box-shadow:0 3px 16px rgba(24,34,31,.06)!important;}
      .card h2{font-size:20px!important;letter-spacing:-.2px;}
      input,select,textarea{border-radius:14px!important;min-height:50px!important;font-size:16px!important;}
      label{font-size:14px!important;font-weight:800!important;}
      .btn{min-height:52px!important;border-radius:14px!important;font-size:17px!important;}
      .metric{border-radius:14px!important;min-height:96px!important;}
      .metric-label{font-size:12px!important;letter-spacing:.2px;}
      .metric-value{font-size:clamp(22px,7vw,31px)!important;}
      .list-item{align-items:start!important;grid-template-columns:minmax(0,1fr) auto!important;padding:14px 0!important;}
      .list-label{font-size:16px!important;line-height:1.2;}
      .list-sub{font-size:13px!important;line-height:1.35;}
      .list-value{font-size:16px!important;}
      .bottom-nav{max-width:520px;margin:0 auto;left:0!important;right:0!important;padding:10px 10px calc(10px + env(safe-area-inset-bottom))!important;border-top:1px solid #dfe7e2!important;}
      .nav-btn{min-height:54px!important;border-radius:14px!important;font-size:13px!important;}
      .entries-filter{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin:4px 0 12px;padding:12px;border:1px solid #dfe7e2;border-radius:14px;background:#f8fbfa;}
      .entries-filter label{margin:0 0 5px;color:#66736f;}
      .entries-filter select{min-width:128px;background:white;}
      .entries-filter .count{font-size:12px;color:#66736f;font-weight:800;text-align:right;padding-bottom:14px;}
      @media (max-width:600px){
        .form-row,.range-grid{grid-template-columns:1fr!important;gap:10px!important;}
        .button-row{grid-template-columns:1fr 1fr!important;}
        .tabs{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;}
        table{min-width:560px!important;}
      }
    `;
    document.head.appendChild(style);
  }
  function ensureEntriesFilter(){
    const list=$('allEntries'); if(!list) return;
    const card=list.closest('.card'); if(!card) return;
    let wrap=$('entriesYearFilterWrap');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='entriesYearFilterWrap'; wrap.className='entries-filter';
      wrap.innerHTML='<div><label for="entriesYearFilter">Ver registros de</label><select id="entriesYearFilter"></select></div><div class="count" id="entriesYearCount"></div>';
      const h=card.querySelector('h2'); card.insertBefore(wrap, h?h.nextSibling:list);
      $('#entriesYearFilter').addEventListener('change',function(){localStorage.setItem('entriesYearFilter',this.value); filterEntries();});
    }
    const sel=$('entriesYearFilter'); if(!sel) return;
    const preferred=localStorage.getItem('entriesYearFilter')||String(selectedAppYear());
    const years=collectEntryYears();
    const existing=sel.value||preferred;
    sel.innerHTML='';
    const optAll=document.createElement('option'); optAll.value='all'; optAll.textContent='Todos'; sel.appendChild(optAll);
    years.forEach(y=>{const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); sel.appendChild(o);});
    if([...sel.options].some(o=>o.value===existing)) sel.value=existing;
    else if([...sel.options].some(o=>o.value===preferred)) sel.value=preferred;
    else sel.value=String(selectedAppYear());
  }
  function filterEntries(){
    const list=$('allEntries'); const sel=$('entriesYearFilter'); if(!list||!sel) return;
    const target=sel.value; let shown=0,total=0;
    Array.from(list.children).forEach(node=>{
      if(!node.classList.contains('list-item')) return;
      total++;
      const y=yearFromText(node.textContent);
      const visible=(target==='all')||String(y)===String(target);
      node.style.display=visible?'':'none';
      if(visible) shown++;
    });
    const count=$('entriesYearCount'); if(count) count.textContent=(target==='all'?shown:shown+' de '+total);
  }
  function apply(){ensureStyle();ensureEntriesFilter();filterEntries();}
  document.addEventListener('change',function(e){if(e.target&&['taxYear','dashYear','entriesYearFilter'].includes(e.target.id))setTimeout(apply,80);},true);
  new MutationObserver(function(){clearTimeout(window.__iphonePolishTimer); window.__iphonePolishTimer=setTimeout(apply,140);}).observe(document.documentElement,{childList:true,subtree:true});
  window.iphonePolishVersion=VERSION;
  setInterval(apply,2000);
  setTimeout(apply,200);
})();
