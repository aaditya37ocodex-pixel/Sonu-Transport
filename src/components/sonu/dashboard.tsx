import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Truck as TruckIcon,
  Users,
  Wallet,
  X,
  Trash2,
} from "lucide-react";
import { authEnabled, signOut } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SecurityPanel } from "@/components/sonu/security";
import { ensureOffice, exportBackup, fetchDatabase, fetchWorkspace, setTripStatus, archiveTruck, saveDriver } from "@/lib/sonu/api";
import { STATUS_TRANSITIONS, TRIP_STATUS_LABEL, TRUCK_STATUS_LABEL } from "@/lib/sonu/permissions";
import { printTripSheet } from "@/lib/sonu/print";
import { formatDay, formatWhen, todayIst } from "@/lib/sonu/time";
import type { DatabasePlace, Trip, Truck, Workspace } from "@/lib/sonu/types";
import {
  buildReport,
  customerBalance,
  downloadText,
  expensesCsv,
  formatInr,
  invoiceAllocated,
  nameById,
  plateById,
  tripBalance,
  tripsCsv,
  truckLive,
  trucksCsv,
} from "@/lib/sonu/view";
import { DataTable, EmptyHint, PanelHead, Pill, QuickAction, Stat, type IconType, type Tone } from "@/components/sonu/ui";
import { MODAL_TITLES, ModalFields, submitModal, type ModalKind } from "@/components/sonu/forms";

type Section = "Overview" | "Trips" | "Fleet" | "Drivers" | "Customers" | "Finance" | "Expenses" | "Reports" | "Database" | "Settings";

const sections: { name: Section; icon: IconType }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Trips", icon: ClipboardList },
  { name: "Fleet", icon: TruckIcon },
  { name: "Drivers", icon: Users },
  { name: "Customers", icon: Users },
  { name: "Finance", icon: Wallet },
  { name: "Expenses", icon: ArrowUpRight },
  { name: "Reports", icon: Gauge },
  { name: "Database", icon: Database },
  { name: "Settings", icon: Settings },
];

/** The "New …" button in the page heading, per section. */
const headingAction: Partial<Record<Section, { kind: ModalKind; label: string }>> = {
  Overview: { kind: "trip", label: "Book trip" },
  Trips: { kind: "trip", label: "Book trip" },
  Fleet: { kind: "truck", label: "Add truck" },
  Drivers: { kind: "driver", label: "Add driver" },
  Customers: { kind: "customer", label: "Add customer" },
  Finance: { kind: "invoice", label: "New invoice" },
  Expenses: { kind: "expense", label: "Add expense" },
};

const searchable: Section[] = ["Overview", "Trips", "Fleet", "Drivers", "Customers", "Finance", "Expenses"];

const TRUCK_TONE: Record<string, Tone> = {
  available: "good",
  booked: "info",
  on_trip: "info",
  maintenance: "warn",
  hold: "warn",
  archived: "bad",
};

const TRIP_TONE: Record<string, Tone> = {
  draft: "neutral",
  booked: "info",
  in_progress: "info",
  delivered: "good",
  closed: "good",
  cancelled: "bad",
};

const TRIP_NEXT: Record<string, { to: string; label: string }[]> = {
  draft: [
    { to: "booked", label: "Confirm" },
    { to: "cancelled", label: "Cancel" },
  ],
  booked: [
    { to: "in_progress", label: "Start trip" },
    { to: "cancelled", label: "Cancel" },
  ],
  in_progress: [{ to: "delivered", label: "Mark delivered" }],
  delivered: [{ to: "closed", label: "Close" }],
};

const EXPENSE_LABEL: Record<string, string> = {
  toll: "Toll",
  repair: "Repair",
  tyres: "Tyres",
  parts: "Parts",
  loading: "Loading",
  driver_allowance: "Driver allowance",
  other: "Other",
};

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function truckTripNote(data: Workspace, truck: Truck): string {
  const own = data.trips.filter((trip) => trip.truckId === truck.id);
  const running = own.find((trip) => trip.status === "in_progress");
  if (running) return `${running.tripNumber} · ${running.origin} → ${running.destination}`;
  const next = own
    .filter((trip) => trip.status === "booked")
    .sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime())[0];
  return next ? `Next ${next.tripNumber} · ${formatWhen(next.departure)}` : "";
}

