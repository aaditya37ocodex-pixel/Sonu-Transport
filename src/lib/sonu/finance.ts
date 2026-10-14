/** Money, availability, and ledger rules. Amounts are integer paise. */

export const ACTIVE_TRIP_STATUSES = ["booked", "in_progress"] as const;

export type TruckLiveStatus =
  | "archived"
  | "on_trip"
  | "maintenance"
  | "booked"
  | "hold"
  | "available";

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) {
    throw new Error("Enter a valid amount.");
  }
  return Math.round(rupees * 100);
}

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function invoiceTaxPaise(subtotalPaise: number, taxBps: number): number {
  if (subtotalPaise < 0 || taxBps < 0) throw new Error("Tax inputs cannot be negative.");
  return Math.round((subtotalPaise * taxBps) / 10000);
}

export function tripWindow(departureMs: number, arrivalMs: number | null): { start: number; end: number } {
  const end = arrivalMs != null && arrivalMs > departureMs ? arrivalMs : departureMs + 24 * 60 * 60 * 1000;
  return { start: departureMs, end };
}

/** Half-open overlap: a trip ending exactly when the next starts is allowed. */
export function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export function customerOutstandingPaise(input: {
  invoices: { totalPaise: number; status: string }[];
  adjustmentsPaise: number;
  incomingPaymentsPaise: number;
}): number {
  const invoiced = input.invoices
    .filter((invoice) => invoice.status !== "void")
    .reduce((sum, invoice) => sum + invoice.totalPaise, 0);
  return invoiced + input.adjustmentsPaise - input.incomingPaymentsPaise;
}

/** Null when freight is not recognized (draft or cancelled). Fuel is never included in expenses. */
export function tripContributionPaise(
  freightPaise: number,
  status: string,
  fuelPaise: number,
  expensePaise: number,
): number | null {
  if (status === "draft" || status === "cancelled") return null;
  return freightPaise - fuelPaise - expensePaise;
}

export function invoiceLifecycle(
  totalPaise: number,
  allocatedPaise: number,
  voided: boolean,
): "void" | "paid" | "partial" | "issued" {
  if (voided) return "void";
  if (allocatedPaise >= totalPaise) return "paid";
  if (allocatedPaise > 0) return "partial";
  return "issued";
}

export function deriveTruckStatus(input: {
  archived: boolean;
  hold: boolean;
  now: number;
  trips: { status: string; start: number; end: number }[];
  maintenance: { start: number; end: number }[];
}): TruckLiveStatus {
  if (input.archived) return "archived";
  const point = (start: number, end: number) => overlaps(start, end, input.now, input.now + 1);
  const live = input.trips.filter(
    (trip) =>
      (trip.status === "booked" || trip.status === "in_progress") && point(trip.start, trip.end),
  );
  if (live.some((trip) => trip.status === "in_progress")) return "on_trip";
  if (input.maintenance.some((block) => point(block.start, block.end))) return "maintenance";
  if (live.some((trip) => trip.status === "booked")) return "booked";
  if (input.hold) return "hold";
  return "available";
}

export function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}
