(function(){
  const KEY='finanzas_pro_v2';
  const $=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));
  const parse=v=>{if(typeof v==='number')return v;let s=String(v||'').trim().replace(/\$/g,'').replace(/\s/g,'');if(!s)return 0;if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return Number(s.replace(/\./g,'').replace(',','.'))||0;if(/^[-+]?\d+(\.\d+)?$/.test(s))return Number(s)||0;if(/^[-+]?\d+,\d+$/.test(s))return Number(s.replace(',','.'))||0;return Number(s.replace(/[^0-9.-]/g,''))||0};
  const today=()=>new Date().toISOString().slice(0,10);
  const yearOf=d=>Number(String(d||'').slice(0,4))||new Date().getFullYear();
  const uid=()=>Date.now()+Math.floor(Math.random()*999);
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));setTimeout(apply,80)}
  function ensure(db){db.accounts=db.accounts||[];db.cards=db.cards||[];db.accountMovements=db.accountMovements||[];db.cardMovements=db.cardMovements||[];db.insurance=db.insurance||[];return db}
  function demoMovements(db){
    if(!(db.settings&&db.settings.demo))return db;
    if((db.accountMovements||[]).length===0){
      db.accountMovements=[
        {id:1101,accountId:901,date:'2026-05-31',description:'Abono sueldo mayo',amount:3950000,type:'in'},
        {id:1102,accountId:901,date:'2026-05-03',description:'Pago supermercado',amount:-420000,type:'out'},
        {id:1103,accountId:901,date:'2026-04-30',description:'Pensión alimenticia mayo',amount:-1490169,type:'out'},
        {id:1104,accountId:902,date:'2026-05-10',description:'Traspaso ahorro',amount:250000,type:'in'},
        {id:1105,accountId:903,date:'2026-05-08',description:'Retiro efectivo',amount:80000,type:'in'}
      ];
    }
    if((db.cardMovements||[]).length===0){
      db.cardMovements=[
        {id:1201,cardId:951,date:'2026-05-12',description:'Restaurante',amount:68000},
        {id:1202,cardId:951,date:'2026-05-09',description:'Combustible',amount:78000},
        {id:1203,cardId:951,date:'2026-05-04',description:'Farmacia',amount:34500},
        {id:1204,cardId:952,date:'2026-05-03',description:'Supermercado',amount:135000}
      ];
    }
    return db;
  }
  function style(){
    if($('stage4Style'))return;
    const s=document.createElement('style');s.id='stage4Style';s.textContent=`
      .wallet-mini{cursor:pointer}.wallet-mini:active,.clickable-row:active{transform:scale(.99)}
      .clickable-row{cursor:pointer;border-radius:14px;padding-left:10px;padding-right:10px;margin:0 -6px}.clickable-row:hover{background:#f6faf8}.detail-panel{background:#fbfdfc;border:1px solid #dfe8e3;border-radius:18px;padding:14px;margin-top:12px}.detail-title{font-size:18px;font-weight:950;margin-bottom:4px}.detail-sub{font-size:12px;color:#687672;margin-bottom:12px}.tc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px}.tc-cell{background:#f3f8f6;border:1px solid #dbe9e4;border-radius:14px;padding:10px}.tc-cell span{display:block;font-size:10px;color:#687672;font-weight:900;text-transform:uppercase}.tc-cell strong{display:block;margin-top:4px;font-size:14px;color:#0b5f59}.movement{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #edf2ef}.movement:last-child{border-bottom:0}.mov-title{font-size:14px;font-weight:850}.mov-date{font-size:12px;color:#687672;margin-top:2px}.mov-amt{font-weight:950;color:#0b5f59}.mov-amt.out{color:#be123c}.expenseList .row{}#expenseList .row{border-left:5px solid transparent;padding-left:10px;border-radius:10px}#expenseList .cat-hogar{border-left-color:#0f766e;background:#f0faf7}#expenseList .cat-super{border-left-color:#2563eb;background:#eff6ff}#expenseList .cat-regalo{border-left-color:#db2777;background:#fdf2f8}#expenseList .cat-plan{border-left-color:#b45309;background:#fff7ed}#expenseList .cat-pension{border-left-color:#be123c;background:#fff1f2}#expenseList .cat-otro{border-left-color:#64748b;background:#f8fafc}.recipient-pill{display:inline-flex;align-items:center;border-radius:999px;background:#e6f2ee;color:#0b5f59;padding:5px 8px;font-size:11px;font-weight:900;margin-top:6px}.tax-card{background:#fbfdfc;border:1px solid #dfe8e3;border-radius:16px;padding:12px;margin-bottom:10px}.tax-head{display:flex;justify-content:space-between;gap:10px}.tax-title{font-weight:950}.tax-sub{font-size:12px;color:#687672;margin-top:2px}.tax-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.tax-cell{background:white;border:1px solid #edf2ef;border-radius:13px;padding:9px}.tax-cell span{display:block;color:#687672;font-size:10px;font-weight:900;text-transform:uppercase}.tax-cell strong{font-size:14px;color:#0b5f59}.tax-total{background:#e9f6f2;border-color:#c7e2d9}.tax-negative strong{color:#be123c!important}
    `;document.head.appendChild(s);
  }
  function showMore(tab){
    const nav=document.querySelector('[data-screen="more"]');if(nav)nav.click();
    document.querySelectorAll('[data-more]').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.more-tab').forEach(x=>x.classList.add('hidden'));
    const chip=document.querySelector('[data-more="'+tab+'"]');if(chip)chip.classList.add('active');
    const pane=$('more-'+tab);if(pane){pane.classList.remove('hidden');setTimeout(()=>pane.scrollIntoView({behavior:'smooth',block:'start'}),80)}
  }
  function bindWalletCard(){
    const card=$('walletGlobalCard');if(!card)return;
    const minis=card.querySelectorAll('.wallet-mini');
    if(minis[0]&&!minis[0].dataset.stage4){minis[0].dataset.stage4='1';minis[0].onclick=()=>{showMore('wallet');setTimeout(()=>{const p=$('accountsList');if(p)p.scrollIntoView({behavior:'smooth',block:'center'})},150)}}
    if(minis[1]&&!minis[1].dataset.stage4){minis[1].dataset.stage4='1';minis[1].onclick=()=>{showMore('wallet');setTimeout(()=>{const p=$('cardsList');if(p)p.scrollIntoView({behavior:'smooth',block:'center'})},150)}}
  }
  function movementHtml(list){
    if(!list.length)return '<div class="empty">Sin movimientos registrados</div>';
    return list.sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8).map(m=>`<div class="movement"><div><div class="mov-title">${m.description||'Movimiento'}</div><div class="mov-date">${m.date||''}</div></div><div class="mov-amt ${Number(m.amount)<0?'out':''}">${fmt(Math.abs(Number(m.amount||0)))}</div></div>`).join('');
  }
  function showAccountDetail(db,accountId){
    const acc=(db.accounts||[]).find(x=>String(x.id)===String(accountId));if(!acc)return;
    const panel=ensurePanel();const list=(db.accountMovements||[]).filter(x=>String(x.accountId)===String(accountId));
    panel.innerHTML=`<div class="detail-title">${acc.name}</div><div class="detail-sub">${acc.type||'Cuenta'} · saldo actual ${fmt(acc.balance)}</div><div>${movementHtml(list)}</div>`;
    panel.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function showCardDetail(db,cardId){
    const card=(db.cards||[]).find(x=>String(x.id)===String(cardId));if(!card)return;
    const available=Number(card.limit||0)-Number(card.debt||0);const used=card.limit?Number(card.debt||0)/Number(card.limit||1)*100:0;
    const panel=ensurePanel();const list=(db.cardMovements||[]).filter(x=>String(x.cardId)===String(cardId));
    panel.innerHTML=`<div class="detail-title">${card.name}</div><div class="detail-sub">Pago ${card.dueDate||'-'} · corte ${card.cutDate||'-'}</div><div class="tc-grid"><div class="tc-cell"><span>Aprobado</span><strong>${fmt(card.limit)}</strong></div><div class="tc-cell"><span>Utilizado</span><strong>${fmt(card.debt)}</strong></div><div class="tc-cell"><span>Disponible</span><strong>${fmt(available)}</strong></div></div><div class="detail-sub" style="margin-top:10px">Uso actual: ${used.toFixed(0)}%</div><div>${movementHtml(list)}</div>`;
    panel.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function ensurePanel(){
    let p=$('walletMovementPanel');if(!p){p=document.createElement('div');p.id='walletMovementPanel';p.className='detail-panel';const ref=$('cardsList');if(ref&&ref.parentNode)ref.parentNode.appendChild(p)}return p;
  }
  function renderWalletDetails(db){
    if(!$('accountsList')||!$('cardsList'))return;
    const accounts=(db.accounts||[]).filter(x=>Number(x.balance||0)!==0);
    $('accountsList').innerHTML=accounts.length?accounts.map(x=>`<div class="row clickable-row" data-account-id="${x.id}"><div><div class="rtitle">${x.name}</div><div class="rsub">${x.type||'Cuenta'} · ${x.currency||'CLP'}</div></div><div class="rval">${fmt(x.balance)}</div></div>`).join(''):'<div class="empty">Sin cuentas con saldo</div>';
    $('cardsList').innerHTML=(db.cards||[]).length?(db.cards||[]).map(x=>{const available=Number(x.limit||0)-Number(x.debt||0);const used=x.limit?Number(x.debt||0)/Number(x.limit||1)*100:0;return `<div class="row clickable-row" data-card-id="${x.id}"><div><div class="rtitle">${x.name}</div><div class="rsub">Pago ${x.dueDate||'-'} · Corte ${x.cutDate||'-'}</div><div class="tc-grid"><div class="tc-cell"><span>Aprobado</span><strong>${fmt(x.limit)}</strong></div><div class="tc-cell"><span>Utilizado</span><strong>${fmt(x.debt)}</strong></div><div class="tc-cell"><span>Disponible</span><strong>${fmt(available)}</strong></div></div><div class="card-progress"><span style="width:${Math.min(100,used)}%"></span></div></div><div class="rval">${used.toFixed(0)}%</div></div>`}).join(''):'<div class="empty">Sin tarjetas creadas</div>';
    document.querySelectorAll('[data-account-id]').forEach(el=>{if(!el.dataset.bound){el.dataset.bound='1';el.onclick=()=>showAccountDetail(db,el.dataset.accountId)}});
    document.querySelectorAll('[data-card-id]').forEach(el=>{if(!el.dataset.bound){el.dataset.bound='1';el.onclick=()=>showCardDetail(db,el.dataset.cardId)}});
  }
  function colorExpenses(){
    const list=$('expenseList');if(!list)return;
    Array.from(list.children).forEach(row=>{if(!row.classList||!row.classList.contains('row'))return;row.classList.remove('cat-hogar','cat-super','cat-regalo','cat-plan','cat-pension','cat-otro');const t=row.textContent.toLowerCase();if(t.includes('pensión')||t.includes('pension'))row.classList.add('cat-pension');else if(t.includes('super'))row.classList.add('cat-super');else if(t.includes('regalo'))row.classList.add('cat-regalo');else if(t.includes('planificado'))row.classList.add('cat-plan');else if(t.includes('hogar')||t.includes('servicio'))row.classList.add('cat-hogar');else row.classList.add('cat-otro')});
  }
  function recipientField(){
    if($('insuranceRecipient'))return;
    const status=$('insuranceStatus');if(!status)return;
    const group=status.closest('.split')||status.closest('.form');if(!group||!group.parentNode)return;
    const wrap=document.createElement('div');wrap.innerHTML='<label>Destinatario reembolso</label><select id="insuranceRecipient"><option value="Erich">Erich</option><option value="Gracia">Gracia</option><option value="Lukas">Lukas</option></select>';
    group.parentNode.insertBefore(wrap,group.nextSibling);
  }
  function bindInsuranceRecipient(){
    const btn=$('saveInsurance');if(!btn||btn.dataset.recipientBound)return;btn.dataset.recipientBound='1';
    btn.addEventListener('click',()=>setTimeout(()=>{const db=ensure(load());const rec=$('insuranceRecipient')?$('insuranceRecipient').value:'Erich';if((db.insurance||[]).length){const last=db.insurance[db.insurance.length-1];if(last&&!last.recipient){last.recipient=rec;save(db)}}},150));
  }
  function renderInsuranceRecipients(db){
    const pane=$('more-insurance');if(!pane||$('insuranceRecipientList'))return;
    const box=document.createElement('div');box.id='insuranceRecipientList';box.className='card';box.innerHTML='<h2>Reembolsos por destinatario</h2><div id="recipientSummary"></div>';pane.insertBefore(box,pane.children[1]||null);
  }
  function updateRecipientSummary(db){
    const el=$('recipientSummary');if(!el)return;const map={Erich:0,Gracia:0,Lukas:0};(db.insurance||[]).forEach(x=>{map[x.recipient||'Erich']=(map[x.recipient||'Erich']||0)+Number(x.refund||0)});
    el.innerHTML=Object.entries(map).map(([k,v])=>`<div class="row"><div><div class="rtitle">${k}</div><div class="rsub">Reembolsos registrados</div></div><div class="rval">${fmt(v)}</div></div>`).join('');
  }
  const TAX_TABLE=[{from:0,to:13.5,rate:0,rebate:0},{from:13.5,to:30,rate:.04,rebate:.54},{from:30,to:50,rate:.08,rebate:1.74},{from:50,to:70,rate:.135,rebate:4.49},{from:70,to:90,rate:.23,rebate:11.14},{from:90,to:120,rate:.304,rebate:17.8},{from:120,to:310,rate:.35,rebate:23.32},{from:310,to:Infinity,rate:.4,rebate:38.82}];
  function annualTax(base,utm){const uta=Math.max(Number(utm||69400)*12,1);const bu=Number(base||0)/uta;const b=TAX_TABLE.find(x=>bu>x.from&&bu<=x.to)||TAX_TABLE[0];return Math.max(0,(bu*b.rate-b.rebate)*uta)}
  function renderTaxes(db){
    const el=$('taxSummary');if(!el)return;const year=Number($('year')?$('year').value:new Date().getFullYear());const incomes=(db.incomes||[]).filter(x=>Number(x.taxYear||yearOf(x.date))===year);const base=incomes.reduce((a,x)=>a+Number(x.taxable||x.gross||0),0);const monthlyTax=incomes.reduce((a,x)=>a+Number(x.tax||0),0);const ppm=incomes.reduce((a,x)=>a+Number(x.ppm||x.provisional||x.pagoProvisional||0),0);const tax=annualTax(base,(db.settings&&db.settings.utmValue)||69400);const maxCredit=monthlyTax+ppm;let result=tax-maxCredit;if(result< -maxCredit)result=-maxCredit;
    el.innerHTML=`<div class="tax-card tax-total"><div class="tax-head"><div><div class="tax-title">Renta ${year}</div><div class="tax-sub">Detalle calculado desde ingresos</div></div><div class="rval ${result<0?'tax-negative':''}">${fmt(result)}</div></div><div class="tax-grid"><div class="tax-cell"><span>Base anual</span><strong>${fmt(base)}</strong></div><div class="tax-cell"><span>Imp. anual calc.</span><strong>${fmt(tax)}</strong></div><div class="tax-cell"><span>Imp. mensual</span><strong>${fmt(monthlyTax)}</strong></div><div class="tax-cell"><span>Pagos provisionales</span><strong>${fmt(ppm)}</strong></div></div></div>`+
    (incomes.length?incomes.sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(x=>`<div class="tax-card"><div class="tax-head"><div><div class="tax-title">${x.description||x.type}</div><div class="tax-sub">${x.date} · año renta ${x.taxYear||yearOf(x.date)}</div></div><div class="rval">${fmt(x.net||x.amount)}</div></div><div class="tax-grid"><div class="tax-cell"><span>Base / bruto</span><strong>${fmt(x.taxable||x.gross||0)}</strong></div><div class="tax-cell"><span>Impuesto mensual</span><strong>${fmt(x.tax||0)}</strong></div><div class="tax-cell"><span>Pago provisional</span><strong>${fmt(x.ppm||x.provisional||x.pagoProvisional||0)}</strong></div><div class="tax-cell"><span>Imp. anual calculado</span><strong>${fmt(annualTax(x.taxable||x.gross||0,(db.settings&&db.settings.utmValue)||69400))}</strong></div></div></div>`).join(''):'<div class="empty">Sin ingresos para este año</div>');
  }
  function bindTaxOpen(){const chip=document.querySelector('[data-more="tax"]');if(chip&&!chip.dataset.taxBound){chip.dataset.taxBound='1';chip.addEventListener('click',()=>setTimeout(()=>renderTaxes(ensure(load())),80))}}
  function apply(){style();let db=demoMovements(ensure(load()));save(db);bindWalletCard();renderWalletDetails(db);colorExpenses();recipientField();bindInsuranceRecipient();renderInsuranceRecipients(db);updateRecipientSummary(db);renderTaxes(db);bindTaxOpen()}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,500));window.addEventListener('load',()=>setTimeout(apply,700));document.addEventListener('change',e=>{if(e.target&&['year','month','insuranceRecipient'].includes(e.target.id))setTimeout(apply,150)},true);new MutationObserver(()=>{clearTimeout(window.__stage4Timer);window.__stage4Timer=setTimeout(apply,300)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,2500);
})();
