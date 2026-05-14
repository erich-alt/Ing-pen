(function(){
  const VERSION='dashboard-income-fix-2026-05-14-1';
  function $(id){return document.getElementById(id)}
  function n(v){return Number(String(v||'').replace(/\./g,'').replace(/,/g,'.').replace(/[^0-9.-]/g,''))||0}
  function money(v){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(n(v)))}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
  function appState(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.entries))return state}catch(e){} return null}
  function ymd(e){return String(e.date||e.paymentDate||e.fecha||e.period||'')}
  function yearFromAny(v){const m=String(v||'').match(/(20\d{2})/); return m?Number(m[1]):null}
  function ymFromAny(v){
    const s=String(v||'').trim();
    let m=s.match(/^(20\d{2})-(\d{2})/); if(m)return m[1]+'-'+m[2];
    m=s.match(/(\d{2})-(\d{2})-(20\d{2})/); if(m)return m[3]+'-'+m[2];
    const y=yearFromAny(s); if(!y)return '';
    const map={ENE:'01',ENERO:'01',FEB:'02',FEBRERO:'02',MAR:'03',MARZO:'03',ABR:'04',ABRIL:'04',MAY:'05',MAYO:'05',JUN:'06',JUNIO:'06',JUL:'07',JULIO:'07',AGO:'08',AGOSTO:'08',SEP:'09',SEPT:'09',SEPTIEMBRE:'09',OCT:'10',OCTUBRE:'10',NOV:'11',NOVIEMBRE:'11',DIC:'12',DICIEMBRE:'12'};
    const ns=norm(s); for(const k in map){ if(ns.includes(k)) return y+'-'+map[k]; }
    return '';
  }
  function desc(e){return e.description||e.desc||e.name||e.glosa||''}
  function isBonus(e){const t=norm(e.type), d=norm(desc(e)); return t.includes('BONUS')||t.includes('BONO')||d.includes('BONO')}
  function isSalary(e){const t=norm(e.type), d=norm(desc(e)); return (t.includes('SALARY')||t.includes('SUELDO')||d.includes('SUELDO')||d.includes('LIQUIDACION'))&&!isBonus(e)}
  function isPension(e){const t=norm(e.type), d=norm(desc(e)); return t.includes('PENSION')||d.includes('PENSION')}
  function entryAmount(e,keys){for(const k of keys){if(e[k]!==undefined&&e[k]!==null&&e[k]!=='')return n(e[k])} return 0}
  function paymentYear(e){return yearFromAny(e.paymentDate||e.date||e.fecha||e.period||desc(e))}
  function taxYearForBonus(e){
    const paid=paymentYear(e);
    if(paid) return paid-1;
    const explicit=Number(e.taxYear||e.anoRenta||e.rentaYear||0);
    return explicit?explicit-1:null;
  }
  function monthOfPension(e){return e.pensionMonth||ymFromAny(e.date)||ymFromAny(e.paymentDate)}
  function selectedMonth(){
    if($('dashMonth')&&$('dashMonth').value)return $('dashMonth').value;
    const y=($('dashYear')&&$('dashYear').value)||($('taxYear')&&$('taxYear').value)||new Date().getFullYear();
    return y+'-'+String(new Date().getMonth()+1).padStart(2,'0');
  }
  function setMetricLabel(valueId,label){
    const el=$(valueId); const card=el&&el.closest('.metric'); const lab=card&&card.querySelector('.metric-label'); if(lab) lab.textContent=label;
  }
  function setValue(id,val){const el=$(id); if(el)el.textContent=val}
  function updateDashboardIncome(){
    const s=appState(); if(!s)return;
    const month=selectedMonth(); const year=Number(month.slice(0,4));
    const entries=s.entries||[];
    const salaryNet=entries.filter(e=>isSalary(e)&&ymFromAny(ymd(e))===month).reduce((sum,e)=>sum+entryAmount(e,['net','liquid','liquido','amount']),0);
    const bonusNetAnnual=entries.filter(e=>isBonus(e)&&taxYearForBonus(e)===year).reduce((sum,e)=>sum+entryAmount(e,['net','liquid','liquido','amount','gross']),0);
    const bonusMonthly=bonusNetAnnual/12;
    const pension=entries.filter(e=>isPension(e)&&monthOfPension(e)===month).reduce((sum,e)=>sum+entryAmount(e,['pensionPayment','amount','net','gross']),0);
    const base=salaryNet+bonusMonthly;
    setMetricLabel('dashGross','Sueldo líquido');
    setMetricLabel('dashNet','Bono proporcional');
    setMetricLabel('dashPension','Pensión alimenticia');
    setMetricLabel('dashPct','% pensión');
    setValue('dashGross',money(salaryNet));
    setValue('dashNet',money(bonusMonthly));
    setValue('dashPension',money(pension));
    setValue('dashPct',base>0?(pension/base*100).toFixed(1)+'%':'0%');
  }
  function fixAnalysisAfpBox(){
    const metric=$('analysisMetric'); const box=$('analysisAfpBalance');
    if(!metric||!box)return;
    const card=box.closest('.metric'); if(!card)return;
    const label=card.querySelector('.metric-label');
    if(metric.value==='afp'){
      card.style.display=''; if(label)label.textContent='Saldo final AFP';
    }else{
      card.style.display='none';
    }
  }
  function apply(){updateDashboardIncome(); fixAnalysisAfpBox();}
  document.addEventListener('change',function(e){if(e.target&&['dashMonth','dashYear','taxYear','analysisMetric'].includes(e.target.id))setTimeout(apply,80)},true);
  new MutationObserver(function(){clearTimeout(window.__dashboardIncomeFixTimer); window.__dashboardIncomeFixTimer=setTimeout(apply,140);}).observe(document.documentElement,{childList:true,subtree:true});
  window.dashboardIncomeFixVersion=VERSION;
  setInterval(apply,1500);
  setTimeout(apply,200);
})();
