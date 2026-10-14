import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as authClient } from "./client-BhcLuWvF.mjs";
import { _ as CircleAlert, g as CircleCheck, i as Truck } from "../_libs/lucide-react.mjs";
import { h as recoverPassword, r as Field, u as ensureOffice, w as useCurrentUserState } from "./ui-CJuBmj67.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CWWEngij.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PREVIEW_TOKEN_KEY = "grok-auth.bearer-token";
/** The embedded live preview cannot keep cookies, so it keeps the session token instead. */
function rememberPreviewToken(token) {
	if (!token || typeof window === "undefined" || !window.location.hostname.endsWith(".grok-sandbox.com")) return;
	try {
		window.sessionStorage.setItem(PREVIEW_TOKEN_KEY, token);
	} catch {}
}
function Login() {
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	async function signIn(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const email = String(form.get("email") ?? "").trim();
		const password = String(form.get("password") ?? "");
		if (!email || !password) return setError("Enter your email and password.");
		setBusy(true);
		setError("");
		try {
			await ensureOffice();
			const { error: failed } = await authClient.signIn.email({
				email,
				password
			}, { onSuccess: (ctx) => rememberPreviewToken(ctx.response.headers.get("set-auth-token")) });
			if (failed) throw new Error(failed.status === 429 ? "Too many attempts. Wait a minute and try again." : "The email or password is not correct.");
			window.location.assign("/");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Sign-in failed. Check your connection and try again.");
			setBusy(false);
		}
	}
	async function recover(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const password = String(form.get("password") ?? "");
		if (password.length < 8) return setError("The new password must be at least 8 characters.");
		if (password !== String(form.get("again") ?? "")) return setError("The two passwords do not match.");
		setBusy(true);
		setError("");
		try {
			await recoverPassword({ data: {
				email: String(form.get("email") ?? "").trim(),
				recoveryCode: String(form.get("code") ?? "").trim(),
				password
			} });
			setMode("signin");
			setNotice("Password reset. Sign in with your new password.");
		} catch (e) {
			setError(e instanceof Error ? e.message : "The password could not be reset.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "login-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "login-brand",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "brand-mark",
					children: "ST"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Sonu Transport" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Trips, trucks, drivers, customers and accounts — in one private place." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 18 }), " Fleet availability at a glance"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 18 }), " Trips linked to customers and trucks"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 18 }), " Invoices, payments and reports"] })
				] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "login-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "PRIVATE WEBSITE · OWNER ACCESS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: mode === "signin" ? "Sign in" : "Reset your password" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subheading",
					children: mode === "signin" ? "Enter the owner email and password to open Sonu Transport." : "Use the private recovery code you saved in Settings."
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "form-ok",
					role: "status",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: notice })]
				}),
				mode === "signin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "login-form",
					onSubmit: signIn,
					noValidate: true,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							name: "email",
							type: "email",
							required: true,
							autoFocus: true,
							autoComplete: "username",
							placeholder: "owner@example.com"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: " *" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "password-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "password",
									type: showPassword ? "text" : "password",
									required: true,
									autoComplete: "current-password",
									placeholder: "Your password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-btn",
									onClick: () => setShowPassword((v) => !v),
									"aria-pressed": showPassword,
									children: showPassword ? "Hide" : "Show"
								})]
							})]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "form-error",
							role: "alert",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "primary-btn login-submit",
							disabled: busy || isPending,
							children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "button-spinner" }), " Signing in…"] }) : "Sign in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => {
								setMode("recover");
								setError("");
								setNotice("");
							},
							children: "Forgot password?"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "login-form",
					onSubmit: recover,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Owner email",
							name: "email",
							type: "email",
							required: true,
							autoComplete: "username"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Recovery code",
							name: "code",
							type: "password",
							required: true,
							autoComplete: "off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "New password",
							name: "password",
							type: "password",
							required: true,
							autoComplete: "new-password",
							hint: "At least 8 characters."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Repeat new password",
							name: "again",
							type: "password",
							required: true,
							autoComplete: "new-password"
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "form-error",
							role: "alert",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "primary-btn login-submit",
							disabled: busy,
							children: busy ? "Resetting…" : "Reset password"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => {
								setMode("signin");
								setError("");
							},
							children: "Back to sign in"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { Login as component };
