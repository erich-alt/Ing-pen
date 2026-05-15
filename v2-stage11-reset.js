(function () {
  const KEY = 'finanzas_pro_v2';
  const $ = (id) => document.getElementById(id);

  function injectStyle() {
    if ($('stage11Style')) return;
    const style = document.createElement('style');
    style.id = 'stage11Style';
    style.textContent = `
      .reset-card{background:#fff;border:1px solid #fecdd3;border-radius:8px;padding:14px;margin-top:12px;box-shadow:0 8px 20px rgba(190,18,60,.08)}
      .reset-card h2{font-size:17px;margin:0 0 8px;color:#9f1239}
      .reset-card p{margin:0 0 12px;color:#687672;font-size:13px;line-height:1.35}
      .reset-backdrop{position:fixed;inset:0;z-index:100;background:rgba(15,23,20,.48);display:none;align-items:flex-end;justify-content:center}
      .reset-modal{width:100%;max-width:520px;background:#fff;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -18px 40px rgba(0,0,0,.22)}
      .reset-modal h2{font-size:20px;margin:0 0 8px;color:#9f1239}
      .reset-modal p{font-size:14px;color:#4b5a56;line-height:1.4;margin:0 0 12px}
      .reset-check{display:flex;gap:10px;align-items:flex-start;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px;margin-bottom:12px}
      .reset-check input{width:22px;min-height:22px;margin-top:1px}
      .reset-check label{margin:0;font-size:13px;line-height:1.35;color:#7c2d12}
      .reset-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .reset-actions button{min-height:48px;border-radius:8px;font-weight:950;border:1px solid #dfe8e3;background:#fff;color:#0b5f59}
      .reset-actions .danger{background:#be123c;color:#fff;border-color:#be123c}
      .reset-actions .danger:disabled{opacity:.45}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = $('resetAllModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'resetAllModal';
    modal.className = 'reset-backdrop';
    modal.innerHTML = `
      <div class="reset-modal" role="dialog" aria-modal="true">
        <h2>Borrar toda la informacion</h2>
        <p>Esto elimina los ingresos, gastos, pensiones, autos, seguros, importaciones y sincronizaciones guardadas en este dispositivo.</p>
        <div class="reset-check">
          <input id="resetAllCheck" type="checkbox">
          <label for="resetAllCheck">Entiendo que se borrara la informacion local de esta app. Si necesito conservarla, primero debo descargar un respaldo.</label>
        </div>
        <div class="reset-actions">
          <button id="resetAllCancel">Cancelar</button>
          <button class="danger" id="resetAllConfirm" disabled>Borrar todo</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    $('resetAllCancel').onclick = closeModal;
    $('resetAllCheck').onchange = () => {
      $('resetAllConfirm').disabled = !$('resetAllCheck').checked;
    };
    $('resetAllConfirm').onclick = () => {
      const ok = confirm('Confirmacion final: borrar toda la informacion local de Finanzas Pro en este dispositivo?');
      if (!ok) return;
      localStorage.setItem(KEY, JSON.stringify({
        incomes: [],
        expenses: [],
        pensions: [],
        vehicles: [],
        insurance: [],
        accounts: [],
        cards: [],
        plans: [],
        imports: [],
        walletSync: {},
        settings: { resetAt: new Date().toISOString() }
      }));
      sessionStorage.setItem('stage2-demo-v1', '1');
      window.location.reload();
    };
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    return modal;
  }

  function openModal() {
    const modal = ensureModal();
    const check = $('resetAllCheck');
    if (check) check.checked = false;
    const confirmButton = $('resetAllConfirm');
    if (confirmButton) confirmButton.disabled = true;
    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = $('resetAllModal');
    if (modal) modal.style.display = 'none';
  }

  function ensureResetCard() {
    const reports = $('more-reports');
    if (!reports || $('resetAllCard')) return;
    const card = document.createElement('div');
    card.id = 'resetAllCard';
    card.className = 'reset-card';
    card.innerHTML = `
      <h2>Borrar toda la app</h2>
      <p>Usalo solo cuando quieras partir desde cero en este dispositivo. Antes puedes descargar un respaldo.</p>
      <button class="btn danger" id="resetAllData">Borrar toda la informacion</button>
    `;
    reports.appendChild(card);
    $('resetAllData').onclick = openModal;
  }

  function bindLegacyButton() {
    const legacy = $('clearData');
    if (legacy && !legacy.dataset.resetBound) {
      legacy.dataset.resetBound = '1';
      legacy.textContent = 'Borrar toda la informacion';
      legacy.onclick = openModal;
    }
  }

  function apply() {
    injectStyle();
    ensureModal();
    ensureResetCard();
    bindLegacyButton();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 1200));
  window.addEventListener('load', () => setTimeout(apply, 1400));
  new MutationObserver(() => {
    clearTimeout(window.__stage11Timer);
    window.__stage11Timer = setTimeout(apply, 350);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
