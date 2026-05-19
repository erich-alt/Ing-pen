const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

const currencyFormatters = {
  CLP: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
  EUR: new Intl.NumberFormat("es-CL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }),
  UF: new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
};

const dateFormat = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const reportText = {
  es: {
    daily: "Reporte financiero diario",
    cashflow: "Reporte de flujo de caja",
    company: "Empresa",
    date: "Fecha",
    currency: "Moneda",
    fx: "Tipo de cambio usado",
    cash: "Caja actual",
    receivables: "Por cobrar",
    payables: "Por pagar",
    cards: "Tarjetas por pagar",
    investments: "Inversiones",
    checks: "Cheques sin plazo",
    iva: "IVA estimado",
    projected: "Caja proyectada 60 dias",
    indicators: "Indicadores financieros",
    signal: "Senal",
    detail: "Detalle",
    income: "Ingresos",
    outcome: "Egresos",
    balance: "Saldo",
    period: "Periodo"
  },
  pt: {
    daily: "Relatorio financeiro diario",
    cashflow: "Relatorio de fluxo de caixa",
    company: "Empresa",
    date: "Data",
    currency: "Moeda",
    fx: "Cambio utilizado",
    cash: "Caixa atual",
    receivables: "A receber",
    payables: "A pagar",
    cards: "Cartoes a pagar",
    investments: "Investimentos",
    checks: "Cheques sem prazo",
    iva: "IVA estimado",
    projected: "Caixa projetado 60 dias",
    indicators: "Indicadores financeiros",
    signal: "Sinal",
    detail: "Detalhe",
    income: "Entradas",
    outcome: "Saidas",
    balance: "Saldo",
    period: "Periodo"
  },
  en: {
    daily: "Daily financial report",
    cashflow: "Cash flow report",
    company: "Company",
    date: "Date",
    currency: "Currency",
    fx: "Exchange rate used",
    cash: "Current cash",
    receivables: "Receivables",
    payables: "Payables",
    cards: "Credit cards payable",
    investments: "Investments",
    checks: "Checks without due date",
    iva: "Estimated VAT",
    projected: "Projected cash 60 days",
    indicators: "Financial indicators",
    signal: "Signal",
    detail: "Detail",
    income: "Income",
    outcome: "Outflows",
    balance: "Balance",
    period: "Period"
  }
};

let state = null;
let selectedCreditId = null;
let selectedAccountId = null;
let selectedCardId = null;
let selectedInvestmentId = null;
let lastBankSyncMinute = "";
let lastCardSyncMinute = "";
const localStateKey = "pyme-local-state-v2";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const companyDataKeys = [
  "company",
  "settings",
  "bankAccounts",
  "receivables",
  "payables",
  "credits",
  "documents",
  "activityLog",
  "checksReceivable",
  "checksPayable",
  "creditCards",
  "investments"
];

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  return value ? dateFormat.format(parseDate(value)) : "Plazo desconocido";
}

function formatCurrency(amount, currency = "CLP") {
  if (currency === "UF") return `${currencyFormatters.UF.format(Number(amount || 0))} UF`;
  return (currencyFormatters[currency] || money).format(Number(amount || 0));
}

function currentMonth() {
  return isoDate(todayLocal()).slice(0, 7);
}

function daysBetween(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return null;
  return Math.max(0, Math.round((endDate - startDate) / 86400000));
}

