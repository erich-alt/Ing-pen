(function(){
  const KEY='finanzas_pro_v2';
  const $=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));
  const parse=v=>{if(typeof v==='number')return v;let s=String(v||'').trim().replace(/\$/g,'').replace(/\s/g,'');if(!s)return 0;if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return Number(s.replace(/\./g,'').replace(',','.'))||0;if(/^[-+]?\d+(\.\d+)?$/.test(s))return Number(s)||0;if(/^[-+]?\d+,\d+$/.test(s))return Number(s.replace(',','.'))||0;return Number(s.replace(/[^0-9.-]/g,''))||0};
  const today=()=>new Date().toISOString().slice(0,10);
  const uid=()=>Date.now()+Math.floor(Math.random()*999);
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));setTimeout(apply,60)}
  function ensure(db){
    db.accounts=db.accounts||[];db.cards=db.cards||[];
    if((db.settings&&db.settings.demo)&&db.accounts.length===0&&db.cards.length===0){
      db.accounts.push(
        {id:901,name:'Cuenta corriente Itaú',type:'Corriente',balance:2450000,currency:'CLP'},
        {id:902,name:'Cuenta ahorro / emergencia',type:'Ahorro',balance:1250000,currency:'CLP'},
        {id:903,name:'Efectivo / caja chica',type:'Efectivo',balance:180000,currency:'CLP'}
      );
      db.cards.push(
        {id:951,name:'Itaú Legend',limit:1000000,debt:420000,dueDate:'2026-06-05',cutDate:'2026-05-25',currency:'CLP'},
        {id:952,name:'Tarjeta supermercado',limit:600000,debt:135000,dueDate:'2026-06-10',cutDate:'2026-05-28',currency:'CLP'}
      );
      localStorage.setItem(KEY,JSON.stringify(db));
    }
    return db;
  }
  function injectStyle(){
    if($('stage3Style'))return;
    const s=document.createElement('style');s.id='stage3Style';s.textContent=`
      .wallet-card{background:linear-gradient(145deg,#0f766e,#0b5f59);color:white;border-radius:22px;padding:16px;box-shadow:0 10px 26px rgba(15,118,110,.22);margin-bottom:14px}.wallet-card .top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.wallet-card .label{font-size:12px;opacity:.82;font-weight:850;text-transform:uppercase;letter-spacing:.4px}.wallet-card .amount{font-size:32px;font-weight:950;line-height:1;margin-top:8px}.wallet-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.wallet-mini{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:12px}.wallet-mini strong{display:block;font-size:20px;margin-top:4px}.account-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:900;background:#e6f2ee;color:#0b5f59;border-radius:999px;padding:5px 8px}.wallet-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.card-progress{height:10px;background:#edf3f0;border-radius:999px;overflow:hidden;margin-top:8px}.card-progress span{display:block;height:100%;background:#be123c;border-radius:999px}.negative{color:#be123c!important}.positive{color:#0b5f59!important}
    `;document.head.appendChild(s);
  }
  function totals(db){
    const accounts=(db.accounts||[]).reduce((a,x)=>a+Number(x.balance||0),0);
    const cardDebt=(db.cards||[]).reduce((a,x)=>a+Number(x.debt||0),0);
    const limits=(db.cards||[]).reduce((a,x)=>a+Number(x.limit||0),0);
    return{accounts,cardDebt,limits,global:accounts-cardDebt,util:limits?cardDebt/limits*100:0};
  }
  function row(title,sub,val,tag){return `<div class="row"><div><div class="rtitle">${title}</div><div class="rsub">${sub||''}</div>${tag||''}</div><div class="rval">${val||''}</div></div>`}
  function renderDashboard(db){
    const dash=$('scr-dashboard');if(!dash)return;let card=$('walletGlobalCard');if(!card){card=document.createElement('div');card.id='walletGlobalCard';card.className='wallet-card';const after=dash.querySelector('.card.flat');dash.insertBefore(card,after?after.nextSibling:dash.firstChild)}
    const t=totals(db);
    card.innerHTML=`<div class="top"><div><div class="label">Saldo global</div><div class="amount ${t.global<0?'negative':''}">${fmt(t.global)}</div></div><span class="account-pill">Cuentas - tarjetas</span></div><div class="wallet-grid"><div class="wallet-mini"><div class="label">Cuentas</div><strong>${fmt(t.accounts)}</strong></div><div class="wallet-mini"><div class="label">Deuda TC</div><strong>${fmt(t.cardDebt)}</strong></div></div>`;
  }
  function ensureMoreTab(){
    const chips=document.querySelector('#scr-more .chips');if(!chips||document.querySelector('[data-more="wallet"]'))return;
    const b=document.createElement('button');b.className='chip';b.dataset.more='wallet';b.textContent='Cuentas';chips.insertBefore(b,chips.firstChild);
    const sec=document.createElement('div');sec.id='more-wallet';sec.className='more-tab hidden';sec.innerHTML=`
      <div class="card"><h2>Cuentas y tarjetas</h2><div class="grid2"><div class="metric"><div class="mlabel">Saldo cuentas</div><div class="mvalue" id="walletAccountsKpi">$0</div></div><div class="metric danger"><div class="mlabel">Deuda tarjetas</div><div class="mvalue" id="walletCardsKpi">$0</div></div></div></div>
      <div class="card"><h2>Mis cuentas</h2><div id="accountsList"></div></div>
      <div class="card"><h2>Mis tarjetas</h2><div id="cardsList"></div></div>
      <div class="card"><h2>Nueva cuenta</h2><div class="form"><div><label>Nombre cuenta</label><input id="accountName" placeholder="Ej. Cuenta corriente Itaú"></div><div class="wallet-form-grid"><div><label>Tipo</label><select id="accountType"><option>Corriente</option><option>Ahorro</option><option>Vista</option><option>Efectivo</option><option>Inversión</option></select></div><div><label>Saldo actual</label><input id="accountBalance" inputmode="numeric"></div></div><button class="btn" id="saveAccount">Guardar cuenta</button></div></div>
      <div class="card"><h2>Nueva tarjeta de crédito</h2><div class="form"><div><label>Nombre tarjeta</label><input id="cardName" placeholder="Ej. Itaú Legend"></div><div class="wallet-form-grid"><div><label>Cupo</label><input id="cardLimit" inputmode="numeric"></div><div><label>Deuda actual</label><input id="cardDebt" inputmode="numeric"></div></div><div class="wallet-form-grid"><div><label>Fecha pago</label><input id="cardDue" type="date"></div><div><label>Fecha corte</label><input id="cardCut" type="date"></div></div><button class="btn" id="saveCard">Guardar tarjeta</button></div></div>`;
    document.querySelector('#scr-more main');
    const more=$('scr-more');more.appendChild(sec);
    document.querySelectorAll('[data-more]').forEach(x=>{x.onclick=()=>{document.querySelectorAll('[data-more]').forEach(y=>y.classList.remove('active'));x.classList.add('active');document.querySelectorAll('.more-tab').forEach(y=>y.classList.add('hidden'));$('more-'+x.dataset.more).classList.remove('hidden');}});
  }
  function renderWalletTab(db){
    if(!$('more-wallet'))return;const t=totals(db);$('walletAccountsKpi').textContent=fmt(t.accounts);$('walletCardsKpi').textContent=fmt(t.cardDebt);
    $('accountsList').innerHTML=(db.accounts||[]).length?(db.accounts||[]).map(x=>row(x.name,x.type,fmt(x.balance),'<span class="account-pill">'+(x.currency||'CLP')+'</span>')).join(''):'<div class="empty">Sin cuentas creadas</div>';
    $('cardsList').innerHTML=(db.cards||[]).length?(db.cards||[]).map(x=>{const u=x.limit?Math.min(100,Number(x.debt||0)/Number(x.limit||1)*100):0;return row(x.name,`Pago ${x.dueDate||'-'} · Corte ${x.cutDate||'-'}<div class="card-progress"><span style="width:${u}%"></span></div>`,fmt(x.debt),'<span class="account-pill">Uso '+u.toFixed(0)+'%</span>')}).join(''):'<div class="empty">Sin tarjetas creadas</div>';
  }
  function bindWallet(){
    if($('saveAccount')&&!$('saveAccount').dataset.bound){$('saveAccount').dataset.bound='1';$('saveAccount').onclick=()=>{const db=ensure(load());db.accounts.push({id:uid(),name:$('accountName').value||'Cuenta',type:$('accountType').value,balance:parse($('accountBalance').value),currency:'CLP'});save(db)}}
    if($('saveCard')&&!$('saveCard').dataset.bound){$('saveCard').dataset.bound='1';$('saveCard').onclick=()=>{const db=ensure(load());db.cards.push({id:uid(),name:$('cardName').value||'Tarjeta',limit:parse($('cardLimit').value),debt:parse($('cardDebt').value),dueDate:$('cardDue').value,cutDate:$('cardCut').value,currency:'CLP'});save(db)}}
  }
  function apply(){injectStyle();const db=ensure(load());renderDashboard(db);ensureMoreTab();renderWalletTab(db);bindWallet();}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,250));window.addEventListener('load',()=>setTimeout(apply,450));new MutationObserver(()=>{clearTimeout(window.__stage3WalletTimer);window.__stage3WalletTimer=setTimeout(apply,220)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,2500);
})();
