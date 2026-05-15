(function () {
  const KEY = 'finanzas_pro_v2';
  const $ = (id) => document.getElementById(id);
  const fmt = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(Number(v || 0)));
  const today = () => new Date().toISOString().slice(0, 10);
  const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function ensure(db){ ['incomes','expenses','imports'].forEach(k => db[k] = db[k] || []); db.walletSync = db.walletSync || {}; return db; }
  function save(db){ localStorage.setItem(KEY, JSON.stringify(db)); if (typeof render === 'function') setTimeout(render, 50); setTimeout(status, 100); }
  function cat(x){ return String(x || 'Otros').trim() || 'Otros'; }
  function merge(records){
    const db = ensure(load());
    let addedExpenses = 0, addedIncomes = 0, updated = 0;
    records.forEach(r => {
      if (!r.walletId || !r.date || !r.amount) return;
      if (r.recordType === 'income' || Number(r.signedAmount || 0) > 0) {
        const old = db.incomes.find(x => x.walletId === r.walletId);
        const item = { id: old ? old.id : Date.now() + Math.floor(Math.random()*99999), walletId: r.walletId, type: 'extra', date: r.date, taxYear: Number(r.date.slice(0,4)), description: r.description || cat(r.category), gross: r.amount, net: r.amount, tax: 0, taxable: r.amount, category: cat(r.category), labels: r.labels || [], source: 'wallet', updatedAt: r.updatedAt };
        if (old) { Object.assign(old, item); updated++; } else { db.incomes.push(item); addedIncomes++; }
        return;
      }
      const old = db.expenses.find(x => x.walletId === r.walletId);
      const item = { id: old ? old.id : Date.now() + Math.floor(Math.random()*99999), walletId: r.walletId, date: r.date, category: cat(r.category), description: r.description || cat(r.category), amount: r.amount, labels: r.labels || [], accountLabel: r.accountId || '', paymentType: r.paymentType || '', source: 'wallet', updatedAt: r.updatedAt };
      if (old) { Object.assign(old, item); updated++; } else { db.expenses.push(item); addedExpenses++; }
    });
    db.walletSync = { lastSyncAt: new Date().toISOString(), lastCount: records.length, addedExpenses, addedIncomes, updated };
    db.imports.push({ id: Date.now(), date: today(), type: 'wallet-sync', count: records.length, total: records.reduce((s,x)=>s+Number(x.amount||0),0) });
    save(db);
    return db.walletSync;
  }
  function style(){ if($('stage9Style')) return; const s=document.createElement('style'); s.id='stage9Style'; s.textContent = `.wallet-sync-card{background:#fff;border:1px solid #dfe8e3;border-radius:8px;padding:14px;margin-bottom:14px;box-shadow:0 8px 20px rgba(19,34,31,.06)}.wallet-sync-card h2{font-size:17px;margin:0 0 10px}.wallet-sync-grid,.wallet-sync-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wallet-sync-card input{width:100%;min-height:48px;border:1px solid #dfe8e3;border-radius:8px;background:#fbfcfb;font:inherit;font-size:16px;padding:10px}.wallet-sync-note{font-size:12px;line-height:1.35;color:#687672;margin-top:8px}.wallet-sync-status{margin-top:10px;background:#f1faf7;border:1px solid #c7e2d9;border-radius:8px;padding:10px;font-size:13px;color:#0b5f59;font-weight:850}.wallet-sync-status.warn{background:#fff7ed;border-color:#fed7aa;color:#92400e}@media(max-width:390px){.wallet-sync-grid,.wallet-sync-actions{grid-template-columns:1fr}}`; document.head.appendChild(s); }
  function importPane(){
    const more=$('scr-more'), chips=more&&more.querySelector('.chips'); if(!more||!chips) return null;
    let chip=document.querySelector('[data-more="import"]');
    if(!chip){ chip=document.createElement('button'); chip.className='chip'; chip.dataset.more='import'; chip.textContent='Importar'; chips.appendChild(chip); }
    let pane=$('more-import');
    if(!pane){ pane=document.createElement('div'); pane.id='more-import'; pane.className='more-tab hidden'; more.appendChild(pane); }
    if(!chip.dataset.walletBound){ chip.dataset.walletBound='1'; chip.onclick=()=>{ document.querySelectorAll('[data-more]').forEach(x=>x.classList.remove('active')); chip.classList.add('active'); document.querySelectorAll('.more-tab').forEach(x=>x.classList.add('hidden')); pane.classList.remove('hidden'); }; }
    return pane;
  }
  function ui(){ const pane=importPane(); if(!pane || $('walletSyncCard')) return; const card=document.createElement('div'); card.id='walletSyncCard'; card.className='wallet-sync-card'; card.innerHTML=`<h2>Sincronizar Wallet</h2><div class="wallet-sync-grid"><div><label>Desde</label><input id="walletSyncFrom" type="date"></div><div><label>Hasta</label><input id="walletSyncTo" type="date"></div></div><div class="wallet-sync-actions"><button class="btn" id="walletSyncNow">Sincronizar ahora</button><button class="btn secondary" id="walletSyncRecent">Ultimos 12 meses</button><button class="btn secondary" id="walletSyncAll">Toda la historia</button></div><div class="wallet-sync-note">El token queda guardado solo como secreto del servidor. No se guarda en el HTML ni en el iPhone.</div><div id="walletSyncStatus" class="wallet-sync-status">Listo para sincronizar.</div>`; pane.insertBefore(card,pane.firstChild); $('walletSyncFrom').value=monthsAgo(12); $('walletSyncTo').value=today(); $('walletSyncNow').onclick=()=>sync($('walletSyncFrom').value,$('walletSyncTo').value); $('walletSyncRecent').onclick=()=>{ $('walletSyncFrom').value=monthsAgo(12); $('walletSyncTo').value=today(); sync($('walletSyncFrom').value,$('walletSyncTo').value); }; $('walletSyncAll').onclick=()=>sync('', '', true); status(); }
  function status(){ const el=$('walletSyncStatus'); if(!el) return; const db=ensure(load()); if(!db.walletSync.lastSyncAt){ el.textContent='Listo para sincronizar.'; el.classList.remove('warn'); return; } el.textContent=`Ultima sincronizacion: ${new Date(db.walletSync.lastSyncAt).toLocaleString('es-CL')}. Gastos nuevos ${db.walletSync.addedExpenses || 0}, ingresos nuevos ${db.walletSync.addedIncomes || 0}, actualizados ${db.walletSync.updated || 0}.`; el.classList.remove('warn'); }
  async function sync(from,to,all){ const el=$('walletSyncStatus'); if(el){ el.textContent='Sincronizando Wallet...'; el.classList.remove('warn'); } try{ const p=new URLSearchParams(); if(all){ p.set('all','1'); p.set('start','2010-01-01'); p.set('max','50000'); } else { if(from) p.set('from',from); if(to) p.set('to',to); p.set('max','3000'); } const res=await fetch(`/api/wallet/sync?${p.toString()}`,{cache:'no-store'}); const body=await res.json(); if(!res.ok || !body.ok) throw new Error(body.error || 'No se pudo sincronizar Wallet'); const stats=merge(body.records || []); if(el) el.textContent=`Sincronizacion lista: ${body.count} registros leidos. Gastos nuevos ${stats.addedExpenses}, ingresos nuevos ${stats.addedIncomes}, actualizados ${stats.updated}. Total procesado ${fmt((body.records||[]).reduce((s,x)=>s+Number(x.amount||0),0))}.`; } catch(e){ if(el){ el.textContent=`No pude sincronizar: ${e.message}`; el.classList.add('warn'); } } }
  function auto(){ const db=ensure(load()), last=db.walletSync.lastSyncAt ? new Date(db.walletSync.lastSyncAt).getTime() : 0; if(!last || Date.now()-last > 6*60*60*1000) sync(monthsAgo(12), today()); }
  function apply(){ style(); ui(); }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,1200)); window.addEventListener('load',()=>{ setTimeout(apply,1500); setTimeout(auto,2500); }); new MutationObserver(()=>{ clearTimeout(window.__stage9Timer); window.__stage9Timer=setTimeout(apply,400); }).observe(document.documentElement,{childList:true,subtree:true});
})();
