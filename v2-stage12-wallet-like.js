(function () {
  const KEY = 'finanzas_pro_v2';
  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Math.round(Number(value || 0)));
  const today = () => new Date().toISOString().slice(0, 10);
  const ym = (date) => String(date || '').slice(0, 7);
  const uid = () => Date.now() + Math.floor(Math.random() * 99999);
  const categories = [
    'Alimentacion', 'Supermercado', 'Transporte', 'Salud', 'Entretenimiento',
    'Hogar', 'Ninos', 'Vehiculos', 'Seguros', 'Deuda', 'Transferencias',
    'Impuestos', 'Remuneracion', 'Otros'
  ];

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  function ensure(db) {
    db.incomes = db.incomes || [];
    db.expenses = db.expenses || [];
    db.pensions = db.pensions || [];
    db.vehicles = db.vehicles || [];
    db.insurance = db.insurance || [];
    db.accounts = db.accounts || [];
    db.cards = db.cards || [];
    db.imports = db.imports || [];
    db.walletSync = db.walletSync || {};
    db.settings = db.settings || {};
    return db;
  }

  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
    if (typeof render === 'function') setTimeout(render, 40);
    setTimeout(apply, 120);
  }

  function norm(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function parseAmount(value) {
    if (typeof value === 'number') return value;
    let text = String(value || '').trim().replace(/\$/g, '').replace(/\s/g, '');
    if (!text) return 0;
    const negative = /^-|\((.*)\)/.test(text) || /\b(cargo|egreso|debit|expense)\b/i.test(text);
    text = text.replace(/[()]/g, '');
    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, '').replace(',', '.');
    else if (/^[-+]?\d+,\d+$/.test(text)) text = text.replace(',', '.');
    else if ((text.match(/\./g) || []).length > 1) text = text.replace(/\./g, '');
    const n = Math.abs(Number(text.replace(/[^0-9.-]/g, '')) || 0);
    return negative ? -n : n;
  }

  function parseDate(value) {
    if (typeof value === 'number' && value > 20000) {
      return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
    }
    const text = String(value || '').trim();
    let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (match) return `${match[3].length === 2 ? '20' + match[3] : match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
    return today();
  }

  function pick(row, names) {
    const keys = Object.keys(row || {});
    for (const name of names) {
      const found = keys.find((key) => norm(key) === norm(name) || norm(key).includes(norm(name)));
      if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') return row[found];
    }
    return '';
  }

  function classify(description, raw) {
    const text = norm(`${raw || ''} ${description || ''}`);
    const rules = [
      ['Supermercado', ['jumbo', 'lider', 'unimarc', 'tottus', 'santa isabel', 'supermercado']],
      ['Transporte', ['uber', 'taxi', 'metro', 'tag', 'peaje', 'estacionamiento']],
      ['Vehiculos', ['copec', 'shell', 'petrobras', 'bencina', 'combustible', 'mantencion', 'neumatico']],
      ['Salud', ['clinica', 'medico', 'farmacia', 'salcobrand', 'cruz verde', 'consulta', 'examen']],
      ['Hogar', ['enel', 'aguas', 'metrogas', 'gasco', 'internet', 'gastos comunes']],
      ['Ninos', ['colegio', 'pediatra', 'uniforme', 'pension alimenticia']],
      ['Entretenimiento', ['netflix', 'spotify', 'cine', 'restaurant', 'restaurante', 'rappi', 'pedidosya']],
      ['Seguros', ['seguro', 'reembolso']],
      ['Transferencias', ['transferencia', 'traspaso', 'tef']],
      ['Remuneracion', ['sueldo', 'remuneracion', 'liquidacion', 'bono']]
    ];
    const hit = rules.find(([, words]) => words.some((word) => text.includes(word)));
    return hit ? hit[0] : (String(raw || '').trim() || 'Otros');
  }

  function splitCsvLine(line, separator) {
    const out = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = !quoted;
      } else if (ch === separator && !quoted) {
        out.push(current);
        current = '';
      } else current += ch;
    }
    out.push(current);
    return out.map((item) => item.trim());
  }

  function csvRows(text) {
    const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return [];
    const separator = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    const headers = splitCsvLine(lines[0], separator).map((item) => item.replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line, separator).map((item) => item.replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((header, index) => row[header] = values[index] || '');
      return row;
    });
  }

  function ensureXlsx() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve();
      const script = document.createElement('script');
      script.src = './vendor/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensurePdf() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) return resolve();
      const script = document.createElement('script');
      script.src = './vendor/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function rowsFromFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) return csvRows(await file.text());
    if (name.endsWith('.pdf')) {
      await ensurePdf();
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const rows = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        rows.push({ texto: content.items.map((item) => item.str).join(' ') });
      }
      return rows;
    }
    await ensureXlsx();
    const workbook = window.XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    return workbook.SheetNames.flatMap((sheetName) => window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }));
  }

  function normalizeMovement(row) {
    const description = pick(row, ['descripcion', 'description', 'note', 'payee', 'merchant', 'detalle', 'concepto', 'nombre']) || 'Movimiento importado';
    const rawCategory = pick(row, ['categoria', 'category', 'rubro', 'tipo', 'etiqueta']);
    const date = parseDate(pick(row, ['fecha', 'date', 'recordDate', 'fecha movimiento', 'fecha transaccion']));
    const signed = parseAmount(pick(row, ['signedAmount', 'amount', 'monto', 'importe', 'valor', 'cargo', 'abono', 'total']));
    const walletId = pick(row, ['walletId', 'id', 'record id']);
    const labels = String(pick(row, ['labels', 'etiquetas', 'tags']) || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    return {
      walletId: walletId ? String(walletId) : '',
      date,
      category: classify(description, rawCategory),
      description: String(description).trim(),
      amount: Math.abs(signed),
      signedAmount: signed,
      labels,
      accountLabel: String(pick(row, ['cuenta', 'account', 'wallet', 'tarjeta']) || '').trim(),
      source: 'import'
    };
  }

  function normalizeRemuneration(row) {
    const text = String(row.texto || '');
    const description = pick(row, ['descripcion', 'description', 'concepto', 'tipo']) || (text ? 'Liquidacion PDF' : 'Ingreso importado');
    const date = parseDate(pick(row, ['fecha', 'date', 'fecha pago', 'periodo']) || today());
    const gross = parseAmount(pick(row, ['total haberes', 'bruto', 'gross', 'haberes', 'monto bruto']) || (text.match(/total haberes\s*\$?\s*([\d.,]+)/i) || [])[1]);
    const net = parseAmount(pick(row, ['liquido', 'liquido a pago', 'neto', 'net', 'monto liquido']) || (text.match(/liquido(?: a pago)?\s*\$?\s*([\d.,]+)/i) || [])[1]);
    const tax = parseAmount(pick(row, ['impuesto', 'impuesto retenido', 'tax', 'retencion']) || (text.match(/impuesto\s*\$?\s*([\d.,]+)/i) || [])[1]);
    const taxable = parseAmount(pick(row, ['base tributable', 'tributable', 'renta imponible', 'base imponible']) || gross || net);
    return {
      id: uid(),
      type: norm(description).includes('bono') ? 'bonus' : 'salary',
      date,
      taxYear: Number(pick(row, ['ano renta', 'anio renta', 'tax year'])) || Number(date.slice(0, 4)),
      description: String(description).trim(),
      gross: Math.abs(gross || net),
      net: Math.abs(net || gross),
      tax: Math.abs(tax),
      taxable: Math.abs(taxable || gross || net),
      source: 'remuneracion'
    };
  }

  function injectStyle() {
    if ($('stage12Style')) return;
    const style = document.createElement('style');
    style.id = 'stage12Style';
    style.textContent = `
      .wallet-pane{display:grid;gap:12px}.wallet-card{background:#fff;border:1px solid #dfe8e3;border-radius:8px;padding:14px;box-shadow:0 8px 20px rgba(19,34,31,.06)}.wallet-card h2{font-size:17px;margin:0 0 10px}.wallet-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.wallet-tabs button{min-height:42px;border-radius:8px;border:1px solid #dfe8e3;background:#fff;color:#0b5f59;font-weight:900}.wallet-tabs button.active{background:#0f766e;color:#fff;border-color:#0f766e}.wallet-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wallet-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.wallet-status{font-size:13px;color:#0b5f59;background:#f1faf7;border:1px solid #c7e2d9;border-radius:8px;padding:10px;margin-top:8px}.wallet-status.warn{background:#fff7ed;border-color:#fed7aa;color:#92400e}.wallet-preview-row,.wallet-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #edf2ef}.wallet-preview-row:last-child,.wallet-row:last-child{border-bottom:0}.wallet-row button,.wallet-preview-row button{border:0;background:transparent;text-align:left;padding:0;color:inherit}.wallet-row b,.wallet-preview-row b{font-size:14px}.wallet-row span,.wallet-preview-row span{display:block;font-size:12px;color:#687672;margin-top:3px}.wallet-row strong,.wallet-preview-row strong{white-space:nowrap;color:#0b5f59}.wallet-filter-bar{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.wallet-filter-bar input,.wallet-filter-bar select{min-height:42px;border-radius:8px}.wallet-drawer{position:fixed;inset:0;z-index:95;background:rgba(15,23,20,.42);display:none;align-items:flex-end;justify-content:center}.wallet-sheet{width:100%;max-width:560px;max-height:86vh;overflow:auto;background:#fff;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -18px 40px rgba(0,0,0,.22)}.wallet-sheet-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.wallet-sheet-head h2{margin:0;font-size:19px}.wallet-close{width:38px;height:38px;border:0;border-radius:999px;background:#eef4f1;color:#0b5f59;font-size:24px}.wallet-edit{display:grid;gap:10px}.wallet-edit .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wallet-edit input,.wallet-edit select{min-height:46px;border-radius:8px}.wallet-save{min-height:48px;border:0;border-radius:8px;background:#0f766e;color:white;font-weight:950}.wallet-delete{min-height:48px;border:1px solid #fecdd3;border-radius:8px;background:#fff1f2;color:#be123c;font-weight:950}.clickable-card{cursor:pointer}.pro-bar-row,.pro-tile,.pro-pay{cursor:pointer}@media(max-width:390px){.wallet-grid,.wallet-actions,.wallet-filter-bar,.wallet-edit .two{grid-template-columns:1fr}.wallet-tabs{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function chip(name, label) {
    const more = $('scr-more');
    const chips = more && more.querySelector('.chips');
    if (!more || !chips) return false;
    let button = document.querySelector(`[data-more="${name}"]`);
    if (!button) {
      button = document.createElement('button');
      button.className = 'chip';
      button.dataset.more = name;
      button.textContent = label;
      chips.insertBefore(button, chips.firstChild);
    } else {
      button.textContent = label;
    }
    return true;
  }

  function bindMoreChips() {
    document.querySelectorAll('[data-more]').forEach((button) => {
      if (button.dataset.stage12Bound) return;
      button.dataset.stage12Bound = '1';
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-more]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.more-tab').forEach((pane) => pane.classList.add('hidden'));
        const pane = $(`more-${button.dataset.more}`);
        if (pane) pane.classList.remove('hidden');
      });
    });
  }

  function ensureDataCenter() {
    if (!chip('wallet-data', 'Datos')) return;
    let pane = $('more-wallet-data');
    if (!pane) {
      pane = document.createElement('div');
      pane.id = 'more-wallet-data';
      pane.className = 'more-tab hidden wallet-pane';
      $('scr-more').appendChild(pane);
    }
    pane.innerHTML = `
      <div class="wallet-card">
        <h2>Centro de datos</h2>
        <div class="wallet-tabs">
          <button class="active" data-wallet-section="sync">Sincronizar</button>
          <button data-wallet-section="movements">Excel Wallet</button>
          <button data-wallet-section="payroll">Liquidaciones</button>
        </div>
      </div>
      <div class="wallet-card wallet-section" id="wallet-section-sync">
        <h2>Wallet / BudgetBakers</h2>
        <div class="wallet-grid">
          <div><label>Desde</label><input id="stage12SyncFrom" type="date"></div>
          <div><label>Hasta</label><input id="stage12SyncTo" type="date"></div>
        </div>
        <div class="wallet-actions">
          <button class="btn" id="stage12SyncNow">Sincronizar periodo</button>
          <button class="btn secondary" id="stage12SyncAll">Toda la historia</button>
        </div>
        <div id="stage12SyncStatus" class="wallet-status">Listo para sincronizar.</div>
      </div>
      <div class="wallet-card wallet-section hidden" id="wallet-section-movements">
        <h2>Importar exportacion Wallet</h2>
        <input id="stage12MovementsFile" type="file" accept=".xlsx,.xls,.csv">
        <div class="wallet-status">Importa en una sola pasada ingresos y egresos. Se deduplica por ID de Wallet o por fecha, descripcion y monto.</div>
        <div id="stage12MovementPreview"></div>
      </div>
      <div class="wallet-card wallet-section hidden" id="wallet-section-payroll">
        <h2>Leer liquidacion PDF / Excel</h2>
        <input id="stage12PayrollFile" type="file" accept=".pdf,.xlsx,.xls,.csv">
        <div class="wallet-status">Convierte liquidaciones en ingresos editables. Si el PDF no trae texto claro, te mostrara lo que pudo detectar.</div>
        <div id="stage12PayrollPreview"></div>
      </div>
    `;
    $('stage12SyncFrom').value = (() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().slice(0, 10); })();
    $('stage12SyncTo').value = today();
    bindDataCenter();
  }

  function bindDataCenter() {
    document.querySelectorAll('[data-wallet-section]').forEach((button) => {
      button.onclick = () => {
        document.querySelectorAll('[data-wallet-section]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.wallet-section').forEach((section) => section.classList.add('hidden'));
        $(`wallet-section-${button.dataset.walletSection}`)?.classList.remove('hidden');
      };
    });
    $('stage12SyncNow').onclick = () => syncWallet($('stage12SyncFrom').value, $('stage12SyncTo').value, false);
    $('stage12SyncAll').onclick = () => syncWallet('', '', true);
    $('stage12MovementsFile').onchange = (event) => event.target.files[0] && importMovements(event.target.files[0]);
    $('stage12PayrollFile').onchange = (event) => event.target.files[0] && importPayroll(event.target.files[0]);
  }

  function monthValue() {
    return ($('month') && $('month').value) || ym(today());
  }

  function movementKey(item) {
    return item.walletId || `${item.date}|${norm(item.description)}|${Number(item.amount || item.net || 0)}`;
  }

  async function syncWallet(from, to, all) {
    const status = $('stage12SyncStatus');
    status.textContent = 'Sincronizando...';
    status.classList.remove('warn');
    try {
      const params = new URLSearchParams();
      if (all) {
        params.set('all', '1');
        params.set('start', '2010-01-01');
        params.set('max', '50000');
      } else {
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('max', '5000');
      }
      const response = await fetch(`/api/wallet/sync?${params.toString()}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || 'No se pudo sincronizar');
      const stats = mergeMovements((body.records || []).map((record) => ({
        walletId: record.walletId,
        date: record.date,
        category: record.category,
        description: record.description,
        amount: record.amount,
        signedAmount: record.signedAmount,
        labels: record.labels || [],
        accountLabel: record.accountId || '',
        source: 'wallet'
      })));
      status.textContent = `Listo: ${body.count} leidos. Nuevos ${stats.added}, actualizados ${stats.updated}.`;
    } catch (error) {
      status.textContent = `No pude sincronizar: ${error.message}`;
      status.classList.add('warn');
    }
  }

  function mergeMovements(items) {
    const db = ensure(load());
    const expenseMap = new Map(db.expenses.map((item) => [movementKey(item), item]));
    const incomeMap = new Map(db.incomes.map((item) => [movementKey(item), item]));
    let added = 0;
    let updated = 0;
    items.forEach((item) => {
      if (!item.date || !item.amount) return;
      const signed = Number(item.signedAmount || 0);
      if (signed > 0 || item.recordType === 'income') {
        const key = movementKey(item);
        const existing = incomeMap.get(key);
        const next = {
          id: existing ? existing.id : uid(),
          walletId: item.walletId || '',
          type: 'extra',
          date: item.date,
          taxYear: Number(item.date.slice(0, 4)),
          description: item.description || item.category || 'Ingreso',
          gross: Number(item.amount || 0),
          net: Number(item.amount || 0),
          tax: 0,
          taxable: Number(item.amount || 0),
          category: item.category || 'Otros',
          labels: item.labels || [],
          source: item.source || 'import'
        };
        if (existing) {
          Object.assign(existing, next);
          updated += 1;
        } else {
          db.incomes.push(next);
          incomeMap.set(key, next);
          added += 1;
        }
        return;
      }
      const key = movementKey(item);
      const existing = expenseMap.get(key);
      const next = {
        id: existing ? existing.id : uid(),
        walletId: item.walletId || '',
        date: item.date,
        category: item.category || 'Otros',
        description: item.description || item.category || 'Gasto',
        amount: Math.abs(Number(item.amount || 0)),
        labels: item.labels || [],
        accountLabel: item.accountLabel || '',
        source: item.source || 'import'
      };
      if (existing) {
        Object.assign(existing, next);
        updated += 1;
      } else {
        db.expenses.push(next);
        expenseMap.set(key, next);
        added += 1;
      }
    });
    db.imports.push({ id: uid(), date: today(), type: 'wallet-like-import', count: items.length });
    save(db);
    return { added, updated };
  }

  async function importMovements(file) {
    const target = $('stage12MovementPreview');
    target.innerHTML = '<div class="wallet-status">Leyendo archivo...</div>';
    try {
      const rows = await rowsFromFile(file);
      const items = rows.map(normalizeMovement).filter((item) => item.amount > 0);
      const income = items.filter((item) => Number(item.signedAmount || 0) > 0);
      const expenses = items.length - income.length;
      target.innerHTML = `
        <div class="wallet-status">${items.length} movimientos detectados: ${income.length} ingresos y ${expenses} egresos.</div>
        ${items.slice(0, 25).map((item) => `<div class="wallet-preview-row"><div><b>${item.description}</b><span>${item.date} - ${item.category} - ${item.labels.join(', ') || 'sin etiquetas'}</span></div><strong>${money(item.amount)}</strong></div>`).join('')}
        <div class="wallet-actions"><button class="btn" id="stage12ConfirmMovementImport">Importar y cuadrar</button><button class="btn danger" id="stage12CancelMovementImport">Cancelar</button></div>
      `;
      $('stage12ConfirmMovementImport').onclick = () => {
        const stats = mergeMovements(items);
        target.innerHTML = `<div class="wallet-status">Importacion lista. Nuevos ${stats.added}, actualizados ${stats.updated}.</div>`;
      };
      $('stage12CancelMovementImport').onclick = () => target.innerHTML = '';
    } catch (error) {
      target.innerHTML = '<div class="wallet-status warn">No pude leer ese archivo. Prueba exportarlo como CSV o Excel desde Wallet.</div>';
    }
  }

  async function importPayroll(file) {
    const target = $('stage12PayrollPreview');
    target.innerHTML = '<div class="wallet-status">Leyendo liquidacion...</div>';
    try {
      const rows = await rowsFromFile(file);
      const items = rows.map(normalizeRemuneration).filter((item) => item.net || item.gross);
      target.innerHTML = `
        <div class="wallet-status">${items.length} ingresos detectados.</div>
        ${items.slice(0, 12).map((item) => `<div class="wallet-preview-row"><div><b>${item.description}</b><span>${item.date} - liquido ${money(item.net)} - bruto ${money(item.gross)}</span></div><strong>${money(item.net || item.gross)}</strong></div>`).join('')}
        <div class="wallet-actions"><button class="btn" id="stage12ConfirmPayrollImport">Importar ingresos</button><button class="btn danger" id="stage12CancelPayrollImport">Cancelar</button></div>
      `;
      $('stage12ConfirmPayrollImport').onclick = () => {
        const db = ensure(load());
        db.incomes.push(...items);
        db.imports.push({ id: uid(), date: today(), type: 'payroll', count: items.length });
        save(db);
        target.innerHTML = `<div class="wallet-status">Ingresos importados: ${items.length}.</div>`;
      };
      $('stage12CancelPayrollImport').onclick = () => target.innerHTML = '';
    } catch (error) {
      target.innerHTML = '<div class="wallet-status warn">No pude leer esa liquidacion. Si es una imagen escaneada, necesitaremos OCR en una siguiente etapa.</div>';
    }
  }

  function allMovements(filter = {}) {
    const db = ensure(load());
    const list = [
      ...db.expenses.map((item) => ({ ...item, kind: 'expense', amount: Number(item.amount || 0) })),
      ...db.incomes.map((item) => ({ ...item, kind: 'income', amount: Number(item.net || item.amount || 0), category: item.category || item.type || 'Ingreso' })),
      ...db.pensions.map((item) => ({ ...item, kind: 'pension', date: item.payDate, description: `Pension ${item.month}`, category: 'Pension', amount: Number(item.amount || 0) }))
    ];
    return list.filter((item) => {
      if (filter.month && ym(item.date) !== filter.month) return false;
      if (filter.category && item.category !== filter.category) return false;
      if (filter.kind && item.kind !== filter.kind) return false;
      if (filter.label && !(item.labels || []).includes(filter.label)) return false;
      return true;
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function ensureDrawer() {
    let drawer = $('walletDrawer');
    if (drawer) return drawer;
    drawer = document.createElement('div');
    drawer.id = 'walletDrawer';
    drawer.className = 'wallet-drawer';
    drawer.innerHTML = `
      <div class="wallet-sheet">
        <div class="wallet-sheet-head"><h2 id="walletDrawerTitle">Movimientos</h2><button class="wallet-close" id="walletDrawerClose">x</button></div>
        <div id="walletDrawerBody"></div>
      </div>
    `;
    document.body.appendChild(drawer);
    $('walletDrawerClose').onclick = () => drawer.style.display = 'none';
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) drawer.style.display = 'none';
    });
    return drawer;
  }

  function openMovementList(title, filter) {
    const drawer = ensureDrawer();
    $('walletDrawerTitle').textContent = title;
    const body = $('walletDrawerBody');
    const list = allMovements(filter);
    const total = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    body.innerHTML = `
      <div class="wallet-filter-bar">
        <input id="walletListSearch" placeholder="Buscar movimiento">
        <select id="walletListCategory"><option value="">Todas las categorias</option>${categories.map((cat) => `<option ${filter.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}</select>
      </div>
      <div class="wallet-status">${list.length} movimientos - ${money(total)}</div>
      <div id="walletListRows">${renderMovementRows(list)}</div>
    `;
    function refreshRows() {
      const q = norm($('walletListSearch').value);
      const selectedCategory = $('walletListCategory').value;
      const rows = allMovements({ ...filter, category: selectedCategory || filter.category || '' }).filter((item) => !q || norm(`${item.description} ${item.category} ${(item.labels || []).join(' ')}`).includes(q));
      $('walletListRows').innerHTML = renderMovementRows(rows);
      bindMovementRows(rows);
    }
    $('walletListSearch').oninput = refreshRows;
    $('walletListCategory').onchange = refreshRows;
    bindMovementRows(list);
    drawer.style.display = 'flex';
  }

  function renderMovementRows(list) {
    return list.length ? list.map((item) => `
      <div class="wallet-row">
        <button data-edit-kind="${item.kind}" data-edit-id="${item.id}">
          <b>${item.description || item.category}</b>
          <span>${item.date} - ${item.category || 'Sin categoria'}${(item.labels || []).length ? ' - ' + item.labels.join(', ') : ''}</span>
        </button>
        <strong>${money(item.amount)}</strong>
      </div>
    `).join('') : '<div class="empty">Sin movimientos para este filtro</div>';
  }

  function bindMovementRows() {
    document.querySelectorAll('[data-edit-kind]').forEach((button) => {
      button.onclick = () => openEditor(button.dataset.editKind, button.dataset.editId);
    });
  }

  function findItem(db, kind, id) {
    const map = { expense: db.expenses, income: db.incomes, pension: db.pensions };
    const list = map[kind] || [];
    return { list, item: list.find((entry) => String(entry.id) === String(id)) };
  }

  function openEditor(kind, id) {
    const db = ensure(load());
    const found = findItem(db, kind, id);
    if (!found.item || kind === 'pension') return;
    const item = found.item;
    const body = $('walletDrawerBody');
    $('walletDrawerTitle').textContent = 'Editar movimiento';
    body.innerHTML = `
      <div class="wallet-edit">
        <div class="two"><div><label>Fecha</label><input id="editDate" type="date" value="${item.date || today()}"></div><div><label>Monto</label><input id="editAmount" inputmode="numeric" value="${item.amount || item.net || 0}"></div></div>
        <div><label>Descripcion</label><input id="editDescription" value="${String(item.description || '').replace(/"/g, '&quot;')}"></div>
        <div class="two"><div><label>Categoria</label><select id="editCategory">${categories.map((cat) => `<option ${cat === (item.category || 'Otros') ? 'selected' : ''}>${cat}</option>`).join('')}</select></div><div><label>Etiquetas</label><input id="editLabels" value="${(item.labels || []).join(', ')}"></div></div>
        <button class="wallet-save" id="saveMovementEdit">Guardar cambios</button>
        <button class="wallet-delete" id="deleteMovementEdit">Eliminar movimiento</button>
      </div>
    `;
    $('saveMovementEdit').onclick = () => {
      item.date = $('editDate').value || today();
      item.description = $('editDescription').value.trim() || item.description;
      item.category = $('editCategory').value;
      item.labels = $('editLabels').value.split(',').map((label) => label.trim()).filter(Boolean);
      if (kind === 'income') {
        item.net = Math.abs(parseAmount($('editAmount').value));
        item.gross = item.gross || item.net;
      } else {
        item.amount = Math.abs(parseAmount($('editAmount').value));
      }
      save(db);
      openMovementList('Movimientos actualizados', { month: monthValue() });
    };
    $('deleteMovementEdit').onclick = () => {
      if (!confirm('Eliminar este movimiento?')) return;
      const index = found.list.findIndex((entry) => String(entry.id) === String(id));
      if (index >= 0) found.list.splice(index, 1);
      save(db);
      openMovementList('Movimientos actualizados', { month: monthValue() });
    };
  }

  function makeDashboardClickable() {
    const month = monthValue();
    document.querySelectorAll('.pro-bar-row').forEach((row) => {
      if (row.dataset.stage12Bound) return;
      row.dataset.stage12Bound = '1';
      row.onclick = () => {
        const category = row.querySelector('.pro-bar-name')?.textContent?.trim();
        if (category) openMovementList(`Gastos: ${category}`, { month, category, kind: 'expense' });
      };
    });
    document.querySelectorAll('.pro-tile').forEach((tile) => {
      if (tile.dataset.stage12Bound) return;
      tile.dataset.stage12Bound = '1';
      tile.classList.add('clickable-card');
      const label = norm(tile.textContent);
      tile.onclick = () => {
        if (label.includes('ingresos')) openMovementList('Ingresos del mes', { month, kind: 'income' });
        else if (label.includes('gastos')) openMovementList('Gastos del mes', { month, kind: 'expense' });
        else if (label.includes('tarjetas')) openMovementList('Movimientos de tarjetas', { month });
        else if (label.includes('cuentas')) openMovementList('Movimientos de cuentas', { month });
      };
    });
    document.querySelectorAll('.pro-pay').forEach((row) => {
      if (row.dataset.stage12Bound) return;
      row.dataset.stage12Bound = '1';
      row.onclick = () => openMovementList('Pagos y pensiones', { month });
    });
    document.querySelectorAll('[data-pro-import]').forEach((button) => {
      button.onclick = () => {
        document.querySelector('[data-screen="more"]')?.click();
        setTimeout(() => document.querySelector('[data-more="wallet-data"]')?.click(), 80);
      };
    });
  }

  function apply() {
    injectStyle();
    ensureDataCenter();
    bindMoreChips();
    makeDashboardClickable();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 1500));
  window.addEventListener('load', () => setTimeout(apply, 1800));
  new MutationObserver(() => {
    clearTimeout(window.__stage12Timer);
    window.__stage12Timer = setTimeout(apply, 450);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(makeDashboardClickable, 1500);
})();
