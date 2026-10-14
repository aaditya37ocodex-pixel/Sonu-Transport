import {
  customerOutstandingPaise,
  deriveTruckStatus,
  formatInr,
  toCsv,
  tripContributionPaise,
  tripWindow,
  type TruckLiveStatus,
} from "./finance";
import { isoToIstInput, todayIst } from "./time";
import type { Trip, Truck, Workspace } from "./types";

export { formatInr };

export function nameById(rows: { id: string; name: string }[], id: string | null): string {
  if (!id) return "—";
  return rows.find((row) => row.id === id)?.name ?? "—";
}

export function plateById(trucks: Truck[], id: string | null): string {
  if (!id) return "—";
  return trucks.find((truck) => truck.id === id)?.plate ?? "—";
}

export function istDay(iso: string | null | undefined): string {
  if (!iso) return "";
  return isoToIstInput(iso).slice(0, 10);
}

function maintenanceWindow(scheduledOn: string, blocksUntil: string) {
  const start = new Date(`${scheduledOn}T00:00:00+05:30`).getTime();
  const end = new Date(`${blocksUntil}T00:00:00+05:30`).getTime();
  return { start, end };
}

export function truckLive(data: Workspace, truck: Truck, now = Date.now()): TruckLiveStatus {
  return deriveTruckStatus({
    archived: Boolean(truck.archivedAt),
    hold: truck.serviceHold,
    now,
    trips: data.trips
      .filter((trip) => trip.truckId === truck.id)
      .map((trip) => {
        const window = tripWindow(new Date(trip.departure).getTime(), trip.arrival ? new Date(trip.arrival).getTime() : null);
        return { status: trip.status, start: window.start, end: window.end };
      }),
    maintenance: data.maintenance
      .filter((event) => event.truckId === truck.id && !event.completedOn)
      .map((event) => maintenanceWindow(event.scheduledOn, event.blocksUntil)),
  });
}

export function tripPaid(data: Workspace, tripId: string): number {
  return data.payments
    .filter((payment) => payment.tripId === tripId && payment.direction === "in")
    .reduce((sum, payment) => sum + payment.amountPaise, 0);
}

export function tripFuelPaise(data: Workspace, tripId: string): number {
  return data.fuel.filter((row) => row.tripId === tripId).reduce((sum, row) => sum + row.totalPaise, 0);
}

export function tripExpensePaise(data: Workspace, tripId: string): number {
  return data.expenses.filter((row) => row.tripId === tripId).reduce((sum, row) => sum + row.amountPaise, 0);
}

export function tripBalance(data: Workspace, trip: Trip): number {
  return trip.freightPaise - tripPaid(data, trip.id);
}

export function customerBalance(data: Workspace, customerId: string): number {
  return customerOutstandingPaise({
    invoices: data.invoices.filter((invoice) => invoice.customerId === customerId),
    adjustmentsPaise: data.adjustments
      .filter((row) => row.customerId === customerId)
      .reduce((sum, row) => sum + row.amountPaise, 0),
    incomingPaymentsPaise: data.payments
      .filter((payment) => payment.customerId === customerId && payment.direction === "in")
      .reduce((sum, payment) => sum + payment.amountPaise, 0),
  });
}

export function invoiceAllocated(data: Workspace, invoiceId: string): number {
  return data.allocations
    .filter((row) => row.invoiceId === invoiceId)
    .reduce((sum, row) => sum + row.amountPaise, 0);
}

export function buildReport(data: Workspace, from: string, to: string) {
  const trips = data.trips
    .filter((trip) => {
      const day = istDay(trip.departure);
      return day >= from && day <= to && trip.status !== "draft" && trip.status !== "cancelled";
    })
    .map((trip) => {
      const fuelPaise = tripFuelPaise(data, trip.id);
      const expensePaise = tripExpensePaise(data, trip.id);
      return {
        trip,
        fuelPaise,
        expensePaise,
        contributionPaise: tripContributionPaise(trip.freightPaise, trip.status, fuelPaise, expensePaise) ?? 0,
      };
    });
  const trucks = data.trucks.map((truck) => {
    const own = trips.filter((row) => row.trip.truckId === truck.id);
    const direct = data.expenses
      .filter((row) => row.truckId === truck.id && !row.tripId && row.expenseDate >= from && row.expenseDate <= to)
      .reduce((sum, row) => sum + row.amountPaise, 0);
    const workshop = data.maintenance
      .filter((row) => row.truckId === truck.id && row.scheduledOn >= from && row.scheduledOn <= to)
      .reduce((sum, row) => sum + row.costPaise, 0);
    const contribution = own.reduce((sum, row) => sum + row.contributionPaise, 0);
    return { truck, contribution, direct, workshop, result: contribution - direct - workshop, trips: own.length };
  });
  return {
    trips,
    trucks,
    freight: trips.reduce((sum, row) => sum + row.trip.freightPaise, 0),
    costs: trips.reduce((sum, row) => sum + row.fuelPaise + row.expensePaise, 0),
    collections: data.payments
      .filter((row) => row.direction === "in" && row.paymentDate >= from && row.paymentDate <= to)
      .reduce((sum, row) => sum + row.amountPaise, 0),
  };
}

export function tripsCsv(data: Workspace): string {
  return toCsv([
    ["Trip", "Customer", "Phone", "Truck", "Driver", "From", "To", "Departure", "Arrival", "Goods", "Freight paise", "Paid paise", "Balance paise", "Status"],
    ...data.trips.map((trip) => [
      trip.tripNumber,
      nameById(data.customers, trip.customerId),
      data.customers.find((row) => row.id === trip.customerId)?.phone ?? "",
      plateById(data.trucks, trip.truckId),
      nameById(data.drivers, trip.driverId),
      trip.origin,
      trip.destination,
      trip.departure,
      trip.arrival ?? "",
      trip.goods,
      trip.freightPaise,
      tripPaid(data, trip.id),
      tripBalance(data, trip),
      trip.status,
    ]),
  ]);
}

export function trucksCsv(data: Workspace): string {
  return toCsv([
    ["Truck", "Registration", "Capacity", "Unit", "Status", "Hold", "Archived"],
    ...data.trucks.map((truck) => [
      truck.name,
      truck.plate,
      truck.capacityValue ?? "",
      truck.capacityUnit,
      truckLive(data, truck),
      truck.serviceHold ? "yes" : "no",
      truck.archivedAt ?? "",
    ]),
  ]);
}

export function expensesCsv(data: Workspace): string {
  const fuel = data.fuel.map((row) => ["fuel", row.loggedAt, row.totalPaise, plateById(data.trucks, row.truckId), row.tripId ?? "", row.notes]);
  const expenses = data.expenses.map((row) => [
    row.category,
    row.expenseDate,
    row.amountPaise,
    plateById(data.trucks, row.truckId),
    row.tripId ?? "",
    row.description,
  ]);
  return toCsv([["Category", "When", "Amount paise", "Truck", "Trip id", "Note"], ...fuel, ...expenses]);
}

export function downloadText(filename: string, contents: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([type.includes("csv") ? `\ufeff${contents}` : contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function expiringDocuments(data: Workspace, withinDays = 30) {
  const today = todayIst();
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + withinDays);
  const end = limit.toISOString().slice(0, 10);
  return data.documents.filter((doc) => doc.expiryDate && doc.expiryDate <= end);
}