function plazoLabel(item) {
  const days = daysBetween(item.issueDate, item.dueDate);
  return days === null ? "Sin plazo" : `${days} dias`;
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function defaultCompanyData(name = "Nueva empresa", rut = "") {
  return {
    company: { name, rut, currency: "CLP" },
    settings: {
      cashflowDays: 60,
      bankSyncTime: "08:30",
      cardSyncTime: "08:45",
    lastBankSync: null,
    lastCardSync: null,
    lastDailyRun: null,
    lastSiiSync: null,
      economicIndicators: state?.settings?.economicIndicators || {
        uf: 39000,
        usd: 950,
        eur: 1030,
        utm: 68000,
        source: "referencial",
        updatedAt: null
      }
    },
    bankAccounts: [],
    receivables: [],
    payables: [],
    credits: [],
    documents: { sales: [], purchases: [] },
    activityLog: [{
      id: id("log"),
      date: new Date().toISOString(),
      message: "Empresa creada."
    }],
    checksReceivable: [],
    checksPayable: [],
    creditCards: [],
    investments: []
  };
}

function extractCompanyData() {
  return Object.fromEntries(companyDataKeys.map((key) => [key, clone(state[key])]));
}

function applyCompanyData(data) {
  const fallback = defaultCompanyData();
  for (const key of companyDataKeys) {
    state[key] = clone(data?.[key] ?? fallback[key]);
  }
}

function activeCompanyRecord() {
  return (state.companies || []).find((company) => company.id === state.activeCompanyId);
}

function persistActiveCompanyData() {
  const active = activeCompanyRecord();
  if (!active) return;
  active.name = state.company?.name || active.name;
  active.rut = state.company?.rut || active.rut;
  active.data = extractCompanyData();
}

function ensureCompanies() {
  if (!state.companies?.length) {
    const companyId = id("company");
    state.companies = [{
      id: companyId,
      name: state.company?.name || "Empresa principal",
      rut: state.company?.rut || "",
      data: extractCompanyData()
    }];
    state.activeCompanyId = companyId;
  }

  state.activeCompanyId = state.activeCompanyId || state.companies[0].id;
  const active = activeCompanyRecord() || state.companies[0];
  state.activeCompanyId = active.id;
  applyCompanyData(active.data);
}

function pending(items) {
  return items.filter((item) => !["pagada", "pagado", "cobrado", "depositado", "rescatada", "cerrada"].includes(item.status));
}

function total(items, selector = (item) => item.amount) {
  return items.reduce((sum, item) => sum + Number(selector(item) || 0), 0);
}

function documentKey(doc) {
  return [doc.type, doc.folio, doc.rut || doc.counterparty, doc.date].join("|").toLowerCase();
}

function documentsForMonth(items, month) {
  return items.filter((doc) => (doc.date || "").slice(0, 7) === month);
}

function documentsForYear(items, year) {
  return items.filter((doc) => (doc.date || "").slice(0, 4) === String(year));
}

function documentBaseAmount(doc) {
  const base = Number(doc.net || 0) + Number(doc.exempt || 0);
  return base || Math.max(0, Number(doc.total || 0) - Number(doc.tax || 0));
}

function yearFromMonth(month = currentMonth()) {
  return String(month).slice(0, 4);
}

function nextMonthDate(month = currentMonth(), day = 19) {
  const [year, monthNumber] = month.split("-").map(Number);
  return isoDate(new Date(year, monthNumber, day));
}

function monthStartDate(month = currentMonth()) {
  return `${month}-01`;
}

function monthEndDate(month = currentMonth()) {
  const [year, monthNumber] = month.split("-").map(Number);
  return isoDate(new Date(year, monthNumber, 0));
}

function ivaPeriodLabel(month = currentMonth()) {
  return `${formatDate(monthStartDate(month))} al ${formatDate(monthEndDate(month))}`;
}

function ivaPaymentLabel(month = currentMonth()) {
  return `Antes del 20: ${formatDate(nextMonthDate(month, 19))}`;
}

function toClp(amount, currency = "CLP") {
  const indicators = state?.settings?.economicIndicators || {};
  const value = Number(amount || 0);
  if (currency === "USD") return value * Number(indicators.usd || 0);
  if (currency === "EUR") return value * Number(indicators.eur || 0);
  if (currency === "UF") return value * Number(indicators.uf || 0);
  return value;
}

function fromClp(amount, currency = "CLP") {
  const indicators = state?.settings?.economicIndicators || {};
  const value = Number(amount || 0);
  if (currency === "USD") return value / Number(indicators.usd || 1);
  if (currency === "EUR") return value / Number(indicators.eur || 1);
  if (currency === "UF") return value / Number(indicators.uf || 1);
  return value;
}

function fxLabel(currency) {
  const indicators = state?.settings?.economicIndicators || {};
  if (currency === "USD") return `1 USD = ${money.format(indicators.usd || 0)}`;
  if (currency === "EUR") return `1 EUR = ${money.format(indicators.eur || 0)}`;
  if (currency === "UF") return `1 UF = ${money.format(indicators.uf || 0)}`;
  return "CLP";
}

function reportAmount(clpValue, currency) {
  return formatCurrency(fromClp(clpValue, currency), currency);
}

function baseBalance() {
  return total(state.bankAccounts, (account) => toClp(account.balance, account.currency || "CLP"));
}

function creditLineUsed(account) {
  return Math.max(0, -Number(account.balance || 0));
}

function creditLineAvailable(account) {
  return Math.max(0, Number(account.creditLineLimit || 0) - creditLineUsed(account));
}

function totalCreditLineAvailable() {
  return total(state.bankAccounts || [], (account) => toClp(creditLineAvailable(account), account.currency || "CLP"));
}

function flowDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return "";
  return parsed < todayLocal() ? isoDate(todayLocal()) : value;
}

