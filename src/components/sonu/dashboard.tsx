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
} from "lucide-react";
import { authEnabled, signOut } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SecurityPanel } from "@/components/sonu/security";
import { ensureOffice, exportBackup, fetchDatabase, fetchWorkspace, setTripStatus } from "@/lib/sonu/api";
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

  const openModal = useCallback((kind: ModalKind, back: ModalKind | null = null) => {
    setModalError("");
    setNeedsOverride(false);
    setReturnTo(back);
    setNotice("");
    setModal(kind);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setReturnTo(null);
    setModalError("");
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
      // Customer ledger: invoices less payments; a customer who has only prepaid does not reduce others' dues.
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
      const message = await submitModal(modal, form, data);
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

  // Plain render helper (not a component) so rows keep their DOM between renders.
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
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark">ST</div>
          <div>
            <strong>SONU</strong>
            <span>TRANSPORT</span>
          </div>
          <button type="button" className="mobile-close icon-btn" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {sections.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={`nav-item ${section === name ? "active" : ""}`}
              aria-current={section === name ? "page" : undefined}
              onClick={() => goTo(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Trips" && stats.trips ? <small>{stats.trips}</small> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-indicator">
            <span className={`sync-dot ${data ? "" : "off"}`} />
            <div>
              <b>Workspace status</b>
              <small>{data ? "Connected to the database" : "Waiting for the database"}</small>
            </div>
          </div>
          <div className="profile-mini">
            <div className="avatar">{data?.profile.name?.slice(0, 1) || "S"}</div>
            <div className="profile-text">
              <b>{data?.profile.name || "Sonu Admin"}</b>
              <small>{data?.profile.role || "Owner"}</small>
            </div>
            <button type="button" className="icon-btn" onClick={() => void backup()} title="Download backup" aria-label="Download backup">
              <ArrowDownLeft size={17} />
            </button>
          </div>
          {authEnabled && (
            <button type="button" className="signout-btn" disabled={signingOut} onClick={() => void leave()}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          )}
        </div>
      </aside>
      {mobileNav && <button type="button" className="nav-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button type="button" className="mobile-menu icon-btn" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <b>{section}</b>
          </div>
          <div className="top-actions">
            {searchable.includes(section) && (
              <label className="search-box">
                <Search size={16} />
                <input
                  ref={searchRef}
                  aria-label={`Search ${section.toLowerCase()}`}
                  placeholder={`Search ${section === "Overview" ? "trips" : section.toLowerCase()}…`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <kbd>Ctrl K</kbd>
              </label>
            )}
            <button type="button" className="icon-btn" onClick={() => void refresh()} title="Refresh data" aria-label="Refresh data">
              <RefreshCw size={17} />
            </button>
            <div className="top-avatar">{data?.profile.name?.slice(0, 1) || "S"}</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">SONU TRANSPORT MANAGEMENT</p>
              <h1>{section === "Overview" ? `Good day, ${firstName}` : section}</h1>
              <p className="subheading">
                {section === "Overview"
                  ? "Here is what is happening across your fleet today."
                  : section === "Database"
                    ? "PostgreSQL is where trips, fleet, customers and accounts are stored."
                    : `Manage your ${section.toLowerCase()} and keep operations moving.`}
              </p>
            </div>
            <div className="heading-actions">
              <span className="date-chip">{formatDay(todayIst())}</span>
              {action && (
                <button type="button" className="primary-btn" onClick={() => openModal(action.kind)} disabled={!data}>
                  <Plus size={17} /> {action.label}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <CircleAlert size={18} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert alert-success" role="status">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {loading && !data ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Connecting to your transport workspace…</p>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <CircleAlert size={28} />
              <h2>Workspace could not be loaded</h2>
              <p>Check the database setup and sign-in configuration, then try again.</p>
              <button type="button" className="primary-btn" onClick={() => void refresh()}>
                <RefreshCw size={16} /> Retry connection
              </button>
            </div>
          ) : (
            <>
              {section === "Overview" && (
                <>
                  <div className="stats-grid">
                    <Stat label="Active trips" value={String(stats.trips).padStart(2, "0")} icon={Activity} tone="teal" hint="Booked, on the road or awaiting close" />
                    <Stat label="Fleet vehicles" value={String(stats.trucks).padStart(2, "0")} icon={TruckIcon} tone="deep" hint={`${stats.available} available right now`} />
                    <Stat label="Customers" value={String(stats.customers).padStart(2, "0")} icon={Users} tone="ink" hint="Active customer accounts" />
                    <Stat label="Outstanding" value={formatInr(stats.outstanding)} icon={Wallet} tone="black" hint="Invoices less payments received" />
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel">
                      <div className="panel-head">
                        <div>
                          <h2>Recent trips</h2>
                          <p>Your latest transport movements</p>
                        </div>
                        <button type="button" className="text-btn" onClick={() => goTo("Trips")}>
                          View all <ArrowUpRight size={15} />
                        </button>
                      </div>
                      {renderTripTable(trips.slice(0, 6), true)}
                    </section>
                    <section className="panel">
                      <div className="panel-head">
                        <div>
                          <h2>Fleet availability</h2>
                          <p>Current operational status</p>
                        </div>
                        <button type="button" className="icon-btn" onClick={() => goTo("Fleet")} aria-label="Open fleet">
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                      <div className="fleet-list">
                        {data.trucks
                          .filter((truck) => !truck.archivedAt)
                          .slice(0, 6)
                          .map((truck) => {
                            const live = truckLive(data, truck);
                            return (
                              <div className="fleet-row" key={truck.id}>
                                <div className="truck-avatar">
                                  <TruckIcon size={17} />
                                </div>
                                <div className="fleet-info">
                                  <b>{truck.name}</b>
                                  <small>{truck.plate}</small>
                                </div>
                                <Pill tone={TRUCK_TONE[live] ?? "neutral"}>{TRUCK_STATUS_LABEL[live] ?? live}</Pill>
                              </div>
                            );
                          })}
                        {!data.trucks.length && <EmptyHint title="No trucks yet" detail="Add a truck to start tracking availability." />}
                      </div>
                      <button type="button" className="secondary-btn full-btn" onClick={() => openModal("truck")}>
                        <Plus size={15} /> Register a vehicle
                      </button>
                    </section>
                  </div>
                  <section className="panel quick-actions">
                    <div className="panel-head">
                      <div>
                        <h2>Quick actions</h2>
                        <p>Get the next task done</p>
                      </div>
                    </div>
                    <div className="quick-grid">
                      <QuickAction icon={ClipboardList} title="Book a trip" detail="Type the customer and driver, pick the truck" onClick={() => openModal("trip")} />
                      <QuickAction icon={TruckIcon} title="Add a truck" detail="Expand your fleet register" onClick={() => openModal("truck")} />
                      <QuickAction icon={Users} title="Add a driver" detail="Keep licence details on file" onClick={() => openModal("driver")} />
                      <QuickAction icon={Users} title="Add a customer" detail="Save billing details" onClick={() => openModal("customer")} />
                      <QuickAction icon={FileText} title="Create invoice" detail="Bill a customer for freight" onClick={() => openModal("invoice")} />
                      <QuickAction icon={Wallet} title="Record payment" detail="Update customer collections" onClick={() => openModal("payment")} />
                    </div>
                  </section>
                </>
              )}

              {section === "Trips" && (
                <section className="panel table-panel">
                  <PanelHead title="Trip register" subtitle={`${trips.length} trip records`} onAdd={() => openModal("trip")} addLabel="Book trip" />
                  {renderTripTable(trips)}
                </section>
              )}

              {section === "Fleet" && (
                <section className="panel table-panel">
                  <PanelHead title="Fleet register" subtitle={`${data.trucks.length} registered vehicles`} onAdd={() => openModal("truck")} addLabel="Add truck" />
                  <DataTable
                    headers={["Vehicle", "Registration", "Capacity", "Availability", "Current / next trip", "Trips", "Service hold"]}
                    numeric={[5]}
                    empty={{ title: "Your fleet starts here", detail: "Add your first truck to see availability and assignments." }}
                    rows={data.trucks
                      .filter((truck) => hit(truck.name, truck.plate, truckLive(data, truck)))
                      .map((truck) => {
                        const live = truckLive(data, truck);
                        return {
                          key: truck.id,
                          cells: [
                            <b key="n">{truck.name}</b>,
                            truck.plate,
                            truck.capacityValue ? `${truck.capacityValue} ${truck.capacityUnit}` : "—",
                            <Pill key="s" tone={TRUCK_TONE[live] ?? "neutral"}>
                              {TRUCK_STATUS_LABEL[live] ?? live}
                            </Pill>,
                            truckTripNote(data, truck),
                            data.trips.filter((trip) => trip.truckId === truck.id && trip.status !== "cancelled").length,
                            truck.serviceHold ? "On hold" : "No",
                          ],
                        };
                      })}
                  />
                </section>
              )}

              {section === "Drivers" && (
                <section className="panel table-panel">
                  <PanelHead title="Driver register" subtitle={`${data.drivers.length} driver records`} onAdd={() => openModal("driver")} addLabel="Add driver" />
                  <DataTable
                    headers={["Driver", "Phone", "Licence number", "Licence expiry", "Trips", "Status"]}
                    numeric={[4]}
                    empty={{ title: "No drivers yet", detail: "Add a driver here, or type a driver name when you book a trip — it is added automatically." }}
                    rows={data.drivers
                      .filter((driver) => hit(driver.name, driver.phone, driver.licenseNo, driver.status))
                      .map((driver) => ({
                        key: driver.id,
                        cells: [
                          <b key="n">{driver.name}</b>,
                          driver.phone,
                          driver.licenseNo,
                          driver.licenseExpiry ? formatDay(driver.licenseExpiry) : "",
                          data.trips.filter((trip) => trip.driverId === driver.id && trip.status !== "cancelled").length,
                          <Pill key="s" tone={driver.status === "active" ? "good" : "neutral"}>
                            {driver.status}
                          </Pill>,
                        ],
                      }))}
                  />
                </section>
              )}

              {section === "Customers" && (
                <section className="panel table-panel">
                  <PanelHead title="Customer directory" subtitle={`${data.customers.length} customer records`} onAdd={() => openModal("customer")} addLabel="Add customer" />
                  <DataTable
                    headers={["Customer", "Phone", "GSTIN", "Trips", "Outstanding", "Billing address"]}
                    numeric={[3, 4]}
                    empty={{ title: "No customers yet", detail: "Add a customer here, or type a customer name when you book a trip — it is added automatically." }}
                    rows={data.customers
                      .filter((row) => hit(row.name, row.phone, row.gstin, row.billingAddress))
                      .map((row) => ({
                        key: row.id,
                        cells: [
                          <b key="n">{row.name}</b>,
                          row.phone,
                          row.gstin,
                          data.trips.filter((trip) => trip.customerId === row.id && trip.status !== "cancelled").length,
                          formatInr(Math.max(0, customerBalance(data, row.id))),
                          row.billingAddress,
                        ],
                      }))}
                  />
                </section>
              )}

              {section === "Finance" && (
                <div className="finance-grid">
                  <section className="panel table-panel">
                    <PanelHead title="Invoices" subtitle={`${data.invoices.length} invoices`} onAdd={() => openModal("invoice")} addLabel="New invoice" />
                    <DataTable
                      headers={["Invoice", "Customer", "Trip", "Issued", "Due", "Total", "Paid", "Status"]}
                      numeric={[5, 6]}
                      empty={{ title: "No invoices yet", detail: "Create an invoice for a customer or a trip." }}
                      rows={data.invoices
                        .filter((row) => hit(row.invoiceNumber, nameById(data.customers, row.customerId), row.status))
                        .map((row) => ({
                          key: row.id,
                          cells: [
                            <b key="n">{row.invoiceNumber}</b>,
                            nameById(data.customers, row.customerId),
                            data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
                            formatDay(row.issueDate),
                            formatDay(row.dueDate),
                            formatInr(row.totalPaise),
                            formatInr(invoiceAllocated(data, row.id)),
                            <Pill key="s" tone={row.status === "paid" ? "good" : row.status === "void" ? "bad" : row.status === "partial" ? "warn" : "info"}>
                              {row.status}
                            </Pill>,
                          ],
                        }))}
                    />
                  </section>
                  <section className="panel table-panel">
                    <PanelHead title="Payments received" subtitle={`${data.payments.length} transactions`} onAdd={() => openModal("payment")} addLabel="Record payment" />
                    <DataTable
                      headers={["Date", "Customer", "Trip", "Method", "Reference", "Amount"]}
                      numeric={[5]}
                      empty={{ title: "No payments yet", detail: "Record a payment when a customer pays." }}
                      rows={data.payments
                        .filter((row) => hit(nameById(data.customers, row.customerId), row.method, row.reference, row.kind))
                        .map((row) => ({
                          key: row.id,
                          cells: [
                            formatDay(row.paymentDate),
                            nameById(data.customers, row.customerId),
                            data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
                            row.kind === "advance" ? "Advance" : row.method,
                            row.reference,
                            formatInr(row.amountPaise),
                          ],
                        }))}
                    />
                  </section>
                </div>
              )}

              {section === "Expenses" && (
                <div className="finance-grid">
                  <section className="panel table-panel">
                    <PanelHead title="Operating expenses" subtitle={`${data.expenses.length} expense records`} onAdd={() => openModal("expense")} addLabel="Add expense" />
                    <DataTable
                      headers={["Date", "Category", "Truck", "Trip", "Description", "Amount"]}
                      numeric={[5]}
                      empty={{ title: "No expenses yet", detail: "Record tolls, repairs and other costs." }}
                      rows={data.expenses
                        .filter((row) => hit(row.category, plateById(data.trucks, row.truckId), row.description, row.vendorName))
                        .map((row) => ({
                          key: row.id,
                          cells: [
                            formatDay(row.expenseDate),
                            EXPENSE_LABEL[row.category] ?? row.category,
                            plateById(data.trucks, row.truckId),
                            data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
                            row.description || row.vendorName,
                            formatInr(row.amountPaise),
                          ],
                        }))}
                    />
                  </section>
                  <section className="panel table-panel">
                    <PanelHead title="Fuel ledger" subtitle={`${data.fuel.length} fuel records`} onAdd={() => openModal("fuel")} addLabel="Add fuel" />
                    <DataTable
                      headers={["Date", "Truck", "Trip", "Litres", "Odometer", "Vendor", "Amount"]}
                      numeric={[3, 4, 6]}
                      empty={{ title: "No fuel entries yet", detail: "Record each fuel fill to track costs." }}
                      rows={data.fuel
                        .filter((row) => hit(plateById(data.trucks, row.truckId), row.vendorName))
                        .map((row) => ({
                          key: row.id,
                          cells: [
                            formatWhen(row.loggedAt),
                            plateById(data.trucks, row.truckId),
                            data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
                            row.quantityMl ? String(row.quantityMl / 1000) : "",
                            row.odometerKm != null ? (
                              <span key="o">
                                {row.odometerKm} km {row.flagged && <Pill tone="warn">Check</Pill>}
                              </span>
                            ) : (
                              ""
                            ),
                            row.vendorName,
                            formatInr(row.totalPaise),
                          ],
                        }))}
                    />
                  </section>
                </div>
              )}

              {section === "Reports" && report && (
                <>
                  <section className="panel table-panel">
                    <div className="panel-head">
                      <div>
                        <h2>Period report</h2>
                        <p>Trips, costs and collections between two dates</p>
                      </div>
                    </div>
                    <div className="period-bar">
                      <label className="field">
                        <span>From</span>
                        <input type="date" value={reportFrom} max={reportTo} onChange={(event) => event.target.value && setReportFrom(event.target.value)} />
                      </label>
                      <label className="field">
                        <span>To</span>
                        <input type="date" value={reportTo} min={reportFrom} onChange={(event) => event.target.value && setReportTo(event.target.value)} />
                      </label>
                    </div>
                    <div className="stats-grid" style={{ padding: 18, marginBottom: 0 }}>
                      <Stat label="Trips" value={String(report.trips.length)} icon={ClipboardList} tone="teal" hint="Booked or later, excluding cancelled" />
                      <Stat label="Freight booked" value={formatInr(report.freight)} icon={ArrowUpRight} tone="deep" hint="In the selected period" />
                      <Stat label="Trip costs" value={formatInr(report.costs)} icon={ArrowDownLeft} tone="ink" hint="Fuel and trip expenses" />
                      <Stat label="Collections" value={formatInr(report.collections)} icon={Wallet} tone="black" hint="Payments received" />
                    </div>
                    <DataTable
                      headers={["Truck", "Trips", "Trip result", "Truck expenses", "Workshop", "Net result"]}
                      numeric={[1, 2, 3, 4, 5]}
                      empty={{ title: "No trucks yet", detail: "Add trucks to see results per vehicle." }}
                      rows={report.trucks.map((row) => ({
                        key: row.truck.id,
                        cells: [
                          <b key="n">
                            {row.truck.plate}
                            <small>{row.truck.name}</small>
                          </b>,
                          row.trips,
                          formatInr(row.contribution),
                          formatInr(row.direct),
                          formatInr(row.workshop),
                          <b key="r">{formatInr(row.result)}</b>,
                        ],
                      }))}
                    />
                  </section>
                  <section className="panel table-panel">
                    <div className="panel-head">
                      <div>
                        <h2>Exports and backup</h2>
                        <p>Download a copy of your records for safekeeping.</p>
                      </div>
                      <button type="button" className="primary-btn" onClick={() => void backup()}>
                        <ArrowDownLeft size={16} /> Export JSON backup
                      </button>
                    </div>
                    <p className="note">Keep backups somewhere secure. A downloaded backup is not a substitute for automated, off-site database backups.</p>
                    <div className="export-row">
                      <button type="button" className="secondary-btn" onClick={() => downloadText("sonu-trips.csv", tripsCsv(data))}>
                        <FileText size={16} /> Trips CSV
                      </button>
                      <button type="button" className="secondary-btn" onClick={() => downloadText("sonu-trucks.csv", trucksCsv(data))}>
                        <FileText size={16} /> Trucks CSV
                      </button>
                      <button type="button" className="secondary-btn" onClick={() => downloadText("sonu-expenses.csv", expensesCsv(data))}>
                        <FileText size={16} /> Expenses CSV
                      </button>
                    </div>
                  </section>
                </>
              )}

              {section === "Database" && (
                <section className="panel settings-panel">
                  <div className="panel-head">
                    <div>
                      <h2>{database?.title ?? "PostgreSQL"}</h2>
                      <p>{database?.detail ?? "Loading the database place…"}</p>
                    </div>
                    <Pill tone="good">{database ? "Connected" : "Checking"}</Pill>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>Engine</b>
                      <p>PostgreSQL. The same tables are used in the preview and after you publish.</p>
                    </div>
                    <Pill tone="info">{database?.place === "Neon" ? "Neon" : "Preview"}</Pill>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>Where records live</b>
                      <p>
                        {database?.place === "Neon"
                          ? "Neon Postgres, the hosted database for the published site."
                          : "This preview’s own Postgres. Publish to keep the live site on Neon."}
                      </p>
                    </div>
                    <Pill tone="neutral">{database?.tables.reduce((sum, table) => sum + table.rows, 0) ?? 0} rows</Pill>
                  </div>
                  <DataTable
                    headers={["Table", "What it holds", "Rows"]}
                    numeric={[2]}
                    empty={{ title: "Database not ready", detail: "Refresh the workspace and try again." }}
                    rows={(database?.tables ?? []).map((table) => ({
                      key: table.key,
                      cells: [
                        <b key="n">{table.label}</b>,
                        {
                          trucks: "Fleet vehicles",
                          customers: "Billing accounts",
                          drivers: "Drivers and licences",
                          trips: "Booked movements",
                          fuel: "Fuel purchases",
                          expenses: "Trip and truck costs",
                          invoices: "Customer invoices",
                          payments: "Money in and out",
                          adjustments: "Invoice corrections",
                          maintenance: "Workshop jobs",
                          tyres: "Tyre history",
                          documents: "Uploaded papers",
                          staff: "Desk sign-ins",
                          audit: "Who changed what",
                        }[table.key] ?? table.label,
                        table.rows,
                      ],
                    }))}
                  />
                </section>
              )}

              {section === "Settings" && (
                <section className="panel settings-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Company settings</h2>
                      <p>Business profile and workspace tools</p>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>{data.company.displayName}</b>
                      <p>{data.company.legalName}</p>
                      <small>{data.company.address || "Company address not set"}</small>
                    </div>
                    <Pill tone="info">{data.profile.role}</Pill>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>Database</b>
                      <p>
                        {database?.place === "Neon"
                          ? "Records are in Neon Postgres and stay available on every device."
                          : "Records are in this preview’s Postgres. Open Database to see each table."}
                      </p>
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => goTo("Database")}>
                      Open database
                    </button>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>Backup</b>
                      <p>Download a JSON export of company records.</p>
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => void backup()}>
                      Export backup
                    </button>
                  </div>
                  <div className="settings-row">
                    <div>
                      <b>Refresh workspace</b>
                      <p>Reload the latest records from the server.</p>
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => void refresh()}>
                      <RefreshCw size={15} /> Refresh
                    </button>
                  </div>
                </section>
              )}
              {section === "Settings" && <SecurityPanel recoveryIsDefault={data.company.recoveryIsDefault} onDone={() => void refresh()} />}
            </>
          )}

          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Sonu Transport Management</span>
            <span>
              <span className="sync-dot" /> Operational workspace
            </span>
          </footer>
        </div>
      </main>

      {modal && data && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-head">
              <div>
                <p className="eyebrow">NEW RECORD</p>
                <h2 id="modal-title">{MODAL_TITLES[modal]}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Close dialog">
                <X />
              </button>
            </div>
            <form key={modal} onSubmit={submit} className="modal-form">
              <ModalFields kind={modal} data={data} needsOverride={needsOverride} onOpen={(kind) => openModal(kind, "trip")} />
              {(modal === "invoice" || modal === "payment") && !data.customers.length && (
                <p className="form-warning">
                  No customer exists yet. Add one under Customers, or book a trip — a customer typed there is added automatically.
                </p>
              )}
              {(modal === "fuel" || modal === "expense") && !data.trucks.length && (
                <p className="form-warning">Register a truck first so this cost can be linked to it.</p>
              )}
              {modalError && (
                <p className="form-error" role="alert">
                  <CircleAlert size={16} />
                  <span>{modalError}</span>
                </p>
              )}
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="button-spinner" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> {modal === "trip" ? "Book trip" : "Save record"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
