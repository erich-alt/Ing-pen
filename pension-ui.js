(function(){
  function byId(id){return document.getElementById(id);}
  function group(id){var e=byId(id); return e ? e.closest('.form-group') : null;}
  function show(id,on){var g=group(id); if(g) g.style.display = on ? '' : 'none';}
  function setLabel(id,txt){var g=group(id); var l=g&&g.querySelector('label'); if(l) l.textContent=txt;}
  function today(){var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function isFoodPension(){var t=byId('entryType'); return !!t && t.value==='pension';}
  function cleanForFoodPension(){
    if(!isFoodPension()) return;
    ['entryGross','entryNet','entryAfp','entryTax','entryHealth','entryAfc','entryTaxable','entryTaxYear'].forEach(function(id){var e=byId(id); if(e) e.value='';});
    var desc=byId('entryDesc'); if(desc) desc.value='Pension alimenticia';
    var date=byId('entryDate'); if(date && !date.value) date.value=today();
  }
  function note(){
    var card=byId('saveEntryBtn') && byId('saveEntryBtn').closest('.card'); if(!card) return null;
    var n=byId('foodPensionNote');
    if(!n){n=document.createElement('div'); n.id='foodPensionNote'; n.className='note'; n.textContent='Para pension alimenticia registra el monto pagado. La fecha sirve para asociarlo al sueldo liquido del mismo mes.'; var row=byId('saveEntryBtn').closest('.button-row'); card.insertBefore(n,row);}
    return n;
  }
  function apply(){
    var t=byId('entryType'); if(!t) return;
    Array.from(t.options).forEach(function(o){if(o.value==='pension') o.textContent='Pension alimenticia';});
    var on=isFoodPension();
    var n=note(); if(n) n.style.display=on?'':'none';
    show('entryDate',true); show('entryPensionPayment',true);
    setLabel('entryPensionPayment',on?'Monto pension alimenticia pagada':'Pension pagada');
    ['entryDesc','entryGross','entryNet','entryAfp','entryTax','entryHealth','entryAfc','entryTaxable','entryTaxYear'].forEach(function(id){show(id,!on);});
    if(on) cleanForFoodPension();
  }
  function bind(){
    var t=byId('entryType'); if(t && !t.dataset.foodPensionBound){t.dataset.foodPensionBound='1'; t.addEventListener('change',apply);}
    var s=byId('saveEntryBtn'); if(s && !s.dataset.foodPensionBound){s.dataset.foodPensionBound='1'; s.addEventListener('click',cleanForFoodPension,true);}
    apply();
  }
  document.addEventListener('DOMContentLoaded',bind); window.addEventListener('load',bind);
  new MutationObserver(function(){clearTimeout(window.foodPensionTimer); window.foodPensionTimer=setTimeout(bind,120);}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(bind,80);
})();