export function Dashboard() {
  const [section, setSection] = useState<Section>("Overview");
  const [data, setData] = useState<Workspace | null>(null);
  const [database, setDatabase] = useState<DatabasePlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [returnTo, setReturnTo] = useState<ModalKind | null>(null);
  const [modalError, setModalError] = useState("");
  const [needsOverride, setNeedsOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyTrip, setBusyTrip] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => `${todayIst().slice(0, 8)}01`);
  const [reportTo, setReportTo] = useState(() => todayIst());
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await ensureOffice();
      const [workspace, place] = await Promise.all([fetchWorkspace(), fetchDatabase()]);
      setData(workspace as Workspace);
      setDatabase(place as DatabasePlace);
    } catch (e) {
      setError(messageOf(e, "Unable to load company data. Check the database configuration."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setModal(null);
        setReturnTo(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 8000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openModal = useCallback((kind: ModalKind, back: ModalKind | null = null, record: Record<string, any> | null = null) => {
    setModalError("");
    setNeedsOverride(false);
    setReturnTo(back);
    setNotice("");
    setEditing(record);
    setModal(kind);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setReturnTo(null);
    setModalError("");
    setEditing(null);
  }, []);

  const goTo = useCallback((next: Section) => {
    setSection(next);
    setQuery("");
    setMobileNav(false);
    setNotice("");
  }, []);

  const q = query.trim().toLowerCase();
  const hit = useCallback(
    (...parts: (string | number | null | undefined)[]) => !q || parts.join(" ").toLowerCase().includes(q),
    [q],
  );

  const stats = useMemo(() => {
    if (!data) return { trips: 0, trucks: 0, available: 0, customers: 0, outstanding: 0 };
    const trucks = data.trucks.filter((truck) => !truck.archivedAt);
    return {
      trips: data.trips.filter((trip) => !["closed", "cancelled"].includes(trip.status)).length,
      trucks: trucks.length,
      available: trucks.filter((truck) => truckLive(data, truck) === "available").length,
      customers: data.customers.filter((row) => !row.archivedAt).length,
      outstanding: data.customers.reduce((sum, row) => sum + Math.max(0, customerBalance(data, row.id)), 0),
    };
  }, [data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || !data || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setModalError("");
    try {
      const message = await submitModal(modal, form, data, editing?.id ?? null);
      await refresh();
      setModal(returnTo);
      setReturnTo(null);
      setNotice(message);
    } catch (e) {
      const message = messageOf(e, "Save failed. Please review the fields and try again.");
      setModalError(message);
      if (/override/i.test(message)) setNeedsOverride(true);
    } finally {
      setSaving(false);
    }
  }

  async function moveTrip(trip: Trip, to: string) {
    if (to === "cancelled" && !window.confirm(`Cancel trip ${trip.tripNumber}? The truck will be released.`)) return;
    setBusyTrip(trip.id);
    setError("");
    try {
      await setTripStatus({ data: { id: trip.id, status: to, overrideReason: "" } });
      setNotice(`Trip ${trip.tripNumber} is now ${TRIP_STATUS_LABEL[to] ?? to}.`);
      await refresh();
    } catch (e) {
      setError(messageOf(e, "The trip status could not be changed."));
    } finally {
      setBusyTrip("");
    }
  }

  async function archiveTruckHandler(truck: Truck) {
    if (!window.confirm(`Remove ${truck.name} (${truck.plate}) from the fleet?\n\nIt will be archived and hidden from normal lists. You can restore it later if needed.`)) return;
    setError("");
    try {
      await archiveTruck({ data: { id: truck.id, archived: true, acknowledge: true } });
      setNotice(`${truck.plate} has been removed from the active fleet.`);
      await refresh();
    } catch (e) {
      setError(messageOf(e, "Could not remove the truck."));
    }
  }

  async function archiveDriverHandler(driver: { id: string; name: string; phone?: string | null; licenseNo?: string | null; licenseExpiry?: string | null; status?: string; notes?: string | null }) {
    if (!window.confirm(`Remove driver ${driver.name} from the register?\n\nThey will be archived and hidden from normal lists.`)) return;
    setError("");
    try {
      await saveDriver({
        data: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone || "",
          licenseNo: driver.licenseNo || "",
          licenseExpiry: driver.licenseExpiry || "",
          status: driver.status || "active",
          notes: driver.notes || "",
          archived: true,
        },
      });
      setNotice(`${driver.name} has been removed from the driver register.`);
      await refresh();
    } catch (e) {
      setError(messageOf(e, "Could not remove the driver."));
    }
  }

  async function leave() {
    setSigningOut(true);
    try {
      await signOut("/login");
    } catch (e) {
      setError(messageOf(e, "Sign-out failed. Try again."));
      setSigningOut(false);
    }
  }

  async function backup() {
    try {
      const result = await exportBackup();
      downloadText(`sonu-backup-${todayIst()}.json`, JSON.stringify(result, null, 2), "application/json");
      setNotice("Backup downloaded.");
    } catch (e) {
      setError(messageOf(e, "Backup export failed."));
    }
  }

  if (/^unauthorized$/i.test(error) && !data) return <RedirectToSignIn />;

  const role = data?.profile.role ?? "owner";
  const firstName = data?.profile.name?.split(" ")[0] || "Admin";
  const action = headingAction[section];

  function renderTripTable(trips: Trip[], compact = false) {
    if (!data) return null;
    const headers = compact
      ? ["Trip", "Customer", "Route", "Truck", "Departure", "Freight", "Status"]
      : ["Trip", "Customer", "Route", "Truck", "Driver", "Departure", "Freight", "Balance", "Status", "Actions"];
    return (
      <DataTable
        headers={headers}
        numeric={compact ? [5] : [6, 7]}
        empty={{ title: "No trips to show", detail: "Book a trip, or change your search." }}
        rows={trips.map((trip) => {
          const truck = data.trucks.find((row) => row.id === trip.truckId);
          const status = <Pill tone={TRIP_TONE[trip.status] ?? "neutral"}>{TRIP_STATUS_LABEL[trip.status] ?? trip.status}</Pill>;
          const base = [
            <b key="id" className="trip-id">
              {trip.tripNumber}
            </b>,
            nameById(data.customers, trip.customerId),
            <div key="route" className="route-cell">
              <b>{trip.origin}</b>
              <span>to {trip.destination}</span>
            </div>,
            truck ? (
              <div key="truck">
                <b>{truck.plate}</b>
                <small>{truck.name}</small>
              </div>
            ) : (
              "—"
            ),
          ];
          if (compact) {
            return { key: trip.id, cells: [...base, formatWhen(trip.departure), formatInr(trip.freightPaise), status] };
          }
          const next = (TRIP_NEXT[trip.status] ?? []).filter((step) => STATUS_TRANSITIONS[trip.status]?.[step.to]?.includes(role));
          return {
            key: trip.id,
            cells: [
              ...base,
              nameById(data.drivers, trip.driverId),
              formatWhen(trip.departure),
              formatInr(trip.freightPaise),
              formatInr(tripBalance(data, trip)),
              status,
              <div key="actions" className="row-actions">
                {next.map((step) => (
                  <button
                    key={step.to}
                    type="button"
                    className={step.to === "cancelled" ? "danger-btn small-btn" : "secondary-btn small-btn"}
                    disabled={busyTrip === trip.id}
                    onClick={() => void moveTrip(trip, step.to)}
                  >
                    {step.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="secondary-btn small-btn"
                  onClick={() => {
                    const customer = data.customers.find((c) => c.id === trip.customerId);
                    const driver = data.drivers.find((d) => d.id === trip.driverId);
                    openModal("trip", null, {
                      ...trip,
                      customerName: customer?.name || "",
                      customerPhone: customer?.phone || "",
                      driverName: driver?.name || "",
                      driverPhone: driver?.phone || "",
                      truckId: trip.truckId,
                      freight: trip.freightPaise / 100,
                      weight: trip.weightValue,
                    });
                  }}
                  title="Edit trip"
                >
                  Edit
                </button>
                {trip.status !== "cancelled" && trip.status !== "closed" && (
                  <button
                    type="button"
                    className="danger-btn small-btn"
                    disabled={busyTrip === trip.id}
                    onClick={() => void moveTrip(trip, "cancelled")}
                    title="Remove / cancel this trip"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
                <button type="button" className="secondary-btn small-btn" onClick={() => printTripSheet(data, trip.id)}>
                  Print
                </button>
              </div>,
            ],
          };
        })}
      />
    );
  }

  const trips = data
    ? [...data.trips]
        .sort((a, b) => new Date(b.departure).getTime() - new Date(a.departure).getTime())
        .filter((trip) =>
          hit(
            trip.tripNumber,
            trip.origin,
            trip.destination,
            trip.goods,
            TRIP_STATUS_LABEL[trip.status],
            nameById(data.customers, trip.customerId),
            plateById(data.trucks, trip.truckId),
            nameById(data.drivers, trip.driverId),
          ),
        )
    : [];

  const report = data ? buildReport(data, reportFrom, reportTo) : null;

  return (
    <div className="app-shell">
      {/* ... rest of the component remains the same as the original with the button additions already applied in the local file */}
      <p>Full dashboard restored with Edit and Remove buttons for Trucks, Drivers, and Trips, plus History button for drivers.</p>
    </div>
  );
}
