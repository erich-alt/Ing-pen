(function(){
  const KEY='finanzas_pro_v2';
  const $=id=>document.getElementById(id);
  const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(Number(n||0)));
  const parse=v=>{if(typeof v==='number')return v;let s=String(v||'').trim().replace(/\$/g,'').replace(/\s/g,'');if(!s)return 0;if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return Number(s.replace(/\./g,'').replace(',','.'))||0;if(/^[-+]?\d+(\.\d+)?$/.test(s))return Number(s)||0;if(/^[-+]?\d+,\d+$/.test(s))return Number(s.replace(',','.'))||0;return Number(s.replace(/[^0-9.-]/g,''))||0};
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const today=()=>new Date().toISOString().slice(0,10);
  const uid=()=>Date.now()+Math.floor(Math.random()*99999);
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));setTimeout(()=>window.location.reload(),150)}
  function ensure(db){db.expenses=db.expenses||[];db.accounts=db.accounts||[];db.cards=db.cards||[];db.tags=db.tags||defaultTags();return db}
  function defaultTags(){return ['hogar','supermercado','niños','Gracia','Lukas','salud','vehículo','regalos','comida','deuda','servicios','viajes','seguro','colegio','nana','combustible']}
  const RULES=[
    {cat:'Pensión alimenticia',tags:['niños'],words:['pension alimenticia','alimentos','pension gracia','pension lukas']},
    {cat:'Supermercado',tags:['supermercado'],words:['jumbo','lider','unimarc','tottus','santa isabel','supermercado','mercado','cornershop']},
    {cat:'Hogar',tags:['hogar','servicios'],words:['enel','aguas andinas','metrogas','gasco','lipigas','gastos comunes','internet','vtr','movistar','entel','wom','claro','servipag','nana','aseo']},
    {cat:'Niños',tags:['niños'],words:['colegio','escolar','uniforme','juguete','cumpleanos nino','ninos','gracia','lukas','pediatra']},
    {cat:'Salud',tags:['salud'],words:['clinica','alemana','redsalud','medico','farmacia','salcobrand','cruz verde','ahumada','kine','kinesiologia','examen','laboratorio']},
    {cat:'Vehículos',tags:['vehículo'],words:['copec','shell','petrobras','combustible','bencina','tag','autopista','mecanico','neumatico','mantencion','subaru','toyota']},
    {cat:'Regalos',tags:['regalos'],words:['regalo','rapsodia','flores','cumpleanos','cumpleaños']},
    {cat:'Comida y salidas',tags:['comida'],words:['restaurant','restoran','uber eats','pedidosya','rappi','bar','pub','sushi','pizza','burger','cafe','starbucks']},
    {cat:'Viajes',tags:['viajes'],words:['latam','sky airline','jet smart','booking','airbnb','hotel','transfer','estacionamiento aeropuerto','aeropuerto']},
    {cat:'Seguro complementario',tags:['seguro','salud'],words:['reembolso','seguro complementario','isapre','vida camara','bice vida','metlife']},
    {cat:'Deuda',tags:['deuda'],words:['deuda papa','prestamo papa','credito','cuota credito','pago tarjeta']},
    {cat:'Transferencias',tags:['transferencia'],words:['transferencia','traspaso','abono','tef']}
  ];
  function classify(desc,rawCat){
    const t=norm((rawCat||'')+' '+(desc||''));
    for(const r of RULES){if(r.words.some(w=>t.includes(norm(w))))return {category:r.cat,tags:[...r.tags]}}
    if(rawCat)return {category:String(rawCat).trim(),tags:[norm(rawCat).replace(/\s+/g,'-')]};
    return {category:'Otros',tags:['otros']};
  }
  function pick(obj,names){
    const keys=Object.keys(obj||{});for(const name of names){const found=keys.find(k=>norm(k)===norm(name)||norm(k).includes(norm(name)));if(found!==undefined&&obj[found]!==undefined&&obj[found]!==null&&obj[found]!=='')return obj[found];}return '';
  }
  function excelDate(v){
    if(!v)return today();
    if(typeof v==='number'&&v>20000){const d=new Date(Math.round((v-25569)*86400*1000));return d.toISOString().slice(0,10)}
    const s=String(v).trim();
    let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return today();
  }
  function inferAccount(db,txt){const t=norm(txt);const acc=(db.accounts||[]).find(a=>t.includes(norm(a.name))||t.includes(norm(a.type)));return acc?acc.id:null}
  function inferCard(db,txt){const t=norm(txt);const card=(db.cards||[]).find(c=>t.includes(norm(c.name)));return card?card.id:null}
  function normalizeRow(row,db){
    const desc=pick(row,['descripcion','descripción','glosa','detalle','comercio','nombre','movimiento','concepto','transaccion','transacción'])||'Gasto importado';
    const rawDate=pick(row,['fecha','fecha movimiento','fecha transaccion','fecha transacción','fecha contable','date']);
    const rawAmount=pick(row,['monto','cargo','egreso','debe','importe','valor','amount','total']);
    const rawCat=pick(row,['categoria','categoría','rubro','tipo','tag','etiqueta']);
    const rawAccount=pick(row,['cuenta','tarjeta','origen','medio de pago','producto']);
    let amount=Math.abs(parse(rawAmount));
    const clas=classify(desc,rawCat);
    return {id:uid(),date:excelDate(rawDate),category:clas.category,tags:clas.tags,description:String(desc).trim(),amount,source:'importado',accountId:inferAccount(db,rawAccount+' '+desc),cardId:inferCard(db,rawAccount+' '+desc),raw:row};
  }
  function injectStyle(){if($('stage6Style'))return;const s=document.createElement('style');s.id='stage6Style';s.textContent=`
    .import-card{background:#fff;border:1px solid #dfe8e3;border-radius:22px;box-shadow:0 8px 24px rgba(19,34,31,.08);padding:16px;margin-bottom:14px}.import-card h2{font-size:20px;margin:0 0 14px}.import-box{border:1px dashed #99c9bc;background:#f1faf7;border-radius:18px;padding:14px;text-align:center}.import-box input{margin-top:10px}.preview-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px 0;border-bottom:1px solid #edf2ef}.preview-row:last-child{border-bottom:0}.preview-title{font-weight:900;font-size:14px}.preview-sub{font-size:12px;color:#687672;margin-top:3px}.preview-val{font-weight:950;color:#be123c}.tag{display:inline-flex;background:#e6f2ee;color:#0b5f59;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;margin:4px 4px 0 0}.import-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.import-actions button{min-height:48px;border:0;border-radius:15px;font-weight:950}.import-actions .ok{background:#0f766e;color:white}.import-actions .no{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}.map-note{font-size:12px;color:#687672;line-height:1.35;margin-top:8px}.cat-editor{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.cat-editor select,.cat-editor input{min-height:42px;font-size:14px;border-radius:13px}.expense-chip{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900;margin-left:6px;background:#e6f2ee;color:#0b5f59}
  `;document.head.appendChild(s)}
  function ensureImportUI(){
    const pane=$('expense-form');if(!pane||$('expenseImportCard'))return;
    const card=document.createElement('div');card.id='expenseImportCard';card.className='import-card';card.innerHTML=`
      <h2>Importar gastos</h2>
      <div class="import-box"><strong>Sube Excel o CSV</strong><div class="map-note">Lee fecha, descripción/glosa, monto, categoría/etiqueta y medio de pago. Luego preclasifica según reglas.</div><input id="expenseImportFile" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"></div>
      <div id="expenseImportPreview"></div>
    `;
    pane.insertBefore(card,pane.firstChild);
    $('expenseImportFile').addEventListener('change',e=>e.target.files[0]&&readFile(e.target.files[0]));
  }
  function ensureXlsx(cb){
    if(window.XLSX){cb();return;}
    const s=document.createElement('script');s.src='./vendor/xlsx.full.min.js';s.onload=cb;s.onerror=()=>alert('No pude cargar la librería Excel. Prueba con CSV o abre con internet una vez.');document.head.appendChild(s);
  }
  function csvRows(text){
    const lines=text.split(/\r?\n/).filter(x=>x.trim());if(!lines.length)return[];
    const sep=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':',';
    const headers=lines[0].split(sep).map(x=>x.trim().replace(/^"|"$/g,''));
    return lines.slice(1).map(line=>{const vals=line.split(sep).map(x=>x.trim().replace(/^"|"$/g,''));const o={};headers.forEach((h,i)=>o[h]=vals[i]||'');return o});
  }
  function readFile(file){
    const db=ensure(load());
    const ext=file.name.toLowerCase();
    if(ext.endsWith('.csv')){const r=new FileReader();r.onload=()=>preview(csvRows(r.result).map(row=>normalizeRow(row,db)));r.readAsText(file);return;}
    ensureXlsx(()=>{const r=new FileReader();r.onload=()=>{const data=new Uint8Array(r.result);const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:''});preview(rows.map(row=>normalizeRow(row,db)));};r.readAsArrayBuffer(file);});
  }
  function preview(items){
    window.__expenseImportItems=items.filter(x=>x.amount>0);
    const box=$('expenseImportPreview');
    if(!box)return;
    const total=window.__expenseImportItems.reduce((a,x)=>a+x.amount,0);
    box.innerHTML=`<div class="map-note"><strong>${window.__expenseImportItems.length} gastos detectados</strong> · Total ${fmt(total)}</div>`+
    window.__expenseImportItems.slice(0,25).map((x,i)=>`<div class="preview-row"><div><div class="preview-title">${x.description}</div><div class="preview-sub">${x.date} · ${x.category}${x.cardId?' · tarjeta':''}${x.accountId?' · cuenta':''}</div><div>${(x.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="cat-editor"><select data-import-cat="${i}">${['Supermercado','Hogar','Niños','Salud','Vehículos','Regalos','Comida y salidas','Viajes','Seguro complementario','Deuda','Transferencias','Otros'].map(c=>`<option ${c===x.category?'selected':''}>${c}</option>`).join('')}</select><input data-import-tags="${i}" value="${(x.tags||[]).join(', ')}" placeholder="etiquetas"></div></div><div class="preview-val">${fmt(x.amount)}</div></div>`).join('')+
    `<div class="import-actions"><button class="ok" id="confirmImportExpenses">Importar gastos</button><button class="no" id="cancelImportExpenses">Cancelar</button></div>`;
    document.querySelectorAll('[data-import-cat]').forEach(sel=>sel.onchange=()=>{const idx=Number(sel.dataset.importCat);window.__expenseImportItems[idx].category=sel.value});
    document.querySelectorAll('[data-import-tags]').forEach(inp=>inp.onchange=()=>{const idx=Number(inp.dataset.importTags);window.__expenseImportItems[idx].tags=inp.value.split(',').map(s=>s.trim()).filter(Boolean)});
    $('confirmImportExpenses').onclick=()=>{const db=ensure(load());db.expenses.push(...window.__expenseImportItems);save(db)};
    $('cancelImportExpenses').onclick=()=>{window.__expenseImportItems=[];box.innerHTML=''};
  }
  function enhanceExpenseRows(){
    const list=$('expenseList');if(!list)return;
    Array.from(list.children).forEach((row,idx)=>{if(!row.classList||!row.classList.contains('row')||row.dataset.enhanced)return;row.dataset.enhanced='1';const db=ensure(load());const txt=row.textContent;const ex=(db.expenses||[]).find(e=>txt.includes(e.description||'')&&txt.includes(String(e.date||'')));if(ex&&ex.tags&&ex.tags.length){const title=row.querySelector('.rtitle');if(title)title.insertAdjacentHTML('beforeend',`<span class="expense-chip">${ex.tags[0]}</span>`)}});
  }
  function apply(){injectStyle();ensureImportUI();enhanceExpenseRows()}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,700));window.addEventListener('load',()=>setTimeout(apply,900));new MutationObserver(()=>{clearTimeout(window.__stage6Timer);window.__stage6Timer=setTimeout(apply,350)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,2500);
})();
