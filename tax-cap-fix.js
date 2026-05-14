(function(){
  const VERSION='tax-cap-fix-2026-05-14-1';
  const OFFICIAL_F22={
    2024:{base:61200890,annualTax:5080343,retained:5078256,balance:2087,totalPaid:2125,file:'Declaración de Renta 2025.pdf'},
    2025:{base:66064422,annualTax:5898443,retained:6056557,refund:158114,file:'F22Compacto_16097178-9_2026_800723126.pdf'}
  };
  const TAX_TABLE=[
    {from:0,to:13.5,rate:0,rebate:0},
    {from:13.5,to:30,rate:0.04,rebate:0.54},
    {from:30,to:50,rate:0.08,rebate:1.74},
    {from:50,to:70,rate:0.135,rebate:4.49},
    {from:70,to:90,rate:0.23,rebate:11.14},
    {from:90,to:120,rate:0.304,rebate:17.8},
    {from:120,to:310,rate:0.35,rebate:23.32},
    {from:310,to:Infinity,rate:0.4,rebate:38.82}
  ];
  function $(id){return document.getElementById(id)}
  function parse(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    let s=String(v||'').trim().replace(/\$/g,'').replace(/\s/g,'');
    if(!s)return 0;
    if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g,'').replace(',','.'))||0;
    if(/^[-+]?\d+(\.\d+)?$/.test(s)) return Number(s)||0;
    if(/^[-+]?\d+,\d+$/.test(s)) return Number(s.replace(',','.'))||0;
    return Number(s.replace(/[^0-9.-]/g,''))||0;
  }
  function money(v){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(parse(v)))}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
  function appState(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.entries))return state}catch(e){}return null}
  function yearOf(v){const m=String(v||'').match(/(20\d{2})/);return m?Number(m[1]):null}
  function desc(e){return e.description||e.desc||e.name||e.glosa||''}
  function isBonus(e){const t=norm(e.type),d=norm(desc(e));return t.includes('BONUS')||t.includes('BONO')||d.includes('BONO')}
  function isPension(e){const t=norm(e.type),d=norm(desc(e));return t.includes('PENSION')||d.includes('PENSION')}
  function taxYearFor(e){
    if(isBonus(e)){
      const paid=yearOf(e.paymentDate||e.date||e.fecha||e.period||desc(e));
      if(paid) return paid-1;
    }
    const explicit=Number(e.taxYear||e.anoRenta||e.rentaYear||0);
    if(explicit)return explicit;
    return yearOf(e.paymentDate||e.date||e.fecha||e.period||desc(e));
  }
  function val(e,keys){for(const k of keys){if(e[k]!==undefined&&e[k]!==null&&e[k]!=='')return parse(e[k])}return 0}
  function selectedYear(){return Number(($('taxYearPanel')&&$('taxYearPanel').value)||($('taxYear')&&$('taxYear').value)||new Date().getFullYear())}
  function calcTax(base,utm){
    const uta=Math.max(parse(utm)*12,1);
    const baseUta=parse(base)/uta;
    const bracket=TAX_TABLE.find(r=>baseUta>r.from&&baseUta<=r.to)||TAX_TABLE[0];
    const annualTax=Math.max(0,(baseUta*bracket.rate-bracket.rebate)*uta);
    return {baseUta,uta,annualTax};
  }
  function officialBalance(f){if(f.refund)return -Math.abs(parse(f.refund)); if(f.totalPaid)return Math.abs(parse(f.totalPaid)); return parse(f.balance)}
  function renderOfficial(year,f){
    if($('taxTitle')) $('taxTitle').textContent='Renta '+year+' - declaración '+(year+1)+' (F22 oficial)';
    if($('taxBase')) $('taxBase').textContent=money(f.base);
    if($('taxBonus')) $('taxBonus').textContent='Según F22';
    if($('taxCalc')) $('taxCalc').textContent=money(f.annualTax);
    if($('taxPay')) $('taxPay').textContent=money(officialBalance(f));
    const d=$('taxDetail');
    if(d)d.innerHTML='<div class="list-item"><div><div class="list-label">Dato oficial F22</div><div class="list-sub">'+(f.file||'Declaración de renta')+'</div></div><div class="list-value">Renta '+year+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Base tributable anual</div><div class="list-sub">Tomada de la declaración</div></div><div class="list-value">'+money(f.base)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Impuesto anual</div><div class="list-sub">Valor oficial F22</div></div><div class="list-value">'+money(f.annualTax)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Impuesto retenido / créditos</div><div class="list-sub">Tope real de devolución</div></div><div class="list-value">'+money(f.retained)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Resultado</div><div class="list-sub">Negativo = devolución, positivo = pago</div></div><div class="list-value">'+money(officialBalance(f))+'</div></div>';
  }
  function renderEstimate(){
    const year=selectedYear();
    if(OFFICIAL_F22[year]){renderOfficial(year,OFFICIAL_F22[year]);return;}
    const s=appState(); if(!s)return;
    const entries=(s.entries||[]).filter(e=>!isPension(e)&&taxYearFor(e)===year);
    const settings=s.settings||{};
    const utm=parse(settings.utmValue||($('utmValue')&&$('utmValue').value)||69400);
    const extra=parse(settings.extraCredits||($('extraCredits')&&$('extraCredits').value)||0);
    const base=entries.reduce((a,e)=>a+val(e,['taxable','baseTributable','taxBase','gross','amount']),0);
    const bonus=entries.filter(isBonus).reduce((a,e)=>a+val(e,['taxable','baseTributable','gross','net','liquido','liquid','amount']),0);
    const retained=entries.reduce((a,e)=>a+val(e,['tax','retainedTax','impuesto','taxPaid']),0);
    const res=calcTax(base,utm);
    const maxRecoverable=Math.max(0,retained+extra);
    let balance=res.annualTax-retained-extra;
    if(balance < -maxRecoverable) balance=-maxRecoverable;
    if($('taxTitle')) $('taxTitle').textContent='Renta '+year+' - estimación declaración '+(year+1);
    if($('taxBase')) $('taxBase').textContent=money(base);
    if($('taxBonus')) $('taxBonus').textContent=money(bonus);
    if($('taxCalc')) $('taxCalc').textContent=money(res.annualTax);
    if($('taxPay')) $('taxPay').textContent=money(balance);
    const d=$('taxDetail');
    if(d)d.innerHTML='<div class="list-item"><div><div class="list-label">Base en UTA</div><div class="list-sub">UTA estimada: '+money(res.uta)+'</div></div><div class="list-value">'+res.baseUta.toFixed(2)+' UTA</div></div>'+
    '<div class="list-item"><div><div class="list-label">Impuesto retenido</div><div class="list-sub">Tope de devolución real</div></div><div class="list-value">'+money(retained)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Créditos adicionales</div><div class="list-sub">Editable en supuestos</div></div><div class="list-value">'+money(extra)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Máximo recuperable</div><div class="list-sub">No puede ser mayor al impuesto pagado/retenido</div></div><div class="list-value">'+money(maxRecoverable)+'</div></div>'+
    '<div class="list-item"><div><div class="list-label">Resultado estimado</div><div class="list-sub">Negativo = devolución, positivo = pago</div></div><div class="list-value">'+money(balance)+'</div></div>';
  }
  function apply(){renderEstimate()}
  document.addEventListener('change',e=>{if(e.target&&['taxYear','taxYearPanel','utmValue','extraCredits'].includes(e.target.id))setTimeout(apply,60)},true);
  new MutationObserver(()=>{clearTimeout(window.__taxCapTimer);window.__taxCapTimer=setTimeout(apply,150);}).observe(document.documentElement,{childList:true,subtree:true});
  window.taxCapFixVersion=VERSION; setInterval(apply,1400); setTimeout(apply,200);
})();
