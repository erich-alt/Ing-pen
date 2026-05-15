(function () {
  const KEY = 'finanzas_pro_v2';
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }
  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
    if (typeof render === 'function') setTimeout(render, 40);
  }
  function cleanup() {
    const db = load();
    if (!Array.isArray(db.expenses)) return;
    let changed = false;
    db.expenses.forEach((item) => {
      if (String(item.category || '').toLowerCase() === 'planificado') {
        item.category = 'Hogar';
        if (String(item.description || '').toLowerCase() === 'gasto planificado') {
          item.description = 'Cuenta mensual programada';
        }
        changed = true;
      }
    });
    if (changed) save(db);
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(cleanup, 1600));
  window.addEventListener('load', () => setTimeout(cleanup, 1800));
})();
