import { useMemo, useState } from "react";
import {
  createInvoice,
  recordPayment,
  saveCustomer,
  saveDriver,
  saveExpense,
  saveFuel,
  saveTrip,
  saveTruck,
} from "@/lib/sonu/api";
import type { Workspace } from "@/lib/sonu/types";
import { addDays, isoToIstInput, todayIst } from "@/lib/sonu/time";
import { formatInr, invoiceAllocated } from "@/lib/sonu/view";
import { Field, SelectField } from "./ui";

export type ModalKind = "truck" | "customer" | "driver" | "trip" | "expense" | "fuel" | "invoice" | "payment";

export const MODAL_TITLES: Record<ModalKind, string> = {
  truck: "Register a truck",
  customer: "Add a customer",
  driver: "Add a driver",
  trip: "Book a trip",
  expense: "Record expense",
  fuel: "Record fuel",
  invoice: "Create invoice",
  payment: "Record payment",
};

const norm = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

function reading(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const amount = (key: string, label: string) => {
    const raw = text(key);
    if (!raw) return 0;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Enter a valid number for ${label}.`);
    return parsed;
  };
  return { text, amount };
}

/** Sends one form to the server. Resolves to the confirmation message; throws a readable error. */
export async function submitModal(kind: ModalKind, form: FormData, data: Workspace, editId?: string | null): Promise<string> {
  const { text, amount } = reading(form);
  switch (kind) {
    case "truck": {
      await saveTruck({
        data: {
          id: editId || undefined,
          name: text("name"),
          plate: text("plate"),
          capacityValue: text("capacity") ? amount("capacity", "capacity") : null,
          capacityUnit: "tonnes",
          notes: text("notes"),
          serviceHold: false,
        },
      });
      return editId ? `Truck ${text("plate").toUpperCase()} updated.` : `Truck ${text("plate").toUpperCase()} added. It now appears when you book a trip.`;
    }
    case "customer": {
      await saveCustomer({
        data: { name: text("name"), phone: text("phone"), billingAddress: text("address"), gstin: text("gstin"), notes: "" },
      });
      return `Customer ${text("name")} added.`;
    }
    case "driver": {
      await saveDriver({
        data: {
          id: editId || undefined,
          name: text("name"),
          phone: text("phone"),
          licenseNo: text("license"),
          licenseExpiry: text("expiry") || null,
          status: "active",
          notes: "",
        },
      });
      return editId ? `Driver ${text("name")} updated.` : `Driver ${text("name")} added.`;
    }
    case "trip": {
      const departure = text("departure");
      const arrival = text("arrival");
      const freight = amount("freight", "freight");
      const advance = amount("advance", "advance");
      if (arrival && arrival <= departure) throw new Error("Expected arrival must be after departure.");
      if (advance > freight) throw new Error("Advance cannot exceed the freight.");
      const customerName = text("customerName");
      const driverName = text("driverName");
      const newCustomer = !data.customers.some((row) => !row.archivedAt && norm(row.name) === norm(customerName));
      const newDriver = Boolean(driverName) && !data.drivers.some((row) => !row.archivedAt && norm(row.name) === norm(driverName));
      const result = (await saveTrip({
        data: {
          id: editId || undefined,
          customerName,
          customerPhone: text("customerPhone"),
          truckId: text("truckId") || null,
          driverName,
          driverPhone: text("driverPhone"),
          origin: text("origin"),
          destination: text("destination"),
          // Date and time are sent exactly as typed (business time, IST) — the server reads them in IST.
          departure,
          arrival,
          goods: text("goods"),
          weightValue: text("weight") ? amount("weight", "weight") : null,
          weightUnit: "tonnes",
          freightRupees: freight,
          advanceRupees: advance,
          notes: text("notes"),
          intent: "book",
          overrideReason: text("overrideReason"),
        },
      })) as { tripNumber?: string };
      const extras = [newCustomer && `customer ${customerName} added to Customers`, newDriver && `driver ${driverName} added to Drivers`]
        .filter(Boolean)
        .join(" and ");
      return `Trip ${result.tripNumber ?? ""} booked${extras ? `; ${extras}` : ""}.`.replace("Trip  booked", "Trip booked");
    }
    case "expense": {
      await saveExpense({
        data: {
          truckId: text("truckId") || null,
          tripId: text("tripId") || null,
          category: text("category"),
          expenseDate: text("date"),
          amountRupees: amount("amount", "amount"),
          vendorName: text("vendor"),
          description: text("description"),
        },
      });
      return "Expense recorded.";
    }
    case "fuel": {
      const result = (await saveFuel({
        data: {
          truckId: text("truckId"),
          tripId: text("tripId") || null,
          loggedAt: text("date"),
          odometerKm: text("odometer") ? Math.round(amount("odometer", "odometer")) : null,
          quantityLitres: text("litres") ? amount("litres", "litres") : null,
          amountRupees: amount("amount", "amount"),
          vendorName: text("vendor"),
          notes: "",
        },
      })) as { warning?: string };
      return result.warning || "Fuel entry recorded.";
    }
    case "invoice": {
      const issue = text("date");
      const result = (await createInvoice({
        data: {
          customerId: text("customerId"),
          tripId: text("tripId") || null,
          subtotalRupees: text("amount") ? amount("amount", "amount") : null,
          issueDate: issue,
          dueDate: text("due"),
          notes: "",
        },
      })) as { invoiceNumber?: string };
      return `Invoice ${result.invoiceNumber ?? ""} created.`.replace("Invoice  created", "Invoice created");
    }
    case "payment": {
      const paid = amount("amount", "amount");
      const invoiceId = text("invoiceId");
      const invoice = data.invoices.find((row) => row.id === invoiceId);
      const open = invoice ? Math.max(0, invoice.totalPaise - invoiceAllocated(data, invoice.id)) / 100 : 0;
      await recordPayment({
        data: {
          customerId: text("customerId"),
          tripId: text("tripId") || null,
          amountRupees: paid,
          method: text("method"),
          reference: text("reference"),
          notes: "",
          paymentDate: text("date"),
          allocations: invoice && open > 0 ? [{ invoiceId: invoice.id, amountRupees: Math.min(paid, open) }] : [],
        },
      });
      return `Payment of ${formatInr(Math.round(paid * 100))} recorded.`;
    }
  }
}

const activeTrucks = (data: Workspace) => data.trucks.filter((row) => !row.archivedAt);

function TruckSelect({ data, required, label = "Truck" }: { data: Workspace; required?: boolean; label?: string }) {
  return (
    <SelectField
      label={label}
      name="truckId"
      required={required}
      options={activeTrucks(data).map((row) => [row.id, `${row.name} · ${row.plate}`])}
    />
  );
}

function TripSelect({ data, customerId, label = "Trip (optional)" }: { data: Workspace; customerId?: string; label?: string }) {
  const trips = data.trips
    .filter((row) => row.status !== "cancelled" && (!customerId || row.customerId === customerId))
    .map((row) => [row.id, `${row.tripNumber} · ${row.origin} → ${row.destination}`]);
  return <SelectField label={label} name="tripId" options={trips} />;
}

function TripFields({ data, needsOverride, onOpen }: { data: Workspace; needsOverride: boolean; onOpen: (kind: ModalKind) => void }) {
  const departureDefault = useMemo(() => isoToIstInput(new Date().toISOString()), []);
  const trucks = activeTrucks(data);
  return (
    <>
      <p className="form-section">Customer and driver — type the names</p>
      <div className="form-row">
        <Field label="Customer name" name="customerName" required list="customer-names" placeholder="Type the customer name" autoFocus maxLength={160} />
        <Field label="Customer phone (optional)" name="customerPhone" type="tel" maxLength={20} placeholder="For a new customer" />
      </div>
      <div className="form-row">
        <Field label="Driver name (optional)" name="driverName" list="driver-names" placeholder="Type the driver name" maxLength={160} />
        <Field label="Driver phone (optional)" name="driverPhone" type="tel" maxLength={20} placeholder="For a new driver" />
      </div>
      <datalist id="customer-names">
        {data.customers
          .filter((row) => !row.archivedAt)
          .map((row) => (
            <option key={row.id} value={row.name} />
          ))}
      </datalist>
      <datalist id="driver-names">
        {data.drivers
          .filter((row) => !row.archivedAt && row.status === "active")
          .map((row) => (
            <option key={row.id} value={row.name} />
          ))}
      </datalist>

      <p className="form-section">Truck and route</p>
      <TruckSelect data={data} required />
      {!trucks.length && (
        <p className="form-warning">
          No truck is registered yet. A truck you add appears in this list straight away.{" "}
          <button type="button" className="text-btn" onClick={() => onOpen("truck")}>
            Add a truck now
          </button>
        </p>
      )}
      <div className="form-row">
        <Field label="Pickup" name="origin" required maxLength={160} />
        <Field label="Destination" name="destination" required maxLength={160} />
      </div>
      <div className="form-row">
        <Field label="Departure (IST)" name="departure" type="datetime-local" required defaultValue={departureDefault} />
        <Field label="Expected arrival (optional)" name="arrival" type="datetime-local" />
      </div>
      <div className="form-row">
        <Field label="Goods" name="goods" maxLength={300} />
        <Field label="Weight (tonnes)" name="weight" type="number" />
      </div>

      <p className="form-section">Money</p>
      <div className="form-row">
        <Field label="Freight (₹)" name="freight" type="number" required />
        <Field label="Advance received (₹)" name="advance" type="number" hint="Optional. Recorded as a payment against this trip." />
      </div>
      {needsOverride && (
        <Field
          label="Owner override reason"
          name="overrideReason"
          hint="This truck is not free for these dates. The owner can still book it by giving a reason (at least 8 characters)."
          maxLength={300}
        />
      )}
    </>
  );
}

function InvoiceFields({ data }: { data: Workspace }) {
  const [customerId, setCustomerId] = useState("");
  const today = useMemo(() => todayIst(), []);
  return (
    <>
      <SelectField
        label="Customer"
        name="customerId"
        required
        value={customerId}
        onChange={setCustomerId}
        options={data.customers.filter((row) => !row.archivedAt).map((row) => [row.id, row.name])}
      />
      <TripSelect data={data} customerId={customerId || "none"} label="Trip (optional — only this customer's trips)" />
      <div className="form-row">
        <Field label="Amount (₹)" name="amount" type="number" hint="Leave blank to bill the trip's freight." />
        <Field label="Issue date" name="date" type="date" required defaultValue={today} />
      </div>
      <Field label="Due date" name="due" type="date" required defaultValue={addDays(today, 15)} />
    </>
  );
}

function PaymentFields({ data }: { data: Workspace }) {
  const [customerId, setCustomerId] = useState("");
  const today = useMemo(() => todayIst(), []);
  const openInvoices = data.invoices
    .filter((row) => row.customerId === customerId && row.status !== "void" && row.totalPaise - invoiceAllocated(data, row.id) > 0)
    .map((row) => [row.id, `${row.invoiceNumber} · due ${formatInr(row.totalPaise - invoiceAllocated(data, row.id))}`]);
  return (
    <>
      <SelectField
        label="Customer"
        name="customerId"
        required
        value={customerId}
        onChange={setCustomerId}
        options={data.customers.filter((row) => !row.archivedAt).map((row) => [row.id, row.name])}
      />
      <div className="form-row">
        <TripSelect data={data} customerId={customerId || "none"} label="Trip (optional)" />
        <SelectField label="Apply to invoice (optional)" name="invoiceId" options={openInvoices} />
      </div>
      <div className="form-row">
        <Field label="Amount (₹)" name="amount" type="number" required />
        <Field label="Payment date" name="date" type="date" required defaultValue={today} />
      </div>
      <SelectField
        label="Method"
        name="method"
        required
        options={[
          ["cash", "Cash"],
          ["upi", "UPI"],
          ["bank", "Bank transfer"],
          ["cheque", "Cheque"],
          ["other", "Other"],
        ]}
      />
      <Field label="Reference" name="reference" maxLength={80} />
    </>
  );
}

export function ModalFields({
  kind,
  data,
  needsOverride,
  onOpen,
  initial,
}: {
  kind: ModalKind;
  data: Workspace;
  needsOverride: boolean;
  onOpen: (kind: ModalKind) => void;
  initial?: Record<string, string | number | null | undefined>;
}) {
  const now = useMemo(() => isoToIstInput(new Date().toISOString()), []);
  const today = now.slice(0, 10);
  if (kind === "truck") {
    return (
      <>
        <Field label="Truck name" name="name" required autoFocus maxLength={120} placeholder="e.g. Tata 407" defaultValue={initial?.name as string} />
        <Field label="Registration number" name="plate" required maxLength={32} placeholder="e.g. MH12 AB 1234" defaultValue={initial?.plate as string} />
        <Field label="Capacity (tonnes)" name="capacity" type="number" defaultValue={initial?.capacityValue as string} />
        <Field label="Notes" name="notes" defaultValue={initial?.notes as string} />
      </>
    );
  }
  if (kind === "customer") {
    return (
      <>
        <Field label="Full name" name="name" required autoFocus maxLength={160} />
        <Field label="Phone number" name="phone" type="tel" maxLength={20} />
        <Field label="Billing address" name="address" maxLength={300} />
        <Field label="GSTIN (optional)" name="gstin" maxLength={20} />
      </>
    );
  }
  if (kind === "driver") {
    return (
      <>
        <Field label="Full name" name="name" required autoFocus maxLength={160} defaultValue={initial?.name as string} />
        <Field label="Phone number" name="phone" type="tel" maxLength={20} defaultValue={initial?.phone as string} />
        <Field label="Driving licence number" name="license" maxLength={40} defaultValue={initial?.licenseNo as string} />
        <Field label="Licence expiry" name="expiry" type="date" defaultValue={initial?.licenseExpiry as string} />
      </>
    );
  }
  if (kind === "trip") return <TripFields data={data} needsOverride={needsOverride} onOpen={onOpen} />;
  if (kind === "expense") {
    return (
      <>
        <TruckSelect data={data} label="Truck (optional)" />
        <TripSelect data={data} />
        <div className="form-row">
          <Field label="Date" name="date" type="date" required defaultValue={today} />
          <Field label="Amount (₹)" name="amount" type="number" required />
        </div>
        <SelectField
          label="Category"
          name="category"
          required
          options={[
            ["toll", "Toll"],
            ["repair", "Repair"],
            ["tyres", "Tyres"],
            ["parts", "Parts"],
            ["loading", "Loading"],
            ["driver_allowance", "Driver allowance"],
            ["other", "Other"],
          ]}
        />
        <Field label="Vendor" name="vendor" maxLength={120} />
        <Field label="Description / notes" name="description" />
      </>
    );
  }
  if (kind === "fuel") {
    return (
      <>
        <TruckSelect data={data} required />
        <TripSelect data={data} />
        <div className="form-row">
          <Field label="Date and time (IST)" name="date" type="datetime-local" required defaultValue={now} />
          <Field label="Amount (₹)" name="amount" type="number" required />
        </div>
        <div className="form-row">
          <Field label="Quantity (litres)" name="litres" type="number" />
          <Field label="Odometer (km)" name="odometer" type="number" />
        </div>
        <Field label="Vendor" name="vendor" maxLength={120} />
      </>
    );
  }
  if (kind === "invoice") return <InvoiceFields data={data} />;
  return <PaymentFields data={data} />;
}
