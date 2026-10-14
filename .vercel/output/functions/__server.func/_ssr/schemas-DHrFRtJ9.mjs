import { n as createMiddleware } from "./ssr.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, pn as literal, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schemas-DHrFRtJ9.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-BhcLuWvF.mjs").then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-DRf4FvxW.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var required = (label, max = 160) => string().trim().min(1, `${label} is required.`).max(max);
var optionalText = (max = 2e3) => string().trim().max(max).optional().default("");
function parseInput(schema, input) {
	const result = schema.safeParse(input);
	if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Check the form and try again.");
	return result.data;
}
var truckWrite = object({
	id: string().min(1).optional(),
	name: required("Truck name", 120),
	plate: required("Registration number", 32),
	capacityValue: number().finite().nonnegative().nullish(),
	capacityUnit: optionalText(20),
	notes: optionalText(),
	serviceHold: boolean().optional().default(false)
});
var archiveWrite = object({
	id: string().min(1),
	archived: boolean(),
	acknowledge: boolean().optional().default(false)
});
var customerWrite = object({
	id: string().min(1).optional(),
	name: required("Customer name"),
	phone: optionalText(20),
	billingAddress: optionalText(300),
	gstin: optionalText(20),
	notes: optionalText(),
	archived: boolean().optional().default(false)
});
var driverWrite = object({
	id: string().min(1).optional(),
	name: required("Driver name"),
	phone: optionalText(20),
	licenseNo: optionalText(40),
	licenseExpiry: string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(literal("")),
	status: _enum(["active", "inactive"]).optional().default("active"),
	notes: optionalText(),
	archived: boolean().optional().default(false)
});
var tripWrite = object({
	id: string().min(1).optional(),
	customerId: string().nullish(),
	customerName: string().trim().max(160, "Customer name is too long.").optional().default(""),
	customerPhone: string().trim().max(20, "Customer phone is too long.").optional().default(""),
	truckId: string().nullish(),
	driverId: string().nullish(),
	driverName: string().trim().max(160, "Driver name is too long.").optional().default(""),
	driverPhone: string().trim().max(20, "Driver phone is too long.").optional().default(""),
	origin: required("Pickup", 160),
	destination: required("Destination", 160),
	departure: required("Departure", 40),
	arrival: string().trim().max(40).optional().default(""),
	goods: optionalText(300),
	weightValue: number().finite().nonnegative().nullish(),
	weightUnit: optionalText(20),
	freightRupees: number().finite().nonnegative("Freight cannot be negative."),
	advanceRupees: number().finite().nonnegative().optional().default(0),
	notes: optionalText(),
	intent: _enum(["draft", "book"]),
	overrideReason: optionalText(300),
	sourceTripId: string().nullish()
}).refine((value) => Boolean(value.customerId?.trim()) || value.customerName.length > 0, {
	message: "Enter the customer name.",
	path: ["customerName"]
});
var statusWrite = object({
	id: string().min(1),
	status: _enum([
		"draft",
		"booked",
		"in_progress",
		"delivered",
		"closed",
		"cancelled"
	]),
	overrideReason: optionalText(300)
});
var fuelWrite = object({
	truckId: string().min(1, "Choose a truck."),
	tripId: string().nullish(),
	loggedAt: required("Fuel date", 40),
	odometerKm: number().int().nonnegative().nullish(),
	quantityLitres: number().finite().nonnegative().nullish(),
	amountRupees: number().finite().nonnegative(),
	vendorName: optionalText(120),
	notes: optionalText()
});
var expenseWrite = object({
	truckId: string().nullish(),
	tripId: string().nullish(),
	category: _enum([
		"toll",
		"repair",
		"tyres",
		"parts",
		"loading",
		"driver_allowance",
		"other"
	]),
	expenseDate: string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an expense date."),
	amountRupees: number().finite().nonnegative(),
	vendorName: optionalText(120),
	description: optionalText()
});
var invoiceWrite = object({
	customerId: string().min(1, "Choose a customer."),
	tripId: string().nullish(),
	subtotalRupees: number().finite().nonnegative().nullish(),
	issueDate: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	dueDate: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	notes: optionalText()
});
var paymentWrite = object({
	customerId: string().min(1, "Choose a customer."),
	tripId: string().nullish(),
	amountRupees: number().finite().positive("Enter a payment amount."),
	method: _enum([
		"cash",
		"upi",
		"bank",
		"cheque",
		"other"
	]),
	reference: optionalText(80),
	notes: optionalText(),
	paymentDate: string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a payment date."),
	allocations: array(object({
		invoiceId: string().min(1),
		amountRupees: number().finite().positive()
	})).optional().default([])
});
var adjustmentWrite = object({
	customerId: string().min(1),
	invoiceId: string().nullish(),
	amountRupees: number().finite().refine((value) => value !== 0, "Adjustment cannot be zero."),
	reason: required("Reason", 300)
});
var maintenanceWrite = object({
	truckId: string().min(1, "Choose a truck."),
	eventType: required("Work type", 80),
	scheduledOn: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	blocksUntil: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	odometerKm: number().int().nonnegative().nullish(),
	costRupees: number().finite().nonnegative().optional().default(0),
	vendorName: optionalText(120),
	notes: optionalText()
});
var idWrite = object({ id: string().min(1) });
var tyreWrite = object({
	truckId: string().min(1),
	identifier: required("Tyre identifier", 80),
	position: optionalText(40),
	installedOn: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	installedOdometer: number().int().nonnegative().nullish(),
	costRupees: number().finite().nonnegative().nullish(),
	notes: optionalText()
});
var documentWrite = object({
	entityType: _enum([
		"truck",
		"driver",
		"trip",
		"customer",
		"company"
	]),
	entityId: string().min(1),
	documentType: required("Document type", 80),
	documentNumber: optionalText(80),
	issueDate: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(literal("")),
	expiryDate: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(literal("")),
	notes: optionalText(),
	filename: optionalText(180),
	mimeType: optionalText(80),
	contentBase64: string().max(28e4, "Attachment is too large. Keep it under 200 KB.").optional()
});
var companyWrite = object({
	legalName: required("Legal name"),
	displayName: required("Display name"),
	address: optionalText(300),
	phone: optionalText(30),
	email: optionalText(120),
	gstin: optionalText(20),
	taxPercent: number().finite().min(0).max(28)
});
var recoveryRotate = object({ code: string().trim().min(8, "Recovery code must be at least 8 characters.").max(64) });
var staffWrite = object({
	name: required("Name"),
	email: string().trim().email("Enter a valid email.").max(160),
	password: string().min(8, "Password must be at least 8 characters.").max(72),
	role: _enum([
		"owner",
		"dispatcher",
		"accounts",
		"driver"
	]),
	phone: optionalText(20),
	driverId: string().nullish()
});
var staffActiveWrite = object({
	userId: string().min(1),
	active: boolean()
});
var passwordResetWrite = object({
	userId: string().min(1),
	password: string().min(8, "Password must be at least 8 characters.").max(72)
});
var recoverWrite = object({
	email: string().trim().email("Enter the desk email.").max(160),
	recoveryCode: string().trim().min(4).max(64),
	password: string().min(8, "New password must be at least 8 characters.").max(72)
});
object({
	from: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	to: string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
var restoreWrite = object({
	confirm: literal("RESTORE"),
	backup: object({ version: literal(1) }).passthrough()
});
//#endregion
export { truckWrite as C, tripWrite as S, recoveryRotate as _, customerWrite as a, staffWrite as b, expenseWrite as c, invoiceWrite as d, maintenanceWrite as f, recoverWrite as g, paymentWrite as h, companyWrite as i, fuelWrite as l, passwordResetWrite as m, archiveWrite as n, documentWrite as o, parseInput as p, authMiddleware as r, driverWrite as s, adjustmentWrite as t, idWrite as u, restoreWrite as v, tyreWrite as w, statusWrite as x, staffActiveWrite as y };
