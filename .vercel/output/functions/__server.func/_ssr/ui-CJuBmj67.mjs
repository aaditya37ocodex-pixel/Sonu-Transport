import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { C as truckWrite, S as tripWrite, _ as recoveryRotate, a as customerWrite, b as staffWrite, c as expenseWrite, d as invoiceWrite, f as maintenanceWrite, g as recoverWrite, h as paymentWrite, i as companyWrite, l as fuelWrite, m as passwordResetWrite, n as archiveWrite, o as documentWrite, p as parseInput, r as authMiddleware, s as driverWrite, t as adjustmentWrite, u as idWrite, v as restoreWrite, w as tyreWrite, x as statusWrite, y as staffActiveWrite } from "./schemas-DHrFRtJ9.mjs";
import { t as authClient } from "./client-BhcLuWvF.mjs";
import { l as Plus, p as FileText } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-CJuBmj67.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return useSessionUserState();
}
function useSessionUserState() {
	const { data, isPending } = authClient.useSession();
	const id = data?.user.id;
	const displayName = data?.user.name ?? null;
	const primaryEmail = data?.user.email ?? null;
	const profileImageUrl = data?.user.image ?? null;
	const user = (0, import_react.useMemo)(() => id ? {
		id,
		displayName,
		primaryEmail,
		profileImageUrl,
		isDevFallback: false
	} : null, [
		id,
		displayName,
		primaryEmail,
		profileImageUrl
	]);
	return (0, import_react.useMemo)(() => ({
		user,
		isPending
	}), [user, isPending]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ensureOffice = createServerFn({ method: "POST" }).handler(createSsrRpc("f1574dbb693028518412eadc7b3bed42e2166c73744cb70f4f7c68c257500321"));
var recoverPassword = createServerFn({ method: "POST" }).validator((input) => parseInput(recoverWrite, input)).handler(createSsrRpc("94b9a476e2ed1baf3dab5e4a5eea9d3c9f4c06d7a4dc8cc5bf8bc1d86c1451a0"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f0d31052003c27a1f76c29c3903edaee9ef6a89e0ea9d3d4083231c5b3802e70"));
var fetchWorkspace = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6784131d261e1d9d8af659335cedc0e97b7cbd04b7281f58106c371b94439a58"));
var fetchDatabase = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("2fe1f3d43395f42865e9673914dc6cb467d8c6414972c2d0982c331f520581fc"));
var saveTruck = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(truckWrite, input)).handler(createSsrRpc("93bfa681222325be5e80f2085b40caa14db4dd9164de65a166e07df39f52a091"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(archiveWrite, input)).handler(createSsrRpc("d8eeca43d45db5215df147a3ec2dc9f0216e740cf72162ae7b3c3c0a85c4e1b3"));
var saveCustomer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(customerWrite, input)).handler(createSsrRpc("5a573bb15081b74d18697e82c776de93408723e6dc8a686f47d6d70e4fa3a76f"));
var saveDriver = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(driverWrite, input)).handler(createSsrRpc("1f9768d7b639d770fc6727592259ebb21450178ebcc8c0affd37f0ed65b0369a"));
var saveTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(tripWrite, input)).handler(createSsrRpc("b1323cd8e0c3c608234d48a02dc97ae68258c3adc417565f79d920f96152e92c"));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(statusWrite, input)).handler(createSsrRpc("322fa3ef5b13758f4584e9a78a2a38d8f12aac3a08271eb1207fab852092e990"));
var saveFuel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(fuelWrite, input)).handler(createSsrRpc("77b7b2c929797170b58e1cda1af686dfcdb50d7d2488caf5b1b07b4bbc5d4dd4"));
var saveExpense = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(expenseWrite, input)).handler(createSsrRpc("c7d8300f9a1bdd3fbf1bfa9ffa013f21e1b833d90097424a3f4e0c2133d40572"));
var createInvoice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(invoiceWrite, input)).handler(createSsrRpc("62bafc5280ae3279f1c62b4c61611474f7ab0325f018e3736bc9aac764febb13"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(createSsrRpc("d3212b63f5294ea7fece7072b692185a87ad7026241e2cb8a9a20c73e0d96104"));
var recordPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(paymentWrite, input)).handler(createSsrRpc("0d99d981a54ec71b169b6df5e1080e4df33b69b9cb8df234b4126ed5701484f4"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(adjustmentWrite, input)).handler(createSsrRpc("f893c794638538b54c76954a98d1cef13f9a5d682e0035d6774807e71f89df9f"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(maintenanceWrite, input)).handler(createSsrRpc("ea9ccde79f208db7cde051664f6a1ddfb850f7a88d343ce656b35fc2b707d243"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(createSsrRpc("bcd89c8a9644cd71d566cd02ac9ff4377d46539eb7454ca68bbe438eef69cbfd"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(tyreWrite, input)).handler(createSsrRpc("6babe3cadc6160add2a75ea6074ff4392a4e9d4a343272396ae41d55b55d4487"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(createSsrRpc("ae26ee0eb93c9f588f86b248543e02d4e9c5860344df7bf78d3b81af73bfb341"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(documentWrite, input)).handler(createSsrRpc("aac6d9890f650fc63eb3680797cb68aeea4aa3f6cb6f65cc56c0c20e4e63f582"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(createSsrRpc("a71e6693af847c75c9d9f70aff969817d0f9dc3cce328e021468cd47889c0b04"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(companyWrite, input)).handler(createSsrRpc("20f2081ce020d5433d4bc3ed2f6999f14aceb34181c808aaf536b3c05cf9deba"));
var rotateRecovery = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(recoveryRotate, input)).handler(createSsrRpc("fa2ab9520bc3349259368d78c74b631d570e6fbf1bd9f9517a16b2fbf589714b"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(staffWrite, input)).handler(createSsrRpc("ea446675849d19fd2fa1ce9077b7fd4af9b86650c656c47f90fe0cdb57241e24"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(staffActiveWrite, input)).handler(createSsrRpc("1e2fe7fa3229fd8ad535d9480cc28a5a47efb537b2721be8b095f4cafe808e44"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(passwordResetWrite, input)).handler(createSsrRpc("c97a4c5c001deaaa6fe818a5774d181f6d91dccd2ddb179da46455537f5623cd"));
var exportBackup = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8c4175af7d8977f1886cb676a147bba3231f00115d6b6c6cda687ba5c7ab3877"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(restoreWrite, input)).handler(createSsrRpc("ac04939487a95ba36d0446a48e6937ed0ad2cf28cafd1301088bfc026df9959f"));
function Pill({ tone = "neutral", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `pill pill-${tone}`,
		children
	});
}
function Stat({ label, value, icon: Icon, tone = "teal", hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `stat-card tone-${tone}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stat-icon",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 19 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
				title: value,
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: hint })
		]
	});
}
function QuickAction({ icon: Icon, title, detail, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "quick-action",
		onClick,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "quick-icon",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: detail })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
				size: 16,
				className: "quick-plus"
			})
		]
	});
}
function PanelHead({ title, subtitle, onAdd, addLabel, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel-head",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: subtitle })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel-actions",
			children: [children, onAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "primary-btn small-btn",
				onClick: onAdd,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), addLabel]
			})]
		})]
	});
}
function EmptyHint({ title, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "empty-hint",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 20 }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: detail })
		]
	});
}
function DataTable({ headers, rows, numeric = [], empty }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "table-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: headers.map((header, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
			className: numeric.includes(index) ? "num" : void 0,
			children: header
		}, header + index)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.cells.map((cell, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: numeric.includes(index) ? "num" : void 0,
			children: cell === "" || cell == null ? "—" : cell
		}, index)) }, row.key)) })] }), !rows.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, {
			title: empty.title,
			detail: empty.detail
		})]
	});
}
function Field({ label, name, type = "text", required = false, defaultValue, placeholder, list, hint, autoFocus, maxLength, autoComplete = "off" }) {
	const numeric = type === "number";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "field",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: " *" })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name,
				type,
				min: numeric ? 0 : void 0,
				step: numeric ? "any" : void 0,
				required,
				defaultValue,
				placeholder,
				list,
				autoFocus,
				maxLength,
				autoComplete
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: hint })
		]
	});
}
function SelectField({ label, name, options, required = false, value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: " *" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			name,
			required,
			...value !== void 0 ? {
				value,
				onChange: (event) => onChange?.(event.target.value)
			} : { defaultValue: "" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: placeholder ?? `Select ${label.toLowerCase()}`
			}), options.map(([optionValue, optionLabel]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: optionValue,
				children: optionLabel
			}, optionValue))]
		})]
	});
}
//#endregion
export { setTripStatus as C, saveTruck as S, saveCustomer as _, Pill as a, saveFuel as b, Stat as c, exportBackup as d, fetchDatabase as f, rotateRecovery as g, recoverPassword as h, PanelHead as i, createInvoice as l, recordPayment as m, EmptyHint as n, QuickAction as o, fetchWorkspace as p, Field as r, SelectField as s, DataTable as t, ensureOffice as u, saveDriver as v, useCurrentUserState as w, saveTrip as x, saveExpense as y };