function flowDetail(date, fallback = "") {
  const parsed = parseDate(date);
  if (!parsed) return fallback;
  return parsed < todayLocal() ? `Vencido desde ${formatDate(date)}` : fallback;
}

function investmentTypeLabel(type) {
  return {
    deposito_plazo: "Deposito a plazo",
    pacto: "Pacto",
    fondo_mutuo: "Fondo mutuo"
  }[type] || "Inversion";
}

function investmentMaturityDate(investment) {
  if (investment.maturityDate) return investment.maturityDate;
  const days = Number(investment.days || 0);
  const start = parseDate(investment.startDate);
  if (!start || days <= 0) return "";
  return isoDate(addDays(start, days));
}

function investmentInterest(investment) {
  const amount = Number(investment.amount || 0);
  if (investment.type === "fondo_mutuo") {
    const current = Number(investment.rescueAmount || investment.currentValue || 0);
    return current ? current - amount : 0;
  }

  const days = Number(investment.days || 0);
  const rate = Number(investment.rate || 0) / 100;
  if (!amount || !days || !rate) return 0;
  const period = investment.rateType === "annual" ? days / 360 : days / 30;
  return amount * rate * period;
}

function investmentMaturityValue(investment) {
  if (investment.rescueAmount) return Number(investment.rescueAmount || 0);
  if (investment.type === "fondo_mutuo" && Number(investment.currentValue || 0)) {
    return Number(investment.currentValue || 0);
  }
  return Number(investment.amount || 0) + investmentInterest(investment);
}

function investmentsClpValue(items = state.investments || []) {
  return total(pending(items), (investment) => toClp(investmentMaturityValue(investment), investment.currency || "CLP"));
}

function accountOptions(selectedId = "") {
  return (state.bankAccounts || []).map((account) => `
    <option value="${account.id}" ${account.id === selectedId ? "selected" : ""}>
      ${account.bank} - ${account.name} (${account.currency || "CLP"})
    </option>
  `).join("");
}

function postAccountMovement(accountId, amount, currency, description, document = "", date = isoDate(todayLocal())) {
  const account = (state.bankAccounts || []).find((item) => item.id === accountId);
  if (!account) return false;
  const accountCurrency = account.currency || "CLP";
  const clpAmount = toClp(amount, currency || accountCurrency);
  const accountAmount = fromClp(clpAmount, accountCurrency);
  account.balance = Number(account.balance || 0) + accountAmount;
  account.movements = account.movements || [];
  account.movements.unshift({
    id: id("mov"),
    date,
    description,
    document,
    amount: accountAmount,
    balance: account.balance,
    source: "inversion",
    matchedTo: null
  });
  return true;
}

function investmentMonthlyReturn(investment) {
  const amount = Number(investment.amount || 0);
  const gain = Number(investment.rescueGain ?? investmentInterest(investment));
  const start = investment.startDate;
  const end = investment.rescueDate || isoDate(todayLocal());
  const days = Math.max(1, daysBetween(start, end) || Number(investment.days || 30) || 30);
  const months = Math.max(days / 30, 1 / 30);
  return {
    amount: gain / months,
    rate: amount ? (gain / amount / months) * 100 : 0,
    days
  };
}

function addLog(message) {
  state.activityLog = state.activityLog || [];
  state.activityLog.unshift({
    id: id("log"),
    date: new Date().toISOString(),
    message
  });
}

