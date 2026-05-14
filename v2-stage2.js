(function(){
  const KEY='finanzas_pro_v2';
  const STAGE='stage2-demo-v1';
  const $=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));
  const pct=n=>`${(Number(n||0)).toFixed(1)}%`;
  const ym=d=>String(d||'').slice(0,7);
  const yearOf=d=>Number(String(d||'').slice(0,4))||new Date().getFullYear();
  const monthName=ymv=>{const names=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];const m=Number(String(ymv).slice(5,7));return names[m-1]||ymv};
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||empty()}catch(e){return empty()}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db))}
  function empty(){return{incomes:[],expenses:[],pensions:[],vehicles:[],insurance:[],settings:{}}}
  function hasData(db){return (db.incomes||[]).length+(db.expenses||[]).length+(db.pensions||[]).length+(db.vehicles||[]).length+(db.insurance||[]).length>0}
  function demo(){
    return {
      incomes:[
        {id:101,type:'salary',date:'2025-01-31',taxYear:2025,description:'Sueldo Enero 2025',gross:5300000,net:3820000,tax:220000,taxable:4550000},
        {id:102,type:'salary',date:'2025-02-28',taxYear:2025,description:'Sueldo Febrero 2025',gross:5350000,net:3860000,tax:225000,taxable:4590000},
        {id:103,type:'salary',date:'2025-03-31',taxYear:2025,description:'Sueldo Marzo 2025',gross:5400000,net:3890000,tax:232000,taxable:4630000},
        {id:104,type:'salary',date:'2025-04-30',taxYear:2025,description:'Sueldo Abril 2025',gross:5450000,net:3920000,tax:235000,taxable:4660000},
        {id:105,type:'salary',date:'2025-05-31',taxYear:2025,description:'Sueldo Mayo 2025',gross:5480000,net:3945000,tax:238000,taxable:4680000},
        {id:106,type:'bonus',date:'2026-02-01',taxYear:2025,description:'Bono pagado 2026 asignado renta 2025',gross:11488698,net:9510287,tax:1978411,taxable:11488698},
        {id:201,type:'salary',date:'2026-01-31',taxYear:2026,description:'Sueldo Enero 2026',gross:4970000,net:3912000,tax:234000,taxable:4550000},
        {id:202,type:'salary',date:'2026-02-28',taxYear:2026,description:'Sueldo Febrero 2026',gross:4975000,net:3919000,tax:236000,taxable:4560000},
        {id:203,type:'salary',date:'2026-03-31',taxYear:2026,description:'Sueldo Marzo 2026',gross:4974000,net:3918435,tax:236401,taxable:4561000},
        {id:204,type:'salary',date:'2026-04-30',taxYear:2026,description:'Sueldo Abril 2026',gross:4975594,net:3920471,tax:235780,taxable:4563000},
        {id:205,type:'salary',date:'2026-05-31',taxYear:2026,description:'Sueldo Mayo 2026',gross:5010000,net:3950000,tax:242000,taxable:4590000},
        {id:206,type:'bonus',date:'2027-02-01',taxYear:2026,description:'Bono asignado renta 2026',gross:11500008,net:9510287,tax:1978411,taxable:11500008}
      ],
      expenses:[
        {id:301,date:'2026-05-03',category:'Supermercado',description:'Supermercado mensual',amount:420000},
        {id:302,date:'2026-05-06',category:'Hogar',description:'Servicios hogar',amount:185000},
        {id:303,date:'2026-05-08',category:'Regalos',description:'Regalo cumpleaños',amount:62000},
        {id:304,date:'2026-05-15',category:'Planificado',description:'Gasto planificado',amount:310000},
        {id:305,date:'2026-04-04',category:'Supermercado',description:'Supermercado abril',amount:395000},
        {id:306,date:'2026-04-10',category:'Hogar',description:'Servicios abril',amount:176000},
        {id:307,date:'2025-05-05',category:'Supermercado',description:'Supermercado mayo 2025',amount:370000},
        {id:308,date:'2025-05-12',category:'Hogar',description:'Hogar mayo 2025',amount:155000}
      ],
      pensions:[
        {id:401,payDate:'2026-04-30',month:'2026-05',amount:1490169},
        {id:402,payDate:'2026-03-31',month:'2026-04',amount:1490169},
        {id:403,payDate:'2026-02-28',month:'2026-03',amount:1485000},
        {id:404,payDate:'2025-04-30',month:'2025-05',amount:1350000}
      ],
      vehicles:[
        {id:501,vehicle:'Subaru Legacy 3.0R',date:'2026-05-09',type:'Combustible',amount:78000},
        {id:502,vehicle:'Toyota Corolla Cross',date:'2026-05-11',type:'Combustible',amount:56000},
        {id:503,vehicle:'Subaru Legacy 3.0R',date:'2026-04-18',type:'Mantención',amount:145000},
        {id:504,vehicle:'Toyota Corolla Cross',date:'2026-03-12',type:'Seguro',amount:69000}
      ],
      insurance:[
        {id:601,date:'2026-05-02',status:'pending',description:'Exámenes Clínica Alemana',cost:185000,refund:82000},
        {id:602,date:'2026-04-22',status:'recovered',description:'Kinesiología',cost:260000,refund:120000},
        {id:603,date:'2026-03-10',status:'pending',description:'Consulta médica',cost:78000,refund:35000}
      ],
      settings:{demo:true,demoLoadedAt:new Date().toISOString()}
    };
  }
  function injectStyle(){
    if($('stage2Style')) return;
    const style=document.createElement('style');style.id='stage2Style';style.textContent=`
      .chart-card{padding:16px}.chart-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.chart-title{font-size:19px;font-weight:900;letter-spacing:-.2px}.chart-sub{font-size:12px;color:var(--muted);margin-top:3px}.mini-chart{height:190px;display:grid;align-items:end;gap:8px;grid-template-columns:repeat(6,1fr);padding:12px 2px 4px}.barcol{display:grid;gap:6px;align-items:end;height:100%;grid-template-rows:1fr auto}.bars{display:flex;gap:3px;align-items:end;height:138px}.barA,.barB,.barC{flex:1;border-radius:8px 8px 2px 2px;min-height:4px}.barA{background:#0f766e}.barB{background:#b45309}.barC{background:#be123c}.barlabel{text-align:center;font-size:11px;color:#687672;font-weight:800}.legend{display:flex;gap:8px;flex-wrap:wrap}.legend span{font-size:11px;font-weight:800;color:#5d6c68}.dot{display:inline-block;width:9px;height:9px;border-radius:999px;margin-right:4px}.dot.income{background:#0f766e}.dot.exp{background:#b45309}.dot.pen{background:#be123c}.hbar{display:grid;gap:8px;margin-top:10px}.hrow{display:grid;grid-template-columns:92px 1fr auto;gap:8px;align-items:center}.hlabel{font-size:12px;font-weight:850;color:#5d6c68;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.htrack{height:12px;background:#edf3f0;border-radius:999px;overflow:hidden}.hfill{height:100%;background:#0f766e;border-radius:999px}.hval{font-size:12px;font-weight:900;color:#0b5f59}.stage2-banner{background:#e8f5f1;border:1px solid #bfe2d7;border-radius:18px;padding:13px;margin-bottom:14px}.stage2-banner strong{display:block;margin-bottom:4px}.stage2-banner p{margin:0 0 10px;color:#61716c;font-size:13px;line-height:1.35}.stage2-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stage2-actions button{min-height:42px;border-radius:14px;border:0;font-weight:900}.stage2-actions .load{background:#0f766e;color:white}.stage2-actions .clear{background:white;color:#0b5f59;border:1px solid #c7e2d9}
    `;document.head.appendChild(style);
  }
  function incomeForMonth(db,m){const y=yearOf(m+'-01');const salary=(db.incomes||[]).filter(x=>x.type==='salary'&&ym(x.date)===m).reduce((a,x)=>a+Number(x.net||0),0);const bonusAnnual=(db.incomes||[]).filter(x=>x.type==='bonus'&&Number(x.taxYear)===y).reduce((a,x)=>a+Number(x.net||0),0);return{salary,bonus:bonusAnnual/12,total:salary+bonusAnnual/12}}
  function expForMonth(db,m){return (db.expenses||[]).filter(x=>ym(x.date)===m).reduce((a,x)=>a+Number(x.amount||0),0)}
  function pensionForMonth(db,m){return (db.pensions||[]).filter(x=>x.month===m).reduce((a,x)=>a+Number(x.amount||0),0)}
  function monthsAround(current){const d=new Date(current+'-01T00:00:00');const out=[];for(let i=5;i>=0;i--){const x=new Date(d);x.setMonth(d.getMonth()-i);out.push(x.toISOString().slice(0,7));}return out;}
  function drawMonthlyChart(db){
    let box=$('stage2MonthlyChart'); if(!box){const ref=$('monthSummary')?.closest('.card'); if(!ref)return; box=document.createElement('div');box.id='stage2MonthlyChart';box.className='card chart-card';ref.parentNode.insertBefore(box,ref.nextSibling)}
    const current=$('month')?.value||new Date().toISOString().slice(0,7);const months=monthsAround(current);const rows=months.map(m=>({m,inc:incomeForMonth(db,m).total,exp:expForMonth(db,m),pen:pensionForMonth(db,m)}));const max=Math.max(1,...rows.flatMap(r=>[r.inc,r.exp,r.pen]));
    box.innerHTML=`<div class="chart-head"><div><div class="chart-title">Evolución 6 meses</div><div class="chart-sub">Ingreso base, gastos y pensión</div></div><div class="legend"><span><i class="dot income"></i>Ingreso</span><span><i class="dot exp"></i>Gastos</span><span><i class="dot pen"></i>Pensión</span></div></div><div class="mini-chart">${rows.map(r=>`<div class="barcol"><div class="bars"><div class="barA" style="height:${Math.max(4,r.inc/max*138)}px"></div><div class="barB" style="height:${Math.max(4,r.exp/max*138)}px"></div><div class="barC" style="height:${Math.max(4,r.pen/max*138)}px"></div></div><div class="barlabel">${monthName(r.m)}</div></div>`).join('')}</div>`;
  }
  function drawCategoryChart(db){
    let box=$('stage2CategoryChart'); if(!box){const ref=$('recentList')?.closest('.card'); if(!ref)return; box=document.createElement('div');box.id='stage2CategoryChart';box.className='card chart-card';ref.parentNode.insertBefore(box,ref.nextSibling)}
    const current=$('month')?.value||new Date().toISOString().slice(0,7);const map={};(db.expenses||[]).filter(x=>ym(x.date)===current).forEach(x=>{map[x.category||'Otros']=(map[x.category||'Otros']||0)+Number(x.amount||0)});const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...rows.map(r=>r[1]));
    box.innerHTML=`<div class="chart-head"><div><div class="chart-title">Gastos por categoría</div><div class="chart-sub">Mes seleccionado · no incluye seguro complementario</div></div></div><div class="hbar">${rows.length?rows.map(([k,v])=>`<div class="hrow"><div class="hlabel">${k}</div><div class="htrack"><div class="hfill" style="width:${Math.max(4,v/max*100)}%"></div></div><div class="hval">${fmt(v)}</div></div>`).join(''):'<div class="empty">Sin gastos para graficar</div>'}</div>`;
  }
  function drawVehicleChart(db){
    const ref=$('vehicleList')?.closest('.card'); if(!ref)return; let box=$('stage2VehicleChart'); if(!box){box=document.createElement('div');box.id='stage2VehicleChart';box.className='card chart-card';ref.parentNode.insertBefore(box,ref)}
    const y=Number($('year')?.value)||new Date().getFullYear();const map={};(db.vehicles||[]).filter(x=>yearOf(x.date)===y).forEach(x=>{map[x.vehicle||'Otro']=(map[x.vehicle||'Otro']||0)+Number(x.amount||0)});const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...rows.map(r=>r[1]));
    box.innerHTML=`<div class="chart-head"><div><div class="chart-title">Vehículos por año</div><div class="chart-sub">Comparación de gasto por vehículo</div></div></div><div class="hbar">${rows.length?rows.map(([k,v])=>`<div class="hrow"><div class="hlabel">${k}</div><div class="htrack"><div class="hfill" style="width:${Math.max(4,v/max*100)}%"></div></div><div class="hval">${fmt(v)}</div></div>`).join(''):'<div class="empty">Sin datos de vehículos</div>'}</div>`;
  }
  function drawInsuranceChart(db){
    const ref=$('more-insurance'); if(!ref)return; let box=$('stage2InsuranceChart'); if(!box){box=document.createElement('div');box.id='stage2InsuranceChart';box.className='card chart-card';ref.insertBefore(box,ref.children[1]||null)}
    const pending=(db.insurance||[]).filter(x=>x.status==='pending').reduce((a,x)=>a+Number(x.refund||0),0);const recovered=(db.insurance||[]).filter(x=>x.status==='recovered').reduce((a,x)=>a+Number(x.refund||0),0);const max=Math.max(1,pending,recovered);
    box.innerHTML=`<div class="chart-head"><div><div class="chart-title">Seguro complementario</div><div class="chart-sub">Pendiente vs reembolsado</div></div></div><div class="hbar"><div class="hrow"><div class="hlabel">Pendiente</div><div class="htrack"><div class="hfill" style="width:${Math.max(4,pending/max*100)}%"></div></div><div class="hval">${fmt(pending)}</div></div><div class="hrow"><div class="hlabel">Recuperado</div><div class="htrack"><div class="hfill" style="width:${Math.max(4,recovered/max*100)}%"></div></div><div class="hval">${fmt(recovered)}</div></div></div>`;
  }
  function banner(db){
    const dash=$('scr-dashboard'); if(!dash||$('stage2Banner'))return;
    const b=document.createElement('div');b.id='stage2Banner';b.className='stage2-banner';b.innerHTML=`<strong>Datos de prueba para visualizar</strong><p>Incluye sueldos, bono prorrateado, pensión, gastos, vehículos y seguro complementario. Puedes borrarlos después desde Reportes.</p><div class="stage2-actions"><button class="load" id="loadDemoNow">Cargar demo</button><button class="clear" id="skipDemo">Ocultar</button></div>`;dash.insertBefore(b,dash.children[1]||null);
    $('loadDemoNow').onclick=()=>{save(demo());location.reload()};$('skipDemo').onclick=()=>b.remove();
  }
  function enhance(){injectStyle();const db=load();if(!hasData(db))banner(db);drawMonthlyChart(db);drawCategoryChart(db);drawVehicleChart(db);drawInsuranceChart(db)}
  if(!hasData(load()) && !sessionStorage.getItem(STAGE)){sessionStorage.setItem(STAGE,'1');save(demo());location.reload();return;}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,250));window.addEventListener('load',()=>setTimeout(enhance,400));document.addEventListener('change',e=>{if(e.target&&['month','year'].includes(e.target.id))setTimeout(enhance,120)},true);new MutationObserver(()=>{clearTimeout(window.__stage2Timer);window.__stage2Timer=setTimeout(enhance,250)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(enhance,2500);
})();
