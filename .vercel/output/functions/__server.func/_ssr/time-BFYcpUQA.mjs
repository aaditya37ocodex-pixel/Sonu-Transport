//#region node_modules/.nitro/vite/services/ssr/assets/time-BFYcpUQA.js
var MATRIX = {
	"truck.write": ["owner", "dispatcher"],
	"customer.write": [
		"owner",
		"dispatcher",
		"accounts"
	],
	"driver.write": ["owner", "dispatcher"],
	"trip.write": ["owner", "dispatcher"],
	"trip.override": ["owner"],
	"trip.reopen": ["owner"],
	"fuel.write": [
		"owner",
		"dispatcher",
		"accounts"
	],
	"expense.write": [
		"owner",
		"dispatcher",
		"accounts"
	],
	"invoice.write": ["owner", "accounts"],
	"payment.write": ["owner", "accounts"],
	"maintenance.write": ["owner", "dispatcher"],
	"document.write": [
		"owner",
		"dispatcher",
		"accounts"
	],
	"settings.manage": ["owner"],
	"audit.view": ["owner"],
	"backup.manage": ["owner"]
};
function can(role, action) {
	return MATRIX[action].includes(role);
}
var STATUS_TRANSITIONS = {
	draft: {
		booked: ["owner", "dispatcher"],
		cancelled: ["owner", "dispatcher"]
	},
	booked: {
		in_progress: [
			"owner",
			"dispatcher",
			"driver"
		],
		cancelled: ["owner", "dispatcher"],
		draft: ["owner", "dispatcher"]
	},
	in_progress: {
		delivered: [
			"owner",
			"dispatcher",
			"driver"
		],
		cancelled: ["owner"]
	},
	delivered: {
		closed: [
			"owner",
			"accounts",
			"dispatcher"
		],
		in_progress: ["owner"]
	},
	closed: { delivered: ["owner"] },
	cancelled: { draft: ["owner"] }
};
var TRIP_STATUS_LABEL = {
	draft: "Draft",
	booked: "Booked",
	in_progress: "In transit",
	delivered: "Delivered",
	closed: "Closed",
	cancelled: "Cancelled"
};
var TRUCK_STATUS_LABEL = {
	available: "Available",
	booked: "Booked",
	on_trip: "On trip",
	maintenance: "Maintenance",
	hold: "Held",
	archived: "Archived"
};
var BUSINESS_TZ = "Asia/Kolkata";
function istInputToIso(value) {
	const trimmed = value.trim();
	if (!trimmed) throw new Error("Date and time are required.");
	const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
	const date = /* @__PURE__ */ new Date(`${withSeconds}+05:30`);
	if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date and time.");
	return date.toISOString();
}
function isoToIstInput(iso) {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: BUSINESS_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(date);
	const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
function formatWhen(iso) {
	if (!iso) return "—";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("en-IN", {
		timeZone: BUSINESS_TZ,
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	}).format(date);
}
function formatDay(value) {
	if (!value) return "—";
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	if (!year || !month || !day) return "—";
	const date = new Date(Date.UTC(year, month - 1, day));
	return new Intl.DateTimeFormat("en-IN", {
		timeZone: "UTC",
		day: "numeric",
		month: "short",
		year: "numeric"
	}).format(date);
}
function todayIst() {
	return isoToIstInput((/* @__PURE__ */ new Date()).toISOString()).slice(0, 10);
}
function addDays(day, days) {
	const [year, month, date] = day.slice(0, 10).split("-").map(Number);
	const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
	utc.setUTCDate(utc.getUTCDate() + days);
	return utc.toISOString().slice(0, 10);
}
//#endregion
export { can as a, isoToIstInput as c, addDays as i, istInputToIso as l, TRIP_STATUS_LABEL as n, formatDay as o, TRUCK_STATUS_LABEL as r, formatWhen as s, STATUS_TRANSITIONS as t, todayIst as u };
