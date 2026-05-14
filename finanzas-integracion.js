(function(){
  const KEY='finanzas_modulo_v1';
  const state=load();
  let sub='resumen';

  function load(){
    try{return Object.assign(base(),JSON.parse(localStorage.getItem(KEY)||'{}'));}
    catch(e){return base();}
  }
  function base(){
    return {
      accounts:[
        {id:1,name:'Cuenta Corriente',type:'corriente',balance:0},
        {id:2,name:'Cuenta Ahorro',type:'ahorro',balance:0},
        {id:3,name:'Tarjeta Crédito',type:'credito',used:0,limit:1000000}
      ],
      tx:[],
      debts:[]
    };
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));renderFinance();}
  function money(n){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));}
  function num(v){let s=String(v||'').replace(/\$|\s|clp/gi,'');if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(',')&&!s.includes('.'))s=s.replace(',','.');else if((s.match(/\./g)||[]).length>0)s=s.replace(/\./g,'');return Number(s.replace(/[^0-9.-]/g,''))||0;}
  function esc(s){return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
  function today(){return new Date().toISOString().slice(0,10);}
  function month(){return today().slice(0,7);}
  function accName(id){return (state.accounts.find(a=>String(a.id)===String(id))||{}).name||'Cuenta';}
  function accOptions(){return state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');}
  function adjustAccount(id,type,amount){
    const a=state.accounts.find(x=>String(x.id)===String(id));
    if(!a)return;
    if(a.type==='credito')a.used=Math.max(0,Number(a.used||0)+(type==='gasto'?amount:-amount));
    else a.balance=Number(a.balance||0)+(type==='ingreso'?amount:-amount);
  }

  function addStyles(){
    if(document.getElementById('finanzasStyles'))return;
    const css=`
      #finance .fin-chips{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px}.fin-chip{border:1px solid var(--line,#dfe7e2);background:#fff;color:var(--muted,#66736f);border-radius:999px;padding:9px 12px;font-size:12px;font-weight:800;white-space:nowrap}.fin-chip.active{background:#e6f2ee;color:#115e59;border-color:#c7e2d9}.fin-card{background:var(--surface,#fff);border:1px solid var(--line,#dfe7e2);border-radius:8px;box-shadow:var(--shadow,0 10px 28px rgba(24,34,31,.08));padding:14px;margin-bottom:12px}.fin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fin-metric{background:#eef7f4;border:1px solid #cfe6df;border-radius:8px;padding:12px;min-height:86px}.fin-label{color:#66736f;font-size:11px;font-weight:800;text-transform:uppercase}.fin-value{margin-top:10px;color:#115e59;font-size:22px;font-weight:900;line-height:1}.fin-red{color:#be123c}.fin-amber{color:#b45309}.fin-list{display:grid;gap:8px}.fin-item{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px;border-bottom:1px solid #edf1ee}.fin-item:last-child{border-bottom:0}.fin-name{font-weight:800}.fin-meta{margin-top:3px;color:#66736f;font-size:12px}.fin-amt{font-weight:900;text-align:right}.fin-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fin-full{grid-column:1/-1}.fin-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.fin-note{background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #b45309;border-radius:8px;padding:11px;margin-bottom:12px;color:#7c2d12;font-size:13px;line-height:1.45}.fin-danger{color:#be123c;background:#fff1f2;border:1px solid #fecdd3}.fin-secondary{color:#115e59;background:#e6f2ee;border:1px solid #c7e2d9}
      @media(min-width:760px){.fin-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;
    const st=document.createElement('style');st.id='finanzasStyles';st.textContent=css;document.head.appendChild(st);
  }

  function init(){
    const main=document.querySelector('main');
    const topTabs=document.querySelector('.tabs');
    if(!main||!topTabs){setTimeout(init,250);return;}
    addStyles();
    if(!document.getElementById('finance')){
      const section=document.createElement('section');
      section.id='finance';
      section.className='section';
      main.appendChild(section);
    }
    if(!document.querySelector('[data-tab="finance"]')){
      const b=document.createElement('button');
      b.className='tab';
      b.dataset.tab='finance';
      b.textContent='Finanzas';
      b.addEventListener('click',activateFinance);
      topTabs.appendChild(b);
      const bottom=document.querySelector('.bottom-nav');
      if(bottom){
        const n=document.createElement('button');
        n.className='nav-btn';
        n.dataset.tab='finance';
        n.textContent='Finanzas';
        n.addEventListener('click',activateFinance);
        bottom.appendChild(n);
      }
      document.querySelectorAll('.tab:not([data-tab="finance"]),.nav-btn:not([data-tab="finance"])').forEach(x=>x.addEventListener('click',hideFinance));
    }
    renderFinance();
  }

  function hideFinance(){
    const f=document.getElementById('finance');
    if(f)f.classList.remove('active');
    document.querySelectorAll('[data-tab="finance"]').forEach(b=>b.classList.remove('active'));
  }
  function activateFinance(){
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    const f=document.getElementById('finance');
    if(f)f.classList.add('active');
    document.querySelectorAll('.tab,.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('[data-tab="finance"]').forEach(b=>b.classList.add('active'));
    renderFinance();
  }

  function totals(){
    const cash=state.accounts.filter(a=>a.type!=='credito').reduce((s,a)=>s+Number(a.balance||0),0);
    const card=state.accounts.filter(a=>a.type==='credito').reduce((s,a)=>s+Number(a.used||0),0);
    const out=state.tx.filter(t=>String(t.date).slice(0,7)===month()&&t.type==='gasto').reduce((s,t)=>s+Number(t.amount||0),0);
    const debt=state.debts.reduce((s,d)=>s+Number(d.balance||0),0);
    return {cash,card,out,debt};
  }

  function renderFinance(){
    const el=document.getElementById('finance');
    if(!el)return;
    const chips=['resumen','movimientos','cuentas','deudas','datos'].map(x=>`<button class="fin-chip ${sub===x?'active':''}" data-fin-sub="${x}">${label(x)}</button>`).join('');
    el.innerHTML=`<div class="fin-note"><b>Finanzas integrado</b><br>La carga de Excel/PDF sigue en la pestaña Cargar original. Este módulo agrega cuentas, movimientos y deudas sin tocar el importador que ya funcionaba.</div><div class="fin-chips">${chips}</div><div id="finBody"></div>`;
    el.querySelectorAll('[data-fin-sub]').forEach(b=>b.onclick=()=>{sub=b.dataset.finSub;renderFinance();});
    const body=document.getElementById('finBody');
    if(sub==='resumen')body.innerHTML=renderResumen();
    if(sub==='movimientos')body.innerHTML=renderMovimientos();
    if(sub==='cuentas')body.innerHTML=renderCuentas();
    if(sub==='deudas')body.innerHTML=renderDeudas();
    if(sub==='datos')body.innerHTML=renderDatos();
  }
  function label(x){return {resumen:'Resumen',movimientos:'Movimientos',cuentas:'Cuentas',deudas:'Deudas',datos:'Datos'}[x]||x;}
  function renderResumen(){const t=totals();return `<div class="fin-grid"><div class="fin-metric"><div class="fin-label">Saldo cuentas</div><div class="fin-value">${money(t.cash)}</div></div><div class="fin-metric"><div class="fin-label">Tarjetas</div><div class="fin-value fin-red">${money(t.card)}</div></div><div class="fin-metric"><div class="fin-label">Gasto mes</div><div class="fin-value fin-amber">${money(t.out)}</div></div><div class="fin-metric"><div class="fin-label">Deudas</div><div class="fin-value fin-red">${money(t.debt)}</div></div></div><div class="fin-card"><b>Últimos movimientos</b><div class="fin-list">${state.tx.length?state.tx.slice().reverse().slice(0,6).map(txItem).join(''):'<p class="empty">Sin movimientos.</p>'}</div></div>`;}
  function txItem(x){return `<div class="fin-item"><div><div class="fin-name">${esc(x.desc)}</div><div class="fin-meta">${esc(x.date)} · ${esc(accName(x.accountId))}</div></div><div class="fin-amt ${x.type==='ingreso'?'':'fin-red'}">${x.type==='ingreso'?'+':'-'}${money(x.amount)}</div></div>`;}
  function renderMovimientos(){return `<div class="fin-card"><b>Nuevo movimiento</b><div class="fin-form" style="margin-top:10px"><div><label>Tipo</label><select id="finType"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div><div><label>Fecha</label><input id="finDate" type="date" value="${today()}"></div><div class="fin-full"><label>Descripción</label><input id="finDesc" placeholder="Supermercado, bencina, dividendo..."></div><div><label>Monto</label><input id="finAmount" inputmode="numeric"></div><div><label>Cuenta</label><select id="finAcc">${accOptions()}</select></div></div><button class="btn" style="margin-top:10px" id="finAddTx">Guardar movimiento</button></div><div class="fin-card"><b>Movimientos</b><div class="fin-list">${state.tx.length?state.tx.slice().reverse().map(txItem).join(''):'<p class="empty">Sin movimientos.</p>'}</div></div>`;}
  function renderCuentas(){return `<div class="fin-card"><b>Nueva cuenta</b><div class="fin-form" style="margin-top:10px"><div class="fin-full"><label>Nombre</label><input id="finAccName" placeholder="Banco, efectivo, tarjeta"></div><div><label>Tipo</label><select id="finAccType"><option value="corriente">Corriente</option><option value="ahorro">Ahorro</option><option value="efectivo">Efectivo</option><option value="credito">Crédito</option></select></div><div><label>Saldo / usado</label><input id="finAccBal" inputmode="numeric"></div></div><button class="btn" style="margin-top:10px" id="finAddAcc">Agregar cuenta</button></div><div class="fin-card"><b>Cuentas</b><div class="fin-list">${state.accounts.map(a=>`<div class="fin-item"><div><div class="fin-name">${esc(a.name)}</div><div class="fin-meta">${esc(a.type)}</div></div><div class="fin-amt ${a.type==='credito'?'fin-red':''}">${money(a.type==='credito'?a.used:a.balance)}</div></div>`).join('')}</div></div>`;}
  function renderDeudas(){return `<div class="fin-card"><b>Nueva deuda</b><div class="fin-form" style="margin-top:10px"><div class="fin-full"><label>Nombre</label><input id="finDebtName"></div><div><label>Saldo</label><input id="finDebtBal" inputmode="numeric"></div><div><label>Cuota</label><input id="finDebtPay" inputmode="numeric"></div></div><button class="btn" style="margin-top:10px" id="finAddDebt">Agregar deuda</button></div><div class="fin-card"><b>Deudas</b><div class="fin-list">${state.debts.length?state.debts.map(d=>`<div class="fin-item"><div><div class="fin-name">${esc(d.name)}</div><div class="fin-meta">Cuota ${money(d.payment)}</div></div><div class="fin-amt fin-red">${money(d.balance)}</div></div>`).join(''):'<p class="empty">Sin deudas.</p>'}</div></div>`;}
  function renderDatos(){return `<div class="fin-card"><b>Datos Finanzas</b><p class="empty">Estos datos quedan en este navegador. El módulo Ingresos/Pensión conserva su propio respaldo original.</p><div class="fin-actions"><button class="btn fin-secondary" id="finExport">Exportar</button><button class="btn fin-danger" id="finReset">Limpiar</button></div></div>`;}

  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='finAddTx'){
      const amount=Math.abs(num(document.getElementById('finAmount').value)); if(!amount)return alert('Ingresa monto');
      const x={id:Date.now(),type:document.getElementById('finType').value,date:document.getElementById('finDate').value,desc:document.getElementById('finDesc').value||'Movimiento',amount,accountId:document.getElementById('finAcc').value};
      state.tx.push(x); adjustAccount(x.accountId,x.type,amount); save();
    }
    if(e.target&&e.target.id==='finAddAcc'){
      const name=document.getElementById('finAccName').value.trim(); if(!name)return alert('Falta nombre');
      const type=document.getElementById('finAccType').value; const val=Math.abs(num(document.getElementById('finAccBal').value));
      state.accounts.push({id:Date.now(),name,type,balance:type==='credito'?0:val,used:type==='credito'?val:0}); save();
    }
    if(e.target&&e.target.id==='finAddDebt'){
      const name=document.getElementById('finDebtName').value.trim(); if(!name)return alert('Falta nombre');
      state.debts.push({id:Date.now(),name,balance:Math.abs(num(document.getElementById('finDebtBal').value)),payment:Math.abs(num(document.getElementById('finDebtPay').value))}); save();
    }
    if(e.target&&e.target.id==='finExport'){
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='finanzas-modulo.json'; a.click(); URL.revokeObjectURL(a.href);
    }
    if(e.target&&e.target.id==='finReset'){
      if(confirm('¿Limpiar datos de Finanzas?')){const fresh=base(); state.accounts=fresh.accounts; state.tx=fresh.tx; state.debts=fresh.debts; save();}
    }
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();