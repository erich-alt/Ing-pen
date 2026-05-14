(function(){
  const KEY='finanzas_modulo_v2';
  function money(n){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));}
  function month(){return new Date().toISOString().slice(0,7);}
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function totals(){const s=read();const acc=s.accounts||[];const tx=s.tx||[];const plans=s.plans||[];const cash=acc.filter(a=>a.type!=='credito').reduce((x,a)=>x+Number(a.balance||0),0);const card=acc.filter(a=>a.type==='credito').reduce((x,a)=>x+Number(a.used||0),0);const out=tx.filter(t=>String(t.date).slice(0,7)===month()&&t.type==='gasto').reduce((x,t)=>x+Number(t.amount||0),0);const inc=tx.filter(t=>String(t.date).slice(0,7)===month()&&t.type==='ingreso').reduce((x,t)=>x+Number(t.amount||0),0);const pending=plans.reduce((x,p)=>x+Number(p.amount||0),0);return{cash,card,out,inc,pending,net:inc-out};}
  function style(){
    if(document.getElementById('walletPolishStyles'))return;
    const css=`
      #finance{background:#f4f6fb;padding-bottom:18px}.wallet-top{background:linear-gradient(135deg,#0f766e,#123b36);border-radius:26px;padding:18px;color:#fff;box-shadow:0 16px 36px rgba(15,118,110,.24);margin-bottom:14px;position:relative;overflow:hidden}.wallet-top:after{content:'';position:absolute;right:-42px;top:-42px;width:150px;height:150px;border-radius:999px;background:rgba(255,255,255,.1)}.wallet-label{font-size:12px;opacity:.8;font-weight:850;text-transform:uppercase}.wallet-balance{font-size:32px;line-height:1;font-weight:950;margin:9px 0 14px;letter-spacing:-.04em}.wallet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wallet-mini{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:11px}.wallet-mini b{display:block;font-size:12px;opacity:.85}.wallet-mini span{display:block;font-size:16px;font-weight:900;margin-top:5px}.wallet-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.wallet-action{border:0;background:#fff;border-radius:18px;min-height:74px;box-shadow:0 10px 28px rgba(24,34,31,.08);color:#172033;font-weight:850;font-size:11px;padding:8px}.wallet-action span{display:block;font-size:24px;margin-bottom:4px}#finance .fin-hero{display:none!important}#finance .fin-chip{border-radius:999px!important;padding:10px 13px!important}#finance .fin-chip.active{background:#0f766e!important;color:#fff!important;border-color:#0f766e!important}#finance .fin-card{border-radius:22px!important;background:#fff!important}#finance .fin-metric{border-radius:18px!important;background:#f8faf9!important}.wallet-budget{display:grid;gap:8px;margin-bottom:12px}.wallet-budget-row{background:#fff;border:1px solid #e5e9f2;border-radius:18px;padding:12px;box-shadow:0 8px 20px rgba(24,34,31,.06)}.wallet-budget-head{display:flex;justify-content:space-between;gap:8px;font-weight:850}.wallet-budget-sub{display:flex;justify-content:space-between;color:#66736f;font-size:12px;margin-top:4px}.wallet-bar{height:8px;background:#edf1ee;border-radius:999px;margin-top:8px;overflow:hidden}.wallet-bar span{display:block;height:100%;background:#0f766e}.wallet-bar.over span{background:#be123c}
    `;
    const st=document.createElement('style');st.id='walletPolishStyles';st.textContent=css;document.head.appendChild(st);
  }
  function catName(id){const names={alimentacion:'🛒 Alimentación',hogar:'🏠 Hogar',auto:'🚗 Auto',familia:'👨‍👩‍👧‍👦 Familia',pension:'👧 Pensión',regalos:'🎁 Regalos',deuda:'🏦 Deudas',otros:'📦 Otros'};return names[id]||names.otros;}
  function budgetRows(){const s=read();const tx=s.tx||[];const cats=['alimentacion','hogar','auto','pension'];return cats.map(c=>{const spent=tx.filter(t=>String(t.date).slice(0,7)===month()&&t.type==='gasto'&&String(t.catId||'otros')===c).reduce((x,t)=>x+Number(t.amount||0),0);return `<div class="wallet-budget-row"><div class="wallet-budget-head"><span>${catName(c)}</span><span>${money(spent)}</span></div><div class="wallet-budget-sub"><span>Gasto del mes</span><span>Control</span></div><div class="wallet-bar"><span style="width:${Math.min(100,spent/500000*100)}%"></span></div></div>`;}).join('');}
  function enhance(){
    style();
    const f=document.getElementById('finance');
    if(!f||!f.classList.contains('active'))return;
    if(!f.querySelector('.wallet-top')){
      const t=totals();
      const top=document.createElement('div');
      top.innerHTML=`<div class="wallet-top"><div class="wallet-label">Disponible estimado</div><div class="wallet-balance">${money(t.cash)}</div><div class="wallet-row"><div class="wallet-mini"><b>Gasto mes</b><span>${money(t.out)}</span></div><div class="wallet-mini"><b>Resultado mes</b><span>${money(t.net)}</span></div></div></div><div class="wallet-actions"><button class="wallet-action" data-wallet-go="movimientos"><span>＋</span>Movimiento</button><button class="wallet-action" data-wallet-go="cuentas"><span>🏦</span>Cuentas</button><button class="wallet-action" data-wallet-go="planificar"><span>📅</span>Planificar</button><button class="wallet-action" data-wallet-go="autos"><span>🚗</span>Autos</button></div>`;
      const first=f.firstElementChild;
      f.insertBefore(top,first);
      top.querySelectorAll('[data-wallet-go]').forEach(b=>b.onclick=()=>{const target=b.dataset.walletGo;const chip=f.querySelector('[data-fin-sub="'+target+'"]');if(chip)chip.click();});
    }
    const body=f.querySelector('#finBody');
    if(body&&!f.querySelector('.wallet-budget')&&f.querySelector('[data-fin-sub="resumen"].active')){
      const box=document.createElement('div');box.className='wallet-budget';box.innerHTML=budgetRows();
      const card=document.createElement('div');card.className='fin-card';card.innerHTML='<h2>Budget rápido</h2>';card.appendChild(box);
      body.insertBefore(card,body.firstElementChild&&body.firstElementChild.nextSibling?body.firstElementChild.nextSibling:body.firstElementChild);
    }
  }
  document.addEventListener('click',()=>setTimeout(enhance,80));
  setInterval(enhance,900);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();