import type { Role } from "./types";

export type Action =
  | "truck.write"
  | "customer.write"
  | "driver.write"
  | "trip.write"
  | "trip.override"
  | "trip.reopen"
  | "fuel.write"
  | "expense.write"
  | "invoice.write"
  | "payment.write"
  | "maintenance.write"
  | "document.write"
  | "settings.manage"
  | "audit.view"
  | "backup.manage";

const MATRIX: Record<Action, Role[]> = {
  "truck.write": ["owner", "dispatcher"],
  "customer.write": ["owner", "dispatcher", "accounts"],
  "driver.write": ["owner", "dispatcher"],
  "trip.write": ["owner", "dispatcher"],
  "trip.override": ["owner"],
  "trip.reopen": ["owner"],
  "fuel.write": ["owner", "dispatcher", "accounts"],
  "expense.write": ["owner", "dispatcher", "accounts"],
  "invoice.write": ["owner", "accounts"],
  "payment.write": ["owner", "accounts"],
  "maintenance.write": ["owner", "dispatcher"],
  "document.write": ["owner", "dispatcher", "accounts"],
  "settings.manage": ["owner"],
  "audit.view": ["owner"],
  "backup.manage": ["owner"],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[action].includes(role);
}

export type PageId =
  | "dashboard"
  | "trucks"
  | "availability"
  | "trips"
  | "customers"
  | "drivers"
  | "fuel"
  | "invoices"
  | "maintenance"
  | "documents"
  | "reports"
  | "settings";

export const NAV: { id: PageId; label: string; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", roles: ["owner", "dispatcher", "accounts", "driver"] },
  { id: "trucks", label: "Trucks", roles: ["owner", "dispatcher", "accounts"] },
  { id: "availability", label: "Availability", roles: ["owner", "dispatcher", "accounts"] },
  { id: "trips", label: "Trips", roles: ["owner", "dispatcher", "accounts", "driver"] },
  { id: "customers", label: "Customers", roles: ["owner", "dispatcher", "accounts"] },
  { id: "drivers", label: "Drivers", roles: ["owner", "dispatcher", "accounts"] },
  { id: "fuel", label: "Fuel & expenses", roles: ["owner", "dispatcher", "accounts"] },
  { id: "invoices", label: "Invoices", roles: ["owner", "dispatcher", "accounts"] },
  { id: "maintenance", label: "Maintenance", roles: ["owner", "dispatcher", "accounts"] },
  { id: "documents", label: "Documents", roles: ["owner", "dispatcher", "accounts"] },
  { id: "reports", label: "Reports", roles: ["owner", "dispatcher", "accounts"] },
  { id: "settings", label: "Settings", roles: ["owner"] },
];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  dispatcher: "Dispatcher",
  accounts: "Accounts",
  driver: "Driver",
};

export const STATUS_TRANSITIONS: Record<string, Partial<Record<string, Role[]>>> = {
  draft: { booked: ["owner", "dispatcher"], cancelled: ["owner", "dispatcher"] },
  booked: {
    in_progress: ["owner", "dispatcher", "driver"],
    cancelled: ["owner", "dispatcher"],
    draft: ["owner", "dispatcher"],
  },
  in_progress: {
    delivered: ["owner", "dispatcher", "driver"],
    cancelled: ["owner"],
  },
  delivered: {
    closed: ["owner", "accounts", "dispatcher"],
    in_progress: ["owner"],
  },
  closed: { delivered: ["owner"] },
  cancelled: { draft: ["owner"] },
};

export const TRIP_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  booked: "Booked",
  in_progress: "In transit",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const TRUCK_STATUS_LABEL: Record<string, string> = {
  available: "Available",
  booked: "Booked",
  on_trip: "On trip",
  maintenance: "Maintenance",
  hold: "Held",
  archived: "Archived",
};
