import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signOut, t as authClient } from "./client-BhcLuWvF.mjs";
import { c as isoToIstInput, i as addDays, n as TRIP_STATUS_LABEL, o as formatDay, r as TRUCK_STATUS_LABEL, s as formatWhen, t as STATUS_TRANSITIONS, u as todayIst } from "./time-BFYcpUQA.mjs";
import { _ as CircleAlert, b as Activity, c as RefreshCw, d as LayoutDashboard, f as Gauge, g as CircleCheck, h as ClipboardList, i as Truck, l as Plus, m as Database, n as Wallet, o as Settings, p as FileText, r as Users, s as Search, t as X, u as Menu, v as ArrowUpRight, y as ArrowDownLeft } from "../_libs/lucide-react.mjs";
import { C as setTripStatus, S as saveTruck, _ as saveCustomer, a as Pill, b as saveFuel, c as Stat, d as exportBackup, f as fetchDatabase, g as rotateRecovery, i as PanelHead, l as createInvoice, m as recordPayment, n as EmptyHint, o as QuickAction, p as fetchWorkspace, r as Field, s as SelectField, t as DataTable, u as ensureOffice, v as saveDriver, w as useCurrentUserState, x as saveTrip, y as saveExpense } from "./ui-CJuBmj67.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D1W31O5c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
function Status({ result }) {
	if (!result) return null;
	return result.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "form-ok",
		role: "status",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: result.text })]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "form-error",
		role: "alert",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: result.text })]
	});
}
/** Owner-only security tools: change the sign-in password and set a private recovery code. */
function SecurityPanel({ recoveryIsDefault, onDone }) {
	const [pwBusy, setPwBusy] = (0, import_react.useState)(false);
	const [pwResult, setPwResult] = (0, import_react.useState)(null);
	const [rcBusy, setRcBusy] = (0, import_react.useState)(false);
	const [rcResult, setRcResult] = (0, import_react.useState)(null);
	async function changePassword(event) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const current = String(data.get("current") ?? "");
		const next = String(data.get("next") ?? "");
		const again = String(data.get("again") ?? "");
		if (next.length < 8) return setPwResult({
			ok: false,
			text: "The new password must be at least 8 characters."
		});
		if (next.length > 72) return setPwResult({
			ok: false,
			text: "The new password must be 72 characters or fewer."
		});
		if (next !== again) return setPwResult({
			ok: false,
			text: "The two new passwords do not match."
		});
		setPwBusy(true);
		setPwResult(null);
		try {
			const { error } = await authClient.changePassword({
				currentPassword: current,
				newPassword: next,
				revokeOtherSessions: true
			});
			if (error) throw new Error(error.message || "The password could not be changed.");
			form.reset();
			setPwResult({
				ok: true,
				text: "Password changed. Use the new password next time you sign in."
			});
		} catch (e) {
			setPwResult({
				ok: false,
				text: e instanceof Error ? e.message : "The password could not be changed."
			});
		} finally {
			setPwBusy(false);
		}
	}
	async function saveRecovery(event) {
		event.preventDefault();
		const form = event.currentTarget;
		const code = String(new FormData(form).get("code") ?? "").trim();
		if (code.length < 8) return setRcResult({
			ok: false,
			text: "The recovery code must be at least 8 characters."
		});
		setRcBusy(true);
		setRcResult(null);
		try {
			await rotateRecovery({ data: { code } });
			form.reset();
			setRcResult({
				ok: true,
				text: "Recovery code saved. Keep it somewhere safe — it is the only way to reset a forgotten password."
			});
			onDone();
		} catch (e) {
			setRcResult({
				ok: false,
				text: e instanceof Error ? e.message : "The recovery code could not be saved."
			});
		} finally {
			setRcBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel settings-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Security" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your private sign-in. Only the owner account can open this website." })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "security-form",
				onSubmit: changePassword,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Change password" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Current password",
						name: "current",
						type: "password",
						required: true,
						autoComplete: "current-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "form-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "New password",
							name: "next",
							type: "password",
							required: true,
							autoComplete: "new-password",
							hint: "At least 8 characters."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Repeat new password",
							name: "again",
							type: "password",
							required: true,
							autoComplete: "new-password"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { result: pwResult }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "primary-btn",
						disabled: pwBusy,
						children: pwBusy ? "Saving…" : "Change password"
					}) })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "security-form",
				onSubmit: saveRecovery,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Recovery code" }),
					recoveryIsDefault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "form-warning",
						children: "Password recovery is switched off until you set your own recovery code. Set one now so a forgotten password can be reset from the sign-in page."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: recoveryIsDefault ? "New recovery code" : "Replace recovery code",
						name: "code",
						type: "password",
						required: true,
						autoComplete: "off",
						hint: "At least 8 characters. It is never shown again."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { result: rcResult }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "secondary-btn",
						disabled: rcBusy,
						children: rcBusy ? "Saving…" : "Save recovery code"
					}) })
				]
			})
		]
	});
}
function formatInr(paise) {
	const rupees = paise / 100;
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: paise % 100 === 0 ? 0 : 2
	}).format(rupees);
}
function tripWindow(departureMs, arrivalMs) {
	return {
		start: departureMs,
		end: arrivalMs != null && arrivalMs > departureMs ? arrivalMs : departureMs + 864e5
	};
}
/** Half-open overlap: a trip ending exactly when the next starts is allowed. */
function overlaps(a0, a1, b0, b1) {
	return a0 < b1 && b0 < a1;
}
function customerOutstandingPaise(input) {
	return input.invoices.filter((invoice) => invoice.status !== "void").reduce((sum, invoice) => sum + invoice.totalPaise, 0) + input.adjustmentsPaise - input.incomingPaymentsPaise;
}
/** Null when freight is not recognized (draft or cancelled). Fuel is never included in expenses. */
function tripContributionPaise(freightPaise, status, fuelPaise, expensePaise) {
	if (status === "draft" || status === "cancelled") return null;
	return freightPaise - fuelPaise - expensePaise;
}
function deriveTruckStatus(input) {
	if (input.archived) return "archived";
	const point = (start, end) => overlaps(start, end, input.now, input.now + 1);
	const live = input.trips.filter((trip) => (trip.status === "booked" || trip.status === "in_progress") && point(trip.start, trip.end));
	if (live.some((trip) => trip.status === "in_progress")) return "on_trip";
	if (input.maintenance.some((block) => point(block.start, block.end))) return "maintenance";
	if (live.some((trip) => trip.status === "booked")) return "booked";
	if (input.hold) return "hold";
	return "available";
}
function csvEscape(value) {
	return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
function toCsv(rows) {
	return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}
function nameById(rows, id) {
	if (!id) return "—";
	return rows.find((row) => row.id === id)?.name ?? "—";
}
function plateById(trucks, id) {
	if (!id) return "—";
	return trucks.find((truck) => truck.id === id)?.plate ?? "—";
}
function istDay(iso) {
	if (!iso) return "";
	return isoToIstInput(iso).slice(0, 10);
}
function maintenanceWindow(scheduledOn, blocksUntil) {
	return {
		start: (/* @__PURE__ */ new Date(`${scheduledOn}T00:00:00+05:30`)).getTime(),
		end: (/* @__PURE__ */ new Date(`${blocksUntil}T00:00:00+05:30`)).getTime()
	};
}
function truckLive(data, truck, now = Date.now()) {
	return deriveTruckStatus({
		archived: Boolean(truck.archivedAt),
		hold: truck.serviceHold,
		now,
		trips: data.trips.filter((trip) => trip.truckId === truck.id).map((trip) => {
			const window = tripWindow(new Date(trip.departure).getTime(), trip.arrival ? new Date(trip.arrival).getTime() : null);
			return {
				status: trip.status,
				start: window.start,
				end: window.end
			};
		}),
		maintenance: data.maintenance.filter((event) => event.truckId === truck.id && !event.completedOn).map((event) => maintenanceWindow(event.scheduledOn, event.blocksUntil))
	});
}
function tripPaid(data, tripId) {
	return data.payments.filter((payment) => payment.tripId === tripId && payment.direction === "in").reduce((sum, payment) => sum + payment.amountPaise, 0);
}
function tripFuelPaise(data, tripId) {
	return data.fuel.filter((row) => row.tripId === tripId).reduce((sum, row) => sum + row.totalPaise, 0);
}
function tripExpensePaise(data, tripId) {
	return data.expenses.filter((row) => row.tripId === tripId).reduce((sum, row) => sum + row.amountPaise, 0);
}
function tripBalance(data, trip) {
	return trip.freightPaise - tripPaid(data, trip.id);
}
function customerBalance(data, customerId) {
	return customerOutstandingPaise({
		invoices: data.invoices.filter((invoice) => invoice.customerId === customerId),
		adjustmentsPaise: data.adjustments.filter((row) => row.customerId === customerId).reduce((sum, row) => sum + row.amountPaise, 0),
		incomingPaymentsPaise: data.payments.filter((payment) => payment.customerId === customerId && payment.direction === "in").reduce((sum, payment) => sum + payment.amountPaise, 0)
	});
}
function invoiceAllocated(data, invoiceId) {
	return data.allocations.filter((row) => row.invoiceId === invoiceId).reduce((sum, row) => sum + row.amountPaise, 0);
}
function buildReport(data, from, to) {
	const trips = data.trips.filter((trip) => {
		const day = istDay(trip.departure);
		return day >= from && day <= to && trip.status !== "draft" && trip.status !== "cancelled";
	}).map((trip) => {
		const fuelPaise = tripFuelPaise(data, trip.id);
		const expensePaise = tripExpensePaise(data, trip.id);
		return {
			trip,
			fuelPaise,
			expensePaise,
			contributionPaise: tripContributionPaise(trip.freightPaise, trip.status, fuelPaise, expensePaise) ?? 0
		};
	});
	return {
		trips,
		trucks: data.trucks.map((truck) => {
			const own = trips.filter((row) => row.trip.truckId === truck.id);
			const direct = data.expenses.filter((row) => row.truckId === truck.id && !row.tripId && row.expenseDate >= from && row.expenseDate <= to).reduce((sum, row) => sum + row.amountPaise, 0);
			const workshop = data.maintenance.filter((row) => row.truckId === truck.id && row.scheduledOn >= from && row.scheduledOn <= to).reduce((sum, row) => sum + row.costPaise, 0);
			const contribution = own.reduce((sum, row) => sum + row.contributionPaise, 0);
			return {
				truck,
				contribution,
				direct,
				workshop,
				result: contribution - direct - workshop,
				trips: own.length
			};
		}),
		freight: trips.reduce((sum, row) => sum + row.trip.freightPaise, 0),
		costs: trips.reduce((sum, row) => sum + row.fuelPaise + row.expensePaise, 0),
		collections: data.payments.filter((row) => row.direction === "in" && row.paymentDate >= from && row.paymentDate <= to).reduce((sum, row) => sum + row.amountPaise, 0)
	};
}
function tripsCsv(data) {
	return toCsv([[
		"Trip",
		"Customer",
		"Phone",
		"Truck",
		"Driver",
		"From",
		"To",
		"Departure",
		"Arrival",
		"Goods",
		"Freight paise",
		"Paid paise",
		"Balance paise",
		"Status"
	], ...data.trips.map((trip) => [
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
		trip.status
	])]);
}
function trucksCsv(data) {
	return toCsv([[
		"Truck",
		"Registration",
		"Capacity",
		"Unit",
		"Status",
		"Hold",
		"Archived"
	], ...data.trucks.map((truck) => [
		truck.name,
		truck.plate,
		truck.capacityValue ?? "",
		truck.capacityUnit,
		truckLive(data, truck),
		truck.serviceHold ? "yes" : "no",
		truck.archivedAt ?? ""
	])]);
}
function expensesCsv(data) {
	const fuel = data.fuel.map((row) => [
		"fuel",
		row.loggedAt,
		row.totalPaise,
		plateById(data.trucks, row.truckId),
		row.tripId ?? "",
		row.notes
	]);
	const expenses = data.expenses.map((row) => [
		row.category,
		row.expenseDate,
		row.amountPaise,
		plateById(data.trucks, row.truckId),
		row.tripId ?? "",
		row.description
	]);
	return toCsv([
		[
			"Category",
			"When",
			"Amount paise",
			"Truck",
			"Trip id",
			"Note"
		],
		...fuel,
		...expenses
	]);
}
function downloadText(filename, contents, type = "text/csv;charset=utf-8") {
	const blob = new Blob([type.includes("csv") ? `\ufeff${contents}` : contents], { type });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function printTripSheet(data, tripId) {
	const trip = data.trips.find((row) => row.id === tripId);
	if (!trip) return;
	const fuel = data.fuel.filter((row) => row.tripId === trip.id);
	const expenses = data.expenses.filter((row) => row.tripId === trip.id);
	const popup = window.open("", "_blank", "width=900,height=760");
	if (!popup) {
		window.alert("Allow pop-ups to print the trip sheet.");
		return;
	}
	const rows = [...fuel.map((row) => `<tr><td>Fuel</td><td>${escapeHtml(row.vendorName || row.notes || "—")}</td><td>${formatInr(row.totalPaise)}</td></tr>`), ...expenses.map((row) => `<tr><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.description || row.vendorName || "—")}</td><td>${formatInr(row.amountPaise)}</td></tr>`)];
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
var MODAL_TITLES = {
	truck: "Register a truck",
	customer: "Add a customer",
	driver: "Add a driver",
	trip: "Book a trip",
	expense: "Record expense",
	fuel: "Record fuel",
	invoice: "Create invoice",
	payment: "Record payment"
};
var norm = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
function reading(form) {
	const text = (key) => String(form.get(key) ?? "").trim();
	const amount = (key, label) => {
		const raw = text(key);
		if (!raw) return 0;
		const parsed = Number(raw);
		if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Enter a valid number for ${label}.`);
		return parsed;
	};
	return {
		text,
		amount
	};
}
/** Sends one form to the server. Resolves to the confirmation message; throws a readable error. */
async function submitModal(kind, form, data) {
	const { text, amount } = reading(form);
	switch (kind) {
		case "truck":
			await saveTruck({ data: {
				name: text("name"),
				plate: text("plate"),
				capacityValue: text("capacity") ? amount("capacity", "capacity") : null,
				capacityUnit: "tonnes",
				notes: text("notes"),
				serviceHold: false
			} });
			return `Truck ${text("plate").toUpperCase()} added. It now appears when you book a trip.`;
		case "customer":
			await saveCustomer({ data: {
				name: text("name"),
				phone: text("phone"),
				billingAddress: text("address"),
				gstin: text("gstin"),
				notes: ""
			} });
			return `Customer ${text("name")} added.`;
		case "driver":
			await saveDriver({ data: {
				name: text("name"),
				phone: text("phone"),
				licenseNo: text("license"),
				licenseExpiry: text("expiry") || null,
				status: "active",
				notes: ""
			} });
			return `Driver ${text("name")} added.`;
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
			const result = await saveTrip({ data: {
				customerName,
				customerPhone: text("customerPhone"),
				truckId: text("truckId") || null,
				driverName,
				driverPhone: text("driverPhone"),
				origin: text("origin"),
				destination: text("destination"),
				departure,
				arrival,
				goods: text("goods"),
				weightValue: text("weight") ? amount("weight", "weight") : null,
				weightUnit: "tonnes",
				freightRupees: freight,
				advanceRupees: advance,
				notes: text("notes"),
				intent: "book",
				overrideReason: text("overrideReason")
			} });
			const extras = [newCustomer && `customer ${customerName} added to Customers`, newDriver && `driver ${driverName} added to Drivers`].filter(Boolean).join(" and ");
			return `Trip ${result.tripNumber ?? ""} booked${extras ? `; ${extras}` : ""}.`.replace("Trip  booked", "Trip booked");
		}
		case "expense":
			await saveExpense({ data: {
				truckId: text("truckId") || null,
				tripId: text("tripId") || null,
				category: text("category"),
				expenseDate: text("date"),
				amountRupees: amount("amount", "amount"),
				vendorName: text("vendor"),
				description: text("description")
			} });
			return "Expense recorded.";
		case "fuel": return (await saveFuel({ data: {
			truckId: text("truckId"),
			tripId: text("tripId") || null,
			loggedAt: text("date"),
			odometerKm: text("odometer") ? Math.round(amount("odometer", "odometer")) : null,
			quantityLitres: text("litres") ? amount("litres", "litres") : null,
			amountRupees: amount("amount", "amount"),
			vendorName: text("vendor"),
			notes: ""
		} })).warning || "Fuel entry recorded.";
		case "invoice": {
			const issue = text("date");
			return `Invoice ${(await createInvoice({ data: {
				customerId: text("customerId"),
				tripId: text("tripId") || null,
				subtotalRupees: text("amount") ? amount("amount", "amount") : null,
				issueDate: issue,
				dueDate: text("due"),
				notes: ""
			} })).invoiceNumber ?? ""} created.`.replace("Invoice  created", "Invoice created");
		}
		case "payment": {
			const paid = amount("amount", "amount");
			const invoiceId = text("invoiceId");
			const invoice = data.invoices.find((row) => row.id === invoiceId);
			const open = invoice ? Math.max(0, invoice.totalPaise - invoiceAllocated(data, invoice.id)) / 100 : 0;
			await recordPayment({ data: {
				customerId: text("customerId"),
				tripId: text("tripId") || null,
				amountRupees: paid,
				method: text("method"),
				reference: text("reference"),
				notes: "",
				paymentDate: text("date"),
				allocations: invoice && open > 0 ? [{
					invoiceId: invoice.id,
					amountRupees: Math.min(paid, open)
				}] : []
			} });
			return `Payment of ${formatInr(Math.round(paid * 100))} recorded.`;
		}
	}
}
var activeTrucks = (data) => data.trucks.filter((row) => !row.archivedAt);
function TruckSelect({ data, required, label = "Truck" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
		label,
		name: "truckId",
		required,
		options: activeTrucks(data).map((row) => [row.id, `${row.name} · ${row.plate}`])
	});
}
function TripSelect({ data, customerId, label = "Trip (optional)" }) {
	const trips = data.trips.filter((row) => row.status !== "cancelled" && (!customerId || row.customerId === customerId)).map((row) => [row.id, `${row.tripNumber} · ${row.origin} → ${row.destination}`]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
		label,
		name: "tripId",
		options: trips
	});
}
function TripFields({ data, needsOverride, onOpen }) {
	const departureDefault = (0, import_react.useMemo)(() => isoToIstInput((/* @__PURE__ */ new Date()).toISOString()), []);
	const trucks = activeTrucks(data);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "form-section",
			children: "Customer and driver — type the names"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Customer name",
				name: "customerName",
				required: true,
				list: "customer-names",
				placeholder: "Type the customer name",
				autoFocus: true,
				maxLength: 160
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Customer phone (optional)",
				name: "customerPhone",
				type: "tel",
				maxLength: 20,
				placeholder: "For a new customer"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Driver name (optional)",
				name: "driverName",
				list: "driver-names",
				placeholder: "Type the driver name",
				maxLength: 160
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Driver phone (optional)",
				name: "driverPhone",
				type: "tel",
				maxLength: 20,
				placeholder: "For a new driver"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
			id: "customer-names",
			children: data.customers.filter((row) => !row.archivedAt).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: row.name }, row.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
			id: "driver-names",
			children: data.drivers.filter((row) => !row.archivedAt && row.status === "active").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: row.name }, row.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "form-section",
			children: "Truck and route"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TruckSelect, {
			data,
			required: true
		}),
		!trucks.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "form-warning",
			children: [
				"No truck is registered yet. A truck you add appears in this list straight away.",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-btn",
					onClick: () => onOpen("truck"),
					children: "Add a truck now"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Pickup",
				name: "origin",
				required: true,
				maxLength: 160
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Destination",
				name: "destination",
				required: true,
				maxLength: 160
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Departure (IST)",
				name: "departure",
				type: "datetime-local",
				required: true,
				defaultValue: departureDefault
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Expected arrival (optional)",
				name: "arrival",
				type: "datetime-local"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Goods",
				name: "goods",
				maxLength: 300
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Weight (tonnes)",
				name: "weight",
				type: "number"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "form-section",
			children: "Money"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Freight (₹)",
				name: "freight",
				type: "number",
				required: true
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Advance received (₹)",
				name: "advance",
				type: "number",
				hint: "Optional. Recorded as a payment against this trip."
			})]
		}),
		needsOverride && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Owner override reason",
			name: "overrideReason",
			hint: "This truck is not free for these dates. The owner can still book it by giving a reason (at least 8 characters).",
			maxLength: 300
		})
	] });
}
function InvoiceFields({ data }) {
	const [customerId, setCustomerId] = (0, import_react.useState)("");
	const today = (0, import_react.useMemo)(() => todayIst(), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
			label: "Customer",
			name: "customerId",
			required: true,
			value: customerId,
			onChange: setCustomerId,
			options: data.customers.filter((row) => !row.archivedAt).map((row) => [row.id, row.name])
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripSelect, {
			data,
			customerId: customerId || "none",
			label: "Trip (optional — only this customer's trips)"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Amount (₹)",
				name: "amount",
				type: "number",
				hint: "Leave blank to bill the trip's freight."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Issue date",
				name: "date",
				type: "date",
				required: true,
				defaultValue: today
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Due date",
			name: "due",
			type: "date",
			required: true,
			defaultValue: addDays(today, 15)
		})
	] });
}
function PaymentFields({ data }) {
	const [customerId, setCustomerId] = (0, import_react.useState)("");
	const today = (0, import_react.useMemo)(() => todayIst(), []);
	const openInvoices = data.invoices.filter((row) => row.customerId === customerId && row.status !== "void" && row.totalPaise - invoiceAllocated(data, row.id) > 0).map((row) => [row.id, `${row.invoiceNumber} · due ${formatInr(row.totalPaise - invoiceAllocated(data, row.id))}`]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
			label: "Customer",
			name: "customerId",
			required: true,
			value: customerId,
			onChange: setCustomerId,
			options: data.customers.filter((row) => !row.archivedAt).map((row) => [row.id, row.name])
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripSelect, {
				data,
				customerId: customerId || "none",
				label: "Trip (optional)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
				label: "Apply to invoice (optional)",
				name: "invoiceId",
				options: openInvoices
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Amount (₹)",
				name: "amount",
				type: "number",
				required: true
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Payment date",
				name: "date",
				type: "date",
				required: true,
				defaultValue: today
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
			label: "Method",
			name: "method",
			required: true,
			options: [
				["cash", "Cash"],
				["upi", "UPI"],
				["bank", "Bank transfer"],
				["cheque", "Cheque"],
				["other", "Other"]
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Reference",
			name: "reference",
			maxLength: 80
		})
	] });
}
function ModalFields({ kind, data, needsOverride, onOpen }) {
	const now = (0, import_react.useMemo)(() => isoToIstInput((/* @__PURE__ */ new Date()).toISOString()), []);
	const today = now.slice(0, 10);
	if (kind === "truck") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Truck name",
			name: "name",
			required: true,
			autoFocus: true,
			maxLength: 120,
			placeholder: "e.g. Tata 407"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Registration number",
			name: "plate",
			required: true,
			maxLength: 32,
			placeholder: "e.g. MH12 AB 1234"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Capacity (tonnes)",
			name: "capacity",
			type: "number"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Notes",
			name: "notes"
		})
	] });
	if (kind === "customer") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Full name",
			name: "name",
			required: true,
			autoFocus: true,
			maxLength: 160
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Phone number",
			name: "phone",
			type: "tel",
			maxLength: 20
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Billing address",
			name: "address",
			maxLength: 300
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "GSTIN (optional)",
			name: "gstin",
			maxLength: 20
		})
	] });
	if (kind === "driver") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Full name",
			name: "name",
			required: true,
			autoFocus: true,
			maxLength: 160
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Phone number",
			name: "phone",
			type: "tel",
			maxLength: 20
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Driving licence number",
			name: "license",
			maxLength: 40
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Licence expiry",
			name: "expiry",
			type: "date"
		})
	] });
	if (kind === "trip") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripFields, {
		data,
		needsOverride,
		onOpen
	});
	if (kind === "expense") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TruckSelect, {
			data,
			label: "Truck (optional)"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripSelect, { data }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Date",
				name: "date",
				type: "date",
				required: true,
				defaultValue: today
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Amount (₹)",
				name: "amount",
				type: "number",
				required: true
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
			label: "Category",
			name: "category",
			required: true,
			options: [
				["toll", "Toll"],
				["repair", "Repair"],
				["tyres", "Tyres"],
				["parts", "Parts"],
				["loading", "Loading"],
				["driver_allowance", "Driver allowance"],
				["other", "Other"]
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Vendor",
			name: "vendor",
			maxLength: 120
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Description / notes",
			name: "description"
		})
	] });
	if (kind === "fuel") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TruckSelect, {
			data,
			required: true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripSelect, { data }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Date and time (IST)",
				name: "date",
				type: "datetime-local",
				required: true,
				defaultValue: now
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Amount (₹)",
				name: "amount",
				type: "number",
				required: true
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "form-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Quantity (litres)",
				name: "litres",
				type: "number"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Odometer (km)",
				name: "odometer",
				type: "number"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Vendor",
			name: "vendor",
			maxLength: 120
		})
	] });
	if (kind === "invoice") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceFields, { data });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentFields, { data });
}
var sections = [
	{
		name: "Overview",
		icon: LayoutDashboard
	},
	{
		name: "Trips",
		icon: ClipboardList
	},
	{
		name: "Fleet",
		icon: Truck
	},
	{
		name: "Drivers",
		icon: Users
	},
	{
		name: "Customers",
		icon: Users
	},
	{
		name: "Finance",
		icon: Wallet
	},
	{
		name: "Expenses",
		icon: ArrowUpRight
	},
	{
		name: "Reports",
		icon: Gauge
	},
	{
		name: "Database",
		icon: Database
	},
	{
		name: "Settings",
		icon: Settings
	}
];
/** The "New …" button in the page heading, per section. */
var headingAction = {
	Overview: {
		kind: "trip",
		label: "Book trip"
	},
	Trips: {
		kind: "trip",
		label: "Book trip"
	},
	Fleet: {
		kind: "truck",
		label: "Add truck"
	},
	Drivers: {
		kind: "driver",
		label: "Add driver"
	},
	Customers: {
		kind: "customer",
		label: "Add customer"
	},
	Finance: {
		kind: "invoice",
		label: "New invoice"
	},
	Expenses: {
		kind: "expense",
		label: "Add expense"
	}
};
var searchable = [
	"Overview",
	"Trips",
	"Fleet",
	"Drivers",
	"Customers",
	"Finance",
	"Expenses"
];
var TRUCK_TONE = {
	available: "good",
	booked: "info",
	on_trip: "info",
	maintenance: "warn",
	hold: "warn",
	archived: "bad"
};
var TRIP_TONE = {
	draft: "neutral",
	booked: "info",
	in_progress: "info",
	delivered: "good",
	closed: "good",
	cancelled: "bad"
};
var TRIP_NEXT = {
	draft: [{
		to: "booked",
		label: "Confirm"
	}, {
		to: "cancelled",
		label: "Cancel"
	}],
	booked: [{
		to: "in_progress",
		label: "Start trip"
	}, {
		to: "cancelled",
		label: "Cancel"
	}],
	in_progress: [{
		to: "delivered",
		label: "Mark delivered"
	}],
	delivered: [{
		to: "closed",
		label: "Close"
	}]
};
var EXPENSE_LABEL = {
	toll: "Toll",
	repair: "Repair",
	tyres: "Tyres",
	parts: "Parts",
	loading: "Loading",
	driver_allowance: "Driver allowance",
	other: "Other"
};
function messageOf(error, fallback) {
	return error instanceof Error && error.message ? error.message : fallback;
}
function truckTripNote(data, truck) {
	const own = data.trips.filter((trip) => trip.truckId === truck.id);
	const running = own.find((trip) => trip.status === "in_progress");
	if (running) return `${running.tripNumber} · ${running.origin} → ${running.destination}`;
	const next = own.filter((trip) => trip.status === "booked").sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime())[0];
	return next ? `Next ${next.tripNumber} · ${formatWhen(next.departure)}` : "";
}
function Dashboard() {
	const [section, setSection] = (0, import_react.useState)("Overview");
	const [data, setData] = (0, import_react.useState)(null);
	const [database, setDatabase] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [mobileNav, setMobileNav] = (0, import_react.useState)(false);
	const [modal, setModal] = (0, import_react.useState)(null);
	const [returnTo, setReturnTo] = (0, import_react.useState)(null);
	const [modalError, setModalError] = (0, import_react.useState)("");
	const [needsOverride, setNeedsOverride] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [busyTrip, setBusyTrip] = (0, import_react.useState)("");
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const [reportFrom, setReportFrom] = (0, import_react.useState)(() => `${todayIst().slice(0, 8)}01`);
	const [reportTo, setReportTo] = (0, import_react.useState)(() => todayIst());
	const searchRef = (0, import_react.useRef)(null);
	const refresh = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError("");
		try {
			await ensureOffice();
			const [workspace, place] = await Promise.all([fetchWorkspace(), fetchDatabase()]);
			setData(workspace);
			setDatabase(place);
		} catch (e) {
			setError(messageOf(e, "Unable to load company data. Check the database configuration."));
		} finally {
			setLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [refresh]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
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
	(0, import_react.useEffect)(() => {
		if (!notice) return;
		const timer = window.setTimeout(() => setNotice(""), 8e3);
		return () => window.clearTimeout(timer);
	}, [notice]);
	const openModal = (0, import_react.useCallback)((kind, back = null) => {
		setModalError("");
		setNeedsOverride(false);
		setReturnTo(back);
		setNotice("");
		setModal(kind);
	}, []);
	const closeModal = (0, import_react.useCallback)(() => {
		setModal(null);
		setReturnTo(null);
		setModalError("");
	}, []);
	const goTo = (0, import_react.useCallback)((next) => {
		setSection(next);
		setQuery("");
		setMobileNav(false);
		setNotice("");
	}, []);
	const q = query.trim().toLowerCase();
	const hit = (0, import_react.useCallback)((...parts) => !q || parts.join(" ").toLowerCase().includes(q), [q]);
	const stats = (0, import_react.useMemo)(() => {
		if (!data) return {
			trips: 0,
			trucks: 0,
			available: 0,
			customers: 0,
			outstanding: 0
		};
		const trucks = data.trucks.filter((truck) => !truck.archivedAt);
		return {
			trips: data.trips.filter((trip) => !["closed", "cancelled"].includes(trip.status)).length,
			trucks: trucks.length,
			available: trucks.filter((truck) => truckLive(data, truck) === "available").length,
			customers: data.customers.filter((row) => !row.archivedAt).length,
			outstanding: data.customers.reduce((sum, row) => sum + Math.max(0, customerBalance(data, row.id)), 0)
		};
	}, [data]);
	async function submit(event) {
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
	async function moveTrip(trip, to) {
		if (to === "cancelled" && !window.confirm(`Cancel trip ${trip.tripNumber}? The truck will be released.`)) return;
		setBusyTrip(trip.id);
		setError("");
		try {
			await setTripStatus({ data: {
				id: trip.id,
				status: to,
				overrideReason: ""
			} });
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
	if (/^unauthorized$/i.test(error) && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const role = data?.profile.role ?? "owner";
	const firstName = data?.profile.name?.split(" ")[0] || "Admin";
	const action = headingAction[section];
	function renderTripTable(trips, compact = false) {
		if (!data) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
			headers: compact ? [
				"Trip",
				"Customer",
				"Route",
				"Truck",
				"Departure",
				"Freight",
				"Status"
			] : [
				"Trip",
				"Customer",
				"Route",
				"Truck",
				"Driver",
				"Departure",
				"Freight",
				"Balance",
				"Status",
				"Actions"
			],
			numeric: compact ? [5] : [6, 7],
			empty: {
				title: "No trips to show",
				detail: "Book a trip, or change your search."
			},
			rows: trips.map((trip) => {
				const truck = data.trucks.find((row) => row.id === trip.truckId);
				const status = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: TRIP_TONE[trip.status] ?? "neutral",
					children: TRIP_STATUS_LABEL[trip.status] ?? trip.status
				});
				const base = [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: "trip-id",
						children: trip.tripNumber
					}, "id"),
					nameById(data.customers, trip.customerId),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "route-cell",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: trip.origin }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["to ", trip.destination] })]
					}, "route"),
					truck ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: truck.plate }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: truck.name })] }, "truck") : "—"
				];
				if (compact) return {
					key: trip.id,
					cells: [
						...base,
						formatWhen(trip.departure),
						formatInr(trip.freightPaise),
						status
					]
				};
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "row-actions",
							children: [next.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: step.to === "cancelled" ? "danger-btn small-btn" : "secondary-btn small-btn",
								disabled: busyTrip === trip.id,
								onClick: () => void moveTrip(trip, step.to),
								children: step.label
							}, step.to)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "secondary-btn small-btn",
								onClick: () => printTripSheet(data, trip.id),
								children: "Print"
							})]
						}, "actions")
					]
				};
			})
		});
	}
	const trips = data ? [...data.trips].sort((a, b) => new Date(b.departure).getTime() - new Date(a.departure).getTime()).filter((trip) => hit(trip.tripNumber, trip.origin, trip.destination, trip.goods, TRIP_STATUS_LABEL[trip.status], nameById(data.customers, trip.customerId), plateById(data.trucks, trip.truckId), nameById(data.drivers, trip.driverId))) : [];
	const report = data ? buildReport(data, reportFrom, reportTo) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `sidebar ${mobileNav ? "sidebar-open" : ""}`,
				"aria-label": "Main navigation",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brand",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "brand-mark",
								children: "ST"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "SONU" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TRANSPORT" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mobile-close icon-btn",
								onClick: () => setMobileNav(false),
								"aria-label": "Close menu",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "workspace-label",
						children: "WORKSPACE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { children: sections.map(({ name, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `nav-item ${section === name ? "active" : ""}`,
						"aria-current": section === name ? "page" : void 0,
						onClick: () => goTo(name),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: name }),
							name === "Trips" && stats.trips ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: stats.trips }) : null
						]
					}, name)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sidebar-bottom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sync-indicator",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `sync-dot ${data ? "" : "off"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Workspace status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: data ? "Connected to the database" : "Waiting for the database" })] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "profile-mini",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "avatar",
										children: data?.profile.name?.slice(0, 1) || "S"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "profile-text",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: data?.profile.name || "Sonu Admin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: data?.profile.role || "Owner" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "icon-btn",
										onClick: () => void backup(),
										title: "Download backup",
										"aria-label": "Download backup",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, { size: 17 })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "signout-btn",
								disabled: signingOut,
								onClick: () => void leave(),
								children: signingOut ? "Signing out…" : "Sign out"
							})
						]
					})
				]
			}),
			mobileNav && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "nav-scrim",
				"aria-label": "Close menu",
				onClick: () => setMobileNav(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "main-area",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "topbar",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mobile-menu icon-btn",
							onClick: () => setMobileNav(true),
							"aria-label": "Open menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "breadcrumb",
							children: [
								"Workspace ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: section })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "top-actions",
							children: [
								searchable.includes(section) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "search-box",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16 }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: searchRef,
											"aria-label": `Search ${section.toLowerCase()}`,
											placeholder: `Search ${section === "Overview" ? "trips" : section.toLowerCase()}…`,
											value: query,
											onChange: (event) => setQuery(event.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", { children: "Ctrl K" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "icon-btn",
									onClick: () => void refresh(),
									title: "Refresh data",
									"aria-label": "Refresh data",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 17 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "top-avatar",
									children: data?.profile.name?.slice(0, 1) || "S"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "content",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "page-heading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "SONU TRANSPORT MANAGEMENT"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: section === "Overview" ? `Good day, ${firstName}` : section }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "subheading",
									children: section === "Overview" ? "Here is what is happening across your fleet today." : section === "Database" ? "PostgreSQL is where trips, fleet, customers and accounts are stored." : `Manage your ${section.toLowerCase()} and keep operations moving.`
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "heading-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "date-chip",
									children: formatDay(todayIst())
								}), action && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "primary-btn",
									onClick: () => openModal(action.kind),
									disabled: !data,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 17 }),
										" ",
										action.label
									]
								})]
							})]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "alert alert-error",
							role: "alert",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 18 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setError(""),
									"aria-label": "Dismiss",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
								})
							]
						}),
						notice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "alert alert-success",
							role: "status",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 18 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: notice }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setNotice(""),
									"aria-label": "Dismiss",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
								})
							]
						}),
						loading && !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "loading-state",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Connecting to your transport workspace…" })]
						}) : !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "empty-state",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 28 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Workspace could not be loaded" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Check the database setup and sign-in configuration, then try again." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "primary-btn",
									onClick: () => void refresh(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 16 }), " Retry connection"]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							section === "Overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "stats-grid",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Active trips",
											value: String(stats.trips).padStart(2, "0"),
											icon: Activity,
											tone: "teal",
											hint: "Booked, on the road or awaiting close"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Fleet vehicles",
											value: String(stats.trucks).padStart(2, "0"),
											icon: Truck,
											tone: "deep",
											hint: `${stats.available} available right now`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Customers",
											value: String(stats.customers).padStart(2, "0"),
											icon: Users,
											tone: "ink",
											hint: "Active customer accounts"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Outstanding",
											value: formatInr(stats.outstanding),
											icon: Wallet,
											tone: "black",
											hint: "Invoices less payments received"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "dashboard-grid",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "panel",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "panel-head",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Recent trips" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your latest transport movements" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "text-btn",
												onClick: () => goTo("Trips"),
												children: ["View all ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { size: 15 })]
											})]
										}), renderTripTable(trips.slice(0, 6), true)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "panel",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel-head",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Fleet availability" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Current operational status" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "icon-btn",
													onClick: () => goTo("Fleet"),
													"aria-label": "Open fleet",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { size: 16 })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "fleet-list",
												children: [data.trucks.filter((truck) => !truck.archivedAt).slice(0, 6).map((truck) => {
													const live = truckLive(data, truck);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "fleet-row",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "truck-avatar",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 17 })
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "fleet-info",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: truck.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: truck.plate })]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
																tone: TRUCK_TONE[live] ?? "neutral",
																children: TRUCK_STATUS_LABEL[live] ?? live
															})
														]
													}, truck.id);
												}), !data.trucks.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, {
													title: "No trucks yet",
													detail: "Add a truck to start tracking availability."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "secondary-btn full-btn",
												onClick: () => openModal("truck"),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), " Register a vehicle"]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "panel quick-actions",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "panel-head",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Quick actions" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Get the next task done" })] })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "quick-grid",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: ClipboardList,
												title: "Book a trip",
												detail: "Type the customer and driver, pick the truck",
												onClick: () => openModal("trip")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: Truck,
												title: "Add a truck",
												detail: "Expand your fleet register",
												onClick: () => openModal("truck")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: Users,
												title: "Add a driver",
												detail: "Keep licence details on file",
												onClick: () => openModal("driver")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: Users,
												title: "Add a customer",
												detail: "Save billing details",
												onClick: () => openModal("customer")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: FileText,
												title: "Create invoice",
												detail: "Bill a customer for freight",
												onClick: () => openModal("invoice")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
												icon: Wallet,
												title: "Record payment",
												detail: "Update customer collections",
												onClick: () => openModal("payment")
											})
										]
									})]
								})
							] }),
							section === "Trips" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
									title: "Trip register",
									subtitle: `${trips.length} trip records`,
									onAdd: () => openModal("trip"),
									addLabel: "Book trip"
								}), renderTripTable(trips)]
							}),
							section === "Fleet" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
									title: "Fleet register",
									subtitle: `${data.trucks.length} registered vehicles`,
									onAdd: () => openModal("truck"),
									addLabel: "Add truck"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
									headers: [
										"Vehicle",
										"Registration",
										"Capacity",
										"Availability",
										"Current / next trip",
										"Trips",
										"Service hold"
									],
									numeric: [5],
									empty: {
										title: "Your fleet starts here",
										detail: "Add your first truck to see availability and assignments."
									},
									rows: data.trucks.filter((truck) => hit(truck.name, truck.plate, truckLive(data, truck))).map((truck) => {
										const live = truckLive(data, truck);
										return {
											key: truck.id,
											cells: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: truck.name }, "n"),
												truck.plate,
												truck.capacityValue ? `${truck.capacityValue} ${truck.capacityUnit}` : "—",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
													tone: TRUCK_TONE[live] ?? "neutral",
													children: TRUCK_STATUS_LABEL[live] ?? live
												}, "s"),
												truckTripNote(data, truck),
												data.trips.filter((trip) => trip.truckId === truck.id && trip.status !== "cancelled").length,
												truck.serviceHold ? "On hold" : "No"
											]
										};
									})
								})]
							}),
							section === "Drivers" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
									title: "Driver register",
									subtitle: `${data.drivers.length} driver records`,
									onAdd: () => openModal("driver"),
									addLabel: "Add driver"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
									headers: [
										"Driver",
										"Phone",
										"Licence number",
										"Licence expiry",
										"Trips",
										"Status"
									],
									numeric: [4],
									empty: {
										title: "No drivers yet",
										detail: "Add a driver here, or type a driver name when you book a trip — it is added automatically."
									},
									rows: data.drivers.filter((driver) => hit(driver.name, driver.phone, driver.licenseNo, driver.status)).map((driver) => ({
										key: driver.id,
										cells: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: driver.name }, "n"),
											driver.phone,
											driver.licenseNo,
											driver.licenseExpiry ? formatDay(driver.licenseExpiry) : "",
											data.trips.filter((trip) => trip.driverId === driver.id && trip.status !== "cancelled").length,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
												tone: driver.status === "active" ? "good" : "neutral",
												children: driver.status
											}, "s")
										]
									}))
								})]
							}),
							section === "Customers" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
									title: "Customer directory",
									subtitle: `${data.customers.length} customer records`,
									onAdd: () => openModal("customer"),
									addLabel: "Add customer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
									headers: [
										"Customer",
										"Phone",
										"GSTIN",
										"Trips",
										"Outstanding",
										"Billing address"
									],
									numeric: [3, 4],
									empty: {
										title: "No customers yet",
										detail: "Add a customer here, or type a customer name when you book a trip — it is added automatically."
									},
									rows: data.customers.filter((row) => hit(row.name, row.phone, row.gstin, row.billingAddress)).map((row) => ({
										key: row.id,
										cells: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.name }, "n"),
											row.phone,
											row.gstin,
											data.trips.filter((trip) => trip.customerId === row.id && trip.status !== "cancelled").length,
											formatInr(Math.max(0, customerBalance(data, row.id))),
											row.billingAddress
										]
									}))
								})]
							}),
							section === "Finance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "finance-grid",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "panel table-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
										title: "Invoices",
										subtitle: `${data.invoices.length} invoices`,
										onAdd: () => openModal("invoice"),
										addLabel: "New invoice"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Invoice",
											"Customer",
											"Trip",
											"Issued",
											"Due",
											"Total",
											"Paid",
											"Status"
										],
										numeric: [5, 6],
										empty: {
											title: "No invoices yet",
											detail: "Create an invoice for a customer or a trip."
										},
										rows: data.invoices.filter((row) => hit(row.invoiceNumber, nameById(data.customers, row.customerId), row.status)).map((row) => ({
											key: row.id,
											cells: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: row.invoiceNumber }, "n"),
												nameById(data.customers, row.customerId),
												data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
												formatDay(row.issueDate),
												formatDay(row.dueDate),
												formatInr(row.totalPaise),
												formatInr(invoiceAllocated(data, row.id)),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
													tone: row.status === "paid" ? "good" : row.status === "void" ? "bad" : row.status === "partial" ? "warn" : "info",
													children: row.status
												}, "s")
											]
										}))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "panel table-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
										title: "Payments received",
										subtitle: `${data.payments.length} transactions`,
										onAdd: () => openModal("payment"),
										addLabel: "Record payment"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Date",
											"Customer",
											"Trip",
											"Method",
											"Reference",
											"Amount"
										],
										numeric: [5],
										empty: {
											title: "No payments yet",
											detail: "Record a payment when a customer pays."
										},
										rows: data.payments.filter((row) => hit(nameById(data.customers, row.customerId), row.method, row.reference, row.kind)).map((row) => ({
											key: row.id,
											cells: [
												formatDay(row.paymentDate),
												nameById(data.customers, row.customerId),
												data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
												row.kind === "advance" ? "Advance" : row.method,
												row.reference,
												formatInr(row.amountPaise)
											]
										}))
									})]
								})]
							}),
							section === "Expenses" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "finance-grid",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "panel table-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
										title: "Operating expenses",
										subtitle: `${data.expenses.length} expense records`,
										onAdd: () => openModal("expense"),
										addLabel: "Add expense"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Date",
											"Category",
											"Truck",
											"Trip",
											"Description",
											"Amount"
										],
										numeric: [5],
										empty: {
											title: "No expenses yet",
											detail: "Record tolls, repairs and other costs."
										},
										rows: data.expenses.filter((row) => hit(row.category, plateById(data.trucks, row.truckId), row.description, row.vendorName)).map((row) => ({
											key: row.id,
											cells: [
												formatDay(row.expenseDate),
												EXPENSE_LABEL[row.category] ?? row.category,
												plateById(data.trucks, row.truckId),
												data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
												row.description || row.vendorName,
												formatInr(row.amountPaise)
											]
										}))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "panel table-panel",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelHead, {
										title: "Fuel ledger",
										subtitle: `${data.fuel.length} fuel records`,
										onAdd: () => openModal("fuel"),
										addLabel: "Add fuel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Date",
											"Truck",
											"Trip",
											"Litres",
											"Odometer",
											"Vendor",
											"Amount"
										],
										numeric: [
											3,
											4,
											6
										],
										empty: {
											title: "No fuel entries yet",
											detail: "Record each fuel fill to track costs."
										},
										rows: data.fuel.filter((row) => hit(plateById(data.trucks, row.truckId), row.vendorName)).map((row) => ({
											key: row.id,
											cells: [
												formatWhen(row.loggedAt),
												plateById(data.trucks, row.truckId),
												data.trips.find((trip) => trip.id === row.tripId)?.tripNumber ?? "",
												row.quantityMl ? String(row.quantityMl / 1e3) : "",
												row.odometerKm != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													row.odometerKm,
													" km ",
													row.flagged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
														tone: "warn",
														children: "Check"
													})
												] }, "o") : "",
												row.vendorName,
												formatInr(row.totalPaise)
											]
										}))
									})]
								})]
							}),
							section === "Reports" && report && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "panel-head",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Period report" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Trips, costs and collections between two dates" })] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "period-bar",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "From" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "date",
												value: reportFrom,
												max: reportTo,
												onChange: (event) => event.target.value && setReportFrom(event.target.value)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "To" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "date",
												value: reportTo,
												min: reportFrom,
												onChange: (event) => event.target.value && setReportTo(event.target.value)
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "stats-grid",
										style: {
											padding: 18,
											marginBottom: 0
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Trips",
												value: String(report.trips.length),
												icon: ClipboardList,
												tone: "teal",
												hint: "Booked or later, excluding cancelled"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Freight booked",
												value: formatInr(report.freight),
												icon: ArrowUpRight,
												tone: "deep",
												hint: "In the selected period"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Trip costs",
												value: formatInr(report.costs),
												icon: ArrowDownLeft,
												tone: "ink",
												hint: "Fuel and trip expenses"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Collections",
												value: formatInr(report.collections),
												icon: Wallet,
												tone: "black",
												hint: "Payments received"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Truck",
											"Trips",
											"Trip result",
											"Truck expenses",
											"Workshop",
											"Net result"
										],
										numeric: [
											1,
											2,
											3,
											4,
											5
										],
										empty: {
											title: "No trucks yet",
											detail: "Add trucks to see results per vehicle."
										},
										rows: report.trucks.map((row) => ({
											key: row.truck.id,
											cells: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [row.truck.plate, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: row.truck.name })] }, "n"),
												row.trips,
												formatInr(row.contribution),
												formatInr(row.direct),
												formatInr(row.workshop),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: formatInr(row.result) }, "r")
											]
										}))
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel table-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-head",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Exports and backup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Download a copy of your records for safekeeping." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "primary-btn",
											onClick: () => void backup(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, { size: 16 }), " Export JSON backup"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "note",
										children: "Keep backups somewhere secure. A downloaded backup is not a substitute for automated, off-site database backups."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "export-row",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "secondary-btn",
												onClick: () => downloadText("sonu-trips.csv", tripsCsv(data)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 16 }), " Trips CSV"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "secondary-btn",
												onClick: () => downloadText("sonu-trucks.csv", trucksCsv(data)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 16 }), " Trucks CSV"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "secondary-btn",
												onClick: () => downloadText("sonu-expenses.csv", expensesCsv(data)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 16 }), " Expenses CSV"]
											})
										]
									})
								]
							})] }),
							section === "Database" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel settings-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-head",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: database?.title ?? "PostgreSQL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: database?.detail ?? "Loading the database place…" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
											tone: "good",
											children: database ? "Connected" : "Checking"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Engine" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "PostgreSQL. The same tables are used in the preview and after you publish." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
											tone: "info",
											children: database?.place === "Neon" ? "Neon" : "Preview"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Where records live" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: database?.place === "Neon" ? "Neon Postgres, the hosted database for the published site." : "This preview’s own Postgres. Publish to keep the live site on Neon." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
											tone: "neutral",
											children: [database?.tables.reduce((sum, table) => sum + table.rows, 0) ?? 0, " rows"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
										headers: [
											"Table",
											"What it holds",
											"Rows"
										],
										numeric: [2],
										empty: {
											title: "Database not ready",
											detail: "Refresh the workspace and try again."
										},
										rows: (database?.tables ?? []).map((table) => ({
											key: table.key,
											cells: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: table.label }, "n"),
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
													audit: "Who changed what"
												}[table.key] ?? table.label,
												table.rows
											]
										}))
									})
								]
							}),
							section === "Settings" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel settings-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "panel-head",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Company settings" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Business profile and workspace tools" })] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: data.company.displayName }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.company.legalName }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: data.company.address || "Company address not set" })
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
											tone: "info",
											children: data.profile.role
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Database" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: database?.place === "Neon" ? "Records are in Neon Postgres and stay available on every device." : "Records are in this preview’s Postgres. Open Database to see each table." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "secondary-btn",
											onClick: () => goTo("Database"),
											children: "Open database"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Backup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Download a JSON export of company records." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "secondary-btn",
											onClick: () => void backup(),
											children: "Export backup"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "settings-row",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Refresh workspace" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Reload the latest records from the server." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "secondary-btn",
											onClick: () => void refresh(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 15 }), " Refresh"]
										})]
									})
								]
							}),
							section === "Settings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecurityPanel, {
								recoveryIsDefault: data.company.recoveryIsDefault,
								onDone: () => void refresh()
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "page-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"© ",
								(/* @__PURE__ */ new Date()).getFullYear(),
								" Sonu Transport Management"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "sync-dot" }), " Operational workspace"] })]
						})
					]
				})]
			}),
			modal && data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-backdrop",
				role: "presentation",
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) closeModal();
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "modal-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "NEW RECORD"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "modal-title",
							children: MODAL_TITLES[modal]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							onClick: closeModal,
							"aria-label": "Close dialog",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: submit,
						className: "modal-form",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalFields, {
								kind: modal,
								data,
								needsOverride,
								onOpen: (kind) => openModal(kind, "trip")
							}),
							(modal === "invoice" || modal === "payment") && !data.customers.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-warning",
								children: "No customer exists yet. Add one under Customers, or book a trip — a customer typed there is added automatically."
							}),
							(modal === "fuel" || modal === "expense") && !data.trucks.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-warning",
								children: "Register a truck first so this cost can be linked to it."
							}),
							modalError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "form-error",
								role: "alert",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: modalError })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "modal-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "secondary-btn",
									onClick: closeModal,
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "primary-btn",
									disabled: saving,
									children: saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "button-spinner" }), "Saving…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }),
										" ",
										modal === "trip" ? "Book trip" : "Save record"
									] })
								})]
							})
						]
					}, modal)]
				})
			})
		]
	});
}
/** The whole site is private: only a signed-in owner reaches the dashboard. */
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "loading-state",
		style: { minHeight: "100vh" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Checking your sign-in…" })]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {});
}
//#endregion
export { Home as component };
