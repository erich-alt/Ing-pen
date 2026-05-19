const rates = {
  utm: 65558,
  uf: 39120,
  clp: 1,
  ipc: 1.043,
};

const payments = [
  ["07-05-2026", "$1.384.004", "21,1108 UTM", "BancoEstado", "Khipu", "Conciliado"],
  ["08-04-2026", "$1.370.286", "21,1108 UTM", "Banco de Chile", "Webpay", "Conciliado"],
  ["10-03-2026", "$1.361.012", "21,1108 UTM", "BancoEstado", "Transferencia", "Aprobado"],
  ["15-02-2026", "$685.000", "Abono deuda", "Santander", "Comprobante", "En revision"],
];

const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const baseValue = document.querySelector("#baseValue");
const currency = document.querySelector("#currency");
const calcResult = document.querySelector("#calcResult");
const currentAmount = document.querySelector("#currentAmount");
const paymentRows = document.querySelector("#paymentRows");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modalTitle");
const modalText = document.querySelector("#modalText");

function updateAmount() {
  const value = Number(baseValue.value || 0);
  const selected = currency.value;
  const amount = value * rates[selected];
  const formatted = money.format(amount);
  calcResult.textContent = formatted;
  currentAmount.textContent = formatted;
}

function renderPayments() {
  paymentRows.innerHTML = payments
    .map(
      (row) => `
        <tr>
          ${row.map((cell) => `<td>${cell}</td>`).join("")}
        </tr>
      `
    )
    .join("");
}

function openModal(action) {
  const copy = {
    pay: [
      "Pago con Khipu",
      "Aqui se conectara la API de Khipu para iniciar una transferencia bancaria y registrar el pago automaticamente.",
    ],
    card: [
      "Pago con tarjeta",
      "Aqui se conectara Webpay, Flow u otro proveedor para permitir pago con tarjeta de credito en una cuota.",
    ],
    receipt: [
      "Carga de comprobante",
      "Aqui el alimentante podra subir comprobantes para imputarlos contra deuda, con revision del tribunal.",
    ],
  };
  const [title, text] = copy[action] || ["Accion", "Flujo pendiente de configurar."];
  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.showModal();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) openModal(button.dataset.action);
});

baseValue.addEventListener("input", updateAmount);
currency.addEventListener("change", updateAmount);

renderPayments();
updateAmount();
