(function(){
  const KEY='finanzas_pro_v2';
  const $=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));
  const pct=n=>`${(Number(n||0)).toFixed(1)}%`;
  const yearOf=d=>Number(String(d||'').slice(0,4))||new Date().getFullYear();
  const ym=d=>String(d||'').slice(0,7);
  const monthNames=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
  function selectedYear(){return Number(($('year')&&$('year').value)||new Date().getFullYear())}
  function injectStyle(){
    if($('stage5Style'))return;
    const s=document.createElement('style');s.id='stage5Style';s.textContent=`
      .analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.analysis-card{background:#fff;border:1px solid #dfe8e3;border-radius:22px;box-shadow:0 8px 24px rgba(19,34,31,.08);padding:16px;margin-bottom:14px}.analysis-card h2{font-size:20px;margin:0 0 14px;letter-spacing:-.25px}.analysis-kpi{background:#eef8f4;border:1px solid #cfe7df;border-radius:18px;padding:13px;min-height:94px;display:flex;flex-direction:column;justify-content:space-between}.analysis-kpi.warn{background:#fff7ed;border-color:#fed7aa}.analysis-kpi.danger{background:#fff1f2;border-color:#fecdd3}.analysis-label{font-size:12px;color:#61716c;font-weight:850;text-transform:uppercase;letter-spacing:.4px}.analysis-value{font-size:clamp(22px,6vw,30px);font-weight:950;color:#0b5f59;line-height:1}.analysis-kpi.warn .analysis-value{color:#b45309}.analysis-kpi.danger .analysis-value{color:#be123c}.analysis-row{display:grid;grid-template-columns:86px 1fr auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2ef}.analysis-row:last-child{border-bottom:0}.analysis-row .name{font-size:13px;font-weight:900;color:#4d5b57;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.analysis-row .track{height:12px;border-radius:999px;background:#edf3f0;overflow:hidden}.analysis-row .fill{height:100%;background:#0f766e;border-radius:999px}.analysis-row .val{font-size:12px;font-weight:950;color:#0b5f59;white-space:nowrap}.month-table{display:grid;gap:8px}.month-line{display:grid;grid-template-columns:42px 1fr 1fr 1fr;gap:6px;align-items:center;background:#fbfdfc;border:1px solid #edf2ef;border-radius:14px;padding:9px}.month-line strong{font-size:12px}.month-line span{font-size:11px;color:#687672}.month-line b{display:block;font-size:12px;color:#0b5f59;margin-top:2px}.child-pill{display:inline-flex;padding:5px 8px;background:#e6f2ee;color:#0b5f59;border-radius:999px;font-size:11px;font-weight:900;margin:2px 4px 2px 0}.annual-bars{height:180px;display:grid;grid-template-columns:repeat(12,1fr);gap:5px;align-items:end;padding-top:10px}.annual-bar{display:grid;grid-template-rows:1fr auto;gap:5px;height:100%}.annual-stack{height:140px;display:flex;flex-direction:column-reverse;border-radius:10px;overflow:hidden;background:#edf3f0}.seg-inc{background:#0f766e}.seg-exp{background:#b45309}.seg-pen{background:#be123c}.annual-label{text-align:center;font-size:10px;color:#687672;font-weight:800}.analysis-legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.analysis-legend span{font-size:11px;font-weight:850;color:#5d6c68}.analysis-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px}.d-inc{background:#0f766e}.d-exp{background:#b45309}.d-pen{background:#be123c}@media(max-width:390px){.analysis-grid{gap:8px}.month-line{grid-template-columns:36px 1fr 1fr 1fr;padding:8px}.analysis-row{grid-template-columns:74px 1fr auto}}
    `;document.head.appendChild(s);
  }
  function ensureTab(){
    const chips=document.querySelector('#scr-more .chips');if(!chips)return;
    if(!document.querySelector('[data-more="analysis"]')){
      const b=document.createElement('button');b.className='chip';b.dataset.more='analysis';b.textContent='Análisis';chips.insertBefore(b,chips.firstChild);
    }
    if(!$('more-analysis')){
      const pane=document.createElement('div');pane.id='more-analysis';pane.className='more-tab hidden';pane.innerHTML=`
        <div class="analysis-card"><h2>Análisis anual</h2><div class="analysis-grid"><div class="analysis-kpi"><div class="analysis-label">Ingresos año</div><div class="analysis-value" id="anIncome">$0</div></div><div class="analysis-kpi warn"><div class="analysis-label">Gastos año</div><div class="analysis-value" id="anExpenses">$0</div></div><div class="analysis-kpi danger"><div class="analysis-label">Pensión año</div><div class="analysis-value" id="anPension">$0</div></div><div class="analysis-kpi"><div class="analysis-label">Saldo operativo</div><div class="analysis-value" id="anBalance">$0</div></div></div></div>
        <div class="analysis-card"><h2>Estadística anual</h2><div id="anAnnualBars"></div></div>
        <div class="analysis-card"><h2>Gastos por categoría</h2><div id="anCategories"></div></div>
        <div class="analysis-card"><h2>Niños: pensión + seguro</h2><div id="anChildren"></div></div>
        <div class="analysis-card"><h2>Pagos mensuales niños</h2><div id="anMonthlyKids"></div></div>
      `;
      $('scr-more').appendChild(pane);
    }
    document.querySelectorAll('[data-more]').forEach(x=>{if(!x.dataset.analysisBound){x.dataset.analysisBound='1';x.addEventListener('click',()=>{document.querySelectorAll('[data-more]').forEach(y=>y.classList.remove('active'));x.classList.add('active');document.querySelectorAll('.more-tab').forEach(y=>y.classList.add('hidden'));const p=$('more-'+x.dataset.more);if(p)p.classList.remove('hidden');setTimeout(render,80);});}});
  }
  function incomeYear(db,y){return (db.incomes||[]).filter(x=>Number(x.taxYear||yearOf(x.date))===y).reduce((a,x)=>a+Number(x.net||x.amount||0),0)}
  function expensesYear(db,y){return (db.expenses||[]).filter(x=>yearOf(x.date)===y).reduce((a,x)=>a+Number(x.amount||0),0)}
  function pensionYear(db,y){return (db.pensions||[]).filter(x=>yearOf((x.month||'')+'-01')===y).reduce((a,x)=>a+Number(x.amount||0),0)}
  function childInsurance(db,y){
    return (db.insurance||[]).filter(x=>yearOf(x.date)===y && ['Gracia','Lukas'].includes(x.recipient||''));
  }
  function renderKpis(db,y){
    const inc=incomeYear(db,y), exp=expensesYear(db,y), pen=pensionYear(db,y);$('anIncome').textContent=fmt(inc);$('anExpenses').textContent=fmt(exp);$('anPension').textContent=fmt(pen);$('anBalance').textContent=fmt(inc-exp-pen);
  }
  function renderBars(db,y){
    const months=Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,'0')}`);
    const data=months.map(m=>({m,inc:(db.incomes||[]).filter(x=>ym(x.date)===m).reduce((a,x)=>a+Number(x.net||0),0),exp:(db.expenses||[]).filter(x=>ym(x.date)===m).reduce((a,x)=>a+Number(x.amount||0),0),pen:(db.pensions||[]).filter(x=>x.month===m).reduce((a,x)=>a+Number(x.amount||0),0)}));
    const max=Math.max(1,...data.map(d=>Math.max(d.inc,d.exp+d.pen)));
    $('anAnnualBars').innerHTML=`<div class="annual-bars">${data.map((d,i)=>{const incH=Math.max(2,d.inc/max*140);const expH=Math.max(0,d.exp/max*140);const penH=Math.max(0,d.pen/max*140);return `<div class="annual-bar"><div class="annual-stack"><div class="seg-inc" style="height:${incH}px"></div><div class="seg-exp" style="height:${expH}px"></div><div class="seg-pen" style="height:${penH}px"></div></div><div class="annual-label">${monthNames[i]}</div></div>`}).join('')}</div><div class="analysis-legend"><span><i class="analysis-dot d-inc"></i>Ingresos</span><span><i class="analysis-dot d-exp"></i>Gastos</span><span><i class="analysis-dot d-pen"></i>Pensión</span></div>`;
  }
  function renderCategories(db,y){
    const map={};(db.expenses||[]).filter(x=>yearOf(x.date)===y).forEach(x=>{map[x.category||'Otros']=(map[x.category||'Otros']||0)+Number(x.amount||0)});
    const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...rows.map(r=>r[1]));
    $('anCategories').innerHTML=rows.length?rows.map(([k,v])=>`<div class="analysis-row"><div class="name">${k}</div><div class="track"><div class="fill" style="width:${Math.max(4,v/max*100)}%"></div></div><div class="val">${fmt(v)}</div></div>`).join(''):'<div class="empty">Sin gastos por categoría</div>';
  }
  function renderChildren(db,y){
    const pens=pensionYear(db,y);const ins=childInsurance(db,y);const cost=ins.reduce((a,x)=>a+Number(x.cost||0),0);const refund=ins.reduce((a,x)=>a+Number(x.refund||0),0);const net=cost-refund;const byChild={Gracia:{cost:0,refund:0},Lukas:{cost:0,refund:0}};ins.forEach(x=>{const r=x.recipient||'Gracia';if(!byChild[r])byChild[r]={cost:0,refund:0};byChild[r].cost+=Number(x.cost||0);byChild[r].refund+=Number(x.refund||0)});
    $('anChildren').innerHTML=`<div class="analysis-grid"><div class="analysis-kpi danger"><div class="analysis-label">Pensión anual</div><div class="analysis-value">${fmt(pens)}</div></div><div class="analysis-kpi warn"><div class="analysis-label">Costo salud niños</div><div class="analysis-value">${fmt(cost)}</div></div><div class="analysis-kpi"><div class="analysis-label">Reembolsos seguro</div><div class="analysis-value">${fmt(refund)}</div></div><div class="analysis-kpi"><div class="analysis-label">Costo neto salud</div><div class="analysis-value">${fmt(net)}</div></div></div><div style="margin-top:12px">${Object.entries(byChild).map(([k,v])=>`<span class="child-pill">${k}: ${fmt(v.cost-v.refund)} neto</span>`).join('')}</div><div class="row"><div><div class="rtitle">Total niños anual</div><div class="rsub">Pensión + costo neto salud</div></div><div class="rval">${fmt(pens+net)}</div></div>`;
  }
  function renderMonthlyKids(db,y){
    const lines=Array.from({length:12},(_,i)=>{const m=`${y}-${String(i+1).padStart(2,'0')}`;const pen=(db.pensions||[]).filter(x=>x.month===m).reduce((a,x)=>a+Number(x.amount||0),0);const ins=childInsurance(db,y).filter(x=>ym(x.date)===m);const refund=ins.reduce((a,x)=>a+Number(x.refund||0),0);const cost=ins.reduce((a,x)=>a+Number(x.cost||0),0);const net=cost-refund;return{m,pen,refund,net,total:pen+net};});
    $('anMonthlyKids').innerHTML=`<div class="month-table">${lines.map((x,i)=>`<div class="month-line"><strong>${monthNames[i]}</strong><div><span>Pensión</span><b>${fmt(x.pen)}</b></div><div><span>Seguro neto</span><b>${fmt(x.net)}</b></div><div><span>Total</span><b>${fmt(x.total)}</b></div></div>`).join('')}</div>`;
  }
  function render(){const db=load();const y=selectedYear();if(!$('more-analysis'))return;renderKpis(db,y);renderBars(db,y);renderCategories(db,y);renderChildren(db,y);renderMonthlyKids(db,y)}
  function apply(){injectStyle();ensureTab();render()}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,600));window.addEventListener('load',()=>setTimeout(apply,800));document.addEventListener('change',e=>{if(e.target&&['year','month'].includes(e.target.id))setTimeout(render,100)},true);new MutationObserver(()=>{clearTimeout(window.__stage5Timer);window.__stage5Timer=setTimeout(apply,300)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(render,2500);
})();
