import { formatInr } from "./finance";
import { formatWhen } from "./time";
import type { Workspace } from "./types";
import { nameById, plateById, tripBalance, tripExpensePaise, tripFuelPaise, tripPaid } from "./view";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function printTripSheet(data: Workspace, tripId: string) {
  const trip = data.trips.find((row) => row.id === tripId);
  if (!trip) return;
  const fuel = data.fuel.filter((row) => row.tripId === trip.id);
  const expenses = data.expenses.filter((row) => row.tripId === trip.id);
  const popup = window.open("", "_blank", "width=900,height=760");
  if (!popup) {
    window.alert("Allow pop-ups to print the trip sheet.");
    return;
  }
  const rows = [
    ...fuel.map((row) => `<tr><td>Fuel</td><td>${escapeHtml(row.vendorName || row.notes || "—")}</td><td>${formatInr(row.totalPaise)}</td></tr>`),
    ...expenses.map(
      (row) => `<tr><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.description || row.vendorName || "—")}</td><td>${formatInr(row.amountPaise)}</td></tr>`,
    ),
  ];
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(trip.tripNumber)} · Sonu Transport</title>
    <style>
      body{font:14px Inter,Arial,sans-serif;color:#133336;margin:36px}
      header{display:flex;justify-content:space-between;border-bottom:3px solid #285f6b;padding-bottom:14px}
      h1{font:600 32px "Iowan Old Style",Georgia,serif;margin:0;color:#010001}
      h2{font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:#285f6b;margin:28px 0 8px}
      table{border-collapse:collapse;width:100%;margin:8px 0 4px}
      td,th{border:1px solid #d3e0e3;padding:8px 10px;text-align:left;vertical-align:top}
      th{width:24%;background:#f4f8f8;font-weight:600}
      .total{font-size:20px;font-weight:700}
      .sign{display:flex;justify-content:space-between;margin-top:64px}
      .muted{color:#285f6b;font-size:12px}
      @media print { button{display:none} body{margin:12mm} }
    </style></head><body>
    <header><div><h1>Sonu Transport</h1><p>Trip sheet / bilty</p></div><div><strong>${escapeHtml(trip.tripNumber)}</strong><p>${escapeHtml(formatWhen(trip.departure))}</p></div></header>
    <h2>Journey</h2>
    <table>
      <tr><th>Customer</th><td>${escapeHtml(nameById(data.customers, trip.customerId))}</td><th>Phone</th><td>${escapeHtml(data.customers.find((row) => row.id === trip.customerId)?.phone || "—")}</td></tr>
      <tr><th>From</th><td>${escapeHtml(trip.origin)}</td><th>To</th><td>${escapeHtml(trip.destination)}</td></tr>
      <tr><th>Departure</th><td>${escapeHtml(formatWhen(trip.departure))}</td><th>Expected arrival</th><td>${escapeHtml(formatWhen(trip.arrival))}</td></tr>
      <tr><th>Truck</th><td>${escapeHtml(plateById(data.trucks, trip.truckId))}</td><th>Driver</th><td>${escapeHtml(nameById(data.drivers, trip.driverId))}</td></tr>
      <tr><th>Goods</th><td>${escapeHtml(trip.goods || "—")}${trip.weightValue != null ? ` · ${trip.weightValue} ${escapeHtml(trip.weightUnit)}` : ""}</td><th>Status</th><td>${escapeHtml(trip.status)}</td></tr>
    </table>
    <h2>Freight</h2>
    <table>
      <tr><th>Freight</th><td>${formatInr(trip.freightPaise)}</td><th>Recorded receipts</th><td>${formatInr(tripPaid(data, trip.id))}</td></tr>
      <tr><th>Trip balance</th><td class="total">${formatInr(tripBalance(data, trip))}</td><th>Direct costs</th><td>${formatInr(tripFuelPaise(data, trip.id) + tripExpensePaise(data, trip.id))}</td></tr>
    </table>
    <h2>Costs on this trip</h2>
    <table><tr><th>Category</th><th>Note</th><th>Amount</th></tr>${rows.length ? rows.join("") : `<tr><td colspan="3">No trip costs recorded</td></tr>`}</table>
    <p class="muted">${escapeHtml(data.company.legalName)} · ${escapeHtml(data.company.address || "India")} · Figures come from the company register. Confirm them against original receipts.</p>
    <div class="sign"><span>Customer signature ______________</span><span>Authorized signature ______________</span></div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
  popup.document.close();
}

export function printStatement(data: Workspace, customerId: string) {
  const customer = data.customers.find((row) => row.id === customerId);
  if (!customer) return;
  const invoices = data.invoices.filter((row) => row.customerId === customerId && row.status !== "void");
  const payments = data.payments.filter((row) => row.customerId === customerId && row.direction === "in");
  const popup = window.open("", "_blank", "width=900,height=760");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(customer.name)} statement</title>
    <style>body{font:14px Arial;color:#133336;margin:36px}h1{font:600 28px Georgia;margin:0}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #d3e0e3;padding:8px;text-align:left}th{background:#f4f8f8}</style>
    </head><body><h1>${escapeHtml(data.company.displayName)}</h1><p>Customer statement · ${escapeHtml(customer.name)}</p>
    <table><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Status</th></tr>
    ${invoices.map((row) => `<tr><td>${escapeHtml(row.invoiceNumber)}</td><td>${escapeHtml(row.issueDate)}</td><td>${formatInr(row.totalPaise)}</td><td>${escapeHtml(row.status)}</td></tr>`).join("")}
    </table>
    <table><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Method</th></tr>
    ${payments.map((row) => `<tr><td>${escapeHtml(row.reference || row.kind)}</td><td>${escapeHtml(row.paymentDate)}</td><td>${formatInr(row.amountPaise)}</td><td>${escapeHtml(row.method)}</td></tr>`).join("")}
    </table><script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}