function migrateState() {
  const incomingSettings = clone(state.settings || {});
  ensureCompanies();

  state.settings = {
    cashflowDays: 60,
    bankSyncTime: "08:30",
    cardSyncTime: "08:45",
    lastBankSync: null,
    lastCardSync: null,
    lastDailyRun: null,
    economicIndicators: {
      uf: 39000,
      usd: 950,
      eur: 1030,
      utm: 68000,
      source: "referencial",
      updatedAt: null
    },
    ...state.settings
  };
  state.settings = {
    ...state.settings,
    ...incomingSettings,
    economicIndicators: {
      ...(state.settings.economicIndicators || {}),
      ...(incomingSettings.economicIndicators || {})
    }
  };

  state.bankAccounts = (state.bankAccounts || []).map((account) => ({
    currency: "CLP",
    movements: [],
    creditLineLimit: 0,
    creditLineRate: 0,
    ...account
  }));

  state.receivables = (state.receivables || []).map((item) => ({
    item: "Ventas",
    ...item
  }));

  state.payables = (state.payables || []).map((item) => ({
    item: item.document?.toLowerCase().includes("arriendo") ? "Arriendo" : "Materia prima",
    ...item
  }));

  state.checksReceivable = state.checksReceivable || [
    {
      id: "chk-in-1",
      client: "Cliente Norte SpA",
      detail: "Cheque recibido por anticipo",
      dueDate: "2026-05-28",
      amount: 950000,
      status: "pendiente"
    }
  ];

  state.checksPayable = state.checksPayable || [
    {
      id: "chk-out-1",
      supplier: "Proveedor Servicios TI",
      detail: "Cheque entregado",
      dueDate: "",
      amount: 480000,
      status: "pendiente"
    }
  ];

  state.creditCards = state.creditCards || [
    {
      id: "card-1",
      issuer: "Banco de Chile",
      name: "Visa Empresas",
      last4: "1234",
      creditLimit: 5000000,
      paymentDueDate: "2026-06-10",
      lastSync: null,
      movements: [
        {
          id: "card-mov-1",
          date: "2026-05-07",
          merchant: "Proveedor Insumos",
          description: "Compra materiales",
          amount: 420000,
          classification: "costo",
          status: "pendiente"
        },
        {
          id: "card-mov-2",
          date: "2026-05-08",
          merchant: "Software mensual",
          description: "Suscripcion operacional",
          amount: 89000,
          classification: "gasto",
          status: "pendiente"
        }
      ]
    }
  ];

  state.creditCards = state.creditCards.map((card) => ({
    creditLimitClp: Number(card.creditLimitClp ?? card.creditLimit ?? 0),
    creditLimitUsd: Number(card.creditLimitUsd ?? 0),
    ...card
  }));

  state.investments = (state.investments || []).map((investment) => ({
    ...investment,
    id: investment.id || id("inv"),
    type: investment.type || "deposito_plazo",
    institution: investment.institution || "",
    name: investment.name || investmentTypeLabel(investment.type),
    currency: investment.currency || "CLP",
    amount: Number(investment.amount || 0),
    startDate: investment.startDate || isoDate(todayLocal()),
    days: Number(investment.days || 0),
    rate: Number(investment.rate || 0),
    rateType: investment.rateType || "annual",
    currentValue: Number(investment.currentValue || 0),
    fundingAccountId: investment.fundingAccountId || "",
    rescueAccountId: investment.rescueAccountId || investment.fundingAccountId || "",
    rescueAmount: Number(investment.rescueAmount || 0),
    rescueDate: investment.rescueDate || "",
    rescueGain: Number(investment.rescueGain || 0),
    cashOutPosted: Boolean(investment.cashOutPosted),
    cashInPosted: Boolean(investment.cashInPosted),
    status: investment.status || "activa"
  }));

  persistActiveCompanyData();
}

function creditInstallments() {
  return state.credits.flatMap((credit) =>
    credit.installments.map((installment) => ({
      ...installment,
      creditId: credit.id,
      creditName: credit.name,
      bank: credit.bank
    }))
  );
}

function datedChecks(checks, type) {
  return pending(checks)
    .filter((check) => check.dueDate)
    .map((check) => ({
      date: check.dueDate,
      label: `${type === "in" ? check.client : check.supplier} - ${check.detail}`,
      amount: type === "in" ? Number(check.amount) : -Number(check.amount),
      type
    }));
}

function cardPaymentEvents() {
  return (state.creditCards || []).flatMap((card) => {
    const payable = pending(card.movements || []);
    const amount = total(paya