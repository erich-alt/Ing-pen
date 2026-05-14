(function(){
  const VERSION='dashboard-v2-2026-05-14';
  function $(id){return document.getElementById(id)}
  function parse(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    let s=String(v||'').trim().replace(/\$/g,'').replace(/\s/g,'');
    if(!s) return 0;
    if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g,'').replace(',','.'))||0;
    if(/^[-+]?\d+(\.\d+)?$/.test(s)) return Number(s)||0;
    if(/^[-+]?\d+,\d+$/.test(s)) return Number(s.replace(',','.'))||0;
    return Number(s.replace(/[^0-9.-]/g,''))||0;
  }
  function money(v){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(parse(v)))}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
  function stateObj(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.entries))return state}catch(e){}return null}
  function yearOf(v){const m=String(v||'').match(/(20\d{2})/);return m?Number(m[1]):null}
  function ym(v){
    const s=String(v||'').trim(); let m=s.match(/^(20\d{2})-(\d{2})/); if(m)return m[1]+'-'+m[2];
    m=s.match(/(\d{2})-(\d{2})-(20\d{2})/); if(m)return m[3]+'-'+m[2];
    const y=yearOf(s); if(!y)return '';
    const map={ENE:'01',ENERO:'01',FEB:'02',FEBRERO:'02',MAR:'03',MARZO:'03',ABR:'04',ABRIL:'04',MAY:'05',MAYO:'05',JUN:'06',JUNIO:'06',JUL:'07',JULIO:'07',AGO:'08',AGOSTO:'08',SEP:'09',SEPT:'09',SEPTIEMBRE:'09',OCT:'10',OCTUBRE:'10',NOV:'11',NOVIEMBRE:'11',DIC:'12',DICIEMBRE:'12'};
    const ns=norm(s); for(const k in map){if(ns.includes(k))return y+'-'+map[k];} return '';
  }
  function desc(e){return e.description||e.desc||e.name||e.glosa||''}
  function isBonus(e){const t=norm(e.type),d=norm(desc(e));return t.includes('BONUS')||t.includes('BONO')||d.includes('BONO')}
  function isPension(e){const t=norm(e.type),d=norm(desc(e));return t.includes('PENSION')||d.includes('PENSION')}
  function isSalary(e){const t=norm(e.type),d=norm(desc(e));return !isBonus(e)&&!isPension(e)&&(t.includes('SALARY')||t.includes('SUELDO')||d.includes('SUELDO')||d.includes('LIQUIDACION'))}
  function val(e,keys){for(const k of keys){if(e[k]!==undefined&&e[k]!==null&&e[k]!=='')return parse(e[k]);}return 0}
  function payYear(e){return yearOf(e.paymentDate||e.date||e.fecha||e.period||desc(e))}
  function bonusTaxYear(e){const py=payYear(e); if(py)return py-1; const ex=Number(e.taxYear||e.anoRenta||e.rentaYear||0); return ex||null}
  function pensionMonth(e){return e.pensionMonth||ym(e.date)||ym(e.paymentDate)}
  function selectedMonth(){if($('dashMonth')&&$('dashMonth').value)return $('dashMonth').value; const y=($('dashYear')&&$('dashYear').value)||($('taxYear')&&$('taxYear').value)||new Date().getFullYear(); return y+'-'+String(new Date().getMonth()+1).padStart(2,'0')}
  function label(id,text){const el=$(id), card=el&&el.closest('.metric'), lab=card&&card.querySelector('.metric-label'); if(lab)lab.textContent=text}
  function set(id,text){const el=$(id); if(el)el.textContent=text}
  function update(){
    const s=stateObj(); if(!s)return;
    const month=selectedMonth(), year=Number(month.slice(0,4)), entries=s.entries||[];
    const salaryNet=entries.filter(e=>isSalary(e)&&ym(e.date||e.paymentDate||e.fecha||e.period)===month).reduce((a,e)=>a+val(e,['net','liquid','liquido','amount']),0);
    const bonusAnnual=entries.filter(e=>isBonus(e)&&bonusTaxYear(e)===year).reduce((a,e)=>a+val(e,['net','liquid','liquido','amount','gross']),0);
    const bonusMonthly=bonusAnnual/12;
    const pension=entries.filter(e=>isPension(e)&&pensionMonth(e)===month).reduce((a,e)=>a+val(e,['pensionPayment','amount','net','gross']),0);
    const base=salaryNet+bonusMonthly;
    label('dashGross','Sueldo líquido'); label('dashNet','Bono proporcional'); label('dashPension','Pensión alimenticia'); label('dashPct','% pensión');
    set('dashGross',money(salaryNet)); set('dashNet',money(bonusMonthly)); set('dashPension',money(pension));
    set('dashPct', salaryNet>0 ? (pension/base*100).toFixed(1)+'%' : 'Falta sueldo');
    const pct=$('dashPct'); if(pct){pct.style.fontSize=salaryNet>0?'':'18px';}
  }
  function fixAnalysis(){const m=$('analysisMetric'), box=$('analysisAfpBalance'); if(!m||!box)return; const card=box.closest('.metric'); if(card)card.style.display=m.value==='afp'?'':'none';}
  function apply(){update();fixAnalysis();}
  document.addEventListener('change',e=>{if(e.target&&['dashMonth','dashYear','taxYear','analysisMetric'].includes(e.target.id))setTimeout(apply,80)},true);
  new MutationObserver(()=>{clearTimeout(window.__dashV2Timer);window.__dashV2Timer=setTimeout(apply,120);}).observe(document.documentElement,{childList:true,subtree:true});
  window.dashboardV2Version=VERSION; setInterval(apply,1500); setTimeout(apply,200);
})();
