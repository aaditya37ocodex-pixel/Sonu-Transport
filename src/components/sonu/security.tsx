import { useState, type FormEvent } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { rotateRecovery } from "@/lib/sonu/api";
import { Field } from "./ui";

type Result = { ok: boolean; text: string } | null;

function Status({ result }: { result: Result }) {
  if (!result) return null;
  return result.ok ? (
    <p className="form-ok" role="status">
      <CheckCircle2 size={16} />
      <span>{result.text}</span>
    </p>
  ) : (
    <p className="form-error" role="alert">
      <CircleAlert size={16} />
      <span>{result.text}</span>
    </p>
  );
}

/** Owner-only security tools: change the sign-in password and set a private recovery code. */
export function SecurityPanel({ recoveryIsDefault, onDone }: { recoveryIsDefault: boolean; onDone: () => void }) {
  const [pwBusy, setPwBusy] = useState(false);
  const [pwResult, setPwResult] = useState<Result>(null);
  const [rcBusy, setRcBusy] = useState(false);
  const [rcResult, setRcResult] = useState<Result>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current") ?? "");
    const next = String(data.get("next") ?? "");
    const again = String(data.get("again") ?? "");
    if (next.length < 8) return setPwResult({ ok: false, text: "The new password must be at least 8 characters." });
    if (next.length > 72) return setPwResult({ ok: false, text: "The new password must be 72 characters or fewer." });
    if (next !== again) return setPwResult({ ok: false, text: "The two new passwords do not match." });
    setPwBusy(true);
    setPwResult(null);
    try {
      const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
      if (error) throw new Error(error.message || "The password could not be changed.");
      form.reset();
      setPwResult({ ok: true, text: "Password changed. Use the new password next time you sign in." });
    } catch (e) {
      setPwResult({ ok: false, text: e instanceof Error ? e.message : "The password could not be changed." });
    } finally {
      setPwBusy(false);
    }
  }

  async function saveRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "").trim();
    if (code.length < 8) return setRcResult({ ok: false, text: "The recovery code must be at least 8 characters." });
    setRcBusy(true);
    setRcResult(null);
    try {
      await rotateRecovery({ data: { code } });
      form.reset();
      setRcResult({ ok: true, text: "Recovery code saved. Keep it somewhere safe — it is the only way to reset a forgotten password." });
      onDone();
    } catch (e) {
      setRcResult({ ok: false, text: e instanceof Error ? e.message : "The recovery code could not be saved." });
    } finally {
      setRcBusy(false);
    }
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-head">
        <div>
          <h2>Security</h2>
          <p>Your private sign-in. Only the owner account can open this website.</p>
        </div>
      </div>
      <form className="security-form" onSubmit={changePassword}>
        <h3>Change password</h3>
        <Field label="Current password" name="current" type="password" required autoComplete="current-password" />
        <div className="form-row">
          <Field label="New password" name="next" type="password" required autoComplete="new-password" hint="At least 8 characters." />
          <Field label="Repeat new password" name="again" type="password" required autoComplete="new-password" />
        </div>
        <Status result={pwResult} />
        <div>
          <button type="submit" className="primary-btn" disabled={pwBusy}>
            {pwBusy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
      <form className="security-form" onSubmit={saveRecovery}>
        <h3>Recovery code</h3>
        {recoveryIsDefault && (
          <p className="form-warning">
            Password recovery is switched off until you set your own recovery code. Set one now so a forgotten password can be reset from the sign-in page.
          </p>
        )}
        <Field label={recoveryIsDefault ? "New recovery code" : "Replace recovery code"} name="code" type="password" required autoComplete="off" hint="At least 8 characters. It is never shown again." />
        <Status result={rcResult} />
        <div>
          <button type="submit" className="secondary-btn" disabled={rcBusy}>
            {rcBusy ? "Saving…" : "Save recovery code"}
          </button>
        </div>
      </form>
    </section>
  );
}
