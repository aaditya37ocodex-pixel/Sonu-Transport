import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, CircleAlert, Truck as TruckIcon } from "lucide-react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureOffice, recoverPassword } from "@/lib/sonu/api";
import { Field } from "@/components/sonu/ui";

export const Route = createFileRoute("/login")({ component: Login });

const PREVIEW_TOKEN_KEY = "grok-auth.bearer-token";

/** The embedded live preview cannot keep cookies, so it keeps the session token instead. */
function rememberPreviewToken(token: string | null) {
  if (!token || typeof window === "undefined" || !window.location.hostname.endsWith(".grok-sandbox.com")) return;
  try {
    window.sessionStorage.setItem(PREVIEW_TOKEN_KEY, token);
  } catch {
    /* storage unavailable — the cookie path still works elsewhere */
  }
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "recover">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!authEnabled || (!isPending && user)) return <Navigate to="/" />;

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError("");
    try {
      // Makes sure the owner account exists on a brand-new database before signing in.
      await ensureOffice();
      const { error: failed } = await authClient.signIn.email(
        { email, password },
        { onSuccess: (ctx) => rememberPreviewToken(ctx.response.headers.get("set-auth-token")) },
      );
      if (failed) {
        throw new Error(failed.status === 429 ? "Too many attempts. Wait a minute and try again." : "The email or password is not correct.");
      }
      window.location.assign("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) return setError("The new password must be at least 8 characters.");
    if (password !== String(form.get("again") ?? "")) return setError("The two passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await recoverPassword({
        data: { email: String(form.get("email") ?? "").trim(), recoveryCode: String(form.get("code") ?? "").trim(), password },
      });
      setMode("signin");
      setNotice("Password reset. Sign in with your new password.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The password could not be reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand" aria-hidden="true">
        <div className="brand-mark">ST</div>
        <h1>Sonu Transport</h1>
        <p>Trips, trucks, drivers, customers and accounts — in one private place.</p>
        <ul>
          <li>
            <TruckIcon size={18} /> Fleet availability at a glance
          </li>
          <li>
            <TruckIcon size={18} /> Trips linked to customers and trucks
          </li>
          <li>
            <TruckIcon size={18} /> Invoices, payments and reports
          </li>
        </ul>
      </section>

      <section className="login-card">
        <p className="eyebrow">PRIVATE WEBSITE · OWNER ACCESS</p>
        <h2>{mode === "signin" ? "Sign in" : "Reset your password"}</h2>
        <p className="subheading">
          {mode === "signin" ? "Enter the owner email and password to open Sonu Transport." : "Use the private recovery code you saved in Settings."}
        </p>

        {notice && (
          <p className="form-ok" role="status">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </p>
        )}

        {mode === "signin" ? (
          <form className="login-form" onSubmit={signIn} noValidate>
            <Field label="Email" name="email" type="email" required autoFocus autoComplete="username" placeholder="owner@example.com" />
            <label className="field">
              <span>
                Password<i> *</i>
              </span>
              <div className="password-wrap">
                <input name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Your password" />
                <button type="button" className="text-btn" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                <CircleAlert size={16} />
                <span>{error}</span>
              </p>
            )}
            <button type="submit" className="primary-btn login-submit" disabled={busy || isPending}>
              {busy ? (
                <>
                  <span className="button-spinner" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
            <button type="button" className="text-btn" onClick={() => { setMode("recover"); setError(""); setNotice(""); }}>
              Forgot password?
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={recover}>
            <Field label="Owner email" name="email" type="email" required autoComplete="username" />
            <Field label="Recovery code" name="code" type="password" required autoComplete="off" />
            <Field label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
            <Field label="Repeat new password" name="again" type="password" required autoComplete="new-password" />
            {error && (
              <p className="form-error" role="alert">
                <CircleAlert size={16} />
                <span>{error}</span>
              </p>
            )}
            <button type="submit" className="primary-btn login-submit" disabled={busy}>
              {busy ? "Resetting…" : "Reset password"}
            </button>
            <button type="button" className="text-btn" onClick={() => { setMode("signin"); setError(""); }}>
              Back to sign in
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
