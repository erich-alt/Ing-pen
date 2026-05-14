(function(){
  function byId(id){return document.getElementById(id);}
  function group(id){var e=byId(id); return e ? e.closest('.form-group') : null;}
  function show(id,on){var g=group(id); if(g) g.style.display = on ? '' : 'none';}
  function setLabel(id,txt){var g=group(id); var l=g&&g.querySelector('label'); if(l) l.textContent=txt;}
  function pad(n){return String(n).padStart(2,'0');}
  function today(){var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function parseAmount(v){return Number(String(v||'').replace(/\./g,'').replace(/,/g,'.').replace(/[^0-9.-]/g,''))||0;}
  function isFoodPension(){var t=byId('entryType'); return !!t && t.value==='pension';}
  function toIsoDate(v){
    var s=String(v||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var m=s.match(/^(\d{2})-(\d{2})-(\d{4})$/); if(m) return m[3]+'-'+m[2]+'-'+m[1];
    return today();
  }
  function nextMonthFromDate(v){
    var iso=toIsoDate(v); var y=Number(iso.slice(0,4)); var m=Number(iso.slice(5,7));
    m += 1; if(m>12){m=1; y+=1;}
    return y+'-'+pad(m);
  }
  function monthName(ym){
    var names=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var y=String(ym||'').slice(0,4); var m=Number(String(ym||'').slice(5,7));
    return (names[m-1]||'mes')+' '+y;
  }
  function ensurePensionMonthField(){
    var existing=byId('pensionMonth'); if(existing) return existing;
    var amountGroup=group('entryPensionPayment'); if(!amountGroup||!amountGroup.parentNode) return null;
    var g=document.createElement('div'); g.className='form-group'; g.id='pensionMonthGroup';
    var l=document.createElement('label'); l.setAttribute('for','pensionMonth'); l.textContent='Mes pensión';
    var input=document.createElement('input'); input.type='month'; input.id='pensionMonth'; input.dataset.auto='1';
    g.appendChild(l); g.appendChild(input);
    amountGroup.parentNode.insertBefore(g, amountGroup);
    var pay=byId('entryDate'); if(pay && pay.value) input.value=nextMonthFromDate(pay.value);
    input.addEventListener('change',function(){input.dataset.auto='0';});
    return input;
  }
  function syncMonthFromPayment(){
    var month=ensurePensionMonthField(); var date=byId('entryDate');
    if(month && date && (!month.value || month.dataset.auto==='1')) month.value=nextMonthFromDate(date.value||today());
  }
  function cleanForFoodPension(){
    if(!isFoodPension()) return;
    ['entryGross','entryNet','entryAfp','entryTax','entryHealth','entryAfc','entryTaxable','entryTaxYear'].forEach(function(id){var e=byId(id); if(e) e.value='';});
    var desc=byId('entryDesc'); if(desc) desc.value='Pensión alimenticia';
    var date=byId('entryDate'); if(date && !date.value) date.value=today();
    syncMonthFromPayment();
  }
  function note(){
    var card=byId('saveEntryBtn') && byId('saveEntryBtn').closest('.card'); if(!card) return null;
    var n=byId('foodPensionNote');
    if(!n){n=document.createElement('div'); n.id='foodPensionNote'; n.className='note'; n.textContent='Registra la fecha de pago y el mes al que corresponde la pensión alimenticia. El porcentaje se compara contra el sueldo líquido del mes pensión.'; var row=byId('saveEntryBtn').closest('.button-row'); card.insertBefore(n,row);}
    return n;
  }
  function saveDirect(e){
    if(!isFoodPension()) return;
    if(e){e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();}
    var payDate=toIsoDate((byId('entryDate')&&byId('entryDate').value)||today());
    var pensionMonth=(byId('pensionMonth')&&byId('pensionMonth').value)||nextMonthFromDate(payDate);
    var amount=parseAmount(byId('entryPensionPayment')&&byId('entryPensionPayment').value);
    if(!amount){alert('Ingresa el monto de pensión alimenticia pagada'); return false;}
    var monthDate=pensionMonth+'-01';
    var entry={
      id:'pension-'+Date.now(),
      type:'pension',
      date:monthDate,
      paymentDate:payDate,
      pensionMonth:pensionMonth,
      description:'Pensión alimenticia '+monthName(pensionMonth)+' pagada '+payDate,
      amount:amount,
      pensionPayment:amount,
      gross:0, net:0, afp:0, tax:0, health:0, afc:0, taxable:0,
      taxYear:Number(pensionMonth.slice(0,4))
    };
    try{
      if(typeof state!=='undefined' && state && Array.isArray(state.entries)){
        state.entries.push(entry);
        if(typeof save==='function') save();
        else localStorage.setItem('ingresos_v4',JSON.stringify(state));
      } else {
        var saved=JSON.parse(localStorage.getItem('ingresos_v4')||'{"entries":[]}');
        saved.entries=saved.entries||[]; saved.entries.push(entry); localStorage.setItem('ingresos_v4',JSON.stringify(saved));
      }
      var amt=byId('entryPensionPayment'); if(amt) amt.value='';
      syncMonthFromPayment();
    }catch(err){alert('No se pudo guardar la pensión alimenticia');}
    return false;
  }
  function apply(){
    var t=byId('entryType'); if(!t) return;
    Array.from(t.options).forEach(function(o){if(o.value==='pension') o.textContent='Pensión alimenticia';});
    var on=isFoodPension();
    var n=note(); if(n) n.style.display=on?'':'none';
    ensurePensionMonthField();
    show('entryDate',true); show('pensionMonth',on); show('entryPensionPayment',true);
    var pg=byId('pensionMonthGroup'); if(pg) pg.style.display=on?'':'none';
    setLabel('entryDate',on?'Fecha de pago':'Fecha');
    setLabel('entryPensionPayment',on?'Monto pensión alimenticia pagada':'Pensión pagada');
    ['entryDesc','entryGross','entryNet','entryAfp','entryTax','entryHealth','entryAfc','entryTaxable','entryTaxYear'].forEach(function(id){show(id,!on);});
    if(on) cleanForFoodPension();
  }
  function bind(){
    var t=byId('entryType'); if(t && !t.dataset.foodPensionBound){t.dataset.foodPensionBound='1'; t.addEventListener('change',apply);}
    var d=byId('entryDate'); if(d && !d.dataset.foodPensionDateBound){d.dataset.foodPensionDateBound='1'; d.addEventListener('change',syncMonthFromPayment);}
    var s=byId('saveEntryBtn'); if(s && !s.dataset.foodPensionSaveBound){s.dataset.foodPensionSaveBound='1'; s.addEventListener('click',saveDirect,true);}
    apply();
  }
  document.addEventListener('DOMContentLoaded',bind); window.addEventListener('load',bind);
  new MutationObserver(function(){clearTimeout(window.foodPensionTimer); window.foodPensionTimer=setTimeout(bind,120);}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(bind,80);
})();
