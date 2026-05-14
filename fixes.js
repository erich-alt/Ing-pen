/* Parches de compatibilidad iPhone / impuestos / años. */
(function () {
  const PATCH_VERSION = 'tax-year-fix-2026-05-14-1';
  const TAX_TABLE = [
    { from: 0, to: 13.5, rate: 0, rebate: 0 },
    { from: 13.5, to: 30, rate: 0.04, rebate: 0.54 },
    { from: 30, to: 50, rate: 0.08, rebate: 1.74 },
    { from: 50, to: 70, rate: 0.135, rebate: 4.49 },
    { from: 70, to: 90, rate: 0.23, rebate: 11.14 },
    { from: 90, to: 120, rate: 0.304, rebate: 17.8 },
    { from: 120, to: 310, rate: 0.35, rebate: 23.32 },
    { from: 310, to: Infinity, rate: 0.4, rebate: 38.82 }
  ];

  const $ = (id) => document.getElementById(id);
  const n = (value) => Number(value || 0) || 0;
  const yearFromDate = (date) => {
    const match = String(date || '').match(/(20\d{2})/);
    return match ? Number(match[1]) : null;
  };
  const norm = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const money = (value) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Math.round(n(value)));

  function appState() {
    try {
      if (typeof state !== 'undefined' && state && Array.isArray(state.entries)) return state;
    } catch (error) {}
    return null;
  }

  function entryDescription(entry) {
    return entry.description || entry.desc || entry.name || entry.glosa || '';
  }

  function entryDate(entry) {
    return entry.date || entry.paymentDate || entry.fecha || entry.period || '';
  }

  function isBonus(entry) {
    const type = norm(entry.type);
    const desc = norm(entryDescription(entry));
    return type.includes('BONUS') || type.includes('BONO') || desc.includes('BONO');
  }

  function isPension(entry) {
    const type = norm(entry.type);
    const desc = norm(entryDescription(entry));
    return type.includes('PENSION') || desc.includes('PENSION');
  }

  function taxYearFor(entry) {
    const explicit = Number(entry.taxYear || entry.anoRenta || entry.rentaYear || 0);
    if (explicit) return explicit;
    const paidYear = yearFromDate(entryDate(entry));
    if (!paidYear) return null;
    return isBonus(entry) ? paidYear - 1 : paidYear;
  }

  function amount(entry, keys) {
    for (const key of keys) {
      if (entry[key] !== undefined && entry[key] !== null && entry[key] !== '') return n(entry[key]);
    }
    return 0;
  }

  function normalizeImportedBonusYears() {
    const s = appState();
    if (!s) return false;
    let changed = false;
    s.entries.forEach((entry) => {
      if (!isBonus(entry)) return;
      const paidYear = yearFromDate(entryDate(entry));
      if (!paidYear) return;
      const currentTaxYear = Number(entry.taxYear || 0);
      if (!currentTaxYear || currentTaxYear >= paidYear) {
        entry.taxYear = paidYear - 1;
        changed = true;
      }
    });
    if (changed) {
      try {
        if (typeof saveToDb === 'function') saveToDb(s);
        localStorage.setItem('ingresos_v4', JSON.stringify(s));
      } catch (error) {}
    }
    return changed;
  }

  function collectYears() {
    const years = new Set([2023, 2024, 2025, 2026, new Date().getFullYear()]);
    const s = appState();
    if (s) {
      s.entries.forEach((entry) => {
        const paidYear = yearFromDate(entryDate(entry));
        const taxYear = taxYearFor(entry);
        if (paidYear) years.add(paidYear);
        if (taxYear) years.add(taxYear);
      });
    }
    return [...years].filter(Boolean).sort((a, b) => b - a);
  }

  function extendYearSelects() {
    const years = collectYears();
    ['taxYear', 'dashYear', 'taxYearPanel'].forEach((id) => {
      const select = $(id);
      if (!select) return;
      const previous = select.value;
      const existing = new Set([...select.options].map((option) => Number(option.value)));
      years.forEach((year) => {
        if (!existing.has(year)) {
          const option = document.createElement('option');
          option.value = String(year);
          option.textContent = String(year);
          select.appendChild(option);
        }
      });
      [...select.options]
        .sort((a, b) => Number(b.value) - Number(a.value))
        .forEach((option) => select.appendChild(option));
      if (previous) select.value = previous;
    });
  }

  function calculateAnnualTax(baseClp, utmValue) {
    const utaValue = Math.max(n(utmValue) * 12, 1);
    const baseUta = n(baseClp) / utaValue;
    const bracket = TAX_TABLE.find((row) => baseUta > row.from && baseUta <= row.to) || TAX_TABLE[0];
    const taxUta = Math.max(0, baseUta * bracket.rate - bracket.rebate);
    return {
      baseUta,
      utaValue,
      annualTax: Math.max(0, taxUta * utaValue)
    };
  }

  function selectedTaxYear() {
    return Number(($('taxYearPanel') && $('taxYearPanel').value) || ($('taxYear') && $('taxYear').value) || new Date().getFullYear());
  }

  function entriesForTaxYear(year) {
    const s = appState();
    if (!s) return [];
    return s.entries.filter((entry) => !isPension(entry) && taxYearFor(entry) === year);
  }

  function updateTaxPanel() {
    const s = appState();
    if (!s) return;
    const year = selectedTaxYear();
    const entries = entriesForTaxYear(year);
    const settings = s.settings || {};
    const utmValue = n(settings.utmValue || ($('utmValue') && $('utmValue').value) || 69400);
    const extraCredits = n(settings.extraCredits || ($('extraCredits') && $('extraCredits').value));

    const base = entries.reduce((sum, entry) => sum + amount(entry, ['taxable', 'baseTributable', 'taxBase', 'gross', 'amount']), 0);
    const bonus = entries.filter(isBonus).reduce((sum, entry) => sum + amount(entry, ['taxable', 'baseTributable', 'gross', 'net', 'amount']), 0);
    const retained = entries.reduce((sum, entry) => sum + amount(entry, ['tax', 'retainedTax', 'impuesto', 'taxPaid']), 0);
    const result = calculateAnnualTax(base, utmValue);
    let balance = result.annualTax - retained - extraCredits;
    const maxRecoverable = retained + extraCredits;
    if (balance < -maxRecoverable) balance = -maxRecoverable;

    if ($('taxTitle')) $('taxTitle').textContent = `Renta ${year} - declaración ${year + 1}`;
    if ($('taxBase')) $('taxBase').textContent = money(base);
    if ($('taxBonus')) $('taxBonus').textContent = money(bonus);
    if ($('taxCalc')) $('taxCalc').textContent = money(result.annualTax);
    if ($('taxPay')) $('taxPay').textContent = money(balance);

    const detail = $('taxDetail');
    if (detail) {
      detail.innerHTML = `
        <div class="list-item"><div><div class="list-label">Base en UTA</div><div class="list-sub">UTA estimada: ${money(result.utaValue)}</div></div><div class="list-value">${result.baseUta.toFixed(2)} UTA</div></div>
        <div class="list-item"><div><div class="list-label">Impuesto retenido</div><div class="list-sub">Crédito por impuesto único de segunda categoría</div></div><div class="list-value">${money(retained)}</div></div>
        <div class="list-item"><div><div class="list-label">Créditos adicionales</div><div class="list-sub">Editable en supuestos</div></div><div class="list-value">${money(extraCredits)}</div></div>
        <div class="list-item"><div><div class="list-label">Tope de devolución</div><div class="list-sub">No puede superar impuestos retenidos más créditos</div></div><div class="list-value">${money(maxRecoverable)}</div></div>
        <div class="list-item"><div><div class="list-label">Fuente anual</div><div class="list-sub">Sueldos del año y bonos asignados al año renta correcto</div></div><div class="list-value">${entries.length} registros</div></div>
      `;
    }
  }

  function fixVisibleSpanish() {
    const replacements = [
      [/\bAno\b/g, 'Año'],
      [/\bano\b/g, 'año'],
      [/declaracion/g, 'declaración'],
      [/Declaracion/g, 'Declaración'],
      [/\bpension\b/g, 'pensión'],
      [/\bPension\b/g, 'Pensión'],
      [/Credito/g, 'Crédito'],
      [/Creditos/g, 'Créditos'],
      [/Liquido/g, 'Líquido'],
      [/Analisis/g, 'Análisis']
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue;
      replacements.forEach(([from, to]) => { text = text.replace(from, to); });
      node.nodeValue = text;
    });
    document.title = 'Control Ingresos';
  }

  let applying = false;
  function applyAll() {
    if (applying) return;
    applying = true;
    try {
      normalizeImportedBonusYears();
      extendYearSelects();
      updateTaxPanel();
      fixVisibleSpanish();
    } finally {
      applying = false;
    }
  }

  function scheduleApply() {
    setTimeout(applyAll, 40);
  }

  document.addEventListener('DOMContentLoaded', scheduleApply);
  window.addEventListener('load', scheduleApply);
  document.addEventListener('change', (event) => {
    if (event.target && ['taxYear', 'dashYear', 'taxYearPanel', 'utmValue', 'extraCredits'].includes(event.target.id)) scheduleApply();
  }, true);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__ingresosPatchTimer);
    window.__ingresosPatchTimer = setTimeout(applyAll, 120);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.ingresosPatchVersion = PATCH_VERSION;
  scheduleApply();
})();
